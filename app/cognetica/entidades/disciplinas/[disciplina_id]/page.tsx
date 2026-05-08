/**
 * @file app/cognetica/entidades/disciplinas/[disciplina_id]/page.tsx
 * Vista raíz de una disciplina canónica.
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
interface DisciplinaPageProps {
	params: Promise<{ disciplina_id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
//#endregion ![def]

//#region [main] - 🔧 PAGE COMPONENT 🔧
export default async function DisciplinaPage({
	params,
	searchParams,
}: DisciplinaPageProps) {
	const { disciplina_id } = await params;
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

	// 2. Obtener disciplina
	const entidadRes = await obtenerEntidadCanonica("disciplina", disciplina_id);
	if (!entidadRes.ok) {
		notFound();
	}

	// 3. Listar artefactos
	const artefactosRes = await listarArtefactosPorEntidad(
		"disciplina",
		disciplina_id,
	);
	const artefactos = artefactosRes.ok ? artefactosRes.data : [];

	// 4. Renderizar
	return (
		<div className="container mx-auto py-6 px-4">
			<EntidadVistaRaiz
				tipo="disciplina"
				entidad={entidadRes.data}
				artefactos={artefactos}
				artefactoOrigenId={artefactoOrigenId}
			/>
		</div>
	);
}
//#endregion ![main]
