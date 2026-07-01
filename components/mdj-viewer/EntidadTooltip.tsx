// 📍 components/mdj-viewer/EntidadTooltip.tsx
// 'use client' — Tooltip read-only para menciones de entidad (autor/pensador,
// concepto, teoría, disciplina). Hover → ficha (nombre + descripción) + link a
// los artefactos de la entidad. Color por tipo de entidad.
// No tiene editar/borrar: crear/editar/borrar llega en una fase posterior.

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnotacionMarca } from "./AnotacionMarca";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardText } from "@/components/ui/StandardText";
import { ExternalLink } from "lucide-react";
import type { Anotacion } from "@/lib/mdj/types";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

type EntidadTipo = NonNullable<Anotacion["entidad_tipo"]>;

// Color, etiqueta de tipo, ruta (plural) y etiqueta del link por tipo de entidad.
// `ruta` vacío = sin página de entidad (las citas no navegan).
const CONFIG: Record<
	EntidadTipo,
	{ color: ColorSchemeVariant; tipoLabel: string; ruta: string; label: string }
> = {
	pensador: { color: "primary", tipoLabel: "Autor", ruta: "pensadores", label: "Ver artefactos del autor" },
	concepto: { color: "tertiary", tipoLabel: "Concepto", ruta: "conceptos", label: "Ver artefactos del concepto" },
	teoria: { color: "accent", tipoLabel: "Teoría", ruta: "teorias", label: "Ver artefactos de la teoría" },
	disciplina: { color: "secondary", tipoLabel: "Disciplina", ruta: "disciplinas", label: "Ver artefactos de la disciplina" },
	cita: { color: "warning", tipoLabel: "Cita textual", ruta: "", label: "" },
};

interface EntidadTooltipProps {
	anotacion: Anotacion;
	activa?: boolean;
	/** Contenido del trigger (texto formateado). Si no se pasa, usa anotacion.fragmento */
	children?: ReactNode;
}

export function EntidadTooltip({ anotacion, activa, children }: EntidadTooltipProps) {
	const cfg = CONFIG[anotacion.entidad_tipo ?? "pensador"];
	const href = anotacion.entidad_id && cfg.ruta
		? `/cognetica/entidades/${cfg.ruta}/${anotacion.entidad_id}`
		: null;

	const tooltipContent = (
		<div className="space-y-2 min-w-[200px] max-w-xs">
			<StandardText size="2xs" weight="medium" colorScheme={cfg.color} colorShade="subtle" className="uppercase tracking-wide">
				{cfg.tipoLabel}
			</StandardText>
			<StandardText size="sm" weight="semibold" colorScheme={cfg.color}>
				{anotacion.fragmento}
			</StandardText>
			{anotacion.nota_texto ? (
				<StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="leading-relaxed">
					{anotacion.nota_texto}
				</StandardText>
			) : null}
			{href ? (
				<div className="pt-1 border-t border-neutral-200 dark:border-neutral-700">
					<Link href={href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
						<ExternalLink size={12} />
						{cfg.label}
					</Link>
				</div>
			) : null}
		</div>
	);

	return (
		<StandardTooltip
			trigger={
				<AnotacionMarca colorScheme={cfg.color} activa={activa}>
					{children ?? anotacion.fragmento}
				</AnotacionMarca>
			}
			content={tooltipContent}
			colorScheme={cfg.color}
			side="bottom"
			align="center"
			sideOffset={8}
			delayDuration={300}
		/>
	);
}
