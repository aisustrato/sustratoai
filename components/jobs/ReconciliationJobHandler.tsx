// Ruta: components/jobs/ReconciliationJobHandler.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { supabase } from '@/app/auth/client';
import { startDiscrepancyReconciliation } from '@/lib/actions/preclassification-actions';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { StandardText } from '@/components/ui/StandardText';
import { Brain, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 🛡️ PROTECCIÓN GLOBAL: Map para evitar ejecuciones múltiples del mismo lote
const runningReconciliations = new Map<string, boolean>();

interface ReconciliationJobHandlerProps {
  // Narrowed: este handler sólo recibe jobs de tipo RECONCILE_BATCH.
  job: Extract<Job, { type: "RECONCILE_BATCH" }>;
}

export function ReconciliationJobHandler({ job }: ReconciliationJobHandlerProps) {
  const { updateJobProgress, completeJob, failJob } = useJobManager();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Preparando reconciliación de discrepancias...');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'running' | 'completed' | 'failed'>('running');
  // 🧹 Cleanup idempotente para desuscribir el canal y evitar fugas
  const cleanupRef = useRef<null | (() => void)>(null);

  // 🎯 FUNCIÓN PRINCIPAL: ReconciliationJobHandler maneja TODO el flujo
  const runJob = useCallback(async () => {
    const batchId = job.payload.batchId;
    const discrepancies = job.payload.discrepancies || [];
    
    console.log(`🔄 [ReconciliationJobHandler] Iniciando reconciliación para lote: ${batchId}`);
    console.log(`📊 [ReconciliationJobHandler] Discrepancias a procesar: ${discrepancies.length}`);
    
    // 🛡️ PROTECCIÓN GLOBAL CONTRA EJECUCIÓN MÚLTIPLE POR LOTE
    if (runningReconciliations.get(batchId)) {
      console.log('⚠️ [ReconciliationJobHandler] Lote ya está ejecutándose, evitando duplicación:', batchId);
      return;
    }
    
    // Marcar lote como ejecutándose
    runningReconciliations.set(batchId, true);
    
    try {
      console.log(`🚀 [ReconciliationJobHandler] Iniciando reconciliación para lote: ${job.payload.batchId}`);
      setStatusMessage('Validando discrepancias y verificando trabajos duplicados...');
      updateJobProgress(job.id, 5);
      
      // 🛡️ VALIDACIÓN BACKEND: ReconciliationJobHandler maneja validaciones y errores
      const result = await startDiscrepancyReconciliation(job.payload.batchId, discrepancies);
      
      if (!result.success) {
        // 🚨 MANEJO DE ERRORES: Mostrar error específico (ej: trabajo duplicado)
        const errorMessage = result.error || 'Error desconocido al iniciar la reconciliación';
        console.error('❌ [ReconciliationJobHandler] Error del backend:', errorMessage);
        throw new Error(errorMessage);
      }

      const backendJobId = result.data.jobId;
      setJobId(backendJobId);
      setStatusMessage('Reconciliación iniciada. Monitoreando progreso...');

      // Crear suscripción en tiempo real a la tabla ai_job_history
      const channel = supabase.channel(`reconciliation-job-${backendJobId}`)
        .on('postgres_changes', 
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'ai_job_history', 
              filter: `id=eq.${backendJobId}` 
            }, 
            (payload) => {
              console.log('🔄 [ReconciliationJobHandler] Actualización del trabajo:', payload);
              
              const { progress, details, status } = payload.new;
              
              // Actualizar el progreso en el JobManager
              if (typeof progress === 'number') {
                updateJobProgress(job.id, progress);
              }
              
              // 🔧 MANEJO ROBUSTO DE DETAILS: Puede ser string u objeto
              let statusMsg = 'Procesando reconciliación...';
              if (details) {
                if (typeof details === 'string') {
                  statusMsg = details;
                } else if (typeof details === 'object') {
                  // Si details es un objeto, extraer información relevante
                  if (details.step) {
                    statusMsg = details.step;
                  } else if (details.error) {
                    statusMsg = `Error: ${details.error}`;
                  } else if (details.processed && details.total) {
                    statusMsg = `Reconciliadas ${details.processed}/${details.total} discrepancias`;
                  }
                }
              }
              setStatusMessage(statusMsg);
              
              // 🎯 MANEJAR FINALIZACIÓN DEL TRABAJO - EVITAR FALLOS SILENCIOSOS
              if (status === 'completed') {
                console.log('✅ [ReconciliationJobHandler] Job completado exitosamente');
                setJobStatus('completed');
                
                // 🎯 GARANTIZAR PROGRESO AL 100% ANTES DE FINALIZAR
                updateJobProgress(job.id, 100);
                setStatusMessage('¡Reconciliación completada!');
                
                // ⏱️ MENSAJE TEMPORAL: Mostrar por 2 segundos antes de finalizar
                setTimeout(() => {
                  // 🚀 REFRESCAR PÁGINA PARA MOSTRAR NUEVOS DATOS
                  console.log('🔄 [ReconciliationJobHandler] Refrescando página para mostrar clasificaciones reconciliadas...');
                  
                  // 🧹 LIMPIAR PROTECCIÓN GLOBAL: Permitir futuras ejecuciones del lote
                  runningReconciliations.delete(batchId);
                  
                  router.refresh();
                  completeJob(job.id);
                  cleanupRef.current?.();
                }, 2000);
                
              } else if (status === 'failed') {
                console.error('❌ [ReconciliationJobHandler] Job fallido detectado');
                setJobStatus('failed');
                
                // 🔧 EXTRAER MENSAJE DE ERROR DETALLADO
                let errorMessage = 'Error durante la reconciliación';
                if (details) {
                  if (typeof details === 'string') {
                    errorMessage = details;
                  } else if (typeof details === 'object' && details.error) {
                    errorMessage = details.error;
                  }
                }
                
                console.error('❌ [ReconciliationJobHandler] Detalles del error:', {
                  status,
                  details,
                  errorMessage,
                  jobId: backendJobId
                });
                
                // 🎯 GARANTIZAR PROGRESO AL 100% INCLUSO EN ERROR
                updateJobProgress(job.id, 100);
                setStatusMessage(`Error: ${errorMessage}`);
                
                // ⏱️ MENSAJE TEMPORAL: Mostrar error por 3 segundos antes de finalizar
                setTimeout(() => {
                  // 🧹 LIMPIAR PROTECCIÓN GLOBAL: Permitir futuras ejecuciones del lote
                  runningReconciliations.delete(batchId);
                  
                  failJob(job.id, errorMessage);
                  cleanupRef.current?.();
                  
                  // 🚨 IMPORTANTE: NO refrescar la página en caso de error
                  // Esto evita que el usuario vea datos inconsistentes
                }, 3000);
              }
            })
        .subscribe();

      // Guardar cleanup idempotente para usar en onComplete/onError y en unmount
      cleanupRef.current = () => {
        try {
          channel.unsubscribe();
        } catch {
          // noop
        } finally {
          cleanupRef.current = null;
        }
      };

      // Nota: el cleanup en unmount se maneja en el retorno de useEffect

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en ReconciliationJobHandler:', error);
      
      // 🎯 GARANTIZAR PROGRESO AL 100% INCLUSO EN ERROR
      updateJobProgress(job.id, 100);
      setStatusMessage(`Error: ${errorMessage}`);
      
      // ⏱️ MENSAJE TEMPORAL: Mostrar error por 3 segundos antes de finalizar
      setTimeout(() => {
        // 🧹 LIMPIAR PROTECCIÓN GLOBAL: Permitir futuras ejecuciones del lote
        runningReconciliations.delete(batchId);
        
        failJob(job.id, errorMessage);
      }, 3000);
    }
  }, [job.id, job.payload.batchId, job.payload.discrepancies, updateJobProgress, completeJob, failJob, router]);

  // Iniciar el trabajo cuando el componente se monta - SOLO UNA VEZ (con guard)
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    runJob();
    // Cleanup en unmount: desuscribir y liberar el guard del lote
    return () => {
      cleanupRef.current?.();
      runningReconciliations.delete(job.payload.batchId);
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
        return <Brain className="h-5 w-5 text-purple-600" />;
    }
  };

  const getBorderColor = () => {
    switch (jobStatus) {
      case 'completed':
        return 'border-green-500';
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-purple-500';
    }
  };

  const getBackgroundColor = () => {
    switch (jobStatus) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-purple-50 dark:bg-purple-900/20';
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
              colorScheme="accent"
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
