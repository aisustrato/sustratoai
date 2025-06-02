// app/datos-maestros/dimensiones/[id]/ver/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
  listDimensions, // Usaremos esta y filtraremos, o podríamos crear getDimensionDetails
  type FullDimension,
} from "@/lib/actions/dimension-actions";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { CustomButton } from "@/components/ui/custom-button";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { AlertTriangle, ArrowLeft, Edit, Eye } from "lucide-react"; // Eye para ver
import {
  DimensionForm,
  type DimensionFormValues,
} from "../../components/DimensionForm"; // Ajustar ruta si es necesario
import { toast as sonnerToast } from "sonner"; // Aunque no hay submits, por si hay errores de carga

export default function VerDimensionPage() {
  const router = useRouter();
  const params = useParams();
  const dimensionId = params?.id ? String(params.id) : "";

  const { proyectoActual, loadingProyectos } = useAuth();

  const [dimensionActual, setDimensionActual] = useState<FullDimension | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);

  const puedeGestionarDimensiones =
    proyectoActual?.permissions?.can_manage_master_data || false;

  const cargarDimension = useCallback(async () => {
    if (!proyectoActual?.id || !dimensionId) {
      if (!loadingProyectos) {
         setErrorPage(!dimensionId ? "ID de dimensión no especificado." : "Proyecto no seleccionado.");
      }
      setIsPageLoading(false);
      setDimensionActual(null);
      return;
    }

    setIsPageLoading(true);
    setErrorPage(null);
    setDimensionActual(null); 

    try {
      const resultado = await listDimensions(proyectoActual.id); // RLS debe proteger esto
      if (resultado.success) {
        const dim = resultado.data.find(d => d.id === dimensionId);
        if (dim) {
          setDimensionActual(dim);
        } else {
          setErrorPage(`Dimensión con ID "${dimensionId}" no encontrada en el proyecto "${proyectoActual.name}".`);
        }
      } else {
        setErrorPage(resultado.error || "Error al cargar los datos de la dimensión.");
        sonnerToast.error("Error al Cargar Datos", { description: resultado.error });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido.";
      setErrorPage(`Error inesperado al cargar la dimensión: ${errorMsg}`);
      sonnerToast.error("Error Inesperado", { description: errorMsg });
    } finally {
      setIsPageLoading(false);
    }
  }, [proyectoActual?.id, dimensionId, loadingProyectos]);

  useEffect(() => {
    if ((proyectoActual?.id && dimensionId) || !loadingProyectos) {
      cargarDimension();
    }
  }, [proyectoActual?.id, dimensionId, loadingProyectos, cargarDimension]);

  const handleVolver = () => {
    router.push("/datos-maestros/dimensiones");
  };

  const handleEditar = () => {
    if (dimensionId) {
      router.push(`/datos-maestros/dimensiones/${dimensionId}/modificar`);
    }
  };
  
  const valoresFormIniciales: DimensionFormValues | undefined = dimensionActual ? {
    name: dimensionActual.name,
    type: dimensionActual.type as 'finite' | 'open',
    description: dimensionActual.description || "",
    options: dimensionActual.options.map(o => ({ id: o.id, value: o.value, ordering: o.ordering })),
    questions: dimensionActual.questions.map(q => ({id: q.id, question: q.question, ordering: q.ordering })),
    examples: dimensionActual.examples.map(e => ({ id: e.id, example: e.example })),
  } : undefined;

  if (isPageLoading || (loadingProyectos && !dimensionActual && !errorPage)) {
    return (
      <PageBackground>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text="Cargando detalle de la dimensión..." />
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
                        Error al Cargar Dimensión
                    </Text>
                </ProCard.Header>
                <ProCard.Content className="text-center"><Text>{errorPage}</Text></ProCard.Content>
                <ProCard.Footer className="flex justify-center">
                     <CustomButton onClick={handleVolver} leftIcon={<ArrowLeft />} variant="outline" color="danger">
                        Volver a Dimensiones
                    </CustomButton>
                </ProCard.Footer>
            </ProCard>
        </div>
      </PageBackground>
    );
  }
  
  if (!dimensionActual || !valoresFormIniciales) {
    return (
        <PageBackground>
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProCard variant="warning" className="text-center p-6">
                    <Text variant="subheading">Dimensión no disponible</Text>
                    <Text color="muted" className="mt-2">No se pudo cargar la información de la dimensión. Intenta volver a la lista.</Text>
                     <CustomButton onClick={handleVolver} leftIcon={<ArrowLeft />} variant="outline" className="mt-4">
                        Volver a Dimensiones
                    </CustomButton>
                </ProCard>
            </div>
        </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto"> {/* Centrar contenido */}
          <PageTitle
            title={`Detalle de Dimensión: ${dimensionActual.name}`}
            subtitle="Visualizando la configuración de esta dimensión de clasificación."
            mainIcon={Eye} // Icono para ver
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Dimensiones", href: "/datos-maestros/dimensiones" },
              { label: "Ver" },
            ]}
            showBackButton={{ href: "/datos-maestros/dimensiones" }}
            actions={ // Botón de editar como una acción del PageTitle
              puedeGestionarDimensiones ? (
                <CustomButton
                  onClick={handleEditar}
                  leftIcon={<Edit className="h-4 w-4" />}
                  color="secondary" // o 'primary' si prefieres
                  variant="outline"
                  size="sm"
                >
                  Editar Dimensión
                </CustomButton>
              ) : undefined
            }
          />

          <ProCard className="mt-6" border="top" color="default" shadow="md"> {/* Color default o neutral para vista */}
            <DimensionForm
              modo="ver" // Modo solo lectura
              valoresIniciales={valoresFormIniciales}
              // No se necesita onSubmit para el modo "ver"
            />
          </ProCard>
        </div>
      </div>
    </PageBackground>
  );
}