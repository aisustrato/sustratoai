# StandardInput: Guía de Referencia Rápida

`StandardInput` es un componente de campo de texto versátil que soporta iconos, estados de validación, y otras funcionalidades avanzadas. Es el bloque de construcción fundamental para la mayoría de los formularios.

---

### 1. Uso Básico y Tamaños
El componente se puede renderizar en diferentes tamaños (`sm`, `md`, `lg`) usando la prop `size`.

```tsx
import { StandardInput } from "@/components/ui/StandardInput";

// Input pequeño
<StandardInput size="sm" placeholder="Pequeño..." />

// Input mediano (por defecto)
<StandardInput placeholder="Mediano..." />

// Input grande
<StandardInput size="lg" placeholder="Grande..." />
```

### 2. Esquemas de Color (`colorScheme`)
Puedes cambiar la paleta de colores del input para que se alinee con el contexto de la UI. Por defecto es `default`.

```tsx
// Input con el color de acento
<StandardInput colorScheme="accent" placeholder="Acentuado..." />

// Input con el color secundario
<StandardInput colorScheme="secondary" placeholder="Secundario..." />
```

### 3. Iconos (`leadingIcon` y `trailingIcon`)
Puedes añadir iconos al principio o al final del campo para mejorar la claridad visual.

```tsx
import { AtSign, Search } from "lucide-react";

// Con icono al principio (leading)
<StandardInput leadingIcon={AtSign} placeholder="Tu email" />

// Con icono al final (trailing)
<StandardInput trailingIcon={Search} placeholder="Buscar..." />
```

### 4. Estados de Validación (`error` y `success`)
Usa las props `error` y `success` para dar feedback visual al usuario.

```tsx
// Estado de error
<StandardInput error="Este campo es requerido" defaultValue="Texto inválido" />

// Estado de éxito
<StandardInput success={true} defaultValue="Texto válido" />
```

### 5. Otros Estados (`disabled` y `readOnly`)
El componente también maneja los estados estándar de HTML.

```tsx
// Campo deshabilitado
<StandardInput disabled placeholder="No se puede interactuar" />

// Campo de solo lectura
<StandardInput readOnly value="No se puede editar este valor" />
```

### 6. Funcionalidades Especiales

#### Campo de Contraseña
Si `type="password"`, se añade automáticamente un botón para mostrar u ocultar la contraseña.
```tsx
<StandardInput type="password" placeholder="Tu contraseña" />
```

#### Botón de Limpieza (`onClear`)
Proporciona una función a `onClear` para mostrar un botón 'X' que limpia el campo cuando tiene contenido.
```tsx
const [value, setValue] = React.useState("Escribe algo...");

<StandardInput 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
  onClear={() => setValue("")} 
/>
```

#### Contador de Caracteres
Usa `showCharacterCount` y `maxLength` para mostrar un contador de caracteres debajo del campo.
```tsx
<StandardInput 
  maxLength={140} 
  showCharacterCount={true} 
  placeholder="Escribe un tweet..." 
/>
```

### 7. Integración con `StandardFormField`
Para una accesibilidad y estructura correctas, siempre se debe usar `StandardInput` dentro de `StandardFormField`.

```tsx
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardInput } from "@/components/ui/StandardInput";
import { User } from "lucide-react";

<StandardFormField
  label="Nombre de Usuario"
  htmlFor="username"
  hint="Elige un nombre único y fácil de recordar."
  error={errors.username}
  isRequired
>
  <StandardInput 
    id="username" 
    leadingIcon={User} 
    placeholder="Ej: sustrato_ai" 
  />
</StandardFormField>
```
