//. 📍 lib/cognetica-forense/exportacion/descarga-obsidian.ts
/**
 * Utilidades de exportación Obsidian-friendly para Cognética Forense.
 *
 * Genera archivos Markdown con frontmatter YAML que incluyen:
 * - SHA256 canónico del artefacto (certificación de contenido)
 * - SHA256 de la descarga (certificación del archivo exacto)
 * - Tags del proyecto y menciones como semillas (para grafo en Obsidian)
 * - Wikilinks a secciones relacionadas (conexión bidireccional)
 *
 * Fase 1 del plan de descargas Obsidian-friendly (2026-05-06).
 * Triada de artefacto completo (plan NH 2026-05-06).
 */

import { sha256Hex } from "@/lib/cognetica-forense/hash";

//#region [def] - 📦 TYPES 📦

/** Tipos de sección descargable. */
export type TipoSeccionDescarga =
	| "transcripcion"
	| "cronica"
	| "destilado"
	| "nucleo"
	| "germinal"
	| "referencias"
	| "menciones";

/** Frontmatter completo de exportación Obsidian-friendly. */
export interface FrontmatterObsidian {
	titulo: string;
	proyecto: string;
	proyecto_id: string;
	tipo_artefacto: string;
	tipo_seccion: TipoSeccionDescarga;
	sha256_artefacto: string;
	sha256_descarga: string;
	fecha_descarga: string;
	plataforma: "sustrato.ai";
	modulo: "cognetica";
	tags: string[];
	aliases: string[];
}

interface GenerarDescargaParams {
	/** Título del artefacto. */
	titulo: string;
	/** Nombre legible del proyecto. */
	proyecto: string;
	/** UUID del proyecto. */
	proyectoId: string;
	/** Tipo del artefacto (ej. "audio_entrevista", "pdf_informe"). */
	tipoArtefacto: string;
	/** Tipo de sección. */
	tipoSeccion: TipoSeccionDescarga;
	/** SHA256 canónico del artefacto (`cgt_artefactos.sha256_json`). */
	sha256Artefacto: string;
	/** Contenido Markdown de la sección (sin frontmatter). */
	contenidoMD: string;
	/** Tags extraídos de menciones (opcional). */
	semillas?: string[];
}

//#endregion ![def]

//#region [helpers] - 🛠️ LABELS 🛠️

/** Etiqueta legible para cada tipo de sección. */
const ETIQUETA_SECCION: Record<TipoSeccionDescarga, string> = {
	transcripcion: "Transcripción",
	cronica: "Crónica",
	destilado: "Destilado",
	nucleo: "Núcleo",
	germinal: "Germinal",
	referencias: "Referencias",
	menciones: "Menciones",
};

/** Orden de secciones para el footer de wikilinks. */
const ORDEN_SECCIONES: TipoSeccionDescarga[] = [
	"transcripcion",
	"cronica",
	"destilado",
	"nucleo",
	"germinal",
	"referencias",
	"menciones",
];

//#endregion ![helpers]

//#region [api] - 🔧 FRONTMATTER YAML 🔧

/**
 * Serializa `FrontmatterObsidian` a string YAML.
 * Sin dependencias externas — template string puro.
 */
export function generarYamlFrontmatter(fm: FrontmatterObsidian): string {
	const escape = (s: string): string => {
		// YAML: escapar comillas dobles y saltos de línea
		return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
	};

	const lines: string[] = ["---"];
	lines.push(`titulo: "${escape(fm.titulo)}"`);
	lines.push(`proyecto: "${escape(fm.proyecto)}"`);
	lines.push(`proyecto_id: "${escape(fm.proyecto_id)}"`);
	lines.push(`tipo_artefacto: "${escape(fm.tipo_artefacto)}"`);
	lines.push(`tipo_seccion: "${fm.tipo_seccion}"`);
	lines.push(`sha256_artefacto: "${fm.sha256_artefacto}"`);
	lines.push(`sha256_descarga: "${fm.sha256_descarga}"`);
	lines.push(`fecha_descarga: "${fm.fecha_descarga}"`);
	lines.push(`plataforma: "${fm.plataforma}"`);
	lines.push(`modulo: "${fm.modulo}"`);

	// Tags: primero el proyecto, luego semillas
	lines.push("tags:");
	lines.push(`  - "proyecto/${escape(fm.proyecto)}"`);
	for (const tag of fm.tags) {
		const t = tag.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		lines.push(`  - "${t}"`);
	}

	// Aliases
	lines.push("aliases:");
	lines.push(`  - "${escape(fm.titulo)}"`);
	lines.push(`  - "${ETIQUETA_SECCION[fm.tipo_seccion]}: ${escape(fm.titulo)}"`);
	if (fm.aliases.length > 0) {
		for (const alias of fm.aliases) {
			const a = alias.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
			lines.push(`  - "${a}"`);
		}
	}

	lines.push("---");
	return lines.join("\n");
}

//#endregion ![api]

//#region [api] - 🔧 SEMILLAS DESDE MENCIONES 🔧

/**
 * Extrae tags con prefijo de dimensión desde las menciones cartografiadas.
 *
 * Formato:
 *   "pensador/María González"
 *   "concepto/resiliencia"
 *   "teoria/constructivismo social"
 *   "disciplina/filosofía"
 *   "cita/texto truncado..."
 *
 * Esto garantiza que en Obsidian el grafo conecte artefactos del mismo
 * proyecto que comparten pensadores o conceptos.
 */
export function extraerSemillas(
	menciones: Record<string, { valor_canonico: { nombre_canonico_actual?: string | null; texto_canonico_actual?: string | null } }[]>,
): string[] {
	const tags: string[] = [];

	for (const [dimension, items] of Object.entries(menciones)) {
		if (!Array.isArray(items)) continue;

		const prefijoMap: Record<string, string> = {
			pensadores: "pensador",
			disciplinas: "disciplina",
			conceptos: "concepto",
			teorias: "teoria",
			citas: "cita",
		};

		const prefijo = prefijoMap[dimension] ?? dimension;

		for (const item of items) {
			const vc = item.valor_canonico;
			let nombre = vc.nombre_canonico_actual ?? null;
			if (!nombre && vc.texto_canonico_actual) {
				nombre =
					vc.texto_canonico_actual.length > 60 ?
						`${vc.texto_canonico_actual.slice(0, 59)}…`
					:	vc.texto_canonico_actual;
			}
			if (nombre) {
				tags.push(`${prefijo}/${nombre}`);
			}
		}
	}

	return tags;
}

//#endregion ![api]

//#region [api] - 🔧 SECCIONES RELACIONADAS 🔧

/**
 * Genera el footer con wikilinks a las otras secciones del mismo artefacto.
 *
 * Obsidian resuelve `[[Nombre]]` contra archivos `.md` en el vault.
 * Si el archivo destino no existe, Obsidian lo muestra como "nota futura"
 * (punto hueco en el grafo) — comportamiento estándar, no es un error.
 */
export function generarSeccionesRelacionadas(
	titulo: string,
	tipoActual: TipoSeccionDescarga,
): string {
	const partes: string[] = [];

	const secciones: TipoSeccionDescarga[] = ORDEN_SECCIONES.filter(
		(s) => s !== tipoActual,
	);

	if (secciones.length === 0) return "";

	partes.push("");
	partes.push("---");
	partes.push("");
	partes.push("## 🔗 Secciones relacionadas");
	partes.push("");

	for (const s of secciones) {
		const label = ETIQUETA_SECCION[s];
		// Wikilink sin extensión .md — Obsidian resuelve automáticamente
		partes.push(`- [[${label} - ${titulo}]]`);
	}

	return partes.join("\n");
}

//#endregion ![api]

//#region [api] - 🔧 GENERADOR PRINCIPAL 🔧

/**
 * Genera un archivo Markdown listo para descargar con:
 *   1. Frontmatter YAML (proyecto, SHAs, tags, etc.)
 *   2. Contenido Markdown de la sección
 *   3. Footer con wikilinks a secciones relacionadas
 *
 * Devuelve el contenido completo y su SHA-256 (que se usa como
 * `sha256_descarga` dentro del propio frontmatter).
 *
 * @example
 * const { contenido, sha256, nombreArchivo } = await generarDescargaObsidian({
 *   titulo: "Entrevista con María",
 *   proyecto: "Investigación TES",
 *   proyectoId: "abc-123",
 *   tipoArtefacto: "audio_entrevista",
 *   tipoSeccion: "cronica",
 *   sha256Artefacto: "a1b2c3d4...",
 *   contenidoMD: "# Crónica\n\n...",
 *   semillas: ["pensador/María", "concepto/resiliencia"],
 * });
 */
export async function generarDescargaObsidian(
	params: GenerarDescargaParams,
): Promise<{
	contenido: string;
	sha256: string;
	nombreArchivo: string;
}> {
	const {
		titulo,
		proyecto,
		proyectoId,
		tipoArtefacto,
		tipoSeccion,
		sha256Artefacto,
		contenidoMD,
		semillas = [],
	} = params;

	// 1. Construir archivo sin sha256_descarga (aún no lo tenemos)
	const label = ETIQUETA_SECCION[tipoSeccion];
	// Sólo el nombre de archivo se sanitiza (guiones bajos para filesystem).
	// El título legible con espacios se usa en frontmatter, aliases y wikilinks.
	const tituloArchivo = titulo.replace(/\s+/g, "_");
	const nombreArchivo = `${label} - ${tituloArchivo}.md`;

	const footer = generarSeccionesRelacionadas(titulo, tipoSeccion);

	// Contenido temporal (sin sha256_descarga en frontmatter)
	const contenidoPreliminar = contenidoMD + footer;

	// 2. Calcular SHA-256 del contenido (sin frontmatter, que será la
	//    última pieza). Pero necesitamos sha256_descarga PARA el frontmatter.
	//    Solución: construir el frontmatter con un placeholder, hashear el
	//    archivo completo, reemplazar el placeholder.
	const placeholder = "__SHA256_DOWNLOAD__";
	const fmPreliminar = generarYamlFrontmatter({
		titulo,
		proyecto,
		proyecto_id: proyectoId,
		tipo_artefacto: tipoArtefacto,
		tipo_seccion: tipoSeccion,
		sha256_artefacto: sha256Artefacto,
		sha256_descarga: placeholder,
		fecha_descarga: new Date().toISOString(),
		plataforma: "sustrato.ai",
		modulo: "cognetica",
		tags: semillas,
		aliases: [],
	});

	const contenidoCompletoPreliminar = `${fmPreliminar}\n${contenidoPreliminar}`;

	// 3. Hashear el archivo completo (con placeholder)
	const hash = await sha256Hex(contenidoCompletoPreliminar);

	// 4. Reconstruir frontmatter con el hash real
	const fmFinal = generarYamlFrontmatter({
		titulo,
		proyecto,
		proyecto_id: proyectoId,
		tipo_artefacto: tipoArtefacto,
		tipo_seccion: tipoSeccion,
		sha256_artefacto: sha256Artefacto,
		sha256_descarga: hash,
		fecha_descarga: new Date().toISOString(),
		plataforma: "sustrato.ai",
		modulo: "cognetica",
		tags: semillas,
		aliases: [],
	});

	const contenidoFinal = `${fmFinal}\n${contenidoPreliminar}`;

	return {
		contenido: contenidoFinal,
		sha256: hash,
		nombreArchivo,
	};
}

//#endregion ![api]

//#region [triada] - 🔧 AJUSTE DE HEADINGS 🔧

/**
 * Incrementa todos los headings Markdown en N niveles.
 *
 * Útil cuando se incrusta contenido que tiene su propio H1 dentro de un
 * documento que ya usa H1 para el título del artefacto.
 * ```ts
 * ajustarHeadings("# Título\n## Sección\n### Sub", 1)
 * // → "## Título\n### Sección\n#### Sub"
 * ```
 * El nivel resultante nunca supera 6 (H6 es el máximo válido).
 */
export function ajustarHeadings(md: string, niveles: number): string {
	if (niveles === 0) return md;
	return md.replace(/^(#{1,6})/gm, (_match, hashes: string) => {
		const nuevo = Math.min(hashes.length + niveles, 6);
		return "#".repeat(nuevo);
	});
}

//#endregion ![triada]

//#region [triada] - 🔧 GENERADOR DE TRÍADA 🔧

/**
 * Datos de una referencia bibliográfica para exportación.
 */
export interface ReferenciaExport {
	id: string;
	numero: number | null;
	titulo: string | null;
	autores: string[];
	ano: number | null;
	fuente: string | null;
	url: string | null;
	tipo: string;
	confianza: number;
}

/**
 * Datos de una mención para exportación.
 */
export interface MencionExport {
	nombre: string;
	decision: string;
	confianza: number | null;
}

/**
 * Datos consolidados de menciones por dimensión.
 */
export interface MencionesExport {
	pensadores: MencionExport[];
	disciplinas: MencionExport[];
	conceptos: MencionExport[];
	teorias: MencionExport[];
	citas: MencionExport[];
}

/**
 * Parámetros para `generarTriadaObsidian`.
 */
export interface TriadaParams {
	artefactoId: string;
	titulo: string;
	proyecto: string;
	proyectoId: string;
	tipoArtefacto: string;
	sha256Artefacto: string;
	tags: string[];

	/** Contenido markdown de cada sección (null = no metabolizada). */
	transcripcionMD: string | null;
	cronicaMD: string | null;
	destiladoMD: string | null;
	nucleoMD: string | null;
	germinalMD: string | null;

	referencias: ReferenciaExport[];
	menciones: MencionesExport;
}

/**
 * Resultado de la tríada: tres formatos listos para descargar.
 */
export interface TriadaResult {
	md: { contenido: string; sha256: string; nombreArchivo: string };
	json: { contenido: string; sha256: string; nombreArchivo: string };
	yaml: { contenido: string; sha256: string; nombreArchivo: string };
}

/**
 * Construye la lista de secciones incluidas y faltantes.
 */
function diagnosticarSecciones(p: TriadaParams): {
	presentes: string[];
	faltantes: string[];
} {
	const mapa: Record<string, string | null> = {
		transcripcion: p.transcripcionMD,
		cronica: p.cronicaMD,
		destilado: p.destiladoMD,
		nucleo: p.nucleoMD,
		germinal: p.germinalMD,
	};
	const presentes: string[] = [];
	const faltantes: string[] = [];
	for (const [clave, val] of Object.entries(mapa)) {
		if (val && val.trim().length > 0) {
			presentes.push(clave);
		} else {
			faltantes.push(clave);
		}
	}
	return { presentes, faltantes };
}

/**
 * Construye el contenido de una sección en el MD completo.
 * El header de sección es SIEMPRE H2 fijo (`## {heading}`) — no se ajusta.
 * Solo el contenido interno recibe ajuste de headings.
 * Si no hay contenido, produce la advertencia estándar.
 */
function seccionEnMD(
	heading: string,
	contenido: string | null,
): string {
	const partes: string[] = [];
	// Header de sección fijo en H2 (NO se ajusta)
	partes.push(`## ${heading}`);
	partes.push("");
	if (contenido && contenido.trim().length > 0) {
		// Solo el contenido interno se ajusta (+1 nivel)
		partes.push(ajustarHeadings(contenido, 1));
	} else {
		partes.push(`> ⚠️ Sección no metabolizada al momento de esta exportación.`);
	}
	partes.push("");
	return partes.join("\n");
}

/**
 * Convierte menciones a markdown para el MD completo.
 * Headers de sección fijos (H2, H3) — solo el contenido interno se ajusta.
 */
function mencionesEnMD(m: MencionesExport): string {
	const partes: string[] = [];
	// H2 fijo, NO se ajusta
	partes.push("## Menciones");
	partes.push("");

	const dims: [string, MencionExport[]][] = [
		["### Pensadores", m.pensadores],
		["### Disciplinas", m.disciplinas],
		["### Conceptos", m.conceptos],
		["### Teorías", m.teorias],
		["### Citas notables", m.citas],
	];

	for (const [label, items] of dims) {
		// H3 fijo, NO se ajusta
		partes.push(label);
		partes.push("");
		if (items.length === 0) {
			partes.push("_Sin menciones en esta dimensión._");
		} else {
			for (const item of items) {
				partes.push(`- **${item.nombre}** — _${item.decision}_`);
			}
		}
		partes.push("");
	}

	return partes.join("\n");
}

/**
 * Convierte referencias a markdown para el MD completo.
 * Header de sección fijo (H2) — contenido interno sin ajuste (no tiene headings).
 */
function referenciasEnMD(refs: ReferenciaExport[]): string {
	const partes: string[] = [];
	// H2 fijo, NO se ajusta
	partes.push("## Referencias");
	partes.push("");

	if (refs.length === 0) {
		partes.push("_No hay referencias bibliográficas._");
	} else {
		for (const r of refs) {
			const num = r.numero !== null ? `[${r.numero}] ` : "";
			const autores =
				r.autores.length > 0 ? `${r.autores.join(", ")}. ` : "";
			const fecha = r.ano ? ` (${r.ano})` : "";
			const fuente = r.fuente ? ` *${r.fuente}*` : "";
			const url = r.url ? `\n  ${r.url}` : "";
			partes.push(`- ${num}**${r.titulo ?? "Sin título"}**. ${autores}${fecha}.${fuente}${url}`);
		}
	}
	partes.push("");
	return partes.join("\n");
}

/**
 * Genera un frontmatter YAML para el MD de la tríada.
 */
function frontmatterTriada(
	p: TriadaParams,
	sha256Descarga: string,
	presentes: string[],
	faltantes: string[],
): string {
	const escape = (s: string): string =>
		s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

	const lines: string[] = ["---"];
	lines.push(`titulo: "${escape(p.titulo)}"`);
	lines.push(`proyecto: "${escape(p.proyecto)}"`);
	lines.push(`proyecto_id: "${escape(p.proyectoId)}"`);
	lines.push(`tipo_artefacto: "${escape(p.tipoArtefacto)}"`);
	lines.push(`tipo_seccion: "completo"`);
	lines.push(`sha256_artefacto: "${p.sha256Artefacto}"`);
	lines.push(`sha256_descarga: "${sha256Descarga}"`);
	lines.push(`fecha_descarga: "${new Date().toISOString()}"`);
	lines.push(`plataforma: "sustrato.ai"`);
	lines.push(`modulo: "cognetica"`);
	lines.push("tags:");
	lines.push(`  - "proyecto/${escape(p.proyecto)}"`);
	for (const tag of p.tags) {
		lines.push(`  - "${tag.replace(/"/g, '\\"')}"`);
	}
	lines.push("secciones_incluidas:");
	for (const s of presentes) {
		lines.push(`  - "${s}"`);
	}
	if (faltantes.length > 0) {
		lines.push("secciones_faltantes:");
		for (const s of faltantes) {
			lines.push(`  - "${s}"`);
		}
	}
	lines.push("aliases:");
	lines.push(`  - "${escape(p.titulo)}"`);
	lines.push("---");
	return lines.join("\n");
}

/**
 * Construye el footer de wikilinks para la tríada.
 */
function footerTriada(titulo: string): string {
	const todas: TipoSeccionDescarga[] = [
		"transcripcion",
		"cronica",
		"destilado",
		"nucleo",
		"germinal",
		"referencias",
		"menciones",
	];
	const lines: string[] = [];
	lines.push("");
	lines.push("---");
	lines.push("");
	lines.push("## 🔗 Secciones individuales");
	lines.push("");
	const labels: Record<string, string> = {
		transcripcion: "Transcripción",
		cronica: "Crónica",
		destilado: "Destilado",
		nucleo: "Núcleo",
		germinal: "Germinal",
		referencias: "Referencias",
		menciones: "Menciones",
	};
	for (const s of todas) {
		lines.push(`- [[${labels[s]} - ${titulo}]]`);
	}
	return lines.join("\n");
}

/**
 * Genera los tres archivos de la tríada (MD, JSON, YAML) a partir del
 * estado actual del artefacto.
 *
 * - El MD usa `ajustarHeadings` para que los H1 de cada sección bajen a H2.
 * - Las secciones no metabolizadas se marcan con advertencia, no bloquean.
 * - Cada formato tiene su propio SHA-256 (son archivos distintos).
 * - Los tres comparten el mismo `sha256_artefacto`.
 */
export async function generarTriadaObsidian(
	p: TriadaParams,
): Promise<TriadaResult> {
	const { presentes, faltantes } = diagnosticarSecciones(p);
	const tituloArchivo = p.titulo.replace(/\s+/g, "_");
	const advertencias = faltantes.map(
		(s) => `${s}: no metabolizado al momento de exportación`,
	);

	// ── 1. Construir MD ──

	const seccionesMD: string[] = [];
	seccionesMD.push(`# ${p.titulo}`);
	seccionesMD.push("");

	seccionesMD.push(seccionEnMD("Transcripción", p.transcripcionMD));
	seccionesMD.push(seccionEnMD("Crónica", p.cronicaMD));
	seccionesMD.push(seccionEnMD("Destilado", p.destiladoMD));
	seccionesMD.push(seccionEnMD("Núcleo", p.nucleoMD));
	seccionesMD.push(seccionEnMD("Germinal", p.germinalMD));
	seccionesMD.push(referenciasEnMD(p.referencias));
	seccionesMD.push(mencionesEnMD(p.menciones));
	seccionesMD.push(footerTriada(p.titulo));

	const cuerpoMD = seccionesMD.join("\n");

	const placeholder = "__SHA256_TRIA_MD__";
	const fmPreliminar = frontmatterTriada(p, placeholder, presentes, faltantes);
	const mdPreliminar = `${fmPreliminar}\n${cuerpoMD}`;
	const sha256MD = await sha256Hex(mdPreliminar);
	const fmFinal = frontmatterTriada(p, sha256MD, presentes, faltantes);
	const mdFinal = `${fmFinal}\n${cuerpoMD}`;

	// ── 2. Construir JSON ──

	type FormatoMD = "transcripcion" | "cronica" | "destilado" | "nucleo" | "germinal";

	const metaJSON: Record<string, unknown> = {
		titulo: p.titulo,
		proyecto: p.proyecto,
		proyecto_id: p.proyectoId,
		tipo_artefacto: p.tipoArtefacto,
		sha256_artefacto: p.sha256Artefacto,
		sha256_descarga: "",
		fecha_descarga: new Date().toISOString(),
		plataforma: "sustrato.ai",
		modulo: "cognetica",
		tags: p.tags,
		secciones_incluidas: presentes,
		secciones_faltantes: faltantes,
	};

	const seccionesJSON: Record<string, string | null> = {
		transcripcion: p.transcripcionMD,
		cronica: p.cronicaMD,
		destilado: p.destiladoMD,
		nucleo: p.nucleoMD,
		germinal: p.germinalMD,
	};

	const jsonObj: Record<string, unknown> = {
		meta: metaJSON,
		secciones: seccionesJSON,
		referencias: p.referencias,
		menciones: p.menciones,
		_advertencias: advertencias,
	};

	const jsonObjPlaceholder = {
		...jsonObj,
		meta: { ...metaJSON, sha256_descarga: placeholder },
	};

	const jsonStrPreliminar = JSON.stringify(jsonObjPlaceholder, null, 2);
	const sha256JSON = await sha256Hex(jsonStrPreliminar);

	metaJSON.sha256_descarga = sha256JSON;
	const jsonObjFinal = {
		meta: metaJSON,
		secciones: seccionesJSON,
		referencias: p.referencias,
		menciones: p.menciones,
		_advertencias: advertencias,
	};
	const jsonStrFinal = JSON.stringify(jsonObjFinal, null, 2);

	// ── 3. Construir YAML ──

	const yamlMeta = { ...metaJSON, sha256_descarga: "" };

	function yamlString(s: string, indent: number): string {
		const pad = "  ".repeat(indent);
		if (s.includes("\n")) {
			return "|\n" + s.split("\n").map((l) => `${pad}  ${l}`).join("\n");
		}
		return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
	}

	function yamlValue(val: unknown, depth: number): string {
		const pad = "  ".repeat(depth);
		if (val === null || val === undefined) return "null";
		if (typeof val === "string") {
			if (val.includes("\n")) {
				return "|\n" + val.split("\n").map((l) => `${pad}  ${l}`).join("\n");
			}
			return yamlString(val, depth);
		}
		if (typeof val === "number" || typeof val === "boolean") return String(val);
		if (Array.isArray(val)) {
			if (val.length === 0) return "[]";
			return "\n" + val.map((v) => `${pad}  - ${yamlValue(v, depth + 2).trimStart()}`).join("\n");
		}
		if (val && typeof val === "object") {
			const entries = Object.entries(val as Record<string, unknown>);
			if (entries.length === 0) return "{}";
			return "\n" + entries.map(([k, v]) => {
				const vs = yamlValue(v, depth + 1);
				const sep = vs.startsWith("|") || vs.startsWith("\n") ? "" : " ";
				return `${pad}  ${k}:${sep}${vs}`;
			}).join("\n");
		}
		return String(val);
	}

	function yamlSerialize(obj: Record<string, unknown>): string {
		return Object.entries(obj)
			.map(([k, v]) => {
				const vs = yamlValue(v, 0);
				const sep = vs.startsWith("|") || vs.startsWith("\n") ? "" : " ";
				return `${k}:${sep}${vs}`;
			})
			.join("\n") + "\n";
	}

	const yamlObjPreliminar: Record<string, unknown> = {
		meta: { ...yamlMeta, sha256_descarga: placeholder },
		secciones: seccionesJSON,
		referencias: p.referencias,
		menciones: p.menciones,
		_advertencias: advertencias,
	};
	const sha256YAML = await sha256Hex(yamlSerialize(yamlObjPreliminar));

	yamlMeta.sha256_descarga = sha256YAML;
	const yamlObjFinal2: Record<string, unknown> = {
		meta: yamlMeta,
		secciones: seccionesJSON,
		referencias: p.referencias,
		menciones: p.menciones,
		_advertencias: advertencias,
	};
	const yamlStrFinal = yamlSerialize(yamlObjFinal2);

	return {
		md: {
			contenido: mdFinal,
			sha256: sha256MD,
			nombreArchivo: `${tituloArchivo}.md`,
		},
		json: {
			contenido: jsonStrFinal,
			sha256: sha256JSON,
			nombreArchivo: `${tituloArchivo}.json`,
		},
		yaml: {
			contenido: yamlStrFinal,
			sha256: sha256YAML,
			nombreArchivo: `${tituloArchivo}.yaml`,
		},
	};
}

//#endregion ![triada]
