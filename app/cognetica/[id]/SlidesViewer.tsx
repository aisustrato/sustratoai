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
	FileImage,
	AlertTriangle,
} from "lucide-react";
import {
	listArtifactPagesV2,
	getPageImageUrlV2,
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

type ViewMode = "image" | "text";

export function SlidesViewer({ artefactoId }: SlidesViewerProps) {
	const [pages, setPages] = useState<PageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [viewMode, setViewMode] = useState<ViewMode>("image");
	const [isExporting, setIsExporting] = useState(false);
	const [isExportingImages, setIsExportingImages] = useState(false);
	const [pageLoading, setPageLoading] = useState(false);
	const [retrying, setRetrying] = useState(false);

	// Cache de URLs firmadas de imágenes
	const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
	// Páginas que fallaron al cargar su imagen
	const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
	// Páginas que ya se intentaron (éxito o fallo)
	const attemptedImages = useRef<Set<number>>(new Set());

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

	// Generar URLs firmadas de imágenes (prioridad: actual + adyacentes)
	const loadImageForPage = useCallback(async (pageNumber: number): Promise<string | null> => {
		if (attemptedImages.current.has(pageNumber)) return null;
		attemptedImages.current.add(pageNumber);

		const result = await getPageImageUrlV2(artefactoId, pageNumber);
		if (result.success) {
			return result.data.signedUrl;
		}
		// Registrar error para esta página
		setImageErrors((prev) => new Set(prev).add(pageNumber));
		return null;
	}, [artefactoId]);

	// Reintentar cargar la imagen de una página específica
	const retryPageImage = useCallback(async (pageNumber: number) => {
		setRetrying(true);
		// Limpiar estado de error e intento previo para esta página
		attemptedImages.current.delete(pageNumber);
		setImageErrors((prev) => {
			const next = new Set(prev);
			next.delete(pageNumber);
			return next;
		});

		const url = await loadImageForPage(pageNumber);
		if (url) {
			setImageUrls((prev) => ({ ...prev, [pageNumber]: url }));
			toast.success(`Imagen de página ${pageNumber} cargada`);
		} else {
			toast.error(`No se pudo cargar la imagen de la página ${pageNumber}`);
		}
		setRetrying(false);
	}, [loadImageForPage]);

	useEffect(() => {
		async function loadImages() {
			if (pages.length === 0) return;

			// Prioridad: actual, anterior, siguiente
			const indicesToLoad = [currentPageIndex];
			if (currentPageIndex > 0) indicesToLoad.push(currentPageIndex - 1);
			if (currentPageIndex < pages.length - 1)
				indicesToLoad.push(currentPageIndex + 1);

			const newUrls: Record<number, string> = {};

			for (const idx of indicesToLoad) {
				const page = pages[idx];
				if (!page) continue;
				const url = await loadImageForPage(page.pageNumber);
				if (url) newUrls[page.pageNumber] = url;
			}

			if (Object.keys(newUrls).length > 0) {
				setImageUrls((prev) => ({ ...prev, ...newUrls }));
			}
		}

		loadImages();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPageIndex, pages]);

	// Cargar resto de imágenes en background
	useEffect(() => {
		async function loadRemainingImages() {
			if (pages.length === 0) return;

			const newUrls: Record<number, string> = {};

			for (const page of pages) {
				const url = await loadImageForPage(page.pageNumber);
				if (url) newUrls[page.pageNumber] = url;
			}

			if (Object.keys(newUrls).length > 0) {
				setImageUrls((prev) => ({ ...prev, ...newUrls }));
			}
		}

		const timeout = setTimeout(loadRemainingImages, 500);
		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pages]);

	// Reset loading cuando cambia página
	useEffect(() => {
		setPageLoading(true);
		const page = pages[currentPageIndex];
		if (page && imageUrls[page.pageNumber]) {
			const timeout = setTimeout(() => setPageLoading(false), 100);
			return () => clearTimeout(timeout);
		} else {
			setPageLoading(false);
		}
	}, [currentPageIndex, pages, imageUrls]);

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
	const currentImageUrl = currentPage ? imageUrls[currentPage.pageNumber] : null;
	const currentPageHasError = currentPage ? imageErrors.has(currentPage.pageNumber) : false;

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
								setViewMode(viewMode === "image" ? "text" : "image")
							}
							leftIcon={viewMode === "image" ? Eye : FileImage}>
							{viewMode === "image" ? "Ver Texto" : "Ver Imagen"}
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
			<div className="p-6 max-h-[700px] overflow-y-auto bg-muted/20">
				{viewMode === "image" ?
					currentPageHasError && !currentImageUrl ?
						// Error cargando imagen específica
						<div className="flex flex-col items-center justify-center gap-3 py-12">
							<AlertTriangle className="w-8 h-8 text-warning" />
							<p className="text-sm text-muted-foreground">
								No se pudo cargar la imagen de la página {currentPage.pageNumber}
							</p>
							<div className="flex gap-2">
								<StandardButton
									colorScheme="primary"
									size="sm"
									onClick={() => retryPageImage(currentPage.pageNumber)}
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
					: pageLoading || !currentImageUrl ?
						<div className="flex flex-col items-center gap-3 py-12">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground">
								Cargando imagen...
							</p>
						</div>
					:	// eslint-disable-next-line @next/next/no-img-element
						<img
							src={currentImageUrl}
							alt={`Página ${currentPage.pageNumber}`}
							className="max-w-full h-auto rounded-lg shadow-lg border"
							style={{ maxHeight: 600 }}
						/>
					// Vista de texto markdown
				:	<div className="bg-background rounded-lg shadow-sm">
						{currentPage.markdown_original ?
							<StandardMarkdownViewer
								content={currentPage.markdown_original}
								expandAll={false}
							/>
						:	<div className="p-12 text-center">
								<p className="text-muted-foreground italic">
									Esta lámina no tiene contenido de texto extraído
								</p>
							</div>
						}
					</div>
				}
			</div>

			{/* Footer con miniaturas */}
			<div className="bg-muted/30 px-4 py-3 border-t">
				<div className="flex gap-2 overflow-x-auto pb-2">
					{pages.map((page, index) => {
						const imgUrl = imageUrls[page.pageNumber];
						const hasError = imageErrors.has(page.pageNumber);
						return (
							<button
								key={page.pageId}
								onClick={() => setCurrentPageIndex(index)}
								className={`
									flex-shrink-0 relative group transition-all
									rounded-lg overflow-hidden border-2
									w-24 h-16
									${
										index === currentPageIndex ?
											"ring-2 ring-primary ring-offset-2 border-primary"
										: hasError ?
											"border-warning/50 hover:border-warning"
										:	"border-border hover:border-primary/50"
									}
								`}>
								{imgUrl ?
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={imgUrl}
										alt={`Miniatura ${page.pageNumber}`}
										className="w-full h-full object-cover"
									/>
								: hasError ?
									<div className="w-full h-full flex items-center justify-center bg-warning/10">
										<AlertTriangle className="w-4 h-4 text-warning" />
									</div>
								:	<div className="w-full h-full flex items-center justify-center bg-muted">
										<span className="text-xs text-muted-foreground font-medium">
											{page.pageNumber}
										</span>
									</div>
								}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
