'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type JobType = 'TRANSLATE_BATCH' | 'PRECLASSIFY_BATCH'; // Can be extended with other job types

export interface Job {
  id: string;
  type: JobType;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: number;
  payload: { 
    batchId: string; 
    userId: string; 
    projectId: string; 
  };
  errorMessage?: string;
  completedAt?: Date;
  startedAt?: Date;
}

interface JobManagerContextType {
  jobs: Job[];
  recentCompletedJobs: Job[];
  isJobManagerExpanded: boolean;
  hasActiveJobs: boolean;
  toggleJobManager: () => void;
  expandJobManager: () => void;
  minimizeJobManager: () => void;
  startJob: (jobData: Omit<Job, 'id' | 'status' | 'progress' | 'errorMessage' | 'completedAt' | 'startedAt'>) => void;
  updateJobProgress: (jobId: string, progress: number) => void;
  completeJob: (jobId: string) => void;
  failJob: (jobId: string, message?: string) => void;
  removeJob: (jobId: string) => void;
}

const JobManagerContext = createContext<JobManagerContextType | undefined>(undefined);

export const JobManagerProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentCompletedJobs, setRecentCompletedJobs] = useState<Job[]>([]);
  const [isJobManagerExpanded, setJobManagerExpanded] = useState(false);

  // Calcular si hay trabajos activos
  const hasActiveJobs = jobs.some(job => job.status === 'queued' || job.status === 'running');

  const toggleJobManager = () => setJobManagerExpanded(prev => !prev);
  const expandJobManager = () => setJobManagerExpanded(true);
  const minimizeJobManager = () => setJobManagerExpanded(false);

  const startJob = useCallback((jobData: Omit<Job, 'id' | 'status' | 'progress' | 'errorMessage' | 'completedAt' | 'startedAt'>) => {
    // 🛡️ VALIDACIÓN CRÍTICA: Prevenir trabajos duplicados del mismo tipo y lote
    const existingJob = jobs.find(job => 
      job.type === jobData.type && 
      job.payload.batchId === jobData.payload.batchId && 
      (job.status === 'queued' || job.status === 'running')
    );
    
    if (existingJob) {
      console.warn(`🚨 [JobManager] Trabajo duplicado detectado y rechazado:`, {
        tipo: jobData.type,
        lote: jobData.payload.batchId,
        trabajoExistente: existingJob.id,
        estado: existingJob.status
      });
      return; // No crear trabajo duplicado
    }
    
    const newJob: Job = {
      id: uuidv4(),
      ...jobData,
      status: 'queued',
      progress: 0,
      startedAt: new Date(),
    };
    
    console.log(`✅ [JobManager] Iniciando nuevo trabajo:`, {
      id: newJob.id,
      tipo: newJob.type,
      lote: newJob.payload.batchId,
      titulo: newJob.title
    });
    
    setJobs(prevJobs => [...prevJobs, newJob]);
    // Auto-expandir cuando se inicia un nuevo trabajo
    if (!isJobManagerExpanded) {
        expandJobManager();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJobManagerExpanded, jobs]);

  const updateJobProgress = useCallback((jobId: string, progress: number) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, progress, status: progress < 100 ? 'running' : job.status } : job
      )
    );
  }, []);

  const completeJob = useCallback((jobId: string) => {
    setJobs(prevJobs => {
      const updatedJobs = prevJobs.map(job =>
        job.id === jobId ? { ...job, status: 'completed' as const, progress: 100, completedAt: new Date() } : job
      );
      
      // Mover el trabajo completado a la lista de recientes
      const completedJob = updatedJobs.find(job => job.id === jobId);
      if (completedJob) {
        setRecentCompletedJobs(prev => {
          const newRecent = [completedJob, ...prev.filter(j => j.id !== jobId)];
          return newRecent.slice(0, 3); // Mantener solo los últimos 3
        });
      }
      
      return updatedJobs;
    });
  }, []);

  const failJob = useCallback((jobId: string, message?: string) => {
    setJobs(prevJobs => {
      const updatedJobs = prevJobs.map(job =>
        job.id === jobId
          ? { ...job, status: 'error' as const, progress: 100, errorMessage: message, completedAt: new Date() }
          : job
      );
      
      // Mover el trabajo fallido a la lista de recientes
      const failedJob = updatedJobs.find(job => job.id === jobId);
      if (failedJob) {
        setRecentCompletedJobs(prev => {
          const newRecent = [failedJob, ...prev.filter(j => j.id !== jobId)];
          return newRecent.slice(0, 3); // Mantener solo los últimos 3
        });
      }
      
      return updatedJobs;
    });
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  }, []);

  return (
    <JobManagerContext.Provider
      value={{
        jobs,
        recentCompletedJobs,
        isJobManagerExpanded,
        hasActiveJobs,
        toggleJobManager,
        expandJobManager,
        minimizeJobManager,
        startJob,
        updateJobProgress,
        completeJob,
        failJob,
        removeJob,
      }}
    >
      {children}
    </JobManagerContext.Provider>
  );
};

export const useJobManager = () => {
  const context = useContext(JobManagerContext);
  if (context === undefined) {
    throw new Error('useJobManager must be used within a JobManagerProvider');
  }
  return context;
};
