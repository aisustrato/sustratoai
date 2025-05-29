"use client";

import React, { useMemo } from "react";
import { Text } from "./text";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateBadgeTokens,
  type BadgeTokens,
  type BadgeTokenSet,
  type BadgeVariant,
} from "@/lib/theme/components/badge-tokens";

export interface BadgeCustomProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  bordered?: boolean;
  children: React.ReactNode;
  subtle?: boolean;
}

const baseBadgeClasses = "inline-flex items-center rounded-full px-2.5 py-0.5";

// Copiar o importar hexToRgba si no está ya disponible en este archivo
// Por simplicidad, la copiamos aquí. En un proyecto real, sería mejor importarla de un utils.
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

export function BadgeCustom({
  variant = "neutral",
  bordered = false,
  children,
  className,
  subtle = false,
  ...props
}: BadgeCustomProps) {
  const { appColorTokens } = useTheme();

  const allBadgeTokens: BadgeTokens | null = useMemo(() => {
    if (!appColorTokens) return null;
    return generateBadgeTokens(appColorTokens);
  }, [appColorTokens]);

  if (!allBadgeTokens) {
    return (
      <div
        className={cn(
          baseBadgeClasses,
          "bg-gray-200 text-gray-700",
          bordered ? "border border-gray-300" : "border border-transparent",
          className
        )}
        {...props}
      >
        <Text size="xs" weight="medium" fontType="body">
          {children}
        </Text>
      </div>
    );
  }

  const currentTokens: BadgeTokenSet = allBadgeTokens[variant];

  let finalBackgroundColor: string;
  if (subtle) {
    if (currentTokens.subtleBackgroundColor !== "transparent") {
      finalBackgroundColor = hexToRgba(
        currentTokens.subtleBackgroundColor,
        0.8
      );
    } else {
      finalBackgroundColor = "transparent";
    }
  } else {
    finalBackgroundColor = currentTokens.background;
  }

  let borderColorForStyle = currentTokens.borderColor;
  if (subtle) {
    borderColorForStyle = currentTokens.subtleBorderColor;
  } else if (bordered && currentTokens.borderColor === "transparent") {
    borderColorForStyle = currentTokens.contrastTextColor;
  }

  const dynamicStyles: React.CSSProperties = {
    backgroundColor: finalBackgroundColor,
  };

  if (
    bordered ||
    (variant === "outline" && !subtle) ||
    (subtle && borderColorForStyle !== "transparent")
  ) {
    dynamicStyles.borderColor = borderColorForStyle;
    dynamicStyles.borderWidth = "1px";
    dynamicStyles.borderStyle = "solid";
  } else {
    dynamicStyles.borderColor = "transparent";
    dynamicStyles.borderWidth = "1px";
    dynamicStyles.borderStyle = "solid";
  }

  const textComponentColor = subtle
    ? currentTokens.regularTextColor
    : currentTokens.contrastTextColor;

  return (
    <div
      className={cn(baseBadgeClasses, className)}
      style={dynamicStyles}
      {...props}
    >
      <Text
        size="xs"
        weight="medium"
        fontType="body"
        style={{ color: textComponentColor }}
      >
        {children}
      </Text>
    </div>
  );
}
