// 📍 app/papers/components/PaperHeader.tsx
// Hero del paper: título, autores, fecha, DOI, versión

import type { Paper } from "@/lib/papers/types";
import { StandardBadge } from "@/components/ui/StandardBadge";
import {
  PAPER_LABELS,
  resolvePaperContentSafe,
  type PaperIdioma,
} from "@/lib/papers/i18n";

interface PaperHeaderProps {
  paper: Paper;
  idioma: PaperIdioma;
}

export function PaperHeader({ paper, idioma }: PaperHeaderProps) {
  const contenido = resolvePaperContentSafe(paper, idioma);
  const dateLocale = PAPER_LABELS[idioma].dateLocale;
  const publishedDate = paper.published_at
    ? new Date(paper.published_at).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <header className="space-y-6 border-b pb-8">
      {/* Título y subtítulo */}
      <div className="space-y-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight lg:text-5xl">
          {contenido.title}
        </h1>
        {contenido.subtitle && (
          <p className="text-xl text-muted-foreground">{contenido.subtitle}</p>
        )}
      </div>

      {/* Metadatos: autores, fecha, versión, DOI */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {/* Autores */}
        <div className="flex flex-wrap items-center gap-2">
          {paper.authors.map((author, index) => (
            <span key={index} className="flex items-center gap-1">
              {author.orcid ? (
                <a
                  href={`https://orcid.org/${author.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors underline decoration-dotted"
                >
                  {author.name}
                </a>
              ) : (
                <span>{author.name}</span>
              )}
              {index < paper.authors.length - 1 && <span>,</span>}
            </span>
          ))}
        </div>

        {/* Separador */}
        <span className="text-muted-foreground/50">•</span>

        {/* Fecha de publicación */}
        {publishedDate && <time dateTime={paper.published_at || ""}>{publishedDate}</time>}

        {/* Separador */}
        {publishedDate && <span className="text-muted-foreground/50">•</span>}

        {/* Versión */}
        <StandardBadge colorScheme="neutral" size="sm">
          v{paper.version}
        </StandardBadge>

        {/* DOI */}
        {paper.doi && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              DOI: {paper.doi}
            </a>
          </>
        )}
      </div>

      {/* Keywords */}
      {contenido.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contenido.keywords.map((keyword, index) => (
            <StandardBadge key={index} colorScheme="primary" size="sm" styleType="subtle">
              {keyword}
            </StandardBadge>
          ))}
        </div>
      )}
    </header>
  );
}
