"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@/app/theme-provider";
import { StandardSlider } from "@/components/ui/StandardSlider";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { useAuth } from "@/app/auth-provider";
import {
  simulateBatches,
  type SimulateBatchesPayload,
  type SimulateBatchesResult,
  createBatches,
  type CreateBatchesPayload,
} from "@/lib/actions/batch-actions";
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
import { checkIfProjectHasArticles } from "@/lib/actions/article-actions";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardSphereGrid } from "@/components/ui/StandardSphereGrid";
import { type SphereItemData, type StandardSphereProps } from "@/components/ui/StandardSphere";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";

interface BatchSimulatorPageProps {
  onBatchesCreatedSuccessfully: () => void;
}

export default function BatchSimulatorPage({ onBatchesCreatedSuccessfully }: BatchSimulatorPageProps) {
  const router = useRouter();
  const { proyectoActual } = useAuth();
  const { appColorTokens, mode } = useTheme();

  const [committedBatchSize, setCommittedBatchSize] = useState(50);
  const [displayBatchSize, setDisplayBatchSize] = useState(50);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberDetails[]>([]);
  const [simulationData, setSimulationData] = useState<SimulateBatchesResult | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [creationStatusMessage, setCreationStatusMessage] = useState("");
  const [hasArticles, setHasArticles] = useState<boolean>(false);
  
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const memberColorMap = useMemo(() => {
    if (projectMembers.length === 0) return {};
    const map: Record<string, ColorSchemeVariant> = {};
    const colorSchemes: ColorSchemeVariant[] = ['primary', 'secondary', 'tertiary', 'accent', 'success', 'warning', 'danger'];
    projectMembers.forEach((member, idx) => {
      map[member.user_id] = colorSchemes[idx % colorSchemes.length];
    });
    return map;
  }, [projectMembers]);

  // Verificar si hay artículos cargados cuando el proyecto cambia
  useEffect(() => {
    const checkArticles = async () => {
      if (!proyectoActual?.id) return;
      
      try {
        const result = await checkIfProjectHasArticles(proyectoActual.id);
        if (result.success) {
          setHasArticles(result.data.hasArticles);
        } else {
          setUiError(result.error || 'No se pudo verificar el estado de los artículos.');
        }
      } catch (err) {
        setUiError('Error de red al verificar los artículos.');
      }
    };
    
    checkArticles();
  }, [proyectoActual]);

  // Cargar miembros del proyecto
  useEffect(() => {
    if (proyectoActual?.id) {
      setIsLoadingInitialData(true);
      setUiError(null); setProjectMembers([]); setSelectedMemberIds([]); setSimulationData(null);
      const fetchMembers = async () => {
        try {
          const result = await obtenerMiembrosConPerfilesYRolesDelProyecto(proyectoActual.id);
          if (result.success) {
            setProjectMembers(result.data);
            setSelectedMemberIds(result.data.map(m => m.user_id));
          } else {
            setUiError(result.error || "Error al cargar los miembros del proyecto.");
          }
        } catch (err) {
          setUiError(`Error inesperado al cargar miembros: ${err instanceof Error ? err.message : "Error desconocido."}`);
        } finally {
          setIsLoadingInitialData(false);
        }
      };
      fetchMembers();
    } else if (proyectoActual === null) {
      setIsLoadingInitialData(false); setProjectMembers([]); setSelectedMemberIds([]); setSimulationData(null);
    }
  }, [proyectoActual]);

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

  const runSimulation = useCallback(async () => {
    if (!proyectoActual?.id || selectedMemberIds.length === 0 || isLoadingInitialData) {
      if (!isLoadingInitialData) setSimulationData(null);
      setIsSimulating(false); return;
    }
    setSimulationData(null);
    setIsSimulating(true);
    setUiError(null);
    const payload: SimulateBatchesPayload = {
      projectId: proyectoActual.id, mode: 'size', value: committedBatchSize, selectedMemberIds,
    };
    try {
      const result = await simulateBatches(payload);
      if (result.success) {
        setSimulationData(result.data);
        if (result.data.totalBatchesCalculated === 0 && result.data.totalEligibleArticles > 0) {
          setUiError("No se generaron lotes. Verifique el tamaño o si hay artículos elegibles.");
        }
      } else {
        setUiError(result.error || "Error durante la simulación.");
        setSimulationData(null);
      }
    } catch (err) {
      setUiError(`Error inesperado al simular: ${err instanceof Error ? err.message : "Error desconocido."}`);
      setSimulationData(null);
    } finally {
      setIsSimulating(false);
    }
  }, [proyectoActual?.id, committedBatchSize, selectedMemberIds, isLoadingInitialData]);

  useEffect(() => { if (!isLoadingInitialData) runSimulation(); }, [selectedMemberIds, isLoadingInitialData, runSimulation]);

  const handleCrearLotes = async () => {
    const currentTotalBatches = simulationData?.totalBatchesCalculated || 0;
    if (!proyectoActual || !simulationData || committedBatchSize < 10 || committedBatchSize > 60 || selectedMemberIds.length === 0) {
        sonnerToast.error("Error de Preparación", {description:"No hay una simulación válida, proyecto activo o miembros seleccionados para crear lotes."});
        return;
    }

    setIsCreating(true);
    setUiError(null);
    setCreationStatusMessage(`Creando ${currentTotalBatches} lotes, por favor espera...`);

    const payload: CreateBatchesPayload = {
        projectId: proyectoActual.id,
        simulationParams: {
            mode: 'size',
            value: committedBatchSize,
            selectedMemberIds: selectedMemberIds,
        },
    };

    try {
        const result = await createBatches(payload);
        if (result.success) {
            setCreationStatusMessage(`¡Completado! ${result.data.createdBatchesCount} lotes creados con ${result.data.totalItemsCreated} artículos.`);
            sonnerToast.success("¡Lotes Creados Exitosamente!", {
                description: `${result.data.createdBatchesCount} lotes con un total de ${result.data.totalItemsCreated} artículos fueron creados.`
            });
            onBatchesCreatedSuccessfully();
            const rutaLotes = `/datos-maestros/lote`;
            console.log(`[BatchSimulatorPage] Redirigiendo a: ${rutaLotes} después de crear lotes.`);
            router.push(rutaLotes);
        } else {
            setUiError(result.error || "Ocurrió un error al crear los lotes.");
            setCreationStatusMessage("Error en la creación de lotes.");
            sonnerToast.error("Error al Crear Lotes", { description: result.error });
        }
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error desconocido.";
        setUiError(`Error inesperado al crear lotes: ${errorMsg}`);
        setCreationStatusMessage("Error inesperado durante la creación.");
        sonnerToast.error("Error Inesperado", { description: errorMsg });
    } finally {
        setTimeout(() => {
            setIsCreating(false);
        }, 2000);
    }
  };

  const sphereData = useMemo((): SphereItemData[] => {
    if (!simulationData?.distribution) return [];
    return simulationData.distribution.map(batch => {
      const assignedMember = projectMembers.find(m => m.user_id === batch.assignedToMemberId);
      const colorScheme = batch.assignedToMemberId ? memberColorMap[batch.assignedToMemberId] : 'neutral';
      
      return {
        id: `batch-${batch.batchNumberObjective}`,
        value: batch.batchNumberObjective,
        keyGroup: assignedMember?.profile?.public_display_name || 'No Asignado',
        colorScheme: colorScheme,
        styleType: batch.assignedToMemberId ? 'filled' : 'outline',
        tooltip: `Lote ${batch.batchNumberObjective} - Asignado a: ${assignedMember?.profile?.public_display_name || 'N/A'}`,
      };
    });
  }, [simulationData, memberColorMap, projectMembers]);

  const totalEligibleArticles = simulationData?.totalEligibleArticles || 0;
  const totalBatchesCalculated = simulationData?.totalBatchesCalculated || 0;

  const pesoLoteBarContainerHeight = 280;
  let dynamicBarItemHeight: number;
  let dynamicBarItemGap: number;
  const minTotalGapForPeso = 2;
  if (committedBatchSize === 1) {
    dynamicBarItemHeight = pesoLoteBarContainerHeight * 0.7;
    dynamicBarItemGap = 0;
  } else if (committedBatchSize > 1) {
    const totalSpaceForGaps = Math.max(minTotalGapForPeso * (committedBatchSize - 1), pesoLoteBarContainerHeight * 0.15);
    const spaceForBars = pesoLoteBarContainerHeight - totalSpaceForGaps;
    dynamicBarItemHeight = Math.max(1, spaceForBars / committedBatchSize);
    dynamicBarItemGap = totalSpaceForGaps / (committedBatchSize - 1);
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
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
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

  if (!hasArticles && !isLoadingInitialData) {
    return (
      <StandardPageBackground variant="gradient">
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
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
                Antes de crear lotes, es necesario cargar artículos al proyecto. Dirígete a la sección de "Cargar Artículos" para subir los artículos que deseas incluir en los lotes.
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
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
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
                            <span className="text-2xl font-bold text-primary-text">{displayBatchSize}</span>
                            </StandardText>
                            <StandardText size="sm">Lotes a generar:{" "}
                            <span className="text-2xl font-bold text-primary-text">
                                {(isSimulating || isCreating) && !simulationData ? "..." : totalBatchesCalculated}
                            </span>
                            </StandardText>
                        </div>
                        <StandardSlider
                            value={[displayBatchSize]} min={10} max={60} step={1}
                            onValueChange={(v) => {
                                let newDisplaySize = v[0];
                                if (newDisplaySize < 10 && newDisplaySize !== 0) newDisplaySize = 10;
                                if (newDisplaySize > 60) newDisplaySize = 60;
                                setDisplayBatchSize(newDisplaySize);
                            }}
                            onValueCommit={(v) => {
                                let finalDisplaySize = v[0];
                                if (finalDisplaySize < 10 && finalDisplaySize !== 0) finalDisplaySize = 10;
                                if (finalDisplaySize > 60) finalDisplaySize = 60;
                                setDisplayBatchSize(finalDisplaySize);
                                setCommittedBatchSize(finalDisplaySize);
                                if (!isLoadingInitialData) {
                                    runSimulation();
                                }
                            }}
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
                                        {member.profile?.public_display_name || member.profile?.first_name || `ID: ${member.user_id.substring(0,6)}`}
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
                                styleType="outline" size="xs" onClick={runSimulation} className="mt-3"
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
                            `${totalBatchesCalculated} lotes de ~${committedBatchSize} artículos (Total elegibles: ${totalEligibleArticles})`
                        }
                        </StandardText>
                        
                        <StandardSphereGrid
                            items={sphereData}
                            containerWidth={containerSize.width}
                            containerHeight={containerSize.height}
                            isLoading={containerSize.width === 0 || isSimulating}
                            loadingMessage={isSimulating ? "Simulando..." : "Midiendo contenedor..."}
                            emptyStateText="No se generarán lotes con los parámetros actuales."
                            sortBy="value"
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
                                {Array.from({ length: Math.min(committedBatchSize, 200) }).map((_, i) => (
                                    <div
                                        key={`peso-bar-${i}`}
                                        style={{
                                            width: "85%", height: `${dynamicBarItemHeight}px`,
                                            background: appColorTokens.primary.pure, borderRadius: '2px',
                                            marginTop: i === Math.min(committedBatchSize, 200) - 1 ? 0 : `${dynamicBarItemGap}px`,
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
                                    {committedBatchSize}
                                </StandardText>
                                <StandardText size="sm" className="text-muted-foreground">
                                    elementos por lote
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
                                con un tamaño aproximado de <strong className="text-foreground">{committedBatchSize}</strong> artículos cada uno,
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