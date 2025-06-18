// En: /components/ui/StandardTabs/StandardTabsList.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { useStandardTabs } from "./standard-tabs-context";
import { generateStandardTabsTokens } from "@/lib/theme/components/standard-tabs-tokens";

const StandardTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const context = useStandardTabs();

  const recipe = React.useMemo(() =>
    generateStandardTabsTokens(context.appColorTokens, context.mode, {
      ...context, isActive: false, isDisabled: false, isHovered: false
    }),
    [context]
  );

  // El estilo ahora se aplica de forma más limpia, incluyendo el borde del "riel"
  const listStyles: React.CSSProperties = {
    borderBottomWidth: recipe.tabsList.borderBottomWidth,
    borderBottomColor: recipe.tabsList.borderBottomColor,
    width: '100%' // Asegura que el riel ocupe todo el ancho disponible
  };

  return (
    <div style={listStyles}>  {/* Usamos un div como el "riel" del borde */}
        <TabsPrimitive.List
            ref={ref}
            // FIX: Eliminamos clases de layout fijas como h-10, p-1 y justify-center
            // para dar total flexibilidad al usuario, permitiendo que `grid` funcione como se espera.
            className={cn(
                "inline-flex items-center text-muted-foreground",
                className
            )}
            {...props}
        />
    </div>
  );
});
StandardTabsList.displayName = "StandardTabsList";

export { StandardTabsList };