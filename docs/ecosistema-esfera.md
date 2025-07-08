# Documentación del Ecosistema Esfera: `StandardSphere` y `StandardSphereGrid`

## 1. Introducción

El Ecosistema Esfera es un sistema de visualización de datos diseñado para representar colecciones de entidades como una matriz de esferas interactivas. Su propósito es ofrecer una vista densa y estéticamente agradable de un conjunto de datos, permitiendo al usuario obtener información de un vistazo a través de colores, iconos y texto.

La arquitectura se basa en una relación de **Orquestador-Inquilino**:

-   **`StandardSphereGrid` (El Orquestador)**: Es el componente contenedor inteligente. Su responsabilidad es gestionar el layout general. Mide el espacio disponible y calcula el tamaño y la disposición óptimos para todas las esferas que contiene.
-   **`StandardSphere` (El Inquilino)**: Es la unidad de visualización individual. Recibe las directrices de tamaño del Grid y, de forma autónoma, decide cómo presentar su propio contenido (texto, icono, etc.) de la manera más efectiva dentro del espacio asignado.

Esta separación de responsabilidades dota al sistema de una gran flexibilidad y eficiencia.

---

## 2. Componentes Principales

### `StandardSphere`

Es el átomo del ecosistema. Representa un único punto de datos.

**Responsabilidades Clave:**

-   **Renderizado Visual**: Muestra una forma circular con un estilo visual definido por las props `colorScheme` y `styleType` (`filled`, `subtle`, `outline`).
-   **Contenido Adaptativo**: Puede mostrar diferentes tipos de contenido, como un valor numérico/texto, un icono, un emoticón, o una combinación de ellos. Gracias a su lógica interna (`useSphereConsciousness`), el tamaño de este contenido se ajusta automáticamente en función del diámetro (`sizeInPx`) que le proporciona el Grid.
-   **Interactividad**: Gestiona eventos como `onClick`, `hover` (mostrando un `tooltip`) y estados como `disabled`.
-   **Información Secundaria (`StatusBadge`)**: Puede mostrar un `StandardBadge` debajo de la esfera para comunicar un estado secundario. La esfera solo mostrará el badge si el Grid se lo permite (`allowBadgeRender`) y si su diámetro es suficientemente grande.

**Props Esenciales:**

-   `sizeInPx`: El diámetro en píxeles, **dictado por el `StandardSphereGrid`**.
-   `value`: El texto o número principal a mostrar.
-   `icon` / `emoticon`: El elemento gráfico a mostrar. Son mutuamente excluyentes.
-   `onlyIcon` / `onlyEmoticon`: Fuerza a que solo se muestre el elemento gráfico, sin el `value`.
-   `statusBadge`: Un objeto con la información para renderizar un `StandardBadge`.
-   `colorScheme`: La paleta de colores a utilizar (ej. `primary`, `danger`).
-   `styleType`: La variante de estilo (`filled`, `subtle`, `outline`).
-   `tooltip`: Texto a mostrar en un tooltip al hacer hover.

### `StandardSphereGrid`

Es el cerebro del ecosistema. Organiza un array de datos (`items`) en una cuadrícula de esferas.

**Responsabilidades Clave:**

-   **Cálculo de Layout**: Es su función más importante. Basado en las dimensiones del contenedor (`containerWidth`, `containerHeight`) y el número de ítems, calcula el diámetro óptimo (`sizeInPx`) para cada esfera.
-   **Modos de Layout**:
    1.  **Automático (por defecto)**: Ajusta el tamaño de las esferas para que todos los ítems quepan en el contenedor sin scroll (`overflow: 'shrink'`). Es ideal para dashboards donde se quiere una vista completa.
    2.  **Tamaño Fijo (`fixedSize`)**: Forza a que todas las esferas tengan un diámetro específico. Si no caben, el contenedor se vuelve scrollable (`overflow: 'scroll'`).
-   **Gestión de Badges**: Detecta si algún ítem requiere un badge. Si es así, calcula el layout usando celdas rectangulares (más altas que anchas) para dejar espacio. Si el tamaño calculado es demasiado pequeño para que el badge sea legible, deshabilita su renderizado (`allowBadgeRender={false}`).
-   **Manipulación de Datos**: Ofrece funcionalidades para ordenar (`sortBy`, `sortDirection`), agrupar (`groupByKeyGroup`) y filtrar (`keyGroupVisibility`) los datos antes de renderizarlos.
-   **Mapeo de Datos**: Transforma un array de datos de la aplicación (prop `items`) en instancias de `StandardSphere`, asignando las props correspondientes.

**Props Esenciales:**

-   `containerWidth`, `containerHeight`: Las dimensiones del elemento padre, necesarias para el cálculo.
-   `items`: Un array de objetos `SphereItemData`, que define qué se va a renderizar.
-   `fixedSize`: Prop opcional para activar el modo de tamaño fijo.
-   `forceBadge`: Booleano que fuerza al calculador a usar un tamaño mínimo que garantice la visibilidad del badge.
-   `sortBy`, `sortDirection`, `groupByKeyGroup`, `keyGroupVisibility`: Props para controlar la presentación de los datos.

---

## 3. La Interacción Clave: La Danza entre Grid y Esfera

El flujo de comunicación es unidireccional y es el corazón del sistema:

1.  **El Contenedor Padre**: Una página o componente mide su propio tamaño (usualmente con un `ResizeObserver`) y pasa `width` y `height` al `StandardSphereGrid`.
2.  **`StandardSphereGrid` Calcula**: Recibe las dimensiones y el array de `items`. Ejecuta su función `calculateLayout` para determinar el `size` (diámetro), `cols` (número de columnas), `cellHeight` (altura de la celda) y `overflow` (si se necesita scroll).
3.  **`StandardSphereGrid` Decide sobre Badges**: Basado en el tamaño calculado y si los `items` tienen `statusBadge`, decide si los badges pueden ser renderizados (`allowBadgeRender`).
4.  **`StandardSphereGrid` Renderiza Hijos**: Itera sobre los `items` y por cada uno, renderiza un `StandardSphere`, pasándole las props calculadas: `sizeInPx`, `cellHeight`, `allowBadgeRender`, junto con los datos del ítem (`value`, `icon`, etc.).
5.  **`StandardSphere` se Adapta**: Cada esfera recibe `sizeInPx` y lo usa en su hook `useSphereConsciousness` para tomar decisiones finales sobre el tamaño de su contenido interno (ej. `StandardText` será `text-lg`, `StandardIcon` será `size-base`, etc.).

Este flujo asegura que el Grid maneja la macro-estructura, mientras que cada Esfera se auto-gestiona a nivel micro, resultando en un sistema altamente cohesivo y adaptable.

---

## 4. Potencial y Flexibilidad (Casos de Uso)

La combinación de estos componentes abre un abanico de posibilidades:

-   **Dashboards de Estado**: Como se ve en `ProjectBatchesDisplay`, es perfecto para visualizar el estado de múltiples entidades (proyectos, tareas, lotes). El estado (`pending`, `completed`) se mapea directamente a un `colorScheme` y a un `emoticon`, proporcionando una retroalimentación visual inmediata.

-   **Exploración de Datos Interactiva**: El `Showroom` es el mejor ejemplo. Se puede usar para crear herramientas de análisis donde el usuario final puede:
    -   Ajustar la densidad de datos (cambiando el número de esferas).
    -   Cambiar entre una vista general (layout automático) y una vista detallada (layout de tamaño fijo).
    -   Reordenar y filtrar los datos en tiempo real para encontrar patrones.
    -   Alternar la información mostrada (ej. mostrar solo iconos, mostrar/ocultar badges).

-   **Selección de Múltiples Elementos**: Se puede extender fácilmente para funcionar como un selector de ítems. La prop `onClick` puede usarse para gestionar un estado de selección, y el `styleType` o `colorScheme` de la esfera puede cambiar para reflejar si está seleccionada.

## 5. Guía de Implementación Rápida

Para usar `StandardSphereGrid` eficazmente, sigue este patrón:

1.  **Prepara tus datos**: Transforma tu array de datos de la aplicación en un array que cumpla la interfaz `SphereItemData[]`.

2.  **Crea un Contenedor con `useRef`**: El Grid necesita un contenedor padre del cual medir sus dimensiones.

3.  **Usa `ResizeObserver`**: Para hacer el layout responsivo, observa el tamaño del contenedor y actualiza un estado con sus dimensiones (`width`, `height`).

4.  **Renderiza el Grid**: Pasa las dimensiones del estado y tus datos al `StandardSphereGrid`.

```tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StandardSphereGrid, type SphereItemData } from '@/components/ui/StandardSphereGrid';

// 1. Prepara tus datos
const myData = [
  { id: '1', name: 'Tarea A', status: 'completed' },
  { id: '2', name: 'Tarea B', status: 'pending' },
  // ...más datos
];

export default function MyComponent() {
  // 2. Crea una referencia para el contenedor
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // 3. Estado para las dimensiones y ResizeObserver
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = gridContainerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sphereData: SphereItemData[] = useMemo(() => {
    return myData.map(item => ({
      id: item.id,
      value: item.name,
      keyGroup: item.status,
      colorScheme: item.status === 'completed' ? 'success' : 'neutral',
      emoticon: item.status === 'completed' ? '✅' : '🕘',
      tooltip: `Estado: ${item.status}`,
      onClick: (id) => console.log(`Clicked ${id}`),
    }));
  }, [myData]);

  return (
    // El contenedor debe tener una altura definida para que el cálculo funcione
    <div ref={gridContainerRef} className="w-full h-[500px]">
      {/* 4. Renderiza el Grid */}
      <StandardSphereGrid
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
        items={sphereData}
        isLoading={containerSize.width === 0} // Muestra un loader mientras se mide por primera vez
      />
    </div>
  );
}
```
