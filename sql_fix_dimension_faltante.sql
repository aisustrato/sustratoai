-- SQL para insertar la dimensión faltante "Topología de Despliegue"
-- Artículo: 9e770202-f49f-4700-8baf-afbc10ff5b00
-- Dimensión: " Topología de Despliegue" (id: b90f8a0f-c8e2-414e-95af-3758104a0099)

-- Primero, obtener el article_id correcto
SELECT id, title FROM articles WHERE id = (
  SELECT article_id FROM article_batch_items WHERE id = '9e770202-f49f-4700-8baf-afbc10ff5b00'
);

-- Luego insertar la clasificación faltante
INSERT INTO article_dimension_reviews (
  id,
  article_batch_item_id,
  article_id,
  dimension_id,
  reviewer_type,
  reviewer_id,
  iteration,
  classification_value,
  confidence_score,
  rationale,
  status,
  prevalidated,
  is_final,
  created_at
) VALUES (
  gen_random_uuid(),  -- ID único
  '9e770202-f49f-4700-8baf-afbc10ff5b00',  -- article_batch_item_id
  (SELECT article_id FROM article_batch_items WHERE id = '9e770202-f49f-4700-8baf-afbc10ff5b00'),  -- article_id
  'b90f8a0f-c8e2-414e-95af-3758104a0099',  -- dimension_id
  'ai',  -- reviewer_type
  'fde9e7ac-cc2a-4844-916b-f6f1745efa76',  -- reviewer_id
  1,  -- iteration
  'Sensórica Ambiental (El Hábitat)',  -- classification_value
  3,  -- confidence_score (Alta = 3)
  'La infraestructura fusiona datos de actividad en el hogar capturados por tecnologías IoT (sensores ambientales) con interacciones de voz. El hardware principal está desplegado en el hábitat para monitorizar el entorno.',  -- rationale
  'review_pending',  -- status
  false,  -- prevalidated
  false,  -- is_final
  NOW()  -- created_at
);

-- Verificar que se insertó correctamente
SELECT 
  adr.id,
  abi.id as batch_item_id,
  a.title as article_title,
  pd.name as dimension_name,
  adr.classification_value,
  adr.confidence_score,
  adr.rationale
FROM article_dimension_reviews adr
JOIN article_batch_items abi ON adr.article_batch_item_id = abi.id
JOIN articles a ON adr.article_id = a.id
JOIN preclass_dimensions pd ON adr.dimension_id = pd.id
WHERE abi.id = '9e770202-f49f-4700-8baf-afbc10ff5b00'
  AND pd.name LIKE '%Topología%';
