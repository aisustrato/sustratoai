# StandardSphere: Guía de Referencia Rápida

`StandardSphere` es un componente visual para representar entidades de datos o conceptos como "lotus" interactivos. Es una unidad de información circular que puede mostrar un valor, un icono y metadatos adicionales como badges y tooltips.

---

### 1. Contenido Principal
La esfera puede mostrar diferentes tipos de contenido principal.

#### Con Valor (`value`)
Muestra un texto o número en el centro.
```tsx
import { StandardSphere } from "@/components/ui/StandardSphere";

<StandardSphere value="7" />
```

#### Solo con Icono (`onlyIcon`)
El icono se convierte en el elemento central y protagonista.
```tsx
import { BrainCircuit } from "lucide-react";

<StandardSphere icon={BrainCircuit} onlyIcon={true} />
```

#### Valor con Icono Secundario
Si se proporcionan `value` e `icon` (y `onlyIcon` es `false`), el valor es el principal y el icono aparece debajo.
```tsx
<StandardSphere value="3" icon={BrainCircuit} />
```

### 2. Personalización Visual

-   **`size`**: Controla el diámetro de la esfera (`'xs'` a `'2xl'`).
-   **`colorScheme`**: Aplica una paleta de colores del tema (`'primary'`, `'secondary'`, etc.).
-   **`styleType`**: Define el estilo visual: `'filled'` (defecto), `'subtle'`, `'outline'`.

```tsx
// Esfera grande, de color secundario y con estilo de contorno
<StandardSphere 
  value="IA"
  size="lg"
  colorScheme="secondary"
  styleType="outline"
/>
```

### 3. Información Adicional

#### Con Tooltip
Usa la prop `tooltip` para mostrar información al pasar el cursor.
```tsx
<StandardSphere 
  value="42"
  tooltip="Total de Documentos Analizados"
/>
```

#### Con Badge
Usa la prop `badge` para añadir una insignia en el borde inferior. Puedes darle un color distinto con `badgeColorScheme`.
```tsx
<StandardSphere 
  value="R.L."
  badge="Admin"
  badgeColorScheme="accent"
/>
```

### 4. Interacción

-   **`onClick`**: Asigna una función para que la esfera sea clickeable.
-   **`disabled`**: Deshabilita las interacciones y reduce la opacidad.

```tsx
<StandardSphere 
  value="Click"
  onClick={() => alert('Esfera clickeada!')}
/>

<StandardSphere value="Off" disabled />
```

### 5. Propósito y Contexto (`keyGroup`)
La prop `keyGroup` (ej. `keyGroup="investigador-123"`) no tiene un efecto visual directo, pero sirve como un identificador para que un componente contenedor pueda agrupar, filtrar u ordenar un conjunto de esferas. Esto indica que `StandardSphere` está diseñado para ser parte de visualizaciones de datos más complejas.
