-- 📍 SQL para explorar estructura de tablas y encontrar nombres correctos
-- 🎯 PROPÓSITO: Identificar las tablas correctas de preclasificación

-- 1. Listar todas las tablas que contienen "dimension" o "preclass"
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name ILIKE '%dimension%' 
   OR table_name ILIKE '%preclass%'
   OR table_name ILIKE '%classification%'
ORDER BY table_name;

-- 2. Listar todas las tablas del schema public (para ver estructura completa)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name ILIKE '%article%'
ORDER BY table_name;

-- 3. Si la tabla se llama diferente, verificar estructura de dimensiones
-- Posibles nombres alternativos que podrían existir:
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preclass_dimensions' 
   OR table_name = 'classification_dimensions'
   OR table_name = 'dimensions'
ORDER BY ordinal_position;

-- 4. Verificar si existe tabla de dimensiones con otro nombre
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
      AND (table_name ILIKE '%dimension%' OR table_name ILIKE '%preclass%')
)
ORDER BY table_name, ordinal_position;

-- 5. Verificar estructura de article_dimension_reviews (que sí debería existir)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'article_dimension_reviews'
ORDER BY ordinal_position
LIMIT 20;
