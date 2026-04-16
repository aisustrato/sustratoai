// 📍 app/sandbox/hooks/useNexusColors.ts
// 🎨 Hook para colores del Nexus conectado al sistema de temas
// v0.01 - Hipatia Nexus

"use client";

import { useMemo, useCallback } from "react";
import { useTheme } from "@/app/theme-provider";
import { 
	HarmonicColorManager, 
	type ColorSlot,
	analyzePalette 
} from "@/lib/theme/harmonic-colors";
import type { ColorShade } from "@/lib/theme/ColorToken";
import type { NodoData } from "../components/NodoUniversal";

// Tipo de categoría para nodos
export type NodoCategory = 
	| "colapso" 
	| "abundancia" 
	| "glitch" 
	| "astronomia" 
	| "megalitismo" 
	| "maritimo"
	| "educacion"
	| "funerario"
	| "anomalia"
	| "neutral";

// Mapeo de categoría a variante semántica preferida
const CATEGORY_VARIANT_MAP: Record<NodoCategory, string | null> = {
	colapso: "danger",
	abundancia: "success",
	glitch: "warning",
	astronomia: "accent",
	megalitismo: "primary",
	maritimo: "secondary",
	educacion: "success",
	funerario: "neutral",
	anomalia: "danger",
	neutral: null,
};

// Determinar categoría de un nodo basado en sus datos
function getNodoCategory(data: NodoData): NodoCategory {
	if (data.patternTags?.includes("colapso_ecologico") || data.patternTags?.includes("rigidez_F1")) {
		return "colapso";
	}
	if (data.type === "abundance_epoch" || data.patternTags?.includes("abundancia") || data.patternTags?.includes("diversidad")) {
		return "abundancia";
	}
	if (data.glitchType === "aparicion_prematura" || data.glitchType === "conocimiento_imposible") {
		return "glitch";
	}
	if (data.patternTags?.includes("astronomia") || data.patternTags?.includes("astronomia_precision")) {
		return "astronomia";
	}
	if (data.patternTags?.includes("megalitos") || data.patternTags?.includes("megalitismo")) {
		return "megalitismo";
	}
	if (data.patternTags?.includes("maritimo") || data.patternTags?.includes("navegacion")) {
		return "maritimo";
	}
	if (data.patternTags?.includes("educacion") || data.patternTags?.includes("biblioteca")) {
		return "educacion";
	}
	if (data.patternTags?.includes("momificacion") || data.patternTags?.includes("funerario")) {
		return "funerario";
	}
	if (data.anomalyLevel === "critical") {
		return "anomalia";
	}
	return "neutral";
}

export interface UseNexusColorsReturn {
	/** Obtener colores para un nodo específico */
	getNodeColors: (data: NodoData) => {
		primary: string;      // Color principal (pure)
		background: string;   // Color de fondo (bg)
		text: string;         // Color de texto
		border: string;       // Color de borde (pureShade)
		category: NodoCategory;
	};
	/** Obtener ColorShade completo para un nodo */
	getNodeColorShade: (data: NodoData) => ColorShade;
	/** Análisis de la paleta actual */
	paletteMode: string | null;
	/** El sistema está conectado al tema */
	isConnected: boolean;
}

/**
 * Hook para obtener colores de nodos conectados al sistema de temas
 * 
 * @example
 * ```tsx
 * const { getNodeColors } = useNexusColors();
 * const colors = getNodeColors(nodoData);
 * // colors.primary, colors.background, etc.
 * ```
 */
export function useNexusColors(): UseNexusColorsReturn {
	const { appColorTokens, mode } = useTheme();

	// Crear manager de colores armónicos
	const colorManager = useMemo(() => {
		if (!appColorTokens || !mode) return null;
		return new HarmonicColorManager(appColorTokens, mode);
	}, [appColorTokens, mode]);

	// Obtener análisis de paleta
	const paletteMode = useMemo(() => {
		if (!colorManager) return null;
		return colorManager.getPaletteAnalysis().mode;
	}, [colorManager]);

	// Función para obtener colores de un nodo
	const getNodeColors = useCallback((data: NodoData) => {
		const category = getNodoCategory(data);
		
		if (!colorManager || !appColorTokens) {
			// Fallback si no está conectado al tema
			const fallbackColors: Record<NodoCategory, string> = {
				colapso: "#FF6B6B",
				abundancia: "#4ECDC4",
				glitch: "#FFE66D",
				astronomia: "#A8E6CF",
				megalitismo: "#9B59B6",
				maritimo: "#3498DB",
				educacion: "#27AE60",
				funerario: "#8B4513",
				anomalia: "#E74C3C",
				neutral: "#95A5A6",
			};
			return {
				primary: fallbackColors[category],
				background: `${fallbackColors[category]}20`,
				text: fallbackColors[category],
				border: fallbackColors[category],
				category,
			};
		}

		// Obtener variante preferida para la categoría
		const preferredVariant = CATEGORY_VARIANT_MAP[category];
		
		let colorShade: ColorShade;
		
		// Función helper para obtener color por nombre de variante
		const getTokenByName = (name: string): ColorShade | undefined => {
			const tokens = appColorTokens as Record<string, ColorShade>;
			return tokens[name];
		};
		
		if (preferredVariant) {
			const tokenColor = getTokenByName(preferredVariant);
			if (tokenColor) {
				colorShade = tokenColor;
			} else {
				const slot = colorManager.requestColor(data.id);
				colorShade = slot.colorShade;
			}
		} else {
			// Solicitar color armónico basado en ID del nodo
			const slot = colorManager.requestColor(data.id);
			colorShade = slot.colorShade;
		}

		return {
			primary: colorShade.pure,
			background: colorShade.bg,
			text: colorShade.text,
			border: colorShade.pureShade,
			category,
		};
	}, [colorManager, appColorTokens]);

	// Función para obtener ColorShade completo
	const getNodeColorShade = useCallback((data: NodoData): ColorShade => {
		const category = getNodoCategory(data);
		
		if (!colorManager || !appColorTokens) {
			// Fallback
			return {
				pure: "#95A5A6",
				pureShade: "#7F8C8D",
				text: "#2C3E50",
				contrastText: "#FFFFFF",
				textShade: "#1A252F",
				bg: "#ECF0F1",
				bgShade: "#BDC3C7",
			};
		}

		const preferredVariant = CATEGORY_VARIANT_MAP[category];
		
		// Función helper para obtener color por nombre de variante
		const getTokenByName = (name: string): ColorShade | undefined => {
			const tokens = appColorTokens as Record<string, ColorShade>;
			return tokens[name];
		};
		
		if (preferredVariant) {
			const tokenColor = getTokenByName(preferredVariant);
			if (tokenColor) {
				return tokenColor;
			}
		}
		
		const slot = colorManager.requestColor(data.id);
		return slot.colorShade;
	}, [colorManager, appColorTokens]);

	return {
		getNodeColors,
		getNodeColorShade,
		paletteMode,
		isConnected: !!colorManager,
	};
}

export default useNexusColors;
