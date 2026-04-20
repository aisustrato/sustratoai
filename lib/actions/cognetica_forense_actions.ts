/**
 * Cognética Forense — Server Actions Oleada 1
 *
 * Firmas de Server Actions con documentación detallada.
 * Windsurf debe implementar el cuerpo de cada una respetando:
 *   - Las firmas y tipos de retorno
 *   - El orden del flujo documentado
 *   - El patrón Result<T> para todos los retornos
 *   - La validación de permisos por proyecto
 *
 * Convenciones:
 *   - Todos los archivos comienzan con "use server"
 *   - Cliente Supabase vía `createServerClient()` del wrapper propio
 *   - Errores user-facing en español, logs internos pueden ser en inglés
 *   - No lanzar excepciones hacia el cliente — siempre retornar Result
 *
 * Autor: Hongo / Calibrador
 * Versión: v0.2
 */

"use server";

import type {
  ArtefactoCompleto,
  CgtArtefacto,
  CgtAudioSegmento,
  CgtCronica,
  CgtDestilado,
  CgtGerminal,
  CgtGrupoArtefactos,
  CgtVideoSegmento,
  CrearGrupoInput,
  FiltrosArtefacto,
  IngestaArtefactoInput,
  Result,
} from "./cognetica_forense_types";

// =============================================================================
// INGESTA
// =============================================================================

/**
 * Ingesta principal de un artefacto.
 *
 * Flujo:
 *   1. Valida permisos sobre el proyecto
 *   2. Valida tipo vs archivo (coherencia MIME)
 *   3. Sube archivo original a Supabase Storage en ruta:
 *      `cognetica/{project_id}/{artefacto_uuid}/original.{ext}`
 *   4. Procesa según tipo (sincronía/asincronía según caso):
 *      - audio/video: crea artefacto en estado 'ingresado', transcripción async
 *      - pdf_slides/pdf_informe: procesa sincrónicamente
 *      - markdown: parsea frontmatter + headers sincrónicamente
 *      - imagen: solo metadata (sin descripción IA en Oleada 1)
 *   5. Construye tríada canónica (JSON determinístico, YAML legible, MD humano)
 *   6. Calcula SHA-256 del JSON canónico
 *   7. Valida que no exista artefacto con mismo hash en el mismo proyecto
 *      (constraint UNIQUE, pero chequeo previo con mensaje amigable)
 *   8. Inserta en cgt_artefactos + tabla específica por tipo
 *   9. Sube tríada (md, yaml, json) a Storage
 *  10. UPDATE storage_paths en cgt_artefactos
 *  11. Para audio/video: dispara `transcribirAudio/Video` en background
 *  12. Para todos: dispara flujo de metabolización en background
 *      (no bloquea retorno)
 *  13. Retorna CgtArtefacto con estado inicial
 *
 * Errores manejados:
 *   - Usuario sin permisos sobre proyecto → "No tienes permisos sobre este proyecto"
 *   - Archivo inválido para el tipo → "El archivo no corresponde al tipo seleccionado"
 *   - Hash duplicado → "Este artefacto ya existe en el proyecto"
 *   - Falla de Storage → "Error al guardar el archivo, reintenta"
 */
export async function ingestaArtefacto(
  input: IngestaArtefactoInput
): Promise<Result<CgtArtefacto>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Reintenta la metabolización de un artefacto en estado 'error'.
 * Útil cuando DeepSeek/Replicate estaban caídos o hubo error transitorio.
 *
 * Flujo:
 *   1. Valida permisos
 *   2. Valida estado = 'error' o 'ingresado'
 *   3. Limpia error_mensaje previo
 *   4. Dispara flujo de metabolización de nuevo
 *   5. Retorna éxito (el flujo es asíncrono)
 */
export async function reintentarMetabolizacion(
  artefactoId: string
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Elimina un artefacto completamente.
 *
 * ATENCIÓN: Esto es destructivo. Borra:
 *   - Fila en cgt_artefactos (CASCADE elimina extensiones específicas)
 *   - Archivos en Supabase Storage (original + tríada)
 *   - Crónica, destilado, germinal asociados
 *   - NO borra grupos (el grupo puede existir sin este artefacto)
 *
 * Valida permisos antes de borrar.
 */
export async function eliminarArtefacto(
  artefactoId: string
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

// =============================================================================
// TRANSCRIPCIÓN
// =============================================================================

/**
 * Transcribe un artefacto de audio usando Replicate WhisperX Large v3.
 *
 * Llamada a la API existente en `/app/api/transcription/replicate/route.ts`
 * (o reutilizar el cliente directamente).
 *
 * Flujo:
 *   1. Obtiene artefacto, valida tipo = 'audio'
 *   2. Lee archivo original desde Storage
 *   3. Llama Replicate con diarización activada
 *   4. Parsea respuesta a ResultadoTranscripcion
 *   5. INSERT en cgt_artefactos_audio (metadata + transcripción completa + hablantes)
 *   6. INSERT batch en cgt_audio_segmentos
 *   7. UPDATE cgt_artefactos SET estado = 'ingresado' (listo para metabolización)
 *   8. Dispara metabolización
 *
 * Si falla: estado = 'error', error_mensaje poblado.
 */
export async function transcribirAudio(
  artefactoId: string
): Promise<Result<CgtAudioSegmento[]>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Transcribe un artefacto de video.
 *
 * Similar a `transcribirAudio` pero:
 *   - Extrae pista de audio del video antes de enviar a WhisperX
 *   - Persiste en cgt_artefactos_video + cgt_video_segmentos
 *   - Extracción de frames clave NO se hace en Oleada 1 (Oleada 1.5)
 */
export async function transcribirVideo(
  artefactoId: string
): Promise<Result<CgtVideoSegmento[]>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

// =============================================================================
// PROCESAMIENTO PDF
// =============================================================================

/**
 * Procesa un PDF de presentación (slides).
 *
 * Flujo:
 *   1. Valida artefacto tipo = 'pdf_slides'
 *   2. Con pdfjs-dist + pdf-lib:
 *      - Extrae texto por página
 *      - Detecta imágenes embedidas → cgt_imagenes_descritas (con pagina_num)
 *      - Genera estructura JSONB paginas = [{numero, titulo, texto, notas}, ...]
 *   3. Para cada imagen extraída:
 *      - Upload a Storage
 *      - INSERT en cgt_imagenes_descritas (descripcion_ia = NULL en Oleada 1)
 *   4. INSERT en cgt_artefactos_pdf_slides
 *   5. Retorna éxito
 */
export async function procesarPdfSlides(
  artefactoId: string,
  fileBuffer: Buffer
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Procesa un PDF de informe (paper, libro, deep research).
 *
 * Flujo:
 *   1. Valida artefacto tipo = 'pdf_informe'
 *   2. Con pdfjs-dist:
 *      - Extrae texto plano preservando estructura (indentación, saltos)
 *      - Convierte a markdown
 *      - Detecta headers (h1-h6) → secciones JSONB
 *      - Extrae imágenes/figuras → cgt_imagenes_descritas
 *      - Detecta DOI si existe en primeras páginas
 *      - Parsea bibliografía si es detectable → citas_bibliograficas
 *   3. INSERT en cgt_artefactos_pdf_informe
 *   4. Retorna éxito
 *
 * Nota: la calidad de conversión PDF→MD depende del PDF original.
 * PDFs escaneados sin OCR quedarán con texto vacío o incorrecto.
 * Windsurf debe manejar este caso con nota en error_mensaje.
 */
export async function procesarPdfInforme(
  artefactoId: string,
  fileBuffer: Buffer
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

// =============================================================================
// METABOLIZACIÓN
// =============================================================================

/**
 * Genera la Crónica de un artefacto.
 *
 * Flujo:
 *   1. Valida permisos + estado = 'ingresado' (no re-genera si ya existe)
 *   2. Obtiene contenido metabolizable del artefacto según tipo:
 *      - audio/video: transcripcion_completa
 *      - pdf_slides: concatena texto de paginas
 *      - pdf_informe: markdown_renderizado
 *      - markdown: contenido
 *      - imagen: nombre + descripcion (sin IA en Oleada 1, usará solo metadata)
 *   3. Construye prompt con `construirPromptCronica(contenido, tipo, incluirContracalibracion)`
 *   4. Llama DeepSeek vía `callDeepSeekAPI("deepseek-chat", prompt)`
 *   5. Parsea respuesta:
 *      - contenido principal (crónica)
 *      - contracalibración (si se pidió)
 *      - tokens_count estimado
 *   6. INSERT en cgt_cronicas con:
 *      - generado_por = 'llm'
 *      - nodo_generador = 'spectris'
 *      - modelo_ia = 'deepseek-chat'
 *      - version_esquema = 'v0.2'
 *      - tokens_input / tokens_output / costo_usd del usage
 *   7. Retorna CgtCronica creada
 *
 * Si incluirContracalibracion=true, la crónica viene con bloque adicional
 * de higiene epistémica (supuestos no examinados, evidencia débil, etc.)
 * según definido en spec v0.2 sección 4.1.
 */
export async function generarCronica(
  artefactoId: string,
  incluirContracalibracion = false
): Promise<Result<CgtCronica>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Genera el Destilado de un artefacto.
 *
 * Flujo:
 *   1. Valida permisos + que exista la Crónica (requerida como contexto)
 *   2. Construye prompt con:
 *      - Contenido original del artefacto
 *      - Crónica como contexto de referencia narrativa
 *   3. Llama DeepSeek
 *   4. Parsea respuesta que debe venir en estructura:
 *      - tesis: string
 *      - movimientos: Array (3-5)
 *      - tensiones: Array (1-2)
 *      - cita_nucleo: {texto, ubicacion, autor?}
 *   5. Valida que tokens_count <= 1500 (hard cap). Si excede, RE-GENERA con
 *      prompt que pida más compresión. Máximo 2 reintentos. Si sigue largo,
 *      retorna error.
 *   6. INSERT en cgt_destilados
 *   7. Retorna CgtDestilado
 */
export async function generarDestilado(
  artefactoId: string
): Promise<Result<CgtDestilado>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Genera el Germinal PARCIAL de un artefacto (Oleada 1).
 *
 * En Oleada 1, Germinal es parcial:
 *   - Se genera el contenedor con resumen narrativo
 *   - Se captura contexto_snapshot
 *   - Capa A (resonancias) y Capa B (proyecciones) NO se pueblan aquí
 *     (se difieren a Oleada 2 con sus tablas propias)
 *
 * Flujo:
 *   1. Valida que exista Destilado
 *   2. Valida umbral: ≥ 3 artefactos previos con Destilado en el mismo proyecto
 *   3. Si no cumple umbral: INSERT cgt_germinales con resumen = null + nota,
 *      contadores en 0. Retorna éxito con flag "germinal_omitido".
 *   4. Si cumple:
 *      - Consulta destilados previos del proyecto
 *      - Construye contexto_snapshot con UUIDs de destilados consultados
 *      - Llama DeepSeek con prompt de germinal parcial:
 *        "describe narrativamente qué germina de la conversación entre
 *         este artefacto y el corpus previo, SIN estructurar resonancias
 *         ni proyecciones formales"
 *      - Recibe resumen narrativo
 *   5. INSERT en cgt_germinales con num_* = 0 (se poblarán en Oleada 2)
 *   6. Retorna CgtGerminal
 */
export async function generarGerminalParcial(
  artefactoId: string
): Promise<Result<CgtGerminal>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Regenera un formato específico de un artefacto (sobreescribe el anterior).
 *
 * Útil cuando:
 *   - Usuario considera que el resultado no es bueno
 *   - Se actualizó el prompt (nuevo version_esquema)
 *   - Hubo error transitorio en generación previa
 *
 * Flujo:
 *   1. Valida permisos
 *   2. DELETE formato existente si hay
 *   3. Llama a generar{Formato}(artefactoId)
 *   4. Retorna éxito
 *
 * Para germinal, si hay datos de Oleada 2 (resonancias, proyecciones),
 * esta regeneración NO los borra — solo el contenedor germinal.
 * (En Oleada 1 esto no aplica porque esas tablas aún no existen.)
 */
export async function regenerarFormato(
  artefactoId: string,
  formato: "cronica" | "destilado" | "germinal"
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

// =============================================================================
// GRUPOS
// =============================================================================

/**
 * Crea un grupo de artefactos.
 *
 * Flujo:
 *   1. Valida permisos sobre el proyecto
 *   2. INSERT en cgt_grupos_artefactos
 *   3. Retorna grupo creado
 */
export async function crearGrupo(
  input: CrearGrupoInput
): Promise<Result<CgtGrupoArtefactos>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Asigna un artefacto existente a un grupo.
 *
 * Si el artefacto ya pertenece a otro grupo, se reemplaza silenciosamente
 * (un artefacto pertenece a 0 o 1 grupo).
 *
 * Flujo:
 *   1. Valida permisos sobre ambos (artefacto y grupo del mismo proyecto)
 *   2. UPDATE cgt_artefactos SET grupo_id = grupoId
 *   3. Retorna éxito
 */
export async function agregarArtefactoAGrupo(
  artefactoId: string,
  grupoId: string
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Remueve un artefacto de su grupo actual (lo deja sin grupo).
 */
export async function removerArtefactoDeGrupo(
  artefactoId: string
): Promise<Result<void>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Genera el germinal de un grupo completo (pseudo-artefacto conjunto).
 *
 * Flujo:
 *   1. Valida permisos
 *   2. Obtiene todos los destilados de los artefactos del grupo
 *   3. Si hay < 2 artefactos con destilado: retorna error
 *      "Se necesitan al menos 2 artefactos con destilado para generar
 *       un germinal de grupo"
 *   4. Construye prompt que pide germinal narrativo sobre la unidad-grupo
 *      y su resonancia con el corpus del proyecto
 *   5. Llama DeepSeek
 *   6. INSERT en cgt_germinales con grupo_id poblado (artefacto_id = null)
 *   7. Retorna germinal
 */
export async function generarGerminalDeGrupo(
  grupoId: string
): Promise<Result<CgtGerminal>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

// =============================================================================
// CONSULTA
// =============================================================================

/**
 * Lista artefactos de un proyecto con filtros.
 *
 * Aplica los filtros de `FiltrosArtefacto`. Si no se provee filtro,
 * retorna todos los artefactos del proyecto ordenados por created_at desc,
 * con límite por defecto de 50.
 *
 * Búsqueda por texto: usa índices GIN full-text sobre:
 *   - cgt_artefactos.titulo, descripcion
 *   - cgt_cronicas.contenido
 *   - cgt_destilados.tesis
 *   - cgt_artefactos_markdown.contenido
 *   - cgt_artefactos_pdf_informe.markdown_renderizado
 *   - cgt_audio_segmentos.texto
 */
export async function listarArtefactosDeProyecto(
  projectId: string,
  filtros: FiltrosArtefacto = {}
): Promise<Result<CgtArtefacto[]>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Obtiene un artefacto con toda su información relacionada.
 *
 * Incluye:
 *   - Artefacto base
 *   - Extensión específica por tipo
 *   - Segmentos si audio/video
 *   - Imágenes descritas si aplica
 *   - Crónica, destilado, germinal
 *   - Grupo si pertenece a uno
 *
 * Valida permisos (usuario tiene acceso al proyecto).
 */
export async function obtenerArtefactoCompleto(
  artefactoId: string
): Promise<Result<ArtefactoCompleto>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

/**
 * Lista grupos de un proyecto con conteo de artefactos por grupo.
 */
export async function listarGruposDeProyecto(
  projectId: string
): Promise<Result<Array<CgtGrupoArtefactos & { num_artefactos: number }>>> {
  // TODO: Windsurf implementa
  throw new Error("Not implemented");
}

// =============================================================================
// UTILIDADES INTERNAS (no-exportadas, referencia)
// =============================================================================

/**
 * Valida que el usuario autenticado tenga acceso al proyecto.
 * Acceso se determina por owner_id o lead_researcher_user_id de projects.
 *
 * Retorna el user_id si tiene acceso, o error si no.
 */
// async function validarAccesoProyecto(projectId: string): Promise<Result<string>>

/**
 * Construye la tríada canónica (JSON + YAML + MD) para un artefacto.
 * El JSON es determinístico (keys ordenadas) para que el hash sea reproducible.
 *
 * La lógica de serialización canónica vive en
 * `/lib/cognetica-forense/utils/json-canonical.ts`.
 */
// async function construirTriada(
//   artefacto: CgtArtefacto,
//   contenidoEstructurado: unknown
// ): Promise<{ md: string; yaml: string; json: string; sha256: string }>

/**
 * Dispara el flujo completo de metabolización en background.
 * No bloquea el retorno al cliente.
 */
// async function dispararMetabolizacion(artefactoId: string): Promise<void>
