// 📍 lib/cognetica-forense/documentos-markdown.ts
// Builders del markdown de cada documento del artefacto (destilado / núcleo).
//
// FUENTE ÚNICA DE VERDAD del MD: lo usa el visor (DocumentoMdjViewer) Y el
// resolver de direcciones. Deben coincidir EXACTO para que los `nodo_id` del
// árbol MDJ que persiste el resolver casen con los que parsea el visor.
//
// Crónica = cronica.contenido, Germinal = germinal.resumen, Original =
// contenidoMarkdown (directos, no necesitan builder).

import type { CgtDestilado, CgtNucleo, CgtMovimiento, CgtTension } from "./types";

/** Markdown del Destilado (mismo formato que la vista). */
export function construirMdDestilado(d: CgtDestilado): string {
	const movs: CgtMovimiento[] = Array.isArray(d.movimientos) ? d.movimientos : [];
	const tens: CgtTension[] = Array.isArray(d.tensiones) ? d.tensiones : [];
	const partes: string[] = [];
	if (d.tesis) partes.push(`# Tesis\n\n${d.tesis}`);
	if (movs.length > 0) {
		const movimientosMd = movs
			.map((m) => `${m.orden}. **${m.desde} → ${m.hacia}**: ${m.texto}`)
			.join("\n");
		partes.push(`# Movimientos (${movs.length})\n\n${movimientosMd}`);
	}
	if (tens.length > 0) {
		const tensionesMd = tens.map((t) => `- *[${t.tipo}]* ${t.texto}`).join("\n");
		partes.push(`# Tensiones (${tens.length})\n\n${tensionesMd}`);
	}
	if (d.cita_nucleo) {
		const citaMd = [
			`> "${d.cita_nucleo.texto}"`,
			`> — ${d.cita_nucleo.ubicacion}${d.cita_nucleo.autor ? ` · ${d.cita_nucleo.autor}` : ""}`,
		].join("\n");
		partes.push(`# Cita núcleo\n\n${citaMd}`);
	}
	return partes.join("\n\n---\n\n");
}

/** Markdown del Núcleo (mismo formato que la vista). */
export function construirMdNucleo(n: CgtNucleo): string {
	const movs = Array.isArray(n.movimientos_esenciales) ? n.movimientos_esenciales : [];
	const partes: string[] = [];
	if (n.tesis) partes.push(`# Tesis\n\n${n.tesis}`);
	if (movs.length > 0) {
		const movimientosMd = movs.map((m) => `${m.orden}. ${m.texto}`).join("\n");
		partes.push(`# Movimientos esenciales (${movs.length})\n\n${movimientosMd}`);
	}
	if (n.tension_irreductible) {
		partes.push(`# Tensión irreductible\n\n${n.tension_irreductible}`);
	}
	if (n.cita_nucleo) partes.push(`# Cita núcleo\n\n> "${n.cita_nucleo.texto}"`);
	return partes.join("\n\n---\n\n");
}
