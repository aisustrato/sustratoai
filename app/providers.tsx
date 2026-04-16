// 📍 app/providers.tsx
// 🎯 PROPÓSITO: Orquestador de todos los providers de la aplicación
// 🔧 DECISIÓN: I18n → Theme → DesignTokens → Font → Ripple → Auth
// 🌍 ACTUALIZADO: Incluye I18nProvider para internacionalización

"use client";

import type React from "react";

import { I18nProvider } from "@/app/providers/I18nProvider";
import { ThemeProvider } from "@/app/theme-provider";
import { DesignTokensProvider } from "@/app/providers/DesignTokensProvider";
import { FontThemeProvider } from "@/app/font-provider";
import { RippleProvider } from "@/components/ripple/RippleProvider";
import { AuthProvider } from "@/app/auth-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // 🌍 I18n: Más externo para que todos los providers tengan acceso a traducciones
    <I18nProvider>
      <ThemeProvider>
        {/* 💎 CORE: Tokens precalculados - ganancia 10x en performance */}
        <DesignTokensProvider>
          <FontThemeProvider>
            <RippleProvider>
              <AuthProvider>
                <Toaster position="top-right" richColors />
                {children}
              </AuthProvider>
            </RippleProvider>
          </FontThemeProvider>
        </DesignTokensProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
