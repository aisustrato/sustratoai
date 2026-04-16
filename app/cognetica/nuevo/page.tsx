"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileAudio, CheckCircle2 } from "lucide-react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardFileUpload } from "@/components/ui/StandardFileUpload";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { PDFTypeDialog } from "./components/PDFTypeDialog";
import { toast } from "sonner";
import { useAuth } from "@/app/auth-provider";
import {
	createArtifactRecord,
	finalizeUploadAndProcess,
} from "@/lib/actions/cognetica-actions";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { splitPDFIntoPages } from "@/lib/actions/cognetica-presentation-actions";
import { supabase } from "@/app/auth/client";

export default function NuevoArtefactoPage() {
	const router = useRouter();
	const auth = useAuth();
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadStep, setUploadStep] = useState<
		"idle" | "uploading" | "processing" | "splitting" | "completed"
	>("idle");
	const [fileTypeLabel, setFileTypeLabel] = useState<string>("");
	const [fileType, setFileType] = useState<
		| "audio"
		| "video"
		| "markdown"
		| "pdf_report"
		| "pdf_slides"
		| "image"
		| null
	>(null);
	const [showPDFDialog, setShowPDFDialog] = useState(false);
	const [pendingPDFFile, setPendingPDFFile] = useState<File | null>(null);
	const progressRef = useRef<HTMLDivElement>(null);

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile);
	};

	const handlePDFTypeSelect = async (type: "informe" | "presentacion") => {
		// Resolver el Promise con el tipo seleccionado
		const windowWithResolver = window as {
			__pdfTypeResolver?: (type: "informe" | "presentacion" | null) => void;
		};
		if (windowWithResolver.__pdfTypeResolver) {
			windowWithResolver.__pdfTypeResolver?.(type);
			delete windowWithResolver.__pdfTypeResolver;
		}
		setShowPDFDialog(false);
		setPendingPDFFile(null);
	};

	const handlePDFDialogClose = () => {
		// Resolver con null si se cancela
		const windowWithResolver = window as {
			__pdfTypeResolver?: (type: "informe" | "presentacion" | null) => void;
		};
		if (windowWithResolver.__pdfTypeResolver) {
			windowWithResolver.__pdfTypeResolver?.(null);
			delete windowWithResolver.__pdfTypeResolver;
		}
		setShowPDFDialog(false);
		setPendingPDFFile(null);
	};

	const handleUpload = async () => {
		console.log("🚀 [Upload] handleUpload iniciado");

		if (!file) {
			console.log("❌ [Upload] No hay archivo seleccionado");
			return;
		}

		if (!auth.proyectoActual) {
			console.log("❌ [Upload] No hay proyecto seleccionado");
			toast.error("No hay proyecto seleccionado");
			return;
		}

		console.log("✅ [Upload] Validaciones iniciales OK");
		setIsUploading(true);
		setUploadStep("uploading");
		setUploadProgress(0);

		try {
			// 1. Crear registro inicial en DB
			const fileName = file.name;
			console.log("📝 [Upload] Procesando archivo:", fileName);

			// Detectar tipo específico ANTES de subir
			let detectedFileType:
				| "audio"
				| "video"
				| "markdown"
				| "pdf_report"
				| "pdf_slides"
				| "image";
			let mimeType = file.type;

			// Si es PDF, preguntar tipo usando PDFTypeDialog mejorado
			if (file.name.endsWith(".pdf")) {
				mimeType = "application/pdf";
				setFileTypeLabel("PDF");

				// Mostrar dialog mejorado para elegir tipo de PDF
				const pdfType = await new Promise<"informe" | "presentacion" | null>(
					(resolve) => {
						setPendingPDFFile(file);
						setShowPDFDialog(true);

						// Guardar el resolver en una variable temporal
						(
							window as {
								__pdfTypeResolver?: (
									type: "informe" | "presentacion" | null,
								) => void;
							}
						).__pdfTypeResolver = resolve;
					},
				);

				if (!pdfType) {
					console.log("❌ [Upload] Usuario canceló selección de tipo PDF");
					setIsUploading(false);
					setUploadStep("idle");
					return;
				}

				console.log("✅ [Upload] Tipo PDF seleccionado:", pdfType);
				detectedFileType = pdfType === "informe" ? "pdf_report" : "pdf_slides";
				setFileType(detectedFileType);
				setFileTypeLabel(pdfType === "informe" ? "PDF Informe" : "PDF Slides");
			} else if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
				console.log("🔍 [DEBUG] Detectado archivo .md:", {
					fileName,
					fileExtension: fileName.split(".").pop(),
				});
				detectedFileType = "markdown";
				setFileType("markdown");
				mimeType = "text/markdown"; // Forzar MIME type correcto para .md
				setFileTypeLabel("Markdown");
			} else if (file.type.startsWith("video/")) {
				detectedFileType = "video";
				setFileType("video");
				mimeType = file.type;
				setFileTypeLabel("Video");
			} else if (file.type.startsWith("audio/")) {
				console.log("🔍 [DEBUG] Detectado archivo audio:", {
					fileName,
					mimeType: file.type,
				});
				detectedFileType = "audio";
				setFileType("audio");
				mimeType = file.type;
				setFileTypeLabel("Audio");
			} else if (file.type.startsWith("image/")) {
				detectedFileType = "image";
				setFileType("image");
				mimeType = file.type;
				setFileTypeLabel("Imagen");
			} else {
				toast.error("Tipo de archivo no soportado");
				return;
			}

			const fileSize = file.size;
			const fileCreatedAt = new Date(file.lastModified);

			console.log("📁 [Upload] Archivo:", fileName);
			console.log("📁 [Upload] file.type (navegador):", file.type);
			console.log("📁 [Upload] fileType (detectado):", fileType);
			console.log("📁 [Upload] mimeType (final):", mimeType);
			console.log("📁 [Upload] Tamaño:", fileSize, "bytes");
			console.log(
				"📁 [Upload] Fecha creación archivo:",
				fileCreatedAt.toISOString(),
			);

			console.log("📁 [Upload] Creando registro con:", {
				detectedFileType,
				mimeType,
			});

			const recordRes = await createArtifactRecord(
				auth.proyectoActual.id,
				fileName,
				detectedFileType, // ✅ Usar variable local, no el estado
				fileName,
				fileSize,
				mimeType,
				auth.user!.id, // created_by
				fileCreatedAt, // file_created_at
			);

			console.log("📁 [Upload] Resultado de createArtifactRecord:", recordRes);

			if (!recordRes.success || !recordRes.data) {
				throw new Error(recordRes.error || "Error creando registro");
			}

			const artifactId = recordRes.data;
			console.log("✅ [Upload] Artifact ID creado:", artifactId);

			// Sanitizar nombre de archivo para Storage (quitar acentos y caracteres especiales)
			const sanitizeFileName = (name: string) => {
				return name
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "") // Quitar acentos
					.replace(/[^a-zA-Z0-9._-]/g, "_"); // Solo alfanuméricos, punto, guion, underscore
			};
			const safeFileName = sanitizeFileName(fileName);
			const storagePath = `${auth.proyectoActual.id}/${artifactId}/${safeFileName}`;
			console.log("📂 [Upload] Storage path:", storagePath);

			// DEBUG: Verificar sesión antes de subir
			console.log("🔐 [Upload] Verificando sesión...");
			const {
				data: { session },
			} = await supabase.auth.getSession();
			console.log(
				"🔍 [Upload Debug] User:",
				session?.user?.id,
				"Role:",
				session?.user?.role,
			);
			console.log("🔍 [Upload Debug] Path:", storagePath);

			if (!session) {
				console.log("❌ [Upload] Sesión perdida");
				throw new Error(
					"Sesión perdida. Por favor recarga la página e inicia sesión nuevamente.",
				);
			}

			console.log("✅ [Upload] Sesión válida, iniciando upload a Storage...");

			// 2. Subir archivo a Storage con MIME type corregido
			const fileWithCorrectType = new File([file], file.name, {
				type: mimeType,
			});
			const { error: uploadError } = await supabase.storage
				.from("cognetica-files")
				.upload(storagePath, fileWithCorrectType, {
					cacheControl: "3600",
					upsert: false,
				});

			console.log("📤 [Upload] Upload a Storage completado");

			if (uploadError) {
				console.log("❌ [Upload] Error en Storage:", uploadError);
				throw new Error("Error subiendo archivo: " + uploadError.message);
			}

			console.log("✅ [Upload] Archivo subido exitosamente");
			setUploadProgress(100);

			// Scroll automático al progress bar
			setTimeout(() => {
				progressRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			}, 100);

			// Si es PDF slides, mostrar estado de división
			if (detectedFileType === "pdf_slides") {
				setUploadStep("splitting");
				console.log("📊 [Upload] Iniciando división de PDF en páginas...");
			} else {
				setUploadStep("processing");
			}

			// 4. Finalizar y Procesar
			const processRes = await finalizeUploadAndProcess(
				artifactId,
				storagePath,
			);

			if (!processRes.success) {
				toast.error(
					"Subida ok, pero falló inicio de análisis: " + processRes.error,
				);
			} else {
				toast.success("Artefacto cargado y procesando");
			}

			setUploadStep("completed");

			// 5. Redirigir
			setTimeout(() => {
				router.push(`/cognetica/${artifactId}`);
			}, 1000);
		} catch (error: unknown) {
			console.error(error);
			toast.error(
				error instanceof Error ?
					error.message
				:	"Error desconocido en la carga",
			);
			setUploadStep("idle");
			setUploadProgress(0);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
			{/* Header con botón volver */}
			<div className="flex items-center gap-4">
				<StandardButton
					size="sm"
					styleType="ghost"
					leftIcon={ArrowLeft}
					onClick={() => router.back()}>
					Volver
				</StandardButton>
				<div className="flex-1">
					<StandardPageTitle
						title="Cargar Nuevo Artefacto"
						subtitle="Sube audios, videos o documentos para iniciar el análisis forense."
					/>
				</div>
			</div>

			<StandardCard>
				<StandardCard.Content className="space-y-6">
					{/* Componente de Upload - Deshabilitado durante procesamiento */}
					<div
						className={
							uploadStep !== "idle" ? "opacity-30 pointer-events-none" : ""
						}>
						<StandardFileUpload
							onFileSelect={handleFileSelect}
							accept="audio/*,video/*,.md,.markdown,.pdf"
							maxSizeMB={500}
							disabled={isUploading}
						/>
					</div>

					{/* Área de Progreso */}
					{uploadStep !== "idle" && (
						<div
							ref={progressRef}
							className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
							{/* Mostrar loading logo durante división de páginas */}
							{uploadStep === "splitting" && (
								<div className="flex flex-col items-center justify-center py-8 space-y-4">
									<SustratoLoadingLogo
										size={60}
										variant="spin-pulse"
										speed="normal"
										showText={true}
										text="Dividiendo PDF en páginas..."
										breathingEffect={true}
										colorTransition={true}
									/>
									<StandardText
										size="sm"
										colorScheme="neutral"
										className="text-center">
										Procesando cada página individualmente. Esto puede tomar 1-2
										minutos.
									</StandardText>
								</div>
							)}

							{/* Progress bar para otros estados */}
							{uploadStep !== "splitting" && (
								<>
									<div className="flex items-center justify-between">
										<StandardText weight="medium">
											{uploadStep === "uploading" ?
												`Subiendo ${fileTypeLabel}...`
											: uploadStep === "processing" ?
												"Iniciando análisis..."
											:	"¡Listo!"}
										</StandardText>
										<StandardText size="sm" colorScheme="neutral">
											{uploadProgress}%
										</StandardText>
									</div>
									<StandardProgressBar
										value={uploadProgress}
										colorScheme={
											uploadStep === "completed" ? "success" : "primary"
										}
										animated={true}
									/>
								</>
							)}
						</div>
					)}

					{/* Botón de Acción */}
					<div className="flex justify-end pt-4">
						<StandardButton
							colorScheme="primary"
							size="lg"
							leftIcon={uploadStep === "completed" ? CheckCircle2 : Upload}
							disabled={!file || isUploading}
							loading={isUploading && uploadStep !== "completed"}
							onClick={handleUpload}>
							{uploadStep === "completed" ?
								"Carga Completa"
							:	"Iniciar Procesamiento"}
						</StandardButton>
					</div>
				</StandardCard.Content>
			</StandardCard>

			{/* Tips / Info */}
			<StandardCard styleType="subtle" className="bg-neutral-50">
				<StandardCard.Content>
					<div className="flex gap-4">
						<StandardIcon colorScheme="primary">
							<FileAudio />
						</StandardIcon>
						<div>
							<StandardText weight="bold">Proceso Automático</StandardText>
							<StandardText size="sm" colorScheme="neutral" className="mt-1">
								Al subir un archivo, el sistema automáticamente iniciará la
								transcripción, detectará hablantes y comenzará la extracción de
								semillas fractales.
							</StandardText>
						</div>
					</div>
				</StandardCard.Content>
			</StandardCard>

			{/* Dialog de selección de tipo PDF */}
			<PDFTypeDialog
				open={showPDFDialog}
				onClose={handlePDFDialogClose}
				onSelectType={handlePDFTypeSelect}
				fileName={pendingPDFFile?.name}
			/>
		</div>
	);
}
