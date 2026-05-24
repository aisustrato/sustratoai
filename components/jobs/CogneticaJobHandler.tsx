//. 📍 components/jobs/CogneticaJobHandler.tsx
/**
 * Handler del JobManager para metabolización de Cognética Forense.
 *
 * **Diferencia con los handlers legacy** (Preclassification/Translation/
 * Reconciliation): aquí la action ya está corriendo en el backend cuando
 * este handler se monta. La starter `metabolizarArtefacto` retornó
 * `{jobId}` antes de poner el job en el JobManager. Este componente
 * **sólo se suscribe** al row de `ai_job_history` por su id y refleja el
 * progreso paso a paso en el panel flotante. Si el usuario cierra la
 * pestaña y vuelve, el handler se monta de nuevo y retoma desde donde
 * está el job en BD vía SELECT inicial.
 *
 * **Por qué los callbacks van por useRef en vez de en las deps del effect**:
 * `completeJob` y `failJob` del JobManagerContext dependen internamente de
 * `isJobManagerExpanded`. Si los pusiéramos en las deps del useEffect, el
 * effect se re-ejecutaría cada vez que el panel se expande/colapsa: el
 * cleanup desuscribiría el channel y la siguiente ejecución crearía uno
 * nuevo. En la práctica eso causaba que el panel se quedara congelado
 * (el cleanup + nueva suscripción a Supabase tiene un gap durante el cual
 * llegan UPDATEs que se pierden, o si había un guard `hasSubscribedRef`
 * directamente la re-suscripción se omitía). Manteniendo los callbacks en
 * un ref, las deps del effect son sólo IDs estables y nunca se re-ejecuta.
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useJobManager, type Job } from "@/app/contexts/JobManagerContext";
import { supabase } from "@/app/auth/client";
import {
	pipelineParaTipo,
	type StepName,
} from "@/lib/cognetica-forense/pipelines";
import type { CgtTipoArtefacto } from "@/lib/cognetica-forense/cognetica_forense_types";
import {
	mensajeAmigableDeError,
	type MensajeAmigable,
} from "@/lib/cognetica-forense/error-amigable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardText } from "@/components/ui/StandardText";
import {
	AlertCircle,
	ArrowUpRight,
	CheckCircle,
	FlaskConical,
	Info,
} from "lucide-react";
//#endregion ![head]

interface CogneticaJobHandlerProps {
	// Narrowed: este handler sólo recibe jobs de tipo COGNETICA_METABOLIZE.
	job: Extract<Job, { type: "COGNETICA_METABOLIZE" }>;
}

type EstadoVisual = "running" | "completed" | "failed";

export function CogneticaJobHandler({ job }: CogneticaJobHandlerProps) {
	const { updateJobProgress, completeJob, failJob, expandJobManager } =
		useJobManager();
	const router = useRouter();
	const pathname = usePathname();

	const [statusMessage, setStatusMessage] = useState(
		"Preparando metabolización…",
	);
	const [stepLabel, setStepLabel] = useState<string | null>(null);
	const [estadoVisual, setEstadoVisual] = useState<EstadoVisual>("running");
	// Para el dialog "Ver error" — guarda código técnico raw + traducción
	// amigable. Cuando estadoVisual cambia a "failed", `aplicarEstado` los
	// llena con la info del row de ai_job_history.
	const [verErrorAbierto, setVerErrorAbierto] = useState(false);
	const [errorTecnicoRaw, setErrorTecnicoRaw] = useState<string | null>(null);
	const [errorAmigable, setErrorAmigable] = useState<MensajeAmigable | null>(
		null,
	);

	const { jobIdBackend, artefactoId, projectId, originPath } = job.payload;
	const jobIdLocal = job.id;
	// Si el usuario está en otra ruta cuando termine el job, mostramos un
	// botón "Ir al artefacto". Lo calculamos en cada render porque pathname
	// cambia con la navegación.
	const fueraDeOrigen = Boolean(originPath) && pathname !== originPath;

	// Callbacks via ref: NO en las deps del effect (evita re-suscripciones
	// cuando el context re-crea sus useCallback al expandir/colapsar panel).
	const cbsRef = useRef({
		updateJobProgress,
		completeJob,
		failJob,
		expandJobManager,
		router,
	});
	cbsRef.current = {
		updateJobProgress,
		completeJob,
		failJob,
		expandJobManager,
		router,
	};
	// Bandera reactiva para que aplicarEstado (dentro del effect) sepa si
	// debe extender el delay para dar tiempo al usuario de clickear el botón
	// "Ir al artefacto" — sin estar en las deps del effect.
	const fueraDeOrigenRef = useRef(fueraDeOrigen);
	fueraDeOrigenRef.current = fueraDeOrigen;
	// Guard para que el cleanup terminal (mover a recientes) se ejecute
	// exactamente una vez por job. Puede dispararse desde tres lugares:
	// el setTimeout del aplicarEstado (cuando estás en origen), el useEffect
	// que escucha pathname (si navegás a origen), o el click del botón
	// "Ir al artefacto".
	const terminalCleanupAppliedRef = useRef(false);
	// Mensaje de error capturado al pasar a "failed", para usar desde el
	// click del botón (que no tiene acceso al payload del Realtime).
	const lastErrorRef = useRef<string | null>(null);

	useEffect(() => {
		const aplicarEstado = (row: Record<string, unknown>) => {
			const details = (row.details as Record<string, unknown> | null) ?? {};
			const stepName = details.step_name as StepName | null;
			const stepIndex = (details.step_index as number | null) ?? 0;
			const stepTotal = (details.step_total as number | null) ?? 0;
			const pipelineTipo = details.pipeline_tipo as CgtTipoArtefacto | null;
			const status = row.status as string;
			const progress = (row.progress as number | null) ?? 0;
			const errorMsg = (row.error_message as string | null) ?? null;

			let labelStep: string | null = null;
			if (pipelineTipo && stepName) {
				const pipeline = pipelineParaTipo(pipelineTipo);
				const def = pipeline?.find((s) => s.name === stepName) ?? null;
				labelStep = def
					? `${def.label} (${stepIndex + 1}/${stepTotal})`
					: `${stepName} (${stepIndex + 1}/${stepTotal})`;
			}

			if (status === "completed") {
				setEstadoVisual("completed");
				setStatusMessage("Metabolización completada");
				setStepLabel(labelStep);
				cbsRef.current.updateJobProgress(jobIdLocal, 100);
				// Auto-expandir para alertar al usuario distraído: si estaba
				// minimizado, ahora se abre solo. Si ya estaba abierto, no-op.
				cbsRef.current.expandJobManager();

				if (fueraDeOrigenRef.current) {
					// Fuera de la ruta origen: NO cerramos automáticamente.
					// El row queda visible hasta que el usuario clickee "Ir
					// al artefacto" o navegue a origen manualmente. Esto
					// evita que se pierda el aviso por distracción.
					return;
				}
				if (terminalCleanupAppliedRef.current) return;
				terminalCleanupAppliedRef.current = true;
				setTimeout(() => {
					cbsRef.current.completeJob(jobIdLocal);
					cbsRef.current.router.refresh();
				}, 2000);
			} else if (status === "failed") {
				const amigable = mensajeAmigableDeError(errorMsg);
				setEstadoVisual("failed");
				setStatusMessage(amigable.titulo);
				setStepLabel(labelStep);
				lastErrorRef.current = errorMsg ?? "Error desconocido";
				setErrorTecnicoRaw(errorMsg ?? null);
				setErrorAmigable(amigable);
				cbsRef.current.updateJobProgress(jobIdLocal, 100);
				cbsRef.current.expandJobManager();

				if (fueraDeOrigenRef.current) {
					// Mismo criterio que completed: no cerramos solos cuando
					// el usuario está en otra ruta.
					return;
				}
				if (terminalCleanupAppliedRef.current) return;
				terminalCleanupAppliedRef.current = true;
				setTimeout(() => {
					cbsRef.current.failJob(
						jobIdLocal,
						lastErrorRef.current ?? "Error desconocido",
					);
				}, 3000);
			} else {
				setEstadoVisual("running");
				setStepLabel(labelStep);
				setStatusMessage(
					labelStep ? `Procesando ${labelStep}` : "Procesando…",
				);
				cbsRef.current.updateJobProgress(jobIdLocal, progress);
			}
		};

		// SELECT inicial: sincronizar con el estado actual del row antes de
		// suscribirse a UPDATEs. Crítico para rehidratación tras refresh y
		// para cubrir la ventana entre que la starter creó el row y la
		// suscripción Realtime se establece (~1s).
		void (async () => {
			const { data, error } = await supabase
				.from("ai_job_history")
				.select("id, status, progress, details, error_message")
				.eq("id", jobIdBackend)
				.maybeSingle();
			if (error) {
				console.error("[CogneticaJobHandler] SELECT inicial falló:", error);
				return;
			}
			if (data) {
				console.log(
					`🧪 [CogneticaJobHandler] SELECT inicial: status=${data.status} progress=${data.progress}`,
				);
				aplicarEstado(data as Record<string, unknown>);
			}
		})();

		// Suscripción Realtime. Filtro por `project_id` (UUID — funciona);
		// `id=eq.UUID` puede cerrar el canal silenciosamente en algunos casos.
		// El callback descarta cualquier evento que no sea de este jobIdBackend.
		const channel = supabase
			.channel(`cognetica-job-${jobIdBackend}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "ai_job_history",
					filter: `project_id=eq.${projectId}`,
				},
				(payload) => {
					const row = payload.new as Record<string, unknown>;
					if (row.id !== jobIdBackend) return;
					console.log(
						`🧪 [CogneticaJobHandler] UPDATE status=${row.status} progress=${row.progress}`,
					);
					aplicarEstado(row);
				},
			)
			.subscribe((status) => {
				console.log(
					`🧪 [CogneticaJobHandler] Subscribe status: ${status} for job ${jobIdBackend.slice(0, 8)} (artefacto ${artefactoId.slice(0, 8)}, project ${projectId.slice(0, 8)})`,
				);
			});

		return () => {
			supabase.removeChannel(channel);
		};
		// Deps: SÓLO IDs estables. Los callbacks viven en cbsRef.current.
	}, [jobIdBackend, projectId, artefactoId, jobIdLocal]);

	// Cleanup terminal cuando el usuario navega DE VUELTA a la ruta origen
	// estando el job en estado terminal. Mueve el row a "recientes" con el
	// mismo delay que el flujo normal en origen.
	useEffect(() => {
		if (terminalCleanupAppliedRef.current) return;
		if (estadoVisual !== "completed" && estadoVisual !== "failed") return;
		if (fueraDeOrigen) return; // Sigue fuera, no cerrar aún.
		terminalCleanupAppliedRef.current = true;
		const delay = estadoVisual === "completed" ? 2000 : 3000;
		const handle = setTimeout(() => {
			if (estadoVisual === "completed") {
				cbsRef.current.completeJob(jobIdLocal);
				cbsRef.current.router.refresh();
			} else {
				cbsRef.current.failJob(
					jobIdLocal,
					lastErrorRef.current ?? "Error desconocido",
				);
			}
		}, delay);
		return () => clearTimeout(handle);
	}, [estadoVisual, fueraDeOrigen, jobIdLocal]);

	const getIcon = () => {
		switch (estadoVisual) {
			case "completed":
				return <CheckCircle className="h-5 w-5 text-green-600" />;
			case "failed":
				return <AlertCircle className="h-5 w-5 text-red-600" />;
			default:
				return <FlaskConical className="h-5 w-5 text-accent-pure" />;
		}
	};

	const borderColor =
		estadoVisual === "completed"
			? "border-green-500"
			: estadoVisual === "failed"
				? "border-red-500"
				: "border-accent-pure";

	const bgColor =
		estadoVisual === "completed"
			? "bg-green-50 dark:bg-green-900/20"
			: estadoVisual === "failed"
				? "bg-red-50 dark:bg-red-900/20"
				: "bg-accent-subtle";

	return (
		<div
			className={`p-4 border-l-4 ${borderColor} ${bgColor} rounded-r-md transition-colors duration-200`}>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 mt-1">{getIcon()}</div>
				<div className="flex-grow min-w-0">
					<div className="flex items-center justify-between mb-2">
						<StandardText size="sm" weight="medium" className="truncate">
							{job.title}
						</StandardText>
						{estadoVisual === "running" && (
							<StandardText size="xs" colorScheme="neutral">
								{Math.round(job.progress)}%
							</StandardText>
						)}
					</div>

					{estadoVisual === "running" && (
						<StandardProgressBar
							value={job.progress}
							max={100}
							colorScheme="accent"
							size="sm"
							className="mb-2"
						/>
					)}

					<StandardText
						size="xs"
						colorScheme={estadoVisual === "failed" ? "danger" : "neutral"}
						className="truncate">
						{statusMessage}
					</StandardText>

					{/* Acciones tras terminar: "Ver error" si falló + "Ir al
					    artefacto" si estás en otra ruta. Ambos botones se muestran
					    en línea para que el usuario decida si quiere ver el
					    detalle técnico o volver a la página del artefacto. */}
					{(estadoVisual === "completed" || estadoVisual === "failed") && (
						<div className="mt-2 flex flex-wrap gap-2">
							{estadoVisual === "failed" && (
								<StandardButton
									size="sm"
									styleType="ghost"
									colorScheme="danger"
									leftIcon={Info}
									onClick={() => setVerErrorAbierto(true)}>
									Ver error
								</StandardButton>
							)}
							{fueraDeOrigen && originPath && (
								<StandardButton
									size="sm"
									styleType="outline"
									colorScheme={
										estadoVisual === "failed" ? "danger" : "primary"
									}
									leftIcon={ArrowUpRight}
									onClick={() => {
										if (!terminalCleanupAppliedRef.current) {
											terminalCleanupAppliedRef.current = true;
											if (estadoVisual === "completed") {
												cbsRef.current.completeJob(jobIdLocal);
											} else {
												cbsRef.current.failJob(
													jobIdLocal,
													lastErrorRef.current ?? "Error desconocido",
												);
											}
										}
										// `router.push` por sí solo sirve la ruta destino
										// desde el client-side cache de Next — y esa ruta
										// puede estar cacheada con data vieja. El refresh
										// post-push, en setTimeout(0), invalida ese cache
										// para que el Server Component re-fetchee al
										// montarse.
										cbsRef.current.router.push(originPath);
										setTimeout(() => {
											cbsRef.current.router.refresh();
										}, 0);
									}}>
									Ir al artefacto
								</StandardButton>
							)}
						</div>
					)}

					<StandardText
						size="xs"
						colorScheme="neutral"
						className="mt-1 opacity-70">
						{stepLabel ? `${stepLabel} · ` : ""}
						Artefacto: {artefactoId.substring(0, 8)}… · Job:{" "}
						{jobIdBackend.substring(0, 8)}…
					</StandardText>
				</div>
			</div>

			{/* Dialog "Ver error": muestra el código técnico y el mensaje
			    amigable. Se invoca desde el botón "Ver error" cuando el
			    job termina en estado failed. El mensaje raw es útil para
			    soporte / debug — el amigable orienta al usuario. */}
			<StandardDialog
				open={verErrorAbierto}
				onOpenChange={setVerErrorAbierto}>
				<StandardDialog.Content colorScheme="danger" size="md">
					<StandardDialog.Header>
						<StandardDialog.Title>
							{errorAmigable?.titulo ?? "La metabolización falló"}
						</StandardDialog.Title>
					</StandardDialog.Header>
					<StandardDialog.Body className="space-y-4">
						<StandardText size="sm">
							{errorAmigable?.descripcion ??
								"Ocurrió un problema durante el proceso."}
						</StandardText>
						<div>
							<StandardText
								size="xs"
								colorScheme="neutral"
								weight="medium"
								className="mb-1">
								Detalle técnico
							</StandardText>
							<div className="p-3 rounded-md bg-neutral-bg/50 border border-neutral-border font-mono text-xs break-words">
								{errorTecnicoRaw ?? "Sin detalle disponible."}
							</div>
							<StandardText
								size="xs"
								colorScheme="neutral"
								className="mt-1 opacity-70">
								Job ID: {jobIdBackend} · Artefacto:{" "}
								{artefactoId}
							</StandardText>
						</div>
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardDialog.Close asChild>
							<StandardButton size="sm" colorScheme="neutral" styleType="ghost">
								Cerrar
							</StandardButton>
						</StandardDialog.Close>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
}
