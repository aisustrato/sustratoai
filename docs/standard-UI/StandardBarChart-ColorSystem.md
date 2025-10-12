# StandardBarChart - Sistema de Colores Inteligente

## 🎨 Filosofía del Laboratorio de Color

El componente `StandardBarChart` es **completamente agnóstico** al color. No tiene valores hardcoded. Todo el sistema de colores vive en el archivo de tokens: `/lib/theme/components/nivo-bar-chart-tokens.ts`

Este archivo es el **"Laboratorio de Color"** que hace la magia y decide qué colores usar según el contexto.

---

## 🔍 Dos Modos de Operación

### 1. **Vista Agrupada** (Todas las Dimensiones)

Cuando el usuario ve todas las dimensiones juntas:

```
Dimensión 1 → primary (todas sus barras en rangos de primary)
Dimensión 2 → secondary (todas sus barras en rangos de secondary)
Dimensión 3 → tertiary (todas sus barras en rangos de tertiary)
Dimensión 4 → accent (todas sus barras en rangos de accent)
...y así sucesivamente...
```

**Lógica:**
- Cada dimensión obtiene un `colorScheme` completo (primary, secondary, tertiary, accent, success, warning, danger, neutral)
- Los valores dentro de esa dimensión son **variaciones de tono** de ese colorScheme
- Si hay más dimensiones que esquemas disponibles, se hace **loop** y se reinicia desde primary

**Ejemplo visual:**
```
Dimensión "Foco del estudio" → primary
  ├─ Experimental → primary oscuro
  ├─ Observacional → primary medio
  └─ Teórico → primary claro

Dimensión "Tipo de población" → secondary
  ├─ Adultos → secondary oscuro
  ├─ Niños → secondary medio
  └─ Adolescentes → secondary claro
```

---

### 2. **Vista Detalle** (Una Dimensión Individual)

Cuando el usuario hace drill-down a una dimensión específica:

```
Valor 1 → primary (color puro)
Valor 2 → secondary (color puro)
Valor 3 → tertiary (color puro)
Valor 4 → accent (color puro)
...y así sucesivamente...
```

**Lógica:**
- Cada valor/categoría obtiene un `colorScheme` diferente
- Se usan los colores **puros** de cada esquema
- Si hay más valores que esquemas, se hace **loop**

**Ejemplo visual:**
```
Dimensión "Foco del estudio" (vista detalle):
  ├─ Experimental → primary puro
  ├─ Observacional → secondary puro
  ├─ Teórico → tertiary puro
  └─ Mixto → accent puro
```

---

## 🛠️ Funciones del Laboratorio de Color

### `generateColorVariations(appColorTokens, colorScheme, count)`
Genera un rango de variaciones de un colorScheme específico.

**Estrategia:**
- Crea un gradiente desde **oscuro** → **puro** → **claro**
- Mantiene todos los tonos **vibrantes** (saturación aumentada)
- Ideal para vista agrupada donde una dimensión tiene múltiples valores

### `getGroupedViewColors(dimensionIndex, valuesCount)`
Obtiene el array de colores para una dimensión en vista agrupada.

**Parámetros:**
- `dimensionIndex`: Índice de la dimensión (0, 1, 2...)
- `valuesCount`: Cantidad de valores que tiene esa dimensión

**Retorna:** Array de strings con los colores en formato hex/rgb

### `getDetailViewColor(valueIndex)`
Obtiene el color para un valor específico en vista detalle.

**Parámetros:**
- `valueIndex`: Índice del valor (0, 1, 2...)

**Retorna:** String con el color puro del colorScheme correspondiente

### `generateColorMap(keys, dimensionsData?)`
El orquestador maestro que decide qué colores asignar según el contexto.

**Comportamiento inteligente:**
- Si recibe `dimensionsData`, usa el sistema de vista agrupada
- Si NO recibe `dimensionsData`, usa un fallback simple

---

## 📊 Orden de ColorSchemes

El sistema usa este orden de esquemas (con loop si es necesario):

1. `primary`
2. `secondary`
3. `tertiary`
4. `accent`
5. `success`
6. `warning`
7. `danger`
8. `neutral`

Si hay 10 dimensiones/valores, el sistema asigna:
- 1-8: esquemas en orden
- 9: vuelve a `primary` (loop)
- 10: `secondary` (loop)

---

## 🎯 Ventajas del Sistema

### ✅ **Agnóstico**
El componente no sabe nada de colores. Solo pide y recibe.

### ✅ **Flexible**
Cambiar la lógica de colores es tan simple como editar el archivo de tokens.

### ✅ **Consistente**
Los colores siempre están sincronizados con la paleta del usuario.

### ✅ **Inteligente**
El sistema decide automáticamente qué colores usar según el contexto de visualización.

### ✅ **Escalable**
No importa cuántas dimensiones o valores haya, el sistema siempre tiene un color disponible (con loop).

---

## 🔧 Cómo Personalizar

### Para cambiar el orden de los esquemas:
Edita el array `COLOR_SCHEMES` en `/lib/theme/components/nivo-bar-chart-tokens.ts`:

```typescript
const COLOR_SCHEMES: Array<ColorSchemeVariant> = [
  'accent',     // Ahora accent es primero
  'primary',
  'secondary',
  // ... resto
];
```

### Para cambiar la estrategia de variaciones:
Modifica la función `generateColorVariations()` ajustando:
- Cantidad de oscurecimiento/aclarado: `darkenAmount` / `lightenAmount`
- Nivel de saturación: `.saturate(5)` → `.saturate(10)`
- Distribución del gradiente: ajusta la lógica de `step`

### Para usar lógica personalizada por dimensión:
Extiende el objeto `COMMON_DIMENSION_COLORS` con tus propias reglas:

```typescript
export const COMMON_DIMENSION_COLORS: Record<string, keyof AppColorTokens> = {
  'Mi Dimensión Especial': 'accent', // Siempre usará accent
  // ... resto
};
```

---

## 🎨 Resultado Visual

**Vista Agrupada:**
- Cada columna (dimensión) tiene un color base distinto
- Las barras dentro de cada columna son variaciones del mismo tono
- Fácil identificar dimensiones a simple vista

**Vista Detalle:**
- Cada barra tiene un color completamente diferente
- Máxima diferenciación visual entre valores
- Perfecto para comparar categorías individuales

---

## 📝 Notas Finales

Este sistema sigue la filosofía de los componentes `Standard*`:
- El componente es el **orquestador inteligente** (lógica y comportamiento)
- El archivo de tokens es el **laboratorio de experimentación** (valores y estilos)
- La separación de responsabilidades permite evolucionar cada parte independientemente

El resultado es un sistema de gráficos robusto, flexible y fácil de mantener. 🎉
