//. 📍 lib/cognetica-forense/error-amigable.ts
/**
 * Traducción de códigos de error técnicos (`ResultErrorCode` + otros que
 * pueden aparecer en `ai_job_history.error_message`) a mensajes amigables
 * en español. La UI muestra el mensaje amigable como default y deja el
 * código técnico disponible bajo un botón "Ver error" para debug.
 *
 * Filosofía: el usuario casi nunca necesita ver "TRANSCRIPTION_ERROR" —
 * necesita entender qué se rompió y qué puede hacer. El código técnico
 * vale para soporte / debug, no para el flujo habitual.
 */

export interface MensajeAmigable {
	/** Título corto y claro de lo que pasó. */
	titulo: string;
	/** Explicación breve + sugerencia de acción si la hay. */
	descripcion: string;
}

const MAPA_CODIGOS_AMIGABLES: Record<string, MensajeAmigable> = {
	TRANSCRIPTION_ERROR: {
		titulo: "Falló la transcripción del audio",
		descripcion:
			"El servicio externo de transcripción (WhisperX en Replicate) " +
			"tuvo un problema procesando este audio. Suele resolverse al " +
			"reintentar — si persiste, revisá la calidad del audio.",
	},
	LLM_ERROR: {
		titulo: "El modelo de IA tuvo un problema",
		descripcion:
			"DeepSeek devolvió un error o cortó la respuesta antes de tiempo. " +
			"Generalmente es temporal — reintentá en unos segundos.",
	},
	NOT_IMPLEMENTED: {
		titulo: "Funcionalidad no disponible",
		descripcion:
			"Este tipo de procesamiento aún no está implementado para este " +
			"formato de artefacto.",
	},
	MISSING_UPSTREAM: {
		titulo: "Falta un paso previo",
		descripcion:
			"No se pudo iniciar este paso porque falta data de uno anterior " +
			"del pipeline. Revisá si el artefacto se subió completo.",
	},
	INTERNAL: {
		titulo: "Error interno del servidor",
		descripcion:
			"Ocurrió un problema técnico no esperado. Revisá los logs del " +
			"servidor para ver el detalle — el código técnico aparece en " +
			"\"Ver error\".",
	},
	STORAGE_ERROR: {
		titulo: "Error de almacenamiento",
		descripcion:
			"No se pudo leer o escribir un archivo en el storage. " +
			"Verificá que el archivo original siga disponible.",
	},
	UNAUTHORIZED: {
		titulo: "Sesión expirada",
		descripcion: "Necesitás volver a iniciar sesión para continuar.",
	},
	FORBIDDEN: {
		titulo: "Sin permiso",
		descripcion: "No tenés acceso a este artefacto en el proyecto actual.",
	},
	NOT_FOUND: {
		titulo: "Artefacto no encontrado",
		descripcion: "El artefacto no existe o fue eliminado.",
	},
	INVALID_INPUT: {
		titulo: "Datos inválidos",
		descripcion: "Los datos enviados no cumplen el formato esperado.",
	},
	DUPLICATE: {
		titulo: "Ya existe",
		descripcion: "Ya existe un proceso o registro con estas características.",
	},
	THRESHOLD_NOT_MET: {
		titulo: "Umbral no alcanzado",
		descripcion: "No se cumplen las precondiciones para generar este formato.",
	},
};

/**
 * Devuelve un mensaje amigable para mostrar al usuario. Si el código no
 * está mapeado, devuelve un fallback genérico — y el código original
 * queda disponible para mostrar en "Ver error".
 */
export function mensajeAmigableDeError(
	codigoOMensaje: string | null | undefined,
): MensajeAmigable {
	if (!codigoOMensaje) {
		return {
			titulo: "La metabolización falló",
			descripcion:
				"No se recibió detalle del error. Revisá los logs del servidor.",
		};
	}
	const trimmed = codigoOMensaje.trim();
	const match = MAPA_CODIGOS_AMIGABLES[trimmed];
	if (match) return match;
	// No mapeado: probablemente vino del backend un mensaje técnico libre
	// (no un código del enum). Devolvemos genérico y dejamos el original
	// para "Ver error".
	return {
		titulo: "La metabolización falló",
		descripcion:
			"Ocurrió un problema durante el proceso. Tocá \"Ver error\" para " +
			"ver el detalle técnico exacto.",
	};
}
