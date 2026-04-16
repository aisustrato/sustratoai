// En: /components/ui/standard-tabs-context.ts

import * as React from "react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { DesignTokens, TabsStyleType, TabsSize } from "@/app/providers/DesignTokensProvider";

interface StandardTabsContextType {
  colorScheme: ColorSchemeVariant;
  styleType: TabsStyleType;
  size: TabsSize;
  tokens: DesignTokens | null;
}

export const StandardTabsContext = React.createContext<StandardTabsContextType | null>(null);

export function useStandardTabs() {
  const context = React.useContext(StandardTabsContext);
  if (!context) {
    throw new Error("useStandardTabs debe ser usado dentro de un StandardTabs.Provider");
  }
  return context;
}