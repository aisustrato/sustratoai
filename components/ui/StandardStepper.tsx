//. 📍 components/ui/StandardStepper.tsx

"use client";

import React from "react";
import { Check } from "lucide-react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { cn } from "@/lib/utils";
import { StandardText } from "./StandardText";
import {
	type StandardStepperVariant,
	type StandardStepperTokens,
} from "@/lib/theme/components/standard-stepper-tokens";

export interface StepItem {
	id: string | number;
	label: string;
	description?: string;
	icon?: React.ElementType;
}

export interface StandardStepperProps {
	steps: StepItem[];
	currentStepIndex: number; // 0-based index
	variant?: StandardStepperVariant;
	orientation?: "horizontal" | "vertical";
	className?: string;
	onStepClick?: (index: number) => void;
}

export function StandardStepper({
	steps,
	currentStepIndex,
	variant = "primary",
	orientation = "horizontal",
	className,
	onStepClick,
}: StandardStepperProps) {
	const { tokens: designTokens } = useDesignTokens();

	// Tokens precalculados
	const tokens: StandardStepperTokens | null =
		(designTokens?.stepper as StandardStepperTokens) || null;

	if (!tokens) return null;

	return (
		<div
			className={cn(
				"flex w-full",
				orientation === "vertical" ? "flex-col" : "flex-row items-start",
				className,
			)}>
			{steps.map((step, index) => {
				const isCompleted = index < currentStepIndex;
				const isCurrent = index === currentStepIndex;
				const isPending = index > currentStepIndex;
				const isLast = index === steps.length - 1;

				// Determinar estilos según estado
				const stateStyles =
					isCompleted ? tokens.variants.completed[variant]
					: isCurrent ? tokens.variants.current[variant]
					: tokens.variants.pending;

				const lineColor =
					isCompleted ?
						tokens.variants.completed[variant].lineColor
					:	tokens.variants.pending.lineColor;

				return (
					<div
						key={step.id}
						className={cn(
							"relative flex",
							orientation === "vertical" ?
								"flex-row flex-1 pb-8"
							:	"flex-1 flex-col items-center text-center",
							isLast && orientation === "vertical" ? "pb-0" : "",
							onStepClick && isCompleted ? "cursor-pointer" : "",
						)}
						onClick={() => onStepClick && isCompleted && onStepClick(index)}>
						{/* LINEA CONECTORA */}
						{!isLast && (
							<div
								className={cn(
									"absolute bg-gray-200",
									orientation === "vertical" ?
										"left-[1.25rem] top-[2.5rem] bottom-0 w-[2px] -ml-[1px]"
									:	"top-[1.25rem] left-[50%] right-[-50%] h-[2px] -mt-[1px]",
								)}
								style={{
									backgroundColor: lineColor,
									transition: tokens.base.transition,
								}}
							/>
						)}

						{/* BURBUJA / CIRCULO */}
						<div
							className={cn(
								"relative z-10 flex items-center justify-center rounded-full border-2 shadow-sm",
								orientation === "vertical" ? "mr-4" : "mb-2",
							)}
							style={{
								width: tokens.base.bubbleSize,
								height: tokens.base.bubbleSize,
								backgroundColor: stateStyles.background,
								borderColor: stateStyles.border,
								color: stateStyles.text,
								transition: tokens.base.transition,
							}}>
							{isCompleted ?
								<Check className="w-5 h-5" />
							: step.icon ?
								<step.icon className="w-5 h-5" />
							:	<span className="font-bold text-sm">{index + 1}</span>}
						</div>

						{/* ETIQUETAS */}
						<div
							className={cn(
								"flex flex-col",
								orientation === "vertical" ? "pt-1" : "items-center",
							)}>
							<StandardText
								weight={isCurrent || isCompleted ? "bold" : "medium"}
								size="sm"
								style={{ color: isPending ? stateStyles.text : undefined }}>
								{step.label}
							</StandardText>
							{step.description && (
								<StandardText
									size="xs"
									colorScheme="neutral"
									className={cn(
										orientation === "horizontal" &&
											"hidden md:block max-w-[120px]",
									)}>
									{step.description}
								</StandardText>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
