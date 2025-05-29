"use client";

import React from "react";
import { cn } from "@/lib/utils";
// import { useColorTokens } from "@/hooks/use-color-tokens"; // Eliminado
import { useTheme } from "@/app/theme-provider"; // Añadido
import {
  generateIconTokens, // Añadido
  type IconColor,
  type IconSize,
  type IconColorToken, // Asegurarse que IconColorToken (con 'shade') está exportado
} from "@/lib/theme/components/icon-tokens"; // Ruta actualizada si es necesario

// Propiedades para el componente Icon
export interface IconProps {
  color?: IconColor;
  colorVariant?: "pure" | "text" | "shade" | "bg"; // 'dark' reemplazado por 'shade'
  size?: IconSize;
  className?: string;
  gradient?: boolean;
  gradientWith?: IconColor;
  gradientColorVariant?: "pure" | "text" | "shade" | "bg"; // 'dark' reemplazado por 'shade'
  strokeOnly?: boolean;
  inverseStroke?: boolean;
  children?: React.ReactNode;
}
export type Color = "default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral" | "danger" | "success";
/**
 * Componente Icon
 * Renderiza un icono con estilos consistentes basados en el sistema de tokens
 */
export function Icon({
  color = "default",
  colorVariant = "text", // colorVariant ahora es "pure" | "text" | "shade" | "bg"
  size = "md",
  className,
  gradient = false,
  gradientWith = "accent",
  gradientColorVariant = "text", // gradientColorVariant ahora es "pure" | "text" | "shade" | "bg"
  strokeOnly = false,
  inverseStroke,
  children,
  ...props
}: IconProps) {
  // const { component } = useColorTokens(); // Eliminado
  // const legacyIconTokens = component.icon; // Eliminado

  const { appColorTokens, mode } = useTheme(); // Añadido

  const iconComponentTokens = React.useMemo(() => { // Añadido
    if (!appColorTokens) return null;
    // generateIconTokens ahora usa AppColorTokens y devuelve la estructura con 'shade'
    return generateIconTokens(appColorTokens, mode);
  }, [appColorTokens, mode]);

  // Si gradient=true y inverseStroke no está definido, lo establecemos como true
  // Esto hace que el gradiente inverso sea el comportamiento predeterminado
  const useInverseStroke = gradient && inverseStroke !== false;

  // Mapeo de tamaños a clases de Tailwind
  const sizeClasses: Record<IconSize, string> = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
    "2xl": "w-12 h-12",
  };

  // Obtener el color del token correspondiente
  const getColorValue = (
    targetColor: IconColor,
    variant: "pure" | "text" | "shade" | "bg"
  ): string => {
    if (!iconComponentTokens?.colors) return "currentColor";
    const tokenSet = iconComponentTokens.colors[targetColor];
    // La propiedad 'variant' ("pure", "text", "shade", "bg") debe existir en IconColorToken
    return tokenSet ? tokenSet[variant] || tokenSet.text : "currentColor";
  };

  const finalIconColor = getColorValue(color, colorVariant);

  // Crear un ID único para el gradiente
  const gradientId = React.useId();
  const strokeGradientId = React.useId();
  const inverseGradientId = React.useId();

  // Obtener colores para el gradiente
  let baseGradientColor = "currentColor";
  let secondGradientColor = "currentColor";

  if (iconComponentTokens?.colors) {
    const mainColorSet = iconComponentTokens.colors[color];
    if (mainColorSet) {
      baseGradientColor = strokeOnly // Corregido: 'baseColor' a 'baseGradientColor'
        ? mainColorSet.pure
        : mainColorSet.bg;
    }
    // Para el color secundario usamos la variante especificada
    // getColorValue ya maneja la variante "pure", "text", "shade", "bg"
    secondGradientColor = getColorValue(gradientWith, gradientColorVariant);
  }


  // Crear un gradiente si se solicita
  const getIconStyle = () => {
    if (!gradient) {
      return { color: finalIconColor }; // Usar finalIconColor
    }

    if (strokeOnly) {
      return {
        stroke: `url(#${strokeGradientId})`,
        fill: "none", // Aseguramos que no haya relleno
      };
    }

    if (useInverseStroke) {
      return {
        fill: `url(#${gradientId})`,
        stroke: `url(#${inverseGradientId})`, // Usamos el gradiente inverso para el stroke
      };
    }

    return {
      fill: `url(#${gradientId})`,
      stroke: `url(#${gradientId})`, // Stroke usa el mismo gradiente que fill
    };
  };

  return (
    <>
      {gradient && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            {/* Gradiente para relleno */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={baseGradientColor} />
              <stop offset="100%" stopColor={secondGradientColor} />
            </linearGradient>
            {/* Gradiente para el contorno (stroke) si es diferente */}
            <linearGradient
              id={strokeGradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={baseGradientColor} />
              <stop offset="100%" stopColor={secondGradientColor} />
            </linearGradient>
            {/* Gradiente inverso para el contorno (stroke) */}
            <linearGradient
              id={inverseGradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={secondGradientColor} /> {/* Invertido */}
              <stop offset="100%" stopColor={baseGradientColor} /> {/* Invertido */}
            </linearGradient>
          </defs>
        </svg>
      )}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            className: cn(sizeClasses[size], className),
            style: getIconStyle(),
            ...props, // Pasar el resto de las props al icono hijo (ej. Lucide icon)
          });
        }
        return child;
      })}
    </>
  );
}

/**
 * Función para crear un componente de icono preconfigurado
 * @param icon El icono de Lucide a utilizar
 * @param defaultProps Propiedades por defecto para el icono
 * @returns Un componente React que renderiza el icono con las propiedades especificadas
 */
export function createIcon(
  IconComponent: React.ComponentType<any>,
  defaultProps: Partial<IconProps> = {}
) {
  const WrappedIcon = (props: Partial<IconProps>) => (
    <Icon {...defaultProps} {...props} />
  );

  WrappedIcon.displayName = `Icon(${IconComponent.displayName || "Icon"})`;
  return WrappedIcon;
}
