"use client";

import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { StandardText } from "./StandardText";
import { StandardIcon } from "./StandardIcon";
import type {
	StandardBadgeSize,
	StandardBadgeStyleType,
} from "@/lib/theme/components/standard-badge-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";

// 🎯 Extensión para CSS Properties personalizadas del Badge
interface CustomCSSProperties extends React.CSSProperties {
	"--badge-base-border"?: string;
	"--badge-glow-color"?: string;
	"--badge-light-border"?: string;
	"--badge-light-border-5"?: string;
}

// 📌 Re-exportamos tipos para consumidores
export type { StandardBadgeStyleType, StandardBadgeSize };

export interface StandardBadgeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	colorScheme?: ColorSchemeVariant;
	styleType?: StandardBadgeStyleType;
	size?: StandardBadgeSize;
	leftIcon?: React.ComponentType<{ className?: string }>;
	rightIcon?: React.ComponentType<{ className?: string }>;
	iconClassName?: string;
	children: React.ReactNode;
	// 🌊 Efectos SUSTRATO - Retroalimentación visual al humano
	pulseBorder?: boolean; // Respiración sutil del borde (2.5s ciclo)
	pafffMoment?: boolean; // Latido de coherencia (1.5s ciclo)
	/**
	 * Modo multilínea: permite que el contenido del badge crezca verticalmente
	 * y ajuste el radio de borde para que el badge no reviente con texto largo.
	 * Cuando es `true`, el badge usa `min-height` en vez de `height` fijo,
	 * y el texto interno usa `leading-snug` en vez de `leading-none`.
	 */
	multiline?: boolean;
}

// 💎 CORE: Componente StandardBadge (v4 - Patrón Flex + Tokens Provider)
const StandardBadge = React.forwardRef<HTMLDivElement, StandardBadgeProps>(
	(
		{
			className,
			colorScheme = "primary",
			styleType = "subtle",
			size = "md",
			leftIcon: LeftIcon,
			rightIcon: RightIcon,
			iconClassName,
			children,
			pulseBorder = false,
			pafffMoment = false,
			multiline = false,
			...props
		},
		ref,
	) => {
		// 1. 🌉 THE BRIDGE: Consumir tokens precalculados
		const { tokens } = useDesignTokens();

		// 2. 🛡️ SAFEGUARDS: Fallback seguro si los tokens no están listos (ej. SSR o error de provider)
		const sizeTokens = tokens?.badge.sizes[size];
		const styleTokens = tokens?.badge.styles[colorScheme]?.[styleType];

		// 3. 🎨 INLINE STYLES COMPUTADOS (patrón StandardSelect v4.3)
		const computedStyle = useMemo((): CustomCSSProperties => {
			if (!sizeTokens || !styleTokens) return {};

			// 🧠 Lógica JS determinando colores derivados para animaciones
			const baseBackground = styleTokens.background;
			const baseBorder =
				styleTokens.border.includes("transparent") ?
					tinycolor(baseBackground).toRgbString()
				:	styleTokens.border.replace(/^1px solid /, "");
			const glowColor = tinycolor(baseBorder).setAlpha(0.4).toRgbString();

			return {
				// 📐 Dimensiones estructurales
				...(multiline
					? { minHeight: sizeTokens.height }
					: { height: sizeTokens.height }),
				padding: sizeTokens.padding,
				fontSize: sizeTokens.fontSize,
				gap: sizeTokens.gap,
				// 🎨 Colores base
				backgroundColor: styleTokens.background,
				color: styleTokens.color,
				border: styleTokens.border,
				// CSS Variables para animaciones
				"--badge-base-border": baseBorder,
				"--badge-glow-color": glowColor,
				"--badge-light-border": tinycolor(baseBorder).lighten(10).toRgbString(),
				"--badge-light-border-5": tinycolor(baseBorder)
					.lighten(5)
					.toRgbString(),
			};
		}, [sizeTokens, styleTokens]);

		// 🔄 FALLBACK VISUAL: Skeleton o estado base si no hay tokens
		if (!sizeTokens || !styleTokens) {
			return (
				<div
					ref={ref}
					className={cn(
						"inline-flex items-center justify-center rounded-full bg-neutral-200 animate-pulse h-6 w-16",
						className,
					)}
					{...props}
				/>
			);
		}

		return (
			<div
				ref={ref}
				className={cn(
					// Clases base utilitarias (Layout & Shape)
					"inline-flex items-center justify-center font-medium transition-colors duration-200",
					multiline ? "rounded-xl flex-wrap" : "rounded-full",
					// 🌊 Efectos SUSTRATO - Retroalimentación visual al humano (solo animaciones)
					pulseBorder && "badge-pulse-border",
					pafffMoment && "badge-pafff-moment",
					// Estilos específicos inyectados
					className,
				)}
				style={computedStyle}
				{...props}>
				{LeftIcon && (
					<StandardIcon
						size={sizeTokens.iconSize}
						colorScheme={colorScheme}
						colorShade={styleTokens.iconColorShade}
						className={cn("-ml-0.5", iconClassName)}>
						<LeftIcon />
					</StandardIcon>
				)}

				{/* El texto hereda el color del contenedor (establecido por CSS inyectado) */}
				<StandardText
					asElement="span"
					size={size === "2xs" ? "4xs" : size}
					className={cn("text-inherit", multiline ? "leading-snug" : "leading-none")}>
					{children}
				</StandardText>

				{RightIcon && (
					<StandardIcon
						size={sizeTokens.iconSize}
						colorScheme={colorScheme}
						colorShade={styleTokens.iconColorShade}
						className={cn("-mr-0.5", iconClassName)}>
						<RightIcon />
					</StandardIcon>
				)}
			</div>
		);
	},
);

StandardBadge.displayName = "StandardBadge";

export { StandardBadge };
