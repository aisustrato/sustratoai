//. 📍 app/cognetica/useDimensionesVisibles.ts
/**
 * Hook de preferencias UI para el directorio raíz de Cognética: qué
 * dimensiones de menciones mostrar en las tarjetas (y en qué modo).
 *
 * Estado persistido en `localStorage`:
 *   - `visibles`: `Set<DimensionKey>` — dimensiones que aparecen en el
 *     resumen de cada tarjeta.
 *   - `modo`: "counter" (solo cuenta) | "expandido" (nombres + cuenta).
 *
 * **Default conservador:** todas las dimensiones visibles, modo `counter`.
 * El usuario expande a modo "nombres" cuando quiere escanear el
 * contenido conceptual sin entrar al artefacto.
 *
 * ARQUITECTURA SIMPLIFICADA (Fix Hongo):
 * - useState inicializado desde leerStorage()
 * - useEffect que escribe a storage cuando estado cambia
 * - Callbacks con setState puro, sin side effects en updaters
 * - NO hay pub-sub (el hook se usa solo en page.tsx)
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useCallback, useEffect, useState } from "react";

import {
	DIMENSIONES,
	type DimensionKey,
} from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
//#endregion ![head]

//#region [def] - 📦 TIPOS Y CONSTANTES 📦
export type ModoVistaDimensiones = "counter" | "expandido";

export interface PreferenciasDimensiones {
	visibles: Set<DimensionKey>;
	modo: ModoVistaDimensiones;
}

const STORAGE_KEY = "cognetica.raiz.dimensiones.v1";

/** Estado default: todas visibles, modo compacto. */
function estadoDefault(): PreferenciasDimensiones {
	return {
		visibles: new Set(DIMENSIONES.map((d) => d.key)),
		modo: "counter",
	};
}
//#endregion ![def]

//#region [helpers] - 🛠️ PERSISTENCIA 🛠️
/**
 * Persistimos como objeto plano (localStorage no guarda Sets). Al leer,
 * validamos cada clave contra `DIMENSIONES` para no corromper el estado
 * si el usuario vino con una versión anterior con otras dimensiones.
 */
interface EstadoSerializable {
	visibles: string[];
	modo: ModoVistaDimensiones;
}

function leerStorage(): PreferenciasDimensiones {
	if (typeof window === "undefined") return estadoDefault();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return estadoDefault();
		const parsed = JSON.parse(raw) as Partial<EstadoSerializable>;
		const clavesValidas = new Set(DIMENSIONES.map((d) => d.key));
		const visibles = new Set<DimensionKey>(
			Array.isArray(parsed.visibles) ?
				parsed.visibles.filter(
					(v): v is DimensionKey =>
						typeof v === "string" && clavesValidas.has(v as DimensionKey),
				)
			:	Array.from(clavesValidas),
		);
		const modo: ModoVistaDimensiones =
			parsed.modo === "expandido" ? "expandido" : "counter";
		return { visibles, modo };
	} catch {
		return estadoDefault();
	}
}

function escribirStorage(estado: PreferenciasDimensiones): void {
	if (typeof window === "undefined") return;
	try {
		const payload: EstadoSerializable = {
			visibles: Array.from(estado.visibles),
			modo: estado.modo,
		};
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		console.log("[useDimensionesVisibles] Guardado en localStorage:", payload);
	} catch {
		// localStorage puede fallar por cuota o privacidad; silencioso.
	}
}
//#endregion ![helpers]

//#region [main] - 🔧 HOOK 🔧
export function useDimensionesVisibles(): PreferenciasDimensiones & {
	toggleDimension: (key: DimensionKey) => void;
	setModo: (modo: ModoVistaDimensiones) => void;
	mostrarTodas: () => void;
	ocultarTodas: () => void;
} {
	// Estado inicial: leer directamente de localStorage (o default si SSR/error)
	const [estado, setEstado] = useState<PreferenciasDimensiones>(() => {
		const inicial = leerStorage();
		console.log("[useDimensionesVisibles] Estado inicial:", {
			visibles: Array.from(inicial.visibles),
			modo: inicial.modo,
			source: typeof window !== "undefined" ? "localStorage" : "default (SSR)",
		});
		return inicial;
	});

	// Persistencia cuando el estado cambia
	useEffect(() => {
		console.log("[useDimensionesVisibles] Persistiendo:", {
			visibles: Array.from(estado.visibles),
			modo: estado.modo,
		});
		escribirStorage(estado);
	}, [estado]);

	// Callbacks puros: solo setState, sin side effects
	const toggleDimension = useCallback((key: DimensionKey) => {
		console.log("[useDimensionesVisibles] toggleDimension llamado:", key);
		setEstado((prev) => {
			const nextVisibles = new Set(prev.visibles);
			if (nextVisibles.has(key)) {
				nextVisibles.delete(key);
				console.log("[useDimensionesVisibles] Eliminada:", key);
			} else {
				nextVisibles.add(key);
				console.log("[useDimensionesVisibles] Agregada:", key);
			}
			return { ...prev, visibles: nextVisibles };
		});
	}, []);

	const setModo = useCallback((modo: ModoVistaDimensiones) => {
		console.log("[useDimensionesVisibles] setModo llamado:", modo);
		setEstado((prev) => ({ ...prev, modo }));
	}, []);

	const mostrarTodas = useCallback(() => {
		console.log("[useDimensionesVisibles] mostrarTodas llamado");
		setEstado((prev) => ({
			...prev,
			visibles: new Set(DIMENSIONES.map((d) => d.key)),
		}));
	}, []);

	const ocultarTodas = useCallback(() => {
		console.log("[useDimensionesVisibles] ocultarTodas llamado");
		setEstado((prev) => ({ ...prev, visibles: new Set() }));
	}, []);

	return {
		visibles: estado.visibles,
		modo: estado.modo,
		toggleDimension,
		setModo,
		mostrarTodas,
		ocultarTodas,
	};
}
//#endregion ![main]
