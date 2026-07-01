// 📍 app/personal/papers/components/PaperUploadStep.tsx
// Paso 1: Upload de PDF y procesamiento con Replicate Marker

"use client";

import { useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { FileText, Upload, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/lib/papers/image-utils";
import type { ProcessPdfResponse } from "@/lib/papers/types";

interface PaperUploadStepProps {
	onProcessComplete: (result: ProcessPdfResponse) => void;
	onError: (error: string) => void;
}

type ProcessingStatus =
	| "idle"
	| "uploading"
	| "processing"
	| "extracting"
	| "completed";

const STATUS_MESSAGES: Record<ProcessingStatus, string> = {
	idle: "Esperando archivo...",
	uploading: "Subiendo PDF...",
	processing: "Procesando con Marker...",
	extracting: "Extrayendo texto e imágenes...",
	completed: "¡Listo!",
};

export function PaperUploadStep({
	onProcessComplete,
	onError,
}: PaperUploadStepProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingStatus, setProcessingStatus] =
		useState<ProcessingStatus>("idle");
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validar que sea PDF
		if (file.type !== "application/pdf") {
			setError("El archivo debe ser un PDF");
			return;
		}

		// Validar tamaño (max 50 MB)
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			setError("El archivo excede el tamaño máximo de 50 MB");
			return;
		}

		setSelectedFile(file);
		setError(null);
	};

	const handleProcess = async () => {
		if (!selectedFile) return;

		setIsProcessing(true);
		setError(null);
		setProgress(0);

		try {
			// Fase 1: Uploading
			setProcessingStatus("uploading");
			setProgress(20);

			const formData = new FormData();
			formData.append("file", selectedFile);

			// Fase 2: Processing
			setProcessingStatus("processing");
			setProgress(40);

			const response = await fetch("/api/personal/process-paper-pdf", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error procesando PDF");
			}

			// Fase 3: Extracting
			setProcessingStatus("extracting");
			setProgress(70);

			const result: ProcessPdfResponse = await response.json();

			// Fase 4: Completed
			setProcessingStatus("completed");
			setProgress(100);

			// Esperar un momento para mostrar el estado completado
			await new Promise((resolve) => setTimeout(resolve, 500));

			onProcessComplete(result);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			setError(errorMessage);
			onError(errorMessage);
			setIsProcessing(false);
			setProcessingStatus("idle");
			setProgress(0);
		}
	};

	const handleReset = () => {
		setSelectedFile(null);
		setError(null);
		setIsProcessing(false);
		setProcessingStatus("idle");
		setProgress(0);
	};

	return (
		<div className="space-y-6">
			<StandardCard styleType="filled" colorScheme="neutral">
				<div className="space-y-6">
					{/* Header */}
					<div className="flex items-center gap-3">
						<div className="p-3 rounded-lg bg-primary-bg">
							<Upload className="h-6 w-6 text-primary-pure" />
						</div>
						<div>
							<StandardText size="xl" weight="semibold">
								Subir PDF Académico
							</StandardText>
							<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
								El mismo PDF publicado en Zenodo
							</StandardText>
						</div>
					</div>

					{/* File Input */}
					{!selectedFile && !isProcessing && (
						<div className="border-2 border-dashed border-border-neutral rounded-lg p-8 text-center hover:border-primary-pure transition-colors">
							<input
								type="file"
								accept=".pdf,application/pdf"
								onChange={handleFileSelect}
								className="hidden"
								id="pdf-upload"
								disabled={isProcessing}
							/>
							<label
								htmlFor="pdf-upload"
								className="cursor-pointer flex flex-col items-center gap-4">
								<FileText className="h-12 w-12 text-text-subtle" />
								<div>
									<StandardText size="base" weight="medium">
										Haz click para seleccionar o arrastra el archivo aquí
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="subtle">
										PDF • Máximo 50 MB
									</StandardText>
								</div>
							</label>
						</div>
					)}

					{/* File Preview */}
					{selectedFile && !isProcessing && (
						<div className="bg-background-paper rounded-lg p-4 border border-border-neutral">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<FileText className="h-8 w-8 text-primary-pure" />
									<div>
										<StandardText size="base" weight="medium">
											{selectedFile.name}
										</StandardText>
										<StandardText
											size="sm"
											colorScheme="neutral"
											colorShade="subtle">
											{formatFileSize(selectedFile.size)}
										</StandardText>
									</div>
								</div>
								<StandardButton
									styleType="ghost"
									size="sm"
									onClick={handleReset}
									disabled={isProcessing}>
									Cambiar
								</StandardButton>
							</div>
						</div>
					)}

					{/* Processing Status */}
					{isProcessing && (
						<div className="space-y-4">
							<div className="bg-background-paper rounded-lg p-4 border border-border-neutral">
								<StandardText
									size="sm"
									colorScheme="neutral"
									colorShade="subtle"
									className="mb-2">
									{STATUS_MESSAGES[processingStatus]}
								</StandardText>
								<StandardProgressBar
									value={progress}
									colorScheme="primary"
									size="md"
									animated
								/>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="bg-danger-bg border border-danger-border rounded-lg p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-danger-pure flex-shrink-0 mt-0.5" />
								<div>
									<StandardText size="sm" weight="medium" colorScheme="danger">
										Error
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="danger"
										colorShade="subtle">
										{error}
									</StandardText>
								</div>
							</div>
						</div>
					)}

					{/* Action Button */}
					{selectedFile && !isProcessing && (
						<div className="flex justify-end">
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="lg"
								onClick={handleProcess}
								disabled={isProcessing}>
								Procesar PDF
							</StandardButton>
						</div>
					)}
				</div>
			</StandardCard>

			{/* Info Card */}
			<StandardCard styleType="subtle" colorScheme="neutral" noPadding={false}>
				<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
					<strong>Nota:</strong> El procesamiento puede tomar entre 30 segundos
					y 2 minutos dependiendo del tamaño del PDF. Se extraerá el texto en
					formato Markdown y se detectarán los placeholders de imágenes para que
					puedas subirlas en el siguiente paso.
				</StandardText>
			</StandardCard>
		</div>
	);
}
