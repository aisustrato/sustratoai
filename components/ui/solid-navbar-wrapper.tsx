"use client"

import type React from "react"
import { useColorTokens } from "@/hooks/use-color-tokens"
import { useTheme } from "@/app/theme-provider"

interface SolidNavbarWrapperProps {
  children: React.ReactNode
}

export function SolidNavbarWrapper({ children }: SolidNavbarWrapperProps) {
  const { component } = useColorTokens()
  const { mode } = useTheme()

  // Usar los mismos tokens del navbar
  const navTokens = component.navbar

  // Estilo para el fondo del navbar wrapper
  const wrapperStyle = {
    backgroundColor: navTokens.background.scrolled,
    backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${mode === "dark" ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.8)"}`,
    boxShadow: navTokens.shadow,
  }

  return (
    <div className="sticky top-0 z-50" style={wrapperStyle}>
      {children}
    </div>
  )
}
