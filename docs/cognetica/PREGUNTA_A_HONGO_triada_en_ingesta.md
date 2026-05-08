# Pregunta a Hongo — ¿Cuándo se materializa la Tríada Canónica?

**Autor:** Rodolfo + Cascade
**Fecha:** 2026-04-20
**Contexto:** Implementación Oleada 1 — ingesta de artefacto `markdown`.

---

## 1. Lo que dice el contrato que entregaste

En `lib/cognetica-forense/cognetica_forense_types.ts` y en el SQL de Oleada 1, la tabla `cgt_artefactos` declara:

```ts
sha256_json:        string          // NOT NULL
storage_path_json:  string          // NOT NULL
storage_path_md:    string | null   // nullable
storage_path_yaml:  string | null   // nullable
storage_path_original: string | null // nullable
```

Y el flujo del server action `ingestaArtefacto` (según tu contrato, pasos 3–8) ordena:

> 3. Leer contenido
> 4. Construir `TriadaCanonica`
> 5. Calcular SHA-256 del JSON canónico
> 6. Verificar duplicados por `(project_id, sha256_json)`
> 7. Subir original a Storage
> 8. **Subir los tres formatos de la tríada (md, yaml, json)**

Esto implica, sin ambigüedad, que **la tríada se genera y se persiste en Storage en el momento de la ingesta**, antes de cualquier metabolización. Y así lo implementamos.

---

## 2. Lo que el investigador (Rodolfo) entendía

> *"La tríada se baja cuando el artefacto ya ha tenido más metabolizaciones y se hace download. No pienses aún en tríadas. Solo metabolizar: los tipos de documentos originales respaldados en storage y procesados en supabase."*

Modelo mental alternativo:
- **Ingesta** = subir el archivo original + registrar metadata.
- **Metabolización** = generar crónica → destilado → germinal.
- **Tríada canónica** = paquete de **salida** que se arma al momento del download/export, cuando el artefacto ya está enriquecido con sus metabolizaciones. Serviría como "snapshot empaquetado" para consumo externo.

Bajo esta lectura, en la ingesta **no** debería subirse nada que tenga "triada" en el nombre: solo el `original.md`.

---

## 3. La tensión concreta

| Aspecto | Contrato actual (lo implementado) | Lectura de Rodolfo |
|---------|-----------------------------------|--------------------|
| `sha256_json` | Hash de la tríada JSON canónica generada en ingesta | No existe aún; sería el hash de qué exactamente? |
| `storage_path_json` | Path del `triada.json` subido en ingesta | No existe aún; la tríada se arma post-metabolización |
| Rol de la tríada | Estructura canónica **de entrada** que fija identidad y habilita dedup | Paquete **de salida** para descarga post-proceso |
| Dedup `(project_id, sha256_json)` | Se basa en el hash de la tríada generada en ingesta | ¿Sobre qué hasheamos? ¿Bytes del original? ¿Contenido parseado? |

---

## 4. Síntoma operacional que disparó la pregunta

Al implementar el contrato tal como está, encontramos que el bucket `cognetica-files` rechaza los uploads de `triada.yaml` y `triada.json` por MIME (`application/yaml`, `application/json` no están en la allowlist). Eso es accesorio — se arregla ampliando allowlist o subiendo como `text/plain`.

Pero al discutir el arreglo, emergió la pregunta de fondo:

> **¿Es correcto que la tríada exista desde la ingesta, o debería ser un artefacto de salida post-metabolización?**

---

## 5. Lo que necesitamos aclarar contigo (Hongo)

### 5.1. Semántica de la tríada

**Opción A — Tríada como identidad de entrada (contrato actual):**
- Se genera en ingesta a partir del parse del original.
- `sha256_json` = hash estable que identifica el contenido parseado.
- Habilita dedup confiable porque el JSON canónico es determinista.
- Los tres archivos en Storage son inmutables (se escriben una vez, nunca cambian).
- La metabolización **no los modifica**; solo agrega registros en `cgt_cronicas`, `cgt_destilados`, `cgt_germinales`.

**Opción B — Tríada como paquete de salida (lectura Rodolfo):**
- En ingesta solo se guarda el original.
- `sha256` se calcula sobre los bytes del original (o sobre un canónico del parse sin metabolización).
- La tríada se materializa on-demand al descargar, empaquetando original + metabolizaciones.
- Esto requiere relajar el schema: `sha256_json` y `storage_path_json` pasan a NULLABLE, o cambian de nombre.

**Opción C — Tríada híbrida (evolutiva):**
- En ingesta: JSON canónico del parse se sube (identidad + dedup).
- YAML/MD se generan on-demand al descargar, consolidando metabolizaciones.
- Solo `storage_path_json` NOT NULL; `md` y `yaml` quedan nullable hasta que alguien pida descarga.

### 5.2. Si elegimos A, explicar el "para qué" de los tres formatos en ingesta

¿Por qué se persiste `triada.md` y `triada.yaml` si la metabolización todavía no corrió? ¿Son útiles a algún consumidor en ese estado? Si no, tal vez B o C son más honestos.

### 5.3. Definición de `sha256_json`

Independiente de A/B/C, necesitamos que quede **explícito** qué hasheamos:
- ¿Bytes del archivo original fuente?
- ¿JSON canónico del parse sin metabolización?
- ¿JSON canónico del parse **con** metabolización?

Cada opción da una semántica de dedup distinta. Hoy el código hashea el JSON canónico del parse sin metabolización, porque ese es el momento en que se calcula.

### 5.4. MIME en bucket

Decisión menor pero concreta: ¿queremos que el bucket permita `application/json` y `application/yaml` explícitamente, o es aceptable servir los archivos triada como `text/plain` (la extensión en el path basta para identificarlos)?

---

## 6. Posición preliminar

Rodolfo se inclinó por **"Schema manda: triada al ingerir"** (opción A) al ver que tu diseño es explícito. Antes de consolidar, querría que confirmes:

1. Que efectivamente tu intención es A.
2. Qué MIME usar para los archivos tríada en bucket.
3. Confirmar la definición de `sha256_json` (punto 5.3).

Con eso cerramos Oleada 1 sin ambigüedad y seguimos a metabolización.

---

## 7. Impacto de cada camino

| Camino | Cambios requeridos |
|--------|--------------------|
| A | Ninguno en código. Solo arreglar MIME en bucket o en uploads. |
| B | ALTER TABLE (NULLABLE sha256_json, storage_path_json) + refactor server action + nuevo endpoint/action para materializar tríada en download. |
| C | ALTER TABLE (NULLABLE storage_path_md, yaml — ya lo son; storage_path_json queda NOT NULL) + quitar 2 uploads en ingesta + agregar materialización lazy al descargar. |

Esperamos tu palabra para avanzar.
