# StandardSelect v4.3

> 🌸 Selector con soberanía de animación - Patrón Flex

## Ubicación

```
components/ui/StandardSelect.tsx
```

## Propósito

Selector desplegable que consume tokens precalculados del `DesignTokensProvider`. Soporta selección simple y múltiple, con efectos SUSTRATO (`pulseBorder`, `pafffMoment`).

---

## Props Principales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | `[]` | Opciones disponibles |
| `colorScheme` | `ColorSchemeVariant` | `"default"` | Esquema de color |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño del select |
| `multiple` | `boolean` | `false` | Selección múltiple |
| `clearable` | `boolean` | `false` | Mostrar botón limpiar |
| `placeholder` | `string` | `"Seleccione..."` | Texto placeholder |
| `leadingIcon` | `LucideIcon` | - | Icono al inicio |
| `error` | `string` | - | Mensaje de error |
| `success` | `boolean` | `false` | Estado de éxito |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `readOnly` | `boolean` | `false` | Solo lectura |
| `isEditing` | `boolean` | `false` | Modo edición |
| `pulseBorder` | `boolean` | `false` | 🌊 Efecto respiración |
| `pafffMoment` | `boolean` | `false` | 🪩 Efecto coherencia |

---

## SelectOption

```tsx
interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  disabled?: boolean;
}
```

---

## Uso Básico

```tsx
import { StandardSelect } from "@/components/ui/StandardSelect";

const options = [
  { value: "bug", label: "🐛 Bug Report" },
  { value: "feature", label: "✨ Feature Request" },
];

<StandardSelect
  options={options}
  colorScheme="primary"
  placeholder="Selecciona categoría"
  onChange={(value) => console.log(value)}
/>
```

---

## Efectos SUSTRATO

### 🌊 pulseBorder
Respiración sutil del borde. Se desactiva en `:focus`.

```tsx
<StandardSelect pulseBorder options={options} />
```

### 🪩 pafffMoment
Borde pulsante para momentos de coherencia. **Sigue activo en focus**.

```tsx
<StandardSelect pafffMoment options={options} />
```

---

## Selección Múltiple

```tsx
<StandardSelect
  multiple
  clearable
  options={options}
  onChange={(values) => console.log(values)} // string[]
/>
```

---

## Con Iconos

```tsx
import { Bug, Sparkles, HelpCircle } from "lucide-react";

const options = [
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature", icon: Sparkles },
  { value: "question", label: "Question", icon: HelpCircle },
];

<StandardSelect options={options} leadingIcon={Tag} />
```

---

## Estados

```tsx
// Error
<StandardSelect error="Campo requerido" options={options} />

// Success
<StandardSelect success options={options} />

// Disabled
<StandardSelect disabled options={options} />

// ReadOnly
<StandardSelect readOnly value="bug" options={options} />
```

---

## Arquitectura Interna

### Tokens desde DesignTokensProvider

```tsx
const { select } = useDesignTokens();
const sizeTokens = select.sizes[size];
const styleTokens = select.styles[effectiveColorScheme];
```

### CSS Dinámico (Patrón Flex)

El componente inyecta un `<style>` tag con ID único para:
- Variables CSS de colores
- Keyframes de animaciones
- Estados hover/focus/error/success

### Portal para Dropdown

El dropdown se renderiza en un portal para evitar problemas de z-index y overflow.

---

## Showroom

```
/showroom/standard-select
/showroom/form  ← Con los 4 componentes
```

---

📍 `docs/standard-UI/StandardSelect.md`  
🎯 v4.3 - Patrón Flex + Efectos SUSTRATO  
🌊🏄🏽 SUSTRATO.AI
