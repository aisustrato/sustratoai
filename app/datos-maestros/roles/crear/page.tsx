//. 📍 app/datos-maestros/roles/crear/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect } from "react"; // useCallback no es necesario aquí
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import { RolForm, type RolFormValues } from "../components/RolForm";
import { agregarRolAProyecto } from "@/lib/actions/proyect-role-actions";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { ShieldPlus, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo"; // Para estado de carga opcional
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types or interfaces defined directly in this file.
// RolFormValues is imported. State types are inline.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function CrearRolPage() {
  const router = useRouter();
  const t = useTranslations("datosMaestrosPages.rolesCrearPage");
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
      setPageError(t("noProjectError"));
    }
    setIsPageLoading(false); // Terminar la carga de la página
  }, [proyectoActual, t]);


  const handleCrearRol = async (data: RolFormValues) => {
    if (!proyectoActual?.id) {
      sonnerToast.error(t("toastProjectErrorTitle"), {
        description: t("toastProjectErrorDescription"),
      });
      setPageError(t("noProjectErrorShort")); // Actualizar error de página también
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
      sonnerToast.success(t("toastCreatedTitle"), {
        description: t("toastCreatedDescription", { roleName: resultado.data.role_name }),
      });
      router.push("/datos-maestros/roles");
    } else {
      console.error("Error al crear el rol:", resultado.error);
      sonnerToast.error(t("toastErrorTitle"), {
        description: resultado.error || t("toastErrorFallback"),
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
      <div>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo size={50} showText text={t("loadingConfig")} />
        </div>
      </div>
    );
  }
  //#endregion [render_sub]

  //#region [render_sub] - NO PROJECT ERROR STATE 🤚
  if (pageError && !proyectoActual?.id) { // Si el error es por no tener proyecto
    return (
      <div>
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
          <StandardCard
            colorScheme="primary"
            accentPlacement="none"
            hasOutline={false}
            shadow="none"
            disableShadowHover={true}
            styleType="subtle"
            className="max-w-lg w-full"
          >
            <StandardCard.Header className="items-center flex flex-col text-center">
              <StandardIcon><AlertTriangle className="h-12 w-12 text-danger-fg mb-4" /></StandardIcon>
              <StandardText preset="subheading" weight="bold" colorScheme="danger">
                {puedeGestionarRoles ? t("configErrorTitle") : t("accessDeniedTitle")}
              </StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="text-center">
              <StandardText>{pageError}</StandardText>
            </StandardCard.Content>
            <StandardCard.Footer className="flex justify-center">
              <Link href="/" passHref>
                <StandardButton
                  styleType="outline"
                  leftIcon={ArrowLeft}
                >
                  {t("goHomeButton")}
                </StandardButton>
              </Link>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      </div>
    );
  }
  //#endregion [render_sub]
  
  //#region [render_sub] - ACCESS DENIED STATE 🚫
  if (!puedeGestionarRoles && proyectoActual?.id) { // Si hay proyecto pero no permisos
    return (
      <div>
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
          <StandardCard
            colorScheme="primary"
            accentPlacement="none"
            hasOutline={false}
            shadow="none"
            disableShadowHover={true}
            styleType="subtle"
            className="max-w-lg w-full"
          >
            <StandardCard.Header className="items-center flex flex-col text-center">
              <StandardIcon><AlertTriangle className="h-12 w-12 text-danger-fg mb-4" /></StandardIcon>
              <StandardText preset="subheading" weight="bold" colorScheme="danger">
                {t("accessDeniedTitle")}
              </StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="text-center">
              <StandardText>
                {t("accessDeniedDescription")}
              </StandardText>
            </StandardCard.Content>
            <StandardCard.Footer className="flex justify-center">
              <Link href="/datos-maestros/roles" passHref>
                <StandardButton
                  styleType="outline"
                  leftIcon={ArrowLeft}
                >
                  {t("backToListButton")}
                </StandardButton>
              </Link>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      </div>
    );
  }
  //#endregion [render_sub]

  //#region [render_sub] - MAIN FORM DISPLAY 📝
  return (
    <div>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <StandardPageTitle
            title={t("pageTitle")}
            subtitle={t("pageSubtitle", { projectName: proyectoActual?.name || "..." })}
            mainIcon={ShieldPlus}
            breadcrumbs={[
              { label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
              { label: t("breadcrumbRoles"), href: "/datos-maestros/roles" },
              { label: t("breadcrumbCrear") }
            ]}
            showBackButton={{ href: "/datos-maestros/roles" }}
          />

          <StandardCard
            className="mt-6"
            accentPlacement="top"
            colorScheme="secondary"
            accentColorScheme="primary"
            shadow="md"
            disableShadowHover={true}
            styleType="subtle"
          >
            <StandardCard.Content>
              {pageError && proyectoActual?.id && ( // Mostrar error de envío si hay proyecto
                <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive-foreground">
                  <div className="flex items-center gap-2">
                    <StandardIcon size="sm" colorScheme="danger">
                      <AlertTriangle/>
                    </StandardIcon>
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
      </div>
    </div>
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