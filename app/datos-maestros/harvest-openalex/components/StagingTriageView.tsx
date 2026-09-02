//. 📍 app/datos-maestros/harvest-openalex/components/StagingTriageView.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	Check,
	X,
	Unlock,
	Lock,
	Link as LinkIcon,
	RefreshCw,
} from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import {
	listStagingArticles,
	promoteStagingArticles,
	discardStagingArticles,
	type StagingArticleRow,
} from "@/lib/actions/openalex-actions";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface StagingTriageViewProps {
	projectId: string;
	refreshKey: number;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function StagingTriageView({ projectId, refreshKey }: StagingTriageViewProps) {
	const t = useTranslations("datosMaestrosPages.stagingTriageView");
	const [rows, setRows] = useState<StagingArticleRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);

	const loadPending = useCallback(async () => {
		setIsLoading(true);
		const result = await listStagingArticles(projectId, "pending");
		if (result.success) {
			setRows(result.data);
			setFocusedIndex(0);
			setSelectedIds(new Set());
		} else {
			toast.error(result.error);
		}
		setIsLoading(false);
	}, [projectId]);

	useEffect(() => {
		loadPending();
	}, [loadPending, refreshKey]);

	const focusedRow = rows[focusedIndex];

	const toggleSelected = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const promoteIds = useCallback(
		async (ids: string[]) => {
			if (ids.length === 0) return;
			setIsProcessing(true);
			const result = await promoteStagingArticles(projectId, ids);
			if (result.success) {
				toast.success(t("toastPromoteSuccess", { count: result.data.promotedCount }));
				await loadPending();
			} else {
				toast.error(result.error);
			}
			setIsProcessing(false);
		},
		[projectId, loadPending, t],
	);

	const discardIds = useCallback(
		async (ids: string[]) => {
			if (ids.length === 0) return;
			setIsProcessing(true);
			const result = await discardStagingArticles(projectId, ids);
			if (result.success) {
				toast.success(t("toastDiscardSuccess", { count: result.data.discardedCount }));
				await loadPending();
			} else {
				toast.error(result.error);
			}
			setIsProcessing(false);
		},
		[projectId, loadPending, t],
	);

	// Atajos de teclado: A promueve el foco actual, X lo descarta, S/↓
	// avanza, ↑ retrocede. Se ignoran mientras se está procesando o si el
	// foco está en un input de texto.
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
			if (isProcessing || !focusedRow) return;

			if (e.key === "a" || e.key === "A") {
				e.preventDefault();
				promoteIds([focusedRow.id]);
			} else if (e.key === "x" || e.key === "X") {
				e.preventDefault();
				discardIds([focusedRow.id]);
			} else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
				e.preventDefault();
				setFocusedIndex((i) => Math.min(i + 1, rows.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setFocusedIndex((i) => Math.max(i - 1, 0));
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [focusedRow, isProcessing, promoteIds, discardIds, rows.length]);

	const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<SustratoLoadingLogo showText text={t("loadingStaging")} />
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<StandardCard>
				<StandardCard.Content>
					<div className="py-12 text-center space-y-2">
						<StandardText size="lg" weight="medium">
							{t("noPendingArticles")}
						</StandardText>
						<StandardText size="sm" colorScheme="secondary">
							{t("runSearchHint")}
						</StandardText>
					</div>
				</StandardCard.Content>
			</StandardCard>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between flex-wrap gap-2">
				<StandardText size="sm" colorScheme="secondary">
					{t("pendingCountPrefix", { count: rows.length })} <b>A</b> {t("shortcutPromote")} <b>X</b>{" "}
					{t("shortcutDiscard")} <b>S</b>/↓ {t("shortcutNext")} ↑ {t("shortcutPrev")}
				</StandardText>
				<div className="flex items-center gap-2">
					<StandardButton
						size="sm"
						styleType="outline"
						leftIcon={RefreshCw}
						onClick={loadPending}
						disabled={isProcessing}
					>
						{t("refreshButton")}
					</StandardButton>
					<StandardButton
						size="sm"
						colorScheme="danger"
						styleType="outline"
						leftIcon={X}
						onClick={() => discardIds(selectedIdsArray)}
						disabled={isProcessing || selectedIdsArray.length === 0}
					>
						{t("discardSelectedButton", { count: selectedIdsArray.length })}
					</StandardButton>
					<StandardButton
						size="sm"
						leftIcon={Check}
						onClick={() => promoteIds(selectedIdsArray)}
						disabled={isProcessing || selectedIdsArray.length === 0}
					>
						{t("promoteSelectedButton", { count: selectedIdsArray.length })}
					</StandardButton>
				</div>
			</div>

			<div className="space-y-2">
				{rows.map((row, index) => {
					const isFocused = index === focusedIndex;
					return (
						<StandardCard
							key={row.id}
							className={
								isFocused ?
									"ring-2 ring-primary-pure"
								:	undefined
							}
							onClick={() => setFocusedIndex(index)}
						>
							<StandardCard.Content className="py-3">
								<div className="flex items-start gap-3">
									<div className="pt-1">
										<StandardCheckbox
											checked={selectedIds.has(row.id)}
											onChange={() => toggleSelected(row.id)}
											onClick={(e) => e.stopPropagation()}
										/>
									</div>
									<div className="flex-1 min-w-0 space-y-1">
										<div className="flex items-center gap-2 flex-wrap">
											<StandardText weight="medium" className="line-clamp-2">
												{row.title || t("untitled")}
											</StandardText>
											{row.is_oa && (
												<StandardBadge colorScheme="success" styleType="subtle" size="sm">
													<Unlock className="h-3 w-3 mr-1" /> {t("openAccessBadge")}
												</StandardBadge>
											)}
											{row.is_oa === false && (
												<StandardBadge colorScheme="neutral" styleType="subtle" size="sm">
													<Lock className="h-3 w-3 mr-1" /> {t("closedBadge")}
												</StandardBadge>
											)}
										</div>
										<StandardText size="sm" colorScheme="secondary" className="line-clamp-1">
											{(row.authors ?? []).join(", ") || t("unknownAuthors")}
											{row.publication_year ? ` · ${row.publication_year}` : ""}
											{row.journal ? ` · ${row.journal}` : ""}
										</StandardText>
										<StandardText size="xs" colorScheme="neutral" className="line-clamp-2">
											{row.abstract || t("noAbstractAvailable")}
										</StandardText>
										<div className="flex items-center gap-3 pt-1">
											{row.doi && (
												<a
													href={`https://doi.org/${row.doi}`}
													target="_blank"
													rel="noopener noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="inline-flex items-center gap-1 text-xs text-primary-pure hover:underline"
												>
													<LinkIcon className="h-3 w-3" /> {t("doiLink")}
												</a>
											)}
											<StandardText size="xs" colorScheme="neutral">
												{t("citationsCount", { count: row.cited_by_count ?? 0 })}
											</StandardText>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<StandardButton
											size="sm"
											styleType="outline"
											colorScheme="danger"
											iconOnly
											leftIcon={X}
											onClick={(e) => {
												e.stopPropagation();
												discardIds([row.id]);
											}}
											disabled={isProcessing}
										/>
										<StandardButton
											size="sm"
											iconOnly
											leftIcon={Check}
											onClick={(e) => {
												e.stopPropagation();
												promoteIds([row.id]);
											}}
											disabled={isProcessing}
										/>
									</div>
								</div>
							</StandardCard.Content>
						</StandardCard>
					);
				})}
			</div>
		</div>
	);
}
//#endregion ![main]
