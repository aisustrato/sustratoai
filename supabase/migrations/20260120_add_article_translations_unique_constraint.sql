-- 📍 supabase/migrations/20260120_add_article_translations_unique_constraint.sql
-- 🎯 PROPÓSITO: Agregar constraint único a article_translations para garantizar
--              una sola traducción por (artículo, idioma)
-- 🚨 FILOSOFÍA: Errores ruidosos > Sobrescritura silenciosa
--              Ver: /docs/FILOSOFIA_ERRORES_RUIDOSOS.md

-- Agregar constraint único para evitar traducciones duplicadas
-- Esto hace que INSERT falle ruidosamente si se intenta re-traducir
ALTER TABLE article_translations 
ADD CONSTRAINT article_translations_unique 
UNIQUE (article_id, language);

-- 📊 IMPACTO:
-- ✅ Primera traducción: Funciona normal
-- ❌ Re-traducir mismo artículo+idioma: ERROR VISIBLE "duplicate key violates unique constraint"
-- ✅ Detecta bugs en lógica de negocio tempranamente
-- ✅ No permite sobrescritura silenciosa de traducciones

-- 🔧 CÓDIGO RELACIONADO:
-- /lib/actions/preclassification-actions.ts (función saveBatchTranslations)
-- Usa .insert() en lugar de .upsert() para aprovechar este constraint
