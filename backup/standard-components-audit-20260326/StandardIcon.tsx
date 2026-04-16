// 📍 components/ui/StandardIcon.tsx (v4.0 - Patrón Flex + Tokens Provider)
// 🎯 PROPÓSITO: Wrapper de iconos SVG con tokens precalculados
// 🔧 ARQUITECTURA: Consume tokens desde DesignTokensProvider (sin efectos SUSTRATO)

"use client";
import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { IconSize, IconStyleType, IconColorShade } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

export interface StandardIconProps extends React.SVGProps<SVGSVGElement> {
	children: React.ReactNode;
	className?: string;
	size?: IconSize;
	colorScheme?: ColorSchemeVariant;
	styleType?: IconStyleType;
	colorShade?: IconColorShade;
	isSpinning?: boolean;
}

export type { IconSize as StandardIconSize };

export function StandardIcon({
	children,
	className,
	size = "md",
	colorScheme = "neutral",
	styleType = "outline",
	colorShade = "pure",
	isSpinning = false,
	...props
}: StandardIconProps) {
	// 💎 CORE: Tokens precalculados - NO recalcula en cada render
	const { tokens } = useDesignTokens();

	// 🛡️ SAFEGUARDS: Fallback seguro si los tokens no están listos
	const sizeValue = tokens?.icon.sizes[size];
	const styleTokens = tokens?.icon.styles[colorScheme]?.[styleType]?.[colorShade];

	const cssVariables = useMemo(() => {
		if (!styleTokens) return {};
		return {
			"--si-fill": styleTokens.fill,
			"--si-stroke": styleTokens.stroke,
			"--si-stroke-width": "1.5",
		};
	}, [styleTokens]);

	// 🔄 FALLBACK: Si no hay tokens, mostrar skeleton
	if (!sizeValue || !styleTokens) {
		return (
			<div 
				style={{ width: '1.5rem', height: '1.5rem' }} 
				className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
			/>
		);
	}

	return (
		<>
			{styleTokens.defs && (
				<svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
					<g dangerouslySetInnerHTML={{ __html: styleTokens.defs }} />
				</svg>
			)}
			{React.Children.map(children, (child) => {
				if (React.isValidElement(child)) {
					return React.cloneElement(child as React.ReactElement<React.SVGProps<SVGSVGElement>>, {
						className: cn({ "animate-spin": isSpinning }, className),
						style: {
							...cssVariables,
							width: sizeValue,
							height: sizeValue,
							...(child.props.style || {}),
							fill: "var(--si-fill)",
							stroke: "var(--si-stroke)",
							strokeWidth: "var(--si-stroke-width)",
						},
						...props,
					});
				}
				return child;
			})}
		</>
	);
}

export function createStandardIcon(
	IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>,
	defaultProps: Partial<StandardIconProps> = {}
) {
	const WrappedIcon = (props: Partial<StandardIconProps>) => (
		<StandardIcon {...defaultProps} {...props}>
			<IconComponent />
		</StandardIcon>
	);
	WrappedIcon.displayName = `StandardIcon(${IconComponent.displayName || "Icon"})`;
	return WrappedIcon;
}

// Re-exportar tipos para compatibilidad
export type { IconStyleType as StandardIconStyleType, IconColorShade as StandardIconColorShade } from "@/app/providers/DesignTokensProvider";
