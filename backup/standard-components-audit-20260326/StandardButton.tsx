// 📍 components/ui/StandardButton.tsx (v4.2 - SOBERANÍA DE ANIMACIÓN)
// 🎯 PROPÓSITO: Botón estándar - primera flor del jardín de componentes
// 🔧 DECISIÓN: CSS dinámico para animaciones, inline para colores (patrón Flex)
// ✅ ARQUITECTURA: Doble capa - inline styles (colores) + CSS classes (animaciones)
// 🌸 FILOSOFÍA: Humanismo en co-evolución AI - interfaces que respiran

//#region [imports] - 📦 IMPORTS
"use client";

import * as React from "react";
import {
	useMemo,
	useState,
	useRef,
	useCallback,
	useEffect,
	useId,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { useRipple } from "@/components/ripple/RippleProvider";
import { StandardIcon } from "./StandardIcon";
import { StandardTooltip } from "./StandardTooltip";
import type {
	StandardButtonStyleType,
	StandardButtonModifier,
	StandardButtonSize,
	StandardButtonRounded,
} from "@/lib/theme/components/standard-button-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";
//#endregion

//#region [types] - 🎨 TIPOS E INTERFACES
export type IconProps = React.SVGProps<SVGSVGElement>;

export interface StandardButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	children?: React.ReactNode;
	styleType?: StandardButtonStyleType;
	modifiers?: StandardButtonModifier[];
	colorScheme?: ColorSchemeVariant;
	leftIcon?: React.ComponentType<IconProps>;
	rightIcon?: React.ComponentType<IconProps>;
	loading?: boolean;
	loadingText?: string;
	size?: StandardButtonSize;
	rounded?: StandardButtonRounded;
	fullWidth?: boolean;
	iconOnly?: boolean;
	tooltip?: string | React.ReactNode;
	disableRipple?: boolean;
	// 🌍 i18n-ready: Preparado para internacionalización
	"aria-label"?: string;
	// 🎨 Personalidad visual
	breathing?: boolean; // Sutil animación de "respiración" para CTAs importantes
}
//#endregion

//#region [component] - 🚀 COMPONENTE PRINCIPAL
// 💎 CORE: Componente StandardButton - usa tokens PRECALCULADOS
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
			breathing = false,
			onClick,
			...props
		},
		ref,
	) => {
		// 💎 CORE: Tokens precalculados - NO recalcula en cada render
		const { tokens } = useDesignTokens();
		const buttonRef = useRef<HTMLButtonElement | null>(null);
		const triggerRipple = useRipple();
		const buttonId = useId().replace(/:/g, ""); // ID único para CSS scoped
		const isEffectivelyDisabled = disabled || loading;

		// 🔄 HELPER: Determinar styleType efectivo y modificadores
		const effectiveStyleType =
			styleType === "solid" && (!modifiers || modifiers.length === 0) ?
				"solid"
			:	styleType;
		const hasGradient =
			styleType === "solid" &&
			(!modifiers || modifiers.length === 0 || modifiers.includes("gradient"));
		const hasElevated =
			modifiers?.includes("elevated") ||
			(styleType === "solid" && (!modifiers || modifiers.length === 0));

		// 💎 CORE: Obtener tokens precalculados (SIN recálculo)
		const sizeTokens = tokens?.button.sizes[size];
		const styleTokens =
			tokens?.button.styles[colorScheme]?.[effectiveStyleType];

		// 🏛️ PATRÓN FLEX: CSS dinámico inyectado para animaciones
		// Las animaciones viven en CSS classes, NO en inline styles
		useEffect(() => {
			if (!styleTokens) return;

			const baseColor = styleTokens.background;
			const hoverBg = styleTokens.hoverBackground;
			const gradientStart = tinycolor(baseColor).lighten(10).toHexString();
			const gradientEnd = tinycolor(baseColor).darken(10).toHexString();
			const hoverGradientStart = tinycolor(baseColor).darken(10).toHexString();
			const hoverGradientEnd = tinycolor(baseColor).lighten(10).toHexString();
			const pressedGradientStart = tinycolor(baseColor)
				.lighten(10)
				.darken(12)
				.toHexString();
			const pressedGradientEnd = tinycolor(baseColor)
				.darken(10)
				.darken(12)
				.toHexString();

			const styleElement = document.createElement("style");
			styleElement.setAttribute("data-button-id", buttonId);
			styleElement.textContent = `
				/* 🎨 Base: Elevated shadow */
				.btn-${buttonId}.btn-elevated {
					box-shadow: 0 4px 6px -1px rgba(0,0,0, 0.1), 0 2px 4px -2px rgba(0,0,0, 0.1);
				}
				
				/* 🔄 Hover states */
				.btn-${buttonId}:not(:disabled):hover {
					transform: translateY(-1px);
				}
				.btn-${buttonId}.btn-elevated:not(:disabled):hover {
					transform: translateY(-3px);
					box-shadow: 0 10px 15px -3px rgba(0,0,0, 0.1), 0 4px 6px -4px rgba(0,0,0, 0.1);
				}
				.btn-${buttonId}.btn-gradient:not(:disabled):hover {
					background-image: linear-gradient(to bottom right, ${hoverGradientStart}, ${hoverGradientEnd});
				}
				.btn-${buttonId}.btn-solid:not(.btn-gradient):not(:disabled):hover {
					background-color: ${hoverBg};
				}
				.btn-${buttonId}.btn-link:not(:disabled):hover {
					text-decoration: underline;
				}
				
				/* 🔄 Active/Pressed states */
				.btn-${buttonId}:not(:disabled):active {
					transform: translateY(0.5px);
					box-shadow: inset 0 2px 4px rgba(0,0,0, 0.06);
				}
				.btn-${buttonId}.btn-gradient:not(:disabled):active {
					background-image: linear-gradient(to bottom right, ${pressedGradientStart}, ${pressedGradientEnd});
				}
				
				/* 🌸 Breathing animation */
				.btn-${buttonId}.btn-breathing:not(:disabled) {
					animation: breathe-${buttonId} 3s ease-in-out infinite;
				}
				@keyframes breathe-${buttonId} {
					0%, 100% { 
						box-shadow: 0 0 0 0 ${tinycolor(baseColor).setAlpha(0.4).toRgbString()};
						transform: scale(1);
					}
					50% { 
						box-shadow: 0 0 0 8px ${tinycolor(baseColor).setAlpha(0).toRgbString()};
						transform: scale(1.02);
					}
				}
				
				/* ❌ Disabled state */
				.btn-${buttonId}:disabled {
					opacity: 0.6;
					cursor: not-allowed;
					transform: none !important;
					box-shadow: none !important;
					animation: none !important;
				}
			`;
			document.head.appendChild(styleElement);

			return () => {
				const existing = document.querySelector(
					`style[data-button-id="${buttonId}"]`,
				);
				if (existing) document.head.removeChild(existing);
			};
		}, [buttonId, styleTokens]);

		// 🎨 INLINE STYLES: Solo colores y dimensiones (SIN animaciones)
		const componentStyles = useMemo(() => {
			if (!sizeTokens || !styleTokens) return {};

			let background = styleTokens.background;

			// 🎨 Gradient base (sin estados - esos van en CSS)
			if (hasGradient && styleType === "solid") {
				const start = tinycolor(styleTokens.background)
					.lighten(10)
					.toHexString();
				const end = tinycolor(styleTokens.background).darken(10).toHexString();
				background = `linear-gradient(to bottom right, ${start}, ${end})`;
			}

			const isGradient = background.includes("gradient");

			return {
				// 📐 Dimensiones
				height: sizeTokens.height,
				padding: iconOnly ? "0" : sizeTokens.padding,
				fontSize: sizeTokens.fontSize,
				gap: iconOnly ? "0" : sizeTokens.gap,
				width: iconOnly ? sizeTokens.height : undefined,
				// 🎨 Colores (SIN boxShadow ni transform - esos van en CSS classes)
				backgroundColor: isGradient ? "transparent" : background,
				backgroundImage: isGradient ? background : "none",
				color: styleTokens.color,
				border: styleTokens.border,
			} as React.CSSProperties;
		}, [sizeTokens, styleTokens, iconOnly, hasGradient, styleType]);

		// 🏷️ CSS Classes para estados de animación
		const animationClasses = useMemo(() => {
			return cn(
				`btn-${buttonId}`,
				hasElevated && "btn-elevated",
				hasGradient && "btn-gradient",
				styleType === "solid" && "btn-solid",
				styleType === "link" && "btn-link",
				breathing && "btn-breathing",
			);
		}, [buttonId, hasElevated, hasGradient, styleType, breathing]);

		const combinedRef = useCallback(
			(node: HTMLButtonElement | null) => {
				buttonRef.current = node;
				if (typeof ref === "function") ref(node);
				else if (ref)
					(ref as React.MutableRefObject<HTMLButtonElement | null>).current =
						node;
			},
			[ref],
		);

		const handleClick = useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (!isEffectivelyDisabled && !disableRipple && styleTokens) {
					const buttonRect = buttonRef.current?.getBoundingClientRect();
					const dimension = buttonRect ? buttonRect.height : 50;
					const scale = (dimension / 8) * 0.875;
					triggerRipple(e, styleTokens.rippleColor, scale);
				}
				if (onClick) onClick(e);
			},
			[
				isEffectivelyDisabled,
				disableRipple,
				styleTokens,
				triggerRipple,
				onClick,
			],
		);

		// 🏛️ PATRÓN FLEX: Ya no necesitamos trackear hover/pressed en React
		// CSS maneja :hover y :active nativamente via las clases inyectadas

		// 🔄 FALLBACK: Si tokens no están listos, mostrar botón deshabilitado
		if (!sizeTokens || !styleTokens) {
			return (
				<button ref={ref} disabled className="opacity-50">
					{children}
				</button>
			);
		}

		const Comp = asChild ? Slot : "button";

		const renderIcon = (IconComponent: React.ComponentType<IconProps>) => (
			<StandardIcon
				size={sizeTokens.iconSize}
				colorScheme={colorScheme}
				colorShade={styleTokens.iconColorShade}>
				<IconComponent />
			</StandardIcon>
		);

		const buttonContent =
			loading ?
				<>
					<StandardIcon
						size={sizeTokens.iconSize}
						colorShade={styleTokens.iconColorShade}
						colorScheme={colorScheme}
						styleType="outline"
						isSpinning={true}>
						<Loader2 />
					</StandardIcon>
					{/* Para iconOnly, el loadingText se muestra si iconOnly es false. Si es true, solo el spinner. */}
					{!iconOnly && (
						<span>
							{loadingText === undefined ? "Cargando..." : loadingText}
						</span>
					)}
				</>
			:	<>
					{leftIcon && renderIcon(leftIcon)}
					{/* Para iconOnly, los children se ignoran en favor del icono que se pasa como hijo. */}
					{!iconOnly && <span>{children}</span>}
					{rightIcon && renderIcon(rightIcon)}
				</>;

		const buttonElement = (
			<Comp
				className={cn(
					// 🌸 Base: Transiciones orgánicas
					"inline-flex items-center justify-center whitespace-nowrap font-medium",
					"transition-all duration-300 ease-out",
					// 🎯 Focus: Anillo sutil
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
					"focus-visible:ring-current focus-visible:ring-opacity-50",
					// 📐 Dimensiones
					{ "w-full": fullWidth },
					// 🔘 Bordes redondeados
					rounded === "sm" && "rounded-sm",
					rounded === "md" && "rounded-md",
					rounded === "lg" && "rounded-lg",
					rounded === "full" && "rounded-full",
					// 🏛️ PATRÓN FLEX: Clases CSS dinámicas para animaciones
					animationClasses,
					className,
				)}
				ref={combinedRef}
				disabled={isEffectivelyDisabled}
				style={componentStyles}
				onClick={handleClick}
				{...props}>
				{/* Si es iconOnly, los children que se pasan son el propio icono (o el leftIcon si está presente). */}
				{iconOnly ?
					leftIcon ?
						renderIcon(leftIcon)
					: children ?
						<StandardIcon
							size={sizeTokens.iconSize}
							colorScheme={colorScheme}
							colorShade={styleTokens.iconColorShade}>
							{children}
						</StandardIcon>
					:	null
				:	buttonContent}
			</Comp>
		);

		if (tooltip) {
			return (
				<StandardTooltip
					trigger={buttonElement}
					styleType="solid"
					colorScheme="neutral">
					{tooltip}
				</StandardTooltip>
			);
		}
		return buttonElement;
	},
);
StandardButton.displayName = "StandardButton";

//#region [exports] - 📦 EXPORTS
export { StandardButton };
//#endregion
//#endregion
