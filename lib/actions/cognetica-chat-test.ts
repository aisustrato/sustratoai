/**
 * 🧠🪢 Test de Persistencia del Chat QUIPU
 *
 * Funciones para verificar que el flujo de persistencia funciona correctamente:
 * 1. Usuario envía mensaje
 * 2. Mensaje se guarda en DB
 * 3. Se llama a la API
 * 4. Respuesta de AI se guarda en DB
 * 5. Se muestra en UI
 */

import { createSupabaseServerClient } from "@/lib/server";
import type { ChatMessage } from "./cognetica-chat-actions";

/**
 * Verificar que existe una sesión de chat para un artefacto
 */
export async function verifyChatSessionExists(artifactId: string): Promise<{
	exists: boolean;
	sessionId?: string;
	messagesCount?: number;
	error?: string;
}> {
	try {
		console.log(
			`🧠🪢 [Test] 🔍 Verificando sesión existente para artifact: ${artifactId}`,
		);

		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("cog_chat_sessions")
			.select("id, total_messages, messages")
			.eq("artifact_id", artifactId)
			.order("started_at", { ascending: false })
			.limit(1)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 = no rows returned
			console.error(`🧠🪢 [Test] ❌ Error consultando sesión:`, error);
			return { exists: false, error: error.message };
		}

		if (!data) {
			console.log(
				`🧠🪢 [Test] ℹ️ No se encontró sesión para artifact: ${artifactId}`,
			);
			return { exists: false };
		}

		const messagesArray = data.messages as ChatMessage[] | null;
		const actualMessagesCount = messagesArray?.length || 0;

		console.log(`🧠🪢 [Test] ✅ Sesión encontrada:`, {
			sessionId: data.id,
			reportedCount: data.total_messages,
			actualCount: actualMessagesCount,
		});

		return {
			exists: true,
			sessionId: data.id,
			messagesCount: actualMessagesCount,
		};
	} catch (error) {
		console.error(`🧠🪢 [Test] ❌ Error verificando sesión:`, error);
		return { exists: false, error: String(error) };
	}
}

/**
 * Verificar integridad de datos en una sesión
 */
export async function verifyChatSessionIntegrity(sessionId: string): Promise<{
	isValid: boolean;
	issues: string[];
	stats: {
		totalMessages: number;
		userMessages: number;
		assistantMessages: number;
		messagesWithTimestamp: number;
		messagesWithCalibrations: number;
	};
}> {
	try {
		console.log(
			`🧠🪢 [Test] 🔍 Verificando integridad de sesión: ${sessionId}`,
		);

		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("cog_chat_sessions")
			.select("*")
			.eq("id", sessionId)
			.single();

		if (error || !data) {
			return {
				isValid: false,
				issues: [
					`Sesión no encontrada: ${error?.message || "sin error específico"}`,
				],
				stats: {
					totalMessages: 0,
					userMessages: 0,
					assistantMessages: 0,
					messagesWithTimestamp: 0,
					messagesWithCalibrations: 0,
				},
			};
		}

		const messages = (data.messages as unknown as ChatMessage[]) || [];
		const issues: string[] = [];

		// Verificar estructura básica
		if (!Array.isArray(messages)) {
			issues.push("Campo 'messages' no es un array");
			return {
				isValid: false,
				issues,
				stats: {
					totalMessages: 0,
					userMessages: 0,
					assistantMessages: 0,
					messagesWithTimestamp: 0,
					messagesWithCalibrations: 0,
				},
			};
		}

		// Calcular estadísticas
		const stats = {
			totalMessages: messages.length,
			userMessages: messages.filter((m) => m.role === "user").length,
			assistantMessages: messages.filter((m) => m.role === "assistant").length,
			messagesWithTimestamp: messages.filter((m) => !!m.timestamp).length,
			messagesWithCalibrations: messages.filter(
				(m) => m.role === "assistant" && (m.quipuCalibrations?.length ?? 0) > 0,
			).length,
		};

		// Verificar integridad
		if (data.total_messages !== stats.totalMessages) {
			issues.push(
				`Discrepancia en conteo: DB dice ${data.total_messages}, pero hay ${stats.totalMessages} mensajes`,
			);
		}

		if (stats.userMessages === 0 && stats.totalMessages > 0) {
			issues.push("Sesión tiene mensajes pero ninguno de usuario");
		}

		if (stats.messagesWithTimestamp < stats.totalMessages) {
			issues.push(
				`${stats.totalMessages - stats.messagesWithTimestamp} mensajes sin timestamp`,
			);
		}

		// Verificar alternancia usuario/asistente
		let expectedRole: "user" | "assistant" = "user";
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].role !== expectedRole) {
				issues.push(
					`Mensaje ${i}: esperaba rol '${expectedRole}' pero encontró '${messages[i].role}'`,
				);
				break;
			}
			expectedRole = expectedRole === "user" ? "assistant" : "user";
		}

		console.log(`🧠🪢 [Test] 📊 Estadísticas de sesión:`, stats);
		if (issues.length > 0) {
			console.warn(`🧠🪢 [Test] ⚠️ Issues encontrados:`, issues);
		}

		return {
			isValid: issues.length === 0,
			issues,
			stats,
		};
	} catch (error) {
		console.error(`🧠🪢 [Test] ❌ Error verificando integridad:`, error);
		return {
			isValid: false,
			issues: [`Error técnico: ${String(error)}`],
			stats: {
				totalMessages: 0,
				userMessages: 0,
				assistantMessages: 0,
				messagesWithTimestamp: 0,
				messagesWithCalibrations: 0,
			},
		};
	}
}

/**
 * Listar todas las sesiones de un proyecto para debugging
 */
export async function listChatSessionsForProject(projectId: string): Promise<{
	sessions: Array<{
		id: string;
		artifactId: string;
		totalMessages: number;
		startedAt: string | null;
		lastUpdated: string | null;
	}>;
	totalSessions: number;
}> {
	try {
		console.log(`🧠🪢 [Test] 📋 Listando sesiones del proyecto: ${projectId}`);

		const supabase = await createSupabaseServerClient();

		const { data, error } = await supabase
			.from("cog_chat_sessions")
			.select("id, artifact_id, total_messages, started_at, updated_at")
			.eq("project_id", projectId)
			.order("started_at", { ascending: false });

		if (error) {
			console.error(`🧠🪢 [Test] ❌ Error listando sesiones:`, error);
			return { sessions: [], totalSessions: 0 };
		}

		const sessions = (data || []).map((session) => ({
			id: session.id,
			artifactId: session.artifact_id,
			totalMessages: session.total_messages || 0,
			startedAt: session.started_at,
			lastUpdated: session.updated_at,
		}));

		console.log(`🧠🪢 [Test] 📋 Encontradas ${sessions.length} sesiones`);

		return {
			sessions,
			totalSessions: sessions.length,
		};
	} catch (error) {
		console.error(`🧠🪢 [Test] ❌ Error listando sesiones:`, error);
		return { sessions: [], totalSessions: 0 };
	}
}
