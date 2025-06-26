# StandardBadge: Guía de Referencia Rápida

`StandardBadge` es un componente en línea utilizado para mostrar información concisa como estados, contadores, o categorías. Es altamente personalizable a través de un sistema de `styleType`, `colorScheme` y `size`.

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
