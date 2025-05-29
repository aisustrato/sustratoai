import type * as React from "react";
import { useMemo } from "react";
import { useTheme } from "@/app/theme-provider";
import {
  generateBadgeTokens,
  type BadgeTokens,
  type BadgeVariant,
} from "@/lib/theme/components/badge-tokens";

import { cn } from "@/lib/utils";

const baseBadgeClasses =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== "string") return `rgba(0,0,0,${alpha})`;
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = Number.parseInt(hex[1] + hex[1], 16);
    g = Number.parseInt(hex[2] + hex[2], 16);
    b = Number.parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = Number.parseInt(hex.slice(1, 3), 16);
    g = Number.parseInt(hex.slice(3, 5), 16);
    b = Number.parseInt(hex.slice(5, 7), 16);
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  subtle?: boolean;
}

function Badge({
  className,
  variant = "default",
  subtle = false,
  ...props
}: BadgeProps) {
  const { appColorTokens } = useTheme();

  const badgeTokens: BadgeTokens | null = useMemo(() => {
    if (!appColorTokens) return null;
    return generateBadgeTokens(appColorTokens);
  }, [appColorTokens]);

  if (!badgeTokens) {
    return (
      <div
        className={cn(
          baseBadgeClasses,
          "bg-gray-200 text-gray-700 border-transparent",
          className
        )}
        {...props}
      />
    );
  }

  const currentTokenSet = badgeTokens[variant];

  let finalBackgroundColor = currentTokenSet.background;
  if (subtle) {
    if (currentTokenSet.subtleBackgroundColor !== "transparent") {
      finalBackgroundColor = hexToRgba(
        currentTokenSet.subtleBackgroundColor,
        0.8
      );
    } else {
      finalBackgroundColor = "transparent";
    }
  }

  const finalTextColor = subtle
    ? currentTokenSet.regularTextColor
    : currentTokenSet.contrastTextColor;

  const dynamicStyles: React.CSSProperties = {
    backgroundColor: finalBackgroundColor,
    color: finalTextColor,
    borderColor: subtle
      ? currentTokenSet.subtleBorderColor
      : currentTokenSet.borderColor,
    borderWidth:
      (subtle && currentTokenSet.subtleBorderColor !== "transparent") ||
      (!subtle && currentTokenSet.borderColor !== "transparent")
        ? "1px"
        : "initial",
    borderStyle:
      (subtle && currentTokenSet.subtleBorderColor !== "transparent") ||
      (!subtle && currentTokenSet.borderColor !== "transparent")
        ? "solid"
        : "initial",
  };

  return (
    <div
      className={cn(baseBadgeClasses, className)}
      style={dynamicStyles}
      {...props}
    />
  );
}

export { Badge };
