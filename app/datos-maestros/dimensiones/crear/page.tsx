// app/datos-maestros/dimensiones/crear/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  createDimension,
  type CreateDimensionPayload, // Usaremos este tipo que ya definimos
  type ResultadoOperacion,
  type PreclassDimensionRow // Para el tipo de retorno de la action
} from "@/lib/actions/dimension-actions";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { CustomButton } from "@/components/ui/custom-button";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { AlertTriangle, ArrowLeft, LayoutGrid, PlusCircle } from "lucide-react"; // LayoutGrid para dimensiones
import {
  DimensionForm,
  type DimensionFormValues,
} from "../components/DimensionForm"; // Ajusta la ruta si es necesario
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext"; // Opcional

export default function CrearDimensionPage() {
  const router = useRouter();
  const { proyectoActual, loadingProyectos } = useAuth();
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
  }, [proyectoActual, loadingProyectos, puedeGestionarDimensiones, router, sonnerToast]);

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
      name: data.name,
      type: data.type,
      description: data.description || null,
      ordering: 0, // Placeholder - la action debería recalcular esto basado en las existentes.
                   // O el frontend debería obtener el count de dimensiones y pasar count + 1.
                   // Modifiqué la action para que reciba y use `ordering`.
      options: data.type === "finite" ? (data.options || []) : [],
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
  
  if (loadingProyectos && !proyectoActual?.id) {
    return (
      <PageBackground>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text="Cargando proyecto..." />
        </div>
      </PageBackground>
    );
  }

  if (errorPage) {
    return (
      <PageBackground>
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
            <ProCard variant="danger" className="max-w-lg w-full">
                <ProCard.Header className="items-center flex flex-col text-center">
                    <AlertTriangle className="h-12 w-12 text-danger-fg mb-4" />
                    <Text variant="subheading" weight="bold" color="danger">
                        {puedeGestionarDimensiones ? "Error de Configuración" : "Acceso Denegado"}
                    </Text>
                </ProCard.Header>
                <ProCard.Content className="text-center">
                    <Text>{errorPage}</Text>
                </ProCard.Content>
                <ProCard.Footer className="flex justify-center">
                     <CustomButton
                        onClick={handleVolver}
                        leftIcon={<ArrowLeft className="h-4 w-4" />}
                        variant="outline"
                        color="danger"
                    >
                        Volver a Dimensiones
                    </CustomButton>
                </ProCard.Footer>
            </ProCard>
        </div>
      </PageBackground>
    );
  }
  
  if (!proyectoActual?.id || !puedeGestionarDimensiones) {
    // Este caso debería ser cubierto por errorPage, pero como fallback:
    return (
         <PageBackground>
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text>Cargando o acceso no permitido...</Text>
            </div>
        </PageBackground>
    );
  }


  return (
    <PageBackground>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto"> {/* Centrar y limitar ancho del contenido del formulario */}
          <PageTitle
            title="Crear Nueva Dimensión"
            subtitle="Define una nueva dimensión para la pre-clasificación de artículos en tu proyecto."
            mainIcon={PlusCircle} // Icono para creación
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Dimensiones", href: "/datos-maestros/dimensiones" },
              { label: "Crear" },
            ]}
            showBackButton={{ href: "/datos-maestros/dimensiones" }}
          />

          <ProCard className="mt-6" border="top" color="primary" shadow="lg">
            <DimensionForm
              modo="crear"
              // No se pasan valoresIniciales para "crear", el form usa sus defaults.
              onSubmit={handleFormSubmit}
              loading={isSubmitting}
            />
          </ProCard>
        </div>
      </div>
    </PageBackground>
  );
}