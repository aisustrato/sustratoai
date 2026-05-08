/**
 * Helper para persistir referencias bibliográficas extraídas por el Destilado v2.
 *
 * Lógica:
 * - Upsert de referencias canónicas en `cgt_referencias` (project-level)
 * - Insert de relación artefacto-referencia en `cgt_artefactos_referencias`
 * - Deduplicación por hash del extractor (idempotente)
 *
 * Sub-paso 6.4: Persistencia de referencias bibliográficas
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { createHash } from "crypto";

/**
 * Estructura de referencia tal como la devuelve el LLM (Destilado v2).
 */
export interface ReferenciaBibliograficaLLM {
	numero_en_artefacto?: number | null;
	titulo?: string | null;
	autores?: string[];
	ano?: string | null;
	doi?: string | null;
	isbn?: string | null;
	url?: string | null;
	fuente?: string | null;
	tipo_referencia?:
		| "paper"
		| "libro"
		| "web"
		| "dataset"
		| "video"
		| "norma_legal"
		| "reporte"
		| "otro"
		| "desconocido"
		| null;
	apariciones_en_artefacto?: {
		linea_aprox?: number;
		contexto_local?: string;
		co_citadas?: number[];
	}[];
	confianza_extraccion?: number;
	notas_extractor?: string | null;
}

interface PersistirReferenciasInput {
	referencias: ReferenciaBibliograficaLLM[];
	artefactoId: string;
	projectId: string;
	formatoCitaInline: string | null;
}

interface PersistirReferenciasResult {
	ok: boolean;
	insertadas: number;
	duplicados: number;
	errores: number;
	detalles?: string;
}

/**
 * Calcula hash único para deduplicación de referencias por artefacto.
 * Basado en número_en_artefacto + URL/DOI/título normalizado.
 */
function calcularHashReferencia(
	ref: ReferenciaBibliograficaLLM,
	artefactoId: string,
): string {
	const normalizado = [
		artefactoId,
		ref.numero_en_artefacto ?? "no-num",
		ref.url ?? ref.doi ?? ref.titulo ?? "sin-identificador",
	]
		.join("|")
		.toLowerCase()
		.trim();
	return createHash("sha256").update(normalizado).digest("hex").slice(0, 32);
}

/**
 * Normaliza URL para comparación (quita trailing slashes, query params de tracking, etc).
 */
function normalizarUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	try {
		const u = new URL(url.trim());
		// Quita query params de tracking comunes
		const trackingParams = [
			"utm_source",
			"utm_medium",
			"utm_campaign",
			"utm_content",
			"fbclid",
			"gclid",
		];
		trackingParams.forEach((p) => u.searchParams.delete(p));
		return u.toString().toLowerCase();
	} catch {
		return url.trim().toLowerCase();
	}
}

/**
 * Persiste referencias bibliográficas en las tablas `cgt_referencias` y `cgt_artefactos_referencias`.
 * Idempotente: re-ejecuciones con las mismas referencias no duplican.
 */
export async function persistirReferenciasBibliograficas(
	supabase: SupabaseClient<Database>,
	input: PersistirReferenciasInput,
): Promise<PersistirReferenciasResult> {
	const { referencias, artefactoId, projectId, formatoCitaInline } = input;

	if (!Array.isArray(referencias) || referencias.length === 0) {
		return { ok: true, insertadas: 0, duplicados: 0, errores: 0 };
	}

	let insertadas = 0;
	let duplicados = 0;
	let errores = 0;

	// Procesar cada referencia secuencialmente para evitar race conditions
	for (const ref of referencias) {
		const hashExtractor = calcularHashReferencia(ref, artefactoId);

		try {
			// 1. Verificar si ya existe esta relación artefacto-referencia (idempotencia)
			const { data: existente } = await supabase
				.from("cgt_artefactos_referencias")
				.select("id")
				.eq("artefacto_id", artefactoId)
				.eq("hash_extractor_crudo", hashExtractor)
				.maybeSingle();

			if (existente) {
				duplicados++;
				continue;
			}

			// 2. Buscar o crear referencia canónica en cgt_referencias
			// Matching por URL/DOI normalizado + project_id
			const urlNormalizada = normalizarUrl(ref.url);
			const matchKey = urlNormalizada ?? ref.doi?.trim() ?? null;

			let referenciaId: string;

			if (matchKey) {
				// Intentar encontrar referencia existente en el proyecto
				const { data: refExistente } = await supabase
					.from("cgt_referencias")
					.select("id")
					.eq("project_id", projectId)
					.or(`url_normalizada.eq.${matchKey},doi.eq.${ref.doi ?? "null"}`)
					.maybeSingle();

				if (refExistente) {
					referenciaId = refExistente.id;
				} else {
					// Crear nueva referencia canónica
					const { data: nuevaRef, error: insertRefError } = await supabase
						.from("cgt_referencias")
						.insert({
							project_id: projectId,
							titulo: ref.titulo?.trim() ?? null,
							autores: (ref.autores ?? []) as Json,
							ano: ref.ano?.trim() ?? null,
							doi: ref.doi?.trim() ?? null,
							isbn: ref.isbn?.trim() ?? null,
							url: ref.url?.trim() ?? null,
							url_normalizada: urlNormalizada,
							fuente: ref.fuente?.trim() ?? null,
							tipo_referencia:
								(ref.tipo_referencia as
									| Database["public"]["Enums"]["cgt_tipo_referencia"]
									| undefined) ?? "desconocido",
							aliases: [] as Json,
							descripcion_canonica: null,
						})
						.select("id")
						.single();

					if (insertRefError || !nuevaRef) {
						console.error(
							"[persistirReferencias] Error creando referencia canónica:",
							insertRefError,
						);
						errores++;
						continue;
					}
					referenciaId = nuevaRef.id;
				}
			} else {
				// Sin URL ni DOI: crear referencia con match por título + autores + año
				const { data: refPorTitulo } = await supabase
					.from("cgt_referencias")
					.select("id")
					.eq("project_id", projectId)
					.eq("titulo", ref.titulo?.trim() ?? "")
					.eq("ano", ref.ano?.trim() ?? "")
					.maybeSingle();

				if (refPorTitulo) {
					referenciaId = refPorTitulo.id;
				} else {
					// Crear nueva referencia sin identificador único
					const { data: nuevaRef, error: insertRefError } = await supabase
						.from("cgt_referencias")
						.insert({
							project_id: projectId,
							titulo: ref.titulo?.trim() ?? null,
							autores: (ref.autores ?? []) as Json,
							ano: ref.ano?.trim() ?? null,
							doi: null,
							isbn: ref.isbn?.trim() ?? null,
							url: ref.url?.trim() ?? null,
							url_normalizada: null,
							fuente: ref.fuente?.trim() ?? null,
							tipo_referencia:
								(ref.tipo_referencia as
									| Database["public"]["Enums"]["cgt_tipo_referencia"]
									| undefined) ?? "desconocido",
							aliases: [] as Json,
							descripcion_canonica: null,
						})
						.select("id")
						.single();

					if (insertRefError || !nuevaRef) {
						console.error(
							"[persistirReferencias] Error creando referencia sin ID:",
							insertRefError,
						);
						errores++;
						continue;
					}
					referenciaId = nuevaRef.id;
				}
			}

			// 3. Crear relación artefacto-referencia
			const { error: insertRelError } = await supabase
				.from("cgt_artefactos_referencias")
				.insert({
					project_id: projectId,
					artefacto_id: artefactoId,
					referencia_id: referenciaId,
					numero_en_artefacto: ref.numero_en_artefacto ?? null,
					formato_cita_inline: formatoCitaInline,
					apariciones: (ref.apariciones_en_artefacto ?? []) as Json,
					confianza_extraccion: Math.min(
						1,
						Math.max(0, ref.confianza_extraccion ?? 0.5),
					),
					notas_extractor: ref.notas_extractor?.trim() ?? null,
					hash_extractor_crudo: hashExtractor,
				});

			if (insertRelError) {
				console.error(
					"[persistirReferencias] Error creando relación artefacto-referencia:",
					insertRelError,
				);
				errores++;
				continue;
			}

			insertadas++;
		} catch (err) {
			console.error("[persistirReferencias] Error procesando referencia:", err);
			errores++;
		}
	}

	return {
		ok: errores === 0,
		insertadas,
		duplicados,
		errores,
		detalles:
			errores > 0 ? `${errores} errores durante la persistencia` : undefined,
	};
}
