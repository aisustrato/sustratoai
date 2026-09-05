//. 📍 app/personal/historial_ai/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página del historial de consumo de IA del usuario
 * Muestra el historial de trabajos de IA usando StandardTable y StandardPagination
 * Consume datos desde job-history-actions.ts usando el auth provider
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/app/providers/I18nProvider";
import { useAuth } from "@/app/auth-provider";
import { getMyRecentJobs, type JobHistoryRow } from "@/lib/actions/job-history-actions";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardPagination } from "@/components/ui/StandardPagination";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ColumnDef } from "@tanstack/react-table";
import { History, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface HistorialAIPageState {
	historial: JobHistoryRow[];
	currentPage: number;
	totalPages: number;
	totalItems: number;
	isLoading: boolean;
	error: string | null;
}
//#endregion ![def]

//#region [main] - 🎯 COMPONENT 🎯
export default function HistorialAIPage() {
	const t = useTranslations("personal.historialAi");
	const { locale } = useLocale();
	const dateFnsLocale = locale === "en" ? enUS : es;
	const { user, proyectoActual } = useAuth();

	const [state, setState] = useState<HistorialAIPageState>({
		historial: [],
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		isLoading: true,
		error: null,
	});

	// Función para cargar datos
	const cargarHistorial = useCallback(async () => {
		if (!user || !proyectoActual) {
			setState(prev => ({ ...prev, isLoading: false, error: t("errorUserOrProjectUnavailable") }));
			return;
		}

		setState(prev => ({ ...prev, isLoading: true, error: null }));

		try {
			const resultado = await getMyRecentJobs({
				projectId: proyectoActual.id,
				limit: 50
			});
			
			if (resultado.success) {
				// Simulamos paginación básica (el action no tiene paginación built-in)
				const itemsPerPage = 10;
				const totalItems = resultado.data.length;
				const totalPages = Math.ceil(totalItems / itemsPerPage);
				
				setState(prev => ({
					...prev,
					historial: resultado.data,
					totalItems,
					totalPages,
					isLoading: false,
					error: null,
				}));
			} else {
				setState(prev => ({ ...prev, isLoading: false, error: resultado.error }));
			}
		} catch (error) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : t("errorUnknown")
			}));
		}
	}, [user, proyectoActual, t]);

	// Cargar datos al montar el componente
	useEffect(() => {
		cargarHistorial();
	}, [cargarHistorial]);

	// Función para cambiar página
	const handlePageChange = useCallback((page: number) => {
		setState(prev => ({ ...prev, currentPage: page }));
	}, []);

	// Función para obtener badge de estado
	const getStatusBadge = useCallback((status: string) => {
		switch (status) {
			case "completed":
				return (
					<StandardBadge
						colorScheme="primary"
						styleType="solid"
						size="sm"
						leftIcon={CheckCircle}
					>
						{t("statusCompleted")}
					</StandardBadge>
				);
			case "running":
				return (
					<StandardBadge
						colorScheme="secondary"
						styleType="solid"
						size="sm"
						leftIcon={Clock}
					>
						{t("statusRunning")}
					</StandardBadge>
				);
			case "failed":
				return (
					<StandardBadge
						colorScheme="primary"
						styleType="outline"
						size="sm"
						leftIcon={XCircle}
					>
						{t("statusFailed")}
					</StandardBadge>
				);
			default:
				return (
					<StandardBadge
						colorScheme="secondary"
						styleType="outline"
						size="sm"
						leftIcon={AlertCircle}
					>
						{t("statusPending")}
					</StandardBadge>
				);
		}
	}, [t]);

	// Definición de columnas para la tabla
	const columns: ColumnDef<JobHistoryRow>[] = useMemo(() => [
		{
			accessorKey: "job_type",
			header: t("columnJobType"),
			cell: ({ row }) => {
				const jobType = row.getValue("job_type") as string;
				return (
					<StandardText
						size="sm"
						colorScheme="primary"
						colorShade="pure"
					>
						{jobType === "TRANSLATION" ? t("jobTypeTranslation") : jobType || "N/A"}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "description",
			header: t("columnDescription"),
			cell: ({ row }) => {
				const description = row.getValue("description") as string;
				return (
					<StandardText
						size="sm"
						colorScheme="primary"
						colorShade="pure"
					>
						{description || t("noDescription")}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "ai_model",
			header: t("columnAiModel"),
			cell: ({ row }) => {
				const model = row.getValue("ai_model") as string;
				return (
					<StandardText
						size="sm"
						colorScheme="primary"
						colorShade="pure"
					>
						{model || "N/A"}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "status",
			header: t("columnStatus"),
			cell: ({ row }) => getStatusBadge(row.getValue("status")),
		},
		{
			accessorKey: "input_tokens",
			header: t("columnInputTokens"),
			cell: ({ row }) => {
				const tokens = row.getValue("input_tokens") as number | null;
				return (
					<StandardText
						size="sm"
						colorScheme="secondary"
						colorShade="pure"
					>
						{tokens ? tokens.toLocaleString() : "N/A"}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "output_tokens",
			header: t("columnOutputTokens"),
			cell: ({ row }) => {
				const tokens = row.getValue("output_tokens") as number | null;
				return (
					<StandardText
						size="sm"
						colorScheme="secondary"
						colorShade="pure"
					>
						{tokens ? tokens.toLocaleString() : "N/A"}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "started_at",
			header: t("columnStartDate"),
			cell: ({ row }) => {
				const date = new Date(row.getValue("started_at"));
				return (
					<StandardText
						size="sm"
						colorScheme="secondary"
						colorShade="pure"
					>
						{formatDistanceToNow(date, { addSuffix: true, locale: dateFnsLocale })}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "completed_at",
			header: t("columnEndDate"),
			cell: ({ row }) => {
				const date = row.getValue("completed_at");
				if (!date) return (
					<StandardText size="sm" colorScheme="secondary" colorShade="pure">N/A</StandardText>
				);
				return (
					<StandardText
						size="sm"
						colorScheme="secondary"
						colorShade="pure"
					>
						{formatDistanceToNow(new Date(date as string), { addSuffix: true, locale: dateFnsLocale })}
					</StandardText>
				);
			},
		},
	], [t, dateFnsLocale, getStatusBadge]);

	// Datos paginados
	const paginatedData = useMemo(() => {
		const itemsPerPage = 10;
		const startIndex = (state.currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return state.historial.slice(startIndex, endIndex);
	}, [state.historial, state.currentPage]);

	// Componente de carga
	const LoadingComponent = () => (
		<div className="flex justify-center items-center py-12">
			<SustratoLoadingLogo
				size={40}
				variant="spin-pulse"
				showText={true}
				text={t("loadingHistory")}
			/>
		</div>
	);

	// Componente de error
	const ErrorComponent = ({ error }: { error: string }) => (
		<StandardEmptyState
			icon={XCircle}
			title={t("errorLoadingTitle")}
			description={error}
		/>
	);

	// Componente de estado vacío
	const EmptyComponent = () => (
		<StandardEmptyState
			icon={History}
			title={t("emptyTitle")}
			description={t("emptyDescription")}
		/>
	);

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="space-y-6">
			<StandardPageTitle
				title={t("pageTitle")}
				description={t("pageDescription")}
				mainIcon={History}
			/>

			<StandardCard
				colorScheme="primary"
				styleType="subtle"
				className="p-6"
			>
				{state.isLoading ? (
					<LoadingComponent />
				) : state.error ? (
					<ErrorComponent error={state.error} />
				) : state.historial.length === 0 ? (
					<EmptyComponent />
				) : (
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<StandardText
								size="sm"
								colorScheme="secondary"
								colorShade="pure"
							>
								{t("showingCount", { shown: paginatedData.length, total: state.totalItems })}
							</StandardText>
						</div>

						<StandardTable
							data={paginatedData}
							columns={columns}
							filterPlaceholder={t("searchPlaceholder")}
						>
							<StandardTable.Table />
						</StandardTable>

						{state.totalPages > 1 && (
							<div className="flex justify-center pt-4">
								<StandardPagination
									currentPage={state.currentPage}
									totalPages={state.totalPages}
									itemsPerPage={10}
									totalItems={state.totalItems}
									onPageChange={handlePageChange}
								/>
							</div>
						)}
					</div>
				)}
			</StandardCard>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]
