"use client";

import React, { useMemo } from "react";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Link as LinkIcon, FileText } from "lucide-react";

// --- Tipos y Datos de Demostración ---
type Paper = {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  year: number;
  citations: number;
  keywords: string[];
  doi: string;
  subRows?: Paper[];
};

const LONG_ABSTRACT =
  "La co-creación humano-IA habilita bucles de retroalimentación iterativos donde los errores son datos útiles. Este ejemplo incluye suficientes columnas y filas para probar scroll, header sticky y columnas fijas a izquierda/derecha.";

const demoData: Paper[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  title: `Diseño de Sistemas Cohesivos #${i + 1}`,
  authors: i % 3 === 0 ? "R. Leiva, C. Creador" : i % 3 === 1 ? "Co-Creador G." : "Equipo Sustrato",
  abstract: LONG_ABSTRACT,
  year: 2020 + ((i % 6) as number),
  citations: Math.floor(Math.random() * 250),
  keywords: i % 2 === 0 ? ["IA", "Diseño", "UX"] : ["Arquitectura", "Tokens"],
  doi: `10.5555/demo.${2020 + (i % 6)}.${i + 1}`,
  subRows: i % 5 === 0 ? [
    {
      id: 1000 + i * 10 + 1,
      title: `Subestudio A de #${i + 1}`,
      authors: "Equipo Sustrato",
      abstract: "Resumen breve del subestudio A con observaciones clave y notas generales.",
      year: 2020 + ((i % 6) as number),
      citations: Math.floor(Math.random() * 50),
      keywords: ["Sub", "Demo"],
      doi: `10.5555/demo.sub.${2020 + (i % 6)}.${i + 1}`,
    },
  ] : undefined,
}));

export default function StandardTableStickyWithSubcolumnsPage() {
  // Subcolumnas (grupos) + columnas sticky izquierda/derecha
  const columns = useMemo<ColumnDef<Paper>[]>(() => [
    // Columna de expansión (sticky izquierda)
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (row.getCanExpand() ? "" : null),
      meta: { isSticky: "left" },
      size: 40,
      enableHiding: false,
    },

    // ID (no sticky para evitar conflictos de offset)
    {
      accessorKey: "id",
      header: "#",
      size: 64,
      meta: { align: "center" as const },
      enableHiding: false,
    },

    // Grupo Información
    {
      header: "Información",
      columns: [
        { accessorKey: "title", header: "Título", size: 280, meta: { isTruncatable: true as const, tooltipType: "standard" as const } },
        { accessorKey: "authors", header: "Autores", size: 220 },
      ],
    },

    // Grupo Contenido
    {
      header: "Contenido",
      columns: [
        { accessorKey: "abstract", header: "Abstract", size: 420, meta: { isTruncatable: true as const, tooltipType: "longText" as const } },
      ],
    },

    // Grupo Métricas (subcolumnas visibles)
    {
      header: "Métricas",
      columns: [
        { accessorKey: "year", header: "Año", size: 90, meta: { align: "center" as const } },
        { accessorKey: "citations", header: "Citaciones", size: 120, meta: { align: "center" as const } },
      ],
    },

    // Grupo Etiquetas
    {
      header: "Etiquetas",
      columns: [
        {
          accessorKey: "keywords",
          header: "Keywords",
          size: 280,
          cell: (info) => (
            <div className="flex flex-wrap gap-1">
              {(info.getValue<string[]>() || []).map((k) => (
                <StandardBadge key={k} styleType="outline">
                  {k}
                </StandardBadge>
              ))}
            </div>
          ),
        },
      ],
    },

    // Sticky derecha (Acción)
    {
      accessorKey: "doi",
      header: "DOI",
      size: 120,
      meta: { isSticky: "right" },
      cell: (info) => (
        <a
          href={`https://doi.org/${info.getValue<string>()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-primary-pure hover:underline"
        >
          <LinkIcon size={14} />
          <span>Ver</span>
        </a>
      ),
      enableHiding: false,
    },
  ], []);

  const renderSubComponent = (row: Row<Paper>) => (
    <div className="p-4 bg-primary-bg/20">
      <StandardText preset="subtitle" className="mb-2 flex items-center gap-2">
        <FileText size={16} /> Sub-estudios para: &quot;{row.original.title}&quot;
      </StandardText>
      <ul className="list-disc pl-6 text-sm text-neutral-text">
        {row.original.subRows?.map((sub) => (
          <li key={sub.id}>
            {sub.title} ({sub.citations} citaciones)
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <StandardPageBackground variant="default">
      <div className="p-6">
        <div className="mb-6">
          <StandardText asElement="h1" preset="heading">
            StandardTable: Sticky + Subcolumnas
          </StandardText>
          <StandardText color="neutral" colorShade="text" className="mt-2">
            Demostración de columnas fijas izquierda/derecha y grupos de encabezados (subcolumnas).
          </StandardText>
        </div>

        <StandardTable
          data={demoData}
          columns={columns}
          renderSubComponent={renderSubComponent}
          filterPlaceholder="Filtrar por título, autor..."
          enableTruncation={true}
          isStickyHeader={true}
          stickyOffset={64}
          enableKeywordHighlighting={true}
          keywordHighlightPlaceholder="Resaltar palabra clave"
        >
          <StandardTable.Table />
        </StandardTable>
      </div>
    </StandardPageBackground>
  );
}
