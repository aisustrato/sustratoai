//. 📍 components/ui/StandardWrapper.tsx

import React from 'react';
import { cn } from '@/lib/utils';

export interface StandardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * StandardWrapper es un componente de diseño fundamental que envuelve el contenido principal de una página.
 * Su propósito es proporcionar una estructura de diseño consistente, centrando el contenido,
 * aplicando un ancho máximo para una legibilidad óptima en pantallas grandes y gestionando
 * los espaciados laterales (padding) de forma responsiva.
 */
export const StandardWrapper: React.FC<StandardWrapperProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  );
};

StandardWrapper.displayName = 'StandardWrapper';
