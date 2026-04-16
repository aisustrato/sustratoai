"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { StandardPopupWindow } from '@/components/ui/StandardPopupWindow';
import { StandardNote } from '@/components/ui/StandardNote';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardCheckbox } from '@/components/ui/StandardCheckbox';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardText } from '@/components/ui/StandardText';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth-provider';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';

// Tipos locales mínimos para evitar importar desde módulos "use server"
type NoteVisibility = 'public' | 'private';
type DetailedNote = {
  id: string;
  title: string | null;
  note_content: string | null;
  visibility: NoteVisibility;
};

interface ArticleForReview {
  item_id: string;
  article_data: {
    original_title?: string | null;
    translated_title?: string | null;
  } | null;
}

interface NoteEditorProps {
  open: boolean;
  onClose: () => void;
  article: ArticleForReview | null;
  project: { id: string; name: string; } | null;
  showOriginalAsPrimary: boolean;
  // Notifica al padre que cambió la presencia de notas (true=hay nota, false=no hay)
  onNotesChanged?: (hasNotesNow: boolean) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ open, onClose, article, project, showOriginalAsPrimary, onNotesChanged }): JSX.Element => {
  const [currentNote, setCurrentNote] = useState('');
  const [currentNoteTitle, setCurrentNoteTitle] = useState('');
  const [currentNoteVisibility, setCurrentNoteVisibility] = useState<'private' | 'public'>('private');
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [existingNote, setExistingNote] = useState<DetailedNote | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  // Estado para controlar el modo de visualización del StandardNote
  const [noteViewMode, setNoteViewMode] = useState<'divided' | 'editor' | 'preview'>('divided');
  // Estado para controlar si se está cargando una nota existente
  const [isLoadingNote, setIsLoadingNote] = useState(false);

  const loadExistingNote = useCallback(async (batchItemId: string, projectId?: string) => {
    setIsLoadingNote(true);
    try {
      console.log('[CLIENT] Cargando nota existente para batchItemId:', batchItemId);
      
      if (!projectId) {
        console.warn('[CLIENT] No hay projectId disponible; se asume que no hay notas para cargar');
        // No mostramos error al usuario aquí, simplemente asumimos que no hay nota existente
        setExistingNote(null);
        setCurrentNote('');
        setCurrentNoteTitle('');
        setCurrentNoteVisibility('private');
        setHasUnsavedChanges(false);
        setIsLoadingNote(false);
        return;
      }
      
      // Primero obtenemos el articleId real vía API
      const articleIdResp = await fetch(`/api/article-notes/by-batch-item?batchItemId=${encodeURIComponent(batchItemId)}`);
      const articleIdJson = await articleIdResp.json();
      if (!articleIdResp.ok || !articleIdJson?.success) {
        console.error('[CLIENT] Error al obtener el ID del artículo:', articleIdJson?.error || articleIdResp.statusText);
        setExistingNote(null);
        setCurrentNote('');
        setCurrentNoteTitle('');
        setCurrentNoteVisibility('private');
        setHasUnsavedChanges(false);
        setIsLoadingNote(false);
        return;
      }
      const articleId: string | null = articleIdJson?.data?.articleId ?? null;
      console.log('[CLIENT] Buscando notas para articleId:', articleId);
      
      if (!articleId) {
        console.log('[CLIENT] No hay articleId asociado; no se cargarán notas');
        setExistingNote(null);
        setCurrentNote('');
        setCurrentNoteTitle('');
        setCurrentNoteVisibility('private');
        setHasUnsavedChanges(false);
        setIsLoadingNote(false);
        return;
      }

      // Buscamos notas existentes para este artículo vía API related
      const relatedUrl = `/api/article-notes/related?articleId=${encodeURIComponent(articleId)}&projectId=${encodeURIComponent(projectId)}`;
      const notesResp = await fetch(relatedUrl);
      const notesJson = await notesResp.json();
      
      if (notesResp.ok && notesJson?.success && Array.isArray(notesJson.data) && notesJson.data.length > 0) {
        const note: DetailedNote = notesJson.data[0] as DetailedNote;
        console.log('[CLIENT] Nota existente encontrada:', { 
          id: note.id, 
          title: note.title,
          contentLength: note.note_content?.length || 0,
          visibility: note.visibility
        });
        
        setExistingNote(note);
        setCurrentNote(note.note_content || '');
        setCurrentNoteTitle(note.title || '');
        setCurrentNoteVisibility(note.visibility || 'private');
      } else {
        console.log('[CLIENT] No se encontraron notas existentes para este artículo');
        setExistingNote(null);
        setCurrentNote('');
        setCurrentNoteTitle('');
        setCurrentNoteVisibility('private');
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('[CLIENT] Error al cargar la nota existente:', error);
      // En caso de error, asumimos que no hay nota existente
      setExistingNote(null);
      setCurrentNote('');
      setCurrentNoteTitle('');
      setCurrentNoteVisibility('private');
      setHasUnsavedChanges(false);
    } finally {
      setIsLoadingNote(false);
    }
  }, []);

  const { user, proyectoActual: authProject } = useAuth();

  useEffect(() => {
    console.group('[NoteEditor] props change/open');
    const projectId = project?.id || authProject?.id;
    console.log('[NoteEditor] props recibidos', {
      open,
      articleItemId: article?.item_id,
      projectProp: project?.id,
      authProject: authProject?.id,
      resolvedProjectId: projectId,
    });
    if (open && article) {
      console.log('[NoteEditor] Invocando loadExistingNote', {
        batchItemId: article.item_id,
        projectId,
      });
      void loadExistingNote(article.item_id, projectId);
    } else {
      console.log('[NoteEditor] Popup cerrado o sin artículo: reseteando estado');
      // Reset state when closed
      setExistingNote(null);
      setCurrentNote('');
      setCurrentNoteTitle('');
      setCurrentNoteVisibility('private');
      setHasUnsavedChanges(false);
    }
    console.groupEnd();
  }, [open, article, project, authProject, loadExistingNote]);

  // Log del resultado de carga de nota
  useEffect(() => {
    if (!open) return;
    console.log('[NoteEditor] estado de búsqueda de nota', {
      isLoadingNote,
      hasExistingNote: Boolean(existingNote),
      existingNoteId: existingNote?.id,
      title: existingNote?.title,
      contentLength: existingNote?.note_content?.length || 0,
      visibility: existingNote?.visibility,
    });
  }, [open, existingNote, isLoadingNote]);

  const handleNoteContentChange = (noteContent: string) => {
    setCurrentNote(noteContent);
    setHasUnsavedChanges(true);
  };

  const handleNoteTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentNoteTitle(event.target.value);
    setHasUnsavedChanges(true);
  };

  const handleNoteVisibilityChange = useCallback((isPublic: boolean) => {
    if (isPublic && currentNoteVisibility === 'private') {
      setShowPublicWarning(true);
    } else {
      setCurrentNoteVisibility(isPublic ? 'public' : 'private');
    }
  }, [currentNoteVisibility]);

  const confirmPublicVisibility = useCallback(() => {
    setCurrentNoteVisibility('public');
    setShowPublicWarning(false);
  }, []);


  const handleSaveNote = async () => {
    console.group('[CLIENT] handleSaveNote - Iniciando guardado de nota');
    console.log('Datos actuales:', {
      hasUnsavedChanges,
      currentNoteTitle,
      currentNoteLength: currentNote.length,
      currentNoteVisibility,
      existingNote: existingNote ? `Nota existente (ID: ${existingNote.id})` : 'Nueva nota',
      user: user ? 'Autenticado' : 'No autenticado',
      project: project ? `Proyecto ID: ${project.id}` : 'Sin proyecto',
      authProject: authProject ? `Proyecto Auth ID: ${authProject.id}` : 'Sin proyecto en auth'
    });

    if (!article) {
      const errorMsg = 'No se puede guardar: No hay un artículo seleccionado';
      console.error('[CLIENT] Error:', errorMsg);
      toast.error(errorMsg);
      console.groupEnd();
      return;
    }
    
    // Obtenemos el ID del ítem del lote
    const batchItemId = article.item_id;
    if (!batchItemId) {
      const errorMsg = 'No se puede guardar: No se pudo identificar el ítem del lote correctamente';
      console.error('[CLIENT] Error:', errorMsg, { article });
      toast.error(errorMsg);
      console.groupEnd();
      return;
    }
    
    // Verificamos si el artículo tiene datos básicos
    if (!article.article_data) {
      const errorMsg = 'No se puede guardar: El artículo no tiene datos válidos';
      console.error('[CLIENT] Error:', errorMsg, { article });
      toast.error(errorMsg);
      console.groupEnd();
      return;
    }
    
    if (!user) {
      const errorMsg = 'No se puede guardar: Usuario no autenticado';
      console.error('[CLIENT] Error:', errorMsg);
      toast.error(errorMsg);
      console.groupEnd();
      return;
    }
    
    const projectId = project?.id || authProject?.id;
    if (!projectId) {
      const errorMsg = 'No se puede guardar: No hay un proyecto seleccionado';
      console.error('[CLIENT] Error:', errorMsg);
      toast.error(errorMsg);
      console.groupEnd();
      return;
    }

    setIsSaving(true);
    console.log('[CLIENT] Estado de guardado: Iniciando...');
    
    try {
      // Obtenemos el ID real del artículo vía API
      const articleIdResp = await fetch(`/api/article-notes/by-batch-item?batchItemId=${encodeURIComponent(batchItemId)}`);
      const articleIdJson = await articleIdResp.json();
      if (!articleIdResp.ok || !articleIdJson?.success || !articleIdJson?.data?.articleId) {
        const errorMsg = `No se pudo obtener el ID del artículo: ${articleIdJson?.error || articleIdResp.statusText}`;
        console.error('[CLIENT] Error:', errorMsg);
        toast.error(errorMsg);
        console.groupEnd();
        setIsSaving(false);
        return;
      }
      
      const articleId: string = articleIdJson.data.articleId;
      
      const noteData = {
        title: currentNoteTitle || 'sin título',
        noteContent: currentNote,
        visibility: currentNoteVisibility as 'public' | 'private',
        projectId,
        articleId, // Usamos el ID real del artículo
        userId: user.id
      };
      
      console.log('[CLIENT] Datos del artículo:', {
        batch_item_id: batchItemId,
        article_id: articleId,
        article_data: article.article_data ? 'Disponible' : 'No disponible',
        title: article.article_data.original_title || 'Sin título'
      });

      console.log('[CLIENT] Datos a guardar:', {
        ...noteData,
        noteContent: `${currentNote.substring(0, 50)}${currentNote.length > 50 ? '...' : ''} (${currentNote.length} caracteres)`
      });

      let fetchResp: Response;
      if (existingNote?.id) {
        console.log(`[CLIENT] Actualizando nota existente (ID: ${existingNote.id})`);
        fetchResp = await fetch(`/api/article-notes/${encodeURIComponent(existingNote.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: noteData.title,
            noteContent: noteData.noteContent,
            visibility: noteData.visibility,
          }),
        });
      } else {
        console.log('[CLIENT] Creando nueva nota');
        fetchResp = await fetch('/api/article-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        });
      }

      const resultJson = await fetchResp.json();
      console.log('[CLIENT] Resultado de la operación:', resultJson);

      if (fetchResp.ok && resultJson?.success) {
        const successMsg = existingNote ? 'Nota actualizada correctamente' : 'Nota guardada correctamente';
        console.log(`[CLIENT] Éxito: ${successMsg}`);
        toast.success(successMsg);
        setHasUnsavedChanges(false);
        
        if (resultJson.data) {
          console.log('[CLIENT] Actualizando nota existente en el estado local');
          setExistingNote(resultJson.data as DetailedNote);
        }
        // Notificar al padre que ahora hay nota
        try {
          onNotesChanged?.(true);
        } catch (e) {
          console.warn('[CLIENT] onNotesChanged(true) lanzó una excepción no crítica:', e);
        }
      } else {
        const errorMsg = resultJson?.error || 'Error desconocido al guardar la nota';
        console.error('[CLIENT] Error al guardar la nota:', errorMsg);
        toast.error(`Error al guardar la nota: ${errorMsg}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[CLIENT] Excepción al guardar la nota:', error);
      toast.error(`Error inesperado al guardar la nota: ${errorMessage}`);
    } finally {
      console.log('[CLIENT] Finalizando proceso de guardado');
      setIsSaving(false);
      console.groupEnd();
    }
  };

  const handleDeleteNote = async () => {
    if (!existingNote?.id) {
      toast.error('Error: No se puede eliminar una nota sin ID.');
      return;
    }
    const resp = await fetch(`/api/article-notes/${encodeURIComponent(existingNote.id)}`, { method: 'DELETE' });
    const json = await resp.json();
    if (resp.ok && json?.success) {
      toast.success('Nota eliminada.');
      // Notificar al padre que ya no hay nota
      try {
        onNotesChanged?.(false);
      } catch (e) {
        console.warn('[CLIENT] onNotesChanged(false) lanzó una excepción no crítica:', e);
      }
      onClose(); // Cerrar el editor después de eliminar
    } else {
      toast.error(json?.error || 'Error al eliminar la nota');
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
            <StandardPopupWindow.Title>Nueva Nota del Artículo</StandardPopupWindow.Title>
            <StandardPopupWindow.Description>
              {article && (
                <span className="text-sm">
                  {showOriginalAsPrimary
                    ? (article.article_data?.original_title ?? 'Sin título')
                    : (article.article_data?.translated_title ?? article.article_data?.original_title ?? 'Sin título')}
                </span>
              )}
            </StandardPopupWindow.Description>
          </StandardPopupWindow.Header>

          <StandardPopupWindow.Body className="flex-grow flex flex-col gap-4 overflow-y-auto">
            {isLoadingNote ? (
              <div className="flex flex-col items-center justify-center py-12">
                <SustratoLoadingLogo 
                  size={60} 
                  variant="pulse" 
                  speed="normal" 
                  className="mb-4"
                  showText={true}
                  text="Buscando notas existentes..."
                />
                <StandardText size="sm" className="text-gray-500 dark:text-gray-400 mt-2">
                  Cargando la nota del artículo...
                </StandardText>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <StandardText size="sm" className="mb-2 font-medium">Título de la nota (opcional)</StandardText>
                    <StandardInput 
                      value={currentNoteTitle} 
                      onChange={handleNoteTitleChange} 
                      placeholder="Título de la nota (se guardará como 'sin título' si se deja vacío)" 
                      colorScheme="primary" 
                      size="md" 
                    />
                  </div>
                  <div>
                    <StandardText size="sm" className="mb-2 font-medium">Visibilidad de la nota</StandardText>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <StandardCheckbox
                          id="note-public-checkbox"
                          checked={currentNoteVisibility === 'public'}
                          onChange={(e) => handleNoteVisibilityChange(e.target.checked)}
                          colorScheme="primary"
                          size="md"
                          label="🌐 Hacer nota pública (visible para el equipo)"
                          labelClassName="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                        />
                      </div>
                      {currentNoteVisibility === 'private' && (
                        <StandardText size="xs" className="text-gray-500 ml-6">
                          🔒 Actualmente privada (solo tú puedes verla)
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
                    viewMode={noteViewMode}
                    onViewModeChange={setNoteViewMode}
                    showToolbar={true}
                    livePreview={true}
                    previewDebounceMs={300}
                    className="flex-grow"
                  />
                </div>
              </>
            )}
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

      {/* Diálogo de confirmación para hacer nota pública */}
      <StandardDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
        <StandardDialog.Content size="sm" colorScheme="warning">
          <StandardDialog.Header>
            <StandardDialog.Title>⚠️ Confirmar Visibilidad Pública</StandardDialog.Title>
            <StandardDialog.Description>
              Estás a punto de hacer esta nota visible para todo el equipo del proyecto.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <div className="space-y-3">
              <StandardText size="sm" className="text-gray-600 dark:text-gray-400">
                Una vez que la nota sea pública:
              </StandardText>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                <li>Todos los miembros del equipo podrán verla</li>
                <li>Aparecerá en las vistas compartidas del proyecto</li>
                <li>Podrás cambiarla de vuelta a privada más tarde si lo deseas</li>
              </ul>
            </div>
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardButton 
              styleType="outline" 
              colorScheme="neutral" 
              onClick={() => setShowPublicWarning(false)}
            >
              Cancelar
            </StandardButton>
            <StandardButton 
              styleType="solid" 
              colorScheme="warning" 
              onClick={confirmPublicVisibility}
            >
              Sí, hacer pública
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

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