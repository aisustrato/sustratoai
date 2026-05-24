# Skill: StandardStepper

## Qué es

Stepper de pasos secuenciales con burbujas numeradas, conectores animados, soporte para estados (pending/active/completed/error), orientación horizontal y vertical, y animación de respiración en el paso activo. Usa `StandardProgressBar` como conector en orientación horizontal.

### 🧠 Comportamiento del conector (StandardProgressBar)

El ProgressBar que conecta los nodos se comporta según la **posición** Y el **estado** del paso:

| Condición | ProgressBar |
|-----------|-------------|
| **Paso completado** (`index < currentStepIndex`) | Verde sólido al 100% |
| **Paso actual + activo** (`index === currentStepIndex` Y `status: "active"`) | **Indeterminado** — barra deslizándose infinitamente |
| **Paso actual, sin activar** (`index === currentStepIndex` pero `status: "pending"`) | Vacío al 0% — solo se ve el track |
| **Paso pendiente** (`index > currentStepIndex`) | Neutro al 0% |

El conector es indeterminado SOLO cuando el paso es el actual **Y** tiene `status: "active"`. Si el paso es el actual pero aún no se ha activado (status `"pending"`), el conector se ve vacío.

### ⚡ Animaciones del paso actual (requieren `status: "active"`)

Para activar el **spinner giratorio** (Loader2) y la **animación de respiración** (stepper-breathe) EN la burbuja del paso activo, el step debe tener `status: "active"` explícitamente. Las animaciones del conector (indeterminate) sí funcionan solo por posición.

Si estás simulando pasos dinámicamente, debes asignar `status: "active"` al paso actual, `"completed"` a los anteriores y `"pending"` a los siguientes para que las animaciones de burbuja se activen.

## Import

```tsx
import { StandardStepper } from "@/components/ui/StandardStepper"
import type { StepItem, StepStatus } from "@/components/ui/StandardStepper"
```

## Props disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `steps` | `StepItem[]` | — | Array de pasos del stepper (requerido) |
| `currentStepIndex` | `number` | — | Índice 0-based del paso actual (requerido) |
| `variant` | `"primary" \| "secondary" \| "accent" \| "neutral"` | `"primary"` | Variante de color del stepper |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Orientación del stepper |
| `className` | `string` | — | Clases adicionales |
| `onStepClick` | `(index: number) => void` | — | Callback al hacer clic en un paso completado |

### StepItem shape

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `id` | `string \| number` | — | Identificador único del paso |
| `label` | `string` | — | Texto visible del paso |
| `description` | `string` | — | Descripción secundaria (opcional) |
| `icon` | `React.ElementType` | — | Icono personalizado (opcional) |
| `status` | `"pending" \| "active" \| "completed" \| "error"` | `"pending"` | Estado individual del paso (opcional) |

## Uso correcto

```tsx
// ✅ Básico con 3 pasos
const pasos = [
  { id: 1, label: "Paso 1" },
  { id: 2, label: "Paso 2" },
  { id: 3, label: "Paso 3" },
];

<StandardStepper
  steps={pasos}
  currentStepIndex={0}
/>

// ✅ Con íconos, descripciones y variant
const pasosConIconos = [
  { id: "subir", label: "Subir archivo", description: "Selecciona el documento", icon: Upload },
  { id: "procesar", label: "Procesar", description: "Analizando contenido", icon: Loader2 },
  { id: "listo", label: "Resultado", description: "Documento listo", icon: Check },
];

<StandardStepper
  steps={pasosConIconos}
  currentStepIndex={1}
  variant="accent"
  orientation="horizontal"
/>

// ✅ Con estado activo (paso en proceso)
const pasosActivo = [
  { id: 1, label: "Inicio", status: "completed" },
  { id: 2, label: "Procesando", description: "Generando artefacto…", status: "active" },
  { id: 3, label: "Final", status: "pending" },
];

<StandardStepper
  steps={pasosActivo}
  currentStepIndex={1}
  variant="primary"
/>

// ✅ Con paso completado
<StandardStepper
  steps={[
    { id: "a", label: "Setup", status: "completed" },
    { id: "b", label: "Build", status: "completed" },
    { id: "c", label: "Deploy", status: "pending" },
  ]}
  currentStepIndex={2}
  variant="secondary"
/>

// ✅ Con paso en error
<StandardStepper
  steps={[
    { id: "a", label: "Validar", status: "completed" },
    { id: "b", label: "Compilar", status: "error", description: "Error de sintaxis" },
    { id: "c", label: "Publicar", status: "pending" },
  ]}
  currentStepIndex={1}
  onStepClick={(index) => console.log("Volver al paso", index)}
/>

// ✅ Orientación vertical
<StandardStepper
  steps={pasos}
  currentStepIndex={2}
  orientation="vertical"
/>

// ✅ Simulación dinámica — asignar status según índice para activar animaciones
const stepsConStatusDinamico: StepItem[] = pasos.map((step, i) => ({
  ...step,
  status: i < currentStepIndex ? "completed"
        : i === currentStepIndex ? "active"
        : "pending",
}));

<StandardStepper
  steps={stepsConStatusDinamico}
  currentStepIndex={currentStepIndex}
  variant="primary"
/>
```

## Errores comunes — PROHIBIDO hacer esto

```tsx
// ❌ No usar Tailwind inline sobre el stepper
<StandardStepper className="bg-red-500 text-white" />

// ❌ No implementar tu propio stepper con divs y lógica manual
// Usa StandardStepper con su sistema de estados y conectores animados

// ❌ No cambiar colores con className — usa la prop variant
<StandardStepper
  steps={pasos}
  currentStepIndex={0}
  className="[&_.burbuja]:bg-purple-500 [&_.linea]:border-purple-300"
/>

// ❌ No pasar animated={false} — mata la animación indeterminate del conector
// El ProgressBar interno necesita animated=true para que la clase CSS se active
<StandardStepper animated={false} />
```

## Cuándo NO usar este componente

- Para progreso lineal simple con un solo porcentaje: usa `StandardProgressBar`.
- Para indicar progreso de carga sin pasos definidos: usa `StandardProgressBar` en modo indeterminado.
- Para flujos de más de 7-8 pasos: considera agrupar lógicamente o usar otro patrón de navegación.

## Si necesitas una variante que no existe

No la implementes inline. Sigue este patrón:
1. Usa la variante más cercana disponible por ahora
2. Al terminar tu tarea, reporta como deuda técnica:
   `⚠ Deuda técnica: StandardStepper necesita variant "warning"`
