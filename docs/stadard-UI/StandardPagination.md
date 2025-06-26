# StandardPagination

`StandardPagination` es un componente de interfaz de usuario diseñado para navegar a través de conjuntos de datos paginados. Proporciona controles claros e intuitivos, incluyendo botones de página anterior/siguiente, números de página y un resumen del recuento de ítems.

## Filosofía

Este componente es puramente presentacional. No contiene lógica de estado interna para la página actual. En su lugar, recibe el estado de la paginación (como `currentPage`, `totalPages`, etc.) a través de `props` y emite eventos (`onPageChange`) cuando el usuario interactúa con los controles. Este diseño desacoplado lo hace altamente reutilizable y permite que la lógica de estado de la paginación resida donde sea más apropiado, como en el componente de página que consume los datos.

## Integración con `StandardTable`

`StandardPagination` está diseñado para funcionar en perfecta armonía con `StandardTable`. La estrategia recomendada es:

1.  Mantener el estado de la página actual en el componente padre (por ejemplo, la página del showroom).
2.  Calcular qué porción del conjunto de datos total corresponde a la página actual.
3.  Pasar solo esa porción de datos a `StandardTable`.
4.  Pasar los props de paginación (`currentPage`, `totalPages`, etc.) a `StandardPagination`.

## Props

| Prop           | Tipo                      | Requerido | Descripción                                                                    |
|----------------|---------------------------|-----------|--------------------------------------------------------------------------------|
| `currentPage`  | `number`                  | Sí        | El número de la página activa actualmente.                                     |
| `totalPages`   | `number`                  | Sí        | El número total de páginas disponibles.                                        |
| `onPageChange` | `(page: number) => void`  | Sí        | Función callback que se invoca cuando el usuario hace clic en un número de página. |
| `itemsPerPage` | `number`                  | Sí        | El número de ítems que se muestran por página.                                  |
| `totalItems`   | `number`                  | Sí        | El número total de ítems en el conjunto de datos completo.                      |
| `className`    | `string`                  | No        | Clases CSS adicionales para aplicar al contenedor principal del componente.    |

## Ejemplo de Uso

```tsx
import { StandardPagination } from '@/components/ui/StandardPagination';
import { StandardTable } from '@/components/ui/StandardTable';
import { useState, useMemo } from 'react';

// Suponiendo que 'allUsers' es un array con todos los datos
// y 'columns' es la definición de columnas para la tabla.

const PaginatedTableComponent = ({ allUsers, columns }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(allUsers.length / ITEMS_PER_PAGE);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return allUsers.slice(start, end);
  }, [currentPage, allUsers]);

  return (
    <div>
      <StandardTable data={currentPageData} columns={columns} />
      <StandardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={allUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        className="mt-4"
      />
    </div>
  );
}
```
