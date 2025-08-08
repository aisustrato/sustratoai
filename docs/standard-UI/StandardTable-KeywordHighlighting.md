# StandardTable - Sistema de Resaltado de Palabras Clave Nativo

## 🎯 Visión General

El StandardTable incluye un sistema nativo de resaltado de palabras clave que permite a los usuarios buscar y resaltar términos específicos dentro del contenido de la tabla. Esta funcionalidad fue desarrollada para reemplazar el componente externo `KeywordHighlighter` que causaba conflictos con el sticky header.

## ✅ Características Principales

### **Funcionalidad Nativa Integrada**
- **Sin componentes externos**: Todo integrado directamente en StandardTable
- **Compatible con sticky header**: No interfiere con el comportamiento del sticky header
- **UX mejorada**: Controles explícitos de "Aplicar" y "Limpiar"
- **Retrocompatible**: Props opcionales que no afectan usos existentes

### **Control de Usuario Explícito**
- **Input de búsqueda**: Campo dedicado en la toolbar
- **Botón "Aplicar"**: Confirma el resaltado de la palabra clave
- **Botón "Limpiar"**: Elimina el resaltado actual
- **Enter para aplicar**: Atajo de teclado para aplicar resaltado

## 🔧 Implementación Técnica

### **Props del StandardTable**

```typescript
interface StandardTableProps {
  // ... otras props existentes
  
  // 🎯 Props de Keyword Highlighting (todas opcionales)
  enableKeywordHighlighting?: boolean;           // Habilita la funcionalidad
  keywordHighlightPlaceholder?: string;          // Placeholder del input
  onKeywordChange?: (keyword: string) => void;   // Callback cuando cambia keyword
  initialKeyword?: string;                       // Valor inicial del keyword
}
```

### **Estructura en la Toolbar**

El sistema se integra en `StandardTableToolbar` con la siguiente estructura:

```typescript
{enableKeywordHighlighting && (
  <div className="flex items-center gap-2">
    <StandardInput
      placeholder={keywordHighlightPlaceholder || "Resaltar palabra clave..."}
      value={tempKeyword}
      onChange={(e) => setTempKeyword(e.target.value)}
      className="w-full max-w-xs"
      colorScheme="accent"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyKeyword();
        }
      }}
    />
    <StandardButton
      styleType="filled"
      colorScheme="accent"
      size="sm"
      onClick={handleApplyKeyword}
      disabled={!tempKeyword.trim()}
    >
      Aplicar
    </StandardButton>
    <StandardButton
      styleType="outline"
      colorScheme="neutral"
      size="sm"
      onClick={handleClearKeyword}
      disabled={!keywordHighlight}
    >
      Limpiar
    </StandardButton>
  </div>
)}
```

### **Lógica de Resaltado en StandardTableCell**

El resaltado se aplica en `StandardTableCell` sobre el valor original de la celda:

```typescript
const highlightKeyword = (text: string, keyword: string): React.ReactNode => {
  if (!keyword.trim()) return text;
  
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
        {part}
      </mark>
    ) : part
  );
};

// Aplicación en el render de la celda
const cellContent = keywordHighlight && typeof cellValue === 'string' 
  ? highlightKeyword(cellValue, keywordHighlight)
  : cellValue;
```

## 🎯 Casos de Uso

### **Habilitación Básica**

```typescript
<StandardTable
  data={tableData}
  columns={tableColumns}
  enableKeywordHighlighting={true}
  keywordHighlightPlaceholder="Buscar en la tabla..."
  onKeywordChange={(keyword) => console.log('Keyword aplicado:', keyword)}
/>
```

### **Con Estado Controlado**

```typescript
const [currentKeyword, setCurrentKeyword] = useState('');

<StandardTable
  data={tableData}
  columns={tableColumns}
  enableKeywordHighlighting={true}
  initialKeyword={currentKeyword}
  onKeywordChange={setCurrentKeyword}
/>
```

## 🛡️ Consideraciones Técnicas

### **Rendimiento**
- **Resaltado bajo demanda**: Solo se aplica cuando hay keyword activo
- **Escape de regex**: Caracteres especiales se escapan automáticamente
- **Aplicación selectiva**: Solo en celdas de tipo string

### **Compatibilidad**
- **Props opcionales**: No afecta implementaciones existentes
- **Sticky header**: Completamente compatible
- **Responsive**: Se adapta al layout responsive de la tabla

### **Limitaciones**
- **Solo texto**: Funciona únicamente con contenido de tipo string
- **Case insensitive**: Búsqueda insensible a mayúsculas/minúsculas
- **Resaltado simple**: No soporta múltiples keywords simultáneos

## 🚀 Beneficios vs Implementación Anterior

### **Problemas Resueltos**
- ✅ **Sin conflictos de layout**: No interfiere con sticky header
- ✅ **UX mejorada**: Controles explícitos vs popup
- ✅ **Integración nativa**: Parte del ecosistema StandardTable
- ✅ **Mantenimiento simplificado**: Una sola fuente de verdad

### **Ventajas Técnicas**
- ✅ **Menos componentes**: Eliminación del KeywordHighlighter externo
- ✅ **Mejor rendimiento**: Sin re-renders innecesarios
- ✅ **Código más limpio**: Lógica centralizada en StandardTable
- ✅ **Debugging simplificado**: Menos capas de abstracción

## 📋 Checklist de Implementación

Para habilitar keyword highlighting en una nueva tabla:

- [ ] Agregar `enableKeywordHighlighting={true}` al StandardTable
- [ ] Opcional: Personalizar `keywordHighlightPlaceholder`
- [ ] Opcional: Implementar `onKeywordChange` para estado externo
- [ ] Opcional: Proporcionar `initialKeyword` si hay valor por defecto
- [ ] Verificar que las columnas contienen datos de tipo string
- [ ] Probar funcionalidad de aplicar/limpiar
- [ ] Validar que no interfiere con sticky header

## 🔍 Debugging

### **Problemas Comunes**
1. **Resaltado no aparece**: Verificar que el contenido de la celda es string
2. **Sticky header rebota**: Asegurar que no hay componentes externos interfiriendo
3. **Performance lenta**: Verificar cantidad de datos y frecuencia de re-renders

### **Logs Útiles**
```typescript
// En StandardTableCell, para debugging
console.log('Cell value type:', typeof cellValue);
console.log('Keyword active:', keywordHighlight);
console.log('Highlighting applied:', keywordHighlight && typeof cellValue === 'string');
```

## 🎯 Estado Actual

- ✅ **Implementación completa**: Funcionalidad nativa operativa
- ✅ **Sticky header corregido**: Funciona dinámicamente con ResizeObserver
- ✅ **UX equiparada**: Consistencia entre preclasificación y showroom
- ✅ **Componente legacy eliminado**: KeywordHighlighter removido completamente

---

**Desarrollado durante la resolución del sticky header dinámico y eliminación de conflictos de layout en StandardTable.**
