//. 📍 lib/cognetica-forense/exportacion/index.ts
/**
 * Re-exportaciones del módulo de exportación Obsidian-friendly.
 */
export {
	generarYamlFrontmatter,
	extraerSemillas,
	generarSeccionesRelacionadas,
	generarDescargaObsidian,
	ajustarHeadings,
	generarTriadaObsidian,
} from "./descarga-obsidian";

export type {
	TipoSeccionDescarga,
	FrontmatterObsidian,
	ReferenciaExport,
	MencionExport,
	MencionesExport,
	TriadaParams,
	TriadaResult,
} from "./descarga-obsidian";
