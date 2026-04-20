// 📍 app/cognetica_old/minotauro/[universeId]/components/ArchetypeTimeline.tsx
// 🎯 Timeline cronológico de análisis de arquetipos (append-only)

import { useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import type { ArchetypeAnalysis } from "@/lib/types/minotauro-append-types";
import { getArchetypeEmoji, getArchetypeName } from "../utils/archetypeHelpers";

interface ArchetypeTimelineProps {
	analisis: ArchetypeAnalysis[];
	onSelectAnalysis: (analysisId: string) => void;
	onViewVersion: (version: number) => void;
}

export function ArchetypeTimeline({
	analisis,
	onSelectAnalysis: _unused,
	onViewVersion,
}: ArchetypeTimelineProps) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	if (!analisis || analisis.length === 0) {
		return (
			<StandardCard className="p-6 text-center text-muted-foreground">
				<p>No hay análisis de arquetipos aún</p>
				<p className="text-xs mt-2">
					Procesa el texto con un arquetipo para comenzar
				</p>
			</StandardCard>
		);
	}

	const toggleExpanded = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	// Ordenar por timestamp (más reciente primero)
	const sortedAnalisis = [...analisis].sort(
		(a, b) =>
			new Date(b.timestamp_analisis).getTime() -
			new Date(a.timestamp_analisis).getTime(),
	);

	return (
		<StandardCard className="p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-sm font-medium">
					📚 Historial de Arquetipos ({analisis.length})
				</h3>
				<span className="text-xs text-muted-foreground">
					Cronológico (más reciente primero)
				</span>
			</div>

			<div className="space-y-3">
				{sortedAnalisis.map((analysis) => {
					const isExpanded = expandedIds.has(analysis.id);
					const statusConfig = {
						pending_calibration: {
							color: "warning" as const,
							label: "⏳ Pendiente calibración",
							emoji: "⏳",
						},
						calibrated: {
							color: "primary" as const,
							label: "📊 Calibrado",
							emoji: "📊",
						},
						executed: {
							color: "success" as const,
							label: "✅ Ejecutado",
							emoji: "✅",
						},
					};
					const status = statusConfig[analysis.status];

					return (
						<StandardCard
							key={analysis.id}
							colorScheme="neutral"
							className="p-3">
							{/* Header */}
							<div className="flex items-start justify-between gap-3">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-lg">
											{getArchetypeEmoji(analysis.archetype)}
										</span>
										<span className="font-medium text-sm">
											{getArchetypeName(analysis.archetype)}
										</span>
										<StandardBadge colorScheme={status.color} size="xs">
											{status.label}
										</StandardBadge>
									</div>

									<div className="text-xs text-muted-foreground space-y-1">
										<div>
											v{analysis.version_entrada} →{" "}
											{analysis.version_salida ?
												`v${analysis.version_salida}`
											:	"(sin ejecutar)"}
										</div>
										<div>
											{new Date(analysis.timestamp_analisis).toLocaleString(
												"es-CL",
												{
													day: "2-digit",
													month: "short",
													hour: "2-digit",
													minute: "2-digit",
												},
											)}
										</div>
									</div>

									{/* Sentido */}
									{analysis.sentido && (
										<div className="mt-2 p-2 bg-accent/10 rounded text-xs">
											<span className="font-medium">🎯 Sentido:</span>{" "}
											{analysis.sentido}
										</div>
									)}
								</div>

								{/* Acciones */}
								<div className="flex flex-col gap-1">
									{analysis.version_salida && (
										<StandardButton
											size="xs"
											colorScheme="primary"
											styleType="ghost"
											onClick={() => onViewVersion(analysis.version_salida!)}
											leftIcon={Eye}>
											Ver texto
										</StandardButton>
									)}
									<StandardButton
										size="xs"
										colorScheme="neutral"
										styleType="ghost"
										onClick={() => toggleExpanded(analysis.id)}
										leftIcon={isExpanded ? ChevronUp : ChevronDown}>
										{isExpanded ? "Ocultar" : "Ver más"}
									</StandardButton>
								</div>
							</div>

							{/* Detalles expandidos */}
							{isExpanded && (
								<div className="mt-3 pt-3 border-t space-y-3">
									{/* Comentarios */}
									<div>
										<div className="text-xs font-medium mb-2">
											💬 Comentarios ({analysis.comments.length})
										</div>
										<div className="space-y-2">
											{analysis.comments.map((comment) => (
												<div
													key={comment.id}
													className="p-2 bg-muted/30 rounded text-xs">
													<div className="font-medium">{comment.point}</div>
													<div className="text-muted-foreground mt-1">
														{comment.observation}
													</div>
													{comment.respuesta_humano && (
														<div className="mt-2 flex items-center gap-2">
															<StandardBadge size="xs" colorScheme="accent">
																{comment.respuesta_humano}
															</StandardBadge>
															{comment.nota_humano && (
																<span className="text-muted-foreground">
																	&ldquo;{comment.nota_humano}&rdquo;
																</span>
															)}
														</div>
													)}
												</div>
											))}
										</div>
									</div>

									{/* Instrucción final */}
									{analysis.instruccion_final && (
										<div>
											<div className="text-xs font-medium mb-1">
												💬 Instrucción Final
											</div>
											<div className="p-2 bg-primary/10 rounded text-xs">
												{analysis.instruccion_final}
											</div>
										</div>
									)}

									{/* Tokens */}
									<div className="text-xs text-muted-foreground">
										🔢 Tokens: {analysis.tokens.totalTokenCount} total (
										{analysis.tokens.promptTokenCount} prompt +{" "}
										{analysis.tokens.candidatesTokenCount} respuesta)
									</div>
								</div>
							)}
						</StandardCard>
					);
				})}
			</div>
		</StandardCard>
	);
}
