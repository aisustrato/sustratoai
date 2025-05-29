"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateProgressTokens,
  type ProgressVariant,
  type ProgressSize,
} from "@/lib/theme/components/progress-tokens";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valor actual del progreso */
  value?: number;
  /** Valor máximo del progreso (por defecto: 100) */
  max?: number;
  /** Variante de color */
  variant?: ProgressVariant;
  /** Tamaño de la barra de progreso */
  size?: ProgressSize;
  /** Etiqueta descriptiva */
  label?: string;
  /** Mostrar valor numérico */
  showValue?: boolean;
  /** Modo indeterminado (animación de carga) */
  indeterminate?: boolean;
  /** Habilitar/deshabilitar animaciones */
  animated?: boolean;
  /** Usar degradado por defecto */
  degradado?: boolean;
  /** Usar degradado con acento */
  degradadoAccent?: boolean;
}

export function Progress({
  value = 0,
  max = 100,
  variant = "primary",
  size = "md",
  label,
  showValue = false,
  indeterminate = false,
  animated = true,
  degradado = true, // Por defecto, usar degradado
  degradadoAccent = false,
  className,
  ...props
}: ProgressProps) {
  const { appColorTokens } = useTheme();
  const [styles, setStyles] = useState<{
    container: React.CSSProperties;
    bar: React.CSSProperties;
  }>({
    container: {},
    bar: {},
  });

  // Calcular el porcentaje de progreso
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Generar estilos basados en tokens
  useEffect(() => {
    if (!appColorTokens) {
      // Fallback styles if appColorTokens are not yet available
      setStyles({
        container: {
          backgroundColor: "#e0e0e0", // light gray track
          borderRadius: "9999px",
        },
        bar: {
          backgroundColor: "#757575", // medium gray bar
          borderRadius: "9999px",
          transition: animated ? "width 0.3s ease-in-out" : "none",
        },
      });
      return;
    }

    const tokens = generateProgressTokens(appColorTokens, variant);

    const containerStyles: React.CSSProperties = {
      backgroundColor: tokens.trackColor,
      borderRadius: tokens.borderRadius,
    };

    // Determinar qué color o degradado usar para la barra
    let barBackgroundImage = "none";
    let barBackgroundColor: string = tokens.barColor;

    if (degradado) {
      if (degradadoAccent) {
        // Degradado con acento
        barBackgroundImage = tokens.accentGradient;
        barBackgroundColor = "transparent";
      } else {
        // Degradado normal
        barBackgroundImage = tokens.barGradient;
        barBackgroundColor = "transparent";
      }
    }

    // Para el termómetro, siempre usar degradado
    if (variant === "termometro") {
      barBackgroundImage = degradadoAccent
        ? tokens.accentGradient
        : tokens.barGradient;
      barBackgroundColor = "transparent";
    }

    const barStyles: React.CSSProperties = {
      backgroundImage: barBackgroundImage,
      backgroundColor: barBackgroundColor,
      backgroundSize: "100% 100%",
      backgroundPosition: "0% 0%",
      backgroundRepeat: "no-repeat",
      borderRadius: tokens.borderRadius,
      transition: animated ? tokens.transition : "none",
    };

    setStyles({
      container: containerStyles,
      bar: barStyles,
    });
  }, [
    appColorTokens,
    variant,
    degradado,
    degradadoAccent,
    animated,
    percentage,
    indeterminate,
  ]);

  // Determinar la altura según el tamaño
  const getHeight = () => {
    switch (size) {
      case "xs":
        return "h-1"; // 4px
      case "sm":
        return "h-1.5"; // 6px
      case "md":
        return "h-2"; // 8px
      case "lg":
        return "h-3"; // 12px
      case "xl":
        return "h-4"; // 16px
      default:
        return "h-2"; // 8px
    }
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && !indeterminate && (
            <span className="text-sm font-medium">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "w-full overflow-hidden relative",
          getHeight(),
          className
        )}
        style={styles.container}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={indeterminate ? undefined : max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuetext={
          indeterminate ? "Cargando..." : `${Math.round(percentage)}%`
        }
        aria-label={label}
        {...props}
      >
        {indeterminate ? (
          <div
            className={cn(
              "h-full absolute",
              animated ? "progress-indeterminate" : ""
            )}
            style={{
              ...styles.bar,
              width: "50%",
            }}
          />
        ) : (
          <div
            className="h-full"
            style={{
              ...styles.bar,
              width: `${percentage}%`,
            }}
          />
        )}
      </div>

      <style jsx global>{`
        .progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite ease-in-out;
        }

        @keyframes progress-indeterminate {
          0% {
            left: -50%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
