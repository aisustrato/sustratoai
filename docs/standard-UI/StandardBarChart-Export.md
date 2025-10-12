# StandardBarChart - Opciones de Exportación

## 📊 Opciones Disponibles para Exportar Gráficos Nivo

Nivo **no tiene exportación nativa** a PNG/PDF/SVG, pero tenemos varias alternativas profesionales:

---

## ✅ Opción 1: HTML to Canvas (Recomendada) 

### **Librería: `html-to-image`**

La más simple y robusta. Convierte el DOM completo a imagen.

### **Instalación:**
```bash
npm install html-to-image
```

### **Implementación:**
```typescript
import { toPng, toJpeg, toSvg } from 'html-to-image';

// Función para exportar el gráfico
const exportChartAsPng = async (chartRef: HTMLDivElement) => {
  try {
    const dataUrl = await toPng(chartRef, {
      quality: 1.0,
      pixelRatio: 2, // Para alta resolución
      backgroundColor: '#ffffff'
    });
    
    // Descargar automáticamente
    const link = document.createElement('a');
    link.download = 'grafico.png';
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exportando gráfico:', error);
  }
};
```

### **Ventajas:**
- ✅ Captura el gráfico exactamente como se ve
- ✅ Incluye tooltips, animaciones (si están visibles)
- ✅ Respeta el tema y colores del usuario
- ✅ Soporte para PNG, JPEG y SVG
- ✅ Control total sobre resolución y calidad

### **Desventajas:**
- ⚠️ PNG/JPEG son imágenes raster (no escalables infinitamente)
- ⚠️ Requiere que el gráfico esté montado en el DOM

---

## ✅ Opción 2: Canvas Screenshot

### **Librería: `dom-to-image-more`**

Alternativa más completa con mejor soporte para CSS moderno.

### **Instalación:**
```bash
npm install dom-to-image-more
```

### **Implementación:**
```typescript
import domtoimage from 'dom-to-image-more';

const exportChart = async (chartRef: HTMLDivElement, format: 'png' | 'jpeg' | 'svg') => {
  const exportFunctions = {
    png: domtoimage.toPng,
    jpeg: domtoimage.toJpeg,
    svg: domtoimage.toSvg
  };
  
  try {
    const dataUrl = await exportFunctions[format](chartRef, {
      quality: 0.95,
      width: chartRef.offsetWidth * 2,
      height: chartRef.offsetHeight * 2,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left'
      }
    });
    
    // Descargar
    const link = document.createElement('a');
    link.download = `grafico.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## ✅ Opción 3: SVG Export (Vector Perfecto)

### **Enfoque: Extraer el SVG interno de Nivo**

Nivo renderiza gráficos como SVG. Podemos extraerlo directamente.

### **Implementación:**
```typescript
const exportChartAsSvg = (chartRef: HTMLDivElement, filename: string = 'grafico.svg') => {
  // Encontrar el SVG dentro del contenedor
  const svgElement = chartRef.querySelector('svg');
  
  if (!svgElement) {
    console.error('No se encontró SVG en el contenedor');
    return;
  }
  
  // Clonar para no afectar el original
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  
  // Asegurar que tenga namespace correcto
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Obtener estilos inline (importante para mantener colores)
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  
  // Crear Blob y descargar
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

### **Ventajas:**
- ✅ **Vector puro** - escalable infinitamente sin pérdida
- ✅ Editable en Adobe Illustrator, Inkscape, etc.
- ✅ Tamaño de archivo pequeño
- ✅ Perfecto para impresión profesional

### **Desventajas:**
- ⚠️ Requiere procesar estilos manualmente en algunos casos
- ⚠️ Algunos navegadores pueden tener problemas con fuentes custom

---

## ✅ Opción 4: CSV Export (Datos Raw)

### **Para análisis posterior**

```typescript
const exportChartDataAsCsv = (dimensions: BarChartDimension[], filename: string = 'datos.csv') => {
  // Preparar filas CSV
  const rows: string[] = [];
  
  // Header
  rows.push('Dimensión,Valor,Emoticon,Cantidad');
  
  // Datos
  dimensions.forEach(dim => {
    dim.values.forEach(val => {
      const emoticon = val.emoticon || '';
      rows.push(`"${dim.name}","${val.value}","${emoticon}",${val.count}`);
    });
  });
  
  // Crear y descargar
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

---

## 🎯 Recomendación Según Caso de Uso

| Caso de Uso | Opción Recomendada | Formato |
|-------------|-------------------|---------|
| **Presentaciones PowerPoint** | html-to-image | PNG (alta resolución) |
| **Documentos Word/PDF** | html-to-image | PNG/JPEG |
| **Impresión profesional** | SVG Export | SVG |
| **Edición en Illustrator** | SVG Export | SVG |
| **Análisis en Excel/R** | CSV Export | CSV |
| **Web (compartir en redes)** | html-to-image | PNG/JPEG |
| **Informes científicos** | SVG Export + CSV | SVG + CSV |

---

## 🔧 Implementación en StandardBarChart

### **Props adicionales sugeridos:**

```typescript
export interface StandardBarChartProps {
  // ... props existentes
  
  /** Habilitar botones de exportación */
  enableExport?: boolean;
  
  /** Formatos de exportación disponibles */
  exportFormats?: Array<'png' | 'jpeg' | 'svg' | 'csv'>;
  
  /** Callback cuando se exporta */
  onExport?: (format: string, success: boolean) => void;
  
  /** Nombre base para archivos exportados */
  exportFilename?: string;
}
```

### **UI sugerida:**

```tsx
{enableExport && (
  <div className="flex items-center gap-2">
    <StandardButton
      size="sm"
      styleType="outline"
      leftIcon={Download}
      onClick={() => exportChartAsPng(chartRef.current!)}
    >
      PNG
    </StandardButton>
    
    <StandardButton
      size="sm"
      styleType="outline"
      leftIcon={Download}
      onClick={() => exportChartAsSvg(chartRef.current!)}
    >
      SVG
    </StandardButton>
    
    <StandardButton
      size="sm"
      styleType="outline"
      leftIcon={FileSpreadsheet}
      onClick={() => exportChartDataAsCsv(dimensions)}
    >
      CSV
    </StandardButton>
  </div>
)}
```

---

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "html-to-image": "^1.11.11",
    "dom-to-image-more": "^3.3.0"
  }
}
```

---

## 🎨 Mejoras de Calidad

### **Para PNG de alta resolución:**
```typescript
const exportHighQualityPng = async (chartRef: HTMLDivElement) => {
  await toPng(chartRef, {
    quality: 1.0,
    pixelRatio: 3, // 3x para pantallas retina
    backgroundColor: '#ffffff',
    width: chartRef.offsetWidth * 2,
    height: chartRef.offsetHeight * 2,
    style: {
      transform: 'scale(2)',
      transformOrigin: 'top left'
    }
  });
};
```

### **Para SVG con estilos embebidos:**
```typescript
const embedStylesInSvg = (svgElement: SVGElement): SVGElement => {
  const cloned = svgElement.cloneNode(true) as SVGElement;
  
  // Obtener todos los estilos computados
  const elements = cloned.querySelectorAll('*');
  elements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const computedStyles = Array.from(styles).reduce((acc, key) => {
      acc += `${key}:${styles.getPropertyValue(key)};`;
      return acc;
    }, '');
    el.setAttribute('style', computedStyles);
  });
  
  return cloned;
};
```

---

## 🚀 Próximos Pasos

1. **Elegir librería** según necesidades (recomiendo `html-to-image`)
2. **Instalar dependencias**
3. **Agregar props de exportación** a StandardBarChart
4. **Implementar botones UI** con StandardButton
5. **Agregar feedback** con toast/notificaciones
6. **Testing** en diferentes navegadores

---

## 💡 Notas Importantes

- ⚠️ **Permisos:** Algunos navegadores requieren interacción del usuario para descargar
- ⚠️ **CORS:** Si el gráfico usa imágenes externas, pueden fallar por CORS
- ⚠️ **Performance:** Gráficos muy grandes pueden tardar varios segundos
- ⚠️ **Memoria:** PNG de alta resolución pueden ocupar bastante memoria

---

## 🎯 Conclusión

**Mi recomendación:** Implementar un sistema híbrido con 3 botones:
1. **PNG** (html-to-image) - Para uso general
2. **SVG** (extracción directa) - Para impresión/edición
3. **CSV** (datos raw) - Para análisis

Esto cubre el 99% de casos de uso de tus usuarios investigadores. 📊✨
