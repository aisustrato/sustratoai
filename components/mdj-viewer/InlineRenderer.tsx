// 📍 components/mdj-viewer/InlineRenderer.tsx
// 'use client' — renderiza NodoInline[] a HTML con colores dinámicos del tema.
// Negritas → accent, cursiva → em, code → estilo monospace.

"use client";

import type { NodoInline } from "@/lib/mdj/types";
import { StandardText } from "@/components/ui/StandardText";
import { renderLatexInline } from "@/components/ui/latex-renderer";

interface InlineRendererProps {
  inline: NodoInline[];
}

export function InlineRenderer({ inline }: InlineRendererProps) {
  return (
    <>
      {inline.map((n, i) => {
        switch (n.tipo) {
          case "texto":
            return <span key={i}>{n.contenido}</span>;
          case "negrita":
            return (
              <StandardText
                key={i}
                asElement="strong"
                colorScheme="accent"
                weight="bold"
              >
                <InlineRenderer inline={n.hijos} />
              </StandardText>
            );
          case "cursiva":
            return (
              <em key={i}>
                <InlineRenderer inline={n.hijos} />
              </em>
            );
          case "neg_cur":
            return (
              <StandardText
                key={i}
                asElement="strong"
                colorScheme="accent"
                weight="bold"
              >
                <em>
                  <InlineRenderer inline={n.hijos} />
                </em>
              </StandardText>
            );
          case "tachado":
            return (
              <del key={i}>
                <InlineRenderer inline={n.hijos} />
              </del>
            );
          case "code_inline":
            return (
              <code
                key={i}
                className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono"
              >
                {n.contenido}
              </code>
            );
          case "latex_inline":
            return <span key={i}>{renderLatexInline(n.contenido)}</span>;
          case "link":
            return (
              <a
                key={i}
                href={n.url}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {n.texto}
              </a>
            );
        }
      })}
    </>
  );
}
