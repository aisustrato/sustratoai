//. 📍 components/ui/StandardBadge.tsx (v2.2 - Patrón de Carga)

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateStandardBadgeTokens,
  type StandardBadgeStyleType,
} from "@/lib/theme/components/standard-badge-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardText, type StandardTextProps } from "./StandardText";
import { StandardIcon } from "./StandardIcon";

//#region [def] - 📦 VARIANTS & INTERFACES 📦

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-x-1.5 rounded-full border font-medium",
  {
    variants: {
      size: {
        xs: "px-0.5 py-0", // Padding reducido, text-xs eliminado
        sm: "px-1.5 py-px",
        md: "px-2 py-0.5",
        lg: "px-2.5 py-0.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface StandardBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  colorScheme?: ColorSchemeVariant;
  styleType?: StandardBadgeStyleType;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}
//#endregion ![def]


//#region [main] - 🧱 COMPONENT 🧱
const StandardBadge = React.forwardRef<HTMLDivElement, StandardBadgeProps>(
  (
    {
      className,
      colorScheme = "primary",
      styleType = "subtle",
      size = "md",
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const { appColorTokens, mode } = useTheme();

    

    // ✅ CORRECCIÓN: La lógica de cálculo de estilos solo se ejecuta si los tokens existen.
    const cssVariables = React.useMemo(() => {
      // Este hook ahora solo se ejecuta cuando appColorTokens y mode son válidos.
      // La condición de guarda se mueve fuera.
      if (!appColorTokens || !mode) return {};

      const allTokens = generateStandardBadgeTokens(appColorTokens);
      const styleSet = allTokens[colorScheme]?.[styleType] || allTokens.primary.subtle;

      return {
        '--badge-bg': styleSet.bg,
        '--badge-text-color': styleSet.text,
        '--badge-border-color': styleSet.border,
      } as React.CSSProperties; // Se añade un cast para asegurar el tipo.

    }, [appColorTokens, colorScheme, styleType, mode]);
    
    // ✅ CORRECCIÓN: Si el tema no ha cargado, renderizamos un fallback.
    // Esto evita que el `useMemo` se ejecute con valores nulos y previene el error de tipado.
    if (!appColorTokens || !mode) {
      // Fallback rendering (igual que antes)
      return (
        <div
          ref={ref}
          className={cn(
            badgeVariants({ size }),
            "bg-gray-200 text-gray-800 border-transparent animate-pulse",
            className
          )}
          {...props}
        >
          <StandardText asElement="span" className="leading-none opacity-0">
            {children}
          </StandardText>
        </div>
      );
    }

    // Determinar textSize, textWeight, e iconSizeClass ANTES del return principal
    let textSizeProp: StandardTextProps['size'] = 'xs'; // Default de StandardText
    let textWeightProp: StandardTextProps['weight'] = 'medium'; // Default de StandardText
    let iconClasses = "h-3.5 w-3.5"; // Default icon size

    switch (size) {
      case 'xs':
        textSizeProp = '3xs';
        textWeightProp = 'normal';
        iconClasses = "h-3 w-3";
        break;
      case 'sm':
        textSizeProp = '2xs';
        textWeightProp = 'medium';
        iconClasses = "h-3 w-3";
        break;
      case 'md':
        textSizeProp = 'xs';
        textWeightProp = 'medium';
        // iconClasses usa el default "h-3.5 w-3.5"
        break;
      case 'lg':
        textSizeProp = 'sm';
        textWeightProp = 'medium';
        // iconClasses usa el default "h-3.5 w-3.5"
        break;
    }

    return (
      <div
        ref={ref}
        style={cssVariables}
        className={cn(
          badgeVariants({ size }),
          "bg-[var(--badge-bg)] border-[var(--badge-border-color)] text-[var(--badge-text-color)]",
          className
        )}
        {...props}
      >
        {LeftIcon && (
          <StandardIcon colorScheme={colorScheme} className={cn("-ml-0.5", iconClasses)}>
            <LeftIcon />
          </StandardIcon>
        )}
        <StandardText asElement="span" size={textSizeProp} weight={textWeightProp} className="leading-none">
          {children}
        </StandardText>
        {RightIcon && (
          <StandardIcon colorScheme={colorScheme} className={cn("-mr-0.5", iconClasses)}>
            <RightIcon />
          </StandardIcon>
        )}
      </div>
    );
  }
);
StandardBadge.displayName = "StandardBadge";

export { StandardBadge, badgeVariants };
//#endregion ![main]