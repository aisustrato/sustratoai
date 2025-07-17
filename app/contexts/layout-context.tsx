'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface LayoutContextProps {
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  layoutGap: number;
  globalXPadding: number;
}

const LayoutContext = createContext<LayoutContextProps>({
  isSidebarCollapsed: false,
  sidebarWidth: 240, // default expanded width
  layoutGap: 40, // default large gap
  globalXPadding: 64, // default large padding
});

export const LayoutProvider = ({ 
  children, 
  isSidebarCollapsed, 
  sidebarWidth,
  layoutGap,
  globalXPadding
}: { 
  children: ReactNode; 
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  layoutGap: number;
  globalXPadding: number;
}) => {
  return (
    <LayoutContext.Provider value={{ isSidebarCollapsed, sidebarWidth, layoutGap, globalXPadding }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextProps => {
  return useContext(LayoutContext);
};
