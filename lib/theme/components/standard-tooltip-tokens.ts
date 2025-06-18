//. 📍 lib/theme/components/standard-tooltip-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, Mode, ColorSchemeVariant } from "../ColorToken";
import { neutral } from "../colors";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACES 📦

export type StandardTooltipColorScheme = ColorSchemeVariant;
export type StandardTooltipStyleType = "solid" | "subtle";

export interface TooltipStyleTokens {
    background: string;
    textColor: string;
    borderColor: string;
    shadow: string;
}

export type TooltipTokenSet = Record<StandardTooltipColorScheme, Record<StandardTooltipStyleType, TooltipStyleTokens>>;

//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardTooltipTokens(
    appColorTokens: AppColorTokens,
    mode: Mode,
    isAccentuated: boolean
): TooltipTokenSet {
    const isDark = mode === "dark";

    const tokens: TooltipTokenSet = {} as TooltipTokenSet;

    const allColorSchemes: ColorSchemeVariant[] = [ // ✨ CORREGIDO: 'allColorScheemes' cambiado a 'allColorSchemes'
        'primary', 'secondary', 'tertiary', 'accent', 'neutral', 'white', 'success', 'warning', 'danger'
    ];

    allColorSchemes.forEach((scheme: ColorSchemeVariant) => { // ✨ CORREGIDO: 'scheme' tipado explícitamente como ColorSchemeVariant
        const tokenShade = appColorTokens[scheme]; // ✨ CORREGIDO: Acceso seguro al índice 'scheme'
        if (!tokens[scheme]) { // ✨ CORREGIDO: Acceso seguro al índice 'scheme'
            tokens[scheme] = {} as Record<StandardTooltipStyleType, TooltipStyleTokens>;
        }

        // --- Definición de colores base antes de aplicar isAccentuated ---
        let baseSolidBackground: string;
        let baseSolidTextColor: string;
        let baseSolidBorderColor: string;
        let baseSubtleBackground: string;
        let baseSubtleTextColor: string;
        let baseSubtleBorderColor: string;

        // Lógica para 'solid' styleType
        if (scheme === 'white') {
            baseSolidBackground = neutral.white;
            baseSolidTextColor = neutral.gray[900];
            baseSolidBorderColor = neutral.gray[200];
            if (isDark) {
                baseSolidBackground = neutral.gray[800];
                baseSolidTextColor = neutral.gray[100];
                baseSolidBorderColor = neutral.gray[700];
            }
        } else if (scheme === 'neutral') {
            baseSolidBackground = isDark ? neutral.gray[700] : neutral.gray[200];
            baseSolidTextColor = isDark ? neutral.gray[100] : neutral.gray[900];
            baseSolidBorderColor = isDark ? neutral.gray[600] : neutral.gray[300];
        } else if (tokenShade) {
            baseSolidBackground = tokenShade.bg;
            baseSolidTextColor = tokenShade.text;
            baseSolidBorderColor = tokenShade.bgShade;
        } else {
             baseSolidBackground = isDark ? neutral.gray[700] : neutral.gray[200];
             baseSolidTextColor = isDark ? neutral.gray[100] : neutral.gray[900];
             baseSolidBorderColor = isDark ? neutral.gray[600] : neutral.gray[300];
        }

        // Lógica para 'subtle' styleType (con opacidad mejorada)
        const subtleOpacityDark = 0.9;
        const subtleOpacityLight = 0.98;

        if (scheme === 'white') {
            baseSubtleBackground = isDark ? neutral.gray[800] : neutral.white;
            baseSubtleTextColor = isDark ? neutral.gray[100] : neutral.gray[900];
            baseSubtleBorderColor = isDark ? neutral.gray[700] : neutral.gray[200];
        } else if (scheme === 'neutral') {
            baseSubtleBackground = isDark ? neutral.gray[700] : neutral.gray[200];
            baseSubtleTextColor = isDark ? neutral.gray[100] : neutral.gray[900];
            baseSubtleBorderColor = isDark ? neutral.gray[600] : neutral.gray[300];
        } else if (tokenShade) {
            baseSubtleBackground = tinycolor(tokenShade.bg).setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight).toRgbString();
            baseSubtleTextColor = tokenShade.text;
            baseSubtleBorderColor = tinycolor(tokenShade.bgShade).setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight).toRgbString();
        } else {
            baseSubtleBackground = tinycolor(isDark ? neutral.gray[700] : neutral.gray[200]).setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight).toRgbString();
            baseSubtleTextColor = isDark ? neutral.gray[100] : neutral.gray[900];
            baseSubtleBorderColor = tinycolor(isDark ? neutral.gray[600] : neutral.gray[300]).setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight).toRgbString();
        }

        // --- Aplicar la lógica de isAccentuated ---
        // Esto sobrescribe los colores base si isAccentuated es true
        if (isAccentuated) {
            // Fondo blanco
            const accentuatedBackground = neutral.white;
            // Texto primary.text
            const accentuatedTextColor = appColorTokens.primary?.text || neutral.gray[900];
            // Borde accent.pure
            const accentuatedBorderColor = appColorTokens.accent?.pure || neutral.gray[500];

            // Para 'solid' styleType cuando isAccentuated
            tokens[scheme].solid = {
                background: accentuatedBackground,
                textColor: accentuatedTextColor,
                borderColor: accentuatedBorderColor,
                shadow: isDark ? "0px 6px 15px rgba(0, 0, 0, 0.4)" : "0px 6px 15px rgba(0, 0, 0, 0.2)",
            };

            // Para 'subtle' styleType cuando isAccentuated (fondo blanco semitransparente con los mismos colores de texto/borde)
            const accentuatedSubtleBackground = tinycolor(neutral.white).setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight).toRgbString();
            tokens[scheme].subtle = {
                background: accentuatedSubtleBackground,
                textColor: accentuatedTextColor,
                borderColor: accentuatedBorderColor,
                shadow: isDark ? "0px 4px 10px rgba(0, 0, 0, 0.3)" : "0px 4px 10px rgba(0, 0, 0, 0.08)",
            };
        } else {
            // Si isAccentuated es false, usamos los colores base calculados previamente
            tokens[scheme].solid = {
                background: baseSolidBackground,
                textColor: baseSolidTextColor,
                borderColor: baseSolidBorderColor,
                shadow: isDark ? "0px 4px 10px rgba(0, 0, 0, 0.4)" : "0px 4px 10px rgba(0, 0, 0, 0.15)",
            };
            tokens[scheme].subtle = {
                background: baseSubtleBackground,
                textColor: baseSubtleTextColor,
                borderColor: baseSubtleBorderColor,
                shadow: isDark ? "0px 4px 10px rgba(0, 0, 0, 0.3)" : "0px 4px 10px rgba(0, 0, 0, 0.08)",
            };
        }
    });

    return tokens;
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Types, Interface, and Generator Function are exported above.
//#endregion ![foo]