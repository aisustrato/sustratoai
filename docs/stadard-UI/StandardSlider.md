# StandardSlider: Guía de Referencia Rápida

`StandardSlider` es un componente que permite al usuario seleccionar un valor o un rango de valores de forma intuitiva arrastrando uno o más "pulgares" (thumbs) a lo largo de una pista.

---

### 1. Uso Básico (Valor Único)
Para un slider simple, proporciona un `defaultValue` o un `value` controlado como un array con un solo número.

```tsx
import { StandardSlider } from "@/components/ui/StandardSlider";

const [volume, setVolume] = useState([50]);

<StandardSlider 
  defaultValue={[50]}
  max={100}
  step={1}
  onValueChange={(newValue) => setVolume(newValue)}
/>
```

### 2. Slider de Rango (Múltiples Valores)
Para seleccionar un rango, pasa un array con dos valores. El componente renderizará dos pulgares.

```tsx
const [priceRange, setPriceRange] = useState([20, 80]);

<StandardSlider 
  value={priceRange}
  max={100}
  step={1}
  onValueChange={setPriceRange}
/>
```

### 3. Tooltip Interactivo (`showTooltip`)
Al activar `showTooltip`, se mostrará una pequeña ventana con el valor exacto encima del pulgar cuando el usuario interactúa con él (hover o drag). Es ideal para selecciones precisas.

```tsx
<StandardSlider defaultValue={[75]} showTooltip={true} />
```

### 4. Personalización Visual

#### Tamaño (`size`)
Controla el grosor de la pista y el tamaño del pulgar. Opciones: `"xs"`, `"sm"`, `"md"` (defecto), `"lg"`, `"xl"`.

```tsx
<StandardSlider defaultValue={[50]} size="lg" />
```

#### Esquema de Color (`colorScheme`)
Define el color del rango seleccionado y del pulgar. Por defecto es `"primary"`.

```tsx
<StandardSlider defaultValue={[50]} colorScheme="secondary" />
```

#### Estilo de Rango (`styleType`)
Cambia la apariencia del rango seleccionado.
-   `"solid"` (defecto): Un color sólido.
-   `"gradient"`: Un gradiente suave.

```tsx
<StandardSlider defaultValue={[25, 75]} styleType="gradient" colorScheme="tertiary" />
```

### 5. Orientación Vertical (`orientation`)
El slider también puede mostrarse verticalmente.

```tsx
<div style={{ height: '200px' }}>
  <StandardSlider 
    defaultValue={[60]}
    orientation="vertical"
    showTooltip={true}
  />
</div>
```
