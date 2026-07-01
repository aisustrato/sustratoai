// 📍 app/personal/papers/components/PaperAnnexCard.tsx
// Card individual para gestionar un anexo / material suplementario

"use client";

import { useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { Upload, Trash2, File } from "lucide-react";
import type { PaperAnnex } from "@/lib/papers/types";
import { ALLOWED_ANNEX_EXTENSIONS } from "@/lib/papers/types";
import { formatFileSize } from "@/lib/papers/image-utils";

interface PaperAnnexCardProps {
	position: number;
	totalAnnexes: number;
	paperId: string | null;
	onAnnexUpload: (file: File, description: string) => Promise<void>;
	onAnnexDelete?: () => void;
	existingAnnex?: PaperAnnex;
}

const LANGUAGE_LABELS: Record<string, string> = {
	python: "Python",
	jupyter: "Jupyter Notebook",
	csv: "CSV",
	json: "JSON",
	zip: "ZIP",
	text: "Texto",
};

export function PaperAnnexCard({
	position,
	totalAnnexes,
	paperId,
	onAnnexUpload,
	onAnnexDelete,
	existingAnnex,
}: PaperAnnexCardProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [description, setDescription] = useState(
		existingAnnex?.description || "",
	);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isValidExtension = (filename: string): boolean => {
		const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
		return (ALLOWED_ANNEX_EXTENSIONS as readonly string[]).includes(ext);
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!isValidExtension(file.name)) {
			setError(
				`Extensión no permitida. Usa: ${(
					ALLOWED_ANNEX_EXTENSIONS as readonly string[]
				).join(", ")}`,
			);
			return;
		}

		if (file.size > 50 * 1024 * 1024) {
			setError("El archivo excede los 50 MB");
			return;
		}

		setSelectedFile(file);
		setError(null);
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		setIsUploading(true);
		setError(null);

		try {
			await onAnnexUpload(selectedFile, description);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error subiendo anexo");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = () => {
		if (onAnnexDelete) onAnnexDelete();
		setSelectedFile(null);
		setDescription("");
	};

	// Si ya está subido, mostrar info
	if (existingAnnex) {
		return (
			<StandardCard styleType="filled" colorScheme="neutral">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded bg-primary-bg">
								<File className="h-5 w-5 text-primary-pure" />
							</div>
							<div>
								<StandardText size="sm" weight="medium">
									{existingAnnex.filename}
								</StandardText>
								<StandardText
									size="xs"
									colorScheme="neutral"
									colorShade="subtle"
								>
									{LANGUAGE_LABELS[existingAnnex.language] ||
										existingAnnex.language}{" "}
									• {formatFileSize(existingAnnex.file_size)}
								</StandardText>
							</div>
						</div>
						<StandardButton
							styleType="ghost"
							colorScheme="danger"
							size="sm"
							onClick={handleDelete}
							leftIcon={Trash2}
							iconOnly
						/>
					</div>
					{existingAnnex.description && (
						<StandardText size="xs" colorScheme="neutral" colorShade="subtle">
							{existingAnnex.description}
						</StandardText>
					)}
				</div>
			</StandardCard>
		);
	}

	// Formulario de upload
	return (
		<StandardCard styleType="filled" colorScheme="neutral">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<StandardText size="base" weight="semibold">
						Anexo {position} de {totalAnnexes}
					</StandardText>
					{position > 1 && (
						<StandardButton
							styleType="ghost"
							colorScheme="danger"
							size="sm"
							onClick={handleDelete}
							leftIcon={Trash2}
							iconOnly
						/>
					)}
				</div>

				{!selectedFile ? (
					<div className="border-2 border-dashed border-border-neutral rounded-lg p-6 text-center hover:border-primary-pure transition-colors">
						<input
							type="file"
							accept={(
								ALLOWED_ANNEX_EXTENSIONS as readonly string[]
							).join(",")}
							onChange={handleFileSelect}
							className="hidden"
							id={`annex-upload-${position}`}
							disabled={isUploading}
						/>
						<label
							htmlFor={`annex-upload-${position}`}
							className="cursor-pointer flex flex-col items-center gap-3"
						>
							<Upload className="h-8 w-8 text-text-subtle" />
							<div>
								<StandardText size="sm" weight="medium">
									Seleccionar archivo
								</StandardText>
								<StandardText
									size="xs"
									colorScheme="neutral"
									colorShade="subtle"
								>
									.py .ipynb .csv .json .zip .txt • Máx 50 MB
								</StandardText>
							</div>
						</label>
					</div>
				) : (
					<>
						<div className="bg-background-paper rounded-lg p-3 border border-border-neutral">
							<StandardText size="sm" weight="medium">
								{selectedFile.name}
							</StandardText>
							<StandardText
								size="xs"
								colorScheme="neutral"
								colorShade="subtle"
							>
								{formatFileSize(selectedFile.size)}
							</StandardText>
						</div>

						<div>
							<label className="block mb-2">
								<StandardText size="sm" weight="medium">
									Descripción
								</StandardText>
							</label>
							<input
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder='Ej: "Script de preprocesamiento de datos"'
								className="w-full px-3 py-2 bg-background-default border border-border-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-pure"
								disabled={isUploading}
							/>
						</div>

						<StandardButton
							styleType="solid"
							colorScheme="primary"
							size="md"
							onClick={handleUpload}
							disabled={isUploading}
							className="w-full"
						>
							{isUploading ? "Subiendo..." : "Guardar Anexo"}
						</StandardButton>
					</>
				)}

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
