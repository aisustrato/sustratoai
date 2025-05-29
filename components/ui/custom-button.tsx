"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { useRipple } from "@/components/ripple/RippleProvider";
import {
	generateButtonTokens,
	type ButtonColor,
	type ButtonRounded,
	type ButtonSize,
	type ButtonVariant,
} from "@/lib/theme/components/button-tokens";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// Definimos las propiedades del botón
export interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	iconOnly?: boolean;
	loading?: boolean;
	loadingText?: string;
	fullWidth?: boolean;
	color?: ButtonColor;
	rounded?: ButtonRounded;
	bordered?: boolean;
	gradient?: boolean;
	elevated?: boolean;
	variant?: ButtonVariant;
	/**
	 * Permite los tamaños estándar y "icon" para icon-only
	 */
	size?: ButtonSize | "icon";
	disableRipple?: boolean;
	tooltip?: string | React.ReactNode;
}

// Definimos las variantes del botón usando CVA
const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none disabled:pointer-events-none relative overflow-hidden",
	{
		variants: {
			variant: {
				solid: "",
				outline: "",
				ghost: "",
				link: "underline-offset-4 hover:underline",
				subtle: "",
			},
			size: {
				xs: "",
				sm: "",
				md: "",
				lg: "",
				xl: "",
			},
			rounded: {
				none: "",
				sm: "",
				md: "",
				lg: "",
				full: "",
			},
			fullWidth: {
				true: "w-full",
			},
			bordered: {
				true: "",
			},
			gradient: {
				true: "",
			},
			elevated: {
				true: "",
			},
			iconOnly: {
				true: "",
			},
		},
		defaultVariants: {
			variant: "solid",
			size: "md",
			rounded: "md",
		},
	}
);

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
	(
		{
			className,
			variant = "solid",
			size = "md",
			rounded = "md",
			color = "primary",
			asChild = false,
			leftIcon,
			rightIcon,
			iconOnly = false,
			loading = false,
			loadingText,
			fullWidth = false,
			bordered = false,
			gradient = false,
			elevated = false,
			children,
			disabled,
			disableRipple = false,
			tooltip,
			onClick,
			...props
		},
		ref
	) => {
		const { appColorTokens, mode } = useTheme();
		const buttonTokens = React.useMemo(() => {
			if (!appColorTokens) return null;
			return generateButtonTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);

		const triggerRipple = useRipple();

		const [isPressed, setIsPressed] = React.useState(false);
		const [isHovered, setIsHovered] = React.useState(false);

		const buttonRef = React.useRef<HTMLButtonElement | null>(null);
		const leftIconRef = React.useRef<HTMLSpanElement | null>(null);
		const rightIconRef = React.useRef<HTMLSpanElement | null>(null);
		const textRef = React.useRef<HTMLSpanElement | null>(null);

		// Corregido: Usar una función de callback para manejar la referencia
		const combinedRef = React.useCallback(
			(node: HTMLButtonElement | null) => {
				// Asignar a buttonRef.current
				buttonRef.current = node;

				// Manejar la ref externa
				if (typeof ref === "function") {
					ref(node);
				} else if (ref) {
					// Usar una asignación segura para TypeScript
					(ref as React.MutableRefObject<HTMLButtonElement | null>).current =
						node;
				}
			},
			[ref]
		);

		const handleMouseDown = React.useCallback(() => {
			if (disabled || loading) return;
			setIsPressed(true);
		}, [disabled, loading]);

		const handleMouseUp = React.useCallback(() => {
			setIsPressed(false);
		}, []);

		const handleMouseEnter = React.useCallback(() => {
			setIsHovered(true);
		}, []);

		const handleMouseLeave = React.useCallback(() => {
			setIsPressed(false);
			setIsHovered(false);
		}, []);

		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (
					disabled ||
					loading ||
					disableRipple ||
					!buttonTokens ||
					!appColorTokens
				)
					return;

				let finalRippleColor = "";

				// Lógica mejorada para el color del ripple
				if (variant === "solid") {
					// Para botones solid, usamos el color bg de la variante correspondiente
					// Esto asegura que el ripple sea un tono del color del botón, no un blanco fijo
					switch (color) {
						case "primary":
							finalRippleColor = appColorTokens.primary.bg;
							break;
						case "secondary":
							finalRippleColor = appColorTokens.secondary.bg;
							break;
						case "tertiary":
							finalRippleColor = appColorTokens.tertiary.bg;
							break;
						case "accent":
							finalRippleColor = appColorTokens.accent.bg;
							break;
						case "success":
							finalRippleColor = appColorTokens.success.bg;
							break;
						case "warning":
							finalRippleColor = appColorTokens.warning.bg;
							break;
						case "danger":
							finalRippleColor = appColorTokens.danger.bg;
							break;
						case "default":
							finalRippleColor =
								mode === "dark"
									? "rgba(255, 255, 255, 0.2)"
									: "rgba(0, 0, 0, 0.1)";
							break;
						default:
							finalRippleColor = appColorTokens.primary.bg;
							break;
					}
				} else if (
					variant === "ghost" ||
					variant === "outline" ||
					variant === "subtle"
				) {
					// Para otras variantes, usamos el color pure como antes
					switch (color) {
						case "primary":
							finalRippleColor = appColorTokens.primary.pure;
							break;
						case "secondary":
							finalRippleColor = appColorTokens.secondary.pure;
							break;
						case "tertiary":
							finalRippleColor = appColorTokens.tertiary.pure;
							break;
						case "accent":
							finalRippleColor = appColorTokens.accent.pure;
							break;
						case "success":
							finalRippleColor = appColorTokens.success.pure;
							break;
						case "warning":
							finalRippleColor = appColorTokens.warning.pure;
							break;
						case "danger":
							finalRippleColor = appColorTokens.danger.pure;
							break;
						case "default":
							finalRippleColor = appColorTokens.neutral.pure;
							break;
						default:
							finalRippleColor = appColorTokens.primary.pure;
							break;
					}
				} else {
					// Para link y otras variantes, usamos el rippleColor definido en los tokens
					finalRippleColor = buttonTokens.colors[color].rippleColor;
				}

				const buttonRect = buttonRef.current?.getBoundingClientRect();
				const maxDimension = buttonRect
					? Math.max(buttonRect.width, buttonRect.height)
					: 100;
				const scale = (maxDimension / 8) * 0.6;

				triggerRipple(e, finalRippleColor, scale);

				if (onClick) {
					onClick(e);
				}
			},
			[
				disabled,
				loading,
				disableRipple,
				buttonTokens,
				appColorTokens,
				color,
				variant,
				mode,
				triggerRipple,
				onClick,
			]
		);

		const hexToRgb = React.useCallback((hex: string): string | null => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
				hex.trim()
			);
			return result
				? `${Number.parseInt(result[1], 16)}, ${Number.parseInt(
						result[2],
						16
				  )}, ${Number.parseInt(result[3], 16)}`
				: null;
		}, []);

		const lightenColor = React.useCallback(
			(hex: string, percent: number): string => {
				const rgb = hexToRgb(hex);
				if (!rgb) return hex;

				const [r, g, b] = rgb.split(",").map(Number);
				const lightenAmount = 255 * (percent / 100);

				const newR = Math.min(255, r + lightenAmount);
				const newG = Math.min(255, g + lightenAmount);
				const newB = Math.min(255, b + lightenAmount);

				return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(
					newB
				)})`;
			},
			[hexToRgb]
		);

		const darkenColor = React.useCallback(
			(hex: string, percent: number): string => {
				const rgb = hexToRgb(hex);
				if (!rgb) return hex;

				const [r, g, b] = rgb.split(",").map(Number);
				const darkenAmount = percent / 100;

				const newR = Math.max(0, r * (1 - darkenAmount));
				const newG = Math.max(0, g * (1 - darkenAmount));
				const newB = Math.max(0, b * (1 - darkenAmount));

				return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(
					newB
				)})`;
			},
			[hexToRgb]
		);

		const createVisibleGradient = React.useCallback(
			(baseColor: string, isPressed: boolean, isHovered: boolean): string => {
				const lightColor = lightenColor(
					baseColor,
					isPressed ? 10 : isHovered ? 20 : 30
				);
				const darkColor = darkenColor(
					baseColor,
					isPressed ? 30 : isHovered ? 20 : 10
				);

				const direction = isPressed ? "to bottom" : "to top";

				return `linear-gradient(${direction}, ${darkColor}, ${baseColor} 50%, ${lightColor})`;
			},
			[lightenColor, darkenColor]
		);

		const getTextColor = React.useCallback((): string => {
			if (!buttonTokens || !appColorTokens) {
				return "#000000"; // Valor por defecto si no hay tokens
			}

			// Efecto hover diferenciado por tipo de botón
			if (isHovered && !disabled) {
				if (
					variant === "ghost" ||
					variant === "outline" ||
					variant === "link"
				) {
					// Para estas variantes, usar textShade del color correspondiente
					return buttonTokens.colors[color].textShade;
				} else if (variant === "solid") {
					// Para botones solid, mantener el color original
					return buttonTokens.colors[color].color;
				} else {
					// Para subtle y otros, usar hoverColor
					return buttonTokens.colors[color].hoverColor;
				}
			}

			// Estado normal (sin hover)
			if (
				variant === "ghost" ||
				variant === "outline" ||
				variant === "link" ||
				variant === "subtle"
			) {
				return buttonTokens.colors[color].ghostColor;
			} else if (variant === "solid") {
				return buttonTokens.colors[color].color;
			}

			return buttonTokens.colors[color].color;
		}, [buttonTokens, appColorTokens, isHovered, disabled, variant, color]);

		const buttonContent = loading ? (
			<>
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				<span className="inline-block">{loadingText || children}</span>
			</>
		) : (
			<>
				{leftIcon && (
					<span
						ref={leftIconRef}
						className="mr-2 inline-flex items-center justify-center transition-transform duration-300 ease-in-out"
						style={{ transformOrigin: "center" }}>
						{leftIcon}
					</span>
				)}
				<span
					ref={textRef}
					className="inline-block transition-transform duration-300 ease-in-out"
					style={{ transformOrigin: "center" }}>
					{children}
				</span>
				{rightIcon && (
					<span
						ref={rightIconRef}
						className="ml-2 inline-flex items-center justify-center transition-transform duration-300 ease-in-out"
						style={{ transformOrigin: "center" }}>
						{rightIcon}
					</span>
				)}
			</>
		);

		// Soporte correcto para size e iconOnly/icon
		const resolvedSize = size === "icon" ? "md" : size;
		const isIconButton = iconOnly || size === "icon";

		const customStyles = React.useMemo(() => {
			if (!buttonTokens) return {};

			const styles: React.CSSProperties = {
				padding: isIconButton ? "0" : buttonTokens.base.padding[resolvedSize],
				height: isIconButton ? buttonTokens.base.height[resolvedSize] : "auto",
				width: isIconButton ? buttonTokens.base.height[resolvedSize] : "auto",
				minHeight: buttonTokens.base.height[resolvedSize],
				borderRadius: buttonTokens.base.borderRadius[rounded],
				fontSize: buttonTokens.base.fontSize[resolvedSize],
				fontWeight: buttonTokens.base.fontWeight,
				gap: buttonTokens.base.gap[resolvedSize],
				transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
				overflow: "hidden",
				position: "relative",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
			};

			const textColor = getTextColor();
			const rgbColorResult = hexToRgb(buttonTokens.colors[color].background);
			const rgbColor = rgbColorResult || "0,0,0";

			if (variant === "solid") {
				if (gradient) {
					styles.backgroundImage = createVisibleGradient(
						buttonTokens.colors[color].background,
						isPressed,
						isHovered
					);
				} else {
					styles.backgroundColor = isPressed
						? buttonTokens.colors[color].activeBackground
						: isHovered
						? buttonTokens.colors[color].hoverBackground
						: buttonTokens.colors[color].background;
				}

				styles.color = textColor;
				styles.border = "none";

				if (gradient && isPressed) {
					styles.boxShadow = "inset 0 3px 5px rgba(0, 0, 0, 0.3)";
					styles.transform = "scale(0.97) translateY(3px)";
				}
			} else if (variant === "outline") {
				const bgOpacity =
					color === "default"
						? isPressed
							? 0.25
							: isHovered
							? 0.15
							: 0
						: isPressed
						? 0.15
						: isHovered
						? 0.08
						: 0;

				styles.backgroundColor = `rgba(${rgbColor}, ${bgOpacity})`;

				styles.color = textColor;
				styles.border = `1px solid ${
					isPressed
						? buttonTokens.colors[color].activeBorder
						: isHovered
						? buttonTokens.colors[color].hoverBorder
						: buttonTokens.colors[color].outlineBorder
				}`;
			} else if (variant === "ghost") {
				const bgOpacity =
					color === "default"
						? isPressed
							? 0.35
							: isHovered
							? 0.2
							: 0
						: isPressed
						? 0.25
						: isHovered
						? 0.12
						: 0;

				styles.backgroundColor = `rgba(${rgbColor}, ${bgOpacity})`;

				styles.color = textColor;
				styles.border = "none";
			} else if (variant === "subtle") {
				if (isPressed) {
					styles.backgroundColor = buttonTokens.colors[color].activeBackground;
				} else if (isHovered) {
					styles.backgroundColor = buttonTokens.colors[color].background; // Usar el color pure en hover
				} else {
					styles.backgroundColor = `rgba(${rgbColor}, 0.25)`; // Estado normal con opacidad
				}

				styles.color = textColor;
				styles.border = "none";
			} else if (variant === "link") {
				styles.backgroundColor = "transparent";

				styles.color = textColor;
				styles.border = "none";
				if (isHovered) {
					styles.textDecoration = "underline";
				}
			}

			if (elevated && !disabled) {
				styles.boxShadow = isPressed
					? "0 1px 2px rgba(0, 0, 0, 0.2)"
					: isHovered
					? "0 8px 16px rgba(0, 0, 0, 0.2)"
					: "0 4px 8px rgba(0, 0, 0, 0.15)";
			}

			if (!disabled) {
				if (isPressed) {
					styles.transform = gradient
						? "scale(0.97) translateY(3px)"
						: "translateY(2px)";
				} else if (isHovered && elevated) {
					styles.transform = "translateY(-3px)";
				}
			}

			if (disabled) {
				styles.backgroundColor =
					buttonTokens.variants[variant].disabled.background;
				styles.color = buttonTokens.variants[variant].disabled.color;
				styles.border = buttonTokens.variants[variant].disabled.border;
				styles.opacity = buttonTokens.variants[variant].disabled.opacity;
				styles.cursor = buttonTokens.variants[variant].disabled.cursor;
			}

			return styles;
		}, [
			buttonTokens,
			size,
			rounded,
			iconOnly,
			elevated,
			gradient,
			isPressed,
			isHovered,
			disabled,
			variant,
			color,
			getTextColor,
			hexToRgb,
			createVisibleGradient,
		]);

		React.useEffect(() => {
			if (disabled || loading) return;

			// Usar una forma segura de manipular los estilos de las referencias
			if (leftIconRef.current) {
				leftIconRef.current.style.transform = isHovered
					? "scale(1.15)"
					: "scale(1)";
			}

			if (rightIconRef.current) {
				rightIconRef.current.style.transform = isHovered
					? "scale(1.15)"
					: "scale(1)";
			}

			if (textRef.current) {
				textRef.current.style.transform = isHovered
					? "scale(1.03)"
					: "scale(1)";
			}
		}, [isHovered, disabled, loading]);

		// Verificar si buttonTokens está disponible
		if (!buttonTokens) {
			return (
				<button
					ref={ref as React.Ref<HTMLButtonElement>}
					className={cn(
						"inline-flex items-center justify-center whitespace-nowrap font-medium",
						"px-3 py-2 text-sm rounded-md",
						"bg-gray-200 text-gray-500 cursor-not-allowed opacity-50",
						fullWidth ? "w-full" : "",
						className
					)}
					disabled
					{...props}>
					{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					{loading && loadingText ? loadingText : children}
					{!loading && !loadingText ? children : null}
				</button>
			);
		}

		const Comp = asChild ? Slot : "button";

		const buttonElement = (
			<Comp
				className={cn(
					buttonVariants({
						variant,
						size: resolvedSize, // nunca pasar 'icon', solo los válidos
						rounded,
						fullWidth,
						bordered,
						gradient,
						elevated,
						iconOnly,
						className,
					})
				)}
				ref={combinedRef}
				disabled={disabled || loading}
				style={customStyles}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onClick={handleClick}
				{...props}>
				{buttonContent}
			</Comp>
		);

		// Si hay tooltip, envolver el botón con el componente Tooltip
		if (tooltip) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
						<TooltipContent>{tooltip}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}

		return buttonElement;
	}
);

CustomButton.displayName = "CustomButton";

export { CustomButton, buttonVariants };
