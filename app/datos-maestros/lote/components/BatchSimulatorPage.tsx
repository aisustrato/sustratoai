"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@/app/theme-provider";
import { StandardSlider } from "@/components/ui/StandardSlider";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { useAuth } from "@/app/auth-provider";

// Hook personalizado para debounce CORREGIDO
// function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);

//   useEffect(() => {
//     // Solo crear el timeout si el valor es diferente al actual
//     if (value !== debouncedValue) {
//       const handler = setTimeout(() => {
//         console.log(`⏰ [DEBOUNCE TIMEOUT] Actualizando debouncedValue de ${debouncedValue} a ${value} - ${new Date().toISOString()}`);
//         setDebouncedValue(value);
//       }, delay);

//       return () => {
//         clearTimeout(handler);
//       };
//     }
//   }, [value, delay, debouncedValue]);

//   return debouncedValue;
// }

import {
  createBatches,
  type CreateBatchesPayload,
  getBatchingStatusForActivePhase,
} from "@/lib/actions/batch-actions";
import { listEligibleArticlesForPhase } from "@/lib/actions/phase-eligible-articles-actions";
import {
  obtenerMiembrosConPerfilesYRolesDelProyecto,
  type ProjectMemberDetails,
} from "@/lib/actions/member-actions";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { AlertTriangle, CheckCircle, Boxes, Settings, FileText } from "lucide-react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast as sonnerToast } from "sonner";
// Removed checkIfProjectHasArticles import as we now use phase-specific data
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardSphereGrid } from "@/components/ui/StandardSphereGrid";
import { type SphereItemData } from "@/components/ui/StandardSphere";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";

interface BatchSimulatorPageProps {
  onBatchesCreatedSuccessfully: () => void;
}

export default function BatchSimulatorPage({ onBatchesCreatedSuccessfully }: BatchSimulatorPageProps) {
  const router = useRouter();
  const { proyectoActual } = useAuth();
  const { appColorTokens, mode } = useTheme();

  const [batchSize, setBatchSize] = useState(50);
  const [isSliderMoving, setIsSliderMoving] = useState(false);
  const [shouldSimulate, setShouldSimulate] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberDetails[]>([]);
  const [simulationData, setSimulationData] = useState<{
    totalBatches: number;
    totalArticles: number;
    articlesPerBatch: number[];
    articlesPerMember: Record<string, number>;
  } | null>(null);
  const [totalEligibleArticles, setTotalEligibleArticles] = useState(0);
  const [cachedEligibleArticles, setCachedEligibleArticles] = useState<any[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenderingSpheres, setIsRenderingSpheres] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [creationStatusMessage, setCreationStatusMessage] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const memberColorMap = useMemo(() => {
    if (projectMembers.length === 0) return {};
    const map: Record<string, ColorSchemeVariant> = {};
    const colorSchemes: ColorSchemeVariant[] = ['primary', 'secondary', 'tertiary', 'accent', 'success', 'warning', 'danger'];
    projectMembers.forEach((member, idx) => {
      map[member.user_id] = colorSchemes[idx % colorSchemes.length];
    });
    return map;
  }, [projectMembers]);

  // Verificar estado de la fase activa y artículos elegibles
  useEffect(() => {
    const checkPhaseAndArticles = async () => {
      if (!proyectoActual?.id) return;
      
      try {
        const statusResult = await getBatchingStatusForActivePhase(proyectoActual.id);
        if (statusResult.success && statusResult.data.activePhase) {
          setActivePhaseId(statusResult.data.activePhase.id);
        } else {
          setUiError('No se pudo obtener información de la fase activa.');
        }
      } catch (error) {
        setUiError('Error al verificar el estado de la fase.');
      }
    };
    
    checkPhaseAndArticles();
  }, [proyectoActual]);

  // Cargar datos iniciales (miembros del proyecto y artículos elegibles)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!proyectoActual?.id || !activePhaseId) return;

      try {
        console.log(`📥 [CARGA INICIAL] Consultando datos una sola vez - ${new Date().toISOString()}`);
        
        // Cargar miembros del proyecto
        const membersResult = await obtenerMiembrosConPerfilesYRolesDelProyecto(proyectoActual.id);
        if (membersResult.success && membersResult.data) {
          setProjectMembers(membersResult.data);
          // Seleccionar todos los miembros por defecto
          const memberIds = membersResult.data.map(m => m.user_id);
          setSelectedMemberIds(memberIds);
        }

        // Cargar artículos elegibles UNA SOLA VEZ y cachear
        console.log(`🔍 [CACHE] Consultando artículos elegibles para phaseId: ${activePhaseId} - ${new Date().toISOString()}`);
        const articlesResult = await listEligibleArticlesForPhase(activePhaseId);
        
        if (articlesResult.success && articlesResult.data) {
          setCachedEligibleArticles(articlesResult.data);
          setTotalEligibleArticles(articlesResult.data.length);
          console.log(`💾 [CACHE] Artículos cacheados: ${articlesResult.data.length} - ${new Date().toISOString()}`);
        } else {
          setUiError(!articlesResult.success ? articlesResult.error : "Error al obtener artículos elegibles.");
        }
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        setUiError("Error al cargar los datos del proyecto.");
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [proyectoActual?.id, activePhaseId]);

  // ✅ CORRECCIÓN: El useEffect ahora "despierta" cuando cambian los datos de la simulación.
  useEffect(() => {
    const element = gridContainerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [simulationData, isSimulating]); // Se ejecuta cuando el contenedor aparece/desaparece

  // Función para simular lotes localmente - SIMPLIFICADA
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    console.log(`🎯 [SLIDER] Valor: ${newValue}`);
    setBatchSize(newValue);
    setIsSliderMoving(true);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      console.log(`⏰ [DEBOUNCE] Disparando simulación tras 500ms - ${new Date().toISOString()}`);
      setIsSliderMoving(false);
      setShouldSimulate(true);
    }, 500);
  };

  const handleSliderCommit = (value: number[]) => {
    const newValue = value[0];
    console.log(`🎯 [SLIDER COMMIT] Valor final: ${newValue}`);
    setBatchSize(newValue);
    setIsSliderMoving(false);
    
    // Clear debounce timer and trigger immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setShouldSimulate(true);
  };

  const handleSimulate = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`🚀 [SIMULACIÓN] Iniciando con batchSize: ${batchSize} - ${timestamp}`);

    if (!proyectoActual?.id || selectedMemberIds.length === 0) {
      setUiError("Selecciona al menos un miembro para continuar.");
      return;
    }

    if (!activePhaseId) {
      setUiError("No hay fase activa disponible.");
      return;
    }

    setIsSimulating(true);
    setUiError(null);
    setSimulationData(null);

    try {
      // Usar artículos cacheados en lugar de consultar cada vez
      const timestamp2 = new Date().toISOString();
      console.log(`💾 [CACHE REUTILIZADO] Usando artículos cacheados: ${cachedEligibleArticles.length} - ${timestamp2}`);

      if (cachedEligibleArticles.length === 0) {
        setUiError("No hay artículos elegibles para crear lotes.");
        return;
      }

      const totalArticles = cachedEligibleArticles.length;
      console.log(`⚡ [EFICIENCIA] Simulación sin consulta adicional: ${totalArticles} artículos - ${timestamp2}`);

      // Calcular distribución de lotes
      const numBatches = Math.ceil(totalArticles / batchSize);
      const baseSize = Math.floor(totalArticles / numBatches);
      const remainder = totalArticles % numBatches;

      const articlesPerBatch = Array.from({ length: numBatches }, (_, i) =>
        baseSize + (i < remainder ? 1 : 0)
      );

      // Calcular distribución por miembro
      const articlesPerMember: Record<string, number> = {};
      selectedMemberIds.forEach(memberId => {
        articlesPerMember[memberId] = 0;
      });

      articlesPerBatch.forEach((batchSize, index) => {
        const memberId = selectedMemberIds[index % selectedMemberIds.length];
        articlesPerMember[memberId] += batchSize;
      });

      // Iniciar estado de renderizado de esferas
      setIsRenderingSpheres(true);

      setSimulationData({
        totalBatches: numBatches,
        totalArticles,
        articlesPerBatch,
        articlesPerMember
      });

      const timestamp4 = new Date().toISOString();
      console.log(`✅ [SIMULACIÓN COMPLETA] Artículos: ${totalArticles} | Lotes: ${numBatches} | Art/Lote: ${batchSize} - ${timestamp4}`);

      // Dar tiempo para que SphereGrid renderice antes de quitar el loading
      setTimeout(() => {
        setIsRenderingSpheres(false);
      }, 300);

    } catch (err) {
      setUiError(`Error inesperado al simular: ${err instanceof Error ? err.message : "Error desconocido."}`);
      setSimulationData(null);
    } finally {
      setIsSimulating(false);
    }
  }, [proyectoActual?.id, batchSize, selectedMemberIds, activePhaseId, cachedEligibleArticles]);

  // Único useEffect para manejar simulación - SIMPLIFICADO
  useEffect(() => {
    if (!isLoadingInitialData && selectedMemberIds.length > 0 && activePhaseId && shouldSimulate) {
      console.log(`🚀 [TRIGGER] Ejecutando simulación - ${new Date().toISOString()}`);
      handleSimulate();
      setShouldSimulate(false); // Reset flag
    }
  }, [shouldSimulate, isLoadingInitialData, selectedMemberIds.length, activePhaseId, handleSimulate]);

  // Ejecutar simulación inicial una sola vez
  useEffect(() => {
    if (!isLoadingInitialData && selectedMemberIds.length > 0 && activePhaseId) {
      console.log(`🎆 [INICIAL] Simulación inicial - ${new Date().toISOString()}`);
      setShouldSimulate(true);
    }
  }, [isLoadingInitialData, selectedMemberIds.length, activePhaseId]);

  const handleCrearLotes = async () => {
    if (!proyectoActual?.id || !simulationData || simulationData.totalBatches === 0) {
      setUiError("No hay datos de simulación válidos para crear lotes.");
      return;
    }

    setIsCreating(true);
    setCreationStatusMessage("Iniciando creación de lotes...");
    setUiError(null);

    try {
      const payload: CreateBatchesPayload = {
        projectId: proyectoActual.id,
        batchSize: batchSize,
        selectedMemberIds,
      };

      const result = await createBatches(payload);
      if (result.success) {
        setCreationStatusMessage(`✅ Lotes creados exitosamente: ${result.data.createdBatchesCount} lotes con ${result.data.totalItemsCreated} artículos.`);
        sonnerToast.success(`Se crearon ${result.data.createdBatchesCount} lotes con ${result.data.totalItemsCreated} artículos.`);

        // Limpiar estado y notificar al componente padre
        setTimeout(() => {
          onBatchesCreatedSuccessfully();
        }, 2000);
      } else {
        setUiError(result.error || "Error al crear los lotes.");
        setCreationStatusMessage("");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setUiError(`Error inesperado: ${errorMsg}`);
      setCreationStatusMessage("");
    } finally {
      setIsCreating(false);
    }
  };

  // Calcular lotes por miembro para mostrar en botones
  const batchesPerMember = useMemo((): Record<string, number> => {
    if (!simulationData?.articlesPerBatch || selectedMemberIds.length === 0) {
      // Si no hay simulación, todos los miembros tienen 0 lotes
      const result: Record<string, number> = {};
      projectMembers.forEach(member => {
        result[member.user_id] = 0;
      });
      return result;
    }

    const result: Record<string, number> = {};
    
    // Inicializar todos los miembros con 0
    projectMembers.forEach(member => {
      result[member.user_id] = 0;
    });
    
    // Contar lotes por miembro seleccionado
    simulationData.articlesPerBatch.forEach((_, index: number) => {
      const memberId = selectedMemberIds[index % selectedMemberIds.length];
      result[memberId] = (result[memberId] || 0) + 1;
    });

    return result;
  }, [simulationData, selectedMemberIds, projectMembers]);

  const sphereData = useMemo((): SphereItemData[] => {
    if (!simulationData?.articlesPerBatch) return [];

    // Crear array de lotes agrupados por investigador para mejor visualización
    const spheres: SphereItemData[] = [];

    // Calcular cuántos lotes corresponden a cada investigador
    const batchesPerMemberArray: Record<string, number[]> = {};
    selectedMemberIds.forEach(memberId => {
      batchesPerMemberArray[memberId] = [];
    });

    // Distribuir lotes de manera equilibrada
    simulationData.articlesPerBatch.forEach((batchSize: number, index: number) => {
      const memberId = selectedMemberIds[index % selectedMemberIds.length];
      batchesPerMemberArray[memberId].push(batchSize);
    });

    // Generar esferas agrupadas por investigador
    let globalBatchIndex = 1;
    selectedMemberIds.forEach(memberId => {
      const assignedMember = projectMembers.find(m => m.user_id === memberId);
      const colorScheme = memberId ? memberColorMap[memberId] : 'primary';
      const memberName = assignedMember?.profile?.public_display_name || 'No Asignado';

      batchesPerMemberArray[memberId].forEach((batchSize) => {
        spheres.push({
          id: `batch-${globalBatchIndex}`,
          value: `${batchSize}`, // Mostrar solo el número de artículos
          keyGroup: `${memberName}`,
          colorScheme,
        });
        globalBatchIndex++;
      });
    });

    return spheres;
  }, [simulationData, memberColorMap, projectMembers, selectedMemberIds]);

  const totalBatchesCalculated = simulationData?.totalBatches || 0;

  const pesoLoteBarContainerHeight = 280;
  let dynamicBarItemHeight: number;
  let dynamicBarItemGap: number;
  const minTotalGapForPeso = 2;
  if (batchSize === 1) {
    dynamicBarItemHeight = pesoLoteBarContainerHeight * 0.7;
    dynamicBarItemGap = 0;
  } else if (batchSize > 1) {
    const totalSpaceForGaps = Math.max(minTotalGapForPeso * (batchSize - 1), pesoLoteBarContainerHeight * 0.15);
    const spaceForBars = pesoLoteBarContainerHeight - totalSpaceForGaps;
    dynamicBarItemHeight = Math.max(1, spaceForBars / batchSize);
    dynamicBarItemGap = totalSpaceForGaps / (batchSize - 1);
  } else {
    dynamicBarItemHeight = 0;
    dynamicBarItemGap = 0;
  }

  if (isLoadingInitialData || !appColorTokens) {
    return (
      <StandardPageBackground variant="gradient">
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SustratoLoadingLogo showText text={!appColorTokens ? "Cargando tema..." : "Cargando datos del simulador..."} />
        </div>
      </StandardPageBackground>
    );
  }

  if (!proyectoActual) {
    return (
      <StandardPageBackground variant="gradient">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <StandardCard
            animateEntrance
            colorScheme="primary"
            className="text-center max-w-lg p-8"
            styleType="subtle"
            hasOutline={false}
            accentPlacement="none"
          >
            <StandardCard.Header className="items-center flex flex-col">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
              <StandardText preset="subheading" weight="bold" colorScheme="warning">Proyecto No Seleccionado</StandardText>
            </StandardCard.Header>
            <StandardCard.Content><StandardText>Por favor, selecciona un proyecto activo para poder configurar y simular la creación de lotes.</StandardText></StandardCard.Content>
          </StandardCard>
        </div>
      </StandardPageBackground>
    );
  }

  if (totalEligibleArticles === 0 && !isLoadingInitialData) {
    return (
      <StandardPageBackground variant="gradient">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <StandardCard
            animateEntrance
            colorScheme="primary"
            className="text-center max-w-lg p-8"
            styleType="subtle"
            hasOutline={false}
            accentPlacement="none"
          >
            <StandardCard.Header className="items-center flex flex-col">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-info-100 mb-4">
                <FileText className="h-6 w-6 text-info-600" />
              </div>
              <StandardText preset="subheading" weight="bold" colorScheme="neutral">No hay artículos cargados</StandardText>
            </StandardCard.Header>
            <StandardCard.Content>
              <StandardText className="mb-4">
                Antes de crear lotes, es necesario cargar artículos al proyecto. Dirígete a la sección de &ldquo;Cargar Artículos&rdquo; para subir los artículos que deseas incluir en los lotes.
              </StandardText>
              <StandardButton
                asChild
                colorScheme="primary"
                className="mt-4"
              >
                <Link href="/datos-maestros/cargar-articulos">
                  Ir a Cargar Artículos
                </Link>
              </StandardButton>
            </StandardCard.Content>
          </StandardCard>
        </div>
      </StandardPageBackground>
    );
  }

  if (projectMembers.length === 0) {
    return (
      <StandardPageBackground variant="gradient">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <StandardCard
            animateEntrance
            colorScheme="primary"
            className="text-center max-w-lg p-8"
            styleType="subtle"
            hasOutline={false}
            accentPlacement="none"
          >
            <StandardCard.Header className="items-center flex flex-col">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-info-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-info-600" />
              </div>
              <StandardText preset="subheading" weight="bold" colorScheme="neutral">Sin Miembros en el Proyecto</StandardText>
            </StandardCard.Header>
            <StandardCard.Content>
              <StandardText>Este proyecto no tiene miembros asignados. Dirígete a la sección de gestión de miembros para agregar participantes antes de crear lotes.</StandardText>
            </StandardCard.Content>
          </StandardCard>
        </div>
      </StandardPageBackground>
    );
  }

  return (
    <StandardPageBackground variant="gradient">
      <div className="container mx-auto py-8">
        <StandardPageTitle
          title="Simulador de Creación de Lotes"
          subtitle={`Define los parámetros para distribuir los artículos del proyecto "${proyectoActual.name}" en lotes de trabajo.`}
          mainIcon={Boxes}
          showBackButton={{ href: "/datos-maestros/lote" }}
          breadcrumbs={[
            { label: "Datos maestros", href: "/datos-maestros" },
            { label: "Lotes", href: "/datos-maestros/lote" },
          ]}
        />

        <StandardCard
          animateEntrance
          className="mt-6 mb-8"
          colorScheme="primary"
          accentPlacement="top"
          accentColorScheme="primary"
          shadow="md"
          styleType="subtle"
          hasOutline={false}
        >
          <StandardCard.Header>
            <StandardText preset="subheading" weight="medium" colorScheme="primary">Configuración de Lotes</StandardText>
          </StandardCard.Header>
          <StandardCard.Content className={`grid md:grid-cols-2 gap-6 ${isSimulating || isCreating ? 'opacity-60 pointer-events-none' : ''}`}>
            <StandardCard
              colorScheme="primary"
              outlineColorScheme="primary"
              hasOutline={true}
              animateEntrance
              className="p-4"
              styleType="subtle"
              accentPlacement="none"
            >
              <StandardText weight="semibold" className="mb-1 block">1. Definir Tamaño por Lote</StandardText>
              <div className="flex justify-between items-baseline my-3">
                <StandardText size="sm">Artículos/Lote:{" "}
                  <span className="text-2xl font-bold text-primary-text">{batchSize}</span>
                </StandardText>
                <StandardText size="sm">Lotes a generar:{" "}
                  <span className="text-2xl font-bold text-primary-text">
                    {(isSimulating || isCreating) && !simulationData ? "..." : totalBatchesCalculated}
                  </span>
                </StandardText>
              </div>
              <StandardSlider
                value={[batchSize]} min={10} max={60} step={1}
                onValueChange={handleSliderChange}
                onValueCommit={handleSliderCommit}
                colorScheme="primary" size="md"
                disabled={isSimulating || isCreating} className="my-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lotes pequeños (muchos)</span>
                <span>Lotes grandes (pocos)</span>
              </div>
              <StandardText size="xs" className="text-muted-foreground mt-3">
                Artículos elegibles en proyecto: {(isSimulating || isCreating) && !simulationData ? "Calculando..." : totalEligibleArticles}
              </StandardText>
            </StandardCard>

            <StandardCard
              colorScheme="primary"
              outlineColorScheme="primary"
              hasOutline={true}
              animateEntrance
              className="p-4"
              styleType="subtle"
              accentPlacement="none"
            >
              <StandardText weight="semibold" className="mb-3 block">2. Asignar a Miembros</StandardText>
              <div className="flex gap-2 flex-wrap min-h-[40px]">
                {projectMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.user_id);
                  const colorScheme = memberColorMap[member.user_id] || 'neutral';
                  const batchCount = batchesPerMember[member.user_id] || 0;
                  const memberName = member.profile?.public_display_name || member.profile?.first_name || `ID: ${member.user_id.substring(0,6)}`;
                  
                  return (
                    <StandardButton
                      key={member.user_id}
                      size="sm"
                      colorScheme={colorScheme}
                      styleType={isSelected ? 'solid' : 'outline'}
                      disabled={isSimulating || isCreating}
                      onClick={() => {
                        setSelectedMemberIds((prev) => {
                          const currentlySelected = prev.includes(member.user_id);
                          if (currentlySelected && prev.length === 1) return prev;
                          return currentlySelected ? prev.filter((id) => id !== member.user_id) : [...prev, member.user_id];
                        });
                      }}
                    >
                      {memberName} ({batchCount})
                    </StandardButton>
                  );
                })}
              </div>
              {selectedMemberIds.length === 0 && !isSimulating && !isCreating && (
                <StandardText colorScheme="warning" size="xs" className="mt-2">Por favor, selecciona al menos un miembro.</StandardText>
              )}
            </StandardCard>
          </StandardCard.Content>
        </StandardCard>

        {uiError && !isSimulating && !isCreating && (
          <StandardCard
            colorScheme="danger"
            animateEntrance
            accentPlacement="left"
            accentColorScheme="danger"
            className="mb-8 p-4"
            styleType="subtle"
            hasOutline={false}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-danger-fg" />
              <div>
                <StandardText weight="bold" colorScheme="danger">Problema en la Simulación/Creación</StandardText>
                <StandardText size="sm" className="text-danger-fg/90">{uiError}</StandardText>
                <StandardButton
                  styleType="outline" size="xs" onClick={handleSimulate} className="mt-3"
                  disabled={isSimulating || isCreating || selectedMemberIds.length === 0}
                  leftIcon={Settings}
                >Reintentar Simulación</StandardButton>
              </div>
            </div>
          </StandardCard>
        )}

        {((simulationData && totalBatchesCalculated > 0) || isSimulating || isCreating) && !uiError && (
          <StandardCard
            animateEntrance
            colorScheme="primary"
            accentPlacement="top"
            accentColorScheme="secondary"
            shadow="md"
            className="mb-8 relative"
            styleType="subtle"
            contentCanScroll={true}
            hasOutline={false}
          >
            {isCreating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm z-20 rounded-md p-4 text-center">
                <div className="flex w-full items-center gap-2 mb-2">
                  <div className="flex-1">
                    <StandardProgressBar
                      indeterminate
                      colorScheme="primary"
                      size="sm"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 56, height: 56 }}>
                    <SustratoLoadingLogo
                      variant={"spin-pulse"}
                      size={50}
                    />
                  </div>
                  <div className="flex-1">
                    <StandardProgressBar
                      indeterminate
                      colorScheme="primary"
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </div>
                <StandardText weight="medium" className="mb-2 mt-3 text-primary-text">{creationStatusMessage || "Procesando lotes..."}</StandardText>
                <StandardText size="xs" className="text-muted-foreground mt-2">(Esto puede tardar unos segundos)</StandardText>
              </div>
            )}

            <StandardCard.Header>
              <StandardText preset="subheading" weight="medium" colorScheme="secondary">Previsualización de la Distribución</StandardText>
            </StandardCard.Header>
            <StandardCard.Content className={`grid md:grid-cols-3 gap-6 items-start ${isCreating ? 'opacity-30 blur-sm' : ''}`}>
              <div ref={gridContainerRef} className="md:col-span-2 relative min-h-[400px]">
                <StandardText weight="semibold" className="mb-1 block">Lotes Generados</StandardText>
                <StandardText size="sm" className="text-muted-foreground mb-3">
                  {(isSimulating || isCreating) && !simulationData ? "Calculando distribución..." :
                    `${totalBatchesCalculated} lotes de ~${batchSize} artículos (Total elegibles: ${totalEligibleArticles})`
                  }
                </StandardText>

                <StandardSphereGrid
                  items={sphereData}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  isLoading={containerSize.width === 0 || isSimulating || isRenderingSpheres || isSliderMoving}
                  loadingMessage={
                    isSimulating ? "Simulando..." :
                      isRenderingSpheres ? "Renderizando esferas..." :
                        "Midiendo contenedor..."
                  }
                  emptyStateText="No se generarán lotes con los parámetros actuales."
                  sortBy="keyGroup"
                  groupByKeyGroup={true}
                />
              </div>

              <div className="min-h-[300px]">
                <StandardText weight="semibold" className="mb-3 block text-center md:text-left">Peso Visual del Lote</StandardText>
                <div className="flex flex-col h-full justify-center items-center gap-4 pt-4 md:pt-0">
                  <div
                    style={{
                      width: 120, height: pesoLoteBarContainerHeight,
                      background: mode === "dark" ? appColorTokens.neutral.bgShade : "#fff",
                      borderRadius: 16, border: `2.5px solid ${appColorTokens.neutral.pureShade}`,
                      padding: '8px', display: "flex", flexDirection: "column-reverse",
                      justifyContent: "flex-start", alignItems: "center", overflow: "hidden",
                    }}>
                    {Array.from({ length: Math.min(batchSize, 200) }).map((_, i) => (
                      <div
                        key={`peso-bar-${i}`}
                        style={{
                          width: "85%", height: `${dynamicBarItemHeight}px`,
                          background: appColorTokens.primary.pure, borderRadius: '2px',
                          marginTop: i === Math.min(batchSize, 200) - 1 ? 0 : `${dynamicBarItemGap}px`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <StandardText
                      preset="heading"
                      weight="bold"
                      style={{ color: appColorTokens.primary.pure }}
                      className="text-4xl"
                    >
                      {batchSize}
                    </StandardText>
                    <StandardText size="sm" colorScheme="neutral" styleType="body">
                      artículos por lote
                    </StandardText>
                  </div>
                </div>
              </div>
            </StandardCard.Content>
          </StandardCard>
        )}
        {simulationData && totalBatchesCalculated > 0 && !uiError && !isSimulating && (
          <StandardCard
            colorScheme="success"
            accentPlacement="top"
            accentColorScheme="success"
            shadow="md"
            styleType="subtle"
            hasOutline={false}
          >
            <StandardCard.Header className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-success-fg"/>
              <StandardText preset="subheading" weight="medium" colorScheme="success">Confirmar y Crear Lotes</StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-grow">
                <StandardText size="sm" className="text-muted-foreground">
                  Se generarán <strong className="text-foreground">{totalBatchesCalculated}</strong> lotes
                  con un tamaño aproximado de <strong className="text-foreground">{batchSize}</strong> artículos cada uno,
                  distribuidos entre <strong className="text-foreground">{selectedMemberIds.length}</strong> miembro(s) seleccionado(s).
                </StandardText>
                {simulationData.articlesPerMember && Object.keys(simulationData.articlesPerMember).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <strong>Distribución de artículos por miembro:</strong>
                    <ul className="list-disc list-inside pl-4">
                      {projectMembers
                        .filter(m => selectedMemberIds.includes(m.user_id) && (simulationData.articlesPerMember?.[m.user_id] || 0) > 0)
                        .map(m => (
                          <li key={m.user_id}>
                            {m.profile?.public_display_name || m.user_id.substring(0,6)}: {simulationData.articlesPerMember?.[m.user_id] || 0} artículos
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
              <StandardButton
                colorScheme="success"
                styleType="outline"
                size="lg"
                onClick={handleCrearLotes}
                disabled={isSimulating || isCreating || !simulationData || totalBatchesCalculated === 0 || selectedMemberIds.length === 0}
                loading={isCreating}
                leftIcon={CheckCircle}
                className="w-full md:w-auto"
              >
                {isCreating ? "Creando Lotes..." : `Crear ${totalBatchesCalculated} Lotes`}
              </StandardButton>
            </StandardCard.Content>
          </StandardCard>
        )}
      </div>
    </StandardPageBackground>
  );
}