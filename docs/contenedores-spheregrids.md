# Guía para Contenedores de StandardSphereGrid

Esta guía documenta el patrón de diseño y las mejores prácticas para implementar `StandardSphereGrid` y sus componentes contenedores (como `BatchVisualization`) de manera que se adapten correctamente al layout responsivo de la aplicación, evitando problemas comunes como el desbordamiento horizontal (scroll).

## El Problema: El Cálculo del Ancho Disponible

El `StandardSphereGrid` necesita saber el ancho y alto exactos de su contenedor para distribuir las esferas correctamente. Un cálculo incorrecto resulta en un grid que es o muy pequeño (desperdiciando espacio) o muy grande (causando un scroll horizontal no deseado).

Existen dos escenarios principales que debemos manejar.

## Escenario 1: Layout de Página Completa

Este es el caso más simple, donde el grid ocupa el área principal de contenido de una página que está directamente afectada por el layout global (sidebar, paddings, etc.).

**Solución:** Usar el `LayoutContext`.

Nuestro `LayoutContext` centralizado provee todas las métricas necesarias para calcular el ancho disponible. El componente `BatchVisualization` fue diseñado para encapsular esta lógica.

1.  **Hooks:** Se utilizan `useWindowSize` y `useLayout`.
2.  **Fórmula Canónica:** El ancho se calcula con la siguiente fórmula:
    ```jsx
    anchoContenedor = anchoVentana - anchoSidebar - gapDelLayout - (paddingHorizontalGlobal * 2)
    ```

### Ejemplo de Implementación (`BatchVisualization.tsx`)

```tsx
//... imports

const { width: windowWidth } = useWindowSize();
const { sidebarWidth, layoutGap, globalXPadding } = useLayout();

const calculatedWidth = useMemo(() => {
  // Si se pasa un ancho como prop, se prioriza (ver Escenario 2).
  if (widthProp) return widthProp;
  if (!windowWidth) return 0;
  // Aplicamos la fórmula canónica.
  return windowWidth - sidebarWidth - layoutGap - (globalXPadding * 2);
}, [windowWidth, sidebarWidth, layoutGap, globalXPadding, widthProp]);
```

## Escenario 2: Anidado en Contenedores con Padding (ej. `StandardCard`)

Este es el caso más común y complicado. Si colocamos nuestro grid dentro de un componente como `<StandardCard.Content>`, este añade su propio padding (`p-4 md:p-6`). Nuestro `LayoutContext` no puede saber sobre este padding interno, por lo que el cálculo del Escenario 1 resultará en un ancho mayor al real, causando overflow.

**Solución:** Medir el contenedor padre directo con un `ResizeObserver`.

1.  **Hooks:** En el componente padre (`ProjectBatchesDisplay.tsx`), usamos `useRef`, `useState` y `useEffect`.
2.  **Referencia:** Se asigna un `ref` al elemento contenedor (`<StandardCard.Content ref={gridContainerRef}>`).
3.  **Observador:** Un `ResizeObserver` vigila este `ref`. Cuando el tamaño del contenedor cambia, actualiza un estado (`containerSize`) con el ancho y alto *reales*.
4.  **Pasar Props:** Estas dimensiones medidas se pasan como props (`containerWidth` y `containerHeight`) a nuestro componente de visualización (`<BatchVisualization />`).

### Ejemplo de Implementación (`ProjectBatchesDisplay.tsx`)

```tsx
// 1. Hooks para medir
const gridContainerRef = useRef<HTMLDivElement>(null);
const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

useEffect(() => {
  const element = gridContainerRef.current;
  if (!element) return;

  const observer = new ResizeObserver((entries) => {
    if (entries[0]) {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    }
  });

  observer.observe(element);
  return () => observer.disconnect();
}, []);

// 2. JSX con el ref y pasando las props
<StandardCard.Content
  ref={gridContainerRef} // Asignamos el ref aquí
  className="p-4 md:p-6 relative h-[50vh] min-h-[400px]">
  <BatchVisualization
    items={sphereData}
    isLoading={containerSize.width === 0}
    containerWidth={containerSize.width}   // Pasamos el ancho medido
    containerHeight={containerSize.height} // Pasamos el alto medido
  />
</StandardCard.Content>
```

## Conclusión y Mejor Práctica

-   **Crea componentes de visualización reutilizables** (como `BatchVisualization`) que puedan manejar ambos escenarios.
-   **Por defecto, calcula el ancho usando el `LayoutContext`** para el caso de página completa.
-   **SIEMPRE que anides un grid dentro de un contenedor con padding, mide el contenedor padre directo usando `ResizeObserver`** y pasa las dimensiones como props para anular el cálculo por defecto.

Seguir este patrón asegura que los `StandardSphereGrid` sean siempre responsivos, precisos y libres de errores de layout.
