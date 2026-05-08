//. 📍 lib/actions/cognetica-forense-exportacion-actions.ts
/**
 * Server Actions de **exportación** para Cognética Forense v2.
 *
 * Responsabilidad: materializar on-demand la **Tríada Canónica**
 * (`.md` + `.yaml` + `.json`) de un artefacto que ya fue ingerido y
 * (idealmente) metabolizado. Subirla a Storage, popular los paths en la
 * fila de `cgt_artefactos` y retornar URLs/paths de descarga.
 *
 * **Por qué existe** (ver `docs/cognetica/PREGUNTA_A_HONGO_triada_en_ingesta.md`):
 *   La tríada es un paquete de **salida**, no de entrada. En ingesta solo
 *   se persiste el archivo original. La tríada se construye cuando alguien
 *   la pide, consolidando el contenido parseado + metabolizaciones
 *   disponibles (crónica, destilado, germinal) en un snapshot empaquetado.
 *
 * **Idempotencia esperada** (a implementar):
 *   Si la tríada ya fue materializada y la metabolización no cambió desde
 *   entonces, retornar los paths existentes sin re-generar. Si cambió,
 *   re-materializar y actualizar paths en DB.
 *
 * **Estado actual**: STUB. Se implementa en Oleada 1 cierre o Oleada 1.5,
 * cuando haya al menos una metabolización real para empaquetar.
 */

"use server";

//#region [head] - 🏷️ IMPORTS 🏷️
import type { Result, ResultErrorCode } from "@/lib/cognetica-forense/types";
import { fail } from "@/lib/cognetica-forense/types";
//#endregion ![head]

//#region [def] - 📦 TIPOS 📦
/**
 * Resultado de `exportarTriada`: los tres paths en Storage del paquete
 * materializado + hash del paquete completo (distinto de
 * `cgt_artefactos.sha256_json`, que hashea solo el contenido parseado).
 */
export interface TriadaExportada {
	storage_path_md: string;
	storage_path_yaml: string;
	storage_path_json: string;
	/** Hash SHA-256 del paquete tríada materializado (contenido + metabolización). */
	sha256_triada_empaquetada: string;
}
//#endregion ![def]

//#region [main] - 🔧 EXPORTACIÓN 🔧
/**
 * Materializa la tríada canónica de un artefacto y retorna sus paths.
 *
 * Flujo previsto:
 * 1. Validar permisos de lectura sobre el proyecto dueño del artefacto
 * 2. Cargar `cgt_artefactos` + tabla específica por tipo
 * 3. Cargar metabolizaciones disponibles: `cgt_cronicas`,
 *    `cgt_destilados`, `cgt_germinales`
 * 4. Construir JSON canónico ampliado (parsed + metabolizaciones + meta)
 * 5. Derivar YAML y MD legibles del mismo objeto
 * 6. Calcular hash del paquete empaquetado
 * 7. Subir los tres formatos a Storage bajo paths canónicos
 * 8. UPDATE `cgt_artefactos` populando `storage_path_md/yaml/json`
 * 9. Retornar `TriadaExportada`
 *
 * Si ya existe tríada materializada y su hash coincide con el nuevo cálculo,
 * se saltan los pasos 7-8 (idempotencia).
 *
 * @todo Oleada 1 cierre / 1.5 — implementar.
 */
export async function exportarTriada(
	artefactoId: string,
): Promise<Result<TriadaExportada, ResultErrorCode>> {
	// Uso simbólico del parámetro para evitar warning de unused var sin
	// recurrir a `_` (el contrato del stub explicita que el argumento
	// existe y será consumido al implementar).
	void artefactoId;
	return fail<ResultErrorCode>("NOT_IMPLEMENTED");
}
//#endregion ![main]
