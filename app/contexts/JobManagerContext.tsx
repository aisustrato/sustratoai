"use client";

import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";

export type JobType =
	| "TRANSLATE_BATCH"
	| "PRECLASSIFY_BATCH"
	| "RECONCILE_BATCH"; // Can be extended with other job types

// 🎯 LÍMITE GLOBAL: Máximo de jobs concurrentes por usuario
const MAX_CONCURRENT_JOBS = 2;

export interface Job {
	id: string;
	type: JobType;
	title: string;
	status: "queued" | "running" | "completed" | "error";
	progress: number;
	payload: {
		batchId: string;
		userId: string;
		projectId: string;
		articleItemId?: string; // 🆕 Para reprocesamiento de artículo individual
		discrepancies?: Array<{
			article_batch_item_id: string;
			dimension_id: string;
		}>;
	};
	errorMessage?: string;
	completedAt?: Date;
	startedAt?: Date;
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

export const JobManagerProvider = ({ children }: { children: ReactNode }) => {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [recentCompletedJobs, setRecentCompletedJobs] = useState<Job[]>([]);
	const [isJobManagerExpanded, setJobManagerExpanded] = useState(false);

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

			// 🛡️ VALIDACIÓN CRÍTICA: Prevenir trabajos duplicados del mismo tipo y lote
			const existingJob = jobs.find(
				(job) =>
					job.type === jobData.type &&
					job.payload.batchId === jobData.payload.batchId &&
					(job.status === "queued" || job.status === "running"),
			);

			if (existingJob) {
				console.warn(
					`🚨 [JobManager] Trabajo duplicado detectado y rechazado:`,
					{
						tipo: jobData.type,
						lote: jobData.payload.batchId,
						trabajoExistente: existingJob.id,
						estado: existingJob.status,
					},
				);
				return; // No crear trabajo duplicado
			}

			const newJob: Job = {
				id: uuidv4(),
				...jobData,
				status: "queued",
				progress: 0,
				startedAt: new Date(),
			};

			console.log(`✅ [JobManager] Iniciando nuevo trabajo:`, {
				id: newJob.id,
				tipo: newJob.type,
				lote: newJob.payload.batchId,
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
