# `StandardAccordion`

`StandardAccordion` es un componente de UI que permite mostrar y ocultar secciones de contenido de manera vertical. Está construido sobre Radix UI para garantizar la accesibilidad y sigue la filosofía del ecosistema "Standard UI", siendo un orquestador inteligente que consume tokens de estilo.

## Filosofía de Diseño

- **Orquestador Inteligente:** El componente `StandardAccordion` (`.tsx`) maneja la lógica, el estado y el comportamiento, pero es agnóstico a los valores de estilo.
- **Consumo de Tokens:** Los estilos se obtienen del sistema de tokens centralizado. El componente recibe `props` como `colorScheme` o `size` y las usa para solicitar los tokens de estilo correspondientes desde `generateStandardAccordionTokens`.
- **Accesibilidad:** Hereda las características de accesibilidad de Radix UI, incluyendo el manejo de teclado `WAI-ARIA`.

---

## Anatomía del Componente

Para usar `StandardAccordion`, necesitas importar y anidar sus cuatro partes:

1.  `StandardAccordion`: El contenedor raíz que gestiona el estado general.
2.  `StandardAccordionItem`: Un contenedor para cada sección individual del acordeón. Debe tener una `prop` `value` única.
3.  `StandardAccordionTrigger`: El botón que el usuario presiona para expandir o contraer un `StandardAccordionItem`.
4.  `StandardAccordionContent`: El panel que contiene el contenido que se muestra u oculta.

---

## Importación

```tsx
import {
  StandardAccordion,
  StandardAccordionItem,
  StandardAccordionTrigger,
  StandardAccordionContent,
} from '@/components/ui/StandardAccordion';
```

---

## Uso

`StandardAccordion` puede ser usado como un componente **controlado** o **no controlado**.

### No Controlado (Simple)

Para casos de uso sencillos, puedes usarlo de forma no controlada especificando un `defaultValue`. El componente gestionará su propio estado internamente.

**Ejemplo (un solo ítem abierto):**
```tsx
<StandardAccordion type="single" collapsible defaultValue="item-1">
  <StandardAccordionItem value="item-1">
    <StandardAccordionTrigger>Trigger 1</StandardAccordionTrigger>
    <StandardAccordionContent>Content 1</StandardAccordionContent>
  </StandardAccordionItem>
  <StandardAccordionItem value="item-2">
    <StandardAccordionTrigger>Trigger 2</StandardAccordionTrigger>
    <StandardAccordionContent>Content 2</StandardAccordionContent>
  </StandardAccordionItem>
</StandardAccordion>
```

**Ejemplo (múltiples ítems abiertos):**
```tsx
<StandardAccordion type="multiple" defaultValue={['item-1', 'item-2']}>
  {/* ... StandardAccordionItems ... */}
</StandardAccordion>
```

### Controlado (Avanzado)

Para un control total sobre los ítems abiertos, puedes usarlo de forma controlada. Esto es útil cuando el estado del acordeón necesita ser manipulado desde un componente padre. Debes proveer las `props` `value` y `onValueChange`.

```tsx
function MyComponent() {
  const [value, setValue] = React.useState<string | undefined>("item-1");

  return (
    <StandardAccordion
      type="single"
      value={value}
      onValueChange={setValue}
      collapsible
    >
      {/* ... StandardAccordionItems ... */}
    </StandardAccordion>
  );
}
```

---

## Props del Componente Raíz (`StandardAccordion`)

| Prop           | Tipo                               | Por Defecto | Descripción                                                                   |
|----------------|------------------------------------|-------------|-------------------------------------------------------------------------------|
| `type`         | `'single'` \| `'multiple'`         | `'single'`  | Determina si se puede abrir un solo ítem o varios simultáneamente.            |
| `value`        | `string` \| `string[]`             | `undefined` | **(Controlado)** El `value` del ítem (o ítems) actualmente abiertos.          |
| `onValueChange`| `(value: string \| string[]) => void` | `undefined` | **(Controlado)** Callback que se ejecuta cuando el valor cambia.              |
| `defaultValue` | `string` \| `string[]`             | `undefined` | **(No Controlado)** El `value` del ítem (o ítems) abiertos por defecto.      |
| `collapsible`  | `boolean`                          | `false`     | Si es `true` en modo `single`, permite cerrar el ítem que está abierto.         |
| `colorScheme`  | `ColorSchemeVariant`               | `'neutral'` | Define la paleta de colores a usar (ej. `primary`, `secondary`, `danger`).      |
| `size`         | `'sm'` \| `'md'` \| `'lg'`           | `'md'`      | Controla el tamaño general del componente (padding, tamaño de fuente).        |

*Nota: Todas las demás `props` de `React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>` son aceptadas.*

---

## Sistema de Tokens (`generateStandardAccordionTokens`)

La apariencia del `StandardAccordion` se controla a través de un generador de tokens. Este sistema asegura que el estilo sea consistente y se adapte al tema global de la aplicación.

### Argumentos del Generador (`StandardAccordionTokenArgs`)

- `colorScheme`: La paleta de colores a aplicar.
- `size`: El tamaño del componente.
- `isHovered`: `boolean` que indica si el cursor está sobre el `trigger`.
- `isOpen`: `boolean` que indica si el `item` está abierto.
- `isDisabled`: `boolean` que indica si el `item` está deshabilitado.

### Tokens Generados (`StandardAccordionTokens`)

El generador produce un objeto con los siguientes estilos:

- `item`: Estilos para el contenedor de cada sección (borde, margen).
- `trigger`: Estilos para el área clickeable (fondo, color, padding, fuente).
- `content`: Estilos para el panel de contenido (fondo, color, padding, opacidad).
- `icon`: Estilos para el ícono de chevron (color, transformación `rotate`).

Este enfoque permite que la lógica del componente (`.tsx`) se mantenga limpia y separada de las definiciones de estilo, que residen en `lib/theme/components/standard-accordion-tokens.ts`.
