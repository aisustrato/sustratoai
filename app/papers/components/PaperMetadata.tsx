// 📍 app/papers/components/PaperMetadata.tsx
// Inyecta metadatos estructurados: JSON-LD schema.org + Dublin Core + Google Scholar

import type { Paper } from "@/lib/papers/types";
import { resolvePaperContentSafe, type PaperIdioma } from "@/lib/papers/i18n";

interface PaperMetadataProps {
  paper: Paper;
  idioma: PaperIdioma;
}

export function PaperMetadata({ paper, idioma }: PaperMetadataProps) {
  const contenido = resolvePaperContentSafe(paper, idioma);
  const slugActual = idioma === "en" && paper.slug_en ? paper.slug_en : paper.slug;

  // JSON-LD para schema.org (ScholarlyArticle)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: contenido.title,
    alternativeHeadline: contenido.subtitle || undefined,
    abstract: contenido.abstract,
    author: paper.authors.map((a) => ({
      "@type": "Person",
      name: a.name,
      identifier: a.orcid ? `https://orcid.org/${a.orcid}` : undefined,
      affiliation: a.affiliation
        ? {
            "@type": "Organization",
            name: a.affiliation,
          }
        : undefined,
    })),
    datePublished: paper.published_at || undefined,
    identifier: paper.doi ? `https://doi.org/${paper.doi}` : undefined,
    url: `https://sustrato.ai/papers/${slugActual}`,
    publisher: {
      "@type": "Organization",
      name: "sustrato.ai",
      url: "https://sustrato.ai",
    },
    inLanguage: idioma,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: contenido.keywords.join(", "),
    version: paper.version,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
