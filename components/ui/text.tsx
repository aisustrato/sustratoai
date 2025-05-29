"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useFontTheme } from "@/app/font-provider"
import { useTheme } from "@/app/theme-provider"
import { generateTextTokens, type TextTokens } from "@/lib/theme/components/text-tokens"
import { useMemo } from "react"
// import type {
//   TextVariant,
//   TextSize,
//   TextWeight,
//   TextAlign,
//   TextColor,
//   ColorVariant as OriginalColorVariant,
//   GradientType,
// } from "@/lib/theme/components/text-tokens";

// Definiciones de tipo locales
type TextVariant = keyof TextTokens["variants"]
type TextColor = keyof TextTokens["colors"]
type GradientType = keyof TextTokens["gradients"] | boolean
type TextSize = "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
type TextWeight = "normal" | "medium" | "semibold" | "bold"
type TextAlign = "left" | "center" | "right" | "justify"
type OriginalColorVariant = "pure" | "text" | "dark"

// Tipo para la fuente del par a utilizar
export type FontPairType = "heading" | "body"

// Extender ColorVariant para incluir textShade y marcar dark como legacy
export type ColorVariant = OriginalColorVariant | "textShade"

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  size?: TextSize
  weight?: TextWeight
  align?: TextAlign
  as?: React.ElementType
  truncate?: boolean
  gradient?: GradientType
  color?: TextColor
  /**
   * Define la variante del color a utilizar.
   * - "pure": Usa el color puro (generalmente más brillante).
   * - "text": Usa el color optimizado para texto sobre fondos claros.
   * - "dark": (Legacy) Usa una variante más oscura o alternativa del color de texto. Preferir "textShade".
   * - "textShade": Usa una variante más oscura o alternativa del color de texto, ideal para variaciones sutiles o énfasis.
   * @default "text"
   */
  colorVariant?: ColorVariant
  className?: string
  children: React.ReactNode
  useHeadingFont?: boolean // Prop anterior (mantenida por compatibilidad)
  fontType?: FontPairType // Nueva prop para especificar explícitamente qué tipo de fuente usar
}

export function Text({
  variant = "default",
  size,
  weight,
  align,
  as: Component = "p",
  truncate = false,
  gradient: initialGradient = false,
  color: initialColor,
  colorVariant = "text",
  className,
  children,
  useHeadingFont,
  fontType,
  ...props
}: TextProps) {
  const { appColorTokens, mode } = useTheme()
  const { fontTheme } = useFontTheme()

  const textTokens = useMemo(() => {
    return generateTextTokens(appColorTokens, mode)
  }, [appColorTokens, mode])

  let effectiveVariantForStyleDefaults = variant
  if (
    typeof Component === "string" &&
    Component.startsWith("h") &&
    Component.length === 2 &&
    !fontType &&
    useHeadingFont === undefined &&
    (variant === "default" ||
      variant === "label" ||
      variant === "caption" ||
      variant === "muted" ||
      variant === "subtitle")
  ) {
    effectiveVariantForStyleDefaults = "heading"
  }

  const styleDefaults = textTokens.variants[effectiveVariantForStyleDefaults]
  const colorVariantDefaultName = textTokens.variants[variant].color

  let finalColorName: TextColor = initialColor || (colorVariantDefaultName as TextColor)
  let finalGradient: GradientType | boolean = initialGradient
  const finalColorVariant: ColorVariant = colorVariant || "text"

  if (initialColor === undefined && initialGradient === false) {
    if (variant === "heading") {
      finalGradient = "primary"
    } else if (variant === "subheading") {
      finalColorName = "secondary"
    } else if (variant === "title") {
      finalColorName = "tertiary"
    }
  }

  const finalSize = size || (styleDefaults.size as TextSize)
  const finalWeight = weight || (styleDefaults.weight as TextWeight)

  const determineFontType = (): FontPairType => {
    if (fontType) return fontType

    if (useHeadingFont !== undefined) return useHeadingFont ? "heading" : "body"

    if (typeof Component === "string" && Component.startsWith("h") && Component.length === 2) {
      return "heading"
    }

    switch (variant) {
      case "heading":
      case "title":
      case "subheading":
        return "heading"
      case "subtitle":
        return "heading"
      case "default":
      case "label":
      case "caption":
      case "muted":
        return "body"
      default:
        return "body"
    }
  }

  const finalFontType = determineFontType()

  const sizeStyles: Record<TextSize, string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    md: "text-md",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
  }
  const weightStyles: Record<TextWeight, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }
  const alignStyles: Record<TextAlign, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  }
  const variantStyles: Record<TextVariant, string> = {
    default: "",
    heading: "tracking-tight",
    subheading: "",
    title: "",
    subtitle: "",
    label: "",
    caption: "",
    muted: "",
  }

  const classes = cn(
    variantStyles[variant],
    sizeStyles[finalSize],
    weightStyles[finalWeight],
    align && alignStyles[align],
    truncate && "truncate",
    className,
  )

  const getTextColor = () => {
    if (finalGradient) return "transparent"

    if (!textTokens?.colors) return "inherit"
    const tokenSet = textTokens.colors[finalColorName]
    if (!tokenSet) return "inherit"

    if (finalColorVariant === "textShade" && tokenSet.textShade) return tokenSet.textShade
    if (finalColorVariant === "dark" && tokenSet.dark) return tokenSet.dark
    if (finalColorVariant === "pure" && tokenSet.pure) return tokenSet.pure
    return tokenSet.text
  }

  const baseStyle: React.CSSProperties = {
    color: getTextColor(),
    fontFamily: finalFontType === "heading" ? "var(--font-family-headings)" : "var(--font-family-base)",
    fontWeight: finalFontType === "heading" ? "var(--font-weight-headings)" : "var(--font-weight-base)",
    letterSpacing: finalFontType === "heading" ? "var(--letter-spacing-headings)" : "var(--letter-spacing-body)",
    lineHeight: "var(--line-height)",
  }

  if (!finalGradient) {
    return (
      <Component className={classes} style={baseStyle} {...props}>
        {children}
      </Component>
    )
  }

  if (!textTokens?.gradients) {
    const fallbackTextColorStyle: React.CSSProperties = {
      ...baseStyle,
      color: (() => {
        if (!textTokens?.colors) return "inherit"
        const tokenSet = textTokens.colors[finalColorName]
        if (!tokenSet) return "inherit"
        if (finalColorVariant === "textShade" && tokenSet.textShade) return tokenSet.textShade
        if (finalColorVariant === "dark" && tokenSet.dark) return tokenSet.dark
        if (finalColorVariant === "pure" && tokenSet.pure) return tokenSet.pure
        return tokenSet.text
      })(),
    }
    return (
      <Component className={classes} style={fallbackTextColorStyle} {...props}>
        {children}
      </Component>
    )
  }

  const gradientTypeToUse = finalGradient === true ? "primary" : finalGradient

  const gradientColors = textTokens.gradients[gradientTypeToUse as Exclude<TextColor, "default" | "muted" | "neutral">]

  if (!gradientColors) {
    const fallbackTextColorStyle: React.CSSProperties = {
      ...baseStyle,
      color: (() => {
        if (!textTokens?.colors) return "inherit"
        const tokenSet = textTokens.colors[finalColorName]
        if (!tokenSet) return "inherit"
        if (finalColorVariant === "textShade" && tokenSet.textShade) return tokenSet.textShade
        if (finalColorVariant === "dark" && tokenSet.dark) return tokenSet.dark
        if (finalColorVariant === "pure" && tokenSet.pure) return tokenSet.pure
        return tokenSet.text
      })(),
    }
    return (
      <Component className={classes} style={fallbackTextColorStyle} {...props}>
        {children}
      </Component>
    )
  }

  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(
      to right,
      ${gradientColors.start},
      ${gradientColors.middle} 50%,
      ${gradientColors.end}
    )`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    fontFamily: finalFontType === "heading" ? "var(--font-family-headings)" : "var(--font-family-base)",
    fontWeight: finalFontType === "heading" ? "var(--font-weight-headings)" : "var(--font-weight-base)",
    letterSpacing: finalFontType === "heading" ? "var(--letter-spacing-headings)" : "var(--letter-spacing-body)",
    lineHeight: "var(--line-height)",
    paddingBottom: "0.1em",
    display: "inline",
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: finalFontType === "heading" ? "var(--font-family-headings)" : "var(--font-family-base)",
    fontWeight: finalFontType === "heading" ? "var(--font-weight-headings)" : "var(--font-weight-base)",
    letterSpacing: finalFontType === "heading" ? "var(--letter-spacing-headings)" : "var(--letter-spacing-body)",
    lineHeight: "var(--line-height)",
  }

  return (
    <Component className={classes} style={containerStyle} {...props}>
      <span style={gradientStyle}>{children}</span>
    </Component>
  )
}
