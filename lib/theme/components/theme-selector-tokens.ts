import type { AppColorTokens, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

export interface ThemeSelectorTokens {
  dropdown: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    marginTop: string;
    boxShadow: string;
    padding: string;
    maxHeight: string;
    overflowY: string;
  };
  closedLabelText: {
    color: string;
    fontSize: string;
    fontWeight: string;
  };
  icon: {
    color: string;
    size: string;
  };
  item: {
    padding: string;
    borderRadius: string;
    cursor: string;
    hover: {
      backgroundColor: string;
    };
    selected: {
      backgroundColor: string;
    };
  };
}

export function generateThemeSelectorTokens(
  appColorTokens: AppColorTokens,
  mode: Mode
): ThemeSelectorTokens {
  const { primary, tertiary, neutral } = appColorTokens;

  // Determine appropriate colors based on mode
  const isDark = mode === "dark";
  const outlineColor = neutral.pure;
  const onSurfaceVariantColor = neutral.textShade;

  // Create semi-transparent colors
  const primaryA10 = tinycolor(primary.pure).setAlpha(0.1).toRgbString();
  const tertiaryBg = isDark 
    ? tinycolor(tertiary.bg).darken(10).toString() 
    : tinycolor(tertiary.bg).lighten(5).toString();

  return {
    dropdown: {
      backgroundColor: tertiaryBg, // Usamos el color de fondo terciario
      borderColor: outlineColor,
      borderRadius: '8px',
      marginTop: '4px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      padding: '8px',
      maxHeight: '400px',
      overflowY: 'auto',
    },
    closedLabelText: {
      color: onSurfaceVariantColor,
      fontSize: '14px',
      fontWeight: '500',
    },
    icon: {
      color: onSurfaceVariantColor,
      size: '24px', // Tamaño aumentado para el ícono
    },
    item: {
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      hover: {
        backgroundColor: isDark 
          ? tinycolor(tertiaryBg).lighten(5).toString() 
          : tinycolor(tertiaryBg).darken(5).toString(),
      },
      selected: {
        backgroundColor: primaryA10,
      },
    },
  };
}

// Helper function to get token value
type NestedStringObject = {
  [key: string]: string | NestedStringObject | undefined;
};

export function getThemeSelectorTokenValue(
  tokens: NestedStringObject,
  path: string
): string | undefined {
  const parts = path.split('.');
  let current: unknown = tokens;

  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') return undefined;
    current = (current as NestedStringObject)[part];
  }

  return typeof current === 'string' ? current : undefined;
}
