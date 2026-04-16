# 📑 Anexo Técnico: Aclaraciones de Seguridad y Flujo de Revisión

**Para:** Contraparte Técnica / Equipo de Desarrollo
**De:** Cascade AI (Auditor Técnico)
**Fecha:** 12 Enero 2026

Este documento anexo aclara dudas surgidas durante la auditoría y profundiza en componentes específicos solicitados.

---

## 1. 🔐 Aclaración sobre el "Bloqueo de Seguridad"
Durante la sesión de auditoría, se mencionó un "bloqueo de seguridad" al intentar actualizar un reporte. Es vital aclarar que:

*   **No es un fallo de SUSTRATO**: Este bloqueo **no** proviene de la aplicación auditada ni de su base de datos Supabase.
*   **Origen del Evento**: Fue una restricción de seguridad de mi propio entorno de ejecución (el Agente AI). Intenté sobrescribir un archivo de auditoría que yo mismo acababa de cerrar. Mis protocolos de seguridad interna impidieron esta acción destructiva para preservar la integridad de la evidencia.
*   **Conclusión**: El sistema SUSTRATO.AI no presentó bloqueos; el incidente fue puramente operativo del agente auditor.

---

## 2. 🌐 El Motor de Análisis Web (`AnalisisPreclasificacionPage`)
La "versión web" que visualiza los reportes no es un simple visor estático. Es una aplicación analítica en tiempo real (`SPA` en Next.js).

### Arquitectura de Visualización
*   **Carga Híbrida**:
    *   Utiliza `getAllPreclassifiedArticlesForAnalysis` para traer el dataset completo a memoria del navegador.
    *   Esto permite **filtrado instantáneo** (cross-filtering) por dimensiones y confianza sin volver a consultar al servidor.
*   **Motor Gráfico (`StandardBarChart`)**:
    *   Implementa `@nivo/bar` sobre SVG/D3.
    *   **Capacidad Vectorial**: Los gráficos no son imágenes (`.png`), son vectores matemáticos (`.svg`). Esto permite que el investigador los exporte y escale a cualquier tamaño para papers científicos sin pérdida de calidad.

### Exportación Soberana
*   La función `handleDownloadCSV` ejecuta la transformación de datos en el cliente.
*   **Privacidad**: Los datos se procesan en el navegador del usuario al momento de exportar, respetando los filtros activos.

---

## 3. 🔄 El Flujo de Revisión (The Review Loop)
El sistema implementa un ciclo de vida estricto para garantizar la trazabilidad de cada decisión. No se sobrescriben datos, se "apilan" juicios.

### Ciclo de Vida de una Clasificación

1.  **Iteración 1: La Propuesta (IA)**
    *   **Actor**: `ai` (DeepSeek)
    *   **Status**: `'review_pending'`
    *   **Acción**: El sistema genera una clasificación preliminar con un nivel de confianza (1-3) y una justificación ("rationale").

2.  **Iteración 2: La Validación (Humano)**
    *   El investigador revisa la propuesta en la interfaz.
    *   **Caso A: Concordancia**: Si el humano acepta, el status pasa a `'validated'`. No se crea nueva data, se confirma la existente.
    *   **Caso B: Discrepancia**: Si el humano corrige, se inserta una **NUEVA fila** en la tabla `article_dimension_reviews`.
        *   **Actor**: `human`
        *   **Iteración**: `2`
        *   **Status**: `'reconciled'` (Corrección)

3.  **Iteración 3: El Arbitraje (Conflicto)**
    *   Si existe desacuerdo en la corrección o se requiere una segunda opinión experta.
    *   **Status**: `'disputed'`
    *   Se genera una tercera entrada que actúa como "verdad final".

### Valor para la Contraparte Técnica
Este modelo de datos ("Append-Only Log") permite:
1.  **Entrenamiento Futuro**: Se puede extraer un dataset de "Dónde se equivocó la IA" comparando Iteración 1 vs Iteración 2.
2.  **Auditoría Forense**: Se sabe exactamente quién cambió qué y por qué (gracias al campo `rationale` obligatorio en cambios manuales).
