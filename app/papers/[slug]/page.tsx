// 📍 app/papers/[slug]/page.tsx
// Página individual de un paper

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperBySlug, getPaperAnnexes } from "@/lib/papers/queries";
import { PaperMetadata } from "../components/PaperMetadata";
import { PaperBilingualView } from "../components/PaperBilingualView";
import { resolvePaperContentSafe, type PaperIdioma } from "@/lib/papers/i18n";

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

  const idiomaCanonico: PaperIdioma = paper.language === "en" ? "en" : "es";
  const contenido = resolvePaperContentSafe(paper, idiomaCanonico);

  const url = `https://sustrato.ai/papers/${paper.slug}`;
  const abstractPreview = contenido.abstract.substring(0, 160);

  return {
    title: contenido.title,
    description: abstractPreview,
    authors: paper.authors.map((a) => ({ name: a.name })),
    keywords: contenido.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: contenido.title,
      description: abstractPreview,
      type: "article",
      url,
      siteName: "sustrato.ai",
      locale: idiomaCanonico === "en" ? "en_US" : "es_CL",
      publishedTime: paper.published_at || undefined,
      authors: paper.authors.map((a) => a.name),
    },
    twitter: {
      card: "summary_large_image",
      title: contenido.title,
      description: abstractPreview,
      site: "@SustratoAi",
    },
    // Meta tags adicionales para Dublin Core y Google Scholar
    other: {
      // Dublin Core
      "DC.title": contenido.title,
      "DC.date": paper.published_at || "",
      "DC.identifier": paper.doi ? `https://doi.org/${paper.doi}` : url,
      "DC.language": paper.language,
      "DC.type": "Text.Article",
      "DC.rights": "CC-BY-4.0",
      "DC.publisher": "sustrato.ai",
      // Google Scholar
      citation_title: contenido.title,
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
      {/* Metadatos estructurados (JSON-LD) — fijos en el idioma canónico */}
      <PaperMetadata paper={paper} />

      <div className="container py-12">
        <PaperBilingualView paper={paper} annexes={annexes} />
      </div>
    </>
  );
}
