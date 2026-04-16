// 📍 app/sandbox/components/MapaTemporal.tsx
// 🗺️ Vista principal del Jardín Civilizatorio
// v0.03 - Hipatia Nexus - Mock Estabilizado
//
// 🎨 NOTA: Colores hardcodeados para mock. Sistema de temas preparado en:
// - lib/theme/harmonic-colors.ts (utilidad core)
// - app/sandbox/hooks/useNexusColors.ts (hook para integración)

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
// StandardTooltip removido - usando popover nativo para leyenda
import { NodoUniversal, type NodoData, type VisualMode } from "./NodoUniversal";
import { LineaIsomorfica } from "./LineaIsomorfica";
import { FiltroCapas, type Filters } from "./FiltroCapas";
import { SimboloCivilizacion, civilizationSymbols } from "./SimbolosCivilizaciones";
import { IconoNexus, getIconoNexus, type IconoNexusType } from "./IconosNexus";
import { NexusCalibrationPanel } from "./NexusCalibrationPanel";
// 📦 Importar datos
import nexusData from "../data/hipatia-nexus.json";
import { StandardButton } from "@/components/ui/StandardButton";

// 📋 Generar Markdown del nodo seleccionado
const generateMarkdown = (node: NodoData, civData: Record<string, unknown>): string => {
	const years = (node.generations || 0) * 25;
	const startYear = (civData.startBCE as number) ? `${civData.startBCE} BCE` : `${civData.startCE} CE`;
	const endYear = (civData.endBCE as number) ? `${civData.endBCE} BCE` : `${civData.endCE} CE`;
	
	let md = `## ${node.emoji || "🔵"} ${node.name}\n\n`;
	if (node.subtitle) md += `*${node.subtitle}*\n\n`;
	
	md += `### 📊 Datos\n`;
	md += `- **Generaciones:** ${node.generations}\n`;
	md += `- **Duración:** ~${years.toLocaleString()} años\n`;
	md += `- **Período:** ${startYear} → ${endYear}\n`;
	if (node.anomalyLevel) md += `- **Nivel de Anomalía:** ${node.anomalyLevel}\n`;
	if (node.glitchType) md += `- **Tipo de Glitch:** ${node.glitchType}\n`;
	md += `\n`;
	
	if (node.technologies && node.technologies.length > 0) {
		md += `### 🔧 Tecnologías\n`;
		node.technologies.forEach(tech => {
			md += `- ${tech}\n`;
		});
		md += `\n`;
	}
	
	if (civData.officialNarrative) {
		md += `### 📖 Narrativa Oficial (F1)\n`;
		md += `> ${civData.officialNarrative}\n\n`;
	}
	
	if (civData.evidenceContradiction) {
		md += `### ⚡ Contradicción (F0)\n`;
		md += `> ${civData.evidenceContradiction}\n\n`;
	}
	
	if (civData.anomaly) {
		md += `### 👁️ Anomalía\n`;
		md += `${civData.anomaly}\n\n`;
	}
	
	if (node.patternTags && node.patternTags.length > 0) {
		md += `### 🏷️ Tags\n`;
		md += node.patternTags.map(t => `\`${t}\``).join(", ") + "\n\n";
	}
	
	md += `---\n*Fuente: Hipatia Nexus v0.2 - ${new Date().toISOString().split("T")[0]}*\n`;
	
	return md;
};

// 🎯 Tipos
interface Connection {
	source: string;
	target: string;
	pattern: string;
	strength: number;
}

// 📐 Sistema de coordenadas: Generaciones → X, Índice → Y
const CONFIG = {
	width: 1200,
	height: 800,
	padding: 80,
	minGen: -500,  // ~12,500 BCE
	maxGen: 40,    // ~1000 CE futuro
	bandHeight: 80, // Altura de cada banda de continente
};

const generationToX = (gen: number): number => {
	const { width, padding, minGen, maxGen } = CONFIG;
	return ((gen - minGen) / (maxGen - minGen)) * (width - padding * 2) + padding;
};

// 🌍 Tipo para regiones ordenables
interface RegionWithOrder {
	id: string;
	name: string;
	emoji: string;
	color: string;
	earliestRecord?: number; // Años BCE del primer registro (para ordenar)
}

export function MapaTemporal() {
	// 🪝 Estado
	const [filters, setFilters] = useState<Filters>({
		showMegalitismo: true,
		showAstronomia: true,
		showColapsos: true,
		showGlitches: true,
		showAbundancia: true,
	});
	const [visualMode, setVisualMode] = useState<VisualMode>("detail");
	const [selectedNode, setSelectedNode] = useState<NodoData | null>(null);
	const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);
	const [ghostNodes, setGhostNodes] = useState<Set<string>>(new Set());
	const [showLeyenda, setShowLeyenda] = useState(false);
const [showCalibrationPanel, setShowCalibrationPanel] = useState(false);
	// 👻 Toggle ghost mode para un nodo
	const toggleGhostNode = useCallback((nodeId: string) => {
		setGhostNodes(prev => {
			const next = new Set(prev);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	// 📊 Datos
	const civilizations = nexusData.civilizations;
	const isomorphisms = nexusData.isomorphisms;
	const baseRegions = nexusData.regions;

	// 🔄 Ordenar regiones dinámicamente según filtro activo
	const orderedRegions = useMemo(() => {
		// Calcular el primer registro de cada región según civilizaciones visibles
		const regionFirstRecord: Record<string, number> = {};
		
		civilizations.forEach((civ) => {
			const startYear = civ.startBCE || (civ.startCE ? -civ.startCE : 0);
			const regionId = civ.regionId;
			
			// Solo considerar civilizaciones que pasen los filtros actuales
			const tags = civ.patternTags || [];
			let passesFilter = true;
			if (!filters.showMegalitismo && (tags.includes("megalitismo") || tags.includes("megalitos"))) passesFilter = false;
			if (!filters.showAstronomia && (tags.includes("astronomia") || tags.includes("astronomia_precision"))) passesFilter = false;
			if (!filters.showColapsos && (tags.includes("colapso_ecologico") || tags.includes("rigidez_F1"))) passesFilter = false;
			if (!filters.showGlitches && civ.glitchType) passesFilter = false;
			if (!filters.showAbundancia && (civ.type === "abundance_epoch" || tags.includes("abundancia"))) passesFilter = false;
			
			if (passesFilter) {
				if (!regionFirstRecord[regionId] || startYear > regionFirstRecord[regionId]) {
					regionFirstRecord[regionId] = startYear;
				}
			}
		});

		// Ordenar regiones por primer registro (más antiguo primero)
		return [...baseRegions]
			.map(r => ({ ...r, earliestRecord: regionFirstRecord[r.id] || 0 }))
			.sort((a, b) => (b.earliestRecord || 0) - (a.earliestRecord || 0));
	}, [baseRegions, civilizations, filters]);

	// Generar posiciones Y dinámicas basadas en orden de regiones
	const getRegionY = useCallback((regionId: string): number => {
		const index = orderedRegions.findIndex(r => r.id === regionId);
		if (index === -1) return 400;
		return 60 + index * CONFIG.bandHeight;
	}, [orderedRegions]);

	// 🔗 Construir conexiones desde isomorfismos
	const connections = useMemo<Connection[]>(() => {
		const conns: Connection[] = [];
		isomorphisms.forEach((iso) => {
			const nodes = iso.nodes;
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					conns.push({
						source: nodes[i],
						target: nodes[j],
						pattern: iso.id,
						strength: 0.8,
					});
				}
			}
		});
		return conns;
	}, [isomorphisms]);

	// 🎛️ Filtrar civilizaciones
	const visibleCivs = useMemo(() => {
		return civilizations.filter((civ) => {
			const tags = civ.patternTags || [];
			if (!filters.showMegalitismo && (tags.includes("megalitismo") || tags.includes("megalitos"))) return false;
			if (!filters.showAstronomia && (tags.includes("astronomia") || tags.includes("astronomia_precision"))) return false;
			if (!filters.showColapsos && (tags.includes("colapso_ecologico") || tags.includes("rigidez_F1"))) return false;
			if (!filters.showGlitches && civ.glitchType) return false;
			if (!filters.showAbundancia && (civ.type === "abundance_epoch" || tags.includes("abundancia"))) return false;
			return true;
		});
	}, [civilizations, filters]);

	// 📍 Calcular posiciones de nodos
	const nodePositions = useMemo(() => {
		const positions: Record<string, { x: number; y: number }> = {};
		const regionCounts: Record<string, number> = {};

		visibleCivs.forEach((civ) => {
			const regionId = civ.regionId;
			regionCounts[regionId] = (regionCounts[regionId] || 0) + 1;
			const startGen = civ.startBCE ? -Math.floor(civ.startBCE / 25) : (civ.startCE ? Math.floor(civ.startCE / 25) : 0);
			
			// Usar posición Y dinámica + offset vertical dentro de la banda
			const baseY = getRegionY(regionId);
			const offsetY = (regionCounts[regionId] % 2) * 25; // Alternar arriba/abajo
			
			positions[civ.id] = {
				x: generationToX(startGen),
				y: baseY + 40 + offsetY,
			};
		});
		return positions;
	}, [visibleCivs, getRegionY]);

	// 🔗 Conexiones visibles
	const visibleConnections = useMemo(() => {
		const visibleIds = new Set(visibleCivs.map((c) => c.id));
		return connections.filter(
			(conn) => visibleIds.has(conn.source) && visibleIds.has(conn.target)
		);
	}, [connections, visibleCivs]);

	// 🎯 Handler de interacción
	const handleNodeInteract = useCallback((data: NodoData) => {
		setSelectedNode(data);
	}, []);

	// ⏳ Líneas de tiempo de referencia
	const timeMarkers = [-400, -200, -100, -40, 0, 20, 40];

	return (
		<div className="flex h-screen bg-neutral-100 dark:bg-neutral-950">
			{/* Panel de Filtros */}
			<FiltroCapas
				filters={filters}
				setFilters={setFilters}
				visualMode={visualMode}
				setVisualMode={setVisualMode}
			/>

			{/* Área Principal */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<div className="p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
					<div className="flex items-center justify-between">
						<div>
							<StandardText preset="heading" size="xl" applyGradient>
								🍄👁️ Mapa Temporal Civilizatorio
							</StandardText>
							<StandardText size="sm" colorScheme="neutral">
								{visibleCivs.length} civilizaciones • {visibleConnections.length} conexiones isomórficas
							</StandardText>
						</div>
						
						{/* 📜 Leyenda de Simbología */}
						<button 
							onClick={() => setShowLeyenda(true)}
							className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
						>
							📜 Simbología
						</button>
					</div>
				</div>

				{/* SVG Canvas */}
				<div className="flex-1 overflow-auto p-4">
					<svg
						width={CONFIG.width}
						height={CONFIG.height}
						className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800"
					>
						{/* Definiciones SVG (filtros, gradientes) */}
						<defs>
							<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
								<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
								<feMerge>
									<feMergeNode in="coloredBlur"/>
									<feMergeNode in="SourceGraphic"/>
								</feMerge>
							</filter>
						</defs>

						{/* Grid temporal */}
						{timeMarkers.map((gen) => (
							<g key={gen}>
								<line
									x1={generationToX(gen)}
									y1={30}
									x2={generationToX(gen)}
									y2={CONFIG.height - 30}
									stroke="#BDC3C7"
									strokeDasharray="4,4"
									opacity={0.5}
								/>
								<text
									x={generationToX(gen)}
									y={CONFIG.height - 10}
									textAnchor="middle"
									fontSize="10"
									fill="#7F8C8D"
								>
									{gen < 0 ? `${Math.abs(gen * 25)} BCE` : `${gen * 25} CE`}
								</text>
							</g>
						))}

						{/* 🌍 BANDAS DE CONTINENTES con fondo */}
						{orderedRegions.map((region, index) => {
							const y = getRegionY(region.id);
							const hasVisibleCivs = visibleCivs.some(c => c.regionId === region.id);
							if (!hasVisibleCivs) return null;
							
							return (
								<g key={region.id}>
									{/* Banda de fondo */}
									<rect
										x={0}
										y={y}
										width={CONFIG.width}
										height={CONFIG.bandHeight}
										fill={region.color}
										opacity={index % 2 === 0 ? 0.08 : 0.04}
									/>
									{/* Línea separadora superior */}
									<line
										x1={0}
										y1={y}
										x2={CONFIG.width}
										y2={y}
										stroke={region.color}
										strokeWidth={1}
										opacity={0.3}
									/>
									{/* Etiqueta de continente */}
									<rect
										x={4}
										y={y + 4}
										width={70}
										height={22}
										fill={region.color}
										opacity={0.9}
										rx={4}
									/>
									<text
										x={12}
										y={y + 19}
										fontSize="11"
										fill="white"
										fontWeight="600"
									>
										{region.emoji} {region.name}
									</text>
									{/* Primer registro (si existe) */}
									{region.earliestRecord && (
										<text
											x={12}
											y={y + 35}
											fontSize="9"
											fill={region.color}
											opacity={0.8}
										>
											← {region.earliestRecord.toLocaleString()} BCE
										</text>
									)}
								</g>
							);
						})}

						{/* Líneas de conexión */}
						{visibleConnections.map((conn, i) => {
							const sourcePos = nodePositions[conn.source];
							const targetPos = nodePositions[conn.target];
							if (!sourcePos || !targetPos) return null;

							return (
								<LineaIsomorfica
									key={`${conn.source}-${conn.target}-${i}`}
									source={sourcePos}
									target={targetPos}
									pattern={conn.pattern}
									strength={conn.strength}
									isHighlighted={hoveredPattern === conn.pattern}
								/>
							);
						})}

						{/* Nodos */}
						{visibleCivs.map((civ) => {
							const pos = nodePositions[civ.id];
							if (!pos) return null;

							// Type assertion para acceder a campos adicionales del JSON
							const civData = civ as typeof civ & { worldFirst?: boolean; worldFirstLabel?: string };
							
							return (
								<NodoUniversal
									key={civ.id}
									data={{
										id: civ.id,
										name: civ.name,
										emoji: civ.emoji,
										subtitle: civ.subtitle,
										generations: civ.generations,
										patternTags: civ.patternTags,
										glitchType: civ.glitchType,
										anomalyLevel: civ.anomalyLevel as NodoData["anomalyLevel"],
										type: civ.type,
										technologies: civ.technologies,
										worldFirst: civData.worldFirst,
										worldFirstLabel: civData.worldFirstLabel,
									}}
									position={pos}
									onInteract={handleNodeInteract}
									visualMode={visualMode}
									isSelected={selectedNode?.id === civ.id}
									isGhost={ghostNodes.has(civ.id)}
								/>
							);
						})}
					</svg>
				</div>
			</div>

			{/* Panel de Detalle */}
			<AnimatePresence>
				{selectedNode && (
					<motion.div
						initial={{ x: 300, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 300, opacity: 0 }}
						className="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 overflow-y-auto"
					>
						<div className="p-4">
							{/* Header con Símbolo */}
							<div className="flex items-start gap-3 mb-4">
								{/* Símbolo único de civilización */}
								<div className="flex flex-col items-center">
									<div className="w-14 h-14 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg">
										<SimboloCivilizacion 
											civId={selectedNode.id} 
											size={40} 
											fallbackEmoji={selectedNode.emoji}
										/>
									</div>
									{civilizationSymbols[selectedNode.id] && (
										<span className="text-[10px] text-neutral-400 mt-1">símbolo único</span>
									)}
								</div>
								<div className="flex-1">
									<StandardText preset="heading" size="lg">
										{selectedNode.name}
									</StandardText>
									{selectedNode.subtitle && (
										<StandardText size="sm" colorScheme="neutral">
											{selectedNode.subtitle}
										</StandardText>
									)}
								</div>
							</div>

							{/* 📅 Período temporal */}
							{(() => {
								const civData = nexusData.civilizations.find(c => c.id === selectedNode.id);
								if (!civData) return null;
								const startYear = civData.startBCE ? `${civData.startBCE} BCE` : `${civData.startCE} CE`;
								const endYear = civData.endBCE ? `${civData.endBCE} BCE` : `${civData.endCE} CE`;
								return (
									<div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg">
										<StandardText size="xs" colorScheme="neutral" className="mb-1">
											📅 PERÍODO
										</StandardText>
										<StandardText size="lg" weight="bold">
											{startYear} → {endYear}
										</StandardText>
									</div>
								);
							})()}

							{/* Botones de acción */}
							<div className="grid grid-cols-2 gap-2 mb-4">
								{/* 👻 Ghost Mode Toggle */}
								<button
									onClick={() => toggleGhostNode(selectedNode.id)}
									className={`p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm ${
										ghostNodes.has(selectedNode.id)
											? "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
											: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
									}`}
								>
									<span>{ghostNodes.has(selectedNode.id) ? "👻" : "👁️"}</span>
									<span className="font-medium">
										{ghostNodes.has(selectedNode.id) ? "Ghost" : "Fantasma"}
									</span>
								</button>
  <StandardButton
    onClick={() => setShowCalibrationPanel(true)}
    colorScheme="accent"
    styleType="outline"
    size="sm"
    className="w-full"
  >
    🌊 Calibrar F₀ de esta civilización
  </StandardButton>
								{/* 📋 Copiar Markdown */}
								<button
									onClick={() => {
										const civData = nexusData.civilizations.find(c => c.id === selectedNode.id);
										if (civData) {
											const md = generateMarkdown(selectedNode, civData as unknown as Record<string, unknown>);
											navigator.clipboard.writeText(md);
											// Feedback visual
											const btn = document.getElementById("copy-md-btn");
											if (btn) {
												btn.textContent = "✅ Copiado!";
												setTimeout(() => { btn.textContent = "📋 Copiar MD"; }, 2000);
											}
										}
									}}
									id="copy-md-btn"
									className="p-2 rounded-lg flex items-center justify-center gap-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 transition-colors text-sm"
								>
									📋 Copiar MD
								</button>
							</div>
{/* 🌊 Panel de Calibración F₀ */}
{showCalibrationPanel && selectedNode && (
  <div className="mb-4 p-3 border border-accent-200 dark:border-accent-800 rounded-lg bg-accent-50/40 dark:bg-accent-900/20">
    <NexusCalibrationPanel
      itemType="civilization"
      itemId={selectedNode.id}
      itemName={selectedNode.name}
      researcherId=""
      onCalibrationComplete={() => setShowCalibrationPanel(false)}
    />
  </div>
)}
							{/* Stats */}
							<div className="grid grid-cols-2 gap-3 mb-4">
								<div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
									<StandardText size="xs" colorScheme="neutral">
										GENERACIONES
									</StandardText>
									<StandardText size="xl" weight="bold">
										{selectedNode.generations}
									</StandardText>
								</div>
								<div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
									<StandardText size="xs" colorScheme="neutral">
										AÑOS
									</StandardText>
									<StandardText size="xl" weight="bold">
										~{(selectedNode.generations || 0) * 25}
									</StandardText>
								</div>
							</div>

							{/* Tecnologías */}
							{selectedNode.technologies && selectedNode.technologies.length > 0 && (
								<div className="mb-4">
									<StandardText size="sm" weight="semibold" className="mb-2">
										🔧 Tecnologías
									</StandardText>
									<div className="space-y-1">
										{selectedNode.technologies.map((tech, i) => (
											<div
												key={i}
												className="text-xs p-2 bg-primary-50 dark:bg-primary-900/20 rounded"
											>
												{tech}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Patrones */}
							{selectedNode.patternTags && selectedNode.patternTags.length > 0 && (
								<div className="mb-4">
									<StandardText size="sm" weight="semibold" className="mb-2">
										🔗 Patrones
									</StandardText>
									<div className="flex flex-wrap gap-1">
										{selectedNode.patternTags.map((tag, i) => (
											<span
												key={i}
												className="text-xs px-2 py-1 bg-accent-100 dark:bg-accent-900/30 rounded-full"
												onMouseEnter={() => setHoveredPattern(tag)}
												onMouseLeave={() => setHoveredPattern(null)}
											>
												{tag}
											</span>
										))}
									</div>
								</div>
							)}

							{/* Glitch Type */}
							{selectedNode.glitchType && (
								<div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
									<StandardText size="xs" weight="semibold" colorScheme="warning">
										⚡ GLITCH: {selectedNode.glitchType}
									</StandardText>
								</div>
							)}

							{/* Anomalía */}
							{selectedNode.anomalyLevel === "critical" && (
								<div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg animate-pulse">
									<StandardText size="xs" weight="semibold" colorScheme="danger">
										🚨 ANOMALÍA CRÍTICA F1
									</StandardText>
								</div>
							)}

							{/* Cerrar */}
							<button
								onClick={() => setSelectedNode(null)}
								className="w-full mt-4 p-2 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
							>
								Cerrar ✕
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* 📜 Modal Leyenda de Simbología */}
			<AnimatePresence>
				{showLeyenda && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
						onClick={() => setShowLeyenda(false)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-bold text-lg">📜 Leyenda de Simbología</h3>
								<button 
									onClick={() => setShowLeyenda(false)}
									className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
								>
									✕
								</button>
							</div>
							
							{/* Iconos por Tipo */}
							<div className="mb-5">
								<h4 className="font-semibold text-sm mb-3 text-neutral-600 dark:text-neutral-400">🎨 Iconos por Tipo</h4>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div className="flex items-center gap-2">
										<IconoNexus tipo="piramide" size={20} color="#2C3E50" />
										<span>Monumentales</span>
									</div>
									<div className="flex items-center gap-2">
										<IconoNexus tipo="espiral" size={20} color="#9B59B6" />
										<span>Glitches/Anomalías</span>
									</div>
									<div className="flex items-center gap-2">
										<IconoNexus tipo="ojo" size={20} color="#E74C3C" />
										<span>Conocimiento Oculto</span>
									</div>
									<div className="flex items-center gap-2">
										<IconoNexus tipo="sol" size={20} color="#F1C40F" />
										<span>Astronomía</span>
									</div>
									<div className="flex items-center gap-2">
										<IconoNexus tipo="ondas" size={20} color="#3498DB" />
										<span>Marítimos</span>
									</div>
									<div className="flex items-center gap-2">
										<IconoNexus tipo="libro" size={20} color="#27AE60" />
										<span>Educación/Biblioteca</span>
									</div>
								</div>
							</div>
							
							{/* Tamaño = Longevidad */}
							<div className="mb-5">
								<h4 className="font-semibold text-sm mb-3 text-neutral-600 dark:text-neutral-400">🔵 Tamaño = Longevidad</h4>
								<div className="flex items-center gap-4 text-sm">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-neutral-400"></div>
										<span>&lt;200 años</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-neutral-500"></div>
										<span>200-500</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-5 h-5 rounded-full bg-neutral-600"></div>
										<span>500-1000</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-amber-300"></div>
										<span>1000+</span>
									</div>
								</div>
							</div>
							
							{/* Colores */}
							<div className="mb-5">
								<h4 className="font-semibold text-sm mb-3 text-neutral-600 dark:text-neutral-400">🎨 Colores por Patrón</h4>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-[#FF6B6B]"></div>
										<span>Colapso</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-[#4ECDC4]"></div>
										<span>Abundancia</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-[#FFE66D]"></div>
										<span>Glitch</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-[#A8E6CF]"></div>
										<span>Astronomía</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-[#9B59B6]"></div>
										<span>Megalitismo</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full bg-[#95A5A6]"></div>
										<span>Neutro</span>
									</div>
								</div>
							</div>
							
							{/* Interacción */}
							<div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
								<h4 className="font-semibold text-sm mb-2 text-neutral-600 dark:text-neutral-400">👻 Interacción</h4>
								<ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
									<li>• <strong>Click en nodo</strong> → ver detalle</li>
									<li>• <strong>Botón Fantasma</strong> → atenuar nodo</li>
									<li>• <strong>Copiar MD</strong> → exportar datos</li>
								</ul>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default MapaTemporal;
