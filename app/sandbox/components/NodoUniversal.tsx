// 📍 app/sandbox/components/NodoUniversal.tsx
// 🍄👁️ Componente Universal - Un nodo es una lente, no una caja
// v0.03 - Hipatia Nexus - Mock Estabilizado
// 
// 🎨 NOTA: Colores actualmente hardcodeados para mock.
// Para conectar con tematización, usar: app/sandbox/hooks/useNexusColors.ts
// Ver: lib/theme/harmonic-colors.ts para sistema de colores armónicos

"use client";

import React from "react";
import { motion } from "framer-motion";
import { IconoNexus, getIconoNexus } from "./IconosNexus";

export type VisualMode = "minimal" | "detail" | "full";

export interface NodoData {
	id: string;
	name: string;
	emoji?: string;
	subtitle?: string;
	generations?: number;
	patternTags?: string[];
	glitchType?: string;
	anomalyLevel?: "low" | "medium" | "high" | "critical";
	type?: string;
	location?: { region?: string; lat?: number; lon?: number };
	technologies?: string[];
	dateRange?: string;
	collapse?: { date?: string; method?: string; theory?: string };
	worldFirst?: boolean;
	worldFirstLabel?: string;
}

interface NodoUniversalProps {
	data: NodoData;
	position: { x: number; y: number };
	onInteract: (data: NodoData) => void;
	visualMode: VisualMode;
	isSelected?: boolean;
	isHighlighted?: boolean;
	isGhost?: boolean; // Modo fantasmal (semi-transparente)
}

// 👻 Abreviar nombre para modo minimal
const getShortName = (name: string): string => {
	if (name.length <= 8) return name;
	// Intentar abreviar por palabras
	const words = name.split(/[\s-]+/);
	if (words.length > 1) {
		return words.map(w => w[0]).join("").toUpperCase();
	}
	return name.substring(0, 6) + "…";
};

// 🎨 Colores por patrón (F0/F1, glitch, abundancia)
const getNodeColor = (data: NodoData): string => {
	if (data.patternTags?.includes("colapso_ecologico") || data.patternTags?.includes("rigidez_F1")) {
		return "#FF6B6B"; // Rojo - Colapso
	}
	if (data.type === "abundance_epoch" || data.patternTags?.includes("abundancia") || data.patternTags?.includes("diversidad")) {
		return "#4ECDC4"; // Azul - Abundancia
	}
	if (data.glitchType === "aparicion_prematura" || data.glitchType === "conocimiento_imposible") {
		return "#FFE66D"; // Amarillo - Glitch
	}
	if (data.patternTags?.includes("astronomia") || data.patternTags?.includes("astronomia_precision")) {
		return "#A8E6CF"; // Verde - Astronomía
	}
	if (data.patternTags?.includes("megalitos") || data.patternTags?.includes("megalitismo")) {
		return "#9B59B6"; // Morado - Megalitismo
	}
	if (data.anomalyLevel === "critical") {
		return "#E74C3C"; // Rojo intenso
	}
	return "#95A5A6"; // Gris neutro
};

// 📐 Tamaño según duración (escala logarítmica)
const getNodeSize = (data: NodoData): number => {
	const duration = data.generations || 10;
	const baseSize = 14;
	return baseSize + Math.log(duration + 1) * 5;
};

// 🏅 Escala de longevidad - civilizaciones que cruzaron umbrales notables
type LongevityTier = "legendary" | "ancient" | "established" | "young";

const getLongevityTier = (generations: number): LongevityTier => {
	const years = generations * 25;
	if (years >= 5000) return "legendary";    // 5000+ años
	if (years >= 2000) return "ancient";      // 2000-5000 años
	if (years >= 500) return "established";   // 500-2000 años
	return "young";                           // <500 años
};

// Estilos visuales por tier de longevidad
const tierStyles: Record<LongevityTier, {
	stroke: string;
	strokeWidth: number;
	fontWeight: string;
	genFontSize: number;
	showYears: boolean;
	glowEffect: boolean;
}> = {
	legendary: {
		stroke: "#FFD700",      // Dorado
		strokeWidth: 3,
		fontWeight: "900",
		genFontSize: 14,
		showYears: true,
		glowEffect: true,
	},
	ancient: {
		stroke: "#C0C0C0",      // Plata
		strokeWidth: 2.5,
		fontWeight: "700",
		genFontSize: 12,
		showYears: true,
		glowEffect: false,
	},
	established: {
		stroke: "#CD7F32",      // Bronce
		strokeWidth: 2,
		fontWeight: "600",
		genFontSize: 11,
		showYears: true,
		glowEffect: false,
	},
	young: {
		stroke: "#95A5A6",
		strokeWidth: 1.5,
		fontWeight: "500",
		genFontSize: 10,
		showYears: false,
		glowEffect: false,
	},
};

export function NodoUniversal({
	data,
	position,
	onInteract,
	visualMode,
	isSelected = false,
	isHighlighted = false,
	isGhost = false,
}: NodoUniversalProps) {
	const color = getNodeColor(data);
	const size = getNodeSize(data);
	const iconTipo = getIconoNexus(data.type, data.glitchType, data.patternTags);

	// 👻 Opacidad base según ghost mode
	const baseOpacity = isGhost ? 0.25 : 1;

	const handleClick = () => onInteract(data);

	// 🎭 MODO MINIMAL - Solo icono SVG + nombre abreviado
	if (visualMode === "minimal") {
		const shortName = getShortName(data.name);
		return (
			<motion.g
				onClick={handleClick}
				style={{ cursor: "pointer" }}
				whileHover={{ scale: 1.2 }}
				transition={{ duration: 0.2 }}
				opacity={baseOpacity}
			>
				{/* Fondo circular sutil */}
				<circle
					cx={position.x}
					cy={position.y}
					r={size}
					fill={color}
					opacity={isHighlighted ? 0.4 : 0.2}
					stroke={isSelected ? "#2C3E50" : color}
					strokeWidth={isSelected ? 2 : 0.5}
				/>
				{/* Icono SVG centrado */}
				<foreignObject
					x={position.x - size * 0.5}
					y={position.y - size * 0.5}
					width={size}
					height={size}
				>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
						<IconoNexus tipo={iconTipo} size={size * 0.7} color={color} />
					</div>
				</foreignObject>
				{/* Nombre abreviado */}
				<text
					x={position.x}
					y={position.y + size + 10}
					textAnchor="middle"
					fontSize="8"
					fill="#5D6D7E"
					fontWeight="500"
					style={{ pointerEvents: "none" }}
				>
					{shortName}
				</text>
			</motion.g>
		);
	}

	const tier = getLongevityTier(data.generations || 0);
	const tierStyle = tierStyles[tier];
	const years = (data.generations || 0) * 25;

	if (visualMode === "detail") {
		return (
			<motion.g 
				onClick={handleClick} 
				style={{ cursor: "pointer" }}
				whileHover={{ scale: 1.1 }}
				opacity={baseOpacity}
			>
				{/* Glow effect para legendary (no en ghost mode) */}
				{tierStyle.glowEffect && !isGhost && (
					<circle
						cx={position.x}
						cy={position.y}
						r={size + 6}
						fill="none"
						stroke="#FFD700"
						strokeWidth={2}
						opacity={0.4}
						filter="url(#glow)"
					/>
				)}
				<circle
					cx={position.x}
					cy={position.y}
					r={size}
					fill={color}
					opacity={isHighlighted ? 1 : 0.85}
					stroke={isSelected ? "#2C3E50" : tierStyle.stroke}
					strokeWidth={isSelected ? 3 : tierStyle.strokeWidth}
				/>
				{/* Emoji */}
				<text
					x={position.x}
					y={position.y + 5}
					textAnchor="middle"
					fontSize={size * 0.85}
					style={{ pointerEvents: "none" }}
				>
					{data.emoji || "🔵"}
				</text>
				{/* Nombre */}
				<text
					x={position.x}
					y={position.y - size - 10}
					textAnchor="middle"
					fontSize="12"
					fontWeight={tierStyle.fontWeight}
					fill="#2C3E50"
					style={{ pointerEvents: "none" }}
				>
					{data.name}
				</text>
				{/* GENERACIONES - PROMINENTE */}
				<text
					x={position.x}
					y={position.y - size - 24}
					textAnchor="middle"
					fontSize={tierStyle.genFontSize}
					fontWeight="bold"
					fill={tier === "legendary" ? "#B8860B" : tier === "ancient" ? "#708090" : "#5D6D7E"}
					style={{ pointerEvents: "none" }}
				>
					{data.generations} gen
				</text>
				{/* Años para tiers establecidos+ */}
				{tierStyle.showYears && (
					<text
						x={position.x}
						y={position.y - size - 38}
						textAnchor="middle"
						fontSize="9"
						fill="#95A5A6"
						style={{ pointerEvents: "none" }}
					>
						~{years.toLocaleString()} años
					</text>
				)}
				{/* 🏆 WORLD FIRST BADGE */}
				{data.worldFirst && (
					<g>
						<rect
							x={position.x - 50}
							y={position.y + size + 8}
							width={100}
							height={18}
							rx={9}
							fill="#FFD700"
							stroke="#B8860B"
							strokeWidth={1}
						/>
						<text
							x={position.x}
							y={position.y + size + 20}
							textAnchor="middle"
							fontSize="9"
							fontWeight="bold"
							fill="#5D4E0B"
							style={{ pointerEvents: "none" }}
						>
							🏆 PRIMERO MUNDIAL
						</text>
					</g>
				)}
			</motion.g>
		);
	}

	// Full mode
	return (
		<motion.g 
			onClick={handleClick} 
			style={{ cursor: "pointer" }}
			whileHover={{ scale: 1.05 }}
			opacity={baseOpacity}
		>
			{/* Halo de selección (no en ghost mode) */}
			{isSelected && !isGhost && (
				<circle
					cx={position.x}
					cy={position.y}
					r={size + 8}
					fill="none"
					stroke={color}
					strokeWidth={2}
					opacity={0.5}
					strokeDasharray="4,2"
				/>
			)}
			{/* Nodo principal */}
			<circle
				cx={position.x}
				cy={position.y}
				r={size}
				fill={color}
				stroke="#2C3E50"
				strokeWidth={isSelected ? 3 : 1.5}
				opacity={0.9}
			/>
			{/* Emoji */}
			<text
				x={position.x}
				y={position.y + 5}
				textAnchor="middle"
				fontSize={size}
				style={{ pointerEvents: "none" }}
			>
				{data.emoji || "🔵"}
			</text>
			{/* Nombre */}
			<text
				x={position.x}
				y={position.y - size - 12}
				textAnchor="middle"
				fontSize="13"
				fontWeight="bold"
				fill="#2C3E50"
				style={{ pointerEvents: "none" }}
			>
				{data.name}
			</text>
			{/* Generaciones */}
			<text
				x={position.x}
				y={position.y - size - 26}
				textAnchor="middle"
				fontSize="10"
				fill="#7F8C8D"
				style={{ pointerEvents: "none" }}
			>
				{data.generations} gen.
			</text>
			{/* Indicador de anomalía */}
			{data.anomalyLevel === "critical" && (
				<motion.circle
					cx={position.x + size - 2}
					cy={position.y - size + 2}
					r={6}
					fill="#E74C3C"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 1 }}
				/>
			)}
		</motion.g>
	);
}

export default NodoUniversal;
