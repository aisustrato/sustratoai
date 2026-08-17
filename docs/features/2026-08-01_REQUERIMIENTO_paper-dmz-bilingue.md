## Requerimiento: DMZ de papers bilingüe (español/inglés)
### Fecha: 2026-08-01

### Contexto

El módulo de publicación de papers (`app/papers/`, "zona DMZ") hoy mezcla
idiomas de forma inconsistente. La tabla `papers` tiene una única columna
`language` (string libre, sin CHECK) y solo el abstract tiene variante
bilingüe real (`abstract_es` obligatorio, `abstract_en` opcional). El resto
del contenido — título, subtítulo, `content_md` (markdown completo del
documento), keywords, anexos — vive en una sola columna sin variante de
idioma.

En la práctica, `language` queda **hardcodeado en `"es"`** en dos puntos
(`app/personal/papers/components/PaperMetadataStep.tsx:120` dentro de
`buildDraftData()`, y `app/personal/papers/nuevo/page.tsx:94`), totalmente
desconectado del idioma real del PDF que se sube y del `content_md` que
genera `app/api/personal/process-paper-pdf/route.ts` (Replicate/Marker, sin
detección de idioma). Resultado: un autor puede subir un PDF en inglés,
`content_md` queda en inglés, pero `language="es"` y `abstract_es` sigue
siendo el campo obligatorio — de ahí la mezcla reportada (abstract en
español, documento en inglés).

En la vista pública (`app/papers/[slug]/page.tsx`):
- `generateMetadata()` arma `description` siempre desde `abstract_es`,
  OpenGraph con `locale: "es_CL"` fijo, y metadata Dublin Core/Google
  Scholar (`DC.language`, `citation_language`) tomada de `paper.language`.
  No hay `alternates.languages` ni hreflang.
- El JSON-LD `ScholarlyArticle` (`app/papers/components/PaperMetadata.tsx`)
  usa `abstract_es` fijo en el campo `abstract` y `paper.language` en
  `inLanguage` — nunca expone `abstract_en` aunque exista.
- La UI de la página (headings "Resumen", "Anexos / Material Suplementario",
  "Licencia", "Cómo citar", etc.) está 100% hardcodeada en español,
  independiente del idioma real del contenido.
- La capa "AI-friendly" (`app/api/papers/route.ts`,
  `app/api/papers/[slug]/route.ts` sirviendo `content_md` crudo en JSON, y
  `app/robots.ts` permitiendo explícitamente GPTBot/ClaudeBot/
  Google-Extended/PerplexityBot/CCBot sobre `/papers/*`) debe preservarse
  intacta — es la razón de ser del módulo DMZ.

No existen server actions dedicadas (`lib/actions/paper-*-actions.ts`); toda
la lógica de datos vive en `lib/papers/queries.ts` (`"use server"`):
`createPaperDraft`, `updatePaperDraft`, `publishPaper`, `unpublishPaper`,
`getPaperBySlug`, `getMyPapers`, `getPaperById`, `deletePaper`, más CRUD de
`paper_images` y `paper_annexes`. Tipos en `lib/papers/types.ts`.

Ya existe un cliente DeepSeek completo y reusable en `lib/deepseek/api.ts`
(`callDeepSeek(config)`: backoff exponencial, timeout duro, cálculo de
costo, ya usado extensivamente en `lib/actions/cognetica-forense-*`), que se
reutilizará para la traducción automática — sin nueva dependencia ni nueva
API key (`DEEPSEEK_API_KEY` ya está configurada).

### Objetivo

El paper publicado debe estar disponible en **ambos idiomas de forma
completa y consistente** (título, subtítulo, abstract, `content_md`,
keywords, anexos), con dos vías de origen elegibles por el autor al
publicar:

1. **Manual**: el autor sube/edita ambas versiones (ES y EN) por separado
   en el editor.
2. **Automática**: el autor sube una sola versión; una llamada a DeepSeek
   (`callDeepSeek`) genera y persiste la versión faltante en el otro
   idioma, cubriendo título, subtítulo, abstract, `content_md` y anexos.

En la vista pública, un botón/toggle con ícono permite cambiar el idioma
visible **a voluntad**, sin cambiar de URL (toggle client-side sobre el
mismo slug — decisión explícita del usuario: prioriza simplicidad sobre
hreflang multi-URL). Toda la lógica SEO-friendly y AI-friendly actual
(sitemap, robots, JSON-LD, endpoints JSON crudos) debe seguir funcionando,
ahora reflejando el idioma activo donde corresponda.

Los papers ya publicados y detectados como mezclados deben backfillearse
automáticamente al desplegar el fix: detectar el idioma real de
`content_md` y generar vía DeepSeek la versión faltante, dejando ambos
idiomas consistentes.

**Criterios de aceptación:**
- Un paper nuevo, publicado con la opción "traducir automáticamente", queda
  con ambas versiones completas persistidas (no solo el abstract).
- El toggle de idioma en la vista pública cambia título, subtítulo,
  abstract, cuerpo del documento, labels de la UI (Resumen/Abstract,
  Anexos/Annexes, Licencia/License, Cómo citar/How to cite) y anexos
  visibles, sin recargar ni cambiar la URL.
- `generateMetadata()` y el JSON-LD siguen siendo coherentes con el idioma
  detectado/por defecto del paper (no rotos por el cambio).
- Los endpoints JSON (`/api/papers/[slug]`) exponen ambas versiones o
  aceptan un parámetro de idioma — a definir en implementación, pero no
  deben perder el `content_md` crudo que consumen los bots de IA.
- Papers existentes mezclados quedan bilingües tras el backfill.
- `npm run build` y `npm run lint` sin warnings nuevos.

### Archivos involucrados

**Esquema de datos** (requiere migración — zona protegida, confirmar antes
de tocar `/supabase/migrations`):
- **Decisión (2026-08-03): Opción A — columnas separadas por idioma**,
  siguiendo el mismo patrón ya usado por `abstract_es`/`abstract_en`.
  Tabla `papers`: agregar columnas `title_en`, `subtitle_en`,
  `content_md_en`, `keywords_en`. `abstract_es`/`abstract_en` ya existen, se
  mantienen sin cambios.
  Revisar si conviene deprecar `language` (string libre) por un campo
  `idioma_original` + los dos idiomas siempre presentes.
- Tabla `paper_annexes`: ya tiene columna `language` propia — revisar si el
  modelo actual (un anexo = un idioma) alcanza o si cada anexo necesita su
  par traducido.

**Backend / lógica**:
- `lib/papers/types.ts` — extender interfaces con los nuevos campos `_en`.
- `lib/papers/queries.ts` — `createPaperDraft`, `updatePaperDraft`,
  `publishPaper` deben aceptar/persistir ambas versiones.
- `lib/deepseek/api.ts` — reusar `callDeepSeek(config)` (no modificar el
  cliente).
- Nuevo: `lib/papers/translate.ts` (o similar) — wrapper que arma el
  prompt de traducción por campo y llama a `callDeepSeek`.
- Nuevo: server action de traducción (ej. `lib/actions/paper-traducir-actions.ts`,
  siguiendo el patrón `cognetica-forense-*-actions.ts`).

**Frontend — edición**:
- `app/personal/papers/components/PaperMetadataStep.tsx` — quitar el
  `language: "es"` hardcodeado (línea 120), agregar selector real y/o toggle
  "traducir automáticamente" vs "subir ambas versiones".
- `app/personal/papers/nuevo/page.tsx` — quitar hardcode línea 94.
- `app/personal/papers/components/PaperMarkdownStep.tsx` — hoy no tiene
  ninguna noción de idioma; necesita UI para la segunda versión de
  `content_md` (manual) o mostrar el resultado de la traducción automática.
- `app/personal/papers/[paperId]/PaperEditClient.tsx` — orquestación del
  flujo de edición con los nuevos campos.

**Frontend — vista pública**:
- `app/papers/[slug]/page.tsx` — `generateMetadata()` debe considerar
  idioma; JSON-LD debe reflejar el idioma activo.
- `app/papers/components/PaperMetadata.tsx` — JSON-LD dinámico por idioma.
- `app/papers/components/PaperHeader.tsx`, `PaperContent.tsx`,
  `DMZNavbar.tsx` — nuevo botón/ícono de toggle de idioma; labels de UI
  bilingües (diccionario simple ES/EN, no i18n framework completo).
- `app/papers/components/PaperActions.tsx` — revisar si "Cómo citar" cambia
  con el idioma.

**API pública**:
- `app/api/papers/route.ts`, `app/api/papers/[slug]/route.ts` — exponer
  ambas versiones o parámetro `?lang=`, sin perder el `content_md` crudo
  que ya sirve de capa AI-friendly.

**Script de backfill** (uso único, no productivo):
- Nuevo script (ej. `scripts/backfill-papers-bilingue.ts`) que recorra
  papers publicados, detecte idioma real de `content_md` y genere la
  versión faltante vía DeepSeek.

### Plan de implementación

1. Diseñar el modelo de datos final (columnas `_en` vs JSON i18n) y
   redactar la migración SQL — **presentarla a Rodolfo antes de aplicar**
   (regla dura: no tocar `/supabase/migrations` sin confirmación explícita).
2. Aplicar la migración en dev/Studio tras aprobación.
3. Extender `lib/papers/types.ts` con los nuevos campos.
4. Construir `lib/papers/translate.ts`: función que recibe el objeto paper
   en un idioma y devuelve los campos traducidos vía `callDeepSeek`
   (prompt por campo o un único prompt estructurado con
   `response_format: json_object`).
5. Actualizar `lib/papers/queries.ts` (`createPaperDraft`,
   `updatePaperDraft`, `publishPaper`) para leer/escribir ambas versiones.
6. Quitar los hardcodes de `language: "es"` en `PaperMetadataStep.tsx` y
   `nuevo/page.tsx`; agregar UI de selección: "idioma del documento
   original" + toggle "traducir automáticamente" / "voy a subir ambas
   versiones".
7. Si es manual: extender `PaperMarkdownStep.tsx` para permitir cargar/editar
   el segundo `content_md`. Si es automática: disparar la traducción al
   publicar (server action), con estado de progreso visible (spinner/toast
   Sonner, sin fallback silencioso si falla — regla de "no fallback
   disfraz": si la traducción falla, error visible, no publicar a medias).
8. Construir el botón/ícono de toggle de idioma en la vista pública
   (`DMZNavbar.tsx` o `PaperHeader.tsx`), con estado en cliente (no URL).
9. Actualizar `generateMetadata()` y `PaperMetadata.tsx` (JSON-LD) para
   reflejar el idioma por defecto del paper de forma coherente, exponiendo
   ambos abstracts donde el schema lo permita.
10. Actualizar los labels hardcodeados en español de la vista pública a un
    diccionario bilingüe simple.
11. Actualizar `app/api/papers/[slug]/route.ts` para exponer ambas
    versiones (o `?lang=`).
12. Escribir el script de backfill, correrlo manualmente contra los papers
    publicados existentes (revisión caso a caso antes de persistir, dado
    que es contenido público ya indexado).
13. `npm run build` + `npm run lint`.
14. Probar en preview: publicar un paper nuevo con cada modo (manual y
    automático), verificar toggle, verificar JSON-LD y endpoints JSON.

### Riesgos

- **Migración de esquema**: zona protegida por regla dura del proyecto —
  ningún cambio en `/supabase/migrations` sin confirmación explícita de
  Rodolfo, y solo contra dev (nunca producción directo).
- **Costo/latencia de traducción**: `content_md` puede ser largo (documento
  completo); traducir vía DeepSeek en el flujo de publicación puede ser
  lento — considerar hacerlo async con estado "traduciendo" visible, no
  bloquear el publish.
- **Fidelidad de traducción académica**: términos técnicos/citas mal
  traducidas por el LLM degradan la calidad del paper publicado — revisar
  si conviene un paso de revisión humana antes de publicar la versión
  traducida, o al menos marcarla visualmente como "traducción automática".
- **Backfill sobre contenido ya indexado por buscadores/bots de IA**:
  cambiar `content_md`/metadata de papers ya publicados y citados podría
  alterar URLs o contenido que terceros ya referenciaron — revisar cada
  caso antes de sobrescribir, no correr el backfill en modo ciego.
- **JSON-LD/SEO**: al no usar hreflang (decisión tomada), un solo URL
  representa ambos idiomas ante buscadores — el idioma "canónico" para
  `inLanguage`/`DC.language` debe definirse con una regla clara (¿el
  original subido, o siempre español?) para no confundir a los crawlers.
- **Regresión del módulo AI-friendly**: los endpoints JSON crudos
  (`/api/papers/[slug]`) son consumidos por bots externos hoy; cualquier
  cambio de forma en la respuesta (agregar campos `_en`) debe ser
  aditivo, no romper el contrato actual.
