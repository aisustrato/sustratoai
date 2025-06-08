//.📍 components/ui/StandardCard.tsx

"use client";

//#region [head] - 🏷️ IMPORTS 🏷️

import * as React from "react";
import { forwardRef, useMemo } from "react";
import { motion, AnimatePresence, type HTMLMotionProps, type Transition, type Variants } from "framer-motion";
import { Check, Square } from "lucide-react";

// import tinycolor from "tinycolor2"; // Ya no se usa aquí

import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider"; 
import type {
  AppColorTokens,
  ProCardVariant as StandardCardColorScheme,
  Mode,
} from "@/lib/theme/ColorToken";
import {
  generateStandardCardTokens,
  type StandardCardStyleType,
  type StandardCardAccentPlacement,
  type StandardCardShadow,
} from "@/lib/theme/components/standard-card-tokens"; 

import { Text, type TextProps as ActualTextProps, type FontPairType } from "@/components/ui/text";
import { SustratoLoadingLogo, type SustratoLoadingLogoProps } from "@/components/ui/sustrato-loading-logo";
//#endregion ![head]

//#region [def] - 📦 INTERFACES, TYPES & VARIANTS 📦

// Tipos para las props de Title/Subtitle
type CardTextTypographicVariant = ActualTextProps["variant"];
type CardTextColor = ActualTextProps["color"];
type CardTextColorVariant = ActualTextProps["colorVariant"];
type CardTextSize = ActualTextProps["size"];
type CardTextWeight = ActualTextProps["weight"];
type CardTextGradient = ActualTextProps["gradient"];

// --- Props del Card Base ---
export interface StandardCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  colorScheme?: StandardCardColorScheme;
  styleType?: StandardCardStyleType;
  shadow?: StandardCardShadow;
  hasOutline?: boolean;
  outlineColorScheme?: StandardCardColorScheme;
  accentPlacement?: StandardCardAccentPlacement;
  accentColorScheme?: StandardCardColorScheme;
  selected?: boolean;
  loading?: boolean;
  inactive?: boolean;
  className?: string;
  children?: React.ReactNode;
  noPadding?: boolean;
  disableShadowHover?: boolean;
  animateEntrance?: boolean;
  showSelectionCheckbox?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  customTransition?: Transition;
  "data-testid"?: string; 
  onCardClick?: React.MouseEventHandler<HTMLDivElement>;
  loaderSize?: number;
  loadingText?: string;
  loadingVariant?: SustratoLoadingLogoProps['variant'];
}

// --- Props de Subcomponentes (sin cambios) ---
interface StandardCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardTitleProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color"> { className?: string; children?: React.ReactNode; typographicVariant?: CardTextTypographicVariant; size?: CardTextSize; colorScheme?: CardTextColor; colorShade?: CardTextColorVariant; fontType?: FontPairType; weight?: CardTextWeight; gradient?: CardTextGradient; truncate?: boolean; }
interface StandardCardSubtitleProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "color"> { className?: string; children?: React.ReactNode; typographicVariant?: CardTextTypographicVariant; size?: CardTextSize; colorScheme?: CardTextColor; colorShade?: CardTextColorVariant; fontType?: FontPairType; weight?: CardTextWeight; gradient?: CardTextGradient; truncate?: boolean; }
interface StandardCardMediaProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardContentProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardActionsProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardFooterProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }

interface StandardCardComposition extends React.ForwardRefExoticComponent<StandardCardProps & React.RefAttributes<HTMLDivElement>> {
  Header: (props: StandardCardHeaderProps) => JSX.Element;
  Title: (props: StandardCardTitleProps) => JSX.Element;
  Subtitle: (props: StandardCardSubtitleProps) => JSX.Element;
  Media: (props: StandardCardMediaProps) => JSX.Element;
  Content: (props: StandardCardContentProps) => JSX.Element;
  Actions: (props: StandardCardActionsProps) => JSX.Element;
  Footer: (props: StandardCardFooterProps) => JSX.Element;
}

const cardEntranceVariants: Variants = { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 }, };
const overlayVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const MotionDiv = motion.div;
//#endregion ![def]


//#region [main_root] - 🧱 ROOT CARD COMPONENT 🧱
const StandardCardRoot = forwardRef<HTMLDivElement, StandardCardProps>(
  (
    {
      colorScheme = "neutral", styleType = "filled", shadow = "md", hasOutline = false, outlineColorScheme,
      accentPlacement = "none", accentColorScheme, selected = false, loading = false, inactive = false,
      className, children, noPadding = false, disableShadowHover = false, animateEntrance = true,
      showSelectionCheckbox = false, onSelectionChange, customTransition, style,
      onCardClick, loaderSize = 32, loadingText, loadingVariant = "spin-pulse",
      "data-testid": dataTestId, ...htmlProps
    },
    ref,
  ) => {
    //#region [sub_init] - 🪝 HOOKS, STATE, MEMOS 🪝
    const { appColorTokens, mode } = useTheme();
    const cardIdentifier = dataTestId || ""; 

    // console.log(`[StandardCard ${cardIdentifier}] CONTEXT - appColorTokens:`, appColorTokens ? "Available" : "Unavailable");
    // console.log(`[StandardCard ${cardIdentifier}] CONTEXT - mode:`, mode);

    const cardTokens = useMemo(() => {
      if (appColorTokens && mode) return generateStandardCardTokens(appColorTokens, mode);
      // console.warn(`[StandardCard ${cardIdentifier}] TOKENS - appColorTokens o mode no disponibles.`);
      return null;
    }, [appColorTokens, mode]);

    // console.log(`[StandardCard ${cardIdentifier}] TOKENS - Generated cardTokens:`, cardTokens ? "Available" : "Unavailable");

    const cssVariables = useMemo<React.CSSProperties & { [key: `--${string}`]: string | number | undefined }>(() => {
      if (!cardTokens) return {};
      const currentCardScheme = colorScheme || "neutral";
      const vars: React.CSSProperties & { [key: `--${string}`]: string | number | undefined } = {};
      const styleTypeTokens = cardTokens.styleTypes[styleType]?.[currentCardScheme] || cardTokens.styleTypes[styleType]?.neutral;

      vars["--sc-bg"] = styleTypeTokens?.background || "transparent";
      vars["--sc-text-color"] = styleTypeTokens?.color || cardTokens.defaultTextColor;
      
      const effectiveOutlineScheme = outlineColorScheme || currentCardScheme;
      if (hasOutline) {
        const outlineTokens = cardTokens.outline[effectiveOutlineScheme] || cardTokens.outline.neutral;
        if (outlineTokens) {
          vars["--sc-outline-border-color"] = outlineTokens.borderColor;
          vars["--sc-outline-border-width"] = outlineTokens.borderWidth;
          vars["--sc-outline-border-style"] = outlineTokens.borderStyle;
        }
      } else {
         vars["--sc-outline-border-width"] = "0px"; vars["--sc-outline-border-style"] = "none";
      }

      const mainCardScheme = currentCardScheme; 
      const effectiveAccentColorScheme = accentColorScheme || mainCardScheme; 
      const accentTokenDefinitions = cardTokens.accents[accentPlacement]?.[effectiveAccentColorScheme];

      if (accentPlacement !== "none" && accentTokenDefinitions) {
        if (accentColorScheme === "accent") { 
          if (mainCardScheme === "accent") {
            vars["--sc-accent-bg"] = cardTokens.accents[accentPlacement]?.accent?.duotoneMagicBackground;
          } else {
            vars["--sc-accent-bg"] = cardTokens.accents[accentPlacement]?.[mainCardScheme]?.duotoneMagicBackground || accentTokenDefinitions.standardBackground;
          }
        } else { 
          vars["--sc-accent-bg"] = accentTokenDefinitions.standardBackground;
        }
        if (!vars["--sc-accent-bg"]) vars["--sc-accent-bg"] = accentTokenDefinitions.standardBackground || "transparent";
        if (accentTokenDefinitions.height) vars["--sc-accent-dimension-h"] = accentTokenDefinitions.height;
        if (accentTokenDefinitions.width) vars["--sc-accent-dimension-w"] = accentTokenDefinitions.width;
      } else {
        vars["--sc-accent-bg"] = "transparent"; 
      }
      
      if (selected && !inactive) {
        const selectedTokens = cardTokens.selected[currentCardScheme] || cardTokens.selected.neutral;
        if (selectedTokens) {
          vars["--sc-selected-border-color"] = selectedTokens.borderColor;
          vars["--sc-selected-border-width"] = selectedTokens.borderWidth;
          vars["--sc-selected-overlay-bg"] = selectedTokens.overlayBackground;
        }
      }

      const checkboxTokens = cardTokens.checkbox[currentCardScheme] || cardTokens.checkbox.neutral;
      if (checkboxTokens) {
        vars["--sc-checkbox-border-color"] = checkboxTokens.borderColor;
        vars["--sc-checkbox-icon-color"] = checkboxTokens.iconColor;
        vars["--sc-checkbox-focus-ring-color"] = checkboxTokens.focusRingColor;
      }
      
      vars["--sc-inactive-overlay-bg"] = cardTokens.inactiveOverlayBackground;
      vars["--sc-loading-overlay-bg"] = cardTokens.loadingOverlayBackground;

      // console.log(`[StandardCard ${cardIdentifier}] CSS_VARS - CSS Variables a aplicar:`, JSON.stringify(vars, null, 2));
      return vars;
    }, [
      cardTokens, colorScheme, styleType, hasOutline, outlineColorScheme,
      accentPlacement, accentColorScheme, selected, inactive
    ]);
    //#endregion ![sub_init]

    //#region [sub_logic] - 💡 DERIVED LOGIC, CLASSES, TRANSITIONS 💡

    const paddingClass = noPadding ? "" : (cardTokens?.padding || "p-4");
    const shadowClass = cardTokens?.shadows[shadow] || "shadow-md";
    const hoverEffectActive = !disableShadowHover && !inactive && !loading;
    const hoverShadowClasses: Record<StandardCardShadow, string> = { none: "", sm: "hover:shadow-md", md: "hover:shadow-lg", lg: "hover:shadow-xl", xl: "hover:shadow-2xl" };
    const dynamicHoverShadowClass = hoverEffectActive && shadow !== "none" ? hoverShadowClasses[shadow] : "";
    
    const isEffectivelyDisabled = inactive || loading; 
    const showLoadingIndicator = loading && !inactive; 
    
    const cardBaseTransition: Transition = { type: "spring", damping: 20, stiffness: 300 };
    const cardCombinedTransition: Transition = customTransition ? { ...cardBaseTransition, ...customTransition } : cardBaseTransition;
    
    const motionRootProps: HTMLMotionProps<"div"> & { "data-testid"?: string } = {
      ref,
      className: cn(
        "relative rounded-lg overflow-hidden", "transition-shadow duration-200 ease-out",
        shadowClass, dynamicHoverShadowClass,
        { "cursor-not-allowed": isEffectivelyDisabled && !onCardClick,
          "cursor-pointer": onCardClick && !isEffectivelyDisabled,
        },
        className,
      ),
      style: { 
        ...cssVariables, 
        background: 'var(--sc-bg)', 
        color: 'var(--sc-text-color)', 
        borderColor: hasOutline ? 'var(--sc-outline-border-color)' : undefined,
        borderWidth: hasOutline ? 'var(--sc-outline-border-width)' : undefined,
        borderStyle: hasOutline ? 'var(--sc-outline-border-style)' : undefined,
        ...style 
      } as React.CSSProperties,
      initial: animateEntrance && !showLoadingIndicator ? "hidden" : false,
      animate: animateEntrance && !showLoadingIndicator ? "visible" : false,
      variants: animateEntrance && !showLoadingIndicator ? cardEntranceVariants : undefined,
      transition: cardCombinedTransition,
      whileHover: hoverEffectActive ? { scale: 1.025, transition: { type: "spring", stiffness: 350, damping: 15 } } : {},
      whileTap: (onCardClick && !isEffectivelyDisabled) ? { scale: 0.985, transition: { type: "spring", stiffness: 400, damping: 15 } } : {},
      onClick: !isEffectivelyDisabled && onCardClick ? (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[role="checkbox"], button, a')) { 
          return;
        }
        onCardClick(e);
      } : undefined,
      tabIndex: onCardClick && !isEffectivelyDisabled ? 0 : undefined,
      role: onCardClick ? "button" : undefined,
      ...(isEffectivelyDisabled && !onCardClick && { onClickCapture: (e: React.MouseEvent) => e.stopPropagation() }),
      ...htmlProps,
    };
    if (dataTestId) motionRootProps["data-testid"] = dataTestId;
    //#endregion ![sub_logic]

    //#region [sub_render_helpers] - 🎨 HELPER RENDER FUNCTIONS 🎨

    const renderInnerContent = () => (
      // CORREGIDO: Eliminada la clase 'invisible' cuando showLoadingIndicator es true
      <div className={cn("relative z-[1]", paddingClass)}> 
        {showSelectionCheckbox && onSelectionChange && !showLoadingIndicator && ( 
          <motion.button type="button" disabled={isEffectivelyDisabled} onClick={(e) => { e.stopPropagation(); onSelectionChange(!selected); }}
            className={cn( "absolute top-3 right-3 z-20 p-0.5 rounded transition-colors", "bg-white/40 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/40", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--sc-checkbox-focus-ring-color)]", isEffectivelyDisabled && "opacity-50 cursor-not-allowed", )}
            whileTap={{ scale: isEffectivelyDisabled ? 1 : 0.9 }} aria-pressed={selected} aria-label={selected ? "Deseleccionar tarjeta" : "Seleccionar tarjeta"}
          >
            {selected ? <Check size={18} className="text-[var(--sc-checkbox-icon-color)]" /> : <Square size={18} className="text-[var(--sc-checkbox-border-color)]" />}
          </motion.button> 
        )}
        {children}
      </div> 
    );
    
    const renderAccent = () => { 
      const accentBgValue = cssVariables["--sc-accent-bg"];
      if (accentPlacement === "none" || !cardTokens || !accentBgValue || String(accentBgValue).trim() === "transparent") {
        return null;
      }
      const commonPositionClasses = "absolute z-[2]";
      const accentStyle: React.CSSProperties = {
        backgroundImage: String(accentBgValue), 
        height: cssVariables["--sc-accent-dimension-h"] as string | undefined,
        width: cssVariables["--sc-accent-dimension-w"] as string | undefined,
      };
      switch (accentPlacement) { 
        case "top": return <div className={cn(commonPositionClasses, "top-0 left-0 right-0")} style={accentStyle} />; 
        case "left": return <div className={cn(commonPositionClasses, "top-0 bottom-0 left-0")} style={accentStyle} />; 
        case "right": return <div className={cn(commonPositionClasses, "top-0 bottom-0 right-0")} style={accentStyle} />; 
        case "bottom": return <div className={cn(commonPositionClasses, "bottom-0 left-0 right-0")} style={accentStyle} />; 
        default: return null; 
      } 
    };

    const renderSelectedIndicator = () => { if (!selected || inactive) return null; return <MotionDiv key="selected-indicator" className="absolute inset-0 z-[0] rounded-lg pointer-events-none" style={{ borderWidth: "var(--sc-selected-border-width)", borderStyle: "solid", borderColor: "var(--sc-selected-border-color)", backgroundColor: "var(--sc-selected-overlay-bg)", }} variants={overlayVariants} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.2 }} />; };
    
    const renderLoadingState = () => {
      if (!showLoadingIndicator) return null;
      return (
        <>
          {/* El overlay de carga usa el mismo efecto que el inactivo (blur + color semitransparente) */}
          <MotionDiv 
            key="loading-overlay" 
            variants={overlayVariants} initial="hidden" animate="visible" exit="exit" 
            className="absolute inset-0 z-[4] backdrop-blur-sm rounded-lg" // backdrop-blur para el efecto difuminado
            style={{ backgroundColor: "var(--sc-loading-overlay-bg)" }} // Usa el token de loading
          />
          <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center pointer-events-none">
            <SustratoLoadingLogo 
              size={loaderSize} 
              variant={loadingVariant} 
              text={loadingText} 
              showText={!!loadingText}
            />
          </div>
        </>
      );
    };
    
    const renderInactiveOverlay = () => { 
      if (!inactive || showLoadingIndicator) return null; 
      return <MotionDiv key="inactive-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 z-[5] backdrop-blur-sm rounded-lg pointer-events-auto" style={{ backgroundColor: "var(--sc-inactive-overlay-bg)" }} /> 
    };
    //#endregion ![sub_render_helpers]

    //#region [render] - 🖼️ ROOT JSX STRUCTURE 🖼️

    return ( 
      <MotionDiv {...motionRootProps}> 
        {renderAccent()}
        {/* CORREGIDO: El contenido se renderiza siempre, el overlay de carga/inactivo va encima */}
        {renderInnerContent()} 
        <AnimatePresence>{selected && !inactive && renderSelectedIndicator()}</AnimatePresence>
        <AnimatePresence>{inactive && !showLoadingIndicator && renderInactiveOverlay()}</AnimatePresence>
        <AnimatePresence>{showLoadingIndicator && renderLoadingState()}</AnimatePresence>
      </MotionDiv> 
    );
    //#endregion ![render]
  },
);
StandardCardRoot.displayName = "StandardCard";
//#endregion ![main_root]

//#region [main_subcomponents] -🧩 SUBCOMPONENTS (Header, Title, etc.) 🧩

// --- Subcomponentes (React.FC) ---
// (Sin cambios respecto a la versión anterior que ya estaba "en verde" para linters)
const Header = ({ className, children, ...props }: StandardCardHeaderProps): JSX.Element => (<div className={cn("mb-3", className)} {...props}>{children}</div>);
Header.displayName = "StandardCard.Header";
const Title = ({ children, className, typographicVariant = "heading", size = "lg", colorScheme, colorShade, fontType, weight, gradient, truncate, ...htmlProps }: StandardCardTitleProps): JSX.Element => (<Text as="h3" variant={typographicVariant} size={size} color={colorScheme as CardTextColor} colorVariant={colorShade} fontType={fontType} weight={weight || (typographicVariant === "heading" ? "semibold" : "normal")} gradient={gradient} truncate={truncate} className={cn( !colorScheme && !colorShade && "text-[var(--sc-text-color)]", className)} {...htmlProps}>{children}</Text>);
Title.displayName = "StandardCard.Title";
const Subtitle = ({ children, className, typographicVariant = "default", size = "sm", colorScheme, colorShade, fontType, weight, gradient, truncate, ...htmlProps }: StandardCardSubtitleProps): JSX.Element => (<Text as="p" variant={typographicVariant} size={size} color={colorScheme as CardTextColor} colorVariant={colorShade} fontType={fontType} weight={weight} gradient={gradient} truncate={truncate} className={cn("opacity-80", !colorScheme && !colorShade && "text-[var(--sc-text-color)]", className)} {...htmlProps}>{children}</Text>);
Subtitle.displayName = "StandardCard.Subtitle";
const Media = ({ className, children, ...props }: StandardCardMediaProps): JSX.Element => (<div className={cn("mb-3 overflow-hidden", className)} {...props}>{children}</div>);
Media.displayName = "StandardCard.Media";
const Content = ({ className, children, ...props }: StandardCardContentProps): JSX.Element => (<div className={cn(className)} {...props}>{children}</div>);
Content.displayName = "StandardCard.Content";
const Actions = ({ className, children, ...props }: StandardCardActionsProps): JSX.Element => (<div className={cn("mt-4 flex flex-wrap items-center gap-2", className)} {...props}>{children}</div>);
Actions.displayName = "StandardCard.Actions";
const Footer = ({ className, children, ...props }: StandardCardFooterProps): JSX.Element => (<div className={cn("mt-4 pt-3 text-sm opacity-70", "border-t border-[var(--sc-outline-border-color)]/30 dark:border-[var(--sc-outline-border-color)]/20", className)} {...props}>{children}</div>);
Footer.displayName = "StandardCard.Footer";
//#endregion ![main_subcomponents]

// Moved StandardCardComposition interface into [def] region



//#region [main_composition] - 🏗️ COMPONENT COMPOSITION 🏗️
const StandardCard = StandardCardRoot as StandardCardComposition;
StandardCard.Header = Header; StandardCard.Title = Title; StandardCard.Subtitle = Subtitle; StandardCard.Media = Media; StandardCard.Content = Content; StandardCard.Actions = Actions; StandardCard.Footer = Footer;
//#endregion ![main_composition]

//#region [foo] - 🔚 EXPORTS 🔚

export { StandardCard, type StandardCardColorScheme };
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// - Review responsiveness of card elements.
// - Add more detailed tests for interaction states (loading, selected, inactive).
// - Consider performance implications of complex hover/tap animations.
//#endregion ![todo]