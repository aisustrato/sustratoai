// 📍 app/personal/papers/components/PaperStepIndicator.tsx
// Indicador de pasos del pipeline de publicación

"use client";

import { StandardStepper, type StepItem } from "@/components/ui/StandardStepper";
import { Upload, FileText, Image, File, Send } from "lucide-react";
import type { PipelineStep } from "@/lib/papers/types";

interface PaperStepIndicatorProps {
	currentStep: PipelineStep;
	onStepClick?: (step: PipelineStep) => void;
	completedSteps?: PipelineStep[];
}

const PIPELINE_STEPS: StepItem[] = [
	{
		id: 1,
		label: "Subir PDF",
		description: "Cargar archivo",
		icon: Upload,
	},
	{
		id: 2,
		label: "Editar Contenido",
		description: "Revisar Markdown",
		icon: FileText,
	},
	{
		id: 3,
		label: "Imágenes",
		description: "Gestionar imágenes",
		icon: Image,
	},
	{
		id: 4,
		label: "Anexos",
		description: "Material suplementario",
		icon: File,
	},
	{
		id: 5,
		label: "Publicar",
		description: "Metadatos y publicación",
		icon: Send,
	},
];

export function PaperStepIndicator({
	currentStep,
	onStepClick,
	completedSteps = [],
}: PaperStepIndicatorProps) {
	// Convertir currentStep (1-4) a índice 0-based
	const currentStepIndex = currentStep - 1;

	// Determinar qué pasos están completados
	// Un paso está completado si su número es menor al paso actual
	// O si está explícitamente en completedSteps
	const isStepCompleted = (stepNumber: number): boolean => {
		return stepNumber < currentStep || completedSteps.includes(stepNumber as PipelineStep);
	};

	const handleStepClick = (index: number) => {
		const stepNumber = (index + 1) as PipelineStep;
		
		// Solo permitir click en pasos completados
		if (isStepCompleted(stepNumber) && onStepClick) {
			onStepClick(stepNumber);
		}
	};

	return (
		<div className="w-full mb-8">
			<StandardStepper
				steps={PIPELINE_STEPS}
				currentStepIndex={currentStepIndex}
				variant="primary"
				orientation="horizontal"
				onStepClick={handleStepClick}
			/>
		</div>
	);
}
