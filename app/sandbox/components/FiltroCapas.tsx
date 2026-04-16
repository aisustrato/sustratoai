// 📍 app/sandbox/components/FiltroCapas.tsx
// 🎛️ Panel de control de capas visuales
// v0.01 - Hipatia Nexus

"use client";

import React from "react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import type { VisualMode } from "./NodoUniversal";

export interface Filters {
	showMegalitismo: boolean;
	showAstronomia: boolean;
	showColapsos: boolean;
	showGlitches: boolean;
	showAbundancia: boolean;
}

interface FiltroCapasProps {
	filters: Filters;
	setFilters: React.Dispatch<React.SetStateAction<Filters>>;
	visualMode: VisualMode;
	setVisualMode: (mode: VisualMode) => void;
}

// 🏷️ Definición de capas
const CAPAS = [
	{ key: "showMegalitismo", emoji: "🪨", label: "Megalitismo", color: "#9B59B6" },
	{ key: "showAstronomia", emoji: "⭐", label: "Astronomía", color: "#F39C12" },
	{ key: "showColapsos", emoji: "💥", label: "Colapsos", color: "#E74C3C" },
	{ key: "showGlitches", emoji: "⚡", label: "Glitches", color: "#FFE66D" },
	{ key: "showAbundancia", emoji: "🌸", label: "Abundancia", color: "#4ECDC4" },
] as const;

// 🎚️ Modos visuales
const MODOS: { value: VisualMode; label: string; emoji: string }[] = [
	{ value: "minimal", label: "Mínimo", emoji: "○" },
	{ value: "detail", label: "Detalle", emoji: "◉" },
	{ value: "full", label: "Completo", emoji: "◈" },
];

export function FiltroCapas({
	filters,
	setFilters,
	visualMode,
	setVisualMode,
}: FiltroCapasProps) {
	const toggleFilter = (key: keyof Filters) => {
		setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	return (
		<div className="w-64 p-4 bg-neutral-900 text-white flex flex-col gap-4 overflow-y-auto">
			{/* Header */}
			<div className="text-center pb-4 border-b border-neutral-700">
				<StandardText preset="heading" size="lg" className="text-white">
					🍄👁️ Jardín
				</StandardText>
				<StandardText size="sm" className="text-neutral-400">
					Civilizatorio v0.01
				</StandardText>
				<StandardText size="xs" className="text-neutral-500 mt-1">
					NOSOTRAS 🌱
				</StandardText>
			</div>

			{/* Capas */}
			<div>
				<StandardText size="sm" weight="semibold" className="text-neutral-300 mb-3">
					📊 Capas Visibles
				</StandardText>
				<div className="space-y-2">
					{CAPAS.map((capa) => (
						<button
							key={capa.key}
							onClick={() => toggleFilter(capa.key as keyof Filters)}
							className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
								filters[capa.key as keyof Filters]
									? "bg-neutral-700"
									: "bg-neutral-800 opacity-50"
							}`}
						>
							<span
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: capa.color }}
							/>
							<span className="text-lg">{capa.emoji}</span>
							<span className="text-sm flex-1 text-left">{capa.label}</span>
							<span className="text-xs text-neutral-500">
								{filters[capa.key as keyof Filters] ? "✓" : "○"}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Modo Visual */}
			<div>
				<StandardText size="sm" weight="semibold" className="text-neutral-300 mb-3">
					🔍 Nivel Detalle
				</StandardText>
				<div className="flex gap-2">
					{MODOS.map((modo) => (
						<button
							key={modo.value}
							onClick={() => setVisualMode(modo.value)}
							className={`flex-1 p-2 rounded-lg text-center transition-all ${
								visualMode === modo.value
									? "bg-primary-600 text-white"
									: "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
							}`}
						>
							<div className="text-lg">{modo.emoji}</div>
							<div className="text-xs mt-1">{modo.label}</div>
						</button>
					))}
				</div>
			</div>

			{/* Leyenda */}
			<StandardCard
				colorScheme="neutral"
				styleType="subtle"
				className="p-3 bg-neutral-800 mt-auto"
			>
				<StandardText size="xs" weight="semibold" className="text-neutral-400 mb-2">
					🎨 Leyenda
				</StandardText>
				<div className="space-y-1 text-xs">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
						<span className="text-neutral-300">Colapso F1</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#4ECDC4]" />
						<span className="text-neutral-300">Abundancia F0</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#FFE66D]" />
						<span className="text-neutral-300">Glitch Fértil</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#A8E6CF]" />
						<span className="text-neutral-300">Astronomía</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#9B59B6]" />
						<span className="text-neutral-300">Megalitismo</span>
					</div>
				</div>
			</StandardCard>

			{/* Red Flags */}
			<div className="text-xs text-neutral-500 p-2 bg-neutral-800/50 rounded">
				<div className="font-semibold mb-1">🚩 Red Flags F1:</div>
				<div>• &quot;Primitivo&quot;</div>
				<div>• &quot;Coincidencia&quot;</div>
				<div>• &quot;Perdido&quot;</div>
			</div>
		</div>
	);
}

export default FiltroCapas;
