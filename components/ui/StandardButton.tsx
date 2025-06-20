//. 📍 components/ui/StandardButton.tsx (v3.2 - Tipo de size Corregido)

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useMemo, useState, useRef, useCallback } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { useRipple } from "@/components/ripple/RippleProvider"; 
import { StandardIcon } from "./StandardIcon"; // StandardIconSize se importa indirectamente via standard-button-tokens
import { StandardTooltip } from "./StandardTooltip";
import {
	generateStandardButtonTokens,
	type StandardButtonTokenOptions,
	type StandardButtonRecipe,
	type StandardButtonStyleType,
	type StandardButtonModifier,
	type StandardButtonSize, // Este tipo ahora es el correcto, sin 'icon'.
	type StandardButtonRounded,
} from "@/lib/theme/components/standard-button-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 INTERFACE 📦
export type IconProps = React.SVGProps<SVGSVGElement>;

export interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	children: React.ReactNode;
	styleType?: StandardButtonStyleType;
	modifiers?: StandardButtonModifier[];
	colorScheme?: ColorSchemeVariant;
	leftIcon?: React.ComponentType<IconProps>;
	rightIcon?: React.ComponentType<IconProps>;
	loading?: boolean;
	loadingText?: string;
	size?: StandardButtonSize; // Ahora usa el tipo corregido.
	rounded?: StandardButtonRounded;
	fullWidth?: boolean;
	iconOnly?: boolean;
	tooltip?: string | React.ReactNode;
    disableRipple?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardButton = React.forwardRef<HTMLButtonElement, StandardButtonProps>(
	(
		{
			className,
			styleType = "solid",
			modifiers = [],
			size = "md",
			rounded = "md",
			colorScheme = "primary",
			asChild = false,
			leftIcon,
			rightIcon,
			iconOnly = false,
			loading = false,
			loadingText,
			fullWidth = false,
			children,
			disabled,
			tooltip,
            disableRipple = false, 
            onClick, 
			...props
		},
		ref
	) => {
		const { appColorTokens, mode } = useTheme();
		const [isPressed, setIsPressed] = useState(false);
		const [isHovered, setIsHovered] = useState(false);
		const isEffectivelyDisabled = disabled || loading;
        const buttonRef = useRef<HTMLButtonElement | null>(null);
        const triggerRipple = useRipple();

		const recipe: StandardButtonRecipe | null = useMemo(() => {
			if (!appColorTokens) return null;
            
            const computedModifiers = 
                styleType === "solid" && (!modifiers || modifiers.length === 0)
                    ? ['gradient', 'elevated'] as StandardButtonModifier[]
                    : modifiers;

			const options: StandardButtonTokenOptions = {
				styleType,
				colorScheme,
				size,
				rounded,
				modifiers: computedModifiers,
				isHovered,
				isPressed,
				isDisabled: !!isEffectivelyDisabled,
                iconOnly 
			};
			return generateStandardButtonTokens(appColorTokens, mode, options);
		}, [appColorTokens, mode, styleType, colorScheme, size, rounded, modifiers, isHovered, isPressed, isEffectivelyDisabled, iconOnly]);

		const componentStyles = useMemo(() => {
			if (!recipe) return {};
			const isGradient = recipe.background.includes('gradient');
			return {
                height: recipe.height,
                padding: recipe.padding,
                fontSize: recipe.fontSize,
                gap: recipe.gap,
                width: recipe.width, // Esto será clave para iconOnly
				backgroundColor: isGradient ? 'transparent' : recipe.background,
				backgroundImage: isGradient ? recipe.background : 'none',
				color: recipe.color,
				border: recipe.border,
				boxShadow: recipe.boxShadow,
				transform: recipe.transform,
				opacity: recipe.opacity,
                cursor: recipe.cursor,
                textDecoration: recipe.textDecoration,
			} as React.CSSProperties;
		}, [recipe]);
        
        const combinedRef = useCallback((node: HTMLButtonElement | null) => {
            buttonRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }, [ref]);

        const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isEffectivelyDisabled && !disableRipple && recipe) {
                const buttonRect = buttonRef.current?.getBoundingClientRect();
                const dimension = buttonRect ? buttonRect.height : 50; 
                const scale = (dimension / 8) * 0.875;
                triggerRipple(e, recipe.rippleColor, scale);
            }
            if (onClick) onClick(e);
        }, [isEffectivelyDisabled, disableRipple, recipe, triggerRipple, onClick]);
        
        const handleMouseDown = useCallback(() => { if (!isEffectivelyDisabled) setIsPressed(true); }, [isEffectivelyDisabled]);
		const handleMouseUp = useCallback(() => setIsPressed(false), []);
		const handleMouseEnter = useCallback(() => setIsHovered(true), []);
		const handleMouseLeave = useCallback(() => { setIsPressed(false); setIsHovered(false); }, []);

		if (!recipe) {
			return <button ref={ref} disabled className="opacity-50">{children}</button>;
		}

		const Comp = asChild ? Slot : "button";

		const renderIcon = (IconComponent: React.ComponentType<IconProps>) => (
			<StandardIcon
				size={recipe.iconSize}
				colorScheme={colorScheme}
				colorShade={recipe.iconColorShade}
			>
				<IconComponent />
			</StandardIcon>
		);

		const buttonContent = loading ? (
			<>
				<StandardIcon 
                    size={recipe.iconSize} 
                    colorShade={recipe.iconColorShade} 
                    colorScheme={colorScheme}
                    styleType="outline"
                    isSpinning={true}
                >
					<Loader2 />
				</StandardIcon>
				{/* Para iconOnly, el loadingText se muestra si iconOnly es false. Si es true, solo el spinner. */}
                {!iconOnly && <span>{loadingText === undefined ? 'Cargando...' : loadingText}</span>}
			</>
		) : (
			<>
				{leftIcon && renderIcon(leftIcon)}
				{/* Para iconOnly, los children se ignoran en favor del icono que se pasa como hijo. */}
                {!iconOnly && <span>{children}</span>}
				{rightIcon && renderIcon(rightIcon)}
			</>
		);

		const buttonElement = (
			<Comp
				className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-pure",
                    { "w-full": fullWidth },
                    rounded === 'sm' && 'rounded-sm',
                    rounded === 'md' && 'rounded-md',
                    rounded === 'lg' && 'rounded-lg',
                    rounded === 'full' && 'rounded-full',
                    className
                )}
				ref={combinedRef}
				disabled={isEffectivelyDisabled}
                style={componentStyles}
                onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} 
                onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
                onClick={handleClick} 
				{...props}
			>
                {/* Si es iconOnly, los children que se pasan son el propio icono (o el leftIcon si está presente). */}
				{iconOnly ? (leftIcon ? renderIcon(leftIcon) : (children ? <StandardIcon size={recipe.iconSize} colorScheme={colorScheme} colorShade={recipe.iconColorShade}>{children}</StandardIcon> : null)) : buttonContent}
			</Comp>
		);
        
        if (tooltip) {
			return (
				<StandardTooltip trigger={buttonElement} styleType="solid" colorScheme="neutral">
					{tooltip}
				</StandardTooltip>
			);
		}
		return buttonElement;
	}
);
StandardButton.displayName = "StandardButton";
export { StandardButton };
//#endregion ![main]