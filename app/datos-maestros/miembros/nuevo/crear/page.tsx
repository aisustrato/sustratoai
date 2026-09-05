//. 📍 app/datos-maestros/miembros/nuevo/crear/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // Solo useRouter, no useParams
import { useTranslations } from "next-intl";
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

import { toast } from "sonner"; // Para notificaciones
import { useLoading } from "@/contexts/LoadingContext"; // Opcional, para loading global
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
export type SelectOption = { value: string; label: string };
//> 📝 No custom types or schemas defined outside the component for this page.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function CrearMiembroPage() {
  //#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
  const t = useTranslations("datosMaestrosPages.miembrosCrearPage");
  const router = useRouter();
  const { proyectoActual } = useAuth();
  const { showLoading, hideLoading } = useLoading(); // Opcional

  const [isPageLoading, setIsPageLoading] = useState(true); // Para la carga inicial de roles
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el estado de envío del formulario
  const [rolesDisponibles, setRolesDisponibles] = useState<SelectOption[]>([]);
  const [errorPage, setErrorPage] = useState<string | null>(null); // Errores de carga de página
  // Credenciales de una cuenta recién creada: se muestran una sola vez, antes de salir de esta página.
  const [credencialesCreadas, setCredencialesCreadas] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [passwordCopiada, setPasswordCopiada] = useState(false);

  // Cargar roles disponibles
  const cargarRoles = useCallback(async () => {
    setIsPageLoading(true);
    setErrorPage(null);
    setRolesDisponibles([]);

    if (!proyectoActual?.id) {
      setErrorPage(t("errorNoProjectForAdd"));
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
         t("errorLoadingRoles")
        );
      }
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setErrorPage(
        t("errorUnexpectedLoadingRoles", { message: (err as Error).message })
      );
    } finally {
      setIsPageLoading(false);
    }
  }, [proyectoActual?.id, t]);

  useEffect(() => {
    if (proyectoActual?.id) {
      cargarRoles();
    } else {
      // Si no hay proyecto, no podemos cargar roles ni crear miembro.
      setErrorPage(t("errorSelectProjectToContinue"));
      setIsPageLoading(false); // Asegura que no se quede cargando indefinidamente
    }
  }, [proyectoActual?.id, cargarRoles, t]);

  const handleFormSubmit = async (data: MiembroFormValues) => {
    if (!proyectoActual?.id) {
      toast.error(t("toastAppErrorTitle"), {
        description: t("toastNoActiveProject"),
      });
      return;
    }

    setIsSubmitting(true);
    if (typeof showLoading === 'function') showLoading(t("loadingLabel")); // Opcional: si usas useLoading

    const payload = {
      proyectoId: proyectoActual.id,
      emailUsuarioNuevo: data.emailUsuario,
      rolIdAsignar: data.rolId,
      crearUsuarioSiNoExiste: data.esUsuarioNuevo,
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

    let resultado: ResultadoOperacion<{
      project_member_id: string;
      profile_action: string;
      temporary_password?: string;
    }> | null = null;

    try {
      resultado = await agregarMiembroAProyecto(payload);
    } catch (err) {
      console.error("Excepción al llamar a agregarMiembroAProyecto:", err);
      if (typeof hideLoading === 'function') hideLoading();
      setIsSubmitting(false);
      toast.error(t("toastUnexpectedCommTitle"), {
        description: t("toastUnexpectedCommDescription", { message: (err as Error).message }),
      });
      return;
    }


    if (typeof hideLoading === 'function') hideLoading(); // Opcional

    if (resultado?.success) {
      if (resultado.data.temporary_password) {
        // No redirigimos todavía: esta es la única vez que se muestra la
        // contraseña provisoria, hay que dejar que la copien antes de salir.
        setCredencialesCreadas({
          email: data.emailUsuario,
          password: resultado.data.temporary_password,
        });
      } else {
        toast.success(t("toastMemberAddedTitle"), {
          description: t("toastMemberAddedDescription", { email: data.emailUsuario, profileAction: resultado.data.profile_action }),
          duration: 4000,
        });
        // Retrasar la redirección para que el toast sea visible
        setTimeout(() => {
          router.push("/datos-maestros/miembros");
        }, 1500);
      }
    } else {
      toast.error(t("toastErrorAddingTitle"), {
        description: resultado?.error || t("toastErrorUnknown"),
      });
    }
    setIsSubmitting(false);
  };

  const handleVolver = () => {
    router.push("/datos-maestros/miembros");
  };

  const handleCopiarPassword = async () => {
    if (!credencialesCreadas) return;
    await navigator.clipboard.writeText(credencialesCreadas.password);
    setPasswordCopiada(true);
    setTimeout(() => setPasswordCopiada(false), 2000);
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  if (credencialesCreadas) {
    return (
      <StandardPageBackground variant="gradient">
        <div className="container mx-auto py-6">
          <div className="space-y-6 max-w-xl mx-auto">
            <StandardPageTitle
              title={t("accountCreatedTitle")}
              subtitle={t("accountCreatedSubtitle")}
              mainIcon={UserPlus}
            />
            <StandardCard styleType="filled" colorScheme="success" accentPlacement="top">
              <div className="space-y-4 p-2">
                <div>
                  <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                    {t("emailLabel")}
                  </StandardText>
                  <StandardText size="md" weight="medium">
                    {credencialesCreadas.email}
                  </StandardText>
                </div>
                <div>
                  <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                    {t("provisionalPasswordLabel")}
                  </StandardText>
                  <div className="flex items-center gap-3">
                    <StandardText size="lg" weight="bold" className="font-mono">
                      {credencialesCreadas.password}
                    </StandardText>
                    <StandardButton
                      styleType="outline"
                      size="sm"
                      onClick={handleCopiarPassword}
                    >
                      {passwordCopiada ? t("copiedButton") : t("copyButton")}
                    </StandardButton>
                  </div>
                </div>
                <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                  {t("passwordHandoffNote")}
                </StandardText>
                <div className="flex justify-end pt-2">
                  <StandardButton
                    colorScheme="primary"
                    onClick={() => router.push("/datos-maestros/miembros")}
                  >
                    {t("goToMembersButton")}
                  </StandardButton>
                </div>
              </div>
            </StandardCard>
          </div>
        </div>
      </StandardPageBackground>
    );
  }

  if (isPageLoading) {
    return (
      <div className="flex justify-center py-8">
        <SustratoLoadingLogo
          size={50}
          variant="spin-pulse"
          showText
          text={t("loadingConfig")}
        />
      </div>
    );
  }

  if (errorPage && rolesDisponibles.length === 0) { // Si hay un error que impidió cargar roles
    return (
      <StandardPageBackground variant="gradient">
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <PageHeader
              title={t("configErrorTitle")}
              description={errorPage}
              actions={
                <StandardButton
                  onClick={handleVolver}

                  styleType="outline"
                >
                  <StandardIcon><ArrowLeft /></StandardIcon>
                  {t("backToMembersButton")}
                </StandardButton>
              }
            />
          </div>
        </div>
      </StandardPageBackground>
    );
  }
  
  // Si llegamos aquí, rolesDisponibles debería tener datos (o estar vacío si la carga falló pero no fue crítico)
  // y no hay errorPage bloqueante.

  return (
    <StandardPageBackground variant="gradient">
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <StandardPageTitle
            title={t("pageTitle")}
            subtitle={t("pageSubtitle")}
            mainIcon={UserPlus}
            breadcrumbs={[
              { label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
              { label: t("breadcrumbMiembros"), href: "/datos-maestros/miembros" },
              { label: t("breadcrumbCrear") }
            ]}
            showBackButton={{ href: "/datos-maestros/miembros" }}
         />

         <StandardCard
            disableShadowHover={true}
            styleType="subtle"
            colorScheme="primary" // Rule: Main form card colorScheme is secondary
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
    </StandardPageBackground>
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