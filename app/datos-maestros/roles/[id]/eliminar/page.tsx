//. 📍 app/datos-maestros/roles/[id]/eliminar/page.tsx
//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import { 
    eliminarRolDeProyecto,
    obtenerDetallesRolProyecto, // Para mostrar el nombre del rol en la confirmación
    type ProjectRoleRow
} from "@/lib/actions/proyect-role-actions";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardDialog } from "@/components/ui/StandardDialog";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No custom types defined directly in this file. Types are imported.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧

export default function EliminarRolPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("datosMaestrosPages.rolesEliminarPage");
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
        setPageError(resultado.success ? t("notFoundRole") : resultado.error || t("errorLoadingRoleData"));
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t("errorUnexpected"));
    } finally {
      setIsPageLoading(false);
    }
  }, [roleId, proyectoActual?.id, t]);

  useEffect(() => {
    if (roleId && proyectoActual?.id) {
      cargarNombreRol();
    } else {
      setIsPageLoading(false);
      if (!proyectoActual?.id) setPageError(t("noActiveProjectShort"));
      else if (!roleId) setPageError(t("noRoleIdShort"));
    }
  }, [roleId, proyectoActual, cargarNombreRol, t]);

  const handleConfirmarEliminacion = async () => {
    if (!roleId || !proyectoActual?.id || !rolParaEliminar) {
      sonnerToast.error(t("toastAppErrorTitle"), { description: t("toastAppErrorDescription") });
      setShowConfirmDialog(false);
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    const resultado = await eliminarRolDeProyecto({ role_id: roleId, project_id: proyectoActual.id });

    if (resultado.success) {
      sonnerToast.success(t("toastDeletedTitle"), {
        description: t("toastDeletedDescription", { roleName: rolParaEliminar.role_name }),
      });
      router.push("/datos-maestros/roles");
    } else {
      sonnerToast.error(t("toastDeleteErrorTitle"), {
        description: resultado.error || t("toastDeleteErrorFallback"),
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
    return (
      <div>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text={t("loadingRoleData")} />
        </div>
      </div>
    );
  }

  if (!proyectoActual?.id) {
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
              <StandardIcon><ShieldAlert className="h-12 w-12 text-danger-fg mb-4" /></StandardIcon>
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
                <StandardButton styleType="outline">
                  {t("backToListButton")}
                </StandardButton>
              </Link>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      </div>
    );
  }
  
  if (!puedeGestionarRoles) { 
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
              <StandardIcon><ShieldAlert className="h-12 w-12 text-danger-fg mb-4" /></StandardIcon>
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
                <StandardButton styleType="outline">
                  {t("backToListButton")}
                </StandardButton>
              </Link>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      </div>
    );
  }
  
  if (pageError && !rolParaEliminar) { // Error durante la carga del rol
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
                {t("errorLoadingTitle")}
              </StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="text-center">
              <StandardText>
                {pageError}
              </StandardText>
            </StandardCard.Content>
            <StandardCard.Footer className="flex justify-center">
              <Link href="/datos-maestros/roles" passHref>
                <StandardButton styleType="outline">
                  {t("backToListButton")}
                </StandardButton>
              </Link>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      </div>
    );
  }

  if (!rolParaEliminar) { // Rol no encontrado
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
              <StandardText preset="subheading" weight="bold" colorScheme="danger">
                {t("notFoundTitle")}
              </StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="text-center">
              <StandardText>
                {pageError || t("notFoundDescription")}
              </StandardText>
            </StandardCard.Content>
            <StandardCard.Footer className="flex justify-center">
              <Link href="/datos-maestros/roles" passHref>
                <StandardButton styleType="outline">
                  {t("backToListButton")}
                </StandardButton>
              </Link>
            </StandardCard.Footer>
          </StandardCard>
        </div>
      </div>
    );
  }


  return (
    <div>
      <div className="container mx-auto py-8">
        <StandardPageTitle
          title={t("pageTitle", { roleName: rolParaEliminar.role_name })}
          subtitle={t("pageSubtitle", { projectName: proyectoActual.name })}
          mainIcon={ShieldAlert}
          breadcrumbs={[
            { label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
            { label: t("breadcrumbRoles"), href: "/datos-maestros/roles" },
            { label: rolParaEliminar.role_name, href: `/datos-maestros/roles/${roleId}/ver` },
            { label: t("breadcrumbEliminar") }
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
            <StandardText preset="heading" size="lg" colorScheme="danger">
              {t("confirmDeletionHeader")}
            </StandardText>
          </StandardCard.Header>
          <StandardCard.Content className="space-y-4">
            <StandardText>
              {t("confirmDeletionBefore")} <StandardText asElement="span" weight="bold">{rolParaEliminar.role_name}</StandardText>{t("confirmDeletionAfter")}
            </StandardText>
            <StandardText colorScheme="warning" colorShade="text" className="flex items-start gap-2">
              <StandardIcon size="sm" colorScheme="warning"><AlertTriangle className="mt-0.5 flex-shrink-0" /></StandardIcon>
              <span>{t("warningText")}</span>
            </StandardText>
            {pageError && ( // Mostrar errores de la action de eliminar aquí
              <div className="p-3 text-sm text-destructive-foreground border border-destructive bg-destructive/10 rounded-md">
                <div className="flex items-center gap-2"><StandardIcon size="sm" colorScheme="danger"><AlertTriangle /></StandardIcon><span>{pageError}</span></div>
              </div>
            )}
          </StandardCard.Content>
          <StandardCard.Footer className="flex justify-end gap-3">
            <StandardButton
              styleType="outline"
              onClick={() => router.push(`/datos-maestros/roles/${roleId}/ver`)}
              disabled={isSubmitting}
            >
              {t("cancelButton")}
            </StandardButton>
            <StandardButton
              colorScheme="danger"
              onClick={() => setShowConfirmDialog(true)} // Abrir diálogo de confirmación
              loading={isSubmitting}
              leftIcon={Trash2}
            >
              {t("deletePermanentlyButton")}
            </StandardButton>
          </StandardCard.Footer>
        </StandardCard>

        <StandardDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <StandardDialog.Content>
            <StandardDialog.Header>
              <StandardDialog.Title>{t("confirmDialogTitle")}</StandardDialog.Title>
              <StandardDialog.Description>
                {t("confirmDialogDescriptionBefore")} <StandardText asElement="span" weight="bold">{rolParaEliminar?.role_name}</StandardText>{t("confirmDialogDescriptionAfter")}
              </StandardDialog.Description>
            </StandardDialog.Header>
            <StandardDialog.Footer>
              <StandardButton styleType="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
                {t("cancelButton")}
              </StandardButton>
              <StandardButton
                colorScheme="danger"
                onClick={handleConfirmarEliminacion}
                loading={isSubmitting}
              >
                {isSubmitting ? t("deletingButton") : t("confirmDeleteButton")}
              </StandardButton>
            </StandardDialog.Footer>
          </StandardDialog.Content>
        </StandardDialog>

      </div>
    </div>
  );
//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚

//#endregion ![foo]