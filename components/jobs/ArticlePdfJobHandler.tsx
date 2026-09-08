// 📍 components/jobs/ArticlePdfJobHandler.tsx
// Indicador de progreso para el procesamiento de un PDF de artículo
// (workflows/article-pdf-workflow.ts). Mismo patrón de Realtime + polling de
// respaldo que TranslationJobHandler.tsx, pero autocontenido — no depende de
// JobManagerContext (acá no hay una bandeja global de trabajos, el progreso
// se muestra in-place en la sección "Documento completo" de articulos/detalle).

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/app/auth/client";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardText } from "@/components/ui/StandardText";
import { FileText } from "lucide-react";

interface AiJobHistoryUpdate {
	progress?: number | null;
	details?: unknown;
	status?: string | null;
	error_message?: string | null;
}

interface ArticlePdfJobHandlerProps {
	jobId: string;
	onCompleted: () => void;
	onFailed: (errorMessage: string) => void;
}

function extractStepMessage(details: unknown): string | null {
	if (details && typeof details === "object" && !Array.isArray(details)) {
		const step = (details as Record<string, unknown>).step;
		if (typeof step === "string") return step;
	}
	return null;
}

export function ArticlePdfJobHandler({ jobId, onCompleted, onFailed }: ArticlePdfJobHandlerProps) {
	const [progress, setProgress] = useState(0);
	const [statusMessage, setStatusMessage] = useState("Iniciando...");
	const cleanupRef = useRef<null | (() => void)>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const finishedRef = useRef(false);

	const handleUpdate = useCallback(
		(data: AiJobHistoryUpdate) => {
			if (finishedRef.current) return;

			if (typeof data.progress === "number") setProgress(data.progress);
			const step = extractStepMessage(data.details);
			if (step) setStatusMessage(step);

			if (data.status === "completed") {
				finishedRef.current = true;
				setProgress(100);
				setStatusMessage("¡Documento procesado!");
				cleanupRef.current?.();
				setTimeout(onCompleted, 1000);
			} else if (data.status === "failed") {
				finishedRef.current = true;
				setProgress(100);
				const errorMessage = data.error_message || "Error durante el procesamiento del PDF.";
				setStatusMessage(`Error: ${errorMessage}`);
				cleanupRef.current?.();
				setTimeout(() => onFailed(errorMessage), 1000);
			}
		},
		[onCompleted, onFailed],
	);

	useEffect(() => {
		finishedRef.current = false;

		const channel = supabase
			.channel(`article-pdf-job-${jobId}`)
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "ai_job_history", filter: `id=eq.${jobId}` },
				(payload) => handleUpdate(payload.new as AiJobHistoryUpdate),
			)
			.subscribe();

		const pollProgress = async () => {
			const { data, error } = await supabase
				.from("ai_job_history")
				.select("progress, details, status, error_message")
				.eq("id", jobId)
				.single();
			if (error) {
				console.error("[ArticlePdfJobHandler] Error en polling:", error);
				return;
			}
			if (data) handleUpdate(data);
		};

		pollProgress();
		pollingIntervalRef.current = setInterval(pollProgress, 2000);

		cleanupRef.current = () => {
			channel.unsubscribe();
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			cleanupRef.current = null;
		};

		return () => cleanupRef.current?.();
	}, [jobId, handleUpdate]);

	return (
		<div className="p-3 border-l-4 border-primary-pure bg-primary-subtle rounded-r-md">
			<div className="flex items-center gap-2 mb-2">
				<FileText className="h-4 w-4 text-primary-pure" />
				<StandardText size="sm" weight="medium">
					Procesando documento completo
				</StandardText>
				<StandardText size="xs" colorScheme="neutral" className="ml-auto">
					{Math.round(progress)}%
				</StandardText>
			</div>
			<StandardProgressBar value={progress} max={100} colorScheme="primary" size="sm" className="mb-2" />
			<StandardText size="xs" colorScheme="neutral" className="truncate">
				{statusMessage}
			</StandardText>
		</div>
	);
}
