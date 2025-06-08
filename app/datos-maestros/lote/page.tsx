//. 📍 app/datos-maestros/lote/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/app/auth-provider';
import BatchSimulatorPage from './components/BatchSimulatorPage'; 
import ProjectBatchesDisplay, { type DisplayableBatch } from './components/ProjectBatchesDisplay'; 
import { PageBackground } from '@/components/ui/page-background';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { Text } from '@/components/ui/text';
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { PageTitle } from '@/components/ui/page-title';
import { Boxes, AlertTriangle } from 'lucide-react';

import { 
    getProjectBatchesForDisplay, 
    resetProjectBatchesIfNotInitialized, 
    type GetProjectBatchesData,
    type ResetBatchesResult 
} from '@/lib/actions/batch-actions'; 

// Para los tokens de color (SOLO para ProjectBatchesDisplay y la leyenda en Orquestador si es necesario)
import { useTheme } from "@/app/theme-provider"; 
import { generateBatchTokens, type BatchTokens, type BatchAuxColor } from "./components/batch-tokens";
import { obtenerMiembrosConPerfilesYRolesDelProyecto, type ProjectMemberDetails } from "@/lib/actions/member-actions";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Type for viewMode is defined inline in useState.
// Other types are imported or standard React types.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function LotesOrquestadorPage() {
  const { proyectoActual, user } = useAuth();
  const [viewMode, setViewMode] = useState<'loading' | 'simulator' | 'displayBatches'>('loading');
  //#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
  const [lotesExistentes, setLotesExistentes] = useState<DisplayableBatch[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [projectMembers, setProjectMembers] = useState<ProjectMemberDetails[]>([]);
  const { appColorTokens, mode } = useTheme();

  // Generar batchTokens y memberColorMap aquí, SOLO para pasarlos a ProjectBatchesDisplay
  const batchTokens = useMemo<BatchTokens | null>(() => {
    if (appColorTokens && mode) {
      return generateBatchTokens(appColorTokens, mode);
    }
    return null; 
  }, [appColorTokens, mode]);

  const memberColorMap = useMemo<Record<string, BatchAuxColor>>(() => {
    if (!batchTokens || projectMembers.length === 0) return {};
    const map: Record<string, BatchAuxColor> = {};
    projectMembers.forEach((member, idx) => {
      if(member.user_id){
         map[member.user_id] = batchTokens.auxiliaries[idx % batchTokens.auxiliaries.length];
      }
    });
    return map;
  }, [batchTokens, projectMembers]);

  const permisoGestionGeneral = proyectoActual?.permissions?.can_create_batches || false;

  const cargarDatosPrincipales = useCallback(async () => {
    if (!proyectoActual?.id || !user?.id) {
      setIsLoadingPageData(false);
      setViewMode('simulator'); 
      return;
    }
    setIsLoadingPageData(true);
    setErrorMessage(null);
    try {
      const membersResult = await obtenerMiembrosConPerfilesYRolesDelProyecto(proyectoActual.id);
      if (membersResult.success) {
        setProjectMembers(membersResult.data); // Necesario para memberColorMap
      } else {
        setErrorMessage(membersResult.error || "Error al cargar miembros.");
        // Continuar para cargar lotes incluso si los miembros fallan, la leyenda no se mostrará
      }

      const lotesResult = await getProjectBatchesForDisplay({ projectId: proyectoActual.id });
      if (lotesResult.success) {
        setLotesExistentes(lotesResult.data.lotes);
        // canResetAllProjectBatches se maneja dentro de ProjectBatchesDisplay basado en los lotes que recibe
        if (lotesResult.data.lotes.length > 0) {
          setViewMode('displayBatches');
        } else {
          setViewMode('simulator');
        }
      } else {
        setErrorMessage(lotesResult.error || "Error al cargar el estado de los lotes.");
        setViewMode('simulator'); 
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(`Excepción al cargar datos: ${errorMsg}`);
      setViewMode('simulator'); 
    } finally {
      setIsLoadingPageData(false);
    }
  }, [proyectoActual?.id, user?.id]); 

  useEffect(() => {
    if (proyectoActual?.id && user?.id) {
        cargarDatosPrincipales();
    } else {
        setIsLoadingPageData(false);
        if (!proyectoActual?.id && user?.id) { // Si hay usuario pero no proyecto, no mostrar error, solo el simulador o mensaje de no proyecto
            setViewMode('simulator'); // O un estado específico de "no-proyecto"
        }
    }
  }, [proyectoActual?.id, user?.id, cargarDatosPrincipales]);


  const handleBatchesCreated = () => {
    cargarDatosPrincipales(); 
  };

  const handleResetAllBatchesInProject = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!proyectoActual?.id) return { success: false, error: "No hay proyecto activo." }; // CORRECCIÓN: Asegurar que proyectoActual existe
    if (!permisoGestionGeneral) return { success: false, error: "No tienes permisos." };
    
    setIsLoadingPageData(true); 
    const result = await resetProjectBatchesIfNotInitialized({ projectId: proyectoActual.id }); // CORRECCIÓN: Usar proyectoActual.id
    if (result.success) {
      cargarDatosPrincipales(); 
      return { success: true, message: result.data.message };
    } else {
      setErrorMessage(result.error);
      setIsLoadingPageData(false);
      return { success: false, error: result.error };
    }
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  //#region [render_sub] - LOADING STATE 🎨
  if (isLoadingPageData || (!batchTokens && viewMode === 'displayBatches')) { // Loader si carga datos o si batchTokens no está listo para displayBatches
    return (
      <PageBackground>
        <div className="flex items-center justify-center min-h-[70vh]">
          <SustratoLoadingLogo text={!batchTokens ? "Cargando configuración de tema..." : "Cargando datos de gestión de lotes..."} />
        </div>
      </PageBackground>
    );
  }
  //#endregion [render_sub]
  
  //#region [render_sub] - NO PROJECT STATE 🎨
  if (!proyectoActual) { // Chequeo más robusto
    return (
         <PageBackground>
            <PageTitle title="Gestión de Lotes" mainIcon={Boxes} />
            <StandardCard
                disableShadowHover={true}
                colorScheme="primary"
                styleType="subtle"
                className="mt-6 text-center max-w-lg mx-auto p-8"
                hasOutline={false} // Default for ProCard variant="primary" without border prop
                accentPlacement="none" // Default for ProCard variant="primary" without border prop
            >
                <StandardCard.Header className="items-center flex flex-col">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 mb-4">
                        <AlertTriangle className="h-6 w-6 text-warning-600" />
                    </div>
                    <Text variant="subheading" weight="bold" color="warning">Proyecto No Seleccionado</Text>
                </StandardCard.Header>
                <StandardCard.Content><Text>Por favor, selecciona un proyecto activo para gestionar los lotes.</Text></StandardCard.Content>
            </StandardCard>
        </PageBackground>
    );
  }
  //#endregion [render_sub]
  
  // TODO: Considerar un render_sub para el errorMessage && viewMode === 'simulator' si se reimplementa
  if (errorMessage && viewMode === 'simulator') { /* ... (manejo de error como antes) ... */ }

  //#region [render_sub] - MAIN CONTENT (SIMULATOR OR DISPLAY) 🎨
  return (
    <PageBackground>
      {viewMode === 'simulator' ? (
        <BatchSimulatorPage 
            onBatchesCreatedSuccessfully={handleBatchesCreated} 
        />
      ) : ( // viewMode === 'displayBatches'
        <ProjectBatchesDisplay 
          projectId={proyectoActual.id} // Corregido
          lotes={lotesExistentes}
          memberColorMap={memberColorMap} // Este SÍ los necesita del orquestador
          batchTokens={batchTokens}       // Este SÍ los necesita del orquestador
         
          onResetAllBatches={handleResetAllBatchesInProject}
          permisoParaResetearGeneral={permisoGestionGeneral}
        />
      )}
    </PageBackground>
  );
  //#endregion [render_sub]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// El manejo de `errorMessage` cuando `viewMode` es 'simulator' está comentado. Revisar si es necesario.
// Considerar si el estado `loading` global de `useLoading` podría simplificar `isLoadingPageData`.
// Refinar la UX para el cambio entre 'simulator' y 'displayBatches' (ej. con animaciones o transiciones suaves).
//#endregion ![todo]