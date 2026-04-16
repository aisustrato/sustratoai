# BUG: Círculos de Color Desalineados en Exportación PNG

**Fecha:** 5 Abril 2026  
**Prioridad:** Media  
**Estado:** 🟢 **ALTERNATIVA A IMPLEMENTADA** - html-to-image reemplaza html2canvas  
**Componente:** StandardPieChart - Exportación PNG completa  
**Problema:** Indicadores de color de la leyenda aparecen desalineados verticalmente (más arriba) en la imagen exportada

---

## 📋 Descripción del Problema

Al exportar un gráfico de torta completo (título + gráfico + leyenda) como PNG usando `html2canvas`, **los círculos de color de la leyenda aparecen desalineados verticalmente**, mostrándose más arriba de lo que deberían. En pantalla se ven perfectamente alineados con el texto, pero en la exportación están desfasados hacia arriba.

### Evidencia Visual

**Usuario reporta:**

- ✅ **En pantalla**: Círculos perfectamente alineados con el texto
- ❌ **En exportación PNG**: Círculos desplazados hacia arriba (desfasados)

**Capturas proporcionadas:**

1. Primera imagen: "Diseño participativo" - Círculos desalineados
2. Segunda imagen: "Tamaño de la muestra" - Mismo problema persiste

---

## 🔍 Contexto Técnico

### Archivo Principal

`/Users/rodolfoleiva/Documents/respaldo/SUSTRATOAI/components/charts/StandardPieChart.tsx`

### Tecnologías Involucradas

- **React** + **TypeScript** + **Next.js**
- **html2canvas** v1.4.1 (importado dinámicamente)
- **@nivo/pie** para el gráfico principal
- **SVG nativo** para los círculos de color en la leyenda

### Estructura Actual de los Círculos

```tsx
{
	/* Indicador de color - SVG para exportación correcta */
}
<svg
	width="12"
	height="12"
	viewBox="0 0 12 12"
	className="flex-shrink-0"
	style={{
		minWidth: "12px",
		minHeight: "12px",
		display: "block",
		verticalAlign: "middle",
	}}>
	<circle cx="6" cy="6" r="6" fill={color} />
</svg>;
```

### Contenedor de la Leyenda

```tsx
<div
	key={item.id}
	style={{ lineHeight: "1.8" }}
	className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
	{/* SVG círculo */}
	{/* Emoticon */}
	{/* Label */}
	{/* Valor y porcentaje */}
</div>
```

### Configuración html2canvas Actual

```typescript
html2canvas.default(containerRef.current!, {
	backgroundColor: withBackground ? "#ffffff" : null,
	scale: 2,
	allowTaint: true,
	logging: false,
	onclone: (clonedDoc) => {
		// Fuerza estilos de texto
		const clonedTexts = clonedDoc.querySelectorAll("p, span, div");
		clonedTexts.forEach((el) => {
			const htmlEl = el as HTMLElement;
			const computed = window.getComputedStyle(el);
			htmlEl.style.fontFamily = computed.fontFamily;
			htmlEl.style.fontSize = computed.fontSize;
			htmlEl.style.fontWeight = computed.fontWeight;
			htmlEl.style.overflow = "visible";
			htmlEl.style.textOverflow = "clip";
			htmlEl.style.whiteSpace = "normal";
			htmlEl.style.lineHeight = "1.6";
			htmlEl.style.height = "auto";
		});

		// Fuerza estilos de SVG
		const clonedSvgs = clonedDoc.querySelectorAll("svg");
		clonedSvgs.forEach((svg) => {
			const computed = window.getComputedStyle(svg);
			svg.style.display = computed.display || "block";
			svg.style.verticalAlign = computed.verticalAlign || "middle";

			const circles = svg.querySelectorAll("circle");
			circles.forEach((circle) => {
				const fill = circle.getAttribute("fill");
				if (fill) {
					circle.setAttribute("fill", fill);
				}
			});
		});
	},
});
```

---

## 🔧 Soluciones Intentadas (SIN ÉXITO)

### 1. Estilos Inline en SVG

**Intento:**

```tsx
style={{
  minWidth: "12px",
  minHeight: "12px",
  display: "block",
  verticalAlign: "middle"
}}
```

**Resultado:** ❌ No resolvió el problema

---

### 2. Forzar Estilos en onclone

**Intento:**

```typescript
svg.style.display = computed.display || "block";
svg.style.verticalAlign = computed.verticalAlign || "middle";
```

**Resultado:** ❌ No resolvió el problema

---

### 3. Reemplazo de div por SVG

**Contexto:** Originalmente era un `<div>` con clases Tailwind, se reemplazó por SVG nativo

**Resultado:** ✅ Los círculos ahora aparecen en la exportación, pero ❌ están desalineados

---

## 🎯 Comportamiento Observado

### En Pantalla (Navegador)

✅ Círculos perfectamente alineados verticalmente con el texto de la leyenda

### En Exportación PNG

- ✅ Círculos aparecen (no están invisibles)
- ✅ Colores correctos
- ❌ **Posición vertical incorrecta** (desplazados hacia arriba)
- ✅ Resto del contenido (título, gráfico, texto) se exporta correctamente

---

## 💡 Hipótesis del Problema

### Teoría 1: Flexbox `items-center` no se respeta

`html2canvas` podría no estar respetando la alineación vertical de flexbox (`items-center`) al capturar el DOM clonado.

### Teoría 2: Line-height del contenedor

El `lineHeight: "1.8"` del contenedor podría estar causando un cálculo incorrecto de la posición vertical del SVG.

### Teoría 3: Baseline de SVG

Los elementos SVG tienen un baseline diferente a los elementos de texto, y `html2canvas` podría estar usando el baseline incorrecto.

### Teoría 4: Transform o Position

`html2canvas` podría necesitar un `transform: translateY()` explícito para ajustar la posición del SVG.

### Teoría 5: Padding/Margin del SVG

Podría necesitarse padding o margin explícito en el SVG para compensar el desfase.

---

## 🔬 Información Adicional

### Bug Anterior Relacionado

Existe un documento previo: `BUG_HTML2CANVAS_TEXTO_CORTADO.md` que resolvió un problema similar con textos cortados usando el callback `onclone`.

**Solución anterior:**

- Forzar estilos computados como inline
- Sobrescribir `overflow: hidden` por `overflow: visible`
- Establecer `line-height` explícito

**Diferencia con este bug:**

- El bug anterior era de **corte de texto** (solo se veía la mitad superior)
- Este bug es de **desalineación vertical** (el elemento completo está desplazado)

### Clases Tailwind Involucradas

- `flex items-center` → Alineación vertical centrada
- `gap-3` → Espacio entre elementos
- `flex-shrink-0` → Evita que el SVG se encoja

### Estilos Inline Aplicados

```tsx
style={{
  lineHeight: "1.8"  // En el contenedor
}}

style={{
  minWidth: "12px",
  minHeight: "12px",
  display: "block",
  verticalAlign: "middle"  // En el SVG
}}
```

---

## ❓ Preguntas para Investigación

1. **¿html2canvas respeta `items-center` de flexbox?**
2. **¿Se necesita un `transform: translateY()` en el SVG?**
3. **¿Debería usarse `align-self` en lugar de `items-center`?**
4. **¿El problema es específico del SVG o afectaría a cualquier elemento inline?**
5. **¿Hay alguna configuración de html2canvas para manejar SVG correctamente?**
6. **¿Debería usarse una librería alternativa?** (dom-to-image, html-to-image)
7. **¿El problema está en el `viewBox` del SVG?**
8. **¿Se necesita un wrapper adicional alrededor del SVG?**

---

## 🎯 Solución Ideal Buscada

Que al exportar el gráfico completo como PNG:

- Los círculos de color estén **perfectamente alineados verticalmente** con el texto
- Se mantenga el diseño actual (no queremos cambiar la estructura visual)
- Funcione tanto con fondo blanco como transparente
- Sea consistente en todos los navegadores

---

## 📁 Archivos Relevantes

1. **Componente principal:**
   `/components/charts/StandardPieChart.tsx` (líneas 129-177 para onclone, líneas 434-446 para SVG)

2. **Documentación de bug anterior:**
   `/docs/BUG_HTML2CANVAS_TEXTO_CORTADO.md` (resuelto exitosamente)

3. **Uso del componente:**
   `/app/articulos/analisis-preclasificacion/components/UniverseVisualization.tsx`

---

## 🔍 Código Específico del Problema

### Líneas 434-446: Renderizado del SVG

```tsx
{
	/* Indicador de color - SVG para exportación correcta */
}
<svg
	width="12"
	height="12"
	viewBox="0 0 12 12"
	className="flex-shrink-0"
	style={{
		minWidth: "12px",
		minHeight: "12px",
		display: "block",
		verticalAlign: "middle",
	}}>
	<circle cx="6" cy="6" r="6" fill={color} />
</svg>;
```

### Líneas 159-176: Callback onclone para SVG

```typescript
// 🔧 FIX: Forzar estilos de SVG (círculos de color en leyenda)
const clonedSvgs = clonedDoc.querySelectorAll("svg");
clonedSvgs.forEach((svg) => {
	const computed = window.getComputedStyle(svg);
	// Forzar display y vertical-align para alineación correcta
	svg.style.display = computed.display || "block";
	svg.style.verticalAlign = computed.verticalAlign || "middle";

	// Forzar estilos de los círculos dentro del SVG
	const circles = svg.querySelectorAll("circle");
	circles.forEach((circle) => {
		const circleComputed = window.getComputedStyle(circle);
		const fill = circle.getAttribute("fill");
		if (fill) {
			circle.setAttribute("fill", fill);
		}
	});
});
```

---

## 🆘 Solicitud de Ayuda

Si tienes experiencia con:

- html2canvas y problemas de alineación vertical
- Exportación de SVG inline en componentes React
- Alternativas a html2canvas para captura de DOM
- Debugging de problemas de baseline y vertical-align
- Flexbox y su interacción con html2canvas

**Por favor, revisa este documento y sugiere soluciones.**

---

## 📊 Estado Actual del Sistema

- ✅ Exportación SVG del gráfico solo: **Funciona perfectamente**
- ✅ Exportación PNG del gráfico solo: **Funciona perfectamente**
- ✅ Círculos aparecen en exportación PNG: **Sí, son visibles**
- ✅ Colores de círculos correctos: **Sí**
- ❌ Alineación vertical de círculos: **Desplazados hacia arriba**
- ✅ Texto de leyenda: **Se exporta correctamente** (bug anterior resuelto)
- ✅ Todo lo demás del sistema: **Funciona perfectamente**

---

## 🔄 Historial de Cambios

### Cambio 1: div → SVG (5 Abril 2026)

- **Antes:** `<div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />`
- **Después:** `<svg>...<circle fill={color} /></svg>`
- **Resultado:** Círculos ahora aparecen, pero desalineados

### Cambio 2: Estilos inline en SVG (5 Abril 2026)

- **Agregado:** `display: "block"`, `verticalAlign: "middle"`
- **Resultado:** Sin cambio en alineación

### Cambio 3: Extensión de onclone para SVG (5 Abril 2026)

- **Agregado:** Lógica específica para forzar estilos de SVG en DOM clonado
- **Resultado:** Sin cambio en alineación

---

---

## 🔍 CAUSA RAÍZ IDENTIFICADA

### El Verdadero Problema: `onclone` Demasiado Agresivo

El callback `onclone` de `html2canvas` aplicaba `height: "auto"` y `lineHeight: "1.6"` a **TODOS** los `<div>`, incluyendo:

1. **El círculo de color** (div de 12x12px) → `height: "auto"` **colapsaba su altura a 0**
2. **El contenedor flex** (div con `items-center`) → `lineHeight: "1.6"` **alteraba el cálculo de baseline**

**Cronología del bug:**

1. El div original con clases Tailwind (`w-3 h-3 rounded-full`) era invisible en la exportación porque `onclone` le ponía `height: "auto"`, colapsándolo
2. Se cambió a SVG → los círculos aparecían, pero SVG tiene un baseline diferente en html2canvas, causando desfase vertical
3. Se intentó forzar estilos en SVG → no resolvió porque el problema era el **contenedor**, no el SVG

### Diagrama del Problema

```
onclone recorre TODOS los divs:
  ├── div.exportContainer → OK (height auto no daña contenedores)
  ├── div.flex.items-center → ⚠️ lineHeight "1.6" altera baseline
  ├── div[color-indicator] → ❌ height "auto" COLAPSA el círculo de 12px
  ├── div.flex-1 → OK (texto)
  └── div.flex.items-baseline → OK (valores)
```

---

## ✅ SOLUCIÓN IMPLEMENTADA (Intento 4)

### Estrategia: `div` con estilos 100% inline + `data-attribute` para skip en `onclone`

#### **1. Indicador de color con estilos 100% inline (sin Tailwind)**

```tsx
{
	/* Indicador de color - 100% inline para compatibilidad con html2canvas */
}
<div
	data-color-indicator="true"
	style={{
		backgroundColor: color,
		width: "12px",
		height: "12px",
		minWidth: "12px",
		minHeight: "12px",
		borderRadius: "50%",
		flexShrink: 0,
	}}
/>;
```

**Por qué funciona:**

- `html2canvas` respeta estilos inline mejor que clases CSS
- `width`/`height` explícitos no dependen de Tailwind
- `minWidth`/`minHeight` protegen contra colapso
- `borderRadius: "50%"` crea el círculo
- `flexShrink: 0` evita que se encoja

#### **2. `onclone` selectivo con skip por `data-attribute`**

```typescript
onclone: (clonedDoc) => {
  const clonedTexts = clonedDoc.querySelectorAll("p, span, div");
  clonedTexts.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // 🛡️ Skip indicadores de color - tienen estilos inline explícitos
    if (htmlEl.dataset.colorIndicator) return;
    // ... resto de fixes de texto
  });
},
```

**Por qué funciona:**

- El `data-color-indicator` marca los círculos como "intocables"
- `onclone` NO les aplica `height: "auto"` ni `lineHeight: "1.6"`
- Sus estilos inline se preservan íntegros para html2canvas

---

## 🔄 ALTERNATIVAS SI LA SOLUCIÓN NO FUNCIONA

### Alternativa A: Reemplazar html2canvas por `html-to-image`

**Concepto:** `html-to-image` es una librería más moderna y ligera que maneja mejor CSS moderno (flexbox, grid, custom properties).

**Implementación:**

```bash
npm install html-to-image
```

```typescript
import { toPng } from "html-to-image";

const exportChartAsPng = async (withBackground: boolean) => {
	const containerRef =
		exportType === "complete" ? exportContainerRef : chartRef;
	if (!containerRef.current) return;

	try {
		const dataUrl = await toPng(containerRef.current, {
			quality: 1.0,
			pixelRatio: 2,
			backgroundColor: withBackground ? "#ffffff" : undefined,
		});

		const link = document.createElement("a");
		link.download = `${exportFilename}-completo.png`;
		link.href = dataUrl;
		link.click();
		toast.success("Gráfico exportado como PNG");
	} catch (error) {
		console.error("Error exportando:", error);
		toast.error("Error al exportar el gráfico");
	}
};
```

**Ventajas:**

- No necesita callback `onclone` (renderiza CSS correctamente por defecto)
- Mejor soporte de flexbox, grid, custom properties
- Más ligera (~10KB vs ~100KB de html2canvas)
- API basada en Promises (más limpia)

**Riesgo:** Puede tener otros problemas específicos con @nivo/pie SVG.

---

### Alternativa B: Renderizar leyenda como SVG puro (no HTML)

**Concepto:** En lugar de usar divs HTML para la leyenda, crear un SVG completo que incluya tanto el gráfico como la leyenda.

**Implementación:**

```typescript
const exportChartAsPng = (withBackground: boolean) => {
	const svgElement = chartRef.current?.querySelector("svg");
	if (!svgElement) return;

	// Clonar el SVG del gráfico
	const clonedSvg = svgElement.cloneNode(true) as SVGElement;

	// Agregar leyenda como elementos SVG nativos
	const legendGroup = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"g",
	);
	legendGroup.setAttribute("transform", "translate(480, 50)");

	data.forEach((item, idx) => {
		const y = idx * 40;
		const color = item.color || tokens.nivoChart.colors[item.id] || "#cccccc";

		// Círculo de color
		const circle = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"circle",
		);
		circle.setAttribute("cx", "6");
		circle.setAttribute("cy", String(y + 6));
		circle.setAttribute("r", "6");
		circle.setAttribute("fill", color);
		legendGroup.appendChild(circle);

		// Texto del label
		const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.setAttribute("x", "20");
		text.setAttribute("y", String(y + 10));
		text.setAttribute("font-size", "12");
		text.textContent = `${item.emoticon || ""} ${item.label}  ${item.value} (${percentage}%)`;
		legendGroup.appendChild(text);
	});

	clonedSvg.appendChild(legendGroup);

	// Convertir SVG a PNG
	// ... (mismo proceso de serialización actual)
};
```

**Ventajas:**

- SVG puro = 0 problemas con html2canvas
- Control total sobre posicionamiento
- Exportación pixel-perfect garantizada

**Riesgo:** Requiere más código y calcular manualmente las posiciones. Pierde flexibilidad del HTML.

---

### Alternativa C: Canvas manual con measureText

**Concepto:** Dibujar la leyenda directamente en el Canvas usando la API 2D.

**Implementación:**

```typescript
// Después de dibujar el SVG del gráfico en el canvas...
data.forEach((item, idx) => {
	const y = startY + idx * 35;
	const color = item.color || tokens.nivoChart.colors[item.id] || "#cccccc";

	// Dibujar círculo
	ctx.beginPath();
	ctx.arc(legendX + 6, y + 6, 6, 0, Math.PI * 2);
	ctx.fillStyle = color;
	ctx.fill();

	// Dibujar texto
	ctx.fillStyle = "#333";
	ctx.font = "12px sans-serif";
	ctx.fillText(`${item.label}`, legendX + 20, y + 10);

	ctx.font = "bold 14px sans-serif";
	ctx.fillText(`${item.value}`, legendX + 250, y + 10);

	ctx.font = "12px sans-serif";
	ctx.fillStyle = "#888";
	ctx.fillText(`(${percentage}%)`, legendX + 290, y + 10);
});
```

**Ventajas:**

- Control absoluto sobre cada pixel
- Cero dependencia en html2canvas
- Garantiza alineación perfecta

**Riesgo:** Requiere calcular posiciones manualmente. Más código. Pierde la apariencia dinámica del HTML.

---

### Alternativa D: Snapshot con `window.devicePixelRatio` y `getComputedStyle` manual

**Concepto:** En `onclone`, copiar TODOS los estilos computados de TODOS los elementos (no solo texto), pero preservando las dimensiones explícitas.

**Implementación:**

```typescript
onclone: (clonedDoc) => {
  const allElements = clonedDoc.querySelectorAll("*");
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const original = document.querySelector(`[data-export-id="${htmlEl.dataset.exportId}"]`);
    if (!original) return;

    const computed = window.getComputedStyle(original);

    // Copiar TODOS los estilos computados como inline
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      htmlEl.style.setProperty(prop, computed.getPropertyValue(prop));
    }
  });
},
```

**Ventajas:**

- Copia fiel del renderizado del navegador
- No hay selectividad — todo se fuerza

**Riesgo:** Puede ser lento con muchos elementos. Puede causar conflictos de estilos.

---

## 📊 Tabla Comparativa de Alternativas

| Alternativa                          | Complejidad | Riesgo | Fidelidad Visual | Recomendación           |
| ------------------------------------ | ----------- | ------ | ---------------- | ----------------------- |
| **Solución actual (data-attribute)** | Baja        | Bajo   | Alta             | ⭐ Probar primero       |
| **A: html-to-image**                 | Baja        | Medio  | Alta             | ⭐⭐ Si falla la actual |
| **B: SVG puro**                      | Media       | Bajo   | Perfecta         | Si A y actual fallan    |
| **C: Canvas manual**                 | Alta        | Bajo   | Perfecta         | Último recurso          |
| **D: getComputedStyle total**        | Media       | Alto   | Alta             | Solo si nada funciona   |

---

## 🎯 Plan de Acción Recomendado

1. **Verificar solución actual** (data-attribute + estilos inline) → si funciona, cerrar bug
2. **Si falla** → Instalar `html-to-image` y reemplazar `html2canvas` (Alternativa A)
3. **Si A falla** → Crear leyenda como SVG puro (Alternativa B)
4. **Último recurso** → Canvas manual (Alternativa C)

---

**Nota:** La solución actual ataca la causa raíz directamente (onclone destruía los estilos del círculo). Las alternativas son planes de contingencia progresivos.
