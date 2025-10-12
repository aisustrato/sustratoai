// Ruta: components/jobs/TranslationJobHandler.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { supabase } from '@/app/auth/client';
import { startBatchTranslation } from '@/lib/actions/preclassification-actions';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { StandardText } from '@/components/ui/StandardText';
import { Languages, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 🛡️ PROTECCIÓN GLOBAL: Map para evitar ejecuciones múltiples del mismo lote
const runningBatches = new Map<string, boolean>();

interface TranslationJobHandlerProps {
  job: Job;
}

export function TranslationJobHandler({ job }: TranslationJobHandlerProps) {
  const { updateJobProgress, completeJob, failJob } = useJobManager();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Preparando traducción...');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'running' | 'completed' | 'failed'>('running');
  // 🧹 Cleanup idempotente para desuscribir el canal y evitar fugas
  const cleanupRef = useRef<null | (() => void)>(null);

  // 🎯 FUNCIÓN PRINCIPAL: TranslationJobHandler maneja TODO el flujo
  const runJob = useCallback(async () => {
    const batchId = job.payload.batchId;
    
    // 🛡️ PROTECCIÓN GLOBAL CONTRA EJECUCIÓN MÚLTIPLE POR LOTE
    if (runningBatches.get(batchId)) {
      console.log('⚠️ [TranslationJobHandler] Lote ya está ejecutándose, evitando duplicación:', batchId);
      return;
    }
    
    // Marcar lote como ejecutándose
    runningBatches.set(batchId, true);
    
    try {
      console.log(`🚀 [TranslationJobHandler] Iniciando traducción para lote: ${job.payload.batchId}`);
      setStatusMessage('Validando lote y verificando trabajos duplicados...');
      updateJobProgress(job.id, 5);
      
      // 🛡️ VALIDACIÓN BACKEND: TranslationJobHandler maneja validaciones y errores
      const result = await startBatchTranslation(job.payload.batchId);
      
      if (!result.success) {
        // 🚨 MANEJO DE ERRORES: Mostrar error específico (ej: trabajo duplicado)
        const errorMessage = result.error || 'Error desconocido al iniciar la traducción';
        console.error('❌ [TranslationJobHandler] Error del backend:', errorMessage);
        throw new Error(errorMessage);
      }

      const backendJobId = result.data.jobId;
      setJobId(backendJobId);
      setStatusMessage('Traducción iniciada. Monitoreando progreso...');

      // Crear suscripción en tiempo real a la tabla ai_job_history
      const channel = supabase.channel(`translation-job-${backendJobId}`)
        .on('postgres_changes', 
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'ai_job_history', 
              filter: `id=eq.${backendJobId}` 
            }, 
            (payload) => {
              console.log('🔄 [TranslationJobHandler] Actualización del trabajo:', payload);
              
              const { progress, details, status } = payload.new;
              
              // Actualizar el progreso en el JobManager
              if (typeof progress === 'number') {
                updateJobProgress(job.id, progress);
              }
              
              // 🔧 MANEJO ROBUSTO DE DETAILS: Puede ser string u objeto
              let statusMsg = 'Procesando...';
              if (details) {
                if (typeof details === 'string') {
                  statusMsg = details;
                } else if (typeof details === 'object') {
                  if (details.step) {
                    statusMsg = details.step;
                  } else if (details.error) {
                    statusMsg = `Error: ${details.error}`;
                  } else if (details.processed && details.total) {
                    statusMsg = `Procesados ${details.processed}/${details.total} artículos`;
                  }
                }
              }
              setStatusMessage(statusMsg);
              
              // 🎯 MANEJAR FINALIZACIÓN DEL TRABAJO
              if (status === 'completed') {
                console.log('✅ [TranslationJobHandler] Job completado exitosamente');
                setJobStatus('completed');
                
                updateJobProgress(job.id, 100);
                setStatusMessage('¡Traducción completada!');
                
                setTimeout(() => {
                  console.log('🔄 [TranslationJobHandler] Refrescando página para mostrar traducciones...');
                  runningBatches.delete(batchId);
                  router.refresh();
                  completeJob(job.id);
                  cleanupRef.current?.();
                }, 2000);
                
              } else if (status === 'failed') {
                console.error('❌ [TranslationJobHandler] Job fallido detectado');
                setJobStatus('failed');
                
                let errorMessage = 'Error durante la traducción';
                if (details) {
                  if (typeof details === 'string') {
                    errorMessage = details;
                  } else if (typeof details === 'object' && details.error) {
                    errorMessage = details.error;
                  }
                }
                
                updateJobProgress(job.id, 100);
                setStatusMessage(`Error: ${errorMessage}`);
                
                setTimeout(() => {
                  runningBatches.delete(batchId);
                  failJob(job.id, errorMessage);
                  cleanupRef.current?.();
                }, 3000);
              }
            })
        .subscribe();

      cleanupRef.current = () => {
        try {
          channel.unsubscribe();
        } catch {
          // noop
        } finally {
          cleanupRef.current = null;
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en TranslationJobHandler:', error);
      
      updateJobProgress(job.id, 100);
      setStatusMessage(`Error: ${errorMessage}`);
      
      setTimeout(() => {
        runningBatches.delete(batchId);
        failJob(job.id, errorMessage);
      }, 3000);
    }
  }, [job.id, job.payload.batchId, updateJobProgress, completeJob, failJob, router]);

  // Iniciar el trabajo cuando el componente se monta - SOLO UNA VEZ (con guard)
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    runJob();
    // Cleanup en unmount: desuscribir y liberar el guard del lote
    return () => {
      cleanupRef.current?.();
      runningBatches.delete(job.payload.batchId);
    };
  }, [runJob, job.payload.batchId]);

  // 🎨 RENDERIZAR UI CON FEEDBACK VISUAL ROBUSTO
  const getStatusIcon = () => {
    switch (jobStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Languages className="h-5 w-5 text-primary-pure" />;
    }
  };

  const getBorderColor = () => {
    switch (jobStatus) {
      case 'completed':
        return 'border-green-500';
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-primary-pure';
    }
  };

  const getBackgroundColor = () => {
    switch (jobStatus) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-primary-subtle';
    }
  };

  return (
    <div className={`p-4 border-l-4 ${getBorderColor()} ${getBackgroundColor()} rounded-r-md transition-colors duration-200`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon()}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-2">
            <StandardText 
              size="sm" 
              weight="medium"
              className="truncate"
            >
              {job.title}
            </StandardText>
            {jobStatus === 'running' && (
              <StandardText 
                size="xs" 
                colorScheme="neutral"
              >
                {Math.round(job.progress)}%
              </StandardText>
            )}
          </div>
          
          {/* Solo mostrar barra de progreso si está en ejecución */}
          {jobStatus === 'running' && (
            <StandardProgressBar
              value={job.progress}
              max={100}
              colorScheme="primary"
              size="sm"
              className="mb-2"
            />
          )}
          
          <StandardText 
            size="xs" 
            colorScheme={jobStatus === 'failed' ? 'danger' : 'neutral'}
            className="truncate"
          >
            {statusMessage}
          </StandardText>
          
          {jobId && (
            <StandardText 
              size="xs" 
              colorScheme="neutral"
              className="mt-1 opacity-70"
            >
              ID: {jobId.substring(0, 8)}...
            </StandardText>
          )}
        </div>
      </div>
    </div>
  );
}
