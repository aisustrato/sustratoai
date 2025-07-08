// 📍 components/ui/StandardCard.tsx (v1.6 - Definitiva)

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { forwardRef, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence, type HTMLMotionProps, type Transition, type Variants } from "framer-motion";
import { Check, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import type { ColorSchemeVariant as StandardCardColorScheme } from "@/lib/theme/ColorToken";
import { generateStandardCardTokens, type StandardCardStyleType, type StandardCardAccentPlacement, type StandardCardShadow } from "@/lib/theme/components/standard-card-tokens";
import { StandardText, type StandardTextSize, type StandardTextWeight, type StandardTextGradient, type StandardTextColorShade } from "@/components/ui/StandardText";
import { SustratoLoadingLogo, type SustratoLoadingLogoProps } from "@/components/ui/sustrato-loading-logo";
//#endregion ![head]

//#region [def] - 📦 INTERFACES, TYPES & VARIANTS 📦

type CardTextSize = StandardTextSize;
type CardTextWeight = StandardTextWeight;
type CardTextGradient = StandardTextGradient;
type CardTextColorShade = StandardTextColorShade;

export interface StandardCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
	contentCanScroll?: boolean;
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

interface StandardCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { className?: string; children?: React.ReactNode; size?: CardTextSize; colorScheme?: StandardCardColorScheme; colorShade?: CardTextColorShade; weight?: CardTextWeight; applyGradient?: CardTextGradient; truncate?: boolean; }
interface StandardCardSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> { className?: string; children?: React.ReactNode; size?: CardTextSize; colorScheme?: StandardCardColorScheme; colorShade?: CardTextColorShade; weight?: CardTextWeight; applyGradient?: CardTextGradient; truncate?: boolean; }
interface StandardCardMediaProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
// 📌 CAMBIO 1: La prop `contentCanScroll` se pasa al contexto, por lo que ya no es necesaria aquí directamente.
interface StandardCardContentProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardActionsProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }
interface StandardCardFooterProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; children?: React.ReactNode; }

interface StandardCardComposition extends React.ForwardRefExoticComponent<StandardCardProps & React.RefAttributes<HTMLDivElement>> {
	Header: React.FC<StandardCardHeaderProps>;
	Title: React.FC<StandardCardTitleProps>;
	Subtitle: React.FC<StandardCardSubtitleProps>;
	Media: React.FC<StandardCardMediaProps>;
	Content: React.ForwardRefExoticComponent<StandardCardContentProps & React.RefAttributes<HTMLDivElement>>;
	Actions: React.FC<StandardCardActionsProps>;
	Footer: React.FC<StandardCardFooterProps>;
}

// 📌 CAMBIO 2: Creamos un contexto para comunicar la decisión del scroll a los hijos.
const StandardCardContext = createContext<{
  noPadding: boolean;
  contentCanScroll: boolean;
}>({ noPadding: false, contentCanScroll: false });


const cardEntranceVariants: Variants = { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 }, };
const overlayVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const MotionDiv = motion.div;
//#endregion ![def]


//#region [main_root] - 🧱 ROOT CARD COMPONENT 🧱
const StandardCardRoot = forwardRef<HTMLDivElement, StandardCardProps>(
	(
		{
			colorScheme = "primary",
			styleType = "subtle",
			shadow = "md",
			disableShadowHover = true,
			animateEntrance = true,
      hasOutline = false,
			accentPlacement = "none",
			outlineColorScheme,
			accentColorScheme,
			selected = false, loading = false, inactive = false,
			className, children, noPadding = false, contentCanScroll = false,
			showSelectionCheckbox = false, onSelectionChange, customTransition, style,
			onCardClick, loaderSize = 32, loadingText, loadingVariant = "spin-pulse",
			"data-testid": dataTestId, ...htmlProps
		},
		ref,
	) => {
		const { appColorTokens, mode } = useTheme();

		const cardTokens = useMemo(() => {
			if (appColorTokens && mode) return generateStandardCardTokens(appColorTokens, mode);
			return null;
		}, [appColorTokens, mode]);

		const cssVariables = useMemo(() => {
			if (!cardTokens) return {};
			const currentCardScheme = colorScheme || "neutral";
			const vars: React.CSSProperties & { [key: `--${string}`]: string | number; } = {};
			const styleTypeTokens = cardTokens.styleTypes[styleType]?.[currentCardScheme] || cardTokens.styleTypes[styleType]?.neutral;

			vars["--sc-bg"] = styleTypeTokens?.background || "transparent";
			vars["--sc-text-color"] = styleTypeTokens?.color || cardTokens.defaultTextColor || "currentColor";
			
			const effectiveOutlineScheme = outlineColorScheme || currentCardScheme;
			if (hasOutline) {
				const outlineTokens = cardTokens.outline[effectiveOutlineScheme] || cardTokens.outline.neutral;
				if (outlineTokens) {
					vars["--sc-outline-border-color"] = outlineTokens.borderColor || "currentColor";
					vars["--sc-outline-border-width"] = outlineTokens.borderWidth || "1px";
					vars["--sc-outline-border-style"] = outlineTokens.borderStyle || "solid";
				}
			} else {
				vars["--sc-outline-border-width"] = "0px";
				vars["--sc-outline-border-style"] = "none";
			}

			const mainCardScheme = currentCardScheme;
			const effectiveAccentColorScheme = accentColorScheme || mainCardScheme;
			const accentTokenDefinitions = cardTokens.accents[accentPlacement]?.[effectiveAccentColorScheme];

			if (accentPlacement !== "none" && accentTokenDefinitions) {
				if (accentColorScheme === "accent") {
					if (mainCardScheme === "accent") {
						vars["--sc-accent-bg"] = cardTokens.accents[accentPlacement]?.accent?.duotoneMagicBackground || "currentColor";
					} else {
						vars["--sc-accent-bg"] = cardTokens.accents[accentPlacement]?.[mainCardScheme]?.duotoneMagicBackground || accentTokenDefinitions.standardBackground || "currentColor";
					}
				} else {
					vars["--sc-accent-bg"] = accentTokenDefinitions.standardBackground || "currentColor";
				}
				if (!vars["--sc-accent-bg"]) vars["--sc-accent-bg"] = "currentColor";
				vars["--sc-accent-dimension-h"] = accentTokenDefinitions.height || "100%";
				vars["--sc-accent-dimension-w"] = accentTokenDefinitions.width || "100%";
			} else {
				vars["--sc-accent-bg"] = "transparent";
			}
			
			if (selected && !inactive) {
				const selectedTokens = cardTokens.selected[currentCardScheme] || cardTokens.selected.neutral;
				if (selectedTokens) {
					vars["--sc-selected-border-color"] = selectedTokens.borderColor || "currentColor";
					vars["--sc-selected-border-width"] = selectedTokens.borderWidth || "2px";
					vars["--sc-selected-overlay-bg"] = selectedTokens.overlayBackground || "rgba(0,0,0,0.1)";
				}
			}

			const checkboxTokens = cardTokens.checkbox[currentCardScheme] || cardTokens.checkbox.neutral;
			if (checkboxTokens) {
				vars["--sc-checkbox-border-color"] = checkboxTokens.borderColor || "currentColor";
				vars["--sc-checkbox-icon-color"] = checkboxTokens.iconColor || "currentColor";
				vars["--sc-checkbox-focus-ring-color"] = checkboxTokens.focusRingColor || "currentColor";
			}
			
			vars['--sc-inactive-overlay-bg'] = cardTokens.inactiveOverlayBackground || "rgba(255,255,255,0.7)";
			vars['--sc-loading-overlay-bg'] = cardTokens.loadingOverlayBackground || "rgba(255,255,255,0.9)";

			return vars;
		}, [cardTokens, colorScheme, styleType, hasOutline, outlineColorScheme, accentPlacement, accentColorScheme, selected, inactive]);

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
      // 📌 CAMBIO 3: La lógica del overflow raíz.
			className: cn(
        "relative rounded-lg flex flex-col", // La arquitectura flex raíz
        "transition-shadow duration-200 ease-out", 
        shadowClass, 
        dynamicHoverShadowClass, 
        !contentCanScroll && "overflow-hidden", // Se desactiva solo si es necesario
        { "cursor-not-allowed": isEffectivelyDisabled && !onCardClick, "cursor-pointer": onCardClick && !isEffectivelyDisabled }, 
        className
      ),
			style: { ...cssVariables, background: 'var(--sc-bg)', color: 'var(--sc-text-color)', borderColor: hasOutline ? 'var(--sc-outline-border-color)' : undefined, borderWidth: hasOutline ? 'var(--sc-outline-border-width)' : undefined, borderStyle: hasOutline ? 'var(--sc-outline-border-style)' : undefined, ...style } as React.CSSProperties,
			initial: animateEntrance && !showLoadingIndicator ? "hidden" : false,
			animate: animateEntrance && !showLoadingIndicator ? "visible" : false,
			variants: animateEntrance && !showLoadingIndicator ? cardEntranceVariants : undefined,
			transition: cardCombinedTransition,
			whileHover: hoverEffectActive ? { scale: 1.025, transition: { type: "spring", stiffness: 350, damping: 15 } } : {},
			whileTap: (onCardClick && !isEffectivelyDisabled) ? { scale: 0.985, transition: { type: "spring", stiffness: 400, damping: 15 } } : {},
			onClick: !isEffectivelyDisabled && onCardClick ? (e) => { const target = e.target as HTMLElement; if (target.closest('[role="checkbox"], button, a')) { return; } onCardClick(e); } : undefined,
			tabIndex: onCardClick && !isEffectivelyDisabled ? 0 : undefined,
			role: onCardClick ? "button" : undefined,
			...(isEffectivelyDisabled && !onCardClick && { onClickCapture: (e: React.MouseEvent) => e.stopPropagation() }),
			...htmlProps,
		};
		if (dataTestId) motionRootProps["data-testid"] = dataTestId;

		const renderAccent = () => {
			const accentBgValue = cssVariables["--sc-accent-bg"];
			if (accentPlacement === "none" || !cardTokens || !accentBgValue || String(accentBgValue).trim() === "transparent") { return null; }
			const commonPositionClasses = "absolute z-[2]";
			const accentStyle: React.CSSProperties = {
				backgroundImage: String(accentBgValue),
				height: cssVariables["--sc-accent-dimension-h"],
				width: cssVariables["--sc-accent-dimension-w"],
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
					<MotionDiv key="loading-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 z-[4] backdrop-blur-sm rounded-lg" style={{ backgroundColor: "var(--sc-loading-overlay-bg)" }} />
					<div className="absolute inset-0 z-[5] flex flex-col items-center justify-center pointer-events-none">
						<SustratoLoadingLogo size={loaderSize} variant={loadingVariant} text={loadingText} showText={!!loadingText} />
					</div>
				</>
			);
		};
		
		const renderInactiveOverlay = () => { if (!inactive || showLoadingIndicator) return null; return <MotionDiv key="inactive-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 z-[5] backdrop-blur-sm rounded-lg pointer-events-auto" style={{ backgroundColor: "var(--sc-inactive-overlay-bg)" }} /> };

		return (
			<MotionDiv {...motionRootProps}>
        <StandardCardContext.Provider value={{ noPadding, contentCanScroll }}>
          {renderAccent()}
          {showSelectionCheckbox && onSelectionChange && !showLoadingIndicator && (
            <motion.button type="button" disabled={isEffectivelyDisabled} onClick={(e) => { e.stopPropagation(); onSelectionChange(!selected); }}
              className={cn( "absolute top-3 right-3 z-20 p-0.5 rounded transition-colors", "bg-white/40 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/40", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--sc-checkbox-focus-ring-color)]", isEffectivelyDisabled && "opacity-50 cursor-not-allowed", )}
              whileTap={{ scale: isEffectivelyDisabled ? 1 : 0.9 }} aria-pressed={selected} aria-label={selected ? "Deseleccionar tarjeta" : "Seleccionar tarjeta"}
            >
              {selected ? <Check size={18} className="text-[var(--sc-checkbox-icon-color)]" /> : <Square size={18} className="text-[var(--sc-checkbox-border-color)]" />}
            </motion.button>
          )}
          {/* 📌 CAMBIO 4: La estructura interna se simplifica. El div z-10 es ahora el contenedor flex principal de los children. */}
          <div className="relative z-[1] flex flex-col flex-grow h-full w-full">
            {children}
          </div>
          <AnimatePresence>{selected && !inactive && renderSelectedIndicator()}</AnimatePresence>
          <AnimatePresence>{inactive && !showLoadingIndicator && renderInactiveOverlay()}</AnimatePresence>
          <AnimatePresence>{showLoadingIndicator && renderLoadingState()}</AnimatePresence>
        </StandardCardContext.Provider>
			</MotionDiv>
		);
	},
);
StandardCardRoot.displayName = "StandardCard";
//#endregion ![main_root]

//#region [main_subcomponents] -🧩 SUBCOMPONENTS (Header, Title, etc.) 🧩

const Header = ({ className, children, ...props }: StandardCardHeaderProps): JSX.Element => {
  const { noPadding } = useContext(StandardCardContext);
  return (<div className={cn("mb-3", !noPadding && "p-4 pb-0", className)} {...props}>{children}</div>);
};
Header.displayName = "StandardCard.Header";

const Title = ({ children, className, size = "lg", colorScheme, colorShade, weight = "semibold", applyGradient, truncate, ...htmlProps }: StandardCardTitleProps): JSX.Element => (
    <StandardText asElement="h3" size={size} colorScheme={colorScheme} colorShade={colorShade} weight={weight} applyGradient={applyGradient} truncate={truncate} className={cn(!colorScheme && !colorShade && "text-[var(--sc-text-color)]", className)} {...htmlProps}>
      {children}
    </StandardText>
);
Title.displayName = "StandardCard.Title";

const Subtitle = ({ children, className, size = "sm", colorScheme, colorShade, weight, applyGradient, truncate, ...htmlProps }: StandardCardSubtitleProps): JSX.Element => (
    <StandardText asElement="p" size={size} colorScheme={colorScheme} colorShade={colorShade} weight={weight} applyGradient={applyGradient} truncate={truncate} className={cn("opacity-80", !colorScheme && !colorShade && "text-[var(--sc-text-color)]", className)} {...htmlProps}>
      {children}
    </StandardText>
);
Subtitle.displayName = "StandardCard.Subtitle";

const Media = ({ className, children, ...props }: StandardCardMediaProps): JSX.Element => (<div className={cn("mb-3 overflow-hidden", className)} {...props}>{children}</div>);
Media.displayName = "StandardCard.Media";

const Content = React.forwardRef<HTMLDivElement, StandardCardContentProps>(
  ({ className, children, ...props }, ref) => {
    const { noPadding, contentCanScroll } = useContext(StandardCardContext);
    const paddingClass = noPadding ? "" : "p-4";

    return (
      // 📌 CAMBIO 5: LA LÓGICA FINAL Y CORRECTA
      <div 
        ref={ref} 
        className={cn(
          "flex-1", // Crece para ocupar el espacio disponible.
          contentCanScroll 
            ? "min-h-0 overflow-y-auto" // Si puede hacer scroll, se le permite encogerse y mostrar la barra.
            : "overflow-hidden",      // Si no, se corta como antes.
          paddingClass,
          className
        )} 
        {...props}
      >
        {children}
      </div>
    );
  }
);
Content.displayName = "StandardCard.Content";

const Actions = ({ className, children, ...props }: StandardCardActionsProps): JSX.Element => {
  const { noPadding } = useContext(StandardCardContext);
  return (<div className={cn("mt-4 flex flex-wrap items-center gap-2", !noPadding && "p-4 pt-0", className)} {...props}>{children}</div>);
};
Actions.displayName = "StandardCard.Actions";

const Footer = ({ className, children, ...props }: StandardCardFooterProps): JSX.Element => (
  <div 
    className={cn(
      "mt-4 pt-4 px-4 pb-2",
      "border-t border-[var(--sc-outline-border-color)]/30 dark:border-[var(--sc-outline-border-color)]/20",
      "flex items-center justify-end gap-3",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);
Footer.displayName = "StandardCard.Footer";
//#endregion ![main_subcomponents]

//#region [main_composition] - 🏗️ COMPONENT COMPOSITION 🏗️
const StandardCard = StandardCardRoot as StandardCardComposition;
StandardCard.Header = Header; StandardCard.Title = Title; StandardCard.Subtitle = Subtitle; StandardCard.Media = Media; StandardCard.Content = Content; StandardCard.Actions = Actions; StandardCard.Footer = Footer;
//#endregion ![main_composition]

//#region [foo] - 🔚 EXPORTS 🔚
export { StandardCard, type StandardCardColorScheme };
//#endregion ![foo]