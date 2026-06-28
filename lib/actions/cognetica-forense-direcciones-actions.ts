//. 📍 lib/actions/cognetica-forense-direcciones-actions.ts
/**
 * Server Action del **MDJ FRÍO in-place**.
 *
 * `asegurarMdjArtefacto`: hornea las anotaciones (entidades + referencias) dentro
 * del MDJ de cada documento de texto y lo PISA en su lugar (crónica/germinal/
 * original). Devuelve los DocumentoMDJ horneados para el primer render del visor.
 * Lo llama el visor SOLO cuando el contenido todavía es MD plano (legacy); los ya
 * horneados se pintan en frío desde el propio contenido, sin tocar esta acción.
 *
 * El error es un string user-facing CON el detalle real — nada de fallar en
 * silencio (el visor lo muestra).
 */

"use server";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { ok, fail } from "@/lib/cognetica-forense/result";
import type { Result } from "@/lib/cognetica-forense/types";
import {
	construirMdjArtefacto,
	type MdjPorDocumento,
} from "@/lib/cognetica-forense/direcciones/resolver";

const UUID = z.string().uuid();

export type { MdjPorDocumento };

export async function asegurarMdjArtefacto(
	artefactoId: string,
): Promise<Result<MdjPorDocumento, string>> {
	if (!UUID.safeParse(artefactoId).success) return fail("ID de artefacto inválido");

	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return fail("No autorizado (sesión)");

	const res = await construirMdjArtefacto(artefactoId);
	if (!res.ok) {
		const msg = `No se pudo hornear el MDJ: ${res.error ?? "error desconocido"}`;
		console.error("[cognetica:mdj-frio]", msg);
		return fail(msg);
	}
	return ok(res.docs);
}
