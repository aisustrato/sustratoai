"use client";

import { useEffect, useState } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardMarkdownViewer } from "@/components/ui/StandardMarkdownViewer";
import {
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	Eye,
	FileImage,
	Download,
} from "lucide-react";
import {
	listArtifactPages,
	getPagePdfUrl,
} from "@/lib/actions/cognetica-presentation-actions";
import { toast } from "sonner";

interface PresentationSlidesViewerProps {
	artifactId: string;
}

interface PageData {
	pageId: string;
	pageNumber: number;
	status: "pending" | "processing" | "processed" | "failed";
	pdf_storage_path?: string;
	markdown_original?: string;
}

type ViewMode = "image" | "text";

export function PresentationSlidesViewer({
	artifactId,
}: PresentationSlidesViewerProps) {
	const [pages, setPages] = useState<PageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPageIndex, setCurrentPageIndex] = useState(0);
	const [viewMode, setViewMode] = useState<ViewMode>("image");
	const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
	const [loadingPdf, setLoadingPdf] = useState(false);
	const [thumbnailUrls, setThumbnailUrls] = useState<Record<number, string>>(
		{},
	);
	const [isExporting, setIsExporting] = useState(false);
	const [isExportingImages, setIsExportingImages] = useState(false);

	const handleExportPdf = async () => {
		setIsExporting(true);
		toast.info("Generando PDF completo...");

		try {
			const response = await fetch(
				`/api/cognetica/export-pdf?artifactId=${artifactId}`,
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
			console.error("Error exportando PDF:", error);
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
				`/api/cognetica/export-images?artifactId=${artifactId}`,
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
			console.error("Error exportando imágenes:", error);
			toast.error("Error al generar el ZIP");
		} finally {
			setIsExportingImages(false);
		}
	};

	useEffect(() => {
		async function loadPages() {
			const result = await listArtifactPages(artifactId);

			if (result.success) {
				const processedPages = (result.data as PageData[]).filter(
					(p) => p.status === "processed",
				);
				setPages(processedPages);
			}
			setLoading(false);
		}
		loadPages();
	}, [artifactId]);

	// Cargar URL del PDF cuando cambia la página actual
	useEffect(() => {
		async function loadPdfUrl() {
			if (pages.length === 0 || !pages[currentPageIndex]?.pdf_storage_path)
				return;

			setLoadingPdf(true);
			const result = await getPagePdfUrl(
				pages[currentPageIndex].pdf_storage_path,
			);

			if (result.success) {
				setCurrentPdfUrl(result.data.signedUrl);
			} else {
				setCurrentPdfUrl(null);
			}
			setLoadingPdf(false);
		}

		loadPdfUrl();
	}, [currentPageIndex, pages]);

	// Cargar miniaturas de todas las páginas
	useEffect(() => {
		async function loadThumbnails() {
			if (pages.length === 0) return;

			const urls: Record<number, string> = {};

			for (let i = 0; i < pages.length; i++) {
				const page = pages[i];
				if (page.pdf_storage_path) {
					const result = await getPagePdfUrl(page.pdf_storage_path);
					if (result.success) {
						urls[i] = result.data.signedUrl;
					}
				}
			}

			setThumbnailUrls(urls);
		}

		loadThumbnails();
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

	return (
		<div className="bg-card rounded-xl border shadow-sm overflow-hidden">
			{/* Header con navegación y controles */}
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
						{/* Botón de exportación PDF */}
						<StandardButton
							colorScheme="success"
							size="sm"
							onClick={handleExportPdf}
							disabled={isExporting || isExportingImages}
							leftIcon={isExporting ? Loader2 : Download}>
							{isExporting ? "Generando..." : "PDF"}
						</StandardButton>

						{/* Botón de exportación imágenes ZIP */}
						<StandardButton
							colorScheme="success"
							styleType="outline"
							size="sm"
							onClick={handleExportImages}
							disabled={isExporting || isExportingImages}
							leftIcon={isExportingImages ? Loader2 : FileImage}>
							{isExportingImages ? "Generando..." : "ZIP"}
						</StandardButton>

						{/* Botón toggle único que alterna entre imagen/texto */}
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

				{/* Navegación */}
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

			{/* Contenido de la lámina */}
			<div className="p-6 max-h-[700px] overflow-y-auto bg-muted/20">
				{
					viewMode === "image" ?
						// Vista de imagen PDF
						<div className="flex items-center justify-center">
							{loadingPdf ?
								<div className="flex flex-col items-center gap-3 py-12">
									<Loader2 className="w-8 h-8 animate-spin text-primary" />
									<p className="text-sm text-muted-foreground">
										Cargando imagen...
									</p>
								</div>
							: currentPdfUrl ?
								<iframe
									src={currentPdfUrl}
									className="w-full h-[600px] border-0 rounded-lg shadow-lg"
									title={`Página ${currentPage.pageNumber}`}
								/>
							:	<div className="text-center py-12">
									<FileImage className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
									<p className="text-sm text-muted-foreground">
										No se pudo cargar la imagen del PDF
									</p>
								</div>
							}
						</div>
						// Vista de texto markdown con StandardMarkdownViewer
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

			{/* Footer con miniaturas visuales */}
			<div className="bg-muted/30 px-4 py-3 border-t">
				<div className="flex gap-3 overflow-x-auto pb-2">
					{pages.map((page, index) => (
						<button
							key={page.pageId}
							onClick={() => setCurrentPageIndex(index)}
							className={`
                flex-shrink-0 relative group transition-all
                ${
									index === currentPageIndex ?
										"ring-2 ring-primary ring-offset-2 scale-105"
									:	"hover:ring-2 hover:ring-primary/50 hover:scale-105"
								}
              `}>
							{/* Miniatura del PDF - Horizontal 16:9 */}
							<div className="w-32 h-20 bg-muted rounded-lg overflow-hidden border-2 border-border">
								{thumbnailUrls[index] ?
									<iframe
										src={thumbnailUrls[index]}
										className="w-full h-full pointer-events-none scale-[0.25] origin-top-left"
										style={{
											width: "400%",
											height: "400%",
											transform: "scale(0.25)",
											transformOrigin: "top left",
										}}
										title={`Miniatura página ${page.pageNumber}`}
									/>
								:	<div className="w-full h-full flex items-center justify-center">
										<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
									</div>
								}
							</div>

							{/* Número de página - Badge con fondo sólido */}
							<div
								className={`
                absolute -bottom-2 left-1/2 -translate-x-1/2 
                px-2.5 py-1 rounded-full text-xs font-bold shadow-sm
                ${
									index === currentPageIndex ?
										"bg-primary text-primary-foreground"
									:	"bg-card text-foreground border-2 border-border"
								}
              `}>
								{page.pageNumber}
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
