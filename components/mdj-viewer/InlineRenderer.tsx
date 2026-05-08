// 📍 components/mdj-viewer/InlineRenderer.tsx
// Server Component — renderiza NodoInline[] a HTML plano

import type { NodoInline } from "@/lib/mdj/types";

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
              <strong key={i}>
                <InlineRenderer inline={n.hijos} />
              </strong>
            );
          case "cursiva":
            return (
              <em key={i}>
                <InlineRenderer inline={n.hijos} />
              </em>
            );
          case "neg_cur":
            return (
              <strong key={i}>
                <em>
                  <InlineRenderer inline={n.hijos} />
                </em>
              </strong>
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
            return (
              <code key={i} className="font-mono text-primary">
                ${n.contenido}$
              </code>
            );
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
