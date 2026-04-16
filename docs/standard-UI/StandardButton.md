# StandardButton v4.2 - Soberanía de Animación

> 🌸 Primera flor del jardín de componentes SUSTRATO.AI

## Filosofía

El botón estándar implementa el **Patrón Flex** de soberanía de animación: los estilos inline manejan colores y dimensiones, mientras que las animaciones viven en CSS dinámico inyectado.

```
┌─────────────────────────────────────────────────────────┐
│  INLINE STYLES                    CSS DINÁMICO          │
│  ✅ Colores                       ✅ :hover             │
│  ✅ Dimensiones                   ✅ :active            │
│  ✅ Tipografía                    ✅ @keyframes         │
│  ❌ NO transform                  ✅ Breathing          │
│  ❌ NO boxShadow                  ✅ Elevated           │
└─────────────────────────────────────────────────────────┘
```

## Importación

```tsx
import { StandardButton } from "@/components/ui/StandardButton";
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `styleType` | `'solid' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` | Variante visual |
| `colorScheme` | `ColorSchemeVariant` | `'primary'` | Esquema de color |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Tamaño |
| `rounded` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Radio de borde |
| `modifiers` | `('gradient' \| 'elevated')[]` | `[]` | Modificadores visuales |
| `breathing` | `boolean` | `false` | Animación de "respiración" para CTAs |
| `loading` | `boolean` | `false` | Estado de carga con spinner |
| `loadingText` | `string` | `'Cargando...'` | Texto durante carga |
| `leftIcon` | `ComponentType` | - | Icono izquierdo |
| `rightIcon` | `ComponentType` | - | Icono derecho |
| `iconOnly` | `boolean` | `false` | Solo mostrar icono |
| `fullWidth` | `boolean` | `false` | Ancho completo |
| `tooltip` | `string \| ReactNode` | - | Tooltip al hover |
| `disableRipple` | `boolean` | `false` | Desactivar efecto ripple |
| `asChild` | `boolean` | `false` | Renderizar como hijo (Radix Slot) |

## Ejemplos de Uso

### Básico
```tsx
<StandardButton>Click me</StandardButton>
```

### Con colorScheme
```tsx
<StandardButton colorScheme="primary">Primary</StandardButton>
<StandardButton colorScheme="secondary">Secondary</StandardButton>
<StandardButton colorScheme="accent">Accent</StandardButton>
<StandardButton colorScheme="success">Success</StandardButton>
<StandardButton colorScheme="warning">Warning</StandardButton>
<StandardButton colorScheme="danger">Danger</StandardButton>
<StandardButton colorScheme="neutral">Neutral</StandardButton>
```

### StyleTypes
```tsx
<StandardButton styleType="solid">Solid</StandardButton>
<StandardButton styleType="outline">Outline</StandardButton>
<StandardButton styleType="ghost">Ghost</StandardButton>
<StandardButton styleType="link">Link</StandardButton>
```

### Con iconos
```tsx
import { Star, Rocket } from "lucide-react";

<StandardButton leftIcon={Star}>Con icono</StandardButton>
<StandardButton rightIcon={Rocket}>Enviar</StandardButton>
<StandardButton leftIcon={Star} rightIcon={Rocket}>Ambos</StandardButton>
<StandardButton iconOnly leftIcon={Star} />
```

### CTA con Breathing
```tsx
<StandardButton 
  breathing 
  colorScheme="accent" 
  size="lg"
>
  ¡Comenzar ahora!
</StandardButton>
```

### Estado de carga
```tsx
<StandardButton loading>Guardando...</StandardButton>
<StandardButton loading loadingText="Procesando...">Submit</StandardButton>
```

### Con tooltip
```tsx
<StandardButton tooltip="Más información">Info</StandardButton>
```

## Arquitectura Técnica

### 1. Tokens Precalculados
El componente consume tokens del `DesignTokensProvider`, evitando recálculos en cada render.

```tsx
const { tokens } = useDesignTokens();
const sizeTokens = tokens?.button.sizes[size];
const styleTokens = tokens?.button.styles[colorScheme]?.[styleType];
```

### 2. CSS Dinámico (Patrón Flex)
Las animaciones se inyectan como CSS en el `<head>` con ID único por instancia:

```tsx
useEffect(() => {
  const styleElement = document.createElement("style");
  styleElement.setAttribute("data-button-id", buttonId);
  styleElement.textContent = `
    .btn-${buttonId}:hover { transform: translateY(-1px); }
    .btn-${buttonId}.btn-breathing { animation: breathe-${buttonId} 3s infinite; }
  `;
  document.head.appendChild(styleElement);
  return () => document.head.removeChild(styleElement);
}, [buttonId, styleTokens]);
```

### 3. Separación de Responsabilidades

| Capa | Responsabilidad |
|------|-----------------|
| `componentStyles` | Colores, dimensiones, tipografía |
| `animationClasses` | Estados de animación (CSS classes) |
| CSS inyectado | Reglas :hover, :active, @keyframes |

## Accesibilidad (ARIA)

- ✅ `disabled` nativo del botón
- ✅ `aria-label` soportado para i18n
- ✅ Focus visible con anillo
- ✅ `focus-visible:ring-2` para navegación por teclado
- ✅ Contraste de colores según tokens del tema

## i18n

El componente está preparado para internacionalización:

```tsx
import { useTranslations } from "next-intl";

const t = useTranslations("common");
<StandardButton>{t("save")}</StandardButton>
```

## Showroom

Prueba interactiva disponible en:
```
/showroom/standard-button
```

## Changelog

| Versión | Cambios |
|---------|---------|
| v4.2 | Patrón Flex - CSS dinámico para animaciones |
| v4.1 | Breathing animation, i18n-ready |
| v4.0 | Migración a DesignTokensProvider |
| v3.x | Tokens dinámicos (deprecado) |

---

📍 `components/ui/StandardButton.tsx`  
🎯 Ontología Visual SUSTRATO.AI  
🌸 Humanismo en co-evolución AI
