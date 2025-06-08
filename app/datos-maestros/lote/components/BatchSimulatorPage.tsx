// app/datos-maestros/lote/components/BatchSimulatorPage.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { motion } from "framer-motion"; // No se usa activamente por ahora
import { useTheme } from "@/app/theme-provider"; 
import { generateBatchTokens, type BatchTokens, type BatchAuxColor } from "./batch-tokens"; 
import { CustomSlider } from "@/components/ui/custom-slider";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text, type TextProps } from "@/components/ui/text";
import { BatchItem } from "./BatchItem";
import tinycolor from "tinycolor2";

import { useAuth } from "@/app/auth-provider"; 
import { 
    simulateBatches, 
    type SimulateBatchesPayload, 
    type SimulateBatchesResult,
    createBatches, 
    type CreateBatchesPayload,
    type CreateBatchesResult 
} from "@/lib/actions/batch-actions"; 
import { 
    obtenerMiembrosConPerfilesYRolesDelProyecto, 
    type ProjectMemberDetails 
} from "@/lib/actions/member-actions";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo"; 
import { AlertTriangle, CheckCircle, Layers, Settings } from "lucide-react"; 
import { StandardButton, type StandardButtonProps } from "@/components/ui/StandardButton"; // Changed import
import { PageTitle } from "@/components/ui/page-title"; 
import { PageBackground } from "@/components/ui/page-background"; 
import { useRouter } from "next/navigation"; 
import { toast as sonnerToast } from "sonner";
import { Progress } from "@/components/ui/progress"; // Importar tu componente Progress
interface BatchSimulatorPageProps {
    onBatchesCreatedSuccessfully: () => void; // Nueva prop
  }
  export default function BatchSimulatorPage({ onBatchesCreatedSuccessfully }: BatchSimulatorPageProps) { 
  const router = useRouter(); 
  const { proyectoActual } = useAuth();
  const { appColorTokens, mode } = useTheme();
  const batchTokens = useMemo<BatchTokens | null>(
    () => appColorTokens && generateBatchTokens(appColorTokens, mode),
    [appColorTokens, mode]
  );

  const [batchSize, setBatchSize] = useState(50); 
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberDetails[]>([]);
  const [simulationData, setSimulationData] = useState<SimulateBatchesResult | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false); 
  const [isCreating, setIsCreating] = useState(false); 
  const [uiError, setUiError] = useState<string | null>(null);
  const [creationStatusMessage, setCreationStatusMessage] = useState("");

  const memberColorMap = useMemo(() => {
    if (!batchTokens || projectMembers.length === 0) return {};
    const map: Record<string, BatchAuxColor> = {};
    projectMembers.forEach((member, idx) => {
      map[member.user_id] = batchTokens.auxiliaries[idx % batchTokens.auxiliaries.length];
    });
    return map;
  }, [batchTokens, projectMembers]);

  useEffect(() => {
    if (proyectoActual?.id && batchTokens) { 
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
    } else if (!proyectoActual?.id && batchTokens) { 
      setIsLoadingInitialData(false); setProjectMembers([]); setSelectedMemberIds([]); setSimulationData(null);
    }
  }, [proyectoActual?.id, batchTokens]); 

  const runSimulation = useCallback(async () => {
    if (!proyectoActual?.id || selectedMemberIds.length === 0 || isLoadingInitialData) {
      if (!isLoadingInitialData) setSimulationData(null); 
      setIsSimulating(false); return;
    }
    setIsSimulating(true); setUiError(null); 
    const payload: SimulateBatchesPayload = {
      projectId: proyectoActual.id, mode: 'size', value: batchSize, selectedMemberIds,
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
  }, [proyectoActual?.id, batchSize, selectedMemberIds, isLoadingInitialData]);

  useEffect(() => {
    if (batchSize < 10 && batchSize !== 0) setBatchSize(10);
    if (batchSize > 60) setBatchSize(60);
    const handler = setTimeout(() => { if (!isLoadingInitialData) runSimulation(); }, 500); 
    return () => clearTimeout(handler);
  }, [batchSize, isLoadingInitialData, runSimulation]); 

  useEffect(() => { if (!isLoadingInitialData) runSimulation(); },[selectedMemberIds, isLoadingInitialData, runSimulation]);

  const handleCrearLotes = async () => {
    const currentTotalBatches = simulationData?.totalBatchesCalculated || 0;
    if (!proyectoActual || !simulationData || currentTotalBatches === 0 || selectedMemberIds.length === 0) {
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
            value: batchSize,
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
            const rutaLotes = `/datos-maestros/lote`; // O la ruta de tu LotesOrquestadorPage
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

  const displayableBatches = simulationData?.distribution || [];
  const totalBatchesCalculated = simulationData?.totalBatchesCalculated || 0;
  const totalEligibleArticles = simulationData?.totalEligibleArticles || 0;
  const gridColumns = totalBatchesCalculated > 0 ? Math.ceil(Math.sqrt(totalBatchesCalculated)) : 1;
  
  const barWidth = 120;
  const pesoLoteBarContainerHeight = 280; 
  let dynamicBarItemHeight: number; let dynamicBarItemGap: number;
  const minTotalGapForPeso = 2; 
  if (batchSize === 1) { dynamicBarItemHeight = pesoLoteBarContainerHeight * 0.7; dynamicBarItemGap = 0; } 
  else if (batchSize > 1) { const totalSpaceForGaps = Math.max(minTotalGapForPeso * (batchSize - 1), pesoLoteBarContainerHeight * 0.15); const spaceForBars = pesoLoteBarContainerHeight - totalSpaceForGaps; dynamicBarItemHeight = Math.max(1, spaceForBars / batchSize); dynamicBarItemGap = totalSpaceForGaps / (batchSize - 1); } 
  else { dynamicBarItemHeight = 0; dynamicBarItemGap = 0; }
  const itemsToShowInPesoLote = batchSize > 0 ? batchSize : 0; 

  if (!batchTokens || isLoadingInitialData) { 
    return (
        <PageBackground>
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SustratoLoadingLogo showText text={!batchTokens ? "Cargando tema..." : "Cargando datos del simulador..."} />
            </div>
        </PageBackground>
    );
  }
  
  if (!proyectoActual) { 
    return (
      <PageBackground>
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
                <Text variant="subheading" weight="bold" color="warning">Proyecto No Seleccionado</Text>
            </StandardCard.Header>
            <StandardCard.Content><Text>Por favor, selecciona un proyecto activo para poder configurar y simular la creación de lotes.</Text></StandardCard.Content>
            </StandardCard>
        </div>
      </PageBackground>
    );
  }

  if (projectMembers.length === 0) { 
     return (
      <PageBackground>
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
                <Text variant="subheading" weight="bold" color="neutral">Sin Miembros en el Proyecto</Text>
            </StandardCard.Header>
            <StandardCard.Content><Text>Este proyecto no tiene miembros asignados. Dirígete a la sección de gestión de miembros para agregar participantes antes de crear lotes.</Text></StandardCard.Content>
            </StandardCard>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
        <div className="container mx-auto py-8">
            <PageTitle
                title="Simulador de Creación de Lotes"
                subtitle={`Define los parámetros para distribuir los artículos del proyecto "${proyectoActual.name}" en lotes de trabajo.`}
                mainIcon={Layers}
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
                hasOutline={false} // border="top" implies no full outline
            >
                <StandardCard.Header>
                    <Text variant="subheading" weight="medium" color="primary">Configuración de Lotes</Text>
                </StandardCard.Header>
                <StandardCard.Content className={`grid md:grid-cols-2 gap-6 ${isSimulating || isCreating ? 'opacity-60 pointer-events-none' : ''}`}>
                    <StandardCard
                        colorScheme="primary"
                        outlineColorScheme="primary"
                        hasOutline={true}
                        animateEntrance
                        className="p-4"
                        styleType="subtle"
                        accentPlacement="none" // border="normal" implies no accent
                    >
                        <Text variant="label" weight="semibold" className="mb-1 block">1. Definir Tamaño por Lote</Text>
                        <div className="flex justify-between items-baseline my-3">
                            <Text size="sm">Artículos/Lote:{" "}
                            <span className="text-2xl font-bold text-primary-text">{batchSize}</span>
                            </Text>
                            <Text size="sm">Lotes a generar:{" "}
                            <span className="text-2xl font-bold text-primary-text">
                                {(isSimulating || isCreating) && !simulationData ? "..." : totalBatchesCalculated}
                            </span>
                            </Text>
                        </div>
                        <CustomSlider
                            value={[batchSize]} min={10} max={60} step={1}
                            onValueChange={(v) => setBatchSize(v[0])}
                            showTooltip gradient color="primary" size="md"
                            disabled={isSimulating || isCreating} className="my-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Lotes pequeños (muchos)</span>
                            <span>Lotes grandes (pocos)</span>
                        </div>
                        <Text size="xs" className="text-muted-foreground mt-3">
                            Artículos elegibles en proyecto: {(isSimulating || isCreating) && !simulationData ? "Calculando..." : totalEligibleArticles}
                        </Text>
                    </StandardCard>

                    <StandardCard
                        colorScheme="primary"
                        outlineColorScheme="primary"
                        hasOutline={true}
                        animateEntrance
                        className="p-4"
                        styleType="subtle"
                        accentPlacement="none" // border="normal" implies no accent
                    >
                        <Text variant="label" weight="semibold" className="mb-3 block">2. Asignar a Miembros</Text>
                        <div className="flex gap-2 flex-wrap min-h-[40px]">
                            {projectMembers.map((member) => {
                            const memberColor = memberColorMap[member.user_id] || batchTokens.auxiliaries[0];
                            const isSelected = selectedMemberIds.includes(member.user_id);
                            return (
                                <button
                                key={member.user_id} type="button" disabled={isSimulating || isCreating}
                                onClick={() => {
                                    setSelectedMemberIds((prev) => {
                                    const currentlySelected = prev.includes(member.user_id);
                                    if (currentlySelected && prev.length === 1) return prev; 
                                    return currentlySelected ? prev.filter((id) => id !== member.user_id) : [...prev, member.user_id];
                                    });
                                }}
                                style={{
                                    padding: "4px 12px", borderRadius: 12,
                                    border: `2px solid ${memberColor.border}`,
                                    background: isSelected ? memberColor.solid : "transparent",
                                    color: isSelected ? memberColor.text : memberColor.border,
                                    fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                                    transition: "background 0.2s, color 0.2s, border-color 0.2s",
                                }}>
                                {member.profile?.public_display_name || member.profile?.first_name || `ID: ${member.user_id.substring(0,6)}`}
                                </button>
                            );})}
                        </div>
                        {selectedMemberIds.length === 0 && !isSimulating && !isCreating && (
                            <Text color="warning" size="xs" className="mt-2">Por favor, selecciona al menos un miembro.</Text>
                        )}
                    </StandardCard>
                </StandardCard.Content>
            </StandardCard>

            {uiError && !isSimulating && !isCreating && (
                <StandardCard
                    colorScheme="danger"
                    animateEntrance
                    accentPlacement="left"
                    accentColorScheme="danger" // Assuming accent color should match variant
                    className="mb-8 p-4"
                    styleType="subtle"
                    hasOutline={false} // border="left" implies no full outline
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-danger-fg" />
                        <div>
                            <Text variant="label" weight="bold" color="danger">Problema en la Simulación/Creación</Text>
                            <Text size="sm" className="text-danger-fg/90">{uiError}</Text>
                            <StandardButton
                                styleType="outline" // Mapped variant
                                size="xs"
                                onClick={runSimulation}
                                className="mt-3"
                                disabled={isSimulating || isCreating || selectedMemberIds.length === 0}
                                leftIcon={<Settings className="h-3 w-3"/>}
                                colorScheme="neutral" // Added default colorScheme
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
                hasOutline={false} // border="top" implies no full outline
            >
                {isCreating && (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm z-20 rounded-md p-4 text-center">
    <div className="flex w-full items-center gap-2 mb-2">
      <div className="flex-1">
        <Progress 
          indeterminate 
          variant="primary"
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
        <Progress 
          indeterminate 
          variant="primary"
          size="sm"
          className="w-full" 
        />
      </div>
    </div>
    <Text weight="medium" className="mb-2 mt-3 text-primary-text">{creationStatusMessage || "Procesando lotes..."}</Text>
    <Text size="xs" className="text-muted-foreground mt-2">(Esto puede tardar unos segundos)</Text>
  </div>
)}

                <StandardCard.Header>
                    <Text variant="subheading" weight="medium" color="secondary">Previsualización de la Distribución</Text>
                </StandardCard.Header>
                <StandardCard.Content className={`grid md:grid-cols-3 gap-6 items-start ${isCreating ? 'opacity-30 blur-sm' : ''}`}>
                    <div className="md:col-span-2 relative min-h-[300px]"> 
                        <Text variant="label" weight="semibold" className="mb-1 block">Lotes Generados</Text>
                        <Text size="sm" className="text-muted-foreground mb-3">
                        {(isSimulating || isCreating) && !simulationData ? "Calculando distribución..." : 
                            `${totalBatchesCalculated} lotes de ~${batchSize} artículos (Total elegibles: ${totalEligibleArticles})`
                        }
                        </Text>
                        
                        {isSimulating && !isCreating && ( 
                            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10 rounded-md">
                                <SustratoLoadingLogo variant={"spin-pulse"} size={40} text="Simulando..."/>
                            </div>
                        )}
                        
                        {displayableBatches.length > 0 && (
                            <div className={`grid gap-2 w-full items-center justify-center ${(isSimulating || isCreating) ? 'opacity-50' : ''}`}
                                style={{gridTemplateColumns: `repeat(${Math.min(gridColumns, 15)}, minmax(0, 1fr))`}}
                            >
                            {displayableBatches.map((batchInfo) => {
                                const assignedMemberColor = batchInfo.assignedToMemberId ? memberColorMap[batchInfo.assignedToMemberId] : batchTokens.auxiliaries[0];
                                const pastel = assignedMemberColor?.solid || "#e0e0e0";
                                const border = tinycolor(pastel).darken(15).toHexString();
                                const textColor = tinycolor.mostReadable(pastel, ["#222", "#fff"]).toHexString();
                                const itemSize = Math.max(28, Math.min(50, (320 / Math.min(gridColumns,10)) * 0.8 ));
                                
                                return (
                                <BatchItem
                                    key={`batch-item-${batchInfo.batchNumberObjective}`}
                                    color={pastel} border={border} textColor={textColor}
                                    number={batchInfo.batchNumberObjective} size={itemSize}
                                    animate={false} 
                                />
                                );
                            })}
                            </div>
                        )}
                        {totalBatchesCalculated === 0 && !isSimulating && !isCreating && simulationData && (
                            <Text className="text-center text-muted-foreground py-8">No se generarán lotes con los parámetros actuales.</Text>
                        )}
                    </div>

                    <div className="min-h-[300px]">
                        <Text variant="label" weight="semibold" className="mb-3 block text-center md:text-left">Peso Visual del Lote</Text>
                        <div className="flex flex-col h-full justify-center items-center gap-4 pt-4 md:pt-0">
                            <div
                            style={{
                                width: barWidth, height: pesoLoteBarContainerHeight,
                                background: mode === "dark" ? tinycolor(batchTokens.auxiliaries[0].border).darken(20).toHexString() : "#fff",
                                borderRadius: 16, border: `2.5px solid ${batchTokens.auxiliaries[0].border}`,
                                padding: '8px', display: "flex", flexDirection: "column-reverse", 
                                justifyContent: "flex-start", alignItems: "center", overflow: "hidden",
                            }}>
                            {Array.from({ length: itemsToShowInPesoLote }).map((_, i) => (
                                <div
                                key={`peso-bar-${i}`}
                                style={{
                                    width: "85%", height: `${dynamicBarItemHeight}px`,
                                    background: batchTokens.auxiliaries[0].solid, borderRadius: '2px',
                                    marginTop: i === itemsToShowInPesoLote - 1 ? 0 : `${dynamicBarItemGap}px`,
                                }}
                                />
                            ))}
                            </div>
                            <div className="text-center mt-3">
                            <Text 
                                variant={"heading" as TextProps['variant']} 
                                weight="bold" 
                                style={{ color: appColorTokens.primary.pure }}
                                className="text-4xl" 
                            >
                                {batchSize}
                            </Text>
                            <Text size="sm" className="text-muted-foreground">
                                elementos por lote
                            </Text>
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
                    hasOutline={false} // border="top" implies no full outline
                >
                    <StandardCard.Header className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-success-fg"/>
                        <Text variant="subheading" weight="medium" color="success">Confirmar y Crear Lotes</Text>
                    </StandardCard.Header>
                    <StandardCard.Content className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-grow">
                            <Text size="sm" className="text-muted-foreground">
                                Se generarán <strong className="text-foreground">{totalBatchesCalculated}</strong> lotes
                                con un tamaño aproximado de <strong className="text-foreground">{batchSize}</strong> artículos cada uno,
                                distribuidos entre <strong className="text-foreground">{selectedMemberIds.length}</strong> miembro(s) seleccionado(s).
                            </Text>
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
                            colorScheme="success" // Mapped color
                            styleType="outline" // Mapped variant
                            size="lg"
                            onClick={handleCrearLotes} 
                            disabled={isSimulating || isCreating || !simulationData || totalBatchesCalculated === 0 || selectedMemberIds.length === 0}
                            loading={isCreating} 
                            leftIcon={<CheckCircle />}
                            className="w-full md:w-auto"
                        >
                            {isCreating ? "Creando Lotes..." : `Crear ${totalBatchesCalculated} Lotes`}
                        </StandardButton>
                    </StandardCard.Content>
                </StandardCard>
            )}
        </div>
    </PageBackground>
  );
}