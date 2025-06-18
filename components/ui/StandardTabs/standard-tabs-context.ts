// En: /components/ui/standard-tabs-context.ts

import * as React from "react";
import type { AppColorTokens, ColorSchemeVariant, Mode } from "@/lib/theme/ColorToken";

interface StandardTabsContextType {
  colorScheme: ColorSchemeVariant;
  styleType: 'line' | 'enclosed';
  size: 'sm' | 'md' | 'lg';
  appColorTokens: AppColorTokens;
  mode: Mode;
}

export const StandardTabsContext = React.createContext<StandardTabsContextType | null>(null);

export function useStandardTabs() {
  const context = React.useContext(StandardTabsContext);
  if (!context) {
    throw new Error("useStandardTabs debe ser usado dentro de un StandardTabs.Provider");
  }
  return context;
}