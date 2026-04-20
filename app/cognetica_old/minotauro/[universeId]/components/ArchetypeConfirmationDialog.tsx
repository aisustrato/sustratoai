"use client";

import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import type { ArtifactTokenData } from "../galaxy/[galaxyId]/components/ArtifactTokenBreakdown";

export interface SelectedArtifactForDialog {
	artifactId: string;
	artifactTitle: string;
	artifactNumber: number;
	selectedElements: {
		transcripcion?: boolean;
		ensayo_destilado?: boolean;
		elementos_cognitivos?: boolean;
		datos_cronologicos?: boolean;
		metabolizacion_micelio?: boolean;
		chat_calibrador?: boolean;
	};
	tokenBreakdown: ArtifactTokenData;
	totalSelectedTokens: number;
}

export interface PreviousIteration {
	archetype: string;
	timestamp: string;
	sentido: string;
	observationsCount: number;
	calibration: string;
	tokens: number;
}

interface ArchetypeConfirmationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	archetypeName: string;
	selectedArtifacts: SelectedArtifactForDialog[];
	previousIterations: PreviousIteration[];
	currentText: string;
	currentTextTokens: number;
	currentVersion: number;
}

const ELEMENT_LABELS = {
	transcripcion: "📝 Transcripción",
	ensayo_destilado: "📖 Ensayo Destilado",
	elementos_cognitivos: "🧠 Cognitivos",
	datos_cronologicos: "📅 Cronológicos",
	metabolizacion_micelio: "🍄 Micelio",
	chat_calibrador: "💬 Chat",
};

export function ArchetypeConfirmationDialog({
	isOpen,
	onClose,
	onConfirm,
	archetypeName,
	selectedArtifacts,
	previousIterations,
	currentText,
	currentTextTokens,
	currentVersion,
}: ArchetypeConfirmationDialogProps) {
	const totalArtifactsTokens = selectedArtifacts.reduce(
		(sum, artifact) => sum + artifact.totalSelectedTokens,
		0,
	);

	const totalIterationsTokens = previousIterations.reduce(
		(sum, iteration) => sum + iteration.tokens,
		0,
	);

	const grandTotal =
		totalArtifactsTokens + totalIterationsTokens + currentTextTokens;

	return (
		<StandardDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<StandardDialog.Content size="lg">
				<StandardDialog.Header>
					<StandardDialog.Title>
						🎯 Resumen de Datos a Enviar al Arquetipo
					</StandardDialog.Title>
				</StandardDialog.Header>
				<div className="space-y-6">
					{/* Arquetipo */}
					<div>
						<div className="flex items-center gap-2 mb-2">
							<span className="text-sm font-semibold text-muted-foreground">
								Arquetipo:
							</span>
							<StandardBadge colorScheme="primary" size="md" styleType="solid">
								{archetypeName}
							</StandardBadge>
						</div>
					</div>

					{/* Artefactos Seleccionados */}
					{selectedArtifacts.length > 0 && (
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-bold text-foreground">
									📚 ARTEFACTOS SELECCIONADOS
								</h3>
								<StandardBadge
									colorScheme="primary"
									size="sm"
									styleType="subtle">
									{totalArtifactsTokens.toLocaleString("es-ES")} tokens
								</StandardBadge>
							</div>

							<div className="space-y-3">
								{selectedArtifacts.map((artifact) => {
									const selectedElementsList = Object.entries(
										artifact.selectedElements,
									)
										.filter(([_, isSelected]) => isSelected)
										.map(([key]) => key as keyof typeof ELEMENT_LABELS);

									const excludedElementsList = Object.entries(
										artifact.selectedElements,
									)
										.filter(([_, isSelected]) => !isSelected)
										.map(([key]) => key as keyof typeof ELEMENT_LABELS);

									return (
										<div
											key={artifact.artifactId}
											className="p-3 bg-muted/30 rounded-lg border border-border">
											<div className="flex items-start justify-between mb-2">
												<div className="flex-1">
													<p className="text-sm font-semibold text-foreground">
														#{artifact.artifactNumber} {artifact.artifactTitle}
													</p>
												</div>
												<StandardBadge
													colorScheme="primary"
													size="xs"
													styleType="subtle">
													{artifact.totalSelectedTokens.toLocaleString("es-ES")}{" "}
													tokens
												</StandardBadge>
											</div>

											{/* Elementos incluidos */}
											{selectedElementsList.length > 0 && (
												<div className="space-y-1 mb-2">
													{selectedElementsList.map((key) => {
														const tokens = artifact.tokenBreakdown[key] || 0;
														return (
															<div
																key={key}
																className="flex items-center justify-between text-xs">
																<span className="text-success flex items-center gap-1">
																	✅ {ELEMENT_LABELS[key]}
																</span>
																<span className="text-muted-foreground">
																	{tokens.toLocaleString("es-ES")} tokens
																</span>
															</div>
														);
													})}
												</div>
											)}

											{/* Elementos excluidos */}
											{excludedElementsList.length > 0 && (
												<div className="space-y-1 pt-2 border-t border-border/50">
													{excludedElementsList.map((key) => {
														const tokens = artifact.tokenBreakdown[key] || 0;
														return (
															<div
																key={key}
																className="flex items-center justify-between text-xs opacity-60">
																<span className="text-muted-foreground flex items-center gap-1">
																	❌ {ELEMENT_LABELS[key]}
																</span>
																<span className="text-muted-foreground">
																	{tokens.toLocaleString("es-ES")} tokens
																	(excluido)
																</span>
															</div>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Historial de Iteraciones Previas */}
					{previousIterations.length > 0 && (
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-bold text-foreground">
									📝 HISTORIAL DE ITERACIONES PREVIAS
								</h3>
								<StandardBadge
									colorScheme="accent"
									size="sm"
									styleType="subtle">
									{totalIterationsTokens.toLocaleString("es-ES")} tokens
								</StandardBadge>
							</div>

							<div className="space-y-2">
								{previousIterations.map((iteration, idx) => (
									<div
										key={idx}
										className="p-3 bg-accent/5 rounded-lg border border-accent/20">
										<div className="flex items-start justify-between mb-1">
											<div className="flex-1">
												<p className="text-sm font-semibold text-foreground">
													Iteración {idx + 1} - {iteration.archetype}
												</p>
												<p className="text-xs text-muted-foreground">
													{new Date(iteration.timestamp).toLocaleDateString(
														"es-ES",
														{
															year: "numeric",
															month: "short",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</p>
											</div>
											<StandardBadge
												colorScheme="accent"
												size="xs"
												styleType="subtle">
												{iteration.tokens.toLocaleString("es-ES")} tokens
											</StandardBadge>
										</div>
										<div className="space-y-1 text-xs">
											<p className="text-muted-foreground">
												<span className="font-medium">Sentido:</span>{" "}
												{iteration.sentido}
											</p>
											<p className="text-muted-foreground">
												<span className="font-medium">Observaciones:</span>{" "}
												{iteration.observationsCount}
											</p>
											<p className="text-muted-foreground line-clamp-2">
												<span className="font-medium">Calibración:</span>{" "}
												{iteration.calibration}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Texto Original Actual */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-bold text-foreground">
								📄 TEXTO ORIGINAL ACTUAL
							</h3>
							<StandardBadge
								colorScheme="secondary"
								size="sm"
								styleType="subtle">
								{currentTextTokens.toLocaleString("es-ES")} tokens
							</StandardBadge>
						</div>

						<div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
							<p className="text-xs text-muted-foreground mb-2">
								<span className="font-medium">Versión:</span> {currentVersion}
							</p>
							<p className="text-xs text-muted-foreground mb-2">
								<span className="font-medium">Palabras:</span>{" "}
								{currentText.split(/\s+/).length.toLocaleString("es-ES")}
							</p>
							<div className="max-h-32 overflow-y-auto">
								<p className="text-xs text-muted-foreground line-clamp-6">
									{currentText.substring(0, 500)}
									{currentText.length > 500 && "..."}
								</p>
							</div>
						</div>
					</div>

					{/* Total General */}
					<div className="pt-4 border-t-2 border-border">
						<div className="flex items-center justify-between">
							<span className="text-base font-bold text-foreground">
								💰 TOTAL GENERAL
							</span>
							<div className="flex items-center gap-2">
								<span className="text-lg font-bold text-primary">
									{grandTotal.toLocaleString("es-ES")}
								</span>
								<span className="text-sm text-muted-foreground">
									/ 130,000 tokens
								</span>
								<StandardBadge
									colorScheme={grandTotal > 130000 ? "danger" : "success"}
									size="md"
									styleType="solid">
									{((grandTotal / 130000) * 100).toFixed(1)}%
								</StandardBadge>
							</div>
						</div>
					</div>

					{/* Botones */}
					<div className="flex items-center justify-end gap-3 pt-4">
						<StandardButton
							onClick={onClose}
							colorScheme="neutral"
							styleType="outline"
							size="md">
							Cancelar
						</StandardButton>
						<StandardButton
							onClick={onConfirm}
							colorScheme="primary"
							styleType="solid"
							size="md"
							disabled={grandTotal > 130000}>
							Enviar al Arquetipo
						</StandardButton>
					</div>
				</div>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
