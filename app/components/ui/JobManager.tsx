'use client';

import React from 'react';
import { useJobManager } from '@/app/contexts/JobManagerContext';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const JobManager = () => {
  const { isJobManagerVisible, hideJobManager } = useJobManager();

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
            className="shadow-2xl w-96 h-24 flex flex-col justify-between"
          >
            <div className="p-4">
              <StandardText as="h3" fontSize="lg" fontWeight="bold">
                Job Manager
              </StandardText>
              <StandardText fontSize="sm">
                Procesando tareas en segundo plano...
              </StandardText>
            </div>
            <div className="absolute top-2 right-2">
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
          </StandardCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
