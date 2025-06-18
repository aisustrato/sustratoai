// 📍 lib/theme/components/standard-switch-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import { type AppColorTokens, type ColorSchemeVariant, type ColorShade } from '../ColorToken';
import tinycolor from "tinycolor2"; // Importamos la librería para manipular colores
//#endregion ![head]


//#region [def] - 📦 INTERFACES, TYPES & VARIANTS 📦

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchStateTokens {
  trackBackground: string;
  thumbBackground: string;
  thumbBorderColor?: string;
}

export interface SwitchColorSchemeTokens {
  on: SwitchStateTokens;
  off: SwitchStateTokens;
  disabled: SwitchStateTokens;
}

export interface SwitchSizeValues {
  width: string;
  height: string;
  thumbSize: string;
  thumbTranslate: string;
}

export type StandardSwitchColorTokens = Record<ColorSchemeVariant, SwitchColorSchemeTokens>;

export type StandardSwitchSizeTokens = Record<SwitchSize, SwitchSizeValues>;

//#endregion ![def]


//#region [main] - 🏭 TOKEN GENERATOR 🏭

export const generateStandardSwitchTokens = (appColorTokens: AppColorTokens, mode: 'light' | 'dark') => {

    const sizeTokens: StandardSwitchSizeTokens = {
        sm: { height: '20px', width: '36px', thumbSize: '16px', thumbTranslate: '16px' },
        md: { height: '24px', width: '44px', thumbSize: '20px', thumbTranslate: '20px' },
        lg: { height: '32px', width: '60px', thumbSize: '28px', thumbTranslate: '28px' },
    };

    const colorTokens = {} as StandardSwitchColorTokens;
    const colorSchemes = Object.keys(appColorTokens) as ColorSchemeVariant[];
    const neutralTokens = appColorTokens.neutral;
    const primaryTokens = appColorTokens.primary;

    for (const scheme of colorSchemes) {
        const color = appColorTokens[scheme] as ColorShade;

        colorTokens[scheme] = {
            on: {
                trackBackground: scheme === 'neutral' ? primaryTokens.bg : color.bg,
                thumbBackground: scheme === 'neutral' ? primaryTokens.text : color.text,
            },
            off: {
                // ✨ CORRECCIÓN: Usamos un color sólido y visible para el fondo en estado 'off'.
                // Se oscurece levemente el fondo neutral para asegurar contraste.
                trackBackground: tinycolor(neutralTokens.bg).darken(10).toRgbString(),
                thumbBackground: mode === 'light' ? neutralTokens.bg : tinycolor(neutralTokens.bg).lighten(5).toRgbString(),
                thumbBorderColor: tinycolor(neutralTokens.bg).darken(10).toRgbString(),
            },
            disabled: {
                trackBackground: tinycolor(neutralTokens.bg).setAlpha(0.15).toRgbString(),
                thumbBackground: tinycolor(neutralTokens.text).setAlpha(0.4).toRgbString(),
            }
        };
    }

    return { colorTokens, sizeTokens };
};

//#endregion ![main]