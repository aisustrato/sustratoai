// 📍 app/cognetica/[id]/SlidesViewer.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardMarkdownViewer } from "@/components/ui/StandardMarkdownViewer";
import {
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	Eye,
	AlertTriangle,
	Maximize2,
	X,
} from "lucide-react";
import {
	listArtifactPagesV2,
	getPagePdfUrlV2,
} from "@/lib/actions/cognetica-forense-slides-actions";
import { toast } from "sonner";

interface SlidesViewerProps {
	artefactoId: string;
}

interface PageData {
	pageId: string;
	pageNumber: number;
	status: "pending" | "processing" | "processed" | "failed";
	pdf_storage_path?: string;
	markdown_original?: string;
}

type ViewMode = "pdf" | "text";

// PDF viewer params para ocultar el toolbar nativo y ajustar a la ventana
// del iframe. `view=Fit` ajusta TANTO ancho como alto a la página completa,
// evitando bordes blancos grandes (que `view=FitH` solo ancho dejaba).
// Funcionan en PDFium (Chrome/Edge) y en el visor de Firefox (pdf.js
// interno). Safari ignora algunos parámetros pero igual renderiza.
const PDF_VIEW_PARAMS = "#toolbar=0&navpanes=0&view=Fit";

// TTL local para signed URLs cacheadas. Supabase las firma por 3600s (1h);
// usamos 55 min para tener 5 min de margen antes del expire real. Mientras
// el cache esté vigente, los cambios de slide no pegan a la red.
const PDF_URL_TTL_MS = 55 * 60 * 1000;

// Cuántas páginas a cada lado del current se MONTAN como iframes ocultos
// (opacity: 0). Esto pre-renderiza el PDF en el browser para que el cambio
// de slide sea instantáneo (no remountamos el iframe ni le pedimos al
// engine que descargue/render el PDF de nuevo). Radio 1 = 3 iframes vivos
// (prev, current, next). Subirlo da más fluidez al precio de más memoria.
const PRELOAD_RADIUS = 1;

export function SlidesViewer({ artefactoId }: SlidesViewerProps) {
	const [pages, setPages] = useState<PageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [viewMode, setViewMode] = useState<ViewMode>("pdf");
	const [isExporting, setIsExporting] = useState(false);
	const [isExportingImages, setIsExportingImages] = useState(false);
	const [retrying, setRetrying] = useState(false);
	// Aspect ratio del PDF (width/height). Default 16/9 — el más común en
	// slides modernas. Se detecta del primer PDF disponible con pdf-lib y
	// se aplica al viewer principal + thumbnails para que coincidan con
	// la geometría real de las láminas sin dejar bandas vacías.
	const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
	// Modo presentación: PDF a casi pantalla completa con chevrones a los
	// lados, sin distracciones de la página.
	const [modoPresentacion, setModoPresentacion] = useState(false);

	// Ref del contenedor scrollable de miniaturas — sirve como `root` del
	// IntersectionObserver de cada ThumbnailItem, para detectar lazy cuándo
	// entra al viewport horizontal y materializar su iframe sólo entonces.
	const thumbsContainerRef = useRef<HTMLDivElement>(null);

	// Cache de URLs firmadas de PDFs por página. Las signed URLs viven 1h
	// (3600s) — si una página queda cacheada y el usuario la abre >1h
	// después, Supabase devuelve `InvalidJWT: exp claim ...`. Por eso NO
	// pre-cargamos todas las páginas en background: solo current + prev +
	// next, con TTL local para reutilizar mientras esté vigente.
	const [pdfUrls, setPdfUrls] = useState<Record<number, string>>({});
	// Timestamp de cuándo se obtuvo cada URL — para decidir si reusar (TTL
	// vigente) o refrescar. Es una ref porque los cambios no necesitan
	// re-renderear (`pdfUrls` arriba sí dispara render).
	const pdfFetchedAt = useRef<Map<number, number>>(new Map());
	// Páginas que fallaron al cargar su URL firmada del PDF.
	const [pdfErrors, setPdfErrors] = useState<Set<number>>(new Set());
	// Páginas sin `pdf_storage_path` registrado — no tiene sentido reintentar
	// porque es un dato permanente del row.
	const pagesWithoutStoragePath = useRef<Set<number>>(new Set());

	const handleExportPdf = async () => {
		setIsExporting(true);
		toast.info("Generando PDF completo...");

		try {
			const response = await fetch(
				`/api/cognetica/slides/pdf?artefactoId=${artefactoId}`,
			);

			if (!response.ok) {
				throw new Error("Error generando PDF");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download =
				response.headers
					.get("Content-Disposition")
					?.split("filename=")[1]
					?.replace(/"/g, "") || "presentation.pdf";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success("PDF descargado exitosamente");
		} catch (error) {
			console.error("[SlidesViewer:handleExportPdf]", error);
			toast.error("Error al generar el PDF");
		} finally {
			setIsExporting(false);
		}
	};

	const handleExportImages = async () => {
		setIsExportingImages(true);
		toast.info("Generando ZIP con páginas...");

		try {
			const response = await fetch(
				`/api/cognetica/slides/zip?artefactoId=${artefactoId}`,
			);

			if (!response.ok) {
				throw new Error("Error generando ZIP");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download =
				response.headers
					.get("Content-Disposition")
					?.split("filename=")[1]
					?.replace(/"/g, "") || "presentation.zip";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success("ZIP descargado exitosamente");
		} catch (error) {
			console.error("[SlidesViewer:handleExportImages]", error);
			toast.error("Error al generar el ZIP");
		} finally {
			setIsExportingImages(false);
		}
	};

	// Cargar páginas
	useEffect(() => {
		async function loadPages() {
			const result = await listArtifactPagesV2(artefactoId);
			if (result.success) {
				const processedPages = (result.data as PageData[]).filter(
					(p) => p.status === "processed",
				);
				setPages(processedPages);
			}
			setLoading(false);
		}
		loadPages();
	}, [artefactoId]);

	// Obtener URL firmada del PDF de una página. `getPagePdfUrlV2` recibe
	// el `pdf_storage_path` (no el pageNumber) — viene en el objeto
	// `PageData` resuelto por `listArtifactPagesV2`.
	// Usa cache con TTL (PDF_URL_TTL_MS = 55min): si la URL fue obtenida
	// hace menos del TTL, se reutiliza sin pegar a la red. Esto hace que
	// la navegación entre slides ya visitados sea instantánea, sin volver
	// al bug previo del JWT expirado tras 1h.
	const loadPdfForPage = useCallback(
		async (page: PageData): Promise<string | null> => {
			if (!page.pdf_storage_path) {
				pagesWithoutStoragePath.current.add(page.pageNumber);
				setPdfErrors((prev) => new Set(prev).add(page.pageNumber));
				return null;
			}
			if (pagesWithoutStoragePath.current.has(page.pageNumber)) return null;

			// Cache hit: TTL vigente → la URL ya está en `pdfUrls` (state)
			// del render previo. Retornamos null para señalizar "no hay
			// nada nuevo que mergear" — el caller deja `pdfUrls` intacto
			// y el render usa la URL ya cacheada.
			const fetchedAt = pdfFetchedAt.current.get(page.pageNumber);
			if (fetchedAt && Date.now() - fetchedAt < PDF_URL_TTL_MS) {
				return null;
			}

			const result = await getPagePdfUrlV2(page.pdf_storage_path);
			if (result.success) {
				pdfFetchedAt.current.set(page.pageNumber, Date.now());
				return result.data.signedUrl;
			}
			setPdfErrors((prev) => new Set(prev).add(page.pageNumber));
			return null;
		},
		[],
	);

	// Solicitado por las miniaturas cuando entran al viewport (lazy). Usa
	// `loadPdfForPage` (con su cache TTL) y mergea el resultado en
	// `pdfUrls` para que el ThumbnailItem reaccione vía prop. Si la URL
	// ya estaba vigente, `loadPdfForPage` devuelve null y no hay setState.
	const requestThumbnailUrl = useCallback(
		async (pageNumber: number) => {
			const page = pages.find((p) => p.pageNumber === pageNumber);
			if (!page) return;
			const url = await loadPdfForPage(page);
			if (url) {
				setPdfUrls((prev) => ({ ...prev, [pageNumber]: url }));
			}
		},
		[pages, loadPdfForPage],
	);

	// Reintentar cargar el PDF de una página específica.
	const retryPagePdf = useCallback(
		async (page: PageData) => {
			setRetrying(true);
			setPdfErrors((prev) => {
				const next = new Set(prev);
				next.delete(page.pageNumber);
				return next;
			});
			// Forzar refresh: borrar el timestamp para que `loadPdfForPage`
			// no devuelva el cache hit y pegue al server.
			pdfFetchedAt.current.delete(page.pageNumber);

			const url = await loadPdfForPage(page);
			if (url) {
				setPdfUrls((prev) => ({ ...prev, [page.pageNumber]: url }));
				toast.success(`PDF de página ${page.pageNumber} cargado`);
			} else {
				toast.error(`No se pudo cargar el PDF de la página ${page.pageNumber}`, {
					duration: Infinity,
				});
			}
			setRetrying(false);
		},
		[loadPdfForPage],
	);

	// Precargar URL firmada del actual + adyacentes (prev/next) para
	// transición sin lag al cambiar de página.
	useEffect(() => {
		async function loadAdjacent() {
			if (pages.length === 0) return;
			const indicesToLoad = [currentPageIndex];
			if (currentPageIndex > 0) indicesToLoad.push(currentPageIndex - 1);
			if (currentPageIndex < pages.length - 1)
				indicesToLoad.push(currentPageIndex + 1);

			const newUrls: Record<number, string> = {};
			for (const idx of indicesToLoad) {
				const page = pages[idx];
				if (!page) continue;
				const url = await loadPdfForPage(page);
				if (url) newUrls[page.pageNumber] = url;
			}

			if (Object.keys(newUrls).length > 0) {
				setPdfUrls((prev) => ({ ...prev, ...newUrls }));
			}
		}

		loadAdjacent();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPageIndex, pages]);

	// Detectar aspect ratio real del PDF (width / height) usando pdf-lib.
	// Se hace una sola vez por artefacto, sobre la primera URL firmada que
	// llegue. pdf-lib es liviana y no necesita worker, así que para sólo
	// leer dimensiones es más simple que pdfjs-dist en cliente.
	const aspectDetectedRef = useRef(false);
	useEffect(() => {
		if (aspectDetectedRef.current) return;
		const firstUrl = Object.values(pdfUrls)[0];
		if (!firstUrl) return;
		aspectDetectedRef.current = true;

		void (async () => {
			try {
				const { PDFDocument } = await import("pdf-lib");
				const res = await fetch(firstUrl);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const buffer = await res.arrayBuffer();
				const pdf = await PDFDocument.load(buffer, {
					ignoreEncryption: true,
				});
				const page = pdf.getPage(0);
				const { width, height } = page.getSize();
				if (width > 0 && height > 0) {
					setAspectRatio(width / height);
				}
			} catch (err) {
				// No bloqueante: si falla, queda el default 16/9. Logueamos
				// con prefijo para no fallar silenciosamente.
				console.error(
					"[SlidesViewer:detectAspectRatio] No se pudo leer dimensiones del PDF, usando 16/9:",
					err,
				);
			}
		})();
	}, [pdfUrls]);

	// (Antes acá había una precarga "del resto en background" que generaba
	// signed URLs para TODAS las páginas a los 500ms del mount. Quedó
	// obsoleta porque las URLs viven 1h y al cabo de ese tiempo el cache
	// local servía JWTs expirados. La precarga de adyacentes — que sí
	// se refresca en cada cambio de slide — cubre el caso de uso real.)

	if (loading) {
		return (
			<div className="bg-card p-6 rounded-xl border shadow-sm">
				<div className="flex items-center justify-center gap-2 text-muted-foreground">
					<Loader2 className="w-4 h-4 animate-spin" />
					<span className="text-sm">Cargando láminas...</span>
				</div>
			</div>
		);
	}

	if (pages.length === 0) {
		return (
			<div className="bg-card p-6 rounded-xl border shadow-sm">
				<div className="text-center text-muted-foreground">
					<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
					<p className="text-sm">No hay láminas procesadas aún</p>
				</div>
			</div>
		);
	}

	const currentPage = pages[currentPageIndex];
	const canGoPrev = currentPageIndex > 0;
	const canGoNext = currentPageIndex < pages.length - 1;
	const currentPdfUrl = currentPage ? pdfUrls[currentPage.pageNumber] : null;
	const currentPageHasError = currentPage
		? pdfErrors.has(currentPage.pageNumber)
		: false;

	return (
		<div className="bg-card rounded-xl border shadow-sm overflow-hidden">
			{/* Header */}
			<div className="bg-muted/50 px-4 py-3 border-b">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-3">
						<FileText className="w-5 h-5 text-primary" />
						<div>
							<div className="font-semibold text-lg">
								Página {currentPage.pageNumber}
							</div>
							<div className="text-xs text-muted-foreground">
								de {pages.length} láminas
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<StandardButton
							colorScheme="success"
							size="sm"
							onClick={handleExportPdf}
							disabled={isExporting || isExportingImages}
							leftIcon={isExporting ? Loader2 : undefined}>
							{isExporting ? "Generando..." : "PDF"}
						</StandardButton>

						<StandardButton
							colorScheme="success"
							styleType="outline"
							size="sm"
							onClick={handleExportImages}
							disabled={isExporting || isExportingImages}
							leftIcon={isExportingImages ? Loader2 : undefined}>
							{isExportingImages ? "Generando..." : "ZIP"}
						</StandardButton>

						<StandardButton
							colorScheme="primary"
							size="sm"
							onClick={() =>
								setViewMode(viewMode === "pdf" ? "text" : "pdf")
							}
							leftIcon={viewMode === "pdf" ? Eye : FileText}>
							{viewMode === "pdf" ? "Ver Texto" : "Ver PDF"}
						</StandardButton>

						<StandardButton
							colorScheme="tertiary"
							styleType="outline"
							size="sm"
							leftIcon={Maximize2}
							onClick={() => setModoPresentacion(true)}
							disabled={!currentPdfUrl || viewMode !== "pdf"}>
							Presentar
						</StandardButton>
					</div>
				</div>

				<div className="flex items-center justify-center gap-2">
					<StandardButton
						colorScheme="neutral"
						size="sm"
						onClick={() => setCurrentPageIndex((prev) => prev - 1)}
						disabled={!canGoPrev}
						leftIcon={ChevronLeft}>
						Anterior
					</StandardButton>

					<span className="text-sm text-muted-foreground px-4">
						{currentPageIndex + 1} / {pages.length}
					</span>

					<StandardButton
						colorScheme="neutral"
						size="sm"
						onClick={() => setCurrentPageIndex((prev) => prev + 1)}
						disabled={!canGoNext}
						rightIcon={ChevronRight}>
						Siguiente
					</StandardButton>
				</div>
			</div>

			{/* Contenido */}
			<div className="p-6 bg-muted/20">
				{viewMode === "pdf" ? (
					currentPageHasError && !currentPdfUrl ? (
						<div className="flex flex-col items-center justify-center gap-3 py-12">
							<AlertTriangle className="w-8 h-8 text-warning" />
							<p className="text-sm text-muted-foreground">
								No se pudo cargar el PDF de la página {currentPage.pageNumber}
							</p>
							<div className="flex gap-2">
								<StandardButton
									colorScheme="primary"
									size="sm"
									onClick={() => retryPagePdf(currentPage)}
									disabled={retrying}
									leftIcon={retrying ? Loader2 : undefined}>
									{retrying ? "Reintentando..." : "Reintentar"}
								</StandardButton>
								<StandardButton
									colorScheme="neutral"
									size="sm"
									onClick={() => setViewMode("text")}>
									Ver texto
								</StandardButton>
							</div>
						</div>
					) : (
						// Visor nativo del browser (PDFium en Chrome/Edge, pdf.js en
						// Firefox). Pre-montamos un iframe por cada página dentro
						// del PRELOAD_RADIUS alrededor del current: todos cargan en
						// background y solo el current es visible (opacity:1). Al
						// cambiar de slide, el iframe de la nueva página ya está
						// renderizado por el browser → transición sin lag de
						// descarga/render del PDF.
						// `key` incluye `aspectRatio.toFixed(4)` para forzar remount
						// cuando pdf-lib termina la detección (de 16/9 default al
						// ratio real) — sin esto el viewer interno mantiene el zoom
						// calculado con la geometría errónea.
						<div
							className="relative bg-white rounded-lg border shadow-sm overflow-hidden"
							style={{
								aspectRatio: aspectRatio,
								width: "100%",
							}}>
							{pages.map((page, index) => {
								if (Math.abs(index - currentPageIndex) > PRELOAD_RADIUS) {
									return null;
								}
								const url = pdfUrls[page.pageNumber];
								if (!url) return null;
								const isCurrent = index === currentPageIndex;
								return (
									<iframe
										key={`inline-${page.pageId}-${aspectRatio.toFixed(4)}`}
										src={`${url}${PDF_VIEW_PARAMS}`}
										title={`Página ${page.pageNumber}`}
										className="absolute inset-0 w-full h-full block"
										style={{
											border: "none",
											opacity: isCurrent ? 1 : 0,
											pointerEvents: isCurrent ? "auto" : "none",
										}}
									/>
								);
							})}
							{!currentPdfUrl && (
								<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
									<Loader2 className="w-8 h-8 animate-spin text-primary" />
									<p className="text-sm text-muted-foreground">
										Cargando PDF...
									</p>
								</div>
							)}
						</div>
					)
				) : (
					// Vista de texto markdown
					<div className="bg-background rounded-lg shadow-sm">
						{currentPage.markdown_original ? (
							<StandardMarkdownViewer
								content={currentPage.markdown_original}
								expandAll={false}
							/>
						) : (
							<div className="p-12 text-center">
								<p className="text-muted-foreground italic">
									Esta lámina no tiene contenido de texto extraído
								</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Footer con miniaturas — preview real del PDF, lazy. Cada thumb
			    monta su iframe sólo cuando entra al viewport del scroll
			    horizontal (IntersectionObserver), así no pagamos render
			    de PDFium para las que el usuario nunca llega a ver. */}
			<div className="bg-muted/30 px-4 py-3 border-t">
				<div ref={thumbsContainerRef} className="flex gap-2 overflow-x-auto pb-2">
					{pages.map((page, index) => (
						<ThumbnailItem
							key={page.pageId}
							page={page}
							isCurrent={index === currentPageIndex}
							hasError={pdfErrors.has(page.pageNumber)}
							pdfUrl={pdfUrls[page.pageNumber]}
							aspectRatio={aspectRatio}
							onClick={() => setCurrentPageIndex(index)}
							onEnterViewport={() => requestThumbnailUrl(page.pageNumber)}
							scrollContainerRef={thumbsContainerRef}
						/>
					))}
				</div>
			</div>

			{/* Modo presentación: dialog casi full-screen con el PDF en grande
			    y chevrones a los lados para navegar. Sale con Esc o el botón
			    de cerrar. El estado de navegación se sincroniza con el viewer
			    inline (currentPageIndex), así que al cerrar quedás en la misma
			    lámina que estabas mirando. */}
			<StandardDialog
				open={modoPresentacion}
				onOpenChange={setModoPresentacion}>
				<StandardDialog.Content
					colorScheme="neutral"
					size="full"
					className="!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh] flex flex-col p-0 overflow-hidden">
					<StandardDialog.Header className="px-4 py-2 border-b flex flex-row items-center justify-between gap-3">
						<StandardDialog.Title className="text-sm font-medium">
							Página {currentPage?.pageNumber} de {pages.length}
						</StandardDialog.Title>
						<StandardButton
							size="sm"
							iconOnly
							styleType="ghost"
							colorScheme="neutral"
							onClick={() => setModoPresentacion(false)}
							tooltip="Cerrar (Esc)">
							<X className="w-4 h-4" />
						</StandardButton>
					</StandardDialog.Header>
					<StandardDialog.Body className="flex-1 flex items-center justify-center gap-3 px-3 py-3 bg-muted/30 overflow-hidden">
						<StandardButton
							size="lg"
							iconOnly
							styleType="ghost"
							colorScheme="neutral"
							onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
							disabled={!canGoPrev}
							tooltip="Anterior">
							<ChevronLeft className="w-8 h-8" />
						</StandardButton>

						<div
							className="relative bg-white rounded-lg border shadow-lg overflow-hidden"
							style={{
								aspectRatio: aspectRatio,
								height: "100%",
								maxWidth: "100%",
							}}>
							{pages.map((page, index) => {
								if (Math.abs(index - currentPageIndex) > PRELOAD_RADIUS) {
									return null;
								}
								const url = pdfUrls[page.pageNumber];
								if (!url) return null;
								const isCurrent = index === currentPageIndex;
								return (
									<iframe
										key={`pres-${page.pageId}-${aspectRatio.toFixed(4)}`}
										src={`${url}${PDF_VIEW_PARAMS}`}
										title={`Página ${page.pageNumber}`}
										className="absolute inset-0 w-full h-full block"
										style={{
											border: "none",
											opacity: isCurrent ? 1 : 0,
											pointerEvents: isCurrent ? "auto" : "none",
										}}
									/>
								);
							})}
							{!currentPdfUrl && (
								<div className="absolute inset-0 flex items-center justify-center bg-white">
									<Loader2 className="w-10 h-10 animate-spin text-primary" />
								</div>
							)}
						</div>

						<StandardButton
							size="lg"
							iconOnly
							styleType="ghost"
							colorScheme="neutral"
							onClick={() =>
								setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1))
							}
							disabled={!canGoNext}
							tooltip="Siguiente">
							<ChevronRight className="w-8 h-8" />
						</StandardButton>
					</StandardDialog.Body>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────
// Sub-componente: thumbnail individual con lazy mount del iframe.
// ─────────────────────────────────────────────────────────────────────

interface ThumbnailItemProps {
	page: PageData;
	isCurrent: boolean;
	hasError: boolean;
	pdfUrl: string | undefined;
	aspectRatio: number;
	onClick: () => void;
	/** Se llama UNA VEZ cuando el thumbnail entra al viewport del scroll */
	onEnterViewport: () => void;
	/** Ref del contenedor scrollable — `root` del IntersectionObserver */
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

function ThumbnailItem({
	page,
	isCurrent,
	hasError,
	pdfUrl,
	aspectRatio,
	onClick,
	onEnterViewport,
	scrollContainerRef,
}: ThumbnailItemProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	// Una sola notificación por thumbnail; después el iframe queda montado
	// hasta que el parent re-renderice con la URL.
	const notifiedRef = useRef(false);

	useEffect(() => {
		const el = buttonRef.current;
		const root = scrollContainerRef.current;
		if (!el || !root) return;
		if (notifiedRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !notifiedRef.current) {
						notifiedRef.current = true;
						onEnterViewport();
						observer.disconnect();
					}
				}
			},
			{
				root,
				// Disparo 100px antes del viewport para que el iframe esté
				// renderizado cuando el thumbnail aparece a la vista.
				rootMargin: "100px",
				threshold: 0.01,
			},
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [onEnterViewport, scrollContainerRef]);

	const baseClasses =
		"flex-shrink-0 relative transition-all rounded-lg overflow-hidden border-2 flex items-end justify-center pb-1";
	const stateClasses = isCurrent
		? "ring-2 ring-primary ring-offset-2 border-primary bg-primary/10"
		: hasError
			? "border-warning/50 hover:border-warning bg-warning/5"
			: "border-border hover:border-primary/50 bg-muted";

	return (
		<button
			ref={buttonRef}
			onClick={onClick}
			type="button"
			className={`${baseClasses} ${stateClasses}`}
			// Width calculado explícito (height * aspectRatio) en vez de
			// CSS `aspect-ratio`. Con flex-shrink-0 + height fija, el
			// `aspect-ratio` puro daba width=0 en algunos browsers.
			style={{
				width: Math.round(72 * aspectRatio),
				height: 72,
			}}>
			{/* Iframe preview real del PDF — sólo se monta cuando hay URL.
			    `pointer-events: none` para que el click pase al button
			    contenedor. Aria/tabIndex lo excluyen del focus tree. */}
			{pdfUrl && !hasError && (
				<iframe
					src={`${pdfUrl}${PDF_VIEW_PARAMS}`}
					title={`Miniatura página ${page.pageNumber}`}
					className="absolute inset-0 w-full h-full"
					style={{ border: "none", pointerEvents: "none" }}
					tabIndex={-1}
					aria-hidden="true"
				/>
			)}
			{/* Badge SIEMPRE encima del iframe — z-10 para garantizar capa. */}
			{hasError ? (
				<AlertTriangle className="w-4 h-4 text-warning mb-1 relative z-10" />
			) : (
				<div className="relative z-10">
					<StandardBadge
						colorScheme={isCurrent ? "primary" : "neutral"}
						styleType="solid"
						size="2xs">
						{page.pageNumber}
					</StandardBadge>
				</div>
			)}
		</button>
	);
}
