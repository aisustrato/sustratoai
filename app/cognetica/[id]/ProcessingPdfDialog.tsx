//. 📍 app/cognetica/[id]/ProcessingPdfDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import type { ArtefactoCompleto } from "@/lib/cognetica-forense/lecturas-shared";

function playSound(type: "processing" | "success" | "error") {
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);

		if (type === "success") {
			osc.frequency.setValueAtTime(587.33, ctx.currentTime);
			osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12);
			osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24);
			gain.gain.setValueAtTime(0.15, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.5);
		} else if (type === "error") {
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(300, ctx.currentTime);
			osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
			gain.gain.setValueAtTime(0.12, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.4);
		} else {
			osc.frequency.setValueAtTime(440, ctx.currentTime);
			gain.gain.setValueAtTime(0.05, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.15);
		}
	} catch {
		// Ignorar errores de audio
	}
}

interface ProcessingDialogProps {
	artefacto: ArtefactoCompleto["artefacto"];
	contenidoMarkdown: string | null;
}

export function ProcessingDialog({
	artefacto,
	contenidoMarkdown,
}: ProcessingDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [phase, setPhase] = useState<"processing" | "success" | "error" | null>(null);

	const isPdf = artefacto.tipo === "pdf_informe";
	const isAudio = artefacto.tipo === "audio";

	// Solo mostrar durante "ingresado" sin contenido (pre-procesamiento pendiente)
	const isProcessing =
		(isPdf || isAudio) &&
		artefacto.estado === "ingresado" &&
		!contenidoMarkdown;

	const hasFinished =
		(isPdf || isAudio) &&
		Boolean(contenidoMarkdown) &&
		(artefacto.estado === "ingresado" ||
			artefacto.estado === "metabolizando" ||
			artefacto.estado === "metabolizado");

	const hasError =
		(isPdf || isAudio) &&
		artefacto.estado === "error" &&
		!contenidoMarkdown;

	useEffect(() => {
		if (isProcessing) {
			// Iniciar procesamiento
			setIsOpen(true);
			setPhase("processing");
			playSound("processing");
		} else if (phase === "processing") {
			// Estaba procesando y ahora paró — determinar resultado
			if (hasFinished) {
				setPhase("success");
				playSound("success");
				const t = setTimeout(() => setIsOpen(false), 2500);
				return () => clearTimeout(t);
			} else if (hasError) {
				setPhase("error");
				playSound("error");
				// No auto-cerrar en error — el usuario debe ver el mensaje
			} else {
				// Paró sin éxito ni error (ej: usuario clickeó Metabolizar)
				setIsOpen(false);
				setPhase(null);
			}
		}
		// Si phase es success/error y isOpen está cerrado, no hacer nada
	}, [isProcessing, hasFinished, hasError, phase]);

	// Cerrar forzosamente si no hay nada que mostrar
	if (!isPdf && !isAudio) return null;
	if (!isOpen) return null;

	const typeLabel = isPdf ? "PDF" : "Audio";
	const typeIcon = isPdf ? "📄" : "🎙️";
	const currentPhase = phase ?? "processing";

	return (
		<StandardDialog open={isOpen} onOpenChange={(v) => v || setIsOpen(false)}>
			<StandardDialog.Content size="md">
				<StandardDialog.Header>
					<StandardDialog.Title>
						<div className="flex items-center gap-3">
							{currentPhase === "error" ? (
								<AlertCircle className="w-6 h-6 text-red-500" />
							) : currentPhase === "success" ? (
								<CheckCircle2 className="w-6 h-6 text-green-500" />
							) : (
								<Loader2 className="w-6 h-6 animate-spin text-primary-600" />
							)}
							{currentPhase === "error"
								? `Error procesando ${typeLabel}`
								: currentPhase === "success"
									? `${typeLabel} procesado`
									: `Procesando ${typeLabel}`}
						</div>
					</StandardDialog.Title>
					<StandardDialog.Description>
						{currentPhase === "error"
							? artefacto.error_mensaje ?? `No se pudo procesar el ${typeLabel}.`
							: currentPhase === "success"
								? `El ${typeLabel} fue procesado exitosamente.`
								: isAudio
									? "Transcribiendo audio con WhisperX... esto puede tomar unos segundos."
									: "Extrayendo texto con Marker... esto puede tomar unos segundos."}
					</StandardDialog.Description>
				</StandardDialog.Header>

				<StandardDialog.Body>
					{currentPhase === "processing" && (
						<div className="flex flex-col items-center justify-center py-8">
							<div className="relative">
								<Loader2 className="w-16 h-16 animate-spin text-primary-600" />
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-2xl" aria-hidden="true">{typeIcon}</span>
								</div>
							</div>
							<StandardText weight="medium" className="text-center mt-4">
								{isAudio ? "WhisperX está transcribiendo..." : "Marker está trabajando..."}
							</StandardText>
							<StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="text-center mt-1">
								No cierres esta ventana
							</StandardText>
						</div>
					)}

					{currentPhase === "success" && (
						<div className="flex flex-col items-center justify-center py-6">
							<CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
							<StandardText weight="medium" className="text-green-700 text-center">
								✅ {typeLabel} listo para metabolización
							</StandardText>
							<StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="text-center mt-1">
								Cerrando automáticamente...
							</StandardText>
						</div>
					)}

					{currentPhase === "error" && (
						<div className="flex flex-col items-center justify-center py-6">
							<AlertCircle className="w-16 h-16 text-red-500 mb-3" />
							<StandardText weight="medium" className="text-red-700 text-center">
								No se pudo procesar el {typeLabel}
							</StandardText>
							{artefacto.error_mensaje && (
								<StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="text-center mt-1 max-w-sm">
									{artefacto.error_mensaje}
								</StandardText>
							)}
						</div>
					)}
				</StandardDialog.Body>

				<StandardDialog.Footer className="flex justify-end">
					{currentPhase === "error" && (
						<StandardButton
							colorScheme="neutral"
							onClick={() => setIsOpen(false)}
							leftIcon={X}>
							Cerrar
						</StandardButton>
					)}
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
