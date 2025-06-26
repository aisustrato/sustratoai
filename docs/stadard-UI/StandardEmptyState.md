# StandardEmptyState

`StandardEmptyState` es un componente diseñado para ser utilizado cuando no hay contenido que mostrar en una sección de la interfaz. Proporciona una señal visual clara y consistente al usuario, como en casos de listas vacías, resultados de búsqueda sin coincidencias o la ausencia de datos para visualizar.

## Filosofía

Este componente sigue la filosofía del ecosistema "Standard UI", utilizando un sistema de `tokens` para su estilizado, lo que garantiza la coherencia visual con el resto de la aplicación. Es un componente orquestador que se centra en la estructura y la lógica, mientras que los detalles visuales (colores, etc.) son gestionados por el sistema de temas.

## Props

El componente `StandardEmptyState` acepta las siguientes `props`:

| Prop          | Tipo                          | Requerido | Por Defecto | Descripción                                                                                             |
|---------------|-------------------------------|-----------|-------------|---------------------------------------------------------------------------------------------------------|
| `icon`        | `LucideIcon`                  | No        | -           | Un ícono (de `lucide-react`) para mostrar en la parte superior del componente, ayudando a dar contexto visual.  |
| `title`       | `string`                      | Sí        | -           | El mensaje principal que se mostrará. Debe ser conciso y directo.                                       |
| `description` | `string`                      | No        | -           | Un texto secundario que ofrece más detalles o contexto sobre el estado vacío.                           |
| `action`      | `React.ReactNode`             | No        | -           | Un elemento de React, como un `StandardButton`, que permite al usuario realizar una acción (ej. "Crear Nuevo"). |
| `colorScheme` | `ColorScheme`                 | No        | `'blue'`    | Define la paleta de colores a utilizar para el ícono, según los tokens de diseño del tema.                |
| `className`   | `string`                      | No        | -           | Permite añadir clases CSS adicionales para personalizar el contenedor principal del componente.         |

## Ejemplos de Uso

### Uso Básico

El uso más simple, solo con un título.

```tsx
import { StandardEmptyState } from '@/components/ui/StandardEmptyState';

const MyComponent = () => (
  <StandardEmptyState title="No se encontraron resultados" />
);
```

### Con Descripción e Ícono

Un ejemplo más completo con un ícono para contexto visual y una descripción.

```tsx
import { StandardEmptyState } from '@/components/ui/StandardEmptyState';
import { SearchX } from 'lucide-react';

const MyComponent = () => (
  <StandardEmptyState 
    icon={SearchX}
    title="Búsqueda sin resultados"
    description="Intenta con otros términos de búsqueda para encontrar lo que necesitas."
    colorScheme="gray"
  />
);
```

### Con una Acción

Este ejemplo incluye un botón que el usuario puede presionar para realizar una acción, como crear un nuevo elemento.

```tsx
import { StandardEmptyState } from '@/components/ui/StandardEmptyState';
import { StandardButton } from '@/components/ui/StandardButton';
import { PlusCircle } from 'lucide-react';

const MyComponent = () => (
  <StandardEmptyState 
    icon={PlusCircle}
    title="No tienes proyectos creados"
    description="Comienza creando tu primer proyecto para empezar a organizar tu trabajo."
    action={
      <StandardButton colorScheme="primary">
        Crear Nuevo Proyecto
      </StandardButton>
    }
  />
);
```

## Consideraciones de Diseño

-   **Consistencia:** Utiliza `StandardEmptyState` en todas las situaciones donde se presente un estado vacío para mantener una experiencia de usuario coherente.
-   **Claridad:** El `title` y la `description` deben ser claros y ayudar al usuario a entender por qué no hay contenido y qué puede hacer a continuación.
-   **Acciones:** Si es posible, proporciona una `action` que guíe al usuario hacia el siguiente paso lógico.
