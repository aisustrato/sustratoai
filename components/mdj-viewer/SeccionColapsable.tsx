// 📍 components/mdj-viewer/SeccionColapsable.tsx
// 'use client' — Acordeón colapsable para H1/H2/H3
// Recibe children server-rendered como prop — zero JS para contenido estático

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SeccionColapsableProps {
  id: string;
  nivel: 1 | 2 | 3;
  titulo: string;
  colapsadoInicial?: boolean;
  children: React.ReactNode;
}

const ESTILOS_NIVEL: Record<number, string> = {
  1: "text-2xl font-bold font-heading tracking-tight mt-10 mb-4",
  2: "text-xl font-semibold font-heading tracking-tight mt-8 mb-3",
  3: "text-lg font-semibold font-heading mt-6 mb-2",
};

export function SeccionColapsable({
  id,
  nivel,
  titulo,
  colapsadoInicial = false,
  children,
}: SeccionColapsableProps) {
  const [colapsado, setColapsado] = useState(colapsadoInicial);

  const headingClass = ESTILOS_NIVEL[nivel] || ESTILOS_NIVEL[1];
  const HeadingTag = `h${nivel}` as keyof JSX.IntrinsicElements;

  return (
    <section id={id} className="group">
      <HeadingTag
        className={`${headingClass} flex items-center gap-2 cursor-pointer hover:text-primary transition-colors`}
        onClick={() => setColapsado(!colapsado)}
      >
        <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-primary transition-colors">
          {colapsado ? (
            <ChevronRight size={nivel === 1 ? 22 : 18} />
          ) : (
            <ChevronDown size={nivel === 1 ? 22 : 18} />
          )}
        </span>
        <span className="flex-1">{titulo}</span>
      </HeadingTag>
      {!colapsado && <div className="pl-0">{children}</div>}
    </section>
  );
}
