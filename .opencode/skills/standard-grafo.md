# Skill: StandardGrafo

## Qué es

Componente agnóstico de grafo de co-ocurrencia. Renderiza nodos + aristas con:

- **Tipado visual por nodo** (color desde tokens del design system, icono o emoji, título y subtítulo)
- **Animaciones**: float (oscilación sinusoidal) + breathe (pulso del radio); hover las intensifica
- **Interacción rica**: hover → fantasmas el resto; click → expande a vecinos directos; doble click → ruteo del cliente
- **Filtro de visibilidad por tipo** (chips toggleables)
- **Modo agregado**: ignora tipos, todos los nodos con look neutro (topología cruda)
- **Header opcional** del grafo (título + ícono + subtítulo)
- **viewMode**: `flat` o `3d` simulado (gradient radial con brillo arriba-izquierda)
- **Theme-aware**: lee colores desde `useTheme().appColorTokens` — cambia con tema/modo
- **Respeta `prefers-reduced-motion`**

Render en Canvas 2D nativo. Iconos React vía overlay HTML posicionado por DOM directo (sin re-render por frame).

## Import

```tsx
import { StandardGrafo } from "@/components/ui/StandardGrafo"
import type {
  GraphNode,
  GraphEdge,
  GraphNodeType,
  GraphIconMode,
  GraphViewMode,
  GraphHeader,
  GraphAnimationConfig,
} from "@/lib/grafo/types"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `nodes` | `GraphNode[]` | — | Nodos del grafo |
| `edges` | `GraphEdge[]` | — | Aristas con `weight` |
| `total` | `number` | — | Total del corpus (usado para `freq/total > 0.8` → nodo al centro) |
| `nodeTypes` | `GraphNodeType[]` | `[]` | Catálogo de tipos. Vacío = todos los nodos con colorScheme primary |
| `iconMode` | `"icon" \| "emoji"` | `"icon"` | Convención de iconos. **Debe ser coherente** en TODO el catálogo |
| `header` | `GraphHeader` | — | `{ title, subtitle?, icon? }` para mostrar arriba del canvas |
| `showHeader` | `boolean` | `false` | Si renderizar `header` adentro del componente |
| `showTypeFilter` | `boolean` | auto si >1 tipo | Mostrar barra de chips por tipo |
| `showAggregateToggle` | `boolean` | `false` | Botón "Modo agregado" en la barra superior |
| `defaultAggregateMode` | `boolean` | `false` | Estado inicial del modo agregado |
| `animations` | `GraphAnimationConfig` | `{ float, breathe, hoverIntensify: true }` | Activar/desactivar animaciones |
| `viewMode` | `"flat" \| "3d"` | `"flat"` | Estilo visual del nodo |
| `onNodeClick` | `(id: string) => void` | — | Click simple (delay 250ms para distinguir doble) |
| `onNodeDoubleClick` | `(id: string) => void` | — | Doble click — el cliente decide (ej. ruteo) |
| `height` | `number` | `400` | Alto del canvas en px |
| `emptyMessage` | `string` | — | Texto del empty state (no implementado aún) |

### Tipos auxiliares

```ts
interface GraphNode {
  id: string
  label: string
  subtitle?: string
  freq: number
  typeId?: string        // referencia a GraphNodeType.id
}

interface GraphEdge {
  source: string
  target: string
  weight: number         // ≤2 = arista punteada, >2 = sólida
}

interface GraphNodeType {
  id: string
  label: string
  subtitle?: string
  icon: React.ElementType | string  // componente React si iconMode="icon", string si "emoji"
  colorScheme: ColorSchemeVariant   // primary, secondary, tertiary, accent, success, warning, danger, neutral, white
}

interface GraphHeader {
  title: string
  subtitle?: string
  icon?: React.ElementType | string
}

interface GraphAnimationConfig {
  float: boolean
  breathe: boolean
  hoverIntensify: boolean
}
```

## Uso correcto

```tsx
// ✅ Básico — sin tipos, todos los nodos en primary
<StandardGrafo
  nodes={nodes}
  edges={edges}
  total={total}
  height={520}
/>

// ✅ Con tipos (Lucide icons)
import { FileText, Mic, Video } from "lucide-react"

const catalog: GraphNodeType[] = [
  { id: "md",    label: "Markdown", icon: FileText, colorScheme: "primary" },
  { id: "audio", label: "Audio",    icon: Mic,      colorScheme: "accent" },
  { id: "video", label: "Video",    icon: Video,    colorScheme: "success" },
]

<StandardGrafo
  nodes={nodes}
  edges={edges}
  total={total}
  nodeTypes={catalog}
  iconMode="icon"
  viewMode="3d"
  showAggregateToggle
/>

// ✅ Con emoji (alternativa al ecosistema lucide)
const catalogEmoji: GraphNodeType[] = [
  { id: "md",    label: "Markdown", icon: "📝", colorScheme: "primary" },
  { id: "audio", label: "Audio",    icon: "🎙️", colorScheme: "accent" },
]

<StandardGrafo
  nodes={nodes}
  edges={edges}
  total={total}
  nodeTypes={catalogEmoji}
  iconMode="emoji"
/>

// ✅ Con header + ruteo en doble click
import { useRouter } from "next/navigation"
import { Network } from "lucide-react"

const router = useRouter()

<StandardGrafo
  nodes={nodes}
  edges={edges}
  total={total}
  nodeTypes={catalog}
  iconMode="icon"
  header={{
    title: "Relaciones entre artefactos",
    subtitle: "Co-ocurrencia en el corpus",
    icon: Network,
  }}
  showHeader
  onNodeClick={(id) => console.log("seleccionado:", id)}
  onNodeDoubleClick={(id) => router.push(`/artefacto/${id}`)}
/>

// ✅ Sin animaciones (para impresión o usuarios con reduced-motion)
<StandardGrafo
  nodes={nodes}
  edges={edges}
  total={total}
  animations={{ float: false, breathe: false, hoverIntensify: false }}
/>
```

## Errores comunes — PROHIBIDO

```tsx
// ❌ Mezclar emoji + componente en el mismo catálogo
const types = [
  { id: "a", icon: Star,  colorScheme: "primary" },   // componente
  { id: "b", icon: "🔥", colorScheme: "danger" },     // emoji
]
// El componente dispara console.warn y deja vacío el icono inconsistente.
// Decidí UNA convención (iconMode) y mantenela en TODO el catálogo.

// ❌ Más de 8 tipos visibles a la vez
// El componente solo avisa (console.warn), pero el ojo se confunde con >8 colores.
// Si necesitás más, agrupá o usá modo agregado.

// ❌ Pasar el catálogo en línea sin useMemo
<StandardGrafo nodeTypes={[{...}, {...}]} />
// Cada render crea un array nuevo → invalida memoizaciones internas → animación
// se resetea. Usá useMemo o constante a nivel módulo.

// ❌ Pintar el icono con Tailwind o style inline esperando que afecte el nodo
<StandardGrafo className="bg-red-500" />  // no aplica a colores del nodo

// ❌ Asumir que onNodeClick dispara inmediato
// Hay delay de 250ms para distinguir simple vs doble click.
// Si necesitás click instantáneo y NO usás doble click, podemos exponer una
// flag — pedirlo como deuda técnica.

// ❌ Confundir el `total` con la suma de freqs
// total = tamaño del corpus (cantidad de artefactos/contenedores).
// Es lo que decide si el nodo top va al centro (freq/total > 0.8).
```

## Comportamientos clave de interacción

| Acción | Resultado |
|---|---|
| Hover sobre A | A normal, resto fantasma (25%); aristas no conectadas a 12% |
| Click sobre A | A + vecinos directos normales, resto fantasma; banner instructivo aparece |
| Mover mouse fuera del nodo | **Expansión persiste** |
| Hover sobre B con A expandido | Se rompe la expansión, hover puro sobre B |
| Click sobre B | Nueva expansión sobre B |
| Click en zona vacía | Reset total |
| Doble click | Dispara `onNodeDoubleClick` (ruteo del cliente) |

El banner cambia según el estado:
- Sólo hover: "Click para marcar relaciones · Doble click para navegar" (omite la segunda parte si no hay `onNodeDoubleClick`)
- Expansión activa: "Click en zona vacía para volver al estado normal"

## Cuándo NO usar este componente

- **>200 nodos**: el layout circular satura visualmente y Canvas 2D puede sentirse lento. Considerá D3 force-directed o WebGL.
- **Grafos jerárquicos** (árboles, DAGs): el layout es plano circular. Necesitás dagre, elk, o tree layout dedicado.
- **Drag de nodos**: no soportado. Las posiciones son derivadas de freq + animación.
- **Grafos dirigidos con flechas**: las aristas son no-dirigidas (sin marcadores en las puntas).
- **Edición del grafo desde el componente**: es read-only / view-only. Para edición, usar otro componente.

## Si necesitás una variante que no existe

No la implementes inline. Patrón:
1. Usar la variante más cercana disponible
2. Reportar como deuda técnica:
   - `⚠ Deuda técnica: StandardGrafo necesita soporte de aristas dirigidas (flechas)`
   - `⚠ Deuda técnica: StandardGrafo necesita layout jerárquico (tree)`
   - `⚠ Deuda técnica: StandardGrafo necesita drag de nodos`

## Notas de arquitectura

- **Theme-aware**: colores vía `useTheme().appColorTokens[colorScheme].pure/textShade`. Cuando cambia el tema o modo light/dark, el grafo re-pinta automáticamente.
- **viewMode "3d"**: usa `createRadialGradient` con stops claros/oscuros precomputados con `tinycolor.lighten(22)` y `darken(18)`.
- **Animaciones**: `requestAnimationFrame` loop. Mutaciones in-place sobre `layoutsRef.current` para no causar re-renders.
- **Iconos React**: overlay HTML posicionado con `transform: translate()` actualizado por DOM directo en cada frame. Cero re-renders React durante la animación.
- **Hit-testing**: O(n) por movimiento de mouse, suficiente hasta ~200 nodos.
- **Datos**: el componente NO hace fetch. El cliente provee `nodes`, `edges`, `total`. La fuente puede ser API, Supabase, mock, o lo que sea.
