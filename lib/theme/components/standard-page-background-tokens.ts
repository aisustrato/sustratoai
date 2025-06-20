import type { Mode, AppColorTokens } from "../ColorToken";

// Tipos de variantes para PageBackground
export type StandardPageBackgroundVariant =
  | "default"
  | "gradient"
  | "subtle"
  | "minimal";

// Estructura de tokens para PageBackground
export type StandardPageBackgroundTokens = {
  background: string;
  backgroundImage: string;
};

/**
 * Genera los tokens para PageBackground según la variante, AppColorTokens y modo
 */
export function generateStandardPageBackgroundTokens(
  appTokens: AppColorTokens,
  mode: Mode,
  variant: StandardPageBackgroundVariant
): StandardPageBackgroundTokens {
  const isDark = mode === "dark";

  // Color de fondo base derivado de AppColorTokens
  const baseBackgroundColor = appTokens.neutral.bg;

  // Colores para los gradientes (asumiendo que .pure son HEX)
  const themePrimaryPure = appTokens.primary.pure;
  const globalAccentPure = appTokens.accent.pure;

  // Opacidades HEX para los toques de color (muy sutiles)
  const touchOpacityHex = isDark ? "0A" : "10"; // ~4% y ~6%
  const defaultOpacityHex = isDark ? "0F" : "1A"; // ~6% y ~10%

  // Opacidades para gradientes radiales (originales, concatenadas a HEX)
  const subtleOpacityRadial = isDark ? "15" : "20";

  // Opacidad HEX muy sutil para el tinte de primary.pure en la variante "gradient"
  const primaryPureTintOpacityGradient = isDark ? "1A" : "26"; // ~10% para oscuro, ~15% para claro (ajustable)
  // Para accent.bg, generalmente no necesitaremos opacidad adicional en el gradiente si ya es un color de fondo.


  // Generar tokens según la variante
  switch (variant) {
    case "gradient":
      return {
        background: baseBackgroundColor,
        backgroundImage: `
          radial-gradient(circle at top right, ${appTokens.primary.pure}${primaryPureTintOpacityGradient}, transparent 25%),
          radial-gradient(circle at bottom left, ${appTokens.accent.bg}, transparent 15%)
        `,
      };

    case "subtle":
      return {
        background: baseBackgroundColor,
        backgroundImage: `
          radial-gradient(circle at top right, ${themePrimaryPure}${subtleOpacityRadial}, transparent 70%),
          radial-gradient(circle at bottom left, ${globalAccentPure}${subtleOpacityRadial}, transparent 70%)
        `,
      };

    case "minimal":
      return {
        background: baseBackgroundColor,
        backgroundImage: `
          linear-gradient(to bottom, 
            ${themePrimaryPure}${touchOpacityHex} 0%, 
            transparent 40%, 
            transparent 60%, 
            ${globalAccentPure}${touchOpacityHex} 100%
          )
        `,
      };

    case "default": // Cambiado para usar los nuevos toques de color y gradientes duales
      return {
        background: baseBackgroundColor,
        backgroundImage: `
          linear-gradient(to top, 
            ${themePrimaryPure}${defaultOpacityHex} 0%, 
            transparent 50%
          ),
          linear-gradient(to bottom,
            ${globalAccentPure}${defaultOpacityHex} 0%,
            transparent 50%
          )
        `,
      };

    default: // Fallback por si se añade una variante y no se maneja (aunque TypeScript debería ayudar)
      return {
        background: baseBackgroundColor,
        backgroundImage: `linear-gradient(to bottom, ${themePrimaryPure}${touchOpacityHex}, transparent 80%)`,
      };
  }
}
