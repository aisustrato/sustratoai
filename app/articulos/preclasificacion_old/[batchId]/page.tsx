"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/app/auth/client";
import { useAuth } from "@/app/auth-provider";
import { useJobManager } from "@/app/contexts/JobManagerContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { BatchDetails, ArticleForReview } from "@/lib/types/preclassification-types";
import type { Database } from "@/lib/database.types";

type ArticleBatch = Database['public']['Tables']['article_batches']['Row'];

// Las funciones de notas ahora se manejan en NoteEditor

// Tipo para los datos de la tabla
interface TableRowData {
	id: string;
	title: string;
	abstract: string;
	ai_summary: string;
	year: string;
	journal: string;
	secondaryTitle: string | null;
	secondaryAbstract: string | null;
	originalArticle: ArticleForReview;
	hasNotes?: boolean;
	subRows?: { __isGhost: true }[];
}

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { NoteEditor } from "./components/NoteEditor";
import ArticleGroupManager from "./components/ArticleGroupManager";

import { TextHighlighter } from "./components/TextHighlighter";
import { ColumnDef } from "@tanstack/react-table";
import { 
    Filter, 
    ThumbsDown, 
    CheckCircle,
    Globe,
    StickyNote,
    Brain,
    Search
} from "lucide-react";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

// Componente de celda para el botón de Notas con identidad estable
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
  // Log explícito de decisión de estilo del botón de notas
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
	useUserProfile(); // Se mantiene el hook por efectos secundarios
	const batchId = params.batchId as string;
	// Helper para timestamps ISO consistentes en logs
	const ts = () => new Date().toISOString();
	
	const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
	const [articlesLoading, setArticlesLoading] = useState(true);
	const [dimsLoading, setDimsLoading] = useState(true);
	const [classifLoading, setClassifLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showOriginalAsPrimary, setShowOriginalAsPrimary] = useState(false);
	// Estados para NoteEditor
	const [noteDialogOpen, setNoteDialogOpen] = useState(false);
	const [currentArticle, setCurrentArticle] = useState<ArticleForReview | null>(null);
	
	// Estados para Preclasificación
	const [isStartingPreclassification, setIsStartingPreclassification] = useState(false);

	// 🗒️ Presencia de notas por artículo (clave: article_batch_items.id)
	const [notesPresenceByItemId, setNotesPresenceByItemId] = useState<Record<string, boolean>>({});
	
	// 📁 Presencia de grupos por artículo (clave: article_batch_items.id)
	const [groupsPresenceByItemId, setGroupsPresenceByItemId] = useState<Record<string, boolean>>({});
	const [isLoadingGroupsPresence, setIsLoadingGroupsPresence] = useState(false);

	// Derivar presencia de notas desde batchDetails.rows[].notes_info
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

	// Función para cargar presencia de grupos de forma optimizada
	const loadGroupsPresence = useCallback(async (articles: ArticleForReview[]) => {
		try {
			setIsLoadingGroupsPresence(true);
			const t0 = performance.now();
			console.log(`[${ts()}] [groups] Inicio carga presencia de grupos (optimizada)`, { articles: articles.length });
			
			const articleIds = articles.map(a => a.article_id).filter(id => id && id.trim() !== '');
			if (articleIds.length === 0) {
				console.warn('[groups] No hay article_ids válidos para consultar grupos');
				setIsLoadingGroupsPresence(false);
				return;
			}

			// Usar la nueva función optimizada que hace una sola consulta
			const { getBulkGroupsPresence } = await import('@/lib/actions/article-group-actions');
			const result = await getBulkGroupsPresence({ articleIds });
			
			if (!result.success) {
				console.error('[groups] Error en getBulkGroupsPresence:', result.error);
				setIsLoadingGroupsPresence(false);
				return;
			}

			// Mapear resultados de article_id a item_id
			const groupsMap: Record<string, boolean> = {};
			articles.forEach(article => {
				groupsMap[article.item_id] = result.data[article.article_id] || false;
			});
			
			setGroupsPresenceByItemId(groupsMap);
			const ms = Math.round(performance.now() - t0);
			const withGroups = Object.values(groupsMap).filter(Boolean).length;
			console.log(`[${ts()}] [groups] Fin carga presencia de grupos (optimizada)`, { articles: articles.length, withGroups, ms });
		} catch (error) {
			console.error('[groups] Error cargando presencia de grupos:', error);
		} finally {
			setIsLoadingGroupsPresence(false);
		}
	}, []);

	// Función para cargar los detalles del lote
	const loadBatchDetails = useCallback(async () => {
		if (!batchId) return;
		console.log(`[${ts()}] [batch] Inicio consulta detalles de lote`, { batchId });
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
			// 📁 Cargar presencia de grupos en paralelo
			loadGroupsPresence(data.rows);
			const ms = Math.round(performance.now() - start);
			console.log(`[${ts()}] [batch] Fin consulta detalles de lote`, { batchId, articles: data.rows.length, ms });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
			const ms = Math.round(performance.now() - start);
			console.error(`[${ts()}] [batch] Excepción consulta detalles de lote`, { batchId, error: err, ms });
		} finally {
			setArticlesLoading(false);
		}
	}, [batchId, loadGroupsPresence]);

	// Refrescar presencia para un artículo en particular (usado al cerrar editor)
	const refreshNotesPresence = useCallback(async () => {
		// Ahora recargamos los detalles del lote para obtener notes_info actualizado en bloque
		await loadBatchDetails();
	}, [loadBatchDetails]);

	
	
	
	// 📊 Estados para Dimensiones Dinámicas
	interface DimensionType {
		id: string;
		name: string;
		type: 'finite' | 'open';
	}
	
	interface ClassificationType {
		id: string;
		article_batch_item_id: string;
		dimension_id: string;
		classification_value: string | null;
		rationale: string | null;
		confidence_score: number | null;
		iteration: number;
		created_at: string;
		reviewer_id: string;
		reviewer_type: string;
		// Campos calculados para compatibilidad
		ai_value?: string;
		ai_rationale?: string;
	}
	
	const [activeDimensions, setActiveDimensions] = useState<DimensionType[]>([]);
	const [dimensionClassifications, setDimensionClassifications] = useState<Record<string, ClassificationType>>({});

	// 📊 Función para cargar dimensiones activas de la fase
	const loadActiveDimensions = useCallback(async () => {
		if (!batchId) return;
		const t0 = performance.now();
		console.log(`[${ts()}] [dims] Inicio carga dimensiones activas`, { batchId });
		setDimsLoading(true);
		
		try {
			// Necesitamos obtener el project_id del batch
			const supabase = (await import('@/app/auth/client')).supabase;
			const tb0 = performance.now();
			const { data: batchData, error: batchError } = await supabase
				.from('article_batches')
				.select('project_id')
				.eq('id', batchId)
				.single();
			const tbMs = Math.round(performance.now() - tb0);
			console.log(`[${ts()}] [dims] Consulta project_id de batch`, { batchId, ms: tbMs, ok: !batchError });
			
			if (batchError || !batchData) {
				console.error('Error obteniendo project_id del batch:', batchError);
				setDimsLoading(false);
				return;
			}

			// Obtener fase activa vía API
			const tf0 = performance.now();
			const activePhaseResp = await fetch('/api/preclassification/active-phase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectId: batchData.project_id }),
			});
			if (!activePhaseResp.ok) {
				const { error: apiError } = (await activePhaseResp.json().catch(() => ({ error: 'Error desconocido' }))) as { error?: string };
				throw new Error(apiError || `HTTP ${activePhaseResp.status}`);
			}
			const { data: activePhase } = (await activePhaseResp.json()) as { data: { id: string } | null };
			const tfMs = Math.round(performance.now() - tf0);
			console.log(`[${ts()}] [dims] Consulta fase activa`, { projectId: batchData.project_id, ms: tfMs, ok: Boolean(activePhase?.id) });
			if (!activePhase?.id) {
				console.error('Error obteniendo fase activa: no encontrada');
				setDimsLoading(false);
				return;
			}

			// Cargar dimensiones activas vía API
			const td0 = performance.now();
			const dimsResp = await fetch('/api/preclassification/dimensions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phaseId: activePhase.id, includeArchived: false }),
			});
			if (!dimsResp.ok) {
				const { error: apiError } = (await dimsResp.json().catch(() => ({ error: 'Error desconocido' }))) as { error?: string };
				throw new Error(apiError || `HTTP ${dimsResp.status}`);
			}
			const { data: dims } = (await dimsResp.json()) as { data: Array<{ id: string; name: string; type: 'finite' | 'open' }> };
			const tdMs = Math.round(performance.now() - td0);

			const mappedDims: { id: string; name: string; type: 'finite' | 'open' }[] = (dims || []).map(d => ({ id: d.id, name: d.name, type: d.type as 'finite' | 'open' }));
			setActiveDimensions(mappedDims);
			console.log('📊 Dimensiones activas cargadas:', mappedDims.length);
			const totalMs = Math.round(performance.now() - t0);
			console.log(`[${ts()}] [dims] Fin carga dimensiones activas`, { dims: mappedDims.length, listMs: tdMs, totalMs });
		} catch (error) {
			console.error('Error cargando dimensiones activas:', error);
		} finally {
			setDimsLoading(false);
		}
	}, [batchId]);
	
	// 📋 Función para cargar clasificaciones de dimensiones
	const loadDimensionClassifications = useCallback(async () => {
		if (!batchId) return;
		const t0 = performance.now();
		console.log(`[${ts()}] [classif] Inicio carga clasificaciones`, { batchId });
		setClassifLoading(true);
		
		try {
			// Obtener clasificaciones de dimensiones
			const supabase = (await import('@/app/auth/client')).supabase;
			const { data: classifications, error } = await supabase
				.from('article_dimension_reviews')
				.select(`
					*,
					article_batch_items!inner(batch_id),
					preclass_dimensions!inner(name)
				`)
				.eq('article_batch_items.batch_id', batchId)
				.order('iteration', { ascending: false }); // Iteración más alta primero
			
			if (error) {
				console.error('Error cargando clasificaciones:', error);
				return;
			}
			
			// Organizar clasificaciones por artículo y dimensión (solo la iteración más alta)
			const classificationMap: Record<string, ClassificationType> = {};
			classifications?.forEach(classification => {
				const key = `${classification.article_batch_item_id}_${classification.dimension_id}`;
				if (!classificationMap[key] || classificationMap[key].iteration < classification.iteration) {
					classificationMap[key] = classification;
				}
			});
			
			setDimensionClassifications(classificationMap);
			console.log('📋 Clasificaciones cargadas:', Object.keys(classificationMap).length);
			const ms = Math.round(performance.now() - t0);
			console.log(`[${ts()}] [classif] Fin carga clasificaciones`, { batchId, count: Object.keys(classificationMap).length, ms });
		} catch (error) {
			console.error('Error cargando clasificaciones de dimensiones:', error);
		} finally {
			setClassifLoading(false);
		}
	}, [batchId]);

	// loadBatchDetails fue movida arriba para evitar TDZ

	// Cargar datos iniciales en paralelo: dimensiones, clasificaciones y artículos
	useEffect(() => {
		loadActiveDimensions();
		loadDimensionClassifications();
		loadBatchDetails();
	}, [loadActiveDimensions, loadDimensionClassifications, loadBatchDetails]);

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
				(payload) => {
					console.log("🔄 Nueva clasificación detectada:", payload);
					// Recargar clasificaciones de dimensiones para actualizar la tabla
					loadDimensionClassifications();
					// Refrescar la página para mostrar los nuevos datos
					router.refresh();
				}
			)
			.subscribe();

		return () => {
			reviewsSubscription.unsubscribe();
		};
	}, [batchId, router, loadDimensionClassifications]);

	// Funciones de manejo de acciones
	// (Eliminado) Botón/función para abrir DOI

	const handleDisagree = useCallback((article: ArticleForReview) => {
		if (!article.item_id) {
			console.error('ID de artículo no válido');
			return;
		}
		console.log('Desacuerdo marcado para:', article.item_id);
		// TODO: Implementar lógica de desacuerdo en futuras versiones
	}, []);

	const handleValidate = useCallback((article: ArticleForReview) => {
		if (!article.item_id) {
			console.error('ID de artículo no válido');
			return;
		}
		console.log('Validación marcada para:', article.item_id);
		// TODO: Implementar lógica de validación en futuras versiones
	}, []);

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

	// 📊 Función para generar columnas dinámicas de dimensiones - API NATIVA
	const createDimensionColumns = useCallback((): ColumnDef<TableRow>[] => {
		const columns: ColumnDef<TableRow>[] = [];
		
		activeDimensions.forEach(dimension => {
			// 📊 Columna de Valor de Dimensión - API NATIVA
			columns.push({
				id: `dimension_${dimension.id}`,
				header: dimension.name,
				size: 180,
				// 🔧 CLAVE: accessorFn proporciona el valor para cell.getValue() usado en tooltips
				accessorFn: (row) => {
					const articleBatchItemId = row.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification) {
						return 'Pendiente';
					}
					
					// Mapear confidence score a texto
					const confidenceScore = Number(classification.confidence_score);
					const confidenceText = {
						1: 'Baja',
						2: 'Media',
						3: 'Alta'
					}[confidenceScore as 1 | 2 | 3] || 'N/A';
					
					const displayValue = classification.classification_value || 'Sin valor';
					
					// Valor completo para tooltip
					return `${displayValue} (Confianza: ${confidenceText}) - Iteración: ${classification.iteration}`;
				},
				// 🎨 NUEVA FUNCIÓN CELL: Renderizar con resaltado de palabra clave
				cell: (info) => {
					const row = info.row as { original: TableRowData };
					const articleBatchItemId = row.original.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification) {
						return (
							<TextHighlighter 
								text="Pendiente" 
								keyword={null}
								className="text-neutral-textShade italic"
							/>
						);
					}
					
					const displayValue = classification.classification_value || 'Sin valor';
					
					return (
						<TextHighlighter 
							text={displayValue} 
							keyword={null}
						/>
					);
				},
				meta: { 
					isTruncatable: true,
					enableCopyButton: true,
					tooltipType: 'longText' as const,
					cellVariant: (context) => {
						const row = context.row as { original: TableRowData };
						const articleBatchItemId = row.original.id;
						const classificationKey = `${articleBatchItemId}_${dimension.id}`;
						const classification = dimensionClassifications[classificationKey];
						
						if (!classification) return undefined;
						
						const confidenceScore = Number(classification.confidence_score);
						switch (confidenceScore) {
							case 3: return 'success';   // Verde para confianza alta
							case 2: return 'warning';   // Amarillo para confianza media
							case 1: return 'danger';    // Rojo para confianza baja
							default: return undefined;  // Sin color para casos sin clasificación
						}
					}
				}
			});
			
			// 🔄 Columna de Iteración - API NATIVA (solo si hay iteraciones ≥ 2)
			const hasHighIterations = Object.values(dimensionClassifications).some(classification => 
				classification && classification.iteration && classification.iteration >= 2
			);
			
			if (hasHighIterations) {
				columns.push({
				id: `iteration_${dimension.id}`,
				header: "I",
				size: 50, // Columna pequeña para un solo dígito
				accessorFn: (row) => {
					const articleBatchItemId = row.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification || !classification.iteration) {
						return '0';
					}
					
					return String(classification.iteration);
				},
				cell: (info) => {
					const row = info.row as { original: TableRowData };
					const articleBatchItemId = row.original.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					const iteration = classification?.iteration || 0;
					
					return (
						<div className="flex justify-center items-center text-sm font-medium">
							{iteration}
						</div>
					);
				},
				meta: {
					tooltipType: 'standard' as const
				}
				});
			}
			
			// 📝 Columna de Justificación - API NATIVA
			const dimensionAcronym = dimension.name
				.split(' ')
				.map((word: string) => word.charAt(0).toUpperCase())
				.join('')
				.substring(0, 3);
				
			columns.push({
				id: `justification_${dimension.id}`,
				header: `Justificación ${dimensionAcronym}`,
				size: 300,
				// 🔧 CLAVE: accessorFn para que el tooltip tenga acceso al valor de justificación
				accessorFn: (row) => {
					const articleBatchItemId = row.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification || !classification.rationale) {
						return 'Sin justificación';
					}
					
					// Retornar la justificación completa para el tooltip
					return classification.rationale;
				},
				meta: { 
					isTruncatable: true, 
					enableCopyButton: true,
					tooltipType: "longText" as const 
				}
			});
		});
		
		return columns;
	}, [activeDimensions, dimensionClassifications]);

	// 📊 Configuración final de columnas: base + dimensiones dinámicas
	const tableColumns: ColumnDef<TableRow>[] = useMemo(() => {
		const dimensionColumns = createDimensionColumns();
		
		// Definir columnas base dentro del useMemo
		const baseColumns: ColumnDef<TableRow>[] = [
			// Columna expander (primera columna sticky)
			{ 
				id: 'expander', 
				header: () => null, 
				cell: ({ row }) => row.getCanExpand() ? '' : null, 
				meta: { isSticky: 'left' as const }, 
				size: 40, 
				enableHiding: false 
			},
			// Columna de acciones (ahora sticky a la izquierda)
			{
				id: "actions",
				header: "Acciones",
				size: 200,
				enableHiding: false,
				meta: { 
					align: "center",
					isSticky: "left", 
					size: 200
				},
				cell: ({ row }) => {
					const article = row.original.originalArticle;
					const hasNotesLive = Boolean(notesPresenceByItemId[article.item_id]);
					
					return (
						<div className="flex gap-1">
							<NotesButtonCell 
								article={article}
								hasNotes={hasNotesLive}
								onOpenNotes={handleOpenNotes}
							/>
							<StandardButton
								styleType="outline"
								iconOnly={true}
								onClick={() => {
									const hasTranslation = Boolean(
										article.article_data?.translated_title ||
										article.article_data?.translated_abstract
									);
									const translatedParam = hasTranslation && !showOriginalAsPrimary ? "true" : "false";
									const articleId = article.article_id;
									if (!articleId) {
										console.error('[Acciones] No se encontró article_id para el item', { itemId: article.item_id, articleId });
										return;
									}
									const returnHref = encodeURIComponent(`/articulos/preclasificacion/${batchId}`);
									const returnLabelRaw = `Lote #${batchDetails?.batch_number ?? ''}`;
									const returnLabel = encodeURIComponent(returnLabelRaw);
									window.location.href = `/articulos/detalle?articleId=${articleId}&translated=${translatedParam}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
								}}
								tooltip="Ver detalle del artículo"
							>
								<Search size={16} />
							</StandardButton>
							<ArticleGroupManager
								articleId={row.original.originalArticle.article_id}
								hasGroups={groupsPresenceByItemId[row.original.originalArticle.item_id] || false}
								isLoadingPresence={isLoadingGroupsPresence}
								onGroupsChanged={(hasGroups) => {
									setGroupsPresenceByItemId(prev => ({
										...prev,
										[row.original.originalArticle.item_id]: hasGroups
									}));
								}}
							/>
							<StandardButton
								styleType="outline"
								iconOnly={true}
								onClick={() => handleDisagree(article)}
								tooltip="Marcar desacuerdo"
							>
								<ThumbsDown size={16} />
							</StandardButton>
							<StandardButton
								styleType="outline"
								iconOnly={true}
								onClick={() => handleValidate(article)}
								tooltip="Validar"
							>
								<CheckCircle size={16} />
							</StandardButton>
						</div>
					);
				},
			},
			{
				id: "title",
				accessorKey: "title",
				header: showOriginalAsPrimary ? "Título Original" : "Título Traducido",
				size: 250,
				meta: { isTruncatable: true },
			},
			{
				id: "abstract",
				accessorKey: "abstract",
				header: showOriginalAsPrimary ? "Abstract Original" : "Abstract Traducido",
				size: 300,
				meta: { isTruncatable: true, tooltipType: "longText" as const },
			},
			{
				id: "ai_summary",
				accessorKey: "ai_summary",
				header: "Resumen del Abstract",
				size: 250,
				meta: { isTruncatable: true, tooltipType: "longText" as const },
			},
			{
				id: "year",
				accessorKey: "year",
				header: "Año",
				size: 80,
				meta: { align: "center" as const },
			},
			{
				id: "journal",
				accessorKey: "journal",
				header: "Revista",
				size: 200,
				meta: { isTruncatable: true },
			},
		];
		
		// Composición final de columnas
		return [
			...baseColumns,
			...dimensionColumns,
		];
	}, [
		createDimensionColumns,
		showOriginalAsPrimary,
		handleDisagree,
		handleValidate,
		handleOpenNotes,
		notesPresenceByItemId,
		// Para navegación al detalle: usamos batchId y el número de lote en el onClick
		batchId,
		batchDetails?.batch_number,
		// Estado de grupos para ArticleGroupManager
		groupsPresenceByItemId,
		// Loading de presencia de grupos también afecta las props del cell de Acciones
		isLoadingGroupsPresence,
	]);

	// Transformar datos para la tabla
	const tableData: TableRow[] = batchDetails?.rows.map((article: ArticleForReview) => {
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

		// Verificar si hay contenido secundario para mostrar el expander
		const hasSecondaryContent = secondaryTitle || secondaryAbstract;

		    // Cálculo explícito de hasNotes con log de soporte
    const mapValue = notesPresenceByItemId[article.item_id];
    const hasNotesComputed = Boolean(mapValue);
    console.log('[tableData] cálculo hasNotes para fila', {
      itemId: article.item_id,
      mapValue,
      hasNotesComputed,
    });

    const rowData: TableRowData = {
      id: article.item_id,
      title: primaryTitle || "Sin título",
      abstract: primaryAbstract || "Sin abstract",
      ai_summary: article.article_data.translation_summary || "Sin resumen",
      year: article.article_data.publication_year?.toString() || "N/A",
      journal: article.article_data.journal || "N/A",
      // Datos adicionales para el sub-componente
      secondaryTitle,
      secondaryAbstract,
      // Referencia al artículo original para las acciones
      originalArticle: article,
      // Presencia de notas para evitar pasar el mapa completo a la celda
      hasNotes: hasNotesComputed,
    };

		// Agregar subRows si hay contenido secundario (para habilitar expander)
		if (hasSecondaryContent) {
			rowData.subRows = [{ __isGhost: true }];
		}

		// Crear la fila con la estructura que espera tanstack/table
		return {
		  ...rowData,
		  original: rowData,
		  getValue: (key: string) => (rowData as unknown as Record<string, unknown>)[key],
		  renderValue: (key: string) => (rowData as unknown as Record<string, unknown>)[key]
		} as TableRow;
	}) || [];

	// Definir un tipo para la fila de la tabla que extienda RowData para compatibilidad con tanstack/table
	interface TableRow extends TableRowData {
	  // Propiedades adicionales requeridas por tanstack/table
	  original: TableRowData;
	  getValue: (key: string) => unknown;
	  renderValue: (key: string) => unknown;
	  // Hacer que la interfaz sea compatible con RowData
	  [key: string]: unknown;
	  [key: number]: unknown;
	  [key: symbol]: unknown;
	}

	// Función para renderizar el sub-componente expandible
	const renderSubComponent = (row: { original: TableRow }) => {
	  const { secondaryTitle, secondaryAbstract } = row.original;
	  
	  if (!secondaryTitle && !secondaryAbstract) {
	    return null;
	  }

	  return (
	    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
	      <div className="space-y-3">
	        {secondaryTitle && (
	          <div>
	            <StandardText size="sm" className="font-medium text-gray-600 dark:text-gray-400">
	              {showOriginalAsPrimary ? "Título Traducido:" : "Título Original:"}
	            </StandardText>
	            <StandardText size="sm" className="mt-1">
	              {secondaryTitle}
	            </StandardText>
	          </div>
	        )}
	        {secondaryAbstract && (
	          <div>
	            <StandardText size="sm" className="font-medium text-gray-600 dark:text-gray-400">
	              {showOriginalAsPrimary ? "Abstract Traducido:" : "Abstract Original:"}
	            </StandardText>
	            <StandardText size="sm" className="mt-1">
	              {secondaryAbstract}
	            </StandardText>
	          </div>
	        )}
	      </div>
	    </div>
	  );
	};

	if (dimsLoading && activeDimensions.length === 0) {
		return (
			<div className="w-full h-full p-4 sm:p-6 flex flex-col">
				<StandardPageTitle
					title="Detalle de Lote"
					mainIcon={Filter}
					subtitle="Cargando estructura del lote..."
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: "Detalle de Lote" },
					]}
				/>
				<div className="mt-6 flex-grow flex flex-col items-center justify-center gap-6">
					<SustratoLoadingLogo 
						size={80}
						variant="spin-pulse"
						speed="normal"
						showText={true}
						text="Cargando columnas de dimensiones..."
						className="mb-4"
					/>
					<StandardText className="text-gray-500 dark:text-gray-400">
						Por favor espera mientras cargamos la estructura...
					</StandardText>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full h-full p-4 sm:p-6 flex flex-col">
				<StandardPageTitle
					title="Error"
					mainIcon={Filter}
					subtitle="Error al cargar el lote"
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: "Error" },
					]}
				/>
				<div className="mt-6 flex-grow flex items-center justify-center">
					<StandardCard title="Error">
						<StandardCard.Content>
							<StandardText colorScheme="danger">{error}</StandardText>
						</StandardCard.Content>
					</StandardCard>
				</div>
			</div>
		);
	}

	if (!articlesLoading && (!batchDetails || batchDetails.rows.length === 0)) {
		return (
			<div className="w-full h-full p-4 sm:p-6 flex flex-col">
				<StandardPageTitle
					title="Detalle de Lote"
					mainIcon={Filter}
					subtitle="No hay artículos en este lote"
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: "Detalle de Lote" },
					]}
					actionsPosition="left"
				/>
				<div className="mt-6 flex-grow flex items-center justify-center">
					<StandardText>No hay artículos para mostrar en este lote.</StandardText>
				</div>
			</div>
		);
	}

	const actionsBar = (
    <div className="flex items-center gap-4">
      {/* Botón de preclasificación - solo visible si el lote está traducido */}
      {batchDetails?.status === 'translated' && (
        <StandardButton
          styleType="solid"
          colorScheme="accent"
          leftIcon={Brain}
          onClick={handleStartPreclassification}
          disabled={isStartingPreclassification}
          className="flex items-center gap-2"
        >
          {isStartingPreclassification ? 'Iniciando...' : 'Iniciar Preclasificación'}
        </StandardButton>
      )}
      {/* Botón de inversión de vista */}
      <StandardButton
        styleType="outline"
        onClick={() => setShowOriginalAsPrimary(!showOriginalAsPrimary)}
        className="flex items-center gap-2"
        leftIcon={Globe}
      >
        {showOriginalAsPrimary ? "Idioma Español" : "Idioma Original"}
      </StandardButton>
    </div>
  );

  // ✅ ESTRUCTURA CORREGIDA: Eliminar contenedores flex que limitan el scroll
  // Aplicar la misma estructura que funciona en standard-table-final
	return (
		<StandardPageBackground variant="default">
		<div className="p-4 sm:p-6">
			<StandardPageTitle
				title={`Preclasificación Lote #${batchDetails?.batch_number || batchId}`}
				mainIcon={Filter}
				subtitle={batchDetails ? `${batchDetails.rows.length} artículos en revisión` : (articlesLoading ? 'Cargando artículos...' : ((dimsLoading || classifLoading) ? 'Cargando metadatos...' : '0 artículos'))}
				showBackButton={{ href: "/articulos/preclasificacion" }}
				breadcrumbs={[
					{ label: "Artículos", href: "/articulos" },
					{ label: "Preclasificación", href: "/articulos/preclasificacion" },
					{ label: `Preclasificación Lote #${batchDetails?.batch_number || batchId}` },
				]}
				actions={actionsBar}
				actionsPosition="left"
			/>
			
			<div className="mt-6 space-y-4">
				{/* Tabla principal - Wrapper aislado para sticky header */}
				<div className="relative" style={{ isolation: 'isolate' }}>
					{/* Spacer para evitar interferencia con elementos superiores */}
					<div style={{ height: '1px', marginBottom: '8px' }} />
					<StandardTable
						data={tableData}
						columns={tableColumns}
						renderSubComponent={renderSubComponent}
						isStickyHeader={true}
						enableTruncation={true}
						filterPlaceholder="Buscar artículos..."
						stickyOffset={80}
						enableKeywordHighlighting={true}
						keywordHighlightPlaceholder="Resaltar palabra clave..."
						enableCsvExport={true}
						csvFileName={`Preclasificacion_Lote_${batchDetails?.batch_number ?? batchId}`}
					>
						<StandardTable.Table />
					</StandardTable>
				</div>
			</div>

			{/* NoteEditor Component */}
			<NoteEditor
				open={noteDialogOpen}
				onClose={handleCloseNotes}
				article={currentArticle}
				project={auth.proyectoActual ? { id: auth.proyectoActual.id, name: auth.proyectoActual.name } : null}
				showOriginalAsPrimary={showOriginalAsPrimary}
				onNotesChanged={handleNotesChanged}
			/>
		</div>
		</StandardPageBackground>
	);
};

export default BatchDetailPage;
