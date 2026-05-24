# TODO list — pendientes acumulados

Lista de items detectados durante el trabajo que no son scope inmediato pero deben revisarse después. Los TODOs en línea (`// TODO:` en código) son fuente complementaria.

## Pendientes

- [ ] **Revisar estandarización de `SustratoLoadingLogo`** por nomenclatura. El proyecto sigue dos convenciones: `Standard*` para primitives del design system y `Sustrato*` para componentes de marca (logo). `SustratoLoadingLogo` mezcla ambos — es marca (usa SustratoLogo dentro) pero también es un primitive de UI (loading state). Decidir si va a `StandardLoadingLogo` y propagar.
- [ ] **Ciclo de vida del SHA-256 en artefactos** — ver tarea #11 en backlog: si se modifica algo del artefacto post-ingesta, el hash actual queda desactualizado. Distinguir del SHA-256 de la tríada empaquetada (append-only en `data_export_registry`). Definir señalización en UI.
