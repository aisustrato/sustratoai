// app/articulos/detalle/page.tsx

import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardCard, StandardCardHeader, StandardCardTitle, StandardCardSubtitle, StandardCardContent } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardAccordion, StandardAccordionItem, StandardAccordionTrigger, StandardAccordionContent } from "@/components/ui/StandardAccordion/StandardAccordion";
import { Filter, MapPin } from "lucide-react";
import { getArticleWithTranslations } from "@/lib/actions/article-actions";
import { getNotes } from "@/lib/actions/article-notes-actions";
import { getGroups, type GroupWithArticleCount } from "@/lib/actions/article-group-actions";
import type { Database } from "@/lib/database.types";
import DetailClient from "./DetailClient";
import ArticlePreclassificationSection from "./ArticlePreclassificationSection";
import ArticleDetailActions from "./ArticleDetailActions";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const articleId = (searchParams?.articleId as string) || "";
  const translatedParam = (searchParams?.translated as string) || "false";
  // Navegación contextual: breadcrumb y botón volver inteligentes
  const prevHrefParam = (searchParams?.returnHref as string) || "";
  const prevLabelParam = (searchParams?.returnLabel as string) || "";
  const prevHref = prevHrefParam ? decodeURIComponent(prevHrefParam) : null;
  const prevLabel = prevLabelParam ? decodeURIComponent(prevLabelParam) : null;
  const breadcrumbs = [
    { label: "Artículos", href: "/articulos" },
    ...(prevHref ? [{ label: prevLabel || "Detalle del lote", href: prevHref }] : []),
    { label: "Detalle del artículo" },
  ];
  const backButton = { href: prevHref || "/articulos", label: prevLabel ? `Volver a ${prevLabel}` : "Volver" } as const;

  if (!articleId) {
    return (
      <div className="p-4 sm:p-6">
        <StandardPageTitle
          title="Detalle de Artículo"
          description="Consulta los datos del artículo y sus traducciones."
          breadcrumbs={breadcrumbs}
          showBackButton={backButton}
        />
        <StandardEmptyState
          title="Falta el parámetro articleId"
          description="Proporciona un ID de artículo válido para ver su detalle."
        />
      </div>
    );
  }

  const res = await getArticleWithTranslations(articleId);
  if (!res.success) {
    return (
      <div className="p-4 sm:p-6">
        <StandardPageTitle
          title="Detalle de Artículo"
          description="Consulta los datos del artículo y sus traducciones."
          breadcrumbs={breadcrumbs}
          showBackButton={backButton}
        />
        <StandardEmptyState
          title="Error al cargar el artículo"
          description={res.error || "Intenta nuevamente más tarde."}
        />
      </div>
    );
  }

  const article = res.data.article as Database["public"]["Tables"]["articles"]["Row"] | null;
  const translations = res.data.translations as Database["public"]["Tables"]["article_translations"]["Row"][];

  if (!article) {
    return (
      <div className="p-4 sm:p-6">
        <StandardPageTitle
          title="Detalle de Artículo"
          description="Consulta los datos del artículo y sus traducciones."
          breadcrumbs={breadcrumbs}
          showBackButton={backButton}
        />
        <StandardEmptyState
          title="Artículo no encontrado"
          description="No existe un artículo con el ID proporcionado."
        />
      </div>
    );
  }

  const hasTranslations = Array.isArray(translations) && translations.length > 0;
  const initialTranslated = hasTranslations && translatedParam === "true";

  // Contenido básico para SSR (mientras el cliente controla el toggle y el URL state)
  const lastTranslation = hasTranslations ? translations[0] : null;
  const shownTitle = initialTranslated && lastTranslation ? lastTranslation.title : (article.title ?? "(Sin título)");
  const metaSubtitle = (article.journal || article.publication_year)
    ? `${article.journal || ""}${article.journal && article.publication_year ? " • " : ""}${article.publication_year || ""}`
    : undefined;

  // Cargar notas del artículo y grupos relacionados
  const [notesRes, groupsRes] = await Promise.all([
    getNotes({ articleId }),
    getGroups({ articleId }),
  ]);
  const notes = notesRes.success ? notesRes.data : [];
  const firstNote = notes && notes.length > 0 ? notes[0] : null;
  const hasNotesForArticle = !!firstNote;
  const noteHref = hasNotesForArticle
    ? `/articulos/notas?noteId=${firstNote!.id}&mode=editor`
    : `/articulos/notas?articleId=${articleId}&mode=editor&visibility=private`;
  const groups: GroupWithArticleCount[] = groupsRes.success ? groupsRes.data : [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <StandardPageTitle
        title={shownTitle}
        subtitle={metaSubtitle}
        description="Consulta los datos del artículo y alterna entre versión original y traducida."
        breadcrumbs={breadcrumbs}
        showBackButton={backButton}
        actions={
          <ArticleDetailActions
            articleId={articleId}
            articleTitle={article.title}
            hasNotesForArticle={hasNotesForArticle}
            noteHref={noteHref}
          />
        }
      />

      <StandardCard colorScheme="primary" styleType="subtle" shadow="lg">
        <StandardCardContent>
          <DetailClient
            article={article}
            translations={translations}
            initialTranslated={initialTranslated}
          />
        </StandardCardContent>
      </StandardCard>

         <StandardAccordion defaultValue="preclassification" type="single" collapsible colorScheme="neutral" styleType="subtle">
            <StandardAccordionItem value="preclassification">
              <StandardAccordionTrigger titleAlign="left">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Preclasificación</span>
                </span>
              </StandardAccordionTrigger>
              <StandardAccordionContent>
                <ArticlePreclassificationSection articleId={articleId} />
              </StandardAccordionContent>
            </StandardAccordionItem>
          </StandardAccordion>


      {groups && groups.length > 0 && (
      
            <StandardAccordion defaultValue="groups" type="single" collapsible colorScheme="neutral" styleType="subtle">
              <StandardAccordionItem value="groups">
                <StandardAccordionTrigger titleAlign="left">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Grupos relacionados</span>
                  </span>
                </StandardAccordionTrigger>
                <StandardAccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups.map((g: GroupWithArticleCount) => (
                      <a key={String(g.id)} href={`/articulos/grupos?groupId=${g.id}`} className="block">
                        <StandardCard colorScheme="secondary" styleType="subtle" shadow="md">
                          <StandardCardHeader>
                            <StandardCardTitle>
                              <StandardText size="md" weight="semibold" className="truncate">
                                {g.name || "(Sin nombre)"}
                              </StandardText>
                            </StandardCardTitle>
                            <StandardCardSubtitle>
                              <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                                {(g.article_count ?? 0)} artículo{(g.article_count ?? 0) === 1 ? "" : "s"}
                              </StandardText>
                            </StandardCardSubtitle>
                          </StandardCardHeader>
                          {g.description && (
                            <StandardCardContent>
                              <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="line-clamp-3">
                                {g.description}
                              </StandardText>
                            </StandardCardContent>
                          )}
                        </StandardCard>
                      </a>
                    ))}
                  </div>
                </StandardAccordionContent>
              </StandardAccordionItem>
            </StandardAccordion>
     
      )}
    </div>
  );
}

