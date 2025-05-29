// --- START OF FILE Copia de table-tokens.txt (CON CORRECCIÓN DE ERRORES DE LINTER) ---

import tinycolor from "tinycolor2";
import type { AppColorTokens } from "../ColorToken";
import type { ProCardVariant } from "../color-tokens";

export type CellVariant = ProCardVariant;

export interface TableTokens {
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
    default: {
      backgroundColor: string;
      foregroundColor: string;
      borderColor: string;
    };
    longContent: {
      backgroundColor: string;
      foregroundColor: string;
      borderColor: string;
    };
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
  appColorTokens: AppColorTokens
): TableTokens {
  const generateVariantStyle = (
    variant: CellVariant,
    currentAppColorTokens: AppColorTokens
  ) => {
    let backgroundColor: string,
      foregroundColor: string,
      hoverBackgroundColor: string,
      borderColor: string | undefined = undefined;

    const {
      primary,
      secondary,
      tertiary,
      accent,
      success,
      warning,
      danger,
      neutral,
      white,
    } = currentAppColorTokens;

    if (variant === "white") {
      const tokenSet = white;
      backgroundColor = tokenSet.bg;
      foregroundColor = tokenSet.text;
      hoverBackgroundColor = tokenSet.bgShade || tokenSet.bg;
      borderColor = tokenSet.pure;
    } else if (variant === "neutral") {
      const tokenSet = neutral;
      backgroundColor = tokenSet.bg;
      foregroundColor = tokenSet.text;
      hoverBackgroundColor = tokenSet.bgShade || tokenSet.bg;
      borderColor = tokenSet.bgShade;
    } else if (currentAppColorTokens[variant as keyof AppColorTokens]) {
      const tokenSet = currentAppColorTokens[
        variant as keyof typeof currentAppColorTokens
      ] as typeof primary;
      if (
        tokenSet &&
        typeof tokenSet === "object" &&
        "bg" in tokenSet &&
        "text" in tokenSet &&
        "pure" in tokenSet
      ) {
        backgroundColor = tinycolor(tokenSet.bg).toString();
        foregroundColor = tokenSet.text;
        hoverBackgroundColor = tokenSet.bgShade || tokenSet.bg;
        borderColor = tokenSet.pure;
      } else {
        backgroundColor = neutral.bg;
        foregroundColor = neutral.text;
        hoverBackgroundColor = neutral.bgShade;
        borderColor = neutral.bgShade;
      }
    } else {
      backgroundColor = neutral.bg;
      foregroundColor = neutral.text;
      hoverBackgroundColor = neutral.bgShade;
      borderColor = neutral.bgShade;
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
    cellVariantTokens[variant] = generateVariantStyle(variant, appColorTokens);
  });

  const containerBackgroundColor = appColorTokens.neutral.bg;
  const containerBorderColor = appColorTokens.neutral.bgShade;

  const headerBackgroundColor = appColorTokens.primary.pure;
  const headerForegroundColor = appColorTokens.primary.contrastText;
  const headerBorderColor = appColorTokens.neutral.bgShade;
  const sortIconColor = tinycolor(headerForegroundColor)
    .setAlpha(0.7)
    .toString();
  const sortIconHoverColor = headerForegroundColor;
  const resizeHandleColor = tinycolor(appColorTokens.primary.bg)
    .setAlpha(0.5)
    .toString();

  const rowDefaultBackgroundColor = appColorTokens.neutral.bg;
  const rowDefaultForegroundColor = appColorTokens.neutral.text;
  const rowDefaultBorderColor = tinycolor(appColorTokens.neutral.bgShade)
    .setAlpha(0.5)
    .toString();
  const rowDefaultHoverBackgroundColor = appColorTokens.neutral.bgShade;

  const generateRowStatusStyles = (statusKey: CellVariant) => {
    const variantStyle = generateVariantStyle(statusKey, appColorTokens);
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

  const subRowBackgroundColor = tinycolor(appColorTokens.neutral.bg)
    .setAlpha(0.3)
    .toString();
  const subRowIndentBorderColor = appColorTokens.primary.pure;

  const cellGeneralBorderColor = tinycolor(appColorTokens.neutral.bgShade)
    .setAlpha(0.7)
    .toString();
  const cellDefaultForegroundColor = appColorTokens.neutral.text;

  const columnSelectorBackgroundColor = appColorTokens.neutral.bg;
  const columnSelectorForegroundColor = appColorTokens.neutral.text;

  const tooltipDefaultBackgroundColor = appColorTokens.neutral.bgShade;
  const tooltipDefaultForegroundColor = appColorTokens.neutral.contrastText;
  const tooltipDefaultBorderColor = appColorTokens.neutral.text;

  const tooltipLongContentBackgroundColor = "#ffffff";
  const tooltipLongContentForegroundColor = appColorTokens.primary.text;
  const tooltipLongContentBorderColor = appColorTokens.accent.pure;

  const expanderCircleBg = appColorTokens.primary.pure;
  const expanderIconColor = appColorTokens.primary.contrastText;
  const expanderCircleBorder = appColorTokens.primary.contrastText;
  const expanderExpandedCircleBg =
    appColorTokens.primary.bgShade || appColorTokens.primary.bg;

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
      default: {
        backgroundColor: tooltipDefaultBackgroundColor,
        foregroundColor: tooltipDefaultForegroundColor,
        borderColor: tooltipDefaultBorderColor,
      },
      longContent: {
        backgroundColor: tooltipLongContentBackgroundColor,
        foregroundColor: tooltipLongContentForegroundColor,
        borderColor: tooltipLongContentBorderColor,
      },
    },
    expander: expanderTokens,
  };
}
// --- END OF FILE ---
