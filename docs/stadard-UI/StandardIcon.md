# StandardIcon: Guía de Referencia Rápida

`StandardIcon` es un componente contenedor que aplica un sistema de estilos consistente (tamaño, color, y variante) a cualquier icono SVG que se le pase como hijo. Esto asegura que los iconos mantengan una apariencia uniforme en toda la aplicación.

---

### 1. Uso Básico
Para usar `StandardIcon`, envuelve tu componente de icono SVG dentro de él. `StandardIcon` clonará el icono y le inyectará las propiedades de estilo adecuadas.

```tsx
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SomeIcon } from "@/components/icons/SomeIcon"; // Tu componente de icono SVG

// Renderiza SomeIcon con el tamaño y color por defecto
<StandardIcon>
  <SomeIcon />
</StandardIcon>
```

### 2. Tamaños (`size`)
Controla las dimensiones del icono. Los tamaños están predefinidos en el sistema de diseño.

```tsx
// Icono pequeño
<StandardIcon size="sm"><SomeIcon /></StandardIcon>

// Icono mediano (base)
<StandardIcon size="md"><SomeIcon /></StandardIcon>

// Icono grande
<StandardIcon size="lg"><SomeIcon /></StandardIcon>

// Icono extra grande
<StandardIcon size="xl"><SomeIcon /></StandardIcon>
```

### 3. Esquemas de Color y Estilos
Las props `colorScheme`, `styleType` y `colorShade` se combinan para aplicar un color específico del tema.

```tsx
// Icono de tipo 'outline' con el color primario
<StandardIcon colorScheme="primary" styleType="outline">
  <SomeIcon />
</StandardIcon>

// Icono de tipo 'solid' con el color de peligro (danger)
<StandardIcon colorScheme="danger" styleType="solid">
  <SomeIcon />
</StandardIcon>

// Icono de tipo 'outline' con un tono de texto más sutil
<StandardIcon colorScheme="neutral" styleType="outline" colorShade="text">
  <SomeIcon />
</StandardIcon>
```

### 4. Animación de Giro (`isSpinning`)
La prop `isSpinning` es útil para indicar estados de carga. Cuando es `true`, el icono rotará continuamente.

```tsx
import { LoaderCircle } from "lucide-react";

<StandardIcon size="lg" isSpinning={true}>
  <LoaderCircle />
</StandardIcon>
```

### 5. Creación de Iconos Pre-configurados
La función `createStandardIcon` permite crear componentes de icono reutilizables con props por defecto. Esto es ideal para construir una biblioteca de iconos estandarizada.

```tsx
//. 📍 /components/icons/MyCustomIcons.tsx
import { createStandardIcon } from "@/components/ui/StandardIcon";
import { CheckCircle, XCircle } from "lucide-react";

export const SuccessIcon = createStandardIcon(CheckCircle, {
  colorScheme: "success",
  styleType: "solid",
});

export const ErrorIcon = createStandardIcon(XCircle, {
  colorScheme: "danger",
  styleType: "solid",
});

//. 📍 En otro componente:
import { SuccessIcon, ErrorIcon } from "@/components/icons/MyCustomIcons";

<div>
  <SuccessIcon size="lg" />
  <ErrorIcon size="lg" />
</div>
```
