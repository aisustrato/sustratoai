# Skill: StandardTabs

## Qué es

Sistema de tabs basado en Radix UI Tabs con tokens de diseño precalculados. Compuesto por `StandardTabs` (raíz), `StandardTabsList`, `StandardTabsTrigger` y requiere `TabsContent` de Radix para el contenido de cada panel.

## Import

```tsx
import {
  StandardTabs,
  StandardTabsList,
  StandardTabsTrigger,
} from "@/components/ui/StandardTabs"
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs"
```

## Props disponibles

### StandardTabs (raíz)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `styleType` | `"line" \| "enclosed"` | `"line"` | Estilo visual de los tabs |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `defaultValue` | `string` | — | Tab activo por defecto |
| `value` | `string` | — | Tab activo controlado |
| `onValueChange` | `(value: string) => void` | — | Callback al cambiar tab |
| `className` | `string` | — | Clases adicionales |

### StandardTabsList

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | — | Clases adicionales (útil para grid) |

### StandardTabsTrigger

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` (requerido) | — | Valor que identifica el tab |
| `disabled` | `boolean` | — | Deshabilita el trigger |
| `className` | `string` | — | Clases adicionales |

### StandardTabsContent (de Radix)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` (requerido) | — | Valor del tab correspondiente |
| `forceMount` | `boolean` | — | Mantiene montado aunque no activo |
| `asChild` | `boolean` | — | Usa un hijo como contenedor |

## Uso correcto

```tsx
// ✅ Básico
<StandardTabs defaultValue="tab1" colorScheme="primary" styleType="line">
  <StandardTabsList>
    <StandardTabsTrigger value="tab1">Perfil</StandardTabsTrigger>
    <StandardTabsTrigger value="tab2">Dashboard</StandardTabsTrigger>
    <StandardTabsTrigger value="tab3" disabled>Settings</StandardTabsTrigger>
  </StandardTabsList>
  <StandardTabsContent value="tab1" className="p-4">
    Contenido del tab Perfil
  </StandardTabsContent>
  <StandardTabsContent value="tab2" className="p-4">
    Contenido del tab Dashboard
  </StandardTabsContent>
</StandardTabs>

// ✅ Con grid en la lista
<StandardTabsList className="grid w-full grid-cols-4 mb-8">
  <StandardTabsTrigger value="tab1">Uno</StandardTabsTrigger>
  <StandardTabsTrigger value="tab2">Dos</StandardTabsTrigger>
  <StandardTabsTrigger value="tab3">Tres</StandardTabsTrigger>
  <StandardTabsTrigger value="tab4">Cuatro</StandardTabsTrigger>
</StandardTabsList>

// ✅ Con animaciones (Framer Motion + AnimatePresence)
<StandardTabs defaultValue="tab1" onValueChange={setActiveTab}>
  <StandardTabsList>...</StandardTabsList>
  <AnimatePresence mode="wait">
    {activeTab === "tab1" && (
      <StandardTabsContent value="tab1" asChild>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          Contenido animado
        </motion.section>
      </StandardTabsContent>
    )}
  </AnimatePresence>
</StandardTabs>

// ✅ Estilo enclosed
<StandardTabs defaultValue="tab1" styleType="enclosed" colorScheme="secondary">
  <StandardTabsList>
    <StandardTabsTrigger value="tab1">Tab 1</StandardTabsTrigger>
    <StandardTabsTrigger value="tab2">Tab 2</StandardTabsTrigger>
  </StandardTabsList>
  ...
</StandardTabs>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No importar TabsContent de Radix incorrectamente
import { TabsContent } from "@/components/ui/StandardTabs" // ❌ no existe

// ✅ Correcto
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs"

// ❌ No olvidar forceMount si usas renderizado condicional con AnimatePresence
<StandardTabsContent value="tab1"> // ❌ Sin forceMount, AnimatePresence no funciona
```

## Cuándo NO usar este componente

- Para navegación entre páginas: usa un router/link, no tabs.
- Para steps de un wizard: usa `StandardStepper`.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardTabs necesita styleType "pills"`
