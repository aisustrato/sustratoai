// 📍 app/cognetica/minotauro/[universeId]/galaxy/[galaxyId]/components/ProcessWithAIDialog.tsx
// 🎯 PROPÓSITO: Diálogo simplificado - solo muestra artefactos seleccionados y sus tokens

"use client";

import { useState, useMemo, useEffect } from "react";
import { StandardPopupWindow } from "@/components/ui/StandardPopupWindow";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Check, X, Sparkles, FileText } from "lucide-react";
import { estimateTokens } from "@/lib/utils/token-estimator";
import type {
	CuratedSourceWithDetails,
	ArchetypeTone,
} from "@/lib/types/minotauro-types";

interface ProcessWithAIDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	galaxyTitle: string;
	sources: CuratedSourceWithDetails[];
	artifactsContent?: Record<string, { text: string; charCount: number }>;
	isLoadingContent?: boolean;
	archetype: ArchetypeTone;
	isProcessing?: boolean;
	// Nuevos props para versiones y palabras recomendadas
	currentContent?: string;
	previousVersions?: Array<{
		version: number;
		content: string;
		origen: string;
	}>;
	recommendedWords?: number;
}

// Color/emoji de arquetipo
function getArquetipoVisual(archetype: ArchetypeTone) {
	const map: Record<
		string,
		{
			emoji: string;
			nombre: string;
			color:
				| "warning"
				| "primary"
				| "success"
				| "accent"
				| "tertiary"
				| "neutral";
		}
	> = {
		micelio: { emoji: "🍄", nombre: "Micelio", color: "success" },
		deslixador: { emoji: "🛠️", nombre: "Deslixador", color: "neutral" },
		polinizador: { emoji: "🌸", nombre: "Polinizador", color: "success" },
		dedalo: { emoji: "🏛️", nombre: "Dédalo", color: "primary" },
		bufon: { emoji: "🃏", nombre: "Bufón", color: "warning" },
		cronos: { emoji: "⏳", nombre: "Cronos", color: "tertiary" },
		colega: { emoji: "☕", nombre: "Colega", color: "accent" },
	};
	return map[archetype] || { emoji: "🤖", nombre: archetype, color: "primary" };
}

function formatTokens(n: number): string {
	return n.toLocaleString("es-ES");
}

function calcTokens(text?: string | null): number {
	if (!text) return 0;
	return estimateTokens(text);
}

export function ProcessWithAIDialog({
	isOpen,
	onClose,
	onConfirm,
	galaxyTitle,
	sources,
	artifactsContent = {},
	isLoadingContent = false,
	archetype,
	isProcessing = false,
	currentContent = "",
	previousVersions = [],
	recommendedWords = 400,
}: ProcessWithAIDialogProps) {
	const arquetipo = getArquetipoVisual(archetype);

	// Todos los artefactos seleccionados por defecto
	const selectedArtifacts = sources;

	// Tokens por artefacto - usa el contenido real (transcripción) si está disponible
	const artifactsWithTokens = useMemo(() => {
		return selectedArtifacts.map((s) => {
			const artifactId = s.source.artifact_id;
			const realContent = artifactId ? artifactsContent[artifactId] : null;
			const contentTokens =
				realContent ?
					calcTokens(realContent.text)
				:	calcTokens(s.source.content_excerpt);
			const titleTokens = calcTokens(
				s.artifact?.title || s.chat_session?.session_title,
			);
			return {
				...s,
				contentTokens,
				titleTokens,
				totalTokens: contentTokens + titleTokens,
				hasRealContent: !!realContent?.text,
				charCount: realContent?.charCount || 0,
			};
		});
	}, [selectedArtifacts, artifactsContent]);

	// Tokens de versiones
	const versionsTokens = useMemo(() => {
		const current = calcTokens(currentContent);
		const previous = previousVersions.map((v) => ({
			version: v.version,
			tokens: calcTokens(v.content),
			origen: v.origen,
		}));
		return {
			current,
			previous,
			total: current + previous.reduce((sum, v) => sum + v.tokens, 0),
		};
	}, [currentContent, previousVersions]);

	// Totales
	const totals = useMemo(() => {
		const artifactsTotal = artifactsWithTokens.reduce(
			(sum, a) => sum + a.totalTokens,
			0,
		);
		const input = artifactsTotal + versionsTokens.total;
		return {
			artifacts: artifactsTotal,
			versions: versionsTokens.total,
			input,
			output: Math.ceil(input * 0.3),
		};
	}, [artifactsWithTokens, versionsTokens]);

	// Diálogo directo con tokens
	return (
		<StandardPopupWindow
			open={isOpen}
			onOpenChange={(open: boolean) => !open && onClose()}>
			<StandardPopupWindow.Content size="lg" colorScheme={arquetipo.color}>
				<StandardPopupWindow.Header>
					<div className="flex items-center gap-3">
						<span className="text-3xl">{arquetipo.emoji}</span>
						<div>
							<StandardPopupWindow.Title>
								Procesar con {arquetipo.nombre}
							</StandardPopupWindow.Title>
							<p className="text-sm text-muted-foreground">
								{artifactsWithTokens.length} artefactos •{" "}
								{formatTokens(totals.input)} tokens input
							</p>
						</div>
					</div>
				</StandardPopupWindow.Header>

				<StandardPopupWindow.Body className="space-y-4">
					{/* Sección y meta de palabras */}
					<div className="p-3 bg-muted/30 rounded-lg">
						<p className="text-sm text-muted-foreground">
							Sección:{" "}
							<span className="font-medium text-foreground">{galaxyTitle}</span>
						</p>
						<p className="text-xs text-primary mt-1">
							📝 Meta recomendada: {recommendedWords} palabras por sección
						</p>
					</div>

					{/* Lista de artefactos con tokens */}
					<div className="space-y-2">
						<p className="text-sm font-medium">Artefactos incluidos:</p>
						{artifactsWithTokens.map((item, i) => (
							<div key={item.source.id} className="p-3 bg-muted rounded-lg">
								<div className="flex justify-between items-center">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<span className="text-sm text-muted-foreground shrink-0">
											{i + 1}.
										</span>
										<span className="font-medium text-sm truncate">
											{item.artifact?.title ||
												item.chat_session?.session_title ||
												"Sin título"}
										</span>
										{item.hasRealContent && (
											<span className="text-[10px] text-success shrink-0">
												✓ transcripción
											</span>
										)}
									</div>
									<StandardBadge
										size="sm"
										colorScheme={item.hasRealContent ? "primary" : "neutral"}>
										{formatTokens(item.totalTokens)} tokens
									</StandardBadge>
								</div>
								{item.hasRealContent && (
									<p className="text-[10px] text-muted-foreground mt-1 pl-5">
										{item.charCount.toLocaleString("es-ES")} caracteres
									</p>
								)}
							</div>
						))}
					</div>

					{/* Versiones anteriores */}
					{previousVersions.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium">
								Versiones anteriores incluidas:
							</p>
							<div className="space-y-1">
								{versionsTokens.previous.map((v) => (
									<div
										key={v.version}
										className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs">
										<span>
											v{v.version} (
											{v.origen === "humano" ? "📝 Humano" : "🤖 IA"})
										</span>
										<StandardBadge size="xs" colorScheme="neutral">
											{formatTokens(v.tokens)} tokens
										</StandardBadge>
									</div>
								))}
								<div className="flex justify-between items-center p-2 bg-primary/10 rounded text-xs font-medium">
									<span>Versión actual</span>
									<StandardBadge size="xs" colorScheme="primary">
										{formatTokens(versionsTokens.current)} tokens
									</StandardBadge>
								</div>
							</div>
						</div>
					)}

					{/* Resumen de tokens */}
					<div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<p className="text-xs text-muted-foreground">Artefactos</p>
								<p className="text-lg font-semibold">
									{formatTokens(totals.artifacts)}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Versiones</p>
								<p className="text-lg font-semibold">
									{formatTokens(totals.versions)}
								</p>
							</div>
							<div>
								<p className="text-xs text-primary">Total Input</p>
								<p className="text-lg font-semibold text-primary">
									{formatTokens(totals.input)}
								</p>
							</div>
						</div>
					</div>
				</StandardPopupWindow.Body>

				<StandardPopupWindow.Footer>
					<StandardButton
						colorScheme="neutral"
						onClick={onClose}
						disabled={isProcessing}>
						<X className="w-4 h-4 mr-2" />
						Cancelar
					</StandardButton>
					<div className="flex-1" />
					<StandardButton
						colorScheme={arquetipo.color}
						onClick={onConfirm}
						disabled={isProcessing}>
						{isProcessing ?
							<>
								<Sparkles className="w-4 h-4 mr-2 animate-spin" />
								Procesando...
							</>
						:	<>
								<Check className="w-4 h-4 mr-2" />
								Confirmar
							</>
						}
					</StandardButton>
				</StandardPopupWindow.Footer>
			</StandardPopupWindow.Content>
		</StandardPopupWindow>
	);
}
