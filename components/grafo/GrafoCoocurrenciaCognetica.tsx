"use client";

/**
 * GrafoCoocurrenciaCognetica
 *
 * Wrapper específico de Cognética sobre `StandardGrafo`. Define:
 *   - El catálogo fijo de 6 tipos de artefacto (matchea `cgt_tipo_artefacto`)
 *   - Fetch a `/api/graph/artefactos` y `/api/graph/artefactos/cooccurrence`
 *   - Header con título + ícono + subtítulo
 *   - Ruteo en doble click → /cognetica/<id-artefacto>
 *
 * Cliente puede sobrescribir `onArtefactoNavigate` si querés otra ruta. Si
 * no se pasa, se usa el ruteo por defecto.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileBadge,
  Presentation,
  Mic,
  Video,
  Images,
} from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardGrafo } from "@/components/ui/StandardGrafo";
import type {
  GraphNode,
  GraphEdge,
  GraphNodeType,
} from "@/lib/grafo/types";

/**
 * Catálogo de tipos de artefacto. Los `id` matchean exactamente el enum
 * `cgt_tipo_artefacto` de Supabase para que el backend pueda devolver el
 * `typeId` directamente sin mapeo intermedio.
 */
const CATALOGO_ARTEFACTOS_COGNETICA: GraphNodeType[] = [
  { id: "markdown",    label: "Markdown",     subtitle: "Notas y documentos planos", icon: FileText,     colorScheme: "primary" },
  { id: "pdf_informe", label: "PDF Informe",  subtitle: "Documento extenso",          icon: FileBadge,    colorScheme: "secondary" },
  { id: "pdf_slides",  label: "PDF Slides",   subtitle: "Presentación",               icon: Presentation, colorScheme: "tertiary" },
  { id: "audio",       label: "Audio",        subtitle: "Entrevistas, podcasts",      icon: Mic,          colorScheme: "accent" },
  { id: "video",       label: "Video",        subtitle: "Grabaciones",                icon: Video,        colorScheme: "success" },
  { id: "imagen",      label: "Imagen/Álbum", subtitle: "Imágenes en un contenedor",  icon: Images,       colorScheme: "warning" },
];

export interface GrafoCoocurrenciaCogneticaProps {
  /** Filtro por peso mínimo de arista. Default 1 (todas). */
  minWeight?: number;
  /** Alto del canvas. */
  height?: number;
  /** Override del ruteo en doble click. Si no se pasa, va a /cognetica/<id>. */
  onArtefactoNavigate?: (artefactoId: string) => void;
  /** Override del click simple (selección/marcado en la app). */
  onArtefactoSelect?: (artefactoId: string) => void;
}

export function GrafoCoocurrenciaCognetica({
  minWeight = 1,
  height = 560,
  onArtefactoNavigate,
  onArtefactoSelect,
}: GrafoCoocurrenciaCogneticaProps) {
  const router = useRouter();
  const { proyectoActual, loadingProyectos } = useAuth();
  const projectId = proyectoActual?.id ?? null;

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [entRes, edgeRes] = await Promise.all([
          fetch(`/api/graph/artefactos?project_id=${projectId}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/graph/artefactos/cooccurrence?project_id=${projectId}&min_weight=${minWeight}`,
            { cache: "no-store" }
          ),
        ]);
        if (!entRes.ok) throw new Error(`Error cargando artefactos: ${entRes.status}`);
        if (!edgeRes.ok) throw new Error(`Error cargando co-ocurrencias: ${edgeRes.status}`);

        const entData = (await entRes.json()) as {
          entities: GraphNode[];
          total: number;
        };
        const edgeData = (await edgeRes.json()) as { edges: GraphEdge[] };

        if (cancelled) return;
        setNodes(entData.entities ?? []);
        setEdges(edgeData.edges ?? []);
        setTotal(entData.total ?? 0);
      } catch (err) {
        console.error("[GrafoCoocurrenciaCognetica:fetch]", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando grafo");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [minWeight, projectId]);

  const handleDoubleClick = (id: string) => {
    if (onArtefactoNavigate) {
      onArtefactoNavigate(id);
    } else {
      router.push(`/cognetica/${id}`);
    }
  };

  // Loading inicial: proyectos del usuario aún no cargados
  if (loadingProyectos) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <SustratoLoadingLogo size={56} variant="spin-pulse" />
        <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
          Cargando proyecto…
        </StandardText>
      </div>
    );
  }

  // Sin proyecto activo — mismo patrón que la raíz de Cognética
  if (!projectId) {
    return (
      <StandardAlert
        colorScheme="warning"
        styleType="subtle"
        title="Sin proyecto activo"
        message="Selecciona un proyecto desde el selector superior para ver su grafo de artefactos."
      />
    );
  }

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={{ height }}
      >
        <SustratoLoadingLogo size={64} variant="spin-pulse" breathingEffect />
        <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
          Cargando grafo de artefactos…
        </StandardText>
      </div>
    );
  }

  if (error) {
    return (
      <StandardAlert
        colorScheme="danger"
        styleType="subtle"
        title="No se pudo cargar el grafo"
        message={error}
      />
    );
  }

  if (nodes.length === 0) {
    return (
      <StandardAlert
        colorScheme="neutral"
        styleType="subtle"
        title="Aún no hay artefactos"
        message="Este proyecto todavía no tiene artefactos para graficar."
      />
    );
  }

  return (
    <StandardCard colorScheme="neutral" styleType="subtle" noPadding>
      <StandardGrafo
        nodes={nodes}
        edges={edges}
        total={total}
        nodeTypes={CATALOGO_ARTEFACTOS_COGNETICA}
        iconMode="icon"
        viewMode="3d"
        showAggregateToggle
        height={height}
        onNodeClick={onArtefactoSelect}
        onNodeDoubleClick={handleDoubleClick}
      />
    </StandardCard>
  );
}

export default GrafoCoocurrenciaCognetica;
