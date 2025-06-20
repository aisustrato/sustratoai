"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateStandardDividerTokens,
  type StandardDividerSize,
  type StandardDividerVariant,
} from "@/lib/theme/components/standard-divider-tokens";
import type { HTMLAttributes } from "react";

export interface StandardDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: StandardDividerVariant;
  size?: StandardDividerSize;
  className?: string;
}

export function StandardDivider({
  variant = "gradient",
  size = "md",
  className,
  ...props
}: StandardDividerProps) {
  const { appColorTokens } = useTheme();

  const dividerTokens = useMemo(() => {
    if (!appColorTokens) return null;
    return generateStandardDividerTokens(appColorTokens);
  }, [appColorTokens]);

  if (!dividerTokens) {
    return (
      <div
        className={cn("h-0.5 w-16 bg-primary rounded-full mx-auto", className)}
        {...props}
      />
    );
  }

  const variantStyle = dividerTokens.variants[variant];
  const sizeStyle = dividerTokens.sizes[size];

  const style: React.CSSProperties = {
    height: sizeStyle.height,
    width: sizeStyle.width,
    borderRadius: sizeStyle.borderRadius,
  };

  if (variant === "gradient") {
    style.backgroundImage = (
      variantStyle as { backgroundImage: string }
    ).backgroundImage;
  } else {
    style.background = (variantStyle as { background: string }).background;
  }

  return <div className={cn("mx-auto", className)} style={style} {...props} />;
}
