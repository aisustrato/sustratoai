//. 📍 app/datos-maestros/lote/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/auth-provider';
import BatchSimulatorPage from './components/BatchSimulatorPage'; 
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSphereGrid } from "@/components/ui/StandardSphereGrid";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { useWindowSize } from "@/lib/hooks/useWindowSize";
import { useLayout } from '@/app/contexts/layout-context';
import { useTheme } from '@/app/theme-provider';
import { AlertTriangle, Users, FileText, Boxes, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { 
    getBatchingStatusForActivePhase,
    getBatchesForPhaseDisplay,
    resetBatchesForPhase
} from '@/lib/actions/batch-actions'; 
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
type ViewState = 'loading' | 'no_active_phase' | 'universe_not_defined' | 'ready_for_batching' | 'batches_created' | 'error';

// Tipos específicos para los datos de lotes
interface BatchData {
  id: string;
  batch_number: number;
  status?: string;
  total_items?: number;
  assigned_member_name?: string;
  phase_name?: string;
}

interface BatchingStatusData {
  status: string;
  activePhase?: {
    id: string;
    phase_number: number;
  };
  totalUniverseSize?: number;
  canResetBatches?: boolean;
}

// Fuente de verdad para los estados de los LOTES y su representación visual
const BATCH_STATUS_VISUALS = {
  pending: {
    label: "Pendiente",
    emoticon: "🔍",
    colorScheme: "neutral" as const,
  },
  translated: {
    label: "Traducido",
    emoticon: "🇪🇸",
    colorScheme: "tertiary" as const,
  },
  reviewPending: {
    label: "Pend. Revisión",
    emoticon: "🔍",
    colorScheme: "primary" as const,
  },
  reconciliationPending: {
    label: "Pend. Reconciliación",
    emoticon: "🔄",
    colorScheme: "accent" as const,
  },
  validated: {
    label: "Validado",
    emoticon: "👍🏻",
    colorScheme: "warning" as const,
  },
  reconciled: {
    label: "Reconciliado",
    emoticon: "🤝",
    colorScheme: "success" as const,
  },
  disputed: {
    label: "En Disputa",
    emoticon: "⚠️",
    colorScheme: "danger" as const,
  },
  noStatus: {
    label: "Sin Estado",
    emoticon: "📎",
    colorScheme: "neutral" as const,
  },
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function LotesOrquestadorPage() {
  const { proyectoActual, user } = useAuth();
  
  //#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [batchingStatus, setBatchingStatus] = useState<BatchingStatusData | null>(null);
  const [batchesData, setBatchesData] = useState<BatchData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  // Hooks para dimensiones reactivas - igual que preclasificación
  const { width: windowWidth } = useWindowSize();
  const { sidebarWidth, layoutGap, globalXPadding } = useLayout();
  const { appColorTokens } = useTheme();
  
  // Calcula el ancho disponible restando el sidebar y un padding general
  const containerWidth = useMemo(() => {
    const calculatedWidth = windowWidth ? windowWidth - sidebarWidth - layoutGap - globalXPadding : 0;
    return calculatedWidth;
  }, [windowWidth, sidebarWidth, layoutGap, globalXPadding]);
  
  // La altura puede ser fija o depender de la ventana menos la navbar, etc.
  const containerHeight = 500; // Mantenemos la altura fija del div por ahora

  const permisoGestionGeneral = proyectoActual?.permissions?.can_create_batches || false;

  // Función para obtener colores dinámicamente desde el theme provider
  const getColorForStatus = useMemo(() => {
    return (statusKey: keyof typeof BATCH_STATUS_VISUALS): string => {
      const colorScheme = BATCH_STATUS_VISUALS[statusKey].colorScheme;
      return appColorTokens[colorScheme]?.bg || appColorTokens.neutral.bg;
    };
  }, [appColorTokens]);

  // Generar mapa de colores para la leyenda
  const legendColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.keys(BATCH_STATUS_VISUALS).forEach((key) => {
      map[key] = getColorForStatus(key as keyof typeof BATCH_STATUS_VISUALS);
    });
    return map;
  }, [getColorForStatus]);

  const cargarEstadoLoteo = useCallback(async () => {
    if (!proyectoActual?.id || !user?.id) {
      setViewState('error');
      setError('No hay proyecto activo o usuario no autenticado.');
      return;
    }

    setViewState('loading');
    setError(null);
    
    try {
      console.log(`🔄 Cargando estado de loteo para proyecto: ${proyectoActual.id}`);
      
      const statusResult = await getBatchingStatusForActivePhase(proyectoActual.id);
      
      if (!statusResult.success) {
        setViewState('error');
        setError(statusResult.error || 'Error al obtener el estado del proceso de loteo.');
        return;
      }

      const status = statusResult.data;
      setBatchingStatus(status);
      
      console.log(`📊 Estado recibido:`, status);

      // Mapear el estado del gateway a nuestro viewState
      switch (status.status) {
        case 'NO_ACTIVE_PHASE':
          setViewState('no_active_phase');
          break;
        case 'UNIVERSE_NOT_DEFINED':
          setViewState('universe_not_defined');
          break;
        case 'READY_FOR_BATCHING':
          setViewState('ready_for_batching');
          break;
        case 'BATCHES_CREATED':
          setViewState('batches_created');
          // Cargar los lotes existentes para mostrar
          if (status.activePhase?.id) {
            const batchesResult = await getBatchesForPhaseDisplay(status.activePhase.id);
            if (batchesResult.success) {
              setBatchesData(batchesResult.data);
            } else {
              console.warn('⚠️ Error al cargar lotes para visualización:', batchesResult.error);
            }
          }
          break;
        default:
          setViewState('error');
          setError('Estado desconocido recibido del servidor.');
      }
    } catch (error) {
      console.error('❌ Excepción al cargar estado de loteo:', error);
      setViewState('error');
      setError(`Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [proyectoActual?.id, user?.id]); 

  useEffect(() => {
    cargarEstadoLoteo();
  }, [cargarEstadoLoteo]);


  const handleBatchesCreated = () => {
    console.log('✅ Lotes creados exitosamente, recargando estado...');
    cargarEstadoLoteo(); 
  };

  const handleResetBatches = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!proyectoActual?.id || !batchingStatus?.activePhase?.id) {
      return { success: false, error: "No hay proyecto activo o fase activa." };
    }
    if (!permisoGestionGeneral) {
      return { success: false, error: "No tienes permisos para resetear lotes." };
    }
    
    setIsResetting(true);
    try {
      const result = await resetBatchesForPhase(batchingStatus.activePhase.id, proyectoActual.id);
      if (result.success) {
        console.log('✅ Lotes reseteados exitosamente:', result.data);
        cargarEstadoLoteo(); // Recargar estado
        return { success: true, message: `Se eliminaron ${result.data.deletedBatches} lotes y ${result.data.deletedItems} elementos.` };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: `Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}` };
    } finally {
      setIsResetting(false);
    }
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  
  // Estado de carga
  if (viewState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SustratoLoadingLogo text="Cargando estado del proceso de loteo..." />
      </div>
    );
  }

  // Sin proyecto activo
  if (!proyectoActual) {
    return (
      <div className="container mx-auto py-8">
        <StandardCard
          disableShadowHover={true}
          colorScheme="primary"
          styleType="subtle"
          className="mt-6 text-center max-w-lg mx-auto p-8"
          hasOutline={false}
          accentPlacement="none"
        >
          <StandardCard.Header className="items-center flex flex-col">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 mb-4">
              <StandardIcon><AlertTriangle className="h-6 w-6 text-warning-600" /></StandardIcon>
            </div>
            <StandardText size="lg" weight="bold" colorScheme="warning">Proyecto No Seleccionado</StandardText>
          </StandardCard.Header>
          <StandardCard.Content>
            <StandardText>Por favor, selecciona un proyecto activo para gestionar los lotes.</StandardText>
          </StandardCard.Content>
        </StandardCard>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col">
      {/* Título condicional: solo se muestra cuando no estamos en ready_for_batching */}
      {viewState !== 'ready_for_batching' && (
        <StandardPageTitle
          title="Gestión de Lotes por Fases"
          subtitle={viewState === 'no_active_phase' ? 'Sin fase activa' : 
                   viewState === 'universe_not_defined' ? 'Configuración requerida' :
                   viewState === 'batches_created' ? 'Lotes creados' :
                   viewState === 'error' ? 'Error en el proceso' : 'Cargando...'}
          description="Sistema de loteo inteligente basado en fases del proyecto"
          showBackButton={{ href: "/datos-maestros" }}
          breadcrumbs={[
            { label: "Datos maestros", href: "/datos-maestros" },
            { label: "Lotes", href: "/datos-maestros/lote" },
          ]}
        />
      )}
      {/* Estado: Sin fase activa */}
      {viewState === 'no_active_phase' && (
        <div className="flex-grow flex items-center justify-center">
          <StandardCard
            colorScheme="warning"
            accentPlacement="left"
            accentColorScheme="warning"
            shadow="md"
            styleType="subtle"
            hasOutline={false}
            className="max-w-2xl mx-auto"
          >
          <StandardCard.Header className="flex items-center gap-3">
            <StandardIcon><Users className="h-6 w-6 text-warning-600" /></StandardIcon>
            <StandardText preset="subheading" weight="medium" colorScheme="warning">
              No hay fase activa
            </StandardText>
          </StandardCard.Header>
          <StandardCard.Content className="space-y-4">
            <StandardText>
              Para crear lotes de artículos, primero necesitas tener una fase de preclasificación activa.
            </StandardText>
            <div className="flex justify-center">
              <Link href="/datos-maestros/fases-preclasificacion">
                <StandardButton
                  colorScheme="warning"
                  styleType="solid"
                  rightIcon={ArrowRight}
                >
                  Ir a Gestión de Fases
                </StandardButton>
              </Link>
            </div>
          </StandardCard.Content>
          </StandardCard>
        </div>
      )}

      {/* Estado: Universo no definido */}
      {viewState === 'universe_not_defined' && batchingStatus?.activePhase && (
        <div className="flex-grow flex items-center justify-center">
          <StandardCard
            colorScheme="accent"
            accentPlacement="left"
            accentColorScheme="accent"
            shadow="md"
            styleType="subtle"
            hasOutline={false}
            className="max-w-2xl mx-auto"
          >
          <StandardCard.Header className="flex items-center gap-3">
            <StandardIcon><FileText className="h-6 w-6 text-accent-600" /></StandardIcon>
            <StandardText preset="subheading" weight="medium" colorScheme="accent">
              Universo de artículos no definido
            </StandardText>
          </StandardCard.Header>
          <StandardCard.Content className="space-y-4">
            <StandardText>
              La fase {batchingStatus.activePhase.phase_number} está activa, pero no tiene artículos elegibles definidos.
              Necesitas configurar el universo de artículos antes de crear lotes.
            </StandardText>
            <div className="flex justify-center">
              <Link href={`/datos-maestros/fases-preclasificacion?phase=${batchingStatus.activePhase.id}`}>
                <StandardButton
                  colorScheme="accent"
                  styleType="solid"
                  rightIcon={ArrowRight}
                >
                  Configurar Artículos Elegibles
                </StandardButton>
              </Link>
            </div>
          </StandardCard.Content>
          </StandardCard>
        </div>
      )}

      {/* Estado: Listo para crear lotes */}
      {viewState === 'ready_for_batching' && (
        <BatchSimulatorPage 
          onBatchesCreatedSuccessfully={handleBatchesCreated} 
        />
      )}

      {/* Estado: Lotes ya creados */}
      {viewState === 'batches_created' && batchingStatus && (
        <div className="mt-6 flex-grow flex flex-col gap-6">
          {/* Header con información de la fase */}
          <StandardCard
            colorScheme="success"
            accentPlacement="top"
            accentColorScheme="success"
            shadow="md"
            styleType="subtle"
            hasOutline={false}
          >
            <StandardCard.Header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StandardIcon><Boxes className="h-6 w-6 text-success-600" /></StandardIcon>
                <div>
                  <StandardText preset="subheading" weight="medium" colorScheme="success">
                    Lotes Creados - Fase {batchingStatus.activePhase?.phase_number}
                  </StandardText>
                  <StandardText size="sm" className="text-muted-foreground">
                    {batchingStatus.totalUniverseSize} artículos en el universo
                  </StandardText>
                </div>
              </div>
              {permisoGestionGeneral && batchingStatus.canResetBatches && (
                <StandardButton
                  colorScheme="danger"
                  styleType="outline"
                  size="sm"
                  onClick={handleResetBatches}
                  loading={isResetting}
                  disabled={isResetting}
                >
                  {isResetting ? 'Reseteando...' : 'Resetear Lotes'}
                </StandardButton>
              )}
            </StandardCard.Header>
          </StandardCard>

          {/* Área de visualización de lotes - igual que preclasificación */}
          <div className="h-[500px] w-full">
            {containerWidth && (
              <StandardSphereGrid
                items={batchesData.map((batch: BatchData) => {
                  // Función para obtener visuales basada en la estructura centralizada
                  const getVisualsForBatchStatus = (status: string | undefined | null) => {
                    if (!status) return BATCH_STATUS_VISUALS.noStatus;
                    
                    switch (status.toUpperCase()) {
                      case "PENDING":
                        return BATCH_STATUS_VISUALS.pending;
                      case "TRANSLATED":
                        return BATCH_STATUS_VISUALS.translated;
                      case "REVIEW_PENDING":
                        return BATCH_STATUS_VISUALS.reviewPending;
                      case "RECONCILIATION_PENDING":
                        return BATCH_STATUS_VISUALS.reconciliationPending;
                      case "VALIDATED":
                        return BATCH_STATUS_VISUALS.validated;
                      case "RECONCILED":
                        return BATCH_STATUS_VISUALS.reconciled;
                      case "DISPUTED":
                        return BATCH_STATUS_VISUALS.disputed;
                      default:
                        return BATCH_STATUS_VISUALS.noStatus;
                    }
                  };
                  
                  const visuals = getVisualsForBatchStatus(batch.status);
                  const totalArticles = batch.total_items || 0;
                  const assignedMember = batch.assigned_member_name || 'Sin asignar';
                  
                  return {
                    id: batch.id,
                    label: `Lote ${batch.batch_number}`,
                    value: batch.batch_number,
                    emoticon: visuals.emoticon,
                    colorScheme: visuals.colorScheme,
                    keyGroup: assignedMember,
                    tooltip: [
                      `**Lote ${batch.batch_number}**`,
                      `**Investigador:** ${assignedMember}`,
                      `**Total Artículos:** ${totalArticles}`,
                      `**Estado:** ${batch.status || 'Pendiente'}`,
                      batch.phase_name ? `**Fase:** ${batch.phase_name}` : ""
                    ].filter(line => line !== "").join("\n"),
                    statusBadge: assignedMember !== 'Sin asignar' ? {
                      text: assignedMember.length > 3 ? `${assignedMember.substring(0, 3)}..` : assignedMember,
                      colorScheme: "primary" as const,
                      tooltip: `Asignado a: ${assignedMember}`
                    } : undefined
                  };
                })}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                groupByKeyGroup
                forceBadge={true}
                title="Distribución de Lotes por Fase"
                isLoading={false}
                loadingMessage="Cargando lotes..."
                emptyStateText="No hay lotes para mostrar."
              />
            )}
          </div>

          {/* Leyenda de estados - colores dinámicos desde theme provider */}
          <StandardCard
            title="Estados de Lotes"
            colorScheme="primary"
            styleType="subtle"
            hasOutline={false}
            shadow="md"
          >
            <StandardCard.Content>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(BATCH_STATUS_VISUALS).map(([key, { label, emoticon }]) => {
                  const colorScheme = BATCH_STATUS_VISUALS[key as keyof typeof BATCH_STATUS_VISUALS].colorScheme;
                  const bgColor = legendColorMap[key] || appColorTokens.neutral.bg;
                  const borderColor = appColorTokens[colorScheme]?.pure || appColorTokens.neutral.pure;
                  
                  return (
                    <div key={key} className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 shadow-sm"
                        style={{ 
                          backgroundColor: bgColor,
                          borderColor: borderColor
                        }}
                      />
                      <StandardText size="sm">
                        {emoticon} {label}
                      </StandardText>
                    </div>
                  );
                })}
              </div>
            </StandardCard.Content>
          </StandardCard>
        </div>
      )}

      {/* Estado de error */}
      {viewState === 'error' && (
        <StandardCard
          colorScheme="danger"
          accentPlacement="left"
          accentColorScheme="danger"
          shadow="md"
          styleType="subtle"
          hasOutline={false}
          className="max-w-2xl mx-auto"
        >
          <StandardCard.Header className="flex items-center gap-3">
            <StandardIcon><AlertTriangle className="h-6 w-6 text-danger-600" /></StandardIcon>
            <StandardText preset="subheading" weight="medium" colorScheme="danger">
              Error en el Sistema de Lotes
            </StandardText>
          </StandardCard.Header>
          <StandardCard.Content className="space-y-4">
            <StandardText>
              {error && ('Ha ocurrido un error inesperado.')}
            </StandardText>
            <div className="flex justify-center">
              <StandardButton
                colorScheme="danger"
                styleType="outline"
                onClick={cargarEstadoLoteo}
              >
                Reintentar
              </StandardButton>
            </div>
          </StandardCard.Content>
        </StandardCard>
      )}
    </div>
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