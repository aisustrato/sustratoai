// 📍 app/cognetica/[id]/components/PdfToImage.tsx
"use client";

import { useEffect, useState, useRef } from "react";

interface PdfToImageProps {
	pdfUrl: string;
	width?: number;
	className?: string;
	alt?: string;
	onRender?: (dataUrl: string) => void;
}

export function PdfToImage({
	pdfUrl,
	width = 1200,
	className = "",
	alt = "PDF page",
	onRender,
}: PdfToImageProps) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const renderedRef = useRef(false);

	useEffect(() => {
		if (renderedRef.current) return;
		renderedRef.current = true;

		async function renderPdf() {
			try {
				setLoading(true);
				setError(null);

				// Import dinámico de pdfjs-dist
				const pdfjs = await import("pdfjs-dist");
				// Usar CDN para el worker (evita bundling del worker)
				const version = (pdfjs as Record<string, unknown>).version || "3.11.174";
				pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

				const pdf = await pdfjs.getDocument(pdfUrl).promise;

				const page = await pdf.getPage(1);

				// Calcular escala para el ancho deseado
				const viewport = page.getViewport({ scale: 1 });
				const scale = width / viewport.width;
				const scaledViewport = page.getViewport({ scale });

				// Crear canvas offscreen
				const canvas = document.createElement("canvas");
				canvas.width = scaledViewport.width;
				canvas.height = scaledViewport.height;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					throw new Error("No se pudo obtener contexto 2D del canvas");
				}

				// Renderizar página
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await (page as any).render({
					canvasContext: ctx,
					viewport: scaledViewport,
				}).promise;

				// Convertir a imagen PNG
				const dataUrl = canvas.toDataURL("image/png");
				setImageUrl(dataUrl);

				if (onRender) {
					onRender(dataUrl);
				}
			} catch (err) {
				console.error("[PdfToImage] Error renderizando PDF:", err);
				setError(
					err instanceof Error ? err.message : "Error renderizando PDF",
				);
			} finally {
				setLoading(false);
			}
		}

		renderPdf();
	}, [pdfUrl, width, onRender]);

	if (loading) {
		return (
			<div
				className={`flex items-center justify-center bg-muted/30 ${className}`}
				style={{ minHeight: 200 }}>
				<div className="animate-pulse flex flex-col items-center gap-2">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					<span className="text-xs text-muted-foreground">Renderizando...</span>
				</div>
			</div>
		);
	}

	if (error || !imageUrl) {
		return (
			<div
				className={`flex items-center justify-center bg-muted/30 text-muted-foreground text-sm ${className}`}
				style={{ minHeight: 200 }}>
				<span>Error al cargar página</span>
			</div>
		);
	}

	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={imageUrl}
			alt={alt}
			className={`max-w-full h-auto ${className}`}
			loading="lazy"
		/>
	);
}
