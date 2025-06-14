"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { useRipple } from "@/components/ripple/RippleProvider";
import {
  generateStandardButtonTokens,
  type StandardButtonColorScheme,
  type StandardButtonRounded,
  type StandardButtonSize,
  type StandardButtonStyleType,
} from "@/lib/theme/components/standard-button-tokens";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Ya no necesitamos 'InternalButtonColor', usaremos StandardButtonColorScheme directamente.

export interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  colorScheme?: StandardButtonColorScheme;
  rounded?: StandardButtonRounded;
  bordered?: boolean;
  gradient?: boolean;
  elevated?: boolean;
  styleType?: StandardButtonStyleType;
  size?: StandardButtonSize;
  disableRipple?: boolean;
  tooltip?: string | React.ReactNode;
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none disabled:pointer-events-none relative overflow-hidden",
  {
		variants: {
			variant: { solid: "", outline: "", ghost: "", link: "underline-offset-4 hover:underline", subtle: "" },
			size: { xs: "", sm: "", md: "", lg: "", xl: "", icon: "" },
			rounded: { none: "", sm: "", md: "", lg: "", full: "" },
			fullWidth: { true: "w-full" },
			bordered: { true: "" },
			gradient: { true: "" },
			elevated: { true: "" },
			iconOnly: { true: "" },
		},
		defaultVariants: { variant: "solid", size: "md", rounded: "md" },
  }
);

const StandardButton = React.forwardRef<HTMLButtonElement, StandardButtonProps>(
  (
    {
      className,
      styleType = "solid",
      size: initialSize = "md",
      rounded = "md",
      colorScheme = "primary",
      asChild = false,
      leftIcon, rightIcon, iconOnly = false, loading = false, loadingText,
      fullWidth = false, bordered = false, gradient = false, elevated = false,
      children, disabled, disableRipple = false, tooltip, onClick,
      ...props
    },
    ref
  ) => {
    
    const variant = styleType; // Mapeo simple de nombre de prop

    const { appColorTokens, mode } = useTheme();
    const buttonTokens = React.useMemo(() => {
      if (!appColorTokens) return null;
      return generateStandardButtonTokens(appColorTokens, mode);
    }, [appColorTokens, mode]);

    const triggerRipple = useRipple();
    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const leftIconRef = React.useRef<HTMLSpanElement | null>(null);
    const rightIconRef = React.useRef<HTMLSpanElement | null>(null);
    const textRef = React.useRef<HTMLSpanElement | null>(null);

    const isEffectivelyDisabled = disabled || loading; // Definido para ser usado

    const combinedRef = React.useCallback( (node: HTMLButtonElement | null) => { buttonRef.current = node; if (typeof ref === "function") ref(node); else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node; }, [ref] );
    const handleMouseDown = React.useCallback(() => { if (!isEffectivelyDisabled) setIsPressed(true); }, [isEffectivelyDisabled]);
    const handleMouseUp = React.useCallback(() => setIsPressed(false), []);
    const handleMouseEnter = React.useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = React.useCallback(() => { setIsPressed(false); setIsHovered(false); }, []);

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (isEffectivelyDisabled || disableRipple || !buttonTokens) return;
      
      const colorTokenSet = buttonTokens.colors[colorScheme]; // Usa colorScheme directamente
      if (!colorTokenSet) return;

      const finalRippleColor = colorTokenSet.rippleColor;
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      const maxDimension = buttonRect ? Math.max(buttonRect.width, buttonRect.height) : 100;
      const scale = (maxDimension / 8) * 0.6;
      triggerRipple(e, finalRippleColor, scale);
      if (onClick) onClick(e);
    }, [isEffectivelyDisabled, disableRipple, buttonTokens, colorScheme, triggerRipple, onClick]);

		const hexToRgb = React.useCallback((hex: string): string => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
			return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
		}, []);

		const getTextColor = React.useCallback((): string => {
			if (!buttonTokens) return "#000000";
      const colorTokenSet = buttonTokens.colors[colorScheme]; // Usa colorScheme directamente
      if(!colorTokenSet) return "#000000";

			if (isHovered && !disabled) {
				if (variant === "ghost" || variant === "outline" || variant === "link") return colorTokenSet.textShade;
				if (variant === "solid") return colorTokenSet.color;
				return colorTokenSet.hoverColor;
			}
			if (variant === "ghost" || variant === "outline" || variant === "link" || variant === "subtle") return colorTokenSet.ghostColor;
			if (variant === "solid") return colorTokenSet.color;
			return colorTokenSet.color;
		}, [buttonTokens, isHovered, disabled, variant, colorScheme]);

    const buttonContent = loading ? ( <> <Loader2 className={cn("mr-2", buttonTokens?.loading.spinnerSize[initialSize])} /> <span className="inline-block">{loadingText || children}</span> </> ) : ( <> {leftIcon && <span ref={leftIconRef} className="mr-2 inline-flex items-center justify-center transition-transform duration-300 ease-in-out">{leftIcon}</span>} <span ref={textRef} className="inline-block transition-transform duration-300 ease-in-out">{children}</span> {rightIcon && <span ref={rightIconRef} className="ml-2 inline-flex items-center justify-center transition-transform duration-300 ease-in-out">{rightIcon}</span>} </> );
    
    const resolvedSize = initialSize === "icon" ? "md" : initialSize;
    const isIconButton = iconOnly || initialSize === "icon";

    const customStyles = React.useMemo(() => {
      if (!buttonTokens) return {};
      const styles: React.CSSProperties = {
        padding: isIconButton ? "0" : buttonTokens.base.padding[resolvedSize],
        height: buttonTokens.base.height[resolvedSize], width: isIconButton ? buttonTokens.base.height[resolvedSize] : "auto",
        minHeight: buttonTokens.base.height[resolvedSize], borderRadius: buttonTokens.base.borderRadius[rounded],
        fontSize: buttonTokens.base.fontSize[resolvedSize], fontWeight: buttonTokens.base.fontWeight, gap: buttonTokens.base.gap[resolvedSize],
        transition: buttonTokens.base.transition, overflow: "hidden", position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
      };

      const colorTokenSet = buttonTokens.colors[colorScheme]; // Usa colorScheme directamente
      if (!colorTokenSet) return styles;

      const textColor = getTextColor();
      const rgbColor = hexToRgb(colorTokenSet.background);
      
      if (variant === "solid") { styles.backgroundColor = isPressed ? colorTokenSet.activeBackground : isHovered ? colorTokenSet.hoverBackground : colorTokenSet.background; styles.color = textColor; styles.border = "none"; } 
      else if (variant === "outline") { const bgOpacity = isPressed ? 0.15 : isHovered ? 0.08 : 0; styles.backgroundColor = `rgba(${rgbColor}, ${bgOpacity})`; styles.color = textColor; styles.border = `1px solid ${isPressed ? colorTokenSet.activeBorder : isHovered ? colorTokenSet.hoverBorder : colorTokenSet.outlineBorder}`; } 
      else if (variant === "ghost") { const bgOpacity = isPressed ? 0.25 : isHovered ? 0.12 : 0; styles.backgroundColor = `rgba(${rgbColor}, ${bgOpacity})`; styles.color = textColor; styles.border = "none"; } 
      else if (variant === "subtle") { if (isPressed) styles.backgroundColor = colorTokenSet.activeBackground; else if (isHovered) styles.backgroundColor = colorTokenSet.background; else styles.backgroundColor = `rgba(${rgbColor}, 0.25)`; styles.color = textColor; styles.border = "none"; } 
      else if (variant === "link") { styles.backgroundColor = "transparent"; styles.color = textColor; styles.border = "none"; if (isHovered) styles.textDecoration = "underline"; }

      if (elevated && !disabled) styles.boxShadow = isPressed ? "0 1px 2px rgba(0,0,0,0.2)" : isHovered ? "0 8px 16px rgba(0,0,0,0.2)" : "0 4px 8px rgba(0,0,0,0.15)";
      if (!disabled) { if (isPressed) styles.transform = "translateY(1px)"; else if (isHovered && elevated) styles.transform = "translateY(-2px)"; }
      
      const disabledTokens = buttonTokens.variants[variant]?.disabled;
      if (disabled && disabledTokens) { styles.backgroundColor = disabledTokens.background; styles.color = disabledTokens.color; styles.border = disabledTokens.border; styles.opacity = disabledTokens.opacity; styles.cursor = disabledTokens.cursor; }
      return styles;
    }, [ buttonTokens, resolvedSize, rounded, isIconButton, elevated, gradient, isPressed, isHovered, disabled, variant, colorScheme, getTextColor, hexToRgb ]);
    
    React.useEffect(() => {
      if (isEffectivelyDisabled) return;
      if (leftIconRef.current) leftIconRef.current.style.transform = isHovered ? "scale(1.15)" : "scale(1)";
      if (rightIconRef.current) rightIconRef.current.style.transform = isHovered ? "scale(1.15)" : "scale(1)";
      if (textRef.current) textRef.current.style.transform = isHovered ? "scale(1.03)" : "scale(1)";
    }, [isHovered, isEffectivelyDisabled]);
    
    if (!buttonTokens) { return (<button ref={ref} className={cn( "inline-flex items-center justify-center whitespace-nowrap font-medium", "px-3 py-2 text-sm rounded-md", "bg-gray-200 text-gray-500 cursor-not-allowed opacity-50", fullWidth ? "w-full" : "", className )} disabled {...props}> {children} </button>); }

    const Comp = asChild ? Slot : "button";
    const buttonElement = (
      <Comp
        className={cn(buttonVariants({ variant, size: initialSize, rounded, fullWidth, bordered, gradient, elevated, iconOnly: isIconButton, className }))}
        ref={combinedRef}
        disabled={isEffectivelyDisabled}
        style={customStyles}
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {buttonContent}
      </Comp>
    );

    if (tooltip) { return <TooltipProvider><Tooltip><TooltipTrigger asChild>{buttonElement}</TooltipTrigger><TooltipContent>{tooltip}</TooltipContent></Tooltip></TooltipProvider>; }
    return buttonElement;
  }
);
StandardButton.displayName = "StandardButton";

// CORREGIDO: Se exportan los tipos y el componente, sin exportar la interfaz duplicada.
export { 
  StandardButton, 
  buttonVariants,
  type StandardButtonColorScheme, 
  type StandardButtonStyleType,
  type StandardButtonSize,
  type StandardButtonRounded
};