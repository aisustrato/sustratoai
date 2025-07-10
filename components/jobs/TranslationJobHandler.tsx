// Ruta: components/jobs/TranslationJobHandler.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { getArticlesForTranslation, saveBatchTranslations } from '@/lib/actions/preclassification-actions';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { StandardText } from '@/components/ui/StandardText';

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

export function TranslationJobHandler({ job }: { job: Job }) {
  const { updateJobProgress, completeJob, failJob } = useJobManager();
  const [statusMessage, setStatusMessage] = useState('Iniciando...');

  const runJob = useCallback(async () => {
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
        if (!response.ok) throw new Error(data.error || `Error en la API de Gemini (código: ${response.status})`);

        let parsedResult;
        try {
          // ✅ LÓGICA DE PARSEO ROBUSTA
          // 1. Limpiar la respuesta para quitar los ```json y ```
          const cleanedString = data.result.replace(/`{3}json\n?/, '').replace(/\n?`{3}$/, '');
          
          // 2. Intentar parsear la cadena limpia
          parsedResult = JSON.parse(cleanedString);

          if (!parsedResult.translatedTitle || !parsedResult.translatedAbstract) {
            throw new Error("El JSON de respuesta no contiene las claves esperadas.");
          }
        } catch (e) {
          console.error("Respuesta cruda de la API que no pudo ser parseada:", data.result);
          throw new Error("La respuesta de la IA no es un JSON válido o tiene un formato inesperado.");
        }

        translatedArticlesPayload.push({
          articleId: article.id,
          title: parsedResult.translatedTitle,
          abstract: parsedResult.translatedAbstract,
          summary: parsedResult.translatedSummary,
          translated_by: job.payload.userId,
          translator_system: 'Gemini 2.5 Flash',
        });

        const progress = ((i + 1) / totalArticles) * 100;
        updateJobProgress(job.id, progress);

        if (i < totalArticles - 1) {
          setStatusMessage(`Pausa de 7s para respetar límite de API...`);
          await sleep(7000);
        }
      }

      setStatusMessage('Guardando traducciones...');
      const saveResult = await saveBatchTranslations(job.payload.batchId, translatedArticlesPayload);
      if (!saveResult.success) throw new Error(saveResult.error || "Error desconocido al guardar.");

      setStatusMessage('¡Traducción completada!');
      completeJob(job.id);

    } catch (error: any) {
      console.error(`Fallo el trabajo de traducción: ${error.message}`);
      failJob(job.id);
    }
  }, [job.id, job.payload.batchId, job.payload.userId, completeJob, failJob, updateJobProgress]);

  useEffect(() => {
    if (job.status === 'queued') {
      runJob();
    }
  }, [job.status, runJob]);

  return (
    <div className="p-2 border-t">
      <StandardText weight="medium">{job.title}</StandardText>
      <StandardText size="sm" className="my-1 truncate">{statusMessage}</StandardText>
      <StandardProgressBar value={job.progress} colorScheme={job.status === 'error' ? 'danger' : 'primary'} />
    </div>
  );
}
