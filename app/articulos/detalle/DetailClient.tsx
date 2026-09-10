"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardFileUpload } from "@/components/ui/StandardFileUpload";
import { StandardMDJViewerClient } from "@/components/mdj-viewer/StandardMDJViewerClient";
import { ArticlePdfJobHandler } from "@/components/jobs/ArticlePdfJobHandler";
import {
  getAnnotations,
  createAnnotation,
  editAnnotation,
  deleteAnnotation,
  type VersionType,
} from "@/lib/actions/article-annotations-actions";
import {
  getCurrentArticlePdfDocument,
  uploadArticlePdf,
  type ArticleFullDocument,
} from "@/lib/actions/article-pdf-actions";
import type { Anotacion } from "@/lib/mdj/types";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

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

  const handleEditarAnotacion = React.useCallback(
    async (anotacion: Anotacion) => {
      if (!articleId) return { ok: false };
      return editAnnotation({ articleId, versionType, anotacion });
    },
    [articleId, versionType],
  );

  const handleBorrarAnotacion = React.useCallback(async (anotacionId: string) => {
    return deleteAnnotation(anotacionId);
  }, []);

  // Documento completo (Fase 2): subir PDF, procesarlo vía Replicate/Marker
  // (workflows/article-pdf-workflow.ts), leer/anotar el MDJ resultante. Nunca
  // se pisa una versión: subir un PDF nuevo marca la anterior is_current=false.
  const [mostrarDocumentoCompleto, setMostrarDocumentoCompleto] = React.useState(false);
  const [fullDocument, setFullDocument] = React.useState<ArticleFullDocument | null>(null);
  const [loadingFullDocument, setLoadingFullDocument] = React.useState(false);
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [processingJobId, setProcessingJobId] = React.useState<string | null>(null);
  const [fullDocAnotaciones, setFullDocAnotaciones] = React.useState<Anotacion[]>([]);
  const [loadingFullDocAnotaciones, setLoadingFullDocAnotaciones] = React.useState(false);

  const recargarFullDocument = React.useCallback(async () => {
    if (!articleId) return;
    setLoadingFullDocument(true);
    const res = await getCurrentArticlePdfDocument(articleId);
    if (res.success) {
      // Si quedó "processing" de una sesión anterior (ej. recarga de página a
      // mitad de proceso), no hay jobId a mano para reconectar el Realtime —
      // el usuario puede refrescar más tarde para ver el resultado.
      setFullDocument(res.data);
    } else {
      console.error("[DetailClient] Error al cargar documento completo:", res.error);
    }
    setLoadingFullDocument(false);
  }, [articleId]);

  React.useEffect(() => {
    recargarFullDocument();
  }, [recargarFullDocument]);

  React.useEffect(() => {
    if (!articleId || fullDocument?.status !== "ready") {
      setFullDocAnotaciones([]);
      return;
    }
    let cancelado = false;
    setLoadingFullDocAnotaciones(true);
    getAnnotations(articleId, "full_text")
      .then((res) => {
        if (cancelado) return;
        if (res.success) setFullDocAnotaciones(res.data);
      })
      .finally(() => {
        if (!cancelado) setLoadingFullDocAnotaciones(false);
      });
    return () => {
      cancelado = true;
    };
  }, [articleId, fullDocument?.status]);

  const handleAgregarAnotacionCompleto = React.useCallback(
    async (anotacion: Anotacion) => {
      if (!articleId) return { ok: false };
      return createAnnotation({ articleId, versionType: "full_text", anotacion });
    },
    [articleId],
  );

  const handleEditarAnotacionCompleto = React.useCallback(
    async (anotacion: Anotacion) => {
      if (!articleId) return { ok: false };
      return editAnnotation({ articleId, versionType: "full_text", anotacion });
    },
    [articleId],
  );

  const handleSeleccionarPdf = React.useCallback(
    async (file: File) => {
      if (!articleId) return;
      setUploadingPdf(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("articleId", articleId);
        const uploadResult = await uploadArticlePdf(formData);
        if (!uploadResult.ok) {
          setUploadError(uploadResult.error);
          return;
        }

        const res = await fetch("/api/workflows/article-pdf/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: uploadResult.documentId }),
        });
        const rawBody = await res.text();
        let startResult: { success: boolean; error?: string; data?: { jobId: string } };
        try {
          startResult = rawBody ? JSON.parse(rawBody) : { success: false };
        } catch {
          // El servidor devolvió un cuerpo no-JSON (ej. crash no manejado) —
          // mostrar el status en vez de tapar el error con "Unexpected end of JSON input".
          startResult = { success: false, error: `Error del servidor (status ${res.status}).` };
        }
        if (!startResult.success || !startResult.data) {
          setUploadError(startResult.error || `No se pudo iniciar el procesamiento del PDF (status ${res.status}).`);
          return;
        }

        setFullDocument({ id: uploadResult.documentId, status: "processing", markdownContent: null, errorMessage: null });
        setProcessingJobId(startResult.data.jobId);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Error desconocido al subir el PDF.");
      } finally {
        setUploadingPdf(false);
      }
    },
    [articleId],
  );

  const handleJobCompletado = React.useCallback(() => {
    setProcessingJobId(null);
    recargarFullDocument();
  }, [recargarFullDocument]);

  const handleJobFallido = React.useCallback(
    (errorMessage: string) => {
      setProcessingJobId(null);
      setFullDocument((prev) => (prev ? { ...prev, status: "error", errorMessage } : prev));
    },
    [],
  );

  // Hint de descubribilidad: nadie lee manuales. Dos mecanismos combinados, ambos
  // por-navegador (localStorage), sin backend:
  // 1) Global, una sola vez en la vida del navegador.
  // 2) Por abstract, en el primer hover, y SOLO si ese abstract todavía no tiene
  //    anotaciones (si ya tiene, es señal de que alguien del proyecto ya lo descubrió).
  const [mostrarHintGlobal, setMostrarHintGlobal] = React.useState(false);
  const [mostrarHintHover, setMostrarHintHover] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!window.localStorage.getItem("mdj_hint_global_seen")) {
        setMostrarHintGlobal(true);
        window.localStorage.setItem("mdj_hint_global_seen", "1");
      }
    } catch {
      // localStorage no disponible (modo privado, etc.) — sin hint, sin romper nada
    }
  }, []);

  const handleAbstractMouseEnter = React.useCallback(() => {
    if (!articleId || anotaciones.length > 0 || loadingAnotaciones) return;
    const clave = `mdj_hint_seen:${articleId}:${versionType}`;
    try {
      if (window.localStorage.getItem(clave)) return;
      window.localStorage.setItem(clave, "1");
    } catch {
      return;
    }
    setMostrarHintHover(true);
    setTimeout(() => setMostrarHintHover(false), 4000);
  }, [articleId, versionType, anotaciones.length, loadingAnotaciones]);

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
        {mostrarHintGlobal && (
          <StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="mb-1 italic">
            {t('annotationHint')}
          </StandardText>
        )}
        {shownAbstract ? (
          !loadingAnotaciones && (
            <div onMouseEnter={handleAbstractMouseEnter} className="relative">
              {mostrarHintHover && !mostrarHintGlobal && (
                <div className="absolute -top-6 left-0 z-20">
                  <StandardBadge size="sm" styleType="subtle" colorScheme="accent">
                    {t('annotationHint')}
                  </StandardBadge>
                </div>
              )}
              <StandardMDJViewerClient
                key={versionType}
                md={shownAbstract}
                artefactoId={article.id}
                anotaciones={anotaciones}
                onAgregarFraseNotable={handleAgregarAnotacion}
                onAgregarNota={handleAgregarAnotacion}
                onAgregarReferencia={handleAgregarAnotacion}
                onEditarNota={handleEditarAnotacion}
                onBorrarNota={handleBorrarAnotacion}
                onEditarReferencia={handleEditarAnotacion}
                onBorrarReferencia={handleBorrarAnotacion}
                onBorrarFraseNotable={handleBorrarAnotacion}
              />
            </div>
          )
        ) : (
          <StandardText colorScheme="neutral" colorShade="subtle">—</StandardText>
        )}
      </div>

      {/* Documento completo (Fase 2): subir PDF, procesar vía Replicate/Marker, anotar el MDJ */}
      <div>
        <StandardButton
          size="sm"
          styleType="outline"
          colorScheme="neutral"
          leftIcon={FileText}
          rightIcon={mostrarDocumentoCompleto ? ChevronUp : ChevronDown}
          onClick={() => setMostrarDocumentoCompleto((v) => !v)}
        >
          {t('fullDocumentToggle')}
        </StandardButton>

        {mostrarDocumentoCompleto && (
          <div className="mt-3 space-y-3">
            {loadingFullDocument ? (
              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                {t('fullDocumentLoading')}
              </StandardText>
            ) : processingJobId ? (
              <ArticlePdfJobHandler
                jobId={processingJobId}
                onCompleted={handleJobCompletado}
                onFailed={handleJobFallido}
              />
            ) : !fullDocument || fullDocument.status === "error" ? (
              <div className="space-y-2">
                {fullDocument?.status === "error" && (
                  <StandardText size="sm" colorScheme="danger">
                    {t('fullDocumentErrorPrefix')}: {fullDocument.errorMessage}
                  </StandardText>
                )}
                {uploadError && (
                  <StandardText size="sm" colorScheme="danger">
                    {uploadError}
                  </StandardText>
                )}
                <StandardFileUpload
                  onFileSelect={handleSeleccionarPdf}
                  accept="application/pdf"
                  maxSizeMB={50}
                  disabled={uploadingPdf}
                  title={t('fullDocumentUploadTitle')}
                  buttonText={t('fullDocumentUploadButton')}
                />
              </div>
            ) : fullDocument.status === "processing" ? (
              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                {t('fullDocumentProcessing')}
              </StandardText>
            ) : (
              <div className="space-y-3">
                <StandardFileUpload
                  onFileSelect={handleSeleccionarPdf}
                  accept="application/pdf"
                  maxSizeMB={50}
                  disabled={uploadingPdf}
                  title={t('fullDocumentReplaceTitle')}
                  buttonText={t('fullDocumentReplaceButton')}
                />
                {uploadError && (
                  <StandardText size="sm" colorScheme="danger">
                    {uploadError}
                  </StandardText>
                )}
                {!loadingFullDocAnotaciones && fullDocument.markdownContent && (
                  <StandardMDJViewerClient
                    md={fullDocument.markdownContent}
                    artefactoId={article.id}
                    tipoArtefacto="transcripcion_pdf"
                    anotaciones={fullDocAnotaciones}
                    onAgregarFraseNotable={handleAgregarAnotacionCompleto}
                    onAgregarNota={handleAgregarAnotacionCompleto}
                    onAgregarReferencia={handleAgregarAnotacionCompleto}
                    onEditarNota={handleEditarAnotacionCompleto}
                    onBorrarNota={handleBorrarAnotacion}
                    onEditarReferencia={handleEditarAnotacionCompleto}
                    onBorrarReferencia={handleBorrarAnotacion}
                    onBorrarFraseNotable={handleBorrarAnotacion}
                  />
                )}
              </div>
            )}
          </div>
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
