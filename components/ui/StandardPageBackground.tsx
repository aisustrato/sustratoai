"use client";

import { useTheme } from "@/app/theme-provider";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  generateStandardPageBackgroundTokens,
  type StandardPageBackgroundVariant,
} from "@/lib/theme/components/standard-page-background-tokens";
import React from "react";

interface StandardPageBackgroundProps {
  children: React.ReactNode;
  variant?: StandardPageBackgroundVariant | "ambient"; // ambient is for animation control, maps to 'gradient' for tokens
  animate?: boolean;
  bubbles?: boolean;
  className?: string;
}

export function StandardPageBackground({
  children,
  variant = "minimal",
  animate = true,
  bubbles = false,
  className = "",
}: StandardPageBackgroundProps) {
  const { mode, appColorTokens } = useTheme();
  const [colors, setColors] = useState({
    primary: appColorTokens?.primary.pure || "#3D7DF6",
    secondary: appColorTokens?.secondary.pure || "#1EA4E9",
    accent: appColorTokens?.accent.pure || "#8A4EF6",
  });

  // Actualiza los colores para las animaciones (burbujas, gradientes) usando los tokens centralizados
  useEffect(() => {
    if (appColorTokens) {
      setColors({
        primary: appColorTokens.primary.pure,
        secondary: appColorTokens.secondary.pure,
        accent: appColorTokens.accent.pure,
      });
    }
  }, [appColorTokens]);

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


  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Map 'ambient' to 'gradient' for token generation, but keep 'ambient' for animation logic if needed
    const tokenVariant = variant === 'ambient' ? 'gradient' : variant;
    const tokens = generateStandardPageBackgroundTokens(appColorTokens, mode, tokenVariant as StandardPageBackgroundVariant);
    setBackgroundStyle({
      backgroundColor: tokens.background,
      backgroundImage: tokens.backgroundImage,
    });
  }, [appColorTokens, mode, variant]);

  return (
    <>
      {/* 1. Div para el Fondo Fijo (detrás de todo) */}
      <div
        className={`fixed inset-0 -z-10 w-full h-full ${mode === "dark" ? "dark" : ""} ${className}`}
        style={backgroundStyle}
        aria-hidden="true"
      />
      
      {/* Efectos visuales (burbujas, gradientes animados, etc.) */}
      {animate && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-1">
          {/* Burbujas decorativas */}
          {generateBubbles()}

          {/* Gradiente superior animado */}
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

          {/* Resplandor lateral para variante 'ambient' (o 'gradient' si se mapea así para animación) */}
          {(variant === "ambient" || variant === "gradient") && (
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
      <div className="relative z-0">{children}</div>
    </>
  );
}
