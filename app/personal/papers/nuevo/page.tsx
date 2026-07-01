// 📍 app/personal/papers/nuevo/page.tsx
// Pipeline de publicación de papers (5 pasos)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
	validateImageMarkers,
	stripImageDescriptions,
} from "@/lib/papers/image-utils";
import { PaperStepIndicator } from "../components/PaperStepIndicator";
import { PaperUploadStep } from "../components/PaperUploadStep";
import { PaperMarkdownStep } from "../components/PaperMarkdownStep";
import { PaperImagesStep } from "../components/PaperImagesStep";
import { PaperAnnexStep } from "../components/PaperAnnexStep";
import { PaperMetadataStep } from "../components/PaperMetadataStep";
import type {
	PipelineStep,
	ProcessPdfResponse,
	ImagePlaceholder,
	PaperImage,
	PaperAnnex,
	PaperDraftInput,
} from "@/lib/papers/types";
import {
	createPaperDraft,
	updatePaperDraft,
	publishPaper,
} from "@/lib/papers/queries";
import { generatePaperSlug } from "@/lib/papers/slug";

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
	const [annexes, setAnnexes] = useState<PaperAnnex[]>([]);

	// Validación de marcadores de fin de imagen (paso 2 → 3)
	const [missingMarkers, setMissingMarkers] = useState<number[]>([]);
	const [showMarkerDialog, setShowMarkerDialog] = useState(false);

	const [isPreparingImages, setIsPreparingImages] = useState(false);

	// Intentar avanzar del paso 2 al 3: cada imagen debe tener su marcador de fin
	// y debe existir un borrador (paperId) para poder subir imágenes.
	const handleGoToImages = async () => {
		const { valid, missing } = validateImageMarkers(markdownContent);
		if (!valid) {
			console.warn("[NuevoPaperPage] Imágenes sin marcador de fin:", missing);
			setMissingMarkers(missing);
			setShowMarkerDialog(true);
			return;
		}

		// Si aún no hay borrador, crearlo ahora para tener paperId en el paso 3
		if (!paperId) {
			setIsPreparingImages(true);
			setError(null);
			try {
				const tentativeTitle = pdfMetadata?.title || "Borrador sin título";
				// Slug provisional único; el usuario fija el definitivo en el paso 4
				const draftSlug = `${generatePaperSlug(tentativeTitle)}-${Date.now().toString(36)}`;

				const paper = await createPaperDraft({
					title: tentativeTitle,
					slug: draftSlug,
					abstract_es: "",
					authors: [],
					keywords: [],
					content_md: stripImageDescriptions(markdownContent),
					version: "1.0",
					license: "CC BY 4.0",
					language: "es",
					processing_status: "draft",
				});
				setPaperId(paper.id);
				console.log("[NuevoPaperPage] Borrador creado:", paper.id);
			} catch (err) {
				console.error("[NuevoPaperPage] Error creando borrador:", err);
				setError(
					err instanceof Error
						? err.message
						: "No se pudo crear el borrador para subir imágenes",
				);
				setIsPreparingImages(false);
				return;
			}
			setIsPreparingImages(false);
		}

		setCurrentStep(3);
	};

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

	// Handler: Cambio de anexos en paso 4
	const handleAnnexesChange = (newAnnexes: PaperAnnex[]) => {
		setAnnexes(newAnnexes);
	};

	// Handler: Guardar borrador
	const handleSaveDraft = async (data: PaperDraftInput) => {
		try {
			const payload = {
				...data,
				content_md: stripImageDescriptions(markdownContent),
			};
			// Si ya existe borrador (creado en el paso 3), actualizarlo; si no, crear
			if (paperId) {
				const paper = await updatePaperDraft(paperId, payload);
				console.log("Borrador actualizado:", paper);
			} else {
				const paper = await createPaperDraft(payload);
				setPaperId(paper.id);
				console.log("Borrador guardado:", paper);
			}
		} catch (error) {
			console.error("Error guardando borrador:", error);
			throw error;
		}
	};

	// Handler: Publicar paper
	const handlePublish = async (data: PaperDraftInput) => {
		try {
			const payload = {
				...data,
				content_md: stripImageDescriptions(markdownContent),
			};

			// Primero guardar/actualizar el borrador (update si ya existe)
			const paper = paperId
				? await updatePaperDraft(paperId, payload)
				: await createPaperDraft(payload);

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
						Pipeline de 5 pasos para publicar tu paper académico
					</StandardText>
				</div>

				{/* Step Indicator */}
				<PaperStepIndicator
					currentStep={currentStep}
					onStepClick={handleStepClick}
				/>

				{error && (
					<div className="bg-danger-bg border border-danger-border rounded-lg p-4">
						<StandardText size="sm" colorScheme="danger">
							{error}
						</StandardText>
					</div>
				)}

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
								onClick={handleGoToImages}
								disabled={isPreparingImages}
								rightIcon={ArrowRight}>
								{isPreparingImages ? "Preparando..." : "Siguiente"}
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

				{/* Paso 4: Anexos / Material Suplementario */}
				{currentStep === 4 && (
					<>
						<PaperAnnexStep
							paperId={paperId}
							existingAnnexes={annexes}
							onAnnexesChange={handleAnnexesChange}
						/>
						<div className="flex justify-between">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => setCurrentStep(3)}
								leftIcon={ArrowLeft}>
								Anterior
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={() => setCurrentStep(5)}
								rightIcon={ArrowRight}>
								Siguiente
							</StandardButton>
						</div>
					</>
				)}

				{/* Paso 5: Metadatos + Publicación */}
				{currentStep === 5 && (
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
								onClick={() => setCurrentStep(4)}
								leftIcon={ArrowLeft}>
								Anterior
							</StandardButton>
						</div>
					</>
				)}
			</div>

			{/* Diálogo: faltan marcadores de fin de imagen */}
			<StandardDialog open={showMarkerDialog} onOpenChange={setShowMarkerDialog}>
				<StandardDialog.Content colorScheme="warning" size="md">
					<StandardDialog.Header>
						<StandardDialog.Title>
							Falta indicar el fin de la descripción
						</StandardDialog.Title>
					</StandardDialog.Header>
					<StandardDialog.Body>
						<StandardText size="sm">
							No puedes continuar todavía. La{" "}
							{missingMarkers.length > 1 ? "s imágenes" : " imagen"}{" "}
							<strong>
								{missingMarkers.join(", ")}
							</strong>{" "}
							no tiene
							{missingMarkers.length > 1 ? "n" : ""} marcador de fin de
							descripción.
						</StandardText>
						<StandardText size="sm" className="mt-3">
							Agrega <code className="font-mono">{"<!-- /img -->"}</code> justo
							después de la descripción de cada imagen para indicar dónde
							termina. Así el texto de la imagen no se mezcla con el cuerpo del
							paper.
						</StandardText>
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardButton
							styleType="solid"
							colorScheme="primary"
							size="md"
							onClick={() => setShowMarkerDialog(false)}>
							Entendido
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</StandardPageBackground>
	);
}
