# StandardFormField: Guía de Referencia Rápida

`StandardFormField` es un componente contenedor que estructura un campo de formulario completo. Se encarga de renderizar la etiqueta, el campo de entrada (que se pasa como hijo), y los mensajes de ayuda o error, asegurando la accesibilidad y un comportamiento visual consistente.

---

### 1. Uso Básico
Envuelve un componente de entrada (como `StandardInput`) dentro de `StandardFormField` para asociarle una etiqueta de forma automática y accesible.

```tsx
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardInput } from "@/components/ui/StandardInput";

<StandardFormField label="Nombre de Usuario" htmlFor="username">
  <StandardInput id="username" placeholder="Ej: juan.perez" />
</StandardFormField>
```
**Nota:** La prop `htmlFor` del `FormField` **debe coincidir** con el `id` del campo de entrada.

### 2. Con Texto de Ayuda (`hint`)
Usa la prop `hint` para proporcionar instrucciones adicionales o aclaraciones debajo del campo de entrada.

```tsx
<StandardFormField
  label="Contraseña"
  htmlFor="password"
  hint="Debe tener al menos 8 caracteres, una mayúscula y un número."
>
  <StandardInput id="password" type="password" />
</StandardFormField>
```

### 3. Con Mensaje de Error (`error`)
La prop `error` muestra un mensaje de validación y cambia el color de la etiqueta a rojo para indicar un problema. El mensaje de error reemplaza al `hint` si ambos están presentes.

```tsx
<StandardFormField
  label="Email"
  htmlFor="email"
  error="La dirección de correo electrónico no es válida."
>
  <StandardInput id="email" defaultValue="correo-invalido" />
</StandardFormField>
```

### 4. Campos Requeridos (`isRequired`)
Añade un asterisco rojo a la etiqueta para indicar visualmente que el campo es obligatorio.

```tsx
<StandardFormField label="Nombre" htmlFor="first-name" isRequired>
  <StandardInput id="first-name" />
</StandardFormField>
```

### 5. Composición con Otros Componentes
`StandardFormField` funciona con cualquier componente de formulario, como `StandardTextarea` o `StandardSelect`.

```tsx
import { StandardTextarea } from "@/components/ui/StandardTextarea";

<StandardFormField
  label="Biografía"
  htmlFor="bio"
  hint="Cuéntanos un poco sobre ti."
  isRequired
>
  <StandardTextarea id="bio" placeholder="Escribe aquí..." />
</StandardFormField>
```
