//. 📍 app/datos-maestros/dimensiones/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
	listDimensions,
	deleteDimension, // <-- ASEGÚRATE QUE ESTÉ IMPORTADO
	type FullDimension,
	type DeleteDimensionPayload, // <-- Y ESTE TIPO TAMBIÉN
} from "@/lib/actions/dimension-actions";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardText } from "@/components/ui/StandardText";
import {
	StandardCard,
} from "@/components/ui/StandardCard";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { AlertTriangle, LayoutGrid, Trash2, Plus } from "lucide-react";
import { DimensionCard } from "./components/DimensionCard"; // Tu componente DimensionCard
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext"; // Opcional, si lo usas
//#endregion ![head]

// No specific types defined directly in this file, they are imported or inline.
// //#region [def] - 📦 TYPES 📦
// //#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function DimensionesPage() {
	const router = useRouter();
	const { proyectoActual, loadingProyectos } = useAuth();
	//#region [sub] - 🧰 HELPER FUNCTIONS & LOGIC 🧰
		useLoading(); // Opcional para feedback global

	const [dimensions, setDimensions] = useState<FullDimension[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState<string | null>(null); // string: ID de la dimensión borrándose
	const [error, setError] = useState<string | null>(null);
	const [dialogToDelete, setDialogToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const puedeGestionarDimensiones =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarDimensiones = useCallback(async () => {
		if (!proyectoActual?.id) {
			if (!loadingProyectos) {
				// No es un error, solo un estado sin proyecto
				// setError("No hay un proyecto seleccionado.");
			}
			setIsLoading(false);
			setDimensions([]);
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			const resultado = await listDimensions(proyectoActual.id);
			if (resultado.success) {
				setDimensions(resultado.data);
			} else {
				setError(resultado.error || "Error al cargar las dimensiones.");
				sonnerToast.error("Error al Cargar Dimensiones", {
					description: resultado.error,
				});
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : "Error desconocido.";
			setError(`Error inesperado al cargar dimensiones: ${errorMsg}`);
			sonnerToast.error("Error Inesperado", { description: errorMsg });
		} finally {
			setIsLoading(false);
		}
	}, [proyectoActual?.id, loadingProyectos]);

	useEffect(() => {
		if (proyectoActual?.id || !loadingProyectos) {
			cargarDimensiones();
		}
	}, [proyectoActual?.id, loadingProyectos, cargarDimensiones]);

	const handleCrearDimension = () => {
		router.push("/datos-maestros/dimensiones/crear");
	};

	const handleEditarDimension = (dimensionId: string) => {
		router.push(`/datos-maestros/dimensiones/${dimensionId}/modificar`);
	};

	const handleVerDimension = (dimensionId: string) => {
		router.push(`/datos-maestros/dimensiones/${dimensionId}/ver`);
	};

	// --- FUNCIÓN handleEliminarDimension ACTUALIZADA ---
	const handleEliminarDimension = (
		dimensionId: string,
		dimensionName: string
	) => {
		if (!proyectoActual?.id || !puedeGestionarDimensiones) {
			sonnerToast.error("Acción no permitida", {
				description: "No tienes permisos o falta información del proyecto.",
			});
			return;
		}
		setDialogToDelete({ id: dimensionId, name: dimensionName });
	};

	const handleConfirmDelete = async () => {
		if (!dialogToDelete || !proyectoActual?.id) return;

		const { id: dimensionId, name: dimensionName } = dialogToDelete;

		setIsDeleting(dimensionId);

		try {
			const payload: DeleteDimensionPayload = {
				dimensionId: dimensionId,
				projectId: proyectoActual.id,
			};
			const resultado = await deleteDimension(payload);

			if (resultado.success) {
				sonnerToast.success(`Dimensión "${dimensionName}" eliminada`);
        // Actualización optimista: removemos la dimensión del estado local inmediatamente.
        setDimensions((dims) => dims.filter((d) => d.id !== dimensionId));
			} else {
				sonnerToast.error("Error al eliminar", {
					description: resultado.error,
				});
			}
		} catch (error) {
			sonnerToast.error("Error inesperado", {
				description:
					error instanceof Error
						? error.message
						: "Ocurrió un error desconocido.",
			});
		} finally {
			setIsDeleting(null);
			setDialogToDelete(null);
		}
	};
	// --- FIN FUNCIÓN ACTUALIZADA ---
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	if (isLoading || (loadingProyectos && !proyectoActual?.id && !error)) {
		return (
			<div className="p-4 md:p-6 lg:p-8">
				<div
					style={{
						minHeight: "80vh",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<SustratoLoadingLogo
						showText
						text={
							loadingProyectos
								? "Cargando datos maestros..."
								: "Cargando dimensiones..."
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
				<StandardPageTitle
          title="Dimensiones"
          subtitle="Estructura de clasificación"
          description="Define las dimensiones y categorías que se usarán para analizar y clasificar los artículos del proyecto."
          mainIcon={LayoutGrid}
          actions={
            puedeGestionarDimensiones ? (
              <StandardButton
                onClick={handleCrearDimension}
                colorScheme="primary"
                leftIcon={Plus}
              >
                Crear Dimensión
              </StandardButton>
            ) : null
          }
        />

				{error && (
					<StandardCard
						// Informational error card
						colorScheme="primary" // Rule: Inner card
						accentPlacement="none" // Rule: Inner card
						hasOutline={false} // Rule: Inner card
						shadow="none" // Rule: Inner card
						disableShadowHover={true} // Rule: Inner card
						styleType="subtle"
						className="my-6"
						// styleType removed
					>
						<div className="flex items-start gap-3">
							<StandardIcon>
								<AlertTriangle className="h-5 w-5 mt-0.5 text-danger-fg" />
							</StandardIcon>
							<div>
								<StandardText weight="bold" colorScheme="danger">
									Error al Cargar Dimensiones
								</StandardText>
								<StandardText size="sm" className="text-danger-fg/90 mt-1">
									{error}
								</StandardText>
							</div>
						</div>
					</StandardCard>
				)}

				{!proyectoActual?.id && !loadingProyectos && !error && (
					<StandardCard
						// Informational 'proyecto no seleccionado' card
						colorScheme="primary" // Rule: Inner card
						accentPlacement="none" // Rule: Inner card
						hasOutline={false} // Rule: Inner card
						shadow="none" // Rule: Inner card
						disableShadowHover={true} // Rule: Inner card
						styleType="subtle"
						className="my-6 p-6 text-center"
						// styleType removed
					>
						<StandardText preset="subheading" weight="medium" className="mb-2">
							Proyecto No Seleccionado
						</StandardText>
						<StandardText colorScheme="neutral">
							Por favor, selecciona un proyecto activo desde el menú superior
							para gestionar sus dimensiones.
						</StandardText>
					</StandardCard>
				)}

				{proyectoActual?.id &&
					!isLoading &&
					!error &&
					dimensions.length === 0 && (
						<StandardEmptyState
							icon={LayoutGrid}
							title="Aún no hay Dimensiones Definidas"
							description={
								puedeGestionarDimensiones
									? "Comienza creando la primera dimensión para guiar la clasificación de artículos en tu proyecto."
									: "Este proyecto aún no tiene dimensiones de clasificación definidas. Contacta al administrador del proyecto."
							}
							action={
								puedeGestionarDimensiones ? (
									<StandardButton
										onClick={handleCrearDimension}
										colorScheme="primary"
										leftIcon={Plus}>
										Crear Primera Dimensión
									</StandardButton>
								) : undefined
							}
						/>
					)}

				{proyectoActual?.id &&
					!isLoading &&
					!error &&
					dimensions.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 my-6">
							{dimensions.map((dim) => (
								<DimensionCard
									key={dim.id}
									dimension={dim}
									onEdit={() => handleEditarDimension(dim.id)}
									onDelete={() => handleEliminarDimension(dim.id, dim.name)}
									onViewDetails={() => handleVerDimension(dim.id)}
									canManage={puedeGestionarDimensiones}
									isBeingDeleted={isDeleting === dim.id} // Pasar el estado de borrado
								/>
							))}
						</div>
					)}
				{/* Diálogo de confirmación destructiva */}
				<StandardDialog
					open={!!dialogToDelete}
					onOpenChange={(open: boolean) => {
						if (!open) setDialogToDelete(null);
					}}>
					<StandardDialog.Content colorScheme="danger" size="md">
						<StandardDialog.Header>
							<StandardDialog.Title>Eliminar dimensión</StandardDialog.Title>
						</StandardDialog.Header>
						<StandardDialog.Body>
							<StandardDialog.Description>
								{dialogToDelete
									? `¿Estás seguro de que deseas eliminar la dimensión "${dialogToDelete.name}"? Esta acción no se puede deshacer y eliminará todas sus opciones, preguntas y ejemplos asociados (si el borrado en cascada está configurado en la base de datos).\n\nNOTA IMPORTANTE: La dimensión no se podrá eliminar si el proyecto tiene lotes de trabajo activos o en progreso.`
									: ""}
							</StandardDialog.Description>
						</StandardDialog.Body>
						<StandardDialog.Footer>
							<StandardDialog.Close asChild>
								<StandardButton
									styleType="outline"
									onClick={() => setDialogToDelete(null)}>
									Cancelar
								</StandardButton>
							</StandardDialog.Close>
							<StandardButton
								colorScheme="danger"
								onClick={handleConfirmDelete}
								loading={isDeleting === dialogToDelete?.id}
								leftIcon={Trash2}>
								Eliminar
							</StandardButton>
						</StandardDialog.Footer>
					</StandardDialog.Content>
				</StandardDialog>
			</div>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar implementar drag-and-drop para reordenar dimensiones.
// Añadir paginación o carga infinita si la lista de dimensiones puede crecer mucho.
// Refinar el feedback visual durante las operaciones (ej. shimmer/esqueletos para tarjetas).
//#endregion ![todo]
