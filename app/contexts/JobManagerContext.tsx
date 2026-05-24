"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";

export type JobType =
	| "TRANSLATE_BATCH"
	| "PRECLASSIFY_BATCH"
	| "RECONCILE_BATCH"
	| "COGNETICA_METABOLIZE"; // Cognética Forense — metabolización de artefacto

// 🎯 LÍMITE GLOBAL: Máximo de jobs concurrentes por usuario
const MAX_CONCURRENT_JOBS = 2;

/**
 * Payload de los jobs legacy (translate, preclassify, reconcile). Trabajan
 * sobre un `article_batch` con `batchId` como identificador.
 */
export interface JobPayloadLegacy {
	batchId: string;
	userId: string;
	projectId: string;
	articleItemId?: string;
	discrepancies?: Array<{
		article_batch_item_id: string;
		dimension_id: string;
	}>;
}

/**
 * Payload de la metabolización de cognética. La action `metabolizarArtefacto`
 * ya creó el row en `ai_job_history` (modelo fire-and-forget); el handler sólo
 * se suscribe a su id para tracking. Diferencia clave con los legacy:
 *   - No dispara la action — sólo escucha.
 *   - El identificador del trabajo es `artefactoId` (no batchId).
 *   - `jobIdBackend` es el UUID del row en `ai_job_history` para suscribirse.
 */
export interface JobPayloadCognetica {
	artefactoId: string;
	jobIdBackend: string;
	userId: string;
	projectId: string;
	/**
	 * Ruta donde el job se inició (capturada en el momento del click).
	 * Permite al handler ofrecer un "Ir al artefacto" cuando el job
	 * termina y el usuario está en otra ruta. Si está vacía o coincide
	 * con la ruta actual al completar, el botón no se muestra.
	 */
	originPath?: string;
}

interface JobBase {
	id: string;
	title: string;
	status: "queued" | "running" | "completed" | "error";
	progress: number;
	errorMessage?: string;
	completedAt?: Date;
	startedAt?: Date;
}

/**
 * `Job` es un discriminated union por `type`. Esto permite que TypeScript
 * haga narrowing automático en los handlers (`if (job.type === "X")` →
 * `job.payload` queda tipado al shape correcto).
 */
export type Job =
	| (JobBase & { type: "TRANSLATE_BATCH"; payload: JobPayloadLegacy })
	| (JobBase & { type: "PRECLASSIFY_BATCH"; payload: JobPayloadLegacy })
	| (JobBase & { type: "RECONCILE_BATCH"; payload: JobPayloadLegacy })
	| (JobBase & {
			type: "COGNETICA_METABOLIZE";
			payload: JobPayloadCognetica;
	  });

/** Extrae el identificador del trabajo para dedup, sin importar el tipo. */
function claveDedup(job: Pick<Job, "type" | "payload">): string {
	if (job.type === "COGNETICA_METABOLIZE") {
		return `cognetica:${(job.payload as JobPayloadCognetica).artefactoId}`;
	}
	return `legacy:${(job.payload as JobPayloadLegacy).batchId}`;
}

interface JobManagerContextType {
	jobs: Job[];
	recentCompletedJobs: Job[];
	isJobManagerExpanded: boolean;
	hasActiveJobs: boolean;
	toggleJobManager: () => void;
	expandJobManager: () => void;
	minimizeJobManager: () => void;
	startJob: (
		jobData: Omit<
			Job,
			| "id"
			| "status"
			| "progress"
			| "errorMessage"
			| "completedAt"
			| "startedAt"
		>,
	) => void;
	/**
	 * Agrega un job al state sin pasar por las validaciones de límite ni
	 * dedup. Pensado para **rehidratación tras refresh** (los jobs ya
	 * existen en BD y siguen corriendo) — no debe usarse para iniciar
	 * trabajos nuevos.
	 */
	rehidratarJob: (
		jobData: Omit<
			Job,
			"id" | "errorMessage" | "completedAt"
		>,
	) => void;
	updateJobProgress: (jobId: string, progress: number) => void;
	completeJob: (jobId: string) => void;
	failJob: (jobId: string, message?: string) => void;
	removeJob: (jobId: string) => void;
	// 💬 Propiedades del diálogo de límite
	limitDialogOpen: boolean;
	limitDialogData: {
		activeJobs: Job[];
		attemptedJob: { type: JobType; title: string };
	} | null;
	closeLimitDialog: () => void;
}

const JobManagerContext = createContext<JobManagerContextType | undefined>(
	undefined,
);

// Clave de localStorage para persistir la preferencia del usuario sobre
// si el panel del JobManager está expandido o minimizado.
const STORAGE_KEY_EXPANDED = "jobManager:isExpanded";

export const JobManagerProvider = ({ children }: { children: ReactNode }) => {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [recentCompletedJobs, setRecentCompletedJobs] = useState<Job[]>([]);
	// Preferencia del usuario persistida en localStorage. Default minimizado
	// para no invadir si no hay jobs. Se hidrata en un useEffect (SSR-safe).
	const [isJobManagerExpanded, setJobManagerExpanded] = useState(false);
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY_EXPANDED);
			if (stored === "true" || stored === "false") {
				setJobManagerExpanded(stored === "true");
			}
		} catch (err) {
			console.error("[JobManager] No se pudo leer preferencia de expand:", err);
		}
	}, []);
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(
				STORAGE_KEY_EXPANDED,
				String(isJobManagerExpanded),
			);
		} catch (err) {
			console.error("[JobManager] No se pudo persistir preferencia de expand:", err);
		}
	}, [isJobManagerExpanded]);

	// 💬 Estado para el diálogo de límite excedido
	const [limitDialogOpen, setLimitDialogOpen] = useState(false);
	const [limitDialogData, setLimitDialogData] = useState<{
		activeJobs: Job[];
		attemptedJob: { type: JobType; title: string };
	} | null>(null);

	// Calcular si hay trabajos activos
	const hasActiveJobs = jobs.some(
		(job) => job.status === "queued" || job.status === "running",
	);

	const toggleJobManager = () => setJobManagerExpanded((prev) => !prev);
	const expandJobManager = () => setJobManagerExpanded(true);
	const minimizeJobManager = () => setJobManagerExpanded(false);

	const startJob = useCallback(
		(
			jobData: Omit<
				Job,
				| "id"
				| "status"
				| "progress"
				| "errorMessage"
				| "completedAt"
				| "startedAt"
			>,
		) => {
			// 🚨 VALIDACIÓN DE LÍMITE: Verificar máximo de jobs concurrentes por usuario
			const activeJobs = jobs.filter(
				(job) => job.status === "queued" || job.status === "running",
			);

			if (activeJobs.length >= MAX_CONCURRENT_JOBS) {
				console.warn(
					`🚨 [JobManager] Límite de trabajos concurrentes excedido (${activeJobs.length}/${MAX_CONCURRENT_JOBS}):`,
					{
						trabajosActivos: activeJobs.map((job) => ({
							id: job.id,
							tipo: job.type,
							titulo: job.title,
						})),
						trabajoIntentado: { tipo: jobData.type, titulo: jobData.title },
					},
				);

				// 🔴 MOSTRAR DIÁLOGO AL USUARIO: Límite excedido
				setLimitDialogData({
					activeJobs: activeJobs,
					attemptedJob: { type: jobData.type, title: jobData.title },
				});
				setLimitDialogOpen(true);
				return; // No crear el trabajo
			}

			// 🛡️ VALIDACIÓN CRÍTICA: Prevenir trabajos duplicados del mismo tipo
			// y mismo objetivo (batchId para legacy, artefactoId para cognética).
			const claveNueva = claveDedup(jobData);
			const existingJob = jobs.find(
				(job) =>
					job.type === jobData.type &&
					claveDedup(job) === claveNueva &&
					(job.status === "queued" || job.status === "running"),
			);

			if (existingJob) {
				console.warn(
					`🚨 [JobManager] Trabajo duplicado detectado y rechazado:`,
					{
						tipo: jobData.type,
						clave: claveNueva,
						trabajoExistente: existingJob.id,
						estado: existingJob.status,
					},
				);
				return; // No crear trabajo duplicado
			}

			// El spread sobre un discriminated union pierde la correlación
			// type↔payload en TS; el `as Job` es seguro porque `jobData` ya
			// viene tipado (no inventamos discriminator ni payload).
			const newJob = {
				...jobData,
				id: uuidv4(),
				status: "queued" as const,
				progress: 0,
				startedAt: new Date(),
			} as Job;

			console.log(`✅ [JobManager] Iniciando nuevo trabajo:`, {
				id: newJob.id,
				tipo: newJob.type,
				clave: claveDedup(newJob),
				titulo: newJob.title,
			});

			setJobs((prevJobs) => [...prevJobs, newJob]);
			// Auto-expandir cuando se inicia un nuevo trabajo
			if (!isJobManagerExpanded) {
				expandJobManager();
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[isJobManagerExpanded, jobs],
	);

	const rehidratarJob = useCallback(
		(
			jobData: Omit<Job, "id" | "errorMessage" | "completedAt">,
		) => {
			// Si ya existe en el state con la misma clave, no agregamos.
			// Protección contra doble mount del provider en dev/StrictMode.
			const claveNueva = claveDedup(jobData);
			setJobs((prevJobs) => {
				const yaExiste = prevJobs.some(
					(j) => claveDedup(j) === claveNueva && j.type === jobData.type,
				);
				if (yaExiste) {
					return prevJobs;
				}
				const newJob = {
					...jobData,
					id: uuidv4(),
				} as Job;
				console.log(
					`♻️ [JobManager] Rehidratando job desde BD:`,
					{
						id: newJob.id,
						tipo: newJob.type,
						clave: claveNueva,
						titulo: newJob.title,
						progress: newJob.progress,
					},
				);
				return [...prevJobs, newJob];
			});
		},
		[],
	);

	const updateJobProgress = useCallback((jobId: string, progress: number) => {
		setJobs((prevJobs) =>
			prevJobs.map((job) =>
				job.id === jobId ?
					{ ...job, progress, status: progress < 100 ? "running" : job.status }
				:	job,
			),
		);
	}, []);

	const completeJob = useCallback(
		(jobId: string) => {
			setJobs((prevJobs) => {
				// Encontrar el trabajo a completar
				const jobToComplete = prevJobs.find((job) => job.id === jobId);
				if (jobToComplete) {
					const completedJob = {
						...jobToComplete,
						status: "completed" as const,
						progress: 100,
						completedAt: new Date(),
					};

					// Mover a la lista de recientes
					setRecentCompletedJobs((prev) => {
						const newRecent = [
							completedJob,
							...prev.filter((j) => j.id !== jobId),
						];
						return newRecent.slice(0, 3); // Mantener solo los últimos 3
					});
				}

				// 🎯 CRÍTICO: Remover el trabajo de la lista activa
				const updatedJobs = prevJobs.filter((job) => job.id !== jobId);

				// 🔄 AUTO-MINIMIZAR: Si no quedan trabajos activos, minimizar el JobManager
				if (updatedJobs.length === 0 && isJobManagerExpanded) {
					setTimeout(() => {
						setJobManagerExpanded(false);
					}, 500); // Pequeño delay para que el usuario vea que se completó
				}

				return updatedJobs;
			});
		},
		[isJobManagerExpanded],
	);

	const failJob = useCallback(
		(jobId: string, message?: string) => {
			setJobs((prevJobs) => {
				// Encontrar el trabajo que falló
				const jobToFail = prevJobs.find((job) => job.id === jobId);
				if (jobToFail) {
					const failedJob = {
						...jobToFail,
						status: "error" as const,
						progress: 100,
						errorMessage: message,
						completedAt: new Date(),
					};

					// Mover a la lista de recientes
					setRecentCompletedJobs((prev) => {
						const newRecent = [
							failedJob,
							...prev.filter((j) => j.id !== jobId),
						];
						return newRecent.slice(0, 3); // Mantener solo los últimos 3
					});
				}

				// 🎯 CRÍTICO: Remover el trabajo de la lista activa
				const updatedJobs = prevJobs.filter((job) => job.id !== jobId);

				// 🔄 AUTO-MINIMIZAR: Si no quedan trabajos activos, minimizar el JobManager
				if (updatedJobs.length === 0 && isJobManagerExpanded) {
					setTimeout(() => {
						setJobManagerExpanded(false);
					}, 500); // Pequeño delay para que el usuario vea que falló
				}

				return updatedJobs;
			});
		},
		[isJobManagerExpanded],
	);

	const removeJob = useCallback((jobId: string) => {
		setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
	}, []);

	// 💬 Función para cerrar el diálogo de límite
	const closeLimitDialog = useCallback(() => {
		setLimitDialogOpen(false);
		setLimitDialogData(null);
	}, []);

	return (
		<JobManagerContext.Provider
			value={{
				jobs,
				recentCompletedJobs,
				isJobManagerExpanded,
				hasActiveJobs,
				toggleJobManager,
				expandJobManager,
				minimizeJobManager,
				startJob,
				rehidratarJob,
				updateJobProgress,
				completeJob,
				failJob,
				removeJob,
				// 💬 Propiedades del diálogo de límite
				limitDialogOpen,
				limitDialogData,
				closeLimitDialog,
			}}>
			{children}
		</JobManagerContext.Provider>
	);
};

export const useJobManager = () => {
	const context = useContext(JobManagerContext);
	if (context === undefined) {
		throw new Error("useJobManager must be used within a JobManagerProvider");
	}
	return context;
};
