// app/datos-maestros/roles/[id]/eliminar/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { 
    eliminarRolDeProyecto,
    obtenerDetallesRolProyecto, // Para mostrar el nombre del rol en la confirmación
    type ProjectRoleRow,
    type ResultadoOperacion 
} from "@/lib/actions/proyect-role-actions";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { PageTitle } from "@/components/ui/page-title";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Text } from "@/components/ui/text";
import { CustomButton } from "@/components/ui/custom-button";
import Link from "next/link";
import { PageBackground } from "@/components/ui/page-background";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // No lo usaremos directamente, el botón de la página lo manejará
} from "@/components/ui/alert-dialog";

export default function EliminarRolPage() {
  const router = useRouter();
  const params = useParams();
  const { proyectoActual } = useAuth(); 
  
  const roleId = (params && typeof params.id === "string") ? params.id : null;

  const [rolParaEliminar, setRolParaEliminar] = useState<ProjectRoleRow | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true); // Carga inicial del nombre del rol
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de la acción de eliminar
  const [pageError, setPageError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);


  const puedeGestionarRoles = proyectoActual?.permissions?.can_manage_master_data || false;

  const cargarNombreRol = useCallback(async () => {
    if (!roleId || !proyectoActual?.id) {
      setIsPageLoading(false);
      return;
    }
    setIsPageLoading(true);
    setPageError(null);
    try {
      const resultado = await obtenerDetallesRolProyecto(roleId, proyectoActual.id);
      if (resultado.success && resultado.data) {
        setRolParaEliminar(resultado.data);
      } else {
        setPageError(resultado.success ? "Rol no encontrado." : resultado.error || "Error al cargar datos del rol.");
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsPageLoading(false);
    }
  }, [roleId, proyectoActual?.id]);

  useEffect(() => {
    if (roleId && proyectoActual?.id) {
      cargarNombreRol();
    } else {
      setIsPageLoading(false);
      if (!proyectoActual?.id) setPageError("Proyecto no activo.");
      else if (!roleId) setPageError("ID de rol no especificado.");
    }
  }, [roleId, proyectoActual, cargarNombreRol]);

  const handleConfirmarEliminacion = async () => {
    if (!roleId || !proyectoActual?.id || !rolParaEliminar) {
      sonnerToast.error("Error de Aplicación", { description: "Falta información crítica." });
      setShowConfirmDialog(false);
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    const resultado = await eliminarRolDeProyecto({ role_id: roleId, project_id: proyectoActual.id });

    if (resultado.success) {
      sonnerToast.success("Rol Eliminado", {
        description: `El rol "${rolParaEliminar.role_name}" ha sido eliminado exitosamente.`,
      });
      router.push("/datos-maestros/roles");
    } else {
      sonnerToast.error("Error al Eliminar Rol", {
        description: resultado.error || "No se pudo eliminar el rol.",
        duration: 5000, // Mostrar más tiempo si es un error importante
      });
      setPageError(resultado.error); // Mostrar el error en la página también
    }
    setIsSubmitting(false);
    setShowConfirmDialog(false);
  };


  // ------ RENDERIZADO CONDICIONAL ------
  if (isPageLoading) {
    return ( <PageBackground > <SustratoLoadingLogo size={50} showText text="Cargando..." /> </PageBackground> );
  }

  if (!proyectoActual?.id) {
    return ( <PageBackground > <StandardCard className="max-w-md text-center" styleType="subtle" hasOutline={false} accentPlacement="none"> <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <AlertTriangle className="h-6 w-6 text-warning-600" /> </div> <PageTitle title="Proyecto Requerido" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><Text>{pageError || "No hay un proyecto activo."}</Text></StandardCard.Content> <StandardCard.Footer> <Link href="/" passHref><CustomButton variant="outline">Ir a Inicio</CustomButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }
  
  if (!puedeGestionarRoles) { 
    return ( <PageBackground > <StandardCard className="max-w-md text-center" styleType="subtle" hasOutline={false} accentPlacement="none"> <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <AlertTriangle className="h-6 w-6 text-warning-600" /> </div> <PageTitle title="Acceso Denegado" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><Text>No tienes permisos para eliminar roles en este proyecto.</Text></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><CustomButton variant="outline">Volver al Listado</CustomButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }
  
  if (pageError && !rolParaEliminar) { // Error durante la carga del rol
    return ( <PageBackground > <StandardCard className="max-w-md text-center" styleType="subtle" hasOutline={false} accentPlacement="none"> <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100"> <AlertTriangle className="h-6 w-6 text-danger-600" /> </div> <PageTitle title="Error al Cargar Rol" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><Text>{pageError}</Text></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><CustomButton variant="outline">Volver al Listado</CustomButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }

  if (!rolParaEliminar) { // Rol no encontrado
    return ( <PageBackground > <StandardCard className="max-w-md text-center" styleType="subtle" hasOutline={false} accentPlacement="none"> <StandardCard.Header><PageTitle title="Rol no Encontrado" /></StandardCard.Header> <StandardCard.Content><Text>{pageError || "No se encontraron datos para el rol especificado."}</Text></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><CustomButton variant="outline">Volver al Listado</CustomButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }


  return (
    <PageBackground>
      <div className="container mx-auto py-6">
        <PageTitle
          title={`Eliminar Rol: ${rolParaEliminar.role_name}`}
          subtitle={`Confirmación para eliminar el rol del proyecto "${proyectoActual.name}"`}
          mainIcon={ShieldAlert}
          breadcrumbs={[
            { label: "Datos Maestros", href: "/datos-maestros" },
            { label: "Roles", href: "/datos-maestros/roles" },
            { label: rolParaEliminar.role_name, href: `/datos-maestros/roles/${roleId}/ver` },
            { label: "Eliminar" }
          ]}
          showBackButton={{ href: `/datos-maestros/roles/${roleId}/ver` }}
        />
        <StandardCard className="mt-6" styleType="subtle" hasOutline={false} accentPlacement="none">
          <StandardCard.Header>
            <Text variant="heading" size="lg" color="danger">
              Confirmar Eliminación
            </Text>
          </StandardCard.Header>
          <StandardCard.Content className="space-y-4">
            <Text>
              Estás a punto de eliminar el rol <Text as="span" weight="bold">{rolParaEliminar.role_name}</Text>. 
              Esta acción no se puede deshacer.
            </Text>
            <Text color="warning" colorVariant="text" className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>Asegúrate de que ningún miembro esté actualmente asignado a este rol. Si el rol está en uso, la eliminación fallará.</span>
            </Text>
            {pageError && ( // Mostrar errores de la action de eliminar aquí
              <div className="p-3 text-sm text-destructive-foreground border border-destructive bg-destructive/10 rounded-md">
                <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5"/><span>{pageError}</span></div>
              </div>
            )}
          </StandardCard.Content>
          <StandardCard.Footer className="flex justify-end gap-3">
            <CustomButton 
              variant="outline" 
              onClick={() => router.push(`/datos-maestros/roles/${roleId}/ver`)}
              disabled={isSubmitting}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              color="danger"
              onClick={() => setShowConfirmDialog(true)} // Abrir diálogo de confirmación
              loading={isSubmitting}
              leftIcon={<Trash2 className="h-4 w-4"/>}
            >
              Eliminar Rol Permanentemente
            </CustomButton>
          </StandardCard.Footer>
        </StandardCard>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el rol <Text as="span" weight="bold">{rolParaEliminar.role_name}</Text>. 
                Si hay miembros asignados a este rol, la operación fallará y deberás reasignarlos primero.
                No podrás deshacer esta acción.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmarEliminacion}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90" // Estilo del botón de confirmación destructivo
              >
                {isSubmitting ? "Eliminando..." : "Sí, eliminar rol"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </PageBackground>
  );
}