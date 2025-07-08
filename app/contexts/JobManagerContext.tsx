'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface JobManagerContextType {
  isJobManagerVisible: boolean;
  showJobManager: () => void;
  hideJobManager: () => void;
}

const JobManagerContext = createContext<JobManagerContextType | undefined>(undefined);

export const JobManagerProvider = ({ children }: { children: ReactNode }) => {
  const [isJobManagerVisible, setJobManagerVisible] = useState(false);

  const showJobManager = () => setJobManagerVisible(true);
  const hideJobManager = () => setJobManagerVisible(false);

  return (
    <JobManagerContext.Provider value={{ isJobManagerVisible, showJobManager, hideJobManager }}>
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
