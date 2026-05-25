// 📍 app/cognetica/[id]/SlidesViewer.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardMarkdownViewer } from "@/components/ui/StandardMarkdownViewer";
import {
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	Eye,
	AlertTriangle,
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

// PDF viewer params para ocultar el toolbar nativo y ajustar al ancho del
// contenedor. Funcionan en PDFium (Chrome/Edge) y en el visor de Firefox
// (pdf.js interno). Safari ignora algunos parámetros pero igual renderiza.
const PDF_VIEW_PARAMS = "#toolbar=0&navpanes=0&view=FitH";

export function SlidesViewer({ artefactoId }: SlidesViewerProps) {
	const [pages, setPages] = useState<PageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [viewMode, setViewMode] = useState<ViewMode>("pdf");
	const [isExporting, setIsExporting] = useState(false);
	const [isExportingImages, setIsExportingImages] = useState(false);
	const [retrying, setRetrying] = useState(false);

	// Cache de URLs firmadas de PDFs por página (antes eran imágenes PNG,
	// pero la rasterización server-side con pdfjs-dist fallaba silenciosa
	// — TypeError "Image or Canvas expected" capturado como "no crítico".
	// Reemplazado por embedding del PDF de cada página vía iframe nativo
	// del browser: render vectorial perfecto, sin lib pesada en cliente).
	const [pdfUrls, setPdfUrls] = useState<Record<number, string>>({});
	// Páginas que fallaron al cargar su URL firmada del PDF.
	const [pdfErrors, setPdfErrors] = useState<Set<number>>(new Set());
	// Páginas que ya se intentaron (éxito o fallo).
	const attemptedPdfs = useRef<Set<number>>(new Set());

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
	const loadPdfForPage = useCallback(
		async (page: PageData): Promise<string | null> => {
			if (!page.pdf_storage_path) {
				setPdfErrors((prev) => new Set(prev).add(page.pageNumber));
				return null;
			}
			if (attemptedPdfs.current.has(page.pageNumber)) return null;
			attemptedPdfs.current.add(page.pageNumber);

			const result = await getPagePdfUrlV2(page.pdf_storage_path);
			if (result.success) {
				return result.data.signedUrl;
			}
			setPdfErrors((prev) => new Set(prev).add(page.pageNumber));
			return null;
		},
		[],
	);

	// Reintentar cargar el PDF de una página específica.
	const retryPagePdf = useCallback(
		async (page: PageData) => {
			setRetrying(true);
			attemptedPdfs.current.delete(page.pageNumber);
			setPdfErrors((prev) => {
				const next = new Set(prev);
				next.delete(page.pageNumber);
				return next;
			});

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

	// Precarga del resto en background (sin bloquear la UI).
	useEffect(() => {
		async function loadRemaining() {
			if (pages.length === 0) return;
			const newUrls: Record<number, string> = {};
			for (const page of pages) {
				const url = await loadPdfForPage(page);
				if (url) newUrls[page.pageNumber] = url;
			}
			if (Object.keys(newUrls).length > 0) {
				setPdfUrls((prev) => ({ ...prev, ...newUrls }));
			}
		}
		const timeout = setTimeout(loadRemaining, 500);
		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pages]);

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
					) : !currentPdfUrl ? (
						<div className="flex flex-col items-center gap-3 py-12">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground">
								Cargando PDF...
							</p>
						</div>
					) : (
						// Visor nativo del browser. PDFium (Chrome/Edge) y pdf.js
						// (Firefox) renderean vectorial + permiten zoom y scroll
						// gestual. El #toolbar=0&navpanes=0&view=FitH oculta los
						// controles internos y ajusta al ancho del contenedor.
						// `key` con la URL fuerza remount al cambiar de página —
						// algunos browsers no recargan el iframe con solo cambiar
						// `src` en runtime.
						<iframe
							key={currentPdfUrl}
							src={`${currentPdfUrl}${PDF_VIEW_PARAMS}`}
							title={`Página ${currentPage.pageNumber}`}
							className="w-full rounded-lg border bg-white"
							style={{ height: "70vh", minHeight: 480 }}
						/>
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

			{/* Footer con miniaturas — sin preview visual del PDF (cada PDF
			    embedido en un thumbnail sería pesado para 13+ páginas).
			    Mostramos solo el número, marcamos error y resaltamos actual. */}
			<div className="bg-muted/30 px-4 py-3 border-t">
				<div className="flex gap-2 overflow-x-auto pb-2">
					{pages.map((page, index) => {
						const hasError = pdfErrors.has(page.pageNumber);
						const isCurrent = index === currentPageIndex;
						return (
							<button
								key={page.pageId}
								onClick={() => setCurrentPageIndex(index)}
								type="button"
								className={`
									flex-shrink-0 relative transition-all
									rounded-lg overflow-hidden border-2
									w-16 h-16 flex items-center justify-center
									${
										isCurrent
											? "ring-2 ring-primary ring-offset-2 border-primary bg-primary/10"
											: hasError
												? "border-warning/50 hover:border-warning bg-warning/5"
												: "border-border hover:border-primary/50 bg-muted"
									}
								`}>
								{hasError ? (
									<AlertTriangle className="w-4 h-4 text-warning" />
								) : (
									<span className="text-sm text-muted-foreground font-medium">
										{page.pageNumber}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
