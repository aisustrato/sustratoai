# Guía de Integración Final - Nueva Arquitectura Minotauro

## ✅ Estado Actual: Backend Completo

### **Implementado y Funcionando:**

1. ✅ **Arquitectura append-only completa**
   - Tipos TypeScript definidos
   - Estructura de datos inmutable
   - Historial de versiones y análisis

2. ✅ **useArchetypeProcessor actualizado**
   - Recibe parámetros: `sentido` y `fuentesCuradas`
   - Crea versiones de texto automáticamente
   - Guarda análisis con estructura `ArchetypeAnalysis`
   - Usa IDs únicos (UUID)

3. ✅ **API actualizada**
   - Recibe `sentido` y `fuentes_curadas`
   - Incluye sentido en prompt del arquetipo
   - Incluye referencias numeradas en prompt
   - Instruye al arquetipo sobre cómo citar

4. ✅ **Componentes UI creados**
   - `SentidoInput.tsx` - Pre-calibración
   - `TextVersionViewer.tsx` - Visor PDF con navegación
   - `ArchetypeTimeline.tsx` - Timeline de arquetipos
   - `ReferencesPanel.tsx` - Panel de referencias

5. ✅ **Helpers utilitarios**
   - `referenceHelpers.ts` - Gestión de referencias
   - `versionHelpers.ts` - Gestión de versiones

---

## 🚀 Próximos Pasos: Integración en page.tsx

### **Paso 1: Importar Componentes y Tipos**

```typescript
// En page.tsx, agregar imports:
import { SentidoInput } from './components/SentidoInput';
import { TextVersionViewer } from './components/TextVersionViewer';
import { ArchetypeTimeline } from './components/ArchetypeTimeline';
import { ReferencesPanel } from './components/ReferencesPanel';
import type { 
  GalaxyMetadataAppendOnly, 
  CuratedSourceWithNumber,
  TextVersion,
  ArchetypeAnalysis 
} from '@/lib/types/minotauro-append-types';
import { agregarFuenteCurada } from './utils/referenceHelpers';
import { obtenerUltimaVersion } from './utils/versionHelpers';
```

---

### **Paso 2: Agregar Estados**

```typescript
// Estados para nueva arquitectura
const [sentidoActual, setSentidoActual] = useState<Record<string, string>>({});
const [versionesVisualizadas, setVersionesVisualizadas] = useState<Record<string, number>>({});
```

---

### **Paso 3: Actualizar Llamada a processWithArchetype**

```typescript
// Cuando se procesa con arquetipo:
const result = await processWithArchetype(
  galaxy,
  archetype,
  content,
  proyectoActual.id,
  sentidoActual[galaxyId] || '',  // ← Pasar sentido
  fuentesCuradas  // ← Pasar referencias
);
```

---

### **Paso 4: Reemplazar UI Actual**

#### **Antes (Textarea simple):**
```typescript
<StandardTextarea
  value={content}
  onChange={(e) => handleContentChange(galaxyId, e.target.value)}
  rows={15}
/>
```

#### **Después (Arquitectura completa):**
```typescript
{/* 1. Campo Sentido (arriba) */}
<SentidoInput
  value={sentidoActual[galaxyId] || ''}
  onChange={(value) => setSentidoActual(prev => ({ ...prev, [galaxyId]: value }))}
/>

{/* 2. Visor de Versiones (centro) */}
{metadata.versiones_texto && metadata.versiones_texto.length > 0 ? (
  <TextVersionViewer
    versiones={metadata.versiones_texto}
    versionActual={versionesVisualizadas[galaxyId] || metadata.version_actual || 1}
    onVersionChange={(version) => setVersionesVisualizadas(prev => ({ ...prev, [galaxyId]: version }))}
  />
) : (
  <StandardTextarea
    value={content}
    onChange={(e) => handleContentChange(galaxyId, e.target.value)}
    rows={15}
  />
)}

{/* 3. Timeline de Arquetipos (abajo) */}
{metadata.historial_arquetipos && metadata.historial_arquetipos.length > 0 && (
  <ArchetypeTimeline
    analisis={metadata.historial_arquetipos}
    onSelectAnalysis={(analysisId) => {
      // Expandir análisis seleccionado
      console.log('Ver análisis:', analysisId);
    }}
    onViewVersion={(version) => {
      // Navegar a versión específica
      setVersionesVisualizadas(prev => ({ ...prev, [galaxyId]: version }));
    }}
  />
)}

{/* 4. Panel de Referencias (sidebar o sección) */}
{metadata.fuentes_curadas && metadata.fuentes_curadas.length > 0 && (
  <ReferencesPanel
    fuentes={metadata.fuentes_curadas}
    onSelectReference={(numero) => {
      // Scroll a referencia o mostrar tooltip
      console.log('Ver referencia:', numero);
    }}
    onAddSource={() => {
      // Abrir modal para agregar fuente
      console.log('Agregar fuente');
    }}
  />
)}
```

---

### **Paso 5: Migración de Datos Existentes**

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
  AND metadata->>'version_actual' IS NULL
  AND metadata->>'versiones_texto' IS NOT NULL;

-- Inicializar siguiente_numero_referencia
UPDATE minotauro_galaxies
SET metadata = jsonb_set(
  metadata,
  '{siguiente_numero_referencia}',
  '1'
)
WHERE metadata IS NOT NULL
  AND metadata->>'siguiente_numero_referencia' IS NULL;
```

---

## 🧪 Pruebas Recomendadas

### **Test 1: Flujo Básico**
1. Abrir galaxia
2. Escribir sentido: "Acortar sin diluir"
3. Seleccionar arquetipo: Deslixador
4. Verificar que análisis se guarda con sentido
5. Verificar que aparece en ArchetypeTimeline

### **Test 2: Navegación de Versiones**
1. Procesar con arquetipo
2. Calibrar y ejecutar
3. Verificar que se crea v2
4. Navegar entre v1 y v2 con flechas
5. Verificar que contenido cambia

### **Test 3: Referencias**
1. Agregar fuente curada
2. Verificar que recibe número [1]
3. Procesar con arquetipo
4. Verificar que arquetipo usa (1) en comentarios
5. Ejecutar y verificar que texto generado incluye (1)

### **Test 4: Persistencia**
1. Realizar análisis completo
2. Refrescar página
3. Verificar que historial se mantiene
4. Verificar que versiones se mantienen
5. Verificar que referencias se mantienen

---

## 📊 Estructura de Datos Final

```typescript
// Galaxy metadata después de integración:
{
  // Contenido actual
  content: "Texto actual...",
  word_count: 450,
  char_count: 2500,
  estimated_pages: 1.8,
  
  // Versiones del texto (append-only)
  versiones_texto: [
    {
      version: 1,
      content: "Texto original...",
      timestamp: "2026-02-18T15:00:00Z",
      origen: "humano"
    },
    {
      version: 2,
      content: "Texto después de Deslixador...",
      timestamp: "2026-02-18T15:30:00Z",
      origen: "arquetipo",
      arquetipo_id: "uuid-analisis-1"
    }
  ],
  
  // Análisis de arquetipos (append-only)
  historial_arquetipos: [
    {
      id: "uuid-1",
      version_entrada: 1,
      version_salida: 2,
      archetype: "Deslixador",
      sentido: "Acortar sin diluir",
      timestamp_analisis: "2026-02-18T15:00:00Z",
      timestamp_ejecucion: "2026-02-18T15:30:00Z",
      status: "executed",
      comments: [...],
      instruccion_final: "...",
      tokens: {...}
    }
  ],
  
  // Referencias curadas
  fuentes_curadas: [
    {
      id: "uuid-1",
      numero: 1,
      titulo: "Attention Is All You Need",
      autor: "Vaswani et al.",
      año: 2017,
      tipo: "paper",
      timestamp: "2026-02-18T15:00:00Z"
    }
  ],
  siguiente_numero_referencia: 2,
  
  // Versión actual visualizada
  version_actual: 2
}
```

---

## 🎯 Checklist de Integración

- [ ] Importar componentes y tipos en page.tsx
- [ ] Agregar estados para sentido y versiones visualizadas
- [ ] Actualizar llamada a processWithArchetype con nuevos parámetros
- [ ] Reemplazar Textarea por TextVersionViewer
- [ ] Agregar SentidoInput arriba del visor
- [ ] Agregar ArchetypeTimeline abajo del visor
- [ ] Agregar ReferencesPanel (sidebar o sección)
- [ ] Ejecutar migración SQL en Supabase
- [ ] Probar flujo completo
- [ ] Verificar persistencia después de refresh

---

## 📁 Archivos Clave

**Backend:**
- `hooks/useArchetypeProcessor.ts` ✅ Actualizado
- `app/api/minotauro/process-galaxy/route.ts` ✅ Actualizado

**Componentes:**
- `components/SentidoInput.tsx` ✅ Creado
- `components/TextVersionViewer.tsx` ✅ Creado
- `components/ArchetypeTimeline.tsx` ✅ Creado
- `components/ReferencesPanel.tsx` ✅ Creado

**Helpers:**
- `utils/referenceHelpers.ts` ✅ Creado
- `utils/versionHelpers.ts` ✅ Creado

**Tipos:**
- `lib/types/minotauro-append-types.ts` ✅ Creado

**Documentación:**
- `docs/ARQUITECTURA_APPEND_ONLY_ARQUETIPOS.md`
- `docs/SISTEMA_REFERENCIAS_NUMERADAS.md`
- `docs/RESUMEN_COMPLETO_NUEVA_ARQUITECTURA.md`
- `docs/GUIA_INTEGRACION_FINAL.md` (este archivo)

---

## 🚀 Listo para Integrar

Todo el backend está implementado y funcionando. Solo falta:
1. Integrar componentes UI en page.tsx (copiar/pegar código de arriba)
2. Ejecutar migración SQL
3. Probar

**Tiempo estimado de integración: 30-45 minutos**
