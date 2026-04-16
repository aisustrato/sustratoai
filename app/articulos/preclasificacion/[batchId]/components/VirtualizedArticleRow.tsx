// 📍 app/articulos/preclasificacion-optimized/[batchId]/components/VirtualizedArticleRow.tsx
// 🎯 PROPÓSITO: Componente de fila virtualizada que mide su propia altura
// 🔧 DECISIÓN: Usa ResizeObserver para reportar altura real al cache de virtualización

"use client";

import React, { useRef, useLayoutEffect, CSSProperties } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardBadge } from "@/components/ui/StandardBadge";
import {
	Search,
	StickyNote,
	Check,
	ThumbsDown,
	Eye,
	Brain,
} from "lucide-react";
import ArticleGroupManager from "@/app/articulos/preclasificacion/[batchId]/components/ArticleGroupManager";
import { DimensionDisplay } from "./DimensionDisplay";
import {
	StandardQuipuIndicator,
	QuipuStatus,
} from "@/components/ui/StandardQuipuIndicator";
import type { ClassificationReview } from "@/lib/types/preclassification-types";

type DimensionColorScheme =
	| "neutral"
	| "success"
	| "warning"
	| "accent"
	| "primary"
	| "danger";

interface VirtualizedArticleRowProps {
	index: number;
	style: CSSProperties;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	article: any; // TableLikeViewArticle
	dimensionOrder: string[];
	dimensionLabelById: Record<string, string>;
	dimensionIconById: Record<string, string | null>;
	optionEmoticonsByDimId: Record<string, Record<string, string | null>>;
	dimensionStatusByArticle: Record<
		string,
		Record<string, "none" | "approved" | "rejected">
	>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reviewMeta: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	articleMeta: any;
	notesPresenceByItemId: Record<string, boolean>;
	groupsPresenceByItemId: Record<string, boolean>;
	isLoadingGroupsPresence: boolean;
	showOriginalAsPrimary: boolean;
	batchId: string;
	batchNumber?: number | null;
	compact?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onOpenNotes: (article: any) => void;
	onGroupsChanged: (itemId: string, hasGroups: boolean) => void;
	approveAllForArticle: (articleId: string) => void;
	handleApproveClick: (
		articleId: string,
		dimId: string,
		isApproved: boolean,
		latestIteration: number,
	) => void;
	handleDisagreementClick: (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		article: any,
		dimId: string,
		latestIteration: number,
	) => void;
	handleHistoryClick: (
		e: React.MouseEvent,
		reviews: ClassificationReview[],
		dimId: string,
	) => void;
	onHeightChange: (index: number, height: number) => void;
	// 🆕 Props para reprocesamiento de artículos sin clasificaciones
	articlesWithoutAI?: Array<{
		article_item_id: string;
		article_title: string;
		missing_dimensions: number;
	}>;
	onReprocessArticle?: (articleItemId: string, articleTitle: string) => void;
}

export const VirtualizedArticleRow: React.FC<VirtualizedArticleRowProps> = ({
	index,
	style,
	article,
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
	onHeightChange,
	articlesWithoutAI,
	onReprocessArticle,
}) => {
	const rowRef = useRef<HTMLDivElement>(null);

	// 📐 Medir altura real y reportar cambios
	useLayoutEffect(() => {
		if (!rowRef.current) return;

		const measureHeight = () => {
			if (rowRef.current) {
				const height = rowRef.current.getBoundingClientRect().height;
				onHeightChange(index, height);
			}
		};

		// Medir inmediatamente
		measureHeight();

		// Observar cambios de tamaño
		const resizeObserver = new ResizeObserver(measureHeight);
		resizeObserver.observe(rowRef.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, [index, onHeightChange]);

	const articleDimStatuses = dimensionOrder.map(
		(dimId) => dimensionStatusByArticle[article.id]?.[dimId] || "none",
	);
	const { rowAccent, isArticleFinal } = articleMeta[article.id] ?? {
		rowAccent: "neutral" as DimensionColorScheme,
		isArticleFinal: false,
	};

	// Para lógica de badge "Listo"
	const totalDims = dimensionOrder.length;
	const approvedCount = articleDimStatuses.filter(
		(s) => s === "approved",
	).length;
	const allApproved = totalDims > 0 && approvedCount === totalDims;

	// 🆕 Detectar si este artículo necesita reprocesamiento
	const needsReprocessing = articlesWithoutAI?.some(
		(item) => item.article_item_id === article.originalArticle.item_id,
	);
	const missingDimensions =
		articlesWithoutAI?.find(
			(item) => item.article_item_id === article.originalArticle.item_id,
		)?.missing_dimensions || 0;

	// 🔍 DEBUG: Log para verificar detección
	console.log("[DEBUG] Artículo:", {
		articleId: article.originalArticle.item_id,
		articleTitle: article.title,
		needsReprocessing,
		missingDimensions,
		articlesWithoutAI: articlesWithoutAI?.map((a) => ({
			id: a.article_item_id,
			title: a.article_title.substring(0, 30),
			missing: a.missing_dimensions,
		})),
	});

	// Separar posicionamiento (react-window) del sizing (contenido natural)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { height: _rwHeight, ...positionStyle } = style as any;
	void _rwHeight; // height es manejado por react-window

	return (
		<div style={positionStyle}>
			<div ref={rowRef} className="pb-3">
				<StandardCard
					key={`row-${article.id}`}
					className="group max-h-full"
					colorScheme={rowAccent}
					accentPlacement="left"
					accentColorScheme={rowAccent}
					hasOutline
					disableShadowHover={true}
					contentCanScroll>
					{/* 🎨 NUEVO LAYOUT: Título horizontal arriba + contenido abajo */}
					<div className="flex flex-col h-full">
						{/* 🎯 BARRA SUPERIOR: Título horizontal a lo largo de toda la card */}
						<div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-transparent via-gray-50/50 dark:via-gray-800/50 to-transparent">
							<div className="px-4 py-3 flex items-center gap-4">
								{/* Número del artículo */}
								<div className="flex-shrink-0">
									{typeof article.displayIndex === "number" ?
										<StandardText
											size="2xl"
											weight="bold"
											applyGradient={compact ? true : undefined}>
											{article.displayIndex}
										</StandardText>
									:	null}
								</div>

								{/* Título - ocupa todo el espacio disponible */}
								<div className="flex-1 min-w-0">
									<StandardText
										size="lg"
										weight="semibold"
										className="whitespace-normal">
										{article.title}
									</StandardText>
								</div>

								{/* Badges y botones de acción */}
								<div className="flex items-center gap-2 flex-shrink-0">
									{needsReprocessing && (
										<StandardTooltip
											content={`⚠️ Faltan ${missingDimensions} dimensiones por clasificar. Haz clic para reprocesar.`}
											side="top"
											trigger={
												<StandardBadge
													size="sm"
													colorScheme="warning"
													className="cursor-pointer animate-pulse">
													⚠️ {missingDimensions} sin clasificar
												</StandardBadge>
											}
										/>
									)}
									{allApproved && (
										<StandardBadge
											size="sm"
											colorScheme="success"
											styleType="subtle">
											Listo
										</StandardBadge>
									)}

									{/* Botones de acción horizontales */}
									<div className="flex items-center gap-1">
										<StandardButton
											styleType={
												notesPresenceByItemId[article.originalArticle.item_id] ?
													"solid"
												:	"outline"
											}
											iconOnly
											size="sm"
											onClick={() => onOpenNotes(article.originalArticle)}
											tooltip={
												notesPresenceByItemId[article.originalArticle.item_id] ?
													"Ver/editar notas"
												:	"Crear nota"
											}>
											<StickyNote size={16} />
										</StandardButton>

										{/* 🆕 Botón de reprocesamiento - solo visible si necesita reprocesar */}
										{needsReprocessing && onReprocessArticle && (
											<StandardButton
												styleType="outline"
												colorScheme="warning"
												iconOnly
												size="sm"
												onClick={() =>
													onReprocessArticle(
														article.originalArticle.item_id,
														article.title,
													)
												}
												tooltip="Reprocesar clasificaciones con IA">
												<Brain size={16} />
											</StandardButton>
										)}

										<StandardButton
											styleType="outline"
											iconOnly
											size="sm"
											onClick={() => {
												const hasTranslation = Boolean(
													article.originalArticle.article_data
														?.translated_title ||
														article.originalArticle.article_data
															?.translated_abstract,
												);
												const translatedParam =
													hasTranslation && !showOriginalAsPrimary ? "true" : (
														"false"
													);
												const articleId = article.originalArticle.article_id;
												if (!articleId) return;
												const returnHref = encodeURIComponent(
													`/articulos/preclasificacion2/${batchId}`,
												);
												const returnLabel = encodeURIComponent(
													`Lote #${batchNumber ?? ""}`,
												);
												window.location.href = `/articulos/detalle?articleId=${articleId}&translated=${translatedParam}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
											}}
											tooltip="Ver detalle del artículo">
											<Search size={16} />
										</StandardButton>

										<div>
											<ArticleGroupManager
												articleId={article.originalArticle.article_id}
												hasGroups={
													groupsPresenceByItemId[
														article.originalArticle.item_id
													] || false
												}
												isLoadingPresence={isLoadingGroupsPresence}
												onGroupsChanged={(hasGroups: boolean) =>
													onGroupsChanged(
														article.originalArticle.item_id,
														hasGroups,
													)
												}
											/>
										</div>

										{/* 🔒 Botón OK: Solo visible si el artículo NO está finalizado */}
										{!isArticleFinal && (
											<StandardButton
												iconOnly
												size="sm"
												colorScheme="success"
												styleType="solid"
												onClick={() => approveAllForArticle(article.id)}
												tooltip="Aprobar todas las dimensiones">
												<Check size={16} />
											</StandardButton>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* 📦 CONTENIDO INFERIOR: Abstract/Resumen + Dimensiones */}
						<div
							className="grid items-stretch gap-x-3 flex-1"
							style={{
								gridTemplateColumns: `minmax(140px,1fr) minmax(0,2fr)`,
							}}>
							{/* Zona izquierda: Resumen IA con tooltip de abstract + revista/año */}
							<div className="p-4 min-w-0 border-r border-gray-200 dark:border-gray-700">
								{/* Resumen IA con tooltip del abstract completo */}
								{article.abstract ?
									<StandardTooltip
										content={article.abstract}
										isLongText
										trigger={
											<div>
												<StandardText
													size="sm"
													colorScheme="primary"
													colorShade="dark"
													className={
														compact ? "line-clamp-3 cursor-help" : "cursor-help"
													}>
													{article.ai_summary}
												</StandardText>
											</div>
										}
									/>
								:	<StandardText
										size="sm"
										colorScheme="primary"
										colorShade="dark"
										className={compact ? "line-clamp-3" : ""}>
										{article.ai_summary}
									</StandardText>
								}

								{/* Revista y año debajo del resumen */}
								<div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
									<StandardText size="xs" colorScheme="secondary">
										{article.journal} ({article.year})
									</StandardText>
								</div>
							</div>

							{/* Zona derecha: dimensiones con scroll propio */}
							<div className="min-w-0">
								<div className="overflow-x-auto overscroll-x-contain max-w-full">
									<div
										className="grid items-stretch gap-x-3 p-2 w-max"
										style={{
											gridTemplateColumns: `repeat(${dimensionOrder.length}, 240px)`,
										}}>
										{dimensionOrder.map((dimId) => {
											const reviews: ClassificationReview[] =
												article.classifications?.[dimId] ?? [];
											// Usar datos pre-calculados de reviewMeta
											const meta = reviewMeta[article.id]?.[dimId];
											const latestReview = meta?.latestReview;
											const latestIteration = meta?.maxIteration ?? 0;

											const dimStatus =
												dimensionStatusByArticle[article.id]?.[dimId] || "none";
											const isApproved = dimStatus === "approved";
											const isRejected = dimStatus === "rejected";

											// 🔒 VERIFICAR SI LA DIMENSIÓN ESTÁ FINALIZADA (lote cerrado)
											const isFinal = latestReview?.is_final === true;

											// 🎨 COLOR: Usar pre-calculado de reviewMeta
											let dimColor: DimensionColorScheme =
												meta?.colorScheme ?? "neutral";

											// 🔄 OVERRIDE: Si hay estado optimista UI, usarlo para el color
											if (dimStatus === "approved") {
												dimColor = latestIteration >= 3 ? "primary" : "success";
											} else if (dimStatus === "rejected") {
												dimColor = latestIteration >= 3 ? "danger" : "warning";
											}

											// 🎨 CALCULAR STATUS EFECTIVO PARA QUIPU (Considerando optimismo UI)
											let effectiveQuipuStatus: QuipuStatus =
												(latestReview?.status as QuipuStatus) || "pending";

											if (dimStatus === "approved") {
												effectiveQuipuStatus =
													latestIteration >= 3 ? "reconciled" : "validated";
											} else if (dimStatus === "rejected") {
												effectiveQuipuStatus =
													latestIteration >= 3 ? "disputed" : "review_pending";
											}

											return (
												<div
													key={`cell-${article.id}-${dimId}`}
													className="p-2">
													<StandardCard
														className="h-full relative group/DimCard"
														accentPlacement="none"
														colorScheme={dimColor}
														styleType={
															isApproved || isRejected ? "filled" : "subtle"
														}
														hasOutline={false}
														disableShadowHover={true}
														approved={isApproved}
														approvedColorScheme={
															latestIteration >= 3 ? "primary" : "success"
														}
														animateOnChangeKey={dimStatus}
														animateEntrance={true}>
														{/* Badge Quipu Unificado */}
														<div className="absolute left-2 bottom-2 flex items-center gap-2 z-20">
															<StandardQuipuIndicator
																status={effectiveQuipuStatus}
																iteration={latestIteration}
																size="md"
															/>
														</div>
														{/* 👁️ Botón Ojito: Ver historial completo de clasificaciones */}
														<div className="absolute right-2 bottom-2 z-20">
															<StandardButton
																iconOnly
																size="xs"
																colorScheme="neutral"
																styleType="subtle"
																tooltip="Ver historial de clasificaciones"
																onClick={(e) =>
																	handleHistoryClick(e, reviews, dimId)
																}>
																<Eye size={14} />
															</StandardButton>
														</div>
														{/* 🔒 Botones de acción: Solo visibles si NO está finalizado (is_final === false) */}
														{/* Reservar espacio para el contenido principal */}
														<div className="p-2 pt-1">
															{/* Título y botones de acción */}
															<div className="mb-4">
																<DimensionDisplay
																	variant="card"
																	dimensionName={
																		dimensionLabelById[dimId] ?? dimId
																	}
																	review={latestReview}
																	dimensionIcon={dimensionIconById[dimId]}
																	optionEmoticons={
																		optionEmoticonsByDimId[dimId]
																	}
																/>
															</div>

															{/* Botones de aprobación/rechazo debajo del título */}
															{!isFinal && (
																<div className="flex items-center justify-center gap-2">
																	<StandardButton
																		iconOnly
																		size="sm"
																		colorScheme="success"
																		styleType={isApproved ? "solid" : "outline"}
																		tooltip={
																			isApproved ? "Quitar aprobación" : (
																				"Aprobar"
																			)
																		}
																		onClick={() =>
																			void handleApproveClick(
																				article.id,
																				dimId,
																				isApproved,
																				latestIteration,
																			)
																		}>
																		<Check size={16} />
																	</StandardButton>
																	<StandardButton
																		iconOnly
																		size="sm"
																		colorScheme={
																			latestIteration >= 3 ? "danger" : (
																				"warning"
																			)
																		}
																		styleType={isRejected ? "solid" : "subtle"}
																		tooltip={
																			latestIteration >= 3 ?
																				"Arbitraje (rechazar reconciliación)"
																			: isRejected ?
																				"Editar desacuerdo"
																			:	"Desacuerdo"
																		}
																		onClick={() =>
																			void handleDisagreementClick(
																				article,
																				dimId,
																				latestIteration,
																			)
																		}>
																		<ThumbsDown size={16} />
																	</StandardButton>
																</div>
															)}
														</div>
													</StandardCard>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</StandardCard>
			</div>
		</div>
	);
};

VirtualizedArticleRow.displayName = "VirtualizedArticleRow";
