/**
 * Generación de la **Tríada Canónica**: JSON + YAML + MD.
 *
 * El JSON es determinístico (ver `utils/json-canonical`) y su SHA-256 es el
 * identificador único del contenido del artefacto.
 *
 * Stub de Oleada 1: la implementación concreta se completa por tipo de artefacto
 * cuando se active cada pipeline de ingesta. La firma aquí fija el contrato.
 */

import { canonicalStringify } from "./utils/json-canonical";
import { sha256Hex } from "./hash";

export interface TriadaCanonica {
	version_esquema: string;
	tipo: string; // CgtTipoArtefacto cuando types.ts esté completo
	titulo: string;
	descripcion: string | null;
	contenido_estructurado: Record<string, unknown>;
	metadata: Record<string, unknown>;
	fecha_ingesta: string; // ISO timestamp
}

export interface TriadaGenerada {
	md: string;
	yaml: string;
	json: string;
	sha256: string;
}

/**
 * Construye los tres formatos de la tríada a partir del objeto canónico.
 * El hash se calcula sobre el **JSON canónico** (no sobre md ni yaml).
 */
export async function construirTriada(
	triada: TriadaCanonica,
): Promise<TriadaGenerada> {
	const json = canonicalStringify(triada);
	const sha256 = await sha256Hex(json);
	const yaml = toYaml(triada);
	const md = toMarkdown(triada);
	return { md, yaml, json, sha256 };
}

/**
 * Renderizado YAML humano-legible.
 * Stub minimal; ampliar cuando se defina el formato exacto de la tríada-YAML.
 */
function toYaml(triada: TriadaCanonica): string {
	// TODO: implementar serialización YAML legible.
	// Por ahora retorna vacío — el JSON es suficiente para el hash.
	void triada;
	return "";
}

/**
 * Renderizado Markdown humano-legible.
 * Stub minimal; ampliar cuando se defina el formato MD definitivo.
 */
function toMarkdown(triada: TriadaCanonica): string {
	// TODO: implementar serialización Markdown.
	void triada;
	return "";
}
