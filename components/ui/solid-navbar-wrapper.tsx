"use client"

import type React from "react"
import { useTheme } from "@/app/theme-provider"
import { generateStandardNavbarTokens, type StandardNavbarTokens } from "@/lib/theme/components/standard-nav-tokens"
import { useMemo } from "react"

interface SolidNavbarWrapperProps {
  children: React.ReactNode
}

export function SolidNavbarWrapper({ children }: SolidNavbarWrapperProps) {
  const { appColorTokens, mode } = useTheme()

  const currentNavTokens: StandardNavbarTokens | null = useMemo(() => {
    if (!appColorTokens || !mode) return null
    return generateStandardNavbarTokens(appColorTokens, mode)
  }, [appColorTokens, mode])

  if (!currentNavTokens) {
    return null // o un loader/fallback si se prefiere
  }

  // Estilo para el fondo del navbar wrapper
  const wrapperStyle = {
    backgroundColor: currentNavTokens.background.scrolled,
    backdropFilter: "blur(8px)", // This matches navbar.tsx
    borderBottom: `0px solid ${currentNavTokens.submenu.border}`,
    boxShadow: currentNavTokens.shadow,
  }

  return (
    <div className="sticky top-0 z-50" style={wrapperStyle}>
      {children}
    </div>
  )
}
