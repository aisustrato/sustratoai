# Hoja de Ruta: Estabilización e Infraestructura Sustrato.ai

Este documento define los hitos secuenciales para garantizar la estabilidad técnica, la escalabilidad de la infraestructura y la implementación de funcionalidades críticas. No se definen fechas, sino estados de cumplimiento que desbloquean el siguiente nivel.

---

## 🏁 Hito 1: Visibilidad y Coherencia Visual (Estado: Validación Final)
**Objetivo:** Garantizar que el operador humano tenga control total sobre los lotes ("momento sin cierre") y que el lenguaje visual (Quipu) sea consistente.

*   **Acciones de Ingeniería (NK):**
    *   ✅ Implementar RPC `get_all_project_batches` para ignorar asignaciones de usuario y mostrar todo.
    *   ✅ Actualizar `preclassification-actions.ts` para consumir la nueva RPC con fallback.
    *   ✅ Implementar componente `StandardQuipuIndicator` para estados visuales.
    *   ✅ Integrar Quipu Emoji en la vista de tabla (`TableLikeView`).
*   **Validación (Humano):**
    *   Confirmar visualización de lotes activos en la interfaz.
    *   Verificar tooltip y colores del indicador Quipu.

---

## 🏗️ Hito 2: Restructuración de Infraestructura (Estado: Prioridad Alta)
**Objetivo:** Migrar a planes profesionales para soportar cargas de trabajo reales (audios, imágenes 4K, procesos largos) y evitar limitaciones de capa gratuita (timeouts).

*   **Acciones de Gestión (Humano + Guía NK):**
    *   [ ] **Supabase Pro:** Creación de Organización/Team y upgrade de plan ($25/mo).
    *   [ ] **Vercel Pro:** Creación de Team y upgrade de plan ($20/mo).
*   **Acciones de Ingeniería (NK):**
    *   [ ] Configurar Point-in-Time Recovery (PITR) en Supabase.
    *   [ ] Aumentar límites de tiempo de ejecución en Serverless Functions (Vercel) para evitar timeouts en Jobs de IA.
    *   [ ] Verificar permisos y acceso de las cuentas de servicio (NK-🌊, NK-🏄🏽).

---

## 🛡️ Hito 3: Observabilidad y Protocolos de Delegación (Estado: Pendiente)
**Objetivo:** Establecer sistemas pasivos de monitoreo para que el humano solo intervenga en decisiones críticas ("Alerta Roja").

*   **Acciones de Ingeniería (NK):**
    *   [ ] Implementar logging estructurado para errores críticos (Supabase + Vercel logs).
    *   [ ] Establecer protocolo de "Modo Avión" (Degradación elegante de servicios).
    *   [ ] Documentar rutina de verificación de backups (Semanal).

---

## 📤 Hito 4: Quick Win 2 - Exportabilidad y Métricas (Estado: En Cola)
**Objetivo:** Permitir la extracción de "semillas fractales" (datos procesados) fuera del sistema para análisis externo.

*   **Acciones de Ingeniería (NK):**
    *   [ ] Implementar exportación CSV de lotes completos.
    *   [ ] Incluir métricas de consenso (Kappa, % acuerdo) en la exportación.
    *   [ ] Generar reporte de "Salud del Lote".

---

## 🧠 Hito 5: Módulo Cognética Forense (Estado: Futuro Próximo)
**Objetivo:** Procesamiento científico de entrevistas y artefactos multimedia.

*   **Acciones de Ingeniería (NK):**
    *   [ ] Implementar pipeline de subida segura a Supabase Storage (para archivos grandes).
    *   [ ] Integrar API de Deepgram para transcripción automatizada.
    *   [ ] Crear flujo de destilación con IA (Nortia NK-♻️🧠).
