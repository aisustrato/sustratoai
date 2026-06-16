// 📍 components/mdj-viewer/NodoCodigoView.tsx
// Server Component — bloque de código con syntax highlighting opcional

import type { NodoCodigo } from "@/lib/mdj/types";

interface NodoCodigoViewProps {
  nodo: NodoCodigo;
}

export function NodoCodigoView({ nodo }: NodoCodigoViewProps) {
  return (
    <div className="my-4 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {nodo.lenguaje && (
        <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase">
            {nodo.lenguaje}
          </span>
        </div>
      )}
      <pre className="p-4 bg-neutral-50 dark:bg-neutral-900 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{nodo.contenido}</code>
      </pre>
    </div>
  );
}
