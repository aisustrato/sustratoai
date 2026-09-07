"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardMDJViewerClient } from "@/components/mdj-viewer/StandardMDJViewerClient";
import {
  getAnnotations,
  createAnnotation,
  type VersionType,
} from "@/lib/actions/article-annotations-actions";
import type { Anotacion } from "@/lib/mdj/types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type TranslationRow = Database["public"]["Tables"]["article_translations"]["Row"];

export default function DetailClient({
  article,
  translations,
  initialTranslated = false,
}: {
  article: ArticleRow;
  translations: TranslationRow[];
  initialTranslated?: boolean;
}) {
  const t = useTranslations("articulos.detailClient");
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasTranslations = Array.isArray(translations) && translations.length > 0;
  const [showTranslated, setShowTranslated] = React.useState<boolean>(
    hasTranslations ? initialTranslated : false
  );

  const latest = hasTranslations ? translations[0] : null;

  // Obtener parámetros necesarios para la persistencia
  const articleId = searchParams?.get("articleId") || "";
  const versionType: VersionType = showTranslated ? "translated" : "original";

  // Anotaciones (frase notable / nota / referencia) del abstract mostrado
  const [anotaciones, setAnotaciones] = React.useState<Anotacion[]>([]);
  const [loadingAnotaciones, setLoadingAnotaciones] = React.useState(false);

  React.useEffect(() => {
    if (!articleId) return;
    let cancelado = false;
    setLoadingAnotaciones(true);
    getAnnotations(articleId, versionType)
      .then((res) => {
        if (cancelado) return;
        if (res.success) {
          setAnotaciones(res.data);
        } else {
          console.error("[DetailClient] Error al cargar anotaciones:", res.error);
          setAnotaciones([]);
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingAnotaciones(false);
      });
    return () => {
      cancelado = true;
    };
  }, [articleId, versionType]);

  const handleAgregarAnotacion = React.useCallback(
    async (anotacion: Anotacion) => {
      if (!articleId) return { ok: false };
      return createAnnotation({ articleId, versionType, anotacion });
    },
    [articleId, versionType],
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {hasTranslations ? (
            <>
              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                {t('viewOriginal')}
              </StandardText>
              <StandardSwitch
                size="md"
                colorScheme="primary"
                checked={showTranslated}
                onCheckedChange={handleToggle}
                aria-label={t('toggleTranslationAria')}
              />
              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                {t('viewTranslated')}
              </StandardText>
              {latest?.language && (
                <StandardBadge size="sm" styleType="subtle" colorScheme="secondary">
                  {latest.language}
                </StandardBadge>
              )}
            </>
          ) : (
            <StandardBadge size="sm" styleType="subtle" colorScheme="neutral">
              {t('noTranslations')}
            </StandardBadge>
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
          {showTranslated ? t('summaryTranslatedLabel') : t('summaryLabel')}
        </StandardText>
        {shownAbstract ? (
          !loadingAnotaciones && (
            <StandardMDJViewerClient
              key={versionType}
              md={shownAbstract}
              artefactoId={article.id}
              anotaciones={anotaciones}
              onAgregarFraseNotable={handleAgregarAnotacion}
              onAgregarNota={handleAgregarAnotacion}
              onAgregarReferencia={handleAgregarAnotacion}
            />
          )
        ) : (
          <StandardText colorScheme="neutral" colorShade="subtle">—</StandardText>
        )}
      </div>

      {/* Resumen AI (si existe en traducciones) */}
      {aiSummary && (
        <div>
          <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="mt-4 mb-1">
            {t('aiSummaryLabel')}
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
            {t('doiLabel', { doi: article.doi })}
          </StandardBadge>
        )}
        {latest?.translator_system && showTranslated && (
          <StandardBadge size="sm" styleType="outline" colorScheme="accent">
            {t('translatorLabel', { system: latest.translator_system })}
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
