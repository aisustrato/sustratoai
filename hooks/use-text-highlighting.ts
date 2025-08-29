"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface HighlightedText {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

interface UseTextHighlightingParams {
  articleId?: string;
  projectId?: string;
  versionType?: 'original' | 'translated';
  onSave?: (data: {
    articleId: string;
    projectId: string;
    versionType: 'original' | 'translated';
    highlightedContent: string;
    highlightsMetadata: HighlightMetadata[];
  }) => Promise<void>;
  onDelete?: (data: {
    articleId: string;
    versionType: 'original' | 'translated';
  }) => Promise<void>;
}

interface HighlightMetadata {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  timestamp: string;
}

export function useTextHighlighting(params: UseTextHighlightingParams = {}) {
  const [highlightedTexts, setHighlightedTexts] = useState<HighlightedText[]>([]);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    range: Range | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { articleId, projectId, versionType, onSave, onDelete } = params;

  console.log(' [useTextHighlighting] Hook inicializado con params:', {
    articleId,
    projectId,
    versionType,
    hasOnSave: !!onSave,
    hasOnDelete: !!onDelete
  });

  // Capturar la selección exacta con su Range
  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setPendingSelection(null);
      return '';
    }
    
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setPendingSelection(null);
      return '';
    }

    // Clonar el range para preservarlo
    const range = selection.getRangeAt(0).cloneRange();
    
    setPendingSelection({
      text: selectedText,
      range: range
    });
    
    return selectedText;
  }, []);

  // Resaltar usando el Range preservado y guardar en BD
  const highlightSelectedText = useCallback(async () => {
    console.log('🖍️ [highlightSelectedText] Iniciando resaltado...');
    console.log('📋 [highlightSelectedText] pendingSelection:', pendingSelection);
    console.log('📋 [highlightSelectedText] hasOnSave:', !!onSave);
    console.log('📋 [highlightSelectedText] articleId:', articleId);
    console.log('📋 [highlightSelectedText] projectId:', projectId);
    console.log('📋 [highlightSelectedText] versionType:', versionType);
    
    if (!pendingSelection || !pendingSelection.range) {
      console.log('❌ [highlightSelectedText] No hay selección pendiente');
      return;
    }

    const { text, range } = pendingSelection;
    
    try {
      // Crear el elemento mark
      const mark = document.createElement('mark');
      mark.className = 'bg-gradient-to-r from-yellow-200 to-yellow-300 font-bold px-2 py-1 rounded-md border-l-4 border-yellow-500 shadow-sm';
      mark.textContent = text;

      // Reemplazar el contenido seleccionado con el mark
      range.deleteContents();
      range.insertNode(mark);

      // Agregar a la lista de resaltados
      const newHighlight: HighlightedText = {
        id: Date.now().toString(),
        text: text,
        startOffset: 0,
        endOffset: text.length,
      };

      const updatedHighlights = [...highlightedTexts, newHighlight];
      setHighlightedTexts(updatedHighlights);
      console.log('✅ [highlightSelectedText] Resaltado agregado localmente:', newHighlight);
      
      // Guardar en base de datos a través del callback del padre
      if (onSave && articleId && projectId && versionType && containerRef.current) {
        console.log('💾 [highlightSelectedText] Intentando guardar en BD...');
        await saveToDatabase(updatedHighlights);
      } else {
        console.log('⚠️ [highlightSelectedText] No se guardará en BD. Condiciones:', {
          hasOnSave: !!onSave,
          hasArticleId: !!articleId,
          hasProjectId: !!projectId,
          hasVersionType: !!versionType,
          hasContainer: !!containerRef.current
        });
      }
      
      // Limpiar selección y pending
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      setPendingSelection(null);
      
    } catch (error) {
      console.error('❌ [highlightSelectedText] Error al aplicar resaltado:', error);
      setPendingSelection(null);
    }
  }, [pendingSelection, highlightedTexts, onSave, articleId, projectId, versionType]);

  // Función para guardar en base de datos a través del callback del padre
  const saveToDatabase = useCallback(async (highlights: HighlightedText[]) => {
    console.log('💾 [saveToDatabase] Iniciando guardado...');
    console.log('📋 [saveToDatabase] Parámetros:', { articleId, projectId, versionType });
    console.log('📋 [saveToDatabase] highlights:', highlights);
    
    if (!articleId || !projectId || !versionType || !containerRef.current || !onSave) {
      console.log('❌ [saveToDatabase] Faltan parámetros requeridos:', {
        hasArticleId: !!articleId,
        hasProjectId: !!projectId,
        hasVersionType: !!versionType,
        hasContainer: !!containerRef.current,
        hasOnSave: !!onSave
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const highlightedContent = containerRef.current.innerHTML;
      const highlightsMetadata = highlights.map(h => ({
        id: h.id,
        text: h.text,
        startOffset: h.startOffset,
        endOffset: h.endOffset,
        timestamp: new Date().toISOString()
      }));

      console.log('📤 [saveToDatabase] Llamando callback onSave del padre:', {
        articleId,
        projectId,
        versionType,
        highlightedContent: highlightedContent.substring(0, 100) + '...',
        highlightsMetadata
      });

      await onSave({
        articleId,
        projectId,
        versionType,
        highlightedContent,
        highlightsMetadata
      });

      console.log('✅ [saveToDatabase] Guardado completado exitosamente');
    } catch (error) {
      console.error('❌ [saveToDatabase] Error al guardar resaltados:', error);
    } finally {
      setIsSaving(false);
    }
  }, [articleId, projectId, versionType, onSave]);

  // Limpiar todos los resaltados
  const clearHighlights = useCallback(async () => {
    if (!containerRef.current) return;
    
    // Remover todos los elementos mark del DOM
    const marks = containerRef.current.querySelectorAll('mark');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize(); // Combinar nodos de texto adyacentes
      }
    });
    
    setHighlightedTexts([]);
    setPendingSelection(null);
    
    // Eliminar de base de datos a través del callback del padre
    if (onDelete && articleId && versionType) {
      try {
        console.log('🗑️ [clearHighlights] Llamando callback onDelete del padre');
        await onDelete({ articleId, versionType });
        console.log('✅ [clearHighlights] Eliminación completada exitosamente');
      } catch (error) {
        console.error('❌ [clearHighlights] Error al eliminar resaltados de BD:', error);
      }
    }
  }, [onDelete, articleId, versionType]);

  // Cargar resaltados persistidos al cambiar artículo o versión
  useEffect(() => {
    let aborted = false;
    const loadHighlights = async () => {
      if (!articleId || !versionType || !containerRef.current) {
        return;
      }
      setIsLoading(true);
      try {
        console.log('🔎 [useTextHighlighting] Cargando resaltados persistidos...', { articleId, versionType });
        const res = await fetch('/api/article-highlights/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId, versionType })
        });
        const json = await res.json();
        if (!aborted && res.ok && json?.success && json?.data) {
          const data = json.data as {
            highlighted_content: string | null;
            highlights_metadata: Array<{
              id: string; text: string; startOffset: number; endOffset: number; timestamp: string;
            }> | null;
          };
          if (data.highlighted_content) {
            // Reemplazar el contenido del contenedor con el HTML guardado
            containerRef.current.innerHTML = data.highlighted_content;
            console.log('✅ [useTextHighlighting] Contenido resaltado aplicado desde BD');
          }
          setHighlightedTexts(Array.isArray(data.highlights_metadata) ? data.highlights_metadata.map(h => ({
            id: h.id,
            text: h.text,
            startOffset: h.startOffset,
            endOffset: h.endOffset,
          })) : []);
        } else {
          console.log('ℹ️ [useTextHighlighting] No hay resaltados guardados');
          if (!aborted) setHighlightedTexts([]);
        }
      } catch (error) {
        console.error('❌ [useTextHighlighting] Error al cargar resaltados persistidos:', error);
        if (!aborted) setHighlightedTexts([]);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    };

    loadHighlights();
    return () => { aborted = true; };
  }, [articleId, versionType]);

  // Verificar si hay texto seleccionado
  const hasSelection = useCallback(() => {
    return !!pendingSelection && !!pendingSelection.text;
  }, [pendingSelection]);

  return {
    highlightedTexts,
    isLoading,
    isSaving,
    containerRef,
    captureSelection,
    highlightSelectedText,
    clearHighlights,
    hasSelection,
  };
}

// Función auxiliar para escapar caracteres especiales en regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
