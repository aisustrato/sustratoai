"use client";

import { useEffect, useMemo, useState } from "react";
import { SustratoLogo } from "./sustrato-logo";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { generateSustratoLoadingLogoTokens } from "@/lib/theme/components/sustrato-loading-logo-tokens";

interface SustratoLoadingLogoProps {
  size?: number;
  variant?: "spin" | "pulse" | "spin-pulse" | "dash" | "progress";
  speed?: "slow" | "normal" | "fast";
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  showText?: boolean;
  text?: string;
  breathingEffect?: boolean;
  colorTransition?: boolean;
}

export function SustratoLoadingLogo({
  size = 48,
  variant = "spin",
  speed = "normal",
  className = "",
  primaryColor,
  secondaryColor,
  accentColor,
  showText = false,
  text = "Cargando...",
  breathingEffect = true,
  colorTransition = true,
}: SustratoLoadingLogoProps) {
  const { appColorTokens, mode } = useTheme();
  const [progress, setProgress] = useState(0);
  const [colorPhase, setColorPhase] = useState(0);

  // Generate component-specific tokens
  const componentTokens = useMemo(() => {
    return appColorTokens
      ? generateSustratoLoadingLogoTokens(appColorTokens, mode)
      : null;
  }, [appColorTokens, mode]);

  // Use generated tokens with overrides
  const actualPrimaryColor =
    primaryColor || componentTokens?.colors?.primary?.pure || "currentColor";
  const actualSecondaryColor =
    secondaryColor || componentTokens?.colors?.secondary?.pure || "transparent";
  const actualPrimaryTextColor =
    componentTokens?.colors?.primary?.text || "currentColor";

  // Determinar la duración de la animación según la velocidad
  const getDuration = () => {
    switch (speed) {
      case "slow":
        return "3s";
      case "fast":
        return "1s";
      case "normal":
      default:
        return "2s";
    }
  };

  // Efecto para la animación de progreso
  useEffect(() => {
    if (variant === "progress") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          return next > 100 ? 0 : next;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [variant]);

  // Efecto para la transición de color
  useEffect(() => {
    if (colorTransition) {
      const interval = setInterval(() => {
        setColorPhase((prev) => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [colorTransition]);

  // Get accent colors from generated tokens
  const accentColors = useMemo(
    () => ({
      bg: componentTokens?.colors?.accent?.bg || "#e0b7ff",
      pure: componentTokens?.colors?.accent?.pure || "#9333ea",
      text: componentTokens?.colors?.accent?.text || "#6b21a8",
      dark: componentTokens?.colors?.accent.textShade || "#581c87",
    }),
    [componentTokens]
  );

  // Función para interpolar entre colores
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    // Convertir colores hex a RGB
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");

    const r1 = Number.parseInt(hex1.substring(0, 2), 16);
    const g1 = Number.parseInt(hex1.substring(2, 4), 16);
    const b1 = Number.parseInt(hex1.substring(4, 6), 16);

    const r2 = Number.parseInt(hex2.substring(0, 2), 16);
    const g2 = Number.parseInt(hex2.substring(2, 4), 16);
    const b2 = Number.parseInt(hex2.substring(4, 6), 16);

    // Interpolar
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    // Convertir de vuelta a hex
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Calcular el color actual basado en la fase
  const getCurrentAccentColor = () => {
    const phase = colorPhase / 100;

    if (phase < 0.33) {
      // De bg a pure
      return interpolateColor(accentColors.bg, accentColors.pure, phase * 3);
    } else if (phase < 0.66) {
      // De pure a text
      return interpolateColor(
        accentColors.pure,
        accentColors.text,
        (phase - 0.33) * 3
      );
    } else {
      // De text a dark y de vuelta a bg
      const subPhase = (phase - 0.66) * 3;
      if (subPhase < 0.5) {
        return interpolateColor(
          accentColors.text,
          accentColors.dark,
          subPhase * 2
        );
      } else {
        return interpolateColor(
          accentColors.dark,
          accentColors.bg,
          (subPhase - 0.5) * 2
        );
      }
    }
  };

  // Clases para las diferentes animaciones
  const animationClasses = {
    spin: "animate-spin",
    pulse: "animate-pulse",
    "spin-pulse": "animate-spin-pulse",
    dash: "animate-dash",
    progress: "",
  };

  // Estilos para la animación de progreso
  const progressStyle =
    variant === "progress"
      ? {
          strokeDasharray: 283, // Aproximadamente 2 * PI * 45 (circunferencia del círculo)
          strokeDashoffset: 283 - (283 * progress) / 100,
        }
      : {};

  // Estilos para la animación de dash
  const dashStyle =
    variant === "dash"
      ? {
          strokeDasharray: "90 150",
        }
      : {};

  // Definir la animación de spin-pulse si es necesario
  const spinPulseStyle = `
    @keyframes spin-pulse {
      0% {
        transform: rotate(0deg) scale(0.95);
      }
      50% {
        transform: rotate(180deg) scale(1.05);
      }
      100% {
        transform: rotate(360deg) scale(0.95);
      }
    }
    .animate-spin-pulse {
      animation: spin-pulse ${getDuration()} infinite linear;
    }
  `;

  // Definir la animación de dash si es necesario
  const dashAnimationStyle = `
    @keyframes dash {
      0% {
        stroke-dashoffset: 283;
      }
      50% {
        stroke-dashoffset: 0;
      }
      100% {
        stroke-dashoffset: -283;
      }
    }
    .animate-dash {
      animation: dash ${getDuration()} infinite linear;
    }
  `;

  // Definir la animación de respiración para el círculo interior
  const breathingAnimationStyle = `
    @keyframes breathing {
      0% {
        transform: scale(0.85);
      }
      50% {
        transform: scale(1.15);
      }
      100% {
        transform: scale(0.85);
      }
    }
    .animate-breathing {
      animation: breathing ${getDuration()} infinite ease-in-out;
    }
  `;

  // Get the current inner circle color using tokens or override
  const innerCircleColor = colorTransition
    ? getCurrentAccentColor()
    : accentColor || componentTokens?.colors?.accent?.pure || "currentColor";

  // Clase para la animación de respiración
  const breathingClass = breathingEffect ? "animate-breathing" : "";

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Estilos para las animaciones personalizadas */}
      <style jsx global>
        {`
          ${variant === "spin-pulse" ? spinPulseStyle : ""}
          ${variant === "dash" ? dashAnimationStyle : ""}
          ${breathingEffect ? breathingAnimationStyle : ""}
        `}
      </style>

      {/* Versión personalizada del logo para animaciones */}
      {variant === "dash" || variant === "progress" ? (
        <div className={cn("relative", className)}>
          {/* Círculo de fondo */}
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-30"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={actualPrimaryColor}
              strokeWidth="6"
              fill="none"
            />
          </svg>

          {/* Círculo animado */}
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("absolute top-0 left-0", animationClasses[variant])}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={actualPrimaryColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              style={{ ...progressStyle, ...dashStyle }}
              transform="rotate(-90 50 50)"
            />
          </svg>

          {/* Punto central con efecto de respiración y transición de color */}
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-0 left-0"
          >
            <circle
              cx="50"
              cy="50"
              r="12"
              fill={innerCircleColor}
              className={breathingClass}
              style={{ transformOrigin: "center" }}
            />
          </svg>
        </div>
      ) : (
        <div className={cn(animationClasses[variant], className)}>
          {/* Logo estándar con punto central personalizado */}
          <div className="relative">
            <SustratoLogo
              size={size}
              primaryColor={actualPrimaryColor}
              secondaryColor={actualSecondaryColor}
              accentColor="transparent"
            />

            {/* Punto central personalizado con efecto de respiración y transición de color */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0"
            >
              <circle
                cx="50"
                cy="50"
                r="12"
                fill={innerCircleColor}
                className={breathingClass}
                style={{ transformOrigin: "center" }}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Texto de carga opcional */}
      {showText && (
        <p
          className="mt-3 text-sm font-medium"
          style={{ color: actualPrimaryTextColor }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
