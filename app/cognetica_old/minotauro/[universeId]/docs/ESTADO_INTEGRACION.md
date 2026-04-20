# Estado de Integración - Nueva Arquitectura Minotauro

## ✅ Completado Hasta Ahora

### **1. Backend (100% Completo)**
- ✅ `useArchetypeProcessor` actualizado con sentido y referencias
- ✅ API actualizada para recibir sentido y fuentes_curadas
- ✅ Helpers creados (referenceHelpers, versionHelpers)
- ✅ Tipos TypeScript definidos

### **2. Componentes UI (100% Creados)**
- ✅ `SentidoInput.tsx`
- ✅ `TextVersionViewer.tsx`
- ✅ `ArchetypeTimeline.tsx`
- ✅ `ReferencesPanel.tsx`

### **3. Integración en page.tsx (50% Completo)**
- ✅ Imports agregados (líneas 32-45)
- ✅ Estados agregados: `sentidoActual`, `versionesVisualizadas` (líneas 61-62)
- ✅ `handleProcessWithArchetype` actualizado con sentido y referencias (líneas 149-156)

---

## 🚧 Falta Completar en page.tsx

### **Paso 1: Integrar SentidoInput**
Agregar ANTES del contenido de la galaxia (dentro de GalaxyCard):

```typescript
{/* Campo Sentido - Pre-calibración */}
<SentidoInput
  value={sentidoActual[galaxy.id] || ''}
  onChange={(value) => setSentidoActual(prev => ({ ...prev, [galaxy.id]: value }))}
/>
```

### **Paso 2: Reemplazar Textarea por TextVersionViewer**
Buscar donde se renderiza el contenido editable y reemplazar con:

```typescript
{/* Visor de Versiones */}
{(() => {
  const meta = galaxy.metadata as any || {};
  const versiones = meta.versiones_texto || [];
  
  if (versiones.length > 0) {
    return (
      <TextVersionViewer
        versiones={versiones}
        versionActual={versionesVisualizadas[galaxy.id] || meta.version_actual || 1}
        onVersionChange={(version) => setVersionesVisualizadas(prev => ({ 
          ...prev, 
          [galaxy.id]: version 
        }))}
      />
    );
  }
  
  // Fallback: textarea normal si no hay versiones
  return (
    <StandardTextarea
      value={content.content}
      onChange={(e) => handleContentChange(galaxy.id, e.target.value)}
      rows={15}
    />
  );
})()}
```

### **Paso 3: Agregar ArchetypeTimeline**
Agregar DESPUÉS del contenido (reemplazar o complementar AnalysisHistory actual):

```typescript
{/* Timeline de Arquetipos */}
{(() => {
  const meta = galaxy.metadata as any || {};
  const historialArquetipos = meta.historial_arquetipos || [];
  
  if (historialArquetipos.length > 0) {
    return (
      <ArchetypeTimeline
        analisis={historialArquetipos}
        onSelectAnalysis={(analysisId) => {
          console.log('Ver análisis:', analysisId);
        }}
        onViewVersion={(version) => {
          setVersionesVisualizadas(prev => ({ 
            ...prev, 
            [galaxy.id]: version 
          }));
        }}
      />
    );
  }
  return null;
})()}
```

### **Paso 4: Agregar ReferencesPanel**
Agregar en una columna lateral o sección separada:

```typescript
{/* Panel de Referencias */}
{(() => {
  const meta = galaxy.metadata as any || {};
  const fuentes = meta.fuentes_curadas || [];
  
  if (fuentes.length > 0 || isExpanded) {
    return (
      <ReferencesPanel
        fuentes={fuentes}
        onSelectReference={(numero) => {
          console.log('Ver referencia:', numero);
        }}
        onAddSource={() => {
          // TODO: Abrir modal para agregar fuente
          toast({
            title: 'Agregar Fuente',
            description: 'Funcionalidad próximamente'
          });
        }}
      />
    );
  }
  return null;
})()}
```

---

## 🗄️ Migración SQL (Pendiente)

Ejecutar en Supabase SQL Editor:

```sql
-- Migrar datos existentes a nueva estructura
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      metadata,
      '{versiones_texto}',
      CASE 
        WHEN metadata->>'content' IS NOT NULL THEN
          jsonb_build_array(
            jsonb_build_object(
              'version', 1,
              'content', metadata->'content',
              'timestamp', COALESCE(metadata->>'timestamp_analisis', NOW()::text),
              'origen', 'humano'
            )
          )
        ELSE '[]'::jsonb
      END
    ),
    '{historial_arquetipos}',
    '[]'::jsonb
  ),
  '{fuentes_curadas}',
  '[]'::jsonb
)
WHERE metadata IS NOT NULL
  AND metadata->>'versiones_texto' IS NULL;

-- Inicializar version_actual
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
  metadata,
  '{version_actual}',
  '1'
)
WHERE metadata IS NOT NULL
  AND metadata->>'version_actual' IS NULL;

-- Inicializar siguiente_numero_referencia
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
  metadata,
  '{siguiente_numero_referencia}',
  '1'
)
WHERE metadata IS NOT NULL;
```

---

## 📋 Checklist Final

- [x] Backend completo
- [x] Componentes UI creados
- [x] Imports en page.tsx
- [x] Estados agregados
- [x] handleProcessWithArchetype actualizado
- [ ] SentidoInput integrado
- [ ] TextVersionViewer integrado
- [ ] ArchetypeTimeline integrado
- [ ] ReferencesPanel integrado
- [ ] Migración SQL ejecutada
- [ ] Pruebas completas

---

## 🎯 Próxima Acción

**Opción A (Rápida):** Puedo continuar integrando los componentes en page.tsx ahora

**Opción B (Manual):** Puedes integrar los componentes tú mismo siguiendo los snippets de arriba

**Opción C (Incremental):** Integrar un componente a la vez, probar, y continuar

¿Qué prefieres?
