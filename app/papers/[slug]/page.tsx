// 📍 app/papers/[slug]/page.tsx
// Página individual de un paper — una URL por idioma (/papers/[slug] en
// español, /papers/[slug_en] en inglés), con hreflang cruzado. El idioma se
// resuelve por CUÁL columna matcheó el slug de la URL, no por el campo
// `language` (que solo indica cuál es la variante "por defecto"/histórica).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperBySlugEitherLang, getPaperAnnexes } from "@/lib/papers/queries";
import { PaperMetadata } from "../components/PaperMetadata";
import { PaperBilingualView } from "../components/PaperBilingualView";
import { DMZNavbar } from "../components/DMZNavbar";
import { PapersFooter } from "../components/PapersFooter";
import { resolvePaperContentSafe } from "@/lib/papers/i18n";

interface PaperPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PaperPageProps): Promise<Metadata> {
  const { slug } = await params;
  const match = await getPaperBySlugEitherLang(slug);

  if (!match) {
    return {
      title: "Paper no encontrado",
    };
  }

  const { paper, idioma } = match;
  const contenido = resolvePaperContentSafe(paper, idioma);

  const url = `https://sustrato.ai/papers/${slug}`;
  const pdfUrl = idioma === "en" ? paper.pdf_url_en : paper.pdf_url;
  const abstractPreview = contenido.abstract.substring(0, 160);
  const authorNames = paper.authors.map((a) => a.name);

  const languages: Record<string, string> = {};
  if (paper.slug) languages.es = `https://sustrato.ai/papers/${paper.slug}`;
  if (paper.slug_en) languages.en = `https://sustrato.ai/papers/${paper.slug_en}`;

  return {
    title: contenido.title,
    description: abstractPreview,
    authors: authorNames.map((name) => ({ name })),
    keywords: contenido.keywords,
    alternates: {
      canonical: url,
      languages: Object.keys(languages).length > 1 ? languages : undefined,
    },
    openGraph: {
      title: contenido.title,
      description: abstractPreview,
      type: "article",
      url,
      siteName: "sustrato.ai",
      locale: idioma === "en" ? "en_US" : "es_CL",
      publishedTime: paper.published_at || undefined,
      authors: authorNames,
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
      "DC.creator": authorNames,
      "DC.date": paper.published_at || "",
      "DC.identifier": paper.doi ? `https://doi.org/${paper.doi}` : url,
      "DC.language": idioma,
      "DC.type": "Text.Article",
      "DC.rights": "CC-BY-4.0",
      "DC.publisher": "sustrato.ai",
      // Google Scholar — un <meta citation_author> repetido por autor, en
      // orden de autoría (Next.js Metadata emite un tag por elemento del
      // array; el hack anterior de `citation_author.${index}` no lo
      // reconocía Scholar, que exige el nombre de tag literal repetido).
      citation_title: contenido.title,
      citation_author: authorNames,
      citation_publication_date: paper.published_at || "",
      citation_online_date: paper.published_at || paper.created_at || "",
      citation_doi: paper.doi || "",
      citation_pdf_url: pdfUrl || "",
      citation_abstract_html_url: url,
      citation_language: idioma,
      citation_publisher: "sustrato.ai",
      citation_keywords: contenido.keywords.join("; "),
    },
  };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { slug } = await params;
  const match = await getPaperBySlugEitherLang(slug);

  if (!match) {
    notFound();
  }

  const { paper, idioma } = match;
  const annexes = await getPaperAnnexes(paper.id);

  return (
    <>
      {/* Metadatos estructurados (JSON-LD), en el idioma resuelto por la URL */}
      <PaperMetadata paper={paper} idioma={idioma} />

      <DMZNavbar idioma={idioma} />
      <main className="flex-1 container py-12">
        <PaperBilingualView paper={paper} annexes={annexes} idioma={idioma} />
      </main>
      <PapersFooter idioma={idioma} />
    </>
  );
}
