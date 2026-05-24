-- Migration: Agregar job_type 'cognetica_metabolizacion' al enum job_type
-- Permite registrar cada paso del pipeline de metabolización de Cognetica
-- en la tabla ai_job_history para tracking en tiempo real e historial de tokens.

ALTER TYPE job_type ADD VALUE IF NOT EXISTS 'cognetica_metabolizacion';
