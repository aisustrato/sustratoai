// --- page-wrapper.tsx (VERSIÓN CORRECTA) ---
"use client"

import type { ReactNode } from "react"
import { PageBackground } from "./page-background" // PageBackground ahora es más simple
import type { PageBackgroundVariant } from "@/lib/theme/components/page-background-tokens"

interface PageWrapperProps {
  children: ReactNode
  title?: string
  variant?: PageBackgroundVariant
  className?: string // ej. "container mx-auto px-4 py-8"
}

export function PageWrapper({ children, variant = "default", className = "" }: PageWrapperProps) {
  return (
    <PageBackground variant={variant}>
      {/* Este div aplica el layout al contenido (ej. centrado, padding) */}
      {/* Su altura será determinada por el children (ProTable, etc.) */}
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </PageBackground>
  );
}
// --- END OF FILE page-wrapper.tsx (MODIFIED) ---