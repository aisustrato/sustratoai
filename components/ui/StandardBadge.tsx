"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateStandardBadgeTokens,
  type StandardBadgeStyleType,
  type StandardBadgeSize, // Importamos el tipo de tamaño unificado
  BADGE_SIZE_DEFINITIONS,  // 📌 Importamos el nuevo mapa de tamaños
} from "@/lib/theme/components/standard-badge-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardText } from "./StandardText";
import { StandardIcon } from "./StandardIcon";

// 📌 El 'cva' ahora solo se ocupa de la estructura base, no del tamaño.
const badgeBaseVariants = cva(
  "inline-flex items-center justify-center gap-x-1.5 rounded-full border font-medium"
);

export interface StandardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  colorScheme?: ColorSchemeVariant;
  styleType?: StandardBadgeStyleType;
  size?: StandardBadgeSize; // Usamos nuestro tipo de tamaño unificado
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  children: React.ReactNode;
}

const StandardBadge = React.forwardRef<HTMLDivElement, StandardBadgeProps>(
  (
    {
      className,
      colorScheme = "primary",
      styleType = "subtle",
      size = "md", // El default se mantiene
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      iconClassName,
      children,
      ...props
    },
    ref
  ) => {
    const { appColorTokens } = useTheme();

    const cssVariables = React.useMemo(() => {
      const allTokens = generateStandardBadgeTokens(appColorTokens);
      const styleSet = allTokens[colorScheme]?.[styleType] || allTokens.primary.solid;
      return {
        '--badge-bg': styleSet.bg,
        '--badge-text-color': styleSet.text,
        '--badge-border-color': styleSet.border,
      } as React.CSSProperties;
    }, [appColorTokens, colorScheme, styleType]);

    if (!children) {
      return (
        <div
          className={cn(
            badgeBaseVariants({ className }),
            "opacity-0",
            className
          )}
          style={cssVariables}
          {...props}
        >
          <span className="opacity-0">{children}</span>
        </div>
      );
    }

    const { mode } = useTheme();

    if (!appColorTokens || !mode) {
      const fallbackSizeInfo = BADGE_SIZE_DEFINITIONS[size];
      return (
        <div
          ref={ref}
          className={cn(
            badgeBaseVariants(),
            fallbackSizeInfo.padding,
            "bg-gray-200 border-transparent animate-pulse",
            className
          )}
          {...props}
        >
          <span className="opacity-0">{children}</span>
        </div>
      );
    }

    const sizeInfo = BADGE_SIZE_DEFINITIONS[size];

    return (
      <div
        ref={ref}
        style={cssVariables}
        className={cn(
          badgeBaseVariants(),
          sizeInfo.padding, // Aplicamos el padding desde los tokens
          "bg-[var(--badge-bg)] border-[var(--badge-border-color)] text-[var(--badge-text-color)]",
          className
        )}
        {...props}
      >
        {LeftIcon && (
          <StandardIcon
            size={sizeInfo.iconSize}
            colorScheme={colorScheme}
            colorShade={styleType === "solid" ? "contrastText" : "pure"}
            className={cn("-ml-0.5", iconClassName)}
          >
            <LeftIcon />
          </StandardIcon>
        )}
        <StandardText asElement="span" size={sizeInfo.textSize} weight="medium" className="leading-none">
          {children}
        </StandardText>
        {RightIcon && (
          <StandardIcon
            size={sizeInfo.iconSize}
            colorScheme={colorScheme}
            color={styleType === "solid" ? "contrastText" : "pure"}
            className={cn("-mr-0.5", iconClassName)}
          >
            <RightIcon />
          </StandardIcon>
        )}
      </div>
    );
  }
);
StandardBadge.displayName = "StandardBadge";

export { StandardBadge };