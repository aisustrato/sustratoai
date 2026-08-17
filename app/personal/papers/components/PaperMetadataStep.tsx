// 📍 app/personal/papers/components/PaperMetadataStep.tsx
// Paso 4: Metadatos finales y publicación

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardRadioGroup } from "@/components/ui/StandardRadioGroup";
import { Send, Save, AlertCircle, CheckCircle, Languages } from "lucide-react";
import { generatePaperSlug, isSlugAvailableClient } from "@/lib/papers/slug";
import type { PaperDraftInput } from "@/lib/papers/types";
import { translatePaperContent } from "@/lib/papers/translate";
import type { PaperIdioma } from "@/lib/papers/i18n";

interface PaperMetadataStepProps {
	initialData?: Partial<PaperDraftInput>;
	onSaveDraft: (data: PaperDraftInput) => Promise<void>;
	onPublish: (data: PaperDraftInput) => Promise<void>;
	isPublished?: boolean;
	/** Recibe el content_md traducido para que el padre actualice el estado que edita PaperMarkdownStep (paso 2). */
	onContentMdTranslated: (target: PaperIdioma, contentMd: string) => void;
	/** ID del paper que se está editando — excluye su propio slug de la validación de disponibilidad. */
	paperId?: string;
}

export function PaperMetadataStep({
	initialData,
	onSaveDraft,
	onPublish,
	isPublished = false,
	onContentMdTranslated,
	paperId,
}: PaperMetadataStepProps) {
	// Estados del formulario
	const [title, setTitle] = useState(initialData?.title || "");
	const [titleEn, setTitleEn] = useState(initialData?.title_en || "");
	const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
	const [subtitleEn, setSubtitleEn] = useState(initialData?.subtitle_en || "");
	const [slug, setSlug] = useState(initialData?.slug || "");
	const [abstractEs, setAbstractEs] = useState(initialData?.abstract_es || "");
	const [abstractEn, setAbstractEn] = useState(initialData?.abstract_en || "");
	const [keywords, setKeywords] = useState<string[]>(
		initialData?.keywords || [],
	);
	const [keywordInput, setKeywordInput] = useState("");
	const [keywordsEn, setKeywordsEn] = useState<string[]>(
		initialData?.keywords_en || [],
	);
	const [keywordEnInput, setKeywordEnInput] = useState("");
	const [language, setLanguage] = useState(initialData?.language || "es");
	const [doi, setDoi] = useState(initialData?.doi || "");
	const [zenodoUrl, setZenodoUrl] = useState(initialData?.zenodo_url || "");

	// Estados de validación
	const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);
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
				const available = await isSlugAvailableClient(slug, paperId);
				setSlugAvailable(available);
			} catch (err) {
				console.error("Error verificando slug:", err);
			} finally {
				setIsCheckingSlug(false);
			}
		};

		const timer = setTimeout(checkSlug, 500);
		return () => clearTimeout(timer);
	}, [slug, paperId]);

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

	// Agregar keyword (EN)
	const handleAddKeywordEn = () => {
		const trimmed = keywordEnInput.trim();
		if (trimmed && !keywordsEn.includes(trimmed)) {
			setKeywordsEn([...keywordsEn, trimmed]);
			setKeywordEnInput("");
		}
	};

	// Eliminar keyword (EN)
	const handleRemoveKeywordEn = (keyword: string) => {
		setKeywordsEn(keywordsEn.filter((k) => k !== keyword));
	};

	// Traducir con IA: toma el contenido del idioma canónico y genera el
	// faltante vía DeepSeek. No persiste nada — solo rellena el formulario
	// para que el autor lo revise/edite antes de guardar o publicar.
	const handleTranslate = async () => {
		const canonico: PaperIdioma = language === "en" ? "en" : "es";
		const objetivo: PaperIdioma = canonico === "en" ? "es" : "en";

		const contentMdCanonico =
			canonico === "en" ?
				initialData?.content_md_en || ""
			:	initialData?.content_md || "";

		if (!contentMdCanonico) {
			setError(
				`No hay contenido en ${canonico === "en" ? "inglés" : "español"} todavía (paso de Markdown) — no se puede traducir.`,
			);
			return;
		}

		setIsTranslating(true);
		setError(null);
		const toastId = toast.loading(
			`Traduciendo con IA a ${objetivo === "en" ? "inglés" : "español"}…`,
		);

		try {
			const traduccion = await translatePaperContent(
				{
					title: canonico === "en" ? titleEn || title : title,
					subtitle: canonico === "en" ? subtitleEn : subtitle,
					abstract: canonico === "en" ? abstractEn : abstractEs,
					contentMd: contentMdCanonico,
					keywords: canonico === "en" ? keywordsEn : keywords,
				},
				objetivo,
			);

			if (objetivo === "en") {
				setTitleEn(traduccion.title);
				setSubtitleEn(traduccion.subtitle || "");
				setAbstractEn(traduccion.abstract);
				setKeywordsEn(traduccion.keywords);
			} else {
				setTitle(traduccion.title);
				setSubtitle(traduccion.subtitle || "");
				setAbstractEs(traduccion.abstract);
				setKeywords(traduccion.keywords);
			}
			onContentMdTranslated(objetivo, traduccion.contentMd);

			toast.success("Traducción generada — revísala antes de guardar.", {
				id: toastId,
			});
		} catch (err) {
			console.error("[PaperMetadataStep:traducir]", err);
			const msg = err instanceof Error ? err.message : "Error desconocido";
			toast.error(`No se pudo traducir: ${msg}`, {
				id: toastId,
				duration: Infinity,
			});
		} finally {
			setIsTranslating(false);
		}
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
		title_en: titleEn || undefined,
		subtitle: subtitle || undefined,
		subtitle_en: subtitleEn || undefined,
		slug,
		abstract_es: abstractEs,
		abstract_en: abstractEn || undefined,
		keywords,
		keywords_en: keywordsEn.length > 0 ? keywordsEn : undefined,
		doi: doi || undefined,
		zenodo_url: zenodoUrl || undefined,
		authors: initialData?.authors || [],
		content_md: initialData?.content_md || "",
		content_md_en: initialData?.content_md_en || undefined,
		version: "1.0",
		license: "CC BY 4.0",
		language,
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
					{/* Idioma canónico (SEO) */}
					<div>
						<StandardRadioGroup
							label="Idioma canónico (para buscadores/IA)"
							description="El otro idioma sigue disponible con el toggle en la vista pública. Este es el que se muestra por defecto y el que leen los crawlers."
							orientation="horizontal"
							value={language}
							onChange={setLanguage}
							disabled={isSaving || isPublishing || isTranslating}
							options={[
								{ value: "es", label: "Español" },
								{ value: "en", label: "English" },
							]}
						/>
					</div>

					{/* Traducir con IA: rellena el idioma faltante para revisar/editar antes de guardar */}
					<div>
						<StandardButton
							styleType="outline"
							colorScheme="primary"
							size="md"
							onClick={handleTranslate}
							loading={isTranslating}
							loadingText="Traduciendo..."
							disabled={isSaving || isPublishing}
							leftIcon={Languages}>
							Traducir con IA a {language === "en" ? "Español" : "English"}
						</StandardButton>
						<StandardText
							size="xs"
							colorScheme="neutral"
							colorShade="subtle"
							className="mt-1">
							Genera el idioma faltante (título, subtítulo, resumen, cuerpo y
							keywords) vía IA. Puedes revisar y editar el resultado antes de
							guardar o publicar.
						</StandardText>
					</div>

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

					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Title (English) (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={titleEn}
							onChange={(e) => setTitleEn(e.target.value)}
							placeholder="Full paper title in English"
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

					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Subtitle (English) (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={subtitleEn}
							onChange={(e) => setSubtitleEn(e.target.value)}
							placeholder="Subtitle or short description in English"
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

					<div>
						<label className="block mb-2">
							<StandardText size="sm" weight="medium">
								Keywords (English) (opcional)
							</StandardText>
						</label>
						<div className="flex gap-2 mb-2">
							<StandardInput
								value={keywordEnInput}
								onChange={(e) => setKeywordEnInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddKeywordEn();
									}
								}}
								placeholder="Type a keyword and press Enter"
								disabled={isSaving || isPublishing}
							/>
							<StandardButton
								styleType="outline"
								colorScheme="primary"
								size="md"
								onClick={handleAddKeywordEn}
								disabled={!keywordEnInput.trim() || isSaving || isPublishing}>
								Add
							</StandardButton>
						</div>
						{keywordsEn.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{keywordsEn.map((keyword) => (
									<div
										key={keyword}
										className="inline-flex items-center gap-2 px-3 py-1 bg-primary-bg border border-primary-border rounded-full">
										<StandardText size="sm">{keyword}</StandardText>
										<button
											onClick={() => handleRemoveKeywordEn(keyword)}
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
