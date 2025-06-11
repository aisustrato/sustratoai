//. 📍 app/datos-maestros/lote/components/BatchVisualization.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion"; // Aunque no se usa activamente ahora, se deja por si acaso
import { useTheme } from "@/app/theme-provider"; 
import { generateBatchTokens, type BatchTokens, type BatchAuxColor } from "./batch-tokens"; 
import { CustomSlider } from "@/components/ui/custom-slider";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { BatchItem } from "./BatchItem";
import tinycolor from "tinycolor2";

import { useAuth } from "@/app/auth-provider"; 
import { 
    simulateBatches, // Usando la versión de prueba de la action
    type SimulateBatchesPayload, 
    type SimulateBatchesResult,
} from "@/lib/actions/batch-actions"; // Ajusta la ruta si es necesario
import { 
    obtenerMiembrosConPerfilesYRolesDelProyecto, 
    type ProjectMemberDetails 
} from "@/lib/actions/member-actions"; // Ajusta la ruta si es necesario
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo"; 
import { AlertTriangle, CheckCircle, Settings, Eye, BarChartBig } from "lucide-react"; // Iconos
import { PageTitle } from "@/components/ui/page-title"; // Para el título principal
import { PageBackground } from "@/components/ui/page-background"; // Para el fondo
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific props for this component, types are for internal state or imported.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function BatchSimulatorPage() { // Renombrado el componente para reflejar que es una "página" o sección completa
  const { proyectoActual } = useAuth();
  const { appColorTokens, mode } = useTheme();
  //#region [sub] - 🧰 HELPER FUNCTIONS, HOOKS & LOGIC 🧰
  const batchTokens = useMemo<BatchTokens | null>(
    () => appColorTokens && generateBatchTokens(appColorTokens, mode),
    [appColorTokens, mode]
  );

  const [batchSize, setBatchSize] = useState(50); 
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberDetails[]>([]);
  const [simulationData, setSimulationData] = useState<SimulateBatchesResult | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Carga de miembros y tema
  const [isSimulating, setIsSimulating] = useState(false); 
  const [uiError, setUiError] = useState<string | null>(null);

  const memberColorMap = useMemo(() => {
    if (!batchTokens || projectMembers.length === 0) return {};
    const map: Record<string, BatchAuxColor> = {};
    projectMembers.forEach((member, idx) => {
      map[member.user_id] = batchTokens.auxiliaries[idx % batchTokens.auxiliaries.length];
    });
    return map;
  }, [batchTokens, projectMembers]);

  useEffect(() => {
    if (proyectoActual?.id && batchTokens) { // Esperar también a batchTokens para evitar render sin estilos
      setIsLoadingInitialData(true);
      setUiError(null);
      setProjectMembers([]); 
      setSelectedMemberIds([]); 
      setSimulationData(null);

      const fetchMembers = async () => {
        try {
          const result = await obtenerMiembrosConPerfilesYRolesDelProyecto(proyectoActual.id);
          if (result.success) {
            setProjectMembers(result.data);
            setSelectedMemberIds(result.data.map(m => m.user_id));
          } else {
            setUiError(result.error || "Error al cargar los miembros del proyecto.");
            console.error("Error cargando miembros:", result.error);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Error desconocido.";
          setUiError(`Error inesperado al cargar miembros: ${errorMsg}`);
          console.error("Excepción cargando miembros:", err);
        } finally {
          setIsLoadingInitialData(false);
        }
      };
      fetchMembers();
    } else if (!proyectoActual?.id && batchTokens) { // Si hay tokens pero no proyecto
      setIsLoadingInitialData(false);
      setProjectMembers([]);
      setSelectedMemberIds([]);
      setSimulationData(null);
    }
  }, [proyectoActual?.id, batchTokens]); // Depender también de batchTokens

  const runSimulation = useCallback(async () => {
    if (!proyectoActual?.id || selectedMemberIds.length === 0 || isLoadingInitialData) {
      if (!isLoadingInitialData) { 
          setSimulationData(null); 
      }
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    setUiError(null); 

    const payload: SimulateBatchesPayload = {
      projectId: proyectoActual.id,
      mode: 'size', 
      value: batchSize, 
      selectedMemberIds: selectedMemberIds,
    };

    try {
      const result = await simulateBatches(payload); 
      if (result.success) {
        setSimulationData(result.data);
        if (result.data.totalBatchesCalculated === 0 && result.data.totalEligibleArticles > 0) {
            setUiError("No se generaron lotes. Verifique el tamaño de lote o si hay artículos elegibles.");
        }
      } else {
        setUiError(result.error || "Error durante la simulación de lotes.");
        setSimulationData(null); 
        console.error("Error en simulateBatches_TEST:", result.error, "ErrorCode:", result.errorCode);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido.";
      setUiError(`Error inesperado al simular lotes: ${errorMsg}`);
      setSimulationData(null);
      console.error("Excepción en runSimulation:", err);
    } finally {
      setIsSimulating(false);
    }
  }, [proyectoActual?.id, batchSize, selectedMemberIds, isLoadingInitialData]);

  useEffect(() => {
    if (batchSize < 10 && batchSize !== 0) setBatchSize(10); // Evitar que se ponga a 0 si el min es 10
    if (batchSize > 60) setBatchSize(60);

    const handler = setTimeout(() => {
      if (!isLoadingInitialData) { // Solo correr si la carga inicial ya terminó
        runSimulation();
      }
    }, 500); 

    return () => clearTimeout(handler);
  }, [batchSize, isLoadingInitialData, runSimulation]); 

  useEffect(() => {
    if (!isLoadingInitialData) { // Solo correr si la carga inicial ya terminó
        runSimulation();
    }
  },[selectedMemberIds, isLoadingInitialData, runSimulation]);

  // Derived state for rendering
  const displayableBatches = simulationData?.distribution || [];
  const totalBatchesCalculated = simulationData?.totalBatchesCalculated || 0;
  const totalEligibleArticles = simulationData?.totalEligibleArticles || 0;
  const gridColumns = totalBatchesCalculated > 0 ? Math.ceil(Math.sqrt(totalBatchesCalculated)) : 1;
  
  // Dynamic styling for "Peso Visual del Lote"
  const barWidth = 120;
  const pesoLoteBarContainerHeight = 280; 
  const pesoLoteBarItemHeight = 3;     
  const pesoLoteBarItemGap = 1.5;        
  const maxItemsInPesoLoteVisual = Math.floor(
      (pesoLoteBarContainerHeight - pesoLoteBarItemGap) / (pesoLoteBarItemHeight + pesoLoteBarItemGap)
  ); 
  const itemsToShowInPesoLote = batchSize > 0 ? Math.min(batchSize, maxItemsInPesoLoteVisual) : 0;
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  if (!batchTokens || isLoadingInitialData) { // Mostrar loader principal si no hay tokens o cargando datos iniciales
    return (
        <PageBackground> {/* Usar PageBackground aquí también */}
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SustratoLoadingLogo showText text={!batchTokens ? "Cargando tema..." : "Cargando datos del simulador..."} />
            </div>
        </PageBackground>
    );
  }
  
  if (!proyectoActual?.id) {
    return (
      <PageBackground>
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
            <StandardCard
                disableShadowHover={true}
                colorScheme="primary"
                className="text-center max-w-lg p-8"
                styleType="subtle"
                hasOutline={false}
                accentPlacement="none"
            >
            <StandardCard.Header className="items-center flex flex-col">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 mb-4">
                    <StandardIcon><AlertTriangle className="h-6 w-6 text-warning-600" /></StandardIcon>
                </div>
                <StandardText variant="subheading" weight="bold" colorScheme="warning">Proyecto No Seleccionado</StandardText>
            </StandardCard.Header>
            <StandardCard.Content><StandardText>Por favor, selecciona un proyecto activo para poder configurar y simular la creación de lotes.</StandardText></StandardCard.Content>
            </StandardCard>
        </div>
      </PageBackground>
    );
  }

  if (projectMembers.length === 0) { // Ya no depende de isLoadingInitialData porque esa etapa ya pasó
     return (
      <PageBackground>
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
            <StandardCard
                disableShadowHover={true}
                colorScheme="primary"
                className="text-center max-w-lg p-8"
                styleType="subtle"
                hasOutline={false}
                accentPlacement="none"
            >
            <StandardCard.Header className="items-center flex flex-col">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-info-100 mb-4">
                    <StandardIcon><AlertTriangle className="h-6 w-6 text-info-600" /></StandardIcon>
                </div>
                <StandardText variant="subheading" weight="bold" colorScheme="neutral">Sin Miembros en el Proyecto</StandardText>
            </StandardCard.Header>
            <StandardCard.Content><StandardText>Este proyecto no tiene miembros asignados. Dirígete a la sección de gestión de miembros para agregar participantes antes de crear lotes.</StandardText></StandardCard.Content>
            {/* Podrías añadir un botón para ir a la página de miembros */}
            </StandardCard>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
        <div className="container mx-auto py-8"> {/* Usando clases de Tailwind para el contenedor principal */}
            <PageTitle
                title="Simulador de Creación de Lotes"
                subtitle={`Define los parámetros para distribuir los artículos del proyecto "${proyectoActual.name}" en lotes de trabajo.`}
                mainIcon={Settings}
            />
            
            {/* TARJETA DE CONFIGURACIÓN */}
            <StandardCard
                className="mt-6 mb-8"
                colorScheme="primary"
                accentPlacement="top"
                accentColorScheme="primary"
                shadow="md"
                disableShadowHover={true}
                styleType="subtle"
                hasOutline={false} // border="top" implies no full outline
            >
                <StandardCard.Header>
                    <StandardText variant="subheading" weight="medium" colorScheme="primary">Configuración de Lotes</StandardText>
                </StandardCard.Header>
                <StandardCard.Content className={`grid md:grid-cols-2 gap-6 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
                    {/* Columna Izquierda: Tamaño de Lote */}
                    <StandardCard
                        disableShadowHover={true}
                        colorScheme="primary"
                        outlineColorScheme="primary"
                        hasOutline={true}
                        className="p-4"
                        styleType="subtle"
                        accentPlacement="none" // border="normal" implies no accent
                    >
                    <StandardText variant="label" weight="semibold" className="mb-1 block">1. Definir Tamaño por Lote</StandardText>
                    <div className="flex justify-between items-baseline my-3">
                        <StandardText size="sm">Artículos/Lote:{" "}
                        <span className="text-2xl font-bold text-primary-text">{batchSize}</span>
                        </StandardText>
                        <StandardText size="sm">Lotes a generar:{" "}
                        <span className="text-2xl font-bold text-primary-text">
                            {isSimulating && !simulationData ? "..." : totalBatchesCalculated}
                        </span>
                        </StandardText>
                    </div>
                    <CustomSlider
                        value={[batchSize]}
                        min={10} max={60} step={1}
                        onValueChange={(v) => setBatchSize(v[0])}
                        showTooltip gradient color="primary" size="md"
                        disabled={isSimulating}
                        className="my-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Lotes pequeños (muchos)</span>
                        <span>Lotes grandes (pocos)</span>
                    </div>
                    <StandardText size="xs" className="text-muted-foreground mt-3">
                        Artículos elegibles en proyecto: {isSimulating && !simulationData ? "Calculando..." : totalEligibleArticles}
                    </StandardText>
                    </StandardCard>

                    {/* Columna Derecha: Selección de Miembros */}
                    <StandardCard
                        disableShadowHover={true}
                        colorScheme="primary"
                        outlineColorScheme="primary"
                        hasOutline={true}
                        className="p-4"
                        styleType="subtle"
                        accentPlacement="none" // border="normal" implies no accent
                    >
                    <StandardText variant="label" weight="semibold" className="mb-3 block">2. Asignar a Miembros</StandardText>
                    <div className="flex gap-2 flex-wrap min-h-[40px]">
                        {projectMembers.map((member) => {
                        const memberColor = memberColorMap[member.user_id] || batchTokens.auxiliaries[0];
                        const isSelected = selectedMemberIds.includes(member.user_id);
                        return (
                            <button
                            key={member.user_id} type="button" disabled={isSimulating}
                            onClick={() => {
                                setSelectedMemberIds((prev) => {
                                const currentlySelected = prev.includes(member.user_id);
                                if (currentlySelected && prev.length === 1) return prev; 
                                return currentlySelected
                                    ? prev.filter((id) => id !== member.user_id)
                                    : [...prev, member.user_id];
                                });
                            }}
                            style={{ /* Estilos de tu botón de miembro, adaptados si es necesario */
                                padding: "4px 12px", borderRadius: 12,
                                border: `2px solid ${memberColor.border}`,
                                background: isSelected ? memberColor.solid : "transparent",
                                color: isSelected ? memberColor.text : memberColor.border,
                                fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                                transition: "background 0.2s, color 0.2s, border-color 0.2s",
                            }}>
                            {member.profile?.public_display_name || member.profile?.first_name || `ID: ${member.user_id.substring(0,6)}`}
                            </button>
                        );
                        })}
                    </div>
                    {selectedMemberIds.length === 0 && !isSimulating && (
                        <StandardText colorScheme="warning" size="xs" className="mt-2">Por favor, selecciona al menos un miembro.</StandardText>
                    )}
                    </StandardCard>
                </StandardCard.Content>
            </StandardCard>

            {/* SECCIÓN DE ERROR GENERAL DE UI O SIMULACIÓN */}
            {uiError && !isSimulating && ( /* Mostrar errores si los hay y no estamos simulando */
                <StandardCard
                    colorScheme="danger"
                    accentPlacement="left"
                    accentColorScheme="danger" // Assuming accent color from variant
                    className="mb-8 p-4"
                    disableShadowHover={true}
                    styleType="subtle"
                    hasOutline={false} // border="left" implies no full outline
                >
                    <div className="flex items-start gap-3">
                        <StandardIcon><AlertTriangle className="h-5 w-5 text-destructive-foreground" /></StandardIcon>
                        <div>
                            <StandardText weight="bold" colorScheme="danger">Problema en la Simulación</StandardText>
                            <StandardText size="sm" className="text-destructive-foreground/90">{uiError}</StandardText>
                            <StandardButton 
                                styleType="outline" size="xs" 
                                onClick={runSimulation} className="mt-3"
                                disabled={isSimulating || selectedMemberIds.length === 0}
                                leftIcon={Settings} // Reintentar
                            >
                                Reintentar Simulación
                            </StandardButton>
                        </div>
                    </div>
                </StandardCard>
            )}

            {/* TARJETA DE VISUALIZACIÓN (Solo si hay datos y no hay error fatal) */}
            {((simulationData && totalBatchesCalculated > 0) || isSimulating) && !uiError && (
            <StandardCard
                colorScheme="primary"
                accentPlacement="top"
                accentColorScheme="secondary"
                shadow="md"
                className="mb-8"
                disableShadowHover={true}
                styleType="subtle"
                hasOutline={false} // border="top" implies no full outline
            >
                <StandardCard.Header>
                    <StandardText size="lg" weight="medium" colorScheme="secondary">Previsualización de la Distribución</StandardText>
                </StandardCard.Header>
                <StandardCard.Content className="grid md:grid-cols-3 gap-6 items-start">
                    {/* Columna Izquierda: Visualización de Lotes (Grilla) */}
                    <div className="md:col-span-2 relative min-h-[300px]"> {/* Contenedor relativo para el loader */}
                        <StandardText size="sm" weight="semibold" className="mb-1 block">Lotes Generados</StandardText>
                        <StandardText size="sm" className="text-muted-foreground mb-3">
                        {isSimulating && !simulationData ? "Calculando distribución..." : 
                            `${totalBatchesCalculated} lotes de ~${batchSize} artículos (Total elegibles: ${totalEligibleArticles})`
                        }
                        </StandardText>
                        
                        {isSimulating && ( 
                            <div className="absolute inset-0 flex items-center justify-center bg-card/70 z-10 rounded-md">
                                <SustratoLoadingLogo variant="spin-pulse" size={40} />
                            </div>
                        )}
                        
                        {displayableBatches.length > 0 && (
                            <div className={`grid gap-2 w-full items-center justify-center ${isSimulating ? 'opacity-50' : ''}`}
                                style={{gridTemplateColumns: `repeat(${Math.min(gridColumns, 15)}, minmax(0, 1fr))`}} // Limitar a max 15 columnas visuales
                            >
                            {displayableBatches.map((batchInfo) => {
                                const assignedMemberColor = batchInfo.assignedToMemberId ? memberColorMap[batchInfo.assignedToMemberId] : batchTokens.auxiliaries[0];
                                const pastel = assignedMemberColor?.solid || "#e0e0e0";
                                const border = tinycolor(pastel).darken(15).toHexString();
                                const textColor = tinycolor.mostReadable(pastel, ["#222", "#fff"]).toHexString();
                                const itemSize = Math.max(28, Math.min(50, (320 / Math.min(gridColumns,10)) * 0.8 )); // Ajuste de tamaño
                                
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
                        {totalBatchesCalculated === 0 && !isSimulating && simulationData && (
                            <StandardText className="text-center text-muted-foreground py-8">No se generarán lotes con los parámetros actuales.</StandardText>
                        )}
                    </div>

                    {/* Columna Derecha: Peso del Lote */}
                    <div className="min-h-[300px]">
                        <StandardText size="sm" weight="semibold" className="mb-3 block text-center md:text-left">Peso Visual del Lote</StandardText>
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
                                    width: "85%", height: `${pesoLoteBarItemHeight}px`,
                                    background: batchTokens.auxiliaries[0].solid, borderRadius: '2px',
                                    marginTop: i === itemsToShowInPesoLote - 1 ? 0 : `${pesoLoteBarItemGap}px`,
                                }}
                                />
                            ))}
                            </div>
                            <div className="text-center">
                            <StandardText size="4xl" weight="bold" style={{ color: appColorTokens.primary.pure }}>
                                {batchSize}
                            </StandardText>
                            <StandardText size="xs" className="text-muted-foreground">
                                elementos por lote
                            </StandardText>
                            </div>
                        </div>
                    </div>
                </StandardCard.Content>
            </StandardCard>
            )}
            
            {/* TARJETA DE CONFIRMACIÓN Y ACCIÓN */}
            {simulationData && totalBatchesCalculated > 0 && !uiError && !isSimulating && (
                <StandardCard
                    colorScheme="success"
                    accentPlacement="top"
                    accentColorScheme="success"
                    shadow="md"
                    disableShadowHover={true}
                    styleType="subtle"
                    hasOutline={false} // border="top" implies no full outline
                >
                    <StandardCard.Header className="flex items-center gap-2">
                        <StandardIcon><CheckCircle className="h-6 w-6 text-success-fg"/></StandardIcon>
                        <StandardText size="lg" weight="medium" colorScheme="success">Confirmar y Crear Lotes</StandardText>
                    </StandardCard.Header>
                    <StandardCard.Content className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-grow">
                            <StandardText size="sm" className="text-muted-foreground">
                                Se generarán <strong className="text-foreground">{totalBatchesCalculated}</strong> lotes
                                con un tamaño aproximado de <strong className="text-foreground">{batchSize}</strong> artículos cada uno,
                                distribuidos entre <strong className="text-foreground">{selectedMemberIds.length}</strong> miembro(s) seleccionado(s).
                            </StandardText>
                            {/* El desglose de articlesPerMember ya no está aquí para la prueba */}
                        </div>
                        <StandardButton
                            colorScheme="success"
                            styleType="outline"
                            size="lg"
                            // onClick={handleCrearLotes} // Implementar esta función
                            disabled={isSimulating} // Añadir otros disabled si es necesario
                            leftIcon={CheckCircle}
                            className="w-full md:w-auto"
                        >
                            Crear {totalBatchesCalculated} Lotes
                        </StandardButton>
                    </StandardCard.Content>
                </StandardCard>
            )}
        </div>
    </PageBackground>
  );
  //#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Esta página es una visualización/simulador y no crea lotes reales.
// Considerar si el nombre "BatchSimulatorPage" es adecuado o si debería ser más específico a visualización.
// La funcionalidad de crear lotes reales fue movida a `BatchSimulatorPage.tsx` (el que tiene la prop `onBatchesCreatedSuccessfully`).
// Este componente podría renombrarse a algo como `BatchDistributionVisualizer.tsx` si solo simula y visualiza.
//#endregion ![todo]