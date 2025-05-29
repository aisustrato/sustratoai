"use client";

import { useTheme } from "@/app/theme-provider";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SustratoLogoRotating } from "@/components/ui/sustrato-logo-rotating";

// Componente con SVG rotativo pero texto fijo según el tema actual
export function SustratoLogoWithFixedText({
  className = "",
  size = 40,
  speed = "normal",
  initialTheme = "blue",
  textClassName = "",
  variant = "horizontal",
}: {
  className?: string;
  size?: number;
  speed?: "slow" | "normal" | "fast";
  initialTheme?: "blue" | "green" | "orange";
  textClassName?: string;
  variant?: "horizontal" | "vertical";
}) {
  const { colorScheme, mode } = useTheme();
  const [textColors, setTextColors] = useState({
    primary: "#3D7DF6", // Blue theme primary default
    accent: "#8A4EF6", // Accent color (purple)
  });

  // Definición de colores por tema
  const themeColors = {
    blue: {
      primary: mode === "dark" ? "#2E5EB9" : "#3D7DF6",
      secondary: mode === "dark" ? "#1EA4E9" : "#516e99",
    },
    green: {
      primary: mode === "dark" ? "#1c8e63" : "#24BC81",
      secondary: mode === "dark" ? "#2CA18F" : "#3AD7BF",
    },
    orange: {
      primary: mode === "dark" ? "#B95413" : "#F77019",
      secondary: mode === "dark" ? "#6D2F0B" : "#913E0F",
    },
  };

  // Actualizar los colores cuando cambie el tema global
  useEffect(() => {
    const currentTheme = (colorScheme as keyof typeof themeColors) || "blue";

    setTextColors({
      primary: themeColors[currentTheme].primary,
      accent: "#8A4EF6", // Mantener el acento púrpura
    });
  }, [colorScheme, mode]);

  // Tamaño del texto según el tamaño del logo
  const getTextSize = () => {
    if (size <= 30) return "text-lg";
    if (size <= 40) return "text-xl";
    if (size <= 60) return "text-2xl";
    return "text-3xl";
  };

  // Tamaño del subtexto
  const getSubtextSize = () => {
    if (size <= 30) return "text-xs";
    if (size <= 40) return "text-sm";
    if (size <= 60) return "text-base";
    return "text-lg";
  };

  return (
    <div
      className={`flex ${
        variant === "vertical" ? "flex-col items-center" : "items-center"
      } ${className}`}
    >
      <SustratoLogoRotating
        size={size}
        speed={speed}
        initialTheme={initialTheme}
      />

      <div
        className={`${
          variant === "vertical" ? "mt-2 text-center" : "ml-3"
        } ${textClassName}`}
      >
        <div className={`font-bold ${getTextSize()}`}>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${textColors.primary}, ${textColors.accent})`,
              fontFamily: "'Chau Philomene One', sans-serif",
            }}
          >
            Sustrato.ai
          </span>
        </div>

        {variant === "horizontal" && (
          <div
            className={`${getSubtextSize()} text-neutral-500 dark:text-neutral-400 ml-0.5 mt-0.5 italic`}
          >
            cultivando sinergias humano·AI
          </div>
        )}

        {variant === "vertical" && (
          <div
            className={`${getSubtextSize()} text-neutral-500 dark:text-neutral-400 italic`}
          >
            cultivando sinergias humano·AI
          </div>
        )}
      </div>
    </div>
  );
}
