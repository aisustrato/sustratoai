import { colors, semantic } from "@/lib/theme/colors";
import type { ColorScheme, Mode } from "@/lib/theme/color-tokens";
import type { AppColorTokens } from "../ColorToken";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "neutral";

export interface BadgeTokenSet {
  background: string;
  subtleBackgroundColor: string;
  contrastTextColor: string;
  regularTextColor: string;
  borderColor: string;
  subtleBorderColor: string;
}

export type BadgeTokens = Record<BadgeVariant, BadgeTokenSet>;

export function generateBadgeTokens(
  appColorTokens: AppColorTokens
): BadgeTokens {
  return {
    default: {
      background: appColorTokens.primary.pure,
      subtleBackgroundColor: appColorTokens.primary.bg,
      contrastTextColor: appColorTokens.primary.contrastText,
      regularTextColor: appColorTokens.primary.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.primary.bgShade,
    },
    secondary: {
      background: appColorTokens.secondary.pure,
      subtleBackgroundColor: appColorTokens.secondary.bg,
      contrastTextColor: appColorTokens.secondary.contrastText,
      regularTextColor: appColorTokens.secondary.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.secondary.bgShade,
    },
    destructive: {
      background: appColorTokens.danger.pure,
      subtleBackgroundColor: appColorTokens.danger.bg,
      contrastTextColor: appColorTokens.danger.contrastText,
      regularTextColor: appColorTokens.danger.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.danger.bgShade,
    },
    outline: {
      background: "transparent",
      subtleBackgroundColor: "transparent",
      contrastTextColor: appColorTokens.neutral.text,
      regularTextColor: appColorTokens.neutral.text,
      borderColor: appColorTokens.neutral.text,
      subtleBorderColor: appColorTokens.neutral.bgShade,
    },
    success: {
      background: appColorTokens.success.pure,
      subtleBackgroundColor: appColorTokens.success.bg,
      contrastTextColor: appColorTokens.success.contrastText,
      regularTextColor: appColorTokens.success.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.success.bgShade,
    },
    warning: {
      background: appColorTokens.warning.pure,
      subtleBackgroundColor: appColorTokens.warning.bg,
      contrastTextColor: appColorTokens.warning.contrastText,
      regularTextColor: appColorTokens.warning.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.warning.bgShade,
    },
    info: {
      background: appColorTokens.accent.pure,
      subtleBackgroundColor: appColorTokens.accent.bg,
      contrastTextColor: appColorTokens.accent.contrastText,
      regularTextColor: appColorTokens.accent.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.accent.bgShade,
    },
    neutral: {
      background: appColorTokens.neutral.bg,
      subtleBackgroundColor: appColorTokens.neutral.bg,
      contrastTextColor: appColorTokens.neutral.text,
      regularTextColor: appColorTokens.neutral.text,
      borderColor: "transparent",
      subtleBorderColor: appColorTokens.neutral.bgShade,
    },
  };
}
