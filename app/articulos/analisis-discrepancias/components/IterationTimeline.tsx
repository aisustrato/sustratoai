"use client";

import { useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { Bot, User, Scale, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { DiscrepancyDetail } from "@/lib/actions/preclassification-actions";

interface IterationTimelineProps {
	detail: DiscrepancyDetail;
	onNavigateToArticle?: (articleId: string) => void;
}

function getConfidenceLabel(score: number | null): string {
	if (score === 3) return "Alta";
	if (score === 2) return "Media";
	if (score === 1) return "Baja";
	return "—";
}

function getConfidenceColor(
	score: number | null,
): "success" | "warning" | "neutral" {
	if (score === 3) return "success";
	if (score === 2) return "warning";
	return "neutral";
}

function getStatusBadge(status: string | null) {
	switch (status) {
		case "reconciled":
			return { label: "Reconciliado", color: "primary" as const };
		case "disputed":
			return { label: "En Disputa", color: "danger" as const };
		case "reconciliation_pending":
			return { label: "Pend. Reconciliación", color: "warning" as const };
		case "validated":
			return { label: "Validado", color: "success" as const };
		default:
			return { label: status || "—", color: "neutral" as const };
	}
}

export function IterationTimeline({
	detail,
	onNavigateToArticle,
}: IterationTimelineProps) {
	const [showRationale, setShowRationale] = useState(false);

	const title = detail.translatedTitle || detail.articleTitle;

	return (
		<StandardCard styleType="subtle" hasOutline className="p-4">
			{/* Header */}
			<div className="flex items-start justify-between mb-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						{detail.correlativo && (
							<StandardBadge size="sm" colorScheme="neutral">
								#{detail.correlativo}
							</StandardBadge>
						)}
						<StandardBadge size="sm" colorScheme="primary">
							{detail.dimensionName}
						</StandardBadge>
						{detail.batchNumber && (
							<StandardBadge size="sm" colorScheme="neutral" styleType="outline">
								Lote {detail.batchNumber}
							</StandardBadge>
						)}
					</div>
					<StandardText size="sm" weight="semibold" className="line-clamp-1">
						{title}
					</StandardText>
				</div>
				{onNavigateToArticle && (
					<StandardButton
						styleType="ghost"
						size="sm"
						iconOnly
						onClick={() => onNavigateToArticle(detail.articleId)}
						tooltip="Ver detalle del artículo"
					>
						<ExternalLink size={14} />
					</StandardButton>
				)}
			</div>

			{/* Timeline */}
			<div className="relative pl-6 space-y-4">
				{/* Línea vertical */}
				<div className="absolute left-2.5 top-2 bottom-2 w-px bg-neutral-300" />

				{/* Iteración 1 - IA */}
				{detail.iter1 && (
					<div className="relative">
						<div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-accent-100 border-2 border-accent-500 flex items-center justify-center">
							<Bot size={10} className="text-accent-600" />
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<StandardText size="xs" colorShade="subtle" weight="medium">
								Iter 1 (IA)
							</StandardText>
							<StandardBadge size="sm" colorScheme="accent">
								{detail.iter1.value}
							</StandardBadge>
							<StandardBadge
								size="sm"
								colorScheme={getConfidenceColor(detail.iter1.confidence)}
								styleType="outline"
							>
								{getConfidenceLabel(detail.iter1.confidence)}
							</StandardBadge>
						</div>
					</div>
				)}

				{/* Indicador de acuerdo/discrepancia */}
				{detail.iter2 && (
					<div className="relative flex items-center gap-2 py-1">
						<div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center">
							{detail.isAgreement ? (
								<span className="text-sm">✅</span>
							) : (
								<span className="text-sm">❌</span>
							)}
						</div>
						<StandardText size="xs" colorShade="subtle">
							{detail.isAgreement ? "Acuerdo" : "Discrepancia"}
						</StandardText>
					</div>
				)}

				{/* Iteración 2 - Humano */}
				{detail.iter2 && (
					<div className="relative">
						<div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
							<User size={10} className="text-primary-600" />
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<StandardText size="xs" colorShade="subtle" weight="medium">
								Iter 2 (Humano)
							</StandardText>
							<StandardBadge size="sm" colorScheme="primary">
								{detail.iter2.value}
							</StandardBadge>
							<StandardBadge
								size="sm"
								colorScheme={getConfidenceColor(detail.iter2.confidence)}
								styleType="outline"
							>
								{getConfidenceLabel(detail.iter2.confidence)}
							</StandardBadge>
						</div>
					</div>
				)}

				{/* Iteración 3 - Reconciliación */}
				{detail.iter3 && (
					<div className="relative">
						<div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-success-100 border-2 border-success-500 flex items-center justify-center">
							<Scale size={10} className="text-success-600" />
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<StandardText size="xs" colorShade="subtle" weight="medium">
								Iter 3 (Reconciliación)
							</StandardText>
							<StandardBadge size="sm" colorScheme="success">
								{detail.iter3.value}
							</StandardBadge>
							<StandardBadge
								size="sm"
								colorScheme={getConfidenceColor(detail.iter3.confidence)}
								styleType="outline"
							>
								{getConfidenceLabel(detail.iter3.confidence)}
							</StandardBadge>
							{detail.iter3.status && (
								<StandardBadge
									size="sm"
									colorScheme={getStatusBadge(detail.iter3.status).color}
								>
									{getStatusBadge(detail.iter3.status).label}
								</StandardBadge>
							)}
						</div>
					</div>
				)}

				{/* Sin iter 2 */}
				{!detail.iter2 && (
					<div className="relative">
						<div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center">
							<User size={10} className="text-neutral-400" />
						</div>
						<StandardText size="xs" colorShade="subtle">
							Sin revisión humana
						</StandardText>
					</div>
				)}
			</div>

			{/* Toggle rationale */}
			<div className="mt-3 pt-3 border-t border-neutral-200">
				<StandardButton
					styleType="ghost"
					size="sm"
					onClick={() => setShowRationale(!showRationale)}
					leftIcon={showRationale ? ChevronUp : ChevronDown}
				>
					{showRationale ? "Ocultar justificaciones" : "Ver justificaciones"}
				</StandardButton>

				{showRationale && (
					<div className="mt-3 space-y-3">
						{detail.iter1?.rationale && (
							<div>
								<StandardText size="xs" weight="semibold" colorShade="subtle">
									IA (Iter 1):
								</StandardText>
								<StandardText size="xs" className="mt-1">
									{detail.iter1.rationale}
								</StandardText>
							</div>
						)}
						{detail.iter2?.rationale && (
							<div>
								<StandardText size="xs" weight="semibold" colorShade="subtle">
									Humano (Iter 2):
								</StandardText>
								<StandardText size="xs" className="mt-1">
									{detail.iter2.rationale}
								</StandardText>
							</div>
						)}
						{detail.iter3?.rationale && (
							<div>
								<StandardText size="xs" weight="semibold" colorScheme="success">
									Reconciliación (Iter 3):
								</StandardText>
								<StandardText size="xs" className="mt-1">
									{detail.iter3.rationale}
								</StandardText>
							</div>
						)}
					</div>
				)}
			</div>
		</StandardCard>
	);
}
