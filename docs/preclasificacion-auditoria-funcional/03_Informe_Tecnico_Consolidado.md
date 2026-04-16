# 📘 Informe Técnico Consolidado: Ecosistema de Pre-clasificación y Auditoría

**Fecha:** 12 Enero 2026
**Auditor:** Cascade AI
**Estado:** Final / Consolidado

Este documento unifica todos los hallazgos técnicos sobre el funcionamiento real del sistema, diseñado para la contraparte técnica. Cubre el ciclo de vida completo del dato, desde la ingesta hasta la explotación "offline", y detalla los mecanismos de seguridad y revisión.

---

## 1. 🧬 Arquitectura del Flujo de Datos (The Pipeline)

El sistema no es una caja negra; es un pipeline secuencial con validación estricta.

### A. Input: Ingesta y Elegibilidad
La entrada de datos no es directa. Sigue un patrón de **Promoción**.
1.  **Origen**: Tabla `articles` (Base maestra).
2.  **Filtro**: Tabla `phase_eligible_articles`. Solo los artículos explícitamente vinculados a una `phase_id` entran al juego.
3.  **Agrupación**: Tabla `article_batches` (Lotes).
4.  **Unidad de Proceso**: `article_batch_items`.
    *   **Condición de Disparo**: El código exige que el lote tenga `status = 'translated'` para iniciar la IA. Esto implica que la traducción es un prerrequisito duro en la implementación actual.

### B. Proceso: El Motor Híbrido (IA + Validación)
Ubicación: `lib/actions/preclassification-actions.ts`

El procesamiento (`runPreclassificationJob`) ocurre en segundo plano y tiene tres capas de seguridad:

1.  **Capa de Bloqueo (Concurrency)**:
    *   Antes de arrancar, verifica en `ai_job_history` si ya existe un trabajo corriendo para el mismo lote en los últimos 20 minutos. Si sí, aborta. Esto evita condiciones de carrera y gasto doble.

2.  **Capa Cognitiva (DeepSeek)**:
    *   Modelo hardcodeado: `deepseek-chat`.
    *   Prompting: Se construye dinámicamente inyectando las dimensiones y sus opciones válidas desde la BD.

3.  **Capa de Integridad (The Firewall)**:
    *   El sistema **no guarda ciegamente** lo que dice la IA.
    *   **Validación de Opciones**: Si la dimensión es cerrada (ej. "Tipo de Estudio"), el sistema verifica que la respuesta de la IA coincida *exactamente* con una opción existente en la BD.
    *   **Manejo de "Otros"**: Si la IA responde "Otros: [Explicación]", el código detecta esto y busca el ID de la opción "Otros" en la base de datos para mantener la integridad relacional.
    *   **Repechaje**: Si un bloque de artículos falla (JSON inválido), se reintenta automáticamente una vez más.

### C. Output: Auditoría Inmutable
El sistema utiliza un modelo de **Log de Eventos (Append-Only)** en la tabla `article_dimension_reviews`.
*   Nunca se hace `UPDATE` para corregir una clasificación. Se hace `INSERT`.
*   Esto garantiza que **siempre** exista el registro original de lo que pensó la IA, incluso si un humano lo corrige después.

---

## 2. 🔄 El Flujo de Revisión (Human-in-the-Loop)

El sistema gestiona el desacuerdo mediante un ciclo de iteraciones incremental.

### Ciclo de Vida del Dato
1.  **Iteración 1 (IA)**:
    *   Actor: IA.
    *   Estado: `review_pending`.
    *   Resultado: Clasificación base + Confianza + Justificación.

2.  **Iteración 2 (Humano - Validación/Corrección)**:
    *   El investigador interactúa con la interfaz.
    *   **Si aprueba**: El estado cambia a `validated`.
    *   **Si corrige**: Se inserta una **NUEVA FILA** con `iteration: 2` y `reviewer_type: 'human'`.
    *   Estado del ítem: Pasa a `reconciled` (Reconciliado).

3.  **Iteración 3+ (Arbitraje)**:
    *   Si hay cambios posteriores, se considera una disputa.
    *   Estado: `disputed`.

**Impacto Técnico**: Este diseño permite realizar análisis forenses de la calidad del modelo ("¿En qué temas falla más la IA?") comparando la Iteración 1 vs. Iteración 2.

---

## 3. 🛡️ Soberanía del Dato y Herramientas Offline

El sistema está diseñado para que el investigador sea dueño de sus datos y no dependa de la plataforma para el análisis final.

### A. Exportación Granular (CSV)
*   **Código**: `app/articulos/analisis-preclasificacion/page.tsx`.
*   **Funcionalidad**: Permite descargar un CSV completo con todas las dimensiones, justificaciones y metadatos.
*   **Filtrado en Origen**: La exportación respeta los filtros visuales activos. Si el usuario filtra por "Confianza Baja", el CSV descargado contendrá solo esos registros, facilitando la creación de *datasets* de revisión externa.

### B. Gráficos Vectoriales Portables (SVG)
*   **Código**: `components/charts/StandardBarChart.tsx`.
*   **Tecnología**: `@nivo/bar` sobre React/D3.
*   **Característica Clave**: El botón "Exportar SVG" no toma una captura de pantalla. Serializa el código SVG real del navegador.
*   **Uso**: Esto entrega gráficos vectoriales infinitamente escalables, listos para ser insertados en *papers* académicos o pósters sin pixelarse.

### C. Editor de Notas Híbrido (`StandardNote`)
*   **Código**: `components/ui/StandardNote.tsx`.
*   **Innovación**: Un editor de "doble panel" (Split View) que enseña Markdown al usuario. A la izquierda escribe, a la derecha ve el resultado en tiempo real, con sincronización de scroll inteligente.

---

## 4. ⚠️ Notas para la Contraparte Técnica

### Aclaración sobre "Bloqueos de Seguridad"
Si en algún reporte previo leyó sobre "bloqueo de seguridad", se refiere a una restricción operativa de **mi entorno de auditoría** (impedimento de sobrescribir archivos ya cerrados), **no** a un fallo del sistema SUSTRATO. El sistema auditado es robusto y no presentó bloqueos.

### Deuda Técnica Identificada
1.  **Bypass de RLS**: Los jobs de fondo usan `service_role` (admin total). Esto es estándar para backend jobs, pero centraliza la seguridad en el código TypeScript (`preclassification-actions.ts`) en lugar de la base de datos.
2.  **DeepSeek Hardcoded**: El modelo de IA está "quemado" en el código. Cambiar de proveedor requiere despliegue de software.
3.  **Traducción Obligatoria**: El flujo actual se rompe si el lote no está traducido.

---

**Conclusión Final**:
SUSTRATO implementa una arquitectura sólida de **"IA como Asistente, no como Juez"**. El modelo de datos inmutable, las herramientas de exportación soberana y el flujo de revisión iterativo garantizan que el control científico permanezca siempre en manos del equipo humano.
