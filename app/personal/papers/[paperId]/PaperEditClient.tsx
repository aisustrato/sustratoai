// 📍 app/personal/papers/[paperId]/PaperEditClient.tsx
// Cliente para editar paper existente

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardText } from "@/components/ui/StandardText";
import { PaperStepIndicator } from "../components/PaperStepIndicator";
import { PaperMarkdownStep } from "../components/PaperMarkdownStep";
import { PaperImagesStep } from "../components/PaperImagesStep";
import { PaperAnnexStep } from "../components/PaperAnnexStep";
import { PaperMetadataStep } from "../components/PaperMetadataStep";
import type {
	PipelineStep,
	PaperDraftInput,
	PaperWithImages,
	PaperAnnex,
} from "@/lib/papers/types";
import { updatePaperDraft } from "@/lib/papers/queries";
import {
	extractImagePlaceholders,
	validateImageMarkers,
	stripImageDescriptions,
} from "@/lib/papers/image-utils";

interface PaperEditClientProps {
	paper: PaperWithImages;
}

export function PaperEditClient({ paper }: PaperEditClientProps) {
	const router = useRouter();

	// 🔍 LOG: Componente montado
	console.log(
		`[${new Date().toISOString()}] 🟢 PaperEditClient MOUNTED - Paper ID: ${paper.id}`,
	);

	// Estado del pipeline (comienza en paso 2 porque ya tiene el PDF procesado)
	const [currentStep, setCurrentStep] = useState<PipelineStep>(2);
	const [markdownContent, setMarkdownContent] = useState(paper.content_md);
	const [markdownContentEn, setMarkdownContentEn] = useState(
		paper.content_md_en || "",
	);
	const [error, setError] = useState<string | null>(null);
	const [annexes, setAnnexes] = useState<PaperAnnex[]>(
		(paper as any).annexes || [],
	);

	// Validación de marcadores de fin de imagen (paso 2 → 3)
	const [missingMarkers, setMissingMarkers] = useState<number[]>([]);
	const [showMarkerDialog, setShowMarkerDialog] = useState(false);

	const handleGoToImages = () => {
		const { valid, missing } = validateImageMarkers(markdownContent);
		if (!valid) {
			console.warn(
				"[PaperEditClient] Imágenes sin marcador de fin:",
				missing,
			);
			setMissingMarkers(missing);
			setShowMarkerDialog(true);
			return;
		}
		setCurrentStep(3);
	};

	// 🔍 LOG: Cuando se monta el componente
	useEffect(() => {
		console.log(
			`[${new Date().toISOString()}] 🎯 PaperEditClient useEffect INICIAL - Step: ${currentStep}`,
		);
	}, []);

	// 🔍 LOG: Cuando cambia el step
	useEffect(() => {
		console.log(
			`[${new Date().toISOString()}] 📍 Step cambió a: ${currentStep}`,
		);
	}, [currentStep]);

	// Guardar cambios (también usada para publicar, ver nota en handlePublish)
	const handleSaveDraft = async (draftData: PaperDraftInput) => {
		try {
			const payload: PaperDraftInput = {
				...draftData,
				content_md: stripImageDescriptions(
					draftData.content_md ?? markdownContent,
				),
				content_md_en:
					markdownContentEn ?
						stripImageDescriptions(markdownContentEn)
					:	undefined,
			};

			await updatePaperDraft(paper.id, payload);
			router.push("/personal/papers");
		} catch (err) {
			console.error("[PaperEditClient] Error guardando:", err);
			setError(err instanceof Error ? err.message : "Error al guardar los cambios");
		}
	};

	// Publicar (usa la misma función de guardar)
	const handlePublish = handleSaveDraft;

	return (
		<StandardPageBackground variant="gradient">
			<div className="space-y-6">
				<StandardPageTitle title="Editar Paper" subtitle={paper.title} />

				<PaperStepIndicator currentStep={currentStep} />

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				)}

				{/* Paso 2: Editar Markdown */}
				{currentStep === 2 && (
					<>
						<PaperMarkdownStep
							initialMarkdown={markdownContent}
							onMarkdownChange={setMarkdownContent}
							imagePlaceholdersCount={
								extractImagePlaceholders(markdownContent).length
							}
							initialMarkdownEn={markdownContentEn}
							onMarkdownEnChange={setMarkdownContentEn}
						/>
						<div className="flex justify-between">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => {
									console.log(
										`[${new Date().toISOString()}] 🔙 Click VOLVER desde paso 2`,
									);
									router.push("/personal/papers");
								}}>
								Volver
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={() => {
									console.log(
										`[${new Date().toISOString()}] ➡️ Click SIGUIENTE (2→3)`,
									);
									handleGoToImages();
								}}>
								Siguiente
							</StandardButton>
						</div>
					</>
				)}

				{/* Paso 3: Gestionar Imágenes */}
				{currentStep === 3 && (
					<>
						<PaperImagesStep
							currentMarkdown={markdownContent}
							paperId={paper.id}
							onImagesChange={() => {}}
							onMarkdownUpdated={setMarkdownContent}
							existingImages={paper.images || []}
						/>
						<div className="flex justify-between">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => {
									console.log(
										`[${new Date().toISOString()}] ⬅️ Click ANTERIOR (3→2)`,
									);
									setCurrentStep(2);
								}}>
								Anterior
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={() => {
									console.log(
										`[${new Date().toISOString()}] ➡️ Click SIGUIENTE (3→4)`,
									);
									setCurrentStep(4);
								}}>
								Siguiente
							</StandardButton>
						</div>
					</>
				)}

				{/* Paso 4: Anexos */}
				{currentStep === 4 && (
					<>
						<PaperAnnexStep
							paperId={paper.id}
							existingAnnexes={annexes}
							onAnnexesChange={setAnnexes}
						/>
						<div className="flex justify-between">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => setCurrentStep(3)}>
								Anterior
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								size="md"
								onClick={() => setCurrentStep(5)}>
								Siguiente
							</StandardButton>
						</div>
					</>
				)}

				{/* Paso 5: Metadatos y Publicar */}
				{currentStep === 5 && (
					<>
						<PaperMetadataStep
							initialData={{
								title: paper.title,
								title_en: paper.title_en || undefined,
								subtitle: paper.subtitle || undefined,
								subtitle_en: paper.subtitle_en || undefined,
								slug: paper.slug,
								authors: Array.isArray(paper.authors) ? paper.authors : [],
								abstract_es: paper.abstract_es,
								abstract_en: paper.abstract_en || undefined,
								keywords: Array.isArray(paper.keywords) ? paper.keywords : [],
								keywords_en:
									Array.isArray(paper.keywords_en) ? paper.keywords_en : [],
								doi: paper.doi || undefined,
								citation_apa: paper.citation_apa || undefined,
								content_md: markdownContent,
								content_md_en: markdownContentEn,
								language: paper.language,
							}}
							onSaveDraft={handleSaveDraft}
							onPublish={handlePublish}
							isPublished={paper.is_published}
							paperId={paper.id}
							onContentMdTranslated={(target, contentMd) =>
								target === "en" ?
									setMarkdownContentEn(contentMd)
								:	setMarkdownContent(contentMd)
							}
						/>
						<div className="flex justify-start">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => {
									console.log(
										`[${new Date().toISOString()}] ⬅️ Click ANTERIOR (5→4)`,
									);
									setCurrentStep(4);
								}}>
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
							No puedes continuar todavía. La
							{missingMarkers.length > 1 ? "s imágenes" : " imagen"}{" "}
							<strong>{missingMarkers.join(", ")}</strong> no tiene
							{missingMarkers.length > 1 ? "n" : ""} marcador de fin de
							descripción.
						</StandardText>
						<StandardText size="sm" className="mt-3">
							Agrega <code className="font-mono">{"<!-- /img -->"}</code> justo
							después de la descripción de cada imagen para indicar dónde
							termina.
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
