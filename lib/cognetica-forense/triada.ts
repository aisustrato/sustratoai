//. 📍 lib/cognetica-forense/triada.ts
/**
 * Generación de la **Tríada Canónica**: JSON + YAML + MD.
 *
 * El **JSON canónico** (determinístico) es la fuente de verdad y su
 * SHA-256 es el identificador único del contenido del artefacto (columna
 * `cgt_artefactos.sha256_json`). El YAML y MD son renders humano-legibles
 * derivados del mismo objeto `TriadaCanonica`.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import yaml from "js-yaml";

import type {
	CgtTipoArtefacto,
	TriadaCanonica,
} from "./cognetica_forense_types";
import { sha256Hex } from "./hash";
import type { MarkdownArtefactoParseado } from "./parsers/markdown";
import { canonicalStringify } from "./utils/json-canonical";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
export type { TriadaCanonica };

export interface TriadaGenerada {
	md: string;
	yaml: string;
	json: string;
	sha256: string;
}

/** Versión del esquema canónico. Cambiar implica invalidar hashes previos. */
export const VERSION_ESQUEMA_TRIADA = "1.0.0";
//#endregion ![def]

//#region [main] - 🔧 CONSTRUCCIÓN DE TRÍADA 🔧
/**
 * Construye los tres formatos (md, yaml, json) + sha256 a partir del
 * objeto canónico. El hash se calcula sobre el **JSON canónico**, no
 * sobre md ni yaml (esos pueden reformatearse sin invalidar identidad).
 */
export async function construirTriada(
	triada: TriadaCanonica,
): Promise<TriadaGenerada> {
	const json = canonicalStringify(triada);
	const sha256 = await sha256Hex(json);
	const yamlOut = toYaml(triada);
	const md = toMarkdown(triada);
	return { md, yaml: yamlOut, json, sha256 };
}

/**
 * Calcula el SHA-256 de la **identidad canónica** del artefacto: el JSON
 * determinístico del contenido parseado + tipo + título + descripción +
 * metadata externa. **Excluye** `fecha_ingesta` y cualquier salida de
 * metabolización, para que dos ingestas del mismo archivo produzcan el
 * mismo hash y la deduplicación por `(project_id, sha256_json)` funcione.
 *
 * Esta es la semántica aclarada por Hongo (ver
 * `docs/cognetica/PREGUNTA_A_HONGO_triada_en_ingesta.md`): `sha256_json`
 * identifica el **contenido parseado**, no el paquete tríada completo.
 */
export async function hashContenidoCanonico(params: {
	tipo: CgtTipoArtefacto;
	titulo: string;
	descripcion: string | null;
	contenido_estructurado: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}): Promise<string> {
	const identidad = {
		version_esquema: VERSION_ESQUEMA_TRIADA,
		tipo: params.tipo,
		titulo: params.titulo,
		descripcion: params.descripcion,
		contenido_estructurado: params.contenido_estructurado,
		metadata: params.metadata ?? {},
	};
	return sha256Hex(canonicalStringify(identidad));
}

/**
 * Helper específico para artefactos tipo `markdown`: arma el objeto
 * `TriadaCanonica` a partir del parse estructurado + metadata externa.
 *
 * **Nota Oleada 1+**: esta función solo se usa en el flujo de exportación
 * on-demand (`exportarTriada`). En ingesta se usa `hashContenidoCanonico`
 * directamente — la tríada completa no se materializa hasta la descarga.
 *
 * `fecha_ingesta` debe ser provista por el caller (típicamente
 * `new Date().toISOString()` en el momento de la Server Action). Viaja
 * dentro del objeto para trazabilidad pero **no participa** del hash de
 * identidad: ver `hashContenidoCanonico`.
 */
export function triadaCanonicaDesdeMarkdown(params: {
	titulo: string;
	descripcion: string | null;
	parsed: MarkdownArtefactoParseado;
	metadata?: Record<string, unknown>;
	fecha_ingesta: string;
}): TriadaCanonica {
	const tipo: CgtTipoArtefacto = "markdown";

	// `contenido_estructurado` es lo que efectivamente define la identidad
	// del artefacto de cara al hash: cuerpo + frontmatter + headers.
	const contenido_estructurado: Record<string, unknown> = {
		contenido: params.parsed.contenido,
		frontmatter: params.parsed.frontmatter,
		headers: params.parsed.headers,
	};

	return {
		version_esquema: VERSION_ESQUEMA_TRIADA,
		tipo,
		titulo: params.titulo,
		descripcion: params.descripcion,
		contenido_estructurado,
		metadata: params.metadata ?? {},
		fecha_ingesta: params.fecha_ingesta,
	};
}
//#endregion ![main]

//#region [helpers] - 🛠️ RENDERIZADOS 🛠️
/**
 * Serialización YAML legible del objeto canónico.
 *
 * `js-yaml` con `sortKeys: true` produce salida estable (claves en orden
 * alfabético) — consistente con el JSON canónico de `canonicalStringify`,
 * aunque el hash sigue basándose en el JSON, no en el YAML.
 *
 * `lineWidth: -1` evita el wrapping automático que haría las cadenas
 * multilinea menos legibles en inspección humana.
 */
function toYaml(triada: TriadaCanonica): string {
	return yaml.dump(triada, {
		sortKeys: true,
		lineWidth: -1,
		noRefs: true,
	});
}

/**
 * Renderizado Markdown humano-legible del objeto canónico.
 *
 * Formato: título + descripción + metadatos básicos + sección dedicada
 * al `contenido_estructurado` según el tipo. Para `markdown`, se emite
 * el cuerpo original; para otros tipos, se emite un bloque de código
 * JSON con la estructura (ampliable cuando se implemente cada tipo).
 */
function toMarkdown(triada: TriadaCanonica): string {
	const lineas: string[] = [];

	lineas.push(`# ${triada.titulo}`, "");
	if (triada.descripcion) {
		lineas.push(triada.descripcion, "");
	}

	lineas.push(
		"> **Tipo:** " + triada.tipo,
		"> **Versión esquema:** " + triada.version_esquema,
		"> **Fecha ingesta:** " + triada.fecha_ingesta,
		"",
	);

	if (triada.tipo === "markdown") {
		const contenido = triada.contenido_estructurado.contenido;
		if (typeof contenido === "string") {
			lineas.push("## Contenido original", "", contenido);
		}
	} else {
		lineas.push(
			"## Contenido estructurado",
			"",
			"```json",
			JSON.stringify(triada.contenido_estructurado, null, 2),
			"```",
		);
	}

	return lineas.join("\n");
}
//#endregion ![helpers]
