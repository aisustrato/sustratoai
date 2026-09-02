"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardNote } from "@/components/ui/StandardNote";
import { toast } from "sonner";
import type { DetailedNote } from "@/lib/actions/article-notes-actions";
import {
	updateArticleNote,
	deleteArticleNote,
} from "@/lib/actions/article-notes-actions";
import Link from "next/link";
import {
	StandardAccordion,
	StandardAccordionItem,
	StandardAccordionTrigger,
	StandardAccordionContent,
} from "@/components/ui/StandardAccordion/StandardAccordion";
import { StandardBadge } from "@/components/ui/StandardBadge";

// Tipamos con los props reales de StandardCard para compatibilidad total
export type StandardCardWithContentProps = React.ComponentProps<
	typeof StandardCard
> & {
	note?: DetailedNote & { article_title?: string | null };
	onDirtyChange?: (dirty: boolean) => void;
	resetSignal?: number;
	// Auto-abrir esta nota al montar (desde deep-link)
	autoOpen?: boolean;
	// Modo deseado cuando se auto-abre: 'editor' abre en edición, otros permanecen en vista
	autoOpenMode?: "editor" | "divided" | "preview";
	// Hacer scroll hacia la tarjeta cuando se auto-abre
	autoScrollIntoView?: boolean;
};

const StandardCardWithContent: React.FC<StandardCardWithContentProps> = ({
	children,
	note,
	onDirtyChange,
	resetSignal,
	autoOpen = false,
	autoOpenMode = "preview",
	autoScrollIntoView = false,
	...props
}) => {
	const t = useTranslations("articulos.notesCard");
	// Estado de edición para notas (declarar SIEMPRE antes de cualquier return)
	const [isEditing, setIsEditing] = React.useState(false);
	const [title, setTitle] = React.useState<string>((note as any)?.title || "");
	const [content, setContent] = React.useState<string>(
		(note as any)?.note_content || "",
	);
	const [visibility, setVisibility] = React.useState<"public" | "private">(
		(note as any)?.visibility || "private",
	);
	const [showPublicConfirm, setShowPublicConfirm] = React.useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);
	const [isDeleted, setIsDeleted] = React.useState(false);

	// Estado para notas relacionadas (lazy fetch)
	const [accordionValue, setAccordionValue] = React.useState<
		string | undefined
	>(undefined);
	const [isLoadingRelated, setIsLoadingRelated] = React.useState(false);
	const [relatedNotes, setRelatedNotes] = React.useState<DetailedNote[]>([]);
	const [relatedError, setRelatedError] = React.useState<string | null>(null);

	// Modo de visualización del editor
	const [noteViewMode, setNoteViewMode] = React.useState<
		"divided" | "editor" | "preview"
	>("divided");
	const controlId = React.useId();

	// Ref para auto-scroll al anclar por URL
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	// Baseline (último estado guardado) para detectar cambios
	const [baselineTitle, setBaselineTitle] = React.useState<string>(
		(note as any)?.title || "",
	);
	const [baselineContent, setBaselineContent] = React.useState<string>(
		(note as any)?.note_content || "",
	);
	const [baselineVisibility, setBaselineVisibility] = React.useState<
		"public" | "private"
	>((note as any)?.visibility || "private");
	const isDirty =
		title !== baselineTitle ||
		content !== baselineContent ||
		visibility !== baselineVisibility;
	const [showUnsavedConfirm, setShowUnsavedConfirm] = React.useState(false);

	// Notificar al padre cuando cambie el estado dirty
	React.useEffect(() => {
		onDirtyChange?.(isDirty);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDirty]);

	// Aplicar reset forzado desde el contenedor (p. ej., al confirmar cambiar de tab)
	React.useEffect(() => {
		if (resetSignal === undefined) return;
		// Cuando cambie resetSignal, descartamos cambios y salimos de edición
		resetToBaseline();
		setIsEditing(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resetSignal]);

	// Si cambia la nota (id), sincronizamos baseline y valores editables
	React.useEffect(() => {
		setBaselineTitle((note as any)?.title || "");
		setBaselineContent((note as any)?.note_content || "");
		setBaselineVisibility(
			((note as any)?.visibility as "public" | "private") || "private",
		);
		setTitle((note as any)?.title || "");
		setContent((note as any)?.note_content || "");
		setVisibility(
			((note as any)?.visibility as "public" | "private") || "private",
		);
	}, [
		(note as any)?.id,
		(note as any)?.title,
		(note as any)?.note_content,
		(note as any)?.visibility,
	]);

	// Auto-abrir en detalle/edición según parámetros
	React.useEffect(() => {
		if (!autoOpen) return;
		// Si se solicitó edición, activamos edición; si no, nos quedamos en vista
		if (autoOpenMode === "editor") {
			setIsEditing(true);
			setNoteViewMode("divided");
		}
		if (autoScrollIntoView && containerRef.current) {
			// Timeout para asegurar que el layout esté listo
			const scrollTimeout = setTimeout(() => {
				containerRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 0);
			return () => clearTimeout(scrollTimeout);
		}
	}, [autoOpen, autoOpenMode, autoScrollIntoView, (note as any)?.id]);

	// Cargar notas relacionadas cuando se abre el acordeón por primera vez
	const loadRelatedNotes = React.useCallback(async () => {
		try {
			if (!(note as any)?.article_id || !(note as any)?.project_id) return;
			setIsLoadingRelated(true);
			setRelatedError(null);
			const params = new URLSearchParams({
				articleId: String((note as any).article_id),
				projectId: String((note as any).project_id),
				visibility: "public",
			});
			const res = await fetch(
				`/api/article-notes/related?${params.toString()}`,
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(
					json.error || t("errorLoadingRelated"),
				);
			}
			const fetched: DetailedNote[] = (json.data ?? []) as DetailedNote[];
			// Excluir la nota actual y evitar duplicados por id
			const uniqueById = new Map<string, DetailedNote>();
			for (const n of fetched) {
				if (String((n as any).id) === String((note as any).id)) continue;
				uniqueById.set(String((n as any).id), n);
			}
			setRelatedNotes(Array.from(uniqueById.values()));
		} catch (e) {
			const msg = e instanceof Error ? e.message : t("toastUnknownError");
			setRelatedError(msg);
		} finally {
			setIsLoadingRelated(false);
		}
	}, [(note as any)?.article_id, (note as any)?.project_id, (note as any)?.id, t]);

	const handleAccordionChange = (val: string | undefined) => {
		setAccordionValue(val);
		if (
			val === "related" &&
			relatedNotes.length === 0 &&
			!isLoadingRelated &&
			!relatedError
		) {
			void loadRelatedNotes();
		}
	};

	// Si fue eliminado, no renderizar
	if (isDeleted) return null;

	const resetToBaseline = () => {
		setTitle(baselineTitle);
		setContent(baselineContent);
		setVisibility(baselineVisibility);
	};

	const handleToggleVisibility = (checked: boolean) => {
		if (checked && visibility === "private") {
			setShowPublicConfirm(true);
		} else {
			setVisibility(checked ? "public" : "private");
		}
	};

	const confirmMakePublic = () => {
		setVisibility("public");
		setShowPublicConfirm(false);
	};

	const onCancelClick = () => {
		if (isDirty) {
			setShowUnsavedConfirm(true);
		} else {
			setIsEditing(false);
		}
	};

	const onSave = async () => {
		try {
			setSaving(true);
			if (!(note as any)?.id) {
				toast.error(t("toastInvalidNoteToSave"));
				return;
			}
			const res = await updateArticleNote({
				noteId: (note as any).id,
				title: title || t("untitledDefaultValue"),
				noteContent: content,
				visibility,
			});
			if (!res.success) {
				toast.error(res.error || t("toastCouldNotUpdate"));
				return;
			}
			if (!res.data) {
				toast.error(t("toastCouldNotUpdate"));
				return;
			}
			toast.success(t("toastNoteUpdated"));
			setIsEditing(false);
			// Actualizamos baseline al último guardado
			setBaselineTitle(title || "");
			setBaselineContent(content || "");
			setBaselineVisibility(visibility);
		} catch (e) {
			const msg = e instanceof Error ? e.message : t("toastUnknownError");
			toast.error(t("toastErrorSaving", { message: msg }));
		} finally {
			setSaving(false);
		}
	};

	const onDelete = async () => {
		try {
			setDeleting(true);
			if (!(note as any)?.id) {
				toast.error(t("toastInvalidNoteToDelete"));
				return;
			}
			const res = await deleteArticleNote((note as any).id);
			if (res.success) {
				toast.success(t("toastNoteDeleted"));
				setIsDeleted(true);
			} else {
				toast.error(res.error || t("toastCouldNotDelete"));
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : t("toastUnknownError");
			toast.error(t("toastErrorDeleting", { message: msg }));
		} finally {
			setDeleting(false);
			setShowDeleteConfirm(false);
		}
	};

	// Si no se pasa "note", mantenemos el comportamiento de contenedor original
	if (!note) {
		return (
			<div ref={containerRef}>
				<StandardCard {...props}>
					<StandardCard.Content>{children}</StandardCard.Content>
				</StandardCard>
			</div>
		);
	}

	return (
		<div ref={containerRef}>
			<StandardCard {...props}>
				<StandardCard.Content>
					{/* Header simple con acciones */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							{isEditing ?
								<div className="space-y-2">
									<StandardText size="sm" className="font-medium">
										{t("titleLabel")}
									</StandardText>
									<StandardInput
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder={t("titlePlaceholder")}
										colorScheme="primary"
										size="md"
									/>
								</div>
							:	<h3 className="text-base font-semibold truncate">
									{title || t("untitled")}
								</h3>
							}
						</div>
						<div className="shrink-0 flex items-center gap-2">
							{!isEditing ?
								<StandardButton
									size="sm"
									styleType="outline"
									onClick={() => setIsEditing(true)}>
									{t("editButton")}
								</StandardButton>
							:	<>
									<StandardButton
										size="sm"
										styleType="outline"
										onClick={onCancelClick}>
										{t("cancelButton")}
									</StandardButton>
									<StandardButton
										size="sm"
										styleType="solid"
										colorScheme="primary"
										onClick={onSave}
										disabled={!isDirty || saving}>
										{saving ? t("savingButton") : t("saveButton")}
									</StandardButton>
									<StandardButton
										size="sm"
										styleType="outline"
										colorScheme="danger"
										onClick={() => setShowDeleteConfirm(true)}
										disabled={deleting}>
										{t("deleteButton")}
									</StandardButton>
								</>
							}
						</div>
					</div>

					{/* Información del artículo + botón Ver Artículo */}
					{(note as any).article_id ?
						<div className="mt-2 flex items-center justify-between gap-3">
							<StandardText
								size="xs"
								className="text-gray-600 dark:text-gray-300 truncate">
								{t("articleLabel", { title: (note as any).article_title || t("untitled") })}
							</StandardText>
							<StandardButton
								size="sm"
								styleType="outline"
								colorScheme="primary"
								asChild>
								<Link
									href={`/articulos/detalle?articleId=${(note as any).article_id}`}>
									{t("viewArticleButton")}
								</Link>
							</StandardButton>
						</div>
					:	null}

					{/* Visibilidad */}
					<div className="mt-3">
						{isEditing ?
							<div className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
								<StandardSwitch
									id={`note-visibility-${(note as any).id ?? controlId}`}
									checked={visibility === "public"}
									onCheckedChange={handleToggleVisibility}
									colorScheme="primary"
									size="md"
								/>
								<label
									htmlFor={`note-visibility-${(note as any).id ?? controlId}`}
									className="text-sm select-none cursor-pointer">
									{visibility === "public" ?
										t("publicVisibilityEditing")
									:	t("privateVisibilityEditing")}
								</label>
							</div>
						:	<StandardText size="xs" className="text-gray-500">
								{visibility === "public" ?
									t("publicVisibilityView")
								:	t("privateVisibilityView")}
							</StandardText>
						}
					</div>

					{/* Contenido */}
					<div className="mt-3">
						{isEditing ?
							<div className="flex flex-col gap-3">
								<StandardNote
									value={content}
									onChange={setContent}
									placeholder={t("contentPlaceholder")}
									colorScheme="primary"
									size="lg"
									minimalToolbar={true}
									viewMode={noteViewMode}
									onViewModeChange={setNoteViewMode}
									showToolbar={true}
									livePreview={true}
									previewDebounceMs={300}
									className="flex-grow"
								/>
							</div>
						: content ?
							<p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
								{content}
							</p>
						:	<StandardText size="sm" className="text-gray-500">
								{t("noContent")}
							</StandardText>
						}
					</div>

					{/* Otras notas del mismo artículo */}
					{(note as any).article_id ?
						<div className="mt-4">
							<StandardAccordion
								type="single"
								collapsible
								value={accordionValue}
								onValueChange={handleAccordionChange}
								colorScheme="accent"
								styleType="subtle"
								className="w-full">
								<StandardAccordionItem value="related">
									<StandardAccordionTrigger>
										{t("otherNotesAccordionTitle")}
									</StandardAccordionTrigger>
									<StandardAccordionContent>
										{isLoadingRelated ?
											<StandardText size="sm" className="text-gray-500">
												{t("loadingRelatedNotes")}
											</StandardText>
										: relatedError ?
											<StandardText size="sm" className="text-red-600">
												{relatedError}
											</StandardText>
										: relatedNotes.length === 0 ?
											<StandardText size="sm" className="text-gray-500">
												{t("noPublicRelatedNotes")}
											</StandardText>
										:	<ul className="space-y-3">
												{relatedNotes.map((n) => {
													const dateStr =
														(n as any).created_at ?
															new Date(
																(n as any).created_at as unknown as string,
															).toLocaleDateString()
														:	"";
													const snippet =
														((n as any).note_content || "").slice(0, 160) +
														(((n as any).note_content || "").length > 160 ?
															"…"
														:	"");
													return (
														<li
															key={String((n as any).id)}
															className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
															<div className="flex items-start justify-between gap-2">
																<div className="min-w-0">
																	<Link
																		href={`/articulos/notas?noteId=${(n as any).id}&visibility=${(n as any).visibility}&mode=preview`}
																		className="block">
																		<span className="text-sm font-medium line-clamp-1">
																			{(n as any).title || t("untitled")}
																		</span>
																	</Link>
																	<div className="mt-1 flex items-center gap-2">
																		<StandardBadge
																			size="sm"
																			styleType="subtle"
																			colorScheme={
																				(n as any).visibility === "public" ?
																					"success"
																				:	"neutral"
																			}>
																			{(n as any).visibility === "public" ?
																				t("publicBadge")
																			:	t("privateBadge")}
																		</StandardBadge>
																		{(n as any).author_name ?
																			<StandardText
																				size="xs"
																				className="text-gray-500">
																				{t("authorLabel", { name: (n as any).author_name })}
																			</StandardText>
																		:	null}
																		{dateStr ?
																			<StandardText
																				size="xs"
																				className="text-gray-500">
																				· {dateStr}
																			</StandardText>
																		:	null}
																	</div>
																	{snippet ?
																		<StandardText
																			size="sm"
																			className="mt-2 text-gray-700 dark:text-gray-300 line-clamp-3">
																			{snippet}
																		</StandardText>
																	:	null}
																</div>
																{/* Sin controles de edición aquí: lista de solo lectura */}
															</div>
														</li>
													);
												})}
											</ul>
										}
									</StandardAccordionContent>
								</StandardAccordionItem>
							</StandardAccordion>
						</div>
					:	null}
				</StandardCard.Content>

				{/* Diálogos */}
				<StandardDialog
					open={showPublicConfirm}
					onOpenChange={setShowPublicConfirm}>
					<StandardDialog.Content size="sm" colorScheme="warning">
						<StandardDialog.Header>
							<StandardDialog.Title>
								{t("confirmPublicTitle")}
							</StandardDialog.Title>
							<StandardDialog.Description>
								{t("confirmPublicDescription")}
							</StandardDialog.Description>
						</StandardDialog.Header>
						<StandardDialog.Footer>
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								onClick={() => setShowPublicConfirm(false)}>
								{t("cancelButton")}
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="warning"
								onClick={confirmMakePublic}>
								{t("confirmPublicYes")}
							</StandardButton>
						</StandardDialog.Footer>
					</StandardDialog.Content>
				</StandardDialog>

				{/* Confirmación de cambios sin guardar al cancelar */}
				<StandardDialog
					open={showUnsavedConfirm}
					onOpenChange={setShowUnsavedConfirm}>
					<StandardDialog.Content size="sm">
						<StandardDialog.Header>
							<StandardDialog.Title>
								{t("unsavedChangesTitle")}
							</StandardDialog.Title>
							<StandardDialog.Description>
								{t("unsavedChangesDescription")}
							</StandardDialog.Description>
						</StandardDialog.Header>
						<StandardDialog.Footer>
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								onClick={() => setShowUnsavedConfirm(false)}>
								{t("continueEditingButton")}
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="warning"
								onClick={() => {
									resetToBaseline();
									setIsEditing(false);
									setShowUnsavedConfirm(false);
								}}>
								{t("exitWithoutSavingButton")}
							</StandardButton>
						</StandardDialog.Footer>
					</StandardDialog.Content>
				</StandardDialog>

				<StandardDialog
					open={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}>
					<StandardDialog.Content size="md">
						<StandardDialog.Header>
							<StandardDialog.Title>{t("confirmDeleteTitle")}</StandardDialog.Title>
							<StandardDialog.Description>
								{t("confirmDeleteDescription")}
							</StandardDialog.Description>
						</StandardDialog.Header>
						<StandardDialog.Footer>
							<StandardButton
								styleType="outline"
								onClick={() => setShowDeleteConfirm(false)}>
								{t("cancelButton")}
							</StandardButton>
							<StandardButton
								styleType="solid"
								colorScheme="danger"
								onClick={onDelete}
								disabled={deleting}>
								{deleting ? t("deletingButton") : t("deletePermanentlyButton")}
							</StandardButton>
						</StandardDialog.Footer>
					</StandardDialog.Content>
				</StandardDialog>
			</StandardCard>
		</div>
	);
};

export default StandardCardWithContent;
