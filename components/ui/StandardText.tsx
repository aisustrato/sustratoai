// FILE: /Users/rodolfoleiva/Documents/SUSTRATO-AI/SUSTRATO.AI/components/ui/StandardText.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFontTheme } from "@/app/font-provider";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardTextTokens,
	type StandardTextTokens,
} from "@/lib/theme/components/standard-text-tokens";
import { useMemo } from "react";
import type { ProCardVariant as StandardTextColorScheme } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📝 TYPE DEFINITIONS 📝
// Tipos para las props del componente, basados en los tokens y la nueva jerga
type StandardTextVariant = keyof StandardTextTokens["variants"];
type StandardTextGradientType = keyof StandardTextTokens["gradients"] | boolean;
type StandardTextSize =
	| "xs"
	| "sm"
	| "base"
	| "md"
	| "lg"
	| "xl"
	| "2xl"
	| "3xl"
	| "4xl"
	| "5xl";
type StandardTextWeight = "normal" | "medium" | "semibold" | "bold";
type StandardTextAlign = "left" | "center" | "right" | "justify";
export type FontPairType = "heading" | "body";
type StandardTextColorShade = "pure" | "text" | "textShade";

export interface StandardTextProps extends React.HTMLAttributes<HTMLElement> {
	variant?: StandardTextVariant;
	size?: StandardTextSize;
	weight?: StandardTextWeight;
	align?: StandardTextAlign;
	asElement?: React.ElementType;
	truncate?: boolean;
	applyGradient?: StandardTextGradientType;
	colorScheme?: StandardTextColorScheme;
	colorShade?: StandardTextColorShade;
	className?: string;
	children: React.ReactNode;
	fontType?: FontPairType;
}
//#endregion ![def]

//#region [main] - 🚀 MAIN COMPONENT 🚀
export function StandardText({
	variant = "default",
	size,
	weight,
	align,
	asElement: Component = "p",
	truncate = false,
	applyGradient: initialGradient = false,
	colorScheme: initialColor,
	colorShade: colorVariant = "text", // Se usa colorVariant directamente aquí, con default "text"
	className,
	children,
	fontType,
	...props
}: StandardTextProps) {
	//#region [sub_init] - 🌱 HOOKS, INITIAL VALUES 🌱

	const { appColorTokens, mode } = useTheme();
	// const { fontTheme } = useFontTheme(); // fontTheme no se usa, se podría quitar si no es necesario para otra lógica

	const textTokens = useMemo(() => {
		if (!appColorTokens || !mode) return null;
		return generateStandardTextTokens(appColorTokens, mode);
	}, [appColorTokens, mode]);
	//#endregion ![sub_init]

	//#region [sub_logic] - 🧠 DERIVED LOGIC, STYLES 🧠
	if (!textTokens) {
		return (
			<Component className={className} {...props}>
				{children}
			</Component>
		);
	}

	// --- Lógica clonada de text.tsx ---
	let effectiveVariantForStyleDefaults = variant;
	if (
		typeof Component === "string" &&
		Component.startsWith("h") &&
		Component.length === 2 &&
		!fontType &&
		(variant === "default" ||
			variant === "label" ||
			variant === "caption" ||
			variant === "muted" ||
			variant === "subtitle")
	) {
		effectiveVariantForStyleDefaults = "heading";
	}

	const styleDefaults = textTokens.variants[effectiveVariantForStyleDefaults];
	let colorDefaultFromVariant = textTokens.variants[variant]
		.color as StandardTextColorScheme;

	let finalColorName: StandardTextColorScheme =
		initialColor || colorDefaultFromVariant;
	let finalGradient: StandardTextGradientType | boolean = initialGradient;
	const finalColorVariant = colorVariant || "text"; // La prop 'colorVariant' ahora es directamente el 'colorShade'

	if (initialColor === undefined && initialGradient === false) {
		if (variant === "heading") finalGradient = "primary";
		else if (variant === "subheading") finalColorName = "secondary";
		else if (variant === "title") finalColorName = "tertiary";
	}

	const finalSize = size || (styleDefaults.size as StandardTextSize);
	const finalWeight = weight || (styleDefaults.weight as StandardTextWeight);

	const determineFontType = (): FontPairType => {
		if (fontType) return fontType;
		if (
			typeof Component === "string" &&
			Component.startsWith("h") &&
			Component.length === 2
		)
			return "heading";
		switch (variant) {
			case "heading":
			case "title":
			case "subheading":
			case "subtitle":
				return "heading";
			default:
				return "body";
		}
	};
	const finalFontType = determineFontType();

	const sizeStyles: Record<StandardTextSize, string> = {
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
	};
	const weightStyles: Record<StandardTextWeight, string> = {
		normal: "font-normal",
		medium: "font-medium",
		semibold: "font-semibold",
		bold: "font-bold",
	};
	const alignStyles: Record<StandardTextAlign, string> = {
		left: "text-left",
		center: "text-center",
		right: "text-right",
		justify: "text-justify",
	};
	const variantStyles: Record<StandardTextVariant, string> = {
		default: "",
		heading: "tracking-tight",
		subheading: "",
		title: "",
		subtitle: "",
		label: "",
		caption: "",
		muted: "",
	};

	const classes = cn(
		variantStyles[variant],
		sizeStyles[finalSize],
		weightStyles[finalWeight],
		align && alignStyles[align],
		truncate && "truncate",
		className
	);

	const getTextColor = () => {
		if (finalGradient) return "transparent";
		const tokenSet = textTokens.colors[finalColorName];
		if (!tokenSet) return "inherit";

		// CORREGIDO: Eliminada la línea que chequeaba `finalColorVariant === "dark"`
		if (finalColorVariant === "textShade" && tokenSet.textShade)
			return tokenSet.textShade;
		if (finalColorVariant === "pure" && tokenSet.pure) return tokenSet.pure;
		return tokenSet.text;
	};

	const baseStyle: React.CSSProperties = {
		color: getTextColor(),
		fontFamily:
			finalFontType === "heading"
				? "var(--font-family-headings)"
				: "var(--font-family-base)",
		fontWeight:
			finalFontType === "heading"
				? "var(--font-weight-headings)"
				: "var(--font-weight-base)",
		letterSpacing:
			finalFontType === "heading"
				? "var(--letter-spacing-headings)"
				: "var(--letter-spacing-body)",
		lineHeight: "var(--line-height)",
	};
	//#endregion ![sub_logic]

	//#region [sub_render_logic] - ✨ GRADIENT/RENDER LOGIC ✨
	if (!finalGradient) {
		return (
			<Component className={classes} style={baseStyle} {...props}>
				{children}
			</Component>
		);
	}

	const gradientTypeToUse = finalGradient === true ? "primary" : finalGradient;
	const gradientColors =
		textTokens.gradients[
			gradientTypeToUse as keyof typeof textTokens.gradients
		];

	if (!gradientColors) {
		return (
			<Component className={classes} style={baseStyle} {...props}>
				{children}
			</Component>
		);
	}

	const gradientStyle: React.CSSProperties = {
		backgroundImage: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.middle} 50%, ${gradientColors.end})`,
		backgroundSize: "100%",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
		color: "transparent",
		fontFamily:
			finalFontType === "heading"
				? "var(--font-family-headings)"
				: "var(--font-family-base)",
		fontWeight:
			finalFontType === "heading"
				? "var(--font-weight-headings)"
				: "var(--font-weight-base)",
		letterSpacing:
			finalFontType === "heading"
				? "var(--letter-spacing-headings)"
				: "var(--letter-spacing-body)",
		lineHeight: "var(--line-height)",
		paddingBottom: "0.1em",
		display: "inline-block",
	};

	const containerStyle: React.CSSProperties = {
		fontFamily: baseStyle.fontFamily,
		fontWeight: baseStyle.fontWeight,
		letterSpacing: baseStyle.letterSpacing,
		lineHeight: baseStyle.lineHeight,
	};
	//#endregion ![sub_render_logic]

	//#region [render] - 🖼️ JSX RENDERING 🖼️
	return (
		<Component className={classes} style={containerStyle} {...props}>
			<span style={gradientStyle}>{children}</span>
		</Component>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🚪 EXPORTS 🚪
// StandardText component is exported above where it's defined.
// Type exports (StandardTextProps, FontPairType) are in [def] region.
//#endregion ![foo]

//#region [todo] - 📝 FUTURE TASKS 📝
// -
//#endregion ![todo]
