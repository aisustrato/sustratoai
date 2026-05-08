// 📍 app/papers/components/PaperMetadata.tsx
// Inyecta metadatos estructurados: JSON-LD schema.org + Dublin Core + Google Scholar

import type { Paper } from "@/lib/papers/types";

interface PaperMetadataProps {
  paper: Paper;
}

export function PaperMetadata({ paper }: PaperMetadataProps) {
  // JSON-LD para schema.org (ScholarlyArticle)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: paper.title,
    alternativeHeadline: paper.subtitle || undefined,
    abstract: paper.abstract_es,
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
    url: `https://sustrato.ai/papers/${paper.slug}`,
    publisher: {
      "@type": "Organization",
      name: "sustrato.ai",
      url: "https://sustrato.ai",
    },
    inLanguage: paper.language,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: paper.keywords.join(", "),
    version: paper.version,
  };

  return (
    <>
      {/* JSON-LD para crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Meta tags Dublin Core (en head via Next.js metadata API, estos son informativos) */}
      {/* Los meta tags reales se exportan desde page.tsx con generateMetadata */}
      
      {/* 
        Meta tags que se deben incluir en generateMetadata del page.tsx:
        
        Dublin Core:
        - DC.title
        - DC.creator (uno por autor)
        - DC.date
        - DC.identifier (DOI)
        - DC.language
        - DC.type = "Text.Article"
        - DC.rights
        - DC.publisher = "sustrato.ai"
        
        Google Scholar (citation_*):
        - citation_title
        - citation_author (uno por autor)
        - citation_publication_date
        - citation_doi
        - citation_pdf_url
        - citation_abstract_html_url
        - citation_language
      */}
    </>
  );
}
