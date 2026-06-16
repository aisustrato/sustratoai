// 📍 components/mdj-viewer/AnotacionMarca.tsx
// 'use client' — highlight visual para anotaciones, usa el sistema de tema.
// Recibe colorScheme (primary, secondary, tertiary, accent, success, etc.)
// y aplica colores vía useTheme() → appColorTokens → inline styles.
//
// Uso:
//   <AnotacionMarca colorScheme="accent">texto</AnotacionMarca>
//   <AnotacionMarca colorScheme="secondary" activa>texto</AnotacionMarca>

"use client";

import { useTheme } from "@/app/theme-provider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

interface AnotacionMarcaProps {
  colorScheme: ColorSchemeVariant;
  children: React.ReactNode;
  onClick?: () => void;
  activa?: boolean;
  className?: string;
}

export function AnotacionMarca({
  colorScheme,
  children,
  onClick,
  activa = false,
  className = "",
}: AnotacionMarcaProps) {
  const { appColorTokens } = useTheme();
  const shade = appColorTokens[colorScheme];

  const baseStyle: React.CSSProperties = {
    backgroundColor: shade.bg,
    borderBottom: `2px solid ${shade.bgShade}`,
    cursor: "pointer",
    borderRadius: "2px",
    padding: "0 2px",
    transition: "all 0.2s ease",
  };

  const hoverStyle: React.CSSProperties = {
    backgroundColor: shade.bgShade,
  };

  const activeStyle: React.CSSProperties = activa
    ? {
        boxShadow: `0 0 0 2px ${shade.pure}`,
        outlineOffset: "1px",
      }
    : {};

  return (
    <span
      className={className}
      style={{ ...baseStyle, ...activeStyle }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyle);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, baseStyle, activeStyle);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {children}
    </span>
  );
}
