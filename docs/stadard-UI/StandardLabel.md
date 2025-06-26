# StandardLabel: Guía de Referencia Rápida

`StandardLabel` es un componente que renderiza una etiqueta (`<label>`) accesible para los campos de un formulario. Su principal responsabilidad es asociar un texto descriptivo a un control de entrada (como `StandardInput`) mediante la prop `htmlFor`.

Visualmente, `StandardLabel` es un envoltorio delgado alrededor del componente `StandardText`. Esto significa que hereda todas las props de estilo de `StandardText` para controlar su apariencia.

---

### 1. Uso Básico
La prop más importante es `htmlFor`, que debe coincidir con el `id` del campo de entrada que describe.

```tsx
import { StandardLabel } from "@/components/ui/StandardLabel";
import { StandardInput } from "@/components/ui/StandardInput";

<div>
  <StandardLabel htmlFor="email-input">Correo Electrónico</StandardLabel>
  <StandardInput id="email-input" type="email" />
</div>
```

### 2. Estilo y Color (`colorScheme`, `colorShade`)
Dado que `StandardLabel` usa `StandardText` internamente, puedes usar las mismas props para cambiar su color. Esto es útil para reflejar estados, como en `StandardFormField`.

```tsx
// Etiqueta con color primario (para indicar foco, por ejemplo)
<StandardLabel htmlFor="focused-input" colorScheme="primary" colorShade="pure">
  Campo Enfocado
</StandardLabel>

// Etiqueta con color de peligro (para indicar un error)
<StandardLabel htmlFor="error-input" colorScheme="danger" colorShade="pure">
  Campo con Error
</StandardLabel>
```

### 3. Peso y Tamaño (`weight`, `size`)
También puedes controlar el peso de la fuente y el tamaño del texto.

```tsx
// Etiqueta con texto en negrita
<StandardLabel htmlFor="bold-label" weight="bold">
  Etiqueta Importante
</StandardLabel>

// Etiqueta con texto más grande
<StandardLabel htmlFor="large-label" size="lg">
  Etiqueta Grande
</StandardLabel>
```

### 4. Uso dentro de `StandardFormField`
Aunque puedes usar `StandardLabel` de forma independiente, su uso más común es implícito dentro de `StandardFormField`. `StandardFormField` crea automáticamente un `StandardLabel` y le pasa las props `htmlFor` y `label`, además de gestionar su color dinámicamente según el estado del campo (foco, error).

```tsx
// StandardFormField se encarga de crear y colorear el StandardLabel internamente
<StandardFormField 
  label="Nombre" 
  htmlFor="username"
  error="El nombre es requerido."
>
  <StandardInput id="username" />
</StandardFormField>
```
