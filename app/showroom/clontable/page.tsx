'use client';
import React from "react";
import { StandardTable } from "@/components/ui/StandardTable";
import { FileText } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import type { ColumnDef } from "@tanstack/react-table";

// Definición de tipos para los datos
type Article = {
  id: number;
  title: string;
  authors: string;
  publication_year: string;
  journal: string;
  doi: string;
  subRows?: Record<string, any>[];
};

// Datos duros de ejemplo
const DATA: Article[] = [
  {
    id: 1,
    title: "The status and use of prosthetic devices by persons with lower limb amputation in Rwanda",
    authors: "Ngarambe, R; Sagahutu, JB; Nuhu, A; Tumusiime, DK",
    publication_year: "2022",
    journal: "AFRICAN JOURNAL OF DISABILITY",
    doi: "10.4102/ajod.v11i0.1081",
    subRows: [
      {
        "Publication Type": "J",
        "Author Full Names": "Ngarambe, Robert; Sagahutu, Jean Baptiste; Nuhu, Assuman; Tumusiime, David K.",
        "Abstract": "Estudio sobre el uso de dispositivos protésicos en Ruanda.",
        "ISSN": "2223-9170",
        "eISSN": "2226-7220",
        "Publication Date": "DEC 9 2022",
        "Volume": "11",
        "Article Number": "a1081"
      }
    ]
  },
  {
    id: 2,
    title: "Machine Learning Applications in Healthcare: A Comprehensive Review",
    authors: "Smith, J; Johnson, A; Williams, B",
    publication_year: "2023",
    journal: "Journal of Medical Systems",
    doi: "10.1007/s10916-023-01925-4",
    subRows: [
      {
        "Publication Type": "Review",
        "Abstract": "Revisión exhaustiva de aplicaciones de Machine Learning en salud.",
        "Keywords": "Machine Learning, Healthcare, AI, Review"
      }
    ]
  },
  {
    id: 3,
    title: "Sustainable Energy Solutions for Urban Environments",
    authors: "Garcia, M; Lee, S; Kim, Y",
    publication_year: "2021",
    journal: "Renewable and Sustainable Energy Reviews",
    doi: "10.1016/j.rser.2021.111234",
    subRows: [
      {
        "Publication Type": "Article",
        "Abstract": "Análisis de soluciones energéticas sostenibles para entornos urbanos.",
        "Impact Factor": "14.982"
      }
    ]
  }
];

const MAIN_COLUMNS = ["title", "authors", "publication_year", "journal", "doi"] as const;

export default function ClonTableShowroom() {
  const columns: ColumnDef<Article>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }: any) =>
        row.getCanExpand() ? (
          <button
            {...{ onClick: row.getToggleExpandedHandler() }}
            className="group flex items-center justify-center w-6 h-6 rounded hover:bg-primary-bg transition-colors"
            aria-label={row.getIsExpanded() ? "Colapsar detalles" : "Expandir detalles"}
            tabIndex={0}
            type="button"
          >
            <span className="sr-only">{row.getIsExpanded() ? "Colapsar detalles" : "Expandir detalles"}</span>
            <svg
              className={`h-4 w-4 text-primary-pure transition-transform duration-200 ${row.getIsExpanded() ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        ) : null,
      meta: { isSticky: "left" },
      size: 40,
      enableHiding: false,
    },
    ...MAIN_COLUMNS.map((col) => ({
      accessorKey: col,
      size: 200, // Tamaño por defecto para todas las columnas
      id: col,
      header: col.charAt(0).toUpperCase() + col.slice(1).replace('_', ' '),
      enableHiding: false,
    }))
  ];

  const renderSubComponent = (row: { original: Article }) => {
    const subRows = row.original.subRows || [];
    if (!subRows.length) {
      return (
        <div className="p-4 bg-primary-bg/20">
          <StandardText size="sm" color="neutral" colorShade="text-weak">Sin metadatos secundarios.</StandardText>
        </div>
      );
    }
    return (
      <div className="p-4 bg-primary-bg/20">
        <StandardText preset="subtitle" className="mb-2 flex items-center gap-2">
          <FileText size={16} /> Metadatos para: "{row.original.title}"
        </StandardText>
        {subRows.map((sub: any, idx: number) => (
          <div key={sub.id || idx} className="mb-2">
            <ul className="list-disc pl-6 text-sm text-neutral-text">
              {Object.entries(sub)
                .filter(([key]) => key !== "id")
                .map(([key, value]) => (
                  <li key={key} className="mb-1">
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <StandardText preset="title" className="mb-6">Tabla de Artículos</StandardText>
      <div className="mb-4 p-4 bg-primary-bg/20 rounded-md">
        <StandardText className="font-medium">
          Mostrando {DATA.length} artículos
        </StandardText>
      </div>
      <StandardTable
        data={DATA}
        columns={columns}
        renderSubComponent={renderSubComponent}
      />
    </div>
  );
}

