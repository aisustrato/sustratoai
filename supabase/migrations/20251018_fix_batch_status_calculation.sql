-- ==========================================
-- FIX: calculate_batch_status_from_articles debe contemplar status 'translated'
-- ==========================================
-- Problema: El trigger que actualiza el status del batch después de actualizar 
-- los items no contemplaba el status 'translated', entonces siempre devolvía 
-- 'review_pending' por defecto.
--
-- Solución: Agregar lógica para retornar 'translated' cuando todos los items 
-- están en ese estado.

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

-- Verificar que la función funciona correctamente
-- SELECT calculate_batch_status_from_articles('TU_BATCH_ID_AQUI');
