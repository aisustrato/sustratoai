"use client";

import { useTheme } from "@/app/theme-provider";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PageBackground } from "@/components/ui/page-background";
import React from "react";

interface SustratoPageBackgroundProps {
  children: React.ReactNode;
  variant?: "default" | "gradient" | "ambient" | "subtle" | "minimal";
  animate?: boolean;
  bubbles?: boolean;
  className?: string;
}

export function SustratoPageBackground({
  children,
  variant = "minimal",
  animate = true,
  bubbles = false,
  className = "",
}: SustratoPageBackgroundProps) {
  const { colorScheme, mode } = useTheme();
  const [colors, setColors] = useState({
    primary: "#3D7DF6", // Blue theme primary default
    secondary: "#1EA4E9", // Blue theme tertiary default
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

  // Actualizar los colores cuando cambie el tema
  useEffect(() => {
    const currentTheme = (colorScheme as keyof typeof themeColors) || "blue";

    setColors({
      primary: themeColors[currentTheme].primary,
      secondary: themeColors[currentTheme].secondary,
      accent: "#8A4EF6", // Mantener el acento púrpura
    });
  }, [colorScheme, mode]);

  // Generar burbujas decorativas si la opción está activada
  const generateBubbles = () => {
    if (!bubbles) return null;

    // Crear entre 6 y 10 burbujas
    const bubbleCount = Math.floor(Math.random() * 5) + 6;
    const bubbleElements = [];

    for (let i = 0; i < bubbleCount; i++) {
      // Calcular tamaño y posición aleatoria
      const size = Math.floor(Math.random() * 300) + 100; // Entre 100 y 400px
      const x = Math.floor(Math.random() * 100); // Posición X en porcentaje
      const y = Math.floor(Math.random() * 100); // Posición Y en porcentaje
      const opacity = Math.random() * 0.08 + 0.02; // Entre 0.02 y 0.1
      const delay = Math.random() * 2; // Delay para la animación

      // Elegir un color para cada burbuja
      const colorIndex = Math.floor(Math.random() * 3);
      const bubbleColor =
        colorIndex === 0
          ? colors.primary
          : colorIndex === 1
          ? colors.secondary
          : colors.accent;

      bubbleElements.push(
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            backgroundColor: bubbleColor,
            opacity: opacity,
            filter: "blur(70px)",
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.2, 0.9],
            opacity: [0, opacity, 0],
            x: [0, Math.random() * 40 - 20],
            y: [0, Math.random() * 40 - 20],
          }}
          transition={{
            duration: 15 + Math.random() * 10, // Entre 15 y 25 segundos
            ease: "easeInOut",
            delay: delay,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      );
    }

    return bubbleElements;
  };

  // Convertir la variante personalizada a la variante aceptada por PageBackground
  const getPageBackgroundVariant = () => {
    switch (variant) {
      case "ambient":
      case "gradient":
        return "gradient";
      case "subtle":
        return "subtle";
      case "minimal":
        return "minimal";
      default:
        return "default";
    }
  };

  return (
    <PageBackground variant={getPageBackgroundVariant()} className={className}>
      {/* Efectos visuales */}
      {animate && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Burbujas decorativas */}
          {generateBubbles()}

          {/* Gradiente superior */}
          {variant !== "minimal" && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b opacity-30 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${colors.primary}22, transparent)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1.5 }}
            />
          )}

          {/* Resplandor lateral */}
          {variant === "ambient" && (
            <motion.div
              className="absolute top-[15%] -left-[200px] w-[400px] h-[600px] rounded-full opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${colors.accent}80 0%, transparent 70%)`,
                filter: "blur(60px)",
              }}
              animate={{
                x: [0, 20, 0],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          )}
        </div>
      )}

      {/* Contenido principal */}
      <div className="relative z-10">{children}</div>
    </PageBackground>
  );
}
