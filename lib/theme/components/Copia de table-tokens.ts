// --- START OF FILE Copia de table-tokens.txt (CON CORRECCIÓN DE ERRORES DE LINTER) ---

import tinycolor from "tinycolor2";
import type { ColorScheme, Mode } from "../color-tokens";
import type {
  SemanticTokens,
  ModeTokens,
  ProCardVariant,
} from "../color-tokens";
import loadedColors from "../colors";

export type CellVariant = ProCardVariant;

export interface TableTokens {
  // ... (interfaz sin cambios) ...
  container: {
    backgroundColor: string;
    borderColor: string;
  };
  header: {
    backgroundColor: string;
    foregroundColor: string;
    borderColor: string;
    sortIconColor: string;
    sortIconHoverColor: string;
    resizeHandleColor: string;
  };
  row: {
    default: {
      backgroundColor: string;
      foregroundColor: string;
      borderColor: string;
      hoverBackgroundColor: string;
    };
    status: {
      success: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
        borderColor?: string;
      };
      warning: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
        borderColor?: string;
      };
      danger: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
        borderColor?: string;
      };
      info: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
        borderColor?: string;
      };
      neutral: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
        borderColor?: string;
      };
    };
    subRowBackgroundColor: string;
    subRowIndentBorderColor: string;
  };
  cell: {
    borderColor: string;
    foregroundColor: string;
    variants: Record<
      CellVariant,
      {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
        borderColor?: string;
      }
    >;
  };
  toolbar: {
    columnSelector: {
      backgroundColor: string;
      foregroundColor: string;
    };
  };
  tooltip: {
    backgroundColor: string;
    foregroundColor: string;
    borderColor: string;
    borderColorLongContent: string;
  };
  expander: {
    circleBackground: string;
    circleBorderColor: string;
    iconColor: string;
    expandedCircleBackground: string;
    expandedIconColor: string;
  };
}

export function generateTableTokens(
  colorScheme: ColorScheme,
  mode: Mode,
  semanticTokensFromHook: SemanticTokens,
  modeColors: ModeTokens // Este es el tipo que no tiene 'card', 'popover', etc.
): TableTokens {
  const isDark = mode === "dark";
  const currentThemeColors = loadedColors.themes[colorScheme];
  const semanticBaseColors = loadedColors.semantic;
  const neutralBaseColors = loadedColors.neutral;

  const generateVariantStyle = (variant: CellVariant) => {
    // ... (sin cambios en esta función interna)
    let backgroundColor: string,
      foregroundColor: string,
      hoverBackgroundColor: string,
      borderColor: string | undefined = undefined;

    const colorSetMap = {
      primary: currentThemeColors.primary,
      secondary: currentThemeColors.secondary,
      tertiary: currentThemeColors.tertiary,
      accent: semanticBaseColors.accent,
      success: semanticBaseColors.success,
      warning: semanticBaseColors.warning,
      danger: semanticBaseColors.danger,
    };

    if (variant in colorSetMap) {
      const cSet = colorSetMap[variant as keyof typeof colorSetMap];
      backgroundColor = isDark ? cSet.bgDark : cSet.bg;
      foregroundColor = isDark ? cSet.textDark : cSet.text;
      hoverBackgroundColor = isDark
        ? tinycolor(cSet.bgDark).darken(5).toString()
        : tinycolor(cSet.bg).darken(10).toString();

      borderColor = isDark ? cSet.pure : cSet.pureDark;
    } else if (variant === "white") {
      backgroundColor = isDark
        ? neutralBaseColors.gray[800]
        : neutralBaseColors.white;
      foregroundColor = isDark
        ? neutralBaseColors.gray[200]
        : neutralBaseColors.gray[800];
      hoverBackgroundColor = isDark
        ? neutralBaseColors.gray[700]
        : neutralBaseColors.gray[100];
      borderColor = isDark
        ? neutralBaseColors.gray[600]
        : neutralBaseColors.gray[300];
    } else if (variant === "neutral") {
      backgroundColor = isDark
        ? neutralBaseColors.gray[700]
        : neutralBaseColors.gray[50];
      foregroundColor = isDark
        ? neutralBaseColors.gray[200]
        : neutralBaseColors.gray[700];
      hoverBackgroundColor = isDark
        ? neutralBaseColors.gray[600]
        : neutralBaseColors.gray[100];
      borderColor = isDark
        ? neutralBaseColors.gray[500]
        : neutralBaseColors.gray[200];
    } else {
      backgroundColor = isDark
        ? neutralBaseColors.gray[800]
        : neutralBaseColors.white;
      foregroundColor = isDark
        ? neutralBaseColors.gray[200]
        : neutralBaseColors.gray[800];
      hoverBackgroundColor = isDark
        ? neutralBaseColors.gray[700]
        : neutralBaseColors.gray[200];
    }
    return {
      backgroundColor,
      foregroundColor,
      hoverBackgroundColor,
      borderColor,
    };
  };

  const cellVariantTokens = {} as TableTokens["cell"]["variants"];
  const allCellVariants: CellVariant[] = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
    "white",
  ];
  allCellVariants.forEach((variant) => {
    cellVariantTokens[variant] = generateVariantStyle(variant);
  });

  const containerBackgroundColor = modeColors.background;
  const containerBorderColor = modeColors.border;

  const headerBackgroundColor = isDark
    ? currentThemeColors.primary.pureDark
    : currentThemeColors.primary.pure;
  const headerForegroundColor = neutralBaseColors.white;
  const headerBorderColor = modeColors.border;
  const sortIconColor = tinycolor(headerForegroundColor)
    .setAlpha(0.7)
    .toString();
  const sortIconHoverColor = headerForegroundColor;
  const resizeHandleColor = tinycolor(semanticTokensFromHook.primary.background)
    .setAlpha(0.3)
    .toString();

  const rowDefaultBackgroundColor = modeColors.background;
  const rowDefaultForegroundColor = modeColors.foreground;
  const rowDefaultBorderColor = tinycolor(modeColors.border)
    .setAlpha(0.5)
    .toString();
  const rowDefaultHoverBackgroundColor = isDark
    ? neutralBaseColors.gray[700]
    : neutralBaseColors.gray[100]; // Cambiado a gray[100] para modo claro para un hover más sutil que gray[300]

  const generateRowStatusStyles = (statusKey: CellVariant) => {
    const variantStyle = generateVariantStyle(statusKey);
    return {
      backgroundColor: variantStyle.backgroundColor,
      foregroundColor: variantStyle.foregroundColor,
      hoverBackgroundColor: variantStyle.hoverBackgroundColor,
      borderColor: variantStyle.borderColor,
    };
  };

  const rowStatusColors = {
    success: generateRowStatusStyles("success"),
    warning: generateRowStatusStyles("warning"),
    danger: generateRowStatusStyles("danger"),
    info: generateRowStatusStyles("accent"),
    neutral: {
      ...generateRowStatusStyles("neutral"),
      borderColor: rowDefaultBorderColor,
    },
  };

  const subRowBackgroundColor = tinycolor(modeColors.muted)
    .setAlpha(isDark ? 0.25 : 0.4)
    .toString();
  const subRowIndentBorderColor =
    semanticTokensFromHook.primary.border ||
    semanticTokensFromHook.primary.background;

  const cellGeneralBorderColor = tinycolor(modeColors.border)
    .setAlpha(0.7)
    .toString();
  const cellDefaultForegroundColor = modeColors.foreground;

  // --- CORRECCIÓN PARA TOKENS DE TOOLBAR Y TOOLTIP ---
  const columnSelectorBackgroundColor = modeColors.muted; // Volver a usar modeColors.muted
  const columnSelectorForegroundColor = modeColors.foreground; // Usar modeColors.foreground

  const tooltipBackgroundColor = modeColors.background; // Usar modeColors.background para el tooltip
  const tooltipForegroundColor = modeColors.foreground; // Usar modeColors.foreground
  const tooltipBorderColor = modeColors.border;
  const tooltipBorderColorLongContent = semanticBaseColors.accent.pure;

  const expanderCircleBg = currentThemeColors.primary.pure;
  const expanderIconColor = neutralBaseColors.white;
  const expanderCircleBorder = neutralBaseColors.white;
  // Consideración: Si primary.text es muy oscuro (como #1f4487), podría no ser ideal para un fondo.
  // primary.pureDark (#2E5EB9) podría ser una mejor alternativa si primary.text no funciona bien.
  const expanderExpandedCircleBg = currentThemeColors.primary.pureDark; // Manteniendo tu sugerencia, pero con advertencia.
  // Alternativa: currentThemeColors.primary.pureDark;

  const expanderTokens = {
    circleBackground: expanderCircleBg,
    circleBorderColor: expanderCircleBorder,
    iconColor: expanderIconColor,
    expandedCircleBackground: expanderExpandedCircleBg,
    expandedIconColor: expanderIconColor,
  };

  return {
    container: {
      backgroundColor: containerBackgroundColor,
      borderColor: containerBorderColor,
    },
    header: {
      backgroundColor: headerBackgroundColor,
      foregroundColor: headerForegroundColor,
      borderColor: headerBorderColor,
      sortIconColor: sortIconColor,
      sortIconHoverColor: sortIconHoverColor,
      resizeHandleColor: resizeHandleColor,
    },
    row: {
      default: {
        backgroundColor: rowDefaultBackgroundColor,
        foregroundColor: rowDefaultForegroundColor,
        borderColor: rowDefaultBorderColor,
        hoverBackgroundColor: rowDefaultHoverBackgroundColor,
      },
      status: rowStatusColors,
      subRowBackgroundColor: subRowBackgroundColor,
      subRowIndentBorderColor: subRowIndentBorderColor,
    },
    cell: {
      borderColor: cellGeneralBorderColor,
      foregroundColor: cellDefaultForegroundColor,
      variants: cellVariantTokens,
    },
    toolbar: {
      columnSelector: {
        backgroundColor: columnSelectorBackgroundColor,
        foregroundColor: columnSelectorForegroundColor,
      },
    },
    tooltip: {
      backgroundColor: tooltipBackgroundColor,
      foregroundColor: tooltipForegroundColor,
      borderColor: tooltipBorderColor,
      borderColorLongContent: tooltipBorderColorLongContent,
    },
    expander: expanderTokens,
  };
}
// --- END OF FILE ---
