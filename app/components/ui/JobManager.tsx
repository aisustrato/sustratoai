'use client';

import React from 'react';
import { useJobManager, type Job } from '@/app/contexts/JobManagerContext';
import { TranslationJobHandler } from '@/components/jobs/TranslationJobHandler';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const JobManager = () => {
  const { jobs, isJobManagerVisible, hideJobManager } = useJobManager();

  const renderJob = (job: Job) => {
    switch (job.type) {
      case 'TRANSLATE_BATCH':
        return <TranslationJobHandler key={job.id} job={job} />;
      default:
        return <div key={job.id}>Trabajo desconocido: {job.title}</div>;
    }
  };

  return (
    <AnimatePresence>
      {isJobManagerVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-5 right-5 z-50"
        >
          <StandardCard 
            colorScheme="accent"
            className="shadow-2xl w-96 max-h-[400px] flex flex-col"
          >
            <div className="p-3 border-b flex justify-between items-center">
              <StandardText as="h3" fontSize="lg" fontWeight="bold">
                Gestor de Tareas
              </StandardText>
              <StandardButton
                  size="sm"
                  iconOnly
                  onClick={hideJobManager}
                  styleType="ghost"
                  colorScheme="neutral"
              >
                  <X className="h-4 w-4" />
              </StandardButton>
            </div>
            <div className="flex-grow overflow-y-auto">
              {jobs.length > 0 ? (
                jobs.map(renderJob)
              ) : (
                <div className="p-4 text-center">
                  <StandardText>No hay trabajos activos.</StandardText>
                </div>
              )}
            </div>
          </StandardCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
