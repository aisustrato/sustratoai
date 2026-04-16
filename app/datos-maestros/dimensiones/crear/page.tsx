//. 📍 app/datos-maestros/dimensiones/crear/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  createDimension,
  type CreateDimensionPayload, // Usaremos este tipo que ya definimos
  type ResultadoOperacion,
  type PreclassDimensionRow // Para el tipo de retorno de la action
} from "@/lib/actions/dimension-actions";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { AlertTriangle, ArrowLeft, PlusCircle } from "lucide-react"; // LayoutGrid para dimensiones
import {
  DimensionForm,
  type DimensionFormValues,
} from "../components/DimensionForm"; // Ajusta la ruta si es necesario
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext"; // Opcional
//#endregion ![head]

// No specific types defined directly in this file, they are imported.
// //#region [def] - 📦 TYPES 📦
// //#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function CrearDimensionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { proyectoActual, loadingProyectos } = useAuth();
  
  // Obtener la fase activa desde la URL
  const activePhaseId = searchParams.get('phase') || '';
  //#region [sub] - 🧰 HELPER FUNCTIONS & LOGIC 🧰
  const { showLoading, hideLoading } = useLoading() as {
    showLoading?: (message: string) => void;
    hideLoading?: () => void;
  }; // Opcional

  const [isSubmitting, setIsSubmitting] = useState(false);
  // No necesitamos un estado de 'isPageLoading' complejo aquí,
  // solo verificar si proyectoActual está disponible.
  const [errorPage, setErrorPage] = useState<string | null>(null);
  
  const puedeGestionarDimensiones =
    proyectoActual?.permissions?.can_manage_master_data || false;

  useEffect(() => {
    if (!loadingProyectos && !proyectoActual?.id) {
      setErrorPage("No hay un proyecto activo seleccionado. Por favor, selecciona uno para continuar.");
      // Opcionalmente, redirigir si no hay proyecto y no se puede crear
      // router.replace("/datos-maestros/dimensiones");
    } else if (!loadingProyectos && proyectoActual?.id && !puedeGestionarDimensiones) {
      setErrorPage("No tienes permisos para crear dimensiones en este proyecto.");
      sonnerToast.error("Acceso Denegado", { description: "No tienes los permisos necesarios."});
      router.replace("/datos-maestros/dimensiones");
    }
     else {
      setErrorPage(null);
    }
    // sonnerToast es un import de módulo, no necesita estar en las dependencias
  }, [proyectoActual, loadingProyectos, puedeGestionarDimensiones, router]);

  const handleFormSubmit = async (data: DimensionFormValues) => {
    if (!proyectoActual?.id) {
      sonnerToast.error("Error de Aplicación", {
        description: "No hay un proyecto activo seleccionado.",
      });
      return;
    }
    if (!puedeGestionarDimensiones) {
      sonnerToast.error("Acceso Denegado", { description: "No tienes permisos para crear dimensiones." });
      return;
    }

    setIsSubmitting(true);
    showLoading?.("Creando dimensión...");

    // Necesitamos determinar el 'ordering' para la nueva dimensión.
    // Esto podría venir de una llamada para contar dimensiones existentes o un valor por defecto.
    // Por ahora, asumiremos un valor (ej. 0 o se manejará en la action si es incremental).
    // O, mejor, la action `listDimensions` podría devolver el count, y lo usamos aquí,
    // pero para simplificar la creación inicial, la action `createDimension` podría asignarle un `ordering` alto.
    // O, si `ordering` lo gestiona el usuario en un futuro (drag-and-drop), podría ser 0.
    // Para este ejemplo, lo dejaremos a la action o un default, el formulario no pide `ordering`.
    // La action `createDimension` sí espera un `ordering` en el payload.
    // SOLUCIÓN TEMPORAL: Enviar un `ordering` provisional, la action lo puede recalcular.
    // O MEJOR: la action `createDimension` debería calcular el próximo `ordering` basado en las existentes.
    // VOY A MODIFICAR CreateDimensionPayload para que ordering sea opcional y la action lo calcule si no se provee.

    const payload: CreateDimensionPayload = {
      projectId: proyectoActual.id,
      phaseId: data.phaseId, // Incluir el phaseId del formulario
      name: data.name,
      type: data.type,
      description: data.description || null,
      icon: data.icon || null, // ✅ Incluir icon
      ordering: 0, // Por ahora, un valor por defecto. La action podría manejar esto.
      options: data.options || [],
      questions: data.questions || [],
      examples: data.examples || [],
    };

    let resultado: ResultadoOperacion<PreclassDimensionRow> | null = null;

    try {
      resultado = await createDimension(payload);
    } catch (err) {
      console.error("Excepción al llamar a createDimension:", err);
      hideLoading?.();
      setIsSubmitting(false);
      sonnerToast.error("Error Inesperado", {
        description: `Ocurrió un error al procesar la solicitud: ${(err as Error).message}`,
      });
      return;
    }

    if (typeof hideLoading === 'function') hideLoading();

    if (resultado?.success) {
      sonnerToast.success("Dimensión Creada", {
        description: `La dimensión "${data.name}" ha sido creada exitosamente.`,
        duration: 4000,
      });
      // Retrasar la redirección para que el toast sea visible
      setTimeout(() => {
        router.push("/datos-maestros/dimensiones"); // Volver a la lista
      }, 1500);
    } else {
      sonnerToast.error("Error al Crear Dimensión", {
        description: resultado?.error || "Ocurrió un error desconocido.",
        // Podríamos mostrar errorCode si existe: resultado?.errorCode
      });
      setIsSubmitting(false); // Permitir reintentar solo si falla
    }
    // No setear isSubmitting a false aquí si fue exitoso, porque la redirección ocurrirá.
    // Se setea a false arriba si falla.
  };

  const handleVolver = () => {
    router.push("/datos-maestros/dimensiones");
  };
  //#endregion ![sub]
  
  //#region [render] - 🎨 RENDER SECTION 🎨
  if (loadingProyectos && !proyectoActual?.id) {
    return (
      <div>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text="Verificando proyecto y permisos..." />
        </div>
      </div>
    );
  }

  if (errorPage) {
    return (
      <div>
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
            <StandardCard
                colorScheme="primary" // Rule: Inner card
                accentPlacement="none" // Rule: Inner card
                hasOutline={false} // Rule: Inner card
                shadow="none" // Rule: Inner card
                disableShadowHover={true} // Rule: Inner card
                styleType="subtle"
                className="max-w-lg w-full" // Keep existing layout class
                // styleType removed
            >
                <StandardCard.Header className="items-center flex flex-col text-center">
                    <StandardIcon><AlertTriangle className="h-12 w-12 text-danger-fg mb-4" /></StandardIcon>
                    <StandardText preset="subheading" weight="bold" colorScheme="danger">
                        {puedeGestionarDimensiones ? "Error de Configuración" : "Acceso Denegado"}
                    </StandardText>
                </StandardCard.Header>
                <StandardCard.Content className="text-center">
                    <StandardText>{errorPage}</StandardText>
                </StandardCard.Content>
                <StandardCard.Footer className="flex justify-center">
                     <StandardButton
                        onClick={handleVolver}
                        styleType="outline"
                        colorScheme="danger"
                        leftIcon={ArrowLeft}
                    >
                        Volver a Dimensiones
                    </StandardButton>
                </StandardCard.Footer>
            </StandardCard>
        </div>
      </div>
    );
  }
  
  if (!proyectoActual?.id || !puedeGestionarDimensiones) {
    // Este caso debería ser cubierto por errorPage, pero como fallback:
    return (
         <div>
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StandardText>Cargando o acceso no permitido...</StandardText>
            </div>
        </div>
    );
  }


  return (
    <div>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto"> {/* Centrar y limitar ancho del contenido del formulario */}
          <StandardPageTitle
            title="Crear Dimensión"
            subtitle="Agrega una nueva dimensión para clasificar los artículos"
            mainIcon={PlusCircle} // Icono para creación
            showBackButton={{ href: "/datos-maestros/dimensiones" }}
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Dimensiones", href: "/datos-maestros/dimensiones" },
              { label: "Crear Dimensión" },
            ]}
          />

          <StandardCard
            className="mt-6"
            accentPlacement="top"
            colorScheme="secondary" // Rule: Main form card colorScheme is secondary
            accentColorScheme="primary" // Rule: Main form card accent for create/edit is primary
            shadow="md" // Rule: Main form card shadow is md by default
            disableShadowHover={true}
            styleType="subtle"
            // styleType and hasOutline removed to use default or theme-defined values
          >
            <DimensionForm
              modo="crear"
              // No se pasan valoresIniciales para "crear", el form usa sus defaults.
              onSubmit={handleFormSubmit}
              loading={isSubmitting}
              activePhaseId={activePhaseId}
            />
          </StandardCard>
        </div>
      </div>
    </div>
  );
  //#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar la gestión del 'ordering' de forma más robusta.
// Mejorar la experiencia de usuario durante la carga y redirección.
//#endregion ![todo]