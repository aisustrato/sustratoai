// 📍 components/ui/StandardCard.tsx (v5.0 - PERFORMANCE REFACTOR)
// 🎯 PROPÓSITO: Card polimórfica con tokens precalculados y efectos SUSTRATO
// 🔧 DECISIÓN: Inline styles + CSS variables (misma arquitectura que StandardSelect v4.3)
//    ANTES: Inyectaba ~130 líneas de CSS dinámico al <head> por cada instancia
//    AHORA: Inline styles computados con useMemo. Cero manipulación del DOM.
// 📋 CHANGELOG v5.0:
//    - Eliminada inyección CSS dinámica (useLayoutEffect con document.createElement)
//    - Estados y colores via inline styles + CSS variables
//    - Animaciones movidas a CSS estático (standard-card-animations.css)
//    - Eliminado backdrop-blur-sm de loading/inactive overlays
//    - ~100% menos manipulación DOM por instancia

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import {
	forwardRef,
	useMemo,
	createContext,
	useContext,
	useLayoutEffect,
	useState,
} from "react";
import { Check, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	useDesignTokens,
	type CardStyleType,
	type CardVariant,
	type CardShadow,
	type CardAccentPlacement,
} from "@/app/providers/DesignTokensProvider";
import {
	StandardText,
	type StandardTextSize,
	type StandardTextWeight,
	type StandardTextGradient,
	type StandardTextColorShade,
} from "@/components/ui/StandardText";
import { useRipple } from "@/components/ripple/RippleProvider";
import {
	SustratoLoadingLogo,
	type SustratoLoadingLogoProps,
} from "@/components/ui/sustrato-loading-logo";
//#endregion ![head]

//#region [def] - 📦 INTERFACES, TYPES & VARIANTS 📦

// Re-exportar tipos para compatibilidad
export type StandardCardStyleType = CardStyleType;
export type StandardCardAccentPlacement = CardAccentPlacement;
export type StandardCardShadow = CardShadow;
export type StandardCardColorScheme = CardVariant;

type CardTextSize = StandardTextSize;
type CardTextWeight = StandardTextWeight;
type CardTextGradient = StandardTextGradient;
type CardTextColorShade = StandardTextColorShade;

export interface StandardCardProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	title?: React.ReactNode;
	contentCanScroll?: boolean;
	colorScheme?: CardVariant;
	styleType?: CardStyleType;
	shadow?: CardShadow;
	hasOutline?: boolean;
	outlineColorScheme?: CardVariant;
	accentPlacement?: CardAccentPlacement;
	accentColorScheme?: CardVariant;
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
	"data-testid"?: string;
	onCardClick?: React.MouseEventHandler<HTMLDivElement>;
	loaderSize?: number;
	loadingText?: string;
	loadingVariant?: SustratoLoadingLogoProps["variant"];
	approved?: boolean;
	approvedColorScheme?: CardVariant;
	animateOnChangeKey?: string | number | boolean; // eslint-disable-line @typescript-eslint/no-unused-vars
	// 🌊 Efectos SUSTRATO
	pulseBorder?: boolean;
	pafffMoment?: boolean;
	shimmer?: boolean;
	elevate?: boolean; // eslint-disable-line @typescript-eslint/no-unused-vars
	// 🌊 Efecto ripple en click
	disableRipple?: boolean;
}

interface StandardCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
}
interface StandardCardTitleProps
	extends React.HTMLAttributes<HTMLHeadingElement> {
	className?: string;
	children?: React.ReactNode;
	size?: CardTextSize;
	colorScheme?: StandardCardColorScheme;
	colorShade?: CardTextColorShade;
	weight?: CardTextWeight;
	applyGradient?: CardTextGradient;
	truncate?: boolean;
}
interface StandardCardSubtitleProps
	extends React.HTMLAttributes<HTMLParagraphElement> {
	className?: string;
	children?: React.ReactNode;
	size?: CardTextSize;
	colorScheme?: StandardCardColorScheme;
	colorShade?: CardTextColorShade;
	weight?: CardTextWeight;
	applyGradient?: CardTextGradient;
	truncate?: boolean;
}
interface StandardCardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
}
interface StandardCardContentProps
	extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
}
interface StandardCardActionsProps
	extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
}
interface StandardCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
}

interface StandardCardComposition
	extends React.ForwardRefExoticComponent<
		StandardCardProps & React.RefAttributes<HTMLDivElement>
	> {
	Header: React.FC<StandardCardHeaderProps>;
	Title: React.FC<StandardCardTitleProps>;
	Subtitle: React.FC<StandardCardSubtitleProps>;
	Media: React.FC<StandardCardMediaProps>;
	Content: React.ForwardRefExoticComponent<
		StandardCardContentProps & React.RefAttributes<HTMLDivElement>
	>;
	Actions: React.FC<StandardCardActionsProps>;
	Footer: React.FC<StandardCardFooterProps>;
}

const StandardCardContext = createContext<{
	noPadding: boolean;
	contentCanScroll: boolean;
}>({ noPadding: false, contentCanScroll: false });

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
			outlineColorScheme, // eslint-disable-line @typescript-eslint/no-unused-vars
			accentColorScheme, // eslint-disable-line @typescript-eslint/no-unused-vars
			selected = false,
			loading = false,
			inactive = false,
			className,
			children,
			noPadding = false,
			contentCanScroll = false,
			showSelectionCheckbox = false,
			onSelectionChange,
			onCardClick,
			loaderSize = 32,
			loadingText,
			loadingVariant = "spin-pulse",
			approved = false,
			approvedColorScheme,
			pulseBorder = false,
			pafffMoment = false,
			shimmer = false,
			disableRipple = false,
			"data-testid": dataTestId,
			title,
			...htmlProps
		},
		ref,
	) => {
		// 🌉 THE BRIDGE - Tokens del Provider
		const { tokens } = useDesignTokens();
		const triggerRipple = useRipple();

		// Estado para controlar animación de entrada
		const [isEntranceAnimating, setIsEntranceAnimating] = useState(
			animateEntrance && !loading && !inactive,
		);

		// Determinar el colorScheme efectivo
		const effectiveColorScheme: CardVariant =
			approved ?
				approvedColorScheme || "success"
			:	(colorScheme as CardVariant) || "primary";

		// Obtener tokens para este estilo
		const styleTokens = useMemo(() => {
			if (!tokens?.card) return null;
			return (
				tokens.card.styles[effectiveColorScheme]?.[styleType] ||
				tokens.card.styles.primary.subtle
			);
		}, [tokens, effectiveColorScheme, styleType]);

		const shadowClass = tokens?.card?.shadows[shadow] || "shadow-md";
		const accentHeight = tokens?.card?.accents.height[accentPlacement] || "0";
		const accentWidth = tokens?.card?.accents.width[accentPlacement] || "0";

		// Determinar si los efectos deben estar activos
		const effectsDisabled = selected || loading || inactive;
		const showPulse = pulseBorder && !effectsDisabled;
		const showPafff = pafffMoment && !effectsDisabled && !pulseBorder;
		const showShimmer = shimmer && !effectsDisabled;

		// Controlar animación de entrada
		useLayoutEffect(() => {
			if (animateEntrance && !loading && !inactive) {
				setIsEntranceAnimating(true);
				const timer = setTimeout(() => setIsEntranceAnimating(false), 400);
				return () => clearTimeout(timer);
			}
		}, [animateEntrance, loading, inactive]);

		// 🎨 CSS Variables + Inline Styles (REEMPLAZO de inyección CSS dinámica)
		// Se calculan con useMemo, sin tocar el DOM
		const cssVariables = useMemo((): React.CSSProperties => {
			if (!styleTokens) return {};
			const vars: Record<string, string | number> = {
				// Core colors
				"--sc-bg":
					styleTokens.backgroundGradient !== "none" ?
						styleTokens.backgroundGradient
					:	styleTokens.background,
				"--sc-text-color": styleTokens.text,
				// Outline
				"--sc-outline-border-color": styleTokens.border,
				"--sc-outline-border-width": hasOutline ? "1px" : "0px",
				"--sc-outline-border-style": hasOutline ? "solid" : "none",
				"--sc-outline-border-hover": styleTokens.borderHover,
				// Accent
				"--sc-accent-bg": styleTokens.accentGradient,
				"--sc-accent-dimension-h": accentHeight,
				"--sc-accent-dimension-w": accentWidth,
				// Selection
				"--sc-selected-border-color": styleTokens.borderSelected,
				"--sc-selected-border-width": "2px",
				"--sc-selected-overlay-bg": styleTokens.selectedOverlay,
				// Checkbox
				"--sc-checkbox-border-color": styleTokens.checkboxBorder,
				"--sc-checkbox-icon-color": styleTokens.checkboxIcon,
				"--sc-checkbox-focus-ring-color": styleTokens.checkboxFocusRing,
				// Overlays
				"--sc-hover-overlay-bg": styleTokens.hoverOverlay,
				"--sc-hover-overlay-inset": hasOutline ? "1px" : "0px",
				"--sc-inactive-overlay-bg": styleTokens.disabledOverlay,
				"--sc-loading-overlay-bg": styleTokens.loadingOverlay,
				// Animation tokens (para CSS estático con variables)
				"--sc-focus-ring": styleTokens.focusRing,
				"--sc-border-selected": styleTokens.borderSelected,
				"--sc-border": styleTokens.border,
			};
			return vars as unknown as React.CSSProperties;
		}, [styleTokens, hasOutline, accentHeight, accentWidth]);

		// 🔄 Hover state para border (inline styles no soportan :hover)
		const [isHovered, setIsHovered] = useState(false);

		const hoverEffectActive = !disableShadowHover && !inactive && !loading;
		const hoverShadowClasses: Record<StandardCardShadow, string> = {
			none: "",
			sm: "hover:shadow-sm",
			md: "hover:shadow-md",
			lg: "hover:shadow-lg",
			xl: "hover:shadow-xl",
		};
		const dynamicHoverShadowClass =
			hoverEffectActive && shadow !== "none" ? hoverShadowClasses[shadow] : "";
		const forcedHoverShadowClasses: Record<StandardCardShadow, string> = {
			none: "",
			sm: "data-[force-hover=true]:shadow-sm",
			md: "data-[force-hover=true]:shadow-md",
			lg: "data-[force-hover=true]:shadow-lg",
			xl: "data-[force-hover=true]:shadow-xl",
		};
		const dynamicForcedShadowClass =
			shadow !== "none" ? forcedHoverShadowClasses[shadow] : "";

		const isEffectivelyDisabled = inactive || loading;
		const showLoadingIndicator = loading && !inactive;

		// Inline style for hover border
		const hoverBorderStyle = useMemo((): React.CSSProperties => {
			if (!hasOutline || isEffectivelyDisabled || !isHovered) return {};
			return { borderColor: "var(--sc-outline-border-hover)" };
		}, [hasOutline, isEffectivelyDisabled, isHovered]);

		// Determinar clases de efectos SUSTRATO
		const pulseClass = showPulse ? "sc-pulse" : "";
		const pafffClass = showPafff ? "sc-pafff" : "";
		const shimmerClass = showShimmer ? "sc-shimmer" : "";
		const entranceClass = isEntranceAnimating ? "sc-entrance" : "";

		const rootProps: React.HTMLAttributes<HTMLDivElement> & {
			"data-testid"?: string;
		} = {
			className: cn(
				"relative rounded-lg flex flex-col group/StandardCard",
				"transition-all duration-200 ease-out",
				shadowClass,
				dynamicHoverShadowClass,
				dynamicForcedShadowClass,
				!contentCanScroll && "overflow-hidden",
				{
					"cursor-not-allowed": isEffectivelyDisabled && !onCardClick,
					"cursor-pointer": onCardClick && !isEffectivelyDisabled,
				},
				selected && !inactive && "sc-selected",
				pulseClass,
				pafffClass,
				shimmerClass,
				entranceClass,
				className,
			),
			style: {
				...cssVariables,
				background: "var(--sc-bg)",
				color: "var(--sc-text-color)",
				borderColor: hasOutline ? "var(--sc-outline-border-color)" : undefined,
				borderWidth: hasOutline ? "var(--sc-outline-border-width)" : undefined,
				borderStyle: hasOutline ? "var(--sc-outline-border-style)" : undefined,
				...hoverBorderStyle,
				...htmlProps.style,
			} as React.CSSProperties,
			onMouseEnter: (e) => {
				setIsHovered(true);
				htmlProps.onMouseEnter?.(e);
			},
			onMouseLeave: (e) => {
				setIsHovered(false);
				htmlProps.onMouseLeave?.(e);
			},
			onMouseDown: (e) => {
				// 🌊 Activar ripple instantáneamente al presionar
				if (!isEffectivelyDisabled && !disableRipple && onCardClick) {
					// 🌊 Ripple de tamaño fijo como el navbar (escala 9)
					const scale = 9;
					triggerRipple(e, "rgba(0, 0, 0, 0.1)", scale);
				}
			},
			onClick:
				!isEffectivelyDisabled && onCardClick ?
					(e) => {
						const target = e.target as HTMLElement;
						if (target.closest("[role='checkbox'], button, a")) {
							return;
						}
						onCardClick(e);
					}
				:	undefined,
			tabIndex: onCardClick && !isEffectivelyDisabled ? 0 : undefined,
			role: onCardClick ? "button" : undefined,
			...(isEffectivelyDisabled &&
				!onCardClick && {
					onClickCapture: (e: React.MouseEvent) => e.stopPropagation(),
				}),
			...htmlProps,
		};
		if (dataTestId) rootProps["data-testid"] = dataTestId;

		const renderAccent = () => {
			const accentBgValue =
				cssVariables["--sc-accent-bg" as keyof typeof cssVariables];
			if (
				accentPlacement === "none" ||
				!styleTokens ||
				!accentBgValue ||
				String(accentBgValue).trim() === "transparent"
			) {
				return null;
			}
			const commonPositionClasses = "absolute z-[2]";
			const accentStyle: React.CSSProperties = {
				backgroundImage: String(accentBgValue),
				height: cssVariables[
					"--sc-accent-dimension-h" as keyof typeof cssVariables
				] as string,
				width: cssVariables[
					"--sc-accent-dimension-w" as keyof typeof cssVariables
				] as string,
			};
			switch (accentPlacement) {
				case "top":
					return (
						<div
							className={cn(commonPositionClasses, "top-0 left-0 right-0")}
							style={accentStyle}
						/>
					);
				case "left":
					return (
						<div
							className={cn(commonPositionClasses, "top-0 bottom-0 left-0")}
							style={accentStyle}
						/>
					);
				case "right":
					return (
						<div
							className={cn(commonPositionClasses, "top-0 bottom-0 right-0")}
							style={accentStyle}
						/>
					);
				case "bottom":
					return (
						<div
							className={cn(commonPositionClasses, "bottom-0 left-0 right-0")}
							style={accentStyle}
						/>
					);
				default:
					return null;
			}
		};

		const renderSelectedIndicator = () => {
			if (!selected || inactive) return null;
			return (
				<div
					key="selected-indicator"
					className="absolute inset-0 z-[0] rounded-lg pointer-events-none sc-overlay-fade-in"
					style={{
						borderWidth: "var(--sc-selected-border-width)",
						borderStyle: "solid",
						borderColor: "var(--sc-selected-border-color)",
						backgroundColor: "var(--sc-selected-overlay-bg)",
					}}
				/>
			);
		};

		const renderLoadingState = () => {
			if (!showLoadingIndicator) return null;
			return (
				<>
					{/* 🎯 FIX PERFORMANCE: Eliminado backdrop-blur-sm — costoso con contenido pesado detrás */}
					<div
						key="loading-overlay"
						className="absolute inset-0 z-[4] rounded-lg sc-overlay-fade-in"
						style={{ backgroundColor: "var(--sc-loading-overlay-bg)" }}
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
			return (
				<div
					key="inactive-overlay"
					// 🎯 FIX PERFORMANCE: Eliminado backdrop-blur-sm
					className="absolute inset-0 z-[5] rounded-lg pointer-events-auto sc-overlay-fade-in"
					style={{ backgroundColor: "var(--sc-inactive-overlay-bg)" }}
				/>
			);
		};

		return (
			<div ref={ref} {...rootProps}>
				<StandardCardContext.Provider value={{ noPadding, contentCanScroll }}>
					{renderAccent()}
					{showSelectionCheckbox &&
						onSelectionChange &&
						!showLoadingIndicator && (
							<button
								type="button"
								disabled={isEffectivelyDisabled}
								onClick={(e) => {
									e.stopPropagation();
									onSelectionChange(!selected);
								}}
								className={cn(
									"absolute top-3 right-3 z-20 p-0.5 rounded transition-all duration-150",
									"bg-white/40 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/40",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--sc-checkbox-focus-ring-color)]",
									isEffectivelyDisabled && "opacity-50 cursor-not-allowed",
									!isEffectivelyDisabled && "active:scale-90",
								)}
								aria-pressed={selected}
								aria-label={
									selected ? "Deseleccionar tarjeta" : "Seleccionar tarjeta"
								}>
								{selected ?
									<Check
										size={18}
										className="text-[var(--sc-checkbox-icon-color)]"
									/>
								:	<Square
										size={18}
										className="text-[var(--sc-checkbox-border-color)]"
									/>
								}
							</button>
						)}
					{/* Contenedor interno */}
					<div className="relative z-[1] flex flex-col flex-grow h-full w-full">
						{title && (
							<Header>
								<Title weight="semibold">{title}</Title>
							</Header>
						)}
						{children}
					</div>
					{selected && !inactive && renderSelectedIndicator()}
					{inactive && !showLoadingIndicator && renderInactiveOverlay()}
					{showLoadingIndicator && renderLoadingState()}
					{/* Overlay de hover */}
					{hoverEffectActive && (
						<div
							className="pointer-events-none absolute z-[3] rounded-lg opacity-0 transition-opacity duration-200 group-hover/StandardCard:opacity-100 group-data-[force-hover=true]/StandardCard:opacity-100"
							style={{
								background: "var(--sc-hover-overlay-bg)",
								inset:
									"calc(var(--sc-outline-border-width, 0px) + var(--sc-hover-overlay-inset, 0px))",
							}}
						/>
					)}
				</StandardCardContext.Provider>
			</div>
		);
	},
);
StandardCardRoot.displayName = "StandardCard";
//#endregion ![main_root]

//#region [main_subcomponents] -🧩 SUBCOMPONENTS (Header, Title, etc.) 🧩

const Header = ({
	className,
	children,
	...props
}: StandardCardHeaderProps): JSX.Element => {
	const { noPadding } = useContext(StandardCardContext);
	return (
		<div className={cn("mb-3", !noPadding && "p-4 pb-0", className)} {...props}>
			{children}
		</div>
	);
};
Header.displayName = "StandardCard.Header";

const Title = ({
	children,
	className,
	size = "lg",
	colorScheme,
	colorShade,
	weight = "semibold",
	applyGradient,
	truncate,
	...htmlProps
}: StandardCardTitleProps): JSX.Element => (
	<StandardText
		asElement="h3"
		size={size}
		colorScheme={colorScheme}
		colorShade={colorShade}
		weight={weight}
		applyGradient={applyGradient}
		truncate={truncate}
		className={cn(
			!colorScheme && !colorShade && "text-[var(--sc-text-color)]",
			className,
		)}
		{...htmlProps}>
		{children}
	</StandardText>
);
Title.displayName = "StandardCard.Title";

const Subtitle = ({
	children,
	className,
	size = "sm",
	colorScheme,
	colorShade,
	weight,
	applyGradient,
	truncate,
	...htmlProps
}: StandardCardSubtitleProps): JSX.Element => (
	<StandardText
		asElement="p"
		size={size}
		colorScheme={colorScheme}
		colorShade={colorShade}
		weight={weight}
		applyGradient={applyGradient}
		truncate={truncate}
		className={cn(
			"opacity-80",
			!colorScheme && !colorShade && "text-[var(--sc-text-color)]",
			className,
		)}
		{...htmlProps}>
		{children}
	</StandardText>
);
Subtitle.displayName = "StandardCard.Subtitle";

const Media = ({
	className,
	children,
	...props
}: StandardCardMediaProps): JSX.Element => (
	<div className={cn("mb-3 overflow-hidden", className)} {...props}>
		{children}
	</div>
);
Media.displayName = "StandardCard.Media";

const Content = React.forwardRef<HTMLDivElement, StandardCardContentProps>(
	({ className, children, ...props }, ref) => {
		const { noPadding, contentCanScroll } = useContext(StandardCardContext);
		const [showScrollHint, setShowScrollHint] = React.useState(false);
		const paddingClass = noPadding ? "" : "p-4";

		React.useEffect(() => {
			let timer: NodeJS.Timeout;
			if (contentCanScroll) {
				setShowScrollHint(true);
				timer = setTimeout(() => {
					setShowScrollHint(false);
				}, 3500);
			} else {
				setShowScrollHint(false);
			}

			return () => {
				if (timer) clearTimeout(timer);
			};
		}, [contentCanScroll]);

		return (
			<div
				ref={ref}
				className={cn(
					"relative flex-1",
					contentCanScroll ?
						"min-h-0 overflow-y-auto custom-scrollbar"
					:	"overflow-hidden",
					paddingClass,
					className,
				)}
				{...props}>
				{children}
				{showScrollHint && (
					<div className="absolute top-2 right-2 z-10 bg-neutral-800/60 dark:bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg sc-scroll-hint">
						Scroll
					</div>
				)}
			</div>
		);
	},
);
Content.displayName = "StandardCard.Content";

const Actions = ({
	className,
	children,
	...props
}: StandardCardActionsProps): JSX.Element => {
	const { noPadding } = useContext(StandardCardContext);
	return (
		<div
			className={cn(
				"mt-4 flex flex-wrap items-center gap-2",
				!noPadding && "p-4 pt-0",
				className,
			)}
			{...props}>
			{children}
		</div>
	);
};
Actions.displayName = "StandardCard.Actions";

const Footer = ({
	className,
	children,
	...props
}: StandardCardFooterProps): JSX.Element => (
	<div
		className={cn(
			"mt-4 pt-4 px-4 pb-2",
			"border-t border-[var(--sc-outline-border-color)]/30 dark:border-[var(--sc-outline-border-color)]/20",
			"flex items-center justify-end gap-3",
			className,
		)}
		{...props}>
		{children}
	</div>
);
Footer.displayName = "StandardCard.Footer";
//#endregion ![main_subcomponents]

//#region [main_composition] - 🏗️ COMPONENT COMPOSITION 🏗️
const StandardCard = StandardCardRoot as StandardCardComposition;
StandardCard.Header = Header;
StandardCard.Title = Title;
StandardCard.Subtitle = Subtitle;
StandardCard.Media = Media;
StandardCard.Content = Content;
StandardCard.Actions = Actions;
StandardCard.Footer = Footer;
//#endregion ![main_composition]

//#region [foo] - 🔚 EXPORTS 🔚
export {
	StandardCard,
	Header as StandardCardHeader,
	Title as StandardCardTitle,
	Subtitle as StandardCardSubtitle,
	Media as StandardCardMedia,
	Content as StandardCardContent,
	Actions as StandardCardActions,
	Footer as StandardCardFooter,
};
//#endregion ![foo]
