// 📍 components/mdj-viewer/SeccionColapsable.tsx
// 'use client' — Acordeón colapsable para H1/H2/H3 con degradados dinámicos del tema.
// H1 → primary, H2 → secondary, H3+ → neutral

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";

interface SeccionColapsableProps {
  id: string;
  nivel: 1 | 2 | 3;
  titulo: string;
  colapsadoInicial?: boolean;
  children: React.ReactNode;
}

const ESTILOS_NIVEL: Record<number, { size: "3xl" | "2xl" | "xl"; weight: "bold" | "semibold" }> = {
  1: { size: "3xl", weight: "bold" },
  2: { size: "2xl", weight: "semibold" },
  3: { size: "xl", weight: "semibold" },
};

const GRADIENTES: Record<number, "primary" | "secondary" | "neutral"> = {
  1: "primary",
  2: "secondary",
  3: "neutral",
};

export function SeccionColapsable({
  id,
  nivel,
  titulo,
  colapsadoInicial = false,
  children,
}: SeccionColapsableProps) {
  const [colapsado, setColapsado] = useState(colapsadoInicial);
  const estilo = ESTILOS_NIVEL[nivel] || ESTILOS_NIVEL[1];
  const gradiente = GRADIENTES[nivel] || GRADIENTES[3];

  return (
    <section id={id} className="group">
      <button
        type="button"
        className={`flex items-center gap-2 w-full text-left cursor-pointer mt-${nivel === 1 ? "10" : nivel === 2 ? "8" : "6"} mb-${nivel === 1 ? "4" : nivel === 2 ? "3" : "2"} hover:opacity-80 transition-opacity`}
        onClick={() => setColapsado(!colapsado)}
      >
        <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-primary transition-colors flex-shrink-0">
          {colapsado ? (
            <ChevronRight size={nivel === 1 ? 22 : 18} />
          ) : (
            <ChevronDown size={nivel === 1 ? 22 : 18} />
          )}
        </span>
        <span className="flex-1">
          <StandardText
            asElement={`h${nivel}` as "h1" | "h2" | "h3"}
            size={estilo.size}
            weight={estilo.weight}
            gradient={gradiente}
            className="font-heading tracking-tight"
          >
            {titulo}
          </StandardText>
        </span>
      </button>
      {!colapsado && <div className="pl-0">{children}</div>}
    </section>
  );
}
