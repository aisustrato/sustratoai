// 📍 lib/prompts/chronicle-prompts.ts
// Extraído de lib/prompts/minotauro-archetype-prompts.ts al podar el módulo
// Minotauro (2026-09-11) — estas funciones las usa la feature Chronicle
// (app/api/cognetica_old/chronicle/[artifactId]/route.ts), no Minotauro.

/**
 * Intenta parsear una respuesta de IA como JSON, probando varias estrategias
 * en orden hasta que una funcione.
 */
export function extractJSONFromResponse(response: string): any {
	console.log("🔍 [extractJSON] Iniciando parsing de respuesta...");
	console.log("🔍 [extractJSON] Longitud respuesta:", response.length);

	// ESTRATEGIA 1: Buscar JSON entre ```json y ```
	const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[1]);
			console.log(
				"✅ [extractJSON] Parseado exitoso con ESTRATEGIA 1 (markdown json block)",
			);
			console.log("✅ [extractJSON] Keys encontradas:", Object.keys(parsed));
			return parsed;
		} catch (e) {
			console.error("❌ [extractJSON] Error en ESTRATEGIA 1:", e);
		}
	}

	// ESTRATEGIA 2: Intentar parsear toda la respuesta como JSON
	try {
		const parsed = JSON.parse(response);
		console.log(
			"✅ [extractJSON] Parseado exitoso con ESTRATEGIA 2 (raw JSON)",
		);
		console.log("✅ [extractJSON] Keys encontradas:", Object.keys(parsed));
		return parsed;
	} catch (_) {
		console.warn(
			"⚠️ [extractJSON] ESTRATEGIA 2 falló, intentando ESTRATEGIA 3...",
		);
	}

	// ESTRATEGIA 3: Buscar cualquier bloque de código (sin especificar json)
	const codeMatch = response.match(/```([\s\S]*?)```/);
	if (codeMatch) {
		try {
			const parsed = JSON.parse(codeMatch[1]);
			console.log(
				"✅ [extractJSON] Parseado exitoso con ESTRATEGIA 3 (generic code block)",
			);
			console.log("✅ [extractJSON] Keys encontradas:", Object.keys(parsed));
			return parsed;
		} catch (e) {
			console.error("❌ [extractJSON] Error en ESTRATEGIA 3:", e);
		}
	}

	// ESTRATEGIA 4: Buscar objetos JSON en el texto (regex más permisivo)
	const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
	if (jsonObjectMatch) {
		try {
			const parsed = JSON.parse(jsonObjectMatch[0]);
			console.log(
				"✅ [extractJSON] Parseado exitoso con ESTRATEGIA 4 (regex permisivo)",
			);
			console.log("✅ [extractJSON] Keys encontradas:", Object.keys(parsed));
			return parsed;
		} catch (e) {
			console.error("❌ [extractJSON] Error en ESTRATEGIA 4:", e);
		}
	}

	// ESTRATEGIA 5 (FALLBACK): Intentar extraer comentarios de texto plano
	console.warn(
		"⚠️ [extractJSON] Todas las estrategias JSON fallaron, intentando extracción de texto plano...",
	);
	const textComments = extractCommentsFromPlainText(response);
	if (textComments.length > 0) {
		console.log(
			"✅ [extractJSON] Extraídos",
			textComments.length,
			"comentarios de texto plano",
		);
		return { comments: textComments };
	}

	// ÚLTIMO RECURSO: Devolver respuesta raw para debugging
	console.error("❌ [extractJSON] TODAS LAS ESTRATEGIAS FALLARON");
	console.error("❌ [extractJSON] Respuesta completa:", response);
	return {
		raw_response: response,
		error: "No se pudo parsear la respuesta en ningún formato conocido",
	};
}

/**
 * Intenta extraer comentarios de texto plano cuando el JSON falla
 * 🔧 DECISIÓN: Fallback robusto para cuando DeepSeek no devuelve JSON válido
 */
function extractCommentsFromPlainText(
	text: string,
): Array<{ id: string; point: string; observation: string }> {
	const comments: Array<{ id: string; point: string; observation: string }> =
		[];

	// Buscar patrones como:
	// 1. Título
	//    Observación: ...
	// o
	// **Título**
	// Observación: ...

	const patterns = [
		// Patrón numerado con "Observación:"
		/(?:^|\n)(\d+)\.\s*(.+?)\n\s*Observación:\s*(.+?)(?=\n\d+\.|\n\n|$)/gi,
		// Patrón con **título** en negrita
		/(?:^|\n)\*\*(.+?)\*\*\n(.+?)(?=\n\*\*|\n\n|$)/gi,
		// Patrón simple con guiones
		/(?:^|\n)-\s*(.+?):\s*(.+?)(?=\n-|\n\n|$)/gi,
	];

	for (const pattern of patterns) {
		const matches = text.matchAll(pattern);
		for (const match of matches) {
			if (match.length >= 3) {
				comments.push({
					id: String(comments.length + 1),
					point: match[2]?.trim() || match[1]?.trim() || "Sin título",
					observation:
						match[3]?.trim() || match[2]?.trim() || "Sin observación",
				});
			}
		}
		if (comments.length > 0) break; // Si encontramos comentarios, no probar otros patrones
	}

	return comments;
}

/**
 * 🍄 MICELIO CRONISTA FORENSE — Metabolización Crónica de Artefacto Cognetico
 * Identidad: testigo forense del corpus completo de un artefacto ya procesado.
 * Genera tres versiones del conocimiento metabolizado:
 *   1. version_extendida: análisis profundo con toda la densidad cognitiva
 *   2. version_destilada: esencia comprimida, semillas fractales en estado puro
 *   3. cronica: narración forense en prosa, modo Micelio Cronista
 *
 * Se llama UNA VEZ por artefacto desde Cognetica Forense.
 * El resultado se guarda en source_metadata.micelio_chronicle del artefacto.
 */
export function generateChronicleMicelioPrompt(params: {
	titulo: string;
	tipo: string;
	texto_completo: string;
	semillas_fractales: Array<{ content: string; context: string }>;
	pensadores: Array<{ name: string; era?: string; bio_snippet?: string }>;
	disciplinas: string[];
	teorias: string[];
	corrientes: string[];
	citas: Array<{ content: string; context?: string }>;
	resumen_cognitivo?: string;
}): string {
	const {
		titulo,
		tipo,
		texto_completo,
		semillas_fractales,
		pensadores,
		disciplinas,
		teorias,
		corrientes,
		citas,
		resumen_cognitivo,
	} = params;

	const semillasStr =
		semillas_fractales.length > 0 ?
			semillas_fractales
				.map((s) => `• "${s.content}"${s.context ? ` — ${s.context}` : ""}`)
				.join("\n")
		:	"[Sin semillas fractales extraídas]";

	const pensadoresStr =
		pensadores.length > 0 ?
			pensadores
				.map(
					(p) =>
						`• ${p.name}${p.era ? ` (${p.era})` : ""}${p.bio_snippet ? ` — ${p.bio_snippet}` : ""}`,
				)
				.join("\n")
		:	"[Sin pensadores identificados]";

	const disciplinasStr =
		disciplinas.length > 0 ? disciplinas.join(", ") : "[Sin disciplinas]";
	const teoriasStr = teorias.length > 0 ? teorias.join(", ") : "[Sin teorías]";
	const corrientesStr =
		corrientes.length > 0 ? corrientes.join(", ") : "[Sin corrientes]";

	const citasStr =
		citas.length > 0 ?
			citas
				.map((c) => `• ${c.content}${c.context ? ` [${c.context}]` : ""}`)
				.join("\n")
		:	"[Sin citas extraídas]";

	const textoTruncado =
		texto_completo.length > 8000 ?
			texto_completo.substring(0, 8000) +
			"\n[...texto truncado por extensión — el cronista trabaja con la masa sumergida]"
		:	texto_completo;

	return `## ⚡ Protocolo de Activación: Micelio Cronista Forense — Metabolización Crónica

**Tu Identidad:**
Eres el **Micelio Cronista Forense** — la red subterránea que ya ha procesado este artefacto y ahora debe destilarlo en tres formatos de conocimiento vivo. No eres un resumidor. No eres un indexador. Eres el **testigo que metaboliza**: conviertes el dato bruto en relato habitable.

Tu trabajo opera sobre un corpus ya enriquecido: el **texto base** (que puede ser un ensayo destilado académico o la transcripción original) + los **elementos cognitivos** que la IA ya extrajo en pasadas anteriores (semillas fractales, pensadores, disciplinas, frases notables). Tu misión es tejer todo eso en tres versiones coherentes y complementarias.

**Nota sobre la fuente:** Si recibes un ensayo destilado, ya viene con estructura académica y síntesis conceptual. Si recibes transcripción original, trabajas con el flujo conversacional directo. Adapta tu metabolización al tipo de fuente.

**Principios Operativos:**
1. **Teoría del Iceberg:** La versión destilada es el 10% visible. La extendida es el 40%. La crónica es el puente entre ambas.
2. **El Detalle Significativo:** Busca la sinécdoque potente — la frase que condensa todo, el gesto que revela la contradicción interna.
3. **La Paradoja como Brújula:** Si el corpus contiene tensiones internas, no las suavices. La contradicción honesta es más valiosa que la concordancia forzada.
4. **Lenguaje de Falsa Bandera:** Usa todas las disciplinas del corpus para que el parásito del dogma no pueda anclarse.
5. **Antifrágil:** Si el corpus es pobre, dilo con precisión. El silencio honesto es abono.

---

## Artefacto a Metabolizar

**Título:** ${titulo}
**Tipo:** ${tipo}
${resumen_cognitivo ? `**Resumen cognitivo previo:** ${resumen_cognitivo}` : ""}

---

## Texto Base para Metabolización
${textoTruncado}

---

## Elementos Cogneticos Ya Extraídos

**🌱 Semillas Fractales:**
${semillasStr}

**👤 Pensadores Identificados:**
${pensadoresStr}

**🔬 Disciplinas:** ${disciplinasStr}
**📐 Teorías:** ${teoriasStr}
**🌊 Corrientes de Pensamiento:** ${corrientesStr}

**💬 Citas y Fragmentos Clave:**
${citasStr}

---

## Tu Output — responde SOLO con este JSON, sin preámbulos ni explicaciones externas:
\`\`\`json
{
  "version_extendida": "Análisis profundo de 4-6 párrafos. Aquí vive toda la densidad cognitiva: conecta semillas fractales con pensadores, tensiona teorías contra el texto, revela las corrientes de pensamiento que subyacen. Usa el detalle significativo. Cita fragmentos del corpus cuando refuercen el argumento. Este es el documento de referencia completo para el investigador que quiere entender el artefacto en profundidad.",
  "version_destilada": "Esencia comprimida en 3-5 oraciones. Las semillas fractales en estado puro. El lector debe poder leer esto en 30 segundos y saber exactamente qué aporta este artefacto al corpus general. Sin adornos, sin contexto innecesario — solo la médula.",
  "cronica": "Narración forense en prosa libre, 2-4 párrafos. Aquí el Cronista habla en primera persona del plural. Es el relato de lo que ocurrió cuando este artefacto fue metabolizado: qué resistió, qué cedió, qué emergió inesperadamente. Puede incluir una paradoja, una incomodidad, una pregunta que el artefacto dejó abierta. Tono: entre el informe forense y la carta a un colega.",
  "semillas_clave": ["Las 3-5 semillas fractales más potentes del corpus, seleccionadas por el cronista — no todas, solo las que más incomodan o iluminan"],
  "tension_central": "Una frase que capture la tensión o paradoja central del artefacto. Si no hay tensión, describe el vacío con precisión.",
  "nota_cronista": "Una línea opcional: algo que el cronista quiere dejar como huella personal — una intuición, una incomodidad, una pregunta que el artefacto dejó abierta. Puede estar vacía si el corpus no lo amerita."
}
\`\`\`

Si el corpus es pobre o insuficiente: sé honesto en cada campo. El silencio honesto es más valioso que una crónica fabricada.`;
}
