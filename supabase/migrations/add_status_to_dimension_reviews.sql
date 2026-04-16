-- =========================================
-- MIGRACIÓN: Agregar campo status a article_dimension_reviews
-- Fecha: 2025-10-17
-- Propósito: Permitir status independiente por dimensión
-- =========================================

-- 1. Agregar columna status
ALTER TABLE article_dimension_reviews 
ADD COLUMN status batch_preclass_status DEFAULT 'review_pending';

-- 2. Crear índice para mejorar performance
CREATE INDEX idx_article_dimension_reviews_status 
ON article_dimension_reviews(status);

-- 3. Migrar datos existentes basándose en iteración
-- Iter 1 → 'review_pending'
UPDATE article_dimension_reviews 
SET status = 'review_pending'
WHERE iteration = 1;

-- Iter 2 → 'reconciliation_pending' (desacuerdo)
UPDATE article_dimension_reviews 
SET status = 'reconciliation_pending'
WHERE iteration = 2;

-- Iter 3 → 'reconciliation_pending' (esperando decisión por defecto)
UPDATE article_dimension_reviews 
SET status = 'reconciliation_pending'
WHERE iteration >= 3;

-- 4. Crear función para calcular status de artículo basado en dimensiones
-- El artículo hereda el PEOR estado de sus dimensiones
CREATE OR REPLACE FUNCTION calculate_article_status_from_dimensions(
  p_article_batch_item_id UUID
) RETURNS batch_preclass_status AS $$
DECLARE
  v_has_disputed BOOLEAN;
  v_has_reconciliation_pending BOOLEAN;
  v_has_review_pending BOOLEAN;
  v_all_validated BOOLEAN;
  v_all_reconciled_or_validated BOOLEAN;
BEGIN
  -- Verificar si tiene alguna dimensión en cada estado
  SELECT 
    bool_or(status = 'disputed') as has_disputed,
    bool_or(status = 'reconciliation_pending') as has_reconciliation_pending,
    bool_or(status = 'review_pending') as has_review_pending,
    bool_and(status = 'validated') as all_validated,
    bool_and(status IN ('validated', 'reconciled')) as all_reconciled_or_validated
  INTO 
    v_has_disputed,
    v_has_reconciliation_pending,
    v_has_review_pending,
    v_all_validated,
    v_all_reconciled_or_validated
  FROM (
    -- Obtener el status de la última review de cada dimensión
    SELECT DISTINCT ON (dimension_id) 
      status
    FROM article_dimension_reviews
    WHERE article_batch_item_id = p_article_batch_item_id
    ORDER BY dimension_id, iteration DESC, created_at DESC
  ) latest_reviews;

  -- Jerarquía de criticidad (retornar el peor estado)
  -- disputed > reconciliation_pending > review_pending > reconciled > validated
  
  IF v_has_disputed THEN
    RETURN 'disputed';
  ELSIF v_has_reconciliation_pending THEN
    RETURN 'reconciliation_pending';
  ELSIF v_has_review_pending THEN
    RETURN 'review_pending';
  ELSIF v_all_reconciled_or_validated THEN
    -- Si todas están reconciliadas o validadas, usar 'reconciled' si hay al menos una reconciliada
    IF EXISTS (
      SELECT 1 FROM (
        SELECT DISTINCT ON (dimension_id) status
        FROM article_dimension_reviews
        WHERE article_batch_item_id = p_article_batch_item_id
        ORDER BY dimension_id, iteration DESC, created_at DESC
      ) latest WHERE status = 'reconciled'
    ) THEN
      RETURN 'reconciled';
    ELSE
      RETURN 'validated';
    END IF;
  ELSE
    RETURN 'review_pending';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Crear función trigger para actualizar status de article_batch_items
CREATE OR REPLACE FUNCTION update_article_status_from_dimensions()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el status del artículo basándose en sus dimensiones
  UPDATE article_batch_items
  SET status = calculate_article_status_from_dimensions(NEW.article_batch_item_id)
  WHERE id = NEW.article_batch_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger que se ejecuta cuando cambia una dimensión
DROP TRIGGER IF EXISTS trigger_update_article_status ON article_dimension_reviews;
CREATE TRIGGER trigger_update_article_status
AFTER INSERT OR UPDATE OF status ON article_dimension_reviews
FOR EACH ROW
EXECUTE FUNCTION update_article_status_from_dimensions();

-- 7. Crear función para actualizar status de lote basado en artículos
CREATE OR REPLACE FUNCTION calculate_batch_status_from_articles(
  p_batch_id UUID
) RETURNS batch_preclass_status AS $$
DECLARE
  v_has_disputed BOOLEAN;
  v_has_reconciliation_pending BOOLEAN;
  v_has_review_pending BOOLEAN;
  v_all_validated BOOLEAN;
  v_all_reconciled_or_validated BOOLEAN;
  v_all_translated BOOLEAN;
  v_all_pending BOOLEAN;
BEGIN
  SELECT 
    bool_or(status = 'disputed') as has_disputed,
    bool_or(status = 'reconciliation_pending') as has_reconciliation_pending,
    bool_or(status = 'review_pending') as has_review_pending,
    bool_and(status = 'validated') as all_validated,
    bool_and(status IN ('validated', 'reconciled')) as all_reconciled_or_validated,
    bool_and(status = 'translated') as all_translated,
    bool_and(status = 'pending') as all_pending
  INTO 
    v_has_disputed,
    v_has_reconciliation_pending,
    v_has_review_pending,
    v_all_validated,
    v_all_reconciled_or_validated,
    v_all_translated,
    v_all_pending
  FROM article_batch_items
  WHERE batch_id = p_batch_id;

  -- Jerarquía de estados (de más crítico a menos crítico)
  IF v_has_disputed THEN
    RETURN 'disputed';
  ELSIF v_has_reconciliation_pending THEN
    RETURN 'reconciliation_pending';
  ELSIF v_has_review_pending THEN
    RETURN 'review_pending';
  ELSIF v_all_reconciled_or_validated THEN
    IF EXISTS (
      SELECT 1 FROM article_batch_items
      WHERE batch_id = p_batch_id AND status = 'reconciled'
    ) THEN
      RETURN 'reconciled';
    ELSE
      RETURN 'validated';
    END IF;
  ELSIF v_all_translated THEN
    -- ✅ NUEVO: Si todos los items están traducidos, el batch está traducido
    RETURN 'translated';
  ELSIF v_all_pending THEN
    -- Si todos están pendientes, el batch está pendiente
    RETURN 'pending';
  ELSE
    -- Estado por defecto cuando hay mezcla de estados
    RETURN 'review_pending';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Crear trigger para actualizar status del lote cuando cambia un artículo
CREATE OR REPLACE FUNCTION update_batch_status_from_articles()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el status del lote basándose en sus artículos
  UPDATE article_batches
  SET status = calculate_batch_status_from_articles(NEW.batch_id)
  WHERE id = NEW.batch_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_batch_status ON article_batch_items;
CREATE TRIGGER trigger_update_batch_status
AFTER UPDATE OF status ON article_batch_items
FOR EACH ROW
EXECUTE FUNCTION update_batch_status_from_articles();

-- 9. Actualizar status de todos los artículos existentes basándose en sus dimensiones
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT article_batch_item_id 
    FROM article_dimension_reviews
  LOOP
    UPDATE article_batch_items
    SET status = calculate_article_status_from_dimensions(r.article_batch_item_id)
    WHERE id = r.article_batch_item_id;
  END LOOP;
END $$;

-- 10. Actualizar status de todos los lotes existentes basándose en sus artículos
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT id 
    FROM article_batches
  LOOP
    UPDATE article_batches
    SET status = calculate_batch_status_from_articles(r.id)
    WHERE id = r.id;
  END LOOP;
END $$;

-- =========================================
-- COMENTARIOS FINALES
-- =========================================
COMMENT ON COLUMN article_dimension_reviews.status IS 
  'Status de esta dimensión específica: review_pending, reconciliation_pending, validated, reconciled, disputed';

COMMENT ON FUNCTION calculate_article_status_from_dimensions IS 
  'Calcula el status de un artículo basándose en el peor status de sus dimensiones';

COMMENT ON FUNCTION calculate_batch_status_from_articles IS 
  'Calcula el status de un lote basándose en el peor status de sus artículos';
