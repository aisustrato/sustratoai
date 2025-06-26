# StandardProgressBar: Guía de Referencia Rápida

`StandardProgressBar` es un componente visual que indica el progreso de una operación, ya sea de forma determinada (un porcentaje de 0 a 100) o indeterminada (una animación de espera).

---

### 1. Uso Básico (Determinado)
Para mostrar un progreso específico, proporciona un `value` (valor actual) y opcionalmente un `max` (valor total, por defecto 100).

```tsx
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";

// Barra de progreso al 45%
<StandardProgressBar value={45} />
```

### 2. Modo Indeterminado (`indeterminate`)
Úsalo cuando una operación está en curso pero no se puede determinar su progreso. Esto mostrará una animación continua.

```tsx
// Barra de carga para un proceso de duración desconocida
<StandardProgressBar indeterminate={true} />
```

### 3. Personalización Visual

#### Tamaño (`size`)
Controla la altura de la barra. Las opciones son `"xs"`, `"sm"`, `"md"` (defecto), `"lg"`, `"xl"`.

```tsx
<StandardProgressBar value={75} size="lg" />
```

#### Esquema de Color (`colorScheme`)
Define el color de la barra usando las paletas del tema. Por defecto es `"primary"`.

```tsx
<StandardProgressBar value={60} colorScheme="secondary" />
```

#### Estilo de Barra (`styleType`)
Cambia la apariencia de la barra de progreso. Las opciones son:
-   `"gradient"` (defecto): Un gradiente suave.
-   `"solid"`: Un color sólido.
-   `"accent-gradient"`: Un gradiente que incorpora el color de acento del tema.
-   `"thermometer"`: Un gradiente que va de un color frío a uno cálido (ej. azul a rojo).

```tsx
<StandardProgressBar value={80} styleType="solid" colorScheme="tertiary" />

<StandardProgressBar value={50} styleType="thermometer" />
```

### 4. Información Adicional

#### Etiqueta y Valor (`label` y `showValue`)
Proporciona contexto al usuario mostrando una descripción y/o el porcentaje numérico.

```tsx
<StandardProgressBar 
  value={88}
  label="Subiendo archivos..."
  showValue={true}
  size="md"
/>
```

### 5. Ejemplo Completo
Combinando varias propiedades para una barra de progreso informativa y estilizada.

```tsx
const [uploadProgress, setUploadProgress] = useState(0);

// ...lógica para actualizar uploadProgress...

<StandardProgressBar 
  value={uploadProgress}
  max={100}
  label={`Progreso de la carga: ${uploadProgress}%`}
  showValue={true}
  colorScheme="primary"
  styleType="gradient"
  size="lg"
  animated={true}
/>
```
