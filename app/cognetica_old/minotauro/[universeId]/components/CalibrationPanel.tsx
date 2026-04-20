// 📍 app/cognetica_old/minotauro/[universeId]/components/CalibrationPanel.tsx
// 🎯 Panel para calibrar comentarios de arquetipos (nueva arquitectura)

import { useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Check, X, Play } from "lucide-react";
import type { ArchetypeAnalysis } from "@/lib/types/minotauro-append-types";

interface CalibrationPanelProps {
	analysis: ArchetypeAnalysis;
	onCalibrate: (
		commentId: string,
		response: "aceptado" | "aceptado_con_modificaciones" | "rechazado",
		note?: string,
	) => void;
	onExecute: () => void;
	isProcessing?: boolean;
	// Contexto para el dialog de confirmación
	versionActual?: number;
	historialCount?: number;
	fuentesCount?: number;
	estimatedTokens?: number;
	onShowConfirmDialog?: () => void;
}

export function CalibrationPanel({
	analysis,
	onCalibrate,
	onExecute,
	isProcessing = false,
	versionActual,
	historialCount,
	fuentesCount,
	estimatedTokens,
	onShowConfirmDialog,
}: CalibrationPanelProps) {
	const [notes, setNotes] = useState<Record<string, string>>({});

	if (analysis.status === "executed") {
		return null; // No mostrar panel si ya fue ejecutado
	}

	const calibratedComments = analysis.comments.filter(
		(c) => c.respuesta_humano,
	);
	const allCalibrated =
		analysis.comments.length > 0 &&
		analysis.comments.every((c) => c.respuesta_humano);

	return (
		<StandardCard className="p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-sm font-medium">
					🎯 Calibración ({calibratedComments.length}/{analysis.comments.length}
					)
				</h3>
				{allCalibrated && (
					<StandardBadge colorScheme="success" size="sm">
						✅ Listo para ejecutar
					</StandardBadge>
				)}
			</div>

			<div className="space-y-3">
				{analysis.comments.map((comment) => {
					const isCalibrated = !!comment.respuesta_humano;
					const note = notes[comment.id] || comment.nota_humano || "";

					return (
						<StandardCard
							key={comment.id}
							colorScheme={
								isCalibrated ?
									comment.respuesta_humano === "aceptado" ?
										"success"
									:	"danger"
								:	"neutral"
							}
							className="p-3">
							<div className="space-y-2">
								{/* Comentario */}
								<div>
									<div className="font-medium text-sm">{comment.point}</div>
									<div className="text-xs text-muted-foreground mt-1">
										{comment.observation}
									</div>
								</div>

								{/* Respuesta */}
								{isCalibrated ?
									<div className="flex items-center gap-2">
										<StandardBadge
											colorScheme={
												comment.respuesta_humano === "aceptado" ? "success"
												: (
													comment.respuesta_humano ===
													"aceptado_con_modificaciones"
												) ?
													"warning"
												:	"danger"
											}
											size="xs">
											{comment.respuesta_humano === "aceptado" ?
												"✅ Aceptado"
											: (
												comment.respuesta_humano ===
												"aceptado_con_modificaciones"
											) ?
												"✏️ Aceptado con modificaciones"
											:	"❌ Rechazado"}
										</StandardBadge>
										{comment.nota_humano && (
											<span className="text-xs text-muted-foreground">
												&ldquo;{comment.nota_humano}&rdquo;
											</span>
										)}
									</div>
								:	<>
										{/* Nota - Obligatoria para Aceptar con modificaciones y Rechazar */}
										<StandardTextarea
											value={note}
											onChange={(e) =>
												setNotes((prev) => ({
													...prev,
													[comment.id]: e.target.value,
												}))
											}
											placeholder="Comentario (obligatorio para 'Aceptar con modificaciones' y 'Rechazar')"
											rows={2}
											className="text-xs"
										/>

										{/* 3 Botones de calibración */}
										<div className="flex gap-2">
											<StandardButton
												size="xs"
												colorScheme="success"
												onClick={() => {
													onCalibrate(
														comment.id,
														"aceptado",
														note || undefined,
													);
													setNotes((prev) => ({ ...prev, [comment.id]: "" }));
												}}
												leftIcon={Check}>
												✅ Aceptar
											</StandardButton>
											<StandardButton
												size="xs"
												colorScheme="warning"
												onClick={() => {
													if (!note.trim()) {
														alert(
															'⚠️ Debes agregar un comentario para "Aceptar con modificaciones"',
														);
														return;
													}
													onCalibrate(
														comment.id,
														"aceptado_con_modificaciones",
														note,
													);
													setNotes((prev) => ({ ...prev, [comment.id]: "" }));
												}}
												disabled={!note.trim()}>
												✏️ Aceptar con modificaciones
											</StandardButton>
											<StandardButton
												size="xs"
												colorScheme="danger"
												onClick={() => {
													if (!note.trim()) {
														alert(
															'⚠️ Debes agregar un comentario para "Rechazar"',
														);
														return;
													}
													onCalibrate(comment.id, "rechazado", note);
													setNotes((prev) => ({ ...prev, [comment.id]: "" }));
												}}
												leftIcon={X}
												disabled={!note.trim()}>
												❌ Rechazar
											</StandardButton>
										</div>
									</>
								}
							</div>
						</StandardCard>
					);
				})}
			</div>

			{/* Botón ejecutar */}
			{allCalibrated && (
				<div className="mt-4 pt-4 border-t">
					<StandardButton
						colorScheme="primary"
						onClick={() => {
							if (onShowConfirmDialog) {
								onShowConfirmDialog();
							} else {
								onExecute();
							}
						}}
						disabled={isProcessing}
						leftIcon={Play}
						className="w-full">
						{isProcessing ? "Ejecutando..." : "▶️ Ejecutar versión calibrada"}
					</StandardButton>

					{/* Info de contexto */}
					{(versionActual ||
						historialCount ||
						fuentesCount ||
						estimatedTokens) && (
						<div className="mt-3 text-xs text-muted-foreground space-y-1">
							{versionActual && <div>📄 Versión: v{versionActual}</div>}
							{historialCount !== undefined && (
								<div>📚 Historial: {historialCount} interacciones</div>
							)}
							{fuentesCount !== undefined && (
								<div>🔗 Fuentes: {fuentesCount}</div>
							)}
							{estimatedTokens && (
								<div>
									🎯 Tokens estimados: ~
									{estimatedTokens.toLocaleString("es-ES")}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</StandardCard>
	);
}
