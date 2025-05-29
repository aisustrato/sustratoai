import type {
  AppColorTokens,
  ColorScheme,
  Mode,
  ColorShade,
} from "../ColorToken";

export type TextTokenColorSet = {
  pure: string;
  text: string;
  dark: string;
  textShade: string;
};

export type TextTokens = {
  colors: {
    default: TextTokenColorSet;
    primary: TextTokenColorSet;
    secondary: TextTokenColorSet;
    tertiary: TextTokenColorSet;
    accent: TextTokenColorSet;
    success: TextTokenColorSet;
    warning: TextTokenColorSet;
    danger: TextTokenColorSet;
    muted: TextTokenColorSet;
    neutral: TextTokenColorSet;
  };
  gradients: {
    primary: { start: string; middle: string; end: string };
    secondary: { start: string; middle: string; end: string };
    tertiary: { start: string; middle: string; end: string };
    accent: { start: string; middle: string; end: string };
    success: { start: string; middle: string; end: string };
    warning: { start: string; middle: string; end: string };
    danger: { start: string; middle: string; end: string };
  };
  variants: {
    default: { size: string; weight: string; color: string };
    heading: { size: string; weight: string; color: string };
    subheading: { size: string; weight: string; color: string };
    title: { size: string; weight: string; color: string };
    subtitle: { size: string; weight: string; color: string };
    label: { size: string; weight: string; color: string };
    caption: { size: string; weight: string; color: string };
    muted: { size: string; weight: string; color: string };
  };
};

export function generateTextTokens(
  appTokens: AppColorTokens,
  mode: Mode
): TextTokens {
  const isDark = mode === "dark";

  // Helper para mapear un ColorShade de AppColorTokens a la estructura TextTokenColorSet
  const mapColorShadeToTokenSet = (shade: ColorShade): TextTokenColorSet => ({
    pure: shade.pure,
    text: shade.text,
    textShade: shade.textShade,
    dark: shade.textShade,
  });

  const textColors = {
    default: {
      pure: isDark ? appTokens.neutral.bg : appTokens.neutral.text,
      text: appTokens.neutral.text,
      textShade: appTokens.neutral.textShade,
      dark: appTokens.neutral.textShade,
    },
    primary: mapColorShadeToTokenSet(appTokens.primary),
    secondary: mapColorShadeToTokenSet(appTokens.secondary),
    tertiary: mapColorShadeToTokenSet(appTokens.tertiary),
    accent: mapColorShadeToTokenSet(appTokens.accent),
    success: mapColorShadeToTokenSet(appTokens.success),
    warning: mapColorShadeToTokenSet(appTokens.warning),
    danger: mapColorShadeToTokenSet(appTokens.danger),
    muted: {
      pure: appTokens.neutral.textShade,
      text: appTokens.neutral.textShade,
      textShade: isDark ? appTokens.neutral.pure : appTokens.neutral.text,
      dark: isDark ? appTokens.neutral.pure : appTokens.neutral.text,
    },
    neutral: mapColorShadeToTokenSet(appTokens.neutral),
  };

  const textGradients = {
    primary: {
      start: appTokens.primary.pure,
      middle: appTokens.primary.pureShade,
      end: appTokens.primary.textShade,
    },
    secondary: {
      start: appTokens.secondary.pure,
      middle: appTokens.secondary.pureShade,
      end: appTokens.secondary.textShade,
    },
    tertiary: {
      start: appTokens.tertiary.pure,
      middle: appTokens.tertiary.pureShade,
      end: appTokens.tertiary.textShade,
    },
    accent: {
      start: appTokens.accent.pure,
      middle: appTokens.accent.pureShade,
      end: appTokens.accent.textShade,
    },
    success: {
      start: appTokens.success.pure,
      middle: appTokens.success.pureShade,
      end: appTokens.success.textShade,
    },
    warning: {
      start: appTokens.warning.pure,
      middle: appTokens.warning.pureShade,
      end: appTokens.warning.textShade,
    },
    danger: {
      start: appTokens.danger.pure,
      middle: appTokens.danger.pureShade,
      end: appTokens.danger.textShade,
    },
  };

  const variantDefaults = {
    default: { size: "base", weight: "normal", color: "default" },
    heading: { size: "3xl", weight: "bold", color: "default" },
    subheading: { size: "2xl", weight: "semibold", color: "default" },
    title: { size: "xl", weight: "semibold", color: "primary" },
    subtitle: { size: "lg", weight: "medium", color: "secondary" },
    label: { size: "sm", weight: "medium", color: "default" },
    caption: { size: "xs", weight: "normal", color: "muted" },
    muted: { size: "sm", weight: "normal", color: "muted" },
  } as const;

  return {
    colors: textColors,
    gradients: textGradients,
    variants: variantDefaults,
  };
}
