# StandardTabs: Guía de Referencia Rápida

`StandardTabs` es un sistema de componentes para organizar contenido en diferentes vistas que el usuario puede intercambiar. Está construido sobre Radix UI para garantizar la accesibilidad y utiliza una API de composición flexible.

---

### 1. Estructura y Composición
Para crear un conjunto de pestañas, debes combinar los tres componentes principales: `StandardTabs`, `StandardTabsList`, y `StandardTabsTrigger`, junto con `TabsContent` de Radix UI.

```tsx
import {
  StandardTabs,
  StandardTabsList,
  StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent } from "@radix-ui/react-tabs";

<StandardTabs defaultValue="perfil">
  {/* 1. La lista que contiene los disparadores de pestañas */}
  <StandardTabsList>
    <StandardTabsTrigger value="perfil">Perfil</StandardTabsTrigger>
    <StandardTabsTrigger value="cuenta">Cuenta</StandardTabsTrigger>
    <StandardTabsTrigger value="notificaciones">Notificaciones</StandardTabsTrigger>
  </StandardTabsList>

  {/* 2. El contenido asociado a cada pestaña */}
  <TabsContent value="perfil">
    <p>Contenido de la pestaña de Perfil.</p>
  </TabsContent>
  <TabsContent value="cuenta">
    <p>Contenido de la pestaña de Cuenta.</p>
  </TabsContent>
  <TabsContent value="notificaciones">
    <p>Contenido de la pestaña de Notificaciones.</p>
  </TabsContent>
</StandardTabs>
```

### 2. Personalización Visual
La personalización se aplica al componente contenedor `StandardTabs` y se propaga a los hijos a través de un contexto.

#### Estilo (`styleType`)
Define la apariencia general de las pestañas.
-   `'line'` (defecto): Muestra un borde inferior en la pestaña activa.
-   `'enclosed'`: La pestaña activa tiene un fondo que la resalta, como un botón.

```tsx
<StandardTabs defaultValue="perfil" styleType="enclosed">
  {/* ...pestañas... */}
</StandardTabs>
```

#### Esquema de Color (`colorScheme`)
Define el color del indicador de la pestaña activa (el borde inferior en `line` o el color de texto/borde en `enclosed`).

```tsx
<StandardTabs defaultValue="perfil" colorScheme="accent">
  {/* ...pestañas... */}
</StandardTabs>
```

#### Tamaño (`size`)
Controla el tamaño del texto y el espaciado de las pestañas. Opciones: `'sm'`, `'md'` (defecto), `'lg'`.

```tsx
<StandardTabs defaultValue="perfil" size="lg">
  {/* ...pestañas... */}
</StandardTabs>
```

### 3. Estado Deshabilitado
Cualquier `StandardTabsTrigger` puede ser deshabilitado individualmente con la prop `disabled`.

```tsx
<StandardTabsList>
  <StandardTabsTrigger value="perfil">Perfil</StandardTabsTrigger>
  <StandardTabsTrigger value="analiticas" disabled>
    Analíticas (Próximamente)
  </StandardTabsTrigger>
</StandardTabsList>
```
