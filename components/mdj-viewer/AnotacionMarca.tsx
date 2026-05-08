// 📍 components/mdj-viewer/AnotacionMarca.tsx
// 'use client' — highlight visual para anotaciones (frase_notable, referencia, nota)

"use client";

import type { TipoAnotacion } from "@/lib/mdj/types";

interface AnotacionMarcaProps {
  tipo: TipoAnotacion;
  children: React.ReactNode;
  onClick?: () => void;
  activa?: boolean;
}

const ESTILOS: Record<TipoAnotacion, string> = {
  frase_notable:
    "bg-yellow-200 dark:bg-yellow-900/40 border-b-2 border-yellow-400 dark:border-yellow-600 cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-900/60",
  referencia:
    "bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-400 dark:border-blue-500 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50",
  nota:
    "bg-green-100 dark:bg-green-900/20 border-b-2 border-green-400 dark:border-green-500 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/40",
};

export function AnotacionMarca({
  tipo,
  children,
  onClick,
  activa = false,
}: AnotacionMarcaProps) {
  const base = ESTILOS[tipo] || "";
  const pulso = activa ? "ring-2 ring-primary ring-offset-1" : "";

  return (
    <span
      className={`${base} ${pulso} rounded-sm px-0.5 transition-all duration-200`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {children}
    </span>
  );
}
