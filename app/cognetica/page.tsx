//. 📍 app/cognetica/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Archive, Network, Upload, FileText, Loader2, RefreshCcw } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardText } from "@/components/ui/StandardText";
import {
	listarArtefactosConNucleo,
	type ArtefactoListadoItem,
} from "@/lib/actions/cognetica-forense-listado-actions";
import {
	listarResumenMencionesPorProyecto,
	type ResumenMencionesArtefacto,
} from "@/lib/actions/cognetica-forense-menciones-resumen-actions";
import {
	DIMENSIONES,
	type DimensionKey,
} from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
import type {
	CgtEstadoMetabolizacion,
	CgtTipoArtefacto,
} from "@/lib/cognetica-forense/types";
import { useDimensionesVisibles } from "./useDimensionesVisibles";
//#endregion ![head]

//#region [def] - 📦 MAPEOS DE UI 📦
/**
 * Emoji por tipo de artefacto. Complementa la etiqueta textual con un
 * ancla visual rápida. En Oleada 1 sólo `markdown` está implementado;
 * los demás se muestran para forward-compat cuando se habiliten.
 */
const EMOJI_POR_TIPO: Record<CgtTipoArtefacto, string> = {
	markdown: "📝",
	audio: "🎙️",
	video: "🎬",
	pdf_slides: "📊",
	pdf_informe: "📄",
	imagen: "🖼️",
};

const ETIQUETA_POR_TIPO: Record<CgtTipoArtefacto, string> = {
	markdown: "Markdown",
	audio: "Audio",
	video: "Video",
	pdf_slides: "PDF (slides)",
	pdf_informe: "PDF (informe)",
	imagen: "Imagen",
};

const ETIQUETA_ESTADO: Record<CgtEstadoMetabolizacion, string> = {
	ingresado: "Ingresado",
	metabolizando: "Metabolizando…",
	metabolizado: "Metabolizado",
	error: "Con error",
};

type BadgeColor =
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "neutral";

const COLOR_ESTADO: Record<CgtEstadoMetabolizacion, BadgeColor> = {
	ingresado: "neutral",
	metabolizando: "primary",
	metabolizado: "success",
	error: "danger",
};
//#endregion ![def]

//#region [helpers] - 🛠️ FASE Y PROGRESO 🛠️
/**
 * Calcula la fase actual del artefacto a partir de los flags de existencia.
 * Devuelve una dupla `[completadas, total]` y una etiqueta corta
 * (`"Crónica"`, `"Destilado"`, `"Núcleo"`, `"Germinal"`, `"Completo"`)
 * indicando el *próximo* paso pendiente (o "Completo" si todo está).
 */
function calcularFase(item: ArtefactoListadoItem): {
	completadas: number;
	total: number;
	siguiente: string;
} {
	const total = 4;
	const flags = [
		item.tiene_cronica,
		item.tiene_destilado,
		item.tiene_nucleo,
		item.tiene_germinal,
	];
	const nombres = ["Crónica", "Destilado", "Núcleo", "Germinal"];
	const completadas = flags.filter(Boolean).length;
	const idxFaltante = flags.findIndex((f) => !f);
	const siguiente = idxFaltante === -1 ? "Completo" : nombres[idxFaltante];
	return { completadas, total, siguiente };
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Directorio raíz de Cognética Forense — Oleada 1.
 *
 * Muestra los artefactos del proyecto activo como grid de `StandardCard`:
 *   - Emoji del tipo + título.
 *   - Descripción (tesis del Núcleo si ya está metabolizado, o la
 *     descripción libre del artefacto como fallback).
 *   - Estado global + fase de metabolización alcanzada (ej. "3/4 · Núcleo").
 *   - Click → detalle en `/cognetica/[id]`.
 *
 * Incluye CTA para subir artefacto y enlace al módulo legacy.
 */
export default function CogneticaForenseHome() {
	const { proyectoActual, loadingProyectos } = useAuth();
	const projectId = proyectoActual?.id ?? null;

	const [items, setItems] = useState<ArtefactoListadoItem[] | null>(null);
	const [resumenMenciones, setResumenMenciones] = useState<
		Record<string, ResumenMencionesArtefacto>
	>({});
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const prefsDimensiones = useDimensionesVisibles();

	const cargar = useCallback(async () => {
		if (!projectId) return;
		setLoading(true);
		setErrorMsg(null);
		// Cargas paralelas: listado base + resumen agregado de menciones.
		// Si el resumen falla, mostramos el listado sin badges en lugar
		// de romper toda la pantalla.
		const [resListado, resResumen] = await Promise.all([
			listarArtefactosConNucleo(projectId),
			listarResumenMencionesPorProyecto(projectId),
		]);
		if (resListado.ok) {
			setItems(resListado.data);
		} else {
			setErrorMsg(
				resListado.error === "INVALID_INPUT" ?
					"Proyecto no seleccionado."
				:	"No se pudo cargar el listado de artefactos.",
			);
			setItems([]);
		}
		if (resResumen.ok) {
			setResumenMenciones(resResumen.data);
		} else {
			console.warn(
				"[CogneticaForenseHome] resumen de menciones no disponible:",
				resResumen.error,
			);
			setResumenMenciones({});
		}
		setLoading(false);
	}, [projectId]);

	useEffect(() => {
		void cargar();
	}, [cargar]);

	return (
		<div className="container mx-auto py-8">
			<StandardPageTitle
				title="Cognética Forense"
				description="Directorio de artefactos metabolizados del proyecto activo."
				breadcrumbs={[{ label: "Cognética" }]}
				showBackButton={{ href: "/" }}
				actions={
					<div className="flex flex-wrap gap-2">
						<Link href="/cognetica/upload">
							<StandardButton
								colorScheme="primary"
								styleType="solid"
								leftIcon={Upload}>
								Subir artefacto
							</StandardButton>
						</Link>
						<Link href="/cognetica/grafo">
							<StandardButton
								colorScheme="tertiary"
								styleType="outline"
								leftIcon={Network}>
								Ver grafo
							</StandardButton>
						</Link>
						<StandardButton
							colorScheme="neutral"
							styleType="outline"
							leftIcon={RefreshCcw}
							onClick={() => void cargar()}
							loading={loading}
							disabled={!projectId}>
							Actualizar
						</StandardButton>
					</div>
				}
			/>

			{!loadingProyectos && !projectId && (
				<StandardAlert
					colorScheme="warning"
					styleType="subtle"
					className="mt-6"
					title="Sin proyecto activo"
					message="Selecciona un proyecto desde el selector superior para ver sus artefactos."
				/>
			)}

			{errorMsg && (
				<StandardAlert
					colorScheme="danger"
					styleType="subtle"
					className="mt-6"
					title="No se pudo cargar el listado"
					message={errorMsg}
				/>
			)}

			{projectId && loading && items === null && (
				<div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
					<Loader2 className="h-6 w-6 animate-spin" />
					<StandardText size="sm" colorScheme="neutral">
						Cargando artefactos…
					</StandardText>
				</div>
			)}

			{projectId && items !== null && items.length === 0 && !loading && (
				<div className="mt-12">
					<StandardEmptyState
						icon={FileText}
						title="Aún no hay artefactos"
						description="Sube tu primer artefacto markdown para comenzar a metabolizar."
						action={
							<Link href="/cognetica/upload">
								<StandardButton colorScheme="primary" leftIcon={Upload}>
									Subir artefacto
								</StandardButton>
							</Link>
						}
					/>
				</div>
			)}

			{projectId && items !== null && items.length > 0 && (
				<>
					<DimensionesToolbar
						visibles={prefsDimensiones.visibles}
						modo={prefsDimensiones.modo}
						onToggleDimension={prefsDimensiones.toggleDimension}
						onSetModo={prefsDimensiones.setModo}
						onMostrarTodas={prefsDimensiones.mostrarTodas}
						onOcultarTodas={prefsDimensiones.ocultarTodas}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
						{items.map((item) => (
							<ArtefactoCard
								key={item.id}
								item={item}
								resumen={resumenMenciones[item.id]}
								visibles={prefsDimensiones.visibles}
								modo={prefsDimensiones.modo}
							/>
						))}
					</div>
				</>
			)}

			<div className="mt-10">
				<StandardCard
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
					className="opacity-80">
					<div className="p-4">
						<div className="flex items-center gap-3 mb-2">
							<StandardIcon>
								<Archive className="h-5 w-5 text-primary" />
							</StandardIcon>
							<StandardText asElement="h2" weight="semibold" size="md">
								Cognética Legacy (v1)
							</StandardText>
						</div>
						<StandardText colorScheme="neutral" size="sm">
							Artefactos generados con el módulo anterior. Consultable mientras
							Oleada 1 sigue en desarrollo.
						</StandardText>
						<div className="mt-3">
							<Link href="/cognetica_old">
								<StandardButton
									styleType="outline"
									colorScheme="primary"
									size="sm">
									Ir a Cognética Legacy
								</StandardButton>
							</Link>
						</div>
					</div>
				</StandardCard>
			</div>
		</div>
	);
}
//#endregion ![main]

//#region [component] - 🔧 DimensionesToolbar 🔧
/**
 * Barra de controles globales para decidir cómo se presentan las
 * menciones cartografiadas en las tarjetas de artefacto.
 *
 * - 5 chips de dimensión con toggle on/off — click alterna visibilidad.
 * - Botón "Expandir/Compactar" alterna entre modo `counter` (solo
 *   cantidad) y `expandido` (cantidad + nombres top).
 * - Atajos "Todas" / "Ninguna" para reset rápido.
 *
 * El estado vive en `useDimensionesVisibles` y se persiste en
 * `localStorage` (`cognetica.raiz.dimensiones.v1`).
 */
function DimensionesToolbar({
	visibles,
	modo,
	onToggleDimension,
	onSetModo,
	onMostrarTodas,
	onOcultarTodas,
}: {
	visibles: Set<DimensionKey>;
	modo: "counter" | "expandido";
	onToggleDimension: (key: DimensionKey) => void;
	onSetModo: (modo: "counter" | "expandido") => void;
	onMostrarTodas: () => void;
	onOcultarTodas: () => void;
}) {
	return (
		<StandardCard
			colorScheme="neutral"
			styleType="subtle"
			hasOutline={false}
			accentPlacement="none"
			className="mt-6">
			<div className="p-3 flex flex-wrap items-center gap-2">
				<StandardText size="xs" weight="semibold" colorScheme="neutral">
					Menciones:
				</StandardText>
				{DIMENSIONES.map((d) => {
					const activa = visibles.has(d.key);
					return (
						<StandardButton
							key={d.key}
							size="sm"
							styleType={activa ? "solid" : "outline"}
							colorScheme={d.colorScheme}
							onClick={() => onToggleDimension(d.key)}>
							<span className="mr-1">{d.emoji}</span>
							{d.labelPlural}
						</StandardButton>
					);
				})}
				<div className="ml-auto flex flex-wrap items-center gap-2">
					<StandardButton
						size="sm"
						styleType="ghost"
						colorScheme="neutral"
						onClick={onMostrarTodas}>
						Todas
					</StandardButton>
					<StandardButton
						size="sm"
						styleType="ghost"
						colorScheme="neutral"
						onClick={onOcultarTodas}>
						Ninguna
					</StandardButton>
					<StandardButton
						size="sm"
						styleType={modo === "expandido" ? "solid" : "outline"}
						colorScheme="primary"
						onClick={() =>
							onSetModo(modo === "expandido" ? "counter" : "expandido")
						}>
						{modo === "expandido" ? "Compactar" : "Expandir nombres"}
					</StandardButton>
				</div>
			</div>
		</StandardCard>
	);
}
//#endregion ![component]

//#region [component] - 🔧 MencionesResumenInline 🔧
/**
 * Render interno del resumen de menciones en la tarjeta, según el modo
 * activo. Es el único lugar que decide entre counter y expandido.
 *
 *   - **counter**: una fila de chips con `emoji` + cuenta.
 *   - **expandido**: bloques por dimensión visible con emoji, label y
 *     lista de nombres top; un sufijo `+N` si hay más menciones que
 *     los `TOP_NOMBRES_POR_DIMENSION` incluidos en el resumen.
 *
 * En modo expandido, los badges de entidades son clickeables y navegan
 * a la vista raíz de la entidad (Hito 5 - Cognética Fluida).
 *
 * Si ninguna dimensión visible tiene datos, no renderiza nada —
 * evitamos ocupar espacio vacío en tarjetas de artefactos sin
 * menciones.
 */
function MencionesResumenInline({
	resumen,
	visibles,
	modo,
	artefactoId,
}: {
	resumen: ResumenMencionesArtefacto | undefined;
	visibles: Set<DimensionKey>;
	modo: "counter" | "expandido";
	artefactoId: string;
}) {
	if (!resumen || visibles.size === 0) return null;
	const dimsVisibles = DIMENSIONES.filter((d) => visibles.has(d.key));
	const algoVisible = dimsVisibles.some((d) => resumen[d.key].count > 0);
	if (!algoVisible) return null;

	if (modo === "counter") {
		return (
			<div className="flex flex-wrap gap-1.5">
				{dimsVisibles.map((d) => {
					const c = resumen[d.key].count;
					if (c === 0) return null;
					return (
						<StandardBadge
							key={d.key}
							colorScheme={d.colorScheme}
							styleType="solid"
							size="sm"
							title={d.labelPlural}>
							<span className="mr-1">{d.emoji}</span>
							{c}
						</StandardBadge>
					);
				})}
			</div>
		);
	}

	return (
		<div className="space-y-1.5">
			{dimsVisibles.map((d) => {
				const info = resumen[d.key];
				if (info.count === 0) return null;
				const overflow = info.count - info.topItems.length;
				return (
					<div key={d.key} className="flex flex-wrap items-center gap-1.5">
						<StandardBadge
							colorScheme={d.colorScheme}
							styleType="solid"
							size="sm">
							<span className="mr-1">{d.emoji}</span>
							{info.count}
						</StandardBadge>
						{info.topItems.map((item, idx) => (
							<EntidadBadge
								key={`${d.key}-${item.id}-${idx}`}
								dimension={d}
								item={item}
								artefactoId={artefactoId}
								index={idx}
							/>
						))}
						{overflow > 0 && (
							<StandardText size="xs" colorScheme="neutral">
								+{overflow}
							</StandardText>
						)}
					</div>
				);
			})}
		</div>
	);
}
//#endregion ![component]

//#region [component] - 🔧 EntidadBadge 🔧
/**
 * Badge de entidad individual con conteo opcional.
 * Usado en el modo expandido del resumen de menciones en la raíz.
 *
 * - Si menciones_count >= 2: muestra [Nombre · N] donde N navega a entidad
 * - Si menciones_count < 2: muestra solo Nombre, no navegable
 * - Las citas no tienen vista raíz, se renderizan como badge no clickeable
 *
 * NOTA: Usa onClick con router.push en lugar de <Link> para evitar
 * hydration error por <a> anidado dentro de <a> (la tarjeta ya es un Link).
 */
function EntidadBadge({
	dimension,
	item,
	artefactoId,
	index,
}: {
	dimension: (typeof DIMENSIONES)[number];
	item: { id: string; nombre: string; menciones_count: number };
	artefactoId: string;
	index: number;
}) {
	const router = useRouter();
	const contador = item.menciones_count;

	// Las citas no tienen vista raíz
	if (dimension.key === "citas") {
		return (
			<StandardBadge
				key={`cita-${index}`}
				colorScheme={dimension.colorScheme}
				styleType="outline"
				size="sm">
				<span className="truncate max-w-[10rem]">{item.nombre}</span>
			</StandardBadge>
		);
	}

	const href = `/cognetica/entidades/${dimension.key}/${item.id}?origen=${artefactoId}`;

	const handleContadorClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		router.push(href);
	};

	// Si contador >= 2: badge split con navegación solo en el número
	if (contador >= 2) {
		return (
			<StandardBadge
				colorScheme={dimension.colorScheme}
				styleType="outline"
				size="sm"
				className="inline-flex items-center gap-1 px-1 py-0.5"
				title={`Aparece en ${contador} artefactos`}>
				{/* Nombre: no navegable */}
				<span className="truncate max-w-[10rem]">{item.nombre}</span>
				{/* Separador */}
				<span className="opacity-40">·</span>
				{/* Contador: navegable */}
				<span
					className="cursor-pointer hover:opacity-80 font-semibold"
					onClick={handleContadorClick}
					role="link"
					tabIndex={0}
					aria-label={`Ver ${contador} apariciones`}>
					{contador}
				</span>
			</StandardBadge>
		);
	}

	// Sin contador (< 2): badge no navegable con tooltip informativo
	return (
		<StandardBadge
			colorScheme={dimension.colorScheme}
			styleType="outline"
			size="sm"
			title="Esta entidad no tiene otras concordancias en el proyecto">
			<span className="truncate max-w-[10rem]">{item.nombre}</span>
		</StandardBadge>
	);
}
//#endregion ![component]

//#region [component] - 🔧 ArtefactoCard 🔧
/**
 * Tarjeta individual de artefacto. Clickeable: linkea al detalle.
 *
 * - **Header**: emoji del tipo + título; badge lateral con el tipo legible.
 * - **Descripción**: `nucleo_tesis` si ya hay Núcleo; si no, la descripción
 *   libre del artefacto; si tampoco hay, un placeholder informativo.
 * - **Menciones**: resumen por dimensión según preferencias globales
 *   (ver `DimensionesToolbar`). Híbrido contador/expandido.
 * - **Footer**: badge del estado global + indicador de fase "n/4 · Siguiente".
 */
function ArtefactoCard({
	item,
	resumen,
	visibles,
	modo,
}: {
	item: ArtefactoListadoItem;
	resumen: ResumenMencionesArtefacto | undefined;
	visibles: Set<DimensionKey>;
	modo: "counter" | "expandido";
}) {
	const emoji = EMOJI_POR_TIPO[item.tipo] ?? "📦";
	const etiquetaTipo = ETIQUETA_POR_TIPO[item.tipo] ?? item.tipo;
	const { completadas, total, siguiente } = calcularFase(item);
	const descripcion =
		item.nucleo_tesis ??
		item.descripcion ??
		"Sin descripción. El Núcleo aparecerá aquí cuando se metabolice.";
	const esMetabolizado = item.estado === "metabolizado";

	return (
		<Link href={`/cognetica/${item.id}`} className="block h-full">
			<StandardCard
				colorScheme="neutral"
				styleType="subtle"
				className="h-full transition-shadow hover:shadow-md cursor-pointer">
				<StandardCard.Header className="flex flex-row items-start justify-between gap-3">
					<div className="flex items-start gap-3 min-w-0">
						<span
							aria-hidden
							className="text-3xl leading-none select-none flex-shrink-0">
							{emoji}
						</span>
						<div className="min-w-0">
							<StandardText
								preset="subheading"
								weight="bold"
								className="truncate">
								{item.titulo}
							</StandardText>
							<StandardText size="xs" colorScheme="neutral">
								{etiquetaTipo} ·{" "}
								{new Date(item.created_at).toLocaleDateString()}
							</StandardText>
						</div>
					</div>
				</StandardCard.Header>

				<StandardCard.Content className="space-y-3">
					<StandardText
						size="sm"
						colorScheme={item.nucleo_tesis ? "primary" : "neutral"}
						className={
							item.nucleo_tesis ? "line-clamp-4" : (
								"line-clamp-3 italic opacity-70"
							)
						}>
						{descripcion}
					</StandardText>

					<MencionesResumenInline
						resumen={resumen}
						visibles={visibles}
						modo={modo}
						artefactoId={item.id}
					/>
				</StandardCard.Content>

				<StandardCard.Footer className="flex flex-row items-center justify-between gap-2">
					<StandardBadge colorScheme={COLOR_ESTADO[item.estado]}>
						{ETIQUETA_ESTADO[item.estado]}
					</StandardBadge>
					<StandardText size="xs" colorScheme="neutral">
						{esMetabolizado && completadas === total ?
							"Tríada + Germinal ✓"
						:	`${completadas}/${total} · ${siguiente}`}
					</StandardText>
				</StandardCard.Footer>
			</StandardCard>
		</Link>
	);
}
//#endregion ![component]
