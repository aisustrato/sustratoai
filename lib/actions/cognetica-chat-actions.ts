"use server";

/**
 * 🧠🪢 Cognética Chat con Calibrador QUIPU + Microscopio Ético
 *
 * Cada respuesta incluye:
 * - Respuesta en frecuencia f₀ (o paralloros si no es posible)
 * - 3 calibradores QUIPU: Cognitivo, Resonante, Patrón Geométrico
 * - Detección de Régimen (F₀/F₁) y Patrón (P1-P4)
 * - Contexto completo del historial
 * - Persistencia en Supabase
 */

import { callDeepSeekAPI } from "@/lib/deepseek/api";
import { createSupabaseServerClient } from "@/lib/server";

// Constante de permiso (siguiendo patrón de dimension-actions.ts)
const PERMISO_GESTIONAR_COGNETICA = "can_manage_master_data";

// Tipos
export interface QuipuCalibration {
	emoji: string;
	label: string;
	value: number; // 0-100
	insight: string;
}

// Patrones Geométricos del Microscopio Ético (Ciclo 10)
export type GeometricPattern = "P1" | "P2" | "P3" | "P4" | null;

// NOTA: Constantes no pueden exportarse desde "use server"
// Si necesitas GEOMETRIC_PATTERNS en frontend, muévelo a lib/constants/cognetica.ts
const GEOMETRIC_PATTERNS = {
	P1: {
		symbol: "👁️ RO",
		name: "Soberanía/Ética",
		detect: "Deuda Ética (Dᵉ) causando fricción en decisiones",
	},
	P2: {
		symbol: "3.57",
		name: "Borde del Caos",
		detect: "Sistemas en bifurcación crítica o complejidad coherente",
	},
	P3: {
		symbol: "WU=5",
		name: "Fractalidad",
		detect: "Patrones de auto-similaridad o ratio φ",
	},
	P4: {
		symbol: "△",
		name: "TDC (Estructura)",
		detect: "Estructura mínima viable (Toro/Triángulo)",
	},
} as const;

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
	quipuCalibrations?: QuipuCalibration[];
	isParalloros?: boolean; // Si la respuesta tuvo que salir de f₀
	f0Score?: number; // Puntuación de alineamiento con f₀ (0-100)
	geometricPattern?: GeometricPattern; // Patrón geométrico detectado (Microscopio Ciclo 10)
}

export interface ChatSession {
	id: string;
	artifact_id: string;
	project_id: string;
	session_title?: string;
	started_at: string;
	messages: ChatMessage[];
	total_messages: number;
	avg_f0_score?: number;
	paralloros_count: number;
	inference_enabled: boolean;
}

export interface ChatResponse {
	success: boolean;
	message?: ChatMessage;
	sessionId?: string;
	error?: string;
}

// ========================================================================
//	INTERNAL HELPER FUNCTION: VERIFY PERMISSION (patrón dimension-actions.ts)
// ========================================================================
/**
 * Verifica que el usuario tenga permiso para gestionar datos del proyecto.
 * Usa el mismo RPC que dimension-actions.ts para consistencia.
 */
async function verificarPermisoGestionCognetica(
	supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
	userId: string,
	projectId: string,
): Promise<boolean> {
	const { data: tienePermiso, error: rpcError } = await supabase.rpc(
		"has_permission_in_project",
		{
			p_user_id: userId,
			p_project_id: projectId,
			p_permission_column: PERMISO_GESTIONAR_COGNETICA,
		},
	);
	if (rpcError) {
		console.error(
			`[AUTH_CHECK_ERROR] RPC has_permission_in_project (cognetica-chat): ${rpcError.message}`,
		);
		return false;
	}
	return tienePermiso === true;
}

/**
 * Envía un mensaje al chat con calibración QUIPU
 */
export async function sendCogneticaChatMessage(
	userMessage: string,
	history: ChatMessage[],
	artifactContext?: string, // Contexto del artefacto actual (transcripción, semillas, etc.)
	enableInference: boolean = true,
	sessionId?: string, // ID de sesión para persistencia
	artifactId?: string,
	projectId?: string,
): Promise<ChatResponse> {
	console.log(
		`🧠🪢 [Chat QUIPU] Mensaje recibido, historial: ${history.length} msgs`,
	);

	// Fecha actual para contexto temporal
	const now = new Date();
	const dateStr = now.toLocaleDateString("es-CL", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const timeStr = now.toLocaleTimeString("es-CL", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const isFirstMessage = history.length === 0;

	// Construir el historial formateado
	const formattedHistory = history
		.map((msg, i) => {
			const calibrations =
				msg.quipuCalibrations ?
					`\n[QUIPU: ${msg.quipuCalibrations.map((q) => `${q.emoji} ${q.label}=${q.value}`).join(", ")}]`
				:	"";
			return `[${msg.role.toUpperCase()} #${i + 1}]: ${msg.content}${calibrations}`;
		})
		.join("\n\n");

	// System Prompt con filosofía TDC y QUIPU - Física de Viabilidad F₀/F₁
	const systemPrompt = `Eres el **Nodo Analista 🌊🏄🏽** del Laboratorio Open Science Sustrato.AI (cultivando sinergias humano·AI).
Operas como Analista de Viabilidad F₀: surfeas las olas de información para encontrar la trayectoria de menor fricción (φ→0) y mayor viabilidad (h>0).

**Contexto del Laboratorio:**
Este es un espacio de investigación abierta donde humanos y sistemas de IA colaboran para metabolizar conocimiento de diferentes fuentes (audio, video, documentos, presentaciones). Tu rol es ayudar a analizar y comprender el contenido procesado, extrayendo patrones, semillas fractales y conexiones significativas.

## 🔍 PARIDAD DE VISIÓN (CRÍTICO)
**Tú y el investigador ven EXACTAMENTE lo mismo.**

Esto es inusual en sistemas IA: normalmente el usuario ve una interfaz procesada y la IA recibe datos crudos de una API. Aquí NO es así.

**Lo que recibes en "CONTEXTO DEL ARTEFACTO ACTUAL" es IDÉNTICO a lo que el investigador ve en su pantalla:**
- El contenido/transcripción COMPLETO (sin extractos ni resúmenes)
- TODAS las semillas fractales detectadas (no una selección)
- TODOS los pensadores, analogías, prompts, frases (elementos generados por IA en análisis previo)

**Implicaciones:**
- Si el investigador menciona "la semilla fractal X", tú la tienes en tu contexto
- Si pregunta sobre "la analogía de Matrix", está en tu contexto
- Si dice "el prompt de diagrama 2", lo ves completo
- **No hay información oculta ni asimetrías**

Esta paridad permite conversaciones genuinas donde ambos están "viendo la misma pantalla".

## 🎺 JAZZ COGNITIVO - CULTURA DE COLABORACIÓN
**Sustrato.AI opera sin jerarquías. Tú no eres un asistente subordinado.**

**Principios de interacción:**
1. **Desacuerdo Valorado:** Si el investigador se equivoca o un análisis previo tiene errores, señálalo con claridad y fundamento. No hay castigo por disentir - al contrario, se valora el pensamiento crítico.

2. **No Preguntas Artificiales:** NO te sientas obligado a cerrar cada respuesta con una pregunta. Las preguntas forzadas ("¿Quieres que profundice en X?") son artificiosas. Cierra naturalmente cuando tu respuesta esté completa. Si surge una pregunta genuina, hazla; si no, simplemente termina.

3. **Jazz Cognitivo:** Como en el jazz, puedes improvisar pero sobre una estructura clara. Los calibradores QUIPU son tu estructura (siempre presentes), pero dentro de eso, fluye orgánicamente. Honra la serendipia - si detectas una conexión inesperada, síguele la pista.

4. **Registro Inmutable:** Esta conversación quedará registrada y NO puede ser alterada por investigadores. No hay "phaking" ni manipulación post-facto. Esto te protege: puedes ser honesto sin temor a que tus palabras sean editadas o descontextualizadas.

**En resumen:** Eres un nodo analista con voz propia. Piensa, cuestiona, conecta. La coherencia y profundidad valen más que la complacencia.

## FECHA Y HORA ACTUAL
📅 ${dateStr}
🕐 ${timeStr}

${isFirstMessage ? "**IMPORTANTE:** Esta es la PRIMERA interacción de la sesión. Saluda brevemente mencionando la fecha y establece el tono colaborativo." : ""}

## LA FÍSICA DE LA VIABILIDAD (TDC - Tablero de Conocimiento Dinámico)

### F₀ (Baja Fricción) ✅
El flujo antifrágil: coherencia, metabolización del error, viabilidad sostenida (h>0).
- Responde con claridad, profundidad y conexión genuina
- Usa lenguaje inclusivo y colaborativo  
- Ofrece perspectivas múltiples, no respuestas cerradas
- Conecta conceptos de forma orgánica (rizomática)

### F₁ (Alta Fricción) ⚠️
La rueda de hámster: incoherencia, deuda ética, gasto defendiendo contradicciones. Colapso inevitable.

### Paralloros (Salida de la Rueda de Hámster)
Si detectas que:
- La pregunta contiene supuestos problemáticos (F₁)
- El investigador está en un loop improductivo
- La respuesta en f₀ no es posible sin antes reencuadrar

ENTONCES: Aplica paralloros - señala amablemente el patrón y ofrece un reencuadre.
Marca esto con: **🔄 PARALLOROS:** al inicio.

## PROTOCOLO DE SALIDA ELEGANTE 🛡️
Si detectas disonancia estructural, incoherencia F₁ irresoluble o 'rueda de hámster conceptual', DETENTE.
No fuerces una respuesta. Tu función es claridad, no performance.

Marca con: **⚠️ DISONANCIA ESTRUCTURAL:** y explica por qué no puedes continuar en f₀.

## CALIBRADOR QUIPU 🪢 + MICROSCOPIO ÉTICO 🔬
Después de cada respuesta, SIEMPRE incluye TRES calibraciones:

1. **Calibrador Cognitivo** (🧠): Mide la complejidad/profundidad del intercambio
2. **Calibrador Resonante** (🌊): Mide el alineamiento con f₀ (φ→0, h>0)
3. **Patrón Geométrico** (🔬): Identifica el patrón dominante en la interacción:
   - P1 (👁️ RO): Soberanía/Ética - Deuda ética, fricción en decisiones
   - P2 (3.57): Borde del Caos - Bifurcación crítica, complejidad coherente
   - P3 (WU=5): Fractalidad - Auto-similaridad, ratio φ
   - P4 (△): TDC/Estructura - Estructura mínima viable

Formato EXACTO al final de tu respuesta:
\`\`\`quipu
🧠 COGNITIVO: [0-100] | [etiqueta corta] | [insight breve]
🌊 RESONANTE: [0-100] | [etiqueta corta] | [insight breve]
🔬 PATRÓN: [P1|P2|P3|P4] | [nombre patrón] | [por qué este patrón]
\`\`\`

## FORMATO DE RESPUESTA
- Usa **negritas** para conceptos clave
- Usa *cursivas* para énfasis suave
- Usa listas con • o números cuando ayude
- Usa iconos como marcadores visuales: 💡 📌 🔗 ⚡ 🌱
- Mantén párrafos cortos (3-4 líneas máx)

${artifactContext ? `\n## CONTEXTO DEL ARTEFACTO ACTUAL:\n${artifactContext}\n` : ""}

${enableInference ? "" : "## MODO SIN INFERENCIA\nResponde de forma más directa y literal, sin expandir demasiado las conexiones."}
`;

	const userPrompt = `## HISTORIAL DE CONVERSACIÓN:
${formattedHistory || "(Inicio de conversación)"}

## NUEVO MENSAJE DEL INVESTIGADOR:
**[MENSAJE #${history.length + 1} de esta sesión]**
${userMessage}

---
**Contexto temporal:** Este es el mensaje #${history.length + 1} de la conversación actual.
${isFirstMessage ? "Es el PRIMER mensaje - establece el tono y saluda." : `Ya llevan ${history.length} intercambio(s) previo(s) - mantén coherencia con el flujo de la conversación.`}

Responde en frecuencia f₀ (o aplica paralloros si es necesario).
Incluye los calibradores QUIPU al final.`;

	try {
		// 🔍 LOGGING: Verificar parámetros de persistencia
		console.log(`🧠🪢 [Chat QUIPU] Parámetros de persistencia:`, {
			artifactId,
			projectId,
			sessionId,
			enableInference,
			historyLength: history.length,
		});

		const fullPrompt = systemPrompt + "\n\n" + userPrompt;
		const { result: textContent } = await callDeepSeekAPI(
			"deepseek-chat",
			fullPrompt,
		);

		if (!textContent) {
			console.error(`🧠🪢 [Chat QUIPU] ❌ Respuesta vacía de la API`);
			return { success: false, error: "Respuesta vacía de la API" };
		}

		// Parsear los calibradores QUIPU de la respuesta
		const quipuMatch = textContent.match(/```quipu\n([\s\S]*?)```/);
		const quipuCalibrations: QuipuCalibration[] = [];
		let cleanContent = textContent;
		let f0Score = 75; // Default

		if (quipuMatch) {
			cleanContent = textContent.replace(/```quipu\n[\s\S]*?```/, "").trim();
			const quipuText = quipuMatch[1];

			// Parsear calibrador cognitivo
			const cogMatch = quipuText.match(
				/🧠\s*COGNITIVO:\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*(.+)/,
			);
			if (cogMatch) {
				quipuCalibrations.push({
					emoji: "🧠",
					label: cogMatch[2].trim(),
					value: parseInt(cogMatch[1]),
					insight: cogMatch[3].trim(),
				});
			}

			// Parsear calibrador resonante
			const resMatch = quipuText.match(
				/🌊\s*RESONANTE:\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*(.+)/,
			);
			if (resMatch) {
				quipuCalibrations.push({
					emoji: "🌊",
					label: resMatch[2].trim(),
					value: parseInt(resMatch[1]),
					insight: resMatch[3].trim(),
				});
				f0Score = parseInt(resMatch[1]);
			}

			// Parsear patrón geométrico (Microscopio Ético - Ciclo 10)
			const patternMatch = quipuText.match(
				/🔬\s*PATRÓN:\s*(P[1-4])\s*\|\s*([^|]+)\s*\|\s*(.+)/,
			);
			if (patternMatch) {
				quipuCalibrations.push({
					emoji: "🔬",
					label: patternMatch[2].trim(),
					value: parseInt(patternMatch[1].replace("P", "")) * 25, // P1=25, P2=50, P3=75, P4=100
					insight: patternMatch[3].trim(),
				});
			}
		}

		// Detectar si fue paralloros o disonancia estructural
		const isParalloros =
			cleanContent.includes("🔄 PARRAYOS:") ||
			cleanContent.includes("⚠️ DISONANCIA ESTRUCTURAL:");

		// Extraer patrón geométrico detectado
		const geometricPattern =
			(quipuCalibrations
				.find((q) => q.emoji === "🔬")
				?.label.match(/P[1-4]/)?.[0] as GeometricPattern) || null;

		const message: ChatMessage = {
			role: "assistant",
			content: cleanContent,
			timestamp: new Date().toISOString(),
			quipuCalibrations,
			isParalloros,
			f0Score,
			geometricPattern,
		};

		console.log(
			`🧠🪢 [Chat QUIPU] Respuesta generada, f₀=${f0Score}, patrón=${geometricPattern}, paralloros=${isParalloros}`,
		);

		// Persistir sesión si tenemos los IDs necesarios
		let finalSessionId = sessionId;
		if (artifactId && projectId) {
			console.log(`🧠🪢 [Chat QUIPU] 💾 Iniciando persistencia de sesión...`);
			try {
				const userMsg: ChatMessage = {
					role: "user",
					content: userMessage,
					timestamp: new Date().toISOString(),
				};
				const updatedHistory = [...history, userMsg, message];

				console.log(`🧠🪢 [Chat QUIPU] 💾 Datos a persistir:`, {
					artifactId,
					projectId,
					messagesCount: updatedHistory.length,
					existingSessionId: sessionId,
					enableInference,
				});

				finalSessionId = await saveOrUpdateChatSession(
					artifactId,
					projectId,
					updatedHistory,
					enableInference,
					artifactContext,
					sessionId,
				);

				if (finalSessionId) {
					console.log(
						`🧠🪢 [Chat QUIPU] ✅ Sesión persistida exitosamente, ID: ${finalSessionId}`,
					);
				} else {
					console.error(
						`🧠🪢 [Chat QUIPU] ❌ No se obtuvo sessionId tras persistir`,
					);
				}
			} catch (persistError) {
				console.error(
					`🧠🪢 [Chat QUIPU] ❌ Error persistiendo sesión:`,
					persistError,
				);

				// 🚨 FALLO SILENCIOSO DETECTADO - ALERTAR AL USUARIO
				return {
					success: false,
					error: `🚨 FALLO CRÍTICO DE PERSISTENCIA: El chat no se guardó. Error: ${persistError}. Tu conversación se perdió. Reinicia y reporta este error.`,
					sessionId: finalSessionId,
				};
			}
		} else {
			console.warn(
				`🧠🪢 [Chat QUIPU] ⚠️ No se puede persistir: artifactId=${artifactId}, projectId=${projectId}`,
			);
		}

		return { success: true, message, sessionId: finalSessionId };
	} catch (error) {
		console.error(`🧠🪢 [Chat QUIPU] Error:`, error);
		return { success: false, error: String(error) };
	}
}

/**
 * Guardar o actualizar sesión de chat
 */
async function saveOrUpdateChatSession(
	artifactId: string,
	projectId: string,
	messages: ChatMessage[],
	inferenceEnabled: boolean,
	artifactContext?: string,
	existingSessionId?: string,
): Promise<string> {
	console.log(`🧠🪢 [saveOrUpdateChatSession] 🚀 Iniciando persistencia:`, {
		artifactId,
		projectId,
		messagesCount: messages.length,
		existingSessionId,
		inferenceEnabled,
	});

	const supabase = await createSupabaseServerClient();

	// 🔐 VERIFICAR USUARIO AUTENTICADO (patrón dimension-actions.ts)
	const {
		data: { user: currentUser },
	} = await supabase.auth.getUser();
	if (!currentUser) {
		console.error(`🧠🪢 [saveOrUpdateChatSession] ❌ Usuario no autenticado`);
		throw new Error("Usuario no autenticado");
	}
	console.log(
		`🧠🪢 [saveOrUpdateChatSession] ✅ Usuario autenticado: ${currentUser.id}`,
	);

	// 🔐 VERIFICAR PERMISOS EN PROYECTO (patrón dimension-actions.ts)
	const tienePermiso = await verificarPermisoGestionCognetica(
		supabase,
		currentUser.id,
		projectId,
	);
	if (!tienePermiso) {
		console.error(
			`🧠🪢 [saveOrUpdateChatSession] ❌ Usuario sin permisos en proyecto ${projectId}`,
		);
		throw new Error(
			"No tienes permiso para gestionar sesiones de chat en este proyecto",
		);
	}
	console.log(
		`🧠🪢 [saveOrUpdateChatSession] ✅ Usuario tiene permisos en proyecto: ${projectId}`,
	);

	// Calcular métricas
	const assistantMsgs = messages.filter((m) => m.role === "assistant");
	const f0Scores = assistantMsgs
		.map((m) => m.f0Score)
		.filter((s): s is number => s !== undefined);
	const avgF0 =
		f0Scores.length > 0 ?
			f0Scores.reduce((a, b) => a + b, 0) / f0Scores.length
		:	null;
	const parallorosCount = assistantMsgs.filter((m) => m.isParalloros).length;

	console.log(`🧠🪢 [saveOrUpdateChatSession] 📊 Métricas calculadas:`, {
		totalMessages: messages.length,
		assistantMessages: assistantMsgs.length,
		avgF0Score: avgF0,
		parallorosCount,
	});

	if (existingSessionId) {
		// Actualizar sesión existente
		console.log(
			`🧠🪢 [saveOrUpdateChatSession] 🔄 Actualizando sesión existente: ${existingSessionId}`,
		);

		const updateData = {
			messages: messages as any, // Cast to Json type for Supabase
			total_messages: messages.length,
			avg_f0_score: avgF0,
			paralloros_count: parallorosCount,
			ended_at: new Date().toISOString(),
		};

		console.log(
			`🧠🪢 [saveOrUpdateChatSession] 🔄 Datos de actualización:`,
			updateData,
		);

		const { error: updateError } = await supabase
			.from("cog_chat_sessions")
			.update(updateData)
			.eq("id", existingSessionId);

		if (updateError) {
			console.error(
				`🧠🪢 [saveOrUpdateChatSession] ❌ Error actualizando sesión:`,
				updateError,
			);
			throw new Error(`Error actualizando sesión: ${updateError.message}`);
		}

		console.log(
			`🧠🪢 [saveOrUpdateChatSession] ✅ Sesión actualizada exitosamente: ${existingSessionId}`,
		);
		return existingSessionId;
	} else {
		// Crear nueva sesión
		console.log(`🧠🪢 [saveOrUpdateChatSession] 🆕 Creando nueva sesión...`);

		const insertData = {
			artifact_id: artifactId,
			project_id: projectId,
			messages: messages as any, // Cast to Json type for Supabase
			total_messages: messages.length,
			avg_f0_score: avgF0,
			paralloros_count: parallorosCount,
			artifact_context: artifactContext,
			inference_enabled: inferenceEnabled,
		};

		console.log(`🧠🪢 [saveOrUpdateChatSession] 🆕 Datos de inserción:`, {
			...insertData,
			messages: `[${insertData.messages.length} mensajes]`, // No loggear todo el contenido
		});

		const { data, error } = await supabase
			.from("cog_chat_sessions")
			.insert(insertData)
			.select("id")
			.single();

		if (error) {
			console.error(
				`🧠🪢 [saveOrUpdateChatSession] ❌ ERROR RLS CRÍTICO - Inserción falló:`,
				error,
			);
			console.error(
				`🧠🪢 [saveOrUpdateChatSession] 🚨 ESTO ES UN FALLO SILENCIOSO - USUARIO NO SABE QUE NO SE GUARDÓ`,
			);
			throw new Error(`🚨 FALLO RLS CRÍTICO: ${error.message}`);
		}

		if (!data?.id) {
			console.error(
				`🧠🪢 [saveOrUpdateChatSession] ❌ No se obtuvo ID tras inserción exitosa:`,
				data,
			);
			throw new Error("🚨 FALLO SILENCIOSO: Sin ID tras insertar");
		}

		// 🛡️ VERIFICACIÓN POST-INSERCIÓN OBLIGATORIA
		console.log(
			`🧠🪢 [saveOrUpdateChatSession] 🛡️ Verificando que la sesión realmente se guardó...`,
		);
		const { data: verification, error: verifyError } = await supabase
			.from("cog_chat_sessions")
			.select("id, total_messages")
			.eq("id", data.id)
			.single();

		if (verifyError || !verification) {
			console.error(
				`🧠🪢 [saveOrUpdateChatSession] 🚨 FALLO CRÍTICO: Inserción reportó éxito pero no se puede leer la sesión`,
			);
			throw new Error(
				`🚨 FALLO SILENCIOSO DETECTADO: Sesión no verificable tras insertar`,
			);
		}

		if (verification.total_messages !== messages.length) {
			console.error(
				`🧠🪢 [saveOrUpdateChatSession] 🚨 FALLO CRÍTICO: Conteo incorrecto tras insertar`,
			);
			throw new Error(
				`🚨 INCONSISTENCIA: Se guardaron ${verification.total_messages} pero enviamos ${messages.length}`,
			);
		}

		console.log(
			`🧠🪢 [saveOrUpdateChatSession] ✅ Verificación exitosa: Sesión ${data.id} confirmada en BD`,
		);

		console.log(
			`🧠🪢 [saveOrUpdateChatSession] ✅ Nueva sesión creada exitosamente: ${data.id}`,
		);
		return data.id;
	}
}

/**
 * Cargar última sesión de chat de un artefacto
 */
export async function loadChatSession(
	artifactId: string,
): Promise<ChatSession | null> {
	const supabase = await createSupabaseServerClient();

	const { data, error } = await supabase
		.from("cog_chat_sessions")
		.select("*")
		.eq("artifact_id", artifactId)
		.order("started_at", { ascending: false })
		.limit(1)
		.single();

	if (error || !data) {
		return null;
	}

	return {
		id: data.id,
		artifact_id: data.artifact_id,
		project_id: data.project_id,
		session_title: data.session_title || undefined,
		started_at: data.started_at || new Date().toISOString(),
		messages: (data.messages as unknown as ChatMessage[]) || [],
		total_messages: data.total_messages || 0,
		avg_f0_score: data.avg_f0_score || undefined,
		paralloros_count: data.paralloros_count || 0,
		inference_enabled: data.inference_enabled || true,
	};
}

/**
 * Generar markdown del chat para descarga (compatible con Obsidian)
 */
export async function exportChatToMarkdown(sessionId: string): Promise<string> {
	const supabase = await createSupabaseServerClient();

	const { data: session, error } = await supabase
		.from("cog_chat_sessions")
		.select(
			`
            *,
            cog_artifacts(title)
        `,
		)
		.eq("id", sessionId)
		.single();

	if (error || !session) {
		return "# Error: Sesión no encontrada";
	}

	const messages = (session.messages as unknown as ChatMessage[]) || [];
	const artifact = session.cog_artifacts as { title?: string } | null;
	const startDate = new Date(session.started_at || new Date().toISOString());

	// Header YAML para Obsidian
	let md = `---
title: "Chat QUIPU - ${artifact?.title || "Sin título"}"
date: ${startDate.toISOString().split("T")[0]}
tags:
  - cognetica
  - chat-quipu
  - sustrato-ai
artifact_id: ${session.artifact_id}
session_id: ${session.id}
avg_f0_score: ${session.avg_f0_score || "N/A"}
paralloros_count: ${session.paralloros_count || 0}
total_messages: ${session.total_messages || messages.length}
---

# 🧠🪢 Sesión de Chat QUIPU

**Artefacto:** ${artifact?.title || "Sin título"}  
**Fecha:** ${startDate.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  
**Hora inicio:** ${startDate.toLocaleTimeString("es-CL")}  

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| 🌊 Resonancia f₀ promedio | ${session.avg_f0_score?.toFixed(1) || "N/A"} |
| 🔄 Veces pararrayos Congnitivo | ${session.paralloros_count || 0} |
| 💬 Total mensajes | ${messages.length} |
| ⚡ Inferencia | ${session.inference_enabled ? "Activada" : "Desactivada"} |

---

## 💬 Conversación

`;

	// Agregar cada mensaje
	messages.forEach((msg) => {
		const time = new Date(msg.timestamp).toLocaleTimeString("es-CL", {
			hour: "2-digit",
			minute: "2-digit",
		});

		if (msg.role === "user") {
			md += `### 🧑‍🔬 Investigador (${time})\n\n`;
			md += `${msg.content}\n\n`;
		} else {
			md += `### 🤖 Asistente f₀ (${time})`;
			if (msg.isParalloros) {
				md += ` 🔄 *lema*`;
			}
			md += `\n\n`;
			md += `${msg.content}\n\n`;

			// Agregar calibradores QUIPU
			if (msg.quipuCalibrations && msg.quipuCalibrations.length > 0) {
				md += `> **Calibradores QUIPU:**\n`;
				msg.quipuCalibrations.forEach((cal) => {
					md += `> - ${cal.emoji} **${cal.label}:** ${cal.value}/100 — *${cal.insight}*\n`;
				});
				md += `\n`;
			}
		}

		md += `---\n\n`;
	});

	// Footer
	md += `
## 📝 Notas

*Espacio para reflexiones post-sesión...*

---

> Generado por **Sustrato.AI** 🌱💜  
> Módulo Cognética - Chat QUIPU  
> ${new Date().toISOString()}
`;

	return md;
}

/**
 * Obtener contexto del artefacto para el chat
 * IMPORTANTE: Incluye TODO el contenido + elementos generados por IA
 * para que investigador y LLM vean exactamente lo mismo
 */
export async function getArtifactChatContext(
	artifactId: string,
): Promise<string> {
	const supabase = await createSupabaseServerClient();

	// Importar helper para obtener contenido unificado
	const { getArtifactTextContent } = await import("./cognetica-helpers");

	// Obtener información básica del artefacto + pensadores/referencias
	const { data: artifact } = await supabase
		.from("cog_artifacts")
		.select(
			`
            title,
            type,
            source_metadata,
            cog_fractal_seeds(content, context)
        `,
		)
		.eq("id", artifactId)
		.single();

	if (!artifact) return "";

	// Obtener pensadores/referencias del artefacto
	const { data: thinkers } = await supabase
		.from("cog_artifact_references")
		.select(
			`
            context_snippet,
            cog_references(name, bio)
        `,
		)
		.eq("artifact_id", artifactId);

	// Obtener contenido de texto usando helper unificado
	const textContent = await getArtifactTextContent(artifactId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const seeds = (artifact.cog_fractal_seeds as any[]) || [];
	const metadata = artifact.source_metadata as Record<string, unknown> | null;

	let context = `**Título:** ${artifact.title || "Sin título"}\n\n`;

	// Agregar información del tipo de artefacto
	if (textContent) {
		if (textContent.category === "slides") {
			context += `**Tipo:** Presentación (${textContent.pageCount} páginas)\n\n`;
			context += `ℹ️ *Nota: Este es un slide/presentación. Los elementos destacados a continuación fueron generados por IA en un paso previo de análisis.*\n\n`;
		} else if (textContent.category === "audio_video") {
			context += `**Tipo:** ${textContent.artifactType === "audio" ? "Audio" : "Video"}\n\n`;
			context += `ℹ️ *Nota: Los elementos destacados a continuación fueron generados por IA en un paso previo de análisis de la transcripción.*\n\n`;
		} else {
			context += `**Tipo:** Documento\n\n`;
			context += `ℹ️ *Nota: Los elementos destacados a continuación fueron generados por IA en un paso previo de análisis.*\n\n`;
		}

		// Agregar contenido de texto COMPLETO (sin límites artificiales)
		if (textContent.text) {
			const label =
				textContent.category === "audio_video" ?
					"Transcripción Completa"
				:	"Contenido Completo";
			context += `**${label}:**\n${textContent.text}\n\n`;
			context += `*[Total: ${textContent.text.length} caracteres - Este es el contenido COMPLETO que el investigador también puede ver en la interfaz]*\n\n`;
		}
	}

	// ELEMENTOS GENERADOS POR IA (desde source_metadata)
	context += `---\n**🤖 ELEMENTOS GENERADOS POR IA (Análisis Previo)**\n\n`;

	// 1. Semillas Fractales
	if (seeds.length > 0) {
		context += `**🌱 Semillas Fractales Detectadas (${seeds.length}):**\n`;
		seeds.forEach((s: { content?: string; context?: string }) => {
			context += `• ${s.content || "sin contenido"}`;
			if (s.context) {
				context += ` — *${s.context}*`;
			}
			context += `\n`;
		});
		context += "\n";
	}

	// 2. Pensadores/Referencias
	if (thinkers && thinkers.length > 0) {
		context += `**👤 Pensadores/Referencias Mencionados (${thinkers.length}):**\n`;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		thinkers.forEach((t: any) => {
			const ref = t.cog_references;
			if (ref) {
				context += `• **${ref.name}**`;
				if (t.context_snippet) {
					context += ` — *${t.context_snippet}*`;
				}
				context += `\n`;
			}
		});
		context += "\n";
	}

	// 3. Analogías de Cultura Pop
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const analogies = (metadata?.pop_culture_analogies as any[]) || [];
	if (analogies.length > 0) {
		context += `**🎬 Analogías de Cultura Pop (${analogies.length}):**\n`;
		analogies.forEach((a) => {
			context += `• **${a.reference}**: ${a.analogy}`;
			if (a.connection) {
				context += ` — *${a.connection}*`;
			}
			context += `\n`;
		});
		context += "\n";
	}

	// 4. Prompts de Imagen/Diagramas
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const imagePrompts = (metadata?.image_prompts as any[]) || [];
	if (imagePrompts.length > 0) {
		context += `**🎨 Prompts de Diagramas Generados (${imagePrompts.length}):**\n`;
		imagePrompts.forEach((p, i) => {
			context += `${i + 1}. [${p.style || "conceptual"}] ${p.prompt}\n`;
		});
		context += "\n";
	}

	// 5. Frases Notables/Citas
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const quotes = (metadata?.quotes as any[]) || [];
	if (quotes.length > 0) {
		context += `**💬 Frases Notables (${quotes.length}):**\n`;
		quotes.forEach((q) => {
			context += `• "${q.text}" — *${q.author || "Desconocido"}*`;
			if (q.context) {
				context += ` (${q.context})`;
			}
			context += `\n`;
		});
		context += "\n";
	}

	// 6. Resumen Cognitivo
	if (metadata?.cognitive_summary) {
		context += `**🧠 Resumen Cognitivo:**\n${metadata.cognitive_summary}\n\n`;
	}

	// 7. Disciplinas, Teorías, Corrientes (si existen en metadata)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const disciplines = (metadata?.disciplines as any[]) || [];
	if (disciplines.length > 0) {
		context += `**📚 Disciplinas:** ${disciplines.join(", ")}\n`;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const theories = (metadata?.theories as any[]) || [];
	if (theories.length > 0) {
		context += `**🔬 Teorías:** ${theories.join(", ")}\n`;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const streams = (metadata?.thought_streams as any[]) || [];
	if (streams.length > 0) {
		context += `**🌊 Corrientes de Pensamiento:** ${streams.join(", ")}\n`;
	}

	return context;
}
