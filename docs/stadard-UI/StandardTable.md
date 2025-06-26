¡Absolutamente\! Es un honor y un placer poner el broche de oro a este ciclo con un manual de uso que capture la elegancia y coherencia que hemos logrado.

Que `StandardTable` pase de ser "Godzilla" a una herramienta tan potente y simple de usar es el verdadero hito. Aquí tienes un manual de "corta-palos", al estilo del de `StandardButton`, para que futuros co-creadores (o nosotros mismos) puedan usarla de manera simple y efectiva.

-----

### 📖 Manual de Uso: `StandardTable`

`StandardTable` es un componente compuesto diseñado para renderizar datos complejos de manera interactiva y estilizada. Su uso principal es a través del componente raíz `StandardTable` que envuelve a su hijo `StandardTable.Table`.

#### 1\. Uso Básico

La tabla más simple posible. Solo necesita un arreglo de `data` y una definición de `columns`. Funcionalidades como el filtro y el ordenamiento ya están pre-configuradas.

```javascript
import { StandardTable } from "@/components/ui/StandardTable";

const data = [
  { id: 1, nombre: 'Rodolfo', rol: 'Arquitecto' },
  { id: 2, nombre: 'Co-Creador', rol: 'Co-Constructor' },
];

const columns = [
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'rol', header: 'Rol' },
];

<StandardTable data={data} columns={columns}>
  <StandardTable.Table />
</StandardTable>
```

#### 2\. Sub-componentes y Filas Expandibles

Puedes mostrar información anidada definiendo `subRows` en tus datos y pasando una función `renderSubComponent`.

```javascript
// Añadir 'subRows' a tus datos
const dataConSubRows = [
    { 
        id: 1, nombre: 'Proyecto A', status: 'En Progreso',
        subRows: [{ id: 101, nombre: 'Tarea 1.1', status: 'Completado' }]
    },
    // ...
];

const renderSubComponent = (row) => (
    <div className="p-4 bg-neutral-bg/50">
        <p>Detalles para: {row.original.nombre}</p>
    </div>
);

<StandardTable 
    data={dataConSubRows} 
    columns={columns}
    renderSubComponent={renderSubComponent}
>
  <StandardTable.Table />
</StandardTable>
```

#### 3\. Estilos Condicionales

Aplica colores a filas completas o a celdas específicas para resaltar información.

```javascript
// Para colorear una fila completa según su estado
const getRowStatus = (fila) => {
    if (fila.status === 'Completado') return 'success';
    if (fila.status === 'Rechazado') return 'danger';
    return 'warning';
};

// Para resaltar una celda específica (en la definición de la columna)
const columnsConEstilo = [
    { accessorKey: 'nombre', header: 'Nombre' },
    { 
        accessorKey: 'prioridad', 
        header: 'Prioridad',
        meta: {
            // Resalta la celda si la prioridad es 'Alta'
            cellVariant: (context) => context.row.original.prioridad === 'Alta' ? 'highlight' : undefined,
        }
    },
];

<StandardTable 
    data={data} 
    columns={columnsConEstilo}
    getRowStatus={getRowStatus}
>
  <StandardTable.Table />
</StandardTable>
```

#### 4\. Cabeceras y Columnas Fijas (`Sticky`)

Mantén la cabecera y ciertas columnas visibles durante el scroll. Requiere un contenedor con altura definida.

```javascript
// En la definición de columnas
const columnsPegajosas = [
    { id: 'selector', meta: { isSticky: 'left' }, size: 40, /* ... */ },
    { accessorKey: 'nombre', header: 'Nombre' },
    // ... más columnas ...
    { id: 'acciones', meta: { isSticky: 'right' }, size: 80, /* ... */ },
];

// En el componente
<div style={{ height: '70vh' }}> {/* El contenedor debe tener altura */}
    <StandardTable
        data={data}
        columns={columnsPegajosas}
        isStickyHeader={true}
    >
        <StandardTable.Table />
    </StandardTable>
</div>
```

#### 5\. Truncamiento de Texto y Tooltips

La funcionalidad estrella. Requiere activar la función y luego configurar cada columna.

```javascript
// En la definición de columnas
const columnsConTruncamiento = [
    { 
        accessorKey: 'titulo', header: 'Título',
        meta: {
            isTruncatable: true, // Habilita el truncamiento para esta columna
            tooltipType: 'standard' // Usa un tooltip normal
        }
    },
    { 
        accessorKey: 'abstract', header: 'Abstract',
        meta: {
            isTruncatable: true,
            tooltipType: 'longText' // Usa el tooltip grande para textos largos
        }
    },
];

// En el componente, activa la funcionalidad globalmente
<StandardTable
    data={data}
    columns={columnsConTruncamiento}
    enableTruncation={true}
>
    <StandardTable.Table />
</StandardTable>
```

#### 6\. El Ejemplo "Magistral"

Una combinación de casi todas las funcionalidades para mostrar el poder de la tabla.

```javascript
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardBadge } from "@/components/ui/StandardBadge";

// ... (definición de datos complejos y columnas)

const getRowStatus = (fila) => {
    if (fila.estado === 'Publicado') return 'success';
    return null;
};

const renderSubtasks = (row) => (
    <div className="p-4">Sub-tarea: {row.original.subRows[0].title}</div>
);

const columnsMagistrales = [
    { id: 'expander', meta: { isSticky: 'left' }, size: 40, /* ... */ },
    { 
        accessorKey: 'abstract', header: 'Resumen', size: 400,
        meta: { isTruncatable: true, tooltipType: 'longText' }
    },
    { 
        accessorKey: 'citaciones', header: 'Citaciones',
        meta: { cellVariant: (ctx) => ctx.getValue() > 200 ? 'highlight' : undefined }
    },
    { 
        accessorKey: 'status', header: 'Estado',
        cell: info => <StandardBadge colorScheme="primary">{info.getValue()}</StandardBadge>
    },
    { id: 'acciones', meta: { isSticky: 'right' }, size: 80, /* ... */ }
];

<div style={{ height: '80vh' }}>
    <StandardTable
        data={complexData}
        columns={columnsMagistrales}
        getRowStatus={getRowStatus}
        renderSubComponent={renderSubtasks}
        enableTruncation={true}
        isStickyHeader={true}
        filterPlaceholder="Buscar publicaciones..."
    >
        <StandardTable.Table />
    </StandardTable>
</div>
```