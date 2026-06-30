// 📍 app/personal/papers/components/PaperMetadataStep.tsx
// Paso 4: Metadatos finales y publicación

"use client";

import { useState, useEffect } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { Send, Save, AlertCircle, CheckCircle } from "lucide-react";
import { generatePaperSlug, isSlugAvailableClient } from "@/lib/papers/slug";
import type { PaperDraftInput } from "@/lib/papers/types";

interface PaperMetadataStepProps {
	initialData?: Partial<PaperDraftInput>;
	onSaveDraft: (data: PaperDraftInput) => Promise<void>;
	onPublish: (data: PaperDraftInput) => Promise<void>;
	isPublished?: boolean;
}

export function PaperMetadataStep({
	initialData,
	onSaveDraft,
	onPublish,
	isPublished = false,
}: PaperMetadataStepProps) {
	// Estados del formulario
	const [title, setTitle] = useState(initialData?.title || "");
	const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
	const [slug, setSlug] = useState(initialData?.slug || "");
	const [abstractEs, setAbstractEs] = useState(initialData?.abstract_es || "");
	const [abstractEn, setAbstractEn] = useState(initialData?.abstract_en || "");
	const [keywords, setKeywords] = useState<string[]>(
		initialData?.keywords || [],
	);
	const [keywordInput, setKeywordInput] = useState("");
	const [doi, setDoi] = useState(initialData?.doi || "");
	const [zenodoUrl, setZenodoUrl] = useState(initialData?.zenodo_url || "");

	// Estados de validación
	const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Auto-generar slug desde título
	useEffect(() => {
		if (title && !initialData?.slug) {
			const generatedSlug = generatePaperSlug(title);
			setSlug(generatedSlug);
		}
	}, [title, initialData?.slug]);

	// Verificar disponibilidad del slug
	useEffect(() => {
		if (!slug) {
			setSlugAvailable(null);
			return;
		}

		const checkSlug = async () => {
			setIsCheckingSlug(true);
			try {
				const available = await isSlugAvailableClient(slug);
				setSlugAvailable(available);
			} catch (err) {
				console.error("Error verificando slug:", err);
			} finally {
				setIsCheckingSlug(false);
			}
		};

		const timer = setTimeout(checkSlug, 500);
		return () => clearTimeout(timer);
	}, [slug]);

	// Agregar keyword
	const handleAddKeyword = () => {
		const trimmed = keywordInput.trim();
		if (trimmed && !keywords.includes(trimmed)) {
			setKeywords([...keywords, trimmed]);
			setKeywordInput("");
		}
	};

	// Eliminar keyword
	const handleRemoveKeyword = (keyword: string) => {
		setKeywords(keywords.filter((k) => k !== keyword));
	};

	// Validar formulario
	const isFormValid = (): boolean => {
		return !!(
			title &&
			slug &&
			slugAvailable &&
			abstractEs &&
			keywords.length > 0
		);
	};

	// Construir objeto de datos
	const buildDraftData = (): PaperDraftInput => ({
		title,
		subtitle: subtitle || undefined,
		slug,
		abstract_es: abstractEs,
		abstract_en: abstractEn || undefined,
		keywords,
		doi: doi || undefined,
		zenodo_url: zenodoUrl || undefined,
		authors: initialData?.authors || [],
		content_md: initialData?.content_md || "",
		version: "1.0",
		license: "CC BY 4.0",
		language: "es",
		processing_status: "ready",
	});

	// Guardar borrador
	const handleSaveDraft = async () => {
		if (!isFormValid()) {
			setError("Completa todos los campos obligatorios");
			return;
		}

		setIsSaving(true);
		setError(null);
		setSuccess(null);

		try {
			await onSaveDraft(buildDraftData());
			setSuccess("Borrador guardado correctamente");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error guardando borrador");
		} finally {
			setIsSaving(false);
		}
	};

	// Publicar
	const handlePublish = async () => {
		if (!isFormValid()) {
			setError("Completa todos los campos obligatorios antes de publicar");
			return;
		}

		if (
			!confirm(
				"¿Estás seguro de que quieres publicar este paper? Será visible públicamente en /papers.",
			)
		) {
			return;
		}

		setIsPublishing(true);
		setError(null);
		setSuccess(null);

		try {
			await onPublish(buildDraftData());
			setSuccess("¡Paper publicado exitosamente!");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error publicando paper");
		} finally {
			setIsPublishing(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<StandardCard styleType="filled" colorScheme="primary">
				<div className="flex items-center gap-3">
					<div className="p-3 rounded-lg bg-primary-bg">
						<Send className="h-6 w-6 text-primary-pure" />
					</div>
					<div>
						<StandardText size="lg" weight="semibold">
							Metadatos y Publicación
						</StandardText>
						<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
							Completa la información del paper para publicarlo
						</StandardText>
					</div>
				</div>
			</StandardCard>

			{/* Formulario */}
			<StandardCard styleType="filled" colorScheme="neutral">
				<div className="space-y-6">
					{/* Título */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Título <span className="text-danger-pure">*</span>
							</StandardText>
						</label>
						<StandardInput
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Título completo del paper"
							disabled={isSaving || isPublishing}
						/>
					</div>

					{/* Subtítulo */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Subtítulo (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={subtitle}
							onChange={(e) => setSubtitle(e.target.value)}
							placeholder="Subtítulo o descripción breve"
							disabled={isSaving || isPublishing}
						/>
					</div>

					{/* Slug */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Slug (URL) <span className="text-danger-pure">*</span>
							</StandardText>
							<StandardText size="xs" colorScheme="neutral" colorShade="subtle">
								Se genera automáticamente desde el título
							</StandardText>
						</label>
						<div className="relative">
							<StandardInput
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
								placeholder="slug-del-paper"
								disabled={isSaving || isPublishing}
							/>
							{isCheckingSlug && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<div className="animate-spin h-4 w-4 border-2 border-primary-pure border-t-transparent rounded-full" />
								</div>
							)}
							{!isCheckingSlug && slugAvailable === true && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<CheckCircle className="h-4 w-4 text-success-pure" />
								</div>
							)}
							{!isCheckingSlug && slugAvailable === false && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<AlertCircle className="h-4 w-4 text-danger-pure" />
								</div>
							)}
						</div>
						{slugAvailable === false && (
							<StandardText size="xs" colorScheme="danger" className="mt-1">
								Este slug ya está en uso
							</StandardText>
						)}
						{slug && (
							<StandardText
								size="xs"
								colorScheme="neutral"
								colorShade="subtle"
								className="mt-1">
								URL: /papers/{slug}
							</StandardText>
						)}
					</div>

					{/* Abstract ES */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Resumen (Español) <span className="text-danger-pure">*</span>
							</StandardText>
						</label>
						<StandardTextarea
							value={abstractEs}
							onChange={(e) => setAbstractEs(e.target.value)}
							placeholder="Resumen del paper en español..."
							rows={4}
							disabled={isSaving || isPublishing}
						/>
					</div>

					{/* Abstract EN */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Abstract (English) (opcional)
							</StandardText>
						</label>
						<StandardTextarea
							value={abstractEn}
							onChange={(e) => setAbstractEn(e.target.value)}
							placeholder="Abstract in English..."
							rows={4}
							disabled={isSaving || isPublishing}
						/>
					</div>

					{/* Keywords */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Palabras clave <span className="text-danger-pure">*</span>
							</StandardText>
						</label>
						<div className="flex gap-2 mb-2">
							<StandardInput
								value={keywordInput}
								onChange={(e) => setKeywordInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddKeyword();
									}
								}}
								placeholder="Escribe una palabra clave y presiona Enter"
								disabled={isSaving || isPublishing}
							/>
							<StandardButton
								styleType="outline"
								colorScheme="primary"
								size="md"
								onClick={handleAddKeyword}
								disabled={!keywordInput.trim() || isSaving || isPublishing}>
								Agregar
							</StandardButton>
						</div>
						{keywords.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{keywords.map((keyword) => (
									<div
										key={keyword}
										className="inline-flex items-center gap-2 px-3 py-1 bg-primary-bg border border-primary-border rounded-full">
										<StandardText size="sm">{keyword}</StandardText>
										<button
											onClick={() => handleRemoveKeyword(keyword)}
											className="text-primary-pure hover:text-primary-hover"
											disabled={isSaving || isPublishing}>
											×
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* DOI */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								DOI (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={doi}
							onChange={(e) => setDoi(e.target.value)}
							placeholder="10.1234/ejemplo"
							disabled={isSaving || isPublishing}
						/>
					</div>

					{/* Zenodo URL */}
					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								URL de Zenodo (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={zenodoUrl}
							onChange={(e) => setZenodoUrl(e.target.value)}
							placeholder="https://zenodo.org/record/..."
							disabled={isSaving || isPublishing}
						/>
					</div>
				</div>
			</StandardCard>

			{/* Mensajes */}
			{error && (
				<div className="bg-danger-bg border border-danger-border rounded-lg p-4">
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-danger-pure flex-shrink-0 mt-0.5" />
						<StandardText size="sm" colorScheme="danger">
							{error}
						</StandardText>
					</div>
				</div>
			)}

			{success && (
				<div className="bg-success-bg border border-success-border rounded-lg p-4">
					<div className="flex items-start gap-3">
						<CheckCircle className="h-5 w-5 text-success-pure flex-shrink-0 mt-0.5" />
						<StandardText size="sm" colorScheme="success">
							{success}
						</StandardText>
					</div>
				</div>
			)}

			{/* Botones de acción */}
			<div className="flex gap-4">
				<StandardButton
					styleType="outline"
					colorScheme="neutral"
					size="lg"
					onClick={handleSaveDraft}
					disabled={!isFormValid() || isSaving || isPublishing}
					className="flex-1"
					leftIcon={Save}>
					{isSaving ? "Guardando..." : "Guardar Borrador"}
				</StandardButton>

				<StandardButton
					styleType="solid"
					colorScheme={isPublished ? "warning" : "success"}
					size="lg"
					onClick={handlePublish}
					disabled={!isFormValid() || isSaving || isPublishing}
					className="flex-1"
					leftIcon={Send}>
					{isPublishing ?
						"Publicando..."
					: isPublished ?
						"Actualizar Publicación"
					:	"Publicar Paper"}
				</StandardButton>
			</div>

			{/* Info Card */}
			<StandardCard styleType="subtle" colorScheme="neutral">
				<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
					<strong>Nota:</strong> Una vez publicado, el paper será visible
					públicamente en <code>/papers/{slug || "tu-slug"}</code>. Puedes
					despublicarlo en cualquier momento desde la lista de papers.
				</StandardText>
			</StandardCard>
		</div>
	);
}
