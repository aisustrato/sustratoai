"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StandardPopupWindow } from '@/components/ui/StandardPopupWindow';
import { StandardNote } from '@/components/ui/StandardNote';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardSelect } from '@/components/ui/StandardSelect';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardText } from '@/components/ui/StandardText';
import { toast } from 'sonner';
import { getNotes, createArticleNote, updateArticleNote, deleteArticleNote, type DetailedNote, type CreateNotePayload, type UpdateNotePayload } from '@/lib/actions/article-notes-actions';
import type { ArticleForReview } from '@/lib/actions/preclassification-actions';

interface NoteEditorProps {
  open: boolean;
  onClose: () => void;
  article: ArticleForReview | null;
  project: { id: string; name: string; } | null;
  showOriginalAsPrimary: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ open, onClose, article, project, showOriginalAsPrimary }) => {
  const [currentNote, setCurrentNote] = useState('');
  const [currentNoteTitle, setCurrentNoteTitle] = useState('');
  const [currentNoteVisibility, setCurrentNoteVisibility] = useState<'public' | 'private'>('private');
  const [existingNote, setExistingNote] = useState<DetailedNote | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const loadExistingNote = useCallback(async (articleId: string) => {
    const result = await getNotes({ articleId });
    if (result.success && result.data && result.data.length > 0) {
      const note = result.data[0];
      setExistingNote(note);
      setCurrentNote(note.note_content || '');
      setCurrentNoteTitle(note.title || '');
      setCurrentNoteVisibility(note.visibility || 'private');
    } else {
      setExistingNote(null);
      setCurrentNote('');
      setCurrentNoteTitle('');
      setCurrentNoteVisibility('private');
    }
    setHasUnsavedChanges(false);
  }, []);

  useEffect(() => {
    if (open && article) {
      loadExistingNote(article.item_id);
    } else {
      // Reset state when closed
      setExistingNote(null);
      setCurrentNote('');
      setCurrentNoteTitle('');
      setCurrentNoteVisibility('private');
      setHasUnsavedChanges(false);
    }
  }, [open, article, loadExistingNote]);

  const handleNoteContentChange = (noteContent: string) => {
    setCurrentNote(noteContent);
    setHasUnsavedChanges(true);
  };

  const handleNoteTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentNoteTitle(event.target.value);
    setHasUnsavedChanges(true);
  };

  const handleNoteVisibilityChange = (value: string | string[] | undefined) => {
    setCurrentNoteVisibility(value as 'public' | 'private');
    setHasUnsavedChanges(true);
  };

  const handleSaveNote = async () => {
    if (!project || !article) {
      toast.error('Error: Falta información del proyecto o del artículo.');
      return;
    }

    setIsSaving(true);
    try {
      const noteTitle = currentNoteTitle.trim() || 'sin título';
      if (existingNote) {
        if (!existingNote.id) {
          toast.error('Error: La nota existente no tiene ID para actualizar.');
          return;
        }
        const result = await updateArticleNote({ noteId: existingNote.id, title: noteTitle, noteContent: currentNote, visibility: currentNoteVisibility });
        if (result.success) {
          setExistingNote(result.data);
          toast.success('Nota actualizada exitosamente');
          setHasUnsavedChanges(false);
        }
      } else {
        const result = await createArticleNote({ projectId: project.id, articleId: article.item_id, title: noteTitle, noteContent: currentNote, visibility: currentNoteVisibility });
        if (result.success) {
          setExistingNote(result.data);
          toast.success('Nota creada exitosamente');
          setHasUnsavedChanges(false);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!existingNote || !existingNote.id) {
      toast.error('Error: No se puede eliminar una nota sin ID.');
      return;
    }
    const result = await deleteArticleNote(existingNote.id);
    if (result.success) {
      toast.success('Nota eliminada.');
      onClose(); // Close the editor after deletion
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
        <StandardPopupWindow.Content size="lg" colorScheme="primary" className="flex flex-col h-[90vh]">
          <StandardPopupWindow.Header>
            <StandardPopupWindow.Title>Nueva Nota del Artículo</StandardPopupWindow.Title>
            <StandardPopupWindow.Description>
              {article && (
                <span className="text-sm">
                  {showOriginalAsPrimary ? article.article_data.original_title : (article.article_data.translated_title || article.article_data.original_title)}
                </span>
              )}
            </StandardPopupWindow.Description>
          </StandardPopupWindow.Header>

          <StandardPopupWindow.Body className="flex-grow flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <StandardText size="sm" className="mb-2 font-medium">Título de la nota (opcional)</StandardText>
                <StandardInput value={currentNoteTitle} onChange={handleNoteTitleChange} placeholder="Título de la nota (se guardará como 'sin título' si se deja vacío)" colorScheme="primary" size="md" />
              </div>
              <div>
                <StandardText size="sm" className="mb-2 font-medium">Visibilidad de la nota</StandardText>
                <StandardSelect value={currentNoteVisibility} onChange={handleNoteVisibilityChange} colorScheme="primary" placeholder="Seleccionar visibilidad" options={[{ value: 'private', label: '🔒 Privada (solo yo puedo verla)' }, { value: 'public', label: '🌐 Pública (visible para el equipo)' }]} clearable={false} />
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
              <div>
                {existingNote && (
                  <StandardButton styleType="outline" colorScheme="danger" onClick={() => setShowDeleteConfirm(true)}>Eliminar Nota</StandardButton>
                )}
              </div>
              <div className="flex gap-2">
                <StandardButton styleType="outline" onClick={handleClose}>Cerrar</StandardButton>
                <StandardButton styleType="solid" colorScheme="primary" onClick={handleSaveNote} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : (existingNote ? 'Actualizar Nota' : 'Guardar Nota')}
                </StandardButton>
              </div>
            </div>
          </StandardPopupWindow.Footer>
        </StandardPopupWindow.Content>
      </StandardPopupWindow>

      <StandardDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Confirmar Eliminación</StandardDialog.Title>
            <StandardDialog.Description>¿Estás seguro de que quieres eliminar esta nota? Esta acción no puede ser revertida.</StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</StandardButton>
            <StandardButton styleType="solid" colorScheme="danger" onClick={handleDeleteNote}>Eliminar Definitivamente</StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      <StandardDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Cambios sin Guardar</StandardDialog.Title>
            <StandardDialog.Description>Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?</StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowCloseConfirm(false)}>Cancelar</StandardButton>
            <StandardButton styleType="solid" colorScheme="primary" onClick={confirmClose}>Cerrar sin Guardar</StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
};