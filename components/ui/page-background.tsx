// --- page-background.tsx (MODIFICADO DRASTICAMENTE) ---
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/theme-provider";
import {
  generatePageBackgroundTokens,
  type PageBackgroundVariant,
} from "@/lib/theme/components/page-background-tokens";

interface PageBackgroundProps {
  children: React.ReactNode;
  variant?: PageBackgroundVariant;
  className?: string;
}

export function PageBackground({
  children,
  variant = "minimal",
  className = "",
}: PageBackgroundProps) {
  const { appColorTokens, mode } = useTheme();
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const tokens = generatePageBackgroundTokens(appColorTokens, mode, variant);
    setBackgroundStyle({
      backgroundColor: tokens.background,
      backgroundImage: tokens.backgroundImage,
    });
  }, [appColorTokens, mode, variant]);

  return (
    <>
      {/* 1. Div para el Fondo Fijo (detrás de todo) */}
      <div
        className={`fixed inset-0 -z-10 w-full h-full ${
          mode === "dark" ? "dark" : ""
        } ${className}`}
        style={backgroundStyle}
        aria-hidden="true"
      />
      {/* 2. Simplemente renderiza children. PageWrapper le dará el layout. */}
      {/* No más flex, no más min-h-screen, no más espaciador de navbar aquí. */}
      {/* La estructura de altura y scroll viene de AuthLayoutWrapper y de los estilos globales. */}
      {children}
    </>
  );
}