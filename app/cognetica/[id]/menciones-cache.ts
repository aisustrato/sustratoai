// 📍 app/cognetica/[id]/menciones-cache.ts
// Cache en memoria (por artefacto) de las menciones de entidades nombradas que
// usa el visor MDJ para resaltar. Carga UNA sola vez por artefacto y la
// comparten las 5 secciones de texto; además permite precargar en segundo plano
// (prefetch) aunque los acordeones estén cerrados.
//
// Vive durante la sesión del cliente. No tiene invalidación: las menciones no
// cambian durante la lectura (la edición humana es de una fase posterior).

import {
	listarMencionesPorArtefacto,
	type MencionConValorCanonico,
} from "@/lib/actions/cognetica-forense-menciones-actions";

const TIPOS = ["pensador", "concepto", "teoria", "disciplina", "cita"] as const;

const cache = new Map<string, Promise<MencionConValorCanonico[]>>();

async function cargar(artefactoId: string): Promise<MencionConValorCanonico[]> {
	const resultados = await Promise.all(
		TIPOS.map((tipo) => listarMencionesPorArtefacto(artefactoId, tipo)),
	);
	return resultados.flatMap((res, i) => {
		if (res.ok) return res.data;
		// Degradación: si un tipo falla, se resaltan los demás.
		console.error(`[cognetica:visor-mdj] listar ${TIPOS[i]}:`, res);
		return [];
	});
}

/** Devuelve (y cachea) las menciones de entidades del artefacto. */
export function cargarMencionesEntidades(
	artefactoId: string,
): Promise<MencionConValorCanonico[]> {
	let p = cache.get(artefactoId);
	if (!p) {
		p = cargar(artefactoId);
		cache.set(artefactoId, p);
	}
	return p;
}

/** Dispara la carga en segundo plano (fire-and-forget). */
export function prefetchMencionesEntidades(artefactoId: string): void {
	void cargarMencionesEntidades(artefactoId).catch(() => {
		/* el error ya se loguea en cargar() */
	});
}
