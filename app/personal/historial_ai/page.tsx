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
import { es } from "date-fns/locale";
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
			setState(prev => ({ ...prev, isLoading: false, error: "Usuario o proyecto no disponible" }));
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
				error: error instanceof Error ? error.message : "Error desconocido" 
			}));
		}
	}, [user, proyectoActual]);

	// Cargar datos al montar el componente
	useEffect(() => {
		cargarHistorial();
	}, [cargarHistorial]);

	// Función para cambiar página
	const handlePageChange = useCallback((page: number) => {
		setState(prev => ({ ...prev, currentPage: page }));
	}, []);

	// Función para obtener badge de estado
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return (
					<StandardBadge
						colorScheme="primary"
						styleType="solid"
						size="sm"
						leftIcon={CheckCircle}
					>
						Completado
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
						En proceso
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
						Fallido
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
						Pendiente
					</StandardBadge>
				);
		}
	};

	// Definición de columnas para la tabla
	const columns: ColumnDef<JobHistoryRow>[] = useMemo(() => [
		{
			accessorKey: "job_type",
			header: "Tipo de Trabajo",
			cell: ({ row }) => {
				const jobType = row.getValue("job_type") as string;
				return (
					<StandardText
						size="sm"
						colorScheme="primary"
						colorShade="pure"
					>
						{jobType === "TRANSLATION" ? "Traducción" : jobType || "N/A"}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "description",
			header: "Descripción",
			cell: ({ row }) => {
				const description = row.getValue("description") as string;
				return (
					<StandardText
						size="sm"
						colorScheme="primary"
						colorShade="pure"
					>
						{description || "Sin descripción"}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "ai_model",
			header: "Modelo IA",
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
			header: "Estado",
			cell: ({ row }) => getStatusBadge(row.getValue("status")),
		},
		{
			accessorKey: "input_tokens",
			header: "Tokens Entrada",
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
			header: "Tokens Salida",
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
			header: "Fecha Inicio",
			cell: ({ row }) => {
				const date = new Date(row.getValue("started_at"));
				return (
					<StandardText
						size="sm"
						colorScheme="secondary"
						colorShade="pure"
					>
						{formatDistanceToNow(date, { addSuffix: true, locale: es })}
					</StandardText>
				);
			},
		},
		{
			accessorKey: "completed_at",
			header: "Fecha Fin",
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
						{formatDistanceToNow(new Date(date as string), { addSuffix: true, locale: es })}
					</StandardText>
				);
			},
		},
	], []);

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
				text="Cargando historial..."
			/>
		</div>
	);

	// Componente de error
	const ErrorComponent = ({ error }: { error: string }) => (
		<StandardEmptyState
			icon={XCircle}
			title="Error al cargar el historial"
			description={error}
		/>
	);

	// Componente de estado vacío
	const EmptyComponent = () => (
		<StandardEmptyState
			icon={History}
			title="No hay historial disponible"
			description="Aún no has realizado trabajos de IA en este proyecto."
		/>
	);

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="space-y-6">
			<StandardPageTitle
				title="Historial de IA"
				description="Revisa tu consumo y historial de trabajos de inteligencia artificial"
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
								Mostrando {paginatedData.length} de {state.totalItems} trabajos
							</StandardText>
						</div>

						<StandardTable
							data={paginatedData}
							columns={columns}
							filterPlaceholder="Buscar en el historial..."
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
