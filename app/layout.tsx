
// app/layout.tsx
import React, { Suspense } from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers"; // Tu archivo de providers (theme, etc.)
import { getAllFontVariables } from "@/lib/fonts";
import { AuthLayoutWrapper } from "./auth-layout-wrapper";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from "@/contexts/LoadingContext";
import ProjectStatusBadge from "@/components/ui/ProjectStatusBadge";
import { JobManagerProvider } from '@/app/contexts/JobManagerContext';
import { JobManager } from '@/app/components/ui/JobManager';

export const metadata: Metadata = {
  title: "Sustrato.ai",
  description: "Investigación Cualitativa Aumentada",
  // ... otros metadatos ...
};

const GlobalLoadingIndicator = () => (
  <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
    <SustratoLoadingLogo
      size={96}
      variant="spin-pulse"
      speed="fast"
      breathingEffect
      colorTransition
      text="Cargando página..."
    />
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = getAllFontVariables();

  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <body className="h-full bg-background text-foreground antialiased">
        <Providers> {/* Tu provider de tema y otros globales */}
          <JobManagerProvider>
            <LoadingProvider> {/* <--- ENVUELVE CON LOADINGPROVIDER */}
              <AuthLayoutWrapper>
                <Suspense fallback={<GlobalLoadingIndicator />}>
                  {children}
                </Suspense>
                <div className="fixed top-20 right-5 z-50">
                  <ProjectStatusBadge />
                </div>
              </AuthLayoutWrapper>
              {/* // ANTES: El Toaster estaba aquí dentro de LoadingProvider */}
              {/* <Toaster /> */}
            </LoadingProvider> {/* <--- CIERRA LOADINGPROVIDER */}
            <JobManager />
            <Toaster /> {/* // DESPUÉS: El Toaster ahora está aquí, fuera de LoadingProvider pero dentro de Providers */}
          </JobManagerProvider>
        </Providers>
      </body>
    </html>
  );
}

