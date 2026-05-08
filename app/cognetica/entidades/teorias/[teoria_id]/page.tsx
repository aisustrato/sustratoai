/**
 * @file app/cognetica/entidades/teorias/[teoria_id]/page.tsx
 * Vista raíz de una teoría canónica.
 *
 * Sub-paso 5.3 — Hito 5 Cognética Fluida.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { notFound } from "next/navigation";

import { createServerClient } from "@/lib/supabase";
import {
	obtenerEntidadCanonica,
	listarArtefactosPorEntidad,
} from "@/lib/actions/cognetica-forense-entidades-actions";
import { EntidadVistaRaiz } from "../../EntidadVistaRaiz";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface TeoriaPageProps {
	params: Promise<{ teoria_id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
//#endregion ![def]

//#region [main] - 🔧 PAGE COMPONENT 🔧
export default async function TeoriaPage({
	params,
	searchParams,
}: TeoriaPageProps) {
	const { teoria_id } = await params;
	const searchParamsResolved = await (searchParams ?? Promise.resolve({}));
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const origenRaw = (searchParamsResolved as Record<string, unknown>).origen;
	const artefactoOrigenId =
		typeof origenRaw === "string" ? origenRaw : undefined;

	// 1. Validar sesión
	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		notFound();
	}

	// 2. Obtener teoría
	const entidadRes = await obtenerEntidadCanonica("teoria", teoria_id);
	if (!entidadRes.ok) {
		notFound();
	}

	// 3. Listar artefactos
	const artefactosRes = await listarArtefactosPorEntidad("teoria", teoria_id);
	const artefactos = artefactosRes.ok ? artefactosRes.data : [];

	// 4. Renderizar
	return (
		<div className="container mx-auto py-6 px-4">
			<EntidadVistaRaiz
				tipo="teoria"
				entidad={entidadRes.data}
				artefactos={artefactos}
				artefactoOrigenId={artefactoOrigenId}
			/>
		</div>
	);
}
//#endregion ![main]
