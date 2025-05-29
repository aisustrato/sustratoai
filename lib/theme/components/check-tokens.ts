import { colors } from "@/lib/theme/colors";
import type { AppColorTokens } from "../ColorToken";

export type CheckVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral";
export type CheckSize = "xs" | "sm" | "md" | "lg" | "xl";
export type CheckVisualVariant = "default" | "outline" | "subtle" | "solid";

export interface CheckTokens {
  // Colores base
  background: string;
  border: string;
  check: string;
  text: string;

  // Estados
  hover: {
    background: string;
    border: string;
  };
  focus: {
    outline: string;
  };
  active: {
    background: string;
    border: string;
  };
  checked: {
    background: string;
    border: string;
    check: string;
  };
  disabled: {
    background: string;
    border: string;
    check: string;
    text: string;
    opacity: number;
  };

  // Tamaños
  size: {
    borderThickness: string;
    box: string;
    checkThickness: number;
    borderRadius: string;
    fontSize: string;
    padding: string;
  };
}

export function generateCheckTokens(
  appColorTokens: AppColorTokens,
  size: CheckSize = "md",
  variant: CheckVariant = "primary",
  visualVariant: CheckVisualVariant = "default"
): CheckTokens {
  const sizeTokens = getSizeTokens(size);

  if (variant === "neutral") {
    return generateNeutralTokens(
      appColorTokens.neutral,
      visualVariant,
      sizeTokens
    );
  } else {
    const baseColorTokenSet = getColorForVariant(variant, appColorTokens);
    return generateColorTokens(
      baseColorTokenSet,
      visualVariant,
      sizeTokens,
      appColorTokens.neutral,
      appColorTokens,
      variant
    );
  }
}

// Función para obtener el color base según la variante
function getColorForVariant(
  variant: CheckVariant,
  appColorTokens: AppColorTokens
) {
  switch (variant) {
    case "primary":
      return appColorTokens.primary;
    case "secondary":
      return appColorTokens.secondary;
    case "tertiary":
      return appColorTokens.tertiary;
    case "accent":
      return appColorTokens.accent;
    case "success":
      return appColorTokens.success;
    case "warning":
      return appColorTokens.warning;
    case "danger":
      return appColorTokens.danger;
    default:
      return appColorTokens.primary;
  }
}

// Función para obtener tokens de tamaño
function getSizeTokens(size: CheckSize) {
  switch (size) {
    case "xs":
      return {
        box: "16px",
        checkThickness: 2.5,
        borderRadius: "3px",
        fontSize: "0.75rem",
        padding: "0.25rem",
      };
    case "sm":
      return {
        box: "18px",
        checkThickness: 3,
        borderRadius: "4px",
        fontSize: "0.875rem",
        padding: "0.375rem",
      };
    case "lg":
      return {
        box: "24px",
        checkThickness: 4,
        borderRadius: "6px",
        fontSize: "1.125rem",
        padding: "0.625rem",
      };
    case "xl":
      return {
        box: "28px",
        checkThickness: 5,
        borderRadius: "7px",
        fontSize: "1.25rem",
        padding: "0.75rem",
      };
    default: // md
      return {
        box: "20px",
        checkThickness: 3.5,
        borderRadius: "5px",
        fontSize: "1rem",
        padding: "0.5rem",
      };
  }
}

// Función para generar tokens para la variante neutral
function generateNeutralTokens(
  neutralTokenSet: AppColorTokens["neutral"],
  visualVariant: CheckVisualVariant,
  sizeTokens: any
): CheckTokens {
  let background: string;
  let border: string;
  let check: string;
  let checkedBackground: string;
  let checkedBorder: string;

  const checkColor = neutralTokenSet.contrastText;

  switch (visualVariant) {
    case "outline":
      background = "transparent";
      border = neutralTokenSet.bgShade;
      check = checkColor;
      checkedBackground = "transparent";
      checkedBorder = neutralTokenSet.text;
      break;
    case "subtle":
      background = `${neutralTokenSet.bg}40`;
      border = neutralTokenSet.bgShade;
      check = checkColor;
      checkedBackground = `${neutralTokenSet.bg}80`;
      checkedBorder = neutralTokenSet.text;
      break;
    case "solid":
      background = neutralTokenSet.bg;
      border = neutralTokenSet.bgShade;
      check = checkColor;
      checkedBackground = neutralTokenSet.bgShade;
      checkedBorder = neutralTokenSet.text;
      break;
    default: // default
      background = "#ffffff";
      border = neutralTokenSet.bgShade;
      check = checkColor;
      checkedBackground = "#ffffff";
      checkedBorder = neutralTokenSet.text;
      break;
  }

  // Hover, focus y active para neutral
  const hoverBackground = `${neutralTokenSet.bg}60`;
  const hoverBorder = neutralTokenSet.text;
  const focusOutline = `${neutralTokenSet.pure}60`;
  const activeBackground = `${neutralTokenSet.bg}80`;
  const activeBorder = neutralTokenSet.contrastText;

  return {
    background,
    border,
    check: neutralTokenSet.contrastText,
    text: neutralTokenSet.text,

    hover: {
      background: hoverBackground,
      border: hoverBorder,
    },

    focus: {
      outline: focusOutline,
    },

    active: {
      background: activeBackground,
      border: activeBorder,
    },

    checked: {
      background: checkedBackground,
      border: checkedBorder,
      check:
        visualVariant === "solid" ? neutralTokenSet.contrastText : checkColor,
    },

    disabled: {
      background: `${neutralTokenSet.bg}30`,
      border: `${neutralTokenSet.bgShade}50`,
      check: `${neutralTokenSet.text}50`,
      text: `${neutralTokenSet.text}50`,
      opacity: 0.6,
    },

    size: sizeTokens,
  };
}

// Función para generar tokens para variantes de color
function generateColorTokens(
  baseColorTokenSet: AppColorTokens[keyof AppColorTokens] & {
    pure: string;
    bg: string;
    contrastText: string;
    text: string;
    bgShade: string;
  },
  visualVariant: CheckVisualVariant,
  sizeTokens: any,
  neutralTokenSet: AppColorTokens["neutral"],
  appColorTokens: AppColorTokens,
  variant: CheckVariant
): CheckTokens {
  if (!baseColorTokenSet || !baseColorTokenSet.pure) {
    return generateNeutralTokens(neutralTokenSet, visualVariant, sizeTokens);
  }

  let background: string;
  let border: string;
  let check: string;
  let checkedBackground: string;
  let checkedBorder: string;

  const useSecondaryCheck =
    visualVariant === "default" &&
    variant === "primary" &&
    appColorTokens.secondary &&
    appColorTokens.secondary.pure;

  const defaultCheckColor = baseColorTokenSet.contrastText;
  const checkColorOnWhite = baseColorTokenSet.pure;

  switch (visualVariant) {
    case "outline":
      background = "transparent";
      border = baseColorTokenSet.pure;
      check = useSecondaryCheck
        ? appColorTokens.secondary.pure
        : checkColorOnWhite;
      checkedBackground = "transparent";
      checkedBorder = baseColorTokenSet.pure;
      break;
    case "subtle":
      background = `${baseColorTokenSet.pure}20`;
      border = `${baseColorTokenSet.pure}60`;
      check = useSecondaryCheck
        ? appColorTokens.secondary.pure
        : checkColorOnWhite;
      checkedBackground = `${baseColorTokenSet.pure}40`;
      checkedBorder = baseColorTokenSet.pure;
      break;
    case "solid":
      background = baseColorTokenSet.bg;
      border = baseColorTokenSet.pure;
      check = baseColorTokenSet.contrastText;
      checkedBackground = baseColorTokenSet.pure;
      checkedBorder = baseColorTokenSet.pure;
      break;
    default: // default (typically white background, colored border/check)
      background = "#ffffff";
      border = baseColorTokenSet.pure;
      check = useSecondaryCheck
        ? appColorTokens.secondary.pure
        : checkColorOnWhite;
      checkedBackground = "#ffffff";
      checkedBorder = baseColorTokenSet.pure;
      break;
  }

  return {
    background,
    border,
    check: defaultCheckColor,
    text: neutralTokenSet.text,

    hover: {
      background: `${baseColorTokenSet.pure}20`,
      border: baseColorTokenSet.pure,
    },

    focus: {
      outline: `${baseColorTokenSet.pure}60`,
    },

    active: {
      background: `${baseColorTokenSet.pure}30`,
      border: baseColorTokenSet.bgShade,
    },

    checked: {
      background: checkedBackground,
      border: checkedBorder,
      check:
        visualVariant === "solid"
          ? baseColorTokenSet.contrastText
          : useSecondaryCheck
          ? appColorTokens.secondary.pure
          : checkColorOnWhite,
    },

    disabled: {
      background: `${neutralTokenSet.bg}30`,
      border: `${neutralTokenSet.bgShade}50`,
      check: `${neutralTokenSet.text}50`,
      text: `${neutralTokenSet.text}50`,
      opacity: 0.6,
    },

    size: sizeTokens,
  };
}
