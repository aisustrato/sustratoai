"use client";

import React, {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
	memo,
	useLayoutEffect,
	type ComponentType,
} from "react";
import { List, useDynamicRowHeight } from "react-window";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import {
	StandardSelect,
	type SelectOption,
} from "@/components/ui/StandardSelect";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { Eye } from "lucide-react";
import type {
	ArticleForReview,
	ClassificationReview,
} from "@/lib/types/preclassification-types";
import { toast } from "sonner";
import { VirtualizedArticleRow } from "./VirtualizedArticleRow";

// 🎨 SISTEMA DE COLORES POR ESTADO DE DIMENSIÓN
// Estados: neutral (iter 1) → success (aprobado) | warning (iter 2 desacuerdo) → accent (iter 3 llegó) → primary (iter 3 aprobado) | danger (iter 3 rechazado)
type DimensionColorScheme =
	| "neutral"
	| "success"
	| "warning"
	| "accent"
	| "primary"
	| "danger";

/**
 * Determina el color de una dimensión según su status (ahora en BD)
 *
 * LÓGICA BASADA EN STATUS DE DIMENSIÓN:
 * - pending / review_pending: NEUTRAL (sin revisar)
 * - validated: SUCCESS (aprobado iter 1)
 * - reconciliation_pending + iter 2: WARNING (desacuerdo)
 * - reconciliation_pending + iter 3: ACCENT (esperando decisión)
 * - reconciled: PRIMARY (iter 3 aprobado)
 * - disputed: DANGER (iter 3 rechazado/arbitraje)
 */
function mapStatusToColor(
	status: string | undefined,
	maxIteration: number,
): DimensionColorScheme {
	switch (status) {
		case "disputed":
			return "danger";
		case "reconciled":
			return "primary";
		case "validated":
			return "success";
		case "reconciliation_pending":
			if (maxIteration === 2) return "warning";
			if (maxIteration >= 3) return "accent";
			return "warning";
		case "review_pending":
		case "pending":
		default:
			return "neutral";
	}
}

/**
 * Jerarquía de criticidad para determinar el color de un artículo completo
 * El artículo toma el color del estado más crítico de sus dimensiones
 */
const COLOR_CRITICALITY_RANK: Record<DimensionColorScheme, number> = {
	danger: 6, // Más crítico
	warning: 5,
	accent: 4,
	primary: 3,
	neutral: 2,
	success: 1, // Menos crítico
};

/**
 * Determina el color de un artículo basado en el estado más crítico de sus dimensiones
 */
function getArticleColorScheme(
	dimensionColors: DimensionColorScheme[],
): DimensionColorScheme {
	if (dimensionColors.length === 0) return "neutral";

	// Ordenar por criticidad y retornar el más crítico
	const sortedByMostCritical = [...dimensionColors].sort(
		(a, b) => COLOR_CRITICALITY_RANK[b] - COLOR_CRITICALITY_RANK[a],
	);

	return sortedByMostCritical[0];
}

interface TableLikeViewArticle {
	id: string;
	title: string;
	abstract: string;
	ai_summary: string;
	year: string;
	journal: string;
	displayIndex?: number;
	originalArticle: ArticleForReview;
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
	optionsByDimId: Record<
		string,
		(string | { value: string | number; label: string })[]
	>;
	showOriginalAsPrimary: boolean;
	batchId: string;
	batchNumber?: number | null;
	notesPresenceByItemId: Record<string, boolean>;
	groupsPresenceByItemId: Record<string, boolean>;
	isLoadingGroupsPresence: boolean;
	compact?: boolean;
	onOpenNotes: (article: ArticleForReview) => void;
	onGroupsChanged: (itemId: string, hasGroups: boolean) => void;
	approveAllRequestId?: number;
	resetAllRequestId?: number;
	onGlobalBulkPersistResult?: (ok: boolean, prevalidated: boolean) => void;
	onOptimisticChange?: () => void;
	// 🆕 Props para reprocesamiento de artículos sin clasificaciones
	articlesWithoutAI?: Array<{
		article_item_id: string;
		article_title: string;
		missing_dimensions: number;
	}>;
	onReprocessArticle?: (articleItemId: string, articleTitle: string) => void;
}

// 🎯 Wrapper para react-window v2 rowComponent
// Recibe index + style de react-window y rowProps con los datos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArticleRowWrapper({ index, style, cardData, ...rest }: any) {
	const article = cardData?.[index];
	if (!article) return null;
	return (
		<VirtualizedArticleRow
			index={index}
			style={style}
			article={article}
			{...rest}
		/>
	);
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
	notesPresenceByItemId,
	groupsPresenceByItemId,
	isLoadingGroupsPresence,
	compact,
	onOpenNotes,
	onGroupsChanged,
	approveAllRequestId,
	resetAllRequestId,
	onGlobalBulkPersistResult,
	onOptimisticChange,
	articlesWithoutAI,
	onReprocessArticle,
}) => {
	// Estado del Modal de Desacuerdo
	const [disagreementOpen, setDisagreementOpen] = useState(false);
	const [selectedArticle, setSelectedArticle] =
		useState<TableLikeViewArticle | null>(null);
	const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
	const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
	const [historyReviews, setHistoryReviews] = useState<ClassificationReview[]>(
		[],
	);
	const [historyDimensionName, setHistoryDimensionName] = useState<string>("");
	// Delay para que el usuario vea el cierre del popup antes del efecto de rechazo
	const REJECTION_EFFECT_DELAY_MS = 450;

	// 🎯 PROPS ESTABILIZADAS PARA MODAL DE DESACUERDO (evitar re-renders)
	const modalDimensionName = useMemo(
		() =>
			selectedDimId ? (dimensionLabelById[selectedDimId] ?? selectedDimId) : "",
		[selectedDimId, dimensionLabelById],
	);

	const modalDimensionType = useMemo(
		() =>
			selectedDimId ? (dimensionTypeById[selectedDimId] ?? "finite") : "finite",
		[selectedDimId, dimensionTypeById],
	);

	const modalDimensionOptions = useMemo(
		() => (selectedDimId ? (optionsByDimId[selectedDimId] ?? []) : []),
		[selectedDimId, optionsByDimId],
	);

	const modalOptionEmoticonsMap = useMemo(
		() => (selectedDimId ? (optionEmoticonsByDimId[selectedDimId] ?? {}) : {}),
		[selectedDimId, optionEmoticonsByDimId],
	);

	const handleModalClose = useCallback(() => {
		setDisagreementOpen(false);
	}, []);

	// 🚀 Virtualización con react-window v2
	const ESTIMATED_ITEM_HEIGHT = 420;
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerHeight, setContainerHeight] = useState(800);
	const { getRowHeight, setRowHeight } = useDynamicRowHeight({
		defaultRowHeight: ESTIMATED_ITEM_HEIGHT,
		key: "preclasificacion-list",
	});

	// Estado local: aprobación/rechazo por dimensión a nivel UI (no persistente)
	// articleId -> dimId -> 'none' | 'approved' | 'rejected'
	const [dimensionStatusByArticle, setDimensionStatusByArticle] = useState<
		Record<string, Record<string, "none" | "approved" | "rejected">>
	>({});
	// Ref para snapshot actual del estado (para rollback seguro)
	const statusRef = useRef(dimensionStatusByArticle);
	const lastApproveIdRef = useRef<number>(0);
	const lastResetIdRef = useRef<number>(0);
	useEffect(() => {
		statusRef.current = dimensionStatusByArticle;
	}, [dimensionStatusByArticle]);

	const setDimensionStatus = useCallback(
		(
			articleId: string,
			dimId: string,
			status: "none" | "approved" | "rejected",
		) => {
			setDimensionStatusByArticle((prev) => ({
				...prev,
				[articleId]: {
					...(prev[articleId] || {}),
					[dimId]: status,
				},
			}));
			// Notificar cambio optimista a page.tsx para recalcular validación
			onOptimisticChange?.();
		},
		[onOptimisticChange],
	);

	// Inicializar el estado UI desde el status de las revisiones (arquitectura nueva)
	useEffect(() => {
		if (!cardData || cardData.length === 0) return;
		const initialState: Record<
			string,
			Record<string, "none" | "approved" | "rejected">
		> = {};
		for (const article of cardData) {
			const perArticle: Record<string, "none" | "approved" | "rejected"> = {};
			for (const dimId of dimensionOrder) {
				const reviews: ClassificationReview[] =
					article.classifications?.[dimId] ?? [];

				if (reviews.length === 0) {
					perArticle[dimId] = "none";
					continue;
				}

				// Obtener la ÚLTIMA review (mayor iteración), sea AI o humana
				const latestReview = [...reviews].sort(
					(a, b) => (b.iteration ?? 0) - (a.iteration ?? 0),
				)[0];

				// 🎯 LEER STATUS de la última review (sin importar si es AI o humana)
				// validated | reconciled → aprobado
				// disputed → rechazado
				// review_pending | reconciliation_pending | pending → neutral
				const status = latestReview.status;

				if (status === "validated" || status === "reconciled") {
					perArticle[dimId] = "approved";
				} else if (status === "disputed") {
					perArticle[dimId] = "rejected";
				} else {
					perArticle[dimId] = "none";
				}
			}
			initialState[article.id] = perArticle;
		}
		setDimensionStatusByArticle(initialState);
	}, [cardData, dimensionOrder]);

	// Persistir status directamente (sin usar prevalidated obsoleto)
	const persistDimensionStatus = useCallback(
		async (
			articleBatchItemId: string,
			dimensionId: string,
			status:
				| "validated"
				| "reconciled"
				| "disputed"
				| "review_pending"
				| "reconciliation_pending",
		): Promise<{ ok: boolean; error?: string }> => {
			try {
				const resp = await fetch(
					"/api/preclassification/reviews/update-status",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ articleBatchItemId, dimensionId, status }),
					},
				);
				if (!resp.ok) {
					const data = (await resp.json().catch(() => ({}))) as {
						error?: string;
					};
					return { ok: false, error: data.error || `HTTP ${resp.status}` };
				}
				return { ok: true };
			} catch (err) {
				return {
					ok: false,
					error: err instanceof Error ? err.message : "Error desconocido",
				};
			}
		},
		[],
	);

	// Wrapper: set + persist, con revert en caso de error
	// 🎯 FIX PERFORMANCE: Usar statusRef (ya existente) para dimensionStatusByArticle en callbacks
	// Evita que setAndPersistDimensionStatus cambie referencia en cada cambio de estado,
	// lo cual propagaba re-renders a handleModalSubmitted → HumanDisagreementModal

	const setAndPersistDimensionStatus = useCallback(
		async (
			articleId: string,
			dimId: string,
			status: "none" | "approved" | "rejected",
			maxIteration: number = 1, // Iteración máxima actual
		) => {
			const prev = statusRef.current[articleId]?.[dimId] || "none";

			// Mapear status UI a status BD según iteración
			let dbStatus: "validated" | "reconciled" | "disputed" | "review_pending";

			if (status === "approved") {
				// Aprobar: iter 1 = validated, iter 3+ = reconciled
				dbStatus = maxIteration >= 3 ? "reconciled" : "validated";
			} else if (status === "rejected") {
				// Rechazar: iter 3+ = disputed, iter 1-2 = review_pending
				dbStatus = maxIteration >= 3 ? "disputed" : "review_pending";
			} else {
				// none = volver a review_pending
				dbStatus = "review_pending";
			}

			// Update optimista
			setDimensionStatus(articleId, dimId, status);
			const result = await persistDimensionStatus(articleId, dimId, dbStatus);

			if (!result.ok) {
				setDimensionStatus(articleId, dimId, prev);
				toast.error(`Error al guardar: ${result.error || "Error desconocido"}`);
			} else {
				// Mensajes específicos según iteración y acción
				let message = "Dimensión actualizada";
				if (status === "approved") {
					message =
						maxIteration >= 3 ?
							"Dimensión reconciliada (iteración 3)"
						:	"Dimensión aprobada (iteración 1)";
				} else if (status === "rejected") {
					message =
						maxIteration >= 3 ?
							"Dimensión enviada a arbitraje (disputada)"
						:	"Dimensión rechazada";
				} else {
					message = "Dimensión reseteada";
				}
				toast.success(message);

				// 🚫 SIN REALTIME: El estado optimista se mantiene (no hay recarga automática)
				// La UI refleja inmediatamente el cambio y persiste visualmente
				// Solo se limpia si el usuario recarga la página manualmente
			}
		},
		[persistDimensionStatus, setDimensionStatus],
	);

	// 🎯 Callback para modal de desacuerdo (después de setAndPersistDimensionStatus)
	const handleModalSubmitted = useCallback(
		(ok: boolean) => {
			if (ok && selectedArticle && selectedDimId) {
				// Aplicar rechazo con un pequeño delay para que el cierre del popup sea visible
				setTimeout(() => {
					setAndPersistDimensionStatus(
						selectedArticle.id!,
						selectedDimId!,
						"rejected",
					);
				}, REJECTION_EFFECT_DELAY_MS);
			}
		},
		[
			selectedArticle,
			selectedDimId,
			setAndPersistDimensionStatus,
			REJECTION_EFFECT_DELAY_MS,
		],
	);

	// Handler para clic en botón Aprobar
	const handleApproveClick = useCallback(
		async (
			articleId: string,
			dimId: string,
			isApproved: boolean,
			maxIteration: number,
		) => {
			if (isApproved) {
				// Quitar aprobación => volver a neutral
				await setAndPersistDimensionStatus(
					articleId,
					dimId,
					"none",
					maxIteration,
				);
				return;
			}

			// Aprobar con iteración correcta:
			// - Iter 1 → validated
			// - Iter 3+ → reconciled
			await setAndPersistDimensionStatus(
				articleId,
				dimId,
				"approved",
				maxIteration,
			);
		},
		[setAndPersistDimensionStatus],
	);

	// Handler para botón de Desacuerdo/Arbitraje
	const handleDisagreementClick = useCallback(
		async (
			article: TableLikeViewArticle,
			dimId: string,
			maxIteration: number,
		) => {
			// 🎯 ITER 3+: Arbitraje directo (sin crear nueva iteración, solo cambiar status a 'disputed')
			if (maxIteration >= 3) {
				// Marcar como rechazado con iteración 3+ → disputed (el toast lo muestra setAndPersistDimensionStatus)
				await setAndPersistDimensionStatus(
					article.id,
					dimId,
					"rejected",
					maxIteration,
				);
				return;
			}

			// 🔒 ITER 1-2: Abrir modal para registrar desacuerdo (creará iter 2)
			setSelectedArticle(article);
			setSelectedDimId(dimId);
			setDisagreementOpen(true);
		},
		[setAndPersistDimensionStatus],
	);

	// 👁️ Handler para botón ojito: Ver historial de clasificaciones
	const handleHistoryClick = useCallback(
		(e: React.MouseEvent, reviews: ClassificationReview[], dimId: string) => {
			e.stopPropagation();
			setHistoryReviews(reviews);
			setHistoryDimensionName(dimensionLabelById[dimId] ?? dimId);
			setHistoryDialogOpen(true);
		},
		[dimensionLabelById],
	);

	// Aprobar todas las dimensiones para un artículo específico (acción por fila)
	const approveAllForArticle = useCallback(
		async (articleId: string) => {
			const current = statusRef.current[articleId] || {};
			const updates: Record<string, "none" | "approved" | "rejected"> = {
				...current,
			};
			// Optimista: aprobar solo las dimensiones que NO estén rechazadas
			dimensionOrder.forEach((dimId) => {
				if ((current[dimId] || "none") !== "rejected") {
					updates[dimId] = "approved";
				}
			});
			setDimensionStatusByArticle((prev) => ({
				...prev,
				[articleId]: updates,
			}));
			// Persistir en backend para cada dimensión (omitir rechazadas)
			await Promise.all(
				dimensionOrder.map(async (dimId) => {
					if ((current[dimId] || "none") === "rejected") return; // no tocar divergencias
					const res = await persistDimensionStatus(
						articleId,
						dimId,
						"validated",
					);
					if (!res.ok) {
						// revert individual si falla
						setDimensionStatus(articleId, dimId, current[dimId] || "none");
						// eslint-disable-next-line no-console
						console.error("[prevalidate] Error en approve-all por artículo", {
							articleId,
							dimId,
							error: res.error,
						});
					}
				}),
			);
		},
		[dimensionOrder, persistDimensionStatus, setDimensionStatus],
	);

	// Señal global: aprobar todas las dimensiones de todos los artículos (acción desde page) con persistencia bulk
	useEffect(() => {
		if (
			!approveAllRequestId ||
			approveAllRequestId === lastApproveIdRef.current
		)
			return;
		lastApproveIdRef.current = approveAllRequestId;
		const snapshot = statusRef.current;
		// Optimista: aprobar todas las no rechazadas
		const newState: Record<
			string,
			Record<string, "none" | "approved" | "rejected">
		> = {};
		for (const article of cardData) {
			const current = snapshot[article.id] || {};
			const perArticle: Record<string, "none" | "approved" | "rejected"> = {
				...current,
			};
			for (const dimId of dimensionOrder) {
				if ((current[dimId] || "none") !== "rejected") {
					perArticle[dimId] = "approved";
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
						if ((current[dimId] || "none") === "rejected") continue;
						tasks.push(
							(async () => {
								const res = await persistDimensionStatus(
									article.id,
									dimId,
									"validated",
								);
								if (!res.ok) {
									// revert individual
									setDimensionStatus(
										article.id,
										dimId,
										current[dimId] || "none",
									);
									// eslint-disable-next-line no-console
									console.error("[prevalidate] Error en approve-all (lote)", {
										articleId: article.id,
										dimId,
										error: res.error,
									});
								}
							})(),
						);
					}
				}
				await Promise.all(tasks);
				toast.success(
					"Se marcaron como OK todas las dimensiones (excluyendo divergencias)",
				);
				onGlobalBulkPersistResult?.(true, true);
			} catch (error) {
				setDimensionStatusByArticle(snapshot);
				toast.error("No se pudo marcar OK todo el lote");
				// eslint-disable-next-line no-console
				console.error("[prevalidate] Error en approve-all de lote", error);
				onGlobalBulkPersistResult?.(false, true);
			}
		};
		void persist();
	}, [
		approveAllRequestId,
		cardData,
		dimensionOrder,
		persistDimensionStatus,
		onGlobalBulkPersistResult,
		setDimensionStatus,
	]);

	// Señal global: desmarcar (poner en 'none') todas las dimensiones de todos los artículos con persistencia bulk=false
	useEffect(() => {
		if (!resetAllRequestId || resetAllRequestId === lastResetIdRef.current)
			return;
		lastResetIdRef.current = resetAllRequestId;
		const snapshot = statusRef.current;
		// Optimista: desmarcar solo las que están 'approved'; no tocar 'rejected'
		const newState: Record<
			string,
			Record<string, "none" | "approved" | "rejected">
		> = {};
		for (const article of cardData) {
			const current = snapshot[article.id] || {};
			const perArticle: Record<string, "none" | "approved" | "rejected"> = {
				...current,
			};
			for (const dimId of dimensionOrder) {
				if ((current[dimId] || "none") === "approved") {
					perArticle[dimId] = "none";
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
						if ((current[dimId] || "none") !== "approved") continue;
						tasks.push(
							(async () => {
								const res = await persistDimensionStatus(
									article.id,
									dimId,
									"review_pending",
								);
								if (!res.ok) {
									// revert individual
									setDimensionStatus(
										article.id,
										dimId,
										current[dimId] || "none",
									);
									// eslint-disable-next-line no-console
									console.error("[prevalidate] Error en reset-all (lote)", {
										articleId: article.id,
										dimId,
										error: res.error,
									});
								}
							})(),
						);
					}
				}
				await Promise.all(tasks);
				toast.success(
					"Se desmarcaron todas las dimensiones aprobadas (se mantuvieron las divergencias)",
				);
				onGlobalBulkPersistResult?.(true, false);
			} catch (error) {
				setDimensionStatusByArticle(snapshot);
				toast.error("No se pudo desmarcar el lote");
				// eslint-disable-next-line no-console
				console.error("[prevalidate] Error en reset-all de lote", error);
				onGlobalBulkPersistResult?.(false, false);
			}
		};
		void persist();
	}, [
		resetAllRequestId,
		cardData,
		dimensionOrder,
		persistDimensionStatus,
		onGlobalBulkPersistResult,
		setDimensionStatus,
	]);

	// Pre-calcular latestReview, maxIteration y colorScheme una sola vez por artículo×dimensión
	// Elimina ~N×D×7 sorts redundantes del render loop
	const reviewMeta = useMemo(() => {
		const meta: Record<
			string,
			Record<
				string,
				{
					latestReview: ClassificationReview | undefined;
					maxIteration: number;
					colorScheme: DimensionColorScheme;
				}
			>
		> = {};
		for (const article of cardData) {
			const perArticle: Record<
				string,
				{
					latestReview: ClassificationReview | undefined;
					maxIteration: number;
					colorScheme: DimensionColorScheme;
				}
			> = {};
			for (const dimId of dimensionOrder) {
				const reviews: ClassificationReview[] =
					article.classifications?.[dimId] ?? [];
				if (reviews.length === 0) {
					perArticle[dimId] = {
						latestReview: undefined,
						maxIteration: 0,
						colorScheme: "neutral",
					};
				} else {
					const sorted = [...reviews].sort(
						(a, b) => (b.iteration ?? 0) - (a.iteration ?? 0),
					);
					const latest = sorted[0];
					const maxIter = latest.iteration ?? 0;
					perArticle[dimId] = {
						latestReview: latest,
						maxIteration: maxIter,
						colorScheme: mapStatusToColor(latest.status, maxIter),
					};
				}
			}
			meta[article.id] = perArticle;
		}
		return meta;
	}, [cardData, dimensionOrder]);

	// Pre-calcular datos por artículo (rowAccent, isArticleFinal, allApproved)
	// IMPORTANTE: Considera estado optimista dimensionStatusByArticle para rowAccent
	const articleMeta = useMemo(() => {
		const meta: Record<
			string,
			{
				rowAccent: DimensionColorScheme;
				isArticleFinal: boolean;
			}
		> = {};
		for (const article of cardData) {
			const dimColors: DimensionColorScheme[] = [];
			let isFinal = false;
			for (const dimId of dimensionOrder) {
				const rm = reviewMeta[article.id]?.[dimId];
				const dimStatus =
					dimensionStatusByArticle[article.id]?.[dimId] || "none";
				const maxIter = rm?.maxIteration ?? 0;

				// 🎨 COLOR: Aplicar override optimista si existe
				let dimColor: DimensionColorScheme = rm?.colorScheme ?? "neutral";
				if (dimStatus === "approved") {
					dimColor = maxIter >= 3 ? "primary" : "success";
				} else if (dimStatus === "rejected") {
					dimColor = maxIter >= 3 ? "danger" : "warning";
				}

				dimColors.push(dimColor);
				if (rm?.latestReview?.is_final === true) isFinal = true;
			}
			meta[article.id] = {
				rowAccent: getArticleColorScheme(dimColors),
				isArticleFinal: isFinal,
			};
		}
		return meta;
	}, [cardData, dimensionOrder, reviewMeta, dimensionStatusByArticle]);

	// 🎯 getRowHeight y setRowHeight vienen del hook useDynamicRowHeight (línea ~190)

	// 📐 Medir altura del contenedor para la lista virtualizada
	useLayoutEffect(() => {
		if (!containerRef.current) return;

		const updateContainerHeight = () => {
			if (containerRef.current) {
				const availableHeight = window.innerHeight - 200;
				setContainerHeight(Math.max(600, availableHeight));
			}
		};

		updateContainerHeight();

		const resizeObserver = new ResizeObserver(updateContainerHeight);
		resizeObserver.observe(containerRef.current);

		window.addEventListener("resize", updateContainerHeight);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateContainerHeight);
		};
	}, []);

	// 🎯 Props para el componente de fila virtualizada (react-window v2)
	const virtualRowProps = useMemo(
		() => ({
			cardData,
			dimensionOrder,
			dimensionLabelById,
			dimensionIconById,
			optionEmoticonsByDimId,
			dimensionStatusByArticle,
			reviewMeta,
			articleMeta,
			notesPresenceByItemId,
			groupsPresenceByItemId,
			isLoadingGroupsPresence,
			showOriginalAsPrimary,
			batchId,
			batchNumber,
			compact,
			onOpenNotes,
			onGroupsChanged,
			approveAllForArticle,
			handleApproveClick,
			handleDisagreementClick,
			handleHistoryClick,
			onHeightChange: setRowHeight,
			// 🆕 Props para reprocesamiento
			articlesWithoutAI,
			onReprocessArticle,
		}),
		[
			cardData,
			dimensionOrder,
			dimensionLabelById,
			dimensionIconById,
			optionEmoticonsByDimId,
			dimensionStatusByArticle,
			reviewMeta,
			articleMeta,
			notesPresenceByItemId,
			groupsPresenceByItemId,
			isLoadingGroupsPresence,
			showOriginalAsPrimary,
			batchId,
			batchNumber,
			compact,
			onOpenNotes,
			onGroupsChanged,
			approveAllForArticle,
			handleApproveClick,
			handleDisagreementClick,
			handleHistoryClick,
			setRowHeight,
			// 🆕 Dependencias de reprocesamiento
			articlesWithoutAI,
			onReprocessArticle,
		],
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ListComponent = List as ComponentType<any>;

	return (
		<div ref={containerRef}>
			{/* Lista virtualizada con react-window v2 */}
			<ListComponent
				height={containerHeight}
				rowCount={cardData.length}
				rowHeight={(index: number) =>
					getRowHeight(index) ?? ESTIMATED_ITEM_HEIGHT
				}
				rowComponent={ArticleRowWrapper}
				rowProps={virtualRowProps}
				width="100%"
				overscanCount={3}
			/>

			{/* Indicador de total de artículos */}
			{cardData.length > 0 && (
				<div className="text-center mt-4 mb-4 py-2">
					<StandardText size="sm" colorScheme="secondary">
						{cardData.length} artículo{cardData.length !== 1 ? "s" : ""} en el
						lote
					</StandardText>
				</div>
			)}

			{/* MODALES - Viven fuera de la virtualización para evitar desmontaje */}

			{/* Dialog de historial de clasificaciones - Renderizado condicional */}
			{historyDialogOpen && (
				<StandardDialog
					open={historyDialogOpen}
					onOpenChange={setHistoryDialogOpen}>
					<StandardDialog.Content size="lg">
						<StandardDialog.Header>
							<StandardDialog.Title>
								Historial de Clasificaciones · {historyDimensionName}
							</StandardDialog.Title>
							<StandardDialog.Description>
								Todas las iteraciones de clasificación para esta dimensión
							</StandardDialog.Description>
						</StandardDialog.Header>
						<StandardDialog.Body>
							<div className="space-y-4">
								{historyReviews.length === 0 ?
									<div className="text-center py-8 text-muted-foreground">
										<Eye className="mx-auto mb-2 h-8 w-8 opacity-50" />
										<p>No hay clasificaciones registradas</p>
									</div>
								:	historyReviews
										.sort((a, b) => (a.iteration ?? 0) - (b.iteration ?? 0))
										.map((review, idx) => {
											const isAI = review.reviewer_type === "ai";
											const iterLabel =
												review.iteration === 1 ? "Clasificación Inicial (IA)"
												: review.iteration === 2 ? "Revisión Humana"
												: "Reconciliación (IA)";
											const bgColor = isAI ? "bg-accent/10" : "bg-primary/10";
											const borderColor =
												isAI ? "border-accent/30" : "border-primary/30";

											return (
												<div
													key={idx}
													className={`p-4 rounded-lg border-2 ${bgColor} ${borderColor}`}>
													<div className="flex items-center justify-between mb-2">
														<div className="font-semibold text-sm">
															{iterLabel}
														</div>
														<StandardBadge
															colorScheme={isAI ? "accent" : "primary"}
															size="sm">
															Iteración {review.iteration}
														</StandardBadge>
													</div>

													<div className="space-y-2 text-sm">
														<div className="flex items-start gap-2">
															<span className="font-medium min-w-[80px]">
																Valor:
															</span>
															<span className="flex-1">
																{review.value ?? "—"}
															</span>
														</div>

														{typeof review.confidence === "number" && (
															<div className="flex items-start gap-2">
																<span className="font-medium min-w-[80px]">
																	Confianza:
																</span>
																<StandardBadge
																	colorScheme={
																		review.confidence === 3 ? "success"
																		: review.confidence === 2 ?
																			"warning"
																		:	"danger"
																	}
																	size="sm">
																	{review.confidence === 3 ?
																		"Alta"
																	: review.confidence === 2 ?
																		"Media"
																	:	"Baja"}
																</StandardBadge>
															</div>
														)}

														{review.status && (
															<div className="flex items-start gap-2">
																<span className="font-medium min-w-[80px]">
																	Estado:
																</span>
																<StandardBadge
																	colorScheme={
																		review.status === "validated" ? "success"
																		: review.status === "reconciled" ?
																			"primary"
																		: review.status === "disputed" ?
																			"danger"
																		: (
																			review.status === "review_pending" ||
																			review.status === "reconciliation_pending"
																		) ?
																			"warning"
																		:	"neutral"
																	}
																	size="sm">
																	{review.status}
																</StandardBadge>
															</div>
														)}

														{review.rationale && (
															<div className="flex flex-col gap-1">
																<span className="font-medium">
																	Justificación:
																</span>
																<p className="text-xs italic opacity-80 pl-2 border-l-2 border-current">
																	{review.rationale}
																</p>
															</div>
														)}
													</div>
												</div>
											);
										})
								}
							</div>
						</StandardDialog.Body>
					</StandardDialog.Content>
				</StandardDialog>
			)}

			{/* Modal de desacuerdo humano - Renderizado condicional para evitar cálculos innecesarios */}
			{disagreementOpen && (
				<HumanDisagreementModal
					open={disagreementOpen}
					onClose={handleModalClose}
					article={selectedArticle}
					dimensionId={selectedDimId}
					dimensionName={modalDimensionName}
					dimensionType={modalDimensionType}
					dimensionOptions={modalDimensionOptions}
					optionEmoticonsMap={modalOptionEmoticonsMap}
					onSubmitted={handleModalSubmitted}
				/>
			)}
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
	{ value: "3", label: "🟢 Alta" },
	{ value: "2", label: "🟡 Media" },
	{ value: "1", label: "🔴 Baja" },
];

// 🎯 Componentes memoizados para evitar re-renders del select
const DimensionValueField = memo<{
	value: string | undefined;
	onChange: (v: string | undefined) => void;
	enrichedOptions: SelectOption[];
	previousValue: string | null;
}>(({ value, onChange, enrichedOptions, previousValue }) => {
	return (
		<StandardFormField
			label="Nueva clasificación"
			htmlFor="dimension-value-select">
			<StandardSelect
				id="dimension-value-select"
				options={enrichedOptions}
				value={value}
				onChange={(v) => {
					onChange(typeof v === "string" ? v : undefined);
				}}
				placeholder="Selecciona un valor"
				stableOptions={true}
			/>
			{previousValue && (
				<StandardText size="xs" className="text-gray-500 mt-1">
					Valor anterior: <span className="italic">{previousValue}</span>
				</StandardText>
			)}
		</StandardFormField>
	);
});
DimensionValueField.displayName = "DimensionValueField";

const ConfidenceField = memo<{
	value: string | undefined;
	onChange: (v: string | undefined) => void;
}>(({ value, onChange }) => {
	return (
		<StandardFormField label="Nivel de confianza" htmlFor="confidence-select">
			<StandardSelect
				id="confidence-select"
				options={confidenceOptions}
				value={value}
				onChange={(v) => {
					onChange(typeof v === "string" ? v : undefined);
				}}
				placeholder="Selecciona confianza"
				stableOptions={true}
			/>
		</StandardFormField>
	);
});
ConfidenceField.displayName = "ConfidenceField";

const HumanDisagreementModal: React.FC<HumanDisagreementModalProps> = memo(
	({
		open,
		onClose,
		article,
		dimensionId,
		dimensionName,
		dimensionType,
		dimensionOptions,
		optionEmoticonsMap,
		onSubmitted,
	}) => {
		const [saving, setSaving] = useState(false);
		const [value, setValue] = useState<string | undefined>(undefined);
		const [confidence, setConfidence] = useState<string | undefined>(undefined);
		const [rationale, setRationale] = useState<string>("");

		// 🔍 DEBUG: Render count (solo en dev, no causa re-renders)
		const renderCountRef = useRef(0);
		renderCountRef.current++;
		if (
			process.env.NODE_ENV === "development" &&
			renderCountRef.current % 10 === 1
		) {
			console.log(
				"🔴 [HumanDisagreementModal] render #",
				renderCountRef.current,
				{
					open,
					dimensionId,
				},
			);
		}

		// 🎯 DETERMINAR ITERACIÓN ACTUAL para cambiar el título del modal (memoizado)
		const currentIteration = useMemo(() => {
			if (!article || !dimensionId) return 0;
			const reviews: ClassificationReview[] =
				article.classifications?.[dimensionId] ?? [];
			return reviews.length > 0 ?
					Math.max(...reviews.map((r) => r.iteration ?? 0))
				:	0;
		}, [article, dimensionId]);

		const isArbitration = currentIteration >= 3;

		useEffect(() => {
			if (!open) {
				setValue(undefined);
				setConfidence(undefined);
				setRationale("");
			}
		}, [open]);

		// Normalizar y enriquecer opciones (memoizado para evitar recálculo en cada render)
		const enrichedOptions = useMemo(() => {
			const normalized = (dimensionOptions || []).map((opt) =>
				typeof opt === "string" ?
					{ value: String(opt), label: String(opt) }
				:	{ value: String(opt.value), label: opt.label },
			);
			return normalized.map((opt) => {
				const emoji = optionEmoticonsMap[String(opt.value)] || "";
				const label = emoji ? `${emoji} ${opt.label}` : opt.label;
				return { ...opt, label };
			});
		}, [dimensionOptions, optionEmoticonsMap]);

		// Valor previo (preferir última revisión de IA; si no, última disponible) - Memoizado
		const previousValue = useMemo(() => {
			if (!article || !dimensionId) return null;
			const reviews: ClassificationReview[] =
				article.classifications?.[dimensionId] ?? [];
			if (reviews.length === 0) return null;
			const byIterDesc = [...reviews].sort(
				(a, b) => (b.iteration ?? 0) - (a.iteration ?? 0),
			);
			const lastAI = byIterDesc.find((r) => r.reviewer_type === "ai");
			const chosen = lastAI || byIterDesc[0];
			if (!chosen?.value) return null;
			if (dimensionType === "finite") {
				const emoji = optionEmoticonsMap[String(chosen.value)] || "";
				return emoji ? `${emoji} ${chosen.value}` : chosen.value;
			}
			return chosen.value;
		}, [article, dimensionId, dimensionType, optionEmoticonsMap]);

		const handleSubmit = async () => {
			if (!value || !confidence) return;
			// eslint-disable-next-line no-console
			setSaving(true);
			try {
				const payload = {
					article_batch_item_id: article?.id,
					dimension_id: dimensionId,
					human_value: value,
					human_option_id: null as string | null, // Opcional, se puede mapear a futuro
					human_confidence: Number(confidence),
					human_rationale: rationale || "",
				};
				const resp = await fetch("/api/preclassification/reviews/human", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				if (!resp.ok) {
					const data = (await resp.json().catch(() => ({}))) as {
						error?: string;
					};
					throw new Error(data.error || `HTTP ${resp.status}`);
				}
				toast.success("Revisión guardada correctamente");
				onSubmitted(true);
				onClose();
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(
					"[HumanDisagreementModal] Error al enviar revisión humana",
					e,
				);
				onSubmitted(false);
			} finally {
				setSaving(false);
			}
		};

		return (
			<StandardDialog
				open={open}
				onOpenChange={(o) => {
					if (!o) onClose();
				}}>
				<StandardDialog.Content
					size="lg"
					colorScheme={isArbitration ? "danger" : "neutral"}>
					<StandardDialog.Header>
						<StandardDialog.Title>
							{isArbitration ?
								`⚖️ Arbitraje Requerido · ${dimensionName}`
							:	`Desacuerdo del Investigador · ${dimensionName}`}
						</StandardDialog.Title>
						<StandardDialog.Description>
							{isArbitration ?
								"La IA reconcilió pero no estás de acuerdo. Indica tu clasificación final que será enviada a arbitraje superior."
							:	"Indica tu clasificación humana, nivel de confianza y una breve justificación."
							}
						</StandardDialog.Description>
					</StandardDialog.Header>
					<StandardDialog.Body className="space-y-4">
						{dimensionType === "finite" ?
							<DimensionValueField
								value={value}
								onChange={setValue}
								enrichedOptions={enrichedOptions}
								previousValue={previousValue}
							/>
						:	<StandardFormField
								label="Nueva clasificación (texto)"
								htmlFor="dimension-value-input">
								<StandardInput
									id="dimension-value-input"
									value={value ?? ""}
									onChange={(e) => setValue(e.target.value)}
									placeholder="Escribe tu clasificación"
								/>
								{previousValue && (
									<StandardText size="xs" className="text-gray-500 mt-1">
										Valor anterior:{" "}
										<span className="italic">{previousValue}</span>
									</StandardText>
								)}
							</StandardFormField>
						}

						<ConfidenceField value={confidence} onChange={setConfidence} />

						<StandardFormField
							label="Justificación"
							htmlFor="rationale-textarea">
							<StandardTextarea
								id="rationale-textarea"
								rows={4}
								value={rationale}
								onChange={(e) => setRationale(e.target.value)}
								placeholder="Explica brevemente tu decisión"
							/>
						</StandardFormField>
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardButton
							styleType="subtle"
							onClick={onClose}
							disabled={saving}>
							Cancelar
						</StandardButton>
						<StandardButton
							onClick={handleSubmit}
							colorScheme={isArbitration ? "danger" : "primary"}
							disabled={saving || !value || !confidence}>
							{saving ? "Guardando..." : "Enviar revisión"}
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		);
	},
	// 🎯 COMPARATOR PERSONALIZADO: Incluir onSubmitted y onClose para evitar re-renders
	(prevProps, nextProps) => {
		return (
			prevProps.open === nextProps.open &&
			prevProps.article === nextProps.article &&
			prevProps.dimensionId === nextProps.dimensionId &&
			prevProps.dimensionName === nextProps.dimensionName &&
			prevProps.dimensionType === nextProps.dimensionType &&
			prevProps.onSubmitted === nextProps.onSubmitted &&
			prevProps.onClose === nextProps.onClose &&
			JSON.stringify(prevProps.dimensionOptions) ===
				JSON.stringify(nextProps.dimensionOptions) &&
			JSON.stringify(prevProps.optionEmoticonsMap) ===
				JSON.stringify(nextProps.optionEmoticonsMap)
		);
	},
);

HumanDisagreementModal.displayName = "HumanDisagreementModal";

// (sin helpers externos)
