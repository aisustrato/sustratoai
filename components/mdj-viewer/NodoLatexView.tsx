// 📍 components/mdj-viewer/NodoLatexView.tsx
// 'use client' — Renderiza un bloque LaTeX usando el motor existente.
//
// Uso:
//   <NodoLatexView nodo={nodoLatex} />

"use client";

import { renderLatexBlock } from "@/components/ui/latex-renderer";
import type { NodoLatex } from "@/lib/mdj/types";

interface NodoLatexViewProps {
  nodo: NodoLatex;
}

export function NodoLatexView({ nodo }: NodoLatexViewProps) {
  return (
    <div className="my-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
      {renderLatexBlock(nodo.contenido)}
    </div>
  );
}
