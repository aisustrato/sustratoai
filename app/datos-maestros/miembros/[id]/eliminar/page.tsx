//. 📍 app/datos-maestros/miembros/[id]/eliminar/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { 
  obtenerDetallesMiembroProyecto,
  eliminarMiembroDeProyecto,
  type ProjectMemberDetails,
  type ResultadoOperacion
} from "@/lib/actions/member-actions";
import type { MemberProfileData } from "@/lib/actions/member-actions";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ArrowLeft, Trash2, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";

import { StandardDialog } from "@/components/ui/StandardDialog";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
//> 📝 No local schema, types, or props defined for this page component.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function EliminarMiembroPage() {
  //#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
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
      setError("No se ha seleccionado un proyecto o el miembro no es válido.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const resultado = await obtenerDetallesMiembroProyecto(memberId, proyectoActual.id);
      
      if (!resultado.success || !resultado.data) {
        setError("No se pudo cargar la información del miembro.");
        return;
      }
      
      setMiembro(resultado.data);
    } catch (err) {
      console.error("Error al cargar el miembro:", err);
      setError("Ocurrió un error al cargar la información del miembro.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId, proyectoActual?.id]);

  useEffect(() => {
    cargarDatosMiembro();
  }, [cargarDatosMiembro]);

  const handleEliminarMiembro = async () => {
    if (!proyectoActual?.id || !memberId) return;
    
    setIsDeleting(true);
    try {
      const resultado = await eliminarMiembroDeProyecto({
        projectMemberId: memberId,
        proyectoId: proyectoActual.id
      });
      
      if (resultado.success) {
        toast.success("Miembro eliminado correctamente");
        router.push("/datos-maestros/miembros");
      } else {
        setError(resultado.error || "Error al eliminar el miembro");
      }
    } catch (err) {
      console.error("Error al eliminar miembro:", err);
      setError("Ocurrió un error al intentar eliminar el miembro");
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
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <StandardButton
              styleType="outline"
              onClick={() => router.back()}
              leftIcon={ArrowLeft}
            >
              Volver
            </StandardButton>
          </div>
          <StandardCard
            disableShadowHover={true}
            className="border-destructive bg-destructive/5"
            colorScheme="danger" // Assuming intent from className
            styleType="subtle"
            hasOutline={false} // Defaulting as no border prop was specified
            accentPlacement="none" // Defaulting
          >
            <div className="flex items-center gap-3">
              <StandardIcon><AlertTriangle className="h-6 w-6 text-destructive" /></StandardIcon>
              <StandardText>Error: {error}</StandardText>
            </div>
          </StandardCard>
        </div>
      </StandardPageBackground>
    );
  }

  if (!miembro) {
    return (
      <StandardPageBackground variant="gradient">
        <div className="max-w-4xl mx-auto p-6">
          <StandardCard
            disableShadowHover={true}
            className="border-info bg-info/5"
            colorScheme="neutral"
            styleType="subtle"
            hasOutline={false}
            accentPlacement="none"
          >
            <div className="flex items-center gap-3">
              <StandardIcon><AlertTriangle className="h-6 w-6 text-info" /></StandardIcon>
              <StandardText>No se encontró información para este miembro.</StandardText>
              <div>
                <StandardText weight="bold" size="lg" colorScheme="warning">No se encontró el miembro</StandardText>
                <StandardText colorScheme="warning">El miembro solicitado no existe o no tienes permisos para verlo.</StandardText>
              </div>
            </div>
          </StandardCard>
        </div>
      </StandardPageBackground>
    );
  }

  return (
    <StandardPageBackground variant="gradient">
      <div className="max-w-4xl mx-auto p-6">
       

        <StandardPageTitle 
          title={`Eliminar Miembro: ${miembro?.profile?.public_display_name || miembro?.profile?.first_name || 'Sin nombre'}`}
          subtitle="Confirme la eliminación de este miembro del proyecto."
          mainIcon={User}
          breadcrumbs={[
            { label: 'Datos Maestros', href: '/datos-maestros' },
            { label: 'Miembros', href: '/datos-maestros/miembros' },
            { label: 'Eliminar Miembro' }
          ]}
          showBackButton={{ href: "/datos-maestros/miembros" }}
          className="mb-6"
        />

        <StandardCard
          disableShadowHover={true}
          accentPlacement="top"
          colorScheme="primary"
          accentColorScheme="primary" // Derived from colorScheme as borderVariant wasn't specified
          className="mb-6"
          styleType="subtle"
          hasOutline={false} // border="top" implies no full outline
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">¿Está seguro que desea eliminar a este miembro?</h3>
              <p className="text-muted-foreground">
                Esta acción no se puede deshacer. El miembro perderá el acceso al proyecto.
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Detalles del miembro</h4>
              <div className="grid gap-2">
                <p><span className="font-medium">Nombre:</span> {miembro.profile?.public_display_name || 'No especificado'}</p>
                <p><span className="font-medium">Email:</span> {miembro.profile?.public_contact_email || 'No especificado'}</p>
                <p><span className="font-medium">Rol:</span> {miembro.role_name || 'No especificado'}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <StandardButton
                styleType="outline"
                onClick={() => router.back()}
                disabled={isDeleting}
              >
                Cancelar
              </StandardButton>
              <StandardButton
                styleType="solid"
                colorScheme="danger"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                loading={isDeleting}
              >
                <StandardIcon><Trash2 className="h-4 w-4 mr-2" /></StandardIcon>
                {isDeleting ? 'Eliminando...' : 'Eliminar miembro'}
              </StandardButton>
            </div>
          </div>
        </StandardCard>
      </div>

      {/* Dialogo de confirmación */}
      <StandardDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <StandardDialog.Content colorScheme="danger" size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>{`¿Está seguro que desea eliminar a ${miembro?.profile?.first_name || 'este miembro'}?`}</StandardDialog.Title>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <StandardDialog.Description>
              Esta acción no se puede deshacer. El miembro perderá el acceso al proyecto.
            </StandardDialog.Description>
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardDialog.Close asChild>
              <StandardButton styleType="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</StandardButton>
            </StandardDialog.Close>
            <StandardButton 
              colorScheme="danger" 
              onClick={() => {
                // Deshabilitado temporalmente
                console.log('Acción de eliminación temporalmente deshabilitada');
                // handleEliminarMiembro(); // Comentado temporalmente
              }}
              loading={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
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
