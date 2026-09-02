//. 📍 app/datos-maestros/miembros/[id]/modificar/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import {
  obtenerDetallesMiembroProyecto,
  obtenerRolesDisponiblesProyecto,
  modificarDetallesMiembroEnProyecto,
  ProjectMemberDetails,
  ProjectRoleInfo,

  MemberProfileData,
} from "@/lib/actions/member-actions";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { MiembroForm, MiembroFormValues } from "@/app/datos-maestros/miembros/components/MiembroForm";
import { toast } from "sonner";
import { ArrowLeft, User } from "lucide-react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
interface RolOption {
  value: string;
  label: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function ModificarMiembroPage() {
  //#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
  const t = useTranslations("datosMaestrosPages.miembrosModificarPage");
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id ? String(params.id) : "";
  const { proyectoActual } = useAuth();

  const [isButtonSubmitting, setIsButtonSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [miembro, setMiembro] = useState<ProjectMemberDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    // No es necesario llamar a setIsPageLoading(true) aquí, porque el estado inicial ya es true.
    // Limpiamos los estados antes de cada carga.
    setError(null);
    setMiembro(null);

    if (!proyectoActual?.id) {
      setError(t("errorNoActiveProject"));
      setIsPageLoading(false); // Detenemos la carga si no hay datos para proceder.
      return;
    }
    if (!memberId) {
      setError(t("errorNoMemberIdInUrl"));
      setIsPageLoading(false); // Detenemos la carga.
      return;
    }

    try {
      // Obtenemos roles y detalles del miembro en paralelo para más eficiencia.
      const [resultadoRoles, resultadoMiembro] = await Promise.all([
        obtenerRolesDisponiblesProyecto(proyectoActual.id),
        obtenerDetallesMiembroProyecto(memberId, proyectoActual.id),
      ]);

      // Procesamos el resultado de los roles.
      if (!resultadoRoles.success) {
        // Si falla, establecemos un error pero no bloqueamos la renderización del resto.
        console.error("Error al cargar roles:", resultadoRoles.error);
        setError(resultadoRoles.error || t("errorLoadingRolesGeneric"));
      } else if (resultadoRoles.data) {
        const opcionesRoles = resultadoRoles.data.map((rol: ProjectRoleInfo) => ({
          value: rol.id,
          label: rol.role_name,
        }));
        setRoles(opcionesRoles);
      }

      // Procesamos el resultado del miembro.
      if (!resultadoMiembro.success) {
        // Si el miembro no se encuentra, es un error que debe detener el flujo.
        setError(resultadoMiembro.error || t("errorMemberNotFoundGeneric"));
        setMiembro(null); // Aseguramos que no haya datos de miembro.
      } else if (resultadoMiembro.data) {
        setMiembro(resultadoMiembro.data);
      } else {
        // Si la operación fue exitosa pero no hay datos, significa que no se encontró.
        setError(t("errorMemberNotFoundGeneric"));
        setMiembro(null);
      }
    } catch (err) {
      console.error("[Page] cargarDatos: Excepción:", err);
      setError(t("errorUnexpectedLoadingData", { message: (err as Error).message }));
    } finally {
      // Independientemente del resultado, la carga de la página ha finalizado.
      setIsPageLoading(false);
    }
  }, [proyectoActual?.id, memberId, t]);

  useEffect(() => {
    // Este efecto se ejecuta una vez cuando el componente se monta
    // o cuando cambian las dependencias (id de proyecto o miembro).
    cargarDatos();
  }, [cargarDatos]);

  const onSubmit = async (data: MiembroFormValues) => {
    if (!proyectoActual?.id || !memberId || !miembro) {
      toast.error(t("toastAppErrorMissingData"));
      return;
    }

    // 1. Determinar qué ha cambiado
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
      toast(t("toastNoChangesTitle"), { description: t("toastNoChangesDescription") });
      return;
    }

    // 2. Iniciar el estado de envío y construir el payload
    setIsButtonSubmitting(true);
    const payloadFinal: Parameters<typeof modificarDetallesMiembroEnProyecto>[0] = {
      proyectoId: proyectoActual.id,
      projectMemberId: memberId,
    };
    if (Object.keys(profileUpdates).length > 0) payloadFinal.profileUpdates = profileUpdates;
    if (Object.keys(memberUpdatesForAction).length > 0) payloadFinal.memberUpdates = memberUpdatesForAction;

    // 3. Ejecutar la acción del servidor en un bloque try/catch/finally
    try {
      const resultado = await modificarDetallesMiembroEnProyecto(payloadFinal);

      if (resultado.success) {
        toast.success(t("toastMemberUpdatedTitle"), {
          description: t("toastMemberUpdatedDescription"),
          duration: 2000,
        });
        // Retrasamos la redirección para que el usuario pueda ver el toast.
        setTimeout(() => router.push("/datos-maestros/miembros"), 1500);
      } else {
        toast.error(t("toastErrorUpdatingTitle"), {
          description: resultado.error || t("toastErrorUnknown"),
        });
      }
    } catch (err) {
      console.error("[Page] onSubmit: Excepción al llamar a la Server Action:", err);
      toast.error(t("toastCommErrorTitle"), {
        description: t("toastCommErrorDescription", { message: (err as Error).message }),
      });
    } finally {
      // 4. Finalizar el estado de envío, sin importar el resultado.
      setIsButtonSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/datos-maestros/miembros");
  };

  const getNombreMiembro = (): string => {
    if (!miembro?.profile) return t("defaultMemberName");
    const { public_display_name, first_name, last_name } = miembro.profile;
    if (public_display_name) return public_display_name;
    if (first_name || last_name) return `${first_name || ""} ${last_name || ""}`.trim();
    return t("defaultMemberName");
  };

  const valoresIniciales: MiembroFormValues | undefined = miembro ? {
    emailUsuario: miembro.profile?.public_contact_email || (miembro.user_id ? t("userIdFallback", { id: miembro.user_id.substring(0,8) }) : t("unavailableEmail")),
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
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  if (isPageLoading) {
    return (
      <div className="flex justify-center py-8">
        <SustratoLoadingLogo
          size={50}
          variant="spin-pulse"
          showText={true}
          text={t("loadingMemberData")}
        />
      </div>
    );
  }

  if (error && !miembro) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <PageHeader
            title={t("errorLoadingTitle")}
            description={error}
            actions={
              <StandardButton onClick={handleCancel} styleType="outline">
                <StandardIcon><ArrowLeft className="h-4 w-4" /></StandardIcon>
                {t("backToMembers")}
              </StandardButton>
            }
          />
        </div>
      </div>
    );
  }

  if (!miembro) {
    // Este caso cubre cuando la carga terminó (isPageLoading=false) pero no hay miembro y no necesariamente un error.
    return (
       <div className="container mx-auto py-6">
        <div className="space-y-6">
          <PageHeader
            title={t("memberNotFoundTitle")}
            description={t("memberNotFoundDescription")}
            actions={
              <StandardButton onClick={handleCancel} styleType="outline">
                <StandardIcon><ArrowLeft className="h-4 w-4" /></StandardIcon>
                {t("backToMembers")}
              </StandardButton>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <StandardPageTitle
          title={t("editTitle", { name: getNombreMiembro() })}
          subtitle={t("editSubtitle")}
          mainIcon={User}
          breadcrumbs={[
            { label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
            { label: t("breadcrumbMiembros"), href: "/datos-maestros/miembros" },
            { label: t("breadcrumbModificar") }
          ]}
          showBackButton={{ href: "/datos-maestros/miembros" }}
        />

        {valoresIniciales && roles.length > 0 ? (
          <StandardCard
            disableShadowHover={true}
            styleType="subtle"
            colorScheme="primary"
            accentPlacement="top"
            accentColorScheme="primary"
            shadow="md"
          >
            <MiembroForm
              modo="editar"
              valoresIniciales={valoresIniciales}
              rolesDisponibles={roles}
              loading={isButtonSubmitting}
              onSubmit={onSubmit}
            />
          </StandardCard>
        ) : (
          // Renderiza un mensaje si los roles no se pudieron cargar pero el miembro sí
          <StandardCard>
             <p>{t("rolesUnavailableMessage")}</p>
          </StandardCard>
        )}
      </div>
    </div>
  );
}
//#endregion ![render]
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the component declaration. No other exports.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Consider abstracting data fetching logic if it becomes too complex or repetitive across pages.
//#endregion ![todo]