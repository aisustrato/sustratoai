import type { AppColorTokens, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

export interface FontSelectorTokens {
  closed: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    padding: string;
    minWidth: string;
    cursor: string;
    display: string;
    alignItems: string;
    justifyContent: string;
    transition: string;
    hover: {
      backgroundColor: string;
      borderColor: string;
    };
    focus: {
      borderColor: string;
      boxShadow: string;
    };
  };
  closedLabelText: {
    color: string;
    fontSize: string;
    fontWeight: string;
  };
  closedSelectedFontText: {
    color: string;
    fontSize: string;
    fontWeight: string;
    marginLeft: string;
  };
  icon: {
    color: string;
    size: string;
  };
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
  itemParagraph: {
    color: string;
    fontSize: string;
    lineHeight: string;
    marginBottom: string;
    firstOfType: {};
    lastOfType: {
      marginBottom: string;
    };
  };
  separator: {
    height: string;
    backgroundColor: string;
    margin: string;
  };
}

export function generateFontSelectorTokens(
  appColorTokens: AppColorTokens,
  mode: Mode
): FontSelectorTokens {
  const {
    primary,
    secondary,
    tertiary,
    neutral,
    white
  } = appColorTokens;

  // Determine appropriate colors based on mode
  const isDark = mode === "dark";
  const surfaceColor = isDark ? neutral.bg : white.bg;
  const outlineColor = neutral.pure;
  const outlineVariantColor = neutral.bgShade;
  const onSurfaceColor = neutral.text;
  const onSurfaceVariantColor = neutral.textShade;

  // Create semi-transparent colors
  const primaryA10 = tinycolor(primary.pure).setAlpha(0.1).toRgbString();
  const primaryA20 = tinycolor(primary.pure).setAlpha(0.2).toRgbString();

  return {
    closed: {
      backgroundColor: isDark ? neutral.bgShade : white.bg,
      borderColor: isDark ? neutral.pure : neutral.bgShade,
      borderRadius: '8px',
      padding: '8px 12px',
      minWidth: '180px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
      hover: {
        backgroundColor: isDark ? tinycolor(neutral.bgShade).lighten(5).toString() : tinycolor(white.bg).darken(5).toString(),
        borderColor: isDark ? primary.pure : primary.bgShade,
      },
      focus: {
        borderColor: primary.pure,
        boxShadow: `0 0 0 2px ${primaryA20}`,
      },
    },
    closedLabelText: {
      color: onSurfaceVariantColor,
      fontSize: '14px',
      fontWeight: '500',
    },
    closedSelectedFontText: {
      color: primary.pure,
      fontSize: '14px',
      fontWeight: '400',
      marginLeft: '8px',
    },
    icon: {
      color: onSurfaceVariantColor,
      size: '20px',
    },
    dropdown: {
      backgroundColor: surfaceColor,
      borderColor: outlineColor,
      borderRadius: '8px',
      marginTop: '4px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      padding: '8px',
      maxHeight: '400px',
      overflowY: 'auto',
    },
    item: {
      padding: '12px',
      borderRadius: '6px',
      cursor: 'pointer',
      hover: {
        backgroundColor: isDark ? tinycolor(neutral.bg).lighten(5).toString() : tinycolor(white.bg).darken(5).toString(),
      },
      selected: {
        backgroundColor: primaryA10,
      },
    },
    itemParagraph: {
      color: onSurfaceColor,
      fontSize: '14px',
      lineHeight: '1.6',
      marginBottom: '8px',
      firstOfType: {},
      lastOfType: {
        marginBottom: '0',
      },
    },
    separator: {
      height: '1px',
      backgroundColor: outlineVariantColor,
      margin: '8px 0',
    },
  };
}

// Helper function to get token value
export function getFontSelectorTokenValue(
  tokens: FontSelectorTokens,
  path: string
): any {
  const parts = path.split('.');
  let current: any = tokens;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined; // Token not found
    }
  }
  
  return current;
}