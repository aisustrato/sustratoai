"use client";

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Brain,
  Globe, 
  StickyNote,
  Check,
} from 'lucide-react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ArticleForReview, BatchDetails } from '@/lib/types/preclassification-types';

import { useAuth } from "@/app/auth-provider";

import type { Database } from "@/lib/database.types";

type ArticleBatch = Database['public']['Tables']['article_batches']['Row'];

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { NoteEditor } from "@/app/articulos/preclasificacion_old/[batchId]/components/NoteEditor";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTabsList, StandardTabsTrigger } from "@/components/ui/StandardTabs";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { TableLikeView } from "./components/TableLikeView";
import { useJobManager } from "@/app/contexts/JobManagerContext";
import { supabase } from "@/app/auth/client";

interface NotesButtonCellProps {
  article: ArticleForReview;
  hasNotes: boolean;
  onOpenNotes: (article: ArticleForReview) => void;
}

const NotesButtonCell: React.FC<NotesButtonCellProps> = memo(({ 
  article,
  hasNotes,
  onOpenNotes,
}) => {
  const style = hasNotes ? "solid" : "outline";
  console.log('[NotesButtonCell] decisión de estilo', {
    itemId: article.item_id,
    hasNotes,
    style,
  });
  return (
    <StandardButton
      styleType={style}
      iconOnly={true}
      onClick={() => {
        console.log('[NotesButtonCell] click -> abrir NoteEditor', {
          itemId: article.item_id,
          hasNotes,
        });
        onOpenNotes(article);
      }}
      tooltip={hasNotes ? "Ver/editar notas" : "Crear nota"}
    >
      <StickyNote size={16} />
    </StandardButton>
  );
});

NotesButtonCell.displayName = "NotesButtonCell";

const BatchDetailPage = () => {
	const params = useParams();
	    // router no es necesario: las actualizaciones realtime parchean estado local
	const auth = useAuth();
	const { startJob } = useJobManager();
	const batchId = params.batchId as string;
	
	const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
	const [articlesLoading, setArticlesLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showOriginalAsPrimary, setShowOriginalAsPrimary] = useState(false);
	
	const [noteDialogOpen, setNoteDialogOpen] = useState(false);
	const [currentArticle, setCurrentArticle] = useState<ArticleForReview | null>(null);
	
	const [isStartingPreclassification, setIsStartingPreclassification] = useState(false);
	const [viewMode] = useState<'grid' | 'rows' | 'table'>('table');
	const [compactView, setCompactView] = useState<boolean>(false);
	const [approveAllRequestId, setApproveAllRequestId] = useState<number>(0);
	const [resetAllRequestId, setResetAllRequestId] = useState<number>(0);
	const [allMarked, setAllMarked] = useState<boolean>(false);
	const [isBulkPersisting, setIsBulkPersisting] = useState<boolean>(false);

	const [notesPresenceByItemId, setNotesPresenceByItemId] = useState<Record<string, boolean>>({});
	
	const [groupsPresenceByItemId, setGroupsPresenceByItemId] = useState<Record<string, boolean>>({});
	const [isLoadingGroupsPresence, setIsLoadingGroupsPresence] = useState(false);

	useEffect(() => {
		if (!batchDetails?.rows) return;
		const map: Record<string, boolean> = {};
		for (const row of batchDetails.rows) {
			const info = row.notes_info;
			const hasAny = Boolean(info?.has_notes) || (Array.isArray(info?.note_ids) && info!.note_ids!.length > 0) || (typeof info?.note_count === 'number' && (info!.note_count as number) > 0);
			map[row.item_id] = hasAny;
		}
		setNotesPresenceByItemId(map);
	}, [batchDetails?.rows]);

	const loadGroupsPresence = useCallback(async (articles: ArticleForReview[]) => {
		try {
			setIsLoadingGroupsPresence(true);
			const t0 = performance.now();
			console.log(`[${new Date().toISOString()}] [groups] Inicio carga presencia de grupos (optimizada)`, { articles: articles.length });
			
			const articleIds = articles.map(a => a.article_id).filter(id => id && id.trim() !== '');
			if (articleIds.length === 0) {
				console.warn('[groups] No hay article_ids válidos para consultar grupos');
				setIsLoadingGroupsPresence(false);
				return;
			}

			const { getBulkGroupsPresence } = await import('@/lib/actions/article-group-actions');
			const result = await getBulkGroupsPresence({ articleIds });
			
			if (!result.success) {
				console.error('[groups] Error en getBulkGroupsPresence:', result.error);
				setIsLoadingGroupsPresence(false);
				return;
			}

			const groupsMap: Record<string, boolean> = {};
			articles.forEach(article => {
				groupsMap[article.item_id] = result.data[article.article_id] || false;
			});
			
			setGroupsPresenceByItemId(groupsMap);
			const ms = Math.round(performance.now() - t0);
			const withGroups = Object.values(groupsMap).filter(Boolean).length;
			console.log(`[${new Date().toISOString()}] [groups] Fin carga presencia de grupos (optimizada)`, { articles: articles.length, withGroups, ms });
		} catch (error) {
			console.error('[groups] Error cargando presencia de grupos:', error);
		} finally {
			setIsLoadingGroupsPresence(false);
		}
	}, []);

	const loadBatchDetails = useCallback(async () => {
		if (!batchId) return;
		console.log(`[${new Date().toISOString()}] [batch] Inicio consulta detalles de lote`, { batchId });
		setArticlesLoading(true);
		setError(null);
		const start = performance.now();
		try {
			const resp = await fetch("/api/preclassification/batch-details", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ batchId }),
			});
			if (!resp.ok) {
				const { error: apiError } = (await resp.json().catch(() => ({ error: "Error desconocido" }))) as { error?: string };
				throw new Error(apiError || `HTTP ${resp.status}`);
			}
			const { data } = (await resp.json()) as { data: BatchDetails };
			setBatchDetails(data);
			loadGroupsPresence(data.rows);
			const ms = Math.round(performance.now() - start);
			console.log(`[${new Date().toISOString()}] [batch] Fin consulta detalles de lote`, { batchId, articles: data.rows.length, ms });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
			const ms = Math.round(performance.now() - start);
			console.error(`[${new Date().toISOString()}] [batch] Excepción consulta detalles de lote`, { batchId, error: err, ms });
		} finally {
			setArticlesLoading(false);
		}
	}, [batchId, loadGroupsPresence]);

	const refreshNotesPresence = useCallback(async () => {
		await loadBatchDetails();
	}, [loadBatchDetails]);


	// loadBatchDetails fue movida arriba para evitar TDZ

	// Cargar datos iniciales
	useEffect(() => {
		loadBatchDetails();
	}, [loadBatchDetails]);

	// Suscripción a cambios en tiempo real
	useEffect(() => {
		if (!batchId) return;

		const subscription = supabase
			.channel(`batch-${batchId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "article_batches",
					filter: `id=eq.${batchId}`,
				},
				(payload: RealtimePostgresChangesPayload<ArticleBatch>) => {
					console.log("Cambio detectado en el lote:", payload);
					const row = payload.new as Partial<ArticleBatch> | null;
					if (!row || typeof row !== 'object') return;
					// Si el evento no trae los campos (p.ej. DELETE), no hacemos nada
					if (!('status' in row) && !('name' in row) && !('batch_number' in row)) return;
					setBatchDetails(prev => {
						if (!prev) return prev;
						const newStatus = (row.status ?? null) as Database["public"]["Enums"]["batch_preclass_status"] | null;
						const newName = (row.name ?? undefined) as string | null | undefined;
						const newBatchNumber = (row.batch_number ?? undefined) as number | undefined;
						return {
							...prev,
							status: (newStatus ?? prev.status),
							name: (typeof newName !== 'undefined' ? newName : prev.name),
							batch_number: (typeof newBatchNumber !== 'undefined' ? newBatchNumber : prev.batch_number),
						};
					});
				}
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [batchId, loadBatchDetails]);

	// Suscripción a cambios en article_dimension_reviews para refrescar datos automáticamente
	useEffect(() => {
		if (!batchId) return;

		const reviewsSubscription = supabase
			.channel(`reviews-${batchId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "article_dimension_reviews",
				},
				(payload: RealtimePostgresChangesPayload<Database['public']['Tables']['article_dimension_reviews']['Row']>) => {
					console.log("🔄 Nueva clasificación detectada:", payload);
					const row = payload.new as Database['public']['Tables']['article_dimension_reviews']['Row'] | null;
					if (!row || !row.article_batch_item_id || !row.dimension_id) return;
					setBatchDetails(prev => {
						if (!prev) return prev;
						const itemId = row.article_batch_item_id as string;
						const dimensionId = row.dimension_id as string;
						const idx = prev.rows.findIndex(r => r.item_id === itemId);
						if (idx === -1) return prev;
						const article = prev.rows[idx];
						const existingForDim = article.classifications[dimensionId] || [];
						const newReview = {
							reviewer_type: row.reviewer_type as 'ai' | 'human',
							reviewer_id: row.reviewer_id || '',
							iteration: row.iteration ?? 1,
							value: row.classification_value,
							confidence: row.confidence_score,
							rationale: row.rationale,
							option_id: row.option_id ?? undefined,
							prevalidated: row.prevalidated ?? false,
							is_final: row.is_final ?? false,
						};
						const updatedArticle = {
							...article,
							classifications: {
								...article.classifications,
								[dimensionId]: [...existingForDim, newReview],
							},
						};
						const newRows = [...prev.rows];
						newRows[idx] = updatedArticle;
						return { ...prev, rows: newRows };
					});
				}
			)
			.subscribe();

		return () => {
			reviewsSubscription.unsubscribe();
		};
	}, [batchId]);

	// Funciones de manejo de acciones
	// (Eliminado) Botón/función para abrir DOI
	// Nota: Se removieron handlers no utilizados para limpiar advertencias del linter.

	// Función para abrir el editor de notas
	const handleOpenNotes = useCallback((article: ArticleForReview) => {
    console.log('[Page] handleOpenNotes', {
      itemId: article.item_id,
      hasNotesAtClick: notesPresenceByItemId[article.item_id],
      titleOriginal: article.article_data?.original_title,
      titleTranslated: article.article_data?.translated_title,
    });
    setCurrentArticle(article);
    setNoteDialogOpen(true);
  }, [notesPresenceByItemId]);

	// Función para cerrar el editor de notas
	const handleCloseNotes = () => {
		setNoteDialogOpen(false);
		// Refrescar presencia para el artículo que estaba abierto
		if (currentArticle) {
			void refreshNotesPresence();
		}
		setCurrentArticle(null);
	};

	// Callback de NoteEditor para actualización optimista de presencia de notas
	const handleNotesChanged = useCallback((hasNotesNow: boolean) => {
    if (!currentArticle?.item_id) return;
    const itemId = currentArticle.item_id;
    console.log('[onNotesChanged] actualización optimista de hasNotes', { itemId, hasNotesNow });
    setNotesPresenceByItemId(prev => ({
        ...prev,
        [itemId]: hasNotesNow,
    }));
}, [currentArticle]);

	// Función para iniciar la preclasificación
	const handleStartPreclassification = async () => {
		if (!batchId || !auth.user?.id || !auth.proyectoActual?.id) {
			console.error('Faltan datos necesarios para iniciar la preclasificación');
			return;
		}

		setIsStartingPreclassification(true);
		try {
			// 🎨 ARQUITECTURA LIMPIA: Page solo dispara el trabajo, PreclassificationJobHandler maneja TODO lo demás
			startJob({
				type: 'PRECLASSIFY_BATCH',
				title: `Preclasificación Lote #${batchDetails?.batch_number || batchId}`,
				payload: {
					batchId: batchId,
					userId: auth.user.id,
					projectId: auth.proyectoActual.id,
				},
			});
			
			console.log('🚀 [Page] Trabajo disparado al JobManager. El PreclassificationJobHandler se encarga del resto.');
		} catch (error) {
			console.error('🚨 [Page] Error disparando trabajo:', error);
		} finally {
			setIsStartingPreclassification(false);
		}
	};

	const handleApproveAllBatch = useCallback(() => {
		if (isBulkPersisting) return;
		setIsBulkPersisting(true);
		if (allMarked) {
			setResetAllRequestId((prev) => prev + 1);
		} else {
			setApproveAllRequestId((prev) => prev + 1);
		}
	}, [allMarked, isBulkPersisting]);

	const handleGlobalBulkPersistResult = useCallback((ok: boolean, prevalidated: boolean) => {
		setIsBulkPersisting(false);
		if (ok) {
			setAllMarked(prevalidated);
		}
	}, []);


	// Mapas derivados desde columns: nombre, icono, y emoticonos por opción
    const dimensionLabelById = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        (batchDetails?.columns || []).forEach(col => {
            if (col?.id && col?.name) map[col.id] = col.name;
        });
        return map;
    }, [batchDetails?.columns]);

    const dimensionIconById = useMemo<Record<string, string | null>>(() => {
        const map: Record<string, string | null> = {};
        (batchDetails?.columns || []).forEach(col => {
            if (col?.id) map[col.id] = col.icon ?? null;
        });
        return map;
    }, [batchDetails?.columns]);

    const optionEmoticonsByDimId = useMemo<Record<string, Record<string, string | null>>>(() => {
        const map: Record<string, Record<string, string | null>> = {};
        (batchDetails?.columns || []).forEach(col => {
            if (col?.id) map[col.id] = col.optionEmoticons || {};
        });
        return map;
    }, [batchDetails?.columns]);

    // Nuevos mapas para el flujo de desacuerdo humano
    const dimensionTypeById = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        (batchDetails?.columns || []).forEach(col => {
            if (col?.id && col?.type) map[col.id] = col.type;
        });
        return map;
    }, [batchDetails?.columns]);

    const optionsByDimId = useMemo<Record<string, (string | { value: string | number; label: string })[]>>(() => {
        const map: Record<string, (string | { value: string | number; label: string })[]> = {};
        (batchDetails?.columns || []).forEach(col => {
            if (col?.id) map[col.id] = col.options || [];
        });
        return map;
    }, [batchDetails?.columns]);

    // Orden de columnas de dimensiones para la vista tipo tabla
    const dimensionOrder = useMemo<string[]>(() => {
        return (batchDetails?.columns || [])
            .map(col => col.id)
            .filter((id): id is string => Boolean(id));
    }, [batchDetails?.columns]);

    // Transformar datos para las tarjetas: ordenar por correlativo desc y enumerar desde 1
    const cardData = useMemo(() => {
        const rows = batchDetails?.rows || [];
        const sorted = [...rows].sort((a, b) => {
            const ac = a.article_data?.correlativo ?? -Infinity;
            const bc = b.article_data?.correlativo ?? -Infinity;
            return bc - ac;
        });
        return sorted.map((article: ArticleForReview, idx: number) => {
            const primaryTitle = showOriginalAsPrimary 
                ? article.article_data.original_title 
                : article.article_data.translated_title;
            const primaryAbstract = showOriginalAsPrimary 
                ? article.article_data.original_abstract 
                : article.article_data.translated_abstract;
            
            const secondaryTitle = showOriginalAsPrimary 
                ? article.article_data.translated_title 
                : article.article_data.original_title;
            const secondaryAbstract = showOriginalAsPrimary 
                ? article.article_data.translated_abstract 
                : article.article_data.original_abstract;

            const hasNotesComputed = Boolean(notesPresenceByItemId[article.item_id]);

            return {
                id: article.item_id,
                title: primaryTitle || "Sin título",
                abstract: primaryAbstract || "Sin abstract",
                ai_summary: article.article_data.translation_summary || "Sin resumen",
                year: article.article_data.publication_year?.toString() || "N/A",
                journal: article.article_data.journal || "N/A",
                secondaryTitle,
                secondaryAbstract,
                originalArticle: article,
                hasNotes: hasNotesComputed,
                classifications: article.classifications,
                displayIndex: idx + 1,
            };
        });
    }, [batchDetails, showOriginalAsPrimary, notesPresenceByItemId]);

    // Renderizado principal con guards
    if (articlesLoading) {
        return (
            <StandardPageBackground >
                <div className="flex flex-col items-center justify-center h-screen">
                    <SustratoLoadingLogo />
                    <StandardText>Cargando datos del lote...</StandardText>
                </div>
            </StandardPageBackground>
        );
    }

    if (error) {
        return (
            <StandardPageBackground>
                <div className="flex flex-col items-center justify-center h-screen">
                    <StandardText colorScheme="danger">Error: {error}</StandardText>
                </div>
            </StandardPageBackground>
        );
    }

    if (!batchDetails) {
        return (
            <StandardPageBackground>
                <div className="flex flex-col items-center justify-center h-screen">
                    <StandardText>No se encontraron detalles para este lote.</StandardText>
                </div>
            </StandardPageBackground>
        );
    }

    return (
        <StandardPageBackground>
            <div className="p-4">
                <StandardPageTitle 
                    title={`Lote de Preclasificación #${batchDetails.batch_number}`}
                    subtitle={`Total de artículos: ${batchDetails.rows.length}`}
                />
                <div className="flex items-center gap-4 my-4">
                    {/* Botón visible solo si el lote está en estado 'translated' (traducción completa, aún sin preclasificar) */}
                    {batchDetails.status === 'translated' && (
                        <StandardButton 
                            leftIcon={Brain} 
                            onClick={handleStartPreclassification}
                            disabled={isStartingPreclassification}
                        >
                            {isStartingPreclassification ? "Iniciando..." : "Iniciar Preclasificación con IA"}
                        </StandardButton>
                    )}
                    {/* Nuevo botón visible cuando el lote requiere reconciliación */}
                    {batchDetails.status === 'reconciliation_pending' && (
                        <StandardButton 
                            leftIcon={Brain}
                            styleType="outline"
                            colorScheme="accent"
                            onClick={() => {
                                // placeholder: futura integración con flujo de reconciliación
                                console.log('[UI] Iniciar revisión de divergencias con AI');
                            }}
                        >
                            Iniciar revisión de divergencias con AI
                        </StandardButton>
                    )}
                    <StandardButton 
                        leftIcon={Globe} 
                        onClick={() => setShowOriginalAsPrimary(!showOriginalAsPrimary)}
                        styleType="outline"
                    >
                        {showOriginalAsPrimary ? "Ver Traducción" : "Ver Original"}
                    </StandardButton>
                    {/* Toggle de Vista Compacta */}
                    <div className="flex items-center gap-2">
                        <StandardText size="sm">Vista compacta</StandardText>
                        <StandardSwitch
                            checked={compactView}
                            onCheckedChange={setCompactView}
                            colorScheme="accent"
                        >
                            <StandardTabsList>
                                <StandardTabsTrigger value="grid">Tarjetas</StandardTabsTrigger>
                                <StandardTabsTrigger value="rows">Filas</StandardTabsTrigger>
                                <StandardTabsTrigger value="table">Tabla</StandardTabsTrigger>
                            </StandardTabsList>
                        </StandardSwitch>
                    </div>
                    {/* Botón global de marcar/desmarcar todo el lote */}
                    <StandardButton
                        leftIcon={Check}
                        colorScheme={allMarked ? 'warning' : 'success'}
                        styleType="solid"
                        onClick={handleApproveAllBatch}
                        disabled={isBulkPersisting}
                    >
                        {allMarked ? 'Desmarcar todo el lote' : (isBulkPersisting ? 'Procesando...' : 'Marcar OK todo el lote')}
                    </StandardButton>
                </div>

                <div className="mt-6 h-[calc(100vh-250px)] overflow-y-auto">
                    {viewMode === 'table' ? (
                        <div className="min-w-full px-3 md:px-6 lg:px-8">
                            <TableLikeView
                                cardData={cardData}
                                dimensionOrder={dimensionOrder}
                                dimensionLabelById={dimensionLabelById}
                                dimensionIconById={dimensionIconById}
                                optionEmoticonsByDimId={optionEmoticonsByDimId}
                                dimensionTypeById={dimensionTypeById}
                                optionsByDimId={optionsByDimId}
                                showOriginalAsPrimary={showOriginalAsPrimary}
                                batchId={batchId}
                                batchNumber={batchDetails.batch_number}
                                groupsPresenceByItemId={groupsPresenceByItemId}
                                isLoadingGroupsPresence={isLoadingGroupsPresence}
                                onOpenNotes={handleOpenNotes}
                                onGroupsChanged={(itemId, hasGroups) => setGroupsPresenceByItemId(prev => ({ ...prev, [itemId]: hasGroups }))}
                                compact={compactView}
                                approveAllRequestId={approveAllRequestId}
                                resetAllRequestId={resetAllRequestId}
                                onGlobalBulkPersistResult={handleGlobalBulkPersistResult}
                            />
                        </div>
                    ) : (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                            Otras vistas (tarjetas/filas) están en desarrollo en esta rama.
                        </div>
                    )}
                </div>
            </div>
            {/* Editor de Notas (Modal) */}
            {noteDialogOpen && currentArticle && (
                <NoteEditor
                    open={noteDialogOpen}
                    onClose={handleCloseNotes}
                    article={currentArticle}
                    onNotesChanged={handleNotesChanged}
                    project={auth.proyectoActual}
                    showOriginalAsPrimary={showOriginalAsPrimary}
                />
            )}
        </StandardPageBackground>
    );
};

export default BatchDetailPage;
