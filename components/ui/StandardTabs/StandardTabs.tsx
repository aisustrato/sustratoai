// En: /components/ui/StandardTabs.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useTheme } from "@/app/theme-provider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardTabsContext } from "./standard-tabs-context"; // Crearemos este contexto

export interface StandardTabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  colorScheme?: ColorSchemeVariant;
  styleType?: 'line' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
}

const StandardTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  StandardTabsProps
>(({ className, colorScheme = 'primary', styleType = 'line', size = 'md', ...props }, ref) => {
  const { appColorTokens, mode } = useTheme();

  // El valor del contexto que pasaremos a los componentes hijos.
  const contextValue = React.useMemo(() => ({
    colorScheme,
    styleType,
    size,
    appColorTokens,
    mode
  }), [colorScheme, styleType, size, appColorTokens, mode]);

  if (!appColorTokens) {
    // Renderiza un estado base o de carga si los tokens aún no están disponibles.
    return <TabsPrimitive.Root ref={ref} {...props} />;
  }

  return (
    <StandardTabsContext.Provider value={contextValue}>
      <TabsPrimitive.Root ref={ref} className={className} {...props} />
    </StandardTabsContext.Provider>
  );
});
StandardTabs.displayName = "StandardTabs";

export { StandardTabs };