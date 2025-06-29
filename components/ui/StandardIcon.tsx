//. 📍 components/ui/StandardIcon.tsx (v2.3 - Añade prop isSpinning)

"use client";
import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardIconTokens,
	standardIconSizeTokens,
	type StandardIconStyleType,
	type StandardIconColorShade,
	type StandardIconRecipe,
	type StandardIconSize as ImportedIconSize,
} from "@/lib/theme/components/standard-icon-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

export interface StandardIconProps extends React.SVGProps<SVGSVGElement> {
	children: React.ReactNode;
	className?: string;
	size?: ImportedIconSize;
	colorScheme?: ColorSchemeVariant;
	styleType?: StandardIconStyleType;
	colorShade?: StandardIconColorShade;
    // ✅ Se añade la nueva prop para la animación de giro.
    isSpinning?: boolean;
}

export type { ImportedIconSize as StandardIconSize };

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
	const { appColorTokens, mode } = useTheme();

	const recipe: StandardIconRecipe | null = useMemo(() => {
		if (!appColorTokens || !mode) return null;
		return generateStandardIconTokens(appColorTokens, mode, colorScheme, styleType, colorShade);
	}, [appColorTokens, mode, colorScheme, styleType, colorShade]);

	const cssVariables = useMemo(() => {
		if (!recipe) return {};
		return {
			"--si-fill": recipe.fill,
			"--si-stroke": recipe.stroke,
			"--si-stroke-width": "1.5",
		};
	}, [recipe]);

	// ✅ Se obtienen los valores de tamaño desde los tokens centralizados.
	const sizeValue = standardIconSizeTokens[size];

	return (
		<>
			{recipe?.defs && (
				<svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
					<g dangerouslySetInnerHTML={{ __html: recipe.defs }} />
				</svg>
			)}
			{React.Children.map(children, (child) => {
				if (React.isValidElement(child)) {
					return React.cloneElement(child as React.ReactElement<React.SVGProps<SVGSVGElement>>, {
						// ✅ Se eliminan las clases de tamaño, ahora se manejan con estilos en línea.
						className: cn({ "animate-spin": isSpinning }, className),
						style: {
							...cssVariables,
							// ✅ Se aplican los tamaños desde los tokens.
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