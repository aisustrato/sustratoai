# StandardTextarea v4.3 - Soberanía de Animación

> 🌸 Tercera flor del jardín de componentes SUSTRATO.AI
> 🪩 Con efectos SUSTRATO: pulseBorder y pafffMoment

## Filosofía

El textarea estándar implementa el **Patrón Flex** de soberanía de animación con validación visual en tiempo real, diseñado para integrarse perfectamente con Zod y react-hook-form.

```
┌─────────────────────────────────────────────────────────┐
│  INLINE STYLES                    CSS DINÁMICO          │
│  ✅ Dimensiones (minHeight)       ✅ :hover             │
│  ✅ Tipografía (fontSize)         ✅ :focus             │
│  ✅ Espaciado (padding)           ✅ :disabled          │
│                                   ✅ error/success      │
│                                   ✅ pulseBorder        │
│                                   ✅ pafffMoment        │
└─────────────────────────────────────────────────────────┘
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `'default' \| 'primary' \| ...` | `'default'` | Esquema de color |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del textarea |
| `error` | `string` | - | Mensaje de error (activa estado visual error) |
| `success` | `boolean` | `false` | Estado visual de éxito |
| `isEditing` | `boolean` | `false` | Estado visual de edición |
| `disabled` | `boolean` | `false` | Deshabilita el textarea |
| `readOnly` | `boolean` | `false` | Solo lectura |
| `showCharacterCount` | `boolean` | `false` | Muestra contador de caracteres |
| `maxLength` | `number` | - | Longitud máxima (requerido para contador) |
| `rows` | `number` | `3` | Número de filas visibles |
| `isRequired` | `boolean` | `false` | Marca como requerido (aria) |
| `pulseBorder` | `boolean` | `false` | 🌊 Efecto de respiración sutil del borde |
| `pafffMoment` | `boolean` | `false` | 🪩 Borde destacado para insight/coherencia |

## Ejemplos de Uso

### Básico
```tsx
<StandardTextarea placeholder="Escribe aquí..." />
```

### Con contador de caracteres
```tsx
<StandardTextarea
  placeholder="Máximo 200 caracteres"
  showCharacterCount
  maxLength={200}
/>
```

### Estados de validación
```tsx
// Error
<StandardTextarea error="Este campo es requerido" />

// Success
<StandardTextarea success value="Contenido válido" />
```

### 🌊 Pulse Border (respiración sutil)
```tsx
<StandardTextarea 
  placeholder="Esperando input..."
  pulseBorder
/>
```

### 🪩 Pafff Moment (momento de coherencia)
```tsx
<StandardTextarea 
  value="Definición coherente alcanzada"
  pafffMoment
/>
```

> **Nota:** 
> - `pulseBorder` se desactiva en `:focus` (es para campos en espera)
> - `pafffMoment` **SIGUE animándose en focus** (es el momento de coherencia mientras escribes)
> - Ambos se desactivan con `error` o `success`

## Integración con react-hook-form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(10, "Mínimo 10 caracteres"),
});

function MyForm() {
  const { register, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  return (
    <StandardTextarea
      {...register("description")}
      error={errors.description?.message}
      placeholder="Describe tu idea..."
      showCharacterCount
      maxLength={500}
    />
  );
}
```

## Arquitectura Técnica

### Tokens Precalculados
```tsx
const { tokens } = useDesignTokens();
const sizeTokens = tokens?.textarea.sizes[size];
const styleTokens = tokens?.textarea.styles[colorScheme];
```

### CSS Dinámico Inyectado
El componente inyecta un `<style>` en el head con ID único para evitar conflictos:
```tsx
styleElement.setAttribute("data-textarea-id", textareaId);
```

## Showroom

Prueba interactiva disponible en:
```
/showroom/standard-textarea
```

## Changelog

| Versión | Cambios |
|---------|---------|
| v4.3 | 🪩 Migración a DesignTokensProvider + efectos SUSTRATO |
| v3.x | CSS variables en elemento (deprecado) |

---

📍 `components/ui/StandardTextarea.tsx`  
🎯 Ontología Visual SUSTRATO.AI  
🌸 Humanismo en co-evolución AI
