/**
 * Server Actions para referencias bibliográficas (sub-paso 6.4)
 */

"use server";

import { createServerClient } from "@/lib/supabase";
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import { ok, fail } from "@/lib/cognetica-forense/types";

export interface ReferenciaArtefacto {
	id: string;
	numero_en_artefacto: number | null;
	titulo: string | null;
	autores: string[];
	ano: string | null;
	fuente: string | null;
	url: string | null;
	tipo_referencia: string;
	confianza_extraccion: number;
}

export async function listarReferenciasPorArtefacto(
	artefactoId: string,
): Promise<Result<ReferenciaArtefacto[], ResultErrorCode>> {
	const supabase = await createServerClient();

	const { data, error } = await supabase
		.from("cgt_artefactos_referencias")
		.select(
			`
			numero_en_artefacto,
			confianza_extraccion,
			cgt_referencias (
				id,
				titulo,
				autores,
				ano,
				fuente,
				url,
				tipo_referencia
			)
		`,
		)
		.eq("artefacto_id", artefactoId)
		.order("numero_en_artefacto", { ascending: true });

	if (error) {
		console.error("[listarReferencias] Error:", error);
		return fail<"INTERNAL">("INTERNAL");
	}

	const mapped = (data ?? [])
		.map((row: unknown) => {
			const r = row as {
				numero_en_artefacto: number | null;
				confianza_extraccion: number;
				cgt_referencias: {
					id: string;
					titulo: string | null;
					autores: unknown;
					ano: string | null;
					fuente: string | null;
					url: string | null;
					tipo_referencia: string;
				} | null;
			};
			if (!r.cgt_referencias) return null;
			return {
				id: r.cgt_referencias.id,
				numero_en_artefacto: r.numero_en_artefacto,
				titulo: r.cgt_referencias.titulo,
				autores:
					Array.isArray(r.cgt_referencias.autores) ?
						(r.cgt_referencias.autores as string[])
					:	[],
				ano: r.cgt_referencias.ano,
				fuente: r.cgt_referencias.fuente,
				url: r.cgt_referencias.url,
				tipo_referencia: r.cgt_referencias.tipo_referencia,
				confianza_extraccion: r.confianza_extraccion,
			};
		})
		.filter(
			(r: ReferenciaArtefacto | null): r is ReferenciaArtefacto => r !== null,
		);

	return ok(mapped);
}
