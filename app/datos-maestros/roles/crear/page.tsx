//. 📍 app/datos-maestros/roles/crear/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect } from "react"; // useCallback no es necesario aquí
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { RolForm, type RolFormValues } from "../components/RolForm";
import { agregarRolAProyecto } from "@/lib/actions/proyect-role-actions";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { PageTitle } from "@/components/ui/page-title";
import { ShieldPlus, AlertTriangle, ArrowLeft, User } from "lucide-react"; // Añadido ArrowLeft
import { toast as sonnerToast } from "sonner";
import { Text } from "@/components/ui/text";
import { CustomButton } from "@/components/ui/custom-button";
import Link from "next/link";
import { PageBackground } from "@/components/ui/page-background";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo"; // Para estado de carga opcional
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types or interfaces defined directly in this file.
// RolFormValues is imported. State types are inline.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function CrearRolPage() {
  const router = useRouter();
  const { proyectoActual } = useAuth(); // Obtener solo proyectoActual
  //#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null); // Para errores de página, como no tener proyecto

  // Estado de carga inicial para la página, por si hay verificaciones asíncronas antes de mostrar el form
  const [isPageLoading, setIsPageLoading] = useState(true); 

  const puedeGestionarRoles = proyectoActual?.permissions?.can_manage_master_data || false;

  useEffect(() => {
    // Simular una comprobación o carga inicial si fuera necesario
    // Por ahora, solo verificamos si hay un proyecto actual.
    if (!proyectoActual?.id) {
      setPageError("No hay un proyecto seleccionado para agregar el rol. Por favor, selecciona un proyecto activo.");
    }
    setIsPageLoading(false); // Terminar la carga de la página
  }, [proyectoActual]);


  const handleCrearRol = async (data: RolFormValues) => {
    if (!proyectoActual?.id) {
      sonnerToast.error("Error de Proyecto", {
        description: "No se ha seleccionado un proyecto válido para agregar el rol.",
      });
      setPageError("No hay un proyecto seleccionado."); // Actualizar error de página también
      return;
    }

    setIsSubmitting(true);
    setPageError(null); // Limpiar errores de página al intentar enviar

    const payload = {
      project_id: proyectoActual.id,
      role_name: data.role_name,
      role_description: data.role_description,
      can_manage_master_data: data.can_manage_master_data,
      can_create_batches: data.can_create_batches,
      can_upload_files: data.can_upload_files,
      can_bulk_edit_master_data: data.can_bulk_edit_master_data,
    };

    const resultado = await agregarRolAProyecto(payload);

    if (resultado.success) {
      sonnerToast.success("Rol Creado", {
        description: `El rol "${resultado.data.role_name}" ha sido agregado exitosamente al proyecto.`,
      });
      router.push("/datos-maestros/roles");
    } else {
      console.error("Error al crear el rol:", resultado.error);
      sonnerToast.error("Error al Crear Rol", {
        description: resultado.error || "No se pudo agregar el rol. Inténtalo de nuevo.",
      });
      // Si el error es por nombre duplicado, por ejemplo, podrías querer pasarlo al form
      // setError("role_name", { type: "server", message: resultado.error }); // Ejemplo
      setPageError(resultado.error); // Mostrar error a nivel de página
    }
    setIsSubmitting(false);
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  //#region [render_sub] - LOADING STATE ⏳
  if (isPageLoading) {
    return (
      <PageBackground >
        <SustratoLoadingLogo size={50} showText text="Cargando configuración..." />
      </PageBackground>
    );
  }
  //#endregion [render_sub]

  //#region [render_sub] - NO PROJECT ERROR STATE 🤚
  if (pageError && !proyectoActual?.id) { // Si el error es por no tener proyecto
    return (
      <PageBackground >
        <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card for info/error block
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        >
          <StandardCard.Header>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
              <AlertTriangle className="h-6 w-6 text-warning-600" aria-hidden="true" />
            </div>
            <PageTitle title="Proyecto Requerido" className="mt-4" />
          </StandardCard.Header>
          <StandardCard.Content>
            <Text>{pageError}</Text>
          </StandardCard.Content>
          <StandardCard.Footer>
            <Link href="/" passHref> {/* O a la página de selección de proyectos */}
              <CustomButton variant="outline">Ir a Inicio</CustomButton>
            </Link>
          </StandardCard.Footer>
        </StandardCard>
      </PageBackground>
    );
  }
  //#endregion [render_sub]
  
  //#region [render_sub] - ACCESS DENIED STATE 🚫
  if (!puedeGestionarRoles && proyectoActual?.id) { // Si hay proyecto pero no permisos
    return (
      <PageBackground >
        <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card for info/error block
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        >
          <StandardCard.Header>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
              <AlertTriangle className="h-6 w-6 text-warning-600" aria-hidden="true" />
            </div>
            <PageTitle title="Acceso Denegado" className="mt-4" />
          </StandardCard.Header>
          <StandardCard.Content>
            <Text>
              No tienes los permisos necesarios para crear nuevos roles en este proyecto.
            </Text>
          </StandardCard.Content>
          <StandardCard.Footer>
            <Link href="/datos-maestros/roles" passHref>
              <CustomButton variant="outline">Volver al Listado de Roles</CustomButton>
            </Link>
          </StandardCard.Footer>
        </StandardCard>
      </PageBackground>
    );
  }
  //#endregion [render_sub]

  //#region [render_sub] - MAIN FORM DISPLAY 📝
  return (
    <PageBackground>
      <div className="container mx-auto py-6">
        
          <PageTitle
  title="Agregar Nuevo Rol al Proyecto"
  subtitle={`Define un nuevo conjunto de permisos para el proyecto "${proyectoActual?.name || "..."}"`}
  mainIcon={ShieldPlus}
  breadcrumbs={[
    { label: "Datos Maestros", href: "/datos-maestros" },
    { label: "Roles", href: "/datos-maestros/roles" },
    { label: "Crear Rol" }
  ]}
  showBackButton={{ href: "/datos-maestros/roles" }}
/>
            <StandardCard
              colorScheme="secondary" // Rule: Main form card colorScheme is secondary
              accentPlacement="top" // Rule: Main form card accentPlacement is top
              accentColorScheme="primary" // Rule: Main form card accent for create/edit is primary
              shadow="md" // Rule: Main form card shadow is md by default
              disableShadowHover={true}
              styleType="subtle"
              // styleType and hasOutline removed
            >

          <StandardCard.Content>
            {pageError && proyectoActual?.id && ( // Mostrar error de envío si hay proyecto
              <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive-foreground">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5"/>
                  <span>{pageError}</span>
                </div>
              </div>
            )}
            <RolForm
              modo="crear"
              onSubmit={handleCrearRol}
              loading={isSubmitting}
            />
          </StandardCard.Content>
        </StandardCard>
      </div>
    </PageBackground>
  );
  //#endregion [render_sub]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar si el re-route después de crear un rol debería ser a la página de edición del rol recién creado.
// Mejorar el manejo de errores específicos del formulario (ej. pasar `setError` de react-hook-form).
//#endregion ![todo]