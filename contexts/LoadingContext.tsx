// contexts/LoadingContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo'; // Ajusta la ruta a tu componente

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

interface LoadingContextType extends LoadingState {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: undefined });

  // Usamos useMemo para evitar re-crear estas funciones en cada render si no es necesario
  const showLoading = useMemo(() => (message?: string) => {
    console.log("[LoadingProvider] showLoading, mensaje:", message);
    setLoadingState({ isLoading: true, message });
  }, []);

  const hideLoading = useMemo(() => () => {
    console.log("[LoadingProvider] hideLoading");
    setLoadingState({ isLoading: false, message: undefined });
  }, []);

  const contextValue = useMemo(() => ({
    ...loadingState,
    showLoading,
    hideLoading,
  }), [loadingState, showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {loadingState.isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Fondo semitransparente
            zIndex: 9999, // Asegurar que esté por encima de otros elementos
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)', // Efecto blur opcional
          }}
          role="status" // Para accesibilidad
          aria-live="polite"
          aria-label={loadingState.message || "Cargando"}
        >
          <div 
            className="bg-background/80 p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col items-center"
            // Añade estilos inline si es necesario para asegurar que se vean sobre el overlay
          >
            <SustratoLoadingLogo
              size={64} // Tamaño para el overlay global
              variant="spin-pulse" // O la variante que prefieras
              speed="normal"
              showText={!!loadingState.message} // Mostrar texto solo si hay mensaje
              text={loadingState.message || "Procesando..."}
              breathingEffect
              colorTransition
              // Puedes pasar colores si tu logo los necesita o toma del theme
            />
            {/* Si el texto no está integrado en SustratoLoadingLogo cuando showText es true: */}
            {/* {loadingState.message && (
              <p className="mt-4 text-lg text-foreground animate-pulse">
                {loadingState.message}
              </p>
            )} */}
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading debe ser usado dentro de un LoadingProvider');
  }
  return context;
}