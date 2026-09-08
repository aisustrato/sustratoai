# Corregir sin perder memoria: versionado append-only para anotaciones colaborativas

## El problema

La Fase 1 de anotaciones estilo MDJ en `articulos/detalle` (seleccionar texto del abstract y
marcarlo como frase notable, nota o referencia) nació como una funcionalidad de un solo usuario:
guardar, mostrar, listo. Pero al pensarla más, esa vista de detalle es un **espacio compartido**
— más de un investigador puede pertenecer al mismo proyecto y anotar el mismo abstract.

Ahí aparecen dos necesidades en tensión:

- Los humanos se equivocan al anotar (una palabra que queda afuera de una frase notable, un link
  mal puesto en una referencia) — bloquear la corrección de errores triviales es innecesariamente
  rígido.
- Pero en un espacio compartido, permitir corregir/borrar sin dejar rastro genera un problema de
  confianza real: si dos personas trabajan sobre el mismo documento, hace falta poder responder
  "¿quién anotó esto?" y "¿quién lo cambió o lo borró, y cuándo?" — sin eso, cualquier corrección
  se vuelve una fuente potencial de conflicto silencioso entre colegas.

## La decisión

Ni bloquear la edición (fascista, y contraproducente) ni permitir un `DELETE`/`UPDATE` físico sin
rastro (que es, de hecho, lo que ya hace Cognética Forense con sus propias menciones — un patrón
existente en el repo, pero no uno que valga la pena copiar acá). Y tampoco construir un sistema de
auditoría con sellado por hash como el que ya existe para preclasificación (`preclass_dimension_versions`,
justificado ahí por exigencias de compliance ICMJE/PRISMA/COPE) — sería sobredimensionado para
anotar un abstract.

El punto medio: **nunca pisar contenido, siempre versionar**, con el mínimo de estructura posible
— cuatro columnas nuevas en la misma tabla (`is_current`, `replaces_id`, `deleted_at`,
`deleted_by`) en vez de una tabla de auditoría aparte. Editar inserta una fila nueva enlazada a la
anterior; borrar marca la fila como no-vigente con quién y cuándo, nunca la elimina. La atribución
(quién creó cada anotación) resultó casi gratis: la columna `created_by` ya existía desde el
primer día de la Fase 1, sin que se hubiera pensado todavía en este problema — quedó ahí,
esperando a ser usada.

Un hallazgo lateral, al investigar cómo abordar esto: el árbol de componentes de
`components/mdj-viewer/` (heredado de Cognética Forense) ya traía toda la plomería para editar y
borrar referencias y frases notables de forma asíncrona con reintento ante fallos de red — pero
el componente reusable que las conecta (`StandardMDJViewerClient`) nunca llegó a enchufar esos
callbacks hacia arriba. Eran, literalmente, botones de "Editar"/"Borrar" que no hacían nada en
ningún lugar del sitio donde se usaban. Corregir eso de paso no fue una decisión de diseño nueva,
sino terminar de conectar un diseño que ya existía a medio construir.

## La proyección

Este patrón — versionar en vez de bloquear o destruir — no es específico de un abstract. Es la
base mínima de "control de cambios" que cualquier herramienta de análisis cualitativo
*colaborativo* necesita para ser confiable en equipo. Hoy, aplicado a un párrafo de texto, puede
parecer una capa de más. Pero es exactamente la misma pregunta que se va a volver ineludible en la
Fase 2 (subir el artículo completo, metabolizarlo a MDJ vía Replicate, y anotar sobre él) —
ahí, con documentos completos y más superficie de edición simultánea entre investigadores, la
fricción de "¿quién tocó esto?" va a ser real, no hipotética. Haber resuelto el patrón acá, en
miniatura, es lo que permite escalarlo después sin tener que rediseñarlo desde cero bajo presión.
