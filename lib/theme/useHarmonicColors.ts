// 📍 lib/theme/useHarmonicColors.ts
// 🎨 Hook para solicitar colores armónicos en componentes React
// v0.01 - Sustrato AI

"use client";

import { useMemo, useRef } from "react";
import { useTheme } from "@/app/theme-provider";
import { 
	HarmonicColorManager, 
	type ColorSlot, 
	type PaletteAnalysis 
} from "./harmonic-colors";
import type { ColorShade } from "./ColorToken";

export interface UseHarmonicColorsReturn {
	/** Solicitar un color para un componente específico */
	requestColor: (componentId: string) => ColorSlot;
	/** Obtener el ColorShade para un componente */
	getColorShade: (componentId: string) => ColorShade;
	/** Análisis de la paleta actual */
	analysis: PaletteAnalysis | null;
	/** Todos los slots asignados */
	slots: ColorSlot[];
	/** Generar N colores armónicos de una vez */
	generatePalette: (count: number) => ColorShade[];
	/** El manager está listo */
	isReady: boolean;
}

/**
 * Hook para gestionar colores armónicos en un conjunto de componentes
 * 
 * @example
 * ```tsx
 * const { requestColor, getColorShade } = useHarmonicColors();
 * 
 * // En el render de cada nodo:
 * const slot = requestColor(node.id);
 * const bgColor = slot.colorShade.bg;
 * const textColor = slot.colorShade.text;
 * ```
 */
export function useHarmonicColors(): UseHarmonicColorsReturn {
	const { appColorTokens, mode } = useTheme();
	
	// Mantener referencia estable del manager
	const managerRef = useRef<HarmonicColorManager | null>(null);

	// Crear/actualizar manager cuando cambian tokens o mode
	const manager = useMemo(() => {
		if (!appColorTokens || !mode) {
			return null;
		}
		
		// Si ya existe y los tokens son los mismos, reusar
		if (managerRef.current) {
			// Para simplificar, recreamos. En producción podríamos comparar.
			managerRef.current = new HarmonicColorManager(appColorTokens, mode);
		} else {
			managerRef.current = new HarmonicColorManager(appColorTokens, mode);
		}
		
		return managerRef.current;
	}, [appColorTokens, mode]);

	// Función para solicitar color
	const requestColor = useMemo(() => {
		return (componentId: string): ColorSlot => {
			if (!manager) {
				// Fallback si el manager no está listo
				return {
					id: componentId,
					colorShade: {
						pure: "#6B7280",
						pureShade: "#4B5563",
						text: "#374151",
						contrastText: "#F9FAFB",
						textShade: "#1F2937",
						bg: "#F3F4F6",
						bgShade: "#E5E7EB",
					},
					source: "base",
					hue: 220,
				};
			}
			return manager.requestColor(componentId);
		};
	}, [manager]);

	// Función simplificada para obtener solo el ColorShade
	const getColorShade = useMemo(() => {
		return (componentId: string): ColorShade => {
			return requestColor(componentId).colorShade;
		};
	}, [requestColor]);

	// Obtener análisis
	const analysis = useMemo(() => {
		return manager?.getPaletteAnalysis() || null;
	}, [manager]);

	// Obtener todos los slots
	const slots = useMemo(() => {
		return manager?.getAllSlots() || [];
	}, [manager]);

	// Generar paleta
	const generatePalette = useMemo(() => {
		return (count: number): ColorShade[] => {
			if (!manager) return [];
			return manager.generateHarmonicPalette(count);
		};
	}, [manager]);

	return {
		requestColor,
		getColorShade,
		analysis,
		slots,
		generatePalette,
		isReady: !!manager,
	};
}

/**
 * Hook para obtener un color específico para un componente
 * Versión simplificada de useHarmonicColors para un solo componente
 */
export function useComponentColor(componentId: string): {
	colorShade: ColorShade;
	source: "base" | "semantic" | "harmonic";
	isReady: boolean;
} {
	const { requestColor, isReady } = useHarmonicColors();
	
	const slot = useMemo(() => {
		return requestColor(componentId);
	}, [requestColor, componentId]);

	return {
		colorShade: slot.colorShade,
		source: slot.source,
		isReady,
	};
}

export default useHarmonicColors;
