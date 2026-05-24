//. 📍 app/cognetica/[id]/page.tsx
/**
 * Vista de artefacto metabolizado — Fase 4.1 / 4.2.
 *
 * Server Component: dispara `obtenerArtefactoCompleto` y entrega el payload
 * a `ArtefactoView` (client). El polling en vivo lo maneja el client via
 * `router.refresh()` mientras el artefacto esté en estado `metabolizando`.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import Link from "next/link";

import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";

import { obtenerArtefactoCompleto } from "@/lib/actions/cognetica-forense-lecturas-actions";
import type { ResultErrorCode } from "@/lib/cognetica-forense/types";

import { ArtefactoView } from "./ArtefactoView";
//#endregion ![head]

export const dynamic = "force-dynamic";

//#region [def] - 📦 TYPES 📦
/**
 * Next.js 14: `params` es un objeto síncrono en Server Components.
 * (En Next.js 15+ pasa a Promise; ajustar entonces con `await`.)
 */
interface CogneticaArtefactoPageProps {
	params: { id: string };
}

/** Mapeo de `ResultErrorCode` → copy en español para el alert de error. */
const MENSAJES_ERROR: Record<
	ResultErrorCode,
	{ titulo: string; mensaje: string }
> = {
	UNAUTHORIZED: {
		titulo: "Sesión requerida",
		mensaje: "Inicia sesión para acceder a este artefacto.",
	},
	FORBIDDEN: {
		titulo: "Sin permiso",
		mensaje: "No tienes acceso a este artefacto en el proyecto actual.",
	},
	NOT_FOUND: {
		titulo: "Artefacto no encontrado",
		mensaje: "El artefacto no existe o fue eliminado.",
	},
	INTERNAL: {
		titulo: "Error interno",
		mensaje:
			"Falló la consulta a la base de datos. Reintenta en unos segundos.",
	},
	NOT_IMPLEMENTED: {
		titulo: "No implementado",
		mensaje: "Esta operación aún no está disponible.",
	},
	INVALID_INPUT: {
		titulo: "Datos inválidos",
		mensaje: "La solicitud no cumple el formato esperado.",
	},
	DUPLICATE: {
		titulo: "Registro duplicado",
		mensaje: "Ya existe un artefacto con estas características.",
	},
	LLM_ERROR: {
		titulo: "Error del modelo",
		mensaje: "Falló la llamada al LLM. Revisa los logs del pipeline.",
	},
	STORAGE_ERROR: {
		titulo: "Error de almacenamiento",
		mensaje: "Falló la lectura/escritura del artefacto.",
	},
	TRANSCRIPTION_ERROR: {
		titulo: "Error de transcripción",
		mensaje: "Falló la transcripción automática del audio/video.",
	},
	MISSING_UPSTREAM: {
		titulo: "Dependencia faltante",
		mensaje: "Falta un formato upstream necesario para este paso.",
	},
	THRESHOLD_NOT_MET: {
		titulo: "Umbral no alcanzado",
		mensaje: "No se cumplen las precondiciones para generar este formato.",
	},
};
//#endregion ![def]

//#region [helpers] - 🛠️ TIPO → EMOJI 🛠️
/**
 * Mapa de tipos de artefacto a emojis para el título de página.
 */
const EMOJI_POR_TIPO: Record<string, string> = {
	audio: "🎙️",
	video: "🎬",
	pdf_informe: "📄",
	pdf_slides: "📽️",
	markdown: "📝",
	imagen: "🖼️",
};

function emojiParaTipo(tipo: string | undefined): string | undefined {
	return tipo ? EMOJI_POR_TIPO[tipo] : undefined;
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
export default async function CogneticaArtefactoPage({
	params,
}: CogneticaArtefactoPageProps) {
	const { id } = params;
	const res = await obtenerArtefactoCompleto(id);

	return (
		<div className="container mx-auto py-8">
			<StandardPageTitle
				title={res.ok ? res.data.artefacto.titulo : "Artefacto"}
				description={
					res.ok
						? `ID: ${id} · sha256: ${res.data.artefacto.sha256_json.slice(0, 16)}…`
						: `ID: ${id}`
				}
				emoji={res.ok ? emojiParaTipo(res.data.artefacto.tipo) : undefined}
				breadcrumbs={[
					{ label: "Cognética", href: "/cognetica" },
					{ label: "Artefacto" },
				]}
				showBackButton={{ href: "/cognetica" }}
				actions={
					res.ok && res.data.artefacto.estado === "error" ?
						<Link href="/cognetica/upload">
							<StandardButton colorScheme="primary" styleType="outline">
								Subir otro
							</StandardButton>
						</Link>
					:	undefined
				}
			/>

			<div className="mt-6">
				{res.ok ?
					<ArtefactoView data={res.data} />
				:	<StandardAlert
						colorScheme="danger"
						styleType="subtle"
						title={MENSAJES_ERROR[res.error].titulo}
						message={MENSAJES_ERROR[res.error].mensaje}
					/>
				}
			</div>
		</div>
	);
}
//#endregion ![main]
