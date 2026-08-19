//. 📍 app/datos-maestros/preclasificacion-workflow-test/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página de prueba AISLADA para validar traducción y clasificación inicial
 * corriendo vía Vercel Workflows (en vez del flujo síncrono con waitUntil()
 * de producción). No reemplaza ni enlaza con la UI de preclasificación
 * real — es deliberadamente una vía separada para no arriesgar un lote de
 * un investigador mientras se valida el patrón.
 *
 * Ver docs/preclasificacion-auditoria-funcional/07_Requerimiento_Preclasificacion_Workflow_Vercel.md
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Languages, Brain, FlaskConical } from "lucide-react";
import { supabase } from "@/app/auth/client";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardBadge } from "@/components/ui/StandardBadge";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
type JobStatus = "running" | "completed" | "failed" | "pending" | string;

interface JobSnapshot {
	status: JobStatus;
	progress: number | null;
	error_message: string | null;
	details: { step?: string; total?: number; processed?: number } | null;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function PreclasificacionWorkflowTestPage() {
	const [batchId, setBatchId] = useState("");
	const [activeJobId, setActiveJobId] = useState<string | null>(null);
	const [activeFlow, setActiveFlow] = useState<"translation" | "preclassification" | null>(
		null,
	);
	const [isStarting, setIsStarting] = useState(false);
	const [job, setJob] = useState<JobSnapshot | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	const pollJob = useCallback(async (jobId: string) => {
		const { data, error } = await supabase
			.from("ai_job_history")
			.select("status, progress, error_message, details")
			.eq("id", jobId)
			.single();
		if (error) {
			console.error("[preclasificacion-workflow-test] Error consultando job", error);
			return;
		}
		setJob(data as JobSnapshot);
		if (data.status === "completed" || data.status === "failed") {
			stopPolling();
			if (data.status === "completed") {
				toast.success("Workflow completado.");
			} else {
				toast.error(data.error_message || "El workflow falló.");
			}
		}
	}, [stopPolling]);

	useEffect(() => {
		if (!activeJobId) return;
		pollJob(activeJobId);
		pollRef.current = setInterval(() => pollJob(activeJobId), 2000);
		return () => stopPolling();
	}, [activeJobId, pollJob, stopPolling]);

	const startFlow = async (flow: "translation" | "preclassification") => {
		if (!batchId.trim()) {
			toast.error("Ingresá un batchId.");
			return;
		}
		setIsStarting(true);
		setJob(null);
		try {
			const response = await fetch(`/api/workflows/${flow}/start`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ batchId: batchId.trim() }),
			});
			const result = await response.json();
			if (!result.success) {
				toast.error(result.error || "No se pudo iniciar el workflow.");
				return;
			}
			toast.success(`Workflow disparado. jobId: ${result.data.jobId}`);
			setActiveFlow(flow);
			setActiveJobId(result.data.jobId);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Error de red al disparar el workflow.",
			);
		} finally {
			setIsStarting(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<StandardPageTitle
				title="Prueba: Workflows de Preclasificación"
				subtitle="Página experimental, aislada de la UI de producción."
				description="Dispara traducción o clasificación inicial vía Vercel Workflows para un batchId, sin tocar el flujo actual."
				mainIcon={FlaskConical}
			/>

			<StandardCard accentPlacement="top" colorScheme="warning">
				<StandardCard.Content>
					<StandardText size="sm" colorScheme="secondary">
						Esta página es solo para validar el patrón de Vercel Workflows. No
						reemplaza el flujo de producción — usala con un lote de prueba, no
						con el trabajo real de un investigador.
					</StandardText>
				</StandardCard.Content>
			</StandardCard>

			<StandardCard>
				<StandardCard.Header>
					<StandardCard.Title>Disparar workflow</StandardCard.Title>
				</StandardCard.Header>
				<StandardCard.Content>
					<StandardFormField
						label="Batch ID"
						htmlFor="batch-id"
						hint="ID de article_batches. Traducción espera status='pending'; clasificación espera status='translated'."
					>
						<StandardInput
							id="batch-id"
							placeholder="uuid del lote"
							value={batchId}
							onChange={(e) => setBatchId(e.target.value)}
							disabled={isStarting || !!activeJobId}
						/>
					</StandardFormField>
				</StandardCard.Content>
				<StandardCard.Actions className="justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
					<StandardButton
						styleType="outline"
						leftIcon={Languages}
						onClick={() => startFlow("translation")}
						loading={isStarting && activeFlow === "translation"}
						disabled={isStarting || !!activeJobId}
					>
						Traducir (Workflow)
					</StandardButton>
					<StandardButton
						leftIcon={Brain}
						onClick={() => startFlow("preclassification")}
						loading={isStarting && activeFlow === "preclassification"}
						disabled={isStarting || !!activeJobId}
					>
						Clasificar (Workflow)
					</StandardButton>
				</StandardCard.Actions>
			</StandardCard>

			{job && (
				<StandardCard>
					<StandardCard.Header>
						<div className="flex items-center justify-between">
							<StandardCard.Title>Progreso</StandardCard.Title>
							<StandardBadge
								colorScheme={
									job.status === "completed" ? "success"
									: job.status === "failed" ? "danger"
									: "primary"
								}
								styleType="subtle"
							>
								{job.status}
							</StandardBadge>
						</div>
					</StandardCard.Header>
					<StandardCard.Content className="space-y-3">
						<StandardProgressBar
							value={job.progress ?? 0}
							label={job.details?.step || ""}
							showValue
							animated={job.status === "running"}
						/>
						{job.details?.total != null && (
							<StandardText size="sm" colorScheme="secondary">
								{job.details.processed ?? 0} / {job.details.total} procesados
							</StandardText>
						)}
						{job.error_message && (
							<StandardText size="sm" colorScheme="danger">
								{job.error_message}
							</StandardText>
						)}
					</StandardCard.Content>
					{(job.status === "completed" || job.status === "failed") && (
						<StandardCard.Actions className="justify-end border-t border-neutral-200 dark:border-neutral-800">
							<StandardButton
								styleType="outline"
								onClick={() => {
									setActiveJobId(null);
									setJob(null);
								}}
							>
								Probar otro lote
							</StandardButton>
						</StandardCard.Actions>
					)}
				</StandardCard>
			)}
		</div>
	);
}
//#endregion ![main]
