//. 📍 app/cognetica/[id]/MencionBadge.tsx
/**
 * Badge clickeable de una mención cartografiada.
 *
 * Responsabilidades:
 *   - Mostrar el **valor canónico actual** (ya calculado por la vista
 *     `cgt_vw_<tipo>_valor_canonico`: humano → cartografiador → extractor).
 *   - Colorear según `decision_cartografiador` para leer el estado del
 *     grafo de un vistazo (verde = match, azul = nueva, naranja = ambigua).
 *   - Modo navegación (default): Click navega a la vista raíz de la entidad.
 *   - Modo edición: Click abre el modal de edición humana (Capa 3).
 *
 * Mantengo el badge deliberadamente pequeño — es un átomo. Los listados
 * (`MencionesSection`) y la tarjeta raíz (`ArtefactoCard`) lo componen.
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import Link from "next/link";

import { StandardBadge } from "@/components/ui/StandardBadge";
import {
	colorDesdeDecision,
	etiquetaDecision,
} from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
import type { MencionConValorCanonico } from "@/lib/actions/cognetica-forense-menciones-actions";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface MencionBadgeProps {
	item: MencionConValorCanonico;
	/** Callback para modo edición (abre modal). Ignorado en modo navegación. */
	onClick?: (item: MencionConValorCanonico) => void;
	/**
	 * Si `true`, muestra la confianza del cartografiador como sufijo
	 * discreto. Solo se usa en `MencionesSection` (detalle) — la tarjeta
	 * raíz lo mantiene apagado para no saturar.
	 */
	mostrarConfianza?: boolean;
	/**
	 * ColorScheme opcional para sobrescribir el color basado en decisión.
	 * Si se pasa, se usa este; si no, se usa el color de la decisión del
	 * cartografiador. Permite agrupar visualmente por dimensión.
	 */
	colorScheme?:
		| "primary"
		| "secondary"
		| "tertiary"
		| "accent"
		| "warning"
		| "success"
		| "danger"
		| "neutral";
	/** ID del artefacto actual (para breadcrumb de vuelta en modo navegación) */
	artefactoId?: string;
	/** Modo edición: true = editar, false = navegar (default) */
	modoEdicion?: boolean;
}
//#endregion ![def]

//#region [helpers] - 🛠️ EXTRACCIÓN DEL VALOR CANÓNICO 🛠️
/**
 * Lee el "nombre visible" del valor canónico según el tipo de mención.
 * Para citas es `texto_canonico_actual` truncado; para el resto es
 * `nombre_canonico_actual`.
 */
function textoVisible(item: MencionConValorCanonico): string {
	if (item.tipo === "cita") {
		const t = item.valor_canonico.texto_canonico_actual ?? "(cita sin texto)";
		return t.length > 60 ? `${t.slice(0, 59)}…` : t;
	}
	return item.valor_canonico.nombre_canonico_actual ?? "(sin nombre)";
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ RUTA DE ENTIDAD 🛠️
/**
 * Extrae el ID de la entidad canónica del valor_canonico según el tipo.
 * Cada vista tiene un campo específico: pensador_id, disciplina_id, etc.
 */
function extraerEntidadId(
	tipo: MencionConValorCanonico["tipo"],
	valorCanonico: MencionConValorCanonico["valor_canonico"],
): string | null {
	const vc = valorCanonico as Record<string, unknown>;
	switch (tipo) {
		case "pensador":
			return (vc.pensador_id as string | null) ?? null;
		case "disciplina":
			return (vc.disciplina_id as string | null) ?? null;
		case "concepto":
			return (vc.concepto_id as string | null) ?? null;
		case "teoria":
			return (vc.teoria_id as string | null) ?? null;
		case "cita":
			return null; // Las citas no tienen vista raíz propia
		default:
			return null;
	}
}

/**
 * Construye la ruta a la vista raíz de una entidad según su tipo.
 * Las citas no tienen vista raíz (return null).
 */
function rutaEntidad(
	tipo: MencionConValorCanonico["tipo"],
	entidadId: string | null,
): string | null {
	if (!entidadId) return null;
	switch (tipo) {
		case "pensador":
			return `/cognetica/entidades/pensadores/${entidadId}`;
		case "disciplina":
			return `/cognetica/entidades/disciplinas/${entidadId}`;
		case "concepto":
			return `/cognetica/entidades/conceptos/${entidadId}`;
		case "teoria":
			return `/cognetica/entidades/teorias/${entidadId}`;
		case "cita":
			return null; // Las citas no tienen vista raíz propia
		default:
			return null;
	}
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
export function MencionBadge({
	item,
	onClick,
	mostrarConfianza = false,
	colorScheme: colorSchemeProp,
	artefactoId,
	modoEdicion = false,
}: MencionBadgeProps) {
	const decision = item.valor_canonico.decision_cartografiador;
	const colorScheme = colorSchemeProp ?? colorDesdeDecision(decision);
	const texto = textoVisible(item);
	const confianza = item.valor_canonico.confianza_cartografiador;
	const contador = item.menciones_count;

	// Tooltip `title` nativo: complementa al modal con peek rápido sin
	// forzar click. Incluye la decisión legible, confianza si la hay, y conteo.
	const tooltip =
		`${etiquetaDecision(decision)}` +
		(typeof confianza === "number" ?
			` · confianza ${(confianza * 100).toFixed(0)}%`
		:	"") +
		(contador >= 2 ? ` · aparece en ${contador} artefactos` : "");

	// Callback para modo edición (click en nombre)
	const handleEditClick = onClick ? () => onClick(item) : undefined;

	// Link a entidad para el contador (solo si contador >= 2 y tiene entidad)
	const entidadId = extraerEntidadId(item.tipo, item.valor_canonico);
	const ruta = rutaEntidad(item.tipo, entidadId);
	const hrefContador =
		ruta && artefactoId ? `${ruta}?origen=${artefactoId}` : (ruta ?? null);

	// Determinar si mostramos contador separado (navegable)
	const mostrarContador =
		contador >= 2 && hrefContador !== null && item.tipo !== "cita";

	// Tooltip especial para entidades sin otras concordancias
	const tooltipSinConcordancias =
		item.tipo !== "cita" && contador < 2 ?
			"Esta entidad no tiene otras concordancias en el proyecto"
		:	null;

	// Base del badge (usado en ambos casos)
	const nombreClase =
		modoEdicion && onClick ? "cursor-pointer hover:opacity-80" : "";
	const contadorClase = "cursor-pointer hover:opacity-80";

	// Contenido del badge: nombre + confianza (opcional)
	const nombreContent = (
		<>
			<span className="break-words max-w-[14rem] leading-snug">{texto}</span>
			{mostrarConfianza && typeof confianza === "number" && (
				<span className="ml-1 opacity-60 text-[10px]">
					{(confianza * 100).toFixed(0)}%
				</span>
			)}
		</>
	);

	// Si hay contador >= 2, renderizamos un badge split: nombre + contador separados
	if (mostrarContador) {
		return (
			<StandardBadge
				colorScheme={colorScheme}
				styleType="outline"
				size="sm"
				title={tooltip}
				multiline
				className="inline-flex items-center gap-1 px-1 py-0.5">
				{/* Nombre: clickable en modo edición para abrir modal */}
				<span
					className={nombreClase}
					onClick={modoEdicion ? handleEditClick : undefined}
					role={modoEdicion ? "button" : undefined}
					tabIndex={modoEdicion ? 0 : undefined}>
					{nombreContent}
				</span>
				{/* Separador visual */}
				<span className="opacity-40">·</span>
				{/* Contador: siempre navega a la entidad */}
				<Link
					href={hrefContador}
					className={`${contadorClase} font-semibold`}
					aria-label={`Ver ${contador} apariciones`}>
					{contador}
				</Link>
			</StandardBadge>
		);
	}

	// Sin contador (< 2): NO es navegable, solo muestra info
	const badgeNoNavegable = (
		<StandardBadge
			colorScheme={colorScheme}
			styleType="outline"
			size="sm"
			title={tooltipSinConcordancias ?? tooltip}
			multiline
			onClick={modoEdicion ? handleEditClick : undefined}
			className={
				modoEdicion && onClick ? "cursor-pointer hover:opacity-80" : ""
			}>
			{nombreContent}
		</StandardBadge>
	);

	// En modo navegación SIN contador: no hay link (no es navegable)
	// Solo en modo edición con callback es clickable (para abrir modal)
	if (modoEdicion && onClick) {
		return badgeNoNavegable;
	}

	return badgeNoNavegable;
}
//#endregion ![main]
