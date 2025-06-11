//. 📍 components/ui/StandardProgressBar.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateStandardProgressBarTokens,
  type StandardProgressBarStyleType,
  type StandardProgressBarSize,
} from "@/lib/theme/components/standard-progress-bar-tokens";
import type { ProCardVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 INTERFACES 📦
export interface StandardProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Valor actual del progreso (de 0 a max). */
  value?: number;
  /** Valor máximo del progreso (el 100%). */
  max?: number;
  /** Esquema de color del componente. */
  colorScheme?: ProCardVariant;
  /** Variante visual de la barra (sólido, gradiente, etc.). */
  styleType?: StandardProgressBarStyleType;
  /** Tamaño (altura) de la barra de progreso. */
  size?: StandardProgressBarSize;
  /** Etiqueta descriptiva que se muestra encima de la barra. */
  label?: string;
  /** Muestra el valor numérico del porcentaje junto a la etiqueta. */
  showValue?: boolean;
  /** Activa el modo indeterminado para cargas sin progreso definido. */
  indeterminate?: boolean;
  /** Habilita/deshabilita las transiciones animadas al cambiar el valor. */
  animated?: boolean;
}
//#endregion ![def]

//#region [main] - 🧱 COMPONENT 🧱
const StandardProgressBar = React.forwardRef<
  HTMLDivElement,
  StandardProgressBarProps
>(
  (
    {
      // --- Props con Defaults ---
      value = 0,
      max = 100,
      colorScheme = "primary",
      styleType = "gradient",
      size = "md",
      animated = true,
      // --- Props sin Defaults ---
      label,
      showValue = false,
      indeterminate = false,
      className,
      ...props
    },
    ref
  ) => {
    //#region [sub_init] - 🪝 HOOKS, STATE, MEMOS 🪝
    const { appColorTokens, mode } = useTheme();

    // 1. Generamos el diccionario de variables CSS desde los tokens.
    const cssVariables = useMemo(() => {
      if (!appColorTokens || !mode) return {};
      return generateStandardProgressBarTokens(
        appColorTokens,
        mode,
        colorScheme,
        styleType
      );
    }, [appColorTokens, mode, colorScheme, styleType]);

    // 2. Calculamos el porcentaje, asegurándonos de que esté entre 0 y 100.
    const percentage = useMemo(
      () => Math.min(100, Math.max(0, (value / max) * 100)),
      [value, max]
    );

    // 3. Determinamos el estilo de la barra interna según el styleType.
    const barStyle = useMemo<React.CSSProperties>(() => {
      const baseStyle: React.CSSProperties = {
        width: indeterminate ? "50%" : `${percentage}%`,
        transition: animated && !indeterminate ? "width 0.4s ease" : "none",
      };

      switch (styleType) {
        case "solid":
          return { ...baseStyle, backgroundColor: "var(--spb-bar-bg)" };
        case "gradient":
          return {
            ...baseStyle,
            backgroundImage:
              "linear-gradient(90deg, var(--spb-gradient-start), var(--spb-gradient-end))",
          };
        case "accent-gradient":
          return {
            ...baseStyle,
            backgroundImage:
              "linear-gradient(90deg, var(--spb-gradient-start), var(--spb-gradient-end))",
          };
        case "thermometer":
          return {
            ...baseStyle,
            backgroundImage:
              "linear-gradient(90deg, var(--spb-thermometer-start), var(--spb-thermometer-mid), var(--spb-thermometer-end))",
          };
        default:
          return baseStyle;
      }
    }, [styleType, percentage, animated, indeterminate]);
    
    // 4. Mapeamos el tamaño a clases de Tailwind.
    const heightClass = useMemo(() => {
        const sizeMap: Record<StandardProgressBarSize, string> = {
            xs: "h-1", sm: "h-1.5", md: "h-2", lg: "h-3", xl: "h-4"
        };
        return sizeMap[size] || "h-2";
    }, [size]);

    //#endregion ![sub_init]

    //#region [render] - 🖼️ RENDER JSX 🖼️
    return (
      <div className="w-full" ref={ref} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-1.5">
            {/* TODO: Considerar refactorizar a StandardText en el futuro */}
            {label && (
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {label}
              </span>
            )}
            {showValue && !indeterminate && (
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        {/* El Contenedor Principal inyecta las variables CSS */}
        <div
          className={cn(
            "w-full overflow-hidden relative rounded-full",
            heightClass,
            className
          )}
          style={{
            ...cssVariables,
            backgroundColor: "var(--spb-track-bg)",
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={indeterminate ? undefined : max}
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuetext={
            indeterminate ? "Cargando..." : `${Math.round(percentage)}%`
          }
          aria-label={label || "Barra de progreso"}
        >
          {/* La Barra Interna consume las variables */}
          <div
            className={cn("h-full rounded-full", {
              "progress-indeterminate": indeterminate && animated,
            })}
            style={barStyle}
          />
        </div>

        {/* ANIMACIÓN INDETERMINADA:
          Como discutimos, para mantener la soberanía del componente y evitar
          el uso de `globals.css`, la animación se define aquí.
          Esta es una decisión de diseño consciente para esta fase del proyecto.
        */}
        <style jsx>{`
          .progress-indeterminate {
            animation: progress-indeterminate-animation 2s infinite ease-in-out;
          }
          @keyframes progress-indeterminate-animation {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(200%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
    );
    //#endregion ![render]
  }
);

StandardProgressBar.displayName = "StandardProgressBar";
export { StandardProgressBar };
//#endregion ![main]