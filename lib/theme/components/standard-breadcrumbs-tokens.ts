import { AppColorTokens, ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { Mode } from "@/lib/theme/ColorToken";

export type BreadcrumbVariant = 'default' | 'bold';

export interface BreadcrumbTokenOptions {
  colorScheme: ColorSchemeVariant;
  variant: BreadcrumbVariant;
  isLast: boolean;
  isHovered: boolean;
}

export interface BreadcrumbTokenStyles {
  color: string;
  textDecoration: string;
  cursor: string;
  transition: string;
  fontWeight?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface StandardBreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  colorScheme?: ColorSchemeVariant;
  variant?: BreadcrumbVariant;
  className?: string;
  style?: React.CSSProperties;
}

export function generateBreadcrumbTokens(
  appTokens: AppColorTokens,
  mode: Mode,
  options: BreadcrumbTokenOptions
): BreadcrumbTokenStyles {
  const { colorScheme = 'neutral', variant = 'default', isLast = false, isHovered = false } = options;
  
  // Obtener la paleta de colores del tema
  const palette = appTokens[colorScheme] || appTokens.neutral;
  const neutralPalette = appTokens.neutral;
  
  // Estilos base
  const baseStyles: BreadcrumbTokenStyles = {
    // Último ítem: neutral.pureshade, otros: neutral.pure
    color: isLast ? neutralPalette.pureShade : neutralPalette.pure,
    textDecoration: 'none',
    cursor: isLast ? 'default' : 'pointer',
    transition: 'color 0.2s ease-in-out',
  };

  // Aplicar estilos de hover para ítems que no son el último
  if (isHovered && !isLast) {
    // Cambiar a primary/pure en hover
    baseStyles.color = palette.pure;
  }

  // Aplicar variante bold si es necesario
  if (variant === 'bold' && isLast) {
    baseStyles.fontWeight = 600;
  }

  return baseStyles;
}
