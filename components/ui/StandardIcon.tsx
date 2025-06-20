//. 📍 components/ui/StandardIcon.tsx (v2.3 - Añade prop isSpinning)

"use client";
import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { 
    generateStandardIconTokens, 
    type StandardIconStyleType, 
    type StandardIconColorShade, 
    type StandardIconRecipe,
    type StandardIconSize as ImportedIconSize
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
	children, className, size = "md", colorScheme = "neutral",
	styleType = "outline", colorShade = "pure",
    // ✅ Se recibe la nueva prop.
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

	const sizeClasses: Record<ImportedIconSize, string> = {
		xs: "w-4 h-4", sm: "w-5 h-5", base: "w-6 h-6", md: "w-6 h-6",
		lg: "w-8 h-8", xl: "w-10 h-10", "2xl": "w-12 h-12",
	};

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
                        // ✅ Se aplica la clase 'animate-spin' si isSpinning es true.
						className: cn(sizeClasses[size], { "animate-spin": isSpinning }, className),
						style: {
							...cssVariables,
							...(child.props.style || {}), 
							fill: 'var(--si-fill)',
							stroke: 'var(--si-stroke)',
							strokeWidth: 'var(--si-stroke-width)',
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