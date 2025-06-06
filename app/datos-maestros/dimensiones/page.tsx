// app/datos-maestros/dimensiones/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  listDimensions,
  deleteDimension, // <-- ASEGÚRATE QUE ESTÉ IMPORTADO
  type FullDimension,
  type DeleteDimensionPayload, // <-- Y ESTE TIPO TAMBIÉN
} from "@/lib/actions/dimension-actions";
import { PageBackground } from "@/components/ui/page-background";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { PageTitle } from "@/components/ui/page-title";
import { CustomButton } from "@/components/ui/custom-button";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { Text } from "@/components/ui/text";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { EmptyState } from "@/components/common/empty-state";
import { AlertTriangle, PlusCircle, LayoutGrid, Trash2 } from "lucide-react";
import { DimensionCard } from "./components/DimensionCard"; // Tu componente DimensionCard
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext"; // Opcional, si lo usas

export default function DimensionesPage() {
  const router = useRouter();
  const { proyectoActual, loadingProyectos } = useAuth();
  const { showLoading, hideLoading } = useLoading(); // Opcional para feedback global

  const [dimensions, setDimensions] = useState<FullDimension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // string: ID de la dimensión borrándose
  const [error, setError] = useState<string | null>(null);
  const [dialogToDelete, setDialogToDelete] = useState<{ id: string; name: string } | null>(null);

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
      const errorMsg = err instanceof Error ? err.message : "Error desconocido.";
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
  const handleEliminarDimension = (dimensionId: string, dimensionName: string) => {
    if (!proyectoActual?.id || !puedeGestionarDimensiones) {
      sonnerToast.error("Acción no permitida", { 
        description: "No tienes permisos o falta información del proyecto." 
      });
      return;
    }
    setDialogToDelete({ id: dimensionId, name: dimensionName });
  };

  const handleConfirmDelete = async () => {
    if (!dialogToDelete || !proyectoActual?.id) return; // Asegurar que proyectoActual no sea null antes de usar su id
    const nombreDimension = dialogToDelete.name; // Guardar el nombre antes de setDialogToDelete(null)
    setIsDeleting(dialogToDelete.id);
    setDialogToDelete(null);
    try {
      const payload: DeleteDimensionPayload = { 
        dimensionId: dialogToDelete.id, 
        projectId: proyectoActual.id 
      };
      const resultado = await deleteDimension(payload);
      if (resultado.success) {
        sonnerToast.success("Dimensión Eliminada", {
          description: `La dimensión "${nombreDimension}" ha sido eliminada correctamente.`,
        });
        cargarDimensiones(); // Recargar la lista para reflejar el cambio
      } else {
        sonnerToast.error("Error al Eliminar", {
          description: resultado.error || "Ocurrió un error desconocido.",
          duration: 8000, // Mostrar errores importantes por más tiempo
        });
      }
    } catch (err) {
      sonnerToast.error("Error al Eliminar", {
        description: err instanceof Error ? err.message : "Error desconocido.",
        duration: 8000,
      });
    } finally {
      setIsDeleting(null);
    }
  };
  // --- FIN FUNCIÓN ACTUALIZADA ---

  if (isLoading || (loadingProyectos && !proyectoActual?.id && !error)) { 
     return (
      <PageBackground>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text={loadingProyectos ? "Cargando datos maestros..." : "Cargando dimensiones..."} />
        </div>
      </PageBackground>
    );
  }
  
  return (
    <PageBackground>
      <div className="container mx-auto py-8">
        <PageTitle
          title="Dimensiones de Pre-clasificación"
          subtitle={proyectoActual?.name 
            ? `Define y gestiona los ejes para la clasificación de artículos en el proyecto "${proyectoActual.name}".`
            : "Selecciona un proyecto para ver o definir sus dimensiones de clasificación."
          }
          mainIcon={LayoutGrid}
          breadcrumbs={[
            { label: "Datos Maestros", href: "/datos-maestros" },
            { label: "Dimensiones" },
          ]}
        />

        {puedeGestionarDimensiones && proyectoActual?.id && (
          <div className="my-6 flex justify-end">
            <CustomButton
              onClick={handleCrearDimension}
              leftIcon={<PlusCircle className="h-5 w-5" />}
              color="primary"
              size="sm"
            >
              Nueva Dimensión
            </CustomButton>
          </div>
        )}

        {error && (
          <StandardCard
            colorScheme="danger"
            accentPlacement="left"
            accentColorScheme="danger" // Derived from colorScheme
            className="my-6 p-4"
            styleType="subtle"
            hasOutline={false} // border="left" implies no full outline
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-danger-fg" />
              <div>
                <Text weight="bold" color="danger">
                  Error al Cargar Dimensiones
                </Text>
                <Text size="sm" className="text-danger-fg/90 mt-1">
                  {error}
                </Text>
              </div>
            </div>
          </StandardCard>
        )}

        {!proyectoActual?.id && !loadingProyectos && !error && (
           <StandardCard
              className="my-6 p-6 text-center"
              styleType="subtle"
              hasOutline={false} // No border prop
              accentPlacement="none" // No border prop
           >
              <Text variant="subheading" weight="medium" className="mb-2">
               Proyecto No Seleccionado
             </Text>
             <Text color="muted">
               Por favor, selecciona un proyecto activo desde el menú superior para gestionar sus dimensiones.
             </Text>
           </StandardCard>
        )}

        {proyectoActual?.id && !isLoading && !error && dimensions.length === 0 && (
          <EmptyState
            icon={LayoutGrid}
            title="Aún no hay Dimensiones Definidas"
            description={
              puedeGestionarDimensiones
                ? "Comienza creando la primera dimensión para guiar la clasificación de artículos en tu proyecto."
                : "Este proyecto aún no tiene dimensiones de clasificación definidas. Contacta al administrador del proyecto."
            }
            action={
              puedeGestionarDimensiones ? (
                <CustomButton
                  onClick={handleCrearDimension}
                  leftIcon={<PlusCircle />}
                  color="primary"
                >
                  Crear Primera Dimensión
                </CustomButton>
              ) : undefined
            }
          />
        )}

        {proyectoActual?.id && !isLoading && !error && dimensions.length > 0 && (
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
        <CustomDialog
          open={!!dialogToDelete}
          onOpenChange={(open: boolean) => { if (!open) setDialogToDelete(null); }}
          variant="destructive"
          title="Eliminar dimensión"
          description={dialogToDelete ? `¿Estás seguro de que deseas eliminar la dimensión "${dialogToDelete.name}"? Esta acción no se puede deshacer y eliminará todas sus opciones, preguntas y ejemplos asociados (si el borrado en cascada está configurado en la base de datos).\n\nNOTA IMPORTANTE: La dimensión no se podrá eliminar si el proyecto tiene lotes de trabajo activos o en progreso.` : ""}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDialogToDelete(null)}
          isLoading={isDeleting === dialogToDelete?.id}
        />
      </div>
    </PageBackground>
  );
}