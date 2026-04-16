# 🕵️ Estado Actual de la Lógica: Pre-clasificación y Auditoría

**Fecha de Auditoría:** 12 Enero 2026
**Arqueólogo:** Cascade AI
**Objetivo:** Documentar la realidad fáctica del código implementado, ignorando documentación previa.

---

## 1. 🔄 Flujo de Datos: El Pipeline Real

El sistema opera bajo un modelo de **Fases** y **Lotes**, donde los artículos fluyen desde un "Universo Elegible" hacia "Lotes de Procesamiento" que son consumidos por la IA o Humanos.

### A. Input (Ingesta de Datos)

El punto de entrada no es directo desde la tabla `articles`. Existe una capa intermedia de elegibilidad controlada por fases.

1.  **Universo Elegible (`phase_eligible_articles`)**:
    *   **Lógica**: Los artículos se seleccionan de la tabla maestra `articles` y se insertan en `phase_eligible_articles` vinculados a una `phase_id`.
    *   **Código**: `lib/actions/phase-eligible-articles-actions.ts` (`populateInitialPhaseUniverse`, `listEligibleArticlesForPhase`).
    *   **Realidad**: Para la Fase 1, se copian masivamente. Para fases posteriores, hay lógica de "pase" (no detallada profundamente en esta auditoría, pero visible en `addToPhaseUniverse`).

2.  **Loteo (`article_batches` + `article_batch_items`)**:
    *   **Lógica**: Se toman artículos del universo elegible y se segmentan en lotes (ej. 50 artículos).
    *   **Código**: `lib/actions/batch-actions.ts` -> `createBatches`.
    *   **Estado Inicial**: Los ítems nacen con status `'pending'` (Fase 1) o `'translated'` (Fases >1).
    *   **Observación**: `article_batch_items` es la tabla pivote crítica que une el Lote con el Artículo. Es la entidad que se "clasifica".

### B. Proceso (El Motor de Pre-clasificación IA)

El proceso es asíncrono y está desacoplado del frontend mediante un sistema de trabajos (`Jobs`).

1.  **Disparador (`startInitialPreclassification`)**:
    *   **Ubicación**: `lib/actions/preclassification-actions.ts`
    *   **Mecanismo**:
        1.  Verifica que el lote esté en status `'translated'` (hard requirement actual).
        2.  **Crea un Job** en `ai_job_history` con status `'running'`.
        3.  **Verificación de Duplicados**: Busca jobs activos en los últimos 20 min para el mismo lote. Si encuentra, aborta.
        4.  Lanza el proceso en background (`runPreclassificationJob`) sin esperar su término (Fire & Forget para el cliente).

2.  **Ejecución (`runPreclassificationJob`)**:
    *   **Cliente**: Usa `createSupabaseServiceRoleClient` (Admin) para bypass RLS durante el proceso background.
    *   **Preparación**:
        *   Obtiene artículos del lote (`article_batch_items` + `articles`).
        *   Obtiene dimensiones activas (`preclass_dimensions` + opciones).
    *   **Prompting (DeepSeek)**:
        *   Construye un prompt masivo por "Chunk" (mini-lote de ~5 artículos).
        *   **Lógica de Prompt**: `buildPreclassificationPrompt`.
            *   Inyecta definiciones de dimensiones.
            *   Si es dimensión `finite`: Inyecta lista de opciones válidas. Detecta si existe opción "Otros" para dar instrucción especial de flexibilidad.
            *   Si es dimensión `open`: Pide texto libre.
            *   **Formato**: Exige salida JSON estricta.
    *   **Llamada API**: Usa `callDeepSeekAPI` (modelo `deepseek-chat` hardcodeado en `runPreclassificationJob`).

3.  **Validación y "Repechaje"**:
    *   **Validación Dura**: El código TypeScript **no confía en la IA**.
        *   Parsea el JSON.
        *   Para dimensiones finitas: Verifica que el valor devuelto coincida *exactamente* (o normalizado) con una opción de BD.
        *   **Manejo Inteligente de "Otros"**: Si la IA devuelve algo que empieza con "Otros" y la dimensión lo permite, busca el ID de la opción "Otros".
        *   **Confidence**: Mapea 'Alta'/'Media'/'Baja' a 3/2/1. Lanza error si llega algo distinto.
    *   **Repechaje**: Si un chunk falla (JSON inválido, error de red), los artículos fallidos van a una cola de `articulosParaRepechaje` y se reintentan una segunda vez.

### C. Output (Persistencia)

1.  **Resultados de Clasificación (`article_dimension_reviews`)**:
    *   Aquí es donde se guarda la "verdad" de la IA.
    *   **Campos Clave**:
        *   `reviewer_type`: `'ai'` (Hardcodeado en este flujo).
        *   `iteration`: `1` (o `2` si fue repechaje, aunque el código actual parece usar el intento como iteración).
        *   `classification_value`: El texto valor.
        *   `option_id`: El UUID de la opción elegida (crítico para análisis cuantitativo).
        *   `confidence_score`: 1-3.
        *   `rationale`: La justificación en texto.
        *   `status`: `'review_pending'` (El estado inicial de una review de IA).

2.  **Actualización de Estados**:
    *   Al terminar, el job actualiza `article_batch_items` y `article_batches` a status `'review_pending'`.

---

## 2. 🕵️ Auditoría y Trazabilidad

El sistema tiene dos niveles de auditoría: técnica (logs del job) y funcional (reviews).

### A. Auditoría Técnica (`ai_job_history`)
Cada ejecución de IA deja un rastro inmutable en esta tabla.

*   **Entrada**: Se crea al inicio de `startInitialPreclassification`.
*   **Seguimiento**:
    *   `progress`: 0-100.
    *   `details`: JSON que se actualiza en tiempo real con "step", "total", "processed".
    *   `input_tokens` / `output_tokens`: Se incrementan vía RPC `increment_job_tokens` tras cada llamada a DeepSeek.
*   **Estado Final**: `completed` o `failed` (con `error_message`).

### B. Auditoría Funcional (La "Review")
La tabla `article_dimension_reviews` actúa como log de auditoría del juicio.

*   **No se sobrescribe**: El diseño permite múltiples reviews para el mismo par Artículo-Dimensión (diferenciadas por `iteration` y `reviewer_id`).
*   **Trazabilidad Humana**: Si un humano corrige, se inserta una *nueva* fila (iteración > 1) con `reviewer_type: 'human'`, manteniendo la opinión original de la IA intacta.

---

## 3. 📝 Observaciones "Sin Filtro" (Estado Actual)

1.  **Dependencia de "DeepSeek"**: El código llama explícitamente a `callDeepSeekAPI` y el modelo está hardcodeado como `'deepseek-chat'` en la línea ~1067 de `preclassification-actions.ts`. No parece ser configurable dinámicamente desde BD en este punto del código.
2.  **Validación de Status Rígida**: `startInitialPreclassification` exige estrictamente `batch.status === 'translated'`. Si un lote estuviera en 'pending' (Fase 1 pura sin traducción), esto podría fallar si no se maneja esa excepción (aunque `batch-actions` intenta setear el estado inicial correcto).
3.  **Lógica de "Otros"**: Existe una lógica específica en el código (`isSmartOther`) para manejar opciones que empiezan con "Otros". Esto es una regla de negocio hardcodeada en el backend, no configuración de BD.
4.  **Limpieza de JSON**: Hay lógica manual para limpiar bloques de código Markdown (\`\`\`json) de la respuesta de la IA antes de parsear.
5.  **Service Role**: Se usa extensivamente `createSupabaseServiceRoleClient` en las acciones de preclasificación. Esto es correcto para background jobs, pero implica que el código tiene poder absoluto (bypass RLS), por lo que la seguridad recae 100% en la lógica de la función (que valida `user` antes de empezar).

---

**Conclusión:**
El sistema implementa un pipeline robusto "Input -> Job(IA) -> Output(Review)" con fuerte validación de tipos y datos a la salida de la IA. No es una simple "pasarela" de texto; el backend impone estructura y coherencia relacional (IDs de opciones) sobre la salida probabilística de la IA.
