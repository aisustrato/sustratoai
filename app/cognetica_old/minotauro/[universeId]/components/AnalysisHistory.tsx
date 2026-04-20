import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ArchetypeTone } from "@/lib/types/minotauro-types";
import { getArchetypeEmoji, getArchetypeName } from "../utils/archetypeHelpers";

interface HistoricalAnalysis {
	archetype: ArchetypeTone;
	status: "pending_calibration" | "calibrated" | "executed";
	comments: Array<{
		id: string;
		point: string;
		observation: string;
	}>;
	tokens: {
		totalTokenCount: number;
		promptTokenCount: number;
		candidatesTokenCount: number;
	};
	timestamp: string;
	timestamp_ejecucion?: string;
	calibracion_humana?: Array<{
		punto: string;
		observacion: string;
		respuesta_humano: string;
		razon: string;
	}>;
	instruccion_final?: string;
	nueva_version_generada?: string;
	tokens_ejecucion?: unknown;
}

interface AnalysisHistoryProps {
	history: HistoricalAnalysis[];
	currentAnalysisIndex: number;
	onSelectAnalysis: (index: number) => void;
}

export function AnalysisHistory({
	history,
	currentAnalysisIndex,
	onSelectAnalysis,
}: AnalysisHistoryProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	if (!history || history.length === 0) {
		return null;
	}

	return (
		<StandardCard colorScheme="neutral" className="p-3 mb-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">
							📚 Historial de Análisis ({history.length})
						</span>
						<StandardBadge colorScheme="accent" size="sm">
							Mostrando #{currentAnalysisIndex + 1}
						</StandardBadge>
					</div>
					<StandardButton
						size="xs"
						colorScheme="neutral"
						styleType="ghost"
						onClick={() => setIsExpanded(!isExpanded)}
						leftIcon={isExpanded ? ChevronUp : ChevronDown}>
						{isExpanded ? "Ocultar" : "Ver Todos"}
					</StandardButton>
				</div>

				{isExpanded && (
					<div className="space-y-2 pt-2 border-t">
						{history.map((analysis, index) => {
							const isCurrent = index === currentAnalysisIndex;
							const date = new Date(analysis.timestamp);
							const formattedDate = date.toLocaleString("es-CL", {
								day: "2-digit",
								month: "short",
								hour: "2-digit",
								minute: "2-digit",
							});

							const hasCalibration =
								analysis.calibracion_humana &&
								analysis.calibracion_humana.length > 0;
							const hasNewVersion = !!analysis.nueva_version_generada;
							const hasInstruction = !!analysis.instruccion_final;

							return (
								<div
									key={index}
									className={`p-3 rounded-lg border cursor-pointer transition-colors ${
										isCurrent ?
											"bg-primary/10 border-primary"
										:	"bg-muted/30 border-transparent hover:border-muted-foreground/30"
									}`}
									onClick={() => onSelectAnalysis(index)}>
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="text-lg">
													{getArchetypeEmoji(analysis.archetype)}
												</span>
												<div>
													<div className="text-sm font-medium">
														{getArchetypeName(analysis.archetype)}
													</div>
													<div className="text-xs text-muted-foreground">
														{formattedDate} • {analysis.comments.length}{" "}
														comentarios
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<StandardBadge
													colorScheme={
														analysis.status === "executed" ? "success"
														: analysis.status === "calibrated" ?
															"primary"
														:	"warning"
													}
													size="xs">
													{analysis.status === "executed" ?
														"✅ Ejecutado"
													: analysis.status === "calibrated" ?
														"📊 Calibrado"
													:	"⏳ Pendiente"}
												</StandardBadge>
												{isCurrent && (
													<StandardBadge colorScheme="accent" size="xs">
														Actual
													</StandardBadge>
												)}
											</div>
										</div>

										{/* Mostrar las 3 fases si están presentes */}
										{analysis.status === "executed" && (
											<div className="text-xs space-y-1 pt-1 border-t">
												<div className="flex items-center gap-1 text-muted-foreground">
													<span>📝</span>
													<span>Comentarios iniciales del arquetipo</span>
												</div>
												{hasCalibration && (
													<div className="flex items-center gap-1 text-muted-foreground">
														<span>👤</span>
														<span>Calibración humana completada</span>
													</div>
												)}
												{hasInstruction && (
													<div className="flex items-center gap-1 text-muted-foreground">
														<span>💬</span>
														<span>Instrucción final proporcionada</span>
													</div>
												)}
												{hasNewVersion && (
													<div className="flex items-center gap-1 text-success">
														<span>🎯</span>
														<span className="font-medium">
															Nueva versión generada por el arquetipo
														</span>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}

				<div className="text-xs text-muted-foreground pt-1">
					💡 Cada vez que procesas con un arquetipo, se guarda en el historial
					sin borrar los anteriores
				</div>
			</div>
		</StandardCard>
	);
}
