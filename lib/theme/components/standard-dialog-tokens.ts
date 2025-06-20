//. 📍 lib/theme/components/standard-dialog-tokens.ts (v1.1 - Tipado Corregido)

import type { AppColorTokens, ColorSchemeVariant, Mode } from "../ColorToken";

interface DialogPartTokens {
  background: string;
  border?: string;
  shadow?: string;
  borderRadius?: string;
  color?: string;
  backgroundHover?: string;
  colorHover?: string;
  // ✅ CORRECCIÓN: Se añade la propiedad que faltaba.
  backdropFilter?: string;
}

export type DialogColorSchemeTokens = {
  overlay: DialogPartTokens;
  content: DialogPartTokens;
  header: DialogPartTokens;
  footer: DialogPartTokens;
  close: DialogPartTokens;
};

export type DialogTokens = Record<ColorSchemeVariant, DialogColorSchemeTokens>;

export function generateDialogTokens(appColorTokens: AppColorTokens, mode: Mode): DialogTokens {
  const isDark = mode === "dark";
  const tokens = {} as DialogTokens;

  for (const colorScheme in appColorTokens) {
    const key = colorScheme as ColorSchemeVariant;
    const colorSet = appColorTokens[key];

    if (colorSet) {
      tokens[key] = {
        overlay: {
          background: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(2px)",
        },
        content: {
          background: isDark ? colorSet.bgShade : colorSet.bg,
          border: `1px solid ${isDark ? colorSet.bgShade : colorSet.bgShade}`,
          shadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.6)" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: "12px",
        },
        header: {
          background: isDark ? colorSet.bg : colorSet.bgShade,
          border: `1px solid ${isDark ? colorSet.bgShade : colorSet.bg}`,
        },
        footer: {
          background: isDark ? colorSet.bg : colorSet.bgShade,
          border: `1px solid ${isDark ? colorSet.bgShade : colorSet.bg}`,
        },
        close: {
          background: "transparent",
          color: colorSet.text,
          backgroundHover: colorSet.bgShade,
          colorHover: colorSet.pure,
        },
      };
    }
  }
  return tokens;
}