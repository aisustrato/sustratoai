// 📍 components/mdj-viewer/NodoTablaView.tsx
// Server Component — tabla markdown con estilo

import type { NodoTabla } from "@/lib/mdj/types";

interface NodoTablaViewProps {
  nodo: NodoTabla;
}

export function NodoTablaView({ nodo }: NodoTablaViewProps) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className="w-full text-sm">
        {nodo.headers.length > 0 && (
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              {nodo.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-left font-semibold border-b border-neutral-200 dark:border-neutral-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {nodo.filas.map((fila, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-neutral-900"
                  : "bg-neutral-50 dark:bg-neutral-800/50"
              }
            >
              {fila.map((celda, j) => (
                <td
                  key={j}
                  className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800"
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
