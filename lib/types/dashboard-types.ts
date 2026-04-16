// 📍 lib/types/dashboard-types.ts
// 🎯 PROPÓSITO: Tipos para el dashboard del home
// 🔧 DECISIÓN: Tipos específicos para métricas agregadas del proyecto

//#region [types] - 🎨 TIPOS

export interface ProjectMasterData {
	members: {
		total: number;
		roles: string[];
	};
	articles: {
		total: number;
	};
	phases: {
		total: number;
		activePhase: {
			id: string;
			name: string;
			phase_number: number;
		} | null;
	};
	dimensions: {
		total: number;
		byPhase: Array<{
			phaseId: string;
			phaseName: string;
			count: number;
		}>;
	};
	batches: {
		total: number;
		active: number;
		completed: number;
	};
	preclassification: {
		totalArticlesAnalyzed: number;
		totalReviews: number;
	};
}

export interface ActivePhaseStatus {
	phase: {
		id: string;
		name: string;
		phase_number: number;
	} | null;
	hasLotes: boolean;
	articleCounts: {
		pending: number;
		translated: number;
		pending_review: number;
		reconciliation_pending: number;
		validated: number;
		reconciled: number;
		disputed: number;
	};
	batchStats: {
		total: number;
		active: number;
		completed: number;
	};
	progress: {
		total: number;
		completed: number; // validated + reconciled
		percentage: number;
	};
}

export interface UserPersonalData {
	notes: {
		total: number;
	};
	groups: {
		total: number;
		totalArticles: number;
	};
	recentJobs: Array<{
		id: string;
		job_type: string;
		status: string;
		completed_at: string | null;
		description: string;
	}>;
}

//#endregion
