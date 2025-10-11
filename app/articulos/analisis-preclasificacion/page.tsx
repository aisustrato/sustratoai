"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardPagination } from "@/components/ui/StandardPagination";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { Brain, StickyNote, Filter, BarChart3, X, Download, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
import ArticleGroupManagerSimple from "./components/ArticleGroupManagerSimple";
import { UniverseVisualization } from "./components/UniverseVisualization";
import { type ColumnDef } from "@tanstack/react-table";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import { 
  getPreclassifiedArticlesForAnalysis,
  getAllPreclassifiedArticlesForAnalysis,
  type PreclassifiedArticleForAnalysis 
} from "@/lib/actions/preclassification-actions";
import { getActivePhaseForProject } from "@/lib/actions/preclassification_phases_actions";
import { NoteEditor } from "@/app/articulos/preclasificacion_old/[batchId]/components/NoteEditor";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Phase = Database['public']['Tables']['preclassification_phases']['Row'];

type ArticleForNoteEditor = {
  item_id: string;
  article_id: string;
  article_data: {
    original_title: string | null;
    translated_title: string | null;
  };
};

const ITEMS_PER_PAGE_OPTIONS = [
  { value: "10", label: "10 por página" },
  { value: "25", label: "25 por página" },
  { value: "50", label: "50 por página" },
];

export default function AnalisisPreclasificacionPage() {
  const { proyectoActual } = useAuth();
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [isLoadingPhase, setIsLoadingPhase] = useState(true);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [articles, setArticles] = useState<PreclassifiedArticleForAnalysis[]>([]);
  const [dimensions, setDimensions] = useState<{
    id: string;
    name: string;
    type: string;
    icon: string | null;
    options: { value: string; emoticon: string | null }[];
  }[]>([]);
  
  // 📊 Estado COMPLETO para gráficos (sin paginación)
  const [allArticles, setAllArticles] = useState<PreclassifiedArticleForAnalysis[]>([]);
  const [isLoadingAllArticles, setIsLoadingAllArticles] = useState(false);
  
  // Estados de filtros
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [confidenceFilter, setConfidenceFilter] = useState<number[]>([]); // 1=baja, 2=media, 3=alta
  const [showFilters, setShowFilters] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Estado de notas
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentArticleForNote, setCurrentArticleForNote] = useState<ArticleForNoteEditor | null>(null);
  const [notesPresenceByArticleId, setNotesPresenceByArticleId] = useState<Record<string, boolean>>({});
  
  // Estado de grupos
  const [groupsPresenceByArticleId, setGroupsPresenceByArticleId] = useState<Record<string, boolean>>({});
  
  // Estado de descarga
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  // Función para abrir el editor de notas
  const handleOpenNotes = useCallback((article: PreclassifiedArticleForAnalysis) => {
    console.log('[handleOpenNotes] Abriendo editor de notas', {
      item_id: article.item_id,
      article_id: article.article_id,
      hasNotes: notesPresenceByArticleId[article.article_id]
    });
    
    setCurrentArticleForNote({
      item_id: article.item_id, // 🎯 Usar el item_id real de article_batch_items
      article_id: article.article_id,
      article_data: {
        original_title: article.title,
        translated_title: article.translated_title,
      }
    });
    setNoteDialogOpen(true);
  }, [notesPresenceByArticleId]);

  // Función para cerrar el editor de notas
  const handleCloseNotes = () => {
    setNoteDialogOpen(false);
    setCurrentArticleForNote(null);
    // Recargar datos para actualizar presencia de notas
    loadArticles();
  };

  // Callback cuando cambian las notas
  const handleNotesChanged = useCallback((hasNotesNow: boolean) => {
    if (!currentArticleForNote?.article_id) return;
    setNotesPresenceByArticleId(prev => ({
      ...prev,
      [currentArticleForNote.article_id]: hasNotesNow,
    }));
  }, [currentArticleForNote]);

  // Callback cuando cambian los grupos
  const handleGroupsChanged = useCallback((articleId: string, hasGroups: boolean) => {
    setGroupsPresenceByArticleId(prev => ({
      ...prev,
      [articleId]: hasGroups,
    }));
  }, []);

  // Cargar presencia de notas y grupos
  const loadPresenceData = useCallback(async (articleIds: string[]) => {
    if (articleIds.length === 0) return;

    try {
      // Cargar presencia de notas
      const { getNotesPresenceForArticles } = await import('@/lib/actions/article-notes-actions');
      const notesResult = await getNotesPresenceForArticles(articleIds);
      
      if (notesResult.success) {
        setNotesPresenceByArticleId(notesResult.data);
      }

      // Cargar presencia de grupos
      const { getBulkGroupsPresence } = await import('@/lib/actions/article-group-actions');
      const groupsResult = await getBulkGroupsPresence({ articleIds });
      
      if (groupsResult.success) {
        setGroupsPresenceByArticleId(groupsResult.data);
      }
    } catch (error) {
      console.error('[loadPresenceData] Error:', error);
    }
  }, []);

  // Cargar fase activa
  const loadActivePhase = useCallback(async () => {
    if (!proyectoActual?.id) return;
    
    setIsLoadingPhase(true);
    const result = await getActivePhaseForProject(proyectoActual.id);
    
    if (result.data) {
      setActivePhase(result.data);
    } else {
      setActivePhase(null);
      if (result.error) {
        toast.error(result.error.message);
      }
    }
    setIsLoadingPhase(false);
  }, [proyectoActual?.id]);

  // 📊 Cargar TODOS los artículos para gráficos (SIN paginación)
  const loadAllArticles = useCallback(async () => {
    if (!proyectoActual?.id || !activePhase?.id) return;

    setIsLoadingAllArticles(true);
    
    const result = await getAllPreclassifiedArticlesForAnalysis(
      proyectoActual.id,
      activePhase.id
    );

    if (result.success && result.data) {
      setAllArticles(result.data.articles);
      // Las dimensiones son las mismas, no necesitamos duplicarlas
    } else {
      setAllArticles([]);
      console.error("Error al cargar todos los artículos para visualización");
    }

    setIsLoadingAllArticles(false);
  }, [proyectoActual?.id, activePhase?.id]);

  // Cargar artículos paginados (para tabla)
  const loadArticles = useCallback(async () => {
    if (!proyectoActual?.id || !activePhase?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const result = await getPreclassifiedArticlesForAnalysis(
      proyectoActual.id,
      activePhase.id,
      currentPage,
      itemsPerPage
    );

    if (result.success) {
      setArticles(result.data.articles);
      setDimensions(result.data.dimensions);
      setTotalItems(result.data.totalCount);
      setTotalPages(result.data.totalPages);

      // Cargar presencia de notas y grupos
      const articleIds = result.data.articles.map(a => a.article_id);
      await loadPresenceData(articleIds);
    } else {
      toast.error("Error al cargar artículos");
      setArticles([]);
      setDimensions([]);
      setTotalItems(0);
      setTotalPages(0);
    }

    setIsLoading(false);
  }, [proyectoActual?.id, activePhase?.id, currentPage, itemsPerPage, loadPresenceData]);

  useEffect(() => {
    loadActivePhase();
  }, [loadActivePhase]);

  useEffect(() => {
    if (activePhase?.id) {
      loadArticles();
      loadAllArticles(); // 📊 Cargar datos completos para gráficos
    }
  }, [activePhase?.id, loadArticles, loadAllArticles]);

  // Función para obtener icono de dimensión
  const getDimensionIcon = useCallback((icon: string | null) => {
    if (!icon) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IconComponent = (LucideIcons as any)[icon];
      return IconComponent ? <IconComponent size={16} /> : null;
    } catch {
      return null;
    }
  }, []);

  // Función para alternar filtro
  const toggleFilter = useCallback((dimensionId: string, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = prev[dimensionId] || [];
      const isActive = currentFilters.includes(value);
      
      if (isActive) {
        // Remover filtro
        const newFilters = currentFilters.filter(v => v !== value);
        if (newFilters.length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dimensionId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [dimensionId]: newFilters };
      } else {
        // Agregar filtro
        return { ...prev, [dimensionId]: [...currentFilters, value] };
      }
    });
  }, []);

  // Función para alternar filtro de confianza
  const toggleConfidenceFilter = useCallback((level: number) => {
    setConfidenceFilter(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  }, []);

  // Función para limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setConfidenceFilter([]);
  }, []);

  // Artículos filtrados (para tabla paginada)
  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    // Filtro por dimensión
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(article => {
        return Object.entries(activeFilters).every(([dimId, values]) => {
          const classification = article.classifications[dimId];
          if (!classification || !classification.value) return false;
          return values.includes(classification.value);
        });
      });
    }
    
    // Filtro por confianza
    if (confidenceFilter.length > 0) {
      filtered = filtered.filter(article => {
        // Un artículo pasa el filtro si ALGUNA de sus clasificaciones tiene uno de los niveles seleccionados
        return Object.values(article.classifications).some(classification => {
          return classification && confidenceFilter.includes(classification.confidence || 0);
        });
      });
    }
    
    return filtered;
  }, [articles, activeFilters, confidenceFilter]);

  // 📊 TODOS los artículos filtrados (para gráficos - SIN paginación)
  const allFilteredArticles = useMemo(() => {
    let filtered = allArticles;
    
    // Filtro por dimensión
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(article => {
        return Object.entries(activeFilters).every(([dimId, values]) => {
          const classification = article.classifications[dimId];
          if (!classification || !classification.value) return false;
          return values.includes(classification.value);
        });
      });
    }
    
    // Filtro por confianza
    if (confidenceFilter.length > 0) {
      filtered = filtered.filter(article => {
        return Object.values(article.classifications).some(classification => {
          return classification && confidenceFilter.includes(classification.confidence || 0);
        });
      });
    }
    
    return filtered;
  }, [allArticles, activeFilters, confidenceFilter]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const dimFilters = Object.values(activeFilters).reduce((acc, vals) => acc + vals.length, 0);
    return dimFilters + confidenceFilter.length;
  }, [activeFilters, confidenceFilter]);

  // Función para descargar CSV
  const handleDownloadCSV = useCallback(async () => {
    if (!proyectoActual?.id || !activePhase?.id) {
      toast.error("No hay datos para exportar");
      return;
    }

    setIsDownloadingCSV(true);
    toast.info("Preparando exportación CSV...");

    try {
      // Obtener TODOS los artículos (sin paginación)
      const result = await getAllPreclassifiedArticlesForAnalysis(
        proyectoActual.id,
        activePhase.id
      );

      if (!result.success || !result.data) {
        toast.error("Error al obtener datos para exportación");
        return;
      }

      const { articles: allArticles, dimensions: allDimensions } = result.data;

      // Aplicar filtros localmente si hay filtros activos
      const articlesToExport = Object.keys(activeFilters).length === 0 
        ? allArticles 
        : allArticles.filter(article => {
            return Object.entries(activeFilters).every(([dimId, values]) => {
              const classification = article.classifications[dimId];
              if (!classification || !classification.value) return false;
              return values.includes(classification.value);
            });
          });

      if (articlesToExport.length === 0) {
        toast.warning("No hay artículos para exportar con los filtros actuales");
        setIsDownloadingCSV(false);
        return;
      }

      // Construir CSV
      const headers = [
        '#',
        'Título',
        'Título Traducido',
        'Abstract Traducido',
        'Resumen en Español',
        'Autores',
        'Año',
        'Revista',
        ...allDimensions.map(dim => dim.name),
        ...allDimensions.map(dim => `${dim.name} - Confianza`),
        ...allDimensions.map(dim => `${dim.name} - Justificación`)
      ];

      const rows = articlesToExport.map(article => {
        const authorsStr = Array.isArray(article.authors) ? article.authors.join('; ') : '';
        
        const dimensionValues = allDimensions.map(dim => {
          const classification = article.classifications[dim.id];
          return classification?.value || '';
        });

        const dimensionConfidences = allDimensions.map(dim => {
          const classification = article.classifications[dim.id];
          if (!classification?.confidence) return '';
          return classification.confidence === 3 ? 'Alta' : 
                 classification.confidence === 2 ? 'Media' : 'Baja';
        });

        const dimensionRationales = allDimensions.map(dim => {
          const classification = article.classifications[dim.id];
          return classification?.rationale || '';
        });

        return [
          article.correlativo || '',
          article.title || '',
          article.translated_title || '',
          article.translated_abstract || article.abstract || '',
          article.translation_summary || '',
          authorsStr,
          article.publication_year || '',
          article.journal || '',
          ...dimensionValues,
          ...dimensionConfidences,
          ...dimensionRationales
        ];
      });

      // Escapar valores CSV
      const escapeCsvValue = (value: string | number): string => {
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      };

      // Generar CSV
      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = activeFiltersCount > 0
        ? `preclasificacion_${activePhase.name}_filtrado_${new Date().toISOString().split('T')[0]}.csv`
        : `preclasificacion_${activePhase.name}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${articlesToExport.length} artículo${articlesToExport.length !== 1 ? 's' : ''} exportado${articlesToExport.length !== 1 ? 's' : ''} exitosamente`);
    } catch (error) {
      console.error('[handleDownloadCSV] Error:', error);
      toast.error("Error al generar el archivo CSV");
    } finally {
      setIsDownloadingCSV(false);
    }
  }, [proyectoActual?.id, activePhase, activeFilters, activeFiltersCount]);

  // Función para obtener color de badge según confianza
  const getConfidenceBadgeColor = (confidence: number | null): "success" | "warning" | "neutral" => {
    if (confidence === null) return "neutral";
    if (confidence === 3) return "success";
    if (confidence === 2) return "warning";
    return "warning"; // Baja confianza usa warning en lugar de error
  };

  // Función para obtener texto de confianza
  const getConfidenceText = (confidence: number | null): string => {
    if (confidence === null) return "—";
    if (confidence === 3) return "Alta";
    if (confidence === 2) return "Media";
    return "Baja";
  };

  // Definición de columnas dinámicas
  const columns = useMemo<ColumnDef<PreclassifiedArticleForAnalysis>[]>(() => {
    const baseColumns: ColumnDef<PreclassifiedArticleForAnalysis>[] = [
      {
        accessorKey: "correlativo",
        header: "#",
        size: 60,
        cell: ({ row }) => (
          <StandardText size="sm" weight="semibold">
            {row.original.correlativo || "—"}
          </StandardText>
        ),
      },
      {
        accessorKey: "title",
        header: "Título",
        size: 300,
        cell: ({ row }) => (
          <div className="max-w-md">
            <StandardText size="sm" className="line-clamp-2">
              {row.original.translated_title || row.original.title || "Sin título"}
            </StandardText>
          </div>
        ),
        meta: {
          isTruncatable: true,
          tooltipType: 'longText' as const,
        }
      },
      {
        accessorKey: "authors",
        header: "Autor(es)",
        size: 200,
        cell: ({ row }) => {
          const authors = row.original.authors;
          const authorsText = Array.isArray(authors) ? authors.join(', ') : 'Sin autores';
          return (
            <StandardText size="sm" colorShade="subtle">
              {authorsText}
            </StandardText>
          );
        },
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
        header: "Revista",
        size: 200,
        cell: ({ row }) => (
          <StandardText size="sm" colorShade="subtle">
            {row.original.journal || "Sin fuente"}
          </StandardText>
        ),
      },
      {
        accessorKey: "translated_abstract",
        header: "Abstract Traducido",
        size: 300,
        cell: ({ row }) => (
          <div className="max-w-md">
            <StandardText size="sm" className="line-clamp-3">
              {row.original.translated_abstract || row.original.abstract || "Sin abstract"}
            </StandardText>
          </div>
        ),
        meta: {
          isTruncatable: true,
          tooltipType: 'longText' as const,
        }
      },
      {
        accessorKey: "translation_summary",
        header: "Resumen en Español",
        size: 300,
        cell: ({ row }) => (
          <div className="max-w-md">
            <StandardText size="sm" className="line-clamp-3">
              {row.original.translation_summary || "Sin resumen"}
            </StandardText>
          </div>
        ),
        meta: {
          isTruncatable: true,
          tooltipType: 'longText' as const,
        }
      },
    ];

    // Agregar columnas dinámicas de dimensiones
    const dimensionColumns: ColumnDef<PreclassifiedArticleForAnalysis>[] = dimensions.map(dim => ({
      id: `dim_${dim.id}`,
      accessorFn: (row) => row.classifications[dim.id]?.value || null,
      header: () => (
        <div className="flex items-center gap-2">
          {dim.icon && (
            <StandardIcon size="xs" styleType="outline">
              {getDimensionIcon(dim.icon)}
            </StandardIcon>
          )}
          <span>{dim.name}</span>
        </div>
      ),
      size: 180,
      cell: ({ row }) => {
        const classification = row.original.classifications[dim.id];
        
        if (!classification || !classification.value) {
          return (
            <StandardText size="sm" colorShade="subtle">
              Sin clasificar
            </StandardText>
          );
        }

        // Buscar emoticon para este valor
        const option = dim.options.find(opt => opt.value === classification.value);
        const emoticon = option?.emoticon;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {emoticon && <span className="text-lg">{emoticon}</span>}
              <StandardText size="sm" weight="medium">
                {classification.value}
              </StandardText>
            </div>
            <StandardBadge
              size="sm"
              colorScheme={getConfidenceBadgeColor(classification.confidence)}
            >
              {getConfidenceText(classification.confidence)}
            </StandardBadge>
          </div>
        );
      },
      meta: {
        isTruncatable: true,
        tooltipType: 'longText' as const,
      }
    }));

    // TODO: Columna de acciones sticky a la derecha pero con botones alineados a la izquierda
    // Problema: StandardTable aplica estilos que sobrescriben alineación.
    // Investigar: ¿Bug en StandardTable.tsx con isSticky:'right' + align:'left'?
    // Por ahora: Columna fijada funciona, pero botones aparecen centrados/derecha
    
    // Columna de acciones (fijada a la derecha, botones apilados)
    const actionsColumn: ColumnDef<PreclassifiedArticleForAnalysis> = {
      id: "actions",
      header: "Acciones",
      size: 60,
      cell: ({ row }) => {
        const hasNotes = notesPresenceByArticleId[row.original.article_id] || false;
        const hasGroups = groupsPresenceByArticleId[row.original.article_id] || false;

        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            alignItems: 'flex-start', // 🎯 Alineación a la izquierda con flex
            width: '100%',
            marginLeft: '-0.75rem' // Compensar padding de la celda (px-4 = 1rem)
          }}>
            {/* Botón de detalle */}
            <StandardButton
              styleType="outline"
              iconOnly={true}
              size="sm"
              onClick={() => {
                const translatedParam = row.original.translated_title ? 'true' : 'false';
                const returnHref = encodeURIComponent('/articulos/analisis-preclasificacion');
                const returnLabel = encodeURIComponent('Análisis de Preclasificación');
                window.location.href = `/articulos/detalle?articleId=${row.original.article_id}&translated=${translatedParam}&returnHref=${returnHref}&returnLabel=${returnLabel}`;
              }}
              tooltip="Ver detalle del artículo"
            >
              <ExternalLink size={16} />
            </StandardButton>

            {/* Botón de notas */}
            <StandardButton
              styleType={hasNotes ? "solid" : "outline"}
              iconOnly={true}
              size="sm"
              onClick={() => handleOpenNotes(row.original)}
              tooltip={hasNotes ? "Ver/editar notas" : "Crear nota"}
            >
              <StickyNote size={16} />
            </StandardButton>

            {/* Botón de grupos */}
            <ArticleGroupManagerSimple
              articleId={row.original.article_id}
              hasGroups={hasGroups}
              onGroupsChanged={(hasGroups) => handleGroupsChanged(row.original.article_id, hasGroups)}
            />
          </div>
        );
      },
      meta: {
        isSticky: 'right' as const,
      }
    };

    return [...baseColumns, ...dimensionColumns, actionsColumn];
  }, [dimensions, notesPresenceByArticleId, groupsPresenceByArticleId, handleOpenNotes, handleGroupsChanged, getDimensionIcon]);

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (value: string | string[] | undefined) => {
    if (typeof value === "string") {
      setItemsPerPage(Number(value));
      setCurrentPage(1);
    }
  };

  // Breadcrumbs
  const breadcrumbs = [
    { label: "Artículos", href: "/articulos" },
    { label: "Análisis de Preclasificación" },
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

  if (isLoadingPhase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <SustratoLoadingLogo size={64} />
        <StandardText colorShade="subtle">
          Cargando fase activa...
        </StandardText>
      </div>
    );
  }

  if (!activePhase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="h-12 w-12 text-neutral-300" />
        <StandardText size="lg" weight="semibold">
          No hay fase activa
        </StandardText>
        <StandardText colorShade="subtle">
          Selecciona una fase activa desde la gestión de fases para ver el análisis.
        </StandardText>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Title */}
      <StandardPageTitle
        title="Análisis de Preclasificación"
        subtitle={`Fase: ${activePhase.name}`}
        description="Vista analítica de todos los artículos con datos de preclasificación. Consulta resultados, agrega notas y organiza en grupos."
        mainIcon={Brain}
        breadcrumbs={breadcrumbs}
      />

      {/* Barra de herramientas */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <StandardButton
            styleType={showFilters ? "solid" : "outline"}
            colorScheme={activeFiltersCount > 0 ? "accent" : undefined}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={Filter}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <StandardBadge size="sm" colorScheme="accent">
                {activeFiltersCount}
              </StandardBadge>
            )}
          </StandardButton>
          
          {activeFiltersCount > 0 && (
            <StandardButton
              styleType="ghost"
              size="sm"
              onClick={clearAllFilters}
              leftIcon={X}
            >
              Limpiar filtros
            </StandardButton>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <StandardButton
            styleType="outline"
            colorScheme="success"
            size="sm"
            onClick={handleDownloadCSV}
            disabled={isDownloadingCSV || totalItems === 0}
            leftIcon={Download}
          >
            {isDownloadingCSV ? 'Exportando...' : 'Exportar CSV'}
            {activeFiltersCount > 0 && !isDownloadingCSV && (
              <StandardBadge size="sm" colorScheme="success">
                Filtrado
              </StandardBadge>
            )}
          </StandardButton>
          
          <StandardButton
            styleType={showVisualization ? "solid" : "outline"}
            colorScheme="primary"
            size="sm"
            onClick={() => setShowVisualization(!showVisualization)}
            leftIcon={BarChart3}
          >
            {showVisualization ? "Ocultar" : "Ver"} visualización
          </StandardButton>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && dimensions.some(d => d.options.length > 0) && (
        <StandardCard styleType="outline" className="mb-6">
          <div className="space-y-4">
            {/* Filtro por Nivel de Confianza */}
            <div className="border-b border-neutral-border pb-4">
              <div className="flex items-center gap-2 mb-3">
                <StandardIcon iconName="TrendingUp" size={16} />
                <StandardText size="sm" weight="semibold">
                  Nivel de Confianza
                </StandardText>
              </div>
              <div className="flex flex-wrap gap-2">
                <StandardBadge
                  styleType={confidenceFilter.includes(3) ? "solid" : "outline"}
                  colorScheme={confidenceFilter.includes(3) ? "success" : "neutral"}
                  className="cursor-pointer"
                  onClick={() => toggleConfidenceFilter(3)}
                >
                  Alta
                </StandardBadge>
                <StandardBadge
                  styleType={confidenceFilter.includes(2) ? "solid" : "outline"}
                  colorScheme={confidenceFilter.includes(2) ? "warning" : "neutral"}
                  className="cursor-pointer"
                  onClick={() => toggleConfidenceFilter(2)}
                >
                  Media
                </StandardBadge>
                <StandardBadge
                  styleType={confidenceFilter.includes(1) ? "solid" : "outline"}
                  colorScheme={confidenceFilter.includes(1) ? "danger" : "neutral"}
                  className="cursor-pointer"
                  onClick={() => toggleConfidenceFilter(1)}
                >
                  Baja
                </StandardBadge>
              </div>
              <StandardText size="xs" colorShade="subtle" className="mt-2">
                Filtra artículos donde al menos una dimensión tenga el nivel de confianza seleccionado
              </StandardText>
            </div>

            {/* Filtros por Dimensión */}
            {dimensions.map((dim) => {
              const optionCounts = allFilteredArticles.reduce((acc, article) => {
                const classification = article.classifications[dim.id];
                if (classification?.value) {
                  acc[classification.value] = (acc[classification.value] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);

              return (
                <div key={dim.id} className="border-b border-neutral-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    {getDimensionIcon(dim.icon)}
                    <StandardText size="sm" weight="semibold">
                      {dim.name}
                    </StandardText>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dim.options.map((option) => {
                      const count = optionCounts[option.value] || 0;
                      const isActive = activeFilters[dim.id]?.includes(option.value) || false;
                      
                      return (
                        <StandardBadge
                          key={option.value}
                          styleType={isActive ? "solid" : "outline"}
                          colorScheme={isActive ? "primary" : "neutral"}
                          className="cursor-pointer"
                          onClick={() => toggleFilter(dim.id, option.value)}
                        >
                          {option.emoticon && <span className="mr-1">{option.emoticon}</span>}
                          {option.value} ({count})
                        </StandardBadge>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </StandardCard>
      )}

      {/* Visualización del Universo */}
      {showVisualization && (
        isLoadingAllArticles ? (
          <StandardCard>
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <SustratoLoadingLogo size={64} />
              <StandardText colorShade="subtle">
                Cargando datos completos para visualización...
              </StandardText>
            </div>
          </StandardCard>
        ) : (
          <UniverseVisualization 
            articles={allFilteredArticles}
            dimensions={dimensions}
          />
        )
      )}

      {/* Card con Tabla y Paginación */}
      <StandardCard>
        {/* Control de items por página */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StandardText size="sm" colorShade="subtle">
                Total: {totalItems} artículo{totalItems !== 1 ? "s" : ""}
              </StandardText>
              {activeFiltersCount > 0 && filteredArticles.length !== articles.length && (
                <StandardBadge size="sm" colorScheme="accent">
                  {filteredArticles.length} filtrado{filteredArticles.length !== 1 ? "s" : ""}
                </StandardBadge>
              )}
            </div>
            {dimensions.length > 0 && (
              <StandardBadge colorScheme="primary" size="sm">
                {dimensions.length} dimensión{dimensions.length !== 1 ? "es" : ""}
              </StandardBadge>
            )}
          </div>
          <div className="flex items-center gap-2">
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
              Cargando análisis de preclasificación...
            </StandardText>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Brain className="h-12 w-12 text-neutral-300" />
            <StandardText size="lg" weight="semibold">
              No hay artículos preclasificados
            </StandardText>
            <StandardText colorShade="subtle">
              No se encontraron artículos con datos de preclasificación en esta fase.
            </StandardText>
          </div>
        ) : (
          <StandardTable
            data={filteredArticles}
            columns={columns}
            enableTruncation={true}
            colorScheme="neutral"
            enableKeywordHighlighting={true}
            keywordHighlightPlaceholder="Buscar en tabla..."
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

      {/* Editor de Notas */}
      {currentArticleForNote && (
        <NoteEditor
          open={noteDialogOpen}
          onClose={handleCloseNotes}
          article={currentArticleForNote}
          project={proyectoActual}
          showOriginalAsPrimary={false}
          onNotesChanged={handleNotesChanged}
        />
      )}
    </div>
  );
}
