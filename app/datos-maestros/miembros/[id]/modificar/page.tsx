// app/datos-maestros/miembros/[id]/modificar/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  obtenerDetallesMiembroProyecto,
  obtenerRolesDisponiblesProyecto,
  modificarDetallesMiembroEnProyecto,
  ProjectMemberDetails,
  ProjectRoleInfo,
  ResultadoOperacion,
  MemberProfileData,
} from "@/lib/actions/member-actions";
import { CustomButton } from "@/components/ui/custom-button";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { MiembroForm, MiembroFormValues } from "@/app/datos-maestros/miembros/components/MiembroForm";
import { toast } from "sonner";
import { ArrowLeft, User } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";

interface RolOption {
  value: string;
  label: string;
}

export default function ModificarMiembroPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id ? String(params.id) : "";
  const { proyectoActual } = useAuth();
  const { showLoading, hideLoading, isLoading: isGlobalLoading } = useLoading();

  const [isButtonSubmitting, setIsButtonSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [miembro, setMiembro] = useState<ProjectMemberDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    console.log("[Page] cargarDatos: Iniciando carga de datos de página...");
    setIsPageLoading(true);
    setError(null);
    setMiembro(null);

    if (!proyectoActual?.id) {
      console.log("[Page] cargarDatos: No hay proyecto actual ID.");
      setError("No hay un proyecto activo seleccionado. Por favor, seleccione uno.");
      setIsPageLoading(false);
      return;
    }
    if (!memberId) {
      console.log("[Page] cargarDatos: No hay memberId.");
      setError("ID de miembro no especificado en la URL.");
      setIsPageLoading(false);
      return;
    }

    try {
      console.log(`[Page] cargarDatos: Cargando roles para proyecto ID: ${proyectoActual.id}`);
      const resultadoRoles = await obtenerRolesDisponiblesProyecto(proyectoActual.id);
      if (!resultadoRoles.success) {
        console.error("[Page] cargarDatos: Error al cargar roles:", resultadoRoles.error);
        setError(resultadoRoles.error || "Error al cargar los roles disponibles.");
        setIsPageLoading(false);
        return;
      }
      const opcionesRoles = resultadoRoles.data.map((rol: ProjectRoleInfo) => ({
        value: rol.id,
        label: rol.role_name,
      }));
      setRoles(opcionesRoles);
      console.log("[Page] cargarDatos: Roles cargados:", opcionesRoles.length);

      console.log(`[Page] cargarDatos: Cargando detalles para miembro ID: ${memberId} en proyecto ID: ${proyectoActual.id}`);
      const resultadoMiembro = await obtenerDetallesMiembroProyecto(memberId, proyectoActual.id);
      if (!resultadoMiembro.success) {
        console.error("[Page] cargarDatos: Error al cargar datos del miembro:", resultadoMiembro.error);
        setError(resultadoMiembro.error || "Error al cargar la información del miembro.");
        setIsPageLoading(false);
        return;
      }
      if (!resultadoMiembro.data) {
        console.warn("[Page] cargarDatos: No se encontraron datos para el miembro.");
        setError("El miembro especificado no fue encontrado.");
        setIsPageLoading(false);
        return;
      }
      setMiembro(resultadoMiembro.data);
      console.log("[Page] cargarDatos: Datos del miembro cargados.");
    } catch (err) {
      console.error("[Page] cargarDatos: Excepción:", err);
      setError(`Error inesperado al cargar datos: ${(err as Error).message}`);
    } finally {
      console.log("[Page] cargarDatos: Finalizando, setIsPageLoading(false)");
      setIsPageLoading(false);
    }
  }, [proyectoActual?.id, memberId]);

  useEffect(() => {
    console.log("[Page] useEffect principal. proyectoActual?.id:", proyectoActual?.id, "memberId:", memberId);
    if (proyectoActual?.id && memberId) {
      cargarDatos();
    } else if (!proyectoActual?.id && !isPageLoading) {
      setError("Esperando selección de proyecto activo...");
    } else if (!memberId && proyectoActual?.id && !isPageLoading) {
      setError("ID de miembro no especificado.");
    }
  }, [proyectoActual?.id, memberId, cargarDatos]);

  const onSubmit = async (data: MiembroFormValues) => {
    console.log('[Page] onSubmit - Datos del formulario:', data);
    if (!proyectoActual?.id || !memberId || !miembro) {
      toast.error("Error de Aplicación: Faltan datos esenciales.");
      return;
    }

    const profileUpdates: Partial<Omit<MemberProfileData, "user_id" | "public_contact_email">> = {};
    if (data.firstName !== (miembro.profile?.first_name || "")) profileUpdates.first_name = data.firstName;
    if (data.lastName !== (miembro.profile?.last_name || "")) profileUpdates.last_name = data.lastName;
    if (data.displayName !== (miembro.profile?.public_display_name || "")) profileUpdates.public_display_name = data.displayName;
    if (data.institution !== (miembro.profile?.primary_institution || "")) profileUpdates.primary_institution = data.institution;
    if (data.phone !== (miembro.profile?.contact_phone || "")) profileUpdates.contact_phone = data.phone;
    if (data.notes !== (miembro.profile?.general_notes || "")) profileUpdates.general_notes = data.notes;
    if (data.language !== (miembro.profile?.preferred_language || "")) profileUpdates.preferred_language = data.language;
    if (data.pronouns !== (miembro.profile?.pronouns || "")) profileUpdates.pronouns = data.pronouns;

    const memberUpdatesForAction: Parameters<typeof modificarDetallesMiembroEnProyecto>[0]['memberUpdates'] = {};
    if (data.rolId && data.rolId !== miembro.project_role_id) {
      memberUpdatesForAction.nuevoRolId = data.rolId;
    }

    if (Object.keys(profileUpdates).length === 0 && Object.keys(memberUpdatesForAction).length === 0) {
      console.log("[Page] onSubmit: No se detectaron cambios.");
      toast("Sin Cambios", { description: "No se detectaron modificaciones." });
      return;
    }

    setIsButtonSubmitting(true);
    showLoading("Actualizando información del miembro...");

    const payloadFinal: Parameters<typeof modificarDetallesMiembroEnProyecto>[0] = {
      proyectoId: proyectoActual.id,
      projectMemberId: memberId,
    };
    if (Object.keys(profileUpdates).length > 0) payloadFinal.profileUpdates = profileUpdates;
    if (Object.keys(memberUpdatesForAction).length > 0) payloadFinal.memberUpdates = memberUpdatesForAction;

    let resultado: ResultadoOperacion<null> | null = null;

    try {
      console.log('[Page] onSubmit: Enviando actualización con payload:', JSON.stringify(payloadFinal, null, 2));
      resultado = await modificarDetallesMiembroEnProyecto(payloadFinal);
      console.log('[Page] onSubmit: Resultado de modificarDetallesMiembroEnProyecto:', resultado);
    } catch (err) {
      console.error("[Page] onSubmit: Excepción al llamar a la Server Action:", err);
      hideLoading();
      setIsButtonSubmitting(false);
      toast.error("Error Inesperado en Comunicación", {
        description: `Ocurrió un error al procesar la solicitud: ${(err as Error).message}`,
      });
      return;
    }

    if (resultado?.success) {
      hideLoading();
      const toastDuration = 3000; // El toast se mostrará por 3 segundos
      toast.success("Miembro Actualizado", {
        description: "La información del miembro ha sido actualizada exitosamente.",
        duration: toastDuration,
      });

      // CAMBIO: Reducir el delay para la redirección
      const redirectDelay = 1500; // Redirigir después de 1.5 segundos

      console.log(`[Page] onSubmit: Toast de éxito mostrado. Redirección programada en ${redirectDelay}ms.`);
      setTimeout(() => {
        try {
          console.log("[Page] onSubmit: Ejecutando redirección ahora.");
          router.push("/datos-maestros/miembros");
        } catch (e) {
          console.error("[Page] onSubmit: Error en router.push:", e);
          window.location.href = "/datos-maestros/miembros";
        }
      }, redirectDelay); // Usar el nuevo redirectDelay
    } else if (resultado) {
      hideLoading();
      toast.error("Error al Actualizar", {
        description: resultado.error || "Ocurrió un error desconocido durante la actualización.",
      });
    }
    setIsButtonSubmitting(false);
  };

  const handleCancel = () => {
    router.push("/datos-maestros/miembros");
  };

  const getNombreMiembro = (): string => {
    if (!miembro?.profile) return "Miembro";
    const { public_display_name, first_name, last_name } = miembro.profile;
    if (public_display_name) return public_display_name;
    if (first_name || last_name) return `${first_name || ""} ${last_name || ""}`.trim();
    return "Miembro";
  };

  const valoresIniciales: MiembroFormValues | undefined = miembro ? {
    emailUsuario: miembro.profile?.public_contact_email || (miembro.user_id ? `Usuario ID: ${miembro.user_id.substring(0,8)}... (email no en perfil)` : "Email no disponible"),
    rolId: miembro.project_role_id || "",
    firstName: miembro.profile?.first_name || "",
    lastName: miembro.profile?.last_name || "",
    displayName: miembro.profile?.public_display_name || "",
    institution: miembro.profile?.primary_institution || "",
    phone: miembro.profile?.contact_phone || "",
    notes: miembro.profile?.general_notes || "",
    language: miembro.profile?.preferred_language || "",
    pronouns: miembro.profile?.pronouns || "",
  } : undefined;

  if (isPageLoading) {
    return (
      <div className="flex justify-center py-8">
        <SustratoLoadingLogo
          size={50}
          variant="spin-pulse"
          showText={true}
          text="Cargando datos del miembro..."
        />
      </div>
    );
  }

  if (error && !miembro) {
    return (
      <PageBackground>
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <PageHeader
              title="Error al Cargar Datos"
              description={error}
              actions={
                <CustomButton
                  onClick={handleCancel}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  variant="outline"
                >
                  Volver a Miembros
                </CustomButton>
              }
            />
          </div>
        </div>
      </PageBackground>
    );
  }

  if (!miembro && !isPageLoading) {
    return (
      <PageBackground>
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <PageHeader
              title="Miembro no Encontrado"
              description="No se pudieron cargar los datos del miembro o el miembro no existe."
              actions={
                <CustomButton
                  onClick={handleCancel}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  variant="outline"
                >
                  Volver a Miembros
                </CustomButton>
              }
            />
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <PageTitle 
            title={`Editar Miembro: ${getNombreMiembro()}`}
            subtitle="Actualiza la información del miembro en el proyecto"
            mainIcon={User}
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Miembros ", href: "/datos-maestros/miembros" },
              { label: "Modificar Miembro" }
            ]}
            showBackButton={{ href: "/datos-maestros/miembros" }}
          />
          

          {valoresIniciales && roles.length > 0 && (
            <StandardCard
              accentPlacement="top"
              colorScheme="primary" // Mapped from ProCard's color="primary"
              accentColorScheme="primary" // Derived from colorScheme as borderVariant wasn't specified
              styleType="subtle"
              hasOutline={false} // border="top" implies no full outline
            >
            <MiembroForm
              modo="editar"
              valoresIniciales={valoresIniciales}
              rolesDisponibles={roles}
              loading={isButtonSubmitting}
              onSubmit={onSubmit}
            />
            </StandardCard>
          )}
        </div>
      </div>
    </PageBackground>
  );
}