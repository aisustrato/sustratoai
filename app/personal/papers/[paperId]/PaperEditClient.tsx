// 📍 app/personal/papers/[paperId]/PaperEditClient.tsx
// Cliente para editar paper existente

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { PaperStepIndicator } from "../components/PaperStepIndicator";
import { PaperMarkdownStep } from "../components/PaperMarkdownStep";
import { PaperImagesStep } from "../components/PaperImagesStep";
import { PaperMetadataStep } from "../components/PaperMetadataStep";
import type {
	PipelineStep,
	PaperDraftInput,
	PaperWithImages,
} from "@/lib/papers/types";
import { updatePaperDraft } from "@/lib/papers/queries";
import { extractImagePlaceholders } from "@/lib/papers/image-utils";

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
	const [error, setError] = useState<string | null>(null);

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

	// Guardar cambios
	const handleSaveDraft = async (draftData: PaperDraftInput) => {
		try {
			await updatePaperDraft(paper.id, draftData);
			router.push("/personal/papers");
		} catch (err) {
			console.error("[PaperEditClient] Error guardando:", err);
			setError("Error al guardar los cambios");
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
									setCurrentStep(3);
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

				{/* Paso 4: Metadatos y Publicar */}
				{currentStep === 4 && (
					<>
						<PaperMetadataStep
							initialData={{
								title: paper.title,
								subtitle: paper.subtitle || undefined,
								slug: paper.slug,
								authors: Array.isArray(paper.authors) ? paper.authors : [],
								abstract_es: paper.abstract_es,
								abstract_en: paper.abstract_en || undefined,
								keywords: Array.isArray(paper.keywords) ? paper.keywords : [],
								doi: paper.doi || undefined,
								citation_apa: paper.citation_apa || undefined,
								content_md: markdownContent,
							}}
							onSaveDraft={handleSaveDraft}
							onPublish={handlePublish}
							isPublished={paper.is_published}
						/>
						<div className="flex justify-start">
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								size="md"
								onClick={() => {
									console.log(
										`[${new Date().toISOString()}] ⬅️ Click ANTERIOR (4→3)`,
									);
									setCurrentStep(3);
								}}>
								Anterior
							</StandardButton>
						</div>
					</>
				)}
			</div>
		</StandardPageBackground>
	);
}
