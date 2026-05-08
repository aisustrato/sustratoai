/**
 * @file app/cognetica/entidades/EntidadVistaRaiz.tsx
 * Componente genérico para mostrar la vista raíz de una entidad canónica.
 *
 * Usado por las 4 rutas de entidades (pensadores, disciplinas, conceptos, teorías).
 * Muestra: breadcrumb, ficha canónica, y lista de artefactos donde aparece.
 *
 * Sub-paso 5.2 — Hito 5 Cognética Fluida.
 */

"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StandardBreadcrumbs } from "@/components/ui/StandardBreadcrumbs";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardText } from "@/components/ui/StandardText";

import type {
	TipoEntidadConConteo,
	EntidadCanonicaConConteo,
	ArtefactoConMencion,
} from "@/lib/actions/cognetica-forense-entidades-actions";
import { DIMENSIONES } from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
import { EntidadArtefactosLista } from "./EntidadArtefactosLista";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface EntidadVistaRaizProps<T extends TipoEntidadConConteo> {
	tipo: T;
	entidad: EntidadCanonicaConConteo<T>;
	artefactos: ArtefactoConMencion[];
	/** ID del artefacto origen (para breadcrumb "volver a artefacto") */
	artefactoOrigenId?: string;
}
//#endregion ![def]

//#region [helpers] - 🛠️ HELPERS 🛠️
/**
 * Obtiene el descriptor de dimensión para un tipo de entidad.
 */
function getDescriptor(tipo: TipoEntidadConConteo) {
	const descriptor = DIMENSIONES.find((d) => d.tipo === tipo);
	if (!descriptor) throw new Error(`Tipo de entidad no válido: ${tipo}`);
	return descriptor;
}

/**
 * Extrae campos comunes de la entidad canónica según el tipo.
 * Cada tipo tiene campos ligeramente distintos en la vista con conteo.
 */
function extraerCamposEntidad<T extends TipoEntidadConConteo>(
	tipo: T,
	entidad: EntidadCanonicaConConteo<T>,
) {
	// Casting defensivo — sabemos que todas las vistas tienen estos campos base
	const e = entidad as Record<string, unknown>;

	return {
		nombre: (e.nombre_canonico as string | null) ?? "(sin nombre)",
		descripcion: (e.descripcion_canonica as string | null) ?? null,
		aliases: (e.aliases as string[] | null) ?? null,
		mencionesCount: (e.menciones_count as number | null) ?? 0,
		// Campos específicos por tipo
		disciplinaMadreId: tipo === "disciplina" ? (e.disciplina_madre_id as string | null) : null,
		esSemillaFractal: tipo === "concepto" ? (e.es_semilla_fractal as boolean | null) : null,
		autoresPrincipales: tipo === "teoria" ? (e.autores_principales as string[] | null) : null,
	};
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
export function EntidadVistaRaiz<T extends TipoEntidadConConteo>({
	tipo,
	entidad,
	artefactos,
	artefactoOrigenId,
}: EntidadVistaRaizProps<T>) {
	const descriptor = getDescriptor(tipo);
	const campos = extraerCamposEntidad(tipo, entidad);

	// Items para breadcrumb
	const breadcrumbItems = [
		{ label: "Cognética", href: "/cognetica" },
		{ label: "Entidades", href: "/cognetica" }, // Por ahora vuelve a raíz
		{ label: descriptor.labelPlural },
		{ label: campos.nombre },
	];

	return (
		<div className="space-y-6">
			{/* (a) Header con breadcrumb y botón volver */}
			<div className="space-y-3">
				<StandardBreadcrumbs items={breadcrumbItems} />

				{artefactoOrigenId && (
					<Link href={`/cognetica/${artefactoOrigenId}`}>
						<StandardButton
							styleType="ghost"
							size="sm"
							colorScheme="neutral"
							leftIcon={ArrowLeft}>
							Volver al artefacto
						</StandardButton>
					</Link>
				)}
			</div>

			{/* (b) Ficha canónica */}
			<StandardCard colorScheme={descriptor.colorScheme} styleType="subtle">
				<StandardCard.Header>
					<div className="flex items-center gap-3 flex-wrap">
						<StandardText preset="heading" className="flex-1">
							{campos.nombre}
						</StandardText>
						<StandardBadge
							colorScheme={descriptor.colorScheme}
							styleType="solid"
							size="md"
							leftIcon={descriptor.icon}>
							<span className="mr-1">{descriptor.emoji}</span>
							{campos.mencionesCount} aparición
							{campos.mencionesCount === 1 ? "" : "es"}
						</StandardBadge>
					</div>

					{campos.descripcion ? (
						<StandardText size="base" className="mt-2">
							{campos.descripcion}
						</StandardText>
					) : (
						<StandardText
							size="sm"
							colorScheme="neutral"
							className="mt-2 italic">
							Sin descripción canónica asignada
						</StandardText>
					)}
				</StandardCard.Header>

				{/* Aliases (si hay) */}
				{campos.aliases && campos.aliases.length > 0 && (
					<StandardCard.Content className="pt-0">
						<div className="flex items-center gap-2 flex-wrap">
							<StandardText size="sm" colorScheme="neutral">
								También conocido como:
							</StandardText>
							{campos.aliases.map((alias) => (
								<StandardBadge
									key={alias}
									colorScheme="neutral"
									styleType="outline"
									size="sm">
									{alias}
								</StandardBadge>
							))}
						</div>
					</StandardCard.Content>
				)}

				{/* Campos específicos por tipo */}
				{tipo === "disciplina" && campos.disciplinaMadreId && (
					<StandardCard.Content className="pt-0">
						<StandardText size="sm" colorScheme="neutral">
							Sub-disciplina de:{" "}
							<Link
								href={`/cognetica/entidades/disciplinas/${campos.disciplinaMadreId}`}
								className="text-primary hover:underline">
								Ver disciplina madre
							</Link>
						</StandardText>
					</StandardCard.Content>
				)}

				{tipo === "concepto" && campos.esSemillaFractal && (
					<StandardCard.Content className="pt-0">
						<StandardBadge
							colorScheme="accent"
							styleType="solid"
							size="sm">
							✨ Semilla fractal
						</StandardBadge>
					</StandardCard.Content>
				)}

				{tipo === "teoria" &&
					campos.autoresPrincipales &&
					campos.autoresPrincipales.length > 0 && (
					<StandardCard.Content className="pt-0">
						<div className="flex items-center gap-2 flex-wrap">
							<StandardText size="sm" colorScheme="neutral">
								Autores principales:
							</StandardText>
							{campos.autoresPrincipales.map((autor) => (
								<StandardBadge
									key={autor}
									colorScheme="secondary"
									styleType="subtle"
									size="sm">
									{autor}
								</StandardBadge>
							))}
						</div>
					</StandardCard.Content>
				)}
			</StandardCard>

			{/* (c) Sección "Aparece en N artefactos" */}
			<div className="space-y-4">
				<StandardText preset="subheading">
					Aparece en {artefactos.length} artefacto
					{artefactos.length === 1 ? "" : "s"}
				</StandardText>

				<EntidadArtefactosLista artefactos={artefactos} />
			</div>
		</div>
	);
}
//#endregion ![main]
