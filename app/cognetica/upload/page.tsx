//. 📍 app/cognetica/upload/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { FileText, FileDown, Presentation, Mic, Video, Image, Loader2 } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardText } from "@/components/ui/StandardText";
import { ingestaArtefactoFromFormData } from "@/lib/actions/cognetica-forense-ingesta-actions";
import type {
	CgtTipoArtefacto,
	ResultErrorCode,
} from "@/lib/cognetica-forense/types";

const MENSAJE_POR_CODIGO: Record<ResultErrorCode, string> = {
	NOT_IMPLEMENTED: "Este tipo de artefacto aún no está implementado.",
	UNAUTHORIZED: "Debes iniciar sesión para subir artefactos.",
	FORBIDDEN: "No tienes permisos sobre este proyecto.",
	NOT_FOUND: "Recurso no encontrado.",
	INVALID_INPUT: "Revisa los campos: título y archivo son obligatorios.",
	DUPLICATE: "Ya existe un artefacto con este mismo contenido en el proyecto.",
	STORAGE_ERROR: "No se pudo guardar el archivo. Reintenta en unos segundos.",
	TRANSCRIPTION_ERROR: "Error al transcribir el archivo.",
	LLM_ERROR: "Error en el modelo de lenguaje.",
	MISSING_UPSTREAM: "Falta un formato previo necesario.",
	THRESHOLD_NOT_MET: "Aún no hay suficientes artefactos previos.",
	INTERNAL: "Error interno. Intenta nuevamente.",
};

interface TipoArtefacto {
	id: CgtTipoArtefacto;
	label: string;
	icon: React.ElementType;
	emoji: string;
	accept: string;
	desc: string;
	disabled: boolean;
}

const TIPOS: TipoArtefacto[] = [
	{
		id: "markdown",
		label: "Markdown",
		icon: FileText,
		emoji: "📝",
		accept: ".md,.markdown,text/markdown,text/plain",
		desc: "Archivos .md",
		disabled: false,
	},
	{
		id: "pdf_informe",
		label: "PDF Informe",
		icon: FileDown,
		emoji: "📄",
		accept: ".pdf,application/pdf",
		desc: "Papers, informes",
		disabled: false,
	},
	{
		id: "pdf_slides",
		label: "PDF Presentación",
		icon: Presentation,
		emoji: "📊",
		accept: ".pdf,application/pdf",
		desc: "Presentaciones, slides",
		disabled: false,
	},
	{
		id: "audio",
		label: "Audio",
		icon: Mic,
		emoji: "🎙️",
		accept: "audio/*,.mp3,.wav,.m4a,.flac,.ogg",
		desc: "MP3, WAV, M4A, FLAC",
		disabled: false,
	},
	{
		id: "video",
		label: "Video",
		icon: Video,
		emoji: "🎬",
		accept: "video/*",
		desc: "Próximamente",
		disabled: true,
	},
	{
		id: "imagen",
		label: "Imagen",
		icon: Image,
		emoji: "🖼️",
		accept: "image/*",
		desc: "Próximamente",
		disabled: true,
	},
];

type UploadStep = "picker" | "uploading";

export default function CogneticaUploadPage() {
	const router = useRouter();
	const { proyectoActual } = useAuth();

	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<UploadStep>("picker");
	const [selectedTipo, setSelectedTipo] = useState<TipoArtefacto | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const proyectoId = proyectoActual?.id ?? null;

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleTipoClick = useCallback((tipo: TipoArtefacto) => {
		if (tipo.disabled) return;
		setSelectedTipo(tipo);
		setErrorMsg(null);
		setTimeout(() => {
			fileInputRef.current?.click();
		}, 80);
	}, []);

	const handleFileInputChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const f = e.target.files?.[0] ?? null;
			if (!f || !selectedTipo || !proyectoId) return;

			setSubmitting(true);
			setStep("uploading");

			const titulo = f.name.replace(/\.[^.]+$/, "");
			const formData = new FormData();
			formData.set("project_id", proyectoId);
			formData.set("tipo", selectedTipo.id);
			formData.set("titulo", titulo);
			formData.set("file", f);

			const result = await ingestaArtefactoFromFormData(formData);

			setSubmitting(false);

			if (!result.ok) {
				setStep("picker");
				setSelectedTipo(null);
				setErrorMsg(MENSAJE_POR_CODIGO[result.error] ?? result.error);
				return;
			}

			router.push(`/cognetica/${result.data.id}`);
		},
		[selectedTipo, proyectoId, router],
	);

	const handleClose = useCallback(() => {
		if (submitting) return;
		setOpen(false);
	}, [submitting]);

	useEffect(() => {
		if (!proyectoId) return;
		setOpen(true);
	}, [proyectoId]);

	const isPdfUpload =
		selectedTipo?.id === "pdf_informe" || selectedTipo?.id === "pdf_slides";

	return (
		<>
			<StandardDialog open={open} onOpenChange={(v) => !v && handleClose()}>
				<StandardDialog.Content size="lg">
					<StandardDialog.Header>
						<StandardDialog.Title>
							{step === "picker"
								? "¿Qué tipo de artefacto quieres subir?"
								: isPdfUpload
									? "Procesando PDF con Marker"
									: "Subiendo artefacto"}
						</StandardDialog.Title>
						<StandardDialog.Description>
							{step === "picker"
								? "Selecciona el formato del documento"
								: isPdfUpload
									? "Extrayendo texto estructurado..."
									: "Un momento..."}
						</StandardDialog.Description>
					</StandardDialog.Header>

					<StandardDialog.Body>
						{step === "picker" && (
							<>
								{errorMsg && (
									<StandardAlert
										colorScheme="danger"
										styleType="subtle"
										message={errorMsg}
										className="mb-4"
									/>
								)}
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
									{TIPOS.map((tipo) => {
										const Icon = tipo.icon;
										return (
											<button
												key={tipo.id}
												type="button"
												disabled={tipo.disabled}
												onClick={() => handleTipoClick(tipo)}
												className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
													tipo.disabled
														? "opacity-40 cursor-not-allowed border-neutral-200 bg-neutral-50"
														: "border-neutral-200 hover:border-primary-500 hover:bg-primary-50 cursor-pointer active:scale-95"
												}`}>
												<span className="text-2xl" aria-hidden="true">
													{tipo.emoji}
												</span>
												<Icon
													className={`w-5 h-5 ${tipo.disabled ? "text-neutral-400" : "text-neutral-600"}`}
												/>
												<div className="text-center">
													<StandardText
														size="sm"
														weight="medium"
														className={
															tipo.disabled ? "text-neutral-400" : "text-neutral-800"
														}>
														{tipo.label}
													</StandardText>
													<StandardText
														size="xs"
														colorScheme="neutral"
														colorShade="subtle">
														{tipo.desc}
													</StandardText>
												</div>
											</button>
										);
									})}
								</div>
							</>
						)}

						{step === "uploading" && (
							<div className="flex flex-col items-center justify-center py-8">
								<Loader2 className="w-16 h-16 animate-spin text-primary-600 mb-4" />
								<StandardText weight="medium" className="text-center">
									{isPdfUpload
										? "Procesando PDF con Marker"
										: "Subiendo archivo"}
								</StandardText>
								<StandardText
									size="xs"
									colorScheme="neutral"
									colorShade="subtle"
									className="text-center mt-1">
									{isPdfUpload
										? "Esto puede tomar unos segundos..."
										: "Un momento..."}
								</StandardText>
							</div>
						)}

						<input
							ref={fileInputRef}
							type="file"
							accept={selectedTipo?.accept ?? ""}
							className="hidden"
							onChange={handleFileInputChange}
						/>
					</StandardDialog.Body>

					<StandardDialog.Footer className="flex justify-between sm:justify-between">
						{step === "picker" && (
							<StandardButton
								type="button"
								styleType="outline"
								colorScheme="neutral"
								onClick={() => router.push("/cognetica")}>
								Cancelar
							</StandardButton>
						)}

						{step === "uploading" && (
							<div />
						)}
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>

			<div className="container mx-auto py-8">
				<StandardAlert
					colorScheme="neutral"
					styleType="subtle"
					message="Si no se abrió el diálogo, selecciona un proyecto primero."
				/>
			</div>
		</>
	);
}
