# Skill: StandardTable

## Qué es

Tabla de datos avanzada basada en @tanstack/react-table con soporte para: ordenamiento, filtrado, sub-rows expandibles, sticky columns, keyword highlighting, row status con color, tooltips en celdas, botón de copia, y exportación CSV. Altamente configurable vía `meta` en columnDefs y `tableOptions`.

## Import

```tsx
import { StandardTable } from "@/components/ui/StandardTable"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `TData[]` (requerido) | — | Datos de la tabla |
| `columns` | `ColumnDef<TData>[]` (requerido) | — | Definición de columnas (@tanstack/react-table) |
| `pageSize` | `number` | `10` | Filas por página |
| `className` | `string` | — | Clases adicionales |
| `tableOptions` | `TableOptions<TData>` | — | Opciones adicionales para useReactTable |

### Propiedades vía `meta` en ColumnDef

| Meta key | Tipo | Descripción |
|---|---|---|
| `align` | `"left" \| "center" \| "right"` | Alineación de la columna |
| `isSticky` | `"left" \| "right"` | Columna sticky |
| `size` | `number` | Ancho en px |
| `isTruncatable` | `boolean` | Trunca contenido largo con tooltip |
| `tooltipType` | `"standard" \| "longText"` | Tipo de tooltip para celdas truncadas |
| `cellVariant` | `(ctx) => "highlight" \| "success" \| "warning" \| "danger" \| undefined` | Color de celda dinámico |
| `enableCopyButton` | `boolean` | Botón para copiar contenido |

### Propiedades vía `meta` en TableOptions

| Meta key | Tipo | Descripción |
|---|---|---|
| `getRowStatus` | `(row) => ColorSchemeVariant \| null` | Color de fila por estado |
| `filterPlaceholder` | `string` | Placeholder del filtro global |
| `renderSubComponent` | `(row) => ReactNode` | Contenido expandible |
| `truncateRowsTo` | `number \| null` | Limita filas visibles |
| `enableKeywordHighlighting` | `boolean` | Resalta keywords en celdas |
| `keywordHighlight` | `string \| null` | Keyword a resaltar |

## Uso correcto

```tsx
// ✅ Configuración básica
const columns: ColumnDef<MyData>[] = [
  {
    accessorKey: "title",
    header: "Título",
    meta: { isTruncatable: true, tooltipType: "longText" }
  },
  {
    accessorKey: "status",
    header: "Estado",
    meta: {
      cellVariant: (ctx) => {
        const status = ctx.getValue<string>()
        return status === "Published" ? "success" : "warning"
      }
    }
  },
  {
    accessorKey: "citations",
    header: "Citas",
    meta: { align: "right", enableCopyButton: true }
  },
]

<StandardTable
  data={publications}
  columns={columns}
  pageSize={15}
  tableOptions={{
    meta: {
      getRowStatus: (row) => row.status === "Rejected" ? "danger" : null,
      filterPlaceholder: "Buscar publicaciones...",
      renderSubComponent: (row) => (
        <div className="p-4">{row.original.abstract}</div>
      ),
      enableKeywordHighlighting: true,
      keywordHighlight: searchTerm,
    }
  }}
/>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima de la tabla
<StandardTable className="bg-red-500" />

// ❌ Siempre definir meta en columnDefs para comportamiento avanzado
// Las props como align, isSticky, cellVariant van en meta, no en ColumnDef directamente
```

## Cuándo NO usar este componente

- Para tablas simples con pocos datos: `<table>` HTML nativo puede bastar.
- Para listados no tabulares: usa `StandardCard` en grid.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardTable necesita soporte de selección de filas con checkbox`
