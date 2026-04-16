// 📍 lib/actions/nexus-v2-actions.ts
// 🍄👁️ Server Actions para Nexus Cronológico v2.0
// 🎯 PROPÓSITO: Acciones reutilizables para cualquier campo de investigación
// 🔧 DECISIÓN: Usa project_members para autenticación (no tabla propia)

"use server";

import { createSupabaseServerClient } from "@/lib/server";

// ============================================
// 📦 TIPOS
// ============================================

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string };

// 🌱 Sistema de Semillas Epistémicas
export type SeedMaturity = 
	| "seed_green"   // 🌱 Lista para cosecha
	| "seed_purple"  // 🟣 Adelantada al canon
	| "seed_red"     // 🔴 Problema detectado
	| "seed_yellow"  // 🟡 Mezcla - requiere desempaque
	| "seed_white";  // ⚪ Falla Perezosa - sin clasificar

export type NodeType = 
	| "civilization"  // Cultura histórica
	| "research"      // Investigación/paper
	| "event"         // Evento histórico
	| "concept"       // Concepto teórico
	| "institution"   // Organización
	| "person"        // Persona clave
	| "artifact"      // Artefacto/evidencia
	| "pattern";      // Patrón detectado

export interface NexusRegion {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	sort_order?: number;
}

export interface NexusNode {
	id?: string;
	slug?: string;
	name: string;
	emoji?: string;
	subtitle?: string;
	
	// Temporal
	year_start?: number;
	year_end?: number;
	date_precision?: "exact" | "year" | "decade" | "century" | "approximate";
	
	// Geográfico
	region_id?: string;
	country?: string;
	latitude?: number;
	longitude?: number;
	
	// Clasificación
	node_type?: NodeType;
	maturity?: SeedMaturity;
	maturity_reason?: string;
	
	// Contenido
	description?: string;
	official_narrative?: string;
	counter_narrative?: string;
	source_url?: string;
	citation?: string;
	
	// Relevancia
	is_foundational?: boolean;
	foundational_label?: string;
	anomaly_level?: "none" | "low" | "medium" | "high" | "critical";
	anomaly_description?: string;
	
	// Tags
	tags?: string[];
}

export interface NexusIsomorphism {
	id?: string;
	slug?: string;
	name: string;
	description?: string;
	icon?: string;
	color?: string;
	strength?: number;
	connection_type?: "similarity" | "influence" | "parallel" | "contrast" | "evolution" | "synthesis";
	nodes?: string[]; // slugs de nodos conectados
}

export interface NexusPatternTag {
	slug: string;
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}

export interface NexusJsonData {
	project_slug?: string;
	tags?: NexusPatternTag[];
	nodes: NexusNode[];
	isomorphisms?: NexusIsomorphism[];
}

export interface LoadStats {
	regions: number;
	nodes: number;
	isomorphisms: number;
	connections: number;
	tags: number;
}

// ============================================
// 🔍 ACTION: Verificar si hay datos (v2)
// ============================================

export async function checkNexusDataV2Action(
	projectId: string
): Promise<ResultadoOperacion<{ hasData: boolean; count: number; byMaturity: Record<SeedMaturity, number> }>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		// Verificar que el usuario tiene acceso al proyecto
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: "No autenticado" };
		}
		
		// Contar nodos del proyecto
		const { data: nodes, error } = await supabase
			.from("nexus_nodes")
			.select("id, maturity")
			.eq("project_id", projectId);
		
		if (error) {
			// Si la tabla no existe, retornar vacío
			if (error.code === "42P01") {
				return { 
					success: true, 
					data: { 
						hasData: false, 
						count: 0,
						byMaturity: {
							seed_green: 0,
							seed_purple: 0,
							seed_red: 0,
							seed_yellow: 0,
							seed_white: 0
						}
					} 
				};
			}
			return { success: false, error: error.message };
		}
		
		// Contar por madurez
		const byMaturity: Record<SeedMaturity, number> = {
			seed_green: 0,
			seed_purple: 0,
			seed_red: 0,
			seed_yellow: 0,
			seed_white: 0
		};
		
		nodes?.forEach(node => {
			const m = node.maturity as SeedMaturity;
			if (m && byMaturity[m] !== undefined) {
				byMaturity[m]++;
			}
		});
		
		return { 
			success: true, 
			data: { 
				hasData: (nodes?.length || 0) > 0, 
				count: nodes?.length || 0,
				byMaturity
			} 
		};
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 📤 ACTION: Cargar JSON a Nexus v2
// ============================================

export async function loadJsonToNexusV2Action(
	projectId: string,
	jsonData: NexusJsonData
): Promise<ResultadoOperacion<{ message: string; stats: LoadStats }>> {
	const stats: LoadStats = { 
		regions: 0, 
		nodes: 0, 
		isomorphisms: 0, 
		connections: 0, 
		tags: 0 
	};
	
	try {
		const supabase = await createSupabaseServerClient();
		
		// Verificar autenticación
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: "No autenticado" };
		}
		
		// 1️⃣ Cargar Tags del proyecto
		if (jsonData.tags?.length) {
			const tagsToInsert = jsonData.tags.map(tag => ({
				project_id: projectId,
				slug: tag.slug,
				name: tag.name,
				description: tag.description,
				color: tag.color,
				icon: tag.icon,
				created_by: user.id
			}));
			
			const { error: tagError } = await supabase
				.from("nexus_pattern_tags")
				.upsert(tagsToInsert, { 
					onConflict: "project_id,slug",
					ignoreDuplicates: false 
				});
			
			if (tagError) throw new Error(`Tags: ${tagError.message}`);
			stats.tags = tagsToInsert.length;
		}
		
		// 2️⃣ Cargar Nodos
		// Nota: region_id se omite si no existe en nexus_regions
		if (jsonData.nodes?.length) {
			const nodesToInsert = jsonData.nodes.map(node => ({
				project_id: projectId,
				slug: node.slug || node.name.toLowerCase().replace(/\s+/g, "_").slice(0, 50),
				name: node.name,
				emoji: node.emoji,
				subtitle: node.subtitle,
				year_start: node.year_start,
				year_end: node.year_end,
				date_precision: node.date_precision || "year",
				// region_id se establece como null - las regiones son opcionales
				region_id: null,
				country: node.country,
				latitude: node.latitude,
				longitude: node.longitude,
				node_type: node.node_type || "research",
				maturity: node.maturity || "seed_white",
				maturity_reason: node.maturity_reason,
				description: node.description,
				official_narrative: node.official_narrative,
				counter_narrative: node.counter_narrative,
				source_url: node.source_url,
				citation: node.citation,
				is_foundational: node.is_foundational || false,
				foundational_label: node.foundational_label,
				anomaly_level: node.anomaly_level || "none",
				anomaly_description: node.anomaly_description,
				created_by: user.id
			}));
			
			const { data: insertedNodes, error: nodeError } = await supabase
				.from("nexus_nodes")
				.upsert(nodesToInsert, { 
					onConflict: "project_id,slug",
					ignoreDuplicates: false 
				})
				.select("id, slug");
			
			if (nodeError) throw new Error(`Nodos: ${nodeError.message}`);
			stats.nodes = nodesToInsert.length;
			
			// 2b️⃣ Cargar relaciones Nodo ↔ Tags
			if (insertedNodes) {
				// Obtener IDs de tags del proyecto
				const { data: projectTags } = await supabase
					.from("nexus_pattern_tags")
					.select("id, slug")
					.eq("project_id", projectId);
				
				const tagMap = new Map(projectTags?.map(t => [t.slug, t.id]) || []);
				const nodeMap = new Map(insertedNodes.map(n => [n.slug, n.id]));
				
				const nodeTagsToInsert: Array<{ node_id: string; tag_id: string }> = [];
				
				jsonData.nodes.forEach(node => {
					const nodeSlug = node.slug || node.name.toLowerCase().replace(/\s+/g, "_").slice(0, 50);
					const nodeId = nodeMap.get(nodeSlug);
					
					node.tags?.forEach(tagSlug => {
						const tagId = tagMap.get(tagSlug);
						if (nodeId && tagId) {
							nodeTagsToInsert.push({ node_id: nodeId, tag_id: tagId });
						}
					});
				});
				
				if (nodeTagsToInsert.length > 0) {
					// Eliminar existentes para evitar duplicados
					const nodeIds = insertedNodes.map(n => n.id);
					await supabase
						.from("nexus_node_tags")
						.delete()
						.in("node_id", nodeIds);
					
					const { error: ntError } = await supabase
						.from("nexus_node_tags")
						.insert(nodeTagsToInsert);
					
					if (ntError) throw new Error(`Node-Tags: ${ntError.message}`);
				}
			}
		}
		
		// 3️⃣ Cargar Isomorfismos
		if (jsonData.isomorphisms?.length) {
			const isosToInsert = jsonData.isomorphisms.map(iso => ({
				project_id: projectId,
				slug: iso.slug || iso.name.toLowerCase().replace(/\s+/g, "_").slice(0, 50),
				name: iso.name,
				description: iso.description,
				icon: iso.icon,
				color: iso.color,
				strength: iso.strength || 0.5,
				connection_type: iso.connection_type || "similarity",
				created_by: user.id
			}));
			
			const { data: insertedIsos, error: isoError } = await supabase
				.from("nexus_isomorphisms")
				.upsert(isosToInsert, { 
					onConflict: "project_id,slug",
					ignoreDuplicates: false 
				})
				.select("id, slug");
			
			if (isoError) throw new Error(`Isomorfismos: ${isoError.message}`);
			stats.isomorphisms = isosToInsert.length;
			
			// 3b️⃣ Cargar conexiones Isomorfismo ↔ Nodo
			if (insertedIsos) {
				// Obtener nodos del proyecto
				const { data: projectNodes } = await supabase
					.from("nexus_nodes")
					.select("id, slug")
					.eq("project_id", projectId);
				
				const nodeMap = new Map(projectNodes?.map(n => [n.slug, n.id]) || []);
				const isoMap = new Map(insertedIsos.map(i => [i.slug, i.id]));
				
				const connectionsToInsert: Array<{ isomorphism_id: string; node_id: string }> = [];
				
				jsonData.isomorphisms.forEach(iso => {
					const isoSlug = iso.slug || iso.name.toLowerCase().replace(/\s+/g, "_").slice(0, 50);
					const isoId = isoMap.get(isoSlug);
					
					iso.nodes?.forEach(nodeSlug => {
						const nodeId = nodeMap.get(nodeSlug);
						if (isoId && nodeId) {
							connectionsToInsert.push({ isomorphism_id: isoId, node_id: nodeId });
						}
					});
				});
				
				if (connectionsToInsert.length > 0) {
					// Eliminar existentes
					const isoIds = insertedIsos.map(i => i.id);
					await supabase
						.from("nexus_isomorphism_connections")
						.delete()
						.in("isomorphism_id", isoIds);
					
					const { error: connError } = await supabase
						.from("nexus_isomorphism_connections")
						.insert(connectionsToInsert);
					
					if (connError) throw new Error(`Conexiones: ${connError.message}`);
					stats.connections = connectionsToInsert.length;
				}
			}
		}
		
		return {
			success: true,
			data: {
				message: `✅ Carga completada: ${stats.nodes} nodos, ${stats.isomorphisms} isomorfismos`,
				stats,
			},
		};
		
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 📊 ACTION: Obtener análisis de diversidad
// ============================================

export async function getDiversityAnalysisAction(
	projectId: string
): Promise<ResultadoOperacion<Array<{
	region_id: string;
	region_name: string;
	region_emoji: string;
	node_count: number;
	green_count: number;
	purple_count: number;
	red_count: number;
	yellow_count: number;
	white_count: number;
	percentage: number;
}>>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		const { data, error } = await supabase
			.from("nexus_diversity_analysis")
			.select("*")
			.eq("project_id", projectId);
		
		if (error) {
			return { success: false, error: error.message };
		}
		
		// Transformar null a valores por defecto
		const transformed = (data || []).map(d => ({
			region_id: d.region_id || "",
			region_name: d.region_name || "",
			region_emoji: d.region_emoji || "",
			node_count: d.node_count ?? 0,
			green_count: d.green_count ?? 0,
			purple_count: d.purple_count ?? 0,
			red_count: d.red_count ?? 0,
			yellow_count: d.yellow_count ?? 0,
			white_count: d.white_count ?? 0,
			percentage: d.percentage ?? 0,
		}));
		
		return { success: true, data: transformed };
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 📋 ACTION: Obtener nodos del proyecto
// ============================================

export async function getProjectNodesAction(
	projectId: string,
	filters?: {
		maturity?: SeedMaturity;
		nodeType?: NodeType;
		regionId?: string;
	}
): Promise<ResultadoOperacion<NexusNode[]>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		let query = supabase
			.from("nexus_nodes_with_tags")
			.select("*")
			.eq("project_id", projectId)
			.order("year_start", { ascending: true, nullsFirst: false });
		
		if (filters?.maturity) {
			query = query.eq("maturity", filters.maturity);
		}
		if (filters?.nodeType) {
			query = query.eq("node_type", filters.nodeType);
		}
		if (filters?.regionId) {
			query = query.eq("region_id", filters.regionId);
		}
		
		const { data, error } = await query;
		
		if (error) {
			return { success: false, error: error.message };
		}
		
		// Transformar datos para compatibilidad de tipos
		const nodes: NexusNode[] = (data || []).map(d => ({
			id: d.id ?? undefined,
			slug: d.slug ?? undefined,
			name: d.name || "Sin nombre",
			emoji: d.emoji ?? undefined,
			subtitle: d.subtitle ?? undefined,
			year_start: d.year_start ?? undefined,
			year_end: d.year_end ?? undefined,
			date_precision: d.date_precision as NexusNode["date_precision"],
			region_id: d.region_id ?? undefined,
			country: d.country ?? undefined,
			latitude: d.latitude ?? undefined,
			longitude: d.longitude ?? undefined,
			node_type: d.node_type as NodeType,
			maturity: d.maturity as SeedMaturity,
			maturity_reason: d.maturity_reason ?? undefined,
			description: d.description ?? undefined,
			official_narrative: d.official_narrative ?? undefined,
			counter_narrative: d.counter_narrative ?? undefined,
			source_url: d.source_url ?? undefined,
			citation: d.citation ?? undefined,
			is_foundational: d.is_foundational ?? undefined,
			foundational_label: d.foundational_label ?? undefined,
			anomaly_level: d.anomaly_level as NexusNode["anomaly_level"],
			anomaly_description: d.anomaly_description ?? undefined,
		}));
		
		return { success: true, data: nodes };
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 🌱 ACTION: Actualizar madurez de un nodo
// ============================================

export async function updateNodeMaturityAction(
	nodeId: string,
	maturity: SeedMaturity,
	reason?: string
): Promise<ResultadoOperacion<{ updated: boolean }>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		const { error } = await supabase
			.from("nexus_nodes")
			.update({ 
				maturity,
				maturity_reason: reason,
				updated_at: new Date().toISOString()
			})
			.eq("id", nodeId);
		
		if (error) {
			return { success: false, error: error.message };
		}
		
		return { success: true, data: { updated: true } };
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 🗑️ ACTION: Limpiar datos del proyecto
// ============================================

export async function clearNexusProjectDataAction(
	projectId: string
): Promise<ResultadoOperacion<{ cleared: boolean }>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		// Verificar autenticación
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: "No autenticado" };
		}
		
		// Orden importante por foreign keys
		// Las conexiones y tags se eliminan en cascada con los nodos/isomorfismos
		await supabase.from("nexus_calibrations").delete().eq("project_id", projectId);
		await supabase.from("nexus_isomorphisms").delete().eq("project_id", projectId);
		await supabase.from("nexus_nodes").delete().eq("project_id", projectId);
		await supabase.from("nexus_pattern_tags").delete().eq("project_id", projectId);
		
		return { success: true, data: { cleared: true } };
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 🌍 ACTION: Obtener regiones disponibles
// ============================================

export async function getRegionsAction(): Promise<ResultadoOperacion<NexusRegion[]>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		const { data, error } = await supabase
			.from("nexus_regions")
			.select("*")
			.order("sort_order", { ascending: true });
		
		if (error) {
			return { success: false, error: error.message };
		}
		
		// Transformar null a undefined para compatibilidad de tipos
		const regions: NexusRegion[] = (data || []).map(d => ({
			id: d.id,
			name: d.name,
			emoji: d.emoji ?? undefined,
			color: d.color ?? undefined,
			sort_order: d.sort_order ?? undefined,
		}));
		
		return { success: true, data: regions };
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}

// ============================================
// 📊 ACTION: Cargar nodos completos para visualización
// ============================================

export interface NexusNodeWithRelations extends NexusNode {
	region?: NexusRegion;
	tags?: string[];
	torsion_angle?: number;
	torsion_note?: string;
}

export interface NexusMapData {
	nodes: NexusNodeWithRelations[];
	regions: NexusRegion[];
	isomorphisms: Array<{
		id: string;
		slug: string;
		name: string;
		description?: string;
		icon?: string;
		nodes: string[]; // slugs de nodos conectados
	}>;
}

export async function getMapDataAction(
	projectId: string
): Promise<ResultadoOperacion<NexusMapData>> {
	try {
		const supabase = await createSupabaseServerClient();
		
		// 1. Cargar regiones
		const { data: regionsRaw, error: regError } = await supabase
			.from("nexus_regions")
			.select("*")
			.order("sort_order");
		
		if (regError) {
			return { success: false, error: `Error cargando regiones: ${regError.message}` };
		}
		
		// Convertir null a undefined para tipos
		const regions: NexusRegion[] = (regionsRaw || []).map(r => ({
			id: r.id,
			name: r.name,
			emoji: r.emoji ?? undefined,
			color: r.color ?? undefined,
			sort_order: r.sort_order ?? undefined,
		}));
		
		// 2. Cargar nodos con tags
		const { data: nodesRaw, error: nodeError } = await supabase
			.from("nexus_nodes")
			.select(`
				*,
				nexus_node_tags (
					tag_id,
					nexus_pattern_tags (
						slug,
						name
					)
				)
			`)
			.eq("project_id", projectId)
			.order("year_start", { ascending: true, nullsFirst: false });
		
		if (nodeError) {
			return { success: false, error: `Error cargando nodos: ${nodeError.message}` };
		}
		
		// 3. Cargar isomorfismos
		const { data: isosRaw, error: isoError } = await supabase
			.from("nexus_isomorphisms")
			.select("id, slug, name, description, icon")
			.eq("project_id", projectId);
		
		if (isoError) {
			return { success: false, error: `Error cargando isomorfismos: ${isoError.message}` };
		}
		
		// 4. Cargar conexiones isomórficas por separado
		const isoIds = (isosRaw || []).map(i => i.id);
		let isoConnections: Array<{ isomorphism_id: string; node_id: string }> = [];
		
		if (isoIds.length > 0) {
			const { data: connsRaw } = await supabase
				.from("nexus_isomorphism_connections")
				.select("isomorphism_id, node_id")
				.in("isomorphism_id", isoIds);
			// Filtrar conexiones válidas (sin null)
			isoConnections = (connsRaw || [])
				.filter(c => c.isomorphism_id && c.node_id)
				.map(c => ({ isomorphism_id: c.isomorphism_id!, node_id: c.node_id! }));
		}
		
		// 5. Construir mapa node_id → slug
		const nodeIdToSlug: Record<string, string> = {};
		(nodesRaw || []).forEach(n => {
			if (n.id && n.slug) nodeIdToSlug[n.id] = n.slug;
		});
		
		// 6. Transformar nodos
		const transformedNodes: NexusNodeWithRelations[] = (nodesRaw || []).map(node => {
			const nodeTags = (node.nexus_node_tags as Array<{ nexus_pattern_tags?: { slug?: string } }>) || [];
			const tags = nodeTags
				.map(nt => nt.nexus_pattern_tags?.slug)
				.filter((s): s is string => Boolean(s));
			
			const region = regions.find(r => r.id === node.region_id);
			
			return {
				id: node.id ?? undefined,
				slug: node.slug ?? undefined,
				name: node.name,
				emoji: node.emoji ?? undefined,
				subtitle: node.subtitle ?? undefined,
				year_start: node.year_start ?? undefined,
				year_end: node.year_end ?? undefined,
				date_precision: node.date_precision as NexusNode["date_precision"],
				region_id: node.region_id ?? undefined,
				region,
				country: node.country ?? undefined,
				latitude: node.latitude ?? undefined,
				longitude: node.longitude ?? undefined,
				node_type: node.node_type as NodeType,
				maturity: node.maturity as SeedMaturity,
				maturity_reason: node.maturity_reason ?? undefined,
				torsion_angle: node.torsion_angle ?? undefined,
				torsion_note: node.torsion_note ?? undefined,
				description: node.description ?? undefined,
				official_narrative: node.official_narrative ?? undefined,
				counter_narrative: node.counter_narrative ?? undefined,
				source_url: node.source_url ?? undefined,
				citation: node.citation ?? undefined,
				is_foundational: node.is_foundational ?? undefined,
				foundational_label: node.foundational_label ?? undefined,
				anomaly_level: node.anomaly_level as NexusNode["anomaly_level"],
				anomaly_description: node.anomaly_description ?? undefined,
				tags,
			};
		});
		
		// 7. Transformar isomorfismos con sus nodos conectados
		const transformedIsos = (isosRaw || []).map(iso => {
			const connectedNodeIds = isoConnections
				.filter(c => c.isomorphism_id === iso.id)
				.map(c => c.node_id);
			const connectedSlugs = connectedNodeIds
				.map(nid => nodeIdToSlug[nid])
				.filter((s): s is string => Boolean(s));
			
			return {
				id: iso.id,
				slug: iso.slug || "",
				name: iso.name,
				description: iso.description ?? undefined,
				icon: iso.icon ?? undefined,
				nodes: connectedSlugs,
			};
		});
		
		return {
			success: true,
			data: {
				nodes: transformedNodes,
				regions,
				isomorphisms: transformedIsos,
			},
		};
	} catch (err) {
		return { 
			success: false, 
			error: err instanceof Error ? err.message : "Error desconocido" 
		};
	}
}
