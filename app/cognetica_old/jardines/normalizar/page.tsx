"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	X,
	Merge,
	History,
	Search,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardInput } from "@/components/ui/StandardInput";
import { useAuth } from "@/app/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	getSeedsForNormalization,
	previewNormalization,
	normalizeSeed,
	getNormalizationHistory,
	type SeedVariant,
	type NormalizationPreview,
	type NormalizationLog,
} from "@/lib/actions/cognetica-old-normalization-actions";

type ViewMode = "normalizar" | "historial";

function formatDate(d: string): string {
	try {
		return formatDistanceToNow(new Date(d), { addSuffix: true, locale: es });
	} catch {
		return "—";
	}
}

export default function NormalizarPage() {
	const router = useRouter();
	const auth = useAuth();
	const projectId = auth.proyectoActual?.id;

	const [viewMode, setViewMode] = useState<ViewMode>("normalizar");
	const [seeds, setSeeds] = useState<SeedVariant[]>([]);
	const [loadingSeeds, setLoadingSeeds] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	// Selección para fusionar
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [canonicalInput, setCanonicalInput] = useState("");
	const [reason, setReason] = useState("");

	// Preview
	const [preview, setPreview] = useState<NormalizationPreview | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);
	const [previewError, setPreviewError] = useState<string | null>(null);

	// Ejecución
	const [executing, setExecuting] = useState(false);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [execError, setExecError] = useState<string | null>(null);

	// Historial
	const [history, setHistory] = useState<NormalizationLog[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);

	const loadSeeds = useCallback(async () => {
		if (!projectId) return;
		setLoadingSeeds(true);
		const result = await getSeedsForNormalization(projectId);
		if (result.success && result.data) setSeeds(result.data);
		setLoadingSeeds(false);
	}, [projectId]);

	const loadHistory = useCallback(async () => {
		if (!projectId) return;
		setLoadingHistory(true);
		const result = await getNormalizationHistory(projectId);
		if (result.success && result.data) setHistory(result.data);
		setLoadingHistory(false);
	}, [projectId]);

	useEffect(() => {
		loadSeeds();
	}, [loadSeeds]);
	useEffect(() => {
		if (viewMode === "historial") loadHistory();
	}, [viewMode, loadHistory]);

	const filteredSeeds = useMemo(() => {
		const q = searchQuery.toLowerCase();
		return seeds.filter((s) => s.content.toLowerCase().includes(q));
	}, [seeds, searchQuery]);

	const toggleSelect = (content: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(content)) next.delete(content);
			else next.add(content);
			return next;
		});
		// Limpiar preview al cambiar selección
		setPreview(null);
		setPreviewError(null);
		setSuccessMsg(null);
		setExecError(null);
	};

	const selectedList = Array.from(selected);

	// Auto-sugerir canónica: la más usada de las seleccionadas
	useEffect(() => {
		if (selected.size === 0) {
			setCanonicalInput("");
			return;
		}
		const best = seeds
			.filter((s) => selected.has(s.content))
			.sort((a, b) => b.artifact_count - a.artifact_count)[0];
		if (best && !canonicalInput) setCanonicalInput(best.content);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected]);

	const handlePreview = async () => {
		if (!projectId || selectedList.length < 2 || !canonicalInput.trim()) return;
		setLoadingPreview(true);
		setPreviewError(null);
		setPreview(null);
		const result = await previewNormalization(
			projectId,
			selectedList,
			canonicalInput.trim(),
		);
		if (result.success && result.data) setPreview(result.data);
		else setPreviewError(result.error || "Error generando preview");
		setLoadingPreview(false);
	};

	const handleExecute = async () => {
		if (!projectId || !preview) return;
		setExecuting(true);
		setExecError(null);
		setSuccessMsg(null);
		const result = await normalizeSeed(
			projectId,
			preview.source_contents,
			preview.canonical_content,
			reason.trim() || undefined,
		);
		if (result.success) {
			setSuccessMsg(
				`✅ Fusión completada. ${preview.total_affected_artifacts} artefactos actualizados.`,
			);
			setSelected(new Set());
			setCanonicalInput("");
			setReason("");
			setPreview(null);
			loadSeeds();
		} else {
			setExecError(result.error || "Error ejecutando fusión");
		}
		setExecuting(false);
	};

	const clearSelection = () => {
		setSelected(new Set());
		setCanonicalInput("");
		setReason("");
		setPreview(null);
		setPreviewError(null);
		setSuccessMsg(null);
		setExecError(null);
	};

	return (
		<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
						<Merge className="h-6 w-6 text-primary-500" />
						Normalización de Semillas
					</h1>
					<StandardText size="sm" colorScheme="neutral" className="mt-1">
						Fusiona variantes semánticas en una semilla canónica. El historial
						es inmutable.
					</StandardText>
				</div>
				<div className="flex items-center gap-2">
					<StandardButton
						size="sm"
						styleType="outline"
						colorScheme="neutral"
						onClick={() => router.push("/cognetica_old/jardines")}>
						← Jardines
					</StandardButton>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 border-b border-border">
				<button
					onClick={() => setViewMode("normalizar")}
					className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
						viewMode === "normalizar" ?
							"border-primary-500 text-primary-600"
						:	"border-transparent text-neutral-500 hover:text-foreground"
					}`}>
					<Merge className="h-4 w-4" /> Normalizar
				</button>
				<button
					onClick={() => setViewMode("historial")}
					className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
						viewMode === "historial" ?
							"border-primary-500 text-primary-600"
						:	"border-transparent text-neutral-500 hover:text-foreground"
					}`}>
					<History className="h-4 w-4" /> Historial
				</button>
			</div>

			{/* ── Vista: Normalizar ── */}
			{viewMode === "normalizar" && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Panel izquierdo: lista de semillas */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Search className="h-4 w-4 text-neutral-400 flex-shrink-0" />
							<StandardInput
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Buscar semillas..."
								colorScheme="neutral"
								size="sm"
							/>
						</div>

						{selected.size > 0 && (
							<div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
								<StandardText size="xs" colorScheme="primary">
									{selected.size} semilla{selected.size !== 1 ? "s" : ""}{" "}
									seleccionada{selected.size !== 1 ? "s" : ""}
								</StandardText>
								<button
									onClick={clearSelection}
									className="text-neutral-400 hover:text-danger">
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
						)}

						<StandardCard colorScheme="neutral">
							<StandardCard.Content className="p-0">
								{loadingSeeds ?
									<div className="space-y-2 p-4">
										{[1, 2, 3, 4, 5].map((i) => (
											<div
												key={i}
												className="h-8 bg-neutral-100 rounded animate-pulse"
											/>
										))}
									</div>
								: filteredSeeds.length === 0 ?
									<div className="text-center py-8">
										<StandardText size="sm" colorScheme="neutral">
											Sin semillas disponibles
										</StandardText>
									</div>
								:	<div className="max-h-[480px] overflow-y-auto divide-y divide-border">
										{filteredSeeds.map((seed) => {
											const isSel = selected.has(seed.content);
											const isMerged = !!seed.canonical_content;
											return (
												<button
													key={seed.content}
													onClick={() =>
														!isMerged && toggleSelect(seed.content)
													}
													disabled={isMerged}
													className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
														isMerged ? "opacity-40 cursor-default bg-neutral-50"
														: isSel ?
															"bg-primary-50 border-l-2 border-primary-400"
														:	"hover:bg-neutral-50"
													}`}>
													<span className="flex items-center gap-2 min-w-0">
														<span
															className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
																isSel ?
																	"bg-primary-500 border-primary-500"
																:	"border-neutral-300"
															}`}>
															{isSel && (
																<span className="text-white text-xs">✓</span>
															)}
														</span>
														<span className="truncate text-foreground">
															{seed.content}
														</span>
														{isMerged && (
															<span className="text-xs text-neutral-400 flex-shrink-0">
																→ {seed.canonical_content}
															</span>
														)}
													</span>
													<span className="flex-shrink-0 ml-2">
														<StandardBadge
															colorScheme={
																seed.artifact_count >= 3 ? "accent" : "neutral"
															}
															size="xs"
															styleType="subtle">
															{seed.artifact_count} art.
														</StandardBadge>
													</span>
												</button>
											);
										})}
									</div>
								}
							</StandardCard.Content>
						</StandardCard>
					</div>

					{/* Panel derecho: configurar fusión */}
					<div className="space-y-4">
						{selected.size < 2 ?
							<StandardCard colorScheme="neutral">
								<StandardCard.Content>
									<div className="text-center py-8 space-y-2">
										<span className="text-4xl block">🌱</span>
										<StandardText size="sm" colorScheme="neutral">
											Selecciona 2 o más semillas de la lista para fusionarlas
										</StandardText>
									</div>
								</StandardCard.Content>
							</StandardCard>
						:	<>
								{/* Semillas seleccionadas */}
								<StandardCard colorScheme="neutral">
									<StandardCard.Content className="space-y-3">
										<StandardText size="sm" className="font-medium block">
											Semillas a fusionar
										</StandardText>
										<div className="space-y-1.5">
											{selectedList.map((content) => {
												const seed = seeds.find((s) => s.content === content);
												return (
													<div
														key={content}
														className="flex items-center justify-between gap-2 bg-neutral-50 rounded-lg px-3 py-2">
														<span className="text-sm text-foreground truncate">
															🌱 {content}
														</span>
														<div className="flex items-center gap-2 flex-shrink-0">
															<StandardBadge colorScheme="neutral" size="xs">
																{seed?.artifact_count || 0} art.
															</StandardBadge>
															<button
																onClick={() => toggleSelect(content)}
																className="text-neutral-300 hover:text-danger">
																<X className="h-3.5 w-3.5" />
															</button>
														</div>
													</div>
												);
											})}
										</div>
									</StandardCard.Content>
								</StandardCard>

								{/* Semilla canónica */}
								<StandardCard colorScheme="neutral">
									<StandardCard.Content className="space-y-3">
										<div>
											<StandardText
												size="sm"
												className="font-medium block mb-1">
												Semilla canónica resultante{" "}
												<span className="text-danger">*</span>
											</StandardText>
											<StandardText
												size="xs"
												colorScheme="neutral"
												className="mb-2 block">
												Puede ser una de las seleccionadas o un nombre nuevo
											</StandardText>
											<StandardInput
												value={canonicalInput}
												onChange={(e) => {
													setCanonicalInput(e.target.value);
													setPreview(null);
												}}
												placeholder="Ej: Sociología"
												colorScheme="neutral"
											/>
										</div>

										{/* Sugerencias rápidas */}
										<div className="flex flex-wrap gap-1.5">
											{selectedList.map((content) => (
												<button
													key={content}
													onClick={() => {
														setCanonicalInput(content);
														setPreview(null);
													}}
													className={`text-xs px-2 py-1 rounded border transition-colors ${
														canonicalInput === content ?
															"bg-primary-100 border-primary-300 text-primary-700"
														:	"border-neutral-200 text-neutral-500 hover:border-neutral-400"
													}`}>
													{content}
												</button>
											))}
										</div>

										<div>
											<StandardText
												size="sm"
												className="font-medium block mb-1">
												Razón (opcional)
											</StandardText>
											<textarea
												value={reason}
												onChange={(e) => setReason(e.target.value)}
												placeholder="¿Por qué son equivalentes estos conceptos?"
												rows={2}
												className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
											/>
										</div>

										<StandardButton
											colorScheme="primary"
											styleType="outline"
											onClick={handlePreview}
											disabled={!canonicalInput.trim() || loadingPreview}
											className="w-full">
											{loadingPreview ?
												"Calculando..."
											:	"Ver impacto antes de fusionar"}
										</StandardButton>
									</StandardCard.Content>
								</StandardCard>

								{/* Preview */}
								{previewError && (
									<div className="flex items-center gap-2 text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">
										<AlertCircle className="h-4 w-4 flex-shrink-0" />
										{previewError}
									</div>
								)}

								{preview && (
									<StandardCard colorScheme="neutral">
										<StandardCard.Content className="space-y-3">
											<div className="flex items-center gap-2">
												<AlertCircle className="h-4 w-4 text-warning-500 flex-shrink-0" />
												<StandardText size="sm" className="font-medium">
													Impacto de la fusión
												</StandardText>
											</div>

											<div className="bg-neutral-50 rounded-lg p-3 space-y-2 text-sm">
												<div className="flex items-center gap-2">
													<span className="text-neutral-500">Fusionar:</span>
													<div className="flex flex-wrap gap-1">
														{preview.source_contents.map((c) => (
															<span
																key={c}
																className="bg-warning-100 text-warning-800 border border-warning-200 rounded px-1.5 py-0.5 text-xs">
																🌱 {c}
															</span>
														))}
													</div>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-neutral-500">En:</span>
													<span className="bg-primary-100 text-primary-800 border border-primary-200 rounded px-1.5 py-0.5 text-xs font-medium">
														🌱 {preview.canonical_content}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-neutral-500">
														Artefactos afectados:
													</span>
													<span className="font-semibold text-foreground">
														{preview.total_affected_artifacts}
													</span>
												</div>
											</div>

											{preview.artifact_titles.length > 0 && (
												<div className="max-h-32 overflow-y-auto space-y-1">
													{preview.artifact_titles.map((a) => (
														<div
															key={a.id}
															className="text-xs text-neutral-600 flex items-center gap-1.5">
															<span className="text-neutral-400">•</span>
															<span className="truncate">{a.title}</span>
														</div>
													))}
												</div>
											)}

											<div className="text-xs text-neutral-500 bg-blue-50 border border-blue-200 rounded p-2">
												ℹ️ Las semillas originales{" "}
												<strong>no se eliminan</strong>. Quedan marcadas como
												fusionadas (append-only). El historial es inmutable.
											</div>

											{successMsg && (
												<div className="flex items-center gap-2 text-sm text-success bg-green-50 border border-green-200 rounded-lg px-3 py-2">
													<CheckCircle2 className="h-4 w-4 flex-shrink-0" />
													{successMsg}
												</div>
											)}

											{execError && (
												<div className="flex items-center gap-2 text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">
													<AlertCircle className="h-4 w-4 flex-shrink-0" />
													{execError}
												</div>
											)}

											<StandardButton
												colorScheme="primary"
												onClick={handleExecute}
												disabled={executing}
												className="w-full">
												{executing ?
													"Fusionando..."
												:	`Confirmar fusión → "${preview.canonical_content}"`}
											</StandardButton>
										</StandardCard.Content>
									</StandardCard>
								)}

								{successMsg && !preview && (
									<div className="flex items-center gap-2 text-sm text-success bg-green-50 border border-green-200 rounded-lg px-3 py-2">
										<CheckCircle2 className="h-4 w-4 flex-shrink-0" />
										{successMsg}
									</div>
								)}
							</>
						}
					</div>
				</div>
			)}

			{/* ── Vista: Historial ── */}
			{viewMode === "historial" && (
				<div className="space-y-4">
					{loadingHistory ?
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-24 bg-neutral-100 rounded-xl animate-pulse"
								/>
							))}
						</div>
					: history.length === 0 ?
						<StandardCard colorScheme="neutral">
							<StandardCard.Content>
								<div className="text-center py-8">
									<span className="text-4xl block mb-2">📜</span>
									<StandardText size="sm" colorScheme="neutral">
										Sin normalizaciones registradas aún
									</StandardText>
								</div>
							</StandardCard.Content>
						</StandardCard>
					:	history.map((log) => (
							<StandardCard key={log.id} colorScheme="neutral">
								<StandardCard.Content className="space-y-3">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												{log.source_contents.map((c) => (
													<span
														key={c}
														className="text-xs bg-warning-100 text-warning-800 border border-warning-200 rounded px-1.5 py-0.5">
														🌱 {c}
													</span>
												))}
												<span className="text-neutral-400 text-xs">→</span>
												<span className="text-xs bg-primary-100 text-primary-800 border border-primary-200 rounded px-1.5 py-0.5 font-medium">
													🌱 {log.canonical_content}
												</span>
											</div>
											{log.reason && (
												<p className="text-xs text-neutral-500 mt-1.5 italic">
													&ldquo;{log.reason}&rdquo;
												</p>
											)}
										</div>
										<div className="flex-shrink-0 text-right">
											<StandardBadge colorScheme="neutral" size="xs">
												{log.affected_rows} registros
											</StandardBadge>
											<p className="text-xs text-neutral-400 mt-1">
												{formatDate(log.created_at)}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-3 text-xs text-neutral-500">
										<span>
											{log.affected_artifact_ids.length} artefacto
											{log.affected_artifact_ids.length !== 1 ? "s" : ""}{" "}
											afectado
											{log.affected_artifact_ids.length !== 1 ? "s" : ""}
										</span>
										<span className="text-neutral-300">•</span>
										<span className="font-mono text-neutral-400">
											{log.id.slice(0, 8)}…
										</span>
									</div>
								</StandardCard.Content>
							</StandardCard>
						))
					}
				</div>
			)}
		</div>
	);
}
