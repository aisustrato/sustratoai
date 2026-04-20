// 📍 lib/actions/cognetica-old-gardens-minotauro.ts
// 🎯 PROPÓSITO: Generar payloads de Jardines de Resonancia para Minotauro
// 🔧 VERSIONES: Ligera, Estándar, Completa con control de tokens

import { createSupabaseServerClient } from "@/lib/server";
import { getArtifactsForGarden } from "./cognetica-old-gardens-actions";
import { estimateTokens } from "@/lib/utils/token-estimator";

/** Tipo para elementos de jardín retornados por la query de Supabase */
interface GardenElement {
	id: string;
	element_type: string;
	element_id: string;
	element_content: string | null;
	element_label: string;
}

/** Tipo para artefactos retornados por getArtifactsForGarden */
interface GardenArtifact {
	id: string;
	title: string;
	type: string;
	matched_elements: string[];
	relevance_score: number;
	[key: string]: unknown;
}

export type GardenPayloadVersion = "ligera" | "estandar" | "completa";

export interface GardenPayload {
	garden_id: string;
	garden_name: string;
	referencia_formal: string;
	fragmento: string;
	version: GardenPayloadVersion;
	token_count: number;
	metadata: {
		elementos_count: {
			seeds: number;
			disciplines: number;
			theories: number;
			thinkers: number;
		};
		artifacts_count: number;
	};
	artifacts: Array<{
		id: string;
		title: string;
		type: string;
		has_chronicle: boolean;
		micelio_destilada: string;
		micelio_cronica: string;
		micelio_extendida: string;
		matched_elements: string[];
		relevance_score: number;
	}>;
}

export interface GardenPayloadStats {
	version: GardenPayloadVersion;
	total_tokens: number;
	gardens_included: number;
	breakdown: {
		titulo_tokens: number;
		descripcion_tokens: number;
		elementos_tokens: number;
		artefactos_tokens: number;
	};
}

/**
 * Genera el payload de un jardín según la versión solicitada
 */
export async function generateGardenPayload(
	gardenId: string,
	version: GardenPayloadVersion = "ligera",
): Promise<{ success: boolean; data?: GardenPayload; error?: string }> {
	try {
		const supabase = await createSupabaseServerClient();

		// Obtener jardín con elementos
		const { data: garden, error: gardenError } = await supabase
			.from("cog_resonance_gardens")
			.select(
				`
                id,
                name,
                description,
                emoji,
                elements:cog_garden_elements(
                    id,
                    element_type,
                    element_id,
                    element_content,
                    element_label
                )
            `,
			)
			.eq("id", gardenId)
			.single();

		if (gardenError || !garden) {
			return { success: false, error: "Jardín no encontrado" };
		}

		const elements = ((garden as { elements?: GardenElement[] }).elements ||
			[]) as GardenElement[];

		// Contar elementos por tipo
		const elementosCount = {
			seeds: elements.filter((e: GardenElement) => e.element_type === "seed")
				.length,
			disciplines: elements.filter(
				(e: GardenElement) => e.element_type === "discipline",
			).length,
			theories: elements.filter(
				(e: GardenElement) => e.element_type === "theory",
			).length,
			thinkers: elements.filter(
				(e: GardenElement) => e.element_type === "thinker",
			).length,
		};

		// Obtener project_id del jardín
		const { data: gardenProject } = await supabase
			.from("cog_resonance_gardens")
			.select("project_id")
			.eq("id", gardenId)
			.single();

		const projectId = gardenProject?.project_id;
		if (!projectId) {
			return {
				success: false,
				error: "No se pudo obtener el proyecto del jardín",
			};
		}

		// Obtener artefactos que contienen elementos de este jardín
		const artifactsResult = await getArtifactsForGarden(gardenId, projectId);
		console.log("🔍 [generateGardenPayload] artifactsResult:", artifactsResult);
		const artifacts = artifactsResult.success ? artifactsResult.data : [];
		const artifactsCount = artifacts?.length || 0;
		console.log("📊 [generateGardenPayload] artifacts count:", artifactsCount);
		console.log("📚 [generateGardenPayload] artifacts:", artifacts);

		// Enriquecer artefactos con versiones completas de Micelio
		const enrichedArtifacts = await Promise.all(
			((artifacts as any) || []).map(async (art: GardenArtifact) => {
				const { data: fullArtifact } = await supabase
					.from("cog_artifacts")
					.select("source_metadata")
					.eq("id", art.id)
					.single();

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const meta = fullArtifact?.source_metadata as Record<string, any>;
				const chronicle = meta?.micelio_chronicle;

				return {
					...art,
					micelio_destilada: chronicle?.version_destilada || "",
					micelio_cronica: chronicle?.cronica || "",
					micelio_extendida: chronicle?.version_extendida || "",
				};
			}),
		);

		// Construir referencia formal
		const referencia_formal = `${garden.emoji} Jardín "${garden.name}" (${elementosCount.seeds + elementosCount.disciplines + elementosCount.theories + elementosCount.thinkers} elementos, ${artifactsCount} artefactos)`;

		// Construir fragmento según versión
		let fragmento = "";
		let tokenCount = 0;

		// VERSIÓN LIGERA: Solo título + elementos cognitivos básicos
		if (version === "ligera") {
			fragmento = `# ${garden.emoji} ${garden.name}\n\n`;

			// Semillas (máximo 5)
			const seeds = elements
				.filter((e: GardenElement) => e.element_type === "seed")
				.slice(0, 5);
			if (seeds.length > 0) {
				fragmento += `🌱 **Semillas:** ${seeds.map((s: GardenElement) => s.element_label).join(", ")}${seeds.length < elementosCount.seeds ? ` (+${elementosCount.seeds - seeds.length} más)` : ""}\n\n`;
			}

			// Pensadores (máximo 3)
			const thinkers = elements
				.filter((e: GardenElement) => e.element_type === "thinker")
				.slice(0, 3);
			if (thinkers.length > 0) {
				fragmento += `👤 **Pensadores:** ${thinkers.map((t: GardenElement) => t.element_label).join(", ")}${thinkers.length < elementosCount.thinkers ? ` (+${elementosCount.thinkers - thinkers.length} más)` : ""}\n\n`;
			}

			// Disciplinas
			const disciplines = elements.filter(
				(e: GardenElement) => e.element_type === "discipline",
			);
			if (disciplines.length > 0) {
				fragmento += `🔬 **Disciplinas:** ${disciplines.map((d: GardenElement) => d.element_label).join(", ")}\n\n`;
			}

			fragmento += `📊 **Resonancia:** ${artifactsCount} artefactos contienen elementos de este jardín`;
		}

		// VERSIÓN ESTÁNDAR: Ligera + descripción del jardín
		else if (version === "estandar") {
			fragmento = `# ${garden.emoji} ${garden.name}\n\n`;

			if (garden.description) {
				fragmento += `**Descripción:** ${garden.description}\n\n---\n\n`;
			}

			// Todos los elementos organizados
			const seeds = elements.filter(
				(e: GardenElement) => e.element_type === "seed",
			);
			if (seeds.length > 0) {
				fragmento += `## 🌱 Semillas (${seeds.length})\n${seeds.map((s: GardenElement) => `- ${s.element_label}`).join("\n")}\n\n`;
			}

			const thinkers = elements.filter(
				(e: GardenElement) => e.element_type === "thinker",
			);
			if (thinkers.length > 0) {
				fragmento += `## 👤 Pensadores (${thinkers.length})\n${thinkers.map((t: GardenElement) => `- ${t.element_label}`).join("\n")}\n\n`;
			}

			const disciplines = elements.filter(
				(e: GardenElement) => e.element_type === "discipline",
			);
			if (disciplines.length > 0) {
				fragmento += `## 🔬 Disciplinas (${disciplines.length})\n${disciplines.map((d: GardenElement) => `- ${d.element_label}`).join("\n")}\n\n`;
			}

			const theories = elements.filter(
				(e: GardenElement) => e.element_type === "theory",
			);
			if (theories.length > 0) {
				fragmento += `## 💡 Teorías (${theories.length})\n${theories.map((th: GardenElement) => `- ${th.element_label}`).join("\n")}\n\n`;
			}

			fragmento += `---\n📊 **Resonancia:** ${artifactsCount} artefactos contienen elementos de este jardín`;
		}

		// VERSIÓN COMPLETA: Estándar + lista de artefactos con sus títulos
		else if (version === "completa") {
			fragmento = `# ${garden.emoji} ${garden.name}\n\n`;

			if (garden.description) {
				fragmento += `**Descripción:** ${garden.description}\n\n---\n\n`;
			}

			// Todos los elementos organizados (igual que estándar)
			const seeds = elements.filter(
				(e: GardenElement) => e.element_type === "seed",
			);
			if (seeds.length > 0) {
				fragmento += `## 🌱 Semillas (${seeds.length})\n${seeds.map((s: GardenElement) => `- ${s.element_label}`).join("\n")}\n\n`;
			}

			const thinkers = elements.filter(
				(e: GardenElement) => e.element_type === "thinker",
			);
			if (thinkers.length > 0) {
				fragmento += `## 👤 Pensadores (${thinkers.length})\n${thinkers.map((t: GardenElement) => `- ${t.element_label}`).join("\n")}\n\n`;
			}

			const disciplines = elements.filter(
				(e: GardenElement) => e.element_type === "discipline",
			);
			if (disciplines.length > 0) {
				fragmento += `## 🔬 Disciplinas (${disciplines.length})\n${disciplines.map((d: GardenElement) => `- ${d.element_label}`).join("\n")}\n\n`;
			}

			const theories = elements.filter(
				(e: GardenElement) => e.element_type === "theory",
			);
			if (theories.length > 0) {
				fragmento += `## 💡 Teorías (${theories.length})\n${theories.map((th: GardenElement) => `- ${th.element_label}`).join("\n")}\n\n`;
			}

			// Agregar lista de artefactos resonantes
			if (artifacts && artifacts.length > 0) {
				fragmento += `---\n\n## 📚 Artefactos Resonantes (${artifacts.length})\n\n`;

				// Limitar a 20 artefactos para no saturar
				const artifactsToShow = artifacts.slice(0, 20);
				(artifactsToShow as any).forEach((art: GardenArtifact) => {
					const typeEmoji = getTypeEmoji(art.type);
					fragmento += `- ${typeEmoji} **${art.title}**\n`;
				});

				if (artifacts.length > 20) {
					fragmento += `\n... y ${artifacts.length - 20} artefactos más\n`;
				}
			}
		}

		// Estimar tokens
		tokenCount = estimateTokens(fragmento);

		const payload: GardenPayload = {
			garden_id: gardenId,
			garden_name: garden.name,
			referencia_formal,
			fragmento,
			version,
			token_count: tokenCount,
			metadata: {
				elementos_count: elementosCount,
				artifacts_count: artifactsCount,
			},
			artifacts: enrichedArtifacts,
		};

		return { success: true, data: payload };
	} catch (error) {
		console.error("❌ [generateGardenPayload] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Error generando payload de jardín",
		};
	}
}

/**
 * Genera payloads para múltiples jardines
 */
export async function generateMultipleGardenPayloads(
	gardenIds: string[],
	version: GardenPayloadVersion = "ligera",
): Promise<{
	success: boolean;
	data?: GardenPayload[];
	stats?: GardenPayloadStats;
	error?: string;
}> {
	try {
		const payloads: GardenPayload[] = [];
		let totalTokens = 0;

		for (const gardenId of gardenIds) {
			const result = await generateGardenPayload(gardenId, version);
			if (result.success && result.data) {
				payloads.push(result.data);
				totalTokens += result.data.token_count;
			}
		}

		// Calcular breakdown aproximado
		const breakdown = {
			titulo_tokens: Math.round(totalTokens * 0.1),
			descripcion_tokens:
				version === "ligera" ? 0 : Math.round(totalTokens * 0.2),
			elementos_tokens: Math.round(totalTokens * 0.5),
			artefactos_tokens:
				version === "completa" ? Math.round(totalTokens * 0.2) : 0,
		};

		const stats: GardenPayloadStats = {
			version,
			total_tokens: totalTokens,
			gardens_included: payloads.length,
			breakdown,
		};

		return { success: true, data: payloads, stats };
	} catch (error) {
		console.error("❌ [generateMultipleGardenPayloads] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Error generando payloads de jardines",
		};
	}
}

/**
 * Helper: Obtener emoji según tipo de artefacto
 */
function getTypeEmoji(type: string): string {
	const emojiMap: Record<string, string> = {
		audio: "🎙️",
		video: "🎬",
		markdown: "📝",
		pdf_report: "📊",
		pdf_slides: "📽️",
		image: "🖼️",
		chat: "🪢",
	};
	return emojiMap[type] || "📄";
}

/**
 * Estimar tokens totales de una sesión con jardines
 */
export function estimateGardenSessionTokens(
	textoPrimario: string,
	gardenPayloads: GardenPayload[],
	historialInteracciones: number = 0,
): {
	texto_primario: number;
	jardines: number;
	historial: number;
	total: number;
} {
	const textoPrimarioTokens = estimateTokens(textoPrimario);
	const jardinesTokens = gardenPayloads.reduce(
		(sum, p) => sum + p.token_count,
		0,
	);
	const historialTokens = historialInteracciones * 150; // Estimación aproximada por interacción

	return {
		texto_primario: textoPrimarioTokens,
		jardines: jardinesTokens,
		historial: historialTokens,
		total: textoPrimarioTokens + jardinesTokens + historialTokens,
	};
}
