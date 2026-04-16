// 📍 app/providers/DesignTokensProvider.tsx
// 🎯 PROPÓSITO: Precalcular TODOS los tokens de diseño una vez, evitando recálculos por componente
// 🔧 DECISIÓN: Este provider se ejecuta 1 vez al inicio y cada vez que cambia tema/modo
// ⚠️ ADVERTENCIA: Este archivo es CRÍTICO para la performance. La ganancia 10x viene de aquí.
// 🔄 MIGRACIÓN: Los componentes migrarán gradualmente de generateStandard*Tokens() a usar este provider

"use client";

//#region [imports] - 📦 IMPORTS
import React, {
	createContext,
	useContext,
	useMemo,
	type ReactNode,
} from "react";
import { useTheme } from "@/app/theme-provider";
import type {
	AppColorTokens,
	Mode,
	ColorSchemeVariant,
} from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";
import { generateStandardDatePickerTokens } from "@/lib/theme/components/standard-datepicker-tokens";
import { generateStandardFileUploadTokens } from "@/lib/theme/components/standard-file-upload-tokens";
import { generateStandardStepperTokens } from "@/lib/theme/components/standard-stepper-tokens";
import { generateStandardAccordionTokens } from "@/lib/theme/components/standard-accordion-tokens";
import { generateTableTokens } from "@/lib/theme/components/standard-table-tokens";
import { generateStandardNavbarTokens } from "@/lib/theme/components/standard-nav-tokens";
import { generateSphereTokens } from "@/lib/theme/components/standard-sphere-tokens";
import { generateFontSelectorTokens } from "@/lib/theme/components/font-selector-tokens";
//#endregion

//#region [types] - 🎨 TIPOS
// 💎 CORE: Estructura de tokens precalculados para botones
// 🔧 DECISIÓN: Precalcular TODAS las combinaciones posibles de size × styleType × colorScheme
export interface ButtonSizeTokens {
	height: string;
	padding: string;
	fontSize: string;
	gap: string;
	iconSize: "xs" | "sm" | "md" | "lg";
}

export interface ButtonStyleTokens {
	background: string;
	color: string;
	border: string;
	iconColorShade: "pure" | "contrastText" | "text" | "textShade";
	// 🔄 HELPER: Modificadores para estados (hover, pressed)
	hoverBackground: string;
	pressedBackground: string;
	rippleColor: string;
}

export interface ButtonTokens {
	sizes: Record<"xs" | "sm" | "md" | "lg" | "xl", ButtonSizeTokens>;
	styles: Record<
		ColorSchemeVariant,
		Record<"solid" | "outline" | "ghost" | "subtle" | "link", ButtonStyleTokens>
	>;
}

// 💎 CORE: Estructura de tokens precalculados para inputs
export interface InputSizeTokens {
	height: string;
	fontSize: string;
	paddingX: string;
	paddingY: string;
	iconSize: "xs" | "sm" | "md";
}

export interface InputStyleTokens {
	background: string;
	border: string;
	text: string;
	placeholder: string;
	iconColor: string;
	focusBorder: string;
	focusRing: string;
	hoverBorder: string;
	// Estados de validación
	errorBackground: string;
	errorBorder: string;
	errorRing: string;
	successBackground: string;
	successBorder: string;
	successRing: string;
	// Estados especiales
	disabledBackground: string;
	disabledBorder: string;
	disabledText: string;
	editingBackground: string;
	readOnlyBackground: string;
	readOnlyBorder: string;
	readOnlyText: string;
}

export interface InputTokens {
	sizes: Record<"sm" | "md" | "lg", InputSizeTokens>;
	styles: Record<
		"default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral",
		InputStyleTokens
	>;
}

// 💎 CORE: Estructura de tokens precalculados para textareas
export interface TextareaSizeTokens {
	minHeight: string;
	fontSize: string;
	paddingX: string;
	paddingY: string;
}

// Reutiliza InputStyleTokens - misma estructura de estados
export type TextareaStyleTokens = InputStyleTokens;

export interface TextareaTokens {
	sizes: Record<"sm" | "md" | "lg", TextareaSizeTokens>;
	styles: Record<
		"default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral",
		TextareaStyleTokens
	>;
}

// 💎 CORE: Estructura de tokens precalculados para selects
export interface SelectSizeTokens {
	height: string;
	fontSize: string;
	paddingX: string;
	paddingY: string;
	optionPaddingX: string;
	optionPaddingY: string;
	dropdownMaxHeight: string;
}

export interface SelectStyleTokens extends InputStyleTokens {
	// Tokens adicionales para dropdown
	dropdownBackground: string;
	dropdownBorder: string;
	optionText: string;
	optionHoverBackground: string;
	optionSelectedBackground: string;
	optionSelectedText: string;
	chevronButtonBackground: string;
}

export interface SelectTokens {
	sizes: Record<"sm" | "md" | "lg", SelectSizeTokens>;
	styles: Record<
		"default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral",
		SelectStyleTokens
	>;
}

// 💎 CORE: Estructura de tokens precalculados para cards
export type CardStyleType = "filled" | "subtle" | "transparent";
export type CardAccentPlacement = "none" | "top" | "left" | "right" | "bottom";
export type CardShadow = "none" | "sm" | "md" | "lg" | "xl";
export type CardVariant =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral"
	| "success"
	| "warning"
	| "danger";

export interface CardStyleTokens {
	// Fondos y colores base
	background: string;
	backgroundGradient: string;
	text: string;
	// Bordes
	border: string;
	borderHover: string;
	borderSelected: string;
	// Focus y efectos
	focusRing: string;
	hoverOverlay: string;
	selectedOverlay: string;
	// Acentos
	accentGradient: string;
	accentDuotone: string;
	// Estados
	disabledOverlay: string;
	loadingOverlay: string;
	// Checkbox
	checkboxBorder: string;
	checkboxIcon: string;
	checkboxFocusRing: string;
}

export interface CardTokens {
	styles: Record<CardVariant, Record<CardStyleType, CardStyleTokens>>;
	shadows: Record<CardShadow, string>;
	accents: {
		height: Record<CardAccentPlacement, string>;
		width: Record<CardAccentPlacement, string>;
	};
}

// 💎 CORE: Estructura de tokens precalculados para badges
export interface BadgeSizeTokens {
	height: string;
	padding: string;
	fontSize: string;
	gap: string;
	iconSize: "xs" | "sm" | "md";
}

export interface BadgeStyleTokens {
	background: string;
	color: string;
	border: string;
	iconColorShade: "pure" | "contrastText" | "text" | "textShade";
}

export interface BadgeTokens {
	sizes: Record<"2xs" | "xs" | "sm" | "md" | "lg", BadgeSizeTokens>;
	styles: Record<
		ColorSchemeVariant,
		Record<"solid" | "subtle" | "outline", BadgeStyleTokens>
	>;
}

// 💎 CORE: Estructura de tokens precalculados para iconos
export type IconSize =
	| "4xs"
	| "3xs"
	| "2xs"
	| "xs"
	| "sm"
	| "base"
	| "md"
	| "lg"
	| "xl"
	| "2xl"
	| "3xl"
	| "4xl"
	| "5xl";
export type IconStyleType =
	| "solid"
	| "outline"
	| "outlineGradient"
	| "inverseStroke";
export type IconColorShade =
	| "pure"
	| "text"
	| "textShade"
	| "bg"
	| "contrastText"
	| "subtle";

export interface IconStyleTokens {
	fill: string;
	stroke: string;
	defs: string;
}

export interface IconTokens {
	sizes: Record<IconSize, string>;
	styles: Record<
		ColorSchemeVariant,
		Record<IconStyleType, Record<IconColorShade, IconStyleTokens>>
	>;
}

// 💎 CORE: Estructura de tokens precalculados para texto
export type TextSize =
	| "4xs"
	| "3xs"
	| "2xs"
	| "xs"
	| "sm"
	| "base"
	| "md"
	| "lg"
	| "xl"
	| "2xl"
	| "3xl"
	| "4xl"
	| "5xl";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextColorShade =
	| "pure"
	| "text"
	| "textShade"
	| "contrastText"
	| "subtle";

export interface TextColorTokens {
	pure: string;
	text: string;
	contrastText: string;
	textShade: string;
	subtle: string;
}

export interface TextTokens {
	colors: Record<ColorSchemeVariant, TextColorTokens>;
	gradients: Record<ColorSchemeVariant, string>;
}

// 💎 CORE: Estructura de tokens precalculados para PageBackground
export type PageBackgroundVariant =
	| "default"
	| "gradient"
	| "subtle"
	| "minimal";

export interface PageBackgroundTokens {
	background: string;
	backgroundImage: string;
}

export type AllPageBackgroundTokens = Record<
	PageBackgroundVariant,
	PageBackgroundTokens
>;

// 🎨 TABS TOKENS
export type TabsStyleType = "line" | "enclosed";
export type TabsSize = "sm" | "md" | "lg";
export type TabsState = "active" | "inactive" | "hover" | "disabled";

export interface TabsListTokens {
	borderBottomColor: string;
	borderBottomWidth: string;
}

export interface TabsTriggerTokens {
	background: string;
	color: string;
	borderBottomColor: string;
	borderBottomWidth: string;
	borderTopColor: string;
	borderLeftColor: string;
	borderRightColor: string;
	fontWeight: string;
	fontSize: string;
	padding: string;
	cursor: string;
	opacity: number;
	marginBottom: string;
}

export interface TabsStateTokens {
	active: TabsTriggerTokens;
	inactive: TabsTriggerTokens;
	hover: TabsTriggerTokens;
	disabled: TabsTriggerTokens;
}

export interface TabsStyleTokens {
	list: TabsListTokens;
	trigger: TabsStateTokens;
}

export type TabsSizeTokens = Record<TabsSize, TabsStyleTokens>;
export type TabsColorSchemeTokens = Record<TabsStyleType, TabsSizeTokens>;
export type TabsTokens = Record<ColorSchemeVariant, TabsColorSchemeTokens>;

// 🎨 PROGRESS BAR TOKENS
export type ProgressBarStyleType =
	| "solid"
	| "gradient"
	| "accent-gradient"
	| "thermometer";
export type ProgressBarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ProgressBarTokens {
	trackBg: string;
	barBg?: string;
	gradientStart?: string;
	gradientEnd?: string;
	thermometerStart?: string;
	thermometerMid?: string;
	thermometerEnd?: string;
}

export type ProgressBarStyleTokens = Record<
	ProgressBarStyleType,
	ProgressBarTokens
>;
export type ProgressBarTokens_All = Record<
	ColorSchemeVariant,
	ProgressBarStyleTokens
>;

// 🚛️ SWITCH TOKENS
export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchStateTokens {
	trackBackground: string;
	thumbBackground: string;
	thumbBorderColor?: string;
}

export interface SwitchColorSchemeTokens {
	on: SwitchStateTokens;
	off: SwitchStateTokens;
	disabled: SwitchStateTokens;
}

export interface SwitchSizeValues {
	width: string;
	height: string;
	thumbSize: string;
	thumbTranslate: string;
}

export type SwitchColorTokens = Record<
	ColorSchemeVariant,
	SwitchColorSchemeTokens
>;
export type SwitchSizeTokens = Record<SwitchSize, SwitchSizeValues>;

export interface SwitchTokens {
	colors: SwitchColorTokens;
	sizes: SwitchSizeTokens;
}

// 💬 DIALOG TOKENS
export type DialogSize = "sm" | "md" | "lg" | "xl";

export interface DialogPartTokens {
	background: string;
	border?: string;
	shadow?: string;
	borderRadius?: string;
	color?: string;
	backgroundHover?: string;
	colorHover?: string;
	backdropFilter?: string;
}

export interface DialogColorSchemeTokens {
	overlay: DialogPartTokens;
	content: DialogPartTokens;
	header: DialogPartTokens;
	footer: DialogPartTokens;
	close: DialogPartTokens;
}

export type DialogTokens = Record<ColorSchemeVariant, DialogColorSchemeTokens>;

// 🎚️ SLIDER TOKENS
export type SliderStyleType = "solid" | "gradient";
export type SliderSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SliderSizeTokens {
	track: string;
	thumb: string;
}

export interface SliderStyleTokens {
	trackBg: string;
	rangeBg?: string;
	rangeGradientStart?: string;
	rangeGradientEnd?: string;
	thumbBg: string;
	thumbOutlineColor: string;
	thumbShadow: string;
	thumbHaloColor: string;
}

export type SliderTokens = {
	sizes: Record<SliderSize, SliderSizeTokens>;
	styles: Record<
		ColorSchemeVariant,
		Record<SliderStyleType, SliderStyleTokens>
	>;
};

// ➖ DIVIDER TOKENS
export type DividerVariant = "solid" | "gradient";
export type DividerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface DividerTokens {
	background?: string;
	backgroundImage?: string;
	height: string;
	width: string;
	borderRadius: string;
}

export type DividerSizeTokens = Record<
	DividerSize,
	Pick<DividerTokens, "height" | "width" | "borderRadius">
>;
export type DividerStyleTokens = Record<
	DividerVariant,
	Pick<DividerTokens, "background" | "backgroundImage">
>;

export interface AllDividerTokens {
	sizes: DividerSizeTokens;
	styles: DividerStyleTokens;
}

// 🚨 ALERT TOKENS
export type AlertStyleType = "subtle" | "solid" | "outline";

export interface AlertStyleTokens {
	backgroundColor: string;
	borderColor: string;
	textColor: string;
}

export type AlertTokens = Record<
	ColorSchemeVariant,
	Record<AlertStyleType, AlertStyleTokens>
>;

// 🍞 BREADCRUMBS TOKENS
export type BreadcrumbVariant = "default" | "bold";

export interface BreadcrumbStateTokens {
	color: string;
	textDecoration: string;
	cursor: string;
	transition: string;
	fontWeight: string;
}

export interface BreadcrumbTokens {
	default: BreadcrumbStateTokens;
	hover: BreadcrumbStateTokens;
	last: BreadcrumbStateTokens;
}

export type AllBreadcrumbTokens = Record<
	ColorSchemeVariant,
	Record<BreadcrumbVariant, BreadcrumbTokens>
>;

// ☑️ CHECKBOX TOKENS
export type CheckboxSize = "xs" | "sm" | "md" | "lg" | "xl";
export type CheckboxStyleType = "default" | "rounded";

export interface CheckboxSizeTokens {
	box: string;
	checkThickness: number;
	borderRadius: string;
	fontSize: string;
	borderThickness: string;
}

export interface CheckboxStyleTokens {
	background: string;
	border: string;
	checked: {
		background: string;
		border: string;
		check: string;
	};
}

export interface CheckboxTokens {
	sizes: Record<CheckboxSize, CheckboxSizeTokens>;
	styles: Record<
		ColorSchemeVariant,
		Record<CheckboxStyleType, CheckboxStyleTokens>
	>;
}

// 📭 EMPTY STATE TOKENS
export interface EmptyStateTokens {
	container: {
		borderColor: string;
	};
	icon: {
		bg: string;
		color: string;
	};
}

// 🔘 RADIO TOKENS
export type RadioSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface RadioSizeTokens {
	borderThickness: string;
	box: string;
	indicatorSize: string;
	borderRadius: string;
	fontSize: string;
	padding: string;
}

export interface RadioStyleTokens {
	background: string;
	border: string;
	indicator: string;
	text: string;
	hover: {
		background: string;
		border: string;
	};
	focus: {
		outline: string;
	};
	active: {
		background: string;
		border: string;
	};
	checked: {
		background: string;
		border: string;
		indicator: string;
	};
	disabled: {
		background: string;
		border: string;
		indicator: string;
		text: string;
		opacity: number;
	};
}

export interface RadioTokens {
	sizes: Record<RadioSize, RadioSizeTokens>;
	styles: Record<ColorSchemeVariant, RadioStyleTokens>;
}

// 💬 TOOLTIP TOKENS
export type TooltipStyleType = "solid" | "subtle";

export interface TooltipStyleTokens {
	background: string;
	textColor: string;
	borderColor: string;
	shadow: string;
}

export interface TooltipTokens {
	styles: Record<
		ColorSchemeVariant,
		Record<TooltipStyleType, TooltipStyleTokens>
	>;
}

// 📋 DROPDOWN MENU TOKENS
export interface DropdownMenuTokens {
	content: {
		backgroundColor: string;
		borderColor: string;
		boxShadow: string;
	};
	item: {
		backgroundColor: string;
		foregroundColor: string;
		hoverBackgroundColor: string;
		hoverForegroundColor: string;
		disabledForegroundColor: string;
		iconColor: string;
	};
	label: {
		foregroundColor: string;
	};
	separator: {
		backgroundColor: string;
	};
	arrow: {
		fill: string;
	};
}

// 🔄 LOADING LOGO TOKENS
export interface LoadingLogoTokens {
	colors: {
		primary: {
			pure: string;
			text: string;
		};
		secondary: {
			pure: string;
		};
		accent: {
			pure: string;
			pureShade: string;
			text: string;
			contrastText: string;
			textShade: string;
			bg: string;
			bgShade: string;
			pureDark: string;
			textDark: string;
		};
	};
}

// 📝 NOTE TOKENS
export type NoteVariant =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral";
export type NoteSize = "sm" | "md" | "lg";

export interface NoteVariantTokens {
	background: string;
	border: string;
	text: string;
	placeholder: string;
	focusBorder: string;
	focusRing: string;
	hoverBorder: string;
	disabledBackground: string;
	disabledBorder: string;
	disabledText: string;
	readOnlyBackground: string;
	readOnlyBorder: string;
	readOnlyText: string;
	toolbarBackground: string;
	toolbarBorder: string;
	previewBackground: string;
	previewBorder: string;
}

export interface NoteSizeTokens {
	fontSize: string;
	paddingX: string;
	paddingY: string;
	minHeight: string;
}

export interface NoteTokens {
	variants: Record<NoteVariant, NoteVariantTokens>;
	sizes: Record<NoteSize, NoteSizeTokens>;
}

// 📊 NIVO CHART TOKENS
export interface NivoChartThemeTokens {
	fontSize: number;
	textColor: string;
	tooltip: {
		background: string;
		color: string;
		border: string;
		borderRadius: string;
		boxShadow: string;
	};
	grid: {
		stroke: string;
		strokeWidth: number;
	};
	axis: {
		domain: { stroke: string; strokeWidth: number };
		ticks: {
			stroke: string;
			strokeWidth: number;
			fill: string;
			fontSize: number;
		};
		legend: { fill: string; fontSize: number; fontWeight: number };
	};
	legends: {
		fill: string;
		fontSize: number;
	};
}

export interface NivoChartColorTokens {
	// Mapeo de estados de artículos a colores
	pending: string;
	translated: string;
	review_pending: string;
	pending_review: string;
	reconciliation_pending: string;
	validated: string;
	reconciled: string;
	disputed: string;
}

export interface NivoChartTokens {
	theme: NivoChartThemeTokens;
	colors: NivoChartColorTokens;
}

// 💎 CORE: Tokens globales precalculados
export interface DesignTokens {
	button: ButtonTokens;
	input: InputTokens;
	textarea: TextareaTokens;
	select: SelectTokens;
	card: CardTokens;
	badge: BadgeTokens;
	icon: IconTokens;
	text: TextTokens;
	pageBackground: AllPageBackgroundTokens;
	tabs: TabsTokens;
	progressBar: ProgressBarTokens_All;
	switch: SwitchTokens;
	dialog: DialogTokens;
	slider: SliderTokens;
	divider: AllDividerTokens;
	alert: AlertTokens;
	breadcrumbs: AllBreadcrumbTokens;
	checkbox: CheckboxTokens;
	emptyState: EmptyStateTokens;
	radio: RadioTokens;
	tooltip: TooltipTokens;
	dropdownMenu: DropdownMenuTokens;
	loadingLogo: LoadingLogoTokens;
	note: NoteTokens;
	nivoChart: NivoChartTokens;
	datePicker?: Record<ColorSchemeVariant, Record<"sm" | "md" | "lg", unknown>>; // 🔄 TODO: Tipado completo
	fileUpload?: unknown; // 🔄 TODO: Tipado completo
	stepper?: unknown; // 🔄 TODO: Tipado completo
	table?: unknown; // 🔄 TODO: Tipado completo (Fase 3)
	accordion?: unknown; // 🔄 TODO: Tipado completo (Fase 2)
	navbar?: unknown; // 🔄 TODO: Tipado completo (Fase 3)
	sphere?: unknown; // 🔄 TODO: Tipado completo (Fase 3)
	fontSelector?: unknown; // 🔄 TODO: Tipado completo (Fase 3)
}

interface DesignTokensContextType {
	tokens: DesignTokens | null;
	isReady: boolean;
}
//#endregion

//#region [context] - 📦 CONTEXT
const DesignTokensContext = createContext<DesignTokensContextType>({
	tokens: null,
	isReady: false,
});
//#endregion

//#region [generators] - 🏭 FUNCIONES GENERADORAS DE TOKENS
// 🔄 HELPER: Genera tokens de tamaño para botones
function generateButtonSizeTokens(): ButtonTokens["sizes"] {
	return {
		xs: {
			height: "1.75rem",
			padding: "0 0.5rem",
			fontSize: "0.75rem",
			gap: "0.25rem",
			iconSize: "xs",
		},
		sm: {
			height: "2rem",
			padding: "0 0.75rem",
			fontSize: "0.875rem",
			gap: "0.375rem",
			iconSize: "sm",
		},
		md: {
			height: "2.25rem",
			padding: "0 1rem",
			fontSize: "0.875rem",
			gap: "0.5rem",
			iconSize: "md",
		},
		lg: {
			height: "2.75rem",
			padding: "0 1.25rem",
			fontSize: "1rem",
			gap: "0.5rem",
			iconSize: "lg",
		},
		xl: {
			height: "3rem",
			padding: "0 1.5rem",
			fontSize: "1rem",
			gap: "0.75rem",
			iconSize: "lg",
		},
	};
}

// 🔄 HELPER: Genera tokens de estilo para un colorScheme específico
function generateButtonStyleTokens(
	palette: AppColorTokens[ColorSchemeVariant],
	styleType: "solid" | "outline" | "ghost" | "subtle" | "link",
	colorScheme: ColorSchemeVariant,
): ButtonStyleTokens {
	const base: ButtonStyleTokens = {
		background: "transparent",
		color: palette.pure,
		border: "1px solid transparent",
		iconColorShade: "pure",
		hoverBackground: palette.bgShade,
		pressedBackground: tinycolor(palette.pure).darken(12).toHexString(),
		rippleColor: tinycolor(palette.pure).setAlpha(0.3).toRgbString(),
	};

	switch (styleType) {
		case "solid":
			return {
				...base,
				background: palette.pure,
				color: palette.contrastText,
				border: `1px solid ${palette.pure}`,
				iconColorShade: "contrastText",
				hoverBackground: tinycolor(palette.pure).darken(8).toHexString(),
				pressedBackground: tinycolor(palette.pure).darken(12).toHexString(),
				rippleColor: palette.bgShade,
			};
		case "outline":
			return {
				...base,
				border: `1px solid ${palette.pure}`,
			};
		case "ghost":
			// ⚠️ Caso especial: warning necesita color más oscuro para contraste
			if (colorScheme === "warning") {
				return {
					...base,
					color: palette.textShade,
					iconColorShade: "textShade",
				};
			}
			return base;
		case "subtle":
			return {
				...base,
				background: palette.bg,
				color: colorScheme === "warning" ? palette.textShade : palette.pure,
				border: `1px solid ${palette.bg}`,
				iconColorShade: colorScheme === "warning" ? "textShade" : "pure",
			};
		case "link":
			return {
				...base,
				rippleColor: "transparent",
			};
		default:
			return base;
	}
}

// 💎 CORE: Genera TODOS los tokens de botón para TODAS las combinaciones
function generateAllButtonTokens(appTokens: AppColorTokens): ButtonTokens {
	const sizes = generateButtonSizeTokens();

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: Array<"solid" | "outline" | "ghost" | "subtle" | "link"> = [
		"solid",
		"outline",
		"ghost",
		"subtle",
		"link",
	];

	const styles = {} as ButtonTokens["styles"];

	for (const colorScheme of colorSchemes) {
		const palette = appTokens[colorScheme];
		styles[colorScheme] = {} as Record<
			"solid" | "outline" | "ghost" | "subtle" | "link",
			ButtonStyleTokens
		>;

		for (const styleType of styleTypes) {
			styles[colorScheme][styleType] = generateButtonStyleTokens(
				palette,
				styleType,
				colorScheme,
			);
		}
	}

	return { sizes, styles };
}

// 🔄 HELPER: Genera tokens de tamaño para inputs
function generateInputSizeTokens(): InputTokens["sizes"] {
	return {
		sm: {
			height: "2rem",
			fontSize: "0.75rem",
			paddingX: "0.5rem",
			paddingY: "0.25rem",
			iconSize: "xs",
		},
		md: {
			height: "2.5rem",
			fontSize: "0.875rem",
			paddingX: "0.75rem",
			paddingY: "0.5rem",
			iconSize: "sm",
		},
		lg: {
			height: "3rem",
			fontSize: "1rem",
			paddingX: "1rem",
			paddingY: "0.625rem",
			iconSize: "md",
		},
	};
}

// 🔄 HELPER: Genera tokens de estilo para inputs
function generateInputStyleTokens(
	appTokens: AppColorTokens,
	variant:
		| "default"
		| "primary"
		| "secondary"
		| "tertiary"
		| "accent"
		| "neutral",
	mode: Mode,
): InputStyleTokens {
	const { primary, secondary, tertiary, accent, neutral, danger, success } =
		appTokens;

	const baseTextColor = neutral.text;
	const basePlaceholder = tinycolor(baseTextColor).setAlpha(0.6).toRgbString();

	// Estados comunes
	const commonDisabledBg = neutral.bgShade;
	const commonDisabledBorder = tinycolor(neutral.pure)
		.setAlpha(0.4)
		.toRgbString();
	const commonDisabledText = tinycolor(baseTextColor)
		.setAlpha(0.5)
		.toRgbString();
	const commonReadOnlyBg =
		mode === "dark" ?
			tinycolor(neutral.bgShade).lighten(5).setAlpha(0.8).toString()
		:	tinycolor(neutral.contrastText).setAlpha(0.8).toString();
	const commonReadOnlyBorder =
		mode === "dark" ?
			tinycolor(neutral.pure).darken(10).toRgbString()
		:	tinycolor(neutral.pure).lighten(10).toRgbString();
	const editingBg = tinycolor(tertiary.bg)
		.setAlpha(mode === "dark" ? 0.3 : 0.5)
		.toRgbString();

	// Tokens de validación
	const validationTokens = {
		errorBackground: tinycolor(danger.bg)
			.setAlpha(mode === "dark" ? 0.2 : 0.8)
			.toRgbString(),
		errorBorder: danger.pure,
		errorRing: tinycolor(danger.pure).setAlpha(0.25).toRgbString(),
		successBackground: tinycolor(success.bg)
			.setAlpha(mode === "dark" ? 0.2 : 0.8)
			.toRgbString(),
		successBorder: success.pure,
		successRing: tinycolor(success.pure).setAlpha(0.25).toRgbString(),
	};

	// Tokens de estados especiales
	const stateTokens = {
		disabledBackground: commonDisabledBg,
		disabledBorder: commonDisabledBorder,
		disabledText: commonDisabledText,
		editingBackground: editingBg,
		readOnlyBackground: commonReadOnlyBg,
		readOnlyBorder: commonReadOnlyBorder,
		readOnlyText: baseTextColor,
	};

	// Variante por defecto (borde neutral, foco primary)
	if (variant === "default") {
		return {
			background: neutral.bg,
			border: neutral.pure,
			text: baseTextColor,
			placeholder: basePlaceholder,
			iconColor:
				mode === "dark" ?
					tinycolor(neutral.text).setAlpha(0.7).toRgbString()
				:	tinycolor(neutral.pure).setAlpha(0.8).toRgbString(),
			focusBorder: primary.pure,
			focusRing: tinycolor(primary.pure).setAlpha(0.25).toRgbString(),
			hoverBorder:
				mode === "dark" ?
					tinycolor(neutral.pure).lighten(10).toString()
				:	neutral.bgShade,
			...validationTokens,
			...stateTokens,
		};
	}

	// Variantes con color
	const palettes = { primary, secondary, tertiary, accent, neutral };
	const palette = palettes[variant];
	const focusPalette = variant === "neutral" ? primary : palette;

	return {
		background: palette.contrastText,
		border: palette.pure,
		text: baseTextColor,
		placeholder: basePlaceholder,
		iconColor:
			mode === "dark" ?
				tinycolor(palette.text).setAlpha(0.9).toRgbString()
			:	tinycolor(palette.pure).setAlpha(0.9).toRgbString(),
		focusBorder: focusPalette.pure,
		focusRing: tinycolor(focusPalette.pure).setAlpha(0.25).toRgbString(),
		hoverBorder:
			mode === "dark" ?
				tinycolor(palette.pure).lighten(10).toString()
			:	palette.bgShade,
		...validationTokens,
		...stateTokens,
	};
}

// 💎 CORE: Genera TODOS los tokens de input
function generateAllInputTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): InputTokens {
	const sizes = generateInputSizeTokens();
	const variants: Array<
		"default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral"
	> = ["default", "primary", "secondary", "tertiary", "accent", "neutral"];

	const styles = {} as InputTokens["styles"];
	for (const variant of variants) {
		styles[variant] = generateInputStyleTokens(appTokens, variant, mode);
	}

	return { sizes, styles };
}

// 🔄 HELPER: Genera tokens de tamaño para textareas
function generateTextareaSizeTokens(): TextareaTokens["sizes"] {
	return {
		sm: {
			minHeight: "4.5rem",
			fontSize: "0.75rem",
			paddingX: "0.5rem",
			paddingY: "0.375rem",
		},
		md: {
			minHeight: "5rem",
			fontSize: "0.875rem",
			paddingX: "0.75rem",
			paddingY: "0.5rem",
		},
		lg: {
			minHeight: "6.25rem",
			fontSize: "1rem",
			paddingX: "1rem",
			paddingY: "0.625rem",
		},
	};
}

// 💎 CORE: Genera TODOS los tokens de textarea (reutiliza lógica de input para estilos)
function generateAllTextareaTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): TextareaTokens {
	const sizes = generateTextareaSizeTokens();
	const variants: Array<
		"default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral"
	> = ["default", "primary", "secondary", "tertiary", "accent", "neutral"];

	const styles = {} as TextareaTokens["styles"];
	for (const variant of variants) {
		// Reutiliza la misma lógica de estilos que Input
		styles[variant] = generateInputStyleTokens(appTokens, variant, mode);
	}

	return { sizes, styles };
}

// 🔄 HELPER: Genera tokens de tamaño para selects
function generateSelectSizeTokens(): SelectTokens["sizes"] {
	return {
		sm: {
			height: "2rem",
			fontSize: "0.75rem",
			paddingX: "0.5rem",
			paddingY: "0.25rem",
			optionPaddingX: "0.5rem",
			optionPaddingY: "0.375rem",
			dropdownMaxHeight: "12rem",
		},
		md: {
			height: "2.5rem",
			fontSize: "0.875rem",
			paddingX: "0.75rem",
			paddingY: "0.5rem",
			optionPaddingX: "0.75rem",
			optionPaddingY: "0.5rem",
			dropdownMaxHeight: "15rem",
		},
		lg: {
			height: "3rem",
			fontSize: "1rem",
			paddingX: "1rem",
			paddingY: "0.625rem",
			optionPaddingX: "1rem",
			optionPaddingY: "0.625rem",
			dropdownMaxHeight: "18rem",
		},
	};
}

// 🔄 HELPER: Genera tokens de estilo para selects (extiende Input con tokens de dropdown)
function generateSelectStyleTokens(
	appTokens: AppColorTokens,
	variant:
		| "default"
		| "primary"
		| "secondary"
		| "tertiary"
		| "accent"
		| "neutral",
	mode: Mode,
): SelectStyleTokens {
	// Reutiliza tokens base de Input
	const baseInputTokens = generateInputStyleTokens(appTokens, variant, mode);
	const { primary, neutral, white } = appTokens;

	// Tokens adicionales para dropdown
	const dropdownTokens = {
		dropdownBackground: mode === "dark" ? neutral.bgShade : white.pure,
		dropdownBorder:
			mode === "dark" ?
				tinycolor(neutral.pure).lighten(10).toString()
			:	neutral.pure,
		optionText: neutral.text,
		optionHoverBackground:
			mode === "dark" ?
				tinycolor(neutral.bgShade).lighten(5).toString()
			:	tinycolor(neutral.bg).darken(3).toString(),
		optionSelectedBackground: tinycolor(primary.pure)
			.setAlpha(0.15)
			.toRgbString(),
		optionSelectedText: primary.text,
		chevronButtonBackground: tinycolor(neutral.pure)
			.setAlpha(0.1)
			.toRgbString(),
	};

	return { ...baseInputTokens, ...dropdownTokens };
}

// 💎 CORE: Genera TODOS los tokens de select
function generateAllSelectTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): SelectTokens {
	const sizes = generateSelectSizeTokens();
	const variants: Array<
		"default" | "primary" | "secondary" | "tertiary" | "accent" | "neutral"
	> = ["default", "primary", "secondary", "tertiary", "accent", "neutral"];

	const styles = {} as SelectTokens["styles"];
	for (const variant of variants) {
		styles[variant] = generateSelectStyleTokens(appTokens, variant, mode);
	}

	return { sizes, styles };
}

// 🔄 HELPER: Crea gradiente de tres tonos para cards
function createCardGradient(
	c1: string,
	c2: string,
	c3: string,
	angle = 135,
): string {
	return `linear-gradient(${angle}deg, ${c1} 10%, ${c2} 80%, ${c3} 100%)`;
}

// 🔄 HELPER: Genera tokens de estilo para cards por variante y styleType
function generateCardStyleTokens(
	appTokens: AppColorTokens,
	variant: CardVariant,
	styleType: CardStyleType,
	mode: Mode,
): CardStyleTokens {
	const { neutral, white, primary } = appTokens;

	// Obtener tokens del color scheme (default mapea a primary)
	const schemeKey = variant === "default" ? "primary" : variant;
	const colorTokens =
		appTokens[schemeKey as keyof AppColorTokens] || appTokens.primary;

	// Colores base según styleType y mode
	let background = "transparent";
	let backgroundGradient = "none";
	let text = neutral.text;

	if (styleType === "filled") {
		if (mode === "light") {
			const base = colorTokens.bg;
			const mid = colorTokens.bgShade;
			const end = tinycolor
				.mix(colorTokens.bgShade, colorTokens.pure, 20)
				.toHexString();
			backgroundGradient = createCardGradient(base, mid, end);
			background = colorTokens.bg;
			text = colorTokens.text;
		} else {
			backgroundGradient = createCardGradient(
				colorTokens.bgShade,
				colorTokens.bg,
				colorTokens.bg,
			);
			background = colorTokens.bgShade;
			text = colorTokens.text;
		}
	} else if (styleType === "subtle") {
		if (mode === "light") {
			const base = white.pure;
			const mid = colorTokens.bg;
			const end = tinycolor
				.mix(colorTokens.bg, colorTokens.bgShade, 30)
				.toHexString();
			backgroundGradient = createCardGradient(base, mid, end);
			background = tinycolor.mix(white.pure, colorTokens.bg, 30).toHexString();
		} else {
			const base = neutral.bgShade;
			const mid = tinycolor
				.mix(neutral.bgShade, colorTokens.bgShade, 30)
				.toHexString();
			backgroundGradient = createCardGradient(base, mid, mid);
			background = base;
		}
		text = neutral.text;
	} else {
		// transparent
		background = "transparent";
		backgroundGradient = "none";
		text = neutral.text;
	}

	// Bordes
	const border = tinycolor(colorTokens.pure).setAlpha(0.2).toRgbString();
	const borderHover = tinycolor(colorTokens.pure).setAlpha(0.4).toRgbString();
	const borderSelected = colorTokens.pure;

	// Efectos
	const focusRing = tinycolor(colorTokens.pure).setAlpha(0.25).toRgbString();
	const hoverOverlay =
		mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
	const selectedOverlay = tinycolor(colorTokens.pure)
		.setAlpha(0.08)
		.toRgbString();

	// Acentos
	const accentGradient = `linear-gradient(135deg, ${colorTokens.pure} 0%, ${colorTokens.bgShade} 100%)`;
	const accentDuotone = `linear-gradient(135deg, ${primary.pure} 0%, ${colorTokens.pure} 100%)`;

	// Estados
	const disabledOverlay =
		mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";
	const loadingOverlay =
		mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)";

	// Checkbox
	const checkboxBorder = colorTokens.pure;
	const checkboxIcon = colorTokens.pure;
	const checkboxFocusRing = tinycolor(colorTokens.pure)
		.setAlpha(0.4)
		.toRgbString();

	return {
		background,
		backgroundGradient,
		text,
		border,
		borderHover,
		borderSelected,
		focusRing,
		hoverOverlay,
		selectedOverlay,
		accentGradient,
		accentDuotone,
		disabledOverlay,
		loadingOverlay,
		checkboxBorder,
		checkboxIcon,
		checkboxFocusRing,
	};
}

// 💎 CORE: Genera TODOS los tokens de card
function generateAllCardTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): CardTokens {
	const variants: CardVariant[] = [
		"default",
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: CardStyleType[] = ["filled", "subtle", "transparent"];

	const styles = {} as CardTokens["styles"];
	for (const variant of variants) {
		styles[variant] = {} as Record<CardStyleType, CardStyleTokens>;
		for (const styleType of styleTypes) {
			styles[variant][styleType] = generateCardStyleTokens(
				appTokens,
				variant,
				styleType,
				mode,
			);
		}
	}

	const shadows: CardTokens["shadows"] = {
		none: "shadow-none",
		sm: "shadow-sm",
		md: "shadow-md",
		lg: "shadow-lg",
		xl: "shadow-xl",
	};

	const accents: CardTokens["accents"] = {
		height: {
			none: "0",
			top: "4px",
			left: "100%",
			right: "100%",
			bottom: "4px",
		},
		width: {
			none: "0",
			top: "100%",
			left: "4px",
			right: "4px",
			bottom: "100%",
		},
	};

	return { styles, shadows, accents };
}

// 🔄 HELPER: Genera tokens de tamaño para badges
function generateBadgeSizeTokens(): BadgeTokens["sizes"] {
	return {
		"2xs": {
			height: "1rem",
			padding: "0 0.375rem",
			fontSize: "0.625rem",
			gap: "0.25rem",
			iconSize: "xs",
		},
		xs: {
			height: "1.25rem",
			padding: "0 0.5rem",
			fontSize: "0.6875rem",
			gap: "0.25rem",
			iconSize: "xs",
		},
		sm: {
			height: "1.5rem",
			padding: "0 0.625rem",
			fontSize: "0.75rem",
			gap: "0.375rem",
			iconSize: "sm",
		},
		md: {
			height: "1.75rem",
			padding: "0 0.75rem",
			fontSize: "0.875rem",
			gap: "0.375rem",
			iconSize: "sm",
		},
		lg: {
			height: "2rem",
			padding: "0 1rem",
			fontSize: "1rem",
			gap: "0.5rem",
			iconSize: "md",
		},
	};
}

// 🔄 HELPER: Genera tokens de estilo para badges
function generateBadgeStyleTokens(
	palette: AppColorTokens[ColorSchemeVariant],
	styleType: "solid" | "subtle" | "outline",
): BadgeStyleTokens {
	const baseColor = palette.pure;
	const textColor = palette.contrastText;
	const bgColor = palette.bg;

	switch (styleType) {
		case "solid":
			return {
				background: baseColor,
				color: textColor,
				border: `1px solid ${baseColor}`,
				iconColorShade: "contrastText",
			};

		case "subtle":
			return {
				background: bgColor,
				color: palette.text,
				border: `1px solid transparent`,
				iconColorShade: "text",
			};

		case "outline":
			return {
				background: "transparent",
				color: palette.text,
				border: `1px solid ${baseColor}`,
				iconColorShade: "pure",
			};
	}
}

// 💎 CORE: Genera TODOS los tokens de badge para TODAS las combinaciones
function generateAllBadgeTokens(appTokens: AppColorTokens): BadgeTokens {
	const sizes = generateBadgeSizeTokens();

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: Array<"solid" | "subtle" | "outline"> = [
		"solid",
		"subtle",
		"outline",
	];

	const styles = {} as BadgeTokens["styles"];

	for (const colorScheme of colorSchemes) {
		const palette = appTokens[colorScheme];
		styles[colorScheme] = {} as Record<
			"solid" | "subtle" | "outline",
			BadgeStyleTokens
		>;

		for (const styleType of styleTypes) {
			styles[colorScheme][styleType] = generateBadgeStyleTokens(
				palette,
				styleType,
			);
		}
	}

	return { sizes, styles };
}

// 🔄 HELPER: Genera tokens de tamaño para iconos
function generateIconSizeTokens(): IconTokens["sizes"] {
	return {
		"4xs": "0.625rem", // 10px
		"3xs": "0.75rem", // 12px
		"2xs": "0.875rem", // 14px
		xs: "1rem", // 16px
		sm: "1.125rem", // 18px
		base: "1.25rem", // 20px
		md: "1.5rem", // 24px
		lg: "1.75rem", // 28px
		xl: "2rem", // 32px
		"2xl": "2.5rem", // 40px
		"3xl": "3rem", // 48px
		"4xl": "3.5rem", // 56px
		"5xl": "4rem", // 64px
	};
}

// 🔄 HELPER: Genera tokens de estilo para iconos
function generateIconStyleTokens(
	palette: AppColorTokens[ColorSchemeVariant],
	styleType: IconStyleType,
	colorShade: IconColorShade,
	mode: Mode,
): IconStyleTokens {
	const isDark = mode === "dark";

	let effectiveColor: string;
	if (colorShade === "subtle") {
		effectiveColor = tinycolor
			.mix(palette.text, isDark ? "#A0A0A0" : "#888888", 70)
			.toHexString();
	} else {
		effectiveColor = palette[colorShade] || palette.pure;
	}

	switch (styleType) {
		case "solid":
			return { fill: effectiveColor, stroke: "none", defs: "" };

		case "outline":
			return { fill: "none", stroke: effectiveColor, defs: "" };

		case "outlineGradient": {
			const gradientId = `icon-og-${palette.pure.replace("#", "")}`;
			const startColor = palette.bgShade;
			const endColor = palette.pure;
			const defs = `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${startColor}" /><stop offset="100%" stop-color="${endColor}" /></linearGradient>`;
			return { fill: "none", stroke: `url(#${gradientId})`, defs };
		}

		case "inverseStroke": {
			const fillId = `icon-is-fill-${palette.pure.replace("#", "")}`;
			const strokeId = `icon-is-stroke-${palette.pure.replace("#", "")}`;
			const strokeStart = palette.bgShade;
			const strokeEnd = palette.pure;
			const fillStart = strokeEnd;
			const fillEnd = strokeStart;
			const defs = `<linearGradient id="${fillId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${fillStart}" /><stop offset="100%" stop-color="${fillEnd}" /></linearGradient><linearGradient id="${strokeId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${strokeStart}" /><stop offset="100%" stop-color="${strokeEnd}" /></linearGradient>`;
			return { fill: `url(#${fillId})`, stroke: `url(#${strokeId})`, defs };
		}
	}
}

// 💎 CORE: Genera TODOS los tokens de icono para TODAS las combinaciones
function generateAllIconTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): IconTokens {
	const sizes = generateIconSizeTokens();

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: IconStyleType[] = [
		"solid",
		"outline",
		"outlineGradient",
		"inverseStroke",
	];
	const colorShades: IconColorShade[] = [
		"pure",
		"text",
		"textShade",
		"bg",
		"contrastText",
		"subtle",
	];

	const styles = {} as IconTokens["styles"];

	for (const colorScheme of colorSchemes) {
		const palette = appTokens[colorScheme];
		styles[colorScheme] = {} as Record<
			IconStyleType,
			Record<IconColorShade, IconStyleTokens>
		>;

		for (const styleType of styleTypes) {
			styles[colorScheme][styleType] = {} as Record<
				IconColorShade,
				IconStyleTokens
			>;

			for (const colorShade of colorShades) {
				styles[colorScheme][styleType][colorShade] = generateIconStyleTokens(
					palette,
					styleType,
					colorShade,
					mode,
				);
			}
		}
	}

	return { sizes, styles };
}

// 💎 CORE: Genera TODOS los tokens de PageBackground para TODAS las variantes
function generateAllPageBackgroundTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): AllPageBackgroundTokens {
	const isDark = mode === "dark";
	const baseBackgroundColor = appTokens.neutral.bg;
	const themePrimaryPure = appTokens.primary.pure;
	const globalAccentPure = appTokens.accent.pure;

	const touchOpacityHex = isDark ? "0A" : "10";
	const defaultOpacityHex = isDark ? "0F" : "1A";
	const subtleOpacityRadial = isDark ? "15" : "20";
	const primaryPureTintOpacityGradient = isDark ? "1A" : "26";

	return {
		gradient: {
			background: baseBackgroundColor,
			backgroundImage: `radial-gradient(circle at top right, ${themePrimaryPure}${primaryPureTintOpacityGradient}, transparent 25%), radial-gradient(circle at bottom left, ${appTokens.accent.bg}, transparent 15%)`,
		},
		subtle: {
			background: baseBackgroundColor,
			backgroundImage: `radial-gradient(circle at top right, ${themePrimaryPure}${subtleOpacityRadial}, transparent 70%), radial-gradient(circle at bottom left, ${globalAccentPure}${subtleOpacityRadial}, transparent 70%)`,
		},
		minimal: {
			background: baseBackgroundColor,
			backgroundImage: `linear-gradient(to bottom, ${themePrimaryPure}${touchOpacityHex} 0%, transparent 40%, transparent 60%, ${globalAccentPure}${touchOpacityHex} 100%)`,
		},
		default: {
			background: baseBackgroundColor,
			backgroundImage: `linear-gradient(to top, ${themePrimaryPure}${defaultOpacityHex} 0%, transparent 50%), linear-gradient(to bottom, ${globalAccentPure}${defaultOpacityHex} 0%, transparent 50%)`,
		},
	};
}

// 💎 CORE: Genera TODOS los tokens de Tabs para TODAS las combinaciones
function generateAllTabsTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): TabsTokens {
	const isDark = mode === "dark";
	const borderWidth = "2px";

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	const styleTypes: TabsStyleType[] = ["line", "enclosed"];
	const sizes: TabsSize[] = ["sm", "md", "lg"];

	const fontMap: Record<TabsSize, string> = {
		sm: "0.875rem",
		md: "0.875rem",
		lg: "1rem",
	};
	const paddingMap: Record<TabsSize, string> = {
		sm: "0.4rem 0.8rem",
		md: "0.5rem 1rem",
		lg: "0.6rem 1.2rem",
	};

	const allTokens = {} as TabsTokens;

	for (const colorScheme of colorSchemes) {
		const palette = appTokens[colorScheme];
		allTokens[colorScheme] = {} as TabsColorSchemeTokens;

		for (const styleType of styleTypes) {
			allTokens[colorScheme][styleType] = {} as TabsSizeTokens;

			for (const size of sizes) {
				const listTokens: TabsListTokens = {
					borderBottomColor:
						styleType === "line" ? "transparent" : appTokens.neutral.bgShade,
					borderBottomWidth: borderWidth,
				};

				// Base trigger tokens
				const baseTrigger: TabsTriggerTokens = {
					background: "transparent",
					color: appTokens.neutral.text,
					borderBottomColor: "transparent",
					borderBottomWidth: borderWidth,
					borderTopColor: "transparent",
					borderLeftColor: "transparent",
					borderRightColor: "transparent",
					fontWeight: "500",
					fontSize: fontMap[size],
					padding: paddingMap[size],
					cursor: "pointer",
					opacity: 1,
					marginBottom: `-${borderWidth}`,
				};

				// Inactive state
				const inactive: TabsTriggerTokens = { ...baseTrigger };

				// Hover state
				const hover: TabsTriggerTokens = {
					...baseTrigger,
					background: tinycolor(palette.pure)
						.setAlpha(isDark ? 0.1 : 0.05)
						.toRgbString(),
					color: tinycolor(palette.pure)
						.darken(isDark ? 0 : 10)
						.toHexString(),
				};

				// Active state
				const active: TabsTriggerTokens = {
					...baseTrigger,
					color: palette.pure,
					fontWeight: "700",
					borderBottomColor:
						styleType === "line" ? palette.pure : "transparent",
				};

				if (styleType === "enclosed") {
					active.background =
						isDark ?
							tinycolor(appTokens.neutral.bg).lighten(5).toHexString()
						:	appTokens.white.pure;
					active.borderTopColor = appTokens.neutral.bgShade;
					active.borderLeftColor = appTokens.neutral.bgShade;
					active.borderRightColor = appTokens.neutral.bgShade;
				}

				// Disabled state
				const disabled: TabsTriggerTokens = {
					...baseTrigger,
					opacity: 0.6,
					cursor: "not-allowed",
					color: tinycolor(appTokens.neutral.text).setAlpha(0.6).toRgbString(),
					background: "transparent",
				};

				allTokens[colorScheme][styleType][size] = {
					list: listTokens,
					trigger: {
						active,
						inactive,
						hover,
						disabled,
					},
				};
			}
		}
	}

	return allTokens;
}

// 💎 CORE: Genera TODOS los tokens de texto para TODAS las combinaciones
function generateAllTextTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): TextTokens {
	const isDark = mode === "dark";
	const textColors = {} as Record<ColorSchemeVariant, TextColorTokens>;
	const textGradients = {} as Record<ColorSchemeVariant, string>;

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	for (const colorScheme of colorSchemes) {
		const palette = appTokens[colorScheme];

		// 🎨 Colores de texto derivados
		const subtleColor = tinycolor
			.mix(palette.text, isDark ? "#A0A0A0" : "#888888", 70)
			.toHexString();

		textColors[colorScheme] = {
			pure: palette.pure,
			text: palette.text,
			contrastText: palette.contrastText,
			textShade: palette.textShade,
			subtle: subtleColor,
		};

		// 🌈 Gradientes de texto (para headings y efectos especiales)
		const gradientStart = palette.pure;
		const gradientMiddle = tinycolor
			.mix(palette.pure, palette.text, 70)
			.toHexString();
		const gradientEnd = palette.textShade;

		textGradients[colorScheme] =
			`linear-gradient(to right, ${gradientStart} 40%, ${gradientMiddle} 60%, ${gradientEnd} 100%)`;
	}

	return { colors: textColors, gradients: textGradients };
}

// 💎 CORE: Genera TODOS los tokens de ProgressBar para TODAS las combinaciones
function generateAllProgressBarTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): ProgressBarTokens_All {
	const isDark = mode === "dark";
	const allTokens = {} as ProgressBarTokens_All;

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	const styleTypes: ProgressBarStyleType[] = [
		"solid",
		"gradient",
		"accent-gradient",
		"thermometer",
	];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];
		allTokens[colorScheme] = {} as ProgressBarStyleTokens;

		for (const styleType of styleTypes) {
			const tokens: ProgressBarTokens = {
				trackBg: colorSet.bgShade,
			};

			switch (styleType) {
				case "solid":
					tokens.barBg = colorSet.pure;
					break;

				case "gradient":
					let endGradientColor = appTokens.secondary.pure;
					if (colorScheme === "secondary")
						endGradientColor = appTokens.tertiary.pure;
					if (colorScheme === "tertiary")
						endGradientColor = appTokens.primary.pure;
					tokens.gradientStart = colorSet.pure;
					tokens.gradientEnd = endGradientColor;
					break;

				case "accent-gradient":
					tokens.gradientStart = colorSet.pure;
					tokens.gradientEnd = appTokens.accent.pure;
					break;

				case "thermometer":
					tokens.thermometerStart = appTokens.danger.pure;
					tokens.thermometerMid = appTokens.warning.pure;
					tokens.thermometerEnd = appTokens.success.pure;
					break;
			}

			// Caso especial para neutral
			if (colorScheme === "neutral") {
				tokens.trackBg = isDark ? "#1f2937" : "#e5e7eb";
				if (styleType === "solid") {
					tokens.barBg = isDark ? "#9ca3af" : "#4b5563";
				} else if (
					styleType === "gradient" ||
					styleType === "accent-gradient"
				) {
					tokens.gradientStart = isDark ? "#6b7280" : "#6b7280";
					tokens.gradientEnd = isDark ? "#d1d5db" : "#374151";
				}
			}

			allTokens[colorScheme][styleType] = tokens;
		}
	}

	return allTokens;
}

// 💎 CORE: Genera TODOS los tokens de Dialog para TODAS las combinaciones
function generateAllDialogTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): DialogTokens {
	const isDark = mode === "dark";
	const tokens = {} as DialogTokens;

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];

		tokens[colorScheme] = {
			overlay: {
				background: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.7)",
				backdropFilter: "blur(2px)",
			},
			content: {
				background: isDark ? colorSet.bgShade : colorSet.bg,
				border: `1px solid ${isDark ? colorSet.bgShade : colorSet.bgShade}`,
				shadow:
					isDark ?
						"0 25px 50px -12px rgba(0, 0, 0, 0.6)"
					:	"0 25px 50px -12px rgba(0, 0, 0, 0.25)",
				borderRadius: "12px",
			},
			header: {
				background: isDark ? colorSet.bg : colorSet.bgShade,
				border: `1px solid ${isDark ? colorSet.bgShade : colorSet.bg}`,
			},
			footer: {
				background: isDark ? colorSet.bg : colorSet.bgShade,
				border: `1px solid ${isDark ? colorSet.bgShade : colorSet.bg}`,
			},
			close: {
				background: "transparent",
				color: colorSet.text,
				backgroundHover: colorSet.bgShade,
				colorHover: colorSet.pure,
			},
		};
	}

	return tokens;
}

// 💎 CORE: Genera TODOS los tokens de Switch para TODAS las combinaciones
function generateAllSwitchTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): SwitchTokens {
	const isDark = mode === "dark";

	// Tamaños del switch
	const sizes: SwitchSizeTokens = {
		sm: {
			height: "20px",
			width: "36px",
			thumbSize: "16px",
			thumbTranslate: "16px",
		},
		md: {
			height: "24px",
			width: "44px",
			thumbSize: "20px",
			thumbTranslate: "20px",
		},
		lg: {
			height: "32px",
			width: "60px",
			thumbSize: "28px",
			thumbTranslate: "28px",
		},
	};

	// Colores del switch
	const colors = {} as SwitchColorTokens;
	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	const neutralTokens = appTokens.neutral;
	const primaryTokens = appTokens.primary;

	for (const scheme of colorSchemes) {
		const colorSet = appTokens[scheme];

		colors[scheme] = {
			on: {
				trackBackground: scheme === "neutral" ? primaryTokens.bg : colorSet.bg,
				thumbBackground:
					scheme === "neutral" ? primaryTokens.text : colorSet.text,
			},
			off: {
				trackBackground:
					isDark ?
						tinycolor(neutralTokens.bg).darken(10).toRgbString()
					:	tinycolor(neutralTokens.bg).darken(10).toRgbString(),
				thumbBackground:
					isDark ?
						tinycolor(neutralTokens.bg).lighten(5).toRgbString()
					:	neutralTokens.bg,
				thumbBorderColor: tinycolor(neutralTokens.bg).darken(10).toRgbString(),
			},
			disabled: {
				trackBackground: tinycolor(neutralTokens.bg)
					.setAlpha(0.15)
					.toRgbString(),
				thumbBackground: tinycolor(neutralTokens.text)
					.setAlpha(0.4)
					.toRgbString(),
			},
		};
	}

	return { colors, sizes };
}

// 💎 CORE: Genera TODOS los tokens de Slider para TODAS las combinaciones
function generateAllSliderTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): SliderTokens {
	const isDark = mode === "dark";

	// Tamaños del slider
	const sizes: SliderTokens["sizes"] = {
		xs: { track: "h-1", thumb: "h-4 w-4" },
		sm: { track: "h-1.5", thumb: "h-5 w-5" },
		md: { track: "h-2", thumb: "h-6 w-6" },
		lg: { track: "h-2.5", thumb: "h-7 w-7" },
		xl: { track: "h-3", thumb: "h-8 w-8" },
	};

	// Estilos del slider
	const styles = {} as SliderTokens["styles"];
	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: SliderStyleType[] = ["solid", "gradient"];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];
		styles[colorScheme] = {} as Record<SliderStyleType, SliderStyleTokens>;

		for (const styleType of styleTypes) {
			const tokens: SliderStyleTokens = {
				trackBg: colorSet.bgShade,
				thumbBg: isDark ? appTokens.neutral.contrastText : appTokens.white.pure,
				thumbOutlineColor: colorSet.pure,
				thumbShadow:
					isDark ? "0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.2)",
				thumbHaloColor: colorSet.bgShade,
			};

			if (styleType === "solid") {
				tokens.rangeBg = colorSet.pure;
			} else {
				let endGradientColor = appTokens.secondary.pure;
				if (colorScheme === "secondary")
					endGradientColor = appTokens.tertiary.pure;
				if (colorScheme === "tertiary")
					endGradientColor = appTokens.primary.pure;

				tokens.rangeGradientStart = colorSet.pure;
				tokens.rangeGradientEnd = endGradientColor;
			}

			styles[colorScheme][styleType] = tokens;
		}
	}

	return { sizes, styles };
}

// 💎 CORE: Genera TODOS los tokens de Divider
function generateAllDividerTokens(appTokens: AppColorTokens): AllDividerTokens {
	const sizes: DividerSizeTokens = {
		xs: { height: "1px", width: "2rem", borderRadius: "2px" },
		sm: { height: "2px", width: "3rem", borderRadius: "4px" },
		md: { height: "2px", width: "4rem", borderRadius: "4px" },
		lg: { height: "3px", width: "5rem", borderRadius: "6px" },
		xl: { height: "4px", width: "6rem", borderRadius: "8px" },
	};

	const styles: DividerStyleTokens = {
		solid: {
			background: appTokens.primary.pure,
		},
		gradient: {
			backgroundImage: `linear-gradient(90deg, ${appTokens.primary.pure}, ${appTokens.accent.pure})`,
		},
	};

	return { sizes, styles };
}

// 💎 CORE: Genera TODOS los tokens de Alert para TODAS las combinaciones
function generateAllAlertTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): AlertTokens {
	const isDark = mode === "dark";
	const tokens = {} as AlertTokens;

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: AlertStyleType[] = ["subtle", "solid", "outline"];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];
		tokens[colorScheme] = {} as Record<AlertStyleType, AlertStyleTokens>;

		for (const styleType of styleTypes) {
			switch (styleType) {
				case "subtle":
					tokens[colorScheme][styleType] = {
						backgroundColor: tinycolor(colorSet.bg)
							.setAlpha(isDark ? 0.3 : 0.8)
							.toRgbString(),
						borderColor: tinycolor(colorSet.pure).setAlpha(0.3).toRgbString(),
						textColor: colorSet.text,
					};
					break;
				case "solid":
					tokens[colorScheme][styleType] = {
						backgroundColor: colorSet.pure,
						borderColor: colorSet.pure,
						textColor: colorSet.contrastText,
					};
					break;
				case "outline":
					tokens[colorScheme][styleType] = {
						backgroundColor: "transparent",
						borderColor: colorSet.pure,
						textColor: colorSet.text,
					};
					break;
			}
		}
	}

	return tokens;
}

// 💎 CORE: Genera TODOS los tokens de Breadcrumbs para TODAS las combinaciones
function generateAllBreadcrumbTokens(
	appTokens: AppColorTokens,
	_mode: Mode,
): AllBreadcrumbTokens {
	void _mode; // Parámetro requerido por consistencia de API pero no usado actualmente
	const tokens = {} as AllBreadcrumbTokens;

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const variants: BreadcrumbVariant[] = ["default", "bold"];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];
		tokens[colorScheme] = {} as Record<BreadcrumbVariant, BreadcrumbTokens>;

		for (const variant of variants) {
			const fontWeight = variant === "bold" ? "600" : "400";
			const lastFontWeight = variant === "bold" ? "700" : "500";

			tokens[colorScheme][variant] = {
				default: {
					color: colorSet.text,
					textDecoration: "none",
					cursor: "pointer",
					transition: "color 0.2s ease",
					fontWeight,
				},
				hover: {
					color: colorSet.pure,
					textDecoration: "underline",
					cursor: "pointer",
					transition: "color 0.2s ease",
					fontWeight,
				},
				last: {
					color: colorSet.pure,
					textDecoration: "none",
					cursor: "default",
					transition: "color 0.2s ease",
					fontWeight: lastFontWeight,
				},
			};
		}
	}

	return tokens;
}

// 💎 CORE: Genera TODOS los tokens de Checkbox para TODAS las combinaciones
function generateAllCheckboxTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): CheckboxTokens {
	const isDark = mode === "dark";

	// Tamaños del checkbox
	const sizes: CheckboxTokens["sizes"] = {
		xs: {
			box: "14px",
			checkThickness: 2,
			borderRadius: "3px",
			fontSize: "0.75rem",
			borderThickness: "1.5px",
		},
		sm: {
			box: "16px",
			checkThickness: 2.5,
			borderRadius: "4px",
			fontSize: "0.875rem",
			borderThickness: "1.5px",
		},
		md: {
			box: "20px",
			checkThickness: 3,
			borderRadius: "4px",
			fontSize: "0.875rem",
			borderThickness: "1.5px",
		},
		lg: {
			box: "24px",
			checkThickness: 3.5,
			borderRadius: "5px",
			fontSize: "1rem",
			borderThickness: "2px",
		},
		xl: {
			box: "28px",
			checkThickness: 4,
			borderRadius: "6px",
			fontSize: "1.125rem",
			borderThickness: "2px",
		},
	};

	// Estilos del checkbox
	const styles = {} as CheckboxTokens["styles"];
	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];
	const styleTypes: CheckboxStyleType[] = ["default", "rounded"];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];
		styles[colorScheme] = {} as Record<CheckboxStyleType, CheckboxStyleTokens>;

		for (const styleType of styleTypes) {
			// borderRadius calculado pero no usado directamente
			void (styleType === "rounded" ? "50%" : "4px");

			styles[colorScheme][styleType] = {
				background:
					isDark ?
						tinycolor(appTokens.neutral.bg).lighten(5).toHexString()
					:	appTokens.white.pure,
				border: tinycolor(colorSet.pure).setAlpha(0.4).toRgbString(),
				checked: {
					background: colorSet.pure,
					border: colorSet.pure,
					check: colorSet.contrastText,
				},
			};
		}
	}

	return { sizes, styles };
}

// 💎 CORE: Genera tokens de EmptyState
function generateAllEmptyStateTokens(
	appTokens: AppColorTokens,
): EmptyStateTokens {
	const { neutral } = appTokens;

	return {
		container: {
			borderColor: neutral.bgShade,
		},
		icon: {
			bg: neutral.bg,
			color: neutral.text,
		},
	};
}

// 💎 CORE: Genera TODOS los tokens de Radio para TODAS las combinaciones
function generateAllRadioTokens(appTokens: AppColorTokens): RadioTokens {
	// Tamaños del radio
	const sizes: RadioTokens["sizes"] = {
		xs: {
			borderThickness: "1px",
			box: "16px",
			indicatorSize: "8px",
			borderRadius: "50%",
			fontSize: "0.75rem",
			padding: "0.25rem",
		},
		sm: {
			borderThickness: "1.5px",
			box: "18px",
			indicatorSize: "9px",
			borderRadius: "50%",
			fontSize: "0.875rem",
			padding: "0.375rem",
		},
		md: {
			borderThickness: "2px",
			box: "20px",
			indicatorSize: "10px",
			borderRadius: "50%",
			fontSize: "1rem",
			padding: "0.5rem",
		},
		lg: {
			borderThickness: "2.5px",
			box: "24px",
			indicatorSize: "12px",
			borderRadius: "50%",
			fontSize: "1.125rem",
			padding: "0.625rem",
		},
		xl: {
			borderThickness: "3px",
			box: "28px",
			indicatorSize: "14px",
			borderRadius: "50%",
			fontSize: "1.25rem",
			padding: "0.75rem",
		},
	};

	// Estilos del radio
	const styles = {} as RadioTokens["styles"];
	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	for (const colorScheme of colorSchemes) {
		const colorSet = appTokens[colorScheme];
		const neutralSet = appTokens.neutral;

		styles[colorScheme] = {
			background: "#ffffff",
			border: neutralSet.bgShade,
			indicator: colorSet.pure,
			text: neutralSet.text,
			hover: {
				background: neutralSet.bg,
				border: colorSet.pure,
			},
			focus: {
				outline: tinycolor(colorSet.pure).setAlpha(0.4).toRgbString(),
			},
			active: {
				background: neutralSet.bgShade,
				border: colorSet.pure,
			},
			checked: {
				background: "#ffffff",
				border: colorSet.pure,
				indicator: colorSet.pure,
			},
			disabled: {
				background: tinycolor(neutralSet.bg).setAlpha(0.3).toRgbString(),
				border: tinycolor(neutralSet.bgShade).setAlpha(0.5).toRgbString(),
				indicator: tinycolor(neutralSet.text).setAlpha(0.5).toRgbString(),
				text: tinycolor(neutralSet.text).setAlpha(0.5).toRgbString(),
				opacity: 0.6,
			},
		};
	}

	return { sizes, styles };
}

// 💎 CORE: Genera TODOS los tokens de Tooltip para TODAS las combinaciones
function generateAllTooltipTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): TooltipTokens {
	const isDark = mode === "dark";
	const tokens = {} as TooltipTokens["styles"];

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"tertiary",
		"accent",
		"neutral",
		"white",
		"success",
		"warning",
		"danger",
	];

	const subtleOpacityDark = 0.9;
	const subtleOpacityLight = 0.98;

	colorSchemes.forEach((scheme) => {
		const tokenShade = appTokens[scheme];
		tokens[scheme] = {} as Record<TooltipStyleType, TooltipStyleTokens>;

		// Solid styleType
		if (scheme === "white") {
			tokens[scheme].solid = {
				background: isDark ? appTokens.neutral.bg : "#ffffff",
				textColor:
					isDark ? appTokens.neutral.text : appTokens.neutral.textShade,
				borderColor:
					isDark ? appTokens.neutral.bgShade : appTokens.neutral.bgShade,
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.4)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.15)",
			};
		} else if (scheme === "neutral") {
			tokens[scheme].solid = {
				background: isDark ? appTokens.neutral.bgShade : appTokens.neutral.bg,
				textColor:
					isDark ? appTokens.neutral.text : appTokens.neutral.textShade,
				borderColor: isDark ? appTokens.neutral.bg : appTokens.neutral.bgShade,
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.4)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.15)",
			};
		} else if (tokenShade) {
			tokens[scheme].solid = {
				background: tokenShade.bg,
				textColor: tokenShade.text,
				borderColor: tokenShade.bgShade,
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.4)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.15)",
			};
		} else {
			tokens[scheme].solid = {
				background: isDark ? appTokens.neutral.bgShade : appTokens.neutral.bg,
				textColor:
					isDark ? appTokens.neutral.text : appTokens.neutral.textShade,
				borderColor: isDark ? appTokens.neutral.bg : appTokens.neutral.bgShade,
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.4)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.15)",
			};
		}

		// Subtle styleType (con opacidad)
		if (scheme === "white") {
			tokens[scheme].subtle = {
				background: tinycolor(isDark ? appTokens.neutral.bg : "#ffffff")
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				textColor:
					isDark ? appTokens.neutral.text : appTokens.neutral.textShade,
				borderColor: tinycolor(
					isDark ? appTokens.neutral.bgShade : appTokens.neutral.bgShade,
				)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.3)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.08)",
			};
		} else if (scheme === "neutral") {
			tokens[scheme].subtle = {
				background: tinycolor(
					isDark ? appTokens.neutral.bgShade : appTokens.neutral.bg,
				)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				textColor:
					isDark ? appTokens.neutral.text : appTokens.neutral.textShade,
				borderColor: tinycolor(
					isDark ? appTokens.neutral.bg : appTokens.neutral.bgShade,
				)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.3)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.08)",
			};
		} else if (tokenShade) {
			tokens[scheme].subtle = {
				background: tinycolor(tokenShade.bg)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				textColor: tokenShade.text,
				borderColor: tinycolor(tokenShade.bgShade)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.3)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.08)",
			};
		} else {
			tokens[scheme].subtle = {
				background: tinycolor(
					isDark ? appTokens.neutral.bgShade : appTokens.neutral.bg,
				)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				textColor:
					isDark ? appTokens.neutral.text : appTokens.neutral.textShade,
				borderColor: tinycolor(
					isDark ? appTokens.neutral.bg : appTokens.neutral.bgShade,
				)
					.setAlpha(isDark ? subtleOpacityDark : subtleOpacityLight)
					.toRgbString(),
				shadow:
					isDark ?
						"0px 4px 10px rgba(0, 0, 0, 0.3)"
					:	"0px 4px 10px rgba(0, 0, 0, 0.08)",
			};
		}
	});

	return { styles: tokens };
}

// 💎 CORE: Genera tokens de DropdownMenu
function generateAllDropdownMenuTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): DropdownMenuTokens {
	const isDark = mode === "dark";
	const { primary } = appTokens;
	// neutral disponible para uso futuro
	void appTokens.neutral;

	const contentBg = isDark ? "#1f2937" : "#ffffff";
	const contentBorder = isDark ? "#374151" : "#e5e7eb";

	const itemText = isDark ? "#e5e7eb" : "#1f2937";
	const itemTextDisabled = isDark ? "#6b7280" : "#9ca3af";
	const itemIcon = isDark ? "#9ca3af" : "#6b7280";

	const hoverBg =
		isDark ?
			tinycolor(primary.pure).setAlpha(0.15).toRgbString()
		:	tinycolor(primary.pure).setAlpha(0.1).toRgbString();

	const hoverText = isDark ? primary.text : primary.pure;
	const labelText = isDark ? "#9ca3af" : "#6b7280";
	const separatorBg = isDark ? "#374151" : "#e5e7eb";

	return {
		content: {
			backgroundColor: contentBg,
			borderColor: contentBorder,
			boxShadow:
				isDark ?
					`0 8px 16px -4px ${tinycolor("#000000").setAlpha(0.4).toRgbString()}`
				:	`0 8px 16px -4px ${tinycolor("#000000").setAlpha(0.1).toRgbString()}`,
		},
		item: {
			backgroundColor: "transparent",
			foregroundColor: itemText,
			hoverBackgroundColor: hoverBg,
			hoverForegroundColor: hoverText,
			disabledForegroundColor: itemTextDisabled,
			iconColor: itemIcon,
		},
		label: {
			foregroundColor: labelText,
		},
		separator: {
			backgroundColor: separatorBg,
		},
		arrow: {
			fill: contentBorder,
		},
	};
}

// 💎 CORE: Genera tokens de LoadingLogo
function generateAllLoadingLogoTokens(
	appTokens: AppColorTokens,
): LoadingLogoTokens {
	const { primary, secondary, accent } = appTokens;

	return {
		colors: {
			primary: {
				pure: primary.pure,
				text: primary.text,
			},
			secondary: {
				pure: secondary.pure,
			},
			accent: {
				pure: accent.pure,
				pureShade: accent.pureShade,
				text: accent.text,
				contrastText: accent.contrastText,
				textShade: accent.textShade,
				bg: accent.bg,
				bgShade: accent.bgShade,
				pureDark: accent.pureShade,
				textDark: accent.textShade,
			},
		},
	};
}

// 💎 CORE: Genera TODOS los tokens de Note para TODAS las combinaciones
function generateAllNoteTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): NoteTokens {
	const { primary, secondary, tertiary, accent, neutral } = appTokens;

	const baseTextColor = neutral.text;
	const basePlaceholderColor = tinycolor(baseTextColor)
		.setAlpha(0.6)
		.toRgbString();

	const commonDisabledBackground = neutral.bgShade;
	const commonDisabledBorder = tinycolor(neutral.pure)
		.setAlpha(0.4)
		.toRgbString();
	const commonDisabledText = tinycolor(baseTextColor)
		.setAlpha(0.5)
		.toRgbString();

	const commonReadOnlyBackground =
		mode === "dark" ?
			tinycolor(neutral.bgShade).lighten(5).setAlpha(0.8).toString()
		:	tinycolor(neutral.contrastText).darken(0).setAlpha(0.8).toString();
	const commonReadOnlyBorder =
		mode === "dark" ?
			tinycolor(neutral.pure).darken(10).toRgbString()
		:	tinycolor(neutral.pure).lighten(10).toRgbString();
	const commonReadOnlyText = baseTextColor;

	const toolbarBackground =
		mode === "dark" ?
			tinycolor(neutral.bgShade).lighten(3).toString()
		:	tinycolor(neutral.contrastText).darken(2).toString();
	const toolbarBorder =
		mode === "dark" ?
			tinycolor(neutral.pure).darken(5).toString()
		:	tinycolor(neutral.pure).lighten(5).toString();

	const previewBackground =
		mode === "dark" ?
			tinycolor(neutral.bg).lighten(2).toString()
		:	tinycolor(neutral.contrastText).darken(1).toString();

	const defaultVariant: NoteVariantTokens = {
		background: neutral.bg,
		border: neutral.pure,
		text: baseTextColor,
		placeholder: basePlaceholderColor,
		focusBorder: primary.pure,
		focusRing: tinycolor(primary.pure).setAlpha(0.25).toRgbString(),
		hoverBorder:
			mode === "dark" ?
				tinycolor(neutral.pure).lighten(10).toString()
			:	neutral.bgShade,
		disabledBackground: commonDisabledBackground,
		disabledBorder: commonDisabledBorder,
		disabledText: commonDisabledText,
		readOnlyBackground: commonReadOnlyBackground,
		readOnlyBorder: commonReadOnlyBorder,
		readOnlyText: commonReadOnlyText,
		toolbarBackground: toolbarBackground,
		toolbarBorder: toolbarBorder,
		previewBackground: previewBackground,
		previewBorder: neutral.pure,
	};

	const createColoredVariant = (
		variantShade: typeof primary,
		focusShade?: typeof primary,
	): NoteVariantTokens => {
		const effectiveFocusShade = focusShade || variantShade;

		const subtleBackground =
			mode === "dark" ?
				tinycolor(variantShade.bg).setAlpha(0.1).toString()
			:	tinycolor(variantShade.bg).setAlpha(0.05).toString();

		const subtleToolbarBackground =
			mode === "dark" ?
				tinycolor(variantShade.bg).setAlpha(0.15).toString()
			:	tinycolor(variantShade.bg).setAlpha(0.08).toString();

		const subtlePreviewBackground =
			mode === "dark" ?
				tinycolor(variantShade.bg).setAlpha(0.12).toString()
			:	tinycolor(variantShade.bg).setAlpha(0.06).toString();

		return {
			background: subtleBackground,
			border: tinycolor(variantShade.pure).setAlpha(0.3).toString(),
			text: baseTextColor,
			placeholder: basePlaceholderColor,
			focusBorder: effectiveFocusShade.pure,
			focusRing: tinycolor(effectiveFocusShade.pure)
				.setAlpha(0.25)
				.toRgbString(),
			hoverBorder:
				mode === "dark" ?
					tinycolor(variantShade.pure).lighten(10).toString()
				:	variantShade.bgShade,
			disabledBackground: commonDisabledBackground,
			disabledBorder: commonDisabledBorder,
			disabledText: commonDisabledText,
			readOnlyBackground: commonReadOnlyBackground,
			readOnlyBorder: commonReadOnlyBorder,
			readOnlyText: commonReadOnlyText,
			toolbarBackground: subtleToolbarBackground,
			toolbarBorder: tinycolor(variantShade.pure).setAlpha(0.2).toString(),
			previewBackground: subtlePreviewBackground,
			previewBorder: tinycolor(variantShade.pure).setAlpha(0.3).toString(),
		};
	};

	return {
		variants: {
			default: defaultVariant,
			primary: createColoredVariant(primary),
			secondary: createColoredVariant(secondary),
			tertiary: createColoredVariant(tertiary),
			accent: createColoredVariant(accent),
			neutral: createColoredVariant(neutral, primary),
		},
		sizes: {
			sm: {
				fontSize: "text-xs",
				paddingX: "px-2",
				paddingY: "py-1.5",
				minHeight: "min-h-[100px]",
			},
			md: {
				fontSize: "text-sm",
				paddingX: "px-3",
				paddingY: "py-2",
				minHeight: "min-h-[120px]",
			},
			lg: {
				fontSize: "text-base",
				paddingX: "px-4",
				paddingY: "py-2.5",
				minHeight: "min-h-[150px]",
			},
		},
	};
}

// 📊 Genera tokens para Nivo Charts
function generateNivoChartTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): NivoChartTokens {
	const isDark = mode === "dark";

	return {
		theme: {
			fontSize: 12,
			textColor: appTokens.neutral.text,
			tooltip: {
				background: appTokens.neutral.bg,
				color: appTokens.neutral.text,
				border: `1px solid ${appTokens.neutral.bgShade}`,
				borderRadius: "6px",
				boxShadow:
					isDark ?
						"0 4px 12px rgba(0, 0, 0, 0.5)"
					:	"0 4px 12px rgba(0, 0, 0, 0.15)",
			},
			grid: {
				stroke: appTokens.neutral.bgShade,
				strokeWidth: 1,
			},
			axis: {
				domain: {
					stroke: appTokens.neutral.bgShade,
					strokeWidth: 1,
				},
				ticks: {
					stroke: appTokens.neutral.bgShade,
					strokeWidth: 1,
					fill: appTokens.neutral.textShade,
					fontSize: 11,
				},
				legend: {
					fill: appTokens.neutral.text,
					fontSize: 12,
					fontWeight: 600,
				},
			},
			legends: {
				fill: appTokens.neutral.text,
				fontSize: 11,
			},
		},
		colors: {
			pending: appTokens.neutral.pure,
			translated: appTokens.secondary.pure,
			review_pending: appTokens.primary.pure,
			pending_review: appTokens.accent.pure,
			reconciliation_pending: appTokens.warning.pure,
			validated: appTokens.success.pure,
			reconciled: appTokens.primary.pure,
			disputed: appTokens.danger.pure,
		},
	};
}

// 🚀 ENTRY POINT: Genera TODOS los tokens de diseño
function generateAllDesignTokens(
	appTokens: AppColorTokens,
	mode: Mode,
): DesignTokens {
	const VERBOSE_LOGS = false;
	if (VERBOSE_LOGS)
		console.log("🎨 [DesignTokensProvider] Generando tokens precalculados...");
	const startTime = performance.now();

	const tokens: DesignTokens = {
		button: generateAllButtonTokens(appTokens),
		input: generateAllInputTokens(appTokens, mode),
		textarea: generateAllTextareaTokens(appTokens, mode),
		select: generateAllSelectTokens(appTokens, mode),
		card: generateAllCardTokens(appTokens, mode),
		badge: generateAllBadgeTokens(appTokens),
		icon: generateAllIconTokens(appTokens, mode),
		text: generateAllTextTokens(appTokens, mode),
		pageBackground: generateAllPageBackgroundTokens(appTokens, mode),
		tabs: generateAllTabsTokens(appTokens, mode),
		progressBar: generateAllProgressBarTokens(appTokens, mode),
		switch: generateAllSwitchTokens(appTokens, mode),
		dialog: generateAllDialogTokens(appTokens, mode),
		slider: generateAllSliderTokens(appTokens, mode),
		divider: generateAllDividerTokens(appTokens),
		alert: generateAllAlertTokens(appTokens, mode),
		breadcrumbs: generateAllBreadcrumbTokens(appTokens, mode),
		checkbox: generateAllCheckboxTokens(appTokens, mode),
		emptyState: generateAllEmptyStateTokens(appTokens),
		radio: generateAllRadioTokens(appTokens),
		tooltip: generateAllTooltipTokens(appTokens, mode),
		dropdownMenu: generateAllDropdownMenuTokens(appTokens, mode),
		loadingLogo: generateAllLoadingLogoTokens(appTokens),
		note: generateAllNoteTokens(appTokens, mode),
		nivoChart: generateNivoChartTokens(appTokens, mode),
		// 🔄 Componentes recién refactorizados
		datePicker: (() => {
			const schemes: ColorSchemeVariant[] = [
				"primary",
				"secondary",
				"tertiary",
				"accent",
				"neutral",
				"white",
				"success",
				"warning",
				"danger",
			];
			const sizes: ("sm" | "md" | "lg")[] = ["sm", "md", "lg"];
			const result: Record<string, Record<string, unknown>> = {};
			schemes.forEach((scheme) => {
				result[scheme] = {};
				sizes.forEach((size) => {
					result[scheme][size] = generateStandardDatePickerTokens(
						appTokens,
						mode,
						{ colorScheme: scheme, size },
					);
				});
			});
			return result;
		})(),
		fileUpload: generateStandardFileUploadTokens(appTokens, mode),
		stepper: generateStandardStepperTokens(appTokens, mode),
		// 🔄 Fase 2: Accordion precalculado
		accordion: (() => {
			const schemes: ColorSchemeVariant[] = [
				"primary",
				"secondary",
				"tertiary",
				"accent",
				"neutral",
				"white",
				"success",
				"warning",
				"danger",
			];
			const sizes: ("sm" | "md" | "lg")[] = ["sm", "md", "lg"];
			const styleTypes: ("subtle" | "solid")[] = ["subtle", "solid"];
			const result: Record<
				string,
				Record<string, Record<string, unknown>>
			> = {};
			schemes.forEach((scheme) => {
				result[scheme] = {};
				sizes.forEach((size) => {
					result[scheme][size] = {};
					styleTypes.forEach((styleType) => {
						result[scheme][size][styleType] = generateStandardAccordionTokens(
							appTokens,
							mode,
							{
								colorScheme: scheme,
								size,
								styleType,
								isOpen: false,
								isDisabled: false,
							},
						);
					});
				});
			});
			return result;
		})(),
		// 🔄 Fase 3: Table precalculado (usa colorScheme primary por defecto)
		table: generateTableTokens(appTokens, mode, "primary"),
		// 🔄 Fase 3: Navbar precalculado
		navbar: generateStandardNavbarTokens(appTokens, mode),
		// 🔄 Fase 3: Sphere precalculado
		sphere: generateSphereTokens(appTokens, mode),
		// 🔄 Fase 3: FontSelector precalculado
		fontSelector: generateFontSelectorTokens(appTokens, mode),
	};

	const endTime = performance.now();
	if (VERBOSE_LOGS)
		console.log(
			`✅ [DesignTokensProvider] Tokens generados en ${(endTime - startTime).toFixed(2)}ms`,
		);

	return tokens;
}
//#endregion

//#region [provider] - 🚀 PROVIDER COMPONENT
interface DesignTokensProviderProps {
	children: ReactNode;
}

export function DesignTokensProvider({ children }: DesignTokensProviderProps) {
	const { appColorTokens, mode } = useTheme();

	// 💎 CORE: Precalcular tokens UNA SOLA VEZ (o cuando cambie tema/modo)
	// 🔧 DECISIÓN: Solo 2 dependencias = regeneración mínima
	const tokens = useMemo(() => {
		if (!appColorTokens) return null;
		return generateAllDesignTokens(appColorTokens, mode);
	}, [appColorTokens, mode]);

	const value: DesignTokensContextType = {
		tokens,
		isReady: tokens !== null,
	};

	return (
		<DesignTokensContext.Provider value={value}>
			{children}
		</DesignTokensContext.Provider>
	);
}
//#endregion

//#region [hook] - 🪝 CUSTOM HOOK
// 🚀 ENTRY POINT: Hook para consumir tokens precalculados
export function useDesignTokens(): DesignTokensContextType {
	const context = useContext(DesignTokensContext);
	if (context === undefined) {
		// ⚠️ Error visible (política anti-callbacks silenciosos)
		throw new Error(
			"useDesignTokens must be used within a DesignTokensProvider",
		);
	}
	return context;
}
//#endregion
