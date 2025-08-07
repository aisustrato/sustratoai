'use client';

import React from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { TranslationJobHandler } from '@/components/jobs/TranslationJobHandler';
import { PreclassificationJobHandler } from '@/components/jobs/PreclassificationJobHandler';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardTooltip } from '@/components/ui/StandardTooltip';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { History, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useComponentVisibility } from '@/lib/hooks/useComponentVisibility';

export const JobManager = () => {
  const { 
    jobs, 
    recentCompletedJobs,
    isJobManagerExpanded, 
    hasActiveJobs,
    toggleJobManager,
    minimizeJobManager
  } = useJobManager();
  const router = useRouter();
  const { shouldShowJobManager } = useComponentVisibility();

  // No mostrar el JobManager en ciertas rutas (como /update-password)
  if (!shouldShowJobManager) {
    return null;
  }

  const renderJob = (job: Job) => {
    switch (job.type) {
      case 'TRANSLATE_BATCH':
        return <TranslationJobHandler key={job.id} job={job} />;
      case 'PRECLASSIFY_BATCH':
        return <PreclassificationJobHandler key={job.id} job={job} />;
      default:
        return <div key={job.id}>Trabajo desconocido: {job.title}</div>;
    }
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
      case 'queued':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'danger';
      case 'running':
      case 'queued':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  const handleHistoryClick = () => {
    router.push('/personal/historial_ai');
  };

  // Función para generar el mensaje del tooltip
  const getTooltipMessage = (activeJobsCount: number) => {
    if (hasActiveJobs) {
      const runningJob = jobs.find(j => j.status === 'running');
      if (runningJob) {
        // Mostrar progreso real si está disponible
        const progressText = runningJob.progress > 0 ? ` (${Math.round(runningJob.progress)}%)` : '';
        return `${runningJob.title}${progressText}`;
      }
      return `${activeJobsCount} trabajo${activeJobsCount > 1 ? 's' : ''} en progreso`;
    }
    if (recentCompletedJobs.length > 0) {
      return `${recentCompletedJobs.length} trabajo${recentCompletedJobs.length > 1 ? 's' : ''} reciente${recentCompletedJobs.length > 1 ? 's' : ''}`;
    }
    return 'Ver historial de trabajos';
  };

  // Modo Badge Minimizado
  if (!isJobManagerExpanded) {
    const activeJobsCount = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-5 right-5 z-50"
      >
        <StandardTooltip
          content={getTooltipMessage(activeJobsCount)}
          side="left"
          colorScheme="neutral"
          trigger={
            hasActiveJobs ? (
              // Badge alargado para trabajos activos
              <StandardButton
                onClick={toggleJobManager}
                styleType="subtle"
                colorScheme="accent"
                size="lg"
                className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 h-[60px] px-4 py-3 flex items-center gap-3 ring-1 ring-black/5"
              >
                <SustratoLoadingLogo 
                  size={24} 
                  variant="spin" 
                  speed="normal"
                  showText={false}
                />
                <StandardBadge
                  colorScheme="accent"
                  styleType="solid"
                  size="sm"
                  className="min-w-[24px] h-6 flex items-center justify-center text-xs font-bold"
                >
                  {activeJobsCount}
                </StandardBadge>
              </StandardButton>
            ) : (
              // Badge circular para estado inactivo
              <StandardButton
                onClick={toggleJobManager}
                styleType="solid"
                colorScheme="neutral"
                size="lg"
                className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 min-w-[60px] h-[60px] p-3 ring-1 ring-black/5"
              >
                <div className="flex flex-col items-center justify-center relative">
                  <History className="h-6 w-6" />
                  {/* NUNCA mostrar badge numérico en estado inactivo */}
                </div>
              </StandardButton>
            )
          }
        />
      </motion.div>
    );
  }

  // Modo Expandido
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-5 right-5 z-50"
    >
      <StandardCard 
        colorScheme={hasActiveJobs ? "accent" : "neutral"}
        className="shadow-2xl w-96 max-h-[500px] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            {hasActiveJobs ? (
              <SustratoLoadingLogo 
                size={20} 
                variant="spin" 
                speed="fast"
                showText={false}
              />
            ) : (
              <History className="h-5 w-5" />
            )}
            <StandardText as="h3" fontSize="lg" fontWeight="bold">
              {hasActiveJobs ? 'Trabajos Activos' : 'Gestor de Tareas'}
            </StandardText>
          </div>
          <StandardButton
            size="sm"
            iconOnly
            onClick={minimizeJobManager}
            styleType="ghost"
            colorScheme="neutral"
          >
            <ChevronDown className="h-4 w-4" />
          </StandardButton>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          {/* Trabajos Activos */}
          {jobs.length > 0 && (
            <div className="border-b">
              <div className="p-3 bg-gray-50 dark:bg-gray-800">
                <StandardText fontSize="sm" fontWeight="medium" colorScheme="neutral">
                  Trabajos en Progreso ({jobs.length})
                </StandardText>
              </div>
              {jobs.map(renderJob)}
            </div>
          )}

          {/* Trabajos Recientes */}
          {recentCompletedJobs.length > 0 && (
            <div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                <StandardText fontSize="sm" fontWeight="medium" colorScheme="neutral">
                  Últimos Trabajos ({recentCompletedJobs.length})
                </StandardText>
                <StandardButton
                  size="xs"
                  styleType="ghost"
                  colorScheme="neutral"
                  onClick={handleHistoryClick}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  <StandardText fontSize="xs">Ver Todo</StandardText>
                </StandardButton>
              </div>
              <div className="p-2 space-y-2">
                {recentCompletedJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(job.status)}
                      <div className="flex-1 min-w-0">
                        <StandardText 
                          fontSize="sm" 
                          fontWeight="medium"
                          className="truncate"
                        >
                          {job.title}
                        </StandardText>
                        <StandardText 
                          fontSize="xs" 
                          colorScheme="neutral"
                          className="truncate"
                        >
                          {job.completedAt && formatDistanceToNow(job.completedAt, { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </StandardText>
                      </div>
                    </div>
                    <StandardBadge
                      colorScheme={getStatusColor(job.status)}
                      size="xs"
                    >
                      {job.status === 'completed' ? 'Completado' : 
                       job.status === 'error' ? 'Error' : job.status}
                    </StandardBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado Vacío */}
          {jobs.length === 0 && recentCompletedJobs.length === 0 && (
            <div className="p-6 text-center">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <StandardText colorScheme="neutral" fontSize="sm">
                No hay trabajos activos ni recientes.
              </StandardText>
              <StandardButton
                size="sm"
                styleType="ghost"
                colorScheme="neutral"
                onClick={handleHistoryClick}
                className="mt-2"
              >
                Ver Historial Completo
              </StandardButton>
            </div>
          )}
        </div>
      </StandardCard>
    </motion.div>
  );
};
