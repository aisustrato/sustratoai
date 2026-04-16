-- Function: is_batch_closed
-- Description: Checks if all dimensions for all items in a batch have been finalized.
--              This replaces 50+ client-side queries with a single DB call.
-- Param: p_batch_id (UUID)
-- Returns: JSONB { isClosed, totalDimensions, finalizedDimensions, percentFinalized }

CREATE OR REPLACE FUNCTION is_batch_closed(p_batch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass RLS complexity if needed, though usually safer to stick to invoker if policies allow
AS $$
DECLARE
  v_phase_id UUID;
  v_total_items INT;
  v_total_dimensions INT;
  v_expected_final_reviews INT;
  v_actual_final_reviews INT;
  v_is_closed BOOLEAN;
  v_percent INT;
BEGIN
  -- 1. Get phase_id for the batch to know which dimensions apply
  SELECT phase_id INTO v_phase_id 
  FROM article_batches 
  WHERE id = p_batch_id;
  
  IF v_phase_id IS NULL THEN
    RETURN jsonb_build_object(
      'isClosed', false,
      'error', 'Batch not found or no phase assigned'
    );
  END IF;

  -- 2. Count items in this batch
  SELECT count(*) INTO v_total_items 
  FROM article_batch_items 
  WHERE batch_id = p_batch_id;

  -- 3. Count active dimensions for this phase
  SELECT count(*) INTO v_total_dimensions 
  FROM preclass_dimensions 
  WHERE phase_id = v_phase_id AND status = 'active';

  -- 4. Calculate expected number of finalized reviews
  -- (Every item needs every dimension to be finalized)
  v_expected_final_reviews := v_total_items * v_total_dimensions;

  -- 5. Count actual finalized reviews for this batch
  -- We join reviews -> items -> batch
  SELECT count(*) INTO v_actual_final_reviews
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
  WHERE abi.batch_id = p_batch_id 
    AND adr.is_final = true;

  -- 6. Determine status
  IF v_expected_final_reviews = 0 THEN
    -- Edge case: no items or no dimensions
    v_is_closed := (v_total_items = 0); -- If no items, it's technically closed? Or open? Let's say not closed if empty to be safe, or handle as needed.
    v_percent := 0;
  ELSE
    v_is_closed := (v_actual_final_reviews >= v_expected_final_reviews);
    v_percent := (v_actual_final_reviews::FLOAT / v_expected_final_reviews::FLOAT * 100)::INT;
    -- Cap percent at 100 just in case of data anomalies
    IF v_percent > 100 THEN v_percent := 100; END IF;
  END IF;

  RETURN jsonb_build_object(
    'isClosed', v_is_closed,
    'totalDimensions', v_expected_final_reviews,
    'finalizedDimensions', v_actual_final_reviews,
    'percentFinalized', v_percent
  );
END;
$$;
