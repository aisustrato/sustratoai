"use client"

import { cn } from "@/lib/utils"
import { Text } from "@/components/ui/text"
import type { TextProps } from "@/components/ui/text"
import type { ReactNode } from "react"

export type ShipVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary" | "secondary"

export interface ShipProps {
  variant?: ShipVariant
  children: ReactNode
  className?: string
  textProps?: Omit<TextProps, "children">
}

export function Ship({ variant = "neutral", children, className, textProps }: ShipProps) {
  // Configuración de estilos según la variante
  const variantStyles: Record<ShipVariant, { bg: string; textColor: string; textColorVariant: string }> = {
    success: { bg: "bg-green-100", textColor: "success", textColorVariant: "dark" },
    warning: { bg: "bg-amber-100", textColor: "warning", textColorVariant: "dark" },
    error: { bg: "bg-red-100", textColor: "error", textColorVariant: "dark" },
    info: { bg: "bg-blue-100", textColor: "info", textColorVariant: "dark" },
    neutral: { bg: "bg-gray-100", textColor: "neutral", textColorVariant: "dark" },
    primary: { bg: "bg-primary-100", textColor: "primary", textColorVariant: "dark" },
    secondary: { bg: "bg-secondary-100", textColor: "secundary", textColorVariant: "dark" },
  }

  const { bg, textColor, textColorVariant } = variantStyles[variant]

  return (
    <span className={cn(bg, "px-2.5 py-0.5 rounded-full inline-flex items-center", className)}>
      <Text
        size="xs"
        weight="medium"
        fontType="body"
        color={textColor as any}
        colorVariant={textColorVariant as any}
        {...textProps}
      >
        {children}
      </Text>
    </span>
  )
}
