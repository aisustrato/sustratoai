-- Migration: Eliminar constraint chk_destilado_tokens_cap
-- Destilado v2 (Hito 6) produce output JSON mucho más extenso:
-- estructura_documento, esqueleto_argumental, insumos con descripciones,
-- citas_textuales sin techo, y referencias bibliográficas exhaustivas.
-- El constraint de 1500 tokens ya no tiene sentido para el schema v2.

ALTER TABLE cgt_destilados
DROP CONSTRAINT IF EXISTS chk_destilado_tokens_cap;
