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
import { StandardDialog } from '@/components/ui/StandardDialog';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { History, ChevronDown, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useComponentVisibility } from '@/lib/hooks/useComponentVisibility';

export const JobManager = () => {
  const { 
    jobs, 
    recentCompletedJobs, 
    isJobManagerExpanded, 
    hasActiveJobs, 
    toggleJobManager,
    minimizeJobManager,
    limitDialogOpen,
    limitDialogData,
    closeLimitDialog
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
            <div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800">
                <StandardText fontSize="sm" fontWeight="medium" colorScheme="neutral">
                  Trabajos en Progreso ({jobs.length})
                </StandardText>
              </div>
              {jobs.map(renderJob)}
            </div>
          )}

          {/* Acceso al Historial - Solo cuando hay trabajos activos */}
          {jobs.length > 0 && (
            <div className="border-t mt-4">
              <div className="p-4 text-center">
                <StandardButton
                  size="sm"
                  styleType="outline"
                  colorScheme="neutral"
                  onClick={handleHistoryClick}
                  className="flex items-center gap-2 mx-auto"
                >
                  <History className="h-4 w-4" />
                  <StandardText fontSize="sm">
                    Ver Historial de Trabajos
                  </StandardText>
                </StandardButton>
                {recentCompletedJobs.length > 0 && (
                  <StandardText 
                    fontSize="xs" 
                    colorScheme="neutral"
                    className="mt-2"
                  >
                    {recentCompletedJobs.length} trabajo{recentCompletedJobs.length > 1 ? 's' : ''} reciente{recentCompletedJobs.length > 1 ? 's' : ''}
                  </StandardText>
                )}
              </div>
            </div>
          )}

          {/* Estado Vacío - Solo cuando no hay trabajos activos */}
          {jobs.length === 0 && (
            <div className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <StandardText colorScheme="neutral" fontSize="sm" className="mb-3">
                No hay trabajos de IA en progreso. Puedes revisar el &quot;Historial de Trabajos&quot; para ver trabajos anteriores.
              </StandardText>
              <StandardText colorScheme="neutral" fontSize="xs" className="mb-4">
                Los trabajos de IA aparecerán aquí cuando estén en ejecución.
              </StandardText>
              {recentCompletedJobs.length > 0 && (
                <StandardText 
                  fontSize="xs" 
                  colorScheme="neutral"
                  className="mb-3"
                >
                  {recentCompletedJobs.length} trabajo{recentCompletedJobs.length > 1 ? 's' : ''} reciente{recentCompletedJobs.length > 1 ? 's' : ''}
                </StandardText>
              )}
              <StandardButton
                size="sm"
                styleType="outline"
                colorScheme="neutral"
                onClick={handleHistoryClick}
                className="flex items-center gap-2 mx-auto"
              >
                <History className="h-4 w-4" />
                <StandardText fontSize="sm">Ver Historial de Trabajos</StandardText>
              </StandardButton>
            </div>
          )}
        </div>
      </StandardCard>

      {/* 💬 DIÁLOGO DE LÍMITE EXCEDIDO */}
      <StandardDialog open={limitDialogOpen} onOpenChange={closeLimitDialog}>
        <StandardDialog.Content colorScheme="warning" size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>
              🚨 Límite de Trabajos Concurrentes Excedido
            </StandardDialog.Title>
          </StandardDialog.Header>
          
          <StandardDialog.Body>
            {limitDialogData && (
              <div className="space-y-4">
                <StandardText>
                  Has alcanzado el límite máximo de <strong>2 trabajos simultáneos</strong>.
                </StandardText>
                
                <div>
                  <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="mb-2">
                    Trabajos activos actuales:
                  </StandardText>
                  <div className="space-y-1">
                    {limitDialogData.activeJobs.map((job) => (
                      <div key={job.id} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <StandardText size="sm">{job.title}</StandardText>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <StandardText size="sm">
                    Para iniciar <strong>&quot;{limitDialogData.attemptedJob.title}&quot;</strong>, 
                    por favor espera a que termine al menos uno de los trabajos actuales.
                  </StandardText>
                </div>
              </div>
            )}
          </StandardDialog.Body>
          
          <StandardDialog.Footer>
            <StandardDialog.Close asChild>
              <StandardButton colorScheme="primary" size="sm">
                Entendido
              </StandardButton>
            </StandardDialog.Close>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </motion.div>
  );
};
