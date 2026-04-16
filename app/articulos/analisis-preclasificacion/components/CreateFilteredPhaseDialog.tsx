"use client";

import { useState } from "react";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Filter, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FilteredPhaseDimension {
	id: string;
	name: string;
	icon: string | null;
	options: Array<{ value: string; emoticon: string | null }>;
}

interface CreateFilteredPhaseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	sourcePhaseId: string;
	sourcePhaseName: string;
	/** Filtros activos de dimensión: { [dimensionId]: { [value]: "include" | "exclude" } } */
	activeFilters: Record<string, Record<string, "include" | "exclude">>;
	/** Filtros de confianza activos */
	confidenceFilter: number[];
	/** Todas las dimensiones disponibles (para mostrar nombres legibles) */
	dimensions: FilteredPhaseDimension[];
	/** Cantidad estimada de artículos que pasarán el filtro */
	estimatedCount?: number;
	/** Callback tras crear la fase exitosamente */
	onPhaseCreated?: () => void;
}

export function CreateFilteredPhaseDialog({
	open,
	onOpenChange,
	projectId,
	sourcePhaseId,
	sourcePhaseName,
	activeFilters,
	confidenceFilter,
	dimensions,
	estimatedCount,
	onPhaseCreated,
}: CreateFilteredPhaseDialogProps) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	// Construir resumen legible de los filtros activos
	const filterSummary = Object.entries(activeFilters).map(
		([dimId, filterMap]) => {
			const dim = dimensions.find((d) => d.id === dimId);
			const dimName = dim?.name || "Dimensión desconocida";

			const includes = Object.entries(filterMap)
				.filter(([, mode]) => mode === "include")
				.map(([val]) => val);
			const excludes = Object.entries(filterMap)
				.filter(([, mode]) => mode === "exclude")
				.map(([val]) => val);

			return { dimId, dimName, includes, excludes };
		},
	);

	const confidenceLabels: Record<number, string> = {
		1: "Baja",
		2: "Media",
		3: "Alta",
	};

	// Generar nombre sugerido automáticamente
	const suggestedName = (() => {
		const parts: string[] = [];
		filterSummary.forEach((f) => {
			if (f.includes.length > 0) {
				parts.push(f.includes.join(" + "));
			}
		});
		if (parts.length > 0) return `Fase filtrada: ${parts.join(", ")}`;
		return `Fase filtrada desde ${sourcePhaseName}`;
	})();

	// Generar descripción automática de los filtros aplicados
	const autoDescription = (() => {
		const lines: string[] = [
			`Fase derivada de "${sourcePhaseName}" con filtros aplicados:`,
		];
		filterSummary.forEach((f) => {
			if (f.includes.length > 0) {
				lines.push(`  ✅ ${f.dimName}: ${f.includes.join(", ")}`);
			}
			if (f.excludes.length > 0) {
				lines.push(`  ❌ ${f.dimName} (excluidos): ${f.excludes.join(", ")}`);
			}
		});
		if (confidenceFilter.length > 0) {
			lines.push(
				`  🎯 Confianza: ${confidenceFilter.map((c) => confidenceLabels[c] || c).join(", ")}`,
			);
		}
		return lines.join("\n");
	})();

	const handleCreate = async () => {
		const finalName = name.trim() || suggestedName;
		const finalDescription = description.trim() || autoDescription;

		if (!finalName) {
			toast.error("El nombre de la fase es requerido");
			return;
		}

		setIsCreating(true);

		try {
			const payload = {
				projectId,
				sourcePhaseId,
				name: finalName,
				description: finalDescription,
				filters: {
					dimensions: activeFilters,
					confidence:
						confidenceFilter.length > 0 ? confidenceFilter : undefined,
				},
			};

			console.log("🔍 [UI] Creando fase filtrada:", payload);

			const response = await fetch(
				"/api/preclassification/phases/create-filtered",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);

			console.log("📡 [UI] Response status:", response.status);

			const result = await response.json();
			console.log("📡 [UI] Response data:", result);

			if (!result.success) {
				console.error("❌ [UI] Error del servidor:", result.error);
				toast.error(result.error || "Error al crear fase filtrada");
				return;
			}

			console.log("✅ [UI] Fase filtrada creada:", result.data);

			toast.success(
				`Fase "${finalName}" creada con ${result.data.articlesCount} artículos`,
			);

			// Cerrar dialog
			onOpenChange(false);

			// Resetear form
			setName("");
			setDescription("");

			// Redirigir a configuración de dimensiones de la nueva fase
			toast.info("Ahora puedes configurar las dimensiones de la nueva fase");

			// Recargar página para ver nueva fase
			router.refresh();

			// Callback opcional
			onPhaseCreated?.();
		} catch (error) {
			console.error("❌ [UI] Error al crear fase filtrada:", error);
			toast.error("Error inesperado al crear fase");
		} finally {
			setIsCreating(false);
		}
	};

	const hasFilters =
		Object.keys(activeFilters).length > 0 || confidenceFilter.length > 0;

	if (!hasFilters) return null;

	return (
		<StandardDialog open={open} onOpenChange={onOpenChange}>
			<StandardDialog.Content>
				<StandardDialog.Header>
					<StandardDialog.Title>
						Crear Fase desde Selección
					</StandardDialog.Title>
					<StandardDialog.Description>
						Se creará una nueva fase con el subconjunto de artículos que cumplen
						los filtros activos.
					</StandardDialog.Description>
				</StandardDialog.Header>

				<StandardDialog.Body>
					<div className="space-y-6">
						{/* Linaje */}
						<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900/50">
							<div className="flex items-center gap-2">
								<Layers className="h-4 w-4 text-primary-500" />
								<StandardText size="sm" weight="semibold">
									Linaje de Fases
								</StandardText>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<StandardText size="sm" colorShade="subtle">
										Fase origen:
									</StandardText>
									<StandardBadge size="sm" colorScheme="primary">
										{sourcePhaseName}
									</StandardBadge>
								</div>

								<div className="flex items-center justify-between">
									<StandardText size="sm" colorShade="subtle">
										Artículos estimados:
									</StandardText>
									<StandardBadge size="sm" colorScheme="accent">
										{estimatedCount || "Calculando..."} artículos
									</StandardBadge>
								</div>
							</div>

							<div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
								<StandardText size="xs" colorShade="subtle">
									🔍 La nueva fase heredará solo los artículos que cumplen los
									filtros seleccionados. El linaje quedará registrado
									automáticamente.
								</StandardText>
							</div>
						</div>

						{/* Resumen de filtros */}
						<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900/50">
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-accent-500" />
								<StandardText size="sm" weight="semibold">
									Filtros Aplicados
								</StandardText>
							</div>

							{filterSummary.map((f) => (
								<div key={f.dimId} className="space-y-2">
									<StandardText size="xs" weight="medium" colorShade="subtle">
										{f.dimName}
									</StandardText>
									<div className="flex flex-wrap gap-1">
										{f.includes.map((val) => (
											<StandardBadge
												key={`inc-${val}`}
												size="sm"
												colorScheme="success"
												styleType="solid">
												✅ {val}
											</StandardBadge>
										))}
										{f.excludes.map((val) => (
											<StandardBadge
												key={`exc-${val}`}
												size="sm"
												colorScheme="danger"
												styleType="solid">
												❌ {val}
											</StandardBadge>
										))}
									</div>
								</div>
							))}

							{confidenceFilter.length > 0 && (
								<div className="space-y-2">
									<StandardText size="xs" weight="medium" colorShade="subtle">
										Nivel de Confianza
									</StandardText>
									<div className="flex flex-wrap gap-1">
										{confidenceFilter.map((level) => (
											<StandardBadge
												key={`conf-${level}`}
												size="sm"
												colorScheme="warning"
												styleType="solid">
												🎯 {confidenceLabels[level] || level}
											</StandardBadge>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Formulario */}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Nombre de la nueva fase{" "}
									<span className="text-danger-500">*</span>
								</label>
								<input
									type="text"
									className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
									placeholder={suggestedName}
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
								<StandardText size="xs" colorShade="subtle">
									Dejar vacío para usar el nombre sugerido automáticamente
								</StandardText>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">
									Descripción (opcional)
								</label>
								<textarea
									className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
									placeholder={autoDescription}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={3}
								/>
								<StandardText size="xs" colorShade="subtle">
									Se incluirán automáticamente los filtros aplicados en la
									descripción
								</StandardText>
							</div>
						</div>

						{/* Advertencia */}
						<div className="rounded-lg border border-warning-200 dark:border-warning-800 p-3 bg-warning-50 dark:bg-warning-900/20">
							<div className="flex items-start gap-2">
								<AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5 flex-shrink-0" />
								<StandardText size="xs" colorShade="subtle">
									💡 <strong>Siguiente paso:</strong> Después de crear la fase,
									podrás configurar las dimensiones específicas para esta fase.
									Los artículos filtrados heredarán las clasificaciones
									existentes.
								</StandardText>
							</div>
						</div>
					</div>
				</StandardDialog.Body>

				<StandardDialog.Footer>
					<StandardDialog.Close asChild>
						<StandardButton styleType="outline">Cancelar</StandardButton>
					</StandardDialog.Close>
					<StandardButton
						colorScheme="accent"
						onClick={handleCreate}
						loading={isCreating}
						leftIcon={Filter}>
						Crear Fase Filtrada
					</StandardButton>
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
