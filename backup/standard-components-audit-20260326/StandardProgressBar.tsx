//. 📍 components/ui/StandardProgressBar.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { ProgressBarStyleType, ProgressBarSize } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { motion, AnimatePresence } from "framer-motion";
//#endregion ![head]

//#region [def] - 📦 INTERFACES 📦
export interface StandardProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Valor actual del progreso (de 0 a max). */
  value?: number;
  /** Valor máximo del progreso (el 100%). */
  max?: number;
  /** Esquema de color del componente. */
  colorScheme?: ColorSchemeVariant;
  /** Variante visual de la barra (sólido, gradiente, etc.). */
  styleType?: ProgressBarStyleType;
  /** Tamaño (altura) de la barra de progreso. */
  size?: ProgressBarSize;
  /** Etiqueta descriptiva que se muestra encima de la barra. */
  label?: string;
  /** Muestra el valor numérico del porcentaje junto a la etiqueta. */
  showValue?: boolean;
  /** Activa el modo indeterminado para cargas sin progreso definido. */
  indeterminate?: boolean;
  /** Habilita/deshabilita las transiciones animadas al cambiar el valor. */
  animated?: boolean;
  /** Activa efecto de celebración PAFFF cuando llega al 100%. */
  celebrateOnComplete?: boolean;
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
      celebrateOnComplete = false,
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
    const { tokens } = useDesignTokens();
    const [showCelebration, setShowCelebration] = useState(false);
    const [lastMilestone, setLastMilestone] = useState(0);
    const [showMilestoneAnimation, setShowMilestoneAnimation] = useState(false);

    // 1. Obtenemos los tokens precalculados
    const progressTokens = useMemo(() => {
      if (!tokens) return null;
      return tokens.progressBar[colorScheme][styleType];
    }, [tokens, colorScheme, styleType]);

    // 2. Calculamos el porcentaje y detectamos hitos cada 25%
    const percentage = useMemo(
      () => Math.min(100, Math.max(0, (value / max) * 100)),
      [value, max]
    );

    const currentMilestone = Math.floor(percentage / 25) * 25;

    // 3. Efecto para animación cada 25% y celebración al 100%
    useEffect(() => {
      if (currentMilestone > lastMilestone && currentMilestone > 0) {
        console.log(`🎯 Hito alcanzado: ${currentMilestone}%`);
        setLastMilestone(currentMilestone);
        
        // Animación sutil cada 25% (excepto al 100%)
        if (currentMilestone < 100) {
          console.log(`✨ Activando animación para ${currentMilestone}%`);
          setShowMilestoneAnimation(true);
          setTimeout(() => {
            console.log(`✨ Desactivando animación para ${currentMilestone}%`);
            setShowMilestoneAnimation(false);
          }, 600);
        }
        
        // Celebración PAFFF al 100%
        if (currentMilestone === 100 && celebrateOnComplete) {
          console.log(`🎉 Activando celebración PAFFF`);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2000);
        }
      }
    }, [currentMilestone, lastMilestone, celebrateOnComplete]);

    // 4. Determinamos el estilo de la barra interna según el styleType
    const barStyle = useMemo<React.CSSProperties>(() => {
      if (!progressTokens) return {};
      
      const baseStyle: React.CSSProperties = {
        width: indeterminate ? "50%" : `${percentage}%`,
        transition: animated && !indeterminate ? "width 0.4s ease" : "none",
      };

      switch (styleType) {
        case "solid":
          return { ...baseStyle, backgroundColor: progressTokens.barBg };
        case "gradient":
        case "accent-gradient":
          return {
            ...baseStyle,
            backgroundImage: `linear-gradient(90deg, ${progressTokens.gradientStart}, ${progressTokens.gradientEnd})`,
          };
        case "thermometer":
          return {
            ...baseStyle,
            backgroundImage: `linear-gradient(90deg, ${progressTokens.thermometerStart}, ${progressTokens.thermometerMid}, ${progressTokens.thermometerEnd})`,
          };
        default:
          return baseStyle;
      }
    }, [progressTokens, styleType, percentage, animated, indeterminate]);
    
    // 5. Mapeamos el tamaño a clases de Tailwind
    const heightClass = useMemo(() => {
        const sizeMap: Record<ProgressBarSize, string> = {
            xs: "h-1", sm: "h-1.5", md: "h-2", lg: "h-3", xl: "h-4"
        };
        return sizeMap[size] || "h-2";
    }, [size]);

    if (!progressTokens) {
      return <div ref={ref} {...props}>Cargando...</div>;
    }

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

        {/* El Contenedor Principal */}
        <div
          className={cn(
            "w-full overflow-hidden relative rounded-full",
            heightClass,
            className
          )}
          style={{
            backgroundColor: progressTokens.trackBg,
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
          {/* La Barra Interna */}
          <motion.div
            className={cn("h-full rounded-full relative", {
              "progress-indeterminate": indeterminate && animated,
            })}
            style={barStyle}
            animate={{
              scale: showMilestoneAnimation ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Texto difuminado cada 25% */}
            <AnimatePresence>
              {showMilestoneAnimation && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  initial={{ opacity: 1, scale: 0.8, y: 0 }}
                  animate={{ opacity: 0, scale: 1.5, y: -10 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color: progressTokens.gradientStart || progressTokens.barBg,
                      textShadow: `0 0 10px ${progressTokens.gradientStart || progressTokens.barBg}`,
                    }}
                  >
                    {currentMilestone}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Efecto PAFFF al 100% */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.8, y: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="text-6xl font-bold"
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
                }}
                animate={{
                  rotate: [0, 15, -15, 10, -10, 0],
                  scale: [1, 1.3, 1.1, 1.3, 1],
                }}
                transition={{ duration: 0.8, repeat: 1 }}
              >
                🎉
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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