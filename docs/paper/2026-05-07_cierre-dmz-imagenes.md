# Cierre DMZ — Serving de imágenes y reemplazo de placeholders

**Fecha:** 2026-05-07
**Estado:** Implementación completada, pendiente prueba end-to-end
**Módulo:** Paper / DMZ (zona pública de papers académicos)

## Contexto

El módulo Paper/DMZ permite publicar papers académicos en `/papers/*` sin autenticación. El pipeline de publicación tiene 4 pasos: Upload PDF → Editar Markdown → Gestionar Imágenes → Publicar. El PDF se procesa con Replicate Marker API, que extrae texto en markdown y detecta placeholders de imágenes. Las imágenes se suben a Supabase Storage bucket `paper-images`.

## Problemas detectados (ya corregidos)

1. **API de imágenes devolvía 501** — `app/api/papers/images/[filename]/route.ts` no estaba implementada
2. **Placeholders no se reemplazaban** — Al subir una imagen, el markdown seguía con `![alt](image_0.png)` en vez de la URL real de Supabase
3. **Clave del Map inestable** — `PaperImagesStep` usaba `fullMatch` como clave, que se rompía al reemplazar el texto del placeholder

## Cambios realizados

### Fix 1: API de serving de imágenes
**Archivo:** `app/api/papers/images/[filename]/route.ts`
- Busca en tabla `paper_images` por `storage_path` o `original_filename`
- Descarga desde Supabase Storage bucket `paper-images`
- Sirve con Content-Type correcto + cache (24h max-age, 7d stale-while-revalidate)

### Fix 2: Reemplazo de placeholders en markdown
**Archivo:** `app/personal/papers/components/PaperImagesStep.tsx`
- Agregada prop `onMarkdownUpdated?: (newMarkdown: string) => void`
- Tras upload exitoso, usa `replacePlaceholder()` de `lib/papers/image-utils.ts` para reemplazar `![alt](placeholder.png)` → `![alt](https://xxx.supabase.co/...)`
- Cambiada clave del Map de `fullMatch` (string) a `position` (number) para estabilidad ante reemplazos

### Fix 3: Conexión en el pipeline
**Archivos:** `app/personal/papers/nuevo/page.tsx`, `app/personal/papers/[paperId]/PaperEditClient.tsx`
- Conectado callback `onMarkdownUpdated` → actualiza `markdownContent` en estado del pipeline
- Al publicar, el markdown ya tiene URLs reales en vez de placeholders

## Arquitectura del módulo

```
app/papers/                          # DMZ pública (sin login)
├── layout.tsx                       # Layout con DMZNavbar
├── page.tsx                         # Índice de papers publicados
├── [slug]/page.tsx                  # Paper individual + SEO metadata
└── components/
    ├── DMZNavbar.tsx
    ├── PaperHeader.tsx
    ├── PaperMetadata.tsx            # JSON-LD schema.org
    ├── PaperContent.tsx             # react-markdown renderer
    └── PaperActions.tsx

app/personal/papers/                 # Panel autenticado
├── page.tsx                         # Lista de papers del usuario
├── nuevo/page.tsx                   # Pipeline 4 pasos
├── [paperId]/page.tsx               # Editar paper (server component)
├── [paperId]/PaperEditClient.tsx    # Cliente de edición
└── components/
    ├── PaperStepIndicator.tsx       # StandardStepper wrapper
    ├── PaperUploadStep.tsx          # Paso 1: Upload PDF
    ├── PaperMarkdownStep.tsx        # Paso 2: Editor markdown
    ├── PaperImagesStep.tsx          # Paso 3: Gestión imágenes
    ├── PaperImageCard.tsx           # Card individual de imagen
    ├── PaperDualView.tsx            # Vista humano/máquina
    └── PaperMetadataStep.tsx        # Paso 4: Metadatos + publicar

app/api/papers/                      # API pública
├── route.ts                         # GET /api/papers (lista JSON)
├── [slug]/route.ts                  # GET /api/papers/[slug] (paper JSON)
└── images/[filename]/route.ts       # GET /api/papers/images/[filename] (serving)

app/api/personal/
└── process-paper-pdf/route.ts       # POST: procesar PDF con Replicate Marker

lib/papers/                          # Lógica compartida
├── types.ts                         # Paper, PaperImage, ProcessPdfResponse, etc.
├── queries.ts                       # CRUD Supabase (getPublishedPapers, createPaperDraft, etc.)
├── image-utils.ts                   # extractImagePlaceholders, replacePlaceholder, etc.
└── slug.ts                          # generatePaperSlug, isSlugAvailable, etc.

scripts/
└── seed-first-paper.sql             # Seed del primer paper (contenido truncado)
```

## Prueba end-to-end pendiente

1. **Cargar seed** con contenido completo del paper (el script `scripts/seed-first-paper.sql` tiene `[... continuar ...]` como placeholder)
2. **Pipeline nuevo paper:**
   - Subir PDF → verificar que Replicate Marker procesa y extrae markdown + placeholders
   - Editar markdown en el editor dual-view
   - Subir imágenes → verificar que los placeholders se reemplazan con URLs de Supabase
   - Llenar metadatos (título, slug, abstract, keywords) → publicar
3. **Verificar vista pública:**
   - Visitar `/papers/[slug]` sin login → debe mostrar título, abstract bilingüe, contenido markdown con imágenes renderizadas
   - Verificar SEO: View Source debe tener JSON-LD, Dublin Core, Google Scholar meta tags
   - Verificar API: `curl /api/papers` y `curl /api/papers/[slug]`
4. **Verificar serving de imágenes:**
   - `curl /api/papers/images/[filename]` debe devolver la imagen con Content-Type correcto
5. **Verificar edit flow:**
   - Editar paper existente → cambiar imágenes → verificar que markdown se actualiza

## Notas para la sesión de prueba

- Las imágenes se sirven con URLs directas de Supabase Storage (`https://xxx.supabase.co/storage/v1/object/public/paper-images/...`). Son URLs públicas del bucket.
- La API de imágenes (`/api/papers/images/[filename]`) es un fallback/proxy que busca en `paper_images` por filename.
- La tabla `paper_images` tiene FK a `papers.id`. El bucket de Storage es `paper-images`.
- El procesamiento PDF usa Replicate Marker API (mode `accurate`, con extracción de imágenes habilitada). Puede tomar 30s-2min.
- Para probar sin Replicate (offline), se puede saltar el paso 1 y pegar markdown manualmente.
