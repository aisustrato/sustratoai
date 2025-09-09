"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { useTextHighlighting } from "@/hooks/use-text-highlighting";
import { Highlighter, Eraser, Loader2 } from "lucide-react";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type TranslationRow = Database["public"]["Tables"]["article_translations"]["Row"];
type HighlightMetadata = {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  timestamp: string;
};

export default function DetailClient({
  article,
  translations,
  initialTranslated = false,
}: {
  article: ArticleRow;
  translations: TranslationRow[];
  initialTranslated?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasTranslations = Array.isArray(translations) && translations.length > 0;
  const [showTranslated, setShowTranslated] = React.useState<boolean>(
    hasTranslations ? initialTranslated : false
  );

  const latest = hasTranslations ? translations[0] : null;

  // Obtener parámetros necesarios para la persistencia
  const articleId = searchParams?.get("articleId") || "";
  const projectId = article.project_id || "";
  const versionType = showTranslated ? "translated" : "original";

  // Callbacks para persistencia de resaltados
  const handleSaveHighlights = React.useCallback(async (data: {
    articleId: string;
    projectId: string;
    versionType: 'original' | 'translated';
    highlightedContent: string;
    highlightsMetadata: HighlightMetadata[];
  }) => {
    console.log('🔄 [DetailClient] Guardando resaltados via API...');
    try {
      const res = await fetch('/api/article-highlights/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Error al guardar resaltados');
      }
      console.log('✅ [DetailClient] Resaltados guardados:', json);
    } catch (error) {
      console.error('❌ [DetailClient] Error al guardar resaltados:', error);
      throw error; // Re-lanzar para que el hook maneje el error
    }
  }, []);

  const handleDeleteHighlights = React.useCallback(async (data: {
    articleId: string;
    versionType: 'original' | 'translated';
  }) => {
    console.log('🔄 [DetailClient] Eliminando resaltados via API...');
    try {
      const res = await fetch('/api/article-highlights/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Error al eliminar resaltados');
      }
      console.log('✅ [DetailClient] Resaltados eliminados:', json);
    } catch (error) {
      console.error('❌ [DetailClient] Error al eliminar resaltados:', error);
      throw error; // Re-lanzar para que el hook maneje el error
    }
  }, []);

  // Hook para manejo de resaltado de texto SIN llamadas client-side a BD
  const {
    highlightedTexts,
    isLoading,
    isSaving,
    containerRef,
    captureSelection,
    highlightSelectedText,
    clearHighlights,
    hasSelection,
  } = useTextHighlighting({
    articleId,
    projectId,
    versionType,
    onSave: handleSaveHighlights,
    onDelete: handleDeleteHighlights
  });

  const updateUrl = React.useCallback(
    (translated: boolean) => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.set("translated", String(translated));
      const articleId = sp.get("articleId");
      if (!articleId) return; // resguardo
      router.replace(`/articulos/detalle?${sp.toString()}`);
    },
    [router, searchParams]
  );

  const handleToggle = React.useCallback(
    (checked: boolean) => {
      if (!hasTranslations) return;
      setShowTranslated(checked);
      updateUrl(checked);
      // Los resaltados se recargarán automáticamente cuando cambie versionType
    },
    [hasTranslations, updateUrl]
  );

  const shownAbstract = showTranslated && latest
    ? latest.abstract ?? latest.summary ?? null
    : article.abstract ?? null;

  const authors = Array.isArray(article.authors) ? article.authors : [];
  const aiSummary = latest?.summary ?? null;

  // Manejar selección de texto y mostrar botón de resaltado
  const [showHighlightButton, setShowHighlightButton] = React.useState(false);

  React.useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const hasText = selection && selection.toString().trim().length > 0;
      
      if (hasText) {
        // Capturar la selección exacta cuando el usuario selecciona texto
        captureSelection();
      }
      
      // Usar la función hasSelection del hook para determinar si mostrar el botón
      setShowHighlightButton(hasSelection());
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [captureSelection, hasSelection]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {hasTranslations ? (
            <>
              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                Ver original
              </StandardText>
              <StandardSwitch
                size="md"
                colorScheme="primary"
                checked={showTranslated}
                onCheckedChange={handleToggle}
                aria-label="Alternar traducción"
              />
              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                Ver traducido
              </StandardText>
              {latest?.language && (
                <StandardBadge size="sm" styleType="subtle" colorScheme="secondary">
                  {latest.language}
                </StandardBadge>
              )}
            </>
          ) : (
            <StandardBadge size="sm" styleType="subtle" colorScheme="neutral">
              Sin traducciones
            </StandardBadge>
          )}
        </div>

        {/* Botones de resaltado */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando resaltados...
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-1 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </div>
          )}
          {showHighlightButton && (
            <StandardButton
              size="sm"
              colorScheme="accent"
              styleType="outline"
              onClick={highlightSelectedText}
              disabled={isSaving}
              leftIcon={Highlighter}
              className="animate-in fade-in-0 zoom-in-95 duration-200"
            >
             
              Resaltar
            </StandardButton>
          )}
          {highlightedTexts.length > 0 && (
            <StandardButton
              size="sm"
              colorScheme="neutral"
              styleType="outline"
              onClick={clearHighlights}
              disabled={isSaving}
              leftIcon={Eraser}
            >
              
              Limpiar
            </StandardButton>
          )}
        </div>
      </div>

      {/* Autores */}
      {authors.length > 0 && (
        <StandardText size="sm" colorScheme="neutral">
          {authors.join(", ")}
        </StandardText>
      )}

      {/* Abstract / Resumen */}
      <div>
        <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="mb-1">
          {showTranslated ? "Resumen (traducido)" : "Resumen"}
        </StandardText>
        {shownAbstract ? (
          <div 
            className="select-text text-base leading-relaxed"
            style={{ fontFamily: 'inherit' }}
            ref={containerRef}
          >
            {shownAbstract}
          </div>
        ) : (
          <StandardText colorScheme="neutral" colorShade="subtle">—</StandardText>
        )}
      </div>

      {/* Resumen AI (si existe en traducciones) */}
      {aiSummary && (
        <div>
          <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="mt-4 mb-1">
            Resumen AI
          </StandardText>
          <div className="text-base leading-relaxed" style={{ fontFamily: 'inherit' }}>
            {aiSummary}
          </div>
        </div>
      )}

      {/* Metadatos adicionales */}
      <div className="flex flex-wrap gap-2">
        {article.doi && (
          <StandardBadge size="sm" styleType="outline" colorScheme="tertiary">
            DOI: {article.doi}
          </StandardBadge>
        )}
        {latest?.translator_system && showTranslated && (
          <StandardBadge size="sm" styleType="outline" colorScheme="accent">
            Traductor: {latest.translator_system}
          </StandardBadge>
        )}
        {latest?.translated_at && showTranslated && (
          <StandardBadge size="sm" styleType="subtle" colorScheme="primary">
            {new Date(latest.translated_at).toLocaleDateString()}
          </StandardBadge>
        )}
      </div>
    </div>
  );
}
