//. 📍 app/datos-maestros/miembros/[id]/eliminar/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import { 
  obtenerDetallesMiembroProyecto,
  eliminarMiembroDeProyecto,
  type ProjectMemberDetails } from "@/lib/actions/member-actions";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";

import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ArrowLeft, Trash2, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";

import { StandardDialog } from "@/components/ui/StandardDialog";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
//> 📝 No local schema, types, or props defined for this page component.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function EliminarMiembroPage() {
  //#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
  const t = useTranslations("datosMaestrosPages.miembrosEliminarPage");
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id ? String(params.id) : "";
  const { proyectoActual } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [miembro, setMiembro] = useState<ProjectMemberDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarDatosMiembro = useCallback(async () => {
    if (!proyectoActual?.id || !memberId) {
      setError(t("errorNoProjectOrInvalidMember"));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const resultado = await obtenerDetallesMiembroProyecto(memberId, proyectoActual.id);

      if (!resultado.success || !resultado.data) {
        setError(t("errorLoadingMemberInfo"));
        return;
      }

      setMiembro(resultado.data);
    } catch (err) {
      console.error("Error al cargar el miembro:", err);
      setError(t("errorLoadingMemberGeneric"));
    } finally {
      setIsLoading(false);
    }
  }, [memberId, proyectoActual?.id, t]);

  useEffect(() => {
    cargarDatosMiembro();
  }, [cargarDatosMiembro]);

  const handleConfirmarEliminacion = async () => {
    if (!proyectoActual?.id || !memberId) return;
    
    setIsDeleting(true);
    try {
      const resultado = await eliminarMiembroDeProyecto({
        projectMemberId: memberId,
        proyectoId: proyectoActual.id
      });
      
      if (resultado.success) {
        toast.success(t("toastMemberDeletedSuccess"));
        router.push("/datos-maestros/miembros");
      } else {
        setError(resultado.error || t("errorDeletingMember"));
      }
    } catch (err) {
      console.error("Error al eliminar miembro:", err);
      setError(t("errorUnexpectedDeleting"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SustratoLoadingLogo />
      </div>
    );
  }

  if (error) {
    return (
      <StandardPageBackground variant="gradient">
        <StandardCard
          className="max-w-4xl mx-auto my-6"
          colorScheme="danger"
          styleType="subtle"
          hasOutline={false}
          accentPlacement="none"
        >
          <StandardCard.Header>
            <StandardButton
              styleType="outline"
              onClick={() => router.back()}
              leftIcon={ArrowLeft}
              className="mb-4"
            >
              {t("backButton")}
            </StandardButton>
            <div className="flex items-center gap-3">
              <StandardIcon><AlertTriangle className="h-6 w-6" /></StandardIcon>
              <StandardText>{t("errorPrefix", { error })}</StandardText>
            </div>
          </StandardCard.Header>
        </StandardCard>
      </StandardPageBackground>
    );
  }

  if (!miembro) {
    return (
      <StandardPageBackground variant="gradient">
        <StandardCard
          className="max-w-4xl mx-auto my-6"
          colorScheme="neutral"
          styleType="subtle"
          hasOutline={false}
          accentPlacement="none"
        >
          <StandardCard.Content>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <StandardIcon><AlertTriangle className="h-6 w-6" /></StandardIcon>
                <StandardText>{t("memberNotFoundText")}</StandardText>
              </div>
              <div className="ml-9 space-y-1">
                <StandardText weight="bold" size="lg">{t("memberNotFoundTitle")}</StandardText>
                <StandardText>{t("memberNotFoundDescription")}</StandardText>
              </div>
            </div>
          </StandardCard.Content>
        </StandardCard>
      </StandardPageBackground>
    );
  }

  return (
    <StandardPageBackground variant="gradient">
      <StandardPageTitle
        title={t("deleteTitle", { name: miembro?.profile?.public_display_name || miembro?.profile?.first_name || t("noNameFallback") })}
        subtitle={t("deleteSubtitle")}
        mainIcon={User}
        breadcrumbs={[
          { label: t("breadcrumbDatosMaestros"), href: '/datos-maestros' },
          { label: t("breadcrumbMiembros"), href: '/datos-maestros/miembros' },
          { label: t("breadcrumbEliminar") }
        ]}
        showBackButton={{ href: "/datos-maestros/miembros" }}
        className="max-w-4xl mx-auto mt-6 mb-4 px-6"
      />

      <StandardCard
        className="max-w-4xl mx-auto mb-6 px-6"
        accentPlacement="top"
        colorScheme="primary"
        styleType="subtle"
        hasOutline={false}
      >
        <StandardCard.Content>
          <div className="space-y-6">
            <div>
              <StandardText size="lg" weight="semibold" className="mb-4">
                {t("confirmQuestion")}
              </StandardText>
              <div className="space-y-2 mb-6">
                <StandardText colorScheme="neutral">
                  {t("irreversibleWarning")}
                </StandardText>
                <StandardText colorScheme="neutral">
                  {t("accessLossWarning")}
                </StandardText>
              </div>
            </div>

            <StandardCard colorScheme="neutral" styleType="subtle" hasOutline={true} className="mb-6">
              <StandardCard.Content>
                <StandardText weight="medium" className="mb-4">{t("memberDetailsTitle")}</StandardText>
                <div className="space-y-3 pt-4">
                  <div>
                    <StandardText weight="medium" colorScheme="neutral">{t("nameLabel")}</StandardText>
                    <StandardText>{miembro.profile?.public_display_name || t("notSpecified")}</StandardText>
                  </div>
                  <div>
                    <StandardText weight="medium" colorScheme="neutral">{t("emailLabel")}</StandardText>
                    <StandardText>{miembro.profile?.public_contact_email || t("notSpecified")}</StandardText>
                  </div>
                  <div>
                    <StandardText weight="medium" colorScheme="neutral">{t("roleLabel")}</StandardText>
                    <StandardText>{miembro.role_name || t("notSpecified")}</StandardText>
                  </div>
                </div>
              </StandardCard.Content>
            </StandardCard>

            <div className="flex justify-end space-x-3 pt-2">
              <StandardButton
                styleType="outline"
                onClick={() => router.back()}
                disabled={isDeleting}
              >
                {t("cancelButton")}
              </StandardButton>
              <StandardButton
                styleType="solid"
                colorScheme="danger"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                loading={isDeleting}
                leftIcon={Trash2}
              >

                {isDeleting ? t("deletingButton") : t("deleteMemberButton")}
              </StandardButton>
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Dialogo de confirmación */}
      <StandardDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <StandardDialog.Content colorScheme="danger" size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>{t("confirmDialogTitle", { name: miembro?.profile?.first_name || t("confirmDialogThisMember") })}</StandardDialog.Title>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <StandardDialog.Description>
              {t("confirmDialogDescription")}
            </StandardDialog.Description>
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardDialog.Close asChild>
              <StandardButton styleType="outline" onClick={() => setShowDeleteDialog(false)}>{t("cancelButton")}</StandardButton>
            </StandardDialog.Close>
            <StandardButton
              colorScheme="danger"
              onClick={handleConfirmarEliminacion}
              loading={isDeleting}
            >
              {isDeleting ? t("deletingButton") : t("yesDeleteButton")}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </StandardPageBackground>
  );
}
//#endregion ![render]
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the component declaration. No other exports.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Re-enable actual member deletion in CustomDialog onConfirm (currently console.log and commented out call).
// TODO: Consider adding more robust error handling or user feedback for the deletion process.
// TODO: Review permissions check for deleting members if applicable.
//#endregion ![todo]
