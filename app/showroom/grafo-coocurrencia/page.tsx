"use client";

/**
 * Showroom: StandardGrafo
 *
 * Preview completo del componente agnóstico:
 *   - 6 escenarios mock (incl. cognetica-artefactos con los 6 tipos reales)
 *   - Selector iconMode (icon vs emoji) — solo aplica donde el catálogo tiene ambos
 *   - Header del grafo opcional
 *   - Toggle "modo agregado"
 *   - Doble click: log en consola
 *
 * La cookie `graph_mock` se setea desde acá y dispara el short-circuit en
 * las rutas `/api/graph/*`. El fetch sigue siendo el mismo flujo que usaría
 * Cognética en producción — solo la fuente de datos cambia.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  FileBadge,
  Presentation,
  Mic,
  Video,
  Images,
  Network,
  Lightbulb,
  Wrench,
  RefreshCw,
  Package,
  Box,
  Square,
  Link,
  TreePine,
  Leaf,
  Star,
  Hash,
} from "lucide-react";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSwitch } from "@/components/ui/StandardSwitch";

import { StandardGrafo } from "@/components/ui/StandardGrafo";
import type {
  GraphNode,
  GraphEdge,
  GraphNodeType,
  GraphIconMode,
  GraphViewMode,
} from "@/lib/grafo/types";
import {
  GRAPH_SCENARIO_LIST,
  MOCK_COOKIE_NAME,
  type GraphScenarioId,
  getScenario,
} from "@/lib/grafo/mock-data";

const DEFAULT_SCENARIO: GraphScenarioId = "cognetica-artefactos";

function setMockCookie(value: string | null): void {
  if (typeof document === "undefined") return;
  if (value === null) {
    document.cookie = `${MOCK_COOKIE_NAME}=; path=/; max-age=0`;
  } else {
    document.cookie = `${MOCK_COOKIE_NAME}=${value}; path=/; max-age=86400`;
  }
}

// ---------------------------------------------------------------------------
// Catálogos por escenario — el cliente decide qué icono y color tiene cada tipo
// ---------------------------------------------------------------------------

// Los `id` coinciden con el enum `cgt_tipo_artefacto` de Supabase, así el
// mismo catálogo sirve para el mock y para el flujo real sin mapeo extra.
const CATALOG_COGNETICA_ICON: GraphNodeType[] = [
  { id: "markdown",    label: "Markdown",    subtitle: "Notas y documentos planos", icon: FileText,     colorScheme: "primary" },
  { id: "pdf_informe", label: "PDF Informe", subtitle: "Documento extenso",          icon: FileBadge,    colorScheme: "secondary" },
  { id: "pdf_slides",  label: "PDF Slides",  subtitle: "Presentación",               icon: Presentation, colorScheme: "tertiary" },
  { id: "audio",       label: "Audio",       subtitle: "Entrevistas, podcasts",      icon: Mic,          colorScheme: "accent" },
  { id: "video",       label: "Video",       subtitle: "Grabaciones",                icon: Video,        colorScheme: "success" },
  { id: "imagen",      label: "Imagen/Álbum", subtitle: "Imágenes en un contenedor", icon: Images,       colorScheme: "warning" },
];

const CATALOG_COGNETICA_EMOJI: GraphNodeType[] = [
  { id: "markdown",    label: "Markdown",    subtitle: "Notas y documentos planos", icon: "📝", colorScheme: "primary" },
  { id: "pdf_informe", label: "PDF Informe", subtitle: "Documento extenso",          icon: "📄", colorScheme: "secondary" },
  { id: "pdf_slides",  label: "PDF Slides",  subtitle: "Presentación",               icon: "📊", colorScheme: "tertiary" },
  { id: "audio",       label: "Audio",       subtitle: "Entrevistas, podcasts",      icon: "🎙️", colorScheme: "accent" },
  { id: "video",       label: "Video",       subtitle: "Grabaciones",                icon: "🎬", colorScheme: "success" },
  { id: "imagen",      label: "Imagen/Álbum", subtitle: "Imágenes en un contenedor", icon: "🖼️", colorScheme: "warning" },
];

const CATALOG_GENERIC_BY_TYPEID: Record<string, GraphNodeType> = {
  // circulo-simple
  concepto: { id: "concepto", label: "Concepto", icon: Lightbulb, colorScheme: "primary" },
  metodo:   { id: "metodo",   label: "Método",   icon: Wrench,    colorScheme: "secondary" },
  // circulo-grande
  "concepto-clave": { id: "concepto-clave", label: "Concepto clave", icon: Star,    colorScheme: "primary" },
  "sub-concepto":   { id: "sub-concepto",   label: "Sub-concepto",   icon: Hash,    colorScheme: "tertiary" },
  proceso:          { id: "proceso",        label: "Proceso",        icon: RefreshCw, colorScheme: "accent" },
  artefacto:        { id: "artefacto",      label: "Artefacto",      icon: Package, colorScheme: "warning" },
  // top-dominante
  raiz: { id: "raiz", label: "Raíz", icon: TreePine, colorScheme: "primary" },
  hoja: { id: "hoja", label: "Hoja", icon: Leaf,     colorScheme: "success" },
  // pesos-mixtos
  estructura: { id: "estructura", label: "Estructura", icon: Box,    colorScheme: "primary" },
  frontera:   { id: "frontera",   label: "Frontera",   icon: Square, colorScheme: "warning" },
  conexion:   { id: "conexion",   label: "Conexión",   icon: Link,   colorScheme: "accent" },
};

function buildCatalog(
  scenarioId: GraphScenarioId,
  iconMode: GraphIconMode
): GraphNodeType[] {
  if (scenarioId === "cognetica-artefactos") {
    return iconMode === "emoji" ? CATALOG_COGNETICA_EMOJI : CATALOG_COGNETICA_ICON;
  }
  const scenario = getScenario(scenarioId);
  if (!scenario) return [];
  return scenario.typeIds.map(
    (id) => CATALOG_GENERIC_BY_TYPEID[id] ?? {
      id,
      label: id,
      icon: Hash,
      colorScheme: "neutral" as const,
    }
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

interface FetchedData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total: number;
}

export default function ShowroomStandardGrafoPage() {
  const [scenarioId, setScenarioId] = useState<GraphScenarioId | null>(DEFAULT_SCENARIO);
  const [minWeight, setMinWeight] = useState<number>(1);
  const [iconMode, setIconMode] = useState<GraphIconMode>("icon");
  const [viewMode, setViewMode] = useState<GraphViewMode>("3d");
  const [showHeader, setShowHeader] = useState(true);
  const [showAggregateToggle, setShowAggregateToggle] = useState(true);
  const [floatEnabled, setFloatEnabled] = useState(true);
  const [breatheEnabled, setBreatheEnabled] = useState(true);

  const [data, setData] = useState<FetchedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  // Sincronizar cookie + fetch al cambiar escenario o min_weight o reload
  useEffect(() => {
    setMockCookie(scenarioId);
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const [entRes, edgeRes] = await Promise.all([
          fetch("/api/graph/entities", { cache: "no-store" }),
          fetch(`/api/graph/cooccurrence?min_weight=${minWeight}`, { cache: "no-store" }),
        ]);
        if (!entRes.ok) throw new Error(`entities ${entRes.status}`);
        if (!edgeRes.ok) throw new Error(`cooccurrence ${edgeRes.status}`);
        const entData = (await entRes.json()) as { entities: GraphNode[]; total: number };
        const edgeData = (await edgeRes.json()) as { edges: GraphEdge[] };
        if (cancelled) return;
        setData({
          nodes: entData.entities ?? [],
          edges: edgeData.edges ?? [],
          total: entData.total ?? 0,
        });
      } catch (err) {
        console.error("[showroom:grafo:fetch]", err);
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Error de carga");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [scenarioId, minWeight, reloadCounter]);

  const scenarioOptions = useMemo(
    () =>
      GRAPH_SCENARIO_LIST.map((s) => ({
        value: s.id,
        label: s.label,
        description: s.description,
      })),
    []
  );

  const minWeightOptions = useMemo(
    () => [
      { value: "1", label: "1 (todas)" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "5", label: "5" },
    ],
    []
  );

  const iconModeOptions = useMemo(
    () => [
      { value: "icon", label: "Icon (componentes React)" },
      { value: "emoji", label: "Emoji (strings)" },
    ],
    []
  );

  const viewModeOptions = useMemo(
    () => [
      { value: "3d", label: "3D simulado (gradient radial)" },
      { value: "flat", label: "Flat (plano)" },
    ],
    []
  );

  const catalog = useMemo(
    () => (scenarioId ? buildCatalog(scenarioId, iconMode) : []),
    [scenarioId, iconMode]
  );

  const activeScenario = scenarioId ? getScenario(scenarioId) : null;

  const headerForScenario = useMemo(() => {
    if (!activeScenario) return undefined;
    return {
      title: activeScenario.label,
      subtitle: activeScenario.description,
      icon: iconMode === "emoji" ? "🕸️" : Network,
    };
  }, [activeScenario, iconMode]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="space-y-1">
        <StandardText preset="heading">StandardGrafo — Showroom</StandardText>
        <StandardText preset="body" colorScheme="neutral" colorShade="subtle">
          Preview del componente agnóstico con 6 escenarios. La cookie{" "}
          <code>graph_mock</code> activa datos sintéticos; limpiá el selector para volver a Supabase real.
        </StandardText>
      </div>

      <StandardCard colorScheme="primary" styleType="subtle" hasOutline>
        <StandardCard.Header>
          <StandardCard.Title>Controles</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <StandardText asElement="label" size="sm" weight="medium" colorScheme="neutral">
                Escenario
              </StandardText>
              <StandardSelect
                options={scenarioOptions}
                value={scenarioId ?? undefined}
                onChange={(v) => setScenarioId(typeof v === "string" ? (v as GraphScenarioId) : null)}
                placeholder="Sin mock (datos reales)"
                clearable
              />
            </div>
            <div>
              <StandardText asElement="label" size="sm" weight="medium" colorScheme="neutral">
                min_weight
              </StandardText>
              <StandardSelect
                options={minWeightOptions}
                value={String(minWeight)}
                onChange={(v) => typeof v === "string" && setMinWeight(parseInt(v, 10))}
              />
            </div>
            <div>
              <StandardText asElement="label" size="sm" weight="medium" colorScheme="neutral">
                iconMode
              </StandardText>
              <StandardSelect
                options={iconModeOptions}
                value={iconMode}
                onChange={(v) => typeof v === "string" && setIconMode(v as GraphIconMode)}
              />
            </div>
            <div>
              <StandardText asElement="label" size="sm" weight="medium" colorScheme="neutral">
                viewMode
              </StandardText>
              <StandardSelect
                options={viewModeOptions}
                value={viewMode}
                onChange={(v) => typeof v === "string" && setViewMode(v as GraphViewMode)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2">
              <StandardSwitch checked={showHeader} onCheckedChange={setShowHeader} size="sm" />
              <StandardText size="sm">Header en el grafo</StandardText>
            </label>
            <label className="flex items-center gap-2">
              <StandardSwitch
                checked={showAggregateToggle}
                onCheckedChange={setShowAggregateToggle}
                size="sm"
              />
              <StandardText size="sm">Toggle modo agregado</StandardText>
            </label>
            <label className="flex items-center gap-2">
              <StandardSwitch checked={floatEnabled} onCheckedChange={setFloatEnabled} size="sm" />
              <StandardText size="sm">Float</StandardText>
            </label>
            <label className="flex items-center gap-2">
              <StandardSwitch checked={breatheEnabled} onCheckedChange={setBreatheEnabled} size="sm" />
              <StandardText size="sm">Breathe</StandardText>
            </label>
            <StandardButton
              colorScheme="secondary"
              styleType="outline"
              size="sm"
              onClick={() => setReloadCounter((c) => c + 1)}
            >
              Recargar
            </StandardButton>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {fetchError && (
        <StandardCard colorScheme="danger" styleType="subtle">
          <StandardCard.Content>
            <StandardText colorScheme="danger">Error: {fetchError}</StandardText>
          </StandardCard.Content>
        </StandardCard>
      )}

      <StandardCard colorScheme="neutral" styleType="subtle">
        {loading && (
          <StandardCard.Content>
            <StandardText colorScheme="neutral" colorShade="subtle">
              Cargando…
            </StandardText>
          </StandardCard.Content>
        )}
        {!loading && data && (
          <StandardGrafo
            nodes={data.nodes}
            edges={data.edges}
            total={data.total}
            nodeTypes={catalog}
            iconMode={iconMode}
            viewMode={viewMode}
            header={headerForScenario}
            showHeader={showHeader}
            showAggregateToggle={showAggregateToggle}
            animations={{ float: floatEnabled, breathe: breatheEnabled, hoverIntensify: true }}
            height={520}
            onNodeClick={(id) => console.log("[showroom:grafo] click", id)}
            onNodeDoubleClick={(id) => console.log("[showroom:grafo] DOUBLE CLICK →", id)}
          />
        )}
      </StandardCard>

      {activeScenario && data && (
        <StandardCard colorScheme="neutral" styleType="transparent">
          <StandardCard.Content>
            <StandardText preset="caption" colorScheme="neutral" colorShade="subtle">
              {data.nodes.length} nodos · {data.edges.length} aristas · total simulado: {data.total}
              {" · "}tipos en catálogo: {catalog.length}
            </StandardText>
          </StandardCard.Content>
        </StandardCard>
      )}
    </div>
  );
}
