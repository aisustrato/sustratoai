"use client";

import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	memo,
	useRef,
	lazy,
	Suspense,
} from "react";
import { useParams } from "next/navigation";
import {
	Brain,
	Globe,
	StickyNote,
	Check,
	CheckCircle,
	AlertTriangle,
} from "lucide-react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
	ArticleForReview,
	BatchDetails,
} from "@/lib/types/preclassification-types";

import { useAuth } from "@/app/auth-provider";

import type { Database } from "@/lib/database.types";

type ArticleBatch = Database["public"]["Tables"]["article_batches"]["Row"];

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardBadge } from "@/components/ui/StandardBadge";
const NoteEditor = lazy(() =>
	import(
		"@/app/articulos/preclasificacion/[batchId]/components/NoteEditor"
	).then((mod) => ({ default: mod.NoteEditor })),
);
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import {
	StandardTabsList,
	StandardTabsTrigger,	
} from "@/components/ui/StandardTabs";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { TableLikeView } from "./components/TableLikeView";
import { useJobManager } from "@/app/contexts/JobManagerContext";
import { useDialog } from "@/app/contexts/DialogContext";
import { supabase } from "@/app/auth/client";
import { toast } from "sonner";

interface NotesButtonCellProps {
	article: ArticleForReview;
	hasNotes: boolean;
	onOpenNotes: (article: ArticleForReview) => void;
}

const NotesButtonCell: React.FC<NotesButtonCellProps> = memo(
	({ article, hasNotes, onOpenNotes }) => {
		const style = hasNotes ? "solid" : "outline";
		return (
			<StandardButton
				styleType={style}
				iconOnly={true}
				onClick={() => onOpenNotes(article)}
				tooltip={hasNotes ? "Ver/editar notas" : "Crear nota"}>
				<StickyNote size={16} />
			</StandardButton>
		);
	},
);

NotesButtonCell.displayName = "NotesButtonCell";

const BatchDetailPage = () => {
	const params = useParams();
	// router no es necesario: las actualizaciones realtime parchean estado local
	const auth = useAuth();
	const { startJob } = useJobManager();
	const { showDialog } = useDialog();
	const batchId = params.batchId as string;

	const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
	const [articlesLoading, setArticlesLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showOriginalAsPrimary, setShowOriginalAsPrimary] = useState(false);

	const [noteDialogOpen, setNoteDialogOpen] = useState(false);
	const [currentArticle, setCurrentArticle] = useState<ArticleForReview | null>(
		null,
	);

	const [isStartingPreclassification, setIsStartingPreclassification] =
		useState(false);
	const [viewMode] = useState<"grid" | "rows" | "table">("table");
	const [compactView, setCompactView] = useState<boolean>(false);
	const [approveAllRequestId, setApproveAllRequestId] = useState<number>(0);
	const [resetAllRequestId, setResetAllRequestId] = useState<number>(0);
	const [allMarked, setAllMarked] = useState<boolean>(false);
	const [isBulkPersisting, setIsBulkPersisting] = useState<boolean>(false);

	const [notesPresenceByItemId, setNotesPresenceByItemId] = useState<
		Record<string, boolean>
	>({});

	const [groupsPresenceByItemId, setGroupsPresenceByItemId] = useState<
		Record<string, boolean>
	>({});
	const [isLoadingGroupsPresence, setIsLoadingGroupsPresence] = useState(false);

	// Contador para forzar recálculo de validación cuando hay cambios optimistas
	const [optimisticChangesCounter, setOptimisticChangesCounter] = useState(0);

	useEffect(() => {
		if (!batchDetails?.rows) return;
		const map: Record<string, boolean> = {};
		for (const row of batchDetails.rows) {
			const info = row.notes_info;
			const hasAny =
				Boolean(info?.has_notes) ||
				(Array.isArray(info?.note_ids) && info!.note_ids!.length > 0) ||
				(typeof info?.note_count === "number" &&
					(info!.note_count as number) > 0);
			map[row.item_id] = hasAny;
		}
		setNotesPresenceByItemId(map);
	}, [batchDetails?.rows]);

	// Callback para notificar cambios optimistas desde TableLikeView
	const handleOptimisticChange = useCallback(() => {
		setOptimisticChangesCounter((prev) => prev + 1);
	}, []);

	const loadGroupsPresence = useCallback(
		async (articles: ArticleForReview[]) => {
			try {
				setIsLoadingGroupsPresence(true);

				const articleIds = articles
					.map((a) => a.article_id)
					.filter((id) => id && id.trim() !== "");
				if (articleIds.length === 0) {
					setIsLoadingGroupsPresence(false);
					return;
				}

				const { getBulkGroupsPresence } = await import(
					"@/lib/actions/article-group-actions"
				);
				const result = await getBulkGroupsPresence({ articleIds });

				if (!result.success) {
					setIsLoadingGroupsPresence(false);
					return;
				}

				const groupsMap: Record<string, boolean> = {};
				articles.forEach((article) => {
					groupsMap[article.item_id] = result.data[article.article_id] || false;
				});

				setGroupsPresenceByItemId(groupsMap);
			} catch (error) {
				console.error("[groups] Error cargando presencia de grupos:", error);
			} finally {
				setIsLoadingGroupsPresence(false);
			}
		},
		[],
	);

	const loadBatchDetails = useCallback(async () => {
		if (!batchId) return;
		setArticlesLoading(true);
		setError(null);
		try {
			const resp = await fetch("/api/preclassification/batch-details", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ batchId }),
			});
			if (!resp.ok) {
				const { error: apiError } = (await resp
					.json()
					.catch(() => ({ error: "Error desconocido" }))) as { error?: string };
				throw new Error(apiError || `HTTP ${resp.status}`);
			}
			const { data } = (await resp.json()) as { data: BatchDetails };
			setBatchDetails(data);
			loadGroupsPresence(data.rows);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
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

	// Ref para debounce del canal realtime
	const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	// REALTIME: Escuchar cambios en article_batches con debounce (1s)
	useEffect(() => {
		if (!batchId) return;

		const channel = supabase
			.channel(`batch-${batchId}`)
			.on<ArticleBatch>(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "article_batches",
					filter: `id=eq.${batchId}`,
				},
				(_payload: RealtimePostgresChangesPayload<ArticleBatch>) => {
					// Debounce: esperar 1s sin nuevos eventos antes de refetch
					if (realtimeDebounceRef.current) {
						clearTimeout(realtimeDebounceRef.current);
					}
					realtimeDebounceRef.current = setTimeout(() => {
						void loadBatchDetails();
					}, 1000);
				},
			)
			// 🆕 Escuchar cambios en article_dimension_reviews (para actualización post-reprocesamiento)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "article_dimension_reviews",
					filter: `article_batch_item_id=in.(${batchDetails?.rows.map((r) => r.item_id).join(",")})`,
				},
				(_payload: RealtimePostgresChangesPayload<any>) => {
					console.log(
						"[REALTIME] Nueva clasificación detectada, actualizando...",
					);
					// Debounce corto para actualizaciones rápidas
					if (realtimeDebounceRef.current) {
						clearTimeout(realtimeDebounceRef.current);
					}
					realtimeDebounceRef.current = setTimeout(() => {
						void loadBatchDetails();
					}, 500);
				},
			)
			.subscribe();

		return () => {
			if (realtimeDebounceRef.current) {
				clearTimeout(realtimeDebounceRef.current);
			}
			void supabase.removeChannel(channel);
		};
	}, [batchId, loadBatchDetails, batchDetails?.rows]);

	// Funciones de manejo de acciones

	// Función para abrir el editor de notas
	const handleOpenNotes = useCallback((article: ArticleForReview) => {
		setCurrentArticle(article);
		setNoteDialogOpen(true);
	}, []);

	// Función para cerrar el editor de notas
	const handleCloseNotes = useCallback(() => {
		setNoteDialogOpen(false);
		// Refrescar presencia para el artículo que estaba abierto
		if (currentArticle) {
			void refreshNotesPresence();
		}
		setCurrentArticle(null);
	}, [currentArticle, refreshNotesPresence]);

	// Callback estable para cambios en grupos (evita recrear en cada render)
	const handleGroupsChanged = useCallback(
		(itemId: string, hasGroups: boolean) => {
			setGroupsPresenceByItemId((prev) => ({
				...prev,
				[itemId]: hasGroups,
			}));
		},
		[],
	);

	// Callback de NoteEditor para actualización optimista de presencia de notas
	const handleNotesChanged = useCallback(
		(hasNotesNow: boolean) => {
			if (!currentArticle?.item_id) return;
			const itemId = currentArticle.item_id;
			setNotesPresenceByItemId((prev) => ({
				...prev,
				[itemId]: hasNotesNow,
			}));
		},
		[currentArticle],
	);

	// 🆕 Función para reprocesar un artículo individual sin clasificaciones
	const handleReprocessArticle = useCallback(
		async (articleItemId: string, articleTitle: string) => {
			if (!auth.user?.id || !auth.proyectoActual?.id) {
				toast.error("Debes estar autenticado para reprocesar artículos.");
				return;
			}

			// Confirmar con el usuario
			const confirmed = await showDialog({
				title: "⚠️ Reprocesar Artículo",
				message: `¿Deseas reprocesar el artículo "${articleTitle}"?\n\nEsto generará clasificaciones de IA para las dimensiones faltantes.`,
				confirmText: "Sí, reprocesar",
				cancelText: "Cancelar",
				colorScheme: "warning",
			});

			if (!confirmed) return;

			// Importar la función dinámicamente
			const { startSingleArticlePreclassification } = await import(
				"@/lib/actions/preclassification-actions"
			);

			const result = await startSingleArticlePreclassification(articleItemId);

			if (!result.success) {
				toast.error(result.error || "Error al iniciar reprocesamiento");
				return;
			}

			// Iniciar job en el JobManager
			startJob({
				type: "PRECLASSIFY_BATCH",
				title: `Reprocesando artículo`,
				payload: {
					batchId: batchId,
					userId: auth.user!.id,
					projectId: auth.proyectoActual!.id,
					articleItemId: articleItemId,
				},
			});

			toast.success(
				"Reprocesamiento iniciado. Monitorea el progreso en el JobManager.",
			);
		},
		[auth.user?.id, auth.proyectoActual?.id, batchId, showDialog, startJob],
	);

	// Función para iniciar la preclasificación
	const handleStartPreclassification = async () => {
		if (!batchId || !auth.user?.id || !auth.proyectoActual?.id) {
			return;
		}

		setIsStartingPreclassification(true);
		try {
			// 🎨 ARQUITECTURA LIMPIA: Page solo dispara el trabajo, PreclassificationJobHandler maneja TODO lo demás
			startJob({
				type: "PRECLASSIFY_BATCH",
				title: `Preclasificación Lote #${batchDetails?.batch_number || batchId}`,
				payload: {
					batchId: batchId,
					userId: auth.user.id,
					projectId: auth.proyectoActual.id,
				},
			});
		} catch (error) {
			console.error("🚨 [Page] Error disparando trabajo:", error);
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

	const handleGlobalBulkPersistResult = useCallback(
		(ok: boolean, prevalidated: boolean) => {
			setIsBulkPersisting(false);
			if (ok) {
				setAllMarked(prevalidated);
			}
		},
		[],
	);

	// Mapas derivados desde columns: nombre, icono, y emoticonos por opción
	const dimensionLabelById = useMemo<Record<string, string>>(() => {
		const map: Record<string, string> = {};
		(batchDetails?.columns || []).forEach((col) => {
			if (col?.id && col?.name) map[col.id] = col.name;
		});
		return map;
	}, [batchDetails?.columns]);

	const dimensionIconById = useMemo<Record<string, string | null>>(() => {
		const map: Record<string, string | null> = {};
		(batchDetails?.columns || []).forEach((col) => {
			if (col?.id) map[col.id] = col.icon ?? null;
		});
		return map;
	}, [batchDetails?.columns]);

	const optionEmoticonsByDimId = useMemo<
		Record<string, Record<string, string | null>>
	>(() => {
		const map: Record<string, Record<string, string | null>> = {};
		(batchDetails?.columns || []).forEach((col) => {
			if (col?.id) map[col.id] = col.optionEmoticons || {};
		});
		return map;
	}, [batchDetails?.columns]);

	// Nuevos mapas para el flujo de desacuerdo humano
	const dimensionTypeById = useMemo<Record<string, string>>(() => {
		const map: Record<string, string> = {};
		(batchDetails?.columns || []).forEach((col) => {
			if (col?.id && col?.type) map[col.id] = col.type;
		});
		return map;
	}, [batchDetails?.columns]);

	const optionsByDimId = useMemo<
		Record<string, (string | { value: string | number; label: string })[]>
	>(() => {
		const map: Record<
			string,
			(string | { value: string | number; label: string })[]
		> = {};
		(batchDetails?.columns || []).forEach((col) => {
			if (col?.id) map[col.id] = col.options || [];
		});
		return map;
	}, [batchDetails?.columns]);

	// Orden de columnas de dimensiones para la vista tipo tabla
	const dimensionOrder = useMemo<string[]>(() => {
		return (batchDetails?.columns || [])
			.map((col) => col.id)
			.filter((id): id is string => Boolean(id));
	}, [batchDetails?.columns]);

	// 🔄 IDENTIFICAR DISCREPANCIAS: Dimensiones con status review_pending o reconciliation_pending que necesitan reconciliación
	const discrepancies = useMemo<
		Array<{ article_batch_item_id: string; dimension_id: string }>
	>(() => {
		const result: Array<{
			article_batch_item_id: string;
			dimension_id: string;
		}> = [];

		if (!batchDetails?.rows) return result;

		batchDetails.rows.forEach((row) => {
			Object.entries(row.classifications).forEach(([dimId, reviews]) => {
				if (reviews.length === 0) return;

				// Obtener la última review
				const latestReview = [...reviews].sort(
					(a, b) => (b.iteration ?? 0) - (a.iteration ?? 0),
				)[0];
				const maxIteration = Math.max(...reviews.map((r) => r.iteration ?? 0));
				const status = latestReview.status;

				// Discrepancia: hay iter 1 (IA) + iter 2 (humano) sin iter 3
				// O bien: status es review_pending o reconciliation_pending en iter 2
				const hasAI = reviews.some(
					(r) => r.iteration === 1 && r.reviewer_type === "ai",
				);
				const hasHuman = reviews.some(
					(r) => r.iteration === 2 && r.reviewer_type === "human",
				);

				// Condición 1: Hay IA e iter 2 humano, sin iter 3
				const needsReconciliation = hasAI && hasHuman && maxIteration === 2;

				// Condición 2: Status indica que necesita reconciliación
				const statusNeedsReconciliation =
					maxIteration === 2 &&
					(status === "review_pending" || status === "reconciliation_pending");

				if (needsReconciliation || statusNeedsReconciliation) {
					result.push({
						article_batch_item_id: row.item_id,
						dimension_id: dimId,
					});
				}
			});
		});

		return result;
	}, [batchDetails?.rows]);

	// 🎯 VALIDACIONES PARA FINALIZAR LOTE (usando campo 'status' actualizado)
	// Un lote puede cerrarse SOLO si todas las dimensiones están:
	// - Iter 1: status = 'validated' (verde)
	// - Iter 3: status = 'reconciled' (azul) o 'disputed' (rojo)
	// NO puede haber Iter 2 (estado incompleto esperando reconciliación)
	// NO puede haber dimensiones sin revisar
	const batchFinalizationValidation = useMemo(() => {
		if (!batchDetails?.rows)
			return { canFinalize: false, issues: [], stats: {} };

		const issues: string[] = [];
		let iter1Validated = 0;
		let iter1Pending = 0;
		let iter2Incomplete = 0;
		let iter3Reconciled = 0;
		let iter3Disputed = 0;
		let iter3Pending = 0;
		let totalDimensions = 0;

		batchDetails.rows.forEach((row) => {
			Object.entries(row.classifications).forEach(([_dimId, reviews]) => {
				totalDimensions++;

				// Obtener la review de mayor iteración
				const latestReview =
					reviews.length > 0 ?
						[...reviews].sort(
							(a, b) => (b.iteration ?? 0) - (a.iteration ?? 0),
						)[0]
					:	null;

				if (!latestReview) return;

				const iter = latestReview.iteration ?? 1;
				const status = latestReview.status;

				// Analizar según iteración
				if (iter === 1) {
					if (status === "validated") {
						iter1Validated++;
					} else {
						iter1Pending++;
					}
				} else if (iter === 2) {
					// Iteración 2 es un estado intermedio - no puede cerrarse
					iter2Incomplete++;
				} else if (iter >= 3) {
					if (status === "reconciled") {
						iter3Reconciled++;
					} else if (status === "disputed") {
						iter3Disputed++;
					} else {
						iter3Pending++;
					}
				}
			});
		});

		// Validar condiciones
		if (iter1Pending > 0) {
			issues.push(
				`${iter1Pending} dimensión(es) en iteración 1 sin aprobar (deben estar en 'validated')`,
			);
		}
		if (iter2Incomplete > 0) {
			issues.push(
				`${iter2Incomplete} dimensión(es) en iteración 2 (estado incompleto, falta reconciliación)`,
			);
		}
		if (iter3Pending > 0) {
			issues.push(
				`${iter3Pending} dimensión(es) en iteración 3 sin decisión (deben estar en 'reconciled' o 'disputed')`,
			);
		}

		return {
			canFinalize: issues.length === 0,
			issues,
			stats: {
				totalDimensions,
				iter1Validated,
				iter1Pending,
				iter2Incomplete,
				iter3Reconciled,
				iter3Disputed,
				iter3Pending,
			},
		};
	}, [batchDetails?.rows, batchDetails?.dimensions]);

	// 🔒 Detectar si el lote está CERRADO (todas las reviews con is_final = true)
	const isBatchClosed = useMemo(() => {
		if (!batchDetails?.rows) return false;

		let totalReviews = 0;
		let finalizedReviews = 0;

		batchDetails.rows.forEach((row) => {
			Object.values(row.classifications).forEach((reviews) => {
				reviews.forEach((review) => {
					totalReviews++;
					if (review.is_final === true) {
						finalizedReviews++;
					}
				});
			});
		});

		const isClosed = totalReviews > 0 && totalReviews === finalizedReviews;

		return isClosed;
	}, [batchDetails?.rows]);

	// 🆕 Detectar artículos SIN clasificaciones de IA (caso de borde)
	const articlesWithoutAI = useMemo(() => {
		console.log("[DEBUG] Calculando articlesWithoutAI...");
		console.log("[DEBUG] batchDetails:", {
			hasBatchDetails: !!batchDetails,
			hasRows: !!batchDetails?.rows,
			rowsCount: batchDetails?.rows?.length,
			hasDimensions: !!batchDetails?.dimensions,
			dimensionsCount: batchDetails?.dimensions?.length,
		});

		const result: Array<{
			article_item_id: string;
			article_title: string;
			missing_dimensions: number;
		}> = [];

		if (!batchDetails?.rows || !batchDetails?.dimensions) {
			console.log("[DEBUG] Retornando array vacío - no hay rows o dimensions");
			return result;
		}

		const totalDimensions = batchDetails.dimensions.length;
		console.log(
			`[DEBUG] Procesando ${batchDetails.rows.length} artículos con ${totalDimensions} dimensiones`,
		);

		batchDetails.rows.forEach((row, index) => {
			let dimensionsWithAI = 0;
			Object.entries(row.classifications).forEach(([_dimId, reviews]) => {
				if (reviews.some((r) => r.reviewer_type === "ai")) dimensionsWithAI++;
			});

			const needsAI = dimensionsWithAI < totalDimensions;
			if (needsAI) {
				console.log(
					`[DEBUG] Artículo ${index} necesita AI: ${row.article_data?.translated_title?.substring(0, 30)}`,
				);
				result.push({
					article_item_id: row.item_id,
					article_title:
						row.article_data?.translated_title ||
						row.article_data?.original_title ||
						"Sin título",
					missing_dimensions: totalDimensions - dimensionsWithAI,
				});
			}
		});

		console.log(`[DEBUG] Resultado: ${result.length} artículos necesitan AI`);
		return result;
	}, [batchDetails?.rows, batchDetails?.dimensions]);

	// Transformar datos para las tarjetas: ordenar por correlativo desc y enumerar desde 1
	const cardData = useMemo(() => {
		const rows = batchDetails?.rows || [];
		const sorted = [...rows].sort((a, b) => {
			const ac = a.article_data?.correlativo ?? -Infinity;
			const bc = b.article_data?.correlativo ?? -Infinity;
			return bc - ac;
		});
		return sorted.map((article: ArticleForReview, idx: number) => {
			const primaryTitle =
				showOriginalAsPrimary ?
					article.article_data.original_title
				:	article.article_data.translated_title;
			const primaryAbstract =
				showOriginalAsPrimary ?
					article.article_data.original_abstract
				:	article.article_data.translated_abstract;

			const secondaryTitle =
				showOriginalAsPrimary ?
					article.article_data.translated_title
				:	article.article_data.original_title;
			const secondaryAbstract =
				showOriginalAsPrimary ?
					article.article_data.translated_abstract
				:	article.article_data.original_abstract;

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
				classifications: article.classifications,
				displayIndex: idx + 1,
			};
		});
	}, [batchDetails, showOriginalAsPrimary]);

	// Renderizado principal con guards
	if (articlesLoading) {
		return (
			<StandardPageBackground>
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
					<StandardText>
						No se encontraron detalles para este lote.
					</StandardText>
				</div>
			</StandardPageBackground>
		);
	}

	return (
		<StandardPageBackground>
			<div className="p-4">
				<StandardPageTitle
					title={`Lote de Preclasificación #${batchDetails.batch_number}${isBatchClosed ? " 🔒 (CERRADO)" : ""}`}
					subtitle={`Total de artículos: ${batchDetails.rows.length}${isBatchClosed ? " • Lote finalizado - No se permiten cambios" : ""}`}
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: `Lote #${batchDetails.batch_number}` },
					]}
				/>
				<div className="flex items-center gap-4 my-4">
					{/* Botón visible solo si el lote está en estado 'translated' (traducción completa, aún sin preclasificar) */}
					{batchDetails.status === "translated" && (
						<StandardButton
							leftIcon={Brain}
							onClick={handleStartPreclassification}
							disabled={isStartingPreclassification}>
							{isStartingPreclassification ?
								"Iniciando..."
							:	"Iniciar Preclasificación con IA"}
						</StandardButton>
					)}
					{/* Botón de reconciliación: visible cuando hay discrepancias pendientes (independiente del status del lote) */}
					{discrepancies.length > 0 && (
						<StandardButton
							leftIcon={Brain}
							styleType="outline"
							colorScheme="accent"
							onClick={() => {
								if (!auth.user?.id || !auth.proyectoActual?.id) {
									return;
								}
								startJob({
									type: "RECONCILE_BATCH",
									title: `Reconciliación Lote #${batchDetails.batch_number}`,
									payload: {
										batchId: batchId,
										userId: auth.user.id,
										projectId: auth.proyectoActual.id,
										discrepancies: discrepancies,
									},
								});
							}}>
							Revisar Discrepancias con IA ({discrepancies.length})
						</StandardButton>
					)}

					{/* 🆕 ALERTA: Artículos sin clasificaciones de IA */}
					{articlesWithoutAI.length > 0 && (
						<StandardTooltip
							content={
								<div className="space-y-1">
									<StandardText size="sm" weight="bold">
										⚠️ Artículos sin clasificaciones de IA:
									</StandardText>
									{articlesWithoutAI.slice(0, 3).map((art) => (
										<StandardText key={art.article_item_id} size="xs">
											• {art.article_title.substring(0, 50)}...
											<br />
											(Faltan {art.missing_dimensions} dimensiones)
										</StandardText>
									))}
									{articlesWithoutAI.length > 3 && (
										<StandardText size="xs">
											...y {articlesWithoutAI.length - 3} más
										</StandardText>
									)}
									<StandardText size="xs" className="mt-2">
										Haz clic en el botón de reprocesar en cada artículo
									</StandardText>
								</div>
							}
							side="bottom"
							trigger={
								<StandardBadge
									colorScheme="warning"
									size="lg"
									className="cursor-help">
									⚠️ {articlesWithoutAI.length} artículo
									{articlesWithoutAI.length !== 1 ? "s" : ""} sin clasificar
								</StandardBadge>
							}
						/>
					)}

					{/* Botón de Finalizar Lote - Ocultar si ya está cerrado */}
					{batchDetails.status !== "translated" && !isBatchClosed && (
						<StandardTooltip
							content={
								batchFinalizationValidation.canFinalize ?
									"Hacer oficiales todos los cambios y cerrar el análisis del lote"
								:	`No se puede finalizar:\n${batchFinalizationValidation.issues.join("\n")}`
							}
							side="bottom"
							trigger={
								<StandardButton
									leftIcon={
										batchFinalizationValidation.canFinalize ? CheckCircle : (
											AlertTriangle
										)
									}
									colorScheme={
										batchFinalizationValidation.canFinalize ? "success" : (
											"warning"
										)
									}
									styleType="solid"
									disabled={!batchFinalizationValidation.canFinalize}
									onClick={() => {
										showDialog({
											title: "⚠️ Finalizar Lote",
											content: `¿Confirmas que deseas finalizar el lote #${batchDetails?.batch_number}?\n\n⚠️ Esta acción marcará todas las clasificaciones como finales y NO PODRÁS modificarlas posteriormente.\n\n🔒 Esta acción es irreversible.`,
											confirmText: "Sí, Finalizar Lote",
											cancelText: "Cancelar",
											colorScheme: "danger",
											onConfirm: async () => {
												try {
													const response = await fetch(
														"/api/preclassification/batches/finalize",
														{
															method: "POST",
															headers: { "Content-Type": "application/json" },
															body: JSON.stringify({ batchId }),
														},
													);

													const result = await response.json();

													if (!response.ok || !result.success) {
														const errorMsg =
															result.error || "Error al finalizar lote";
														throw new Error(errorMsg);
													}

													toast.success("Lote finalizado exitosamente", {
														description: `${result.data.updatedCount} clasificaciones marcadas como finales`,
													});

													await loadBatchDetails();
												} catch (error) {
													const msg =
														error instanceof Error ?
															error.message
														:	"Error desconocido";
													toast.error("Error al finalizar lote", {
														description: msg,
													});
												}
											},
										});
									}}>
									Finalizar Lote
								</StandardButton>
							}
						/>
					)}

					<StandardButton
						leftIcon={Globe}
						onClick={() => setShowOriginalAsPrimary(!showOriginalAsPrimary)}
						styleType="outline">
						{showOriginalAsPrimary ? "Ver Traducción" : "Ver Original"}
					</StandardButton>
					{/* Toggle de Vista Compacta */}
					<div className="flex items-center gap-2">
						<StandardText size="sm">Vista compacta</StandardText>
						<StandardSwitch
							checked={compactView}
							onCheckedChange={setCompactView}
							colorScheme="accent">
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
						colorScheme={allMarked ? "warning" : "success"}
						styleType="solid"
						onClick={handleApproveAllBatch}
						disabled={isBulkPersisting}>
						{allMarked ?
							"Desmarcar todo el lote"
						: isBulkPersisting ?
							"Procesando..."
						:	"Marcar OK todo el lote"}
					</StandardButton>
				</div>

				<div className="mt-6 h-[calc(100vh-250px)] overflow-y-auto">
					{viewMode === "table" ?
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
								notesPresenceByItemId={notesPresenceByItemId}
								groupsPresenceByItemId={groupsPresenceByItemId}
								isLoadingGroupsPresence={isLoadingGroupsPresence}
								onOpenNotes={handleOpenNotes}
								onGroupsChanged={handleGroupsChanged}
								compact={compactView}
								approveAllRequestId={approveAllRequestId}
								resetAllRequestId={resetAllRequestId}
								onGlobalBulkPersistResult={handleGlobalBulkPersistResult}
								onOptimisticChange={handleOptimisticChange}
								articlesWithoutAI={articlesWithoutAI}
								onReprocessArticle={handleReprocessArticle}
							/>
						</div>
					:	<div className="p-4 text-sm text-gray-500 dark:text-gray-400">
							Otras vistas (tarjetas/filas) están en desarrollo en esta rama.
						</div>
					}
				</div>
			</div>
			{/* Editor de Notas (Modal) - Lazy loaded */}
			{noteDialogOpen && currentArticle && (
				<Suspense fallback={null}>
					<NoteEditor
						open={noteDialogOpen}
						onClose={handleCloseNotes}
						article={currentArticle}
						onNotesChanged={handleNotesChanged}
						project={auth.proyectoActual}
						showOriginalAsPrimary={showOriginalAsPrimary}
					/>
				</Suspense>
			)}
		</StandardPageBackground>
	);
};

export default BatchDetailPage;
