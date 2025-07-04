# Guía de Uso Definitiva para `StandardTable`

**Dirigido a:** Futuras IAs y desarrolladores colaborando en el ecosistema Sustrato.ai.

**Propósito:** Este documento establece el **único patrón correcto** para implementar una tabla con filas expandibles usando el componente `StandardTable`. Seguir esta guía es **mandatorio** para evitar errores, frustración y consumo innecesario de recursos.

---

## Principios Fundamentales

El componente `StandardTable` está diseñado para ser robusto y consistente. Encapsula la mayor parte de la lógica compleja, incluyendo la renderización de los íconos de expansión. Para que funcione correctamente, **no se debe intentar replicar su lógica interna**. En su lugar, se le deben proporcionar los datos y la configuración de columnas en el formato que espera.

### Los 3 Requisitos para Filas Expandibles

Para que una fila muestre el ícono de expansión (`>`) y revele un subcomponente al hacer clic, se deben cumplir **los tres requisitos siguientes simultáneamente**:

1.  **Propiedad `subRows` en los Datos:** Cada objeto de datos que represente una fila que deba ser expandible **debe** contener una propiedad llamada `subRows`. El valor debe ser un `array`. Si no hay sub-filas jerárquicas reales, se puede usar un array con un objeto vacío para "activar" el expansor: `subRows: [{} as TuTipo]`.

2.  **Columna `expander` Dedicada:** La definición de columnas (`columns`) **debe** incluir una columna específica para el expansor como primer elemento. Esta columna tiene una configuración precisa:
    *   `id: 'expander'`
    *   `header: () => null` (No tiene título)
    *   `cell: ({ row }) => row.getCanExpand() ? '' : null` (La celda está vacía; `StandardTable` la llenará)
    *   `size`: Un tamaño pequeño (ej. `40`).

3.  **Prop `renderSubComponent`:** Se debe pasar una función a la prop `renderSubComponent` del componente `<StandardTable>`. Esta función recibe la `row` y debe devolver el `React.ReactNode` que se mostrará cuando la fila se expanda.

---

## Ejemplo de Implementación Correcta

A continuación se muestra el código relevante de `mockcargaarticulos/page.tsx` como referencia canónica.

```tsx
"use client";

import React, { useMemo } from "react";
import { type ColumnDef, type Row } from "@tanstack/react-table";
// ... otras importaciones

// 1. El tipo de datos DEBE incluir `subRows`
type Article = {
  // ... otras propiedades
  subRows?: Article[];
};

// 2. Los datos DEBEN tener la propiedad `subRows`
const mockArticleData: Article[] = [
  {
    // ... otros datos
    subRows: [{} as Article], // Activa el expansor
  },
  // ... más artículos
];

export default function MockCargaArticulosPage() {

  // 3. La definición de columnas DEBE tener la columna 'expander'
  const columns = useMemo<ColumnDef<Article>[]>(() => [
    { 
      id: 'expander',
      header: () => null,
      cell: ({ row }) => row.getCanExpand() ? '' : null,
      size: 40,
      meta: { isSticky: 'left' } // Opcional: para fijar la columna
    },
    { accessorKey: 'Title', header: 'Título', size: 400 },
    // ... otras columnas
  ], []);

  // 4. Se DEBE proporcionar la función `renderSubComponent`
  const renderSubComponent = (row: Row<Article>) => {
    const { original: article } = row;
    return (
      <div className="p-4">
        {/* Contenido del subcomponente */}
        <p>WOS ID: {article['UT (Unique WOS ID)']}</p>
      </div>
    );
  };

  return (
    // ... JSX de la página
      <StandardTable
          data={mockArticleData}
          columns={columns}
          renderSubComponent={renderSubComponent} // 5. Pasar la función aquí
          // ... otras props
      >
          <StandardTable.Table />
      </StandardTable>
    // ...
  );
}
```

## Errores Comunes a Evitar (Lecciones Aprendidas)

*   **NO** intentar renderizar los íconos (`ChevronDown`, `ChevronRight`) manualmente dentro de una celda. `StandardTable` lo hace automáticamente.
*   **NO** fusionar la lógica del expansor con otra columna (como la de "Título"). El expansor **debe** tener su propia columna dedicada.
*   **NO** olvidar la propiedad `subRows` en los datos. Sin ella, `row.getCanExpand()` devolverá `false` y el expansor no aparecerá.

Adherirse estrictamente a este patrón garantiza la coherencia y funcionalidad esperada del ecosistema de componentes `Standard*`.
