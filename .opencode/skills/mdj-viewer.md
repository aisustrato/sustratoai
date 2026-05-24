# MDJ Viewer — Sistema de Visualización de Documentos MDJ

## Core Principle

El MDJ Viewer transforma Markdown en un árbol de nodos interactivo (DocumentoMDJ), soportando anotaciones, búsqueda, LaTeX y exportación. Sigue el patrón `Standard*` del proyecto (componentes exportados como `StandardMDJViewer` y `StandardMDJViewerClient`).

---

## Pipeline

```
MD fuente
  → unified(remark-parse + remark-gfm + remark-math)
  → MDAST (árbol sintáctico)
  → transformer.ts (transformarMDASTaMDJ)
  → DocumentoMDJ (árbol de nodos propio)
```

### Archivos clave del pipeline

| Archivo | Rol |
|---------|-----|
| `lib/mdj/parser.ts` | Punto de entrada: unified pipeline + `parsearMDJ()` |
| `lib/mdj/transformer.ts` | Convierte MDAST → DocumentoMDJ (nodos, anotaciones) |
| `lib/mdj/types.ts` | Todos los tipos del contrato MDJ |
| `lib/mdj/id-generator.ts` | Generación de IDs deterministas para nodos |
| `lib/mdj/exportador.ts` | Exportación a MD puro con anotaciones marcadas |
| `lib/mdj/buscador.ts` | Búsqueda textual sobre el árbol MDJ |
| `lib/mdj/texto-plano.ts` | Extracción de texto plano desde NodoInline[] |
| `lib/mdj/anotaciones.ts` | Utilidades de indexado y filtrado de anotaciones |

---

## API del Viewer

### StandardMDJViewer (Server Component)

```tsx
import { StandardMDJViewer } from "@/components/mdj-viewer";

<StandardMDJViewer
  md={contenidoMarkdown}
  artefactoId="uuid-del-artefacto"
  tipoArtefacto="cronica"       // opcional, default "otro"
  anotaciones={anotaciones}     // opcional
  className="mi-clase"          // opcional
/>
```

Props:
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `md` | `string` | — | Contenido Markdown fuente |
| `artefactoId` | `string` | — | UUID del artefacto en Cognética |
| `tipoArtefacto` | `"cronica" \| "destilado" \| "germinador" \| "transcripcion_pdf" \| "otro"` | `"otro"` | Tipo de artefacto |
| `anotaciones` | `Anotacion[]` | `[]` | Anotaciones existentes |
| `className` | `string` | `""` | Clase CSS adicional |

### StandardMDJViewerClient (Client Component)

```tsx
import { StandardMDJViewerClient } from "@/components/mdj-viewer";

<StandardMDJViewerClient
  md={contenidoMarkdown}
  artefactoId="uuid-del-artefacto"
  tipoArtefacto="otro"
  anotaciones={anotaciones}
  onSeleccion={(sel) => console.log(sel)}
  onAgregarFraseNotable={async (anot) => ({ ok: true })}
  onAgregarReferencia={async (anot) => ({ ok: true })}
  onAgregarNota={async (anot) => ({ ok: true })}
/>
```

Props adicionales del Client:
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onSeleccion` | `(sel: SeleccionMDJ) => void` | Callback cuando el usuario selecciona texto |
| `onAgregarFraseNotable` | `(anot: Anotacion) => Promise<{ ok: boolean }>` | Callback para guardar frase notable |
| `onAgregarReferencia` | `(anot: Anotacion) => Promise<{ ok: boolean }>` | Callback para guardar referencia |
| `onAgregarNota` | `(anot: Anotacion) => Promise<{ ok: boolean }>` | Callback para guardar nota |

---

## Tipos de Nodo

### Nodos Estructurales

| Tipo | Descripción | Props clave |
|------|-------------|-------------|
| `h1` | Heading nivel 1 (sección raíz) | `texto`, `hijos: NodoEstructural[]`, `colapsado?` |
| `h2` | Heading nivel 2 (subsección) | `texto`, `hijos: NodoEstructural[]`, `colapsado?` |
| `h3` | Heading nivel 3 | `texto`, `hijos: NodoHoja[]`, `colapsado?` |
| `p` | Párrafo | `inline: NodoInline[]`, `texto_plano` |
| `ul` / `ol` | Lista no ordenada / ordenada | `items: NodoItem[]` |
| `li` | Item de lista | `inline: NodoInline[]`, `texto_plano`, `hijos?: NodoLista[]` |
| `tbl` | Tabla | `headers: string[]`, `filas: string[][]` |
| `code` | Bloque de código | `lenguaje?: string`, `contenido: string` |
| `latex` | Bloque LaTeX | `contenido: string`, `modo: "bloque"` |

### Nodos Inline

| Tipo | Descripción |
|------|-------------|
| `texto` | Texto plano (`contenido: string`) |
| `negrita` | Negrita (`hijos: NodoInline[]`) |
| `cursiva` | Cursiva (`hijos: NodoInline[]`) |
| `neg_cur` | Negrita + cursiva combinadas (`hijos: NodoInline[]`) |
| `tachado` | Tachado (`hijos: NodoInline[]`) |
| `code_inline` | Código inline (`contenido: string`) |
| `latex_inline` | Fórmula LaTeX inline (`contenido: string`) |
| `link` | Enlace (`texto: string`, `url: string`) |

---

## Anotaciones

### Tipos de Anotación

| Tipo | Descripción | Campos adicionales |
|------|-------------|-------------------|
| `frase_notable` | Fragmento destacado | — |
| `referencia` | Vínculo bibliográfico | `entidad_id?`, `semaforo?`, `validado?` |
| `nota` | Nota del investigador | `nota_texto?` |

### Semáforo de Referencia

```typescript
type SemaforoReferencia = "verde" | "amarillo" | "rojo";
```

### Propiedades comunes

```typescript
type Anotacion = {
  id: string;
  tipo: TipoAnotacion;
  nodo_id: string;
  offset_inicio: number;
  offset_fin: number;
  fragmento: string;
  huerfana?: boolean;  // true si nodo_id ya no existe en el árbol
};
```

### Optimistic UI

Todas las operaciones de anotación usan optimistic UI:
1. Se agrega la anotación localmente de inmediato
2. Se llama al callback externo
3. Si falla → se muestra `DialogoReintento` con opción de reintentar o cancelar
4. Si se cancela → se remueve la anotación local

---

## LaTeX

### Dependencia

`remark-math` (v6.0.0) — agregado al pipeline de unified en `parser.ts`.

### ⚠️ Regla crítica: formato de fórmulas bloque

`remark-math` **requiere** que `$$...$$` estén en **líneas separadas** para generar un nodo `math` de bloque.

**Correcto:**
```markdown
$$
E = \sum_{i=1}^{n} \alpha_i
$$
```
→ Genera: `[math]` → `NodoLatex` (bloque)

**Incorrecto:**
```markdown
$$E = \sum_{i=1}^{n} \alpha_i$$
```
→ Genera: `[paragraph] → [inlineMath]` (inline, NO bloque)

### Fórmulas inline

Las fórmulas `$...$` funcionan normalmente:
```markdown
Donde $\alpha_i$ son los coeficientes.
```
→ Genera: `[inlineMath]` → `latex_inline`

### Motor de Renderizado

Se reutiliza `components/ui/latex-renderer.tsx` (sin dependencias externas):
- `renderLatexBlock(contenido)` → HTML para fórmulas bloque
- `renderLatexInline(contenido)` → HTML para fórmulas inline
- Cubre ~95% de símbolos: griegos, operadores, integrales, super/subíndices, fracciones

### Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `lib/mdj/parser.ts` | `.use(remarkMath)` en pipeline |
| `lib/mdj/transformer.ts` | `case "math"` → `NodoLatex`, `case "inlineMath"` → `latex_inline` |
| `lib/mdj/types.ts` | Tipo `NodoLatex` y `latex_inline` en `NodoInline` |
| `components/mdj-viewer/NodoLatexView.tsx` | Renderiza bloque LaTeX |
| `components/mdj-viewer/InlineRenderer.tsx` | Renderiza `latex_inline` |
| `components/mdj-viewer/NodoDispatcher.tsx` | Dispatcher `case "latex"` → `NodoLatexView` |
| `components/ui/latex-renderer.tsx` | Motor LaTeX → HTML |

---

## Búsqueda

El `BuscadorMDJ` está integrado en el `StandardMDJViewerClient`:

### Características
- **Debounce**: 300ms antes de iniciar búsqueda
- **Sticky header**: el buscador permanece visible al hacer scroll
- **URL params**: soporta `?buscar=texto` para búsqueda inicial desde navegación externa
- **Trigger externo**: prop `busquedaExterna` para buscar desde fuera (ej. popover de selección)
- **Navegación**: flechas para ir a resultado anterior/siguiente con scroll suave
- **Highlight**: los matches se resaltan con color `success`

### ⚠️ Pitfall: memoizar `doc`
El prop `doc` que se pasa a `BuscadorMDJ` debe ser memoizado con `useMemo`.
Sin esto, cada render del padre crea un objeto nuevo que dispara
los efectos internos → `onNavegar` → cambio de estado → re-render → loop infinito.

```tsx
// ✅ Correcto
const docConAnotaciones = useMemo(
  () => ({ ...doc, anotaciones: anotacionesResueltas }),
  [doc, anotacionesResueltas],
);
```

### ⚠️ Pitfall: ref guard para búsqueda externa
El `busquedaExterna` debe tener un ref guard para evitar loops:
```tsx
const busquedaExternaRef = useRef(busquedaExterna);
// comparar antes de disparar efectos
```

---

## Arquitectura de Componentes

```
components/mdj-viewer/
├── StandardMDJViewer.tsx          ← Server Component raíz
├── StandardMDJViewerClient.tsx    ← Client Component con selección
├── index.ts                       ← Barrel export
├── NodoDispatcher.tsx             ← Server Component: dispatchea por tipo
├── SeccionColapsable.tsx          ← Acordeón colapsable para H1/H2/H3
├── NodoParrafoView.tsx            ← Renderiza párrafos con anotaciones + búsqueda
├── NodoListaView.tsx              ← Renderiza listas (anidadas, anotaciones)
├── NodoTablaView.tsx              ← Renderiza tablas
├── NodoCodigoView.tsx             ← Renderiza bloques de código
├── NodoLatexView.tsx              ← Renderiza bloques LaTeX
├── InlineRenderer.tsx             ← Renderiza NodoInline[] con colores dinámicos
├── AnotacionMarca.tsx             ← Highlight de anotaciones con color dinámico
├── BuscadorMDJ.tsx                ← Buscador con debounce + navegación
├── useSeleccionMDJ.ts             ← Hook de selección de texto
├── SeleccionPopover.tsx           ← Menú contextual de selección
├── FraseNotableTooltip.tsx        ← Tooltip para frases notables
├── ReferenciaTooltip.tsx          ← Tooltip para referencias (con semáforo)
├── NotaTooltip.tsx                ← Tooltip para notas
├── DialogoReintento.tsx           ← Diálogo de reintento en fallos
├── DialogoAgregarReferencia.tsx   ← Diálogo para agregar referencia
└── ClienteFalso.tsx               ← Mock para pruebas en showroom
```

### Flujo de renderizado

```
StandardMDJViewer / StandardMDJViewerClient
  └─ NodoDispatcher (por cada nodo)
       ├─ SeccionColapsable (h1/h2/h3)
       │   └─ NodoDispatcher (recursivo por hijos)
       ├─ NodoParrafoView (p)
       │   └─ AnotacionMarca (para cada anotación)
       │   └─ BusquedaMarca (para cada match de búsqueda)
       │   └─ Tooltip (FraseNotableTooltip / ReferenciaTooltip / NotaTooltip)
       │       └─ InlineRenderer (NodoInline[])
       ├─ NodoListaView (ul/ol)
       │   └─ items → NodoParrafoView (inline)
       │   └─ subListas → NodoListaView (recursivo)
       ├─ NodoTablaView (tbl)
       ├─ NodoCodigoView (code)
       └─ NodoLatexView (latex)
```

---

## Algoritmos Clave

### Line-Sweep en NodoParrafoView

Para renderizar correctamente segmentos superpuestos de anotaciones y búsqueda:
1. Se recolectan todos los segmentos (anotaciones + búsqueda) con sus offsets
2. Se ordenan por offset de inicio
3. Se barre linealmente resolviendo intersecciones
4. Cada segmento se renderiza con su componente correspondiente

### Resolución de IDs deterministas

Los IDs de nodos se generan con `id-generator.ts` siguiendo el patrón:
```
{prefijo_padre}.{tipo}_{contador}
```
Ejemplo: `h1_0.h2_0.p_1` = segundo párrafo dentro del primer H2 dentro del primer H1

---

## Exportación

`exportarMDPuro(doc: DocumentoMDJ): string` genera Markdown puro:

| Anotación | Formato |
|-----------|---------|
| `frase_notable` | `==texto==` |
| `referencia` | `texto[^n]` + footnote `[^n]: link` |
| `nota` | `texto %%nota%%` |
| LaTeX bloque | `$$\n...\n$$` (con saltos de línea) |
| LaTeX inline | `$...$` |

---

## Theming

El MDJ Viewer sigue el sistema de theming del proyecto:
- **Anotaciones**: usan `useTheme()` → `appColorTokens[colorScheme]` para colores inline
- **Búsqueda**: usa `appColorTokens.success` via `BusquedaMarca`
- **Headings**: gradientes dinámicos (H1=primary, H2=secondary, H3=neutral)
- **No CSS variables**: todo via inline styles desde `useTheme()` / `useDesignTokens()`

Ver skill `standard-theming.md` para más detalles.

---

## Pitfalls Conocidos

### 1. Stale Closures en handleAccionSeleccion
El callback de acciones del popover usa `useRef` para la selección activa:
- `seleccionRef.current` almacena la selección más reciente
- El hook `handleAccionSeleccion` lee del ref, no del estado React
- Así se evita que el callback se recreé y cause race conditions con el popover de Radix

### 2. Popover Positioning
Usar `getRangeAt(0)` envuelto en try/catch (puede fallar si rangeCount=0).
Fallback: `lastMousePos` capturado con `mousemove` listener.

### 3. Tooltips: side="bottom", no isLongText
Para evitar que los tooltips cubran el texto subyacente:
- Todos usan `side="bottom"`
- Ninguno usa `isLongText` (que fuerza centrado vertical)

### 4. Memoizar doc para BuscadorMDJ
El prop `doc` debe ser memoizado (ver sección Búsqueda arriba).

### 5. $$ en líneas separadas para LaTeX bloque
(ver sección LaTeX arriba)

---

## Convención de Nombres

- Componentes exportados públicamente: prefijo `Standard*`
  - `StandardMDJViewer`, `StandardMDJViewerClient`
- Componentes internos: nombre descriptivo sin prefijo
  - `NodoDispatcher`, `BuscadorMDJ`, `SeleccionPopover`, etc.
- `BuscadorMDJ` se deja sin prefijo `Standard` porque solo es usado internamente por `StandardMDJViewerClient`.

---

## Archivos Relevantes

```
components/mdj-viewer/StandardMDJViewer.tsx          # Server Component raíz
components/mdj-viewer/StandardMDJViewerClient.tsx    # Client Component con selección
components/mdj-viewer/index.ts                       # Barrel export
components/mdj-viewer/NodoDispatcher.tsx             # Dispatcher de nodos
components/mdj-viewer/NodoParrafoView.tsx            # Renderizado de párrafos
components/mdj-viewer/NodoListaView.tsx              # Renderizado de listas
components/mdj-viewer/NodoTablaView.tsx              # Renderizado de tablas
components/mdj-viewer/NodoCodigoView.tsx             # Renderizado de código
components/mdj-viewer/NodoLatexView.tsx              # Renderizado de LaTeX bloque
components/mdj-viewer/InlineRenderer.tsx             # Renderizado inline
components/mdj-viewer/AnotacionMarca.tsx             # Highlight de anotaciones
components/mdj-viewer/BuscadorMDJ.tsx                # Búsqueda integrada
components/mdj-viewer/SeleccionPopover.tsx           # Menú contextual
components/mdj-viewer/FraseNotableTooltip.tsx        # Tooltip frase notable
components/mdj-viewer/ReferenciaTooltip.tsx          # Tooltip referencia
components/mdj-viewer/NotaTooltip.tsx                # Tooltip nota
components/mdj-viewer/DialogoReintento.tsx           # Diálogo de reintento
components/mdj-viewer/DialogoAgregarReferencia.tsx   # Diálogo referencia con semáforo
components/mdj-viewer/useSeleccionMDJ.ts             # Hook de selección
components/mdj-viewer/ClienteFalso.tsx               # Mock para pruebas
lib/mdj/parser.ts                                    # Parser MD → DocumentoMDJ
lib/mdj/transformer.ts                               # MDAST → DocumentoMDJ
lib/mdj/types.ts                                     # Tipos del contrato MDJ
lib/mdj/exportador.ts                                # Exportación a MD
lib/mdj/buscador.ts                                  # Búsqueda textual
lib/mdj/texto-plano.ts                               # Extracción de texto plano
lib/mdj/anotaciones.ts                               # Utilidades de anotaciones
lib/mdj/id-generator.ts                              # Generación de IDs
components/ui/latex-renderer.tsx                      # Motor LaTeX → HTML
app/showroom/mdj-viewer/page.tsx                      # Showroom de prueba
```
