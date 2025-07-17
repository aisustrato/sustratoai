'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type JobType = 'TRANSLATE_BATCH'; // Can be extended with other job types

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
}

interface JobManagerContextType {
  jobs: Job[];
  isJobManagerVisible: boolean;
  showJobManager: () => void;
  hideJobManager: () => void;
  startJob: (jobData: Omit<Job, 'id' | 'status' | 'progress' | 'errorMessage'>) => void;
  updateJobProgress: (jobId: string, progress: number) => void;
  completeJob: (jobId: string) => void;
  failJob: (jobId: string, message?: string) => void;
  removeJob: (jobId: string) => void;
}

const JobManagerContext = createContext<JobManagerContextType | undefined>(undefined);

export const JobManagerProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isJobManagerVisible, setJobManagerVisible] = useState(false);

  const showJobManager = () => setJobManagerVisible(true);
  const hideJobManager = () => setJobManagerVisible(false);

  const startJob = useCallback((jobData: Omit<Job, 'id' | 'status' | 'progress' | 'errorMessage'>) => {
    const newJob: Job = {
      id: uuidv4(),
      ...jobData,
      status: 'queued',
      progress: 0,
    };
    setJobs(prevJobs => [...prevJobs, newJob]);
    if (!isJobManagerVisible) {
        showJobManager();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateJobProgress = useCallback((jobId: string, progress: number) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, progress, status: progress < 100 ? 'running' : job.status } : job
      )
    );
  }, []);

  const completeJob = useCallback((jobId: string) => {
    setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId ? { ...job, status: 'completed', progress: 100 } : job
        )
      );
  }, []);

  const failJob = useCallback((jobId: string, message?: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId
          ? { ...job, status: 'error', progress: 100, errorMessage: message }
          : job
      )
    );
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  }, []);

  return (
    <JobManagerContext.Provider
      value={{
        jobs,
        isJobManagerVisible,
        showJobManager,
        hideJobManager,
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
