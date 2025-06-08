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
import { CustomButton } from "@/components/ui/custom-button";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ArrowLeft, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CustomDialog } from "@/components/ui/custom-dialog";
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
      <PageBackground>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <CustomButton
              variant="outline"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </CustomButton>
          </div>
          
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </PageBackground>
    );
  }

  if (!miembro) {
    return (
      <PageBackground>
        <div className="max-w-4xl mx-auto p-6">
          <Alert>
            <AlertTitle>No se encontró el miembro</AlertTitle>
            <AlertDescription>
              El miembro solicitado no existe o no tienes permisos para verlo.
            </AlertDescription>
          </Alert>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="max-w-4xl mx-auto p-6">
       

        <PageTitle 
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
              <CustomButton
                variant="outline"
                onClick={() => router.back()}
                disabled={isDeleting}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                variant="solid"
                color="danger"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                loading={isDeleting}
                leftIcon={<Trash2 className="h-4 w-4 mr-2" />}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar miembro'}
              </CustomButton>
            </div>
          </div>
        </StandardCard>
      </div>

      {/* Dialogo de confirmación */}
      <CustomDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`¿Está seguro que desea eliminar a ${miembro?.profile?.first_name || 'este miembro'}?`}
        description="Esta acción no se puede deshacer. El miembro perderá el acceso al proyecto."
        variant="destructive"
        confirmText={isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
        cancelText="Cancelar"
        onConfirm={() => {
          // Deshabilitado temporalmente
          console.log('Acción de eliminación temporalmente deshabilitada');
          // handleEliminarMiembro(); // Comentado temporalmente
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
        className="max-w-md"
      />
    </PageBackground>
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
