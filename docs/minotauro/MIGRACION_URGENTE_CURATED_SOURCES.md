# 🚨 MIGRACIÓN URGENTE: Curated Sources de paragraph_id a galaxy_id

**Fecha:** 16 Febrero 2026  
**Prioridad:** CRÍTICA - Bloquea funcionalidad de selector de artefactos  
**Estado:** Pendiente de ejecutar

---

## 📋 Problema

La tabla `minotauro_curated_sources` tiene la columna `paragraph_id`, pero la nueva arquitectura de Minotauro ya no usa párrafos. Las **galaxias son ahora las secciones MD editables** directamente, sin párrafos intermedios.

El código TypeScript ya está actualizado para usar `galaxy_id`, pero la base de datos aún tiene `paragraph_id`, causando errores al intentar guardar fuentes curadas.

---

## ✅ Solución: Ejecutar SQL en Supabase Dashboard

### **Opción 1: SQL Editor (RECOMENDADO)**

1. **Abre Supabase Dashboard:** https://supabase.com/dashboard/project/vgnteswwvallupuanfiz
2. **Ve a SQL Editor** (icono de base de datos en el menú lateral)
3. **Crea una nueva query**
4. **Copia y pega el siguiente SQL:**

```sql
-- ============================================
-- FIX: Conectar fuentes curadas a galaxias
-- ============================================

-- 1. Eliminar constraint antigua
ALTER TABLE minotauro_curated_sources 
  DROP CONSTRAINT IF EXISTS minotauro_curated_sources_paragraph_id_fkey;

-- 2. Renombrar columna paragraph_id a galaxy_id
ALTER TABLE minotauro_curated_sources 
  RENAME COLUMN paragraph_id TO galaxy_id;

-- 3. Agregar nueva FK a galaxias
ALTER TABLE minotauro_curated_sources 
  ADD CONSTRAINT minotauro_curated_sources_galaxy_id_fkey 
  FOREIGN KEY (galaxy_id) REFERENCES minotauro_galaxies(id) ON DELETE CASCADE;

-- 4. Actualizar índice
DROP INDEX IF EXISTS idx_minotauro_sources_paragraph;
CREATE INDEX idx_minotauro_sources_galaxy ON minotauro_curated_sources(galaxy_id);

-- 5. Actualizar políticas RLS
DROP POLICY IF EXISTS "Users can view sources of their paragraphs" ON minotauro_curated_sources;
DROP POLICY IF EXISTS "Users can manage sources of their paragraphs" ON minotauro_curated_sources;

CREATE POLICY "Users can view sources of their galaxies"
  ON minotauro_curated_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_galaxies g
      JOIN minotauro_universes u ON g.universe_id = u.id
      JOIN project_members pm ON u.project_id = pm.project_id
      WHERE g.id = galaxy_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage sources of their galaxies"
  ON minotauro_curated_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM minotauro_galaxies g
      JOIN minotauro_universes u ON g.universe_id = u.id
      JOIN project_members pm ON u.project_id = pm.project_id
      WHERE g.id = galaxy_id
      AND pm.user_id = auth.uid()
    )
  );

-- 6. Actualizar comentarios
COMMENT ON TABLE minotauro_curated_sources IS 'Fuentes curadas desde Cognética enlazadas a galaxias específicas';
COMMENT ON COLUMN minotauro_curated_sources.galaxy_id IS 'ID de la galaxia (sección MD) a la que pertenece esta fuente';
```

5. **Haz clic en "Run"** (botón verde)
6. **Verifica que no haya errores**

---

### **Opción 2: Endpoint API Temporal (Alternativa)**

Si prefieres ejecutar desde la aplicación:

1. **Abre en el navegador:** http://localhost:3000/api/migrate/curated-sources
2. **Haz un POST request** (puedes usar Postman, curl, o el navegador con extensión)
3. **Verifica la respuesta** - debe decir "Migración completada"

**Comando curl:**
```bash
curl -X POST http://localhost:3000/api/migrate/curated-sources
```

---

## 🔍 Verificación Post-Migración

Después de ejecutar la migración, verifica que funcionó:

```sql
-- Verificar que la columna se renombró
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'minotauro_curated_sources';

-- Debe mostrar 'galaxy_id', NO 'paragraph_id'
```

---

## 📝 Cambios Realizados en el Código

### **Archivos TypeScript Actualizados:**

1. **`/lib/types/minotauro-types.ts`**
   - `AddCuratedSourcePayload.paragraph_id` → `galaxy_id`

2. **`/lib/actions/minotauro-actions.ts`**
   - `addCuratedSource()` - Usa `galaxy_id`
   - `getCuratedSourcesWithDetails()` - Consulta por `galaxy_id`

3. **`/app/cognetica/minotauro/[universeId]/galaxy/[galaxyId]/components/CuratedSourcesPanel.tsx`**
   - Props: `paragraphId` → `galaxyId`
   - Todas las referencias actualizadas

4. **`/app/cognetica/minotauro/[universeId]/page.tsx`**
   - `<CuratedSourcesPanel paragraphId={...}` → `galaxyId={...}`

---

## ✅ Resultado Esperado

Después de ejecutar la migración:

1. ✅ **Selector de artefactos funciona** - Los artefactos se guardan correctamente
2. ✅ **No más errores TypeScript** - Los tipos coinciden con la BD
3. ✅ **Fuentes se conectan a galaxias** - No a párrafos inexistentes
4. ✅ **RLS funciona correctamente** - Permisos basados en proyecto

---

## 🐛 Si Algo Sale Mal

### **Rollback (Revertir cambios):**

```sql
-- Revertir a paragraph_id
ALTER TABLE minotauro_curated_sources 
  DROP CONSTRAINT IF EXISTS minotauro_curated_sources_galaxy_id_fkey;

ALTER TABLE minotauro_curated_sources 
  RENAME COLUMN galaxy_id TO paragraph_id;

ALTER TABLE minotauro_curated_sources 
  ADD CONSTRAINT minotauro_curated_sources_paragraph_id_fkey 
  FOREIGN KEY (paragraph_id) REFERENCES minotauro_paragraphs(id) ON DELETE CASCADE;
```

---

## 📊 Estado Actual

- ✅ **Código TypeScript:** Actualizado a `galaxy_id`
- ❌ **Base de Datos:** Aún tiene `paragraph_id`
- ⏸️ **Funcionalidad bloqueada:** Selector de artefactos no puede guardar

**EJECUTA LA MIGRACIÓN PARA DESBLOQUEAR** 🚀
