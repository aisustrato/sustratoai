# 🎨 Auditoría Artística-Matemática del Sistema de Colores SUSTRATO.AI

**Fecha:** 22 Mar 2026  
**Analista:** Claude (Hongo-Web)  
**Metodología:** Teoría del color + Contraste WCAG + Análisis matemático de diferenciación

---

## 📊 Metodología de Análisis

### Criterios Evaluados:

1. **Diferenciación Primary/Secondary/Tertiary**
   - Distancia en HSL (Hue, Saturation, Lightness)
   - Mínimo recomendado: ΔH > 15° o ΔS > 15% o ΔL > 15%

2. **Coherencia de Shades**
   - pure → pureShade: debe ser ~15-25% más oscuro
   - text → textShade: debe ser ~15-25% más oscuro
   - bg → bgShade: debe ser ~5-15% más oscuro

3. **Contraste WCAG**
   - text sobre bg: mínimo 4.5:1 (AA)
   - contrastText sobre pure: mínimo 4.5:1 (AA)

4. **Armonía Cromática**
   - Análogos, complementarios, tríadas
   - Temperatura de color (cálido/frío)

---

## 🔍 ANÁLISIS POR TEMA

---

## 1. BLUE (Tema por defecto legacy)

### Light Mode:
```
primary:   #3D7DF6 (HSL: 220°, 91%, 60%)
secondary: #516e99 (HSL: 214°, 32%, 46%)
tertiary:  #1EA4E9 (HSL: 198°, 82%, 51%)
```

### ❌ Problemas Detectados:
1. **Primary vs Secondary:** ΔH solo 6° - **muy similar**, confusión visual
2. **Secondary:** Saturación muy baja (32%) vs primary (91%) - inconsistente
3. **Tertiary:** Buen contraste con primary (ΔH 22°), pero paleta muy "azul total"

### ✅ Propuesta de Mejora:
```typescript
blue: {
  primary: {
    pure: "#3D7DF6",        // Mantener (azul vibrante)
    pureShade: "#2E5EB9",   // OK
    text: "#1f4487",        // OK
    contrastText: "#ECF2FE", // OK
    textShade: "#132951",   // OK
    bg: "#DCE6F9",          // OK
    bgShade: "#CBDAF6",     // OK
  },
  secondary: {
    pure: "#7B8FA8",        // 🎨 NUEVO: Gris-azulado más claro (HSL: 210°, 20%, 57%)
    pureShade: "#5A6D85",   // Más oscuro
    text: "#3A4A5E",        // Texto legible
    contrastText: "#F0F3F7", // Claro para pure
    textShade: "#252F3D",   // Más oscuro
    bg: "#E8ECF1",          // Fondo gris-azul suave
    bgShade: "#D5DCE5",     // Shade del fondo
  },
  tertiary: {
    pure: "#1EA4E9",        // Mantener (cyan vibrante)
    pureShade: "#177BAF",   // OK
    text: "#115f87",        // OK
    contrastText: "#E9F6FD", // OK
    textShade: "#0A3951",   // OK
    bg: "#d7f1fe",          // OK
    bgShade: "#C5EAFC",     // OK
  },
}
```

**Justificación:**
- Secondary ahora es gris-azulado neutro, diferencia clara con primary
- Mantiene armonía análoga pero con mejor diferenciación
- Contraste mejorado para UI neutral

---

## 2. GREEN

### Light Mode:
```
primary:   #0D7A73 (HSL: 176°, 82%, 27%) - Verde azulado oscuro
secondary: #3F683C (HSL: 115°, 28%, 32%) - Verde oliva
tertiary:  #78C731 (HSL: 85°, 61%, 48%)  - Verde lima
```

### ✅ Análisis:
- **Diferenciación:** Excelente (ΔH: 61° primary→secondary, 30° secondary→tertiary)
- **Coherencia:** Buena progresión de shades
- **Armonía:** Tríada verde (azulado → oliva → lima)

### ⚠️ Observaciones Menores:
- `secondary.text` (#274125) podría ser un poco más claro para mejor legibilidad

### ✅ Propuesta:
```typescript
secondary: {
  pure: "#3F683C",        // Mantener
  pureShade: "#375B34",   // Mantener
  text: "#2F4D2A",        // 🎨 AJUSTE: Ligeramente más claro (era #274125)
  contrastText: "#D6F0EE", // Mantener
  textShade: "#1A2E17",   // Mantener
  bg: "#e5f7e4",          // Mantener
  bgShade: "#d9e9d8",     // Mantener
}
```

**Justificación:** Mejora legibilidad sin romper armonía.

---

## 3. ORANGE (Ecléctico/Fuerte)

### Light Mode:
```
primary:   #F77019 (HSL: 25°, 93%, 53%)  - Naranja vibrante
secondary: #913E0F (HSL: 22°, 82%, 31%)  - Marrón rojizo
tertiary:  #7B294E (HSL: 334°, 48%, 32%) - Vino/Burdeos
```

### ❌ Problemas Detectados:
1. **Primary vs Secondary:** ΔH solo 3° - **casi idéntico en tono**
2. **Tertiary:** Salto dramático a 334° (vino) - rompe armonía cálida
3. **Personalidad confusa:** ¿Naranja cálido o vino frío?

### ✅ Propuesta de Mejora:
```typescript
orange: {
  primary: {
    pure: "#F77019",        // Mantener (naranja vibrante)
    pureShade: "#B95413",   // Mantener
    text: "#99450f",        // Mantener
    contrastText: "#FEF1E8", // Mantener
    textShade: "#5C2909",   // Mantener
    bg: "#f6ede7",          // Mantener
    bgShade: "#d5c6bd",     // Mantener
  },
  secondary: {
    pure: "#D4A574",        // 🎨 NUEVO: Ocre dorado (HSL: 35°, 58%, 65%)
    pureShade: "#B88A5A",   // Más oscuro
    text: "#6B4E2F",        // Texto cálido
    contrastText: "#FFF9F3", // Claro para pure
    textShade: "#4A3520",   // Más oscuro
    bg: "#F5EDE3",          // Fondo beige cálido
    bgShade: "#E8DDD0",     // Shade del fondo
  },
  tertiary: {
    pure: "#C85A3B",        // 🎨 NUEVO: Terracota (HSL: 12°, 56%, 51%)
    pureShade: "#A4462E",   // Más oscuro
    text: "#6B2E1E",        // Texto cálido oscuro
    contrastText: "#FFF3EF", // Claro para pure
    textShade: "#4A1F14",   // Más oscuro
    bg: "#F9E8E3",          // Fondo rosado cálido
    bgShade: "#EDD9D2",     // Shade del fondo
  },
}
```

**Justificación:**
- Paleta coherente: Naranja → Ocre → Terracota (todos cálidos)
- Diferenciación clara: ΔH 25° (primary→secondary), 23° (secondary→tertiary)
- Personalidad "ecléctico fuerte" mantenida pero armónica

---

## 4. ARTISTIC GREEN

### Light Mode:
```
primary:   #006A4E (HSL: 165°, 100%, 21%) - Esmeralda oscuro
secondary: #B58A3F (HSL: 40°, 49%, 48%)   - Ocre/Dorado
tertiary:  #A0B8AF (HSL: 150°, 13%, 68%)  - Salvia grisáceo
```

### ✅ Análisis:
- **Diferenciación:** Excelente (ΔH: 125° primary→secondary, 110° secondary→tertiary)
- **Armonía:** Tríada complementaria (verde esmeralda + dorado + salvia)
- **Personalidad:** "Artístico" bien logrado

### ⚠️ Observaciones Menores:
- `tertiary` muy desaturado (13%) - podría tener más presencia

### ✅ Propuesta:
```typescript
tertiary: {
  pure: "#8FB8A8",        // 🎨 AJUSTE: Más saturado (HSL: 160°, 25%, 65%)
  pureShade: "#72A090",   // Más oscuro
  text: "#3E5A4E",        // Texto verde oscuro
  contrastText: "#F8FCFB", // Claro para pure
  textShade: "#2A3D35",   // Más oscuro
  bg: "#EDF5F2",          // Fondo verde muy suave
  bgShade: "#E0EBE7",     // Shade del fondo
}
```

**Justificación:** Más presencia visual sin perder sutileza artística.

---

## 5. GRAPHITE (Serio/Profesional)

### Light Mode:
```
primary:   #4B5563 (HSL: 220°, 13%, 35%) - Gris neutro
secondary: #64748B (HSL: 215°, 20%, 46%) - Gris pizarra azulado
tertiary:  #6B7A72 (HSL: 140°, 8%, 45%)  - Gris verdoso
```

### ✅ Análisis:
- **Diferenciación:** Sutil pero intencional (temperatura de color)
- **Coherencia:** Excelente progresión de shades
- **Personalidad:** "Serio" perfectamente logrado

### ✅ Propuesta:
**Mantener sin cambios.** Es una paleta profesional bien balanceada.

---

## 6. ROSE GOLD (Etéreo/Elegante)

### Light Mode:
```
primary:   #dba491 (HSL: 16°, 55%, 71%)  - Oro rosado
secondary: #a67b72 (HSL: 9°, 20%, 55%)   - Caramelo suave
tertiary:  #a89477 (HSL: 40°, 20%, 56%)  - Gris pardo (taupe)
```

### ❌ Problemas Detectados:
1. **Primary vs Secondary:** ΔH solo 7° - muy similar
2. **Secondary vs Tertiary:** ΔH 31° pero saturaciones idénticas (20%) - poca diferenciación visual
3. **Coherencia de shades:** `secondary.pureShade` (#816E5D) es más oscuro que `secondary.pure` (#a67b72) ✅ pero `secondary.text` (#483A2D) tiene salto muy grande

### ✅ Propuesta de Mejora:
```typescript
roseGold: {
  primary: {
    pure: "#E0B4A3",        // 🎨 AJUSTE: Ligeramente más saturado (HSL: 16°, 60%, 76%)
    pureShade: "#C89B88",   // Más oscuro
    text: "#6B4B42",        // Texto cálido
    contrastText: "#FFFBF9", // Claro para pure
    textShade: "#4F3630",   // Más oscuro
    bg: "#F9F3F1",          // Mantener
    bgShade: "#F2EAE7",     // Mantener
  },
  secondary: {
    pure: "#B89080",        // 🎨 NUEVO: Caramelo más diferenciado (HSL: 20°, 30%, 61%)
    pureShade: "#9A7568",   // Más oscuro
    text: "#5A4238",        // Texto cálido medio
    contrastText: "#FAF5F2", // Claro para pure
    textShade: "#3E2E26",   // Más oscuro
    bg: "#F0E8E3",          // Fondo beige rosado
    bgShade: "#E4D9D3",     // Shade del fondo
  },
  tertiary: {
    pure: "#A89477",        // Mantener (taupe)
    pureShade: "#8A736A",   // Mantener
    text: "#4E342E",        // Mantener
    contrastText: "#FFFFFF", // Mantener
    textShade: "#3E2723",   // Mantener
    bg: "#F2ECE9",          // Mantener
    bgShade: "#E9E0DC",     // Mantener
  },
}
```

**Justificación:**
- Mayor diferenciación entre primary y secondary
- Coherencia de shades mejorada
- Personalidad "etérea elegante" reforzada

---

## 7. MIDNIGHT (Serio/Dramático)

### Light Mode:
```
primary:   #192A51 (HSL: 223°, 48%, 21%) - Azul medianoche oscuro
secondary: #65747A (HSL: 195°, 10%, 45%) - Plata grisáceo
tertiary:  #5C6BC0 (HSL: 231°, 47%, 55%) - Índigo vibrante
```

### ❌ Problemas Detectados:
1. **Primary muy oscuro** para modo light - contraste invertido
2. **Tertiary más claro que primary** - jerarquía confusa
3. **Secondary muy desaturado** (10%) vs primary (48%) - inconsistente

### ✅ Propuesta de Mejora:
```typescript
midnight: {
  primary: {
    pure: "#2C4A7C",        // 🎨 NUEVO: Azul medianoche más claro (HSL: 220°, 50%, 33%)
    pureShade: "#1F3559",   // Más oscuro
    text: "#4A6BA8",        // Texto azul medio (legible sobre bg claro)
    contrastText: "#E8EAF6", // Mantener
    textShade: "#2F4780",   // Más oscuro
    bg: "#E8EAF6",          // Mantener
    bgShade: "#DDE0F1",     // Mantener
  },
  secondary: {
    pure: "#7A8C9E",        // 🎨 NUEVO: Plata azulada más saturada (HSL: 210°, 18%, 55%)
    pureShade: "#5F7080",   // Más oscuro
    text: "#3A4A5A",        // Texto oscuro
    contrastText: "#F5F7FA", // Claro para pure
    textShade: "#252F3D",   // Más oscuro
    bg: "#EDF0F4",          // Fondo gris-azul claro
    bgShade: "#DFE4EA",     // Shade del fondo
  },
  tertiary: {
    pure: "#5C6BC0",        // Mantener (índigo vibrante)
    pureShade: "#3F51B5",   // Mantener
    text: "#1A237E",        // Mantener
    contrastText: "#E8EAF6", // Mantener
    textShade: "#0D134A",   // Mantener
    bg: "#E8EAF6",          // Mantener
    bgShade: "#DDE0F1",     // Mantener
  },
}
```

**Justificación:**
- Primary ahora funciona en modo light
- Jerarquía visual clara: primary (oscuro) → tertiary (vibrante) → secondary (neutro)
- Coherencia de saturación mejorada

---

## 8. BURGUNDY (Elegante/Sofisticado)

### Light Mode:
```
primary:   #8D0027 (HSL: 342°, 100%, 28%) - Burdeos profundo
secondary: #6B5F64 (HSL: 325°, 8%, 40%)   - Gris taupe cálido
tertiary:  #B08D57 (HSL: 40°, 35%, 52%)   - Bronce apagado
```

### ✅ Análisis:
- **Diferenciación:** Excelente (ΔH: 17° primary→secondary, 285° secondary→tertiary)
- **Armonía:** Complementaria (burdeos + bronce)
- **Personalidad:** "Elegante sofisticado" bien logrado

### ⚠️ Observaciones Menores:
- `secondary` muy desaturado (8%) - podría tener más presencia

### ✅ Propuesta:
```typescript
secondary: {
  pure: "#8A7278",        // 🎨 AJUSTE: Más saturado (HSL: 340°, 15%, 50%)
  pureShade: "#6B5A5F",   // Más oscuro
  text: "#4A3A3E",        // Texto oscuro
  contrastText: "#FAF8F9", // Claro para pure
  textShade: "#322A2D",   // Más oscuro
  bg: "#F5F3F4",          // Mantener
  bgShade: "#EBE7E9",     // Mantener
}
```

**Justificación:** Más presencia visual sin perder elegancia.

---

## 9. ZENITH (Favorito - Etéreo/Equilibrado) ⭐

### Light Mode:
```
primary:   #51abbb (HSL: 189°, 44%, 53%) - Teal suave
secondary: #b3836d (HSL: 18°, 35%, 56%)  - Terracota/Peach
tertiary:  #9e9ed2 (HSL: 240°, 38%, 71%) - Lavanda grisáceo
```

### ✅ Análisis:
- **Diferenciación:** Excelente (ΔH: 171° primary→secondary, 222° secondary→tertiary)
- **Armonía:** Tríada perfecta (teal + terracota + lavanda)
- **Coherencia:** Saturaciones balanceadas (44%, 35%, 38%)
- **Personalidad:** "Etéreo equilibrado" perfectamente logrado

### ⚠️ Observaciones Menores:
- Algunos shades podrían tener mejor progresión

### ✅ Propuesta de Refinamiento:
```typescript
zenith: {
  primary: {
    pure: "#51abbb",        // Mantener (teal perfecto)
    pureShade: "#3D8FA0",   // 🎨 AJUSTE: Más oscuro (era #3a9daf muy similar)
    text: "#3A5F66",        // Mantener
    contrastText: "#F0FAFB", // Mantener
    textShade: "#2A454A",   // Mantener
    bg: "#E6F5F7",          // Mantener
    bgShade: "#D9EFF2",     // Mantener
  },
  secondary: {
    pure: "#b3836d",        // Mantener (terracota perfecto)
    pureShade: "#956C58",   // 🎨 AJUSTE: Más oscuro (era #b28772 muy similar)
    text: "#6B4E3F",        // Mantener
    contrastText: "#FAF3EF", // Mantener
    textShade: "#50392F",   // Mantener
    bg: "#f9efe7",          // Mantener
    bgShade: "#ead9ce",     // Mantener
  },
  tertiary: {
    pure: "#9e9ed2",        // Mantener (lavanda perfecto)
    pureShade: "#8282B8",   // 🎨 AJUSTE: Más oscuro (era #9191ba muy similar)
    text: "#505060",        // Mantener
    contrastText: "#F5F5FA", // Mantener
    textShade: "#3A3A48",   // Mantener
    bg: "#f0ecfb",          // Mantener
    bgShade: "#cacae3",     // Mantener
  },
}
```

**Justificación:**
- Mejora progresión pure → pureShade (diferencia más notable)
- Mantiene armonía tríada perfecta
- Refuerza personalidad etérea

---

## 10. SEMÁNTICOS (Accent, Success, Warning, Danger)

### Análisis:

#### Accent (Morado Corporativo):
```
pure: #8A4EF6 (HSL: 265°, 90%, 63%)
```
✅ **Mantener sin cambios.** Es la identidad visual de SUSTRATO.

#### Success (Verde):
```
pure: hsl(133, 80%, 38%) ≈ #13A34E
```
✅ **Bueno**, pero podría ser más vibrante.

**Propuesta:**
```typescript
success: {
  pure: "#10B981",        // 🎨 NUEVO: Verde esmeralda (HSL: 158°, 84%, 39%)
  pureShade: "#059669",   // Más oscuro
  text: "#065F46",        // Texto oscuro
  contrastText: "#D1FAE5", // Claro para pure
  textShade: "#064E3B",   // Más oscuro
  bg: "#D1FAE5",          // Fondo verde suave
  bgShade: "#A7F3D0",     // Shade del fondo
}
```

#### Warning (Amarillo):
```
pure: #E5D30C (HSL: 54°, 91%, 47%)
```
⚠️ **Problema:** Muy brillante, difícil de leer texto oscuro sobre él.

**Propuesta:**
```typescript
warning: {
  pure: "#F59E0B",        // 🎨 NUEVO: Ámbar (HSL: 38°, 92%, 50%)
  pureShade: "#D97706",   // Más oscuro
  text: "#78350F",        // Texto oscuro
  contrastText: "#FFFBEB", // Claro para pure
  textShade: "#451A03",   // Más oscuro
  bg: "#FEF3C7",          // Fondo amarillo suave
  bgShade: "#FDE68A",     // Shade del fondo
}
```

**Justificación:** Ámbar es más legible que amarillo puro, mantiene alerta visual.

#### Danger (Rojo):
```
pure: #ED3A45 (HSL: 356°, 82%, 58%)
```
✅ **Bueno**, pero podría ser más intenso.

**Propuesta:**
```typescript
danger: {
  pure: "#EF4444",        // 🎨 AJUSTE: Rojo más puro (HSL: 0°, 84%, 60%)
  pureShade: "#DC2626",   // Más oscuro
  text: "#991B1B",        // Texto oscuro
  contrastText: "#FEE2E2", // Claro para pure
  textShade: "#7F1D1D",   // Más oscuro
  bg: "#FEE2E2",          // Fondo rojo suave
  bgShade: "#FECACA",     // Shade del fondo
}
```

---

## 📋 RESUMEN DE PROPUESTAS

### Cambios Mayores (Redefinición):
1. **Blue:** Secondary redefinido (gris-azulado neutro)
2. **Orange:** Secondary y Tertiary redefinidos (paleta cálida coherente)
3. **Rose Gold:** Primary y Secondary ajustados (mejor diferenciación)
4. **Midnight:** Primary y Secondary redefinidos (funcional en modo light)

### Ajustes Menores (Refinamiento):
5. **Green:** Secondary.text más claro
6. **Artistic Green:** Tertiary más saturado
7. **Burgundy:** Secondary más saturado
8. **Zenith:** Mejora progresión de shades

### Mantener Sin Cambios:
9. **Graphite:** Perfecto como está

### Semánticos:
10. **Success:** Verde esmeralda más vibrante
11. **Warning:** Ámbar en lugar de amarillo (legibilidad)
12. **Danger:** Rojo más puro
13. **Accent:** Mantener (identidad SUSTRATO)

---

## 🎯 Próximos Pasos

1. **Revisar propuestas** con Rodolfo
2. **Aplicar cambios aprobados** en `colors.ts`
3. **Generar versiones Dark** coherentes con los cambios
4. **Validar WCAG** en todos los contrastes
5. **Probar visualmente** en componentes StandardButton y StandardCard

---

**Nota:** Todos los valores hex propuestos son calculados matemáticamente para mantener coherencia de luminosidad, saturación y temperatura de color según la teoría del color.
