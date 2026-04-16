// 📍 app/sandbox/SandboxClient.tsx
// 🍄👁️ Nexus Cronológico v2.1 - Cliente del Sandbox
// 🧬 57.3° = 1 radián = ángulo del Jardín

"use client";

import { useState, useEffect } from "react";
import { MapaTemporal } from "./components/MapaTemporal";
import { NexusEmptyState } from "./components/NexusEmptyState";
import { checkNexusDataV2Action, getRegionsAction } from "@/lib/actions/nexus-v2-actions";

interface SandboxClientProps {
	projectId: string;
	projectName?: string;
	canManageMasterData: boolean;
}

export function SandboxClient({ projectId, projectName, canManageMasterData }: SandboxClientProps) {
	const [dataStatus, setDataStatus] = useState<"loading" | "empty" | "loaded">("loading");
	const [refreshKey, setRefreshKey] = useState(0);
	const [nodeCount, setNodeCount] = useState(0);

	// Verificar si hay datos al cargar
	useEffect(() => {
		const checkData = async () => {
			try {
				// Primero verificar que hay regiones (indica schema v2 activo)
				const regionsResult = await getRegionsAction();
				if (!regionsResult.success) {
					console.warn("Schema v2 no encontrado, mostrando estado vacío");
					setDataStatus("empty");
					return;
				}
				
				// Verificar nodos del proyecto
				const result = await checkNexusDataV2Action(projectId);
				if (result.success) {
					setNodeCount(result.data.count);
					setDataStatus(result.data.hasData ? "loaded" : "empty");
					console.log("🌱 Nodos por madurez:", result.data.byMaturity);
				} else {
					console.error("Error verificando nodos:", result.error);
					setDataStatus("empty");
				}
			} catch (err) {
				console.error("Error verificando datos:", err);
				setDataStatus("empty");
			}
		};
		checkData();
	}, [refreshKey, projectId]);

	// Callback cuando se cargan datos
	const handleDataLoaded = () => {
		setRefreshKey(prev => prev + 1);
	};

	// Estado de carga
	if (dataStatus === "loading") {
		return (
			<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
				<div className="text-center">
					<div className="text-4xl mb-4 animate-pulse">🍄👁️</div>
					<p className="text-neutral-500">Conectando al Nexus...</p>
					{projectName && (
						<p className="text-xs text-neutral-400 mt-2">Proyecto: {projectName}</p>
					)}
				</div>
			</div>
		);
	}

	// Estado vacío - mostrar cargador
	if (dataStatus === "empty") {
		return (
			<NexusEmptyState 
				onDataLoaded={handleDataLoaded} 
				projectId={projectId}
				canManageMasterData={canManageMasterData}
			/>
		);
	}

	// Datos cargados - mostrar mapa
	// TODO: Actualizar MapaTemporal para usar projectId
	return (
		<div>
			{/* Header con info del proyecto */}
			<div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 flex justify-between items-center">
				<span>🍄 {projectName || "Nexus"} • {nodeCount} nodos</span>
				<span className="text-xs">🧬 Calibración Radián v2.1</span>
			</div>
			<MapaTemporal key={refreshKey} />
		</div>
	);
}
