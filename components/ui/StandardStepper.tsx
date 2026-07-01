//. 📍 components/ui/StandardStepper.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { cn } from "@/lib/utils";
import { StandardText } from "./StandardText";
import { StandardProgressBar } from "./StandardProgressBar";
import {
	type StandardStepperVariant,
	type StandardStepperTokens,
} from "@/lib/theme/components/standard-stepper-tokens";

// Re-export para consumidores (ej. el showroom) que importan el tipo desde acá.
export type { StandardStepperVariant };

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface StepItem {
	id: string | number;
	label: string;
	description?: string;
	icon?: React.ElementType;
	status?: StepStatus;
}

export interface StandardStepperProps {
	steps: StepItem[];
	currentStepIndex: number; // 0-based index
	variant?: StandardStepperVariant;
	orientation?: "horizontal" | "vertical";
	className?: string;
	onStepClick?: (index: number) => void;
	/** Activa animación de celebración cuando todos los pasos se completan. Default: `true` */
	celebrateOnComplete?: boolean;
	/** Activa alerta sonora (éxito/error) vía Web Audio API. Default: `true` */
	enableSoundAlerts?: boolean;
}

// ─── Web Audio API helpers ──────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
	if (!_audioCtx || _audioCtx.state === "closed") {
		_audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
	}
	return _audioCtx;
}

function playSuccessSound() {
	try {
		const ctx = getAudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(200, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
		gain.gain.setValueAtTime(0.15, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
		osc.connect(gain).connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.4);
	} catch {
		// Audio no disponible — silenciar sin romper
	}
}

function playErrorSound() {
	try {
		const ctx = getAudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "square";
		osc.frequency.setValueAtTime(600, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
		gain.gain.setValueAtTime(0.1, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
		osc.connect(gain).connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.4);
	} catch {
		// Audio no disponible — silenciar sin romper
	}
}

export function StandardStepper({
	steps,
	currentStepIndex,
	variant = "primary",
	orientation = "horizontal",
	className,
	onStepClick,
	celebrateOnComplete = true,
	enableSoundAlerts = true,
}: StandardStepperProps) {
	const { tokens: designTokens } = useDesignTokens();

	// Tokens precalculados
	const tokens: StandardStepperTokens | null =
		(designTokens?.stepper as StandardStepperTokens) || null;

	// ─── Detección de estados ───
	const allCompleted = steps.length > 0 && steps.every((s) => s.status === "completed");
	const hasError = steps.some((s) => s.status === "error");

	// Refs para detectar transiciones (evitar disparos repetidos)
	const prevAllCompleted = useRef(false);
	const prevHasError = useRef(false);

	// Estado de celebración (se activa 2 segundos)
	const [celebrating, setCelebrating] = useState(false);

	// ─── Efecto: celebración al completar todos los pasos ───
	useEffect(() => {
		if (allCompleted && !prevAllCompleted.current && celebrateOnComplete) {
			setCelebrating(true);
			if (enableSoundAlerts) playSuccessSound();
			const timer = setTimeout(() => setCelebrating(false), 2000);
			return () => clearTimeout(timer);
		}
		prevAllCompleted.current = allCompleted;
	}, [allCompleted, celebrateOnComplete, enableSoundAlerts]);

	// ─── Efecto: alerta sonora al detectar error ───
	useEffect(() => {
		if (hasError && !prevHasError.current && enableSoundAlerts) {
			playErrorSound();
		}
		prevHasError.current = hasError;
	}, [hasError, enableSoundAlerts]);

	if (!tokens) return null;

	return (
		<div
			className={cn(
				"flex w-full",
				orientation === "vertical" ? "flex-col" : "flex-row items-start",
				celebrating && "stepper-celebrating",
				className,
			)}>
			{steps.map((step, index) => {
				const isCompleted = index < currentStepIndex;
				const isCurrent = index === currentStepIndex;
				const isPending = index > currentStepIndex;
				const isLast = index === steps.length - 1;
				const isActive = step.status === "active";
				const isError = step.status === "error";

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
						{!isLast && orientation === "vertical" ? (
							// Vertical: línea estática con transición de color
							<div
								className={cn(
									"absolute bg-gray-200",
									"left-[1.25rem] top-[2.5rem] bottom-0 w-[2px] -ml-[1px]",
								)}
								style={{
									backgroundColor: lineColor,
									transition: tokens.base.transition,
								}}
							/>
						) : !isLast ? (
							// Horizontal: StandardProgressBar como conector vivo
							<div
								className="absolute top-[1.25rem] left-[50%] right-[-50%] -mt-[2px]"
								style={{ transition: tokens.base.transition }}>
								<StandardProgressBar
									value={isCompleted ? 100 : 0}
									indeterminate={isCurrent && isActive}
									colorScheme={isCompleted ? "success" : (isCurrent && isActive ? variant : "neutral")}
									styleType="solid"
									size="xs"
									animated={true}
								/>
							</div>
						) : null}

						{/* BURBUJA / CIRCULO */}
						<div
							className={cn(
								"relative z-10 flex items-center justify-center rounded-full border-2 shadow-sm transition-all duration-500",
								orientation === "vertical" ? "mr-4" : "mb-2",
								// Animación de respiración para el paso activo
								isActive && "stepper-breathe ring-4 ring-offset-2 ring-primary-400/40 shadow-lg shadow-primary-500/20",
								// Borde rojo para error
								isError && "ring-4 ring-offset-2 ring-red-400/40",
								// Celebración: bounce escalonado en pasos completados
								celebrating && isCompleted && "stepper-bubble-celebrate",
							)}
							style={{
								width: tokens.base.bubbleSize,
								height: tokens.base.bubbleSize,
								backgroundColor: stateStyles.background,
								borderColor: isError ? "#ef4444" : stateStyles.border,
								color: stateStyles.text,
								transition: tokens.base.transition,
								// Delay escalonado para la celebración
								animationDelay: celebrating && isCompleted ? `${index * 80}ms` : undefined,
							}}>
							{isCompleted ?
								<Check className="w-5 h-5" />
							: isActive ?
								<Loader2 className="w-5 h-5 animate-spin" />
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
								className={cn(
									isActive && "text-primary-700 font-semibold",
									isError && "text-red-600",
								)}
								style={{ color: isPending ? stateStyles.text : undefined }}>
								{step.label}
							</StandardText>
							{step.description && (
								<StandardText
									size="xs"
									colorScheme={isActive ? "primary" : isError ? "danger" : "neutral"}
									className={cn(
										orientation === "horizontal" &&
											"hidden md:block max-w-[120px]",
										isActive && "animate-pulse",
									)}>
									{step.description}
								</StandardText>
							)}
						</div>
					</div>
				);
			})}

			<style jsx>{`
				@keyframes stepper-breathe {
					0%, 100% {
						transform: scale(1);
						box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3);
					}
					50% {
						transform: scale(1.06);
						box-shadow: 0 0 24px 8px rgba(59, 130, 246, 0.15);
					}
				}
				.stepper-breathe {
					animation: stepper-breathe 2.5s ease-in-out infinite;
				}

				/* ─── Celebración: glow verde en el contenedor ─── */
				@keyframes stepper-complete-glow {
					0%, 100% {
						box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
					}
					50% {
						box-shadow: 0 0 30px 8px rgba(34, 197, 94, 0.25);
					}
				}
				.stepper-celebrating {
					animation: stepper-complete-glow 2s ease-in-out 1;
					border-radius: 0.5rem;
				}

				/* ─── Celebración: bounce escalonado en cada burbuja ─── */
				@keyframes stepper-bubble-celebrate {
					0% { transform: scale(1); }
					25% { transform: scale(1.2); }
					50% { transform: scale(0.95); }
					75% { transform: scale(1.05); }
					100% { transform: scale(1); }
				}
				.stepper-bubble-celebrate {
					animation: stepper-bubble-celebrate 0.4s ease-out both;
				}
			`}</style>
		</div>
	);
}
