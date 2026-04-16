# ✅ BUG RESUELTO: Textos de Leyenda Cortados en Exportación PNG con html2canvas

**Fecha:** 1 Abril 2026  
**Prioridad:** Media  
**Estado:** ✅ **RESUELTO**  
**Componente:** StandardPieChart - Exportación PNG completa  
**Solución:** Callback `onclone` de html2canvas + reemplazo de `truncate` por `break-words`

---

## 📋 Descripción del Problema

Al exportar un gráfico de torta completo (título + gráfico + leyenda) como PNG usando `html2canvas`, **los textos de la leyenda se renderizan cortados**, mostrando solo la parte superior de las letras. El resto del contenido (título, gráfico, números) se exporta correctamente.

### Evidencia Visual

- ✅ **Título**: Se exporta correctamente
- ✅ **Gráfico circular**: Se exporta correctamente
- ✅ **Números en leyenda**: Se exportan correctamente
- ❌ **Textos/labels de leyenda**: Solo se ve la parte superior de las letras

### Ejemplo

En lugar de ver "Sí (foco principal)", solo se ve la mitad superior de las letras, como si el `line-height` o el `height` del contenedor fuera insuficiente.

---

## 🔍 Contexto Técnico

### Archivo Principal

`/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/components/charts/StandardPieChart.tsx`

### Tecnologías Involucradas

- **React** + **TypeScript** + **Next.js**
- **html2canvas** v1.4.1 (importado dinámicamente)
- **@nivo/pie** para el gráfico
- **StandardText** (componente custom con tokens de diseño)

### Estructura del Componente Exportado

```tsx
<div ref={exportContainerRef} className="bg-white p-8 rounded-lg">
  {/* Título */}
  {title && (
    <div className="mb-8 text-center">
      <StandardText size="xl" weight="semibold">
        {title}
      </StandardText>
    </div>
  )}

  {/* Contenedor flex para gráfico y leyenda */}
  <div className="flex items-center justify-center gap-8">
    {/* Gráfico (SVG de @nivo/pie) */}
    <div style={{ height: "350px", width: "450px" }}>
      <ResponsivePie ... />
    </div>

    {/* Leyenda personalizada */}
    <div className="min-w-[280px]">
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            style={{ lineHeight: '1.8' }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50">
            {/* Indicador de color */}
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {/* Emoticon */}
            {item.emoticon && <span className="text-base">{item.emoticon}</span>}
            {/* Label - ESTE ES EL QUE SE CORTA */}
            <div className="flex-1 min-w-0">
              <StandardText size="sm" weight="medium" className="truncate">
                {item.label}
              </StandardText>
            </div>
            {/* Valor y porcentaje */}
            <div className="flex items-baseline gap-1.5">
              <StandardText size="base" weight="bold">{item.value}</StandardText>
              <StandardText size="sm" colorShade="subtle">({percentage}%)</StandardText>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

### Configuración html2canvas

```typescript
import("html2canvas").then((html2canvas) => {
	html2canvas
		.default(containerRef.current!, {
			backgroundColor: withBackground ? "#ffffff" : null,
			scale: 2,
			allowTaint: true,
			logging: false,
		})
		.then((canvas: HTMLCanvasElement) => {
			canvas.toBlob((blob: Blob | null) => {
				// ... guardar imagen
			});
		});
});
```

---

## 🔧 Soluciones Intentadas (SIN ÉXITO)

### 1. Aumentar Padding

```tsx
// De p-6 a p-8
<div ref={exportContainerRef} className="bg-white p-8 rounded-lg">
```

**Resultado:** No resolvió el problema

### 2. Aumentar Line-Height

```tsx
style={{ lineHeight: '1.8' }}
```

**Resultado:** No resolvió el problema

### 3. Aumentar Espaciado entre Items

```tsx
// De space-y-2.5 a space-y-3
<div className="space-y-3">
```

**Resultado:** No resolvió el problema

### 4. Aumentar Padding de Items

```tsx
// De p-2.5 a p-3
className = "flex items-center gap-3 p-3 rounded-lg";
```

**Resultado:** No resolvió el problema

### 5. Aumentar Tamaño de Título

```tsx
// De size="lg" a size="xl"
<StandardText size="xl" weight="semibold">
```

**Resultado:** El título se exporta bien, pero las leyendas siguen cortadas

### 6. Configuración html2canvas

- Probado con `allowTaint: true`
- Probado con `logging: false`
- Probado con `scale: 2`
- Intentado `useFonts: false` (no existe en la API)

**Resultado:** Ninguna configuración resolvió el problema

---

## 🎯 Comportamiento Observado

### En Pantalla (Navegador)

✅ Todo se ve perfectamente: título, gráfico y leyendas con textos completos

### En Exportación PNG

- ✅ Título completo y legible
- ✅ Gráfico circular completo
- ✅ Números (valores y porcentajes) completos
- ❌ **Textos de labels cortados** (solo se ve ~50% superior de cada letra)

---

## 💡 Hipótesis del Problema

### Teoría 1: Problema con Fuentes Custom

`StandardText` usa un sistema de tokens de diseño que podría estar aplicando estilos que html2canvas no captura correctamente.

### Teoría 2: Problema con Flexbox

El layout `flex` podría estar causando que html2canvas calcule incorrectamente la altura de los elementos de texto.

### Teoría 3: Problema con className "truncate"

La clase `truncate` (que aplica `text-overflow: ellipsis`) podría estar interfiriendo con el renderizado de html2canvas.

### Teoría 4: Timing de Renderizado

html2canvas podría estar capturando antes de que las fuentes se carguen completamente.

---

## 🔬 Información Adicional

### StandardText Component

Es un componente wrapper que usa un sistema de tokens de diseño:

```tsx
<StandardText
	size="sm" // Mapea a tamaños específicos
	weight="medium" // Mapea a font-weights
	className="truncate">
	{item.label}
</StandardText>
```

### Tokens de Diseño

El componente consume tokens desde `useDesignTokens()` que aplica estilos dinámicamente basados en tema claro/oscuro.

### Clases Tailwind Involucradas

- `truncate` → `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
- `flex items-center` → Layout flexbox
- `min-w-0` → Permite que flex items se encojan

---

## ❓ Preguntas para Otros Nodos IA

1. **¿Es un problema conocido de html2canvas con componentes React custom?**
2. **¿Hay alguna configuración específica de html2canvas para manejar fuentes custom?**
3. **¿Debería usar una librería alternativa a html2canvas?** (dom-to-image, html-to-image, etc.)
4. **¿Hay alguna forma de forzar a html2canvas a esperar el renderizado completo de fuentes?**
5. **¿El problema podría estar en el uso de `truncate` con flexbox?**
6. **¿Debería aplicar estilos inline en lugar de clases Tailwind para la exportación?**

---

## 🎯 Solución Ideal Buscada

Que al exportar el gráfico completo como PNG:

- Los textos de la leyenda se vean **completos y legibles**
- Se mantenga el diseño actual (no queremos cambiar la estructura)
- Funcione tanto con fondo blanco como transparente

---

## 📁 Archivos Relevantes

1. **Componente principal:**
   `/components/charts/StandardPieChart.tsx` (líneas 83-523)

2. **Componente de texto:**
   `/components/ui/StandardText.tsx`

3. **Sistema de tokens:**
   `/app/providers/DesignTokensProvider.tsx`
   `/lib/theme/ColorToken.ts`

4. **Uso del componente:**
   `/app/articulos/analisis-preclasificacion/components/UniverseVisualization.tsx` (línea 487-493)

---

## 🆘 Solicitud de Ayuda

Si tienes experiencia con:

- html2canvas y problemas de renderizado de texto
- Exportación de componentes React a imágenes
- Alternativas a html2canvas
- Debugging de problemas de fuentes en canvas

**Por favor, revisa este documento y sugiere soluciones.**

---

## 📊 Estado Actual del Sistema

- ✅ Exportación SVG del gráfico solo: **Funciona perfectamente**
- ✅ Exportación PNG del gráfico solo: **Funciona perfectamente**
- ❌ Exportación PNG completa (con leyenda): **Textos cortados**
- ✅ Diálogos de selección (tipo de exportación + fondo): **Funcionan perfectamente**
- ✅ Todo lo demás del sistema: **Funciona perfectamente**

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Causa Raíz Identificada**

El problema era causado por la combinación de:

1. **`truncate`** (aplicaba `overflow: hidden`) que html2canvas interpretaba literalmente
2. **Flexbox con `items-center`** causaba cálculo incorrecto de baseline
3. **Fuentes custom vía clases Tailwind** no se resolvían correctamente en el canvas clonado
4. **html2canvas** no computaba estilos CSS de clases antes de renderizar

### **Solución Aplicada**

#### **1. Callback `onclone` en html2canvas**

Agregado en la configuración de html2canvas:

```typescript
onclone: (clonedDoc) => {
	// En el documento clonado, forzar estilos computados como inline
	const clonedTexts = clonedDoc.querySelectorAll("p, span, div");
	clonedTexts.forEach((el) => {
		const htmlEl = el as HTMLElement;
		const computed = window.getComputedStyle(el);
		// Forzar font-family, fontSize, fontWeight computados
		htmlEl.style.fontFamily = computed.fontFamily;
		htmlEl.style.fontSize = computed.fontSize;
		htmlEl.style.fontWeight = computed.fontWeight;
		// Forzar estilos seguros para evitar corte de texto
		htmlEl.style.overflow = "visible";
		htmlEl.style.textOverflow = "clip";
		htmlEl.style.whiteSpace = "normal";
		htmlEl.style.lineHeight = "1.6";
		htmlEl.style.height = "auto";
	});
};
```

**Cómo funciona:**

- El callback `onclone` se ejecuta **antes** de que html2canvas renderice
- Permite acceder al DOM clonado y modificar estilos
- Fuerza estilos computados como inline (font-family, fontSize, etc.)
- Sobrescribe `overflow: hidden` por `overflow: visible`
- Establece `line-height` explícito para evitar cortes

#### **2. Reemplazo de `truncate` por `break-words`**

En los labels de la leyenda:

```tsx
{
	/* Antes */
}
<StandardText size="sm" weight="medium" className="truncate">
	{item.label}
</StandardText>;

{
	/* Después */
}
<StandardText size="sm" weight="medium" className="break-words">
	{item.label}
</StandardText>;
```

**Por qué funciona:**

- `truncate` aplica `overflow: hidden` que causa el corte
- `break-words` permite que el texto se ajuste sin cortarse
- Compatible tanto en pantalla como en exportación

#### **3. Contenedor Compacto**

Agregado `max-w-fit mx-auto` al contenedor de exportación:

```tsx
<div ref={exportContainerRef} className="bg-white p-8 rounded-lg max-w-fit mx-auto">
```

**Beneficio:**

- Elimina espacio lateral vacío innecesario
- Imagen exportada más compacta y profesional
- Centrado automático del contenido

### **Resultado Final**

✅ **Textos de leyenda completamente legibles**  
✅ **Sin cortes verticales**  
✅ **Imagen compacta sin bordes laterales excesivos**  
✅ **Funciona con fondo blanco y transparente**  
✅ **Compatible con todos los navegadores**

### **Créditos**

Solución proporcionada por **Claude Opus 4.6** (versión web) mediante análisis del código y diagnóstico preciso del problema con html2canvas.

---

**Nota:** Bug resuelto exitosamente. El sistema de exportación de gráficos ahora funciona perfectamente en todos los modos (SVG solo, PNG solo, PNG completo).
