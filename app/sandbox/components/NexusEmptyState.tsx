// 📍 app/sandbox/components/NexusEmptyState.tsx
// 🍄👁️ Estado vacío del Nexus con carga de JSON
// v2.1 - Nexus Cronológico con Calibración Radián
// 🧬 57.3° = 1 rad = Ángulo del Jardín

"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { loadJsonToNexusV2Action, type NexusJsonData } from "@/lib/actions/nexus-v2-actions";

// JSON de ejemplo incluido en el repo
import defaultNexusData from "../data/hipatia-nexus.json";

interface NexusEmptyStateProps {
	onDataLoaded: () => void;
	projectId: string;
	canManageMasterData: boolean;
}

interface LoadResult {
	success: boolean;
	message: string;
	stats?: { regions: number; nodes: number; isomorphisms: number };
	error?: string;
}

export function NexusEmptyState({ onDataLoaded, projectId, canManageMasterData }: NexusEmptyStateProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<LoadResult | null>(null);
	const [showUpload, setShowUpload] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Cargar el JSON default del repo
	const handleLoadDefault = async () => {
		setIsLoading(true);
		setResult(null);
		
		try {
			// Transformar civilizaciones del JSON a nodos epistémicos v2
			const jsonData: NexusJsonData = {
				nodes: defaultNexusData.civilizations.map(c => ({
					slug: c.id,
					name: c.name,
					emoji: c.emoji,
					subtitle: c.subtitle,
					year_start: c.startBCE ? -c.startBCE : c.startCE,
					year_end: c.endBCE ? -c.endBCE : (c.endCE ?? undefined),
					region_id: c.regionId,
					latitude: c.location?.lat,
					longitude: c.location?.lon,
					node_type: c.type === "civilization" ? "civilization" : "research",
					maturity: "seed_white", // Default: sin clasificar
					anomaly_level: c.anomalyLevel as "none" | "low" | "medium" | "high" | "critical" | undefined,
					official_narrative: c.officialNarrative,
					counter_narrative: c.evidenceContradiction,
					description: c.anomaly,
					is_foundational: c.worldFirst,
					foundational_label: c.worldFirstLabel,
					tags: c.patternTags,
				})),
				isomorphisms: defaultNexusData.isomorphisms.map(i => ({
					slug: i.id,
					name: i.name,
					description: i.description,
					icon: i.emoji,
					nodes: i.nodes, // Slugs de nodos conectados
				})),
				// Extraer tags únicos de los nodos
				tags: Array.from(new Set(
					defaultNexusData.civilizations.flatMap(c => c.patternTags || [])
				)).map(tag => ({
					slug: tag,
					name: tag.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
				})),
			};

			const actionResult = await loadJsonToNexusV2Action(projectId, jsonData);
			
			if (actionResult.success) {
				setResult({
					success: true,
					message: actionResult.data.message,
					stats: actionResult.data.stats,
				});
				setTimeout(() => onDataLoaded(), 1500);
			} else {
				setResult({
					success: false,
					message: "Error en la carga",
					error: actionResult.error,
				});
			}
		} catch (error) {
			setResult({
				success: false,
				message: "Error al cargar",
				error: error instanceof Error ? error.message : "Error desconocido",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Cargar un JSON personalizado
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsLoading(true);
		setResult(null);

		try {
			const text = await file.text();
			const jsonData = JSON.parse(text) as NexusJsonData;
			
			const actionResult = await loadJsonToNexusV2Action(projectId, jsonData);
			
			if (actionResult.success) {
				setResult({
					success: true,
					message: actionResult.data.message,
					stats: actionResult.data.stats,
				});
				setTimeout(() => onDataLoaded(), 1500);
			} else {
				setResult({
					success: false,
					message: "Error en la carga",
					error: actionResult.error,
				});
			}
		} catch (error) {
			setResult({
				success: false,
				message: "Error al parsear JSON",
				error: error instanceof Error ? error.message : "Formato inválido",
			});
		} finally {
			setIsLoading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-8">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="max-w-lg w-full"
			>
				<StandardCard className="p-8 text-center">
					{/* Header */}
					<div className="mb-8">
						<motion.div
							animate={{ rotate: [0, 5, -5, 0] }}
							transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
							className="text-6xl mb-4"
						>
							🍄👁️
						</motion.div>
						<StandardText preset="heading" size="2xl" className="mb-2">
							Hipatia Nexus
						</StandardText>
						<StandardText size="sm" colorScheme="neutral">
							El jardín está vacío. Planta las primeras semillas.
						</StandardText>
					</div>

					{/* Botones de acción o mensaje de permisos */}
					{!canManageMasterData ? (
						<div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
							<p className="text-amber-800 dark:text-amber-200 text-sm">
								🔒 Se requiere permiso <strong>can_manage_master_data</strong> para cargar datos al Nexus.
							</p>
							<p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
								Contacta al administrador del proyecto para obtener acceso.
							</p>
						</div>
					) : (
					<div className="space-y-4">
						{/* Cargar datos default */}
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleLoadDefault}
							disabled={isLoading}
							className={`
								w-full p-4 rounded-xl font-medium transition-all
								${isLoading 
									? "bg-neutral-200 dark:bg-neutral-800 cursor-wait" 
									: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg"
								}
							`}
						>
							{isLoading ? (
								<span className="flex items-center justify-center gap-2">
									<motion.span
										animate={{ rotate: 360 }}
										transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
									>
										⏳
									</motion.span>
									Cargando...
								</span>
							) : (
								<span className="flex items-center justify-center gap-2">
									🌱 Cargar Nodos v2.1
									<span className="text-xs opacity-75">(27 nodos)</span>
								</span>
							)}
						</motion.button>

						{/* Separador */}
						<div className="flex items-center gap-4">
							<div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
							<span className="text-xs text-neutral-400">o</span>
							<div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
						</div>

						{/* Cargar JSON personalizado */}
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setShowUpload(!showUpload)}
							disabled={isLoading}
							className="w-full p-3 rounded-xl font-medium border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
						>
							<span className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
								📁 Cargar JSON personalizado
							</span>
						</motion.button>

						{/* Input de archivo (expandible) */}
						<AnimatePresence>
							{showUpload && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									className="overflow-hidden"
								>
									<input
										ref={fileInputRef}
										type="file"
										accept=".json"
										onChange={handleFileUpload}
										className="w-full p-3 text-sm border rounded-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
									/>
									<p className="text-xs text-neutral-500 mt-2">
										El JSON debe tener la estructura: {`{ nodes, isomorphisms, tags }`}
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					)}

					{/* Resultado */}
					<AnimatePresence>
						{result && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className={`mt-6 p-4 rounded-lg ${
									result.success 
										? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
										: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
								}`}
							>
								<div className="flex items-center gap-2 mb-1">
									<span>{result.success ? "✅" : "❌"}</span>
									<span className="font-medium">{result.message}</span>
								</div>
								{result.stats && (
									<p className="text-xs text-neutral-600 dark:text-neutral-400">
										{result.stats.nodes} nodos • {result.stats.isomorphisms} isomorfismos
									</p>
								)}
								{result.error && (
									<p className="text-xs text-red-600 dark:text-red-400 mt-1">
										{result.error}
									</p>
								)}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Footer */}
					<div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
						<StandardText size="xs" colorScheme="neutral">
							🧬 Los datos se guardarán en Supabase y estarán disponibles para validación.
						</StandardText>
					</div>
				</StandardCard>
			</motion.div>
		</div>
	);
}

export default NexusEmptyState;
