# 🕵️ Auditoría Técnica Completa: Ecosistema de Pre-clasificación

**Fecha de Auditoría:** 12 Enero 2026
**Arqueólogo:** Cascade AI
**Objetivo:** Documentación fáctica y técnica del sistema implementado actualmente.

Este documento consolida el análisis del "Pipeline de IA" y las "Herramientas de Soberanía de Datos" para uso del equipo técnico.

---

## 1. 🔄 Flujo de Datos: El Pipeline Real (Input -> Process -> Output)

El sistema no opera sobre la base de datos "cruda", sino a través de un pipeline estructurado en **Fases**.

### A. Input: La Capa de Elegibilidad
El punto de entrada real es la tabla intermedia `phase_eligible_articles`.
*   **Mecanismo**: Los artículos no entran directamente al proceso de IA. Primero deben ser "promovidos" desde la tabla maestra `articles` hacia un "Universo Elegible" vinculado a una `phase_id`.
*   **Loteo Físico**: Una vez elegibles, los artículos se agrupan en **Lotes (`article_batches`)**.
*   **Unidad Atómica**: La unidad que realmente se procesa es el `article_batch_item`.
    *   *Hallazgo*: El sistema valida estados. Para iniciar la IA, el lote *debe* estar en estado `'translated'` (requisito hardcodeado en `preclassification-actions.ts`), lo que implica un paso de traducción obligatorio previo en la lógica actual.

### B. Proceso: Motor de IA "Caja Gris"
El procesamiento es asíncrono, validado y resiliente. No es una simple llamada a una API.

1.  **Disparador y Seguridad**:
    *   Se inicia vía `startInitialPreclassification`.
    *   **Locking**: Verifica si ya existe un Job corriendo para ese lote en los últimos 20 minutos para evitar duplicidad y gasto innecesario.
    *   **Ejecución**: Se lanza en background ("Fire & Forget" para el usuario).

2.  **El Cerebro (DeepSeek)**:
    *   **Modelo**: Hardcodeado a `deepseek-chat` en el backend.
    *   **Prompting Dinámico**: El prompt se construye inyectando las definiciones de dimensiones activas de la BD.
    *   **Lógica "Otros"**: El backend contiene lógica específica (`isSmartOther`) para manejar inteligentemente la opción "Otros". Si la IA sugiere una categoría nueva o "Otros", el sistema intenta mapearla al ID correcto en la BD, manteniendo la integridad referencial.

3.  **Validación Paranoica**:
    *   El sistema **no confía en la IA**.
    *   Si la IA devuelve un JSON roto o valores que no existen en las opciones definidas ("alucinaciones"), el sistema **descarta** esos resultados específicos.
    *   **Repechaje**: Implementa un mecanismo de reintento automático solo para los "chunks" (grupos de artículos) que fallaron, optimizando el consumo de tokens.

### C. Output: Auditoría Inmutable
El resultado no sobrescribe datos, sino que genera "eventos de juicio".

*   **Tabla**: `article_dimension_reviews`.
*   **Inmutabilidad**:
    *   Iteración 1: Juicio de la IA (`reviewer_type: 'ai'`).
    *   Iteración 2+: Si un humano corrige, se crea una **NUEVA fila** (`reviewer_type: 'human'`).
    *   **Resultado**: El sistema mantiene un historial forense completo. Nunca se pierde "lo que pensó la IA", permitiendo medir la deriva o mejora del modelo en el futuro.

---

## 2. 🛡️ Soberanía de Datos y Análisis "Offline"

El sistema implementa una filosofía de "Desacople": una vez que la IA termina, los datos son del investigador y viven independientemente del modelo.

### A. Exportabilidad Universal (CSV)
Ubicación: `app/articulos/analisis-preclasificacion/page.tsx` -> `handleDownloadCSV`
*   **Descarga Total**: Permite bajar el dataset completo de la fase.
*   **Riqueza de Datos**: Exporta no solo la clasificación (ej. "Experimental"), sino también:
    *   Nivel de Confianza (1-3).
    *   Justificación ("Rationale") textual generada por la IA.
    *   Traducciones y Resúmenes.
*   **Curaduría en Vivo**: La exportación respeta los filtros aplicados en pantalla. El investigador puede filtrar por "Confianza Baja" + "Tema X" y descargar solo ese subset para revisión manual.

### B. Gráficos Portables (SVG)
Ubicación: `components/charts/StandardBarChart.tsx`
*   **Renderizado Nativo**: Usa `@nivo/bar` (basado en D3/React) para generar gráficos vectoriales en el cliente.
*   **Extracción SVG**: Implementa una función técnica `exportChartAsSvg` que serializa el DOM del gráfico y lo entrega como archivo `.svg` limpio.
*   **Impacto**: Permite usar los gráficos directamente en *papers* o publicaciones académicas con calidad infinita, sin depender de capturas de pantalla pixeladas.

---

## 3. 🧑‍🔬 Herramientas del Investigador (Human-in-the-Loop)

Para cerrar la brecha entre la "IA" y el "Humano", el sistema ofrece interfaces especializadas.

### A. Editor de Notas Híbrido (`StandardNote`)
Ubicación: `components/ui/StandardNote.tsx`
Una pieza de ingeniería de UI diseñada para investigadores no técnicos:
*   **Split View**: Edición Markdown a la izquierda, Renderizado a la derecha.
*   **Scroll Sync**: Sincronización matemática del scroll entre ambos paneles (`useScrollSync`), manteniendo el contexto visual siempre alineado.
*   **Live Preview**: Renderizado en tiempo real con *debounce* para no saturar el rendimiento.

### B. Gestión de Conocimiento (Grupos)
*   Permite crear agrupaciones arbitrarias de artículos (manuales o masivas).
*   Útil para separar "Casos de Estudio", "Descartados para Revisión", etc.

---

## 4. 📝 Observaciones Técnicas (Deuda y Riesgos)

Para la contraparte técnica, estos son los puntos de atención inmediata:

1.  **Service Role Bypass**: Los Jobs de background usan `createSupabaseServiceRoleClient`. Esto es necesario para procesos desatendidos, pero significa que la seguridad RLS (Row Level Security) de Supabase es ignorada. La seguridad depende enteramente de la lógica de validación en `lib/actions/preclassification-actions.ts`.
2.  **Hardcoding de Modelo**: El string `'deepseek-chat'` está quemado en el código. Si se desea cambiar a GPT-4 o Claude, requiere un deploy de código, no es configuración de BD.
3.  **Dependencia de Traducción**: El flujo actual *exige* que el lote esté traducido (`status='translated'`) antes de preclasificar. Esto podría ser un bloqueante innecesario si se quisiera clasificar textos originales en español o inglés directamente.
