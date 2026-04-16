# Fix Crítico: StandardDialog - Problema de Tamaño Estrecho Recurrente

## 🚨 Problema Identificado

El componente `StandardDialog` tenía un problema recurrente donde los dialogs aparecían más estrechos de lo esperado, especialmente cuando se solicitaban tamaños grandes como `full`.

### Síntomas
- Dialog aparece estrecho (~448px) en lugar de ocupar 95% del viewport
- El prop `size="full"` no funcionaba
- Otros componentes parecían "compartir" CSS que forzaba el tamaño pequeño

## 🔍 Causa Raíz

**Archivo:** `/components/ui/StandardDialog.tsx`

### Problema 1: Tamaño hardcoded
```typescript
// ❌ ANTES (línea 82):
className={cn(
  "dialog-modal ... max-w-md ...",  // ← max-w-md HARDCODED
  { "max-w-sm": size === 'sm', ... }
)}
```

El componente tenía `max-w-md` hardcoded en la clase base, lo que significaba que **SIEMPRE** aplicaba `max-w-md` (448px) independientemente del tamaño solicitado.

### Problema 2: Tamaños limitados
```typescript
// ❌ ANTES:
size?: 'sm' | 'md' | 'lg' | 'xl'  // Solo 4 tamaños
```

No existían tamaños más grandes como `2xl`, `3xl`, `4xl`, `5xl`, o `full`.

## ✅ Solución Implementada

### 1. Eliminación del tamaño hardcoded
```typescript
// ✅ DESPUÉS (línea 89):
className={cn(
  "dialog-modal ... min-w-[320px] ...",  // ← SIN max-w-md hardcoded
  {
    "max-w-sm max-h-[80vh]": size === 'sm',
    "max-w-md max-h-[80vh]": size === 'md',
    // ... más tamaños
  }
)}
```

### 2. Nuevos tamaños agregados
```typescript
// ✅ DESPUÉS:
size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'
```

**Mapeo de tamaños:**
| Size | Max Width | Max Height | Uso Recomendado |
|------|-----------|------------|-----------------|
| `sm` | `max-w-sm` (384px) | 80vh | Confirmaciones simples |
| `md` | `max-w-md` (448px) | 80vh | Formularios pequeños |
| `lg` | `max-w-lg` (512px) | 85vh | Formularios medianos |
| `xl` | `max-w-xl` (576px) | 85vh | Formularios grandes |
| `2xl` | `max-w-2xl` (672px) | 90vh | Contenido extenso |
| `3xl` | `max-w-3xl` (768px) | 90vh | Tablas pequeñas |
| `4xl` | `max-w-4xl` (896px) | 92vh | Tablas medianas |
| `5xl` | `max-w-5xl` (1024px) | 92vh | Tablas grandes |
| `full` | `w-[95vw]` | 95vh | **Editores de texto, vistas complejas** |

### 3. Logs de diagnóstico
```typescript
// ✅ Logs agregados en StandardDialog.tsx (líneas 48-52):
React.useEffect(() => {
  console.log('📐 [StandardDialog] Tamaño solicitado:', size);
  console.log('📐 [StandardDialog] Viewport width:', window.innerWidth);
  console.log('📐 [StandardDialog] Viewport height:', window.innerHeight);
}, [size]);
```

### 4. Logs de verificación en componentes consumidores
```typescript
// ✅ Ejemplo en DistilledEssayPanel.tsx (líneas 57-106):
useEffect(() => {
  if (showEditDialog) {
    // Logs detallados del viewport
    // Medición del tamaño real del dialog
    // Verificación de clases CSS aplicadas
    // Detección de interferencias
  }
}, [showEditDialog]);
```

## 🧪 Verificación

### Cómo verificar que el fix funciona:

1. **Abrir consola del navegador**
2. **Abrir un dialog con `size="full"`**
3. **Verificar logs:**
   ```
   📐 [StandardDialog] Tamaño solicitado: full
   📐 [StandardDialog] Viewport width: 1920
   📐 [StandardDialog] Viewport height: 1080
   🔍 [Component] Dialog renderizado: {
     width: 1824,  // ← Debe ser ~95% del viewport
     percentageOfViewportWidth: "95.0%",  // ← Debe ser 95%
     ...
   }
   🔍 [Component] ¿Tiene clase w-[95vw]?: true  // ← Debe ser true
   ```

4. **Si aparece error:**
   ```
   ❌ ERROR: La clase w-[95vw] NO se aplicó
   ```
   → El problema persiste, revisar conflictos CSS

## 🎯 Caso de Uso: Editor Manual de Ensayos

**Archivo:** `/app/cognetica/[id]/components/DistilledEssayPanel.tsx`

```tsx
<StandardDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
  <StandardDialog.Content size="full" colorScheme="accent">
    {/* Editor de texto con StandardNote */}
  </StandardDialog.Content>
</StandardDialog>
```

**Resultado esperado:**
- Dialog ocupa 95% del ancho del viewport (ej: 1824px en pantalla de 1920px)
- Dialog ocupa 95% del alto del viewport (ej: 1026px en pantalla de 1080px)
- Usuario tiene espacio cómodo para editar ensayos largos

## 📁 Archivos Modificados

1. `/components/ui/StandardDialog.tsx`
   - Líneas 38: Tipo `size` expandido
   - Líneas 48-52: Logs de diagnóstico
   - Líneas 89-102: Eliminación de hardcode + nuevos tamaños

2. `/app/cognetica/[id]/components/DistilledEssayPanel.tsx`
   - Líneas 57-106: Logs de verificación detallados
   - Línea 743: Uso de `size="full"`

## 🔄 Historial del Problema

Este problema ha sido recurrente en el proyecto. Documentación creada el **5 de marzo de 2026** para evitar que se repita.

### Intentos previos fallidos:
1. ❌ Cambiar solo el prop `size` sin modificar el componente
2. ❌ Agregar clases CSS inline sin eliminar el hardcode
3. ❌ Usar `className` override (el hardcode tenía prioridad)

### Solución definitiva:
✅ Modificar el componente base `StandardDialog.tsx` para eliminar el hardcode y agregar soporte para tamaños grandes.

## 💡 Lecciones Aprendidas

1. **Siempre revisar el componente base** cuando un prop no funciona como se espera
2. **Buscar valores hardcoded** en las clases CSS base
3. **Agregar logs de diagnóstico** para facilitar debugging futuro
4. **Documentar problemas recurrentes** para evitar repetir el mismo trabajo

## 🚀 Próximos Pasos

Si el problema persiste después de este fix:

1. Verificar que no hay CSS global que override los estilos
2. Buscar otros dialogs en el DOM que puedan interferir
3. Verificar que Tailwind está compilando las clases `w-[95vw]` correctamente
4. Revisar si hay algún wrapper parent que limite el tamaño
