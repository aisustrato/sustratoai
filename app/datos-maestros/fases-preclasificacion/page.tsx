//. 📍 app/datos-maestros/fases-preclasificacion/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página principal de gestión de fases de preclasificación
 * Permite ver, agregar, editar y eliminar fases del proyecto actual
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { getPhasesForProject } from "@/lib/actions/preclassification_phases_actions";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import {
	Layers,
	Plus,
	AlertCircle,
	Trash2,
	Edit,
	Eye,
	RotateCw,
	Network,
} from "lucide-react";
import { toast } from "sonner";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import type { ColumnDef } from "@tanstack/react-table";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface PreclassificationPhase {
	id: string;
	name: string;
	description: string | null;
	phase_number: number;
	project_id: string;
	status: "active" | "inactive" | "completed" | "annulled";
	created_at: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function FasesPreclasificacionPage() {
	const router = useRouter();
	const { proyectoActual } = useAuth();

	const [fases, setFases] = useState<PreclassificationPhase[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const puedeGestionarFases =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarFases = useCallback(async () => {
		if (!proyectoActual?.id) return;

		setIsLoading(true);
		setError(null);

		try {
			const { data, error } = await getPhasesForProject(proyectoActual.id);

			if (error) {
				throw new Error(error.message || "Error al cargar las fases");
			}

			setFases(data || []);
		} catch (err) {
			console.error("Error cargando fases:", err);
			const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar las fases";
			toast.error("Error al cargar", {
				description: errorMessage,
				icon: <AlertCircle className="h-5 w-5 text-destructive" />
			});
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [proyectoActual?.id]);

	useEffect(() => {
		cargarFases();
	}, [cargarFases]);

	// Columnas para la tabla
	const columnas: ColumnDef<PreclassificationPhase>[] = [
		{
			accessorKey: "name",
			header: "Nombre",
			size: 250, // Ancho fijo para la columna de nombre
			cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
		},
		{
			accessorKey: "description",
			header: "Descripción",
			size: 300, // Ancho fijo para la columna de descripción
			cell: ({ row }) => <div className="truncate">{row.original.description || "-"}</div>,
			meta: { isTruncatable: true }, // Habilita el tooltip en hover
		},
		{
			accessorKey: "status",
			header: "Estado",
			size: 120, // Ancho fijo para la columna de estado
			cell: ({ row }) => {
				const estado = row.original.status;
				// Mapeamos los estados a los valores válidos de ColorSchemeVariant
				const variant =
					estado === "active"
						? "success"
						: estado === "completed"
						? "secondary"
						: estado === "annulled"
						? "danger"
						: "neutral";

				return (
					<div className="flex justify-center">
						<StandardBadge colorScheme={variant} styleType="solid">
							{estado === "active"
								? "Activo"
								: estado === "completed"
								? "Completado"
								: estado === "annulled"
								? "Anulado"
								: "Inactivo"}
						</StandardBadge>
					</div>
				);
			},
		},
		{
			id: "acciones",
			header: "Acciones",
			size: 180, // Ancho fijo en píxeles
			cell: ({ row }) => (
									<div className="flex justify-center space-x-1">
										{/* Botón Ver - Siempre visible */}
										<StandardButton
											styleType="outline"
											colorScheme="primary"
											size="sm"
											iconOnly={true}
											onClick={() =>
												router.push(
													`/datos-maestros/fases-preclasificacion/${row.original.id}/ver`
												)
											}
											tooltip="Ver detalles"
											leftIcon={Eye}
											aria-label="Ver detalles de la fase"
										/>

										{/* Botones de edición y eliminación - Solo con permisos */}
										{puedeGestionarFases && (
											<>
												<StandardButton
													styleType="outline"
													colorScheme="primary"
													size="sm"
													iconOnly={true}
													onClick={() =>
														router.push(
															`/datos-maestros/fases-preclasificacion/${row.original.id}/editar`
														)
													}
													tooltip="Editar fase"
													leftIcon={Edit}
													aria-label="Editar fase"
												/>

												<StandardButton
													styleType="outline"
													colorScheme="danger"
													size="sm"
													iconOnly={true}
													onClick={() =>
														router.push(
															`/datos-maestros/fases-preclasificacion/${row.original.id}/eliminar`
														)
													}
													tooltip="Eliminar fase"
													leftIcon={Trash2}
													aria-label="Eliminar fase"
												/>
											</>
										)}
									</div>
			),
		},
	];

	// Mostrar mensaje de permisos limitados en la interfaz
	const mensajePermisos = !puedeGestionarFases && (
		<div className="mb-4">
			<StandardCard className="bg-primary/10 border-primary/20">
				<div className="flex items-center gap-3 p-3">
					<AlertCircle className="h-5 w-5 text-primary" />
					<StandardText className="text-sm text-primary">
						Tienes acceso de solo lectura a las fases de preclasificación.
					</StandardText>
				</div>
			</StandardCard>
		</div>
	);

	// Mostrar loading
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<SustratoLoadingLogo size={48} />
			</div>
		);
	}

	// Mostrar error
	if (error) {
		return (
			<StandardPageBackground>
				<StandardCard className="max-w-4xl mx-auto mt-8">
					<div className="flex flex-col items-center justify-center p-8 text-center">
						<StandardIcon className="text-destructive mb-4">
							<AlertCircle size={24} />
						</StandardIcon>
						<StandardText variant="h3" className="mb-2">
							Error al cargar las fases
						</StandardText>
						<StandardText className="text-muted-foreground mb-6">
							{error}
						</StandardText>
						<StandardButton
							onClick={cargarFases}
							leftIcon={RotateCw}
							aria-label="Reintentar carga">
							Reintentar
						</StandardButton>
					</div>
				</StandardCard>
			</StandardPageBackground>
		);
	}

	return (
		<StandardPageBackground variant="gradient">
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<StandardPageTitle
						title="Fases de Preclasificación"
						subtitle="Gestión de las fases del proceso de preclasificación"
						description="Crea y gestiona las fases para organizar el proceso de preclasificación de documentos en tu proyecto."
						mainIcon={Network}
						showBackButton={{ href: "/datos-maestros" }}
						breadcrumbs={[
							{ label: "Datos Maestros", href: "/datos-maestros" },
							{ label: "Fases de Preclasificación" },
						]}
						actions={
							puedeGestionarFases ? (
								<StandardButton
									onClick={() => router.push("/datos-maestros/fases-preclasificacion/nuevo/crear")}
									colorScheme="primary"
									leftIcon={Plus}
								>
									Nueva Fase
								</StandardButton>
							) : undefined
						}
					/>



					{/* Mensaje de permisos limitados */}
					{mensajePermisos}

					{/* Tabla de fases */}
					<StandardCard>
						{fases.length > 0 ? (
							<StandardTable<PreclassificationPhase>
								data={fases}
								columns={columnas}
								filterPlaceholder="Buscar fases...">
								<StandardTable.Table />
							</StandardTable>
						) : (
							<div className="p-8 text-center">
								<StandardEmptyState
									title="No hay fases"
									description="Aún no se han creado fases de preclasificación para este proyecto."
									icon={Layers}
									action={
										<StandardButton
											onClick={() =>
												router.push(
													"/datos-maestros/fases-preclasificacion/nuevo/crear"
												)
											}
											leftIcon={Plus}
											aria-label="Crear primera fase">
											Crear Primera Fase
										</StandardButton>
									}
								/>
							</div>
						)}
					</StandardCard>
				</div>
			</div>
		</StandardPageBackground>
	);
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion [foo]
