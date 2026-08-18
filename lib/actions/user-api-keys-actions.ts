//. 📍 lib/actions/user-api-keys-actions.ts
"use server";

/**
 * BYOK (Bring Your Own Key): cada investigador gestiona su propia API key
 * de DeepSeek desde /personal/configuracion. Ver
 * docs/preclasificacion-auditoria-funcional/05_Requerimiento_BYOK_DeepSeek.md
 *
 * La key nunca se devuelve al cliente en texto plano — ni siquiera
 * `getUserDeepSeekKeyStatus` la desencripta. Solo se desencripta dentro de
 * los job runners de preclasificación, vía `resolveDeepSeekApiKey`.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { createSupabaseServerClient } from "@/lib/server";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export interface DeepSeekKeyStatus {
	configured: boolean;
	last4: string | null;
}
//#endregion ![def]

//#region [main] - 🔧 ACCIONES 🔧
/**
 * Guarda (o reemplaza) la API key de DeepSeek del usuario autenticado.
 * Encripta con `encrypt_api_key` (pgcrypto) antes de persistir.
 */
export async function saveUserDeepSeekKey(
	rawKey: string,
): Promise<ResultadoOperacion<{ last4: string }>> {
	const trimmedKey = rawKey.trim();
	if (trimmedKey.length < 10) {
		return {
			success: false,
			error: "La API key parece inválida (muy corta).",
		};
	}

	const secret = process.env.API_KEYS_ENCRYPTION_SECRET;
	if (!secret) {
		console.error(
			"[saveUserDeepSeekKey] API_KEYS_ENCRYPTION_SECRET no configurado en el servidor",
		);
		return {
			success: false,
			error: "El servidor no tiene configurado el secreto de encriptación.",
		};
	}

	const supabase = await createSupabaseServerClient();
	const {
		data: { user: currentUser },
	} = await supabase.auth.getUser();
	if (!currentUser) {
		return { success: false, error: "Usuario no autenticado." };
	}

	const { data: encrypted, error: encryptError } = await supabase.rpc(
		"encrypt_api_key",
		{ p_plain: trimmedKey, p_secret: secret },
	);
	if (encryptError || !encrypted) {
		console.error("[saveUserDeepSeekKey] Error encriptando key", {
			userId: currentUser.id,
			encryptError,
		});
		return {
			success: false,
			error: `No se pudo encriptar la key: ${encryptError?.message ?? "resultado vacío"}`,
		};
	}

	const last4 = trimmedKey.slice(-4);

	const { error: upsertError } = await supabase.from("user_api_keys").upsert(
		{
			user_id: currentUser.id,
			provider: "deepseek",
			encrypted_key: encrypted,
			key_last4: last4,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id,provider" },
	);
	if (upsertError) {
		console.error("[saveUserDeepSeekKey] Error guardando key", {
			userId: currentUser.id,
			upsertError,
		});
		return {
			success: false,
			error: `No se pudo guardar la key: ${upsertError.message}`,
		};
	}

	return { success: true, data: { last4 } };
}

/** Estado de la key del usuario autenticado: configurada o no, y últimos 4 dígitos. */
export async function getUserDeepSeekKeyStatus(): Promise<
	ResultadoOperacion<DeepSeekKeyStatus>
> {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user: currentUser },
	} = await supabase.auth.getUser();
	if (!currentUser) {
		return { success: false, error: "Usuario no autenticado." };
	}

	const { data: row, error } = await supabase
		.from("user_api_keys")
		.select("key_last4")
		.eq("user_id", currentUser.id)
		.eq("provider", "deepseek")
		.maybeSingle();
	if (error) {
		console.error("[getUserDeepSeekKeyStatus] Error consultando key", {
			userId: currentUser.id,
			error,
		});
		return {
			success: false,
			error: `No se pudo verificar la key: ${error.message}`,
		};
	}

	return {
		success: true,
		data: { configured: !!row, last4: row?.key_last4 ?? null },
	};
}

/** Elimina la key de DeepSeek del usuario autenticado (vuelve al fallback global). */
export async function deleteUserDeepSeekKey(): Promise<
	ResultadoOperacion<null>
> {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user: currentUser },
	} = await supabase.auth.getUser();
	if (!currentUser) {
		return { success: false, error: "Usuario no autenticado." };
	}

	const { error } = await supabase
		.from("user_api_keys")
		.delete()
		.eq("user_id", currentUser.id)
		.eq("provider", "deepseek");
	if (error) {
		console.error("[deleteUserDeepSeekKey] Error eliminando key", {
			userId: currentUser.id,
			error,
		});
		return {
			success: false,
			error: `No se pudo eliminar la key: ${error.message}`,
		};
	}

	return { success: true, data: null };
}
//#endregion ![main]
