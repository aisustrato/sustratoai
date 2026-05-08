//. 📍 lib/cognetica-forense/ui/menciones-ui-helpers.ts
/**
 * Constantes y helpers de presentación compartidos por los componentes
 * de menciones (Hito 4):
 *
 *   - `DIMENSIONES`: orden canónico de las 5 dimensiones + icono + label.
 *   - `colorDesdeDecision`: mapeo del enum de decisión del Cartografiador
 *     a un `ColorSchemeVariant` de Standard (usado en `StandardBadge`).
 *   - `etiquetaDecision` / `etiquetaCampoEdicion`: strings legibles.
 *
 * **Principio:** los componentes (`MencionBadge`, `MencionesSection`,
 * `ArtefactoCard`, etc.) son agnósticos al tipo — consumen estas
 * constantes y trabajan sobre la abstracción `DimensionKey`.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import {
	BookOpen,
	GraduationCap,
	Lightbulb,
	MessageSquareQuote,
	UserRound,
	type LucideIcon,
} from "lucide-react";

import type {
	DecisionCartografiador,
	TipoEntidad,
} from "@/lib/cognetica-forense/types/oleada2";
//#endregion ![head]

//#region [def] - 📦 DIMENSIONES 📦
/**
 * Clave plural usada en UI para las 5 dimensiones. Es diferente de
 * `TipoEntidad` (singular) que usa la capa de datos para hacer match
 * con las Server Actions del Hito 2.
 */
export type DimensionKey =
	| "pensadores"
	| "disciplinas"
	| "conceptos"
	| "teorias"
	| "citas";

export interface DimensionDescriptor {
	key: DimensionKey;
	/** Tipo singular para las Server Actions de menciones. */
	tipo: TipoEntidad;
	/** Nombre plural legible (para títulos de sección). */
	labelPlural: string;
	/** Nombre singular legible (para el modal de edición). */
	labelSingular: string;
	icon: LucideIcon;
	/** Emoji breve para resúmenes ultra-compactos (tarjeta raíz). */
	emoji: string;
	/** ColorScheme de Standard asociado a la dimensión (para los chips). */
	colorScheme: "primary" | "secondary" | "tertiary" | "accent" | "warning";
}

/**
 * Orden canónico de las 5 dimensiones en UI. Mantenerlo estable evita
 * que el usuario perciba movimiento entre vistas.
 */
export const DIMENSIONES: ReadonlyArray<DimensionDescriptor> = [
	{
		key: "pensadores",
		tipo: "pensador",
		labelPlural: "Pensadores",
		labelSingular: "Pensador",
		icon: UserRound,
		emoji: "👤",
		colorScheme: "primary",
	},
	{
		key: "disciplinas",
		tipo: "disciplina",
		labelPlural: "Disciplinas",
		labelSingular: "Disciplina",
		icon: GraduationCap,
		emoji: "🎓",
		colorScheme: "secondary",
	},
	{
		key: "conceptos",
		tipo: "concepto",
		labelPlural: "Conceptos",
		labelSingular: "Concepto",
		icon: Lightbulb,
		emoji: "💡",
		colorScheme: "tertiary",
	},
	{
		key: "teorias",
		tipo: "teoria",
		labelPlural: "Teorías",
		labelSingular: "Teoría",
		icon: BookOpen,
		emoji: "📐",
		colorScheme: "accent",
	},
	{
		key: "citas",
		tipo: "cita",
		labelPlural: "Citas",
		labelSingular: "Cita",
		icon: MessageSquareQuote,
		emoji: "💬",
		colorScheme: "warning",
	},
] as const;

/**
 * Helper: encontrar el descriptor para un `TipoEntidad` singular.
 * Lanza si no existe — el caller solo debe invocarlo con un `tipo`
 * válido del enum.
 */
export function descriptorPorTipo(tipo: TipoEntidad): DimensionDescriptor {
	const d = DIMENSIONES.find((x) => x.tipo === tipo);
	if (!d) throw new Error(`descriptorPorTipo: tipo inválido "${tipo}"`);
	return d;
}
//#endregion ![def]

//#region [def] - 🎨 DECISIÓN → COLOR 🎨
/**
 * ColorSchemes (Standard) por decisión del Cartografiador:
 *
 *   - `match_existente` → `success`: verde, implica reconocimiento firme.
 *   - `nueva_entidad`   → `primary`: neutral-positivo, primera aparición.
 *   - `ambigua`         → `warning`: requiere atención humana.
 *   - `sin_cartografiar`→ `neutral`: estado transitorio, aún sin decisión.
 */
export function colorDesdeDecision(
	decision: DecisionCartografiador | null | undefined,
): "success" | "primary" | "warning" | "neutral" {
	switch (decision) {
		case "match_existente":
			return "success";
		case "nueva_entidad":
			return "primary";
		case "ambigua":
			return "warning";
		case "sin_cartografiar":
		default:
			return "neutral";
	}
}

/** Etiqueta humana breve para la decisión — usado en popover / modal. */
export function etiquetaDecision(
	decision: DecisionCartografiador | null | undefined,
): string {
	switch (decision) {
		case "match_existente":
			return "Entidad ya existente";
		case "nueva_entidad":
			return "Entidad nueva";
		case "ambigua":
			return "Ambigua";
		case "sin_cartografiar":
			return "Sin cartografiar";
		default:
			return "—";
	}
}
//#endregion ![def]

//#region [def] - 🏷️ CAMPOS DE EDICIÓN 🏷️
/**
 * Campos editables por tipo. Limitado en este Hito a los campos
 * directos (nombre/descripcion/texto/etc). La reasignación a otra
 * entidad canónica y operaciones especializadas (`marcar_semilla_fractal`,
 * `asignar_disciplina_madre`, `actualizar_autores`) quedan para un hito
 * posterior con UI dedicada.
 *
 * El valor de cada entrada coincide literalmente con el enum
 * `cgt_campo_edicion_<tipo>` — es lo que espera `editarMencionHumana`.
 */
export const CAMPOS_EDICION_BASICOS: Record<
	TipoEntidad,
	ReadonlyArray<{
		campo: string;
		label: string;
		/** `multiline` → textarea; `select` → dropdown; `text` → input corto. */
		control: "text" | "multiline" | "select";
		/** Opciones solo si control = 'select'. */
		opciones?: ReadonlyArray<{ value: string; label: string }>;
	}>
> = {
	pensador: [
		{ campo: "nombre", label: "Nombre", control: "text" },
		{ campo: "descripcion", label: "Descripción", control: "multiline" },
	],
	disciplina: [
		{ campo: "nombre", label: "Nombre", control: "text" },
		{ campo: "descripcion", label: "Descripción", control: "multiline" },
	],
	concepto: [
		{ campo: "nombre", label: "Nombre", control: "text" },
		{ campo: "descripcion", label: "Descripción", control: "multiline" },
	],
	teoria: [
		{ campo: "nombre", label: "Nombre", control: "text" },
		{ campo: "descripcion", label: "Descripción", control: "multiline" },
	],
	cita: [
		{ campo: "texto", label: "Texto", control: "multiline" },
		{ campo: "autor", label: "Autor", control: "text" },
		{ campo: "referencia", label: "Referencia", control: "text" },
		{
			campo: "tipo_cita",
			label: "Tipo de cita",
			control: "select",
			opciones: [
				{ value: "academica", label: "Académica" },
				{ value: "hecho_historico", label: "Hecho histórico" },
				{ value: "obra", label: "Obra" },
				{ value: "otra", label: "Otra" },
			],
		},
	],
};
//#endregion ![def]
