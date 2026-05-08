//. 📍 app/cognetica/[id]/ArtefactoView.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
	AlertCircle,
	BookOpen,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Download,
	FileDown,
	FileImage,
	FileText,
	Hourglass,
	Loader2,
	Mic,
	MinusCircle,
	ScrollText,
	Sparkles,
	Target,
} from "lucide-react";

import {
	StandardAccordion,
	StandardAccordionContent,
	StandardAccordionItem,
	StandardAccordionTrigger,
} from "@/components/ui/StandardAccordion";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardCard } from "@/components/ui/StandardCard";
import { DocumentoMarkdownViewer } from "./DocumentoMarkdownViewer";
import { StandardStepper } from "@/components/ui/StandardStepper";
import { StandardText } from "@/components/ui/StandardText";

import type { ArtefactoCompleto } from "@/lib/cognetica-forense/lecturas-shared";
import type {
	CgtCronica,
	CgtDestilado,
	CgtEstadoMetabolizacion,
	CgtGerminal,
	CgtMovimiento,
	CgtNucleo,
	CgtTension,
} from "@/lib/cognetica-forense/types";

import { BorrarButton } from "./BorrarButton";
import { CartografiadorButton } from "./CartografiadorButton";
import { ExtractorReferenciasButton } from "./ExtractorReferenciasButton";
import { StandardAudioPlayer } from "@/components/ui/StandardAudioPlayer";
import { SlidesViewer } from "./SlidesViewer";
import { MetabolizarButton } from "./MetabolizarButton";
import { ReferenciasSection } from "./ReferenciasSection";
import { MencionesSection } from "./MencionesSection";
import { useDescargaObsidiana } from "./hooks/useDescargaObsidiana";
import {
	extraerSemillas,
	generarTriadaObsidian,
	type MencionesExport,
	type MencionExport,
	type ReferenciaExport,
	type TriadaParams,
} from "@/lib/cognetica-forense/exportacion";
import { listarMencionesPorArtefacto } from "@/lib/actions/cognetica-forense-menciones-actions";
import { listarReferenciasPorArtefacto } from "@/lib/actions/cognetica-forense-referencias-actions";
import { DIMENSIONES } from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface ArtefactoViewProps {
	data: ArtefactoCompleto;
}

/**
 * Estado por-formato. `omitido` es específico del Germinal cuando el proyecto
 * no alcanza el umbral de 3 artefactos previos con Núcleo.
 */
type EstadoFormato =
	| "pendiente"
	| "generando"
	| "generado"
	| "error"
	| "omitido";

type ClaveFormato =
	| "pdf_marker"
	| "pdf_slides_imagenes"
	| "pdf_slides_marker"
	| "audio_transcripcion"
	| "cronica"
	| "destilado"
	| "nucleo"
	| "germinal";

interface InfoFormato {
	clave: ClaveFormato;
	titulo: string;
	descripcion: string;
	icon: React.ElementType;
	estado: EstadoFormato;
}
//#endregion ![def]

//#region [helpers] - 🛠️ DERIVACIÓN DE ESTADO 🛠️
/**
 * Calcula el estado visible de cada formato combinando:
 *   - presencia/ausencia de la fila en DB
 *   - `estado` global del artefacto (ingresado/metabolizando/metabolizado/error)
 *
 * Reglas:
 *   - Si la fila existe → `generado`.
 *   - Si la fila NO existe y el artefacto está en `metabolizando` → `generando`
 *     para el próximo formato en la secuencia, y `pendiente` para los siguientes.
 *   - Si la fila NO existe y el artefacto está en `error` → `error` solo en el
 *     primer formato que falte (los downstream quedan `pendiente`).
 *   - Germinal recibe `omitido` si el artefacto está `metabolizado` pero no hay
 *     fila (umbral de 3 artefactos previos no alcanzado).
 */
function derivarEstados(data: ArtefactoCompleto): InfoFormato[] {
	const { artefacto, cronica, destilado, nucleo, germinal, contenidoMarkdown } =
		data;
	const estadoGlobal: CgtEstadoMetabolizacion = artefacto.estado;
	const enProceso = estadoGlobal === "metabolizando";
	const enError = estadoGlobal === "error";
	const terminado = estadoGlobal === "metabolizado";

	// Para PDFs (informe): verificar si ya fue procesado por Marker.
	const esPdf = artefacto.tipo === "pdf_informe";
	const pdfProcesado = esPdf && Boolean(contenidoMarkdown);
	const pdfProcesando =
		esPdf && !contenidoMarkdown && estadoGlobal === "metabolizando";
	const pdfError = esPdf && !contenidoMarkdown && estadoGlobal === "error";

	// Para PDF Slides: verificar si las imágenes y páginas ya fueron procesadas.
	const esPdfSlides = artefacto.tipo === "pdf_slides";
	const tieneImagenes =
		esPdfSlides && Boolean((artefacto.metadata as Record<string, unknown>)?.has_images);
	const slidesProcesado = esPdfSlides && Boolean(data.pdf_slides?.paginas?.length);
	const slidesProcesando =
		esPdfSlides && !data.pdf_slides && estadoGlobal === "metabolizando";
	const slidesError =
		esPdfSlides && !data.pdf_slides && estadoGlobal === "error";

	// Para Audio: verificar si ya fue transcrito por WhisperX.
	const esAudio = artefacto.tipo === "audio";
	const audioProcesado = esAudio && Boolean(contenidoMarkdown);
	const audioProcesando =
		esAudio && !contenidoMarkdown && estadoGlobal === "metabolizando";
	const audioError = esAudio && !contenidoMarkdown && estadoGlobal === "error";

	const existe = [
		Boolean(cronica),
		Boolean(destilado),
		Boolean(nucleo),
		Boolean(germinal),
	] as const;
	const primerFaltante = existe.findIndex((v) => !v);

	function estadoDe(index: number, clave: InfoFormato["clave"]): EstadoFormato {
		if (existe[index]) return "generado";
		if (enProceso) return index === primerFaltante ? "generando" : "pendiente";
		if (enError) return index === primerFaltante ? "error" : "pendiente";
		if (terminado && clave === "germinal") return "omitido";
		return "pendiente";
	}

	const pasos: InfoFormato[] = [];

	// Paso 0 (solo para PDFs): Procesamiento Marker
	if (esPdf) {
		pasos.push({
			clave: "pdf_marker",
			titulo: "PDF / Marker",
			descripcion: "Extracción de texto estructurado del PDF.",
			icon: FileText,
			estado:
				pdfProcesado ? "generado"
				: pdfProcesando ? "generando"
				: pdfError ? "error"
				: "pendiente",
		});
	}

	// Paso 0a (solo para PDF Slides): Generación de imágenes
	if (esPdfSlides) {
		pasos.push({
			clave: "pdf_slides_imagenes",
			titulo: "PDF Slides / Imágenes",
			descripcion: "Conversión de cada página a PNG.",
			icon: FileImage,
			estado:
				tieneImagenes ? "generado"
				: slidesProcesando ? "generando"
				: slidesError ? "error"
				: "pendiente",
		});
	}

	// Paso 0b (solo para PDF Slides): Marker por página
	if (esPdfSlides) {
		pasos.push({
			clave: "pdf_slides_marker",
			titulo: "PDF Slides / Marker",
			descripcion: "Extracción de texto con Marker.",
			icon: FileText,
			estado:
				slidesProcesado ? "generado"
				: slidesProcesando ? "generando"
				: slidesError ? "error"
				: "pendiente",
		});
	}

	// Paso 0 (solo para Audio): Transcripción WhisperX
	if (esAudio) {
		pasos.push({
			clave: "audio_transcripcion",
			titulo: "Audio / WhisperX",
			descripcion: "Transcripción con diarización de hablantes.",
			icon: Mic,
			estado:
				audioProcesado ? "generado"
				: audioProcesando ? "generando"
				: audioError ? "error"
				: "pendiente",
		});
	}

	// Pasos 1-4: Pipeline de metabolización
	pasos.push(
		{
			clave: "cronica",
			titulo: "Crónica",
			descripcion: "Reconstrucción narrativa con voz literaria.",
			icon: ScrollText,
			estado: estadoDe(0, "cronica"),
		},
		{
			clave: "destilado",
			titulo: "Destilado",
			descripcion: "Anatomía argumental (tesis · movimientos · tensiones).",
			icon: FileText,
			estado: estadoDe(1, "destilado"),
		},
		{
			clave: "nucleo",
			titulo: "Núcleo",
			descripcion: "Tarjeta de presentación irreductible (≤600 tok).",
			icon: Target,
			estado: estadoDe(2, "nucleo"),
		},
		{
			clave: "germinal",
			titulo: "Germinal parcial",
			descripcion: "Cartografía de posibilidades abiertas.",
			icon: Sparkles,
			estado: estadoDe(3, "germinal"),
		},
	);

	return pasos;
}

/**
 * Mapea cada estado de formato a la paleta de colores del ecosistema Standard UI.
 */
function colorSchemeDe(
	estado: EstadoFormato,
): "success" | "primary" | "warning" | "danger" | "neutral" {
	switch (estado) {
		case "generado":
			return "success";
		case "generando":
			return "primary";
		case "error":
			return "danger";
		case "omitido":
			return "warning";
		case "pendiente":
		default:
			return "neutral";
	}
}

function iconoEstado(estado: EstadoFormato): React.ElementType {
	switch (estado) {
		case "generado":
			return CheckCircle2;
		case "generando":
			return Loader2;
		case "error":
			return AlertCircle;
		case "omitido":
			return MinusCircle;
		case "pendiente":
		default:
			return Clock;
	}
}

function etiquetaEstado(estado: EstadoFormato): string {
	switch (estado) {
		case "generado":
			return "Listo";
		case "generando":
			return "Generando…";
		case "error":
			return "Con error";
		case "omitido":
			return "Omitido";
		case "pendiente":
		default:
			return "Pendiente";
	}
}

function etiquetaEstadoGlobal(estado: CgtEstadoMetabolizacion): string {
	switch (estado) {
		case "ingresado":
			return "Ingresado";
		case "metabolizando":
			return "Metabolizando";
		case "metabolizado":
			return "Metabolizado";
		case "error":
			return "Con error";
	}
}

function colorSchemeGlobal(
	estado: CgtEstadoMetabolizacion,
): "neutral" | "primary" | "success" | "danger" {
	switch (estado) {
		case "ingresado":
			return "neutral";
		case "metabolizando":
			return "primary";
		case "metabolizado":
			return "success";
		case "error":
			return "danger";
	}
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ MARKDOWN HELPERS PARA TRÍADA 🛠️
/**
 * Construye markdown del Destilado (mismo formato que DestiladoView).
 */
function construirMDDestiladoView(d: CgtDestilado): string {
	const movs: CgtMovimiento[] = Array.isArray(d.movimientos) ? d.movimientos : [];
	const tens: CgtTension[] = Array.isArray(d.tensiones) ? d.tensiones : [];
	const partes: string[] = [];
	if (d.tesis) partes.push(`# Tesis\n\n${d.tesis}`);
	if (movs.length > 0) {
		const movimientosMd = movs
			.map((m) => `${m.orden}. **${m.desde} → ${m.hacia}**: ${m.texto}`)
			.join("\n");
		partes.push(`# Movimientos (${movs.length})\n\n${movimientosMd}`);
	}
	if (tens.length > 0) {
		const tensionesMd = tens
			.map((t) => `- *[${t.tipo}]* ${t.texto}`)
			.join("\n");
		partes.push(`# Tensiones (${tens.length})\n\n${tensionesMd}`);
	}
	if (d.cita_nucleo) {
		const citaMd = [
			`> "${d.cita_nucleo.texto}"`,
			`> — ${d.cita_nucleo.ubicacion}${d.cita_nucleo.autor ? ` · ${d.cita_nucleo.autor}` : ""}`,
		].join("\n");
		partes.push(`# Cita núcleo\n\n${citaMd}`);
	}
	return partes.join("\n\n---\n\n");
}

/**
 * Construye markdown del Núcleo (mismo formato que NucleoView).
 */
function construirMDNucleoView(n: CgtNucleo): string {
	const movs = Array.isArray(n.movimientos_esenciales) ? n.movimientos_esenciales : [];
	const partes: string[] = [];
	if (n.tesis) partes.push(`# Tesis\n\n${n.tesis}`);
	if (movs.length > 0) {
		const movimientosMd = movs
			.map((m) => `${m.orden}. ${m.texto}`)
			.join("\n");
		partes.push(`# Movimientos esenciales (${movs.length})\n\n${movimientosMd}`);
	}
	if (n.tension_irreductible) partes.push(`# Tensión irreductible\n\n${n.tension_irreductible}`);
	if (n.cita_nucleo) partes.push(`# Cita núcleo\n\n> "${n.cita_nucleo.texto}"`);
	return partes.join("\n\n---\n\n");
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Vista detallada de un artefacto metabolizado (o en proceso).
 *
 * Mientras el artefacto está en `metabolizando`, hace polling a `router.refresh()`
 * cada 4 segundos para re-ejecutar el Server Component padre y traer filas
 * nuevas conforme el orquestador avanza. El polling se detiene apenas el
 * estado global pasa a `metabolizado` o `error`.
 */
export function ArtefactoView({ data }: ArtefactoViewProps) {
	const router = useRouter();
	const { proyectoActual } = useAuth();
	const { artefacto } = data;
	const formatos = useMemo(() => derivarEstados(data), [data]);
	// Modo edición: OFF por default (navegación), ON para editar menciones
	const [modoEdicion, setModoEdicion] = useState(false);
	// Trigger para refrescar secciones de referencias/fuentes sin recargar la página
	const [refreshReferenciasTrigger, setRefreshReferenciasTrigger] = useState(0);
	// Trigger para refrescar sección de menciones cartografiadas
	const [refreshMencionesTrigger, setRefreshMencionesTrigger] = useState(0);
	// Pipeline: minimizado por default cuando todo está completado
	const todosGenerados = formatos.every((f) => f.estado === "generado" || f.estado === "omitido");
	const [pipelineMinimizado, setPipelineMinimizado] = useState(todosGenerados);

	// ─── SEMILLAS (para frontmatter Obsidian) ───
	const [semillas, setSemillas] = useState<string[]>([]);

	// Cargar menciones para extraer tags semilla (una vez)
	useEffect(() => {
		let cancel = false;
		const cargar = async () => {
			try {
				const results = await Promise.all(
					DIMENSIONES.map((d) => listarMencionesPorArtefacto(artefacto.id, d.tipo)),
				);
				if (cancel) return;
				const menciones: Record<string, any[]> = {};
				DIMENSIONES.forEach((d, idx) => {
					const r = results[idx];
					if (r.ok) menciones[d.key] = r.data;
				});
				const tags = extraerSemillas(menciones);
				setSemillas(tags);
			} catch (err) {
				console.warn("[ArtefactoView] No se pudieron cargar semillas:", err);
			}
		};
		void cargar();
		return () => { cancel = true; };
	}, [artefacto.id, refreshMencionesTrigger]);

	// ─── DESCARGA OBSIDIAN-FRIENDLY ───
	const {
		descargarSeccion,
		sha256Actual: sha256Descarga,
	} = useDescargaObsidiana({
		artefactoId: artefacto.id,
		projectId: artefacto.project_id,
		titulo: artefacto.titulo ?? "Artefacto sin título",
		tipoArtefacto: artefacto.tipo,
		sha256Artefacto: artefacto.sha256_json,
		semillas,
	});

	// ─── TRÍADA (descarga completa) ───
	const [triadaAbierto, setTriadaAbierto] = useState(false);
	const triadaRef = useRef<HTMLDivElement>(null);

	// Cerrar dropdown al hacer click fuera
	useEffect(() => {
		if (!triadaAbierto) return;
		const handler = (e: MouseEvent) => {
			if (triadaRef.current && !triadaRef.current.contains(e.target as Node)) {
				setTriadaAbierto(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [triadaAbierto]);

	const manejarDescargaTriada = async (formato: "md" | "json" | "yaml") => {
		setTriadaAbierto(false);
		try {
			// 1. Cargar menciones y referencias frescas
			const [mencionesRes, referenciasRes] = await Promise.all([
				Promise.all(
					DIMENSIONES.map((d) => listarMencionesPorArtefacto(artefacto.id, d.tipo)),
				),
				listarReferenciasPorArtefacto(artefacto.id),
			]);

			// Construir menciones export
			const mencionesMap: Record<string, { data: any[] }> = {};
			DIMENSIONES.forEach((d, idx) => {
				const r = mencionesRes[idx];
				if (r.ok) mencionesMap[d.key] = { data: r.data };
			});

			const construirMencionExport = (item: any): MencionExport => {
				const vc = item.valor_canonico as Record<string, unknown>;
				const nombre = (vc.nombre_canonico_actual as string | null)
					?? (vc.texto_canonico_actual as string | null)
					?? "(sin nombre)";
				return {
					nombre,
					decision: String(vc.decision_cartografiador ?? "—"),
					confianza: (vc.confianza_cartografiador as number | null) ?? null,
				};
			};

			const menciones: MencionesExport = {
				pensadores: (mencionesMap.pensadores?.data ?? []).map(construirMencionExport),
				disciplinas: (mencionesMap.disciplinas?.data ?? []).map(construirMencionExport),
				conceptos: (mencionesMap.conceptos?.data ?? []).map(construirMencionExport),
				teorias: (mencionesMap.teorias?.data ?? []).map(construirMencionExport),
				citas: (mencionesMap.citas?.data ?? []).map(construirMencionExport),
			};

			// Construir referencias export
			const referenciasData: ReferenciaExport[] = referenciasRes.ok
				? referenciasRes.data.map((r: any) => ({
						id: r.id,
						numero: r.numero_en_artefacto,
						titulo: r.titulo,
						autores: r.autores ?? [],
						ano: r.ano,
						fuente: r.fuente,
						url: r.url,
						tipo: r.tipo_referencia,
						confianza: r.confianza_extraccion,
					}))
				: [];

			// 2. Construir params de la tríada
			const proyectoNombre = proyectoActual?.name ?? artefacto.project_id;
			const triadaParams: TriadaParams = {
				artefactoId: artefacto.id,
				titulo: artefacto.titulo ?? "Artefacto sin título",
				proyecto: proyectoNombre,
				proyectoId: artefacto.project_id,
				tipoArtefacto: artefacto.tipo,
				sha256Artefacto: artefacto.sha256_json,
				tags: semillas,
				transcripcionMD: data.contenidoMarkdown ?? null,
				cronicaMD: data.cronica?.contenido ?? null,
				destiladoMD: data.destilado
					? construirMDDestiladoView(data.destilado)
					: null,
				nucleoMD: data.nucleo
					? construirMDNucleoView(data.nucleo)
					: null,
				germinalMD: data.germinal?.resumen ?? null,
				referencias: referenciasData,
				menciones,
			};

			// 3. Generar y descargar
			const resultado = await generarTriadaObsidian(triadaParams);
			const archivo =
				formato === "md" ? resultado.md
				: formato === "json" ? resultado.json
				: resultado.yaml;

			const blob = new Blob([archivo.contenido], {
				type:
					formato === "json" ? "application/json;charset=utf-8"
					: formato === "yaml" ? "text/yaml;charset=utf-8"
					: "text/markdown;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = archivo.nombreArchivo;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error("[ArtefactoView] Error al descargar tríada:", err);
		}
	};

	// ─── TIMING POR PASO ───
	// Trackea cuándo arrancó cada paso para mostrar elapsed time.
	const stepStartTimes = useRef<Record<string, number>>({});
	const [elapsedTick, setElapsedTick] = useState(0);

	// Registrar cuándo arranca un paso "generando"
	useEffect(() => {
		for (const f of formatos) {
			if (f.estado === "generando" && !stepStartTimes.current[f.clave]) {
				stepStartTimes.current[f.clave] = Date.now();
			}
		}
	}, [formatos]);

	// Tick cada segundo para actualizar elapsed time visible
	useEffect(() => {
		const hasActive = formatos.some((f) => f.estado === "generando");
		if (!hasActive) return;
		const id = setInterval(() => setElapsedTick((t) => t + 1), 1000);
		return () => clearInterval(id);
	}, [formatos]);

	function elapsedLabel(clave: string): string {
		const start = stepStartTimes.current[clave];
		if (!start) return "";
		const secs = Math.floor((Date.now() - start) / 1000);
		if (secs < 60) return `${secs}s`;
		const mins = Math.floor(secs / 60);
		const rem = secs % 60;
		return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
	}

	// Polling en vivo: solo durante metabolización o error.
	// NO se pollea en "ingresado" (espera que el usuario haga click en Metabolizar).
	useEffect(() => {
		if (artefacto.estado !== "metabolizando" && artefacto.estado !== "error") return;
		const id = setInterval(() => {
			router.refresh();
		}, 4000);
		return () => clearInterval(id);
	}, [artefacto.estado, router]);

	// Paso actual del Stepper (0-based).
	// - Si hay formato "generando" → ese es el currentStepIndex.
	// - Si todos los existentes son "generado" y no hay "generando" →
	//   currentStepIndex = cantidad de generados (apunta al próximo pendiente).
	// - En `metabolizado` completo → currentStepIndex = steps.length (todos ok).
	const currentStepIndex = useMemo(() => {
		const generando = formatos.findIndex((f) => f.estado === "generando");
		if (generando >= 0) return generando;
		const ultimoGenerado = formatos
			.map((f) => f.estado === "generado")
			.lastIndexOf(true);
		return ultimoGenerado + 1;
	}, [formatos]);

	const tipoLegible = artefacto.tipo
		.replace(/_/g, " ")
		.replace(/\b\w/g, (m) => m.toUpperCase());

	return (
		<div className="space-y-6">
			{/* Metadata y acciones del artefacto */}
			<StandardCard colorScheme="neutral" styleType="subtle">
				<StandardCard.Header className="flex flex-col gap-4">
					{/* Arriba: tipo, fecha y tesis */}
					<div className="space-y-2">
						<StandardText size="2xs" colorScheme="neutral" className="tracking-wide uppercase">
							{tipoLegible} · creado{" "}
							{new Date(artefacto.created_at).toLocaleString()}
						</StandardText>
						{data.nucleo?.tesis && (
							<StandardText
								size="base"
								weight="medium"
								colorScheme="primary"
								className="italic border-l-2 border-primary-300 pl-3 leading-relaxed">
								{data.nucleo.tesis}
							</StandardText>
						)}
					</div>

					{/* Abajo: botones en fila */}
					<div className="flex flex-wrap items-center gap-2">
						<StandardBadge
							colorScheme={
								(artefacto.tipo === "pdf_informe" && artefacto.estado === "ingresado" && !data.contenidoMarkdown) ? "primary"
								: (artefacto.tipo === "pdf_informe" && data.contenidoMarkdown && artefacto.estado === "ingresado") ? "success"
								: (artefacto.tipo === "pdf_slides" && artefacto.estado === "ingresado" && !data.pdf_slides) ? "primary"
								: (artefacto.tipo === "pdf_slides" && data.pdf_slides && artefacto.estado === "ingresado") ? "success"
								: colorSchemeGlobal(artefacto.estado)
							}>
							{(artefacto.tipo === "pdf_informe" && artefacto.estado === "ingresado" && !data.contenidoMarkdown) ?
								"Procesando PDF"
							: (artefacto.tipo === "pdf_informe" && data.contenidoMarkdown && artefacto.estado === "ingresado") ?
								"PDF procesado ✓"
							: (artefacto.tipo === "pdf_slides" && artefacto.estado === "ingresado" && !data.pdf_slides) ?
								"Procesando slides"
							: (artefacto.tipo === "pdf_slides" && data.pdf_slides && artefacto.estado === "ingresado") ?
								"Slides procesados ✓"
							:	etiquetaEstadoGlobal(artefacto.estado)}
						</StandardBadge>
						<MetabolizarButton
							artefactoId={artefacto.id}
							estado={artefacto.estado}
							faltantes={[
								...(data.cronica ? [] : (["cronica"] as const)),
								...(data.destilado ? [] : (["destilado"] as const)),
								...(data.nucleo ? [] : (["nucleo"] as const)),
								...(data.germinal ? [] : (["germinal"] as const)),
							]}
						/>
						{/*
						 * Cartografiador habilitado cuando los 4 formatos primarios
						 * están en verde y el artefacto no está metabolizando.
						 * Germinal puede estar omitido (umbral < 3 artefactos); no
						 * bloquea el Cartografiador — cartografiamos con lo que haya.
						 */}
						<CartografiadorButton
							artefactoId={artefacto.id}
							habilitado={
								artefacto.estado !== "metabolizando" &&
								Boolean(data.cronica) &&
								Boolean(data.destilado) &&
								Boolean(data.nucleo)
							}
							onSuccess={() => setRefreshMencionesTrigger((t) => t + 1)}
						/>

						{/**
						 * Botón de Extracción de Referencias (Hito 6 · Opción B).
						 * Se habilita cuando existe Destilado (incluye total_referencias_detectadas).
						 */}
						<ExtractorReferenciasButton
							artefactoId={artefacto.id}
							habilitado={
								artefacto.estado !== "metabolizando" && Boolean(data.destilado)
							}
							onSuccess={() => setRefreshReferenciasTrigger((t) => t + 1)}
						/>

						{/* Tríada: exportar artefacto completo */}
						<div className="relative" ref={triadaRef}>
							<button
								type="button"
								onClick={() => setTriadaAbierto((v) => !v)}
								className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors">
								<Download className="w-4 h-4" />
								<span>Exportar</span>
							</button>
							{triadaAbierto && (
								<div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white border border-neutral-200 rounded-lg shadow-lg py-1">
									<button
										type="button"
										onClick={() => manejarDescargaTriada("md")}
										className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors text-left">
										<FileDown className="w-4 h-4" />
										Markdown (.md)
									</button>
									<button
										type="button"
										onClick={() => manejarDescargaTriada("json")}
										className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors text-left">
										<Download className="w-4 h-4" />
										JSON (.json)
									</button>
									<button
										type="button"
										onClick={() => manejarDescargaTriada("yaml")}
										className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors text-left">
										<Download className="w-4 h-4" />
										YAML (.yaml)
									</button>
								</div>
							)}
						</div>

						{/* Separador visual antes del botón de peligro */}
						<div className="w-px h-6 bg-neutral-200 mx-1" />

						{/* Botón de eliminación — siempre visible, con confirmación */}
						<BorrarButton
							artefactoId={artefacto.id}
							artefactoTitulo={artefacto.titulo ?? "Artefacto sin título"}
						/>
					</div>
				</StandardCard.Header>

				{artefacto.estado === "error" && artefacto.error_mensaje && (
					<StandardCard.Content>
						<StandardAlert
							colorScheme="danger"
							styleType="subtle"
							title="Error en metabolización"
							message={artefacto.error_mensaje}
						/>
					</StandardCard.Content>
				)}

				{/* SHA ahora en el título de página */}
			</StandardCard>

			{/* Pipeline de metabolización — colapsable */}
			<StandardCard colorScheme="primary" styleType="subtle">
				<button
					type="button"
					onClick={() => setPipelineMinimizado((v) => !v)}
					className="w-full text-left">
					<StandardCard.Header className="flex items-center justify-between gap-3 cursor-pointer">
						<div className="flex items-center gap-3">
							<StandardText preset="subheading" weight="semibold">
								Pipeline de metabolización
							</StandardText>
							{pipelineMinimizado && (
								<StandardBadge
									colorScheme={todosGenerados ? "success" : "primary"}
									styleType={todosGenerados ? "solid" : "subtle"}
									size="sm">
									{todosGenerados
										? "Completado"
										: `${formatos.filter((f) => f.estado === "generado").length}/${formatos.length} listos`}
								</StandardBadge>
							)}
						</div>
						{pipelineMinimizado ? (
							<ChevronDown className="h-5 w-5 text-neutral-400" />
						) : (
							<ChevronUp className="h-5 w-5 text-neutral-400" />
						)}
					</StandardCard.Header>
				</button>

				{!pipelineMinimizado && (
					<StandardCard.Content>
						<StandardStepper
							steps={formatos.map((f) => {
								const statusMap: Record<EstadoFormato, "pending" | "active" | "completed" | "error"> = {
									pendiente: "pending",
									generando: "active",
									generado: "completed",
									error: "error",
									omitido: "pending",
								};
								const elapsed = f.estado === "generando" ? elapsedLabel(f.clave) : "";
								return {
									id: f.clave,
									label: f.titulo,
									description: f.estado === "generando"
										? `Procesando…${elapsed ? ` (${elapsed})` : ""}`
										: etiquetaEstado(f.estado),
									icon: f.icon,
									status: statusMap[f.estado],
								};
							})}
							currentStepIndex={currentStepIndex}
							variant="primary"
						/>
					</StandardCard.Content>
				)}
			</StandardCard>

			{/*
			 * Menciones cartografiadas (Hito 4 · Oleada 2).
			 * El componente se autogestiona: si aún no hay Destilado,
			 * muestra mensaje de espera; si hay Destilado pero no menciones,
			 * indica ejecutar Cartografiador.
			 *
			 * Layout: en pantallas ≥lg se muestra como sidebar vertical
			 * a la derecha del acordeón principal.
			 */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
				{/* Columna principal: Acordeón de 5 secciones + Referencias */}
				<StandardAccordion type="multiple" styleType="subtle" defaultValue={["original"]}>
				<StandardAccordionItem value="original" colorScheme="neutral">
					<StandardAccordionTrigger>
						<SeccionHeader
							icon={FileText}
							titulo="Transcripción original"
							estado="generado"
							extra={
								artefacto.storage_path_original ? "Disponible" : "Sin archivo"
							}
						/>
					</StandardAccordionTrigger>
					<StandardAccordionContent>
						<SeccionOriginal
							data={data}
							descargarObsidiana={descargarSeccion}
							sha256Descarga={sha256Descarga}
						/>
					</StandardAccordionContent>
				</StandardAccordionItem>

				{formatos
					.filter(
						(f) =>
							f.clave !== "pdf_marker" &&
							f.clave !== "pdf_slides_imagenes" &&
							f.clave !== "pdf_slides_marker" &&
							f.clave !== "audio_transcripcion",
					)
					.map((f) => (
						<StandardAccordionItem
							key={f.clave}
							value={f.clave}
							colorScheme={colorSchemeDe(f.estado)}>
							<StandardAccordionTrigger>
								<SeccionHeader
									icon={f.icon}
									titulo={f.titulo}
									estado={f.estado}
									extra={f.descripcion}
								/>
							</StandardAccordionTrigger>
							<StandardAccordionContent>
								<SeccionFormato
									clave={f.clave}
									data={data}
									estado={f.estado}
									onDescargarObsidiana={descargarSeccion}
									sha256Descarga={sha256Descarga}
								/>
							</StandardAccordionContent>
						</StandardAccordionItem>
					))}

				{/* Referencias bibliográficas (sub-paso 6.4) */}
				{data.destilado && (
					<StandardAccordionItem value="referencias" colorScheme="accent">
						<StandardAccordionTrigger>
							<SeccionHeader
								icon={BookOpen}
								titulo="Referencias bibliográficas"
								estado="generado"
							/>
						</StandardAccordionTrigger>
						<StandardAccordionContent>
							<ReferenciasSection
								artefactoId={artefacto.id}
								refreshTrigger={refreshReferenciasTrigger}
								onDescargarObsidiana={descargarSeccion}
								sha256Descarga={sha256Descarga}
							/>
						</StandardAccordionContent>
					</StandardAccordionItem>
				)}
			</StandardAccordion>

				{/* Sidebar: Menciones cartografiadas */}
				<aside className="lg:sticky lg:top-4">
					<MencionesSection
						artefactoId={artefacto.id}
						tieneDestilado={Boolean(data.destilado)}
						modoEdicion={modoEdicion}
						onToggleModoEdicion={() => setModoEdicion((v) => !v)}
						refreshTrigger={refreshMencionesTrigger}
						onDescargarObsidiana={descargarSeccion}
						sha256Descarga={sha256Descarga}
					/>
				</aside>
			</div>

		</div>
	);
}
//#endregion ![main]

//#region [sub] - 🧩 SECCIÓN HEADER 🧩
function SeccionHeader({
	icon: Icon,
	titulo,
	estado,
	extra,
}: {
	icon: React.ElementType;
	titulo: string;
	estado: EstadoFormato;
	extra?: string;
}) {
	const EstadoIcon = iconoEstado(estado);
	return (
		<div className="flex w-full items-center justify-between gap-3">
			<div className="flex items-center gap-3">
				<Icon className="w-5 h-5 shrink-0" />
				<div className="flex flex-col items-start">
					<StandardText weight="semibold">{titulo}</StandardText>
					{extra && (
						<StandardText size="xs" colorScheme="neutral">
							{extra}
						</StandardText>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<EstadoIcon
					className={
						estado === "generando" ? "w-4 h-4 animate-spin" : "w-4 h-4"
					}
				/>
				<StandardBadge colorScheme={colorSchemeDe(estado)} size="sm">
					{etiquetaEstado(estado)}
				</StandardBadge>
			</div>
		</div>
	);
}
//#endregion ![sub]

//#region [sub] - 🧩 SECCIÓN ORIGINAL 🧩
function SeccionOriginal({
	data,
	descargarObsidiana,
	sha256Descarga,
}: {
	data: ArtefactoCompleto;
	descargarObsidiana?: (tipo: "transcripcion", md: string) => Promise<void>;
	sha256Descarga?: string | null;
}) {
	const { artefacto } = data;

	const contenidoMarkdown = data.contenidoMarkdown ?? null;
	const esPdf = artefacto.tipo === "pdf_informe";
	const esPdfSlides = artefacto.tipo === "pdf_slides";
	const esAudio = artefacto.tipo === "audio";
	const pdfInfo = data.pdf_informe;
	const pdfSlidesInfo = data.pdf_slides;
	const audioInfo = data.audio;
	const audioSegmentos = data.audio_segmentos ?? [];

	const esContenidoValido = contenidoMarkdown && !contenidoMarkdown.startsWith("%PDF");

	const audioSrc = artefacto.storage_path_original
		? `/api/storage/download?bucket=cognetica-files&path=${encodeURIComponent(artefacto.storage_path_original)}`
		: null;

	const segments = audioSegmentos.map((s) => ({
		text: s.texto ?? "",
		start: s.timestamp_inicio ?? 0,
		end: s.timestamp_fin ?? 0,
		speaker: s.hablante_id ? parseInt(String(s.hablante_id).replace("SPEAKER_", ""), 10) || 0 : undefined,
	}));

	const handleDownloadOriginal = () => {
		if (!artefacto.storage_path_original) return;
		const url = `/api/storage/download?bucket=cognetica-files&path=${encodeURIComponent(artefacto.storage_path_original)}`;
		const a = document.createElement("a");
		a.href = url;
		const ext = esAudio ? ".mp3" : ".pdf";
		a.download = artefacto.titulo.replace(/[^a-zA-Z0-9]/g, "_") + ext;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<StandardText size="sm">
					<strong>Tipo:</strong> {artefacto.tipo}
				</StandardText>
				{artefacto.descripcion && (
					<StandardText size="sm">
						<strong>Descripción:</strong> {artefacto.descripcion}
					</StandardText>
				)}
				{esPdf && pdfInfo?.doi && (
					<StandardText size="sm" className="font-mono">
						<strong>DOI:</strong> {pdfInfo.doi}
					</StandardText>
				)}
				{esAudio && audioInfo && (
					<>
						{audioInfo.idioma && (
							<StandardText size="sm">
								<strong>Idioma:</strong> {audioInfo.idioma}
							</StandardText>
						)}
						{audioInfo.duracion_seg && (
							<StandardText size="sm">
								<strong>Duración:</strong> {Math.floor(audioInfo.duracion_seg / 60)}:{String(Math.floor(audioInfo.duracion_seg % 60)).padStart(2, "0")}
							</StandardText>
						)}
						{audioInfo.hablantes && audioInfo.hablantes.length > 0 && (
							<StandardText size="sm">
								<strong>Hablantes:</strong> {audioInfo.hablantes.length}
							</StandardText>
						)}
					</>
				)}
			</div>

			{esPdfSlides ? (
				pdfSlidesInfo?.paginas?.length ?
					<SlidesViewer artefactoId={artefacto.id} />
				: <StandardAlert
						colorScheme="neutral"
						styleType="subtle"
						title="Presentación en procesamiento"
						message="Las láminas se están dividiendo y procesando. El visor estará disponible en unos momentos."
					/>
			) : esAudio ? (
				<StandardAudioPlayer
					storagePath={artefacto.storage_path_original}
					segments={segments}
					transcripcionMD={contenidoMarkdown}
					onDescargarObsidiana={contenidoMarkdown && descargarObsidiana ? () => descargarObsidiana("transcripcion", contenidoMarkdown) : undefined}
					sha256Descarga={sha256Descarga}
					onDescargarOriginal={artefacto.storage_path_original ? handleDownloadOriginal : undefined}
				/>
			) : esContenidoValido ? (
				<DocumentoMarkdownViewer
					content={contenidoMarkdown}
					titulo={artefacto.titulo}
					mostrarBusqueda={true}
					mostrarDescarga={false}
				/>
			) : esPdf && artefacto.estado === "error" ? (
				<StandardAlert
					colorScheme="danger"
					styleType="subtle"
					title="Error procesando PDF"
					message={
						artefacto.error_mensaje ??
						"No se pudo extraer el contenido del PDF. Intenta subirlo nuevamente."
					}
				/>
			) : esAudio && artefacto.estado === "error" ? (
				<StandardAlert
					colorScheme="danger"
					styleType="subtle"
					title="Error transcribiendo audio"
					message={
						artefacto.error_mensaje ??
						"No se pudo transcribir el audio. Intenta subirlo nuevamente."
					}
				/>
			) : esPdf && !contenidoMarkdown ? (
				<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="El PDF está siendo procesado por Marker. El contenido estará disponible en unos momentos."
				/>
			) : esAudio && !contenidoMarkdown ? (
				<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="El audio está siendo transcrito. La transcripción estará disponible en unos momentos."
				/>
			) : esPdf && contenidoMarkdown?.startsWith("%PDF") ? (
				<StandardAlert
					colorScheme="warning"
					styleType="subtle"
					title="Contenido no procesado"
					message="El archivo original no fue procesado por Marker aún. El contenido se mostrará aquí cuando esté disponible."
				/>
			) : (
				<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="No hay contenido disponible para visualizar."
				/>
			)}
		</div>
	);
}
//#endregion ![sub]

//#region [sub] - 🧩 SECCIÓN FORMATO 🧩
function SeccionFormato({
	clave,
	data,
	estado,
	onDescargarObsidiana,
	sha256Descarga,
}: {
	clave: InfoFormato["clave"];
	data: ArtefactoCompleto;
	estado: EstadoFormato;
	onDescargarObsidiana?: (
		tipoSeccion: "cronica" | "destilado" | "nucleo" | "germinal",
		contenidoMD: string,
	) => void;
	sha256Descarga?: string | null;
}) {
	// Placeholders informativos por estado.
	if (estado === "pendiente") {
		return (
			<StandardAlert
				colorScheme="neutral"
				styleType="subtle"
				message="Este formato aún no fue generado."
			/>
		);
	}
	if (estado === "generando") {
		return (
			<StandardAlert
				colorScheme="primary"
				styleType="subtle"
				title="Generándose"
				message="El orquestador está produciendo este formato. La vista se refresca automáticamente."
			/>
		);
	}
	if (estado === "omitido") {
		return (
			<StandardAlert
				colorScheme="warning"
				styleType="subtle"
				title="Omitido por umbral"
				message="El Germinal parcial requiere al menos 3 artefactos previos con Núcleo generado. Se generará automáticamente cuando el proyecto supere ese umbral."
			/>
		);
	}
	if (estado === "error") {
		return (
			<StandardAlert
				colorScheme="danger"
				styleType="subtle"
				title="Error al generar"
				message={
					data.artefacto.error_mensaje ??
					"Falló la generación de este formato. Consultar logs del orquestador."
				}
			/>
		);
	}

	// estado === "generado"
	switch (clave) {
		case "cronica": {
			const contenido = data.cronica?.contenido ?? "";
			return data.cronica ? (
				<CronicaView
					c={data.cronica}
					onDescargarObsidiana={onDescargarObsidiana && contenido ? () => onDescargarObsidiana("cronica", contenido) : undefined}
					sha256Descarga={sha256Descarga}
				/>
			) : null;
		}
		case "destilado":
			return data.destilado ? (
				<DestiladoView
					d={data.destilado}
					onDescargarObsidiana={onDescargarObsidiana ? (md: string) => onDescargarObsidiana("destilado", md) : undefined}
					sha256Descarga={sha256Descarga}
				/>
			) : null;
		case "nucleo":
			return data.nucleo ? (
				<NucleoView
					n={data.nucleo}
					onDescargarObsidiana={onDescargarObsidiana ? (md: string) => onDescargarObsidiana("nucleo", md) : undefined}
					sha256Descarga={sha256Descarga}
				/>
			) : null;
		case "germinal": {
			const contenido = data.germinal?.resumen ?? "";
			return data.germinal ? (
				<GerminalView
					g={data.germinal}
					onDescargarObsidiana={onDescargarObsidiana && contenido ? () => onDescargarObsidiana("germinal", contenido) : undefined}
					sha256Descarga={sha256Descarga}
				/>
			) : null;
		}
		default:
			return null;
	}
}

function CronicaView({
	c,
	onDescargarObsidiana,
	sha256Descarga,
}: {
	c: CgtCronica;
	onDescargarObsidiana?: () => void;
	sha256Descarga?: string | null;
}) {
	return (
		<div className="space-y-3">
			<MetaFormato
				tokens={c.tokens_count}
				modelo={c.modelo_ia}
				costo={c.costo_usd}
			/>
			{c.contenido ?
				<DocumentoMarkdownViewer
					content={c.contenido}
					titulo="Crónica"
					mostrarBusqueda={true}
					mostrarDescarga={true}
					onDescargarObsidiana={onDescargarObsidiana}
					sha256Descarga={sha256Descarga}
				/>
			:	<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="Crónica sin contenido."
				/>
			}
		</div>
	);
}

function DestiladoView({
	d,
	onDescargarObsidiana,
	sha256Descarga,
}: {
	d: CgtDestilado;
	onDescargarObsidiana?: (md: string) => void;
	sha256Descarga?: string | null;
}) {
	// Construir markdown completo del destilado para copiar todo
	const markdownCompleto = useMemo(() => {
		const movs: CgtMovimiento[] =
			Array.isArray(d.movimientos) ? d.movimientos : [];
		const tens: CgtTension[] = Array.isArray(d.tensiones) ? d.tensiones : [];
		const partes: string[] = [];

		if (d.tesis) {
			partes.push(`# Tesis\n\n${d.tesis}`);
		}

		if (movs.length > 0) {
			const movimientosMd = movs
				.map((m) => `${m.orden}. **${m.desde} → ${m.hacia}**: ${m.texto}`)
				.join("\n");
			partes.push(`# Movimientos (${movs.length})\n\n${movimientosMd}`);
		}

		if (tens.length > 0) {
			const tensionesMd = tens
				.map((t) => `- *[${t.tipo}]* ${t.texto}`)
				.join("\n");
			partes.push(`# Tensiones (${tens.length})\n\n${tensionesMd}`);
		}

		if (d.cita_nucleo) {
			const citaMd = [
				`> "${d.cita_nucleo.texto}"`,
				`> — ${d.cita_nucleo.ubicacion}${d.cita_nucleo.autor ? ` · ${d.cita_nucleo.autor}` : ""}`,
			].join("\n");
			partes.push(`# Cita núcleo\n\n${citaMd}`);
		}

		return partes.join("\n\n---\n\n");
	}, [d]);

	return (
		<div className="space-y-4">
			<MetaFormato
				tokens={d.tokens_count}
				modelo={d.modelo_ia}
				costo={d.costo_usd}
			/>

			{markdownCompleto ?
				<DocumentoMarkdownViewer
					content={markdownCompleto}
					titulo="Contenido del destilado"
					mostrarBusqueda={false}
					mostrarDescarga={false}
					compact={true}
					onDescargarObsidiana={onDescargarObsidiana ? () => onDescargarObsidiana(markdownCompleto) : undefined}
					sha256Descarga={sha256Descarga}
				/>
			:	<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="Destilado sin contenido."
				/>
			}
		</div>
	);
}

function NucleoView({
	n,
	onDescargarObsidiana,
	sha256Descarga,
}: {
	n: CgtNucleo;
	onDescargarObsidiana?: (md: string) => void;
	sha256Descarga?: string | null;
}) {
	// Construir markdown completo del núcleo para copiar todo
	const markdownCompleto = useMemo(() => {
		const movs =
			Array.isArray(n.movimientos_esenciales) ? n.movimientos_esenciales : [];
		const partes: string[] = [];

		if (n.tesis) {
			partes.push(`# Tesis\n\n${n.tesis}`);
		}

		if (movs.length > 0) {
			const movimientosMd = movs
				.map((m) => `${m.orden}. ${m.texto}`)
				.join("\n");
			partes.push(
				`# Movimientos esenciales (${movs.length})\n\n${movimientosMd}`,
			);
		}

		if (n.tension_irreductible) {
			partes.push(`# Tensión irreductible\n\n${n.tension_irreductible}`);
		}

		if (n.cita_nucleo) {
			partes.push(`# Cita núcleo\n\n> "${n.cita_nucleo.texto}"`);
		}

		return partes.join("\n\n---\n\n");
	}, [n]);

	return (
		<div className="space-y-4">
			<MetaFormato
				tokens={n.tokens_count}
				modelo={n.modelo_ia}
				costo={n.costo_usd}
			/>

			{markdownCompleto ?
				<DocumentoMarkdownViewer
					content={markdownCompleto}
					titulo="Contenido del núcleo"
					mostrarBusqueda={false}
					mostrarDescarga={false}
					compact={true}
					onDescargarObsidiana={onDescargarObsidiana ? () => onDescargarObsidiana(markdownCompleto) : undefined}
					sha256Descarga={sha256Descarga}
				/>
			:	<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="Núcleo sin contenido."
				/>
			}
		</div>
	);
}

function GerminalView({
	g,
	onDescargarObsidiana,
	sha256Descarga,
}: {
	g: CgtGerminal;
	onDescargarObsidiana?: () => void;
	sha256Descarga?: string | null;
}) {
	return (
		<div className="space-y-3">
			<MetaFormato
				tokens={g.tokens_count}
				modelo={g.modelo_ia}
				costo={g.costo_usd}
			/>
			{g.resumen ?
				<DocumentoMarkdownViewer
					content={g.resumen}
					titulo="Germinal parcial"
					mostrarBusqueda={true}
					mostrarDescarga={true}
					onDescargarObsidiana={onDescargarObsidiana}
					sha256Descarga={sha256Descarga}
				/>
			:	<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="Germinal sin resumen."
				/>
			}
		</div>
	);
}

function MetaFormato({
	tokens,
	modelo,
	costo,
}: {
	tokens: number | null;
	modelo: string | null;
	costo: number | null;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{tokens !== null && (
				<StandardBadge colorScheme="neutral" size="sm">
					{tokens} tok
				</StandardBadge>
			)}
			{modelo && (
				<StandardBadge colorScheme="neutral" size="sm">
					{modelo}
				</StandardBadge>
			)}
			{costo !== null && (
				<StandardBadge colorScheme="neutral" size="sm">
					US${costo.toFixed(4)}
				</StandardBadge>
			)}
		</div>
	);
}
//#endregion ![sub]
