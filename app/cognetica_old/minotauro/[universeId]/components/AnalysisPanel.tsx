import { useState } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { ChevronUp, ChevronDown, X, Sparkles } from "lucide-react";
import type { ArchetypeTone, HumanResponse } from "@/lib/types/minotauro-types";
import { CalibrationComment } from "./CalibrationComment";
import { getArchetypeEmoji, getArchetypeName } from "../utils/archetypeHelpers";

interface Comment {
	id: string;
	point: string;
	observation: string;
}

interface CalibrationData {
	response?: HumanResponse;
	note?: string;
}

interface AnalysisPanelProps {
	archetype: ArchetypeTone;
	comments: Comment[];
	calibrations: Record<string, CalibrationData>;
	tokens: {
		totalTokenCount: number;
		promptTokenCount: number;
		candidatesTokenCount: number;
	};
	status: "pending_calibration" | "calibrated" | "executed";
	isCollapsed: boolean;
	isProcessing: boolean;
	onToggleCollapse: () => void;
	onCalibrationResponse: (commentId: string, response: HumanResponse) => void;
	onCalibrationNote: (commentId: string, note: string) => void;
	onExecute: (finalInstruction?: string) => void;
	onDismiss: () => void;
	onCopy: () => void;
}

export function AnalysisPanel({
	archetype,
	comments,
	calibrations,
	tokens,
	status,
	isCollapsed,
	isProcessing,
	onToggleCollapse,
	onCalibrationResponse,
	onCalibrationNote,
	onExecute,
	onDismiss,
	onCopy,
}: AnalysisPanelProps) {
	const [finalInstruction, setFinalInstruction] = useState("");
	const calibratedCount = comments.filter(
		(c) => calibrations[c.id]?.response,
	).length;

	return (
		<StandardCard colorScheme="primary" className="p-4">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<StandardButton
							size="xs"
							colorScheme="neutral"
							styleType="ghost"
							onClick={onToggleCollapse}>
							{isCollapsed ?
								<ChevronDown className="w-4 h-4" />
							:	<ChevronUp className="w-4 h-4" />}
						</StandardButton>
						<span className="font-semibold">
							{getArchetypeEmoji(archetype)} Análisis del{" "}
							{getArchetypeName(archetype)}
						</span>
						<StandardBadge
							colorScheme={
								status === "pending_calibration" ? "warning"
								: status === "executed" ?
									"success"
								:	"primary"
							}
							size="xs">
							{status === "pending_calibration" ?
								"Pendiente calibración"
							: status === "executed" ?
								"✅ Ejecutado"
							:	"Calibrado"}
						</StandardBadge>
						{isCollapsed && (
							<span className="text-xs text-muted-foreground">
								{comments.length} comentarios • {tokens.totalTokenCount} tokens
							</span>
						)}
					</div>
					{status !== "executed" && (
						<StandardButton
							size="xs"
							colorScheme="neutral"
							styleType="ghost"
							onClick={onDismiss}>
							<X className="w-4 h-4" />
						</StandardButton>
					)}
				</div>

				{!isCollapsed && (
					<>
						<div className="flex gap-3 text-xs text-muted-foreground">
							<span>📊 {tokens.totalTokenCount} tokens</span>
							<span>📥 {tokens.promptTokenCount} in</span>
							<span>📤 {tokens.candidatesTokenCount} out</span>
							<span>• {comments.length} comentarios</span>
						</div>

						<div className="space-y-4">
							{comments.map((comment, idx) => (
								<CalibrationComment
									key={comment.id}
									index={idx}
									point={comment.point}
									observation={comment.observation}
									currentResponse={calibrations[comment.id]?.response}
									currentNote={calibrations[comment.id]?.note || ""}
									isExecuted={status === "executed"}
									onResponseChange={(response) =>
										onCalibrationResponse(comment.id, response)
									}
									onNoteChange={(note) => onCalibrationNote(comment.id, note)}
								/>
							))}
						</div>

						<div className="text-xs text-muted-foreground">
							📊 Progreso: {calibratedCount}/{comments.length} comentarios
							calibrados
						</div>

						{status !== "executed" && (
							<>
								{/* Campo de Instrucción Final del Humano */}
								<div className="space-y-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
									<label className="text-sm font-medium block">
										💬 Instrucción Final (opcional)
									</label>
									<p className="text-xs text-muted-foreground mb-2">
										Agrega instrucciones específicas para el arquetipo. Ejemplo:
										&ldquo;Reformula esta frase manteniendo el tono
										académico&rdquo; o &ldquo;Recorta 100 palabras sin perder el
										foco en...&rdquo;
									</p>
									<StandardTextarea
										value={finalInstruction}
										onChange={(e) => setFinalInstruction(e.target.value)}
										placeholder="Ej: En base a tu calibración, reformula el párrafo 3 para que sea más conciso..."
										rows={3}
									/>
								</div>

								<div className="flex gap-2">
									<StandardButton
										size="sm"
										colorScheme="success"
										onClick={() => onExecute(finalInstruction)}
										disabled={isProcessing}>
										{isProcessing ?
											<Sparkles className="w-4 h-4 animate-spin" />
										:	"🚀"}{" "}
										Ejecutar Nueva Versión
									</StandardButton>
									<StandardButton
										size="sm"
										colorScheme="neutral"
										onClick={onCopy}>
										📋 Copiar
									</StandardButton>
								</div>
							</>
						)}
					</>
				)}
			</div>
		</StandardCard>
	);
}
