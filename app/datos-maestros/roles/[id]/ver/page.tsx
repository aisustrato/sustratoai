//. 📍 app/datos-maestros/roles/[id]/ver/page.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider"; //> 📝 Solo necesitamos proyectoActual
import { RolForm } from "../../components/RolForm"; 
import { 
    obtenerDetallesRolProyecto,
    type ProjectRoleRow,
    type ResultadoOperacion 
} from "@/lib/actions/proyect-role-actions";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { ShieldCheck, AlertTriangle, PenLine, Trash2 } from "lucide-react";
import { toast as sonnerToast } from "sonner"; //> 📝 sonnerToast no se usa aquí, pero lo dejo por si acaso
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
//> 📝 No local types defined in this file, types are imported.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function VerRolPage() {
  const router = useRouter();
  const params = useParams(); 
  const { proyectoActual } = useAuth(); //> 📝 CORRECCIÓN: Eliminado isLoading de aquí
  
  const roleId = (params && typeof params.id === "string") ? params.id : null;

  const [rolVisualizado, setRolVisualizado] = useState<ProjectRoleRow | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const puedeGestionarRoles = proyectoActual?.permissions?.can_manage_master_data || false;

  //#region [sub] - 🧰 HELPER FUNCTIONS 🧰
  const cargarDetallesRol = useCallback(async () => {
    if (!roleId || !proyectoActual?.id) {
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(true); //> 📝 Iniciar carga de datos del rol
    setPageError(null);
    setRolVisualizado(null);

    try {
      const resultado: ResultadoOperacion<ProjectRoleRow | null> = await obtenerDetallesRolProyecto(roleId, proyectoActual.id); 

      if (resultado.success) {
        if (resultado.data) {
          if (resultado.data.project_id !== proyectoActual.id) {
              setPageError("Error de consistencia: El rol consultado no pertenece al proyecto activo.");
              setRolVisualizado(null);
              sonnerToast.error("Error de Datos", { description: "El rol no pertenece a este proyecto." }); //> 📝 Mantener toast si es útil
          } else {
              setRolVisualizado(resultado.data);
          }
        } else { 
          setPageError(`El rol con ID "${roleId}" no fue encontrado en el proyecto "${proyectoActual.name}".`);
          sonnerToast.warning("Rol no Encontrado", { description: `No se encontró el rol en el proyecto ${proyectoActual.name}.` }); //> 📝 Mantener toast
        }
      } else { 
        setPageError(resultado.error || "Error al cargar los detalles del rol.");
        sonnerToast.error("Error al Cargar Rol", { description: resultado.error }); //> 📝 Mantener toast
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
    //> 📝 La lógica aquí asume que `proyectoActual` se resuelve (a un objeto o null) sincrónicamente
    //> 📝 después del ciclo de vida inicial del hook `useAuth`.
    //> 📝 Si `useAuth` tuviera un estado de carga propio, lo necesitaríamos aquí.
    //> 📝 Como no lo tiene (según el error), procedemos directamente.
    if (roleId && proyectoActual?.id) {
      setIsPageLoading(true); //> 📝 Asegurar que isPageLoading esté true antes de cargar
      cargarDetallesRol();
    } else {
      setIsPageLoading(false); 
      if (!proyectoActual?.id) {
        setPageError("No hay un proyecto activo seleccionado.");
      } else if (!roleId) {
        setPageError("No se ha especificado un ID de rol para visualizar.");
      }
    }
  }, [roleId, proyectoActual, cargarDetallesRol]);
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  //> 📝 ------ RENDERIZADO CONDICIONAL ------
  if (isPageLoading) { 
    return ( <StandardPageBackground variant="default"> <SustratoLoadingLogo size={50} showText text="Cargando detalles del rol..." /> </StandardPageBackground> );
  }

  if (!proyectoActual?.id) {
    return ( <StandardPageBackground variant="default"> <StandardCard className="max-w-md text-center" styleType="subtle" hasOutline={false} accentPlacement="none" disableShadowHover={true}> <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100"> <StandardIcon colorScheme="warning" size="md"><AlertTriangle /></StandardIcon> </div> <StandardPageTitle title="Proyecto Requerido" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><StandardText>{pageError || "No hay un proyecto activo."}</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/" passHref><StandardButton styleType="outline">Ir a Inicio</StandardButton></Link> </StandardCard.Footer> </StandardCard> </StandardPageBackground> );
  }
  
  //> 📝 Para "ver", el permiso de gestión no es estrictamente necesario para ver el formulario en modo readOnly.
  //> 📝 La RLS en la action `obtenerDetallesRolProyecto` debería controlar si se pueden ver los datos.
  //> 📝 `puedeGestionarRoles` se usa solo para los botones de acción (Editar/Eliminar).

  if (pageError && !rolVisualizado) { 
    return ( <StandardPageBackground variant="default"> <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card for info/error block
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        > <StandardCard.Header> <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100"> <StandardIcon colorScheme="danger" size="md"><AlertTriangle /></StandardIcon> </div> <StandardPageTitle title="Error al Cargar Rol" className="mt-4" /> </StandardCard.Header> <StandardCard.Content><StandardText>{pageError}</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><StandardButton styleType="outline">Volver al Listado</StandardButton></Link> </StandardCard.Footer> </StandardCard> </StandardPageBackground> );
  }

  if (!rolVisualizado) { 
    return ( <StandardPageBackground variant="default"> <StandardCard 
          styleType="subtle"
          className="max-w-md text-center" 
          colorScheme="primary" // Rule: Inner card for info/error block
          accentPlacement="none" // Rule: Inner card
          hasOutline={false} // Rule: Inner card
          shadow="none" // Rule: Inner card
          disableShadowHover={true} // Rule: Inner card
        > <StandardCard.Header><StandardPageTitle title="Rol no Encontrado" /></StandardCard.Header> <StandardCard.Content><StandardText>{pageError || "No se encontraron datos para el rol especificado."}</StandardText></StandardCard.Content> <StandardCard.Footer> <Link href="/datos-maestros/roles" passHref><StandardButton styleType="outline">Volver al Listado</StandardButton></Link> </StandardCard.Footer> </StandardCard> </StandardPageBackground> );
  }

  return (
    <StandardPageBackground variant="default">
      <div className="container mx-auto py-6">
      <StandardPageTitle
              title={`Detalle del Rol: ${rolVisualizado.role_name}`}
              subtitle={`Visualizando los permisos asignados a este rol en el proyecto "${proyectoActual.name}"`}
              mainIcon={ShieldCheck}
              breadcrumbs={[
                { label: "Datos Maestros", href: "/datos-maestros" },
                { label: "Roles", href: "/datos-maestros/roles" },
                { label: rolVisualizado.role_name } 
              ]}
              showBackButton={{ href: "/datos-maestros/roles" }}
            />
        <StandardCard
            colorScheme="secondary" // Rule: Main form card colorScheme is secondary
            accentPlacement="top" // Rule: Main form card accentPlacement is top
            accentColorScheme="neutral" // Rule: Main form card accent for VIEW is neutral
            shadow="md" // Rule: Main form card shadow is md by default
            disableShadowHover={true}
            styleType="subtle"
            // styleType and hasOutline removed
        >
        
          <StandardCard.Content>
            <RolForm
              modo="ver" 
              valoresIniciales={rolVisualizado}
            />
          </StandardCard.Content>
          <StandardCard.Footer className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6">
            {puedeGestionarRoles && ( //> 📝 Botones de acción solo si tiene permisos
              <>
                <StandardButton 
                  styleType="outline" 
                  colorScheme="secondary"
                  leftIcon={PenLine}
                  onClick={() => router.push(`/datos-maestros/roles/${roleId}/modificar`)}
                >
                  Modificar Rol
                </StandardButton>
                <StandardButton 
                  styleType="outline" 
                  colorScheme="danger"
                  leftIcon={Trash2}
                  onClick={() => router.push(`/datos-maestros/roles/${roleId}/eliminar`)}
                >
                  Eliminar Rol
                </StandardButton>
              </>
            )}
          </StandardCard.Footer>
        </StandardCard>
      </div>
    </StandardPageBackground>
  );
  //#endregion ![render]

  //#region [todo] - 👀 PENDIENTES 👀
  // ! ❌ Considerar si hay tareas pendientes específicas para esta página.
  //#endregion ![todo]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the [main] component definition.
//#endregion ![foo]