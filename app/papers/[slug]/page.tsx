// 📍 app/papers/[slug]/page.tsx
// Página individual de un paper

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperBySlug } from "@/lib/papers/queries";
import { PaperHeader } from "../components/PaperHeader";
import { PaperMetadata } from "../components/PaperMetadata";
import { PaperActions } from "../components/PaperActions";
import { PaperContent } from "../components/PaperContent";
import { getPaperAnnexes } from "@/lib/papers/queries";
import type { PaperAnnex } from "@/lib/papers/types";

interface PaperPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PaperPageProps): Promise<Metadata> {
  const { slug } = await params;
  const paper = await getPaperBySlug(slug);

  if (!paper) {
    return {
      title: "Paper no encontrado",
    };
  }

  const url = `https://sustrato.ai/papers/${paper.slug}`;
  const abstractPreview = paper.abstract_es.substring(0, 160);

  return {
    title: paper.title,
    description: abstractPreview,
    authors: paper.authors.map((a) => ({ name: a.name })),
    keywords: paper.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: paper.title,
      description: abstractPreview,
      type: "article",
      url,
      siteName: "sustrato.ai",
      locale: "es_CL",
      publishedTime: paper.published_at || undefined,
      authors: paper.authors.map((a) => a.name),
    },
    twitter: {
      card: "summary_large_image",
      title: paper.title,
      description: abstractPreview,
      site: "@SustratoAi",
    },
    // Meta tags adicionales para Dublin Core y Google Scholar
    other: {
      // Dublin Core
      "DC.title": paper.title,
      "DC.date": paper.published_at || "",
      "DC.identifier": paper.doi ? `https://doi.org/${paper.doi}` : url,
      "DC.language": paper.language,
      "DC.type": "Text.Article",
      "DC.rights": "CC-BY-4.0",
      "DC.publisher": "sustrato.ai",
      // Google Scholar
      citation_title: paper.title,
      citation_publication_date: paper.published_at || "",
      citation_online_date: paper.published_at || paper.created_at || "",
      citation_doi: paper.doi || "",
      citation_pdf_url: paper.pdf_url || "",
      citation_abstract_html_url: url,
      citation_language: paper.language,
      // Autores (se agregan dinámicamente abajo)
      ...Object.fromEntries(
        paper.authors.flatMap((author, index) => [
          [`DC.creator.${index}`, author.name],
          [`citation_author.${index}`, author.name],
        ])
      ),
    },
  };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { slug } = await params;
  const paper = await getPaperBySlug(slug);

  if (!paper) {
    notFound();
  }

  const annexes = await getPaperAnnexes(paper.id);

  return (
    <>
      {/* Metadatos estructurados (JSON-LD) */}
      <PaperMetadata paper={paper} />

      <div className="container py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header: título, autores, fecha, DOI */}
          <PaperHeader paper={paper} />

          {/* Acciones: PDF, Zenodo, Citar, Compartir */}
          <PaperActions paper={paper} />

          {/* Abstract */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold">Resumen</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Español
                </h3>
                <p className="text-base leading-relaxed">{paper.abstract_es}</p>
              </div>
              {paper.abstract_en && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    English
                  </h3>
                  <p className="text-base leading-relaxed">
                    {paper.abstract_en}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Contenido principal (Markdown) */}
          <section className="space-y-4">
            <PaperContent content={paper.content_md} />
          </section>

          {/* Anexos / Material Suplementario */}
          {annexes.length > 0 && (
            <section className="space-y-4 border-t pt-8">
              <h2 className="font-heading text-2xl font-bold">
                Anexos / Material Suplementario
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {annexes.map((annex: PaperAnnex) => (
                  <a
                    key={annex.id}
                    href={`https://vgnteswwvallupuanfiz.supabase.co/storage/v1/object/public/paper-annexes/${annex.storage_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border-neutral bg-background-paper hover:border-primary-pure transition-colors"
                  >
                    <div className="p-2 rounded bg-primary-bg flex-shrink-0 text-primary-pure text-lg font-bold">
                      {"{}"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {annex.filename}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {annex.language} •{" "}
                        {annex.file_size > 1024 * 1024
                          ? `${(annex.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(annex.file_size / 1024).toFixed(0)} KB`}
                      </p>
                      {annex.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {annex.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Footer del paper: licencia, cómo citar */}
          <footer className="space-y-4 border-t pt-8 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Licencia</h3>
              <p>
                Este trabajo está licenciado bajo{" "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Creative Commons Attribution 4.0 International (CC-BY-4.0)
                </a>
                .
              </p>
            </div>
            {paper.citation_apa && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Cómo citar
                </h3>
                <p className="font-mono text-xs bg-muted p-3 rounded">
                  {paper.citation_apa}
                </p>
              </div>
            )}
            {paper.doi && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">DOI</h3>
                <p>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {paper.doi}
                  </a>
                </p>
              </div>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}
