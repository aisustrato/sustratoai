// 📍 app/personal/papers/components/PaperImagesStep.tsx
// Paso 3: Gestión de imágenes del paper

"use client";

import { useState } from "react";
import { supabase } from "@/app/auth/client";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { Image as ImageIcon, Plus, Info } from "lucide-react";
import { PaperImageCard } from "./PaperImageCard";
import {
	extractImageBlocks,
	replacePlaceholder,
} from "@/lib/papers/image-utils";
import type { ImagePlaceholder, PaperImage } from "@/lib/papers/types";

interface PaperImagesStepProps {
	currentMarkdown: string;
	paperId: string | null;
	onImagesChange: (images: Map<number, PaperImage>) => void;
	onMarkdownUpdated?: (newMarkdown: string) => void;
	existingImages?: PaperImage[];
}

export function PaperImagesStep({
	currentMarkdown,
	paperId,
	onImagesChange,
	onMarkdownUpdated,
	existingImages = [],
}: PaperImagesStepProps) {
	// Detectar bloques de imagen (placeholder + descripción delimitada) en el markdown
	const placeholders = extractImageBlocks(currentMarkdown);

	// Estado de imágenes subidas (key = position, estable ante reemplazos de markdown)
	const [uploadedImages, setUploadedImages] = useState<Map<number, PaperImage>>(
		new Map(existingImages.map((img) => [img.position, img])),
	);

	const handleImageUpload = async (
		placeholder: ImagePlaceholder,
		file: File,
		altText: string,
		descriptionAi: string,
	) => {
		if (!paperId) {
			throw new Error("No hay paper ID. Guarda el borrador primero.");
		}

		try {
			console.log(
				"[PaperImagesStep] Uploading image to Supabase Storage:",
				file.name,
			);

			// Subir imagen a Supabase Storage
			const storagePath = `${paperId}/${file.name}`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("paper-images")
				.upload(storagePath, file, {
					cacheControl: "3600",
					upsert: true, // Permitir sobrescribir si existe
				});

			if (uploadError) {
				console.error("[PaperImagesStep] Upload error:", uploadError);
				throw new Error(`Error subiendo imagen: ${uploadError.message}`);
			}

			console.log("[PaperImagesStep] Upload successful:", uploadData.path);

			// Obtener URL pública
			const {
				data: { publicUrl },
			} = supabase.storage.from("paper-images").getPublicUrl(storagePath);

			console.log("[PaperImagesStep] Public URL:", publicUrl);

			// Guardar metadata en la base de datos
			const { data: imageData, error: dbError } = await supabase
				.from("paper_images")
				.insert({
					paper_id: paperId,
					position: placeholder.position,
					original_placeholder: placeholder.fullMatch,
					storage_path: storagePath,
					public_url: publicUrl,
					alt_text: altText,
					description_ai: descriptionAi,
					original_filename: file.name,
					file_size: file.size,
					mime_type: file.type,
					is_uploaded: true,
				})
				.select()
				.single();

			if (dbError) {
				console.error("[PaperImagesStep] DB error:", dbError);
				throw new Error(`Error guardando metadata: ${dbError.message}`);
			}

			console.log("[PaperImagesStep] Image saved to DB:", imageData);

			// Reemplazar placeholder en el markdown con la URL pública real
			if (onMarkdownUpdated) {
				const updatedMarkdown = replacePlaceholder(
					currentMarkdown,
					placeholder.fullMatch,
					altText,
					publicUrl,
				);
				onMarkdownUpdated(updatedMarkdown);
				console.log(
					"[PaperImagesStep] Markdown updated — placeholder replaced with Supabase URL",
				);
			}

			// Actualizar estado local (key = position para estabilidad)
			const newImages = new Map(uploadedImages);
			newImages.set(placeholder.position, imageData as PaperImage);
			setUploadedImages(newImages);
			onImagesChange(newImages);
		} catch (error) {
			console.error("[PaperImagesStep] Error in handleImageUpload:", error);
			throw error;
		}
	};

	const handleImageDelete = (placeholder: ImagePlaceholder) => {
		const newImages = new Map(uploadedImages);
		newImages.delete(placeholder.position);
		setUploadedImages(newImages);
		onImagesChange(newImages);
	};

	// Si no hay placeholders
	if (placeholders.length === 0) {
		return (
			<div className="space-y-4">
				<StandardEmptyState
					icon={ImageIcon}
					title="No se detectaron imágenes"
					description="No se encontraron placeholders de imágenes en el Markdown. Puedes agregar imágenes manualmente editando el Markdown en el paso anterior."
				/>

				<StandardCard styleType="subtle" colorScheme="neutral">
					<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
						<strong>Tip:</strong> Para agregar una imagen manualmente, inserta
						un placeholder en el Markdown con el formato:{" "}
						<code>![descripción](nombre_imagen.png)</code>
					</StandardText>
				</StandardCard>
			</div>
		);
	}

	// Estadísticas
	const totalImages = placeholders.length;
	const uploadedCount = uploadedImages.size;
	const pendingCount = totalImages - uploadedCount;

	return (
		<div className="space-y-6">
			{/* Header con estadísticas */}
			<StandardCard styleType="filled" colorScheme="primary">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-3 rounded-lg bg-primary-bg">
							<ImageIcon className="h-6 w-6 text-primary-pure" />
						</div>
						<div>
							<StandardText size="lg" weight="semibold">
								Gestión de Imágenes
							</StandardText>
							<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
								{uploadedCount} de {totalImages} imágenes cargadas
							</StandardText>
						</div>
					</div>
					{pendingCount > 0 && (
						<div className="flex items-center gap-2 px-4 py-2 bg-warning-bg border border-warning-border rounded-lg">
							<Info className="h-4 w-4 text-warning-pure" />
							<StandardText size="sm" colorScheme="warning">
								{pendingCount} imagen{pendingCount > 1 ? "es" : ""} pendiente
								{pendingCount > 1 ? "s" : ""}
							</StandardText>
						</div>
					)}
				</div>
			</StandardCard>

			{/* Lista de imágenes */}
			<div className="space-y-4">
				{placeholders.map((placeholder) => (
					<PaperImageCard
						key={placeholder.position}
						placeholder={placeholder}
						totalImages={totalImages}
						paperId={paperId}
						onImageUpload={handleImageUpload}
						onImageDelete={handleImageDelete}
						existingImage={uploadedImages.get(placeholder.position)}
					/>
				))}
			</div>

			{/* Info Card */}
			<StandardCard styleType="subtle" colorScheme="neutral">
				<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
					<strong>Doble Capa:</strong> Cada imagen tiene dos representaciones:
					la visual (que ven los humanos) y la textual (que leen los robots y
					agentes de IA). Esto garantiza accesibilidad total y permite que tu
					paper sea completamente comprensible tanto para personas como para
					máquinas.
				</StandardText>
			</StandardCard>
		</div>
	);
}
