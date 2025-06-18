// En: /components/ui/StandardTabs/StandardTabsTrigger.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { useStandardTabs } from "./standard-tabs-context";
import { generateStandardTabsTokens } from "@/lib/theme/components/standard-tabs-tokens";

const StandardTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const context = useStandardTabs();
  const [isHovered, setIsHovered] = React.useState(false);

  // 1. Generamos las "recetas" para cada estado posible.
  const recipes = React.useMemo(() => {
    const baseArgs = { ...context, isDisabled: props.disabled || false };
    return {
      active: generateStandardTabsTokens(context.appColorTokens, context.mode, {
        ...baseArgs, isActive: true, isHovered: false,
      }),
      inactive: generateStandardTabsTokens(context.appColorTokens, context.mode, {
        ...baseArgs, isActive: false, isHovered: false,
      }),
      hover: generateStandardTabsTokens(context.appColorTokens, context.mode, {
        ...baseArgs, isActive: false, isHovered: true,
      }),
    };
  }, [context, props.disabled]);

  // 2. "Trasvasijamos" las recetas a variables CSS.
  const triggerVars = {
    // Colores de fondo
    '--bg-inactive': recipes.inactive.tabsTrigger.background,
    '--bg-hover': recipes.hover.tabsTrigger.background,
    '--bg-active': recipes.active.tabsTrigger.background,
    // Colores de texto
    '--text-inactive': recipes.inactive.tabsTrigger.color,
    '--text-hover': recipes.hover.tabsTrigger.color,
    '--text-active': recipes.active.tabsTrigger.color,
    // Colores de borde
    '--border-inactive': recipes.inactive.tabsTrigger.borderBottomColor,
    '--border-active': recipes.active.tabsTrigger.borderBottomColor,
    // Otros estilos
    '--font-weight-inactive': recipes.inactive.tabsTrigger.fontWeight,
    '--font-weight-active': recipes.active.tabsTrigger.fontWeight,
    '--opacity': recipes.inactive.tabsTrigger.opacity,
    '--cursor': recipes.inactive.tabsTrigger.cursor,
    '--padding': recipes.inactive.tabsTrigger.padding,
    '--font-size': recipes.inactive.tabsTrigger.fontSize,
  } as React.CSSProperties;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={triggerVars} // 3. Aplicamos las variables al elemento.
      className={cn(
        // 4. Aplicamos los estilos base y luego usamos los selectores de data-state.
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200",
        "p-[var(--padding)] text-base font-medium", // Usamos las variables para estilos base
        "opacity-[var(--opacity)] cursor-[var(--cursor)] text-[var(--font-size)]",
        
        // Lógica de estado a través de clases y selectores, la forma robusta.
        "bg-[var(--bg-inactive)] text-[var(--text-inactive)] font-[var(--font-weight-inactive)] border-b-2 border-[var(--border-inactive)]",
        "hover:bg-[var(--bg-hover)] hover:text-[var(--text-hover)]",
        "data-[state=active]:bg-[var(--bg-active)] data-[state=active]:text-[var(--text-active)] data-[state=active]:font-[var(--font-weight-active)] data-[state=active]:border-[var(--border-active)]"
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
});
StandardTabsTrigger.displayName = "StandardTabsTrigger";

export { StandardTabsTrigger };