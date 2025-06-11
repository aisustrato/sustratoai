//. 📍 components/ui/StandardIcon.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardIconTokens,
	type StandardIconColor,
	type StandardIconSize,
	type StandardIconTokens,
} from "@/lib/theme/components/standard-icon-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardIconProps {
	children?: React.ReactNode;
	className?: string;
	size?: StandardIconSize;

	//> 💡 CORREGIDO: Se añade la opción 'inherit' para máxima flexibilidad.
	colorScheme?: ColorSchemeVariant | 'inherit';
	colorShade?: "pure" | "text" | "shade" | "bg";
	
	applyGradient?: boolean;
	gradientColorScheme?: ColorSchemeVariant;
	strokeOnly?: boolean;
	inverseStroke?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function StandardIcon({
	children,
	className,
	size = "md",
	colorScheme,
	colorShade,
	applyGradient,
	gradientColorScheme,
	strokeOnly = false,
	inverseStroke,
	...props
}: StandardIconProps) {
	//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
	const color: StandardIconColor = (colorScheme === 'inherit' ? 'default' : colorScheme) || "default";
	const internalColorVariant = colorShade || "text";
	const gradient = applyGradient || false;
	const gradientWith: StandardIconColor = gradientColorScheme || "accent";
	const internalGradientColorVariant = "text";
	//#endregion ![sub_bridge]

	//#region [sub_init] - 🪝 HOOKS & MEMOS 🪝
	const { appColorTokens, mode } = useTheme();

	const iconComponentTokens: StandardIconTokens | null = React.useMemo(() => {
		if (!appColorTokens) return null;
		return generateStandardIconTokens(appColorTokens, mode);
	}, [appColorTokens, mode]);

	const useInverseStroke = gradient && inverseStroke !== false;

	const sizeClasses: Record<StandardIconSize, string> = {
		xs: "w-4 h-4", sm: "w-5 h-5", md: "w-6 h-6",
		lg: "w-8 h-8", xl: "w-10 h-10", "2xl": "w-12 h-12",
	};

	const gradientId = React.useId();
	const strokeGradientId = React.useId();
	const inverseGradientId = React.useId();
	//#endregion ![sub_init]

	//#region [sub_logic] - 💡 LOGIC & HELPERS 💡
	const getColorValue = (
		targetColor: StandardIconColor,
		variant: "pure" | "text" | "shade" | "bg"
	): string => {
		if (!iconComponentTokens?.colors) return "currentColor";
		const tokenSet = iconComponentTokens.colors[targetColor];
		return tokenSet ? tokenSet[variant] || tokenSet.text : "currentColor";
	};

	const finalIconColor = getColorValue(color, internalColorVariant);

	let baseGradientColor = "currentColor";
	let secondGradientColor = "currentColor";

	if (iconComponentTokens?.colors) {
		const mainColorSet = iconComponentTokens.colors[color];
		if (mainColorSet) {
			baseGradientColor = strokeOnly ? mainColorSet.pure : mainColorSet.bg;
		}
		secondGradientColor = getColorValue(gradientWith, internalGradientColorVariant);
	}

	const getIconStyle = (): React.CSSProperties => {
        //> 💡 CORREGIDO: Lógica para manejar 'inherit' usando currentColor.
		if (colorScheme === 'inherit') {
			return { color: 'currentColor' };
		}
		if (!gradient) {
			return { color: finalIconColor };
		}
		if (strokeOnly) {
			return { stroke: `url(#${strokeGradientId})`, fill: "none" };
		}
		if (useInverseStroke) {
			return { fill: `url(#${gradientId})`, stroke: `url(#${inverseGradientId})` };
		}
		return { fill: `url(#${gradientId})`, stroke: `url(#${gradientId})` };
	};
	//#endregion ![sub_logic]

	//#region [render] - 🎨 RENDER 🎨
	return (
		<>
			{gradient && (
				<svg width="0" height="0" style={{ position: "absolute" }}>
					<defs>
						<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor={baseGradientColor} />
							<stop offset="100%" stopColor={secondGradientColor} />
						</linearGradient>
						<linearGradient id={strokeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor={baseGradientColor} />
							<stop offset="100%" stopColor={secondGradientColor} />
						</linearGradient>
						<linearGradient id={inverseGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor={secondGradientColor} />
							<stop offset="100%" stopColor={baseGradientColor} />
						</linearGradient>
					</defs>
				</svg>
			)}
			{React.Children.map(children, (child) => {
				if (React.isValidElement(child)) {
					return React.cloneElement(child as React.ReactElement<any>, {
						className: cn(sizeClasses[size], className),
						style: getIconStyle(),
						...props,
					});
				}
				return child;
			})}
		</>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS & HELPERS 🔚
export function createStandardIcon(
	IconComponent: React.ComponentType<any>,
	defaultProps: Partial<StandardIconProps> = {}
) {
	const WrappedIcon = (props: Partial<StandardIconProps>) => (
		<StandardIcon {...defaultProps} {...props}>
			<IconComponent />
		</StandardIcon>
	);
	WrappedIcon.displayName = `StandardIcon(${ IconComponent.displayName || "Icon" })`;
	return WrappedIcon;
}
//#endregion ![foo]