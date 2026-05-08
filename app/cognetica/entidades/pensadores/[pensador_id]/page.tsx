/**
 * @file app/cognetica/entidades/pensadores/[pensador_id]/page.tsx
 * Vista raíz de un pensador canónico.
 *
 * Server Component que:
 * 1. Valida sesión + proyecto activo
 * 2. Obtiene el pensador por ID (404 si no existe o sin acceso)
 * 3. Lista los artefactos donde aparece
 * 4. Renderiza EntidadVistaRaiz parametrizado
 *
 * Sub-paso 5.2 — Hito 5 Cognética Fluida (piloto).
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
interface PensadorPageProps {
	params: Promise<{ pensador_id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
//#endregion ![def]

//#region [main] - 🔧 PAGE COMPONENT 🔧
export default async function PensadorPage({
	params,
	searchParams,
}: PensadorPageProps) {
	const { pensador_id } = await params;
	const searchParamsResolved = await (searchParams ?? Promise.resolve({}));
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const origenRaw = (searchParamsResolved as Record<string, unknown>).origen;
	const artefactoOrigenId =
		typeof origenRaw === "string" ? origenRaw : undefined;

	// 1. Validar sesión y proyecto activo
	const supabase = await createServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		notFound();
	}

	// 2. Obtener pensador (404 si no existe o RLS bloquea)
	const entidadRes = await obtenerEntidadCanonica("pensador", pensador_id);
	if (!entidadRes.ok) {
		notFound();
	}

	// 3. Listar artefactos donde aparece
	const artefactosRes = await listarArtefactosPorEntidad(
		"pensador",
		pensador_id,
	);
	if (!artefactosRes.ok) {
		// Si falla la lista de artefactos, mostramos la entidad con lista vacía
		// (caso edge: el pensador existe pero no podemos leer sus menciones)
		console.error(
			"[PensadorPage] error listando artefactos:",
			artefactosRes.error,
		);
	}

	const artefactos = artefactosRes.ok ? artefactosRes.data : [];

	// 4. Renderizar vista raíz genérica
	return (
		<div className="container mx-auto py-6 px-4">
			<EntidadVistaRaiz
				tipo="pensador"
				entidad={entidadRes.data}
				artefactos={artefactos}
				artefactoOrigenId={artefactoOrigenId}
			/>
		</div>
	);
}
//#endregion ![main]
