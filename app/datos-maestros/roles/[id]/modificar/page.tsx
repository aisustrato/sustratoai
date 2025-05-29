// app/datos-maestros/roles/[id]/modificar/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider"; // Solo se usa proyectoActual y user
import { RolForm, type RolFormValues } from "../../components/RolForm";
import { 
    modificarRolEnProyecto, 
    obtenerDetallesRolProyecto,
    type ProjectRoleRow,
    type ResultadoOperacion 
} from "@/lib/actions/proyect-role-actions";
import { ProCard } from "@/components/ui/pro-card";
import { PageTitle } from "@/components/ui/page-title";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Text } from "@/components/ui/text";
import { CustomButton } from "@/components/ui/custom-button";
import Link from "next/link";
import { PageBackground } from "@/components/ui/page-background";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

export default function ModificarRolPage() {
  const router = useRouter();
  const params = useParams(); 
  const { proyectoActual } = useAuth(); // CORRECCIÓN: Eliminado isLoading de aquí
  
  const roleId = (params && typeof params.id === "string") ? params.id : null;

  const [rolParaEditar, setRolParaEditar] = useState<ProjectRoleRow | null>(null);
  // isPageLoading: true inicialmente, se pone a false después del primer useEffect o dentro de cargarDetallesRol
  const [isPageLoading, setIsPageLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const puedeGestionarRoles = proyectoActual?.permissions?.can_manage_master_data || false;

  const cargarDetallesRol = useCallback(async () => {
    if (!roleId || !proyectoActual?.id) {
      setIsPageLoading(false); 
      return;
    }

    // No necesitamos setIsPageLoading(true) aquí porque ya está en true o useEffect lo maneja
    setPageError(null);
    setRolParaEditar(null);

    try {
      const resultado: ResultadoOperacion<ProjectRoleRow | null> = await obtenerDetallesRolProyecto(roleId, proyectoActual.id); 

      if (resultado.success) {
        if (resultado.data) {
          if (resultado.data.project_id !== proyectoActual.id) {
              setPageError("Error de consistencia: El rol consultado no pertenece al proyecto activo.");
              setRolParaEditar(null);
              sonnerToast.error("Error de Datos", { description: "El rol no pertenece a este proyecto." });
          } else {
              setRolParaEditar(resultado.data);
          }
        } else { 
          setPageError(`El rol con ID "${roleId}" no fue encontrado en el proyecto "${proyectoActual.name}".`);
          sonnerToast.warning("Rol no Encontrado", { description: `No se encontró el rol en el proyecto ${proyectoActual.name}.` });
        }
      } else { 
        setPageError(resultado.error || "Error al cargar los detalles del rol.");
        sonnerToast.error("Error al Cargar Rol", { description: resultado.error });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido.";
      setPageError(`Error inesperado: ${errorMessage}`);
      sonnerToast.error("Error Inesperado", { description: errorMessage });
      console.error("Error cargando detalles del rol:", err);
    } finally {
      setIsPageLoading(false);
    }
  }, [roleId, proyectoActual?.id, proyectoActual?.name]);

  useEffect(() => {
    // Este useEffect determina si se puede proceder a cargar el rol.
    // Se asume que `proyectoActual` de `useAuth` está disponible (o es null) sincrónicamente
    // después de la carga inicial de la app/layout.
    if (roleId && proyectoActual?.id) {
      // Si tenemos todo, procedemos a cargar, isPageLoading ya está true.
      cargarDetallesRol();
    } else {
      // Si falta algo crucial al inicio, terminamos la carga y establecemos error.
      setIsPageLoading(false); 
      if (!proyectoActual?.id) {
        setPageError("No hay un proyecto activo seleccionado.");
      } else if (!roleId) {
        setPageError("No se ha especificado un ID de rol para modificar.");
      }
    }
  }, [roleId, proyectoActual, cargarDetallesRol]); // Depender de proyectoActual completo

  const handleModificarRol = async (data: RolFormValues) => {
    if (!roleId || !proyectoActual?.id || !rolParaEditar) {
      sonnerToast.error("Error de Aplicación", { description: "Falta información crítica." });
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    const payload = {
      role_id: roleId,
      project_id: proyectoActual.id, 
      updates: { /* ...data... */
        role_name: data.role_name,
        role_description: data.role_description,
        can_manage_master_data: data.can_manage_master_data,
        can_create_batches: data.can_create_batches,
        can_upload_files: data.can_upload_files,
        can_bulk_edit_master_data: data.can_bulk_edit_master_data,
      },
    };
    
    const resultado: ResultadoOperacion<ProjectRoleRow> = await modificarRolEnProyecto(payload);

    if (resultado.success) {
      sonnerToast.success("Rol Actualizado", { description: `El rol "${data.role_name}" ha sido actualizado.` });
      router.push("/datos-maestros/roles"); 
    } else { 
      sonnerToast.error("Error al Modificar Rol", { description: resultado.error || "No se pudo actualizar." });
      setPageError(resultado.error);
    }
    setIsSubmitting(false);
  };

  // ------ RENDERIZADO CONDICIONAL ------
  if (isPageLoading) { // Solo este estado de carga para la página
    return ( <PageBackground> <SustratoLoadingLogo size={50} showText text="Cargando..." /> </PageBackground> );
  }

  // Los siguientes checks se hacen DESPUÉS de que isPageLoading es false.
  if (!proyectoActual?.id) {
    return ( <PageBackground > <ProCard className="max-w-md text-center">  <ProCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <AlertTriangle className="h-6 w-6 text-warning-600" /> </div> <PageTitle title="Proyecto Requerido" className="mt-4" /> </ProCard.Header> <ProCard.Content><Text>{pageError || "No hay un proyecto activo."}</Text></ProCard.Content> <ProCard.Footer> <Link href="/" passHref><CustomButton variant="outline">Ir a Inicio</CustomButton></Link> </ProCard.Footer> </ProCard> </PageBackground> );
  }
  
  if (!puedeGestionarRoles) { 
    return ( <PageBackground > <ProCard className="max-w-md text-center">   <ProCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <AlertTriangle className="h-6 w-6 text-warning-600" /> </div> <PageTitle title="Acceso Denegado" className="mt-4" /> </ProCard.Header> <ProCard.Content><Text>No tienes permisos para modificar roles en este proyecto.</Text></ProCard.Content> <ProCard.Footer> <Link href="/datos-maestros/roles" passHref><CustomButton variant="outline">Volver al Listado</CustomButton></Link> </ProCard.Footer> </ProCard> </PageBackground> );
  }
  
  if (pageError && !rolParaEditar) { 
    return ( <PageBackground > <ProCard className="max-w-md text-center">  <ProCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100"> <AlertTriangle className="h-6 w-6 text-danger-600" /> </div> <PageTitle title="Error al Cargar Rol" className="mt-4" /> </ProCard.Header> <ProCard.Content><Text>{pageError}</Text></ProCard.Content> <ProCard.Footer> <Link href="/datos-maestros/roles" passHref><CustomButton variant="outline">Volver al Listado</CustomButton></Link> </ProCard.Footer> </ProCard> </PageBackground> );
  }

  if (!rolParaEditar) { 
    return ( <PageBackground > <ProCard className="max-w-md text-center">  <ProCard.Header><PageTitle title="Rol no Encontrado" /></ProCard.Header> <ProCard.Content><Text>{pageError || "No se encontraron datos para el rol especificado."}</Text></ProCard.Content> <ProCard.Footer> <Link href="/datos-maestros/roles" passHref><CustomButton variant="outline">Volver al Listado</CustomButton></Link> </ProCard.Footer> </ProCard> </PageBackground> );
  }

  const valoresInicialesParaForm: RolFormValues = {
    role_name: rolParaEditar.role_name,
    role_description: rolParaEditar.role_description,
    can_manage_master_data: rolParaEditar.can_manage_master_data,
    can_create_batches: rolParaEditar.can_create_batches,
    can_upload_files: rolParaEditar.can_upload_files,
    can_bulk_edit_master_data: rolParaEditar.can_bulk_edit_master_data,
  };

  return (
    <PageBackground>
      <div className="container mx-auto py-6">
      <PageTitle
              title={`Modificar Rol: ${rolParaEditar.role_name}`}
              subtitle={`Actualiza los permisos para este rol en el proyecto "${proyectoActual.name}"`}
              mainIcon={ShieldCheck}
              breadcrumbs={[
                { label: "Datos Maestros", href: "/datos-maestros" },
                { label: "Roles", href: "/datos-maestros/roles" },
                { label: rolParaEditar.role_name, href: `/datos-maestros/roles/${roleId}/ver` },
                { label: "Modificar" }
              ]}
              showBackButton={{ href: `/datos-maestros/roles` }}
            />
        <ProCard border="top" color="primary">
        
          <ProCard.Content>
            {pageError && rolParaEditar && ( 
              <div className="mb-4 p-3 text-sm text-destructive-foreground border border-destructive bg-destructive/10 rounded-md">
                <div className="flex items-center gap-2"> <AlertTriangle className="h-5 w-5"/> <span>{pageError}</span> </div>
              </div>
            )}
            <RolForm
              modo="editar"
              valoresIniciales={valoresInicialesParaForm}
              onSubmit={handleModificarRol}
              isEditingForm={true}
              loading={isSubmitting}
            />
          </ProCard.Content>
        </ProCard>
      </div>
    </PageBackground>
  );
}