//. 📍 app/articulos/base-original/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useMemo, useCallback } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardPagination } from "@/components/ui/StandardPagination";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { Database, Link as LinkIcon, Download, Search } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import { getPaginatedArticlesForProject } from "@/lib/actions/article-actions";
import { toast } from "sonner";
import type { Database as DatabaseTypes } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
type ArticleRow = DatabaseTypes['public']['Tables']['articles']['Row'];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: "10", label: "10 por página" },
  { value: "25", label: "25 por página" },
  { value: "50", label: "50 por página" },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function BaseOriginalPage() {
  const { proyectoActual } = useAuth();

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Definición de columnas
  const columns = useMemo<ColumnDef<ArticleRow>[]>(
    () => [
      {
        accessorKey: "correlativo",
        header: "#",
        size: 60,
      },
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <div className="max-w-md">
            <StandardText size="sm" className="line-clamp-2">
              {row.original.title || "Sin título"}
            </StandardText>
          </div>
        ),
      },
      {
        accessorKey: "authors",
        header: "Autor(es)",
        cell: ({ row }) => (
          <StandardText size="sm" colorShade="subtle">
            {row.original.authors || "Sin autores"}
          </StandardText>
        ),
      },
      {
        accessorKey: "publication_year",
        header: "Año",
        size: 80,
        cell: ({ row }) => (
          <StandardText size="sm">
            {row.original.publication_year || "—"}
          </StandardText>
        ),
      },
      {
        accessorKey: "journal",
        header: "Revista/Fuente",
        cell: ({ row }) => (
          <StandardText size="sm" colorShade="subtle">
            {row.original.journal || "Sin fuente"}
          </StandardText>
        ),
      },
      {
        accessorKey: "doi",
        header: "DOI",
        size: 100,
        cell: ({ row }) => {
          if (!row.original.doi) {
            return <StandardText size="sm" colorShade="subtle">—</StandardText>;
          }
          return (
            <a
              href={`https://doi.org/${row.original.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              DOI
            </a>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => {
          const articleId = row.original.id;
          return (
            <StandardButton
              styleType="outline"
              iconOnly
              size="sm"
              onClick={() => {
                const returnHref = encodeURIComponent("/articulos/base-original");
                const returnLabel = encodeURIComponent("Base Original");
                window.location.href = `/articulos/detalle?articleId=${articleId}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
              }}
              tooltip="Ver detalle del artículo"
            >
              <Search size={16} />
            </StandardButton>
          );
        },
      },
    ],
    []
  );

  // Cargar artículos paginados
  useEffect(() => {
    if (!proyectoActual?.id) {
      setIsLoading(false);
      return;
    }

    const loadArticles = async () => {
      setIsLoading(true);
      
      const result = await getPaginatedArticlesForProject(
        proyectoActual.id,
        currentPage,
        itemsPerPage
      );

      if (result.success && result.data) {
        setArticles(result.data.articles);
        setTotalItems(result.data.totalCount);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(!result.success ? result.error : "Error al cargar artículos");
        setArticles([]);
        setTotalItems(0);
        setTotalPages(0);
      }

      setIsLoading(false);
    };

    loadArticles();
  }, [proyectoActual?.id, currentPage, itemsPerPage]);

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (value: string | string[] | undefined) => {
    if (typeof value === "string") {
      setItemsPerPage(Number(value));
      setCurrentPage(1); // Reset a primera página
    }
  };

  // Escapa un valor para CSV (mismo criterio que StandardTable).
  const escapeCsvValue = (value: string) => {
    const cleaned = value.replace(/"/g, '""');
    return /[,"\n]/.test(cleaned) ? `"${cleaned}"` : cleaned;
  };

  // Descarga TODA la base del proyecto en CSV, no solo la página visible:
  // recorre todas las páginas en lotes (la tabla en pantalla está paginada
  // server-side, así que exportar solo `articles` exportaría una página).
  const handleDownloadCsv = useCallback(async () => {
    if (!proyectoActual?.id || totalItems === 0) return;
    setIsExportingCsv(true);
    try {
      const BATCH_SIZE = 500;
      const allArticles: ArticleRow[] = [];
      let page = 1;
      let pagesTotal = 1;
      do {
        const result = await getPaginatedArticlesForProject(
          proyectoActual.id,
          page,
          BATCH_SIZE
        );
        if (!result.success) {
          throw new Error(result.error);
        }
        allArticles.push(...result.data.articles);
        pagesTotal = result.data.totalPages;
        page++;
      } while (page <= pagesTotal);

      const headers = ["#", "Título", "Autor(es)", "Año", "Revista/Fuente", "DOI"];
      const rows = allArticles.map((a) => [
        String(a.correlativo ?? ""),
        a.title ?? "",
        (a.authors ?? []).join("; "),
        a.publication_year != null ? String(a.publication_year) : "",
        a.journal ?? "",
        a.doi ?? "",
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\n");

      const blob = new Blob(["﻿" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `base-original-${proyectoActual.id}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${allArticles.length} artículo(s) exportado(s) a CSV.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al exportar CSV."
      );
    } finally {
      setIsExportingCsv(false);
    }
  }, [proyectoActual?.id, totalItems]);

  // Breadcrumbs
  const breadcrumbs = [
    { label: "Artículos", href: "/articulos" },
    { label: "Base Original" },
  ];

  // Render loading
  if (!proyectoActual?.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <SustratoLoadingLogo size={64} />
        <StandardText colorShade="subtle">
          Cargando información del proyecto...
        </StandardText>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Title */}
      <StandardPageTitle
        title="Base Original"
        subtitle="Artículos cargados en el proyecto"
        description="Vista completa de todos los artículos en su estado original, tal como fueron importados a la base de datos."
        mainIcon={Database}
        breadcrumbs={breadcrumbs}
      />

      {/* Card con Tabla y Paginación */}
      <StandardCard>
        {/* Control de items por página */}
        <div className="flex items-center justify-between p-4 border-b">
          <StandardText size="sm" colorShade="subtle">
            Total: {totalItems} artículo{totalItems !== 1 ? "s" : ""}
          </StandardText>
          <div className="flex items-center gap-2">
            <StandardButton
              size="sm"
              styleType="outline"
              leftIcon={Download}
              onClick={handleDownloadCsv}
              loading={isExportingCsv}
              disabled={totalItems === 0}
            >
              Descargar CSV
            </StandardButton>
            <StandardText size="sm" colorShade="subtle">
              Mostrar:
            </StandardText>
            <StandardSelect
              options={ITEMS_PER_PAGE_OPTIONS}
              value={itemsPerPage.toString()}
              onChange={handleItemsPerPageChange}
              size="sm"
              className="w-40"
            />
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <SustratoLoadingLogo size={64} />
            <StandardText colorShade="subtle">
              Cargando artículos...
            </StandardText>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Database className="h-12 w-12 text-neutral-300" />
            <StandardText size="lg" weight="semibold">
              No hay artículos
            </StandardText>
            <StandardText colorShade="subtle">
              No se encontraron artículos en este proyecto.
            </StandardText>
          </div>
        ) : (
          <StandardTable
            data={articles}
            columns={columns}
            showToolbar={false}
            colorScheme="neutral"
          >
            <StandardTable.Table />
          </StandardTable>
        )}

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t">
            <StandardPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </StandardCard>
    </div>
  );
}
//#endregion ![main]
