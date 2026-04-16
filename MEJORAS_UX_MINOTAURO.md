# Mejoras de UX para Minotauro - Implementación

## 1. Overlay de Loading Grande

**Ubicación:** Agregar al final del return principal, antes del cierre

```tsx
{/* Overlay de loading grande */}
{processing && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <SustratoLoadingLogo 
        size={120}
        variant="spin-pulse"
        speed="normal"
        showText
        text={`Procesando con ${getArchetypeName(analyses[processing]?.archetype || 'deslixador')}...`}
        breathingEffect
        colorTransition
      />
    </div>
  </div>
)}
```

## 2. Corregir Iconos en Botones

**Problema:** Los iconos están dentro del children en lugar de usar `leftIcon` prop

**Cambiar de:**
```tsx
<StandardButton>
  <Save className="w-4 h-4 mr-2" />
  Guardar
</StandardButton>
```

**A:**
```tsx
<StandardButton leftIcon={<Save />}>
  Guardar
</StandardButton>
```

**Aplicar en todos los botones:**
- Línea ~781: Guardar (Save)
- Línea ~791: Eliminar (Trash2)
- Línea ~802-843: Todos los arquetipos (quitar el ícono inline, solo dejar emoji)
- Línea ~685-687: ChevronUp/ChevronDown
- Línea ~992: Ejecutar Nueva Versión (quitar Sparkles inline)

## 3. Historial Expandible de Arquetipos

**Cambio en estructura de datos:**

Cambiar `analyses` de guardar solo el último a guardar array de todos:

```tsx
// Estado actual (línea ~64)
const [analyses, setAnalyses] = useState<Record<string, {
  archetype: ArchetypeTone;
  status: 'pending_calibration' | 'calibrated' | 'executed';
  comments: Array<...>;
  tokens: any;
} | null>>({});

// Cambiar a:
const [analyses, setAnalyses] = useState<Record<string, Array<{
  archetype: ArchetypeTone;
  status: 'pending_calibration' | 'calibrated' | 'executed';
  comments: Array<...>;
  tokens: any;
  timestamp: string;
}>>>({});
```

**Actualizar handleProcessWithArchetype (línea ~304):**

```tsx
// En lugar de reemplazar, agregar al array
setAnalyses(prev => ({
  ...prev,
  [galaxy.id]: [
    ...(prev[galaxy.id] || []),
    analysisData
  ]
}));
```

**Renderizar con acordeones (línea ~848):**

```tsx
{/* Panel de análisis con calibración interactiva */}
{analyses[galaxy.id] && analyses[galaxy.id].length > 0 && (
  <div className="space-y-2">
    {analyses[galaxy.id].map((analysis, idx) => {
      const isExpanded = expandedAnalyses[`${galaxy.id}-${idx}`] !== false; // Por defecto expandido
      const isLatest = idx === analyses[galaxy.id].length - 1;
      
      return (
        <StandardCard 
          key={idx} 
          colorScheme={isLatest ? "primary" : "neutral"} 
          className="p-4"
        >
          {/* Header del análisis */}
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedAnalyses(prev => ({
              ...prev,
              [`${galaxy.id}-${idx}`]: !isExpanded
            }))}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {getArchetypeEmoji(analysis.archetype)} Análisis del {getArchetypeName(analysis.archetype)}
              </span>
              <StandardBadge 
                colorScheme={
                  analysis.status === 'pending_calibration' ? 'warning' : 
                  analysis.status === 'executed' ? 'success' : 
                  'primary'
                } 
                size="xs"
              >
                {analysis.status === 'pending_calibration' ? 'Pendiente calibración' : 
                 analysis.status === 'executed' ? '✅ Ejecutado' : 
                 'Calibrado'}
              </StandardBadge>
              {isLatest && <StandardBadge colorScheme="accent" size="xs">Último</StandardBadge>}
            </div>
            <StandardButton
              size="xs"
              colorScheme="neutral"
              styleType="ghost"
              leftIcon={isExpanded ? <ChevronUp /> : <ChevronDown />}
            >
              {isExpanded ? 'Colapsar' : 'Expandir'}
            </StandardButton>
          </div>
          
          {/* Contenido expandible */}
          {isExpanded && (
            <div className="mt-3 space-y-3">
              {/* ... resto del contenido actual ... */}
            </div>
          )}
        </StandardCard>
      );
    })}
  </div>
)}
```

## 4. Auto-scroll y Colapso al Ejecutar

**En handleExecuteVersion (línea ~395):**

```tsx
const handleExecuteVersion = async (galaxyId: string) => {
  // ... código existente ...
  
  if (result.success) {
    // ... actualizar contenido ...
    
    // Auto-scroll al editor
    setTimeout(() => {
      editorRefs.current[galaxyId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
    
    // Colapsar análisis previos (excepto el último)
    const analysesForGalaxy = analyses[galaxyId] || [];
    const newExpandedState: Record<string, boolean> = {};
    analysesForGalaxy.forEach((_, idx) => {
      if (idx < analysesForGalaxy.length - 1) {
        newExpandedState[`${galaxyId}-${idx}`] = false;
      }
    });
    setExpandedAnalyses(prev => ({ ...prev, ...newExpandedState }));
    
    // ... resto del código ...
  }
};
```

**Agregar ref al editor (línea ~700+):**

```tsx
<div 
  ref={(el) => { editorRefs.current[galaxy.id] = el; }}
  className="space-y-4"
>
  {/* Editor de markdown */}
  <StandardTextarea
    // ... props existentes ...
  />
</div>
```

## 5. Indicador de Arquetipo en Metadata

**Actualizar metadata al ejecutar (línea ~450+):**

```tsx
// En handleExecuteVersion, agregar al metadata:
const updatedMetadata = {
  ...galaxy.metadata,
  ultimo_arquetipo: analysis.archetype,
  timestamp_ultima_modificacion: new Date().toISOString()
};
```

**Mostrar en el header de la sección (línea ~692):**

```tsx
<div className="flex gap-4 text-xs text-muted-foreground mt-2">
  <span>📊 {calculateTextMetrics(content.content).words} palabras</span>
  <span>• Sección #{index + 1}</span>
  {galaxy.metadata?.ultimo_arquetipo && (
    <span>• Último: {getArchetypeEmoji(galaxy.metadata.ultimo_arquetipo)} {getArchetypeName(galaxy.metadata.ultimo_arquetipo)}</span>
  )}
</div>
```

## Orden de Implementación Recomendado:

1. **Overlay de loading** (más fácil, impacto visual inmediato)
2. **Corregir iconos** (búsqueda y reemplazo simple)
3. **Indicador de arquetipo** (cambio pequeño)
4. **Auto-scroll y colapso** (mediana complejidad)
5. **Historial expandible** (más complejo, requiere refactor de estado)

## Notas Importantes:

- El historial expandible requiere cambiar la estructura de `analyses` de objeto único a array
- Esto afectará múltiples funciones que leen `analyses[galaxyId]`
- Considerar migración gradual o crear nuevo estado `analysesHistory` paralelo
