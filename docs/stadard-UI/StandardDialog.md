# StandardDialog: Guía de Referencia Rápida

`StandardDialog` es un componente modal que interrumpe el flujo del usuario para presentar información importante, solicitar una acción o mostrar un formulario. Se construye utilizando un patrón de composición, anidando sus diferentes partes.

---

### 1. Uso Básico
Un diálogo se compone de un `Trigger` (el activador) y un `Content` (el contenido). Dentro del `Content`, se usan subcomponentes como `Header`, `Title`, `Description` y `Footer` para estructurar la información.

```tsx
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";

<StandardDialog>
  <StandardDialog.Trigger asChild>
    <StandardButton>Abrir Diálogo</StandardButton>
  </StandardDialog.Trigger>
  <StandardDialog.Content>
    <StandardDialog.Header>
      <StandardDialog.Title>Título del Diálogo</StandardDialog.Title>
      <StandardDialog.Description>
        Esta es una descripción que explica el propósito de este diálogo.
      </StandardDialog.Description>
    </StandardDialog.Header>
    <StandardDialog.Body>
      <p>Este es el contenido principal del diálogo. Puedes poner formularios, texto o cualquier otro componente aquí.</p>
    </StandardDialog.Body>
    <StandardDialog.Footer>
      <StandardDialog.Close asChild>
        <StandardButton styleType="outline">Cancelar</StandardButton>
      </StandardDialog.Close>
      <StandardButton>Aceptar</StandardButton>
    </StandardDialog.Footer>
  </StandardDialog.Content>
</StandardDialog>
```
**Nota:** El uso de `asChild` en `Trigger` y `Close` permite que `StandardButton` (o cualquier otro componente) herede la funcionalidad de activación y cierre del diálogo.

### 2. Tamaños (`size`)
Controla el ancho máximo del diálogo. La prop `size` se aplica en `StandardDialog.Content`.

```tsx
// Diálogo pequeño
<StandardDialog.Content size="sm">... </StandardDialog.Content>

// Diálogo mediano (por defecto)
<StandardDialog.Content size="md">... </StandardDialog.Content>

// Diálogo grande
<StandardDialog.Content size="lg">... </StandardDialog.Content>

// Diálogo extra grande
<StandardDialog.Content size="xl">... </StandardDialog.Content>
```

### 3. Esquemas de Color (`colorScheme`)
Cambia la paleta de colores del diálogo para diferentes contextos. La prop `colorScheme` también se aplica en `StandardDialog.Content`.

```tsx
// Diálogo con el tema 'secondary'
<StandardDialog.Content colorScheme="secondary">... </StandardDialog.Content>

// Diálogo con el tema de acento
<StandardDialog.Content colorScheme="accent">... </StandardDialog.Content>
```

### 4. Ejemplo: Diálogo de Confirmación
Un caso de uso común es pedir confirmación al usuario antes de una acción destructiva.

```tsx
<StandardDialog>
  <StandardDialog.Trigger asChild>
    <StandardButton colorScheme="danger">Eliminar Cuenta</StandardButton>
  </StandardDialog.Trigger>
  <StandardDialog.Content size="sm" colorScheme="danger">
    <StandardDialog.Header>
      <StandardDialog.Title>¿Estás absolutamente seguro?</StandardDialog.Title>
      <StandardDialog.Description>
        Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y tus datos de nuestros servidores.
      </StandardDialog.Description>
    </StandardDialog.Header>
    <StandardDialog.Footer>
      <StandardDialog.Close asChild>
        <StandardButton styleType="outline">Cancelar</StandardButton>
      </StandardDialog.Close>
      <StandardDialog.Close asChild>
        <StandardButton colorScheme="danger">Sí, eliminar</StandardButton>
      </StandardDialog.Close>
    </StandardDialog.Footer>
  </StandardDialog.Content>
</StandardDialog>
```
