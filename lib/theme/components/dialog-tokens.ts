import type { AppColorTokens, Mode } from "../ColorToken"

export type DialogTokens = {
  overlay: {
    background: string
    backdropFilter: string
  }
  content: {
    background: string
    border: string
    shadow: string
    borderRadius: string
  }
  header: {
    background: string
    borderBottom: string
  }
  footer: {
    background: string
    borderTop: string
  }
  close: {
    background: string
    backgroundHover: string
    color: string
    colorHover: string
  }
}

export function generateDialogTokens(appColorTokens: AppColorTokens, mode: Mode): DialogTokens {
  const isDark = mode === "dark"
  const neutral = appColorTokens.neutral
  const white = appColorTokens.white

  return {
    overlay: {
      background: isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(4px)",
    },
    content: {
      background: isDark ? neutral.bgDark : white.bg,
      border: isDark ? `1px solid ${neutral.pureShade}` : `1px solid ${neutral.bgShade}`,
      shadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      borderRadius: "12px",
    },
    header: {
      background: isDark
        ? `linear-gradient(135deg, ${neutral.bg}, ${neutral.bgDark})`
        : `linear-gradient(135deg, ${neutral.bgShade}, ${white.bg})`,
      borderBottom: isDark
        ? `1px solid ${neutral.pureShade}`
        : `1px solid ${neutral.bgShade}`,
    },
    footer: {
      background: isDark
        ? `linear-gradient(135deg, ${neutral.bgDark}, ${neutral.bg})`
        : `linear-gradient(135deg, ${white.bg}, ${neutral.bgShade})`,
      borderTop: isDark
        ? `1px solid ${neutral.pureShade}`
        : `1px solid ${neutral.bgShade}`,
    },
    close: {
      background: "transparent",
      backgroundHover: isDark ? neutral.bgShade : neutral.bg,
      color: isDark ? neutral.textShade : neutral.text,
      colorHover: isDark ? white.bg : neutral.pure,
    },
  }
}
