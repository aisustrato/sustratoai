// 📍 lib/theme/harmonic-colors.ts
// 🎨 PROPÓSITO: Generar colores armónicos adicionales cuando la paleta base se agota
// 🔧 DECISIÓN: Analiza el "modo" de la paleta actual y genera colores coherentes
// v0.01 - Sustrato AI

import type { ColorShade, AppColorTokens, Mode } from "./ColorToken";

//#region [types] - 🎨 TIPOS

// Modo cromático de la paleta (determina cómo generar armónicos)
export type PaletteMode = 
	| "analogous"      // Colores cercanos en el círculo (ej: azul-cyan-verde)
	| "complementary"  // Colores opuestos (ej: azul-naranja)
	| "triadic"        // 3 colores equidistantes (ej: azul-rojo-amarillo)
	| "split"          // Complementario dividido
	| "monochromatic"  // Variaciones de un solo hue
	| "neutral"        // Escala de grises con acento
	| "warm"           // Predominantemente cálidos
	| "cool";          // Predominantemente fríos

// Resultado del análisis de paleta
export interface PaletteAnalysis {
	mode: PaletteMode;
	dominantHue: number;        // 0-360
	hueRange: number;           // Rango de hues usados
	saturationAvg: number;      // 0-100
	lightnessAvg: number;       // 0-100
	isWarm: boolean;
	isCool: boolean;
	usedHues: number[];         // Hues ya ocupados
}

// Slot de color para componentes
export interface ColorSlot {
	id: string;
	colorShade: ColorShade;
	source: "base" | "semantic" | "harmonic";
	hue: number;
}

//#endregion

//#region [utils] - 🔧 UTILIDADES DE CONVERSIÓN

// Hex a HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return { h: 0, s: 0, l: 50 };

	const r = parseInt(result[1], 16) / 255;
	const g = parseInt(result[2], 16) / 255;
	const b = parseInt(result[3], 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
			case g: h = ((b - r) / d + 2) / 6; break;
			case b: h = ((r - g) / d + 4) / 6; break;
		}
	}

	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// HSL a Hex
function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs((h / 60) % 2 - 1));
	const m = l - c / 2;
	let r = 0, g = 0, b = 0;

	if (0 <= h && h < 60) { r = c; g = x; b = 0; }
	else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
	else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
	else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
	else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
	else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

	const toHex = (n: number) => {
		const hex = Math.round((n + m) * 255).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Distancia angular entre hues
function hueDistance(h1: number, h2: number): number {
	const diff = Math.abs(h1 - h2);
	return Math.min(diff, 360 - diff);
}

//#endregion

//#region [analysis] - 🔍 ANÁLISIS DE PALETA

/**
 * Analiza la paleta actual y determina su modo cromático
 */
export function analyzePalette(tokens: AppColorTokens): PaletteAnalysis {
	// Extraer hues de los colores principales
	const primaryHsl = hexToHsl(tokens.primary.pure);
	const secondaryHsl = hexToHsl(tokens.secondary.pure);
	const tertiaryHsl = hexToHsl(tokens.tertiary?.pure || tokens.primary.pure);
	const accentHsl = hexToHsl(tokens.accent.pure);

	const hues = [primaryHsl.h, secondaryHsl.h, tertiaryHsl.h, accentHsl.h];
	const saturations = [primaryHsl.s, secondaryHsl.s, tertiaryHsl.s, accentHsl.s];
	const lightnesses = [primaryHsl.l, secondaryHsl.l, tertiaryHsl.l, accentHsl.l];

	// Calcular dominante y rango
	const dominantHue = primaryHsl.h;
	const hueDistances = hues.map(h => hueDistance(h, dominantHue));
	const hueRange = Math.max(...hueDistances);

	// Promedios
	const saturationAvg = saturations.reduce((a, b) => a + b, 0) / saturations.length;
	const lightnessAvg = lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length;

	// Determinar si es cálido o frío
	const warmHues = hues.filter(h => (h >= 0 && h <= 60) || (h >= 300 && h <= 360));
	const coolHues = hues.filter(h => h >= 180 && h <= 300);
	const isWarm = warmHues.length > coolHues.length;
	const isCool = coolHues.length > warmHues.length;

	// Determinar modo cromático
	let mode: PaletteMode = "analogous";

	if (saturationAvg < 15) {
		mode = "neutral";
	} else if (hueRange < 30) {
		mode = "monochromatic";
	} else if (hueRange < 60) {
		mode = "analogous";
	} else if (hueRange >= 150 && hueRange <= 180) {
		mode = "complementary";
	} else if (hueRange >= 110 && hueRange <= 130) {
		mode = "triadic";
	} else if (hueRange >= 130 && hueRange <= 150) {
		mode = "split";
	} else if (isWarm) {
		mode = "warm";
	} else if (isCool) {
		mode = "cool";
	}

	return {
		mode,
		dominantHue,
		hueRange,
		saturationAvg,
		lightnessAvg,
		isWarm,
		isCool,
		usedHues: hues,
	};
}

//#endregion

//#region [generation] - 🎨 GENERACIÓN DE COLORES ARMÓNICOS

/**
 * Genera un ColorShade completo a partir de un hue base
 */
function generateColorShade(hue: number, saturation: number, isDark: boolean): ColorShade {
	const s = Math.min(100, Math.max(20, saturation));
	
	if (isDark) {
		return {
			pure: hslToHex(hue, s, 55),
			pureShade: hslToHex(hue, s, 45),
			text: hslToHex(hue, s * 0.6, 75),
			contrastText: hslToHex(hue, s * 0.3, 10),
			textShade: hslToHex(hue, s * 0.5, 65),
			bg: hslToHex(hue, s * 0.4, 12),
			bgShade: hslToHex(hue, s * 0.3, 8),
		};
	}

	return {
		pure: hslToHex(hue, s, 50),
		pureShade: hslToHex(hue, s, 40),
		text: hslToHex(hue, s * 0.8, 25),
		contrastText: hslToHex(hue, s * 0.2, 95),
		textShade: hslToHex(hue, s * 0.7, 18),
		bg: hslToHex(hue, s * 0.5, 92),
		bgShade: hslToHex(hue, s * 0.4, 85),
	};
}

/**
 * Calcula el próximo hue armónico basado en el modo de paleta
 */
function getNextHarmonicHue(analysis: PaletteAnalysis, requestIndex: number): number {
	const { mode, dominantHue, usedHues } = analysis;
	
	// Encontrar un hue que no esté demasiado cerca de los usados
	const findAvailableHue = (candidates: number[]): number => {
		for (const candidate of candidates) {
			const normalizedCandidate = ((candidate % 360) + 360) % 360;
			const isTooClose = usedHues.some(used => hueDistance(normalizedCandidate, used) < 25);
			if (!isTooClose) {
				return normalizedCandidate;
			}
		}
		// Si todos están ocupados, rotamos
		return (dominantHue + (requestIndex * 40)) % 360;
	};

	switch (mode) {
		case "analogous":
			// Expandir gradualmente desde el dominante
			return findAvailableHue([
				dominantHue + 45 * requestIndex,
				dominantHue - 45 * requestIndex,
				dominantHue + 60 * requestIndex,
			]);

		case "complementary":
			// Alternar entre cercanos al dominante y cercanos al complementario
			const complement = (dominantHue + 180) % 360;
			return findAvailableHue([
				requestIndex % 2 === 0 ? dominantHue + 30 * requestIndex : complement + 30 * requestIndex,
				dominantHue + 40 * requestIndex,
			]);

		case "triadic":
			// Rotar por tercios del círculo
			return findAvailableHue([
				dominantHue + 120 * (requestIndex % 3) + Math.floor(requestIndex / 3) * 20,
			]);

		case "split":
			// Similar a triadic pero con splits
			return findAvailableHue([
				dominantHue + 150 + (requestIndex * 30),
				dominantHue - 150 - (requestIndex * 30),
			]);

		case "monochromatic":
			// Mismo hue, diferentes saturaciones (manejado en generateColorShade)
			return dominantHue;

		case "warm":
			// Mantener en rango cálido (0-60, 300-360)
			const warmOffsets = [15, 30, 45, -15, -30, 330, 345];
			return findAvailableHue(warmOffsets.map(o => dominantHue + o));

		case "cool":
			// Mantener en rango frío (180-300)
			const coolOffsets = [15, 30, 45, -15, -30, -45];
			return findAvailableHue(coolOffsets.map(o => dominantHue + o));

		case "neutral":
			// Agregar color con baja saturación
			return findAvailableHue([200, 220, 180, 240]);

		default:
			return (dominantHue + 40 * requestIndex) % 360;
	}
}

//#endregion

//#region [exports] - 📤 API PÚBLICA

/**
 * Administrador de slots de color para un conjunto de componentes
 */
export class HarmonicColorManager {
	private tokens: AppColorTokens;
	private mode: Mode;
	private analysis: PaletteAnalysis;
	private assignedSlots: Map<string, ColorSlot> = new Map();
	private harmonicIndex: number = 0;

	constructor(tokens: AppColorTokens, mode: Mode) {
		this.tokens = tokens;
		this.mode = mode;
		this.analysis = analyzePalette(tokens);
	}

	/**
	 * Solicita un color para un componente/nodo específico
	 * @param componentId - ID único del componente
	 * @param preferredVariant - Variante preferida (optional)
	 */
	requestColor(componentId: string, preferredVariant?: keyof AppColorTokens): ColorSlot {
		// Si ya tiene asignado, retornarlo
		if (this.assignedSlots.has(componentId)) {
			return this.assignedSlots.get(componentId)!;
		}

		// Orden de prioridad de colores base
		const baseOrder: (keyof AppColorTokens)[] = [
			"primary", "secondary", "accent", "tertiary" as keyof AppColorTokens
		].filter(k => k in this.tokens) as (keyof AppColorTokens)[];

		// Orden de semánticos (solo si tiene sentido para el contexto)
		const semanticOrder: (keyof AppColorTokens)[] = ["success", "warning", "danger"];

		// Si tiene preferencia y está disponible, usarla
		if (preferredVariant && this.tokens[preferredVariant]) {
			const slot: ColorSlot = {
				id: componentId,
				colorShade: this.tokens[preferredVariant],
				source: "base",
				hue: hexToHsl(this.tokens[preferredVariant].pure).h,
			};
			this.assignedSlots.set(componentId, slot);
			this.analysis.usedHues.push(slot.hue);
			return slot;
		}

		// Buscar el primer slot base no usado
		for (const key of baseOrder) {
			const isUsed = Array.from(this.assignedSlots.values()).some(
				s => s.source === "base" && s.hue === hexToHsl(this.tokens[key].pure).h
			);
			if (!isUsed) {
				const slot: ColorSlot = {
					id: componentId,
					colorShade: this.tokens[key],
					source: "base",
					hue: hexToHsl(this.tokens[key].pure).h,
				};
				this.assignedSlots.set(componentId, slot);
				this.analysis.usedHues.push(slot.hue);
				return slot;
			}
		}

		// Buscar semántico no usado
		for (const key of semanticOrder) {
			const isUsed = Array.from(this.assignedSlots.values()).some(
				s => s.source === "semantic" && s.hue === hexToHsl(this.tokens[key].pure).h
			);
			if (!isUsed) {
				const slot: ColorSlot = {
					id: componentId,
					colorShade: this.tokens[key],
					source: "semantic",
					hue: hexToHsl(this.tokens[key].pure).h,
				};
				this.assignedSlots.set(componentId, slot);
				this.analysis.usedHues.push(slot.hue);
				return slot;
			}
		}

		// Todos ocupados: generar armónico
		this.harmonicIndex++;
		const newHue = getNextHarmonicHue(this.analysis, this.harmonicIndex);
		const newShade = generateColorShade(newHue, this.analysis.saturationAvg, this.mode === "dark");

		const slot: ColorSlot = {
			id: componentId,
			colorShade: newShade,
			source: "harmonic",
			hue: newHue,
		};
		this.assignedSlots.set(componentId, slot);
		this.analysis.usedHues.push(newHue);

		return slot;
	}

	/**
	 * Obtiene el análisis de la paleta actual
	 */
	getPaletteAnalysis(): PaletteAnalysis {
		return this.analysis;
	}

	/**
	 * Obtiene todos los slots asignados
	 */
	getAllSlots(): ColorSlot[] {
		return Array.from(this.assignedSlots.values());
	}

	/**
	 * Reinicia las asignaciones
	 */
	reset(): void {
		this.assignedSlots.clear();
		this.harmonicIndex = 0;
		this.analysis = analyzePalette(this.tokens);
	}

	/**
	 * Genera N colores armónicos de una vez
	 */
	generateHarmonicPalette(count: number): ColorShade[] {
		const palette: ColorShade[] = [];
		for (let i = 0; i < count; i++) {
			const hue = getNextHarmonicHue(this.analysis, i + 1);
			const shade = generateColorShade(hue, this.analysis.saturationAvg, this.mode === "dark");
			palette.push(shade);
			this.analysis.usedHues.push(hue);
		}
		return palette;
	}
}

/**
 * Hook-like factory para crear un manager en contexto React
 */
export function createHarmonicColorManager(tokens: AppColorTokens, mode: Mode): HarmonicColorManager {
	return new HarmonicColorManager(tokens, mode);
}

//#endregion
