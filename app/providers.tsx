"use client";

import type React from "react";

import { ThemeProvider } from "@/app/theme-provider";
import { FontThemeProvider } from "@/app/font-provider";
import { RippleProvider } from "@/components/ripple/RippleProvider";
import { AuthProvider } from "@/app/auth-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FontThemeProvider>
        <RippleProvider>
          <AuthProvider>
            <Toaster position="top-right" richColors />
            {children}
          </AuthProvider>
        </RippleProvider>
      </FontThemeProvider>
    </ThemeProvider>
  );
}
