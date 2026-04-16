"use client";

import { useState, useEffect } from "react";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { Check, X } from "lucide-react";
import * as LucideIcons from "lucide-react";

type DimensionWithPhase = {
	id: string;
	name: string;
	type: string;
	icon: string | null;
	phase_id: string;
	phase_name: string;
	phase_number: number;
	options: { value: string; emoticon: string | null }[];
};

type Phase = {
	id: string;
	name: string;
	phase_number: number;
};

interface DimensionSelectorPopupProps {
	isOpen: boolean;
	onClose: () => void;
	dimensions: DimensionWithPhase[];
	phases: Phase[];
	selectedDimensionIds: string[];
	onApply: (selectedIds: string[]) => void;
}

export function DimensionSelectorPopup({
	isOpen,
	onClose,
	dimensions,
	phases,
	selectedDimensionIds,
	onApply,
}: DimensionSelectorPopupProps) {
	const [localSelection, setLocalSelection] =
		useState<string[]>(selectedDimensionIds);

	useEffect(() => {
		setLocalSelection(selectedDimensionIds);
	}, [selectedDimensionIds, isOpen]);

	// Agrupar dimensiones por fase
	const dimensionsByPhase = phases.map((phase) => ({
		phase,
		dimensions: dimensions.filter((dim) => dim.phase_id === phase.id),
	}));

	const handleToggleDimension = (dimensionId: string) => {
		setLocalSelection((prev) =>
			prev.includes(dimensionId) ?
				prev.filter((id) => id !== dimensionId)
			:	[...prev, dimensionId],
		);
	};

	const handleTogglePhase = (phaseId: string) => {
		const phaseDimensions = dimensions.filter(
			(dim) => dim.phase_id === phaseId,
		);
		const phaseDimensionIds = phaseDimensions.map((dim) => dim.id);
		const allSelected = phaseDimensionIds.every((id) =>
			localSelection.includes(id),
		);

		if (allSelected) {
			// Deseleccionar todas las dimensiones de esta fase
			setLocalSelection((prev) =>
				prev.filter((id) => !phaseDimensionIds.includes(id)),
			);
		} else {
			// Seleccionar todas las dimensiones de esta fase
			setLocalSelection((prev) => {
				const newSelection = [...prev];
				phaseDimensionIds.forEach((id) => {
					if (!newSelection.includes(id)) {
						newSelection.push(id);
					}
				});
				return newSelection;
			});
		}
	};

	const handleSelectAll = () => {
		setLocalSelection(dimensions.map((dim) => dim.id));
	};

	const handleDeselectAll = () => {
		setLocalSelection([]);
	};

	const handleApply = () => {
		onApply(localSelection);
		onClose();
	};

	const handleCancel = () => {
		setLocalSelection(selectedDimensionIds);
		onClose();
	};

	// Helper para obtener el icono de una dimensión
	const getDimensionIcon = (iconName: string | null) => {
		if (!iconName) return null;
		try {
			const IconComponent = (LucideIcons as any)[iconName];
			return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
		} catch {
			return null;
		}
	};

	return (
		<StandardDialog
			open={isOpen}
			onOpenChange={(open) => !open && handleCancel()}>
			<StandardDialog.Content size="2xl">
				<StandardDialog.Header>
					<StandardDialog.Title>Seleccionar Dimensiones</StandardDialog.Title>
					<StandardText size="sm" colorShade="subtle">
						{localSelection.length} de {dimensions.length} seleccionadas
					</StandardText>
				</StandardDialog.Header>

				{/* Botones de acción rápida */}
				<div className="flex gap-2 mb-4">
					<StandardButton
						size="sm"
						styleType="outline"
						onClick={handleSelectAll}
						disabled={localSelection.length === dimensions.length}>
						Todas
					</StandardButton>
					<StandardButton
						size="sm"
						styleType="outline"
						onClick={handleDeselectAll}
						disabled={localSelection.length === 0}>
						Ninguna
					</StandardButton>
				</div>

				{/* Dimensiones agrupadas por fase - Layout de 2 filas */}
				<div className="space-y-6 max-h-[60vh] overflow-y-auto">
					{dimensionsByPhase.map(({ phase, dimensions: phaseDims }) => {
						if (phaseDims.length === 0) return null;

						const selectedCount = phaseDims.filter((dim) =>
							localSelection.includes(dim.id),
						).length;

						return (
							<div key={phase.id} className="space-y-3">
								{/* Header de fase */}
								<div className="flex items-center justify-between">
									<StandardText weight="semibold" size="sm">
										Fase {phase.phase_number}: {phase.name}
									</StandardText>
									<StandardBadge
										size="sm"
										colorScheme={
											selectedCount === phaseDims.length ? "success" : "neutral"
										}>
										{selectedCount}/{phaseDims.length}
									</StandardBadge>
								</div>

								{/* Grid de dimensiones - 2 filas */}
								<div className="grid grid-cols-2 gap-3">
									{phaseDims.map((dimension) => {
										const isSelected = localSelection.includes(dimension.id);
										return (
											<div
												key={dimension.id}
												onClick={() => handleToggleDimension(dimension.id)}
												className={`
													flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
													${
														isSelected ?
															"border-primary-500 bg-primary-50 dark:bg-primary-950"
														:	"border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
													}
												`}>
												<StandardCheckbox
													checked={isSelected}
													onChange={() => handleToggleDimension(dimension.id)}
												/>
												<div className="flex items-center gap-2 flex-1 min-w-0">
													{/* Icono de la dimensión */}
													<div
														className={`flex-shrink-0 ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-500"}`}>
														{getDimensionIcon(dimension.icon)}
													</div>
													{/* Nombre de la dimensión */}
													<div className="flex-1 min-w-0">
														<StandardText
															size="sm"
															weight="medium"
															className="truncate">
															{dimension.name}
														</StandardText>
														<StandardText size="xs" colorShade="subtle">
															{dimension.type}
														</StandardText>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>

				{/* Footer */}
				<StandardDialog.Footer>
					<StandardButton
						styleType="outline"
						onClick={handleCancel}
						leftIcon={X}>
						Cancelar
					</StandardButton>
					<StandardButton
						colorScheme="primary"
						onClick={handleApply}
						leftIcon={Check}
						disabled={localSelection.length === 0}>
						Aplicar ({localSelection.length})
					</StandardButton>
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
