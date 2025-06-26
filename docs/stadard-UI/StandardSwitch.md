# StandardSwitch: Guía de Referencia Rápida

`StandardSwitch` es un control de dos estados que permite al usuario activar o desactivar una opción, como un interruptor de luz.

---

### 1. Uso Básico
Es un componente controlado. Debes gestionar su estado (encendido/apagado) con `checked` y `onCheckedChange`.

```tsx
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { useState } from 'react';

const [notificaciones, setNotificaciones] = useState(true);

<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <label htmlFor="notif-switch">Recibir notificaciones</label>
  <StandardSwitch 
    id="notif-switch"
    checked={notificaciones}
    onCheckedChange={setNotificaciones}
  />
</div>
```

### 2. Personalización Visual

#### Esquema de Color (`colorScheme`)
Define el color que tendrá el interruptor en su estado "encendido". Por defecto es `"primary"`.

```tsx
// Usando el color de acento del tema
<StandardSwitch 
  checked={true}
  colorScheme="accent"
/>
```

#### Tamaño (`size`)
Controla el tamaño general del componente. Las opciones son `"sm"`, `"md"` (defecto), y `"lg"`.

```tsx
// Un interruptor más pequeño y discreto
<StandardSwitch 
  checked={true}
  size="sm"
/>

// Un interruptor más grande y prominente
<StandardSwitch 
  checked={true}
  size="lg"
/>
```

### 3. Estado Deshabilitado (`disabled`)
La prop `disabled` impide la interacción del usuario y aplica un estilo visual que indica inactividad.

```tsx
// Interruptor encendido pero no modificable
<StandardSwitch checked={true} disabled />

// Interruptor apagado y no modificable
<StandardSwitch checked={false} disabled />
```

### 4. Accesibilidad
`StandardSwitch` está construido sobre Radix UI, por lo que es accesible por defecto. Para una accesibilidad completa, siempre debe estar asociado a una `<label>` que describa su función, utilizando el par `id` y `htmlFor` como se muestra en el primer ejemplo.
