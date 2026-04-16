// En: /components/ui/StandardTabs.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { TabsStyleType, TabsSize } from "@/app/providers/DesignTokensProvider";
import { StandardTabsContext } from "./standard-tabs-context";

export interface StandardTabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  colorScheme?: ColorSchemeVariant;
  styleType?: TabsStyleType;
  size?: TabsSize;
}

const StandardTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  StandardTabsProps
>(({ className, colorScheme = 'primary', styleType = 'line', size = 'md', ...props }, ref) => {
  const { tokens } = useDesignTokens();

  // El valor del contexto que pasaremos a los componentes hijos.
  const contextValue = React.useMemo(() => ({
    colorScheme,
    styleType,
    size,
    tokens,
  }), [colorScheme, styleType, size, tokens]);

  if (!tokens) {
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