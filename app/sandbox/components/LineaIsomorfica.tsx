// 📍 app/sandbox/components/LineaIsomorfica.tsx
// 🔗 Conexiones isomórficas entre nodos civilizatorios
// v0.01 - Hipatia Nexus

"use client";

import React from "react";
import { motion } from "framer-motion";

interface LineaIsomorficaProps {
	source: { x: number; y: number };
	target: { x: number; y: number };
	pattern: string;
	strength?: number;
	isHighlighted?: boolean;
}

// 🎨 Colores por patrón isomórfico
const getPatternColor = (pattern: string): string => {
	const colors: Record<string, string> = {
		megalitismo_precision: "#9B59B6",    // Morado
		megalitismo: "#9B59B6",
		megalitos: "#9B59B6",
		momificacion: "#16A085",              // Verde azulado
		astronomia_precision: "#F39C12",     // Naranja
		astronomia: "#F39C12",
		piramides_escalonadas: "#E74C3C",    // Rojo
		piramides: "#E74C3C",
		escritura_alternativa: "#3498DB",    // Azul
		escritura: "#3498DB",
		precision: "#1ABC9C",                // Turquesa
		cero: "#9B59B6",                     // Morado
	};
	return colors[pattern] || "#95A5A6";
};

// 🏷️ Emoji por patrón
const getPatternEmoji = (pattern: string): string => {
	const emojis: Record<string, string> = {
		megalitismo_precision: "🪨",
		megalitismo: "🪨",
		megalitos: "🪨",
		momificacion: "💀",
		astronomia_precision: "⭐",
		astronomia: "⭐",
		piramides_escalonadas: "🔺",
		piramides: "🔺",
		escritura_alternativa: "✍️",
		escritura: "✍️",
		precision: "📐",
		cero: "0️⃣",
	};
	return emojis[pattern] || "🔗";
};

export function LineaIsomorfica({
	source,
	target,
	pattern,
	strength = 1,
	isHighlighted = false,
}: LineaIsomorficaProps) {
	const color = getPatternColor(pattern);
	
	// Calcular punto medio para el label
	const midX = (source.x + target.x) / 2;
	const midY = (source.y + target.y) / 2;

	return (
		<g>
			{/* Línea de conexión */}
			<motion.line
				x1={source.x}
				y1={source.y}
				x2={target.x}
				y2={target.y}
				stroke={color}
				strokeWidth={isHighlighted ? strength * 3 : strength * 1.5}
				strokeDasharray={strength < 0.7 ? "8,4" : "none"}
				opacity={isHighlighted ? 0.8 : 0.25}
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.5 }}
				style={{ pointerEvents: "none" }}
			/>
			
			{/* Emoji en el punto medio (solo si highlighted) */}
			{isHighlighted && (
				<motion.text
					x={midX}
					y={midY}
					textAnchor="middle"
					fontSize="14"
					style={{ pointerEvents: "none" }}
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3 }}
				>
					{getPatternEmoji(pattern)}
				</motion.text>
			)}
		</g>
	);
}

export default LineaIsomorfica;
