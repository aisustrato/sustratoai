# StandardInput v4.3 - Soberanía de Animación

> 🌸 Segunda flor del jardín de componentes SUSTRATO.AI
> 🪩 Con efectos SUSTRATO: pulseBorder y pafffMoment

## Filosofía

El input estándar implementa el **Patrón Flex** de soberanía de animación con validación visual en tiempo real, diseñado para integrarse perfectamente con Zod y react-hook-form.

```
┌─────────────────────────────────────────────────────────┐
│  INLINE STYLES                    CSS DINÁMICO          │
│  ✅ Dimensiones (height)          ✅ :hover             │
│  ✅ Tipografía (fontSize)         ✅ :focus             │
│  ✅ Padding                       ✅ Estados error      │
│  ❌ NO colores                    ✅ Estados success    │
│  ❌ NO box-shadow                 ✅ Disabled/ReadOnly  │
└─────────────────────────────────────────────────────────┘
```

## Importación

```tsx
import { StandardInput } from "@/components/ui/StandardInput";
import type { StandardInputSize, StandardInputVariant } from "@/components/ui/StandardInput";
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorScheme` | `'default' \| 'primary' \| 'secondary' \| 'tertiary' \| 'accent' \| 'neutral'` | `'default'` | Esquema de color |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del input |
| `type` | `string` | `'text'` | Tipo de input (text, password, email, etc.) |
| `leadingIcon` | `ComponentType` | - | Icono al inicio |
| `trailingIcon` | `ComponentType` | - | Icono al final |
| `error` | `string` | - | Mensaje de error (activa estado visual error) |
| `success` | `boolean` | `false` | Estado visual de éxito |
| `isEditing` | `boolean` | `false` | Estado visual de edición |
| `disabled` | `boolean` | `false` | Deshabilita el input |
| `readOnly` | `boolean` | `false` | Solo lectura |
| `showCharacterCount` | `boolean` | `false` | Muestra contador de caracteres |
| `maxLength` | `number` | - | Longitud máxima (requerido para contador) |
| `onClear` | `() => void` | - | Callback para botón de limpiar |
| `isRequired` | `boolean` | `false` | Marca como requerido (aria) |
| `pulseBorder` | `boolean` | `false` | 🌊 Efecto de respiración sutil del borde |
| `pafffMoment` | `boolean` | `false` | 🪩 Borde destacado para insight/coherencia |

## Ejemplos de Uso

### Básico
```tsx
<StandardInput placeholder="Escribe aquí..." />
```

### Con icono
```tsx
import { Mail, Lock, Search, User } from "lucide-react";

<StandardInput leadingIcon={Mail} placeholder="Email" />
<StandardInput leadingIcon={Lock} type="password" placeholder="Contraseña" />
<StandardInput leadingIcon={Search} placeholder="Buscar..." />
```

### Estados de validación (Zod + react-hook-form)
```tsx
// ❌ Error - borde rojo, fondo rojo tenue
<StandardInput 
  error="Este campo es requerido" 
  placeholder="Campo con error" 
/>

// ✅ Success - borde verde, fondo verde tenue
<StandardInput 
  success 
  value="Valor válido" 
  placeholder="Campo válido" 
/>
```

### Con react-hook-form y Zod
```tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(3, "Mínimo 3 caracteres"),
});

function MyForm() {
  const { control, formState: { errors, touchedFields } } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const getSuccessState = (field: string) => 
    !!touchedFields[field] && !errors[field];

  return (
    <Controller
      name="email"
      control={control}
      render={({ field }) => (
        <StandardInput
          {...field}
          placeholder="tu@email.com"
          leadingIcon={Mail}
          error={errors.email?.message}
          success={getSuccessState("email")}
        />
      )}
    />
  );
}
```

### Con contador de caracteres
```tsx
<StandardInput
  showCharacterCount
  maxLength={100}
  placeholder="Máximo 100 caracteres"
/>
```

### Con botón de limpiar
```tsx
const [value, setValue] = useState("");

<StandardInput
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onClear={() => setValue("")}
  placeholder="Escribe y limpia"
/>
```

### 🌊 Pulse Border (respiración sutil)
```tsx
// Efecto de pulso orgánico - ideal para indicar "campo en espera"
<StandardInput 
  placeholder="Esperando input..."
  pulseBorder
/>
```

### 🪩 Pafff Moment (momento de coherencia)
```tsx
// Borde destacado pulsante - cuando hay coherencia/insight
// Caso de uso: El tutor AI detecta alta coherencia en la definición
// "Pafff" es jerga interna del colectivo para momentos eureka 🌟
<StandardInput 
  value="Definición coherente alcanzada"
  pafffMoment
/>
```

> **Nota:** 
> - `pulseBorder` se desactiva en `:focus` (es para campos en espera)
> - `pafffMoment` **SIGUE animándose en focus** (es el momento de coherencia mientras escribes)
> - Ambos se desactivan con `error` o `success`

### Password con toggle de visibilidad
```tsx
<StandardInput 
  type="password" 
  leadingIcon={Lock}
  placeholder="Contraseña segura" 
/>
// El botón de mostrar/ocultar se renderiza automáticamente
```

## Tamaños

| Size | Height | FontSize | Uso recomendado |
|------|--------|----------|-----------------|
| `sm` | 2rem | 0.75rem | Formularios compactos, filtros |
| `md` | 2.5rem | 0.875rem | Uso general (default) |
| `lg` | 3rem | 1rem | CTAs, formularios destacados |

## Estados Visuales

| Estado | Trigger | Efecto visual |
|--------|---------|---------------|
| Normal | - | Borde neutral, fondo claro |
| Hover | `:hover` | Borde más oscuro |
| Focus | `:focus` | Borde primary, ring de 3px |
| Error | `error="..."` | Borde rojo, fondo rojo tenue, ring rojo en focus |
| Success | `success={true}` | Borde verde, fondo verde tenue, ring verde en focus |
| Editing | `isEditing={true}` | Fondo terciario (indicador de modo edición) |
| Disabled | `disabled` | Opacidad 70%, cursor not-allowed |
| ReadOnly | `readOnly` | Fondo gris, cursor default, sin ring en focus |

## Arquitectura Técnica

### 1. Tokens Precalculados
El componente consume tokens del `DesignTokensProvider`:

```tsx
const { tokens } = useDesignTokens();
const sizeTokens = tokens?.input.sizes[size];
const styleTokens = tokens?.input.styles[colorScheme];
```

### 2. CSS Dinámico (Patrón Flex)
Estados y animaciones se manejan via CSS inyectado:

```tsx
useEffect(() => {
  const styleElement = document.createElement("style");
  styleElement.setAttribute("data-input-id", inputId);
  styleElement.textContent = `
    .input-${inputId}:focus {
      border-color: ${styleTokens.focusBorder};
      box-shadow: 0 0 0 3px ${styleTokens.focusRing};
    }
    .input-${inputId}.input-error {
      background-color: ${styleTokens.errorBackground};
      border-color: ${styleTokens.errorBorder};
    }
  `;
  document.head.appendChild(styleElement);
  return () => document.head.removeChild(styleElement);
}, [inputId, styleTokens]);
```

### 3. Separación de Responsabilidades

| Capa | Responsabilidad |
|------|-----------------|
| `sizeStyles` | Dimensiones (inline) |
| `stateClasses` | Estados visuales (CSS classes) |
| CSS inyectado | Colores, hover, focus, animaciones |

## Accesibilidad (ARIA)

- ✅ `aria-invalid` automático cuando `error` está presente
- ✅ `aria-required` configurable via prop
- ✅ `aria-describedby` para mensajes de error externos
- ✅ Labels para botones de password toggle y clear
- ✅ Focus visible con ring de 3px

## i18n

El componente está preparado para internacionalización:

```tsx
import { useTranslations } from "next-intl";

const t = useTranslations("form");
<StandardInput placeholder={t("emailPlaceholder")} />
```

## Showroom

Prueba interactiva disponible en:
```
/showroom/standard-input
```

## Changelog

| Versión | Cambios |
|---------|---------|
| v4.3 | 🪩 Props `pulseBorder` y `pafffMoment` + fix borde error |
| v4.2 | Patrón Flex - CSS dinámico, tokens precalculados |
| v4.0 | Migración inicial a DesignTokensProvider |
| v3.x | CSS variables en elemento (deprecado) |

---

📍 `components/ui/StandardInput.tsx`  
🎯 Ontología Visual SUSTRATO.AI  
🌸 Humanismo en co-evolución AI
