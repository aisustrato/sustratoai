# `StandardDatePicker`

`StandardDatePicker` es un componente de UI que permite a los usuarios seleccionar una fecha desde un calendario emergente. Está construido combinando `react-day-picker` para el calendario, Radix UI `Popover` para el comportamiento emergente y `StandardInput` para mostrar la fecha seleccionada, garantizando una integración perfecta con el ecosistema "Standard UI".

## Filosofía de Diseño

- **Orquestador Inteligente:** El componente `StandardDatePicker` (`.tsx`) maneja la lógica de estado (fecha seleccionada, visibilidad del popover), la interacción del usuario y la orquestación de los sub-componentes, pero es agnóstico a los valores de estilo.
- **Consumo de Tokens:** Los estilos del calendario se obtienen del sistema de tokens centralizado. El componente recibe `props` como `colorScheme` y `size` y las usa para solicitar los tokens de estilo correspondientes desde `generateStandardDatePickerTokens`. El `StandardInput` interno también consume sus propios tokens.
- **Accesibilidad:** Aprovecha la accesibilidad de `react-day-picker` y Radix UI, asegurando que el componente sea navegable por teclado y compatible con lectores de pantalla.

---

## Anatomía del Componente

`StandardDatePicker` es un componente compuesto que encapsula:

1.  **`StandardInput`**: El campo de texto visible que muestra la fecha seleccionada y actúa como el disparador (`trigger`) para el popover.
2.  **Radix `Popover`**: Gestiona la visibilidad y el posicionamiento del calendario emergente.
3.  **`DayPicker`**: El calendario interactivo que permite al usuario seleccionar una fecha.

---

## Importación

```tsx
import { StandardDatePicker } from '@/components/ui/StandardDatePicker';
```

---

## Uso

`StandardDatePicker` puede ser usado como un componente **controlado** o **no controlado**.

### No Controlado (Simple)

Para casos de uso sencillos, puedes usarlo de forma no controlada especificando un `defaultValue`. El componente gestionará su propio estado internamente.

```tsx
<StandardDatePicker
  label="Fecha de Nacimiento"
  defaultValue={new Date()}
  colorScheme="primary"
  size="md"
/>
```

### Controlado (Avanzado)

Para un control total sobre la fecha seleccionada, puedes usarlo de forma controlada. Esto es útil cuando el estado de la fecha necesita ser manipulado desde un componente padre. Debes proveer las `props` `value` y `onValueChange`.

```tsx
function MyComponent() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <StandardDatePicker
      label="Fecha de Evento"
      value={date}
      onValueChange={setDate}
      colorScheme="secondary"
    />
  );
}
```

---

## Props del Componente (`StandardDatePickerProps`)

| Prop           | Tipo                               | Por Defecto | Descripción                                                                   |
|----------------|------------------------------------|-------------|-------------------------------------------------------------------------------|
| `value`        | `Date`                             | `undefined` | **(Controlado)** La fecha actualmente seleccionada.                           |
| `onValueChange`| `(date: Date | undefined) => void` | `undefined` | **(Controlado)** Callback que se ejecuta cuando la fecha cambia.              |
| `defaultValue` | `Date`                             | `undefined` | **(No Controlado)** La fecha seleccionada por defecto.                        |
| `label`        | `string`                           | `undefined` | El texto que se muestra como etiqueta del campo de entrada.                   |
| `error`        | `string`                           | `undefined` | Muestra un mensaje de error y aplica estilos de validación fallida.         |
| `colorScheme`  | `ColorSchemeVariant`               | `'primary'` | Define la paleta de colores a usar para el calendario y el input en estado `focus`. |
| `size`         | `'sm'` \| `'md'` \| `'lg'`           | `'md'`      | Controla el tamaño del `StandardInput` interno.                               |
| `disabled`     | `boolean`                          | `false`     | Si es `true`, deshabilita la interacción con el componente.                   |

*Nota: Todas las demás `props` de `React.InputHTMLAttributes<HTMLInputElement>` (omitidas las conflictivas) son aceptadas y se pasan al `StandardInput`.*

---

## Sistema de Tokens (`generateStandardDatePickerTokens`)

La apariencia del calendario emergente se controla a través de un generador de tokens. Este sistema asegura que el estilo sea consistente y se adapte al tema global de la aplicación (modos claro y oscuro).

### Argumentos del Generador (`StandardDatePickerTokenArgs`)

- `colorScheme`: La paleta de colores a aplicar a los elementos interactivos.
- `size`: El tamaño para los elementos del calendario.

### Tokens Generados (`StandardDatePickerTokens`)

El generador produce un objeto con clases de Tailwind para las diferentes partes del calendario:

- `popoverContent`: Estilos para el contenedor del popover (fondo, borde, sombra).
- `caption_label`: Estilo para el título del mes.
- `nav_button`: Estilos para los botones de navegación de mes.
- `head_cell`: Estilo para los nombres de los días de la semana.
- `day`: Estilos base para cada día en el calendario.
- `day_selected`: Estilos para el día que ha sido seleccionado.
- `day_today`: Estilo para el día actual.
- `day_outside`: Estilo para los días que pertenecen al mes anterior o siguiente.
- `day_disabled`: Estilo para los días que no se pueden seleccionar.

Este enfoque permite que la lógica del componente (`.tsx`) se mantenga limpia y separada de las definiciones de estilo, que residen en `lib/theme/components/standard-datepicker-tokens.ts`.