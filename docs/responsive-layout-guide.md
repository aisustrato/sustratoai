# Guía de Layout Responsive y Cálculo de Ancho de Contenedor

**Autor:** Cascade AI
**Fecha:** 13 de Julio de 2025

## 1. Propósito

Este documento sirve como guía de referencia para desarrolladores (humanos y IA) sobre la arquitectura de layout responsive de la aplicación. Explica cómo se solucionaron los problemas de desbordamiento horizontal y cómo calcular de forma precisa el ancho disponible para componentes dinámicos como `StandardSphereGrid`.

Seguir esta guía es fundamental para mantener la consistencia visual y la robustez del layout al crear nuevas páginas o layouts.

---

## 2. El Problema Original: Desfase y Desbordamiento

Se identificaron dos problemas críticos que afectaban la experiencia de usuario en diferentes tamaños de pantalla:

1.  **Desfase en Componentes de Grid (`StandardSphereGrid`):** Componentes que calculaban su propio ancho basado en el tamaño de su contenedor padre sufrían de un "efecto escalón" o un renderizado incorrecto. El cálculo no consideraba elementos externos como el `sidebar`, los `gaps` del layout o los `paddings` globales, resultando en un ancho incorrecto y, a menudo, en un desbordamiento horizontal.

2.  **Desbordamiento de la `StandardNavbar`:** Al reducir el ancho de la ventana, los ítems del menú de navegación no se adaptaban, empujando a los controles de la derecha (avatar, selector de tema) fuera de la pantalla y causando una barra de scroll horizontal en toda la página.

## 3. La Solución Arquitectónica: `LayoutContext`

Para resolver estos problemas de forma centralizada y reutilizable, se implementó un **Contexto de React** (`LayoutContext`) que actúa como la **única fuente de verdad** para las métricas del layout.

**Ubicación:** `app/contexts/layout-context.tsx`

### 3.1. ¿Qué provee el `LayoutContext`?

El hook `useLayout()` expone los siguientes valores, que son cruciales para cualquier cálculo de layout:

-   `sidebarWidth` (number): El ancho actual del sidebar (ej. `288px` expandido, `88px` colapsado).
-   `isSidebarCollapsed` (boolean): El estado del sidebar.
-   `layoutGap` (number): El espacio (`gap`) definido en el layout principal que separa el sidebar del contenido (ej. `24px` o `40px`).
-   `globalXPadding` (number): El padding horizontal global (`px-`) que aplica la `Navbar` y que afecta al ancho total disponible.

### 3.2. ¿Cómo se provee el Contexto?

Los layouts principales que contienen un sidebar (ej. `app/articulos/layout.tsx` y `app/datos-maestros/layout.tsx`) son los responsables de gestionar el estado y proveer el contexto a sus hijos a través del `LayoutProvider`.

Estos layouts utilizan el hook `useWindowSize` para detectar cambios en el tamaño de la ventana y recalcular dinámicamente `layoutGap` y `globalXPadding` para que coincidan con las clases de Tailwind CSS (`md:`, `lg:`, etc.).

---

## 4. Guía Práctica: Implementación en Páginas

### 4.1. Cómo Calcular el Ancho Disponible para un Componente

Para cualquier componente que necesite conocer el ancho real disponible en el contenedor de contenido (como `StandardSphereGrid`), sigue estos pasos:

1.  **Asegúrate de que la página esté dentro de un `LayoutProvider`:** Esto es automático si la página está en una ruta anidada bajo un layout que ya lo usa (como `articulos` o `datos-maestros`).

2.  **Importa los hooks necesarios:** Necesitarás `useLayout` y `useWindowSize`.

    ```tsx
    import { useLayout } from "@/app/contexts/layout-context";
    import { useWindowSize } from "@/hooks/use-window-size";
    ```

3.  **Obtén los valores del contexto y el ancho de la ventana:**

    ```tsx
    const { width: windowWidth } = useWindowSize();
    const { sidebarWidth, layoutGap, globalXPadding } = useLayout();
    ```

4.  **Calcula el `containerWidth` con la fórmula canónica:**

    Esta es la fórmula correcta y debe usarse siempre. Resta todos los elementos que ocupan espacio horizontal fuera del área de contenido principal.

    ```tsx
    const containerWidth = windowWidth - sidebarWidth - layoutGap - globalXPadding * 2; // * 2 porque el padding se aplica a ambos lados
    ```

5.  **Pasa el `containerWidth` a tu componente:**

    ```tsx
    <StandardSphereGrid containerWidth={containerWidth} ... />
    ```

### 4.2. Cómo Crear un Nuevo Layout con Sidebar

Si necesitas crear un nuevo layout principal con su propio sidebar, sigue el patrón establecido en `app/articulos/layout.tsx`:

### 4.3. Patrón Adicional: `useIntersectionObserver` para Visibilidad

En la página `app/articulos/preclasificacion/page.tsx`, se utilizó el hook `useIntersectionObserver` para un caso de uso específico: mostrar un `StandardAlert` solo cuando el usuario ha hecho scroll y un elemento de referencia (un `div` vacío al final de la lista de esferas) entra en la vista.

Este patrón es útil para interacciones que dependen de la posición del scroll del usuario.

**Ejemplo de implementación:**

1.  **Crea una referencia** al elemento que quieres observar.
    ```tsx
    const observerRef = useRef<HTMLDivElement>(null);
    ```

2.  **Usa el hook `useIntersectionObserver`** y obtén la entrada (entry).
    ```tsx
    const entry = useIntersectionObserver(observerRef, { freezeOnceVisible: false });
    const isVisible = !!entry?.isIntersecting;
    ```

3.  **Renderiza condicionalmente** tu componente basado en `isVisible`.
    ```tsx
    {isVisible && (
        <StandardAlert ... />
    )}
    <div ref={observerRef} /> // Elemento invisible que actúa como disparador
    ```

1.  Define el estado para el sidebar (`isCollapsed`, `isHovered`).
2.  Usa `useWindowSize` para obtener el ancho de la ventana.
3.  Calcula dinámicamente `sidebarWidth`, `layoutGap` y `globalXPadding` basándote en los breakpoints de Tailwind.
4.  Envuelve el `{children}` del layout con el `LayoutProvider`, pasándole todos los valores calculados.

---

## 5. Solución de la `StandardNavbar`

Para resolver el desbordamiento, se aplicó una solución `flexbox` robusta en `components/ui/StandardNavbar.tsx`:

-   El contenedor de los links de navegación se configuró con `flex-1 min-w-0`. Esto le permite ocupar el espacio disponible (`flex-grow: 1`) y encogerse si es necesario (`min-w-0`) sin empujar a otros elementos.
-   Dentro de este, un segundo `div` con `flex-wrap` y `gap` se encarga de que los propios links salten a una nueva línea de forma ordenada cuando el espacio es insuficiente.

**Nota:** Aunque esto evita el desbordamiento, ha creado un estado visual no deseado antes de activar el menú móvil. Esto se abordará en una futura refactorización para activar el menú móvil en un breakpoint más ancho.
