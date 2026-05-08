// 📍 app/personal/papers/components/PaperImageCard.tsx
// Card individual para gestión de imagen con doble capa

"use client";

import { useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { Upload, Trash2 } from "lucide-react";
import { PaperDualView } from "./PaperDualView";
import type { ImagePlaceholder, PaperImage } from "@/lib/papers/types";
import {
	sanitizeImageFilename,
	formatFileSize,
	isValidImageMimeType,
	isValidImageSize,
	getImageDimensions,
} from "@/lib/papers/image-utils";

interface PaperImageCardProps {
	placeholder: ImagePlaceholder;
	totalImages: number;
	paperId: string | null;
	onImageUpload: (
		placeholder: ImagePlaceholder,
		file: File,
		altText: string,
		descriptionAi: string,
	) => Promise<void>;
	onImageDelete?: (placeholder: ImagePlaceholder) => void;
	existingImage?: PaperImage;
}

export function PaperImageCard({
	placeholder,
	totalImages,
	paperId,
	onImageUpload,
	onImageDelete,
	existingImage,
}: PaperImageCardProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [altText, setAltText] = useState(existingImage?.alt_text || "");
	const [descriptionAi, setDescriptionAi] = useState(
		existingImage?.description_ai || "",
	);
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		existingImage?.public_url || null,
	);
	const [viewMode, setViewMode] = useState<"human" | "machine">("human");
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validar tipo MIME
		if (!isValidImageMimeType(file.type)) {
			setError("Solo se permiten imágenes JPG, PNG o WebP");
			return;
		}

		// Validar tamaño
		if (!isValidImageSize(file.size)) {
			setError("La imagen excede el tamaño máximo de 10 MB");
			return;
		}

		setSelectedFile(file);
		setError(null);

		// Crear preview
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		setIsUploading(true);
		setError(null);

		try {
			await onImageUpload(placeholder, selectedFile, altText, descriptionAi);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error subiendo imagen");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = () => {
		if (onImageDelete) {
			onImageDelete(placeholder);
		}
		setSelectedFile(null);
		setPreviewUrl(null);
		setAltText("");
		setDescriptionAi("");
	};

	return (
		<StandardCard styleType="filled" colorScheme="neutral">
			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<StandardText size="base" weight="semibold">
						Imagen {placeholder.position} de {totalImages}
					</StandardText>
					{(selectedFile || existingImage) && (
						<StandardButton
							styleType="ghost"
							colorScheme="danger"
							size="sm"
							onClick={handleDelete}
							title="Eliminar imagen"
							leftIcon={Trash2}
							iconOnly
						/>
					)}
				</div>

				{/* Placeholder original */}
				<div className="bg-background-default rounded p-2 border border-border-neutral">
					<StandardText size="xs" colorScheme="neutral" colorShade="subtle">
						Placeholder:{" "}
						<code className="font-mono">{placeholder.fullMatch}</code>
					</StandardText>
				</div>

				{/* File Upload */}
				{!selectedFile && !existingImage && (
					<div className="border-2 border-dashed border-border-neutral rounded-lg p-6 text-center hover:border-primary-pure transition-colors">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onChange={handleFileSelect}
							className="hidden"
							id={`image-upload-${placeholder.position}`}
							disabled={isUploading}
						/>
						<label
							htmlFor={`image-upload-${placeholder.position}`}
							className="cursor-pointer flex flex-col items-center gap-3">
							<Upload className="h-8 w-8 text-text-subtle" />
							<div>
								<StandardText size="sm" weight="medium">
									Haz click para seleccionar imagen
								</StandardText>
								<StandardText
									size="xs"
									colorScheme="neutral"
									colorShade="subtle">
									JPG, PNG, WebP • Máximo 10 MB
								</StandardText>
							</div>
						</label>
					</div>
				)}

				{/* File Preview Info */}
				{selectedFile && !existingImage && (
					<div className="bg-background-paper rounded-lg p-3 border border-border-neutral">
						<StandardText size="sm" weight="medium">
							{selectedFile.name}
						</StandardText>
						<StandardText size="xs" colorScheme="neutral" colorShade="subtle">
							{formatFileSize(selectedFile.size)}
						</StandardText>
					</div>
				)}

				{/* Campos de descripción */}
				{(selectedFile || existingImage) && (
					<>
						{/* Alt Text */}
						<div>
							<label className="block mb-2">
								<StandardText size="sm" weight="medium">
									Texto alternativo (alt):
								</StandardText>
								<StandardText
									size="xs"
									colorScheme="neutral"
									colorShade="subtle">
									Descripción breve para atributo HTML alt
								</StandardText>
							</label>
							<input
								type="text"
								value={altText}
								onChange={(e) => setAltText(e.target.value)}
								placeholder="Ej: Gráfico de resultados del experimento"
								className="w-full px-3 py-2 bg-background-default border border-border-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-pure"
								disabled={isUploading}
							/>
						</div>

						{/* Description AI */}
						<div>
							<label className="block mb-2">
								<StandardText size="sm" weight="medium">
									Descripción para AI/Robots:
								</StandardText>
								<StandardText
									size="xs"
									colorScheme="neutral"
									colorShade="subtle">
									Descripción extendida para agentes que no pueden ver la imagen
								</StandardText>
							</label>
							<textarea
								value={descriptionAi}
								onChange={(e) => setDescriptionAi(e.target.value)}
								placeholder="Describe detalladamente lo que muestra esta imagen para que un lector que no pueda verla entienda su contenido..."
								rows={4}
								className="w-full px-3 py-2 bg-background-default border border-border-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-pure resize-none"
								disabled={isUploading}
							/>
						</div>

						{/* Dual View */}
						<PaperDualView
							imageUrl={previewUrl}
							altText={altText}
							descriptionAi={descriptionAi}
							mode={viewMode}
							onModeChange={setViewMode}
						/>

						{/* Upload Button */}
						{selectedFile && !existingImage && (
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={handleUpload}
								disabled={isUploading || !altText || !descriptionAi}
								className="w-full">
								{isUploading ? "Subiendo..." : "Guardar Imagen"}
							</StandardButton>
						)}
					</>
				)}

				{/* Error Message */}
				{error && (
					<div className="bg-danger-bg border border-danger-border rounded-lg p-3">
						<StandardText size="sm" colorScheme="danger">
							{error}
						</StandardText>
					</div>
				)}
			</div>
		</StandardCard>
	);
}
