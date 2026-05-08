/**
 * @file app/cognetica/entidades/EntidadArtefactosLista.tsx
 * Componente para listar artefactos donde aparece una entidad.
 *
 * Muestra cards de artefactos en grilla responsive (1 col mobile, 2 col desktop).
 * Cada card muestra: título, tipo, fecha formateada, y snippet contextual.
 *
 * Sub-paso 5.2 — Hito 5 Cognética Fluida.
 */

"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import Link from "next/link";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardText } from "@/components/ui/StandardText";

import type { ArtefactoConMencion } from "@/lib/actions/cognetica-forense-entidades-actions";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface EntidadArtefactosListaProps {
	artefactos: ArtefactoConMencion[];
}
//#endregion ![def]

//#region [helpers] - 🛠️ FORMATO DE FECHA 🛠️
/**
 * Formatea una fecha ISO a formato legible en español.
 * Ej: "23 abril 2026"
 */
function formatearFecha(fechaIso: string): string {
	const fecha = new Date(fechaIso);
	return new Intl.DateTimeFormat("es-ES", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(fecha);
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
export function EntidadArtefactosLista({
	artefactos,
}: EntidadArtefactosListaProps) {
	if (artefactos.length === 0) {
		return (
			<StandardText size="sm" colorScheme="neutral">
				Esta entidad no tiene apariciones actualmente activas.
			</StandardText>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{artefactos.map((a) => (
				<Link
					key={a.artefacto_id}
					href={`/cognetica/${a.artefacto_id}`}
					className="block group">
					<StandardCard
						colorScheme="neutral"
						styleType="subtle"
						className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-primary/30">
						<StandardCard.Header className="pb-2">
							<div className="flex items-start justify-between gap-2">
								<StandardText
									preset="title"
									className="line-clamp-2 flex-1">
									{a.titulo}
								</StandardText>
								<StandardBadge
									colorScheme="secondary"
									styleType="subtle"
									size="xs">
									{a.tipo_artefacto}
								</StandardBadge>
							</div>
							<StandardText size="xs" colorScheme="neutral">
								{formatearFecha(a.created_at)}
							</StandardText>
						</StandardCard.Header>

						{a.descripcion_mencion_en_artefacto && (
							<StandardCard.Content className="pt-0">
								<StandardText
									size="sm"
									colorScheme="neutral"
									className="line-clamp-2 italic">
									&ldquo;{a.descripcion_mencion_en_artefacto}&rdquo;
								</StandardText>
							</StandardCard.Content>
						)}
					</StandardCard>
				</Link>
			))}
		</div>
	);
}
//#endregion ![main]
