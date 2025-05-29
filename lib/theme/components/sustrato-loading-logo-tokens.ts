import type { AppColorTokens, Mode } from "../ColorToken";
import type { ColorShade } from "../colors"; // Asegúrate que ColorShade se exporte desde colors.ts o ColorToken.ts

/**
 * Estructura de los tokens de color específicos para SustratoLoadingLogo.
 */
export type SustratoLoadingLogoComponentTokens = {
  colors: {
    primary: Pick<ColorShade, "pure" | "text">; // Solo necesitamos 'pure' y 'text'
    secondary: Pick<ColorShade, "pure">; // Solo 'pure'
    accent: ColorShade; // Necesitamos toda la paleta accent para transiciones
  };
};

/**
 * Genera los tokens de color para el componente SustratoLoadingLogo
 * utilizando los AppColorTokens globales.
 *
 * @param appTokens Los tokens de color globales de la aplicación.
 * @param mode El modo actual ('light' o 'dark'). No se usa directamente aquí, pero es buena práctica pasarlo.
 * @returns Un objeto con los colores necesarios para SustratoLoadingLogo.
 */
export function generateSustratoLoadingLogoTokens(
  appTokens: AppColorTokens | any, // Permitir 'any' para compatibilidad inicial si viene de un contexto antiguo
  mode: Mode
): SustratoLoadingLogoComponentTokens {
  // Fallback defensivo si appTokens no tiene la estructura esperada
  const safeAppTokens =
    appTokens && typeof appTokens === "object" && appTokens.primary
      ? (appTokens as AppColorTokens)
      : ({
          // Provide un mock/fallback seguro si appTokens no es válido
          primary: { pure: "#3D7DF6", text: "#1f4487" },
          secondary: { pure: "#516e99" },
          accent: {
            pure: "#8A4EF6",
            pureShade: "#683BB9",
            text: "#5A3E9C",
            contrastText: "#F3EDFE",
            textShade: "#4D2C8A",
            bg: "#E8D9F9",
            bgShade: "#AEA3BB",
            // Asegúrate de incluir pureDark y textDark si interpolateColor los necesita explícitamente
            // o si ColorShade los requiere. Si no, puedes omitirlos si usas los alias.
            pureDark: "#683BB9",
            textDark: "#4D2C8A",
          },
        } as unknown as AppColorTokens); // Usa unknown para forzar el tipo seguro

  return {
    colors: {
      primary: {
        pure: safeAppTokens.primary.pure,
        text: safeAppTokens.primary.text,
      },
      secondary: {
        pure: safeAppTokens.secondary.pure,
      },
      // Aseguramos que accent tenga todos los campos requeridos por ColorShade
      // Si generate... solo necesita algunos, podríamos ser más específicos,
      // pero pasar el objeto completo es más simple si la estructura coincide.
      accent: safeAppTokens.accent,
    },
  };
}
