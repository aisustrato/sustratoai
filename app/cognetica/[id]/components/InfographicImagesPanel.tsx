// 📍 app/cognetica/[id]/components/InfographicImagesPanel.tsx
// 🎯 PROPÓSITO: Panel para gestionar conversión de prompts a imágenes de infografías

"use client";

import { useState, useEffect } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { Wand2, FileText, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
	getInfographicImages,
	deleteInfographicImages,
	InfographicImage,
} from "@/lib/actions/cognetica-infographic-images-actions";
import Image from "next/image";

interface InfographicImagesPanelProps {
	artifactId: string;
	prompts: Array<{ style: string; prompt: string }>;
}

export function InfographicImagesPanel({
	artifactId,
	prompts,
}: InfographicImagesPanelProps) {
	const [viewMode, setViewMode] = useState<"text" | "images">("text");
	const [isGenerating, setIsGenerating] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [images, setImages] = useState<InfographicImage[]>([]);
	const [generationProgress, setGenerationProgress] = useState(0);
	const { toast } = useToast();

	const loadImages = async () => {
		setIsLoading(true);
		const result = await getInfographicImages(artifactId);
		if (result.success && result.data) {
			setImages(result.data);
			// Si hay imágenes, mostrar vista de imágenes por defecto
			if (result.data.length > 0) {
				setViewMode("images");
			}
		}
		setIsLoading(false);
	};

	// Cargar imágenes existentes al montar
	useEffect(() => {
		loadImages();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [artifactId]);

	const handleGenerateImages = async () => {
		setIsGenerating(true);
		setGenerationProgress(0);

		try {
			// Simular progreso durante la generación
			const progressInterval = setInterval(() => {
				setGenerationProgress((prev) => {
					if (prev >= 90) return prev;
					return prev + 5;
				});
			}, 1000);

			const response = await fetch(
				"/api/cognetica/generate-infographic-images",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						artifactId,
						prompts,
					}),
				},
			);

			clearInterval(progressInterval);
			setGenerationProgress(100);

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || "Error generando imágenes");
			}

			const { successCount, errorCount, totalPrompts } = result.data;

			toast({
				title: "✅ Imágenes Generadas",
				description: `${successCount}/${totalPrompts} imágenes generadas exitosamente${errorCount > 0 ? `. ${errorCount} fallaron.` : "."}`,
				variant: "default",
			});

			// Recargar imágenes y cambiar a vista de imágenes
			await loadImages();
			setViewMode("images");
		} catch (error: unknown) {
			console.error("Error generando imágenes:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Error generando imágenes";
			toast({
				title: "❌ Error",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsGenerating(false);
			setGenerationProgress(0);
		}
	};

	const handleDeleteImages = async () => {
		if (
			!confirm(
				"¿Estás seguro de que deseas eliminar todas las imágenes generadas? Esta acción no se puede deshacer.",
			)
		) {
			return;
		}

		try {
			const result = await deleteInfographicImages(artifactId);

			if (!result.success) {
				throw new Error(result.error || "Error eliminando imágenes");
			}

			toast({
				title: "✅ Imágenes Eliminadas",
				description: `${result.data} imagen(es) eliminada(s) exitosamente`,
				variant: "default",
			});

			setImages([]);
			setViewMode("text");
		} catch (error: unknown) {
			console.error("Error eliminando imágenes:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Error eliminando imágenes";
			toast({
				title: "❌ Error",
				description: errorMessage,
				variant: "destructive",
			});
		}
	};

	if (isLoading) {
		return (
			<div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200 shadow-sm">
				<div className="flex items-center justify-center gap-2 text-cyan-600">
					<Loader2 className="w-4 h-4 animate-spin" />
					<span className="text-sm">Cargando imágenes...</span>
				</div>
			</div>
		);
	}

	// Mostrar barra de progreso durante la generación
	if (isGenerating) {
		return (
			<div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200 shadow-sm">
				<div className="space-y-4">
					<div className="flex items-center justify-center gap-2 text-cyan-700">
						<Loader2 className="w-5 h-5 animate-spin" />
						<span className="font-semibold">
							Generando imágenes con SeaDream 4.5...
						</span>
					</div>

					{/* Barra de progreso */}
					<div className="w-full bg-cyan-100 rounded-full h-3 overflow-hidden">
						<div
							className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500 ease-out"
							style={{ width: `${generationProgress}%` }}
						/>
					</div>

					<div className="text-center space-y-1">
						<p className="text-sm text-cyan-600">
							{generationProgress < 100 ?
								`Procesando ${prompts.length} prompts de infografías...`
							:	"¡Completado! Guardando resultados..."}
						</p>
						<p className="text-xs text-cyan-500">
							{generationProgress}% • Resolución 2k (2048x1152) • Aspect ratio
							16:9
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200 shadow-sm">
			{/* Header */}
			<div className="space-y-3 mb-4">
				<h3 className="font-semibold text-lg flex items-center gap-2 text-cyan-800">
					🎨{" "}
					{viewMode === "text" ? "Prompts de Diagramas" : "Imágenes Generadas"}
				</h3>

				{/* Botones debajo del título */}
				<div className="flex items-center gap-2 flex-wrap">
					{images.length > 0 && (
						<>
							<StandardButton
								size="sm"
								colorScheme={viewMode === "text" ? "primary" : "neutral"}
								onClick={() => setViewMode("text")}
								tooltip="Ver prompts de texto">
								<FileText className="w-4 h-4" />
							</StandardButton>

							<StandardButton
								size="sm"
								colorScheme={viewMode === "images" ? "primary" : "neutral"}
								onClick={() => setViewMode("images")}
								tooltip="Ver imágenes generadas">
								🖼️
							</StandardButton>

							<StandardButton
								size="sm"
								colorScheme="danger"
								onClick={handleDeleteImages}
								tooltip="Eliminar todas las imágenes">
								<Trash2 className="w-4 h-4" />
							</StandardButton>
						</>
					)}

					{viewMode === "text" && (
						<StandardButton
							size="sm"
							colorScheme="accent"
							onClick={handleGenerateImages}
							disabled={isGenerating}
							tooltip="Generar imágenes con SeaDream 4.5 (2k, 16:9)">
							{isGenerating ?
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Generando...
								</>
							:	<>
									<Wand2 className="w-4 h-4" />
									Convertir en Imágenes
								</>
							}
						</StandardButton>
					)}
				</div>
			</div>

			{/* Descripción */}
			<p className="text-xs text-cyan-600 mb-4">
				{viewMode === "text" ?
					"Prompts en idioma del artefacto para visualizar conceptos clave"
				:	`${images.length} imagen(es) generada(s) con SeaDream 4.5 (2048x1152, 16:9)`
				}
			</p>

			{/* Contenido */}
			<div className="space-y-3 max-h-[600px] overflow-y-auto">
				{
					viewMode === "text" ?
						// Vista de prompts de texto
						prompts.map((imgPrompt, idx) => (
							<div
								key={idx}
								className="p-3 bg-white/70 rounded-lg border border-cyan-100">
								<div className="flex items-center gap-2 mb-2">
									<span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium uppercase">
										{imgPrompt.style}
									</span>
								</div>
								<p className="text-xs text-slate-600 font-mono leading-relaxed">
									{imgPrompt.prompt}
								</p>
							</div>
						))
						// Vista de imágenes generadas
					: images.length === 0 ?
						<div className="text-center py-8 text-cyan-600">
							<p className="text-sm">No hay imágenes generadas aún</p>
							<p className="text-xs mt-2">
								Haz clic en &ldquo;Convertir en Imágenes&rdquo; para generar
							</p>
						</div>
					:	<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{images.map((img, idx) => {
								// Validar que la URL sea válida
								const isValidUrl =
									img.imageUrl &&
									typeof img.imageUrl === "string" &&
									(img.imageUrl.startsWith("http://") ||
										img.imageUrl.startsWith("https://"));

								// Debug: Log de las URLs
								console.log(`🖼️ Imagen ${idx + 1}:`, {
									id: img.id,
									url: img.imageUrl,
									isValid: isValidUrl,
									type: typeof img.imageUrl,
								});

								return (
									<div
										key={img.id}
										className="bg-white/70 rounded-lg border border-cyan-100 overflow-hidden">
										<div className="relative w-full aspect-video">
											{isValidUrl ?
												<Image
													src={img.imageUrl}
													alt={`Infografía ${idx + 1}: ${img.style}`}
													fill
													className="object-cover"
													sizes="(max-width: 768px) 100vw, 50vw"
													unoptimized
												/>
											:	<div className="w-full h-full flex items-center justify-center bg-cyan-50">
													<div className="text-center text-cyan-600">
														<p className="text-sm font-semibold">
															URL inválida
														</p>
														<p className="text-xs mt-1">
															{typeof img.imageUrl === "object" ?
																"Objeto recibido en lugar de URL"
															:	"URL no válida"}
														</p>
													</div>
												</div>
											}
										</div>
										<div className="p-3">
											<div className="flex items-center gap-2 mb-2">
												<span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium uppercase">
													{img.style}
												</span>
												<span className="text-xs text-slate-500">
													{img.width}x{img.height}
												</span>
											</div>
											<p className="text-xs text-slate-600 line-clamp-2">
												{img.promptText}
											</p>
										</div>
									</div>
								);
							})}
						</div>

				}
			</div>
		</div>
	);
}
