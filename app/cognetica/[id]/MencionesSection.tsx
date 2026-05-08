//. 📍 app/cognetica/[id]/MencionesSection.tsx
/**
 * Sección "Menciones cartografiadas" del detalle de artefacto.
 *
 * - Carga en paralelo las 5 dimensiones usando el action
 *   `listarMencionesPorArtefacto` del Hito 2 (devuelve ya el coalesce
 *   humano → cartografiador → extractor vía vistas).
 * - Presenta cada dimensión como un sub-bloque con header (icono +
 *   título + contador) + botón para colapsar/expandir. El estado de
 *   "expandido por dimensión" es local a la sección del artefacto
 *   (no se persiste — es efímero dentro de la vista).
 * - Click en badge → abre `MencionEditModal`.
 * - Tras un save exitoso, refresca la lista de la dimensión afectada.
 *
 * Se renderiza **solo si hay al menos una mención** en al menos una
 * dimensión; si todas están vacías, muestra un estado informativo
 * indicando que aún no se ha ejecutado el Cartografiador (o que este
 * no encontró menciones).
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, FileDown, Loader2, Map } from "lucide-react";

import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";

import {
	listarMencionesPorArtefacto,
	type MencionConValorCanonico,
} from "@/lib/actions/cognetica-forense-menciones-actions";
import {
	DIMENSIONES,
	etiquetaDecision,
	type DimensionKey,
} from "@/lib/cognetica-forense/ui/menciones-ui-helpers";

import { MencionBadge } from "./MencionBadge";
import { MencionEditModal } from "./MencionEditModal";
//#endregion ![head]

//#region [def] - 📦 PROPS + ESTADO 📦
interface MencionesSectionProps {
	artefactoId: string;
	/** Indica si existe un Destilado generado. Si false, las menciones no pueden existir aún. */
	tieneDestilado?: boolean;
	/** Modo edición: true = editar menciones, false = navegar a entidades (default) */
	modoEdicion?: boolean;
	/** Callback para alternar entre modo edición y navegación */
	onToggleModoEdicion?: () => void;
	/** Trigger para forzar recarga de datos. Cada cambio de valor dispara un nuevo fetch. */
	refreshTrigger?: number;
	/** Callback para descarga Obsidian-friendly. */
	onDescargarObsidiana?: (tipo: "menciones", md: string) => Promise<void>;
	/** SHA-256 de la última descarga (8 chars para tooltip). */
	sha256Descarga?: string | null;
}

/** Mapa `DimensionKey → listado de menciones`. */
type MencionesPorDimension = Record<DimensionKey, MencionConValorCanonico[]>;

function estadoInicial(): MencionesPorDimension {
	return {
		pensadores: [],
		disciplinas: [],
		conceptos: [],
		teorias: [],
		citas: [],
	};
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function MencionesSection({
	artefactoId,
	tieneDestilado = true,
	modoEdicion = false,
	onToggleModoEdicion,
	refreshTrigger,
	onDescargarObsidiana,
	sha256Descarga,
}: MencionesSectionProps) {
	const [menciones, setMenciones] =
		useState<MencionesPorDimension>(estadoInicial());
	const [loading, setLoading] = useState(true);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [expandidas, setExpandidas] = useState<Set<DimensionKey>>(
		// Por default todas expandidas para descubrimiento inmediato.
		new Set(DIMENSIONES.map((d) => d.key)),
	);
	const [itemEditando, setItemEditando] =
		useState<MencionConValorCanonico | null>(null);

	const cargar = useCallback(async () => {
		setLoading(true);
		setErrorMsg(null);
		// 5 fetches paralelos — `listarMencionesPorArtefacto` es barato
		// porque cada uno hace solo 2 SELECT (tabla + vista).
		const results = await Promise.all(
			DIMENSIONES.map((d) => listarMencionesPorArtefacto(artefactoId, d.tipo)),
		);
		const nuevo = estadoInicial();
		let huboError = false;
		DIMENSIONES.forEach((d, idx) => {
			const r = results[idx];
			if (r.ok) {
				nuevo[d.key] = r.data;
			} else {
				huboError = true;
				console.error(`[MencionesSection] fetch ${d.key} falló:`, r.error);
			}
		});
		setMenciones(nuevo);
		if (huboError) {
			setErrorMsg(
				"Algunas dimensiones no se pudieron cargar. Revisa la consola del servidor.",
			);
		}
		setLoading(false);
	}, [artefactoId]);

	useEffect(() => {
		void cargar();
	}, [cargar, refreshTrigger]);

	const toggleDimension = (key: DimensionKey) => {
		setExpandidas((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	/** Expande o contrae todas las dimensiones a la vez. */
	const expandirContraerTodas = (expandir: boolean) => {
		if (expandir) {
			setExpandidas(new Set(DIMENSIONES.map((d) => d.key)));
		} else {
			setExpandidas(new Set());
		}
	};

	const todasExpandidas = expandidas.size === DIMENSIONES.length;

	const totalMenciones = DIMENSIONES.reduce(
		(acc, d) => acc + menciones[d.key].length,
		0,
	);

	/** Construye markdown de menciones para descarga Obsidian. */
	const construirMDMenciones = (): string => {
		const lines: string[] = ["# Menciones cartografiadas", ""];
		for (const d of DIMENSIONES) {
			const items = menciones[d.key];
			if (items.length === 0) continue;
			lines.push(`## ${d.labelPlural} (${items.length})`);
			lines.push("");
			for (const m of items) {
				const vc = m.valor_canonico as Record<string, unknown>;
				const nombre = (vc.nombre_canonico_actual as string | null) ?? (vc.texto_canonico_actual as string | null) ?? "(sin nombre)";
				const decisionLabel = etiquetaDecision(vc.decision_cartografiador as any);
				lines.push(`- **${nombre}** — _${decisionLabel}_`);
			}
			lines.push("");
		}
		if (totalMenciones === 0) {
			lines.push("_No hay menciones registradas._");
		}
		return lines.join("\n");
	};

	return (
		<StandardCard colorScheme="neutral" styleType="subtle" className="mt-4">
			<StandardCard.Header className="flex flex-col items-start gap-3">
				<div className="flex items-center gap-3">
					<StandardIcon>
						<Map className="h-5 w-5 text-tertiary" />
					</StandardIcon>
					<div>
						<StandardText preset="subheading" weight="semibold">
							Menciones cartografiadas
						</StandardText>
						<StandardText size="xs" colorScheme="neutral">
							{loading ?
								"Cargando…"
							: totalMenciones === 0 ?
								"Ninguna mención registrada aún."
							:	`${totalMenciones} mención${totalMenciones === 1 ? "" : "es"} distribuidas en ${
									DIMENSIONES.filter((d) => menciones[d.key].length > 0).length
								} dimensión(es).`
							}
						</StandardText>
					</div>
				</div>

				<div className="flex flex-col gap-2 w-full">
					{onDescargarObsidiana && totalMenciones > 0 && (
						<StandardButton
							styleType="ghost"
							size="sm"
							colorScheme="primary"
							onClick={() => onDescargarObsidiana("menciones", construirMDMenciones())}
							leftIcon={FileDown}
							tooltip={
								sha256Descarga
									? `SHA-256: ${sha256Descarga.slice(0, 8)}…`
									: "Descargar para Obsidian (con frontmatter y semillas)"
							}
							className="w-full justify-start">
							Obsidian
						</StandardButton>
					)}
					<StandardButton
						styleType="ghost"
						size="sm"
						colorScheme="neutral"
						onClick={() => expandirContraerTodas(!todasExpandidas)}
						className="w-full justify-start">
						{todasExpandidas ? "Contraer todo" : "Expandir todo"}
					</StandardButton>
					{onToggleModoEdicion && (
						<StandardButton
							styleType="ghost"
							size="sm"
							colorScheme="primary"
							onClick={onToggleModoEdicion}
							className="w-full justify-start">
							{modoEdicion ? "Modo navegación" : "Modo edición"}
						</StandardButton>
					)}
				</div>
			</StandardCard.Header>

			<StandardCard.Content className="space-y-3">
				{loading && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<StandardText size="sm" colorScheme="neutral">
							Cargando menciones…
						</StandardText>
					</div>
				)}

				{errorMsg && (
					<StandardAlert
						colorScheme="warning"
						styleType="subtle"
						title="Carga parcial"
						message={errorMsg}
					/>
				)}

				{!loading &&
					totalMenciones === 0 &&
					!errorMsg &&
					(tieneDestilado ?
						<StandardAlert
							colorScheme="neutral"
							styleType="subtle"
							title="Sin menciones"
							message="Ejecuta el Cartografiador desde el encabezado para poblar esta sección. Si ya lo hiciste, el modelo no encontró entidades cartografiables en el Destilado."
						/>
					:	<StandardAlert
							colorScheme="neutral"
							styleType="subtle"
							title="Menciones pendientes"
							message="Las menciones se extraerán automáticamente al completarse el Destilado. Inicia la metabolización desde el encabezado para comenzar."
						/>)}

				{!loading &&
					totalMenciones > 0 &&
					DIMENSIONES.map((d) => {
						const items = menciones[d.key];
						if (items.length === 0) return null;
						const expandida = expandidas.has(d.key);
						const Icon = d.icon;
						return (
							<div
								key={d.key}
								className="border-t pt-3 first:border-t-0 first:pt-0">
								<div className="flex items-center gap-2">
									<StandardButton
										styleType="ghost"
										size="sm"
										colorScheme="neutral"
										onClick={() => toggleDimension(d.key)}
										leftIcon={expandida ? ChevronDown : ChevronRight}
										aria-expanded={expandida}
										aria-controls={`dim-${d.key}`}>
										<span className="flex items-center gap-2">
											<Icon className="h-4 w-4" />
											<span>{d.labelPlural}</span>
										</span>
									</StandardButton>
									<StandardBadge
										colorScheme={d.colorScheme}
										styleType="solid"
										size="sm">
										{items.length}
									</StandardBadge>
								</div>

								{expandida && (
									<div
										id={`dim-${d.key}`}
										className="mt-2 flex flex-wrap gap-2">
										{items.map((m) => (
											<MencionBadge
												key={m.mencion.id}
												item={m}
												onClick={modoEdicion ? setItemEditando : undefined}
												mostrarConfianza
												colorScheme={d.colorScheme}
												artefactoId={artefactoId}
												modoEdicion={modoEdicion}
											/>
										))}
									</div>
								)}
							</div>
						);
					})}
			</StandardCard.Content>

			<MencionEditModal
				item={itemEditando}
				onClose={() => setItemEditando(null)}
				onSaved={() => {
					// Refetch para reflejar el nuevo valor canónico (que ahora
					// viene de Capa 3). Como las 5 dimensiones comparten la
					// misma carga, se recarga todo — es barato.
					void cargar();
				}}
			/>
		</StandardCard>
	);
}
//#endregion ![main]
