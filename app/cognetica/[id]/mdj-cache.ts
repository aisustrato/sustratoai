// 📍 app/cognetica/[id]/mdj-cache.ts
// Dedup (por artefacto) del horneado lazy del MDJ. Lo usa el visor SOLO cuando un
// documento todavía está en MD plano (legacy): hornea+pisa una vez y comparte el
// resultado entre las secciones. Los artefactos ya horneados pintan en frío desde
// su propio contenido, sin pasar por acá.

import {
	asegurarMdjArtefacto,
	type MdjPorDocumento,
} from "@/lib/actions/cognetica-forense-direcciones-actions";

const cache = new Map<string, Promise<MdjPorDocumento>>();

async function ejecutar(artefactoId: string): Promise<MdjPorDocumento> {
	const res = await asegurarMdjArtefacto(artefactoId);
	if (!res.ok) {
		// Error VISIBLE: se loguea con contexto y se lanza para que el visor lo
		// muestre. Nunca devolver vacío en silencio.
		console.error("[cognetica:visor-mdj] asegurar MDJ:", res.error);
		throw new Error(res.error);
	}
	return res.data;
}

/** Hornea (si hace falta) y devuelve el MDJ por documento, deduplicado por artefacto. */
export function asegurarMdjCacheado(artefactoId: string): Promise<MdjPorDocumento> {
	let p = cache.get(artefactoId);
	if (!p) {
		p = ejecutar(artefactoId);
		p.catch(() => cache.delete(artefactoId)); // no cachear fallos
		cache.set(artefactoId, p);
	}
	return p;
}
