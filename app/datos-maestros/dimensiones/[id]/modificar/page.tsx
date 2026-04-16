//. 📍 app/datos-maestros/dimensiones/[id]/modificar/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  listDimensions,
  updateDimension,
  type FullDimension,
  type UpdateDimensionPayload,
  type ResultadoOperacion,
  type PreclassDimensionRow
} from "@/lib/actions/dimension-actions"; // Asegúrate que estas exportaciones sean correctas
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { AlertTriangle, ArrowLeft, Edit } from "lucide-react";
import {
  DimensionForm,
  type DimensionFormValues,
} from "../../components/DimensionForm"; // Doble check a la ruta
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types defined directly in this file.
// Types are imported or inferred.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function ModificarDimensionPage() {
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HELPER FUNCTIONS 🧰
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dimensionId = params?.id ? String(params.id) : "";
  
  // Obtener la fase activa desde la URL
  const activePhaseId = searchParams.get('phase') || '';

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
    if (!proyectoActual?.id || !dimensionId || !activePhaseId) {
      if (!loadingProyectos) { // Solo mostrar error si la carga de proyectos ya terminó
        setErrorPage(!dimensionId ? "ID de dimensión no especificado." : !activePhaseId ? "Fase no especificada." : "Proyecto no seleccionado.");
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
      const resultado = await listDimensions(activePhaseId); // Usar phaseId en lugar de projectId
      if (resultado.success) {
        const dim = resultado.data.find(d => d.id === dimensionId);
        if (dim) {
          setDimensionActual(dim);
        } else {
          setErrorPage(`Dimensión con ID "${dimensionId}" no encontrada en la fase activa.`);
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
  }, [proyectoActual?.id, activePhaseId, dimensionId, loadingProyectos, puedeGestionarDimensiones, router]);

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
      icon: data.icon !== dimensionActual.icon ? (data.icon || null) : undefined, // ✅ Enviar icon si cambió
      // No se actualiza el tipo: type: data.type,
      // No se actualiza el ordering principal aquí: ordering: dimensionActual.ordering,
      
      // Para options, questions, examples, necesitamos enviar el array completo como está en el formulario
      // La action `updateDimension` se encarga de la lógica de diffing (add/update/delete)
      options: data.type === "finite" 
        ? (data.options || []).map(opt => ({ 
            id: opt.id || undefined, // Asegurar que los nuevos no tengan ID
            value: opt.value, 
            ordering: opt.ordering,
            emoticon: opt.emoticon || null // ✅ Incluir emoticon
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
    if (payload.icon !== undefined) cleanPayload.icon = payload.icon; // ✅ Incluir icon en cleanPayload
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
    phaseId: dimensionActual.phase_id || activePhaseId, // Incluir el phaseId de la dimensión, usar activePhaseId como fallback
    type: dimensionActual.type as 'finite' | 'open', // Esto es un cast, asegurar que el tipo sea uno de los dos
    description: dimensionActual.description || "", // El form usa string vacío para null/undefined en description
    icon: dimensionActual.icon || "", // ✅ Incluir icon
    options: dimensionActual.options.map(o => ({ 
        id: o.id, // Pasar el id original
        value: o.value, 
        ordering: o.ordering ?? 0, // ✅ Manejar null
        emoticon: o.emoticon || "" // ✅ Incluir emoticon
    })),
    questions: dimensionActual.questions.map(q => ({
        id: q.id, // Pasar el id original
        question: q.question, 
        ordering: q.ordering ?? 0 // ✅ Manejar null
    })),
    examples: dimensionActual.examples.map(e => ({ 
        id: e.id, // Pasar el id original
        example: e.example 
        // exampleSchema no tiene ordering, así que no se mapea aquí
    })),
  } : undefined;
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨


  if (isPageLoading || (loadingProyectos && !dimensionActual && !errorPage)) {
    return (
      <div>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text="Cargando datos de la dimensión..." />
        </div>
      </div>
    );
  }

  if (errorPage) {
     return (
      <div>
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
            <StandardCard
                colorScheme="danger" // Rule: Error card colorScheme is danger
                accentPlacement="none" // Rule: Error card accent is none
                hasOutline={false} // Rule: Error card has no outline
                shadow="none" // Rule: Error card has no shadow
                disableShadowHover={true} // Rule: Error card shadow hover is disabled
                className="max-w-lg w-full"
                // styleType removed
            >
                <StandardCard.Header className="items-center flex flex-col text-center">
                    <StandardIcon><AlertTriangle className="h-12 w-12 text-danger-fg mb-4" /></StandardIcon>
                    <StandardText preset="subheading" weight="bold" colorScheme="danger">
                      Error
                    </StandardText>
                </StandardCard.Header>
                <StandardCard.Content className="text-center"><StandardText>{errorPage}</StandardText></StandardCard.Content>
                <StandardCard.Footer className="flex justify-center">
                     <StandardButton onClick={handleVolver} styleType="outline" colorScheme="danger" leftIcon={ArrowLeft}>
                        Volver a Dimensiones
                    </StandardButton>
                </StandardCard.Footer>
            </StandardCard>
        </div>
      </div>
    );
  }
  
  if (!dimensionActual || !valoresFormIniciales) {
    // Si llegamos aquí y no hay errorPage, pero tampoco dimensión, es un estado inesperado.
    // Esto podría pasar si cargarDimension() termina sin setear errorPage pero tampoco dimensionActual.
    return (
      <div>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StandardCard
            colorScheme="primary"
            accentPlacement="none"
            hasOutline={false}
            shadow="none"
            disableShadowHover={true}
            styleType="subtle"
            className="text-center p-6"
          >
            <StandardText preset="subheading">Dimensión no disponible</StandardText>
            <StandardText colorScheme="neutral" className="mt-2">No se pudo cargar la información de la dimensión. Intenta volver a la lista.</StandardText>
            <StandardButton onClick={handleVolver} styleType="outline" className="mt-4" leftIcon={ArrowLeft}>
              Volver a Dimensiones
            </StandardButton>
          </StandardCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <StandardPageTitle
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
            colorScheme="primary" // Rule: Main form card colorScheme is secondary
            accentColorScheme="primary" // Rule: Main form card accent for create/edit is primary
            shadow="md" // Rule: Main form card shadow is md by default
            disableShadowHover={true}
            styleType="subtle"
            // styleType and hasOutline removed to use default or theme-defined values
          >
            <DimensionForm
              modo="editar"
              valoresIniciales={valoresFormIniciales}
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
// Default export is part of the component declaration.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Review if any specific todos are needed for this modification page.
// For example, consider edge cases or further UI/UX enhancements.
//#endregion ![todo]