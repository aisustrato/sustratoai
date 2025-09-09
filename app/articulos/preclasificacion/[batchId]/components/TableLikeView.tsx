"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardPopupWindow } from "@/components/ui/StandardPopupWindow";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardInput } from "@/components/ui/StandardInput";
import { Search, StickyNote, Check, ThumbsDown } from "lucide-react";
import ArticleGroupManager from "@/app/articulos/preclasificacion_old/[batchId]/components/ArticleGroupManager";
import { DimensionDisplay } from "./DimensionDisplay";
import type { ArticleForReview, ClassificationReview } from "@/lib/types/preclassification-types";
import { toast } from "sonner";

interface TableLikeViewArticle {
  id: string;
  title: string;
  abstract: string;
  ai_summary: string;
  year: string;
  journal: string;
  displayIndex?: number;
  originalArticle: ArticleForReview;
  hasNotes: boolean;
  classifications?: Record<string, ClassificationReview[]>;
}

interface TableLikeViewProps {
  cardData: TableLikeViewArticle[];
  dimensionOrder: string[];
  dimensionLabelById: Record<string, string>;
  dimensionIconById: Record<string, string | null>;
  optionEmoticonsByDimId: Record<string, Record<string, string | null>>;
  // Nuevos mapas: tipo y opciones por dimensión
  dimensionTypeById: Record<string, string>; // 'finite' | 'open'
  optionsByDimId: Record<string, (string | { value: string | number; label: string })[]>;
  showOriginalAsPrimary: boolean;
  batchId: string;
  batchNumber?: number | null;
  groupsPresenceByItemId: Record<string, boolean>;
  isLoadingGroupsPresence: boolean;
  compact?: boolean;
  onOpenNotes: (article: ArticleForReview) => void;
  onGroupsChanged: (itemId: string, hasGroups: boolean) => void;
  approveAllRequestId?: number;
  resetAllRequestId?: number;
  onGlobalBulkPersistResult?: (ok: boolean, prevalidated: boolean) => void;
}

export const TableLikeView: React.FC<TableLikeViewProps> = ({
  cardData,
  dimensionOrder,
  dimensionLabelById,
  dimensionIconById,
  optionEmoticonsByDimId,
  dimensionTypeById,
  optionsByDimId,
  showOriginalAsPrimary,
  batchId,
  batchNumber,
  groupsPresenceByItemId,
  isLoadingGroupsPresence,
  compact,
  onOpenNotes,
  onGroupsChanged,
  approveAllRequestId,
  resetAllRequestId,
  onGlobalBulkPersistResult,
}) => {
  // Estado del Modal de Desacuerdo
  const [disagreementOpen, setDisagreementOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<TableLikeViewArticle | null>(null);
  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);

  const openDisagreementModal = useCallback((article: TableLikeViewArticle, dimId: string) => {
    setSelectedArticle(article);
    setSelectedDimId(dimId);
    setDisagreementOpen(true);
  }, []);
  // Estado local: aprobación/rechazo por dimensión a nivel UI (no persistente)
  // articleId -> dimId -> 'none' | 'approved' | 'rejected'
  const [dimensionStatusByArticle, setDimensionStatusByArticle] = useState<Record<string, Record<string, 'none' | 'approved' | 'rejected'>>>({});
  // Ref para snapshot actual del estado (para rollback seguro)
  const statusRef = useRef(dimensionStatusByArticle);
  const lastApproveIdRef = useRef<number>(0);
  const lastResetIdRef = useRef<number>(0);
  useEffect(() => {
    statusRef.current = dimensionStatusByArticle;
  }, [dimensionStatusByArticle]);

  const setDimensionStatus = useCallback((articleId: string, dimId: string, status: 'none' | 'approved' | 'rejected') => {
    setDimensionStatusByArticle(prev => ({
      ...prev,
      [articleId]: {
        ...(prev[articleId] || {}),
        [dimId]: status,
      },
    }));
  }, []);

  // Inicializar el estado UI desde los flags prevalidados persistidos y presencia de revisión humana
  useEffect(() => {
    if (!cardData || cardData.length === 0) return;
    const initialState: Record<string, Record<string, 'none' | 'approved' | 'rejected'>> = {};
    for (const article of cardData) {
      const perArticle: Record<string, 'none' | 'approved' | 'rejected'> = {};
      for (const dimId of dimensionOrder) {
        const reviews: ClassificationReview[] = article.classifications?.[dimId] ?? [];
        const aiReview = reviews.find((r) => r.reviewer_type === 'ai');
        const hasHuman = reviews.some(r => r.reviewer_type === 'human');
        perArticle[dimId] = hasHuman ? 'rejected' : (aiReview?.prevalidated ? 'approved' : 'none');
      }
      initialState[article.id] = perArticle;
    }
    setDimensionStatusByArticle(initialState);
  }, [cardData, dimensionOrder]);

  // Persistir el flag prevalidated en backend (optimista)
  const persistPrevalidated = useCallback(async (
    articleBatchItemId: string,
    dimensionId: string,
    prevalidated: boolean,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const resp = await fetch('/api/preclassification/reviews/prevalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleBatchItemId, dimensionId, prevalidated }),
      });
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: data.error || `HTTP ${resp.status}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }, []);

  // Wrapper: set + persist, con revert en caso de error
  const setAndPersistDimensionStatus = useCallback(async (
    articleId: string,
    dimId: string,
    status: 'none' | 'approved' | 'rejected',
  ) => {
    const prev = dimensionStatusByArticle[articleId]?.[dimId] || 'none';
    // Update optimista
    setDimensionStatus(articleId, dimId, status);
    const shouldPrevalidate = status === 'approved';
    const result = await persistPrevalidated(articleId, dimId, shouldPrevalidate);
    if (!result.ok) {
      // revertir si falla
      setDimensionStatus(articleId, dimId, prev);
      // eslint-disable-next-line no-console
      console.error('[prevalidate] Error persistiendo cambio', { articleId, dimId, status, error: result.error });
    }
  }, [dimensionStatusByArticle, persistPrevalidated, setDimensionStatus]);

  // Aprobar todas las dimensiones para un artículo específico (acción por fila)
  const approveAllForArticle = useCallback(async (articleId: string) => {
    const current = dimensionStatusByArticle[articleId] || {};
    const updates: Record<string, 'none' | 'approved' | 'rejected'> = { ...current };
    // Optimista: aprobar solo las dimensiones que NO estén rechazadas
    dimensionOrder.forEach((dimId) => {
      if ((current[dimId] || 'none') !== 'rejected') {
        updates[dimId] = 'approved';
      }
    });
    setDimensionStatusByArticle(prev => ({
      ...prev,
      [articleId]: updates,
    }));
    // Persistir en backend para cada dimensión (omitir rechazadas)
    await Promise.all(
      dimensionOrder.map(async (dimId) => {
        if ((current[dimId] || 'none') === 'rejected') return; // no tocar divergencias
        const res = await persistPrevalidated(articleId, dimId, true);
        if (!res.ok) {
          // revert individual si falla
          setDimensionStatus(articleId, dimId, current[dimId] || 'none');
          // eslint-disable-next-line no-console
          console.error('[prevalidate] Error en approve-all por artículo', { articleId, dimId, error: res.error });
        }
      })
    );
  }, [dimensionOrder, dimensionStatusByArticle, persistPrevalidated, setDimensionStatus]);

  // Señal global: aprobar todas las dimensiones de todos los artículos (acción desde page) con persistencia bulk
  useEffect(() => {
    if (!approveAllRequestId || approveAllRequestId === lastApproveIdRef.current) return;
    lastApproveIdRef.current = approveAllRequestId;
    const snapshot = statusRef.current;
    // Optimista: aprobar todas las no rechazadas
    const newState: Record<string, Record<string, 'none' | 'approved' | 'rejected'>> = {};
    for (const article of cardData) {
      const current = snapshot[article.id] || {};
      const perArticle: Record<string, 'none' | 'approved' | 'rejected'> = { ...current };
      for (const dimId of dimensionOrder) {
        if ((current[dimId] || 'none') !== 'rejected') {
          perArticle[dimId] = 'approved';
        }
      }
      newState[article.id] = perArticle;
    }
    setDimensionStatusByArticle(newState);
    // Persistir per-dimensión omitiendo rechazadas
    const persist = async () => {
      try {
        const tasks: Promise<void>[] = [];
        for (const article of cardData) {
          const current = snapshot[article.id] || {};
          for (const dimId of dimensionOrder) {
            if ((current[dimId] || 'none') === 'rejected') continue;
            tasks.push(
              (async () => {
                const res = await persistPrevalidated(article.id, dimId, true);
                if (!res.ok) {
                  // revert individual
                  setDimensionStatus(article.id, dimId, current[dimId] || 'none');
                  // eslint-disable-next-line no-console
                  console.error('[prevalidate] Error en approve-all (lote)', { articleId: article.id, dimId, error: res.error });
                }
              })()
            );
          }
        }
        await Promise.all(tasks);
        toast.success('Se marcaron como OK todas las dimensiones (excluyendo divergencias)');
        onGlobalBulkPersistResult?.(true, true);
      } catch (error) {
        setDimensionStatusByArticle(snapshot);
        toast.error('No se pudo marcar OK todo el lote');
        // eslint-disable-next-line no-console
        console.error('[prevalidate] Error en approve-all de lote', error);
        onGlobalBulkPersistResult?.(false, true);
      }
    };
    void persist();
  }, [approveAllRequestId, cardData, dimensionOrder, persistPrevalidated, onGlobalBulkPersistResult, setDimensionStatus]);

  // Señal global: desmarcar (poner en 'none') todas las dimensiones de todos los artículos con persistencia bulk=false
  useEffect(() => {
    if (!resetAllRequestId || resetAllRequestId === lastResetIdRef.current) return;
    lastResetIdRef.current = resetAllRequestId;
    const snapshot = statusRef.current;
    // Optimista: desmarcar solo las que están 'approved'; no tocar 'rejected'
    const newState: Record<string, Record<string, 'none' | 'approved' | 'rejected'>> = {};
    for (const article of cardData) {
      const current = snapshot[article.id] || {};
      const perArticle: Record<string, 'none' | 'approved' | 'rejected'> = { ...current };
      for (const dimId of dimensionOrder) {
        if ((current[dimId] || 'none') === 'approved') {
          perArticle[dimId] = 'none';
        }
      }
      newState[article.id] = perArticle;
    }
    setDimensionStatusByArticle(newState);
    // Persistir per-dimensión: solo donde estaba approved
    const persist = async () => {
      try {
        const tasks: Promise<void>[] = [];
        for (const article of cardData) {
          const current = snapshot[article.id] || {};
          for (const dimId of dimensionOrder) {
            if ((current[dimId] || 'none') !== 'approved') continue;
            tasks.push(
              (async () => {
                const res = await persistPrevalidated(article.id, dimId, false);
                if (!res.ok) {
                  // revert individual
                  setDimensionStatus(article.id, dimId, current[dimId] || 'none');
                  // eslint-disable-next-line no-console
                  console.error('[prevalidate] Error en reset-all (lote)', { articleId: article.id, dimId, error: res.error });
                }
              })()
            );
          }
        }
        await Promise.all(tasks);
        toast.success('Se desmarcaron todas las dimensiones aprobadas (se mantuvieron las divergencias)');
        onGlobalBulkPersistResult?.(true, false);
      } catch (error) {
        setDimensionStatusByArticle(snapshot);
        toast.error('No se pudo desmarcar el lote');
        // eslint-disable-next-line no-console
        console.error('[prevalidate] Error en reset-all de lote', error);
        onGlobalBulkPersistResult?.(false, false);
      }
    };
    void persist();
  }, [resetAllRequestId, cardData, dimensionOrder, persistPrevalidated, onGlobalBulkPersistResult, setDimensionStatus]);

  return (
    <div>
      {/* Cuerpo: sin encabezado sticky, las tarjetas muestran sus títulos */}
      <div className="space-y-3">
        {cardData.map((article) => {
          const articleDimStatuses = dimensionOrder.map(dimId => dimensionStatusByArticle[article.id]?.[dimId] || 'none');
          const totalDims = dimensionOrder.length;
          const approvedCount = articleDimStatuses.filter(s => s === 'approved').length;
          const allApproved = totalDims > 0 && approvedCount === totalDims;
          const anyRejected = articleDimStatuses.some(s => s === 'rejected');
          const rowAccent: 'primary' | 'success' | 'warning' = allApproved ? 'success' : anyRejected ? 'warning' : 'primary';

          return (
            <StandardCard
              key={`row-${article.id}`}
              className="group max-h-full"
              colorScheme={rowAccent}
              accentPlacement="left"
              accentColorScheme={rowAccent}
              hasOutline
              disableShadowHover={false}
              contentCanScroll
            >
              {/* Layout en dos zonas: izquierda (micro layout artículo) y derecha (dimensiones scrolleables) */}
              <div
                className="grid items-stretch gap-x-3"
                style={{ gridTemplateColumns: `minmax(320px,1fr) minmax(0,2fr)` }}
              >
                {/* Zona izquierda: respeta el micro layout actual */}
                <div className="p-2 min-w-0">
                  <div className="h-full p-3">
                    <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
                      {/* Columna izquierda: número + botones verticales */}
                      <div className="w-8 flex flex-col items-start">
                        {/* Número del artículo */}
                        <div>
                          {typeof article.displayIndex === 'number' ? (
                            <StandardText 
                              size="2xl" 
                              weight="bold" 
                              applyGradient={compact ? true : undefined}
                            >
                              {article.displayIndex}
                            </StandardText>
                          ) : null}
                        </div>
                        {/* Botones en columna: Notas, Ver detalle, Grupos */}
                        <div className="mt-2 flex flex-col gap-1">
                          <StandardButton
                            styleType={article.hasNotes ? "solid" : "outline"}
                            iconOnly
                            onClick={() => onOpenNotes(article.originalArticle)}
                            tooltip={article.hasNotes ? "Ver/editar notas" : "Crear nota"}
                          >
                            <StickyNote size={16} />
                          </StandardButton>

                          <StandardButton
                            styleType="outline"
                            iconOnly
                            onClick={() => {
                              const hasTranslation = Boolean(article.originalArticle.article_data?.translated_title || article.originalArticle.article_data?.translated_abstract);
                              const translatedParam = hasTranslation && !showOriginalAsPrimary ? "true" : "false";
                              const articleId = article.originalArticle.article_id;
                              if (!articleId) return;
                              const returnHref = encodeURIComponent(`/articulos/preclasificacion2/${batchId}`);
                              const returnLabel = encodeURIComponent(`Lote #${batchNumber ?? ''}`);
                              window.location.href = `/articulos/detalle?articleId=${articleId}&translated=${translatedParam}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
                            }}
                            tooltip="Ver detalle del artículo"
                          >
                            <Search size={16} />
                          </StandardButton>

                          <div>
                            <ArticleGroupManager
                              articleId={article.originalArticle.article_id}
                              hasGroups={groupsPresenceByItemId[article.originalArticle.item_id] || false}
                              isLoadingPresence={isLoadingGroupsPresence}
                              onGroupsChanged={(hasGroups: boolean) => onGroupsChanged(article.originalArticle.item_id, hasGroups)}
                            />
                          </div>
                          {/* Separador y botón OK para aprobar todas las dimensiones del artículo */}
                          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                            <StandardButton
                              iconOnly
                              size="sm"
                              colorScheme="success"
                              styleType="solid"
                              onClick={() => approveAllForArticle(article.id)}
                              tooltip="Aprobar todas las dimensiones"
                            >
                              <Check size={16} />
                            </StandardButton>
                          </div>
                        </div>
                      </div>

                      {/* Columna derecha interna: Título + Abstract + resumen IA */}
                      <div className="pr-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <StandardText size="md" weight="semibold" className="whitespace-normal flex-1">
                            {article.title}
                          </StandardText>
                          <div className="flex items-center gap-2">
                            {allApproved && (
                              <StandardBadge size="xs" colorScheme="success" styleType="subtle">Listo</StandardBadge>
                            )}
                            {article.abstract ? (
                            <StandardTooltip
                              content={article.abstract}
                              isLongText
                              trigger={
                                <StandardBadge size="xs" colorScheme="neutral" styleType="subtle">Abstract</StandardBadge>
                              }
                            />
                            ) : null}
                          </div>
                        </div>
                        <StandardText size="xs" className="text-gray-500 dark:text-gray-400 mb-1">
                          {article.journal} ({article.year})
                        </StandardText>
                        {compact ? (
                          <StandardTooltip
                            content={article.ai_summary}
                            trigger={
                              <StandardText size="sm" colorScheme="primary" colorShade="dark" className="line-clamp-2">
                                {article.ai_summary}
                              </StandardText>
                            }
                          />
                        ) : (
                          <StandardText size="sm" colorScheme="primary" colorShade="dark">
                            {article.ai_summary}
                          </StandardText>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zona derecha: dimensiones con scroll propio */}
                <div className="min-w-0">
                  <div className="overflow-x-auto overscroll-x-contain max-w-full">
                    <div
                      className="grid items-stretch gap-x-3 p-2 w-max"
                      style={{ gridTemplateColumns: `repeat(${dimensionOrder.length}, 240px)` }}
                    >
                      {dimensionOrder.map((dimId) => {
                        const reviews: ClassificationReview[] = article.classifications?.[dimId] ?? [];
                        // Siempre mostrar la ÚLTIMA iteración
                        const latestReview: ClassificationReview | undefined = reviews.length > 0
                          ? [...reviews].sort((a, b) => (b.iteration ?? 0) - (a.iteration ?? 0))[0]
                          : undefined;
                        const dimStatus = dimensionStatusByArticle[article.id]?.[dimId] || 'none';
                        const isApproved = dimStatus === 'approved';
                        const isRejected = dimStatus === 'rejected';
                        const dimColor: 'primary' | 'success' | 'warning' = isApproved ? 'success' : isRejected ? 'warning' : 'primary';
                        const latestIteration = reviews.length > 0 ? Math.max(...reviews.map(r => r.iteration ?? 0)) : 0;
                        const historyContent = (
                          <div className="space-y-2">
                            {reviews
                              .sort((a, b) => (a.iteration ?? 0) - (b.iteration ?? 0))
                              .map((r, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="font-medium">Iteración {r.iteration} · {r.reviewer_type === 'ai' ? 'IA' : 'Humano'}</div>
                                  <div>Valor: {r.value ?? '—'}</div>
                                  {typeof r.confidence === 'number' && (
                                    <div>Confianza: {r.confidence === 3 ? 'Alta' : r.confidence === 2 ? 'Media' : 'Baja'}</div>
                                  )}
                                  {r.rationale && <div className="italic opacity-80">{r.rationale}</div>}
                                </div>
                              ))}
                          </div>
                        );
                        return (
                          <div key={`cell-${article.id}-${dimId}`} className="p-2">
                            <StandardCard
                              className="h-full relative group/DimCard"
                              accentPlacement="none"
                              colorScheme={dimColor}
                              styleType={isApproved || isRejected ? 'filled' : 'subtle'}
                              hasOutline={false}
                              disableShadowHover={false}
                            >
                              {/* Badge unificado: Iteración con tooltip de historial (hover sobre el badge) */}
                              <div className="absolute left-2 bottom-2 flex items-center gap-2 z-20">
                                {latestIteration > 0 && (
                                  <StandardTooltip
                                    content={historyContent}
                                    isLongText
                                    trigger={
                                      <StandardBadge
                                        size="xs"
                                        colorScheme={latestIteration > 1 ? 'accent' : (isRejected ? 'warning' : isApproved ? 'success' : 'primary')}
                                        styleType="subtle"
                                      >
                                        Iteración {latestIteration}
                                      </StandardBadge>
                                    }
                                  />
                                )}
                              </div>
                              {/* Botones hover: ubicados arriba a la derecha, tamaño reducido */}
                              <div className="absolute top-2 right-2 z-20 opacity-0 transition-opacity duration-150 group-hover/DimCard:opacity-100 flex items-center gap-1">
                                <StandardButton 
                                  iconOnly 
                                  size="xs"
                                  colorScheme="success"
                                  styleType={isApproved ? 'solid' : 'outline'} 
                                  tooltip={isApproved ? 'Quitar aprobación' : 'Aprobar'}
                                  onClick={() => void setAndPersistDimensionStatus(article.id, dimId, isApproved ? 'none' : 'approved')}
                                >
                                  <Check size={14} />
                                </StandardButton>
                                <StandardButton 
                                  iconOnly 
                                  size="xs"
                                  colorScheme="warning"
                                  styleType={isRejected ? 'solid' : 'subtle'} 
                                  tooltip={isRejected ? 'Editar desacuerdo' : 'Desacuerdo'}
                                  onClick={() => openDisagreementModal(article, dimId)}
                                >
                                  <ThumbsDown size={14} />
                                </StandardButton>
                              </div>
                              {/* Reservar espacio para los botones superiores para evitar solape visual */}
                              <div className="p-2 pt-7">
                                <DimensionDisplay
                                  variant="card"
                                  dimensionName={dimensionLabelById[dimId] ?? dimId}
                                  review={latestReview}
                                  dimensionIcon={dimensionIconById[dimId]}
                                  optionEmoticons={optionEmoticonsByDimId[dimId]}
                                />
                              </div>
                            </StandardCard>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </StandardCard>
          );
        })}
      </div>

      {/* Modal de Desacuerdo Humano */}
      <HumanDisagreementModal
        open={disagreementOpen}
        onClose={() => setDisagreementOpen(false)}
        article={selectedArticle}
        dimensionId={selectedDimId}
        dimensionName={selectedDimId ? (dimensionLabelById[selectedDimId] ?? selectedDimId) : ''}
        dimensionType={selectedDimId ? (dimensionTypeById[selectedDimId] ?? 'finite') : 'finite'}
        dimensionOptions={selectedDimId ? (optionsByDimId[selectedDimId] ?? []) : []}
        optionEmoticonsMap={selectedDimId ? (optionEmoticonsByDimId[selectedDimId] ?? {}) : {}}
        onSubmitted={(ok) => {
          if (ok && selectedArticle && selectedDimId) {
            // Estado local como rechazado; un INSERT en realtime refrescará luego
            setAndPersistDimensionStatus(selectedArticle.id, selectedDimId, 'rejected');
          }
        }}
      />
    </div>
  );
};

// =====================
// Modal de Desacuerdo Humano
// =====================
interface HumanDisagreementModalProps {
  open: boolean;
  onClose: () => void;
  article: TableLikeViewArticle | null;
  dimensionId: string | null;
  dimensionName: string;
  dimensionType: string; // 'finite' | 'open'
  dimensionOptions: (string | { value: string | number; label: string })[];
  optionEmoticonsMap: Record<string, string | null>;
  onSubmitted: (ok: boolean) => void;
}

const confidenceOptions = [
  { value: '3', label: '🟢 Alta' },
  { value: '2', label: '🟡 Media' },
  { value: '1', label: '🔴 Baja' },
];

const HumanDisagreementModal: React.FC<HumanDisagreementModalProps> = ({ open, onClose, article, dimensionId, dimensionName, dimensionType, dimensionOptions, optionEmoticonsMap, onSubmitted }) => {
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<string | undefined>(undefined);
  const [confidence, setConfidence] = useState<string | undefined>(undefined);
  const [rationale, setRationale] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setValue(undefined);
      setConfidence(undefined);
      setRationale("");
    }
  }, [open]);

  const normalizedOptions = (dimensionOptions || []).map((opt) =>
    typeof opt === 'string' ? { value: String(opt), label: String(opt) } : { value: String(opt.value), label: opt.label }
  );
  // Enriquecer opciones con emoticonos desde BD
  const enrichedOptions = normalizedOptions.map(opt => {
    const emoji = optionEmoticonsMap[String(opt.value)] || '';
    const label = emoji ? `${emoji} ${opt.label}` : opt.label;
    return { ...opt, label };
  });

  // Valor previo (preferir última revisión de IA; si no, última disponible)
  const previousValue: string | null = (() => {
    if (!article || !dimensionId) return null;
    const reviews: ClassificationReview[] = article.classifications?.[dimensionId] ?? [];
    if (reviews.length === 0) return null;
    const byIterDesc = [...reviews].sort((a, b) => (b.iteration ?? 0) - (a.iteration ?? 0));
    const lastAI = byIterDesc.find(r => r.reviewer_type === 'ai');
    const chosen = lastAI || byIterDesc[0];
    if (!chosen?.value) return null;
    if (dimensionType === 'finite') {
      const emoji = optionEmoticonsMap[String(chosen.value)] || '';
      return emoji ? `${emoji} ${chosen.value}` : chosen.value;
    }
    return chosen.value;
  })();

  const handleSubmit = async () => {
    if (!article || !dimensionId) return;
    if (!value || !confidence) return;
    setSaving(true);
    try {
      const payload = {
        article_batch_item_id: article.id,
        dimension_id: dimensionId,
        human_value: value,
        human_option_id: null as string | null, // Opcional, se puede mapear a futuro
        human_confidence: Number(confidence),
        human_rationale: rationale || '',
      };
      const resp = await fetch('/api/preclassification/reviews/human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${resp.status}`);
      }
      toast.success('Revisión guardada correctamente');
      onSubmitted(true);
      onClose();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[HumanDisagreementModal] Error al enviar revisión humana', e);
      onSubmitted(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPopupWindow open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <StandardPopupWindow.Content size="lg" colorScheme="neutral">
        <StandardPopupWindow.Header>
          <StandardPopupWindow.Title>
            Desacuerdo del Investigador · {dimensionName}
          </StandardPopupWindow.Title>
          <StandardPopupWindow.Description>
            Indica tu clasificación humana, nivel de confianza y una breve justificación.
          </StandardPopupWindow.Description>
        </StandardPopupWindow.Header>
        <StandardPopupWindow.Body>
          <div className="space-y-4">
            {dimensionType === 'finite' ? (
              <div className="space-y-2">
                <StandardText size="sm" weight="semibold">Nueva clasificación</StandardText>
                <StandardSelect options={enrichedOptions} value={value} onChange={(v) => setValue(typeof v === 'string' ? v : undefined)} placeholder="Selecciona un valor" />
                {previousValue && (
                  <StandardText size="xs" className="text-gray-500">Valor anterior: <span className="italic">{previousValue}</span></StandardText>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <StandardText size="sm" weight="semibold">Nueva clasificación (texto)</StandardText>
                <StandardInput value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder="Escribe tu clasificación" />
                {previousValue && (
                  <StandardText size="xs" className="text-gray-500">Valor anterior: <span className="italic">{previousValue}</span></StandardText>
                )}
              </div>
            )}
            <div className="space-y-2">
              <StandardText size="sm" weight="semibold">Nivel de confianza</StandardText>
              <StandardSelect options={confidenceOptions} value={confidence} onChange={(v) => setConfidence(typeof v === 'string' ? v : undefined)} placeholder="Selecciona confianza" />
            </div>
            <div className="space-y-2">
              <StandardText size="sm" weight="semibold">Justificación</StandardText>
              <StandardTextarea rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Explica brevemente tu decisión" />
            </div>
          </div>
        </StandardPopupWindow.Body>
        <StandardPopupWindow.Footer>
          <StandardButton styleType="subtle" onClick={onClose} disabled={saving}>Cancelar</StandardButton>
          <StandardButton onClick={handleSubmit} disabled={saving || !value || !confidence}>{saving ? 'Guardando...' : 'Enviar revisión'}</StandardButton>
        </StandardPopupWindow.Footer>
      </StandardPopupWindow.Content>
    </StandardPopupWindow>
  );
};

// (sin helpers externos)
