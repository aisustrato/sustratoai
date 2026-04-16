// En: /components/ui/StandardTabs/StandardTabsList.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { useStandardTabs } from "./standard-tabs-context";

const StandardTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const context = useStandardTabs();

  const listTokens = React.useMemo(() => {
    if (!context.tokens) return null;
    return context.tokens.tabs[context.colorScheme][context.styleType][context.size].list;
  }, [context.tokens, context.colorScheme, context.styleType, context.size]);

  if (!listTokens) {
    return <TabsPrimitive.List ref={ref} className={className} {...props} />;
  }

  const listStyles: React.CSSProperties = {
    borderBottomWidth: listTokens.borderBottomWidth,
    borderBottomColor: listTokens.borderBottomColor,
    width: '100%',
  };

  return (
    <div style={listStyles}>
        <TabsPrimitive.List
            ref={ref}
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