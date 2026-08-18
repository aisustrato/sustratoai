//. 📍 lib/deepseek/resolve-key.ts
/**
 * Resolución de la API key de DeepSeek a usar en un job de preclasificación.
 *
 * BYOK: si el usuario que disparó el job tiene su propia key configurada en
 * `user_api_keys`, se usa esa. Si no, cae a la key global de
 * `process.env.DEEPSEEK_API_KEY`. Ver
 * docs/preclasificacion-auditoria-funcional/05_Requerimiento_BYOK_DeepSeek.md
 *
 * Se llama desde dentro de los job runners de
 * `lib/actions/preclassification-actions.ts`, que ya operan con
 * `service_role` (bypass RLS) — la consulta a `user_api_keys` acá también
 * va sin RLS, igual que el resto del job.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export interface ResolvedDeepSeekKey {
	apiKey: string;
	source: "user" | "global";
}
//#endregion ![def]

//#region [main] - 🔧 RESOLUCIÓN 🔧
/**
 * Resuelve qué API key de DeepSeek usar para un job disparado por `userId`.
 *
 * Errores siempre visibles: si el usuario tiene key propia pero falta el
 * secreto de servidor para desencriptarla, o la desencripción falla, esto
 * lanza en vez de caer en silencio a la key global — eso sería un "fallback
 * disfraz" que oculta un problema de configuración real.
 */
export async function resolveDeepSeekApiKey(
	userId: string,
	admin: SupabaseClient<Database>,
): Promise<ResolvedDeepSeekKey> {
	const { data: row, error } = await admin
		.from("user_api_keys")
		.select("encrypted_key")
		.eq("user_id", userId)
		.eq("provider", "deepseek")
		.maybeSingle();

	if (error) {
		console.error("[resolveDeepSeekApiKey] Error consultando user_api_keys", {
			userId,
			error,
		});
		throw new Error(
			`No se pudo verificar la key personal de DeepSeek: ${error.message}`,
		);
	}

	if (!row) {
		const globalKey = process.env.DEEPSEEK_API_KEY;
		if (!globalKey) {
			throw new Error("La clave de API de DeepSeek no está configurada.");
		}
		return { apiKey: globalKey, source: "global" };
	}

	const secret = process.env.API_KEYS_ENCRYPTION_SECRET;
	if (!secret) {
		console.error(
			"[resolveDeepSeekApiKey] API_KEYS_ENCRYPTION_SECRET no configurado, pero el usuario tiene una key propia guardada",
			{ userId },
		);
		throw new Error(
			"El servidor no tiene configurado el secreto de encriptación (API_KEYS_ENCRYPTION_SECRET); no se puede leer la key personal de DeepSeek.",
		);
	}

	const { data: decrypted, error: decryptError } = await admin.rpc(
		"decrypt_api_key",
		{ p_encrypted: row.encrypted_key, p_secret: secret },
	);

	if (decryptError || !decrypted) {
		console.error("[resolveDeepSeekApiKey] Error desencriptando key propia", {
			userId,
			decryptError,
		});
		throw new Error(
			`No se pudo desencriptar la key personal de DeepSeek: ${decryptError?.message ?? "resultado vacío"}`,
		);
	}

	return { apiKey: decrypted, source: "user" };
}
//#endregion ![main]
