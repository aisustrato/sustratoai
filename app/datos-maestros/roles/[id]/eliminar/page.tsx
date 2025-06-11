//. 📍 app/datos-maestros/roles/[id]/eliminar/page.tsx
//#region [head] - 🏷️ IMPORTS 🏷️
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
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
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
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No custom types defined directly in this file. Types are imported.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧

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

//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
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
//#endregion ![sub]


//#region [render] - 🎨 RENDER SECTION 🎨
  // ------ RENDERIZADO CONDICIONAL ------
  if (isPageLoading) {
    return ( <PageBackground > <SustratoLoadingLogo size={50} showText text="Cargando..." /> </PageBackground> );
  }

  if (!proyectoActual?.id) {
    return ( <PageBackground > <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        > <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <StandardIcon colorScheme="warning" size="md"><AlertTriangle /></StandardIcon> </div> <PageTitle title="Proyecto Requerido" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><StandardText>{pageError || "No hay un proyecto activo."}</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/" passHref><StandardButton styleType="outline">Ir a Inicio</StandardButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }
  
  if (!puedeGestionarRoles) { 
    return ( <PageBackground > <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        > <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <StandardIcon colorScheme="warning" size="md"><AlertTriangle /></StandardIcon> </div> <PageTitle title="Acceso Denegado" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><StandardText>No tienes permisos para eliminar roles en este proyecto.</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><StandardButton styleType="outline">Volver al Listado</StandardButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }
  
  if (pageError && !rolParaEliminar) { // Error durante la carga del rol
    return ( <PageBackground > <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        > <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100"> <StandardIcon colorScheme="danger" size="md"><AlertTriangle /></StandardIcon> </div> <PageTitle title="Error al Cargar Rol" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><StandardText>{pageError}</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><StandardButton styleType="outline">Volver al Listado</StandardButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
  }

  if (!rolParaEliminar) { // Rol no encontrado
    return ( <PageBackground > <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        > <StandardCard.Header><PageTitle title="Rol no Encontrado" /></StandardCard.Header> <StandardCard.Content><StandardText>{pageError || "No se encontraron datos para el rol especificado."}</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><StandardButton styleType="outline">Volver al Listado</StandardButton></Link> </StandardCard.Footer> </StandardCard> </PageBackground> );
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
        <StandardCard 
          className="mt-6" 
          colorScheme="secondary" // Rule: Main action card (view-like)
          accentPlacement="top" // Rule: Main action card
          accentColorScheme="danger" // Rule: Main action card (delete context)
          shadow="md" // Rule: Main action card
          disableShadowHover={true}
          styleType="subtle"
          // styleType and hasOutline removed
        >
          <StandardCard.Header>
            <StandardText variant="heading" size="lg" colorScheme="danger">
              Confirmar Eliminación
            </StandardText>
          </StandardCard.Header>
          <StandardCard.Content className="space-y-4">
            <StandardText>
              Estás a punto de eliminar el rol <StandardText asElement="span" weight="bold">{rolParaEliminar.role_name}</StandardText>. 
              Esta acción no se puede deshacer.
            </StandardText>
            <StandardText colorScheme="warning" colorShade="text" className="flex items-start gap-2">
              <StandardIcon size="sm" colorScheme="inherit"><AlertTriangle className="mt-0.5 flex-shrink-0" /></StandardIcon>
              <span>Asegúrate de que ningún miembro esté actualmente asignado a este rol. Si el rol está en uso, la eliminación fallará.</span>
            </StandardText>
            {pageError && ( // Mostrar errores de la action de eliminar aquí
              <div className="p-3 text-sm text-destructive-foreground border border-destructive bg-destructive/10 rounded-md">
                <div className="flex items-center gap-2"><StandardIcon size="sm" colorScheme="inherit"><AlertTriangle /></StandardIcon><span>{pageError}</span></div>
              </div>
            )}
          </StandardCard.Content>
          <StandardCard.Footer className="flex justify-end gap-3">
            <StandardButton 
              styleType="outline" 
              onClick={() => router.push(`/datos-maestros/roles/${roleId}/ver`)}
              disabled={isSubmitting}
            >
              Cancelar
            </StandardButton>
            <StandardButton
              colorScheme="danger"
              onClick={() => setShowConfirmDialog(true)} // Abrir diálogo de confirmación
              loading={isSubmitting}
              leftIcon={Trash2}
            >
              Eliminar Rol Permanentemente
            </StandardButton>
          </StandardCard.Footer>
        </StandardCard>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el rol <StandardText asElement="span" weight="bold">{rolParaEliminar.role_name}</StandardText>. 
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
//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚

//#endregion ![foo]