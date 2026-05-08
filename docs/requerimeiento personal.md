# Requerimiento Técnico: Ruta Interna de Publicación — `/personal/papers`

**Versión:** 0.1
**Fecha:** 2026-04-17
**Dependencia:** Requiere DMZ v0 completada (tabla `papers`, componentes DMZ, API routes)
**Alcance:** Pipeline de publicación de papers académicos desde la zona logueada.
**Principio rector:** Reutilizar infraestructura de Cognética. No duplicar lógica. Extender, no reescribir.

---

## 1. Objetivo

Crear una ruta interna `/personal/papers` dentro de la zona logueada que permita al investigador:

1. Subir un PDF académico (el mismo publicado en Zenodo)
2. Procesarlo automáticamente a Markdown (reutilizando el pipeline de Cognética con Replicate Marker)
3. Revisar y editar el Markdown generado
4. Subir las imágenes del paper, asociando cada una con su placeholder detectado por Marker
5. Escribir o editar la descripción textual de cada imagen (lo que ven AI/robots)
6. Completar metadatos (DOI, autores, abstract, keywords, link Zenodo)
7. Publicar el paper en la tabla `papers` (alimentando la DMZ)

El investigador tiene en todo momento visibilidad de **las dos caras** del paper: lo que ve el humano (imágenes renderizadas + Markdown formateado) y lo que ve la máquina (descripciones textuales + metadata estructurada).

---

## 2. Decisiones arquitectónicas ya tomadas (no reabrir)

| Decisión | Valor | Motivo |
|---|---|---|
| Ruta | `/personal/papers` (zona logueada) | Herramienta del investigador, no del visitante |
| Pipeline PDF | Reutilizar `/api/cognetica/process-pdf` con Replicate Marker | Ya funciona, ya está pagado |
| Extracción de imágenes | Habilitar en Marker (`disable_image_extraction: false`) | Investigador reemplaza placeholders |
| Storage de imágenes | Bucket nuevo `paper-images` en Supabase Storage, lectura pública | Separado de Cognética, servible sin auth |
| Destino de publicación | Tabla `papers` existente (creada en DMZ v0) | Ya tiene RLS, ya tiene API |
| Componentes UI | Reutilizar Standard* de Cognética | Consistencia visual |

---

## 3. Flujo de usuario completo

El flujo se organiza en **4 pasos secuenciales**. No es un wizard con navegación libre — es un pipeline lineal donde cada paso depende del anterior. El investigador puede retroceder para editar, pero no puede saltar adelante.

### Paso 1: Subir PDF

- Drag & drop o file picker (reutilizar `StandardFileUpload`)
- Solo acepta `.pdf`, tamaño máximo 50 MB
- Al soltar el archivo:
  - Se muestra nombre, tamaño, preview (si es posible)
  - Botón "Procesar" para iniciar el pipeline
- El PDF se sube a Supabase Storage bucket `paper-images` (subfolder `pdf-originals/{paper_id}/`)
  - Nota: el PDF original se guarda como referencia, no para servir públicamente
- Se calcula SHA-256 del PDF y se almacena como referencia de integridad

### Paso 2: Procesamiento + Revisión de Markdown

- Al presionar "Procesar":
  - Se llama a `/api/personal/process-paper-pdf` (ver §6)
  - `StandardProgressBar` muestra progreso: "Enviando a Marker..." → "Procesando..." → "Extrayendo texto e imágenes..." → "Listo"
- Al completar:
  - **Panel izquierdo:** Editor de Markdown (textarea grande, monospace, con scroll)
  - **Panel derecho:** Preview renderizado del Markdown (usando `react-markdown` con misma config que la DMZ)
  - El investigador puede editar el Markdown libremente
  - Debajo del editor: lista de **placeholders de imágenes detectados** por Marker (ej: `![](image_0.png)`, `![](image_1.png)`)

### Paso 3: Gestión de imágenes

Para cada placeholder de imagen detectado por Marker:

- Se muestra una **card de imagen** con:
  - **Indicador:** "Imagen 1 de N" con el placeholder original (`![](image_0.png)`)
  - **Zona de upload:** Drag & drop para subir la imagen real (JPG, PNG, WebP, max 10 MB)
  - **Preview:** Una vez subida, se muestra la imagen
  - **Campo "Descripción para AI/robots":** Textarea donde el investigador escribe lo que debe "ver" un agente o crawler que no puede renderizar la imagen. Placeholder: "Describe lo que muestra esta imagen para que un lector que no pueda verla entienda su contenido."
  - **Toggle "Ver como humano / Ver como máquina":** Alterna entre mostrar la imagen y mostrar la descripción textual. Esto es la materialización de la doble capa.

Cuando el investigador sube una imagen:
- Se almacena en bucket `paper-images` en path `{paper_id}/{filename_sanitizado}`
- Se genera la URL pública de Supabase Storage
- El placeholder en el Markdown se reemplaza automáticamente:
  - **Antes:** `![](image_0.png)`
  - **Después:** `![Descripción que escribió el investigador](URL_PUBLICA_SUPABASE)`
- El `alt` text del Markdown ES la descripción para AI/robots. Así:
  - El humano ve la imagen renderizada en la DMZ
  - El crawler lee el `alt` text en el HTML
  - El endpoint `/api/papers/[slug]` puede incluir las descripciones en el JSON

Si el investigador **no sube** imagen para algún placeholder, se mantiene el placeholder original y se muestra un warning: "Imagen pendiente — no será visible en la publicación".

Si Marker detectó imágenes que no son figuras del paper (logos, headers, decoraciones), el investigador puede **eliminar** el placeholder del Markdown en el editor (paso 2). No se necesita lógica especial — es solo borrar la línea.

### Paso 4: Metadatos + Publicación

Formulario con los siguientes campos (mapeo directo a columnas de tabla `papers`):

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Título | text input | Sí | Pre-llenado desde metadata de Marker si disponible |
| Subtítulo | text input | No | |
| Slug | text input | Sí | Auto-generado desde título, editable. Validar unicidad contra DB |
| Abstract (ES) | textarea | Sí | |
| Abstract (EN) | textarea | No | |
| Autores | editor JSONB | Sí | Array de {name, orcid, affiliation, role}. Empezar con 1 autor pre-llenado |
| Keywords | tag input | Sí | Array de strings, separados por coma o enter |
| DOI | text input | No | Formato: `10.xxxx/zenodo.xxxxx` |
| URL Zenodo | text input | No | URL completa al registro de Zenodo |
| URL PDF | text input | No | URL pública al PDF (puede ser el de Zenodo) |
| Versión | text input | Sí | Default: "1.0" |
| Citación APA | textarea | No | Texto completo de la cita en formato APA |
| Licencia | select | Sí | Default: "CC-BY-4.0". Opciones: CC-BY-4.0, CC-BY-SA-4.0, CC-BY-NC-4.0, CC0 |
| Idioma | select | Sí | Default: "es". Opciones: es, en |
| Fecha de publicación | date picker | Sí | Default: hoy |

**Botones de acción:**

- **"Guardar borrador"** → Inserta/actualiza en tabla `papers` con `is_published = false`
- **"Vista previa"** → Abre en nueva pestaña `/papers/[slug]` (solo visible porque `is_published` aún es false, pero la RLS bloquea acceso anónimo — solo el investigador logueado lo ve)
- **"Publicar"** → Actualiza `is_published = true` y `published_at = now()`. Confirmación modal antes de ejecutar.

**Nota sobre Vista Previa:** la política RLS actual solo permite SELECT a `is_published = true` para `anon` y `authenticated`. Para que el investigador pueda previsualizar borradores, necesitamos una política adicional:

```sql
CREATE POLICY "papers_owner_read_drafts"
  ON public.papers
  FOR SELECT
  TO authenticated
  USING (true);  -- Usuarios logueados pueden ver todos los papers (incluyendo borradores)
```

Esto es aceptable porque hoy solo hay un usuario (el investigador). Si en el futuro hay múltiples usuarios, se refinará con `created_by = auth.uid()`.

---

## 4. Cambios a nivel de base de datos

### 4.1 Nueva tabla `paper_images`

```sql
CREATE TABLE public.paper_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    original_placeholder TEXT NOT NULL,
    storage_path TEXT,
    public_url TEXT,
    alt_text TEXT NOT NULL DEFAULT '',
    description_ai TEXT NOT NULL DEFAULT '',
    original_filename TEXT,
    file_size BIGINT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    is_uploaded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paper_images_paper ON public.paper_images(paper_id);
```

**Campos clave:**
- `alt_text`: lo que va en el atributo `alt` del `<img>` en HTML — conciso, una línea
- `description_ai`: descripción extendida para agentes/crawlers — puede ser un párrafo completo con contexto académico. Esto es lo que ve el investigador en el toggle "Ver como máquina"
- `position`: orden de aparición en el paper (1, 2, 3...)
- `original_placeholder`: el texto original que generó Marker (ej: `![](image_0.png)`)
- `is_uploaded`: false hasta que el investigador sube la imagen real

### 4.2 RLS para `paper_images`

```sql
ALTER TABLE public.paper_images ENABLE ROW LEVEL SECURITY;

-- Lectura pública (las imágenes se sirven en la DMZ)
CREATE POLICY "paper_images_public_read"
  ON public.paper_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.papers 
      WHERE papers.id = paper_images.paper_id 
      AND papers.is_published = true
    )
  );

-- Escritura solo para usuarios autenticados
CREATE POLICY "paper_images_auth_write"
  ON public.paper_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 4.3 Agregar columna a tabla `papers`

```sql
ALTER TABLE public.papers 
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (processing_status IN ('draft', 'processing', 'ready', 'published'));
```

### 4.4 Actualizar RLS de `papers` para borradores

```sql
-- Usuarios logueados pueden ver sus borradores
CREATE POLICY "papers_auth_read_all"
  ON public.papers
  FOR SELECT
  TO authenticated
  USING (true);

-- Usuarios logueados pueden insertar/actualizar
CREATE POLICY "papers_auth_write"
  ON public.papers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 4.5 Supabase Storage — bucket `paper-images`

Crear vía Supabase Dashboard o SQL:

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('paper-images', 'paper-images', true);
```

Política de lectura pública:

```sql
CREATE POLICY "paper_images_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'paper-images');

-- Upload solo para usuarios autenticados
CREATE POLICY "paper_images_auth_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'paper-images');

-- Update/delete solo para usuarios autenticados
CREATE POLICY "paper_images_auth_manage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'paper-images');

CREATE POLICY "paper_images_auth_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'paper-images');
```

---

## 5. Estructura de archivos a crear

```
/app
├── personal/
│   ├── papers/                              # NUEVA RUTA
│   │   ├── page.tsx                         # Lista de papers del investigador
│   │   ├── nuevo/
│   │   │   └── page.tsx                     # Pipeline de publicación (4 pasos)
│   │   ├── [paperId]/
│   │   │   └── page.tsx                     # Editar paper existente
│   │   └── components/
│   │       ├── PaperUploadStep.tsx           # Paso 1: Upload de PDF
│   │       ├── PaperMarkdownStep.tsx         # Paso 2: Editor + Preview
│   │       ├── PaperImagesStep.tsx           # Paso 3: Gestión de imágenes
│   │       ├── PaperImageCard.tsx            # Card individual de imagen
│   │       ├── PaperMetadataStep.tsx         # Paso 4: Metadatos + Publicación
│   │       ├── PaperStepIndicator.tsx        # Indicador de paso actual (1/4)
│   │       └── PaperDualView.tsx             # Toggle humano/máquina
├── api/
│   └── personal/
│       └── process-paper-pdf/
│           └── route.ts                     # Endpoint de procesamiento (adapta Cognética)

/lib
└── papers/
    ├── types.ts                             # MODIFICAR: agregar PaperImage, PaperDraft
    ├── queries.ts                           # MODIFICAR: agregar queries de escritura
    ├── slug.ts                              # NUEVO: función de slugificación
    └── image-utils.ts                       # NUEVO: utilidades de imágenes
```

---

## 6. API Route: `/api/personal/process-paper-pdf`

**No reutilizar directamente** `/api/cognetica/process-pdf`. Crear endpoint nuevo que **adapte** la lógica pero con configuración específica para papers.

**Diferencias con Cognética:**

| Aspecto | Cognética | Papers |
|---|---|---|
| `disable_image_extraction` | `true` | **`false`** |
| `mode` | `balanced` | **`accurate`** (papers necesitan más precisión) |
| `include_metadata` | `true` | `true` |
| Output procesado | Solo markdown | Markdown + **lista de imágenes detectadas** |

```typescript
// /app/api/personal/process-paper-pdf/route.ts

import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createServerSupabaseClient } from "@/app/auth/session";

export async function POST(request: NextRequest) {
    // 1. Verificar autenticación
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Recibir PDF
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Calcular SHA-256
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { createHash } = await import("crypto");
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    // 4. Convertir a base64 para Replicate
    const base64 = buffer.toString("base64");
    const dataUri = `data:application/pdf;base64,${base64}`;

    // 5. Procesar con Marker — IMÁGENES HABILITADAS
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const input = {
        file: dataUri,
        mode: "accurate",
        use_llm: false,
        paginate: false,
        force_ocr: false,
        skip_cache: false,
        format_lines: false,
        save_checkpoint: false,
        disable_ocr_math: false,
        include_metadata: true,
        strip_existing_ocr: false,
        disable_image_extraction: false,  // ← HABILITADO para papers
    };

    const output = await replicate.run("datalab-to/marker", { input }) as any;

    // 6. Extraer markdown y lista de placeholders de imágenes
    let markdown = "";
    if (typeof output === "string") {
        markdown = output;
    } else if (output && typeof output === "object") {
        markdown = output.markdown || output.text || output.content || output[0] || "";
        if (typeof markdown !== "string") {
            markdown = JSON.stringify(markdown);
        }
    }

    // 7. Detectar placeholders de imágenes en el markdown
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const imagePlaceholders: Array<{
        position: number;
        fullMatch: string;
        altText: string;
        src: string;
    }> = [];
    let match;
    let position = 0;
    while ((match = imageRegex.exec(markdown)) !== null) {
        position++;
        imagePlaceholders.push({
            position,
            fullMatch: match[0],
            altText: match[1] || "",
            src: match[2] || "",
        });
    }

    // 8. Metadata del archivo
    const metadata = {
        title: file.name.replace(/\.pdf$/i, ""),
        originalFileName: file.name,
        fileSize: file.size,
        sha256,
    };

    return NextResponse.json({
        success: true,
        markdown,
        imagePlaceholders,
        metadata,
    });
}
```

---

## 7. Integración con `/personal` existente

### 7.1 Modificar sidebar de `/personal`

**Archivo:** `/app/personal/layout.tsx`

Agregar item al `SidebarNav`:

```typescript
// Agregar a la lista de items del sidebar
{
  title: "Publicaciones",
  href: "/personal/papers",
  icon: FileText,  // o BookOpen de lucide-react
}
```

Esto es el único cambio en archivos existentes de `/personal`.

### 7.2 Relación con el sidebar existente

El sidebar de `/personal` ya tiene "Historial IA". Se agrega "Publicaciones" como segundo item. No se tocan otros elementos.

---

## 8. Especificación de componentes

### 8.1 `/app/personal/papers/page.tsx` — Lista de papers

**Client component** (necesita interacciones).

- Muestra tabla o lista de papers del investigador (todos, incluyendo borradores)
- Columnas: título, slug, estado (draft/processing/ready/published), fecha, acciones
- Botón "Nuevo paper" → navega a `/personal/papers/nuevo`
- Botón "Editar" por paper → navega a `/personal/papers/[paperId]`
- Badge de estado con colores:
  - `draft` → gris
  - `processing` → amarillo pulsante
  - `ready` → azul
  - `published` → verde
- Botón "Ver en DMZ" (solo para published) → abre `/papers/[slug]` en nueva pestaña
- Usa `StandardCard` y `StandardButton`

### 8.2 `/app/personal/papers/nuevo/page.tsx` — Pipeline de publicación

**Client component** (estado complejo, formularios interactivos).

- Gestiona el estado del pipeline completo con `useState`
- Estado principal:

```typescript
type PipelineState = {
    currentStep: 1 | 2 | 3 | 4;
    // Paso 1
    pdfFile: File | null;
    isProcessing: boolean;
    // Paso 2
    markdownContent: string;
    markdownOriginal: string;  // Para poder hacer reset
    // Paso 3
    imagePlaceholders: ImagePlaceholder[];
    // Paso 4
    metadata: PaperMetadataForm;
    // General
    paperId: string | null;  // UUID asignado al crear borrador
    isSaving: boolean;
    error: string | null;
};
```

- Renderiza `PaperStepIndicator` arriba con pasos 1-4
- Renderiza el componente del paso actual
- Auto-guarda borrador al cambiar de paso (debounced)

### 8.3 `PaperUploadStep.tsx` — Paso 1

- `StandardFileUpload` configurado para solo PDF
- Preview del nombre y tamaño del archivo
- Botón "Procesar PDF"
- `StandardProgressBar` durante procesamiento
- Al completar: callback que pasa markdown + imagePlaceholders + metadata al parent
- Mensajes de estado: "Enviando a procesador..." → "Extrayendo texto e imágenes..." → "Listo"

### 8.4 `PaperMarkdownStep.tsx` — Paso 2

- **Layout split** (50/50 horizontal en desktop, stacked en mobile):
  - **Izquierda:** `<textarea>` monospace, bordes sutiles, con el markdown editable. Altura mínima 600px. Scroll independiente.
  - **Derecha:** Preview renderizado con `react-markdown` (misma config que `PaperContent` de la DMZ). Scroll independiente sincronizado con el editor si es viable, si no, scroll libre.
- Barra superior del editor con:
  - Botón "Reset" (vuelve al markdown original de Marker)
  - Contador de caracteres / palabras
  - Indicador de imágenes detectadas: "2 imágenes detectadas"
- El investigador puede editar libremente: corregir errores de OCR, reorganizar secciones, eliminar artefactos de Marker, borrar placeholders de imágenes no deseadas
- Al salir del paso: guardar `markdownContent` en estado

### 8.5 `PaperImagesStep.tsx` — Paso 3

- Muestra una `PaperImageCard` por cada placeholder detectado en el markdown actual
- Si el investigador borró algún placeholder en el paso 2, no aparece acá
- Detecta placeholders leyendo el markdown actual (no el original), para reflejar ediciones
- Si no hay placeholders: muestra mensaje "No se detectaron imágenes en el paper. Puedes agregar imágenes manualmente editando el Markdown en el paso anterior."
- Botón "Agregar imagen manualmente" → inserta un nuevo placeholder al final del markdown y crea una card nueva

### 8.6 `PaperImageCard.tsx` — Card individual

```
┌──────────────────────────────────────────────┐
│  Imagen 1 de 2                    [Eliminar] │
│  Placeholder: ![](image_0.png)               │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │     [Drag & drop imagen aquí]        │    │
│  │     o haz click para seleccionar     │    │
│  │     JPG, PNG, WebP — max 10 MB       │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Descripción para AI/robots:          │    │
│  │ [                                  ] │    │
│  │ [                                  ] │    │
│  │ [                                  ] │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [👁 Ver como humano] [🤖 Ver como máquina]  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  (Preview de lo seleccionado)        │    │
│  │  Humano: imagen renderizada          │    │
│  │  Máquina: texto de descripción       │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

- Al subir imagen:
  1. Upload a Supabase Storage `paper-images/{paper_id}/{filename}`
  2. Obtener URL pública
  3. Insertar registro en `paper_images`
  4. Reemplazar placeholder en el markdown con `![alt_text](url_publica)`
- Toggle "Ver como humano / Ver como máquina" → `PaperDualView`

### 8.7 `PaperDualView.tsx` — Toggle de doble capa

Componente reutilizable que recibe:

```typescript
type PaperDualViewProps = {
    imageUrl: string | null;
    altText: string;
    descriptionAi: string;
    mode: 'human' | 'machine';
    onModeChange: (mode: 'human' | 'machine') => void;
};
```

- **Modo humano:** renderiza `<img src={imageUrl} alt={altText} />` o placeholder si no hay imagen
- **Modo máquina:** renderiza el `descriptionAi` como texto monospace en un bloque gris, simulando lo que "lee" un crawler
- Transición suave entre modos (fade o slide)

### 8.8 `PaperMetadataStep.tsx` — Paso 4

- Formulario con todos los campos de §3 Paso 4
- **Editor de autores:**
  - Lista de autores (empezar con 1 pre-llenado: nombre del usuario actual, ORCID si disponible)
  - Botón "Agregar autor"
  - Cada autor: inputs para name, orcid, affiliation, role
  - Drag & drop para reordenar
- **Tag input para keywords:**
  - Input de texto, al presionar Enter o coma agrega como tag
  - Tags con botón X para eliminar
  - Sugerencias no necesarias en v0
- **Slug:**
  - Auto-generado desde título usando `lib/papers/slug.ts`
  - Editable manualmente
  - Validación en vivo: check contra DB si ya existe (debounced 500ms)
  - Indicador: "✓ Disponible" o "✗ Ya existe"
- **Tres botones de acción** (descritos en §3)

### 8.9 `PaperStepIndicator.tsx`

- Barra horizontal con 4 pasos: "Subir PDF" → "Editar contenido" → "Imágenes" → "Publicar"
- Paso actual destacado (color primario)
- Pasos completados con checkmark
- Pasos futuros en gris
- Click en paso completado permite retroceder
- No permite saltar hacia adelante

---

## 9. Función de slugificación

**Archivo:** `/lib/papers/slug.ts`

```typescript
export function generatePaperSlug(title: string): string {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")   // Quitar acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")       // No-alfanuméricos → guión
        .replace(/^-+|-+$/g, "")           // Quitar guiones al inicio/fin
        .slice(0, 100);                    // Limitar longitud
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
    // Query a tabla papers por slug
    // Retorna true si no existe
}
```

---

## 10. Queries de escritura

**Archivo:** `/lib/papers/queries.ts` — agregar:

```typescript
// Crear borrador
export async function createPaperDraft(data: PaperDraftInput): Promise<Paper>

// Actualizar borrador
export async function updatePaperDraft(paperId: string, data: Partial<PaperDraftInput>): Promise<Paper>

// Publicar paper
export async function publishPaper(paperId: string): Promise<Paper>

// Despublicar paper
export async function unpublishPaper(paperId: string): Promise<Paper>

// Obtener papers del usuario actual (incluyendo borradores)
export async function getMyPapers(): Promise<Paper[]>

// Crear registro de imagen
export async function createPaperImage(data: PaperImageInput): Promise<PaperImage>

// Actualizar imagen (después de upload)
export async function updatePaperImage(imageId: string, data: Partial<PaperImageInput>): Promise<PaperImage>

// Eliminar imagen
export async function deletePaperImage(imageId: string): Promise<void>

// Obtener imágenes de un paper
export async function getPaperImages(paperId: string): Promise<PaperImage[]>
```

Todas las funciones usan `createServerSupabaseClient()` existente o el cliente de browser según contexto (server/client component).

---

## 11. Tipos TypeScript

**Archivo:** `/lib/papers/types.ts` — agregar:

```typescript
export interface PaperImage {
    id: string;
    paper_id: string;
    position: number;
    original_placeholder: string;
    storage_path: string | null;
    public_url: string | null;
    alt_text: string;
    description_ai: string;
    original_filename: string | null;
    file_size: number | null;
    mime_type: string | null;
    width: number | null;
    height: number | null;
    is_uploaded: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaperDraftInput {
    title: string;
    subtitle?: string;
    slug: string;
    abstract_es: string;
    abstract_en?: string;
    authors: PaperAuthor[];
    keywords: string[];
    content_md: string;
    doi?: string;
    zenodo_url?: string;
    pdf_url?: string;
    version: string;
    citation_apa?: string;
    license: string;
    language: string;
    published_at?: string;
    pdf_storage_path?: string;
    pdf_sha256?: string;
    created_by?: string;
    processing_status: 'draft' | 'processing' | 'ready' | 'published';
}

export interface ImagePlaceholder {
    position: number;
    fullMatch: string;
    altText: string;
    src: string;
}
```

---

## 12. Reglas de calidad

1. **Archivos existentes modificables:** Solo `personal/layout.tsx` (agregar item sidebar) y `lib/papers/types.ts` + `lib/papers/queries.ts` (extender, no reescribir). Todo lo demás es creación nueva.
2. **Autenticación:** Todas las páginas y endpoints de `/personal/papers` requieren usuario logueado. Verificar con `requireAuth()` en server components o `useAuth()` en client components.
3. **No client components innecesarios.** `page.tsx` de lista puede ser server component con interacciones delegadas a client components hijos. El pipeline (`nuevo/page.tsx`) sí es client component por necesidad.
4. **Reutilizar componentes Standard*.** No crear componentes UI nuevos salvo los específicos del pipeline (PaperImageCard, PaperDualView, etc.).
5. **Error handling:** Cada paso del pipeline debe mostrar errores de forma clara (toast o inline). Si Replicate falla, ofrecer reintentar. Si el upload falla, no perder el markdown editado.
6. **Auto-guardado:** Implementar auto-guardado del borrador cada 30 segundos si hay cambios pendientes (debounced). Indicador visual: "Guardado" / "Guardando..." / "Cambios sin guardar".
7. **No romper el build.** `pnpm build` debe pasar al final.
8. **Accesibilidad:** Formularios con labels, inputs con aria-required, botones con estados disabled claros.

---

## 13. Criterios de aceptación

La iteración está completa cuando:

- [ ] Ruta `/personal/papers` visible en sidebar de `/personal`
- [ ] Lista de papers del investigador funciona (muestra papers existentes)
- [ ] Pipeline de nuevo paper: Paso 1 sube PDF y procesa con Marker
- [ ] Pipeline: Paso 2 muestra editor Markdown + preview lado a lado
- [ ] Pipeline: Paso 3 muestra cards de imágenes con upload + descripción + toggle
- [ ] Pipeline: Paso 4 formulario de metadatos completo con slug auto-generado
- [ ] "Guardar borrador" crea registro en tabla `papers` con `is_published = false`
- [ ] "Publicar" actualiza `is_published = true` y el paper aparece en la DMZ `/papers`
- [ ] Imágenes subidas son accesibles públicamente vía URL de Supabase Storage
- [ ] El Markdown publicado contiene URLs reales de imágenes (no placeholders)
- [ ] El `alt` text de cada imagen contiene la descripción del investigador
- [ ] Bucket `paper-images` creado con políticas de lectura pública
- [ ] Tabla `paper_images` creada con RLS
- [ ] SHA-256 del PDF original almacenado
- [ ] App logueada y DMZ siguen funcionando sin cambios
- [ ] `pnpm build` pasa

---

## 14. Fuera de scope (explícitamente)

- ❌ Generación automática de descripciones de imágenes con AI (el investigador las escribe)
- ❌ Editor Markdown WYSIWYG rico (tipo Notion). Es textarea + preview.
- ❌ Soporte multi-usuario / roles de editor / reviewer
- ❌ Versionado de papers (v1 → v2 como registros separados es manual)
- ❌ Importación desde URL (solo upload de archivo)
- ❌ Procesamiento batch de múltiples papers
- ❌ Comparación visual PDF original vs Markdown generado
- ❌ Deploy automático a Zenodo desde sustrato.ai
- ❌ Notificaciones de publicación
- ❌ RSS feed / newsletter
- ❌ Galería pública de imágenes

---

## 15. Protocolo de trabajo con Windsurf

1. Windsurf lee este documento completo antes de escribir código.
2. Si encuentra ambigüedad o conflicto con código existente, **pregunta** antes de decidir.
3. Entrega en este orden:
   - a) Migraciones SQL: tabla `paper_images`, columnas nuevas en `papers`, bucket `paper-images`, políticas RLS
   - b) `/lib/papers/slug.ts` y `/lib/papers/image-utils.ts`
   - c) Extensión de `/lib/papers/types.ts` y `/lib/papers/queries.ts`
   - d) `/api/personal/process-paper-pdf/route.ts`
   - e) Componentes del pipeline: `PaperStepIndicator`, `PaperUploadStep`, `PaperMarkdownStep`
   - f) Componentes de imágenes: `PaperImageCard`, `PaperDualView`, `PaperImagesStep`
   - g) `PaperMetadataStep`
   - h) Páginas: `personal/papers/page.tsx`, `personal/papers/nuevo/page.tsx`, `personal/papers/[paperId]/page.tsx`
   - i) Modificación del sidebar en `personal/layout.tsx`
4. Después de cada entrega, detenerse y reportar. No acumular cambios sin revisión.

---

**Fin del documento.** Todo cambio fuera de este scope requiere nuevo requerimiento.