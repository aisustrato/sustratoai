//. 📍 app/datos-maestros/lote/components/ProjectBatchesDisplay.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useMemo, useRef, useEffect } from "react";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import {
  AlertTriangle,
  Trash2,
  Clock,
  Zap,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
  Layers,
} from "lucide-react";
import { StandardIcon } from "@/components/ui/StandardIcon";
import type { BatchStatusEnum } from "@/lib/database.types";
import { toast as sonnerToast } from "sonner";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardSphereGrid, type SphereItemData } from "@/components/ui/StandardSphereGrid";
import type { StatusBadgeInfo } from "@/components/ui/StandardSphere";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
//#endregion ![head]

//#region [def] - 📦 TYPES, INTERFACES & CONSTANTS 📦
export interface DisplayableBatch {
  id: string;
  batch_number: number;
  name: string | null;
  status: BatchStatusEnum | string;
  assigned_to_member_id?: string | null;
  assigned_to_member_name?: string | null;
  article_count?: number;
}

interface ProjectBatchesDisplayProps {
  projectId: string;
  lotes: DisplayableBatch[];
  onResetAllBatches: () => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  permisoParaResetearGeneral: boolean;
}


//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function ProjectBatchesDisplay({
  lotes,
  onResetAllBatches,
  permisoParaResetearGeneral,
}: ProjectBatchesDisplayProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [dialogResetOpen, setDialogResetOpen] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = gridContainerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
        console.log(`[ProjectBatchesDisplay Sensor] Container measured: ${width.toFixed(2)}px W, ${height.toFixed(2)}px H`);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);


  const todosLosLotesEstanPendientes =
    lotes.length > 0 && lotes.every((lote) => lote.status === "pending");
  const mostrarBotonReset =
    permisoParaResetearGeneral && todosLosLotesEstanPendientes;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    sonnerToast.promise(onResetAllBatches(), {
      loading: "Eliminando lotes...",
      success: (data) => {
        setDialogResetOpen(false);
        return data.message || "Lotes eliminados con éxito";
      },
      error: (err) => {
        setDialogResetOpen(false);
        return err.message || "Error al eliminar los lotes";
      },
      finally: () => {
        setIsResetting(false);
      },
    });
  };

  const sphereData: SphereItemData[] = useMemo(() => {
    if (!lotes) return [];
    return lotes.map((lote) => {
      const tooltipContent = lote.name
        ? `${lote.name} (Lote ${lote.batch_number})`
        : `Lote ${lote.batch_number}`;

      return {
        id: lote.id,
        value: lote.batch_number,
        keyGroup: lote.status,
        colorScheme: "neutral", // Esferas siempre neutrales en este contexto
        styleType: "filled",
        statusBadge: {
          text: lote.status,
          colorScheme: 'primary',
          styleType: 'subtle',
        },
        tooltip: tooltipContent,
      };
    });
  }, [lotes]);

  if (!lotes || lotes.length === 0) {
    return (
      <StandardPageBackground>
        <div className="text-center py-12">
          <StandardIcon
            size="2xl"
            colorScheme="neutral"
            className="mx-auto text-gray-400"
          >
            <Layers />
          </StandardIcon>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay lotes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Actualmente no hay lotes para este proyecto.
          </p>
        </div>
      </StandardPageBackground>
    );
  }

  return (
    <StandardPageBackground>
      <div className="space-y-6">
        <StandardCard
          colorScheme="neutral"
          className="overflow-visible"
          styleType="subtle"
        >
          <StandardCard.Header className="flex justify-between items-center">
            <StandardCard.Title>Visualización de Lotes</StandardCard.Title>
            {mostrarBotonReset && (
              <StandardDialog open={dialogResetOpen} onOpenChange={setDialogResetOpen}>
                <StandardDialog.Trigger asChild>
                  <StandardButton
                    colorScheme="danger"
                    size="sm"
                    leftIcon={Trash2}
                  >
                    Eliminar todos los lotes
                  </StandardButton>
                </StandardDialog.Trigger>
                <StandardDialog.Content colorScheme="danger">
                  <StandardDialog.Header>
                    <StandardDialog.Title>Confirmar Eliminación Masiva</StandardDialog.Title>
                    <StandardDialog.Description>
                      Esta acción no se puede deshacer. Todos los lotes de este proyecto serán eliminados permanentemente. ¿Estás seguro?
                    </StandardDialog.Description>
                  </StandardDialog.Header>
                  <StandardDialog.Footer>
                    <StandardDialog.Close asChild>
                      <StandardButton colorScheme="neutral">Cancelar</StandardButton>
                    </StandardDialog.Close>
                    <StandardButton
                      colorScheme="danger"
                      onClick={handleConfirmReset}
                      loading={isResetting}
                    >
                      Sí, eliminar todo
                    </StandardButton>
                  </StandardDialog.Footer>
                </StandardDialog.Content>
              </StandardDialog>
            )}
          </StandardCard.Header>
          <StandardCard.Content ref={gridContainerRef} className="p-4 md:p-6 relative h-[400px]">
              <StandardSphereGrid 
                items={sphereData} 
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />
            </StandardCard.Content>

            {permisoParaResetearGeneral && !todosLosLotesEstanPendientes && lotes.length > 0 && (
              <div className="mt-6 p-3 bg-warning-50 dark:bg-warning-900/30 border-l-4 border-warning-500 dark:border-warning-400 rounded">
                <div className="flex">
                  <div className="flex-shrink-0 pt-0.5">
                    <StandardIcon
                      colorScheme="warning"
                      size="sm"
                      aria-hidden="true"
                    >
                      <AlertTriangle />
                    </StandardIcon>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                      No se pueden eliminar los lotes masivamente
                    </p>
                    <p className="mt-1 text-sm text-warning-700 dark:text-warning-300">
                      Uno o más lotes ya han sido iniciados (no están en
                      estado 'pending').
                    </p>
                  </div>
                </div>
              </div>
            )}
        </StandardCard>
      </div>
    </StandardPageBackground>
  );
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar la paginación o virtualización si el número de lotes es muy grande.
// Mejorar la accesibilidad de los elementos interactivos (tooltips, botones).
// Podría haber una opción para ver detalles de un lote específico.
//#endregion ![todo]
