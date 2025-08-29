"use client";

import * as React from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardNote } from "@/components/ui/StandardNote";
import { toast } from "sonner";
import type { DetailedNote } from "@/lib/actions/article-notes-actions";
import { updateArticleNote, deleteArticleNote } from "@/lib/actions/article-notes-actions";
import Link from "next/link";
import { StandardAccordion, StandardAccordionItem, StandardAccordionTrigger, StandardAccordionContent } from "@/components/ui/StandardAccordion/StandardAccordion";
import { StandardBadge } from "@/components/ui/StandardBadge";

// Tipamos con los props reales de StandardCard para compatibilidad total
export type StandardCardWithContentProps = React.ComponentProps<typeof StandardCard> & {
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

const StandardCardWithContent: React.FC<StandardCardWithContentProps> = ({ children, note, onDirtyChange, resetSignal, autoOpen = false, autoOpenMode = "preview", autoScrollIntoView = false, ...props }) => {

  // Estado de edición para notas (declarar SIEMPRE antes de cualquier return)
  const [isEditing, setIsEditing] = React.useState(false);
  const [title, setTitle] = React.useState<string>(note?.title || "");
  const [content, setContent] = React.useState<string>(note?.note_content || "");
  const [visibility, setVisibility] = React.useState<"public" | "private">(note?.visibility || "private");
  const [showPublicConfirm, setShowPublicConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [isDeleted, setIsDeleted] = React.useState(false);

  // Estado para notas relacionadas (lazy fetch)
  const [accordionValue, setAccordionValue] = React.useState<string | undefined>(undefined);
  const [isLoadingRelated, setIsLoadingRelated] = React.useState(false);
  const [relatedNotes, setRelatedNotes] = React.useState<DetailedNote[]>([]);
  const [relatedError, setRelatedError] = React.useState<string | null>(null);

  // Modo de visualización del editor
  const [noteViewMode, setNoteViewMode] = React.useState<"divided" | "editor" | "preview">("divided");
  const controlId = React.useId();

  // Ref para auto-scroll al anclar por URL
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Baseline (último estado guardado) para detectar cambios
  const [baselineTitle, setBaselineTitle] = React.useState<string>(note?.title || "");
  const [baselineContent, setBaselineContent] = React.useState<string>(note?.note_content || "");
  const [baselineVisibility, setBaselineVisibility] = React.useState<"public" | "private">(note?.visibility || "private");
  const isDirty = title !== baselineTitle || content !== baselineContent || visibility !== baselineVisibility;
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
    setBaselineTitle(note?.title || "");
    setBaselineContent(note?.note_content || "");
    setBaselineVisibility((note?.visibility as "public" | "private") || "private");
    setTitle(note?.title || "");
    setContent(note?.note_content || "");
    setVisibility((note?.visibility as "public" | "private") || "private");
  }, [note?.id, note?.title, note?.note_content, note?.visibility]);

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
      const t = setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [autoOpen, autoOpenMode, autoScrollIntoView, note?.id]);

  // Cargar notas relacionadas cuando se abre el acordeón por primera vez
  const loadRelatedNotes = React.useCallback(async () => {
    try {
      if (!note?.article_id || !note?.project_id) return;
      setIsLoadingRelated(true);
      setRelatedError(null);
      const params = new URLSearchParams({
        articleId: String(note.article_id),
        projectId: String(note.project_id),
        visibility: "public",
      });
      const res = await fetch(`/api/article-notes/related?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudieron cargar notas relacionadas");
      }
      const fetched: DetailedNote[] = (json.data ?? []) as DetailedNote[];
      // Excluir la nota actual y evitar duplicados por id
      const uniqueById = new Map<string, DetailedNote>();
      for (const n of fetched) {
        if (String(n.id) === String(note.id)) continue;
        uniqueById.set(String(n.id), n);
      }
      setRelatedNotes(Array.from(uniqueById.values()));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setRelatedError(msg);
    } finally {
      setIsLoadingRelated(false);
    }
  }, [note?.article_id, note?.project_id, note?.id]);

  const handleAccordionChange = (val: string | undefined) => {
    setAccordionValue(val);
    if (val === "related" && relatedNotes.length === 0 && !isLoadingRelated && !relatedError) {
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
      if (!note?.id) {
        toast.error("Nota inválida para guardar");
        return;
      }
      const res = await updateArticleNote({
        noteId: note.id,
        title: title || "sin título",
        noteContent: content,
        visibility,
      });
      if (!res.success) {
        toast.error(res.error || "No se pudo actualizar la nota");
        return;
      }
      if (!res.data) {
        toast.error("No se pudo actualizar la nota");
        return;
      }
      toast.success("Nota actualizada correctamente");
      setIsEditing(false);
      // Actualizamos baseline al último guardado
      setBaselineTitle(title || "");
      setBaselineContent(content || "");
      setBaselineVisibility(visibility);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      setDeleting(true);
      if (!note?.id) {
        toast.error("Nota inválida para eliminar");
        return;
      }
      const res = await deleteArticleNote(note.id);
      if (res.success) {
        toast.success("Nota eliminada");
        setIsDeleted(true);
      } else {
        toast.error(res.error || "No se pudo eliminar la nota");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(`Error al eliminar: ${msg}`);
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
          <StandardCard.Content>
            {children}
          </StandardCard.Content>
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
            {isEditing ? (
              <div className="space-y-2">
                <StandardText size="sm" className="font-medium">Título</StandardText>
                <StandardInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la nota"
                  colorScheme="primary"
                  size="md"
                />
              </div>
            ) : (
              <h3 className="text-base font-semibold truncate">{title || "(sin título)"}</h3>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {!isEditing ? (
              <StandardButton size="sm" styleType="outline" onClick={() => setIsEditing(true)}>
                Editar
              </StandardButton>
            ) : (
              <>
                <StandardButton size="sm" styleType="outline" onClick={onCancelClick}>
                  Cancelar
                </StandardButton>
                <StandardButton size="sm" styleType="solid" colorScheme="primary" onClick={onSave} disabled={!isDirty || saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </StandardButton>
                <StandardButton size="sm" styleType="outline" colorScheme="danger" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                  Eliminar
                </StandardButton>
              </>
            )}
          </div>
        </div>

        {/* Información del artículo + botón Ver Artículo */}
        {note.article_id ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <StandardText size="xs" className="text-gray-600 dark:text-gray-300 truncate">
              Artículo: {note.article_title || "(sin título)"}
            </StandardText>
            <StandardButton size="sm" styleType="outline" colorScheme="primary" asChild>
              <Link href={`/articulos/detalle?articleId=${note.article_id}`}>
                Ver artículo
              </Link>
            </StandardButton>
          </div>
        ) : null}

        {/* Visibilidad */}
        <div className="mt-3">
          {isEditing ? (
            <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
              <StandardSwitch
                id={`note-visibility-${note.id ?? controlId}`}
                checked={visibility === "public"}
                onCheckedChange={handleToggleVisibility}
                colorScheme="primary"
                size="md"
              />
              <label htmlFor={`note-visibility-${note.id ?? controlId}`} className="text-sm select-none cursor-pointer">
                {visibility === "public" ? "🌐 Pública (visible para el equipo)" : "🔒 Privada (solo tú)"}
              </label>
            </div>
          ) : (
            <StandardText size="xs" className="text-gray-500">
              {visibility === "public" ? "🌐 Nota pública" : "🔒 Nota privada"}
            </StandardText>
          )}
        </div>

        {/* Contenido */}
        <div className="mt-3">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <StandardNote
                value={content}
                onChange={setContent}
                placeholder="Escribe tus notas sobre este artículo..."
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
          ) : (
            content ? (
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {content}
              </p>
            ) : (
              <StandardText size="sm" className="text-gray-500">(sin contenido)</StandardText>
            )
          )}
        </div>

        {/* Otras notas del mismo artículo */}
        {note.article_id ? (
          <div className="mt-4">
            <StandardAccordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={handleAccordionChange}
              colorScheme="accent"
              styleType="subtle"
              className="w-full"
            >
              <StandardAccordionItem value="related">
                <StandardAccordionTrigger>
                  Otras notas del mismo artículo
                </StandardAccordionTrigger>
                <StandardAccordionContent>
                  {isLoadingRelated ? (
                    <StandardText size="sm" className="text-gray-500">Cargando notas relacionadas…</StandardText>
                  ) : relatedError ? (
                    <StandardText size="sm" className="text-red-600">{relatedError}</StandardText>
                  ) : relatedNotes.length === 0 ? (
                    <StandardText size="sm" className="text-gray-500">No hay notas públicas relacionadas.</StandardText>
                  ) : (
                    <ul className="space-y-3">
                      {relatedNotes.map((n) => {
                        const dateStr = n.created_at ? new Date(n.created_at as unknown as string).toLocaleDateString() : "";
                        const snippet = (n.note_content || "").slice(0, 160) + ((n.note_content || "").length > 160 ? "…" : "");
                        return (
                          <li key={String(n.id)} className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link href={`/articulos/notas?noteId=${n.id}&visibility=${n.visibility}&mode=preview`} className="block">
                                  <span className="text-sm font-medium line-clamp-1">{n.title || "(sin título)"}</span>
                                </Link>
                                <div className="mt-1 flex items-center gap-2">
                                  <StandardBadge size="sm" styleType="subtle" colorScheme={n.visibility === "public" ? "success" : "neutral"}>
                                    {n.visibility === "public" ? "Pública" : "Privada"}
                                  </StandardBadge>
                                  {n.author_name ? (
                                    <StandardText size="xs" className="text-gray-500">Autor: {n.author_name}</StandardText>
                                  ) : null}
                                  {dateStr ? (
                                    <StandardText size="xs" className="text-gray-500">· {dateStr}</StandardText>
                                  ) : null}
                                </div>
                                {snippet ? (
                                  <StandardText size="sm" className="mt-2 text-gray-700 dark:text-gray-300 line-clamp-3">
                                    {snippet}
                                  </StandardText>
                                ) : null}
                              </div>
                              {/* Sin controles de edición aquí: lista de solo lectura */}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </StandardAccordionContent>
              </StandardAccordionItem>
            </StandardAccordion>
          </div>
        ) : null}
      </StandardCard.Content>

      {/* Diálogos */}
      <StandardDialog open={showPublicConfirm} onOpenChange={setShowPublicConfirm}>
        <StandardDialog.Content size="sm" colorScheme="warning">
          <StandardDialog.Header>
            <StandardDialog.Title>⚠️ Confirmar visibilidad pública</StandardDialog.Title>
            <StandardDialog.Description>
              Estás a punto de hacer esta nota visible para todo el equipo del proyecto.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" colorScheme="neutral" onClick={() => setShowPublicConfirm(false)}>
              Cancelar
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="warning" onClick={confirmMakePublic}>
              Sí, hacer pública
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      {/* Confirmación de cambios sin guardar al cancelar */}
      <StandardDialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>Hay cambios sin guardar</StandardDialog.Title>
            <StandardDialog.Description>
              Si sales ahora, se perderán los cambios realizados en esta nota.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" colorScheme="neutral" onClick={() => setShowUnsavedConfirm(false)}>
              Seguir editando
            </StandardButton>
            <StandardButton
              styleType="solid"
              colorScheme="warning"
              onClick={() => {
                resetToBaseline();
                setIsEditing(false);
                setShowUnsavedConfirm(false);
              }}
            >
              Salir sin guardar
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      <StandardDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Confirmar eliminación</StandardDialog.Title>
            <StandardDialog.Description>
              ¿Estás seguro de que quieres eliminar esta nota? Esta acción no puede ser revertida.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="danger" onClick={onDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar definitivamente"}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </StandardCard>
  </div>
  );
};

export default StandardCardWithContent;
