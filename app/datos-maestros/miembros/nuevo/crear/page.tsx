//. 📍 app/datos-maestros/miembros/nuevo/crear/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // Solo useRouter, no useParams
import { useAuth } from "@/app/auth-provider";
import {
  obtenerRolesDisponiblesProyecto,
  agregarMiembroAProyecto, // Server Action para agregar
  type ProjectRoleInfo,
  type ResultadoOperacion, // Para tipar el resultado de la acción
} from "@/lib/actions/member-actions";
import { StandardButton } from "@/components/ui/StandardButton";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ArrowLeft, UserPlus } from "lucide-react"; // Icono para agregar
import { StandardIcon } from "@/components/ui/StandardIcon";
import {
  MiembroForm,
  type MiembroFormValues,
} from "@/app/datos-maestros/miembros/components/MiembroForm";
import type { SelectOption } from "@/components/ui/select-custom";
import { toast } from "sonner"; // Para notificaciones
import { useLoading } from "@/contexts/LoadingContext"; // Opcional, para loading global
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
//> 📝 No custom types or schemas defined outside the component for this page.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function CrearMiembroPage() {
  //#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
  const router = useRouter();
  const { proyectoActual } = useAuth();
  const { showLoading, hideLoading, isLoading: isGlobalLoading } = useLoading(); // Opcional

  const [isPageLoading, setIsPageLoading] = useState(true); // Para la carga inicial de roles
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el estado de envío del formulario
  const [rolesDisponibles, setRolesDisponibles] = useState<SelectOption[]>([]);
  const [errorPage, setErrorPage] = useState<string | null>(null); // Errores de carga de página

  // Cargar roles disponibles
  const cargarRoles = useCallback(async () => {
    setIsPageLoading(true);
    setErrorPage(null);
    setRolesDisponibles([]);

    if (!proyectoActual?.id) {
      setErrorPage("No hay un proyecto seleccionado para agregar el miembro.");
      setIsPageLoading(false);
      return;
    }

    try {
      const resultadoRoles = await obtenerRolesDisponiblesProyecto(
        proyectoActual.id
      );
      if (resultadoRoles.success && resultadoRoles.data) {
        const opcionesRoles = resultadoRoles.data.map(
          (rol: ProjectRoleInfo) => ({
            value: rol.id,
            label: rol.role_name,
          })
        );
        setRolesDisponibles(opcionesRoles);
      } else {
        setErrorPage(
         "Error al cargar los roles disponibles."
        );
      }
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setErrorPage(
        `Error inesperado al cargar roles: ${(err as Error).message}`
      );
    } finally {
      setIsPageLoading(false);
    }
  }, [proyectoActual?.id]);

  useEffect(() => {
    if (proyectoActual?.id) {
      cargarRoles();
    } else {
      // Si no hay proyecto, no podemos cargar roles ni crear miembro.
      setErrorPage("Seleccione un proyecto para continuar.");
      setIsPageLoading(false); // Asegura que no se quede cargando indefinidamente
    }
  }, [proyectoActual?.id, cargarRoles]);

  const handleFormSubmit = async (data: MiembroFormValues) => {
    if (!proyectoActual?.id) {
      toast.error("Error de aplicación", {
        description: "No hay un proyecto activo seleccionado.",
      });
      return;
    }

    setIsSubmitting(true);
    if (typeof showLoading === 'function') showLoading("Agregando miembro..."); // Opcional: si usas useLoading

    const payload = {
      proyectoId: proyectoActual.id,
      emailUsuarioNuevo: data.emailUsuario,
      rolIdAsignar: data.rolId,
      datosPerfilInicial: { // Mapear los campos opcionales del formulario
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        public_display_name: data.displayName || null,
        primary_institution: data.institution || null,
        contact_phone: data.phone || null,
        general_notes: data.notes || null,
        preferred_language: data.language || null,
        pronouns: data.pronouns || null,
      },
    };

    let resultado: ResultadoOperacion<{ project_member_id: string; profile_action: string; }> | null = null;

    try {
      resultado = await agregarMiembroAProyecto(payload);
    } catch (err) {
      console.error("Excepción al llamar a agregarMiembroAProyecto:", err);
      if (typeof hideLoading === 'function') hideLoading();
      setIsSubmitting(false);
      toast.error("Error Inesperado en Comunicación", {
        description: `Ocurrió un error al procesar la solicitud: ${(err as Error).message}`,
      });
      return;
    }


    if (typeof hideLoading === 'function') hideLoading(); // Opcional

    if (resultado?.success) {
      toast.success("Miembro Agregado", {
        description: `El miembro ${data.emailUsuario} ha sido agregado exitosamente. Perfil: ${resultado.data.profile_action}.`,
        duration: 4000,
      });
      // Retrasar la redirección para que el toast sea visible
      setTimeout(() => {
        router.push("/datos-maestros/miembros");
      }, 1500); 
    } else {
      toast.error("Error al Agregar Miembro", {
        description: resultado?.error || "Ocurrió un error desconocido.",
      });
    }
    setIsSubmitting(false);
  };

  const handleVolver = () => {
    router.push("/datos-maestros/miembros");
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  if (isPageLoading) {
    return (
      <div className="flex justify-center py-8">
        <SustratoLoadingLogo
          size={50}
          variant="spin-pulse"
          showText
          text="Cargando configuración..."
        />
      </div>
    );
  }

  if (errorPage && rolesDisponibles.length === 0) { // Si hay un error que impidió cargar roles
    return (
      <PageBackground>
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <PageHeader
              title="Error de Configuración"
              description={errorPage}
              actions={
                <StandardButton
                  onClick={handleVolver}
                  
                  styleType="outline"
                >
                  <StandardIcon><ArrowLeft /></StandardIcon>
                  Volver a Miembros
                </StandardButton>
              }
            />
          </div>
        </div>
      </PageBackground>
    );
  }
  
  // Si llegamos aquí, rolesDisponibles debería tener datos (o estar vacío si la carga falló pero no fue crítico)
  // y no hay errorPage bloqueante.

  return (
    <PageBackground>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <PageTitle 
            title="Agregar Nuevo Miembro"
            subtitle="Complete la información para invitar y asignar un rol a un nuevo miembro en el proyecto"
            mainIcon={UserPlus}
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Miembros ", href: "/datos-maestros/miembros" },
              { label: "Crear Miembro" }
            ]}
            showBackButton={{ href: "/datos-maestros/miembros" }}
         />

         <StandardCard
            disableShadowHover={true}
            styleType="subtle"
            colorScheme="secondary" // Rule: Main form card colorScheme is secondary
            accentPlacement="top" // Rule: Main form card accentPlacement is top
            accentColorScheme="primary" // Rule: Main form card accent for create/edit is primary
            shadow="md" // Rule: Main form card shadow is md by default
            // styleType and hasOutline removed
          >
          <MiembroForm
            modo="crear"
            // valoresIniciales se omite o es {} por defecto en MiembroForm para "crear"
            rolesDisponibles={rolesDisponibles}
            onSubmit={handleFormSubmit}
            loading={isSubmitting} // Pasar el estado de submitting al formulario
          />
          </StandardCard>

        </div>
      </div>
    </PageBackground>
  );
}
//#endregion ![render]
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the component declaration. No other exports.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Consider adding more specific error handling or feedback based on `resultado.data.profile_action` if needed.
// TODO: Review if the `useLoading` context (showLoading/hideLoading) is consistently used and necessary, or if local `isSubmitting` is sufficient.
// TODO: Ensure all text, especially toasts and error messages, are suitable for internationalization if the app requires it.
//#endregion ![todo]