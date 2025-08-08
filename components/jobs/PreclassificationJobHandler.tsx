// Ruta: components/jobs/PreclassificationJobHandler.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { supabase } from '@/app/auth/client';
import { startInitialPreclassification } from '@/lib/actions/preclassification-actions';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { StandardText } from '@/components/ui/StandardText';
import { Brain, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 🛡️ PROTECCIÓN GLOBAL: Map para evitar ejecuciones múltiples del mismo lote
const runningBatches = new Map<string, boolean>();

interface PreclassificationJobHandlerProps {
  job: Job;
}

export function PreclassificationJobHandler({ job }: PreclassificationJobHandlerProps) {
  const { updateJobProgress, completeJob, failJob } = useJobManager();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Preparando preclasificación...');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'running' | 'completed' | 'failed'>('running');

  // 🎯 FUNCIÓN PRINCIPAL: PreclassificationJobHandler maneja TODO el flujo
  const runJob = useCallback(async () => {
    const batchId = job.payload.batchId;
    
    // 🛡️ PROTECCIÓN GLOBAL CONTRA EJECUCIÓN MÚLTIPLE POR LOTE
    if (runningBatches.get(batchId)) {
      console.log('⚠️ [PreclassificationJobHandler] Lote ya está ejecutándose, evitando duplicación:', batchId);
      return;
    }
    
    // Marcar lote como ejecutándose
    runningBatches.set(batchId, true);
    
    try {
      console.log(`🚀 [PreclassificationJobHandler] Iniciando preclasificación para lote: ${job.payload.batchId}`);
      setStatusMessage('Validando lote y verificando trabajos duplicados...');
      updateJobProgress(job.id, 5);
      
      // 🛡️ VALIDACIÓN BACKEND: PreclassificationJobHandler maneja validaciones y errores
      const result = await startInitialPreclassification(job.payload.batchId);
      
      if (!result.success) {
        // 🚨 MANEJO DE ERRORES: Mostrar error específico (ej: trabajo duplicado)
        const errorMessage = result.error || 'Error desconocido al iniciar la preclasificación';
        console.error('❌ [PreclassificationJobHandler] Error del backend:', errorMessage);
        throw new Error(errorMessage);
      }

      const backendJobId = result.data.jobId;
      setJobId(backendJobId);
      setStatusMessage('Preclasificación iniciada. Monitoreando progreso...');

      // Crear suscripción en tiempo real a la tabla ai_job_history
      const channel = supabase.channel(`preclass-job-${backendJobId}`)
        .on('postgres_changes', 
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'ai_job_history', 
              filter: `id=eq.${backendJobId}` 
            }, 
            (payload) => {
              console.log('🔄 [PreclassificationJobHandler] Actualización del trabajo:', payload);
              
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
                  // Si details es un objeto, extraer información relevante
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
              
              // 🎯 MANEJAR FINALIZACIÓN DEL TRABAJO - EVITAR FALLOS SILENCIOSOS
              if (status === 'completed') {
                console.log('✅ [PreclassificationJobHandler] Job completado exitosamente');
                setJobStatus('completed');
                
                // 🎯 GARANTIZAR PROGRESO AL 100% ANTES DE FINALIZAR
                updateJobProgress(job.id, 100);
                setStatusMessage('¡Preclasificación completada!');
                
                // ⏱️ MENSAJE TEMPORAL: Mostrar por 2 segundos antes de finalizar
                setTimeout(() => {
                  // 🚀 REFRESCAR PÁGINA PARA MOSTRAR NUEVOS DATOS
                  console.log('🔄 [PreclassificationJobHandler] Refrescando página para mostrar nuevas clasificaciones...');
                  
                  // 🧹 LIMPIAR PROTECCIÓN GLOBAL: Permitir futuras ejecuciones del lote
                  runningBatches.delete(batchId);
                  
                  router.refresh();
                  completeJob(job.id);
                  channel.unsubscribe();
                }, 2000);
                
              } else if (status === 'failed') {
                console.error('❌ [PreclassificationJobHandler] Job fallido detectado');
                setJobStatus('failed');
                
                // 🔧 EXTRAER MENSAJE DE ERROR DETALLADO
                let errorMessage = 'Error durante la preclasificación';
                if (details) {
                  if (typeof details === 'string') {
                    errorMessage = details;
                  } else if (typeof details === 'object' && details.error) {
                    errorMessage = details.error;
                  }
                }
                
                console.error('❌ [PreclassificationJobHandler] Detalles del error:', {
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
                  runningBatches.delete(batchId);
                  
                  failJob(job.id, errorMessage);
                  channel.unsubscribe();
                  
                  // 🚨 IMPORTANTE: NO refrescar la página en caso de error
                  // Esto evita que el usuario vea datos inconsistentes
                }, 3000);
              }
            })
        .subscribe();

      // Cleanup function para desuscribirse cuando el componente se desmonte
      return () => {
        channel.unsubscribe();
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en PreclassificationJobHandler:', error);
      
      // 🎯 GARANTIZAR PROGRESO AL 100% INCLUSO EN ERROR
      updateJobProgress(job.id, 100);
      setStatusMessage(`Error: ${errorMessage}`);
      
      // ⏱️ MENSAJE TEMPORAL: Mostrar error por 3 segundos antes de finalizar
      setTimeout(() => {
        // 🧹 LIMPIAR PROTECCIÓN GLOBAL: Permitir futuras ejecuciones del lote
        runningBatches.delete(batchId);
        
        failJob(job.id, errorMessage);
      }, 3000);
    }
  }, [job.id, job.payload.batchId, updateJobProgress, completeJob, failJob, router]); // 🛡️ Incluir todas las dependencias, protegido por Map global

  // Iniciar el trabajo cuando el componente se monta - SOLO UNA VEZ (con guard)
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    runJob();
  }, [runJob]);

  // 🎨 RENDERIZAR UI CON FEEDBACK VISUAL ROBUSTO
  const getStatusIcon = () => {
    switch (jobStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Brain className="h-5 w-5 text-accent-pure" />;
    }
  };

  const getBorderColor = () => {
    switch (jobStatus) {
      case 'completed':
        return 'border-green-500';
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-accent-pure';
    }
  };

  const getBackgroundColor = () => {
    switch (jobStatus) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-accent-subtle';
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
              fontSize="sm" 
              fontWeight="medium"
              className="truncate"
            >
              {job.title}
            </StandardText>
            {jobStatus === 'running' && (
              <StandardText 
                fontSize="xs" 
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
            fontSize="xs" 
            colorScheme={jobStatus === 'failed' ? 'danger' : 'neutral'}
            className="truncate"
          >
            {statusMessage}
          </StandardText>
          
          {jobId && (
            <StandardText 
              fontSize="xs" 
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
