'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/app/auth-provider';
import {
  getProjectBatchesForUser,
  type BatchWithCounts,
} from '@/lib/actions/preclassification-actions';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardPieChart, type PieChartData } from '@/components/charts/StandardPieChart';
import {
  StandardSphereGrid,
  type SphereItemData,
} from '@/components/ui/StandardSphereGrid';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { useJobManager } from '@/app/contexts/JobManagerContext';
import { useDialog } from '@/app/contexts/DialogContext';

// Fuente de verdad para los estados de los ARTÍCULOS y su representación visual.
const ARTICLE_STATUS_VISUALS = {
  pendientesRevision: { label: 'Pend. Revisión', emoticon: '🔍', colorScheme: 'primary' },
  pendientesReconciliacion: { label: 'Pend. Reconciliación', emoticon: '🔄', colorScheme: 'accent' },
  validados: { label: 'Validados', emoticon: '⚖️', colorScheme: 'warning' },
  reconciliados: { label: 'Reconciliados', emoticon: '✅', colorScheme: 'success' },
  enDisputa: { label: 'En Disputa', emoticon: '⚠️', colorScheme: 'danger' },
  acordados: { label: 'Acordados', emoticon: '🤝', colorScheme: 'tertiary' },
};

const getVisualsForStatus = (
  status: string | undefined | null,
): { emoticon: string; colorScheme: ColorSchemeVariant } => {
    if (!status) return { emoticon: '❔', colorScheme: 'neutral' };
  switch (status.toUpperCase()) {
    case 'PENDING':
      return { emoticon: '⏰', colorScheme: 'neutral' };
    case 'TRANSLATED':
      return { emoticon: '🇪🇸', colorScheme: 'tertiary' };
    case 'REVIEW_PENDING':
      return { emoticon: '🔍', colorScheme: 'primary' };
    case 'RECONCILIATION_PENDING':
      return { emoticon: '🔄', colorScheme: 'accent' };
    case 'VALIDATED':
      return { emoticon: '⚖️', colorScheme: 'warning' };
    case 'RECONCILED':
      return { emoticon: '✅', colorScheme: 'success' };
    case 'DISPUTED':
      return { emoticon: '⚠️', colorScheme: 'danger' };
    default:
      return { emoticon: '❔', colorScheme: 'neutral' };
  }
};

const PreclassificationPage = () => {
  const auth = useAuth();
  const [batches, setBatches] = useState<BatchWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const { startJob } = useJobManager();
  const { showDialog } = useDialog();

  type ResumenGeneral = {
    pendientesRevision: number;
    pendientesReconciliacion: number;
    reconciliados: number;
    enDisputa: number;
    acordados: number;
  };

  const resumenGeneral: ResumenGeneral = useMemo(() => {
    return batches.reduce((acc: ResumenGeneral, lote: BatchWithCounts) => {
        acc.pendientesRevision += lote.article_counts?.pending_review || 0;
        acc.pendientesReconciliacion += lote.article_counts?.reconciliation_pending || 0;
        acc.reconciliados += lote.article_counts?.reconciled || 0;
        acc.enDisputa += lote.article_counts?.disputed || 0;
        acc.acordados += lote.article_counts?.agreed || 0;
        return acc;
    }, {
        pendientesRevision: 0,
        pendientesReconciliacion: 0,
        reconciliados: 0,
        enDisputa: 0,
        acordados: 0,
    });
  }, [batches]);

  const sphereGridTitle = useMemo(() => {
        const userName = auth.user?.user_metadata?.full_name || 'Investigador';
    if (isLoading) return 'Cargando lotes...';
    if (batches.length > 0) return `${batches.length} lotes asignados a ${userName}`;
    return 'Lotes Asignados';
    }, [auth.user, batches, isLoading]);

  const pieChartData: PieChartData[] = useMemo(() => {
    return (Object.entries(resumenGeneral) as [keyof ResumenGeneral, number][])
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        id: key,
        value: value,
        label: ARTICLE_STATUS_VISUALS[key as keyof typeof ARTICLE_STATUS_VISUALS]?.label || key,
      }));
  }, [resumenGeneral]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchBatches = async () => {
            if (auth.authLoading) return; // Esperar a que la autenticación termine de cargar

            const userId = auth.user?.id;
            const projectId = auth.proyectoActual?.id;

      if (projectId && userId) {
        setIsLoading(true);
        setError(null);
        const result = await getProjectBatchesForUser(projectId, userId);
        console.log('Datos crudos recibidos de getProjectBatchesForUser:', result);
        if (result.success) {
          setBatches(result.data || []);
        } else {
          setError(result.error || 'Ocurrió un error desconocido.');
          setBatches([]);
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('No se pudo determinar el usuario o el proyecto activo.');
      }
    };

    fetchBatches();

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
    }, [auth.user, auth.proyectoActual, auth.authLoading]);

  const handleSphereClick = (batchId: string, batchNumber: number) => {
    showDialog({
      title: `Confirmar Traducción de Lote`,
      content: `¿Estás seguro de que quieres iniciar la traducción para todos los artículos del lote ${batchNumber}? Esta acción procesará los artículos en segundo plano y no se puede deshacer.`,
      confirmText: 'Sí, Iniciar Traducción',
      cancelText: 'No, cancelar',
      colorScheme: 'primary',
      onConfirm: () => {
        startJob({
          type: 'TRANSLATE_BATCH',
          title: `Traduciendo Lote #${batchNumber}`,
          payload: { batchId, userId: auth.user?.id || 'unknown_user' },
        });
      },
    });
  };

  const sphereData: SphereItemData[] = useMemo(() => {
    return batches.map(batch => {
      const visuals = getVisualsForStatus(batch.status);
      const counts = batch.article_counts;
      const totalArticles = 
        (counts?.pending_review || 0) +
        (counts?.reconciliation_pending || 0) +
        (counts?.agreed || 0) +
        (counts?.reconciled || 0) +
        (counts?.disputed || 0);

      return {
        id: batch.id,
        keyGroup: batch.status,
        emoticon: visuals.emoticon,
        value: batch.batch_number, 
        colorScheme: visuals.colorScheme,
        onClick: () => handleSphereClick(batch.id, batch.batch_number),
        tooltip: [
          `*Lote:* ${batch.batch_number} - *Total:* ${totalArticles}`,
          '---',
          `*Pend. Revisión:* ${counts?.pending_review || 0}`,
          `*Pend. Reconciliación:* ${counts?.reconciliation_pending || 0}`,
          `*Acordados:* ${counts?.agreed || 0}`,
          `*Reconciliados:* ${counts?.reconciled || 0}`,
          `*En Disputa:* ${counts?.disputed || 0}`
        ].join('\n'),
        statusBadge: counts?.pending_review ? {
          text: counts.pending_review.toString(),
          colorScheme: 'warning',
          tooltip: `${counts.pending_review} artículos pendientes de revisión`
        } : undefined
      };
    });
  }, [batches]);

  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col">
      <StandardPageTitle
        title="Preclasificación de Lotes"
        subtitle="Selecciona un lote para iniciar el proceso de clasificación de artículos."
      />
      <div className="mt-6 flex-grow" ref={containerRef}>
        {dimensions.width > 0 && (
            <StandardSphereGrid
              items={sphereData}
              containerWidth={dimensions.width}
              containerHeight={dimensions.height}
              groupByKeyGroup
              forceBadge={true}
              title={sphereGridTitle}
              isLoading={isLoading}
              loadingMessage="Cargando lotes..."
              emptyStateText={error ? `Error: ${error}` : 'No hay lotes para mostrar.'}
            />
        )}
      </div>
      {pieChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <StandardCard title="Detalle de artículos contenidos" className="md:col-span-2">
            <StandardCard.Content>
              <StandardPieChart data={pieChartData} onColorMapGenerated={setColorMap} />
            </StandardCard.Content>
          </StandardCard>
          <StandardCard title="Leyenda">
            <StandardCard.Content>
              <div className="flex flex-col space-y-3">
                {Object.entries(ARTICLE_STATUS_VISUALS).map(([key, { label, emoticon }]) => {
                  const count = resumenGeneral[key as keyof ResumenGeneral] || 0;
                  return (
                    <div key={key} className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3 border border-neutral-shade"
                        style={{ 
                          backgroundColor: colorMap[key] || 'transparent',
                        }}
                      />
                      <span className="mr-2">{emoticon}</span>
                      <span>{label} ({count})</span>
                    </div>
                  );
                })}
              </div>
            </StandardCard.Content>
          </StandardCard>
        </div>
      )}
    </div>
  );
};

export default PreclassificationPage;
