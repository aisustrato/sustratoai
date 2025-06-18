//. 📍 lib/theme/components/standard-card-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type {
	AppColorTokens,
	ProCardVariant,
	Mode,
	ColorShade,
} from "../ColorToken";
import { neutral } from "../colors"; // Contiene la paleta gray
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
// Helper para gradientes generales (ej. para 'filled', 'subtle')
// Manteniendo tus porcentajes 10%, 80%, 100%
const createThreeToneDiagonalGradient = (
	color1: string,
	color2: string,
	color3: string,
	angle = 135
): string => {
	return `linear-gradient(${angle}deg, ${color1} 10%, ${color2} 80%, ${color3} 100%)`;
};

// Helper específico para los gradientes del accentBar
const createAccentBarGradient = (
	startColor: string,
	endColor: string,
	angle = 135
): string => {
	return `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
};
//#endregion ![sub]

//#region [def] - 📦 TYPES & INTERFACES 📦
export type StandardCardStyleType = "filled" | "subtle" | "transparent";
export type StandardCardAccentPlacement =
	| "none"
	| "top"
	| "left"
	| "right"
	| "bottom";
export type StandardCardShadow = "none" | "sm" | "md" | "lg" | "xl";

export interface StandardCardTokens {
	styleTypes: {
		[key_type in StandardCardStyleType]: {
			[key_scheme in ProCardVariant]?: {
				background?: string;
				color?: string;
			};
		};
	};
	outline: {
		[key_scheme in ProCardVariant]?: {
			borderColor?: string;
			borderWidth?: string;
			borderStyle?: string;
		};
	};
	accents: {
		[key_placement in StandardCardAccentPlacement]?: {
			[key_scheme in ProCardVariant]?: {
				standardBackground?: string;
				duotoneMagicBackground?: string;
				height?: string;
				width?: string;
			};
		};
	};
	shadows: {
		[key_shadow in StandardCardShadow]: string;
	};
	selected: {
		[key_scheme in ProCardVariant]?: {
			borderColor?: string;
			borderWidth?: string;
			overlayBackground?: string;
		};
	};
	checkbox: {
		[key_scheme in ProCardVariant]?: {
			borderColor?: string;
			iconColor?: string;
			focusRingColor?: string;
		};
	};
	inactiveOverlayBackground: string;
	loadingOverlayBackground: string;
	defaultTextColor: string;
	subtleTextColor: string;
	padding: string;
	noPadding: string;
}
//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardCardTokens(
	appColorTokens: AppColorTokens,
	mode: Mode
): StandardCardTokens {
	const allCardSchemes: ProCardVariant[] = Object.keys(
		appColorTokens
	) as ProCardVariant[];

	const styleTypes: StandardCardTokens["styleTypes"] = {
		filled: {},
		subtle: {},
		transparent: {},
	};

	allCardSchemes.forEach((scheme) => {
		const tokenShade: ColorShade | undefined = appColorTokens[scheme]; // Este tokenShade ya es el específico del modo (light/dark)
		if (!tokenShade) return;

		// --- FILLED ---
		if (mode === "light") {
			// Tu lógica para filled light mode (manito de gato)
			let filledBase = tokenShade.bg;
			let filledMid = tokenShade.bgShade; // es bgDark
			let filledEnd = tinycolor
				.mix(tokenShade.bgShade, tokenShade.pure, 20)
				.toHexString();
			styleTypes.filled[scheme] = {
				background: createThreeToneDiagonalGradient(
					filledBase,
					filledMid,
					filledEnd
				),
				color: tokenShade.contrastText,
			};
		} else {
			// Dark Mode for 'filled'
			// Objetivo: Oscuro, con personalidad, buen contraste. Inspirado en ProCard.
			// tokenShade.bg y tokenShade.bgShade (bgDark) ya son oscuros.
			// Usaremos un gradiente desde el más oscuro (bgShade/bgDark) hacia el "fondo principal oscuro" (bg) del esquema.
			// Esto debería dar profundidad sin perder el tinte oscuro.
			styleTypes.filled[scheme] = {
				background: createAccentBarGradient(tokenShade.bgShade, tokenShade.bg), // De más oscuro a un poco menos oscuro del scheme
				color: tokenShade.contrastText, // Ya es un color de texto claro para fondos oscuros
			};
			// Casos especiales para neutral y white en dark mode filled, como los tenías
			if (scheme === "neutral" || scheme === "white") {
				styleTypes.filled[scheme]!.background = createAccentBarGradient(
					neutral.gray[900],
					neutral.gray[800]
				); // Gradiente de grises oscuros
				styleTypes.filled[scheme]!.color = neutral.gray[100]; // Texto claro
			}
		}

		// --- SUBTLE ---
		if (mode === "light") {
			// Tu lógica para subtle light mode (manito de gato)
			let subtleBase = neutral.white;
			let subtleMid = tokenShade.bg;
			let subtleEnd = tinycolor
      .mix(tokenShade.bg, tokenShade.bgShade, 30)
      .toHexString();

			if (scheme === "neutral" || scheme === "white") {
				subtleBase = neutral.white;
				subtleMid = neutral.gray[50];
				subtleEnd = neutral.gray[100];
			} else {
				subtleBase = tinycolor
					.mix(neutral.white, tokenShade.bg, 30)
					.toHexString(); // 70% white, 30% tokenShade.bg
			}
			styleTypes.subtle[scheme] = {
				background: createThreeToneDiagonalGradient(
					subtleBase,
					subtleMid,
					subtleEnd
				),
				color: tokenShade.text,
			};
		} else {
			// Dark Mode for 'subtle'
			// Objetivo: Degradado inverso al modo light, con predominancia oscura/neutral
			// pero manteniendo la personalidad etérea del color del esquema.
			// Creamos un degradado de 3 tonos que va desde más oscuro/neutral hacia tonos
			// ligeramente influenciados por el color del esquema.
			let subtleDarkBase: string;
			let subtleDarkMid: string;
			let subtleDarkEnd: string;
			
			if (scheme === "neutral" || scheme === "white") {
				// Para esquemas neutrales, usamos gradaciones de gris
				subtleDarkBase = neutral.gray[900]; // Más oscuro (base)
				subtleDarkMid = tinycolor(neutral.gray[900]).lighten(3).toHexString(); // Tono intermedio
				subtleDarkEnd = neutral.gray[800]; // Menos oscuro (final)
			} else {
				// Para esquemas de color, partimos de un neutral oscuro
				// y vamos añadiendo sutilmente el tinte del color del esquema
				subtleDarkBase = neutral.gray[900]; // Base muy oscura
				subtleDarkMid = tinycolor.mix(neutral.gray[900], tokenShade.bgShade, 20).toHexString(); 
				// Final con algo más de presencia del color del esquema, pero aún oscuro
				subtleDarkEnd = tinycolor.mix(tinycolor(neutral.gray[900]).lighten(5).toHexString(), tokenShade.bg, 30).toHexString();
			}
			
			styleTypes.subtle[scheme] = {
				background: createThreeToneDiagonalGradient(
					subtleDarkBase,
					subtleDarkMid,
					subtleDarkEnd
				),
				color: tokenShade.text, // Ya es un color de texto claro para fondos oscuros
			};
		}

		// --- TRANSPARENT ---
		styleTypes.transparent[scheme] = {
			background: "transparent",
			color: tokenShade.text,
		};
	});

	// ... (resto de los tokens: outline, accents, selected, checkbox, etc. se mantienen como en tu versión "manito de gato" ya que no eran el foco de este cambio)

	const outline: StandardCardTokens["outline"] = {};
	allCardSchemes.forEach((scheme) => {
		const tokenShade = appColorTokens[scheme];
		if (!tokenShade) return;
		outline[scheme] = {
			borderColor: tokenShade.pureShade,
			borderWidth: "1px",
			borderStyle: "solid",
		};
	});

	const accents: StandardCardTokens["accents"] = {
		none: {},
		top: {},
		left: {},
		right: {},
		bottom: {},
	};
	const accentThickness = "4px";
	allCardSchemes.forEach((outerScheme) => {
		const outerTokenShade = appColorTokens[outerScheme];
		if (!outerTokenShade) return;
				const colorInstance = tinycolor(outerTokenShade.pure);
		let startColor = outerTokenShade.pure;

		// If the 'pure' color is dark, lighten it to ensure the gradient is visible.
		if (colorInstance.isDark()) {
			startColor = colorInstance.lighten(20).toHexString();
		}

		const standardBg = createAccentBarGradient(
			startColor, // Use the potentially lightened color
			outerTokenShade.text
		);
		let duotoneMagicBg: string;
		if (outerScheme === "accent") {
			duotoneMagicBg = createAccentBarGradient(
				appColorTokens.accent.pure,
				appColorTokens.primary.pure
			);
		} else {
			duotoneMagicBg = createAccentBarGradient(
				outerTokenShade.pure,
				appColorTokens.accent.pure
			);
		}
		(
			["top", "left", "right", "bottom"] as StandardCardAccentPlacement[]
		).forEach((placement) => {
			if (placement === "none") return;
			if (!accents[placement]) accents[placement] = {};
			accents[placement]![outerScheme] = {
				standardBackground: standardBg,
				duotoneMagicBackground: duotoneMagicBg,
				height:
					placement === "top" || placement === "bottom"
						? accentThickness
						: undefined,
				width:
					placement === "left" || placement === "right"
						? accentThickness
						: undefined,
			};
		});
	});

	const selected: StandardCardTokens["selected"] = {};
	allCardSchemes.forEach((scheme) => {
		const tokenShade = appColorTokens[scheme];
		if (!tokenShade) return;
		selected[scheme] = {
			borderColor: tokenShade.pure,
			borderWidth: "2px",
			overlayBackground: tinycolor(tokenShade.pure)
				.setAlpha(mode === "dark" ? 0.2 : 0.15)
				.toRgbString(),
		};
	});

	const checkbox: StandardCardTokens["checkbox"] = {};
	const primaryPureForFocusDefault = appColorTokens.primary.pure;
	allCardSchemes.forEach((scheme) => {
		const tokenShade = appColorTokens[scheme];
		if (!tokenShade) return;
		checkbox[scheme] = {
			borderColor: tokenShade.pureShade,
			iconColor: tokenShade.pure,
			focusRingColor: primaryPureForFocusDefault,
		};
	});
	if (appColorTokens.white) {
		checkbox.white = {
			borderColor: appColorTokens.neutral.pureShade || neutral.gray[300],
			iconColor: appColorTokens.primary.pure,
			focusRingColor: primaryPureForFocusDefault,
		};
	}

	const inactiveOverlayBgValue =
		mode === "dark"
			? tinycolor(appColorTokens.neutral.bg || neutral.gray[900])
					.setAlpha(0.7)
					.toRgbString()
			: tinycolor(neutral.gray[50]).setAlpha(0.6).toRgbString();

	const loadingOverlayBgValue =
		mode === "dark"
			? tinycolor(appColorTokens.neutral.bg || neutral.gray[800])
					.setAlpha(0.75)
					.toRgbString()
			: tinycolor(neutral.gray[100]).setAlpha(0.65).toRgbString();

	return {
		styleTypes,
		outline,
		accents,
		shadows: {
			none: "shadow-none",
			sm: "shadow-sm",
			md: "shadow-md",
			lg: "shadow-lg",
			xl: "shadow-xl",
		},
		selected,
		checkbox,
		inactiveOverlayBackground: inactiveOverlayBgValue,
		loadingOverlayBackground: loadingOverlayBgValue,
		defaultTextColor: mode === "dark" ? neutral.gray[200] : neutral.gray[800],
		subtleTextColor: mode === "dark" ? neutral.gray[400] : neutral.gray[600],
		padding: "p-4",
		noPadding: "",
	};
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Types, Interface, and Generator Function are exported above.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// - Consider refining dark mode 'subtle' and 'filled' gradients for better distinction.
// - Add more shadow options if required by designs.
// - Ensure all color combinations meet accessibility contrast standards.
//#endregion ![todo]
