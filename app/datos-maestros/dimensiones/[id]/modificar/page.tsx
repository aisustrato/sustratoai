// app/datos-maestros/dimensiones/[id]/modificar/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  listDimensions,
  updateDimension,
  type FullDimension,
  type UpdateDimensionPayload,
  type ResultadoOperacion,
  type PreclassDimensionRow
} from "@/lib/actions/dimension-actions"; // Asegúrate que estas exportaciones sean correctas
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { CustomButton } from "@/components/ui/custom-button";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text } from "@/components/ui/text";
import { AlertTriangle, ArrowLeft, Edit } from "lucide-react";
import {
  DimensionForm,
  type DimensionFormValues,
} from "../../components/DimensionForm"; // Doble check a la ruta
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext";

export default function ModificarDimensionPage() {
  const router = useRouter();
  const params = useParams();
  const dimensionId = params?.id ? String(params.id) : "";

  const { proyectoActual, loadingProyectos } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const [dimensionActual, setDimensionActual] = useState<FullDimension | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorPage, setErrorPage] = useState<string | null>(null);

  const puedeGestionarDimensiones =
    proyectoActual?.permissions?.can_manage_master_data || false;

  const cargarDimension = useCallback(async () => {
    // Validaciones tempranas
    if (!proyectoActual?.id || !dimensionId) {
      if (!loadingProyectos) { // Solo mostrar error si la carga de proyectos ya terminó
        setErrorPage(!dimensionId ? "ID de dimensión no especificado." : "Proyecto no seleccionado.");
      }
      setIsPageLoading(false);
      setDimensionActual(null); // Asegurar que se limpie
      return;
    }
     if (!puedeGestionarDimensiones && !loadingProyectos) { // Si ya sabemos que no tiene permiso
        setErrorPage("No tienes permisos para modificar dimensiones en este proyecto.");
        sonnerToast.error("Acceso Denegado", { description: "No tienes los permisos necesarios." });
        router.replace("/datos-maestros/dimensiones");
        setIsPageLoading(false);
        return;
    }


    setIsPageLoading(true);
    setErrorPage(null);
    setDimensionActual(null); // Resetear antes de cargar

    try {
      const resultado = await listDimensions(proyectoActual.id); // Asume que RLS protege esto para el proyectoActual
      if (resultado.success) {
        const dim = resultado.data.find(d => d.id === dimensionId);
        if (dim) {
          setDimensionActual(dim);
        } else {
          setErrorPage(`Dimensión con ID "${dimensionId}" no encontrada en el proyecto "${proyectoActual.name}".`);
          // sonnerToast.error("Error", { description: "Dimensión no encontrada." }); // Podría ser muy ruidoso si el ID es incorrecto en URL
        }
      } else {
        setErrorPage(resultado.error || "Error al cargar la dimensión.");
        // sonnerToast.error("Error al Cargar", { description: resultado.error });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido.";
      setErrorPage(`Error inesperado al cargar la dimensión: ${errorMsg}`);
      // sonnerToast.error("Error Inesperado", { description: errorMsg });
    } finally {
      setIsPageLoading(false);
    }
  }, [proyectoActual?.id, dimensionId, loadingProyectos, puedeGestionarDimensiones, router]); // router añadido como dep si se usa

  useEffect(() => {
    // Disparar carga solo si tenemos la información necesaria o si la carga de proyectos ha terminado
    if ((proyectoActual?.id && dimensionId) || !loadingProyectos) {
      cargarDimension();
    }
  }, [proyectoActual?.id, dimensionId,    loadingProyectos, cargarDimension]);


  const handleFormSubmit = async (data: DimensionFormValues) => {
    if (!proyectoActual?.id || !dimensionId || !dimensionActual) {
      sonnerToast.error("Error de Aplicación", { description: "Faltan datos esenciales para la actualización." });
      return;
    }
     if (!puedeGestionarDimensiones) {
      sonnerToast.error("Acceso Denegado", { description: "No tienes permisos para modificar dimensiones." });
      return;
    }

    setIsSubmitting(true);
    if (typeof showLoading === 'function') showLoading("Actualizando dimensión...");

    const payload: UpdateDimensionPayload = {
      dimensionId,
      projectId: proyectoActual.id,
      name: data.name !== dimensionActual.name ? data.name : undefined, // Enviar solo si cambió
      description: data.description !== (dimensionActual.description || "") ? (data.description || null) : undefined, // Enviar solo si cambió
      // No se actualiza el tipo: type: data.type,
      // No se actualiza el ordering principal aquí: ordering: dimensionActual.ordering,
      
      // Para options, questions, examples, necesitamos enviar el array completo como está en el formulario
      // La action `updateDimension` se encarga de la lógica de diffing (add/update/delete)
      options: data.type === "finite" 
        ? (data.options || []).map(opt => ({ 
            id: opt.id || undefined, // Asegurar que los nuevos no tengan ID
            value: opt.value, 
            ordering: opt.ordering 
          })) 
        : [], // Si el tipo es 'open' o cambió a 'open', enviar array vacío para borrar opciones.
      questions: (data.questions || []).map(q => ({ 
          id: q.id || undefined, 
          question: q.question, 
          ordering: q.ordering 
        })),
      examples: (data.examples || []).map(ex => ({ 
          id: ex.id || undefined, 
          example: ex.example 
        })),
    };
    
    // Filtrar campos undefined del payload principal para no enviarlos si no cambiaron
    const cleanPayload: UpdateDimensionPayload = { dimensionId, projectId: proyectoActual.id };
    if (payload.name !== undefined) cleanPayload.name = payload.name;
    if (payload.description !== undefined) cleanPayload.description = payload.description;
    if (payload.options !== undefined) cleanPayload.options = payload.options;
    if (payload.questions !== undefined) cleanPayload.questions = payload.questions;
    if (payload.examples !== undefined) cleanPayload.examples = payload.examples;


    let resultado: ResultadoOperacion<PreclassDimensionRow> | null = null;
    try {
      resultado = await updateDimension(cleanPayload); // Usar cleanPayload
    } catch (err) {
      if (typeof hideLoading === 'function') hideLoading();
      setIsSubmitting(false);
      sonnerToast.error("Error Inesperado", { description: `Error al procesar la actualización: ${(err as Error).message}` });
      return;
    }

    if (typeof hideLoading === 'function') hideLoading();

    if (resultado?.success) {
      sonnerToast.success("Dimensión Actualizada", {
        description: `La dimensión "${resultado.data.name}" ha sido actualizada correctamente.`, // Usar nombre del resultado
        duration: 4000,
      });
      // Opcional: Recargar datos para reflejar cambios si no se redirige inmediatamente
      // cargarDimension(); 
      // setIsSubmitting(false);
      setTimeout(() => {
        router.push("/datos-maestros/dimensiones");
      }, 1500);
    } else {
      sonnerToast.error("Error al Actualizar", { description: resultado?.error || "Ocurrió un error desconocido durante la actualización." });
      setIsSubmitting(false);
    }
  };
  
  const handleVolver = () => router.push("/datos-maestros/dimensiones");

  // Mapeo cuidadoso de FullDimension a DimensionFormValues
  const valoresFormIniciales: DimensionFormValues | undefined = dimensionActual ? {
    name: dimensionActual.name,
    type: dimensionActual.type as 'finite' | 'open', // Esto es un cast, asegurar que el tipo sea uno de los dos
    description: dimensionActual.description || "", // El form usa string vacío para null/undefined en description
    options: dimensionActual.options.map(o => ({ 
        id: o.id, // Pasar el id original
        value: o.value, 
        ordering: o.ordering 
    })),
    questions: dimensionActual.questions.map(q => ({
        id: q.id, // Pasar el id original
        question: q.question, 
        ordering: q.ordering 
    })),
    examples: dimensionActual.examples.map(e => ({ 
        id: e.id, // Pasar el id original
        example: e.example 
        // exampleSchema no tiene ordering, así que no se mapea aquí
    })),
  } : undefined;


  if (isPageLoading || (loadingProyectos && !dimensionActual && !errorPage)) {
    return (
      <PageBackground>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text="Cargando datos de la dimensión..." />
        </div>
      </PageBackground>
    );
  }

  if (errorPage) {
     return (
      <PageBackground>
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
            <StandardCard
                colorScheme="danger"
                className="max-w-lg w-full"
                styleType="subtle"
                hasOutline={false} // No border prop originally
                accentPlacement="none" // No border prop originally
            >
                <StandardCard.Header className="items-center flex flex-col text-center">
                    <AlertTriangle className="h-12 w-12 text-danger-fg mb-4" />
                    <Text variant="subheading" weight="bold" color="danger">
                        Error
                    </Text>
                </StandardCard.Header>
                <StandardCard.Content className="text-center"><Text>{errorPage}</Text></StandardCard.Content>
                <StandardCard.Footer className="flex justify-center">
                     <CustomButton onClick={handleVolver} leftIcon={<ArrowLeft />} variant="outline" color="danger">
                        Volver a Dimensiones
                    </CustomButton>
                </StandardCard.Footer>
            </StandardCard>
        </div>
      </PageBackground>
    );
  }
  
  if (!dimensionActual || !valoresFormIniciales) {
    // Si llegamos aquí y no hay errorPage, pero tampoco dimensión, es un estado inesperado.
    // Esto podría pasar si cargarDimension() termina sin setear errorPage pero tampoco dimensionActual.
    return (
        <PageBackground>
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StandardCard
                    colorScheme="warning"
                    className="text-center p-6"
                    styleType="subtle"
                    hasOutline={false} // No border prop originally
                    accentPlacement="none" // No border prop originally
                >
                    <Text variant="subheading">Dimensión no disponible</Text>
                    <Text color="muted" className="mt-2">No se pudo cargar la información de la dimensión. Intenta volver a la lista.</Text>
                     <CustomButton onClick={handleVolver} leftIcon={<ArrowLeft />} variant="outline" className="mt-4">
                        Volver a Dimensiones
                    </CustomButton>
                </StandardCard>
            </div>
        </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <PageTitle
            title={`Modificar Dimensión: ${dimensionActual.name}`}
            subtitle="Actualiza los detalles de esta dimensión de clasificación."
            mainIcon={Edit}
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Dimensiones", href: "/datos-maestros/dimensiones" },
              { label: "Modificar" },
            ]}
            showBackButton={{ href: "/datos-maestros/dimensiones" }}
          />

          <StandardCard
            className="mt-6"
            accentPlacement="top"
            colorScheme="secondary" // Mapped from ProCard's color="secondary"
            accentColorScheme="secondary" // Derived from colorScheme
            shadow="lg"
            styleType="subtle"
            hasOutline={false} // border="top" implies no full outline
          >
            <DimensionForm
              modo="editar"
              valoresIniciales={valoresFormIniciales}
              onSubmit={handleFormSubmit}
              loading={isSubmitting}
            />
          </StandardCard>
        </div>
      </div>
    </PageBackground>
  );
}