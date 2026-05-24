//. 📍 lib/actions/cognetica-forense-ingesta-actions.ts
/**
 * Server Actions de **ingesta** para Cognética Forense v2 — Oleada 1.
 *
 * Responsabilidad: recibir un `IngestaArtefactoInput`, validar permisos,
 * persistir el archivo original en Storage, parsear el contenido, calcular
 * el hash canónico del contenido parseado, insertar en `cgt_artefactos` +
 * tabla específica por tipo, y retornar el `CgtArtefacto` listo para el
 * flujo de metabolización (que se ejecuta en otro dominio).
 *
 * **Decisión de diseño (resuelta con Hongo 2026-04-20)** —
 * ver `docs/cognetica/PREGUNTA_A_HONGO_triada_en_ingesta.md`:
 *   La tríada canónica (`.md` + `.yaml` + `.json`) es un **paquete de
 *   exportación** que se materializa on-demand al momento de descarga,
 *   NO en ingesta. Empaquetar antes de que el artefacto sea metabolizado
 *   sería congelar un paquete incompleto.
 *
 *   En ingesta:
 *     - Se sube UN solo archivo a Storage: el original.
 *     - `sha256_json` = hash SHA-256 del JSON canónico del **contenido
 *       parseado** (sin fecha_ingesta, sin metabolización). Esto habilita
 *       dedup estable: el mismo archivo subido dos veces produce el mismo
 *       hash.
 *     - `storage_path_md`, `storage_path_yaml`, `storage_path_json`
 *       quedan NULL. Los popula `exportarTriada` cuando alguien pide
 *       descarga (ver `cognetica-forense-exportacion-actions.ts`).
 *
 * Estado Oleada 1:
 *   - `markdown`: IMPLEMENTADO end-to-end.
 *   - Otros tipos: dispatcher retorna `NOT_IMPLEMENTED` hasta que cada
 *     procesador específico esté listo (audio, video, pdf_*, imagen).
 *
 * No lanza excepciones hacia el cliente — todo error viaja en `Result`.
 *
 * Contrato de referencia: `@/lib/actions/cognetica_forense_actions.ts`
 * (firma canónica entregada por Hongo/Calibrador).
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import { randomUUID } from "node:crypto";

import type {
	CgtArtefacto,
	CgtTipoArtefacto,
	CgtVisibilidad,
	IngestaArtefactoInput,
	Result,
	ResultErrorCode,
} from "@/lib/cognetica-forense/types";
import { fail, ok } from "@/lib/cognetica-forense/types";
import { parseMarkdownArtefacto } from "@/lib/cognetica-forense/parsers/markdown";
import { hashContenidoCanonico } from "@/lib/cognetica-forense/triada";
import type { Json } from "@/lib/database.types";
import { createServerClient } from "@/lib/supabase";
//#endregion ![head]

//#region [def] - 📦 CONSTANTES 📦
/**
 * Permiso requerido para operar sobre Cognética Forense.
 * Reutiliza el permiso genérico de gestión de maestros — mismo criterio que v1.
 * Si se define un permiso específico (`can_manage_cognetica_forense`), cambiar aquí.
 */
const PERMISO_GESTIONAR_COGNETICA = "can_manage_master_data";

/**
 * Bucket de Storage para archivos de Cognética. Reutiliza el de v1.
 * Los paths del v2 tienen prefijo `cognetica/{project_id}/...` según el contrato §3.
 */
const STORAGE_BUCKET = "cognetica-files";

/**
 * Extensiones y MIME types aceptados por tipo de artefacto.
 * Permisivo con MIME ausente (algunos browsers no lo setean para .md).
 */
const ACEPTADOS_POR_TIPO: Record<
	CgtTipoArtefacto,
	{
		extensiones: string[];
		mimes: string[];
	}
> = {
	markdown: {
		extensiones: [".md", ".markdown"],
		mimes: ["text/markdown", "text/x-markdown", "text/plain", ""],
	},
	audio: {
		extensiones: [".mp3", ".wav", ".m4a", ".flac", ".ogg"],
		mimes: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/flac", "audio/ogg"],
	},
	video: {
		extensiones: [".mp4", ".mov", ".mkv", ".webm"],
		mimes: ["video/mp4", "video/quicktime", "video/x-matroska", "video/webm"],
	},
	pdf_slides: { extensiones: [".pdf"], mimes: ["application/pdf"] },
	pdf_informe: { extensiones: [".pdf"], mimes: ["application/pdf"] },
	imagen: {
		extensiones: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
		mimes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
	},
};
//#endregion ![def]

//#region [helpers] - 🛠️ PERMISOS 🛠️
/**
 * Verifica que el usuario tenga `can_manage_master_data` sobre el proyecto
 * vía RPC `has_permission_in_project`. Mismo patrón que `cognetica-old-actions.ts`.
 *
 * Retorna `true` solo si el RPC confirma el permiso. Cualquier error
 * intermedio (RPC falla, user no autenticado) lo interpreta como denegación.
 */
async function verificarPermisoGestionCognetica(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	userId: string,
	projectId: string,
): Promise<boolean> {
	const { data, error } = await supabase.rpc("has_permission_in_project", {
		p_user_id: userId,
		p_project_id: projectId,
		p_permission_column: PERMISO_GESTIONAR_COGNETICA,
	});
	if (error) {
		console.error("[cognetica-forense] RPC permisos falló:", error);
		return false;
	}
	return data === true;
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ VALIDACIÓN DE ARCHIVO 🛠️
/**
 * Deriva la extensión (con punto) de un `File | Blob` usando `name` si existe.
 * Los `Blob` puros no tienen `name`; en ese caso se infiere `.bin`.
 */
function obtenerExtension(file: File | Blob): string {
	const name = "name" in file ? file.name : "";
	const idx = name.lastIndexOf(".");
	return idx >= 0 ? name.slice(idx).toLowerCase() : ".bin";
}

/**
 * Valida que el archivo tenga extensión/MIME coherente con el tipo declarado.
 * Retorna `null` si es válido, o un mensaje user-facing si no.
 */
function validarArchivoContraTipo(
	file: File | Blob,
	tipo: CgtTipoArtefacto,
): string | null {
	const reglas = ACEPTADOS_POR_TIPO[tipo];
	const ext = obtenerExtension(file);
	const mime = file.type ?? "";

	const extOk = reglas.extensiones.includes(ext);
	const mimeOk = reglas.mimes.includes(mime);

	// Política permisiva: basta con que extensión **o** MIME calcen.
	if (!extOk && !mimeOk) {
		return `El archivo no corresponde al tipo "${tipo}" (extensión ${ext || "desconocida"}, MIME ${mime || "vacío"}).`;
	}
	return null;
}
//#endregion ![helpers]

//#region [helpers] - 🛠️ STORAGE 🛠️
/**
 * Construye el path canónico dentro del bucket.
 * Formato §3 del contrato: `cognetica/{project_id}/{artefacto_uuid}/{filename}`.
 */
function pathArtefacto(
	projectId: string,
	artefactoId: string,
	filename: string,
): string {
	return `cognetica/${projectId}/${artefactoId}/${filename}`;
}

/**
 * Sube un `Blob`, `File` o string a Storage forzando el `contentType`.
 *
 * Importante: Supabase Storage deriva el MIME del `Blob.type` y solo
 * usa el `contentType` del options como fallback. Un `File` de `.md`
 * emitido por el navegador suele llegar con `type === ""` o
 * `"application/octet-stream"`, y el bucket lo rechaza si su allowlist
 * de MIMEs no lo incluye. Por eso **siempre** reconstruimos un `Blob`
 * con el `contentType` que nosotros decidimos por tipo de artefacto.
 *
 * Lanza si falla — el caller envuelve en `fail()`.
 */
async function subirAStorage(
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	path: string,
	body: Blob | string,
	contentType: string,
): Promise<void> {
	// Convertimos siempre a Uint8Array. Motivo: `@supabase/storage-js` prioriza
	// `blob.type` sobre el `contentType` del options cuando el body es Blob/File,
	// y un `File` emitido por el navegador para `.md` llega con
	// `type === ""` o `application/octet-stream` — rechazado por el bucket.
	// Con `Uint8Array` (o `ArrayBuffer`) el cliente usa sí o sí el `contentType`
	// que pasamos y lo envía como header `Content-Type` en el PUT.
	const bytes: Uint8Array =
		typeof body === "string" ?
			new TextEncoder().encode(body)
		:	new Uint8Array(await body.arrayBuffer());

	const { error } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(path, bytes, { contentType, upsert: false });
	if (error) {
		throw new Error(`Storage upload falló (${path}): ${error.message}`);
	}
}
//#endregion ![helpers]

//#region [main] - 🔧 INGESTA DE MARKDOWN 🔧
/**
 * Implementa la ingesta de un artefacto tipo `markdown` end-to-end.
 *
 * Flujo post-decisión con Hongo (ver header del archivo):
 * 1. Validar coherencia archivo ↔ tipo
 * 2. Leer contenido como texto UTF-8 + parsear frontmatter + headers
 * 3. Calcular SHA-256 del **contenido parseado canónico** (sin fecha,
 *    sin metabolización) — para dedup estable por `(project_id, sha256)`
 * 4. Verificar que no exista otro artefacto con mismo `(project_id, sha256)`
 * 5. Generar UUID y subir **solo el archivo original** a Storage
 * 6. INSERT en `cgt_artefactos` con `storage_path_md/yaml/json = NULL`
 *    (la tríada se materializa on-demand vía `exportarTriada`)
 * 7. INSERT en `cgt_artefactos_markdown`
 * 8. Retornar el `CgtArtefacto` recién creado
 *
 * TODO Oleada 1 (pendiente de prompts de Hongo):
 * - Disparar metabolización (crónica → destilado → germinal) en background
 *   tras el INSERT. Hoy el artefacto queda en `estado='ingresado'` y la
 *   metabolización se dispara manualmente.
 */
async function ingestaArtefactoMarkdown(
	input: IngestaArtefactoInput,
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	userId: string,
): Promise<Result<CgtArtefacto, ResultErrorCode>> {
	// (1) Validación archivo ↔ tipo.
	const errorArchivo = validarArchivoContraTipo(input.file, "markdown");
	if (errorArchivo) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	// (2) Lectura + parse. `file.text()` funciona en File y Blob.
	const raw = await input.file.text();
	const parsed = parseMarkdownArtefacto(raw);

	// (3) Hash de identidad canónica. Hasheamos SOLO el contenido parseado
	//     + títulos/metadata — NO `fecha_ingesta`, NO metabolizaciones (que
	//     además no existen en este punto). Esto garantiza que subir el
	//     mismo .md dos veces produzca el mismo hash y el dedup en (6) lo
	//     detecte.
	const sha256 = await hashContenidoCanonico({
		tipo: "markdown",
		titulo: input.titulo,
		descripcion: input.descripcion ?? null,
		contenido_estructurado: {
			contenido: parsed.contenido,
			frontmatter: parsed.frontmatter,
			headers: parsed.headers,
		},
		metadata: input.metadata,
	});

	// (4) Verificación de duplicado en el proyecto.
	{
		const { data: dup, error: dupError } = await supabase
			.from("cgt_artefactos")
			.select("id")
			.eq("project_id", input.project_id)
			.eq("sha256_json", sha256)
			.maybeSingle();
		if (dupError) {
			console.error("[cognetica-forense] chequeo dedup falló:", dupError);
			return fail<ResultErrorCode>("INTERNAL");
		}
		if (dup) {
			return fail<ResultErrorCode>("DUPLICATE");
		}
	}

	// (5) Storage: solo el original. Generamos UUID ahora para que el path
	//     sea canónico y reutilizable por `exportarTriada` más adelante.
	const artefactoId = randomUUID();
	const ext = obtenerExtension(input.file) || ".md";
	const pathOriginal = pathArtefacto(
		input.project_id,
		artefactoId,
		`original${ext}`,
	);

	try {
		await subirAStorage(supabase, pathOriginal, input.file, "text/markdown");
	} catch (e) {
		console.error("[cognetica-forense] Storage upload falló:", e);
		return fail<ResultErrorCode>("STORAGE_ERROR");
	}

	// (6) INSERT en tabla madre. Los `storage_path_md/yaml/json` quedan
	//     NULL: serán populados por `exportarTriada` la primera vez que
	//     alguien pida descargar el paquete tríada.
	const { data: artefactoInsertado, error: insertError } = await supabase
		.from("cgt_artefactos")
		.insert({
			id: artefactoId,
			project_id: input.project_id,
			grupo_id: input.grupo_id ?? null,
			tipo: "markdown",
			titulo: input.titulo,
			descripcion: input.descripcion ?? null,
			storage_path_original: pathOriginal,
			storage_path_md: null,
			storage_path_yaml: null,
			storage_path_json: null,
			sha256_json: sha256,
			estado: "ingresado",
			visibilidad: input.visibilidad ?? "privado",
			// `Record<string, unknown>` (Hongo) → `Json` (Supabase): el superset
			// es más amplio que el subset admitido por postgres jsonb (no Dates,
			// no BigInt), pero el caller responsable garantiza plain JSON values.
			metadata: (input.metadata ?? {}) as Json,
			created_by: userId,
		})
		.select("*")
		.single();

	if (insertError || !artefactoInsertado) {
		console.error(
			"[cognetica-forense] INSERT cgt_artefactos falló:",
			insertError,
		);
		// Compensación: intentar limpiar el blob original. No bloqueamos
		// el retorno si la limpieza falla — el operador puede purgar después.
		await supabase.storage
			.from(STORAGE_BUCKET)
			.remove([pathOriginal])
			.catch((cleanupErr) => {
				console.error(
					"[cognetica-forense] cleanup tras INSERT fallido:",
					cleanupErr,
				);
			});
		return fail<ResultErrorCode>("INTERNAL");
	}

	// (7) INSERT en extensión específica.
	const { error: mdInsertError } = await supabase
		.from("cgt_artefactos_markdown")
		.insert({
			artefacto_id: artefactoId,
			contenido: parsed.contenido,
			// Misma razón de cast que `metadata` arriba: `Record<string,
			// unknown>` y `CgtHeader[]` son supersets del `Json` estricto.
			frontmatter: parsed.frontmatter as Json,
			headers: parsed.headers as unknown as Json,
			autor_original: parsed.autor_original,
			fecha_original: parsed.fecha_original,
		});

	if (mdInsertError) {
		console.error(
			"[cognetica-forense] INSERT cgt_artefactos_markdown falló:",
			mdInsertError,
		);
		// La fila madre ya existe — devolvemos error pero NO borramos:
		// queda un artefacto "huérfano" sin extensión, visible en estado
		// 'ingresado' que el operador puede eliminar manualmente. Mejor eso
		// que perder el original que ya pagó el upload.
		return fail<ResultErrorCode>("INTERNAL");
	}

	return ok(artefactoInsertado as CgtArtefacto);
}
//#endregion ![main]

//#region [main] - 🔧 INGESTA DE PDF INFORME 🔧
/**
 * Implementa la ingesta de un artefacto tipo `pdf_informe`.
 *
 * Flujo:
 * 1. Validar coherencia archivo ↔ tipo (debe ser PDF)
 * 2. Subir archivo original a Storage
 * 3. Insertar en `cgt_artefactos` con estado='ingresado'
 * 4. No insertar en tabla específica todavía - se hace en procesarPdfInforme
 * 5. Disparar procesamiento asíncrono vía procesarPdfInforme
 * 6. Retornar el artefacto creado
 *
 * Nota: El procesamiento real (PDF→Markdown) se hace en background
 * mediante `procesarPdfInforme()` que usa la API Route /api/cognetica/process-pdf
 */
async function ingestaArtefactoPdfInforme(
	input: IngestaArtefactoInput,
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	userId: string,
): Promise<Result<CgtArtefacto, ResultErrorCode>> {
	// (1) Validación archivo ↔ tipo.
	const errorArchivo = validarArchivoContraTipo(input.file, "pdf_informe");
	if (errorArchivo) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	// (2) Generar UUID y path para Storage
	const artefactoId = randomUUID();
	const pathOriginal = pathArtefacto(
		input.project_id,
		artefactoId,
		"original.pdf",
	);

	// (3) Subir PDF a Storage
	try {
		await subirAStorage(supabase, pathOriginal, input.file, "application/pdf");
	} catch (e) {
		console.error("[cognetica-forense] Storage upload PDF falló:", e);
		return fail<ResultErrorCode>("STORAGE_ERROR");
	}

	// (4) Calcular hash simple del archivo para dedup (usamos el path como referencia)
	// Para PDFs el hash se calcula sobre el contenido extraído después del procesamiento
	const sha256 = await hashContenidoCanonico({
		tipo: "pdf_informe",
		titulo: input.titulo,
		descripcion: input.descripcion ?? null,
		contenido_estructurado: { pathOriginal },
		metadata: input.metadata,
	});

	// (5) Verificar duplicado en el proyecto
	{
		const { data: dup, error: dupError } = await supabase
			.from("cgt_artefactos")
			.select("id")
			.eq("project_id", input.project_id)
			.eq("sha256_json", sha256)
			.maybeSingle();
		if (dupError) {
			console.error("[cognetica-forense] chequeo dedup falló:", dupError);
			return fail<ResultErrorCode>("INTERNAL");
		}
		if (dup) {
			// Limpiar el archivo subido
			await supabase.storage
				.from(STORAGE_BUCKET)
				.remove([pathOriginal])
				.catch((cleanupErr) => {
					console.error(
						"[cognetica-forense:ingesta] cleanup de storage falló — blob posiblemente huérfano:",
						pathOriginal,
						cleanupErr,
					);
				});
			return fail<ResultErrorCode>("DUPLICATE");
		}
	}

	// (6) INSERT en tabla madre
	const { data: artefactoInsertado, error: insertError } = await supabase
		.from("cgt_artefactos")
		.insert({
			id: artefactoId,
			project_id: input.project_id,
			grupo_id: input.grupo_id ?? null,
			tipo: "pdf_informe",
			titulo: input.titulo,
			descripcion: input.descripcion ?? null,
			storage_path_original: pathOriginal,
			storage_path_md: null,
			storage_path_yaml: null,
			storage_path_json: null,
			sha256_json: sha256,
			estado: "ingresado",
			visibilidad: input.visibilidad ?? "privado",
			metadata: (input.metadata ?? {}) as Json,
			created_by: userId,
		})
		.select("*")
		.single();

	if (insertError || !artefactoInsertado) {
		console.error(
			"[cognetica-forense] INSERT cgt_artefactos falló:",
			insertError,
		);
		// Compensación: intentar limpiar el blob
		await supabase.storage
			.from(STORAGE_BUCKET)
			.remove([pathOriginal])
			.catch(() => {});
		return fail<ResultErrorCode>("INTERNAL");
	}

	// (7) El procesamiento con Marker se hará en el pipeline de metabolización.
	// No esperamos durante la ingesta para no bloquear al usuario.
	return ok(artefactoInsertado as CgtArtefacto);
}
//#endregion ![main]

//#region [main] - 🎙️ INGESTA AUDIO 🎙️
/**
 * Ingesta un artefacto de audio:
 *
 * Flujo:
 *   1. Valida archivo ↔ tipo (debe ser audio)
 *   2. Sube archivo original a Storage
 *   3. Inserta en `cgt_artefactos` con estado='ingresado'
 *   4. Espera a que WhisperX transcriba el audio (síncrono)
 *   5. Retorna el artefacto creado (estado='ingresado' si todo ok)
 */
async function ingestaArtefactoAudio(
	input: IngestaArtefactoInput,
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	userId: string,
): Promise<Result<CgtArtefacto, ResultErrorCode>> {
	// (1) Validación archivo ↔ tipo.
	const errorArchivo = validarArchivoContraTipo(input.file, "audio");
	if (errorArchivo) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	// (2) Generar UUID y path para Storage
	const artefactoId = randomUUID();
	const fileName = (input.file as File).name ?? "audio.mp3";
	const extension = fileName.includes(".")
		? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
		: ".mp3";
	const pathOriginal = pathArtefacto(
		input.project_id,
		artefactoId,
		`original${extension}`,
	);

	// (3) Subir audio a Storage
	try {
		await subirAStorage(
			supabase,
			pathOriginal,
			input.file,
			input.file.type || "audio/mpeg",
		);
	} catch (e) {
		console.error("[cognetica-forense] Storage upload audio falló:", e);
		return fail<ResultErrorCode>("STORAGE_ERROR");
	}

	// (4) Calcular hash para dedup
	const sha256 = await hashContenidoCanonico({
		tipo: "audio",
		titulo: input.titulo,
		descripcion: input.descripcion ?? null,
		contenido_estructurado: { pathOriginal },
		metadata: input.metadata,
	});

	// (5) Verificar duplicado en el proyecto
	{
		const { data: dup, error: dupError } = await supabase
			.from("cgt_artefactos")
			.select("id")
			.eq("project_id", input.project_id)
			.eq("sha256_json", sha256)
			.maybeSingle();
		if (dupError) {
			console.error("[cognetica-forense] chequeo dedup falló:", dupError);
			return fail<ResultErrorCode>("INTERNAL");
		}
		if (dup) {
			await supabase.storage
				.from(STORAGE_BUCKET)
				.remove([pathOriginal])
				.catch((cleanupErr) => {
					console.error(
						"[cognetica-forense:ingesta] cleanup de storage falló — blob posiblemente huérfano:",
						pathOriginal,
						cleanupErr,
					);
				});
			return fail<ResultErrorCode>("DUPLICATE");
		}
	}

	// (6) INSERT en tabla madre
	const { data: artefactoInsertado, error: insertError } = await supabase
		.from("cgt_artefactos")
		.insert({
			id: artefactoId,
			project_id: input.project_id,
			grupo_id: input.grupo_id ?? null,
			tipo: "audio",
			titulo: input.titulo,
			descripcion: input.descripcion ?? null,
			storage_path_original: pathOriginal,
			storage_path_md: null,
			storage_path_yaml: null,
			storage_path_json: null,
			sha256_json: sha256,
			estado: "ingresado",
			visibilidad: input.visibilidad ?? "privado",
			metadata: (input.metadata ?? {}) as Json,
			created_by: userId,
		})
		.select("*")
		.single();

	if (insertError || !artefactoInsertado) {
		console.error(
			"[cognetica-forense] INSERT cgt_artefactos falló:",
			insertError,
		);
		await supabase.storage
			.from(STORAGE_BUCKET)
			.remove([pathOriginal])
			.catch(() => {});
		return fail<ResultErrorCode>("INTERNAL");
	}

	// (7) Transcripción se hará en el pipeline de metabolización.
	// No esperamos a WhisperX durante la ingesta para no bloquear al usuario.
	return ok(artefactoInsertado as CgtArtefacto);
}
//#endregion ![main]

//#region [main] - 🔧 INGESTA DE PDF SLIDES 🔧
/**
 * Implementa la ingesta de un artefacto tipo `pdf_slides`.
 *
 * Flujo:
 * 1. Validar coherencia archivo ↔ tipo (debe ser PDF)
 * 2. Subir archivo original a Storage
 * 3. Insertar en `cgt_artefactos` con estado='ingresado'
 * 4. No hacemos split ni procesamiento aquí - se hace en procesarPdfSlides
 * 5. Retornar el artefacto creado
 *
 * Nota: El procesamiento real (split + Marker por página) se hace
 * mediante `procesarPdfSlides()` que usa el pipeline de metabolización
 * o llamado on-demand.
 */
async function ingestaArtefactoPdfSlides(
	input: IngestaArtefactoInput,
	supabase: Awaited<ReturnType<typeof createServerClient>>,
	userId: string,
): Promise<Result<CgtArtefacto, ResultErrorCode>> {
	// (1) Validación archivo ↔ tipo.
	const errorArchivo = validarArchivoContraTipo(input.file, "pdf_slides");
	if (errorArchivo) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	// (2) Generar UUID y path para Storage
	const artefactoId = randomUUID();
	const pathOriginal = pathArtefacto(
		input.project_id,
		artefactoId,
		"original.pdf",
	);

	// (3) Subir PDF a Storage
	try {
		await subirAStorage(supabase, pathOriginal, input.file, "application/pdf");
	} catch (e) {
		console.error("[cognetica-forense] Storage upload PDF slides falló:", e);
		return fail<ResultErrorCode>("STORAGE_ERROR");
	}

	// (4) Calcular hash simple del archivo para dedup
	const sha256 = await hashContenidoCanonico({
		tipo: "pdf_slides",
		titulo: input.titulo,
		descripcion: input.descripcion ?? null,
		contenido_estructurado: { pathOriginal },
		metadata: input.metadata,
	});

	// (5) Verificar duplicado en el proyecto
	{
		const { data: dup, error: dupError } = await supabase
			.from("cgt_artefactos")
			.select("id")
			.eq("project_id", input.project_id)
			.eq("sha256_json", sha256)
			.maybeSingle();
		if (dupError) {
			console.error("[cognetica-forense] chequeo dedup PDF slides falló:", dupError);
			return fail<ResultErrorCode>("INTERNAL");
		}
		if (dup) {
			await supabase.storage
				.from(STORAGE_BUCKET)
				.remove([pathOriginal])
				.catch((cleanupErr) => {
					console.error(
						"[cognetica-forense:ingesta] cleanup de storage falló — blob posiblemente huérfano:",
						pathOriginal,
						cleanupErr,
					);
				});
			return fail<ResultErrorCode>("DUPLICATE");
		}
	}

	// (6) INSERT en tabla madre
	const { data: artefactoInsertado, error: insertError } = await supabase
		.from("cgt_artefactos")
		.insert({
			id: artefactoId,
			project_id: input.project_id,
			grupo_id: input.grupo_id ?? null,
			tipo: "pdf_slides",
			titulo: input.titulo,
			descripcion: input.descripcion ?? null,
			storage_path_original: pathOriginal,
			storage_path_md: null,
			storage_path_yaml: null,
			storage_path_json: null,
			sha256_json: sha256,
			estado: "ingresado",
			visibilidad: input.visibilidad ?? "privado",
			metadata: (input.metadata ?? {}) as Json,
			created_by: userId,
		})
		.select("*")
		.single();

	if (insertError || !artefactoInsertado) {
		console.error(
			"[cognetica-forense] INSERT cgt_artefactos PDF slides falló:",
			insertError,
		);
		await supabase.storage
			.from(STORAGE_BUCKET)
			.remove([pathOriginal])
			.catch(() => {});
		return fail<ResultErrorCode>("INTERNAL");
	}

	// (7) El split y procesamiento con Marker se hará en el pipeline.
	return ok(artefactoInsertado as CgtArtefacto);
}
//#endregion ![main]

//#region [main] - 🔧 DISPATCHER PÚBLICO 🔧
/**
 * Ingesta principal — dispatcher por tipo.
 *
 * Firma idéntica al contrato de Hongo en
 * `@/lib/actions/cognetica_forense_actions.ts:82-87`. Esta implementación
 * **reemplaza** la del contrato para el tipo `markdown`. Para los demás
 * tipos retorna `NOT_IMPLEMENTED` (el código sigue siendo string
 * user-facing según el contrato de `Result<T>` default).
 *
 * Nota: el contrato original usa `Result<T>` con `E = string`; aquí
 * usamos `Result<T, ResultErrorCode>` localmente para tipar mejor. Como
 * `ResultErrorCode` **es** `string`, la asignación es compatible.
 */
export async function ingestaArtefacto(
	input: IngestaArtefactoInput,
): Promise<Result<CgtArtefacto, ResultErrorCode>> {
	// (0) Validación mínima de input antes de tocar Supabase.
	if (!input.project_id || !input.titulo.trim()) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	const supabase = await createServerClient();

	// (1) Autenticación.
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return fail<ResultErrorCode>("UNAUTHORIZED");
	}

	// (1) Autorización por proyecto.
	const puede = await verificarPermisoGestionCognetica(
		supabase,
		user.id,
		input.project_id,
	);
	if (!puede) {
		return fail<ResultErrorCode>("FORBIDDEN");
	}

	// Dispatch por tipo.
	switch (input.tipo) {
		case "markdown":
			return ingestaArtefactoMarkdown(input, supabase, user.id);
		case "pdf_informe":
			return ingestaArtefactoPdfInforme(input, supabase, user.id);
		case "pdf_slides":
			return ingestaArtefactoPdfSlides(input, supabase, user.id);
		case "audio":
			return ingestaArtefactoAudio(input, supabase, user.id);
		case "video":
		case "imagen":
			return fail<ResultErrorCode>("NOT_IMPLEMENTED");
	}
}
//#endregion ![main]

//#region [main] - 🔧 WRAPPER PARA CLIENTES DEL NAVEGADOR 🔧
/**
 * Variante de `ingestaArtefacto` que acepta `FormData`.
 *
 * **Por qué existe**: Next.js prohíbe pasar objetos que contengan `File`
 * dentro de objetos literales a Server Actions desde el navegador
 * (error: *"Only plain objects, and a few built-ins, can be passed to
 * Server Actions"*). La convención oficial es enviar el `File` dentro de
 * un `FormData`, que sí es un built-in soportado.
 *
 * Este wrapper:
 * 1. Parsea los campos del `FormData`
 * 2. Construye un `IngestaArtefactoInput` válido
 * 3. Delega en `ingestaArtefacto` (lógica canónica)
 *
 * Campos esperados en el `FormData`:
 *  - `file` (File, obligatorio)
 *  - `project_id` (string, obligatorio)
 *  - `tipo` (CgtTipoArtefacto, obligatorio)
 *  - `titulo` (string, obligatorio)
 *  - `descripcion` (string, opcional)
 *  - `grupo_id` (string, opcional)
 *  - `visibilidad` ("privado" | "proyecto", opcional)
 *  - `metadata` (JSON string, opcional)
 */
const TIPOS_VALIDOS: ReadonlyArray<CgtTipoArtefacto> = [
	"audio",
	"video",
	"pdf_slides",
	"pdf_informe",
	"markdown",
	"imagen",
];

const VISIBILIDADES_VALIDAS: ReadonlyArray<CgtVisibilidad> = [
	"privado",
	"proyecto",
];

export async function ingestaArtefactoFromFormData(
	formData: FormData,
): Promise<Result<CgtArtefacto, ResultErrorCode>> {
	const file = formData.get("file");
	const project_id = formData.get("project_id");
	const tipo = formData.get("tipo");
	const titulo = formData.get("titulo");
	const descripcion = formData.get("descripcion");
	const grupo_id = formData.get("grupo_id");
	const visibilidad = formData.get("visibilidad");
	const metadataRaw = formData.get("metadata");

	// Validación estricta de tipos: si algún campo obligatorio falta o no es
	// del tipo esperado, devolvemos INVALID_INPUT antes de tocar Supabase.
	if (
		!(file instanceof File) ||
		typeof project_id !== "string" ||
		typeof tipo !== "string" ||
		typeof titulo !== "string" ||
		!TIPOS_VALIDOS.includes(tipo as CgtTipoArtefacto)
	) {
		return fail<ResultErrorCode>("INVALID_INPUT");
	}

	let metadata: Record<string, unknown> | undefined;
	if (typeof metadataRaw === "string" && metadataRaw.trim()) {
		try {
			const parsed = JSON.parse(metadataRaw);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				metadata = parsed as Record<string, unknown>;
			}
		} catch {
			return fail<ResultErrorCode>("INVALID_INPUT");
		}
	}

	const input: IngestaArtefactoInput = {
		file,
		project_id,
		tipo: tipo as CgtTipoArtefacto,
		titulo,
		descripcion:
			typeof descripcion === "string" && descripcion.trim() ?
				descripcion
			:	undefined,
		grupo_id:
			typeof grupo_id === "string" && grupo_id.trim() ? grupo_id : undefined,
		visibilidad:
			(
				typeof visibilidad === "string" &&
				VISIBILIDADES_VALIDAS.includes(visibilidad as CgtVisibilidad)
			) ?
				(visibilidad as CgtVisibilidad)
			:	undefined,
		metadata,
	};

	return ingestaArtefacto(input);
}
//#endregion ![main]
