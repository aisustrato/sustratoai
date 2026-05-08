// 📍 app/personal/papers/nuevo/page.tsx
// Pipeline de publicación de papers (4 pasos)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PaperStepIndicator } from "../components/PaperStepIndicator";
import { PaperUploadStep } from "../components/PaperUploadStep";
import { PaperMarkdownStep } from "../components/PaperMarkdownStep";
import { PaperImagesStep } from "../components/PaperImagesStep";
import { PaperMetadataStep } from "../components/PaperMetadataStep";
import type {
	PipelineStep,
	ProcessPdfResponse,
	ImagePlaceholder,
	PaperImage,
	PaperDraftInput,
} from "@/lib/papers/types";
import { createPaperDraft, publishPaper } from "@/lib/papers/queries";

export default function NuevoPaperPage() {
	const router = useRouter();

	// Estado del pipeline
	const [currentStep, setCurrentStep] = useState<PipelineStep>(1);
	const [pdfFile, setPdfFile] = useState<File | null>(null);
	const [markdownContent, setMarkdownContent] = useState("");
	const [markdownOriginal, setMarkdownOriginal] = useState("");
	const [imagePlaceholders, setImagePlaceholders] = useState<
		ImagePlaceholder[]
	>([]);
	const [pdfMetadata, setPdfMetadata] = useState<
		ProcessPdfResponse["metadata"] | null
	>(null);
	const [uploadedImages, setUploadedImages] = useState<Map<number, PaperImage>>(
		new Map(),
	);
	const [paperId, setPaperId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Handler: Paso 1 completado
	const handleProcessComplete = (result: ProcessPdfResponse) => {
		setMarkdownContent(result.markdown);
		setMarkdownOriginal(result.markdown);
		setImagePlaceholders(result.imagePlaceholders);
		setPdfMetadata(result.metadata);
		setCurrentStep(2);
	};

	// Handler: Error en procesamiento
	const handleError = (errorMessage: string) => {
		setError(errorMessage);
	};

	// Handler: Cambio de markdown en paso 2
	const handleMarkdownChange = (newMarkdown: string) => {
		setMarkdownContent(newMarkdown);
	};

	// Handler: Cambio de imágenes en paso 3
	const handleImagesChange = (images: Map<number, PaperImage>) => {
		setUploadedImages(images);
	};

	// Handler: Markdown actualizado desde el paso de imágenes (placeholder replacement)
	const handleMarkdownFromImages = (updatedMarkdown: string) => {
		setMarkdownContent(updatedMarkdown);
	};

	// Handler: Guardar borrador
	const handleSaveDraft = async (data: PaperDraftInput) => {
		try {
			const paper = await createPaperDraft({
				...data,
				content_md: markdownContent,
			});
			setPaperId(paper.id);
			console.log("Borrador guardado:", paper);
		} catch (error) {
			console.error("Error guardando borrador:", error);
			throw error;
		}
	};

	// Handler: Publicar paper
	const handlePublish = async (data: PaperDraftInput) => {
		try {
			// Primero guardar/actualizar el borrador
			const paper = await createPaperDraft({
				...data,
				content_md: markdownContent,
			});

			// Luego publicar
			await publishPaper(paper.id);

			// Redirigir a la lista de papers
			router.push("/personal/papers");
		} catch (error) {
			console.error("Error publicando paper:", error);
			throw error;
		}
	};

	// Handler: Click en step indicator (retroceder)
	const handleStepClick = (step: PipelineStep) => {
		if (step < currentStep) {
			setCurrentStep(step);
		}
	};

	return (
		<StandardPageBackground variant="gradient">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div>
					<StandardText size="3xl" weight="bold">
						Publicar Nuevo Paper
					</StandardText>
					<StandardText size="base" colorScheme="neutral" colorShade="subtle">
						Pipeline de 4 pasos para publicar tu paper académico
					</StandardText>
				</div>

				{/* Step Indicator */}
				<PaperStepIndicator
					currentStep={currentStep}
					onStepClick={handleStepClick}
				/>

				{/* Paso 1: Upload PDF */}
				{currentStep === 1 && (
					<PaperUploadStep
						onProcessComplete={handleProcessComplete}
						onError={handleError}
					/>
				)}

				{/* Paso 2: Editar Markdown */}
				{currentStep === 2 && (
					<>
						<PaperMarkdownStep
							initialMarkdown={markdownOriginal}
							onMarkdownChange={handleMarkdownChange}
							imagePlaceholdersCount={imagePlaceholders.length}
						/>
						<div className="flex justify-between">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => setCurrentStep(1)}
								leftIcon={ArrowLeft}>
								Anterior
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={() => setCurrentStep(3)}
								rightIcon={ArrowRight}>
								Siguiente
							</StandardButton>
						</div>
					</>
				)}

				{/* Paso 3: Gestión de imágenes */}
				{currentStep === 3 && (
					<>
						<PaperImagesStep
							currentMarkdown={markdownContent}
							paperId={paperId}
							onImagesChange={handleImagesChange}
							onMarkdownUpdated={handleMarkdownFromImages}
						/>
						<div className="flex justify-between">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => setCurrentStep(2)}
								leftIcon={ArrowLeft}>
								Anterior
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={() => setCurrentStep(4)}
								rightIcon={ArrowRight}>
								Siguiente
							</StandardButton>
						</div>
					</>
				)}

				{/* Paso 4: Metadatos + Publicación */}
				{currentStep === 4 && (
					<>
						<PaperMetadataStep
							initialData={{
								title: pdfMetadata?.title || "",
								content_md: markdownContent,
							}}
							onSaveDraft={handleSaveDraft}
							onPublish={handlePublish}
						/>
						<div className="flex justify-start">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => setCurrentStep(3)}
								leftIcon={ArrowLeft}>
								Anterior
							</StandardButton>
						</div>
					</>
				)}
			</div>
		</StandardPageBackground>
	);
}
