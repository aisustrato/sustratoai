"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { DividerSize, DividerVariant } from "@/app/providers/DesignTokensProvider";
import type { HTMLAttributes } from "react";

export interface StandardDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DividerVariant;
  size?: DividerSize;
  className?: string;
}

export function StandardDivider({
  variant = "gradient",
  size = "md",
  className,
  ...props
}: StandardDividerProps) {
  const { tokens } = useDesignTokens();

  const dividerStyle = useMemo(() => {
    if (!tokens) return null;
    
    const sizeTokens = tokens.divider.sizes[size];
    const variantTokens = tokens.divider.styles[variant];
    
    const style: React.CSSProperties = {
      height: sizeTokens.height,
      width: sizeTokens.width,
      borderRadius: sizeTokens.borderRadius,
    };
    
    if (variant === "gradient" && variantTokens.backgroundImage) {
      style.backgroundImage = variantTokens.backgroundImage;
    } else if (variantTokens.background) {
      style.background = variantTokens.background;
    }
    
    return style;
  }, [tokens, variant, size]);

  if (!dividerStyle) {
    return (
      <div
        className={cn("h-0.5 w-16 bg-primary rounded-full mx-auto", className)}
        {...props}
      />
    );
  }

  return <div className={cn("mx-auto", className)} style={dividerStyle} {...props} />;
}
