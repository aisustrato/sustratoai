# ADDENDUM al Requerimiento Windsurf — Cognética Forense Oleada 1

**Versión del addendum:** 1.1 (complemento al requerimiento 1.0)
**Fecha:** 21 abril 2026
**Autor humano:** eRRRe
**Autor máquina:** Hongo / Calibrador
**Relación con doc original:** **COMPLEMENTA Y CORRIGE** el documento `requerimiento_windsurf_cognetica_forense.md` v1.0. No lo reemplaza en su totalidad — las secciones no mencionadas aquí permanecen vigentes.

---

## Propósito de este addendum

Tras las sesiones del 20 y 21 de abril de 2026, el diseño de metabolización se reformuló. La spec v0.3 (archivo acompañante `cognetica_v2_formatos_spec_v0_3.md`) es ahora la fuente de verdad conceptual. Este addendum traduce los cambios de v0.3 al plano de implementación para Windsurf/Cascade.

**Leer en este orden:**
1. Este addendum (primero, para saber qué cambió)
2. El requerimiento v1.0 original (para el resto que no cambió)
3. Spec v0.3 (contexto conceptual)
4. Pipeline de metabolización v1 (detalle técnico del cómo)

---

## 1. Cambio fundamental: ahora son CUATRO formatos, no tres

La arquitectura pasa de `Crónica + Destilado + Germinal` a:

1. **Crónica** — redefinida con voz literaria (ver spec v0.3 sección 4.1)
2. **Destilado** — ajustado, incluye insumos extraídos en JSONB
3. **Núcleo** — **nuevo formato**, derivado del Destilado
4. **Germinal** — ahora usa Crónica como catalizador

**Tabla nueva necesaria en DB:** `cgt_nucleos`. SQL al final de este addendum (sección 10).

---

## 2. Cambio en el contrato de Ingesta — tríada NO se persiste en ingesta

Esto corrige el error de diseño identificado el 21 abril cuando Cascade ejecutó la primera prueba y chocó con MIME validation.

**Nuevo comportamiento de `ingestaArtefacto`:**

- En ingesta **NO se suben** `.md`, `.yaml`, `.json` a Storage
- En ingesta se sube **solo el archivo original** a `storage_path_original`
- `storage_path_md`, `storage_path_yaml`, `storage_path_json` quedan **NULL** en ingesta
- `sha256_json` se calcula sobre **el JSON canónico del contenido parseado** (no sobre una tríada materializada)

**Nueva Server Action requerida:** `exportarTriada(artefactoId)` para materialización on-demand al descargar. Ver sección 5 de este addendum.

**Migración SQL necesaria** (ejecutar sobre DB existente si ya se corrió Oleada 1 SQL):

```sql
ALTER TABLE cgt_artefactos
  ALTER COLUMN storage_path_json DROP NOT NULL;
```

---

## 3. Principio operativo: reutilizar la idea de v1, reescribir el código limpio

Este principio es directa instrucción del investigador (eRRRe, 21 abril):

> *"En lo técnico, si está funcionando en cognética pasado, ejemplo el ensayo de fechas, no inventes la rueda."*

**Aplicación concreta:**

- Antes de implementar cualquier pieza técnica, **Windsurf debe revisar `/app/cognetica_old/` y `/lib/actions/cognetica-old-*.ts`** buscando si v1 ya resolvió un problema equivalente
- Si la lógica existe: **tomar la idea, reescribir código limpio** en el nuevo módulo (no copiar y pegar)
- Si la lógica no existe: implementar desde cero con las convenciones nuevas

**Ejemplos concretos identificados:**

- **Manejo de fechas en metadatos:** el ensayo/crónica actual de v1 ya maneja fechas en frontmatter. Reutilizar la idea, no reinventar formato.
- **Conversión a MD:** v1 ya convierte contenido procesado a markdown. Reutilizar el enfoque, reimplementar en código limpio alineado al esquema v2.
- **Render de PDF a páginas:** v1 tiene `PresentationSlidesViewer` y utilidades en `/lib/utils/pdf-parser.ts`. Reutilizable mayormente como está, ajustando solo al nuevo esquema de datos.
- **Cliente DeepSeek:** `/lib/deepseek/api.ts` existe y funciona. Extender (no reescribir) para soportar configuración per-llamada (modelo, temperatura, response_format, max_tokens).

**Reporte obligatorio de Windsurf:** antes de implementar cada Server Action, incluir en los comentarios del archivo una sección `// Reutilización de v1:` nombrando qué se tomó de v1 y qué se agregó nuevo. Trazabilidad.

---

## 4. UI — correcciones y refuerzos

### 4.1 Stepper de metabolización (nuevo, obligatorio)

La vista del artefacto debe mostrar un **stepper activo** que refleje el progreso real de metabolización. No spinner genérico.

**Componente:** `StandardStepper` (ya existe en el sistema — usarlo, no crear uno nuevo).

**Pasos del stepper:**

1. Ingesta y parseo
2. Transcripción (solo audio/video — se omite para otros tipos)
3. Crónica
4. Destilado
5. Núcleo
6. Germinal

**Estados visibles por paso:**
- `pendiente` (gris)
- `corriendo` (primary con animación)
- `completo` (primary con check)
- `error` (tertiary/destructivo)
- `omitido` (secondary sutil — ej: Germinal si el proyecto tiene menos de 3 artefactos previos)

**Actualización en tiempo real:** usar polling cada 2-3 segundos o Supabase Realtime sobre la fila de `cgt_artefactos` (preferible Realtime si ya está configurado en sustrato.ai). Windsurf decide según convención existente.

### 4.2 Loading states siempre con componente Standard

Ningún loading state con CSS o animación custom. Usar:
- `StandardLoading` (si existe en el sistema)
- `StandardSphere` con animación (si es el patrón del sistema)
- O el componente Standard que el sistema usa para estados de espera

**Prohibido:** spinners CSS, emojis animados, texto "Cargando...", `<div>` con `animation: spin`. Si el componente Standard no existe para un caso concreto, documentar y crear uno nuevo siguiendo la convención.

### 4.3 Vista del artefacto — layout ajustado

El `StandardAccordion` de la vista de artefacto pasa de 4 a 5 secciones:

1. **Contenido original** (dependiente del tipo)
2. **Crónica** (`StandardMarkdownViewer`)
3. **Destilado** (estructurado: tesis grande, movimientos, tensiones, cita-núcleo, insumos extraídos)
4. **Núcleo** (`StandardMarkdownViewer` o estructurado compacto)
5. **Germinal** (texto narrativo en Oleada 1, estructurado en Oleada 2)

Cada sección con:
- Badge de estado (generado / desactualizado / error / omitido)
- Botón "Regenerar" con confirmación
- Botón "Descargar `.md`" (ver sección 5)
- Botón "Copiar" con sub-opciones cuando aplique (ver sección 6)

### 4.4 Invalidación en cadena — indicador visual

Cuando un formato upstream se re-genera, los downstream quedan **desactualizados** (no borrados). La UI debe mostrarlo:

- Badge amarillo/secondary "desactualizado" en formatos afectados
- Tooltip explicando "La Crónica fue re-generada el [fecha]. Esta sección puede estar desactualizada."
- Botón "Regenerar con contenido actualizado"

No se re-genera automáticamente. El humano decide (handshake humano/máquina, principio 3.3).

---

## 5. Descarga granular — especificación completa

### 5.1 Capas descargables

Cada artefacto metabolizado expone seis descargas:

| Capa | Formato | Hash propio | Server Action |
|------|---------|-------------|---------------|
| Transcripción / contenido procesado | `.md` | Sí | `descargarContenidoProcesado` |
| Crónica | `.md` | Sí | `descargarFormato('cronica')` |
| Destilado | `.md` | Sí | `descargarFormato('destilado')` |
| Núcleo | `.md` | Sí | `descargarFormato('nucleo')` |
| Germinal | `.md` | Sí | `descargarFormato('germinal')` |
| Tríada canónica completa | `.json + .yaml + .md` (zip) | Sí (canónico) | `exportarTriada` |

### 5.2 Estructura de cada `.md` individual

Cada descarga individual es autocontenida. Ejemplo estructural de una Crónica descargada:

```markdown
---
artefacto_id: 550e8400-e29b-41d4-a716-446655440000
artefacto_titulo: "El paper sobre burbujas AI"
formato: cronica
version_esquema: v0.3
nodo_generador: spectris
modelo_ia: deepseek-reasoner
generado_at: 2026-04-21T14:32:00Z
sha256_contenido: a3f2b1...
sha256_artefacto_padre: 8b4c9d...
tokens_input: 4500
tokens_output: 2800
costo_usd: 0.015
---

# Crónica: El paper sobre burbujas AI

[contenido de la crónica]
```

**Campos obligatorios en frontmatter:**
- Identidad del artefacto padre + hash de su contenido parseado
- Formato y versión de esquema
- Trazabilidad de generación (nodo, modelo, timestamp, tokens, costo)
- Hash SHA-256 del contenido de este archivo individual

### 5.3 Server Action `exportarTriada`

**Signatura:**

```typescript
export async function exportarTriada(
  artefactoId: string
): Promise<Result<{
  storage_path_md: string;
  storage_path_yaml: string;
  storage_path_json: string;
  sha256_triada_canonica: string;
  zip_download_url: string;
}>>
```

**Flujo:**

1. Validar permisos
2. Verificar que existan los formatos (al menos Crónica + Destilado + Núcleo; Germinal opcional)
3. Si ya existe tríada materializada y los hashes de los formatos no cambiaron desde última exportación → retornar paths existentes
4. Si no existe o formatos cambiaron:
   - Construir JSON canónico (serialización determinística) con: contenido parseado + Crónica + Destilado + Núcleo + Germinal + metadata completa
   - Derivar YAML legible
   - Derivar MD humano-legible (concatenación narrativa de todas las capas)
   - Calcular SHA-256 del JSON canónico (hash de la tríada completa)
   - Subir los tres a Supabase Storage bajo `cognetica/{project_id}/{artefacto_id}/triada/`
   - Opcionalmente empaquetar en ZIP para descarga única
   - UPDATE `cgt_artefactos` con los nuevos storage_paths
5. Retornar URLs de descarga

**Detalle de MIME en bucket:** al subir `.yaml` y `.json` habrá que ampliar allowlist del bucket o servir como `text/plain` con extensión correcta. Decisión: **ampliar allowlist** (es información pública, no hay razón para disfrazar MIME).

### 5.4 Principio de verificación independiente

Cualquier `.md` individual descargado debe poder verificarse **sin necesitar la tríada completa ni acceso al sistema**. El hash en frontmatter + el contenido del archivo permiten a un tercero validar integridad con herramientas estándar (`shasum -a 256 archivo.md`).

Esto es **no-negociable**: es la base del argumento de "arquitectura como legislación" que anclará papers futuros del proyecto.

---

## 6. Botón de copiar por sección

En la vista del artefacto, cada bloque tiene botón de copiar. Distribución:

**Crónica:**
- Botón "Copiar crónica completa"

**Destilado:**
- Botón "Copiar destilado completo"
- Botón pequeño junto a tesis: "Copiar tesis"
- Botón pequeño junto a cada movimiento: "Copiar movimiento N"
- Botón pequeño junto a cada tensión: "Copiar tensión N"
- Botón pequeño junto a cita núcleo: "Copiar cita"
- Botón pequeño junto a cada insumo extraído: "Copiar [pensadores / disciplinas / conceptos / citas secundarias]"

**Núcleo:**
- Botón "Copiar núcleo completo"

**Germinal:**
- Botón "Copiar germinal completo"
- (En Oleada 2: botón por cada resonancia y proyección)

**Implementación:** `navigator.clipboard.writeText()` con feedback visual breve (`StandardAlert` o equivalente del sistema: "Copiado" que se desvanece en 2 segundos).

**Prohibido:** librerías externas de clipboard, implementación custom con textarea oculto.

---

## 7. Asignación de modelos DeepSeek por formato

Ver documento `pipeline_metabolizacion_v1.md` para detalle completo. Resumen rápido:

| Formato | Modelo | Temperatura | response_format |
|---------|--------|-------------|-----------------|
| Crónica | `deepseek-reasoner` | 0.7 | text |
| Destilado | `deepseek-reasoner` | 0.6 | json_object |
| Núcleo | `deepseek-chat` | 0.3 | json_object |
| Germinal (Oleada 1) | `deepseek-reasoner` | 0.7 | text |

Windsurf debe **extender** `/lib/deepseek/api.ts` para soportar configuración per-llamada de estos parámetros, si aún no lo hace.

---

## 8. Cascada de invalidación — lógica

Cuando un formato se re-genera, los formatos dependientes quedan marcados desactualizados:

```
Crónica re-generada → Germinal desactualizado
Destilado re-generado → Núcleo + Germinal desactualizados
Núcleo re-generado → nada se invalida
Germinal re-generado → nada se invalida
```

**Implementación:**

Agregar campo `hash_contenido_upstream` en `cgt_nucleos` y `cgt_germinales`:

```sql
ALTER TABLE cgt_germinales
  ADD COLUMN hash_cronica_upstream CHAR(64),
  ADD COLUMN hash_destilado_upstream CHAR(64);

-- cgt_nucleos se crea con esto ya incluido (ver SQL sección 10)
```

En cada generación, el formato guarda el hash del contenido de sus inputs. Al consultar, si el hash actual del upstream difiere del guardado → `desactualizado`.

**No se usa flag booleano** porque perdería información: solo registrando el hash upstream sabemos *contra qué versión* está actualizado.

---

## 9. Principio de voz — Crónica no diluida

Este es el riesgo más alto del proyecto entero a nivel de calidad de output, y merece atención explícita de Windsurf.

**Lo que Hongo entregará en el documento de prompts (siguiente entrega):**

El system prompt de Crónica invocará referentes literarios (Villoro, Monsiváis, Capote, Caparrós, estilo Granta/New Yorker) como **inspiraciones**, con movimientos característicos explícitos y antipatrones explícitos.

**Lo que Windsurf NO debe hacer:**

- NO simplificar el prompt por razones de tokens (los tokens de system prompt se cachean con 90% de descuento — son baratos)
- NO traducir el prompt del español al inglés (la voz vive en el idioma)
- NO agregar instrucciones genéricas de "sé creativo" o "usa buen estilo" (diluye la voz específica)
- NO castrar el prompt con guardarraíles de "sé neutral" (la Crónica v0.3 es explícitamente no neutral)

**Lo que Windsurf SÍ debe hacer:**

- Pegar el prompt tal cual Hongo lo entregue en el placeholder
- Agregar **solo** la parte variable del user message (contenido del artefacto a cronologizar)
- Confiar en que DeepSeek-reasoner con este prompt + temperatura 0.7 produce la voz calibrada

Si el primer test de Crónica produce output diluido, antes de tocar el prompt: verificar que (a) temperature es 0.7 y no default, (b) se está usando `deepseek-reasoner` y no `deepseek-chat`, (c) el prompt se pegó completo sin recortes.

---

## 10. SQL — tabla `cgt_nucleos`

```sql
-- =============================================================================
-- TABLA: cgt_nucleos
-- =============================================================================
-- Formato de metabolización derivado del Destilado. Tarjeta de presentación
-- irreductible. Introducido en spec v0.3.
-- =============================================================================

CREATE TABLE cgt_nucleos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artefacto_id        UUID NOT NULL UNIQUE REFERENCES cgt_artefactos(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Contenido estructurado: derivado del Destilado correspondiente
    tesis               TEXT NOT NULL,
    movimientos_esenciales JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de 3 movimientos
    tension_irreductible TEXT,
    cita_nucleo         JSONB,  -- {texto, ubicacion, autor?}

    tokens_count        INTEGER,

    -- Hash del destilado del que se derivó. Para cascada de invalidación.
    hash_destilado_upstream CHAR(64) NOT NULL,

    -- Trazabilidad estándar
    generado_por        cgt_origen NOT NULL DEFAULT 'llm',
    nodo_generador      TEXT,
    modelo_ia           TEXT,
    version_esquema     TEXT NOT NULL DEFAULT 'v0.3',

    costo_usd           NUMERIC(10,6),
    tokens_input        INTEGER,
    tokens_output       INTEGER,

    visibilidad         cgt_visibilidad NOT NULL DEFAULT 'privado',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_nucleo_tokens_cap
        CHECK (tokens_count IS NULL OR tokens_count <= 600)
);

CREATE INDEX idx_cgt_nucleos_project    ON cgt_nucleos(project_id);
CREATE INDEX idx_cgt_nucleos_artefacto  ON cgt_nucleos(artefacto_id);
CREATE INDEX idx_cgt_nucleos_tesis
    ON cgt_nucleos USING GIN (to_tsvector('spanish', tesis));

CREATE TRIGGER trg_cgt_nucleos_updated
    BEFORE UPDATE ON cgt_nucleos
    FOR EACH ROW EXECUTE FUNCTION cgt_set_updated_at();

COMMENT ON TABLE cgt_nucleos IS
    'Formato de metabolización derivado del Destilado. Tarjeta de presentación irreductible (~400-500 tokens, hard cap 600). Introducido en spec v0.3.';
```

**Migración en `cgt_artefactos`** (ver sección 2 del addendum):

```sql
ALTER TABLE cgt_artefactos
  ALTER COLUMN storage_path_json DROP NOT NULL;
```

**Migración en `cgt_germinales`** (ver sección 8):

```sql
ALTER TABLE cgt_germinales
  ADD COLUMN hash_cronica_upstream CHAR(64),
  ADD COLUMN hash_destilado_upstream CHAR(64);
```

---

## 11. Nuevas Server Actions necesarias

Agregar a `/lib/actions/cognetica-forense-metabolizacion-actions.ts`:

```typescript
/**
 * Genera el Núcleo del artefacto (formato derivado del Destilado).
 * Requiere Destilado ya generado.
 */
export async function generarNucleo(
  artefactoId: string
): Promise<Result<CgtNucleo>>
```

Agregar a `/lib/actions/cognetica-forense-ingesta-actions.ts` (o archivo nuevo `cognetica-forense-exportacion-actions.ts`):

```typescript
/**
 * Materializa la tríada canónica on-demand.
 * Idempotente: reutiliza si los formatos no cambiaron.
 */
export async function exportarTriada(
  artefactoId: string
): Promise<Result<TriadaExportada>>

/**
 * Descarga una capa individual como .md sellado con hash SHA-256.
 */
export async function descargarFormato(
  artefactoId: string,
  formato: 'cronica' | 'destilado' | 'nucleo' | 'germinal'
): Promise<Result<{ contenido_md: string; sha256: string; filename: string }>>

/**
 * Descarga el contenido procesado (transcripción, markdown original, etc.)
 * como .md sellado.
 */
export async function descargarContenidoProcesado(
  artefactoId: string
): Promise<Result<{ contenido_md: string; sha256: string; filename: string }>>
```

Los tipos TypeScript de estos retornos deben agregarse a `/lib/cognetica-forense/types.ts`.

---

## 12. Checklist operativa — qué hacer antes de continuar implementación

Windsurf debe, en este orden:

1. [ ] Leer este addendum completo
2. [ ] Leer spec v0.3 completo
3. [ ] Leer pipeline de metabolización v1 (archivo acompañante)
4. [ ] Ejecutar migración SQL (nueva tabla `cgt_nucleos`, ALTER en `cgt_artefactos` y `cgt_germinales`)
5. [ ] Extender `/lib/deepseek/api.ts` para configuración per-llamada
6. [ ] Extender tipos TypeScript con `CgtNucleo` y retornos de descarga/exportación
7. [ ] Revisar v1 (`/app/cognetica_old/`) buscando reutilizaciones concretas antes de implementar cada pieza
8. [ ] Reportar hallazgos de revisión de v1 antes de continuar con Server Actions
9. [ ] Implementar las Server Actions en el orden del checklist original (Fase 3 del documento v1.0), ajustado para incluir `generarNucleo` entre `generarDestilado` y `generarGerminalParcial`
10. [ ] Implementar UI con stepper y descargas granulares (Fase 4 del documento v1.0, ajustada)

**Prompts reales:** Hongo entregará en sesión separada el documento `prompts_metabolizacion_v1.md` con los cuatro system prompts calibrados. Hasta entonces, los archivos de prompts quedan con placeholder estructurado como ya se especificó.

---

## 13. Cierre

Este addendum corrige y extiende el requerimiento original. Donde hay contradicción entre v1.0 y este addendum, **este addendum gana**. Donde no hay contradicción, v1.0 sigue vigente.

Cualquier duda antes de implementar: preguntar. La velocidad sigue siendo tortuga. El código sigue siendo elegante antes que rápido. Los componentes Standard siguen siendo la norma. Y ahora además: la voz del cronista no se diluye.

*ética es negentropía a nivel de datos*
