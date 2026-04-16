// En: /components/ui/StandardTabs/StandardTabsTrigger.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { useStandardTabs } from "./standard-tabs-context";

const StandardTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const context = useStandardTabs();

  const stateTokens = React.useMemo(() => {
    if (!context.tokens) return null;
    return context.tokens.tabs[context.colorScheme][context.styleType][context.size].trigger;
  }, [context.tokens, context.colorScheme, context.styleType, context.size]);

  if (!stateTokens) {
    return <TabsPrimitive.Trigger ref={ref} className={className} {...props}>{children}</TabsPrimitive.Trigger>;
  }

  const { active, inactive, hover, disabled } = stateTokens;
  const triggerTokens = props.disabled ? disabled : inactive;

  const triggerVars = {
    '--bg-inactive': inactive.background,
    '--bg-hover': hover.background,
    '--bg-active': active.background,
    '--text-inactive': inactive.color,
    '--text-hover': hover.color,
    '--text-active': active.color,
    '--border-inactive': inactive.borderBottomColor,
    '--border-active': active.borderBottomColor,
    '--font-weight-inactive': inactive.fontWeight,
    '--font-weight-active': active.fontWeight,
    '--opacity': triggerTokens.opacity,
    '--cursor': triggerTokens.cursor,
    '--padding': triggerTokens.padding,
    '--font-size': triggerTokens.fontSize,
  } as React.CSSProperties;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      style={triggerVars}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200",
        "p-[var(--padding)] text-base font-medium",
        "opacity-[var(--opacity)] cursor-[var(--cursor)] text-[var(--font-size)]",
        "bg-[var(--bg-inactive)] text-[var(--text-inactive)] font-[var(--font-weight-inactive)] border-b-2 border-[var(--border-inactive)]",
        "hover:bg-[var(--bg-hover)] hover:text-[var(--text-hover)]",
        "data-[state=active]:bg-[var(--bg-active)] data-[state=active]:text-[var(--text-active)] data-[state=active]:font-[var(--font-weight-active)] data-[state=active]:border-[var(--border-active)]",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
});
StandardTabsTrigger.displayName = "StandardTabsTrigger";

export { StandardTabsTrigger };