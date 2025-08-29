"use client";

import React, { useState, useCallback } from "react";
import { StandardPopupWindow } from "@/components/ui/StandardPopupWindow";
import { StandardNote } from "@/components/ui/StandardNote";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { toast } from "sonner";
import { createArticleNote, type DetailedNote } from "@/lib/actions/article-notes-actions";
import { useAuth } from "@/app/auth-provider";

interface GroupNoteEditorProps {
  open: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle?: string | null;
  onCreated?: (note: DetailedNote) => void;
}

export default function GroupNoteEditor({ open, onClose, articleId, articleTitle, onCreated }: GroupNoteEditorProps) {
  const { user, proyectoActual } = useAuth();

  const [currentNote, setCurrentNote] = useState("");
  const [currentNoteTitle, setCurrentNoteTitle] = useState("");
  const [currentNoteVisibility, setCurrentNoteVisibility] = useState<"private" | "public">("private");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleNoteContentChange = (val: string) => {
    setCurrentNote(val);
    setHasUnsavedChanges(true);
  };

  const handleNoteTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentNoteTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleNoteVisibilityChange = useCallback((isPublic: boolean) => {
    if (isPublic && currentNoteVisibility === "private") {
      setShowPublicWarning(true);
    } else {
      setCurrentNoteVisibility(isPublic ? "public" : "private");
    }
  }, [currentNoteVisibility]);

  const confirmPublicVisibility = useCallback(() => {
    setCurrentNoteVisibility("public");
    setShowPublicWarning(false);
  }, []);

  const handleSave = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear notas");
      return;
    }
    const projectId = proyectoActual?.id;
    if (!projectId) {
      toast.error("No hay proyecto activo");
      return;
    }
    if (!articleId) {
      toast.error("No se pudo identificar el artículo");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createArticleNote({
        title: currentNoteTitle || "sin título",
        noteContent: currentNote,
        visibility: currentNoteVisibility,
        projectId,
        articleId,
        userId: user.id,
      });

      if (result.success) {
        if (result.data) {
          toast.success("Nota creada correctamente");
          setHasUnsavedChanges(false);
          onCreated?.(result.data);
          onClose();
        } else {
          toast.error("No se pudo obtener la nota creada");
        }
      } else {
        toast.error(result.error ?? "Error al crear la nota");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(`Error inesperado: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  return (
    <>
      <StandardPopupWindow open={open} onOpenChange={handleClose}>
        <StandardPopupWindow.Content size="lg" colorScheme="primary">
          <StandardPopupWindow.Header>
            <StandardPopupWindow.Title>
              Crear nota del artículo
            </StandardPopupWindow.Title>
            {articleTitle && (
              <StandardPopupWindow.Description>
                <span className="text-sm">{articleTitle}</span>
              </StandardPopupWindow.Description>
            )}
          </StandardPopupWindow.Header>

          <StandardPopupWindow.Body className="flex-grow flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <StandardText size="sm" className="mb-2 font-medium">Título (opcional)</StandardText>
                <StandardInput
                  value={currentNoteTitle}
                  onChange={handleNoteTitleChange}
                  placeholder="Título de la nota"
                  colorScheme="primary"
                  size="md"
                />
              </div>
              <div>
                <StandardText size="sm" className="mb-2 font-medium">Visibilidad</StandardText>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <StandardCheckbox
                    id="note-public-checkbox"
                    checked={currentNoteVisibility === "public"}
                    onChange={(e) => handleNoteVisibilityChange(e.target.checked)}
                    colorScheme="primary"
                    size="md"
                    label="🌐 Hacer nota pública (visible para el equipo)"
                    labelClassName="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                  />
                  {currentNoteVisibility === "private" && (
                    <StandardText size="xs" className="text-gray-500 ml-6">
                      🔒 Actualmente privada (solo tú)
                    </StandardText>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-grow flex flex-col">
              <StandardNote
                value={currentNote}
                onChange={handleNoteContentChange}
                placeholder="Escribe tus notas sobre este artículo..."
                colorScheme="primary"
                size="lg"
                minimalToolbar={true}
                viewMode="divided"
                showToolbar={true}
                livePreview={true}
                previewDebounceMs={300}
                className="flex-grow"
              />
            </div>
          </StandardPopupWindow.Body>

          <StandardPopupWindow.Footer>
            <div className="flex justify-between w-full">
              <div />
              <div className="flex gap-2">
                <StandardButton styleType="outline" onClick={handleClose}>
                  Cerrar
                </StandardButton>
                <StandardButton styleType="solid" colorScheme="primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar nota"}
                </StandardButton>
              </div>
            </div>
          </StandardPopupWindow.Footer>
        </StandardPopupWindow.Content>
      </StandardPopupWindow>

      {/* Diálogo: confirmar visibilidad pública */}
      <StandardDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
        <StandardDialog.Content size="sm" colorScheme="warning">
          <StandardDialog.Header>
            <StandardDialog.Title>⚠️ Confirmar visibilidad pública</StandardDialog.Title>
            <StandardDialog.Description>
              Estás a punto de hacer esta nota visible para todo el equipo del proyecto.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" colorScheme="neutral" onClick={() => setShowPublicWarning(false)}>
              Cancelar
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="warning" onClick={confirmPublicVisibility}>
              Sí, hacer pública
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      {/* Diálogo: confirmar cierre con cambios sin guardar */}
      <StandardDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Cambios sin guardar</StandardDialog.Title>
            <StandardDialog.Description>
              Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowCloseConfirm(false)}>
              Cancelar
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="primary" onClick={confirmClose}>
              Cerrar sin guardar
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
