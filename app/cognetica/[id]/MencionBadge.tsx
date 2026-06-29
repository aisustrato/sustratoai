//. 📍 app/cognetica/[id]/MencionBadge.tsx
/**
 * Badge de una mención cartografiada, con **menú por badge** (Fase 4).
 *
 * Responsabilidades:
 *   - Mostrar el **valor canónico actual** (ya calculado por la vista
 *     `cgt_vw_<tipo>_valor_canonico`: humano → cartografiador → extractor).
 *   - Colorear según `decision_cartografiador` para leer el estado del
 *     grafo de un vistazo (verde = match, azul = nueva, naranja = ambigua).
 *   - Click en el badge abre un menú con 4 acciones:
 *       · Editar              → modal de edición (Capa 3), vía `onEditar`.
 *       · Navegar entre artefactos → vista raíz de la entidad (citas no tienen).
 *       · Buscar en texto     → abre el artefacto en el visor con `?buscar=`.
 *       · Eliminar            → confirma y borra (curación), vía `onEliminar`.
 *
 * Reemplaza al antiguo switch global "Modo edición/navegación": ahora cada badge
 * ofrece todas sus acciones en su propio menú.
 *
 * Mantengo el badge deliberadamente pequeño — es un átomo. El listado
 * (`MencionesSection`) lo compone y le pasa los callbacks.
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useRouter, usePathname } from "next/navigation";
import { Pencil, ExternalLink, Search, Trash2 } from "lucide-react";

import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardDropdownMenu } from "@/components/ui/StandardDropdownMenu";
import {
	colorDesdeDecision,
	etiquetaDecision,
} from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
import type { MencionConValorCanonico } from "@/lib/actions/cognetica-forense-menciones-actions";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface MencionBadgeProps {
	item: MencionConValorCanonico;
	/** Abre el modal de edición (Capa 3). Si falta, "Editar" no se muestra. */
	onEditar?: (item: MencionConValorCanonico) => void;
	/** Pide confirmar y borrar la mención. Si falta, "Eliminar" no se muestra. */
	onEliminar?: (item: MencionConValorCanonico) => void;
	/**
	 * Si `true`, muestra la confianza del cartografiador como sufijo
	 * discreto. Solo se usa en `MencionesSection` (detalle).
	 */
	mostrarConfianza?: boolean;
	/**
	 * ColorScheme opcional para sobrescribir el color basado en decisión.
	 * Si se pasa, se usa este; si no, el color de la decisión del cartografiador.
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
	/** ID del artefacto actual (para breadcrumb de vuelta y `?buscar=`). */
	artefactoId?: string;
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
	onEditar,
	onEliminar,
	mostrarConfianza = false,
	colorScheme: colorSchemeProp,
	artefactoId,
}: MencionBadgeProps) {
	const router = useRouter();
	const pathname = usePathname();

	const decision = item.valor_canonico.decision_cartografiador;
	const colorScheme = colorSchemeProp ?? colorDesdeDecision(decision);
	const texto = textoVisible(item);
	const confianza = item.valor_canonico.confianza_cartografiador;
	const contador = item.menciones_count;

	// Tooltip `title` nativo: peek rápido sin abrir el menú. Decisión legible,
	// confianza si la hay, y conteo de apariciones.
	const tooltip =
		`${etiquetaDecision(decision)}` +
		(typeof confianza === "number" ?
			` · confianza ${(confianza * 100).toFixed(0)}%`
		:	"") +
		(contador >= 2 ? ` · aparece en ${contador} artefactos` : "");

	// Ruta a la vista raíz de la entidad (para "Navegar entre artefactos").
	const entidadId = extraerEntidadId(item.tipo, item.valor_canonico);
	const ruta = rutaEntidad(item.tipo, entidadId);
	const hrefEntidad =
		ruta && artefactoId ? `${ruta}?origen=${artefactoId}` : ruta;

	// Contenido visible del badge: nombre + confianza + contador (info).
	const contenido = (
		<>
			<span className="break-words max-w-[14rem] leading-snug">{texto}</span>
			{mostrarConfianza && typeof confianza === "number" && (
				<span className="ml-1 opacity-60 text-[10px]">
					{(confianza * 100).toFixed(0)}%
				</span>
			)}
			{contador >= 2 && (
				<span className="ml-1 font-semibold opacity-80">· {contador}</span>
			)}
		</>
	);

	return (
		<StandardDropdownMenu>
			<StandardDropdownMenu.Trigger asChild>
				<StandardBadge
					colorScheme={colorScheme}
					styleType="outline"
					size="sm"
					title={tooltip}
					multiline
					className="cursor-pointer hover:opacity-80 inline-flex items-center gap-1 px-1.5 py-0.5">
					{contenido}
				</StandardBadge>
			</StandardDropdownMenu.Trigger>

			<StandardDropdownMenu.Content align="start">
				{onEditar && (
					<StandardDropdownMenu.Item onClick={() => onEditar(item)}>
						<Pencil className="w-4 h-4 mr-2" />
						Editar
					</StandardDropdownMenu.Item>
				)}

				{hrefEntidad && (
					<StandardDropdownMenu.Item onClick={() => router.push(hrefEntidad)}>
						<ExternalLink className="w-4 h-4 mr-2" />
						Navegar entre artefactos
					</StandardDropdownMenu.Item>
				)}

				<StandardDropdownMenu.Item
					onClick={() =>
						router.push(`${pathname}?buscar=${encodeURIComponent(texto)}`)
					}>
					<Search className="w-4 h-4 mr-2" />
					Buscar en texto
				</StandardDropdownMenu.Item>

				{onEliminar && (
					<StandardDropdownMenu.Item onClick={() => onEliminar(item)}>
						<Trash2 className="w-4 h-4 mr-2" />
						Eliminar
					</StandardDropdownMenu.Item>
				)}
			</StandardDropdownMenu.Content>
		</StandardDropdownMenu>
	);
}
//#endregion ![main]
