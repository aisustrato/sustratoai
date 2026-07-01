// 📍 app/papers/page.tsx
// Índice público de papers publicados

import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPapers } from "@/lib/papers/queries";
import { StandardCard, StandardCardHeader, StandardCardTitle, StandardCardContent } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";

export const metadata: Metadata = {
  title: "Publicaciones",
  description:
    "Papers académicos publicados por sustrato.ai sobre investigación cualitativa aumentada y arquitecturas híbridas humano-IA.",
  alternates: {
    canonical: "https://sustrato.ai/papers",
  },
};

export default async function PapersIndexPage() {
  const papers = await getPublishedPapers();

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            Publicaciones
          </h1>
          <p className="text-lg text-muted-foreground">
            Papers académicos sobre investigación cualitativa aumentada,
            arquitecturas híbridas humano-IA y revisiones sistemáticas.
          </p>
        </div>

        {/* Lista de papers */}
        {papers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              No hay papers publicados aún.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {papers.map((paper) => {
              const publishedDate = paper.published_at
                ? new Date(paper.published_at).toLocaleDateString("es-CL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : null;

              return (
                <StandardCard key={paper.slug} colorScheme="neutral">
                  <StandardCardHeader>
                    <div className="space-y-3">
                      <StandardCardTitle>
                        <Link
                          href={`/papers/${paper.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {paper.title}
                        </Link>
                      </StandardCardTitle>
                      {paper.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {paper.subtitle}
                        </p>
                      )}
                    </div>
                  </StandardCardHeader>
                  <StandardCardContent>
                    <div className="space-y-4">
                      {/* Autores y fecha */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {paper.authors.map((a) => a.name).join(", ")}
                        </span>
                        {publishedDate && (
                          <>
                            <span>•</span>
                            <time dateTime={paper.published_at || ""}>
                              {publishedDate}
                            </time>
                          </>
                        )}
                      </div>

                      {/* Abstract truncado */}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {paper.abstract_es}
                      </p>

                      {/* Keywords */}
                      {paper.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {paper.keywords.slice(0, 5).map((keyword, index) => (
                            <StandardBadge
                              key={index}
                              colorScheme="primary"
                              size="sm"
                              styleType="subtle"
                            >
                              {keyword}
                            </StandardBadge>
                          ))}
                          {paper.keywords.length > 5 && (
                            <StandardBadge
                              colorScheme="neutral"
                              size="sm"
                              styleType="subtle"
                            >
                              +{paper.keywords.length - 5}
                            </StandardBadge>
                          )}
                        </div>
                      )}

                      {/* Botón leer */}
                      <div>
                        <Link href={`/papers/${paper.slug}`}>
                          <StandardButton
                            styleType="outline"
                            colorScheme="primary"
                            size="sm"
                          >
                            Leer paper
                          </StandardButton>
                        </Link>
                      </div>
                    </div>
                  </StandardCardContent>
                </StandardCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
