"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { StandardStepper } from "@/components/ui/StandardStepper";
import type { StandardStepperVariant, StepItem } from "@/components/ui/StandardStepper";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { cn } from "@/lib/utils";

export interface SimulableStepperProps {
	steps: StepItem[];
	variant?: StandardStepperVariant;
	orientation?: "horizontal" | "vertical";
	initialStep?: number;
	/** Si se pasa, la simulación se detiene automáticamente al llegar a este índice (sin incluirlo) */
	stopAtStep?: number;
	className?: string;
}

/**
 * Envoltorio de StandardStepper que agrega un botón "Simular"
 * que avanza los pasos con un delay aleatorio de 4 a 10 segundos.
 */
export function SimulableStepper({
	steps,
	variant = "primary",
	orientation = "horizontal",
	initialStep = 0,
	stopAtStep,
	className,
}: SimulableStepperProps) {
	const [index, setIndex] = useState(initialStep);
	const [running, setRunning] = useState(false);
	const [paused, setPaused] = useState(false);
	const isLastStep = index >= steps.length - 1;
	const isAtStop = stopAtStep !== undefined && index >= stopAtStep;
	const isIdle = !running && !paused;

	// ── Efecto de avance automático ──
	useEffect(() => {
		if (!running || paused) return;
		if (isLastStep || isAtStop) {
			setRunning(false);
			return;
		}

		const delay = 4000 + Math.random() * 6000; // 4-10 segundos
		const timer = setTimeout(() => {
			setIndex((prev) => prev + 1);
		}, delay);

		return () => clearTimeout(timer);
	}, [running, paused, index, steps.length, isLastStep, isAtStop]);

	const handleStart = useCallback(() => {
		setIndex(initialStep);
		setRunning(true);
		setPaused(false);
	}, [initialStep]);

	const handlePause = useCallback(() => {
		setPaused((p) => !p);
	}, []);

	const handleStop = useCallback(() => {
		setRunning(false);
		setPaused(false);
	}, []);

	const handleReset = useCallback(() => {
		setRunning(false);
		setPaused(false);
		setIndex(initialStep);
	}, [initialStep]);

	// Estado actual en texto
	const statusLabel =
		running && paused ? "Pausado" :
		running ? `Simulando… (paso ${index + 1} de ${steps.length})` :
		isAtStop ? `Detenido en paso ${index + 1}` :
		isIdle && index === initialStep ? "Listo" :
		`Finalizado (paso ${index + 1})`;

	const statusColorScheme:
		| "primary"
		| "warning"
		| "neutral"
		| "success" = running && paused ? "warning" :
		running ? "primary" :
		isAtStop ? "warning" :
		"neutral";

	// ── Derivar steps con status dinámico según índice actual ──
	// Esto activa las animaciones internas de StandardStepper:
	//   - status="active"  → spinner Loader2 + breathing + pulse
	//   - status="completed" → icono Check
	//   - status="pending"   → número o icono personalizado
	// Se preserva status="error" para el demo de stopAtStep
	// Cuando la simulación termina (último paso, no corriendo), se marca como "completed"
	// para disparar la celebración del StandardStepper.
	const simulationFinished = !running && !paused && index >= steps.length - 1;
	const derivedSteps: StepItem[] = steps.map((step, i) => {
		if (step.status === "error") return step; // preservar error explícito
		if (i < index) return { ...step, status: "completed" as const };
		if (i === index) {
			// Último paso y simulación terminada → completed (dispara celebración)
			if (simulationFinished) return { ...step, status: "completed" as const };
			return { ...step, status: "active" as const };
		}
		return { ...step, status: "pending" as const };
	});

	return (
		<div className={cn("space-y-3", className)}>
			<StandardStepper
				steps={derivedSteps}
				currentStepIndex={index}
				variant={variant}
				orientation={orientation}
			/>

			{/* Controles */}
			<div className="flex flex-wrap items-center gap-2">
				{/* ── Idle, en paso inicial: solo "Simular" ── */}
				{isIdle && index === initialStep && (
					<StandardButton size="sm" onClick={handleStart}>
						<Play className="w-4 h-4 mr-1" /> Simular
					</StandardButton>
				)}

				{/* ── Idle, ya avanzó: "Reiniciar" + "Reset" ── */}
				{isIdle && index !== initialStep && (
					<>
						<StandardButton size="sm" onClick={handleStart}>
							<RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
						</StandardButton>
						<StandardButton
							size="sm"
							colorScheme="danger"
							styleType="outline"
							onClick={handleReset}>
							<Square className="w-4 h-4 mr-1" /> Reset
						</StandardButton>
					</>
				)}

				{/* ── Running, no pausado: "Pausar" + "Detener" ── */}
				{running && !paused && (
					<>
						<StandardButton
							size="sm"
							colorScheme="warning"
							styleType="outline"
							onClick={handlePause}>
							<Pause className="w-4 h-4 mr-1" /> Pausar
						</StandardButton>
						<StandardButton
							size="sm"
							colorScheme="danger"
							styleType="outline"
							onClick={handleStop}>
							<Square className="w-4 h-4 mr-1" /> Detener
						</StandardButton>
					</>
				)}

				{/* ── Running, pausado: "Continuar" + "Detener" ── */}
				{running && paused && (
					<>
						<StandardButton
							size="sm"
							colorScheme="warning"
							onClick={handlePause}>
							<Play className="w-4 h-4 mr-1" /> Continuar
						</StandardButton>
						<StandardButton
							size="sm"
							colorScheme="danger"
							styleType="outline"
							onClick={handleStop}>
							<Square className="w-4 h-4 mr-1" /> Detener
						</StandardButton>
					</>
				)}

				{/* Badge de estado */}
				<StandardBadge
					size="sm"
					colorScheme={statusColorScheme}
					styleType={running ? "solid" : "subtle"}>
					{statusLabel}
				</StandardBadge>
			</div>
		</div>
	);
}
