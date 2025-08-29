"use client";

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Brain, 
  ThumbsDown, 
  CheckCircle, 
  Globe, 
  StickyNote, 
  Search 
} from 'lucide-react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ArticleForReview, BatchDetails } from '@/lib/types/preclassification-types';

import { useAuth } from "@/app/auth-provider";

import type { Database } from "@/lib/database.types";

type ArticleBatch = Database['public']['Tables']['article_batches']['Row'];

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { NoteEditor } from "@/app/articulos/preclasificacion/[batchId]/components/NoteEditor";
import ArticleGroupManager from "@/app/articulos/preclasificacion/[batchId]/components/ArticleGroupManager";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { DimensionDisplay } from './components/DimensionDisplay';
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { 
  StandardAccordion,
  StandardAccordionItem,
  StandardAccordionTrigger,
  StandardAccordionContent,
} from "@/components/ui/StandardAccordion/StandardAccordion";
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
	const router = useRouter();
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
	const [viewAsRows, setViewAsRows] = useState(false);

	// Estado local: aprobación/rechazo por artículo (UI only)
	const [articleStatusById, setArticleStatusById] = useState<Record<string, 'none' | 'approved' | 'rejected'>>({});

	const setArticleStatus = useCallback((articleId: string, status: 'none' | 'approved' | 'rejected') => {
		setArticleStatusById(prev => ({ ...prev, [articleId]: status }));
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

    const optionEmoticonsByDimId = useMemo<Record<string, Record<string, string | null>>>((
    ) => {
        const map: Record<string, Record<string, string | null>> = {};
        (batchDetails?.columns || []).forEach(col => {
            if (col?.id) map[col.id] = col.optionEmoticons || {};
        });
        return map;
    }, [batchDetails?.columns]);

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
					loadBatchDetails();
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
					// Filtrar por artículos que pertenecen a este lote sería ideal,
					// pero por simplicidad refrescaremos en cualquier INSERT
				},
				(payload: RealtimePostgresChangesPayload<Database['public']['Tables']['article_dimension_reviews']['Row']>) => {
					console.log("🔄 Nueva clasificación detectada:", payload);
					// Refrescar la página para mostrar los nuevos datos
					router.refresh();
				}
			)
			.subscribe();

		return () => {
			reviewsSubscription.unsubscribe();
		};
	}, [batchId, router]);

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


	// Renderizado principal
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
					<StandardText color="danger">Error: {error}</StandardText>
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
					<StandardButton 
						leftIcon={Brain} 
						onClick={handleStartPreclassification}
						disabled={isStartingPreclassification}
					>
						{isStartingPreclassification ? "Iniciando..." : "Iniciar Preclasificación con IA"}
					</StandardButton>
					<StandardButton 
						leftIcon={Globe} 
						onClick={() => setShowOriginalAsPrimary(!showOriginalAsPrimary)}
						styleType="outline"
					>
						{showOriginalAsPrimary ? "Ver Traducción" : "Ver Original"}
					</StandardButton>
					<div className="ml-auto flex items-center gap-2">
						<StandardText size="sm" className="text-gray-600 dark:text-gray-300">Ver en filas</StandardText>
						<StandardSwitch
							checked={viewAsRows}
							onCheckedChange={(v) => setViewAsRows(Boolean(v))}
							colorScheme="primary"
							size="sm"
						/>
					</div>
				</div>

				<div className="mt-6 h-[calc(100vh-250px)] overflow-y-auto pr-2">
					<div className={viewAsRows ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
						{cardData.map(article => {
							const articleUiId = article.id;
							const status = articleStatusById[articleUiId] || 'none';
							const cardColorScheme: StandardCardColorScheme = status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'primary';
							const approveActive = status === 'approved';
							const rejectActive = status === 'rejected';
							return (
								<StandardCard 
									key={article.id} 
									className="flex flex-col group"
									accentPlacement="left" 
									accentColorScheme={cardColorScheme}
									colorScheme={cardColorScheme}
								>
									<div className="p-4 flex-grow flex flex-col relative">
										{/* Barra de acciones principales: Notas, Detalle, Grupos (arriba a la derecha, sobre el título) */}
										<div className="absolute top-2 right-2 z-20 flex items-center gap-1">
											<NotesButtonCell 
												article={article.originalArticle}
												hasNotes={article.hasNotes}
												onOpenNotes={handleOpenNotes}
											/>
											<StandardButton
												styleType="outline"
												iconOnly={true}
												onClick={() => {
													const hasTranslation = Boolean(article.originalArticle.article_data?.translated_title || article.originalArticle.article_data?.translated_abstract);
													const translatedParam = hasTranslation && !showOriginalAsPrimary ? "true" : "false";
													const articleId = article.originalArticle.article_id;
													if (!articleId) return;
													const returnHref = encodeURIComponent(`/articulos/preclasificacion2/${batchId}`);
													const returnLabel = encodeURIComponent(`Lote #${batchDetails?.batch_number ?? ''}`);
													window.location.href = `/articulos/detalle?articleId=${articleId}&translated=${translatedParam}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
												}}
												tooltip="Ver detalle del artículo"
											>
												<Search size={16} />
											</StandardButton>
											<ArticleGroupManager
												articleId={article.originalArticle.article_id}
												hasGroups={groupsPresenceByItemId[article.originalArticle.item_id] || false}
												isLoadingPresence={isLoadingGroupsPresence}
												onGroupsChanged={(hasGroups: boolean) => setGroupsPresenceByItemId(prev => ({ ...prev, [article.originalArticle.item_id]: hasGroups }))}
											/>
										</div>

										{/* Título */}
										<div className="mb-8 pr-24 md:pr-28">
											<StandardText
												preset="title"
												applyGradient
												className="whitespace-normal"
											>
												{article.displayIndex ? `${article.displayIndex}. ` : ''}{article.title}
											</StandardText>
											<StandardText size="sm" className="text-gray-500 dark:text-gray-400">
												{article.journal} ({article.year})
											</StandardText>
										</div>

									{/* Vista en filas: encabezado + textos, seguido por grilla 5 columnas de dimensiones */}
									{viewAsRows ? (
										<>
											<div className="space-y-3 mb-4">
												<div>
													<StandardText size="sm" weight="semibold" className="mb-1">Resumen IA</StandardText>
													<StandardText size="sm" colorScheme="primary" colorShade="dark">{article.ai_summary}</StandardText>
												</div>
												<StandardAccordion type="single">
													<StandardAccordionItem value={`abstract-${article.id}`}>
														<StandardAccordionTrigger titleAlign="left">
															<StandardText size="xs" weight="semibold">Abstract</StandardText>
														</StandardAccordionTrigger>
														<StandardAccordionContent>
															<StandardText size="xs">{article.abstract}</StandardText>
														</StandardAccordionContent>
													</StandardAccordionItem>
												</StandardAccordion>
											</div>
											<div className="flex items-center justify-between mb-2">
												<StandardText size="sm" weight="semibold" className="text-gray-700 dark:text-gray-300">Dimensiones</StandardText>
												<div className="flex items-center gap-1">
													<StandardButton 
														styleType={approveActive ? 'solid' : 'outline'} 
														iconOnly 
														tooltip="Aprobar todas las dimensiones"
														onClick={() => setArticleStatus(articleUiId, approveActive ? 'none' : 'approved')}
													>
														<CheckCircle size={16} />
													</StandardButton>
													<StandardButton 
														styleType={rejectActive ? 'solid' : 'outline'} 
														iconOnly 
														tooltip="Rechazar todas las dimensiones"
														onClick={() => setArticleStatus(articleUiId, rejectActive ? 'none' : 'rejected')}
													>
														<ThumbsDown size={16} />
													</StandardButton>
												</div>
											</div>
											{article.classifications && Object.keys(article.classifications).length > 0 ? (
												<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
													{Object.entries(article.classifications).map(([dimName, reviews]) => (
														<StandardCard key={dimName} className="h-full relative group/dimcard">
															{/* Controles hover por dimensión (UI esqueleto) */}
															<div className="absolute top-1 right-1 z-20 opacity-0 transition-opacity duration-200 group-hover/dimcard:opacity-100">
																<div className="flex items-center gap-1 p-0.5">
																	<StandardButton styleType="outline" iconOnly tooltip="Aprobar dimensión">
																		<CheckCircle size={14} />
																	</StandardButton>
																	<StandardButton styleType="outline" iconOnly tooltip="Rechazar dimensión">
																		<ThumbsDown size={14} />
																	</StandardButton>
																</div>
															</div>
															<div className="p-2">
																<DimensionDisplay
																		variant="card"
																		dimensionName={dimensionLabelById[dimName] ?? dimName}
																		review={reviews.find(r => r.reviewer_type === 'ai')}
																		dimensionIcon={dimensionIconById[dimName]}
																		optionEmoticons={optionEmoticonsByDimId[dimName]}
																	/>
															</div>
														</StandardCard>
													))}
												</div>
											) : (
												<StandardText size="xs" className="italic text-gray-400">Sin dimensiones</StandardText>
											)}
										</>
									) : (
										/* Vista en columnas: resúmenes a la izquierda, dimensiones a la derecha */
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
											<div className="space-y-4 pr-2">
												<div>
													<StandardText size="sm" weight="semibold" className="mb-1">Resumen IA</StandardText>
													<StandardText size="sm" colorScheme="primary" colorShade="dark">{article.ai_summary}</StandardText>
												</div>
												<StandardAccordion type="single">
													<StandardAccordionItem value={`abstract-${article.id}`}>
														<StandardAccordionTrigger titleAlign="left">
															<StandardText size="xs" weight="semibold">Abstract</StandardText>
														</StandardAccordionTrigger>
														<StandardAccordionContent>
															<StandardText size="xs">{article.abstract}</StandardText>
														</StandardAccordionContent>
													</StandardAccordionItem>
												</StandardAccordion>
											</div>
											<div className="md:border-l md:pl-4 border-gray-200 dark:border-gray-700 relative group/dims">
												<div className="flex items-center justify-between mb-2">
													<StandardText size="sm" weight="semibold" className="text-gray-700 dark:text-gray-300">Dimensiones</StandardText>
													<div className="flex items-center gap-1">
														<StandardButton 
															styleType={approveActive ? 'solid' : 'outline'} 
															iconOnly 
															tooltip="Aprobar todas las dimensiones"
															onClick={() => setArticleStatus(articleUiId, approveActive ? 'none' : 'approved')}
														>
															<CheckCircle size={16} />
														</StandardButton>
														<StandardButton 
															styleType={rejectActive ? 'solid' : 'outline'} 
															iconOnly 
															tooltip="Rechazar todas las dimensiones"
															onClick={() => setArticleStatus(articleUiId, rejectActive ? 'none' : 'rejected')}
														>
															<ThumbsDown size={16} />
														</StandardButton>
													</div>
												</div>
												{article.classifications && Object.keys(article.classifications).length > 0 ? (
													Object.entries(article.classifications).map(([dimName, reviews]) => (
														<DimensionDisplay
															key={dimName}
															dimensionName={dimensionLabelById[dimName] ?? dimName}
															review={reviews.find(r => r.reviewer_type === 'ai')}
															dimensionIcon={dimensionIconById[dimName]}
															optionEmoticons={optionEmoticonsByDimId[dimName]}
														/>
													))
												) : (
													<StandardText size="xs" className="italic text-gray-400">Sin dimensiones</StandardText>
												)}
											</div>
										</div>
									)}
								</div>
							</StandardCard>
							);
						})}
						</div>
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
