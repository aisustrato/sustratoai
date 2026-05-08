# Deuda Técnica: Cognética no es project-aware

**Fecha:** 2026-05-06
**Origen:** Plan de descargas Obsidian-friendly (Fase de exportación)
**Severidad:** Media
**Sprint sugerido:** "Cognética project-aware"

## Diagnóstico

Ninguna operación del módulo Cognética (ingesta, metabolización, visualización,
descargas) verifica ni referencia el proyecto activo. El campo `project_id`
existe en `cgt_artefactos` y se escribe durante la ingesta, pero Cognética
nunca lo usa para autorización, filtrado, ni validación cruzada.

## Tabla de incidencias

| Capa | Qué falta | Impacto |
|---|---|---|
| **Autorización** | `ArtefactoView` no verifica que el artefacto pertenezca al proyecto activo del usuario | Un usuario con el link directo puede ver artefactos de otro proyecto |
| **Navegación** | No hay vista por proyecto (`/cognetica?proyecto=X`). El listado de artefactos no filtra por proyecto | El usuario ve todos los artefactos de todos los proyectos mezclados |
| **Exportación** | Las descargas Obsidian toman `proyectoActual` del auth context, no del artefacto mismo | Si se accede desde otro proyecto, el nombre de proyecto en el frontmatter puede diferir |
| **Semillas/tags** | Tags como `proyecto/NombreProyecto` usan el proyecto activo del usuario, no el proyecto real del artefacto | Inconsistencia si el mismo artefacto se descarga desde distintos proyectos |
| **Deduplicación** | El SHA256 se verifica dentro del mismo `project_id` en ingesta, pero no hay validación cruzada en descarga | El tag de proyecto en exportaciones no tiene verificación de pertenencia |

## Relación con el plan de descargas Obsidian-friendly

El plan recién aprobado asume que `useAuth().proyectoActual` proveerá el
nombre y el ID del proyecto. Esto funciona en runtime, pero el dato no está
atado a una verificación de que el artefacto realmente pertenezca a ese
proyecto. La exportación incluirá tags correctos *si* el usuario está en el
proyecto correcto al descargar.

**Mitigación inmediata (sin costo):** en el hook `useDescargaObsidiana`,
validar que `artefacto.project_id === proyectoActual.id` antes de generar
la descarga. Si no coincide, mostrar un alerta y omitir tags de proyecto.

## Recomendación para sprint futuro

1. En `obtenerArtefactoCompleto`, agregar verificación de que el artefacto
   pertenezca al proyecto activo del usuario (recibir `project_id` como parámetro
   y hacer `.eq("project_id", projectId)` en la query)
2. En el listado de artefactos, filtrar por `project_id` del contexto
3. En exportaciones, usar siempre `artefacto.project_id` como fuente de verdad
   y el nombre del proyecto desde auth como metadata de descarga
