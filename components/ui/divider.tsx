"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateDividerTokens,
  type DividerSize,
  type DividerVariant,
} from "@/lib/theme/components/divider-tokens";
import type { HTMLAttributes } from "react";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DividerVariant;
  size?: DividerSize;
  className?: string;
}

export function Divider({
  variant = "gradient",
  size = "md",
  className,
  ...props
}: DividerProps) {
  const { appColorTokens } = useTheme();

  const dividerTokens = React.useMemo(() => {
    if (!appColorTokens) return null;
    return generateDividerTokens(appColorTokens);
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
