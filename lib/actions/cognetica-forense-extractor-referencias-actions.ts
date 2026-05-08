/**
 * Server Action: Pipeline de Extracción de Referencias Bibliográficas v1.0
 *
 * Implementa Opción B del Hito 6:
 * 1. Usa conteo del Destilado (total_referencias_detectadas)
 * 2. Extrae referencias con confianza 1-5 y "aporta_contexto"
 * 3. Valida exhaustividad (extraídas vs. esperadas)
 * 4. Reintenta si hay delta (máximo 2 intentos)
 * 5. Persiste en DB con colores por nivel de confianza
 */

"use server";

import { createServerClient } from "@/lib/supabase";
import { callDeepSeek } from "@/lib/deepseek/api";
import { parsearJsonLLM } from "@/lib/cognetica-forense/parsear-json-llm";
import {
	construirPromptExtractorReferencias,
	EXTRACTOR_REFERENCIAS_SYSTEM_PROMPT,
	EXTRACTOR_REFERENCIAS_CONFIG,
} from "@/lib/cognetica-forense/prompts/extractor-referencias-prompt";
import { persistirReferenciasBibliograficas } from "@/lib/cognetica-forense/lib/persistir-referencias-bibliograficas";
import { obtenerContenidoMetabolizable } from "@/lib/cognetica-forense/contenido-metabolizable";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import { ok, fail } from "@/lib/cognetica-forense/types";

export interface ReferenciaExtraida {
	numero_en_artefacto: number | null;
	titulo: string | null;
	autores: string[];
	ano: string | null;
	doi: string | null;
	isbn: string | null;
	url: string | null;
	fuente: string | null;
	tipo_referencia: string;
	nivel_confianza: number; // 1-5
	aporta_contexto: string;
}

export interface ResultadoExtraccionReferencias {
	extraidas: number;
	esperadas: number;
	faltantes: number;
	intentos: number;
	referencias: ReferenciaExtraida[];
}

interface EjecutarExtraccionReferenciasInput {
	artefactoId: string;
}

const MAX_INTENTOS = 2;

/**
 * Ejecuta el pipeline completo de extracción de referencias.
 *
 * Flujo:
 * 1. Obtiene contenido del artefacto y metadata del Destilado
 * 2. Extrae referencias con LLM
 * 3. Valida cantidad vs. esperadas
 * 4. Si falta delta y no excedió MAX_INTENTOS, reintenta
 * 5. Persiste referencias válidas en DB
 */
export async function ejecutarExtraccionReferencias(
	input: EjecutarExtraccionReferenciasInput,
): Promise<Result<ResultadoExtraccionReferencias, ResultErrorCode>> {
	const supabase = await createServerClient();
	const { artefactoId } = input;

	// (1) Obtener contenido del artefacto
	const contenidoRes = await obtenerContenidoMetabolizable(
		supabase,
		artefactoId,
	);
	if (!contenidoRes.ok) {
		return contenidoRes;
	}
	const contenidoArtefacto = contenidoRes.data.contenido;

	console.log(
		`[ejecutarExtraccionReferencias] Contenido obtenido: ` +
			`${contenidoArtefacto.length} caracteres, ` +
			`${contenidoRes.data.tokens_estimados} tokens estimados`,
	);

	if (contenidoArtefacto.length === 0) {
		console.error("[ejecutarExtraccionReferencias] Contenido vacío");
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}

	// (2) Obtener Destilado para extraer total_referencias_detectadas y metadata
	const { data: destilado, error: destiladoErr } = await supabase
		.from("cgt_destilados")
		.select("estructura_documento, project_id")
		.eq("artefacto_id", artefactoId)
		.maybeSingle();

	if (destiladoErr || !destilado) {
		console.error(
			"[ejecutarExtraccionReferencias] No se encontró Destilado:",
			destiladoErr,
		);
		return fail<ResultErrorCode>("MISSING_UPSTREAM");
	}

	const estructura = (destilado.estructura_documento ?? {}) as Record<
		string,
		unknown
	>;
	const totalReferenciasEsperadas =
		(estructura.total_referencias_detectadas as number) ?? 0;
	const projectId = destilado.project_id;

	if (totalReferenciasEsperadas === 0) {
		console.log(
			"[ejecutarExtraccionReferencias] No hay referencias detectadas para extraer.",
		);
		return ok({
			extraidas: 0,
			esperadas: 0,
			faltantes: 0,
			intentos: 0,
			referencias: [],
		});
	}

	console.log(
		`[ejecutarExtraccionReferencias] Iniciando para artefacto ${artefactoId}. ` +
			`Esperadas: ${totalReferenciasEsperadas}`,
	);

	const metadataExtraccion = {
		formatoCitaDetectado: estructura.formato_cita_inline_detectado as
			| string
			| undefined,
		tieneSeccionBibliografica: estructura.tiene_seccion_bibliografica as
			| boolean
			| undefined,
		nombreMarcadorBibliografia: estructura.nombre_marcador_bibliografia as
			| string
			| null
			| undefined,
		lineaInicioBibliografia: estructura.linea_aprox_inicio_bibliografia as
			| number
			| null
			| undefined,
	};

	let intento = 1;
	let referenciasAcumuladas: ReferenciaExtraida[] = [];

	while (intento <= MAX_INTENTOS) {
		console.log(
			`[ejecutarExtraccionReferencias] Intento ${intento}/${MAX_INTENTOS}`,
		);

		// Determinar cuántas faltan por extraer
		const faltantes = totalReferenciasEsperadas - referenciasAcumuladas.length;

		const userPrompt = construirPromptExtractorReferencias({
			contenidoArtefacto,
			totalReferenciasEsperadas:
				faltantes > 0 ? faltantes : totalReferenciasEsperadas,
			formatoCitaDetectado: metadataExtraccion.formatoCitaDetectado,
			tieneSeccionBibliografica: metadataExtraccion.tieneSeccionBibliografica,
			nombreMarcadorBibliografia: metadataExtraccion.nombreMarcadorBibliografia,
			lineaInicioBibliografia: metadataExtraccion.lineaInicioBibliografia,
			intento,
		});

		console.log(
			`[ejecutarExtraccionReferencias] User prompt (primeros 300 chars): `,
			userPrompt.slice(0, 300),
		);

		// Llamar al LLM
		let llmRes;
		try {
			llmRes = await callDeepSeek({
				model: EXTRACTOR_REFERENCIAS_CONFIG.model,
				temperature: EXTRACTOR_REFERENCIAS_CONFIG.temperature,
				maxTokens: EXTRACTOR_REFERENCIAS_CONFIG.maxTokens,
				systemPrompt: EXTRACTOR_REFERENCIAS_SYSTEM_PROMPT.replace(
					/{{TOTAL_REFERENCIAS}}/g,
					String(faltantes > 0 ? faltantes : totalReferenciasEsperadas),
				),
				userPrompt,
				responseFormat: { type: "json_object" },
			});
		} catch (err) {
			console.error(
				`[ejecutarExtraccionReferencias] LLM falló en intento ${intento}:`,
				err,
			);
			return fail<ResultErrorCode>("LLM_ERROR");
		}

		// Parsear respuesta
		console.log(
			`[ejecutarExtraccionReferencias] Respuesta cruda del LLM (primeros 500 chars):`,
			llmRes.content.slice(0, 500),
		);

		const parseRes = parsearJsonLLM<{
			referencias?: ReferenciaExtraida[];
			faltantes_detectadas?: number;
		}>(llmRes.content);

		if (!parseRes.ok) {
			console.error(
				`[ejecutarExtraccionReferencias] JSON inválido en intento ${intento}:`,
				parseRes.error,
			);
			console.log(
				`[ejecutarExtraccionReferencias] Contenido que falló el parseo:`,
				llmRes.content.slice(0, 1000),
			);
			// Si es el último intento, devolvemos error
			if (intento === MAX_INTENTOS) {
				return fail<ResultErrorCode>("LLM_ERROR");
			}
			// Si no, continuamos al siguiente intento
			intento++;
			continue;
		}

		const nuevasReferencias = parseRes.data.referencias ?? [];
		const faltantesReportadas = parseRes.data.faltantes_detectadas ?? 0;

		console.log(
			`[ejecutarExtraccionReferencias] Intento ${intento}: ` +
				`${nuevasReferencias.length} referencias extraídas, ` +
				`${faltantesReportadas} faltantes reportadas. ` +
				`Estructura recibida: ${Object.keys(parseRes.data).join(", ")}`,
		);

		// Acumular referencias
		referenciasAcumuladas = [...referenciasAcumuladas, ...nuevasReferencias];

		// Verificar si completamos
		if (referenciasAcumuladas.length >= totalReferenciasEsperadas) {
			console.log(
				`[ejecutarExtraccionReferencias] Meta alcanzada: ` +
					`${referenciasAcumuladas.length}/${totalReferenciasEsperadas}`,
			);
			break;
		}

		// Si después del último intento seguimos faltando, loguear advertencia
		if (intento === MAX_INTENTOS) {
			console.warn(
				`[ejecutarExtraccionReferencias] No se alcanzó la meta después de ${MAX_INTENTOS} intentos. ` +
					`Extraídas: ${referenciasAcumuladas.length}/${totalReferenciasEsperadas}`,
			);
		}

		intento++;
	}

	// Persistir en DB (solo referencias con nivel de confianza >= 1)
	const refPersistResult = await persistirReferenciasBibliograficas(supabase, {
		referencias: referenciasAcumuladas.map((r) => ({
			numero_en_artefacto: r.numero_en_artefacto,
			titulo: r.titulo,
			autores: r.autores,
			ano: r.ano,
			doi: r.doi,
			isbn: r.isbn,
			url: r.url,
			fuente: r.fuente,
			tipo_referencia: r.tipo_referencia as
				| "paper"
				| "libro"
				| "web"
				| "dataset"
				| "video"
				| "norma_legal"
				| "reporte"
				| "otro"
				| "desconocido"
				| null,
			apariciones_en_artefacto: [], // Simplificado para pipeline v1
			confianza_extraccion: r.nivel_confianza / 5, // Normalizar 1-5 a 0-1
			notas_extractor: r.aporta_contexto,
		})),
		artefactoId,
		projectId,
		formatoCitaInline: metadataExtraccion.formatoCitaDetectado ?? null,
	});

	console.log(
		`[ejecutarExtraccionReferencias] Persistencia: ` +
			`${refPersistResult.insertadas} insertadas, ` +
			`${refPersistResult.duplicados} duplicados, ` +
			`${refPersistResult.errores} errores`,
	);

	return ok({
		extraidas: referenciasAcumuladas.length,
		esperadas: totalReferenciasEsperadas,
		faltantes: Math.max(
			0,
			totalReferenciasEsperadas - referenciasAcumuladas.length,
		),
		intentos: Math.min(intento, MAX_INTENTOS),
		referencias: referenciasAcumuladas,
	});
}
