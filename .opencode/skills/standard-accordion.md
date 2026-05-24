# Skill: StandardAccordion

## Qué es

Acordeón accesible basado en Radix UI Accordion con tokens de diseño precalculados. Soporta modo single (un ítem abierto) y multiple (varios abiertos), colorSchemes, tamaños y estilos. Compuesto por `StandardAccordion`, `StandardAccordionItem`, `StandardAccordionTrigger` y `StandardAccordionContent`.

## Import

```tsx
import {
  StandardAccordion,
  StandardAccordionItem,
  StandardAccordionTrigger,
  StandardAccordionContent,
} from "@/components/ui/StandardAccordion"
```

## Props disponibles

### StandardAccordion (raíz)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `type` | `"single" \| "multiple"` | — | Modo de apertura (Radix) |
| `colorScheme` | `ColorSchemeVariant` | `"neutral"` | Esquema de color |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `styleType` | `"subtle" \| "solid"` | `"subtle"` | Variante de estilo |
| `defaultValue` | `string \| string[]` | — | Item(s) abierto(s) por defecto |
| `value` | `string \| string[]` | — | Item(s) abierto(s) controlado |
| `onValueChange` | `(value) => void` | — | Callback al abrir/cerrar items |
| `className` | `string` | — | Clases adicionales |

Todas las props de `AccordionPrimitive.Root` (Radix) también disponibles.

### StandardAccordionItem

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` (requerido) | — | Identificador único del item |
| `disabled` | `boolean` | — | Deshabilita el item |
| `colorScheme` | `ColorSchemeVariant` | — | ColorScheme específico del item |
| `styleType` | `"subtle" \| "solid"` | — | StyleType específico del item |
| `className` | `string` | — | Clases adicionales |

### StandardAccordionTrigger

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | — | Clases adicionales |
| `children` | `ReactNode` | — | Contenido del trigger |

### StandardAccordionContent

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | — | Clases adicionales |
| `children` | `ReactNode` | — | Contenido expandible |

## Uso correcto

```tsx
// ✅ Modo single (un item abierto a la vez)
<StandardAccordion
  type="single"
  defaultValue="item-1"
  colorScheme="primary"
  size="md"
  styleType="subtle"
>
  <StandardAccordionItem value="item-1">
    <StandardAccordionTrigger>¿Es accesible?</StandardAccordionTrigger>
    <StandardAccordionContent>
      Sí. Cumple con los estándares WAI-ARIA.
    </StandardAccordionContent>
  </StandardAccordionItem>

  <StandardAccordionItem value="item-2">
    <StandardAccordionTrigger>¿Se puede estilizar?</StandardAccordionTrigger>
    <StandardAccordionContent>
      Usa un sistema de tokens para personalización completa.
    </StandardAccordionContent>
  </StandardAccordionItem>

  <StandardAccordionItem value="item-3" disabled>
    <StandardAccordionTrigger>Deshabilitado</StandardAccordionTrigger>
    <StandardAccordionContent>No se puede abrir.</StandardAccordionContent>
  </StandardAccordionItem>
</StandardAccordion>

// ✅ Modo multiple
<StandardAccordion
  type="multiple"
  defaultValue={["item-1", "item-2"]}
  colorScheme="accent"
>
  ...
</StandardAccordion>

// ✅ Item con colorScheme específico
<StandardAccordionItem value="important" colorScheme="warning" styleType="solid">
  <StandardAccordionTrigger>Importante</StandardAccordionTrigger>
  <StandardAccordionContent>Contenido destacado</StandardAccordionContent>
</StandardAccordionItem>

// ✅ Controlado
const [value, setValue] = useState<string | undefined>("item-1")
<StandardAccordion type="single" value={value} onValueChange={setValue}>
  ...
</StandardAccordion>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No aplicar colores con Tailwind encima
<StandardAccordion className="bg-red-500" />

// ❌ No olvidar `type="single"` o `type="multiple"` (requerido por Radix)
<StandardAccordion> // ❌ falta type
```

## Cuándo NO usar este componente

- Para FAQs simples con una sola pregunta por sección: el acordeón puede ser excesivo.
- Para navegación jerárquica: usa un menú con links.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardAccordion necesita styleType "bordered"`
