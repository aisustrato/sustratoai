// Ruta: components/jobs/TranslationJobHandler.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { getArticlesForTranslation, saveBatchTranslations } from '@/lib/actions/preclassification-actions';
// ✅ 1. IMPORTA LAS NUEVAS ACTIONS DE LOGGING
import { startJobLog, updateJobAsCompleted, updateJobAsFailed } from '@/lib/actions/job-history-actions';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { StandardText } from '@/components/ui/StandardText';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardButton } from '@/components/ui/StandardButton';
import { AlertTriangle, RefreshCw, SkipForward } from 'lucide-react';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function createPrompt(title: string, abstract: string): string {
  return `Eres un traductor experto y un sintetizador académico. Tu tarea tiene dos partes:
1. Traduce el título (title) y el resumen (abstract) del siguiente texto científico del inglés al español de forma profesional.
2. Crea un resumen muy conciso del abstract traducido, en español, con un máximo de 250 caracteres, que capture la esencia del texto.

Debes devolver el resultado ÚNICAMENTE como un objeto JSON válido con tres claves: "translatedTitle", "translatedAbstract" y "translatedSummary".

Texto a procesar:
"""
Title: ${title}

Abstract: ${abstract}
"""`;
}

// Tipos para el manejo de errores
interface FailedArticle {
  index: number;
  article: any;
  error: string;
  rawResponse?: string;
  retryCount: number;
}

interface ErrorDialogState {
  isOpen: boolean;
  failedArticle: FailedArticle | null;
  totalArticles: number;
  canRetry: boolean;
}

export function TranslationJobHandler({ job }: { job: Job }) {
  const { updateJobProgress, completeJob, failJob } = useJobManager();
  const [statusMessage, setStatusMessage] = useState('Iniciando...');
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
    isOpen: false,
    failedArticle: null,
    totalArticles: 0,
    canRetry: false
  });
  const jobStartedRef = useRef(false); // Guardia para evitar doble ejecución
  const [articleRetries, setArticleRetries] = useState<Record<number, number>>({});
  const [retryingArticle, setRetryingArticle] = useState<number | null>(null);
  const MAX_RETRIES_PER_ARTICLE = 2;

  const runJob = useCallback(async () => {
    // ✅ 2. INICIA EL LOG Y GUARDA EL ID DEL HISTORIAL
    const jobLogResult = await startJobLog({
      projectId: job.payload.projectId,
      userId: job.payload.userId,
      jobType: 'TRANSLATION',
      description: job.title,
      aiModel: 'gemini-2.5-flash', // Hardcodeado por ahora
    });

    if (!jobLogResult.success) {
      const errorMessage = `No se pudo iniciar el log: ${jobLogResult.error}`;
      setStatusMessage(errorMessage);
      failJob(job.id, errorMessage);
      return;
    }
    const historyJobId = jobLogResult.data.jobId;

    // Variables para acumular tokens
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      setStatusMessage('Obteniendo artículos...');
      const articlesResult = await getArticlesForTranslation(job.payload.batchId);
      if (!articlesResult.success) throw new Error(articlesResult.error);

      const articlesToTranslate = articlesResult.data;
      const totalArticles = articlesToTranslate.length;
      const translatedArticlesPayload = [];

      for (let i = 0; i < totalArticles; i++) {
        const article = articlesToTranslate[i];
        setStatusMessage(`Traduciendo artículo ${i + 1} de ${totalArticles}...`);

        const prompt = createPrompt(article.title || '', article.abstract || '');

        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gemini-2.5-flash', text: prompt, action: 'translate' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Error en API (código: ${response.status})`);

        // ✅ 3. ACUMULA LOS TOKENS DESDE LA NUEVA RESPUESTA DE LA API
        totalInputTokens += data.usage?.promptTokenCount || 0;
        totalOutputTokens += data.usage?.candidatesTokenCount || 0;

        let parsedResult;
        try {
          const cleanedString = data.result.replace(/`{3}json\n?/, '').replace(/\n?`{3}$/, '');
          parsedResult = JSON.parse(cleanedString);
          if (!parsedResult.translatedTitle || !parsedResult.translatedAbstract) {
            throw new Error("El JSON de respuesta no contiene las claves esperadas.");
          }
        } catch (e) {
          console.error("Respuesta cruda de la API que no pudo ser parseada:", data.result);
          
          // Verificar cuántos reintentos ha tenido este artículo
          const currentRetries = articleRetries[i] || 0;
          const canRetry = currentRetries < MAX_RETRIES_PER_ARTICLE;
          
          // Mostrar dialog de error para este artículo específico
          setErrorDialog({
            isOpen: true,
            failedArticle: {
              index: i,
              article,
              error: "La respuesta de la IA no es un JSON válido o tiene un formato inesperado.",
              rawResponse: data.result,
              retryCount: currentRetries
            },
            totalArticles,
            canRetry
          });
          
          // Pausar el procesamiento hasta que el usuario decida
          return;
        }

        translatedArticlesPayload.push({
          articleId: article.id,
          title: parsedResult.translatedTitle,
          abstract: parsedResult.translatedAbstract,
          summary: parsedResult.translatedSummary,
          translated_by: job.payload.userId,
          translator_system: 'gemini-2.5-flash',
        });

        const completedProgress = ((i + 1) / totalArticles) * 100;
        updateJobProgress(job.id, completedProgress);

        if (i < totalArticles - 1) {
          setStatusMessage(`Pausa de 7s para respetar límite de API...`);
          await sleep(7000);
        }
      }

      setStatusMessage('Guardando traducciones...');
      const saveResult = await saveBatchTranslations(job.payload.batchId, translatedArticlesPayload);
      if (!saveResult.success) throw new Error(saveResult.error || "Error desconocido al guardar.");

      // ✅ 4. SI TODO FUE BIEN, ACTUALIZA EL LOG COMO COMPLETADO
      await updateJobAsCompleted({
        jobId: historyJobId,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      });

      setStatusMessage('¡Traducción completada!');
      completeJob(job.id);

    } catch (error: any) {
      console.error(`Fallo el trabajo de traducción: ${error.message}`);
      // ✅ 5. SI ALGO FALLA, ACTUALIZA EL LOG COMO FALLIDO
      await updateJobAsFailed({
        jobId: historyJobId,
        errorMessage: error.message,
      });
      setStatusMessage(`Error: ${error.message}`);
      failJob(job.id, error.message);
    }
  }, [job, completeJob, failJob, updateJobProgress]);

  useEffect(() => {
    // El patrón de guardia con useRef asegura que runJob() se ejecute solo una vez,
    // incluso en React.StrictMode, previniendo la duplicación de trabajos.
    if (job.status === 'queued' && !jobStartedRef.current) {
      jobStartedRef.current = true;
      runJob();
    }
  }, [job.status, runJob]);

  // Función para reintentar un artículo específico
  const retryFailedArticle = useCallback(async () => {
    if (!errorDialog.failedArticle) return;
    
    const articleIndex = errorDialog.failedArticle.index;
    
    // Incrementar contador de reintentos para este artículo
    setArticleRetries(prev => ({
      ...prev,
      [articleIndex]: (prev[articleIndex] || 0) + 1
    }));
    
    setRetryingArticle(articleIndex);
    setErrorDialog({ isOpen: false, failedArticle: null, totalArticles: 0, canRetry: false });
    
    // Reiniciar el job desde el artículo fallido
    runJob();
  }, [errorDialog.failedArticle, runJob]);
  
  // Función para marcar el lote como fallido
  const markBatchAsFailed = useCallback(() => {
    if (!errorDialog.failedArticle) return;
    
    const errorMessage = `Lote fallido: No se pudo procesar el artículo ${errorDialog.failedArticle.index + 1} después de ${MAX_RETRIES_PER_ARTICLE} intentos.`;
    
    setErrorDialog({ isOpen: false, failedArticle: null, totalArticles: 0, canRetry: false });
    setStatusMessage(errorMessage);
    failJob(job.id, errorMessage);
  }, [errorDialog.failedArticle, failJob, job.id]);

  return (
    <>
      <div className="p-2 border-t">
        <StandardText weight="medium">{job.title}</StandardText>
        <StandardText size="sm" className="my-1 truncate">
          {retryingArticle !== null 
            ? `Reintentando artículo ${retryingArticle + 1}... (Intento ${(articleRetries[retryingArticle] || 0) + 1}/${MAX_RETRIES_PER_ARTICLE + 1})` 
            : statusMessage
          }
        </StandardText>
        <StandardProgressBar value={job.progress} colorScheme={job.status === 'error' ? 'danger' : 'primary'} />
        {Object.keys(articleRetries).length > 0 && (
          <StandardText size="xs" colorScheme="warning" className="mt-1">
            Artículos con reintentos: {Object.keys(articleRetries).length}
          </StandardText>
        )}
      </div>

      {/* Dialog de Error para Artículos Fallidos */}
      <StandardDialog open={errorDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setErrorDialog({ isOpen: false, failedArticle: null, totalArticles: 0, canRetry: false });
        }
      }}>
        <StandardDialog.Content colorScheme="danger" size="lg">
          <StandardDialog.Header>
            <StandardDialog.Title className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger-pure" />
              Error en Traducción
            </StandardDialog.Title>
            <StandardDialog.Description>
              Falló el procesamiento del artículo {errorDialog.failedArticle ? errorDialog.failedArticle.index + 1 : 0} de {errorDialog.totalArticles}
              {errorDialog.failedArticle && (
                <span className="block mt-1 text-xs">
                  Intentos realizados: {errorDialog.failedArticle.retryCount}/{MAX_RETRIES_PER_ARTICLE}
                </span>
              )}
            </StandardDialog.Description>
          </StandardDialog.Header>
          
          <StandardDialog.Body>
            <div className="space-y-4">
              <div>
                <StandardText weight="medium" className="mb-2">Artículo:</StandardText>
                <StandardText size="sm" className="text-muted-foreground">
                  {errorDialog.failedArticle?.article.title || 'Sin título'}
                </StandardText>
              </div>
              
              <div>
                <StandardText weight="medium" className="mb-2">Error:</StandardText>
                <StandardText size="sm" colorScheme="danger">
                  {errorDialog.failedArticle?.error}
                </StandardText>
              </div>
              
              {errorDialog.failedArticle?.rawResponse && (
                <div>
                  <StandardText weight="medium" className="mb-2">Respuesta de la API:</StandardText>
                  <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                    <StandardText size="xs" className="font-mono whitespace-pre-wrap">
                      {errorDialog.failedArticle.rawResponse.substring(0, 500)}
                      {errorDialog.failedArticle.rawResponse.length > 500 && '...'}
                    </StandardText>
                  </div>
                </div>
              )}
              
              <div className={`p-3 rounded-md ${
                errorDialog.canRetry ? 'bg-info-subtle' : 'bg-danger-subtle'
              }`}>
                <StandardText size="sm">
                  {errorDialog.canRetry ? (
                    <>
                      <strong>¿Qué deseas hacer?</strong><br/>
                      • <strong>Reintentar:</strong> Volver a procesar este artículo (quedan {MAX_RETRIES_PER_ARTICLE - (errorDialog.failedArticle?.retryCount || 0)} intentos)<br/>
                      • <strong>Marcar como fallido:</strong> Cancelar la traducción del lote completo
                    </>
                  ) : (
                    <>
                      <strong>Se agotaron los reintentos</strong><br/>
                      Este artículo ha fallado {MAX_RETRIES_PER_ARTICLE} veces. El lote completo debe marcarse como fallido.
                    </>
                  )}
                </StandardText>
              </div>
            </div>
          </StandardDialog.Body>
          
          <StandardDialog.Footer>
            <StandardButton
              styleType="outline"
              colorScheme="danger"
              leftIcon={SkipForward}
              onClick={markBatchAsFailed}
            >
              Marcar Lote como Fallido
            </StandardButton>
            {errorDialog.canRetry && (
              <StandardButton
                styleType="solid"
                colorScheme="primary"
                leftIcon={RefreshCw}
                onClick={retryFailedArticle}
              >
                Reintentar ({MAX_RETRIES_PER_ARTICLE - (errorDialog.failedArticle?.retryCount || 0)} restantes)
              </StandardButton>
            )}
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
