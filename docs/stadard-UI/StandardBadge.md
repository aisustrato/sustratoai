# StandardBadge: Guía de Referencia Rápida

`StandardBadge` es un componente en línea utilizado para mostrar información concisa como estados, contadores, o categorías. Es altamente personalizable a través de un sistema de `styleType`, `colorScheme` y `size`.

**Versión:** v4.0 - Patrón Flex + Tokens Provider + Efectos SUSTRATO  
**Arquitectura:** Consume tokens precalculados desde `DesignTokensProvider` con efectos de retroalimentación visual al humano.

---

### 1. Uso Básico
El badge más simple. Heredará los valores por defecto: `styleType="subtle"`, `colorScheme="primary"`, y `size="md"`.

```tsx
<StandardBadge>Default Badge</StandardBadge>
```

### 2. Estilos Base (`styleType`)
Define la apariencia fundamental del badge. Elige entre un estilo sutil, uno sólido o solo el contorno.

```tsx
// Estilo sutil con fondo ligero (por defecto)
<StandardBadge styleType="subtle" colorScheme="primary">Subtle</StandardBadge>

// Estilo de contorno
<StandardBadge styleType="outline" colorScheme="secondary">Outline</StandardBadge>

// Estilo con fondo sólido
<StandardBadge styleType="solid" colorScheme="accent">Solid</StandardBadge>
```

### 3. Esquemas de Color (`colorScheme`)
Adapta el badge a diferentes contextos semánticos utilizando el sistema de colores del tema.

```tsx
<StandardBadge colorScheme="primary">Primary</StandardBadge>
<StandardBadge colorScheme="secondary">Secondary</StandardBadge>
<StandardBadge colorScheme="accent">Accent</StandardBadge>
<StandardBadge colorScheme="success">Success</StandardBadge>
<StandardBadge colorScheme="warning">Warning</StandardBadge>
<StandardBadge colorScheme="danger">Danger</StandardBadge>
```

### 4. Tamaños (`size`)
Controla las dimensiones y el tamaño de la fuente del badge.

```tsx
// Badge extra pequeño
<StandardBadge size="xs">Extra Small</StandardBadge>

// Badge pequeño
<StandardBadge size="sm">Small</StandardBadge>

// Badge mediano (por defecto)
<StandardBadge size="md">Medium</StandardBadge>

// Badge grande
<StandardBadge size="lg">Large</StandardBadge>
```

### 5. Composición con Iconos
El tamaño del icono se ajusta automáticamente al tamaño (`size`) del badge.

```tsx
import { CheckCircle, AlertTriangle } from "lucide-react";

// Con icono a la izquierda
<StandardBadge colorScheme="success" leftIcon={CheckCircle}>
  Verificado
</StandardBadge>

// Con icono a la derecha
<StandardBadge styleType="solid" colorScheme="warning" rightIcon={AlertTriangle}>
  Alerta
</StandardBadge>
```

### 6. El Ejemplo "Magistral"
Una combinación de múltiples props para mostrar la flexibilidad del componente.

```tsx
import { Rocket } from "lucide-react";

<StandardBadge
  colorScheme="accent"
  styleType="solid"
  size="lg"
  leftIcon={Rocket}
>
  Misión Activa
</StandardBadge>
```

---

## 🌊 Efectos SUSTRATO - Retroalimentación Visual al Humano

StandardBadge v4 incluye efectos de animación para retroalimentar al usuario con "respiración" visual. Estos efectos son opcionales y se activan mediante props booleanos.

### 7. Pulse Border - Respiración Sutil (2.5s)
Efecto de respiración sutil en el borde. Ideal para badges que representan estados activos o en progreso.

```tsx
import { Sparkles } from "lucide-react";

// Badge con respiración sutil
<StandardBadge 
  colorScheme="primary" 
  styleType="outline" 
  pulseBorder
>
  En Progreso
</StandardBadge>

// Con icono
<StandardBadge 
  colorScheme="accent" 
  styleType="outline" 
  pulseBorder
  leftIcon={Sparkles}
>
  Activo
</StandardBadge>
```

**Características:**
- Ciclo de 2.5 segundos
- Animación de borde y sombra
- No invasivo, sutil y elegante
- Funciona con todos los `styleType`

### 8. Pafff Moment - Latido de Coherencia (1.5s)
Latido más intenso para momentos de insight o coherencia. Retroalimenta al humano con energía visual.

```tsx
import { AlertTriangle, Wand2 } from "lucide-react";

// Badge con latido intenso
<StandardBadge 
  colorScheme="warning" 
  styleType="solid" 
  pafffMoment
  leftIcon={AlertTriangle}
>
  ¡Atención!
</StandardBadge>

// Para insights
<StandardBadge 
  colorScheme="tertiary" 
  styleType="outline" 
  pafffMoment
  leftIcon={Wand2}
>
  Insight
</StandardBadge>
```

**Características:**
- Ciclo de 1.5 segundos (más rápido que pulse)
- Animación de box-shadow con múltiples capas
- Más prominente y llamativo
- Ideal para alertas y momentos importantes

### 9. Combinaciones de Efectos con Estilos

Los efectos SUSTRATO funcionan con cualquier combinación de `styleType` y `colorScheme`:

```tsx
// Solid + Pulse Border
<StandardBadge 
  colorScheme="primary" 
  styleType="solid" 
  pulseBorder
>
  Solid Pulse
</StandardBadge>

// Subtle + Pafff Moment
<StandardBadge 
  colorScheme="secondary" 
  styleType="subtle" 
  pafffMoment
>
  Subtle Pafff
</StandardBadge>

// Outline + Pulse Border
<StandardBadge 
  colorScheme="accent" 
  styleType="outline" 
  pulseBorder
>
  Outline Pulse
</StandardBadge>
```

---

## 📋 Props Completas

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Contenido del badge |
| `colorScheme` | `ColorSchemeVariant` | `"primary"` | Esquema de color |
| `styleType` | `"solid" \| "subtle" \| "outline"` | `"subtle"` | Estilo visual |
| `size` | `"2xs" \| "xs" \| "sm" \| "md" \| "lg"` | `"md"` | Tamaño del badge |
| `leftIcon` | `React.ComponentType` | - | Icono a la izquierda |
| `rightIcon` | `React.ComponentType` | - | Icono a la derecha |
| `pulseBorder` | `boolean` | `false` | Efecto de respiración sutil (2.5s) |
| `pafffMoment` | `boolean` | `false` | Efecto de latido intenso (1.5s) |
| `className` | `string` | - | Clases CSS adicionales |

---

## 🎯 Casos de Uso Recomendados

### Estados Activos
```tsx
<StandardBadge colorScheme="success" styleType="outline" pulseBorder>
  Procesando
</StandardBadge>
```

### Alertas Importantes
```tsx
<StandardBadge colorScheme="danger" styleType="solid" pafffMoment>
  Urgente
</StandardBadge>
```

### Notificaciones
```tsx
<StandardBadge colorScheme="warning" styleType="subtle" pafffMoment>
  3 nuevos
</StandardBadge>
```

### Estados Estáticos
```tsx
<StandardBadge colorScheme="neutral" styleType="outline">
  Completado
</StandardBadge>
```

---

## 🏗️ Arquitectura v4

StandardBadge utiliza el **Patrón Flex** con tokens precalculados:

1. **Tokens Precalculados**: Los estilos se generan una sola vez en `DesignTokensProvider`
2. **CSS Dinámico**: Las animaciones se inyectan como `<style>` con ID único
3. **Sin Recálculos**: El componente NO recalcula estilos en cada render
4. **Performance**: O(1) para obtener tokens, animaciones manejadas por el navegador

**Beneficios:**
- ⚡ Performance óptima
- 🎨 Animaciones fluidas sin impacto en React
- 🧠 Lógica en JS, ejecución en CSS
- 🌊 Retroalimentación visual al humano
