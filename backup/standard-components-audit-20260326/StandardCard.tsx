// 📍 components/ui/StandardCard.tsx (v4.3 - Patrón Flex + Efectos SUSTRATO)
// 🎯 PROPÓSITO: Card polimórfica con tokens precalculados y efectos SUSTRATO
// 🔧 DECISIÓN: Usa DesignTokensProvider + CSS dinámico inyectado
// ⚠️ ADVERTENCIA: Los efectos pulseBorder/pafffMoment solo se activan cuando se pasan explícitamente

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import {
	forwardRef,
	useMemo,
	createContext,
	useContext,
	useId,
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
	animateOnChangeKey?: string | number | boolean;
	// 🌊 Efectos SUSTRATO
	pulseBorder?: boolean;
	pafffMoment?: boolean;
	shimmer?: boolean;
	elevate?: boolean;
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
			outlineColorScheme,
			accentColorScheme,
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
			animateOnChangeKey,
			pulseBorder = false,
			pafffMoment = false,
			shimmer = false,
			elevate = false,
			"data-testid": dataTestId,
			title,
			...htmlProps
		},
		ref,
	) => {
		// 🌉 THE BRIDGE - Tokens del Provider
		const { tokens } = useDesignTokens();
		const cardId = useId().replace(/:/g, "");

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

		// 🎨 CSS Dinámico Inyectado (Patrón Flex)
		useLayoutEffect(() => {
			if (!styleTokens) return;

			const styleId = `card-styles-${cardId}`;
			let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.id = styleId;
				document.head.appendChild(styleEl);
			}

			styleEl.textContent = `
        /* Card base styles */
        .card-${cardId} {
          background: ${
						styleTokens.backgroundGradient !== "none" ?
							styleTokens.backgroundGradient
						:	styleTokens.background
					};
          color: ${styleTokens.text};
          ${hasOutline ? `border: 1px solid ${styleTokens.border};` : ""}
          transition: background 0.4s ease-in-out, color 0.4s ease-in-out, border-color 0.3s ease-in-out;
        }
        .card-${cardId}:hover {
          ${hasOutline ? `border-color: ${styleTokens.borderHover};` : ""}
        }
        .card-${cardId}.card-selected {
          border: 2px solid ${styleTokens.borderSelected};
          box-shadow: 0 0 0 3px ${styleTokens.focusRing};
        }
        .card-${cardId} .card-accent {
          background: ${styleTokens.accentGradient};
          height: ${accentHeight};
          width: ${accentWidth};
        }
        .card-${cardId} .card-checkbox-border { color: ${styleTokens.checkboxBorder}; }
        .card-${cardId} .card-checkbox-icon { color: ${styleTokens.checkboxIcon}; }
        .card-${cardId} .card-disabled-overlay { background: ${styleTokens.disabledOverlay}; }
        .card-${cardId} .card-loading-overlay { background: ${styleTokens.loadingOverlay}; }
        .card-${cardId} .card-hover-overlay { background: ${styleTokens.hoverOverlay}; }
        .card-${cardId} .card-selected-overlay { background: ${styleTokens.selectedOverlay}; }

        /* Animación de entrada */
        ${
					isEntranceAnimating ?
						`
        .card-${cardId}.card-entrance {
          animation: card-entrance-${cardId} 0.4s ease-out forwards;
        }
        @keyframes card-entrance-${cardId} {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        `
					:	""
				}

        /* Animación de overlays */
        .card-${cardId} .card-overlay-fade-in {
          animation: card-overlay-fade-in-${cardId} 0.2s ease-out forwards;
        }
        @keyframes card-overlay-fade-in-${cardId} {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* 🌊 Pulse Border Animation */
        ${
					showPulse ?
						`
        @keyframes card-pulse-${cardId} {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 0 3px ${styleTokens.focusRing}; }
        }
        .card-${cardId}.card-pulse { animation: card-pulse-${cardId} 2.5s ease-in-out infinite; }
        `
					:	""
				}

        /* 🪩 Pafff Moment Animation */
        ${
					showPafff ?
						`
        @keyframes card-pafff-${cardId} {
          0%, 100% { box-shadow: inset 0 0 0 1px ${styleTokens.border}, 0 0 0 2px ${styleTokens.focusRing}; }
          50% { box-shadow: inset 0 0 0 2px ${styleTokens.borderSelected}, 0 0 0 4px ${styleTokens.focusRing}, 0 0 12px 2px ${styleTokens.focusRing}; }
        }
        .card-${cardId}.card-pafff { animation: card-pafff-${cardId} 1.5s ease-in-out infinite; }
        `
					:	""
				}

        /* Animación de scroll hint */
        .card-${cardId} .scroll-hint-fade-in {
          animation: scroll-hint-fade-in-${cardId} 0.3s ease-out forwards;
        }
        @keyframes scroll-hint-fade-in-${cardId} {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ✨ Shimmer Animation */
        ${
					showShimmer ?
						`
        @keyframes card-shimmer-${cardId} {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .card-${cardId}.card-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: card-shimmer-${cardId} 2s ease-in-out infinite;
          pointer-events: none;
          border-radius: inherit;
        }
        `
					:	""
				}
      `;

			return () => {
				if (styleEl && styleEl.parentNode) {
					styleEl.parentNode.removeChild(styleEl);
				}
			};
		}, [
			cardId,
			styleTokens,
			hasOutline,
			accentHeight,
			accentWidth,
			pulseBorder,
			pafffMoment,
			shimmer,
			selected,
			loading,
			inactive,
			showPulse,
			showPafff,
			showShimmer,
			isEntranceAnimating,
		]);

		// Variables CSS para compatibilidad (transición gradual)
		const cssVariables = useMemo(() => {
			if (!styleTokens) return {};
			const vars: React.CSSProperties & {
				[key: `--${string}`]: string | number;
			} = {};
			vars["--sc-bg"] = styleTokens.background;
			vars["--sc-text-color"] = styleTokens.text;
			vars["--sc-hover-overlay-bg"] = styleTokens.hoverOverlay;
			vars["--sc-hover-overlay-inset"] = hasOutline ? "1px" : "0px";
			vars["--sc-outline-border-color"] = styleTokens.border;
			vars["--sc-outline-border-width"] = hasOutline ? "1px" : "0px";
			vars["--sc-outline-border-style"] = hasOutline ? "solid" : "none";
			vars["--sc-accent-bg"] = styleTokens.accentGradient;
			vars["--sc-accent-dimension-h"] = accentHeight;
			vars["--sc-accent-dimension-w"] = accentWidth;
			vars["--sc-selected-border-color"] = styleTokens.borderSelected;
			vars["--sc-selected-border-width"] = "2px";
			vars["--sc-selected-overlay-bg"] = styleTokens.selectedOverlay;
			vars["--sc-checkbox-border-color"] = styleTokens.checkboxBorder;
			vars["--sc-checkbox-icon-color"] = styleTokens.checkboxIcon;
			vars["--sc-checkbox-focus-ring-color"] = styleTokens.checkboxFocusRing;
			vars["--sc-inactive-overlay-bg"] = styleTokens.disabledOverlay;
			vars["--sc-loading-overlay-bg"] = styleTokens.loadingOverlay;

			return vars;
		}, [styleTokens, hasOutline, accentHeight, accentWidth]);

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

		// Determinar clases de efectos SUSTRATO (reutilizar variables ya definidas)
		const pulseClass =
			pulseBorder && !isEffectivelyDisabled ? "card-pulse" : "";
		const pafffClass =
			pafffMoment && !isEffectivelyDisabled && !pulseBorder ? "card-pafff" : "";
		const shimmerClass =
			shimmer && !isEffectivelyDisabled ? "card-shimmer" : "";

		const rootProps: React.HTMLAttributes<HTMLDivElement> & {
			"data-testid"?: string;
		} = {
			className: cn(
				`card-${cardId}`, // Clase única para CSS dinámico
				"relative rounded-lg flex flex-col group/StandardCard", // La arquitectura flex raíz
				"transition-all duration-200 ease-out",
				shadowClass,
				dynamicHoverShadowClass,
				dynamicForcedShadowClass,
				!contentCanScroll && "overflow-hidden", // Se desactiva solo si es necesario
				{
					"cursor-not-allowed": isEffectivelyDisabled && !onCardClick,
					"cursor-pointer": onCardClick && !isEffectivelyDisabled,
				},
				selected && !inactive && "card-selected",
				pulseClass,
				pafffClass,
				shimmerClass,
				isEntranceAnimating && "card-entrance",
				className,
			),
			style: {
				...cssVariables,
				background: "var(--sc-bg)",
				color: "var(--sc-text-color)",
				borderColor: hasOutline ? "var(--sc-outline-border-color)" : undefined,
				borderWidth: hasOutline ? "var(--sc-outline-border-width)" : undefined,
				borderStyle: hasOutline ? "var(--sc-outline-border-style)" : undefined,
				...htmlProps.style,
			} as React.CSSProperties,
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
			const accentBgValue = cssVariables["--sc-accent-bg"];
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
				height: cssVariables["--sc-accent-dimension-h"],
				width: cssVariables["--sc-accent-dimension-w"],
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
					className="absolute inset-0 z-[0] rounded-lg pointer-events-none card-overlay-fade-in"
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
					<div
						key="loading-overlay"
						className="absolute inset-0 z-[4] backdrop-blur-sm rounded-lg card-overlay-fade-in"
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
					className="absolute inset-0 z-[5] backdrop-blur-sm rounded-lg pointer-events-auto card-overlay-fade-in"
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
					{/* Overlay de hover (por esquema/estilo). Aparece en hover y oscurece sutilmente el contenido respetando tokens */}
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
					<div className="absolute top-2 right-2 z-10 bg-neutral-800/60 dark:bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg scroll-hint-fade-in">
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
