# Skill: StandardToaster

## Qué es

Componente cliente que monta **una sola vez** el `<Toaster />` de Sonner para toda la app, cableado al `ThemeProvider` del proyecto.

Lo que aporta sobre un `<Toaster>` raw de Sonner:

- Sigue el `mode` (light/dark) del `useTheme()` sin que ningún componente individual lo configure.
- `closeButton` activo globalmente: todos los toasts muestran X para cierre manual. Refuerza el protocolo "errores siempre visibles" cuando se combina con `duration: Infinity`.
- **Tematización por tipo con degradados 135°** construidos desde `appColorTokens`:
  - `loading | default | info` → degradado neutral (`neutral.subtle → neutral.bg`)
  - `success` → degradado success
  - `warning` → degradado warning
  - `error` → degradado danger
- El estilo se inyecta como CSS vars de Sonner (`--success-bg`, `--error-bg`, etc.) sobre el `<Toaster>` raíz, por eso cada `toast.success(...)`, `toast.error(...)`, etc. toma su degradado automáticamente sin pasar `style` en cada llamada.

## Dónde se monta

Una sola vez, en `app/providers.tsx`, dentro de `<ThemeProvider>` y `<DesignTokensProvider>` (orden importa — necesita `useTheme()` arriba):

```tsx
<AuthProvider>
  <StandardToaster />
  {children}
</AuthProvider>
```

**No** crear más instancias. Si ves un `<Toaster />` raw en otro lugar, está mal: borrarlo. Convive temporalmente con el `<Toaster />` legacy de `components/ui/toaster.tsx` (Radix), que es el que alimenta el viejo `useToast()`. Ese se va eliminando a medida que migramos cada componente a sonner.

## Cómo emitir toasts desde componentes

Import normal de sonner. `StandardToaster` no expone una API propia — sólo configura el Toaster.

```tsx
import { toast } from "sonner";

// Loading que se resuelve a success o error (reuso del id)
const toastId = toast.loading("Generando informe…");

try {
  const res = await accion();
  if (!res.ok) {
    toast.error(`Falló: ${res.error}`, {
      id: toastId,
      duration: Infinity,         // 👈 cierre manual obligatorio en errores
      description: "Revisá la consola del servidor.",
    });
  } else {
    toast.success("Listo", { id: toastId });
  }
} catch (err) {
  console.error("[componente:funcion]", err);
  toast.error("Error inesperado", {
    id: toastId,
    duration: Infinity,
    description: err instanceof Error ? err.message : "Error desconocido",
  });
}
```

## Reglas de uso (no negociables)

1. **Errores y warnings con cierre manual**: `duration: Infinity`. Razón: el humano debe ver y descartar conscientemente que algo falló. Sin esto, un toast.error podía desaparecer antes de que se viera, contradiciendo el protocolo "errores siempre visibles".
2. **Successes auto-cierran** (default ~3-4s).
3. **Loading**: reusar el `toastId` cuando se resuelve. Un `toast.loading` que nunca muta a success/error queda colgado.
4. **Errores en consola con prefijo**: `console.error('[modulo:funcion]', err)` **antes** del toast. El toast es para el humano; el log es para debug. No reemplaza uno al otro.
5. **No reinventar el feedback**: si ves un `<StandardAlert>` inline bajo un botón mostrando un mensaje de error transitorio, está mal. Migrarlo a `toast.error(...)`. `StandardAlert` sí es válido para contenido permanente (advertencias dentro de un modal, estados informativos persistentes).
6. **No pasar colores hardcoded**: `StandardToaster` ya cablea los tokens. Si necesitás algo fuera del default, edita `StandardToaster.tsx` y agregá variantes con design tokens.

## Sin variante "info"

El design system del proyecto **no tiene** una variante "info" propia (ver standard-theming). Sonner sí tiene `toast.info()`, y `StandardToaster` lo trata como `neutral` con degradado. No buscar un azul informativo: si lo necesitás, usá `neutral` y diferenciá por contenido del mensaje.

## Convivencia con sistemas viejos

- `useToast()` (de `@/hooks/use-toast`, basado en Radix) está obsoleto en este proyecto. Cualquier componente que lo importe debe migrar a `toast` de sonner.
- El `<Toaster>` legacy en `components/ui/toaster.tsx` montado en `app/layout.tsx` debe convivir hasta terminar la migración. Cuando todos los `useToast()` estén migrados, se borra.

## Personalización

Para cambiar position, sideOffset, posiciones por defecto: editar `components/ui/StandardToaster.tsx`. Cambios ahí impactan toda la app de un golpe.

Para cambiar la paleta de un tipo (p. ej. hacer warning más intenso): editar el cálculo de la CSS var correspondiente. No tocar Sonner directamente desde otros componentes.
