"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useMemo, useRef, useEffect } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { AlertTriangle, Trash2, Boxes } from "lucide-react";
import { StandardIcon } from "@/components/ui/StandardIcon";
import type { Database } from "@/lib/database.types";
import type { BatchForDisplay } from "@/lib/actions/batch-actions";
import { toast as sonnerToast } from "sonner";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { BatchVisualization } from "./BatchVisualization";
import type { SphereItemData } from "@/components/ui/StandardSphereGrid";
import type { SphereStyleType } from "@/lib/theme/components/standard-sphere-tokens";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { getVisualsForBatchStatus } from "@/lib/utils/visual-utils";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
//#endregion ![head]

//#region [def] - 📦 TYPES, INTERFACES & CONSTANTS 📦

interface ProjectBatchesDisplayProps {
	projectId: string;
	lotes: BatchForDisplay[];
	onResetAllBatches: () => Promise<{
		success: boolean;
		message?: string;
		error?: string;
	}>;
	permisoParaResetearGeneral: boolean;
}

// SphereIconType eliminado por no usarse

const LEGEND_STATUSES: string[] = [
	"translated",
	"review_pending",
	"reconciliation_pending",
	"validated",
	"reconciled",
	"disputed",
];

//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function ProjectBatchesDisplay({
	lotes,
	onResetAllBatches,
	permisoParaResetearGeneral,
}: ProjectBatchesDisplayProps) {
	const [isResetting, setIsResetting] = useState(false);
	const [dialogResetOpen, setDialogResetOpen] = useState(false);
	const gridContainerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const element = gridContainerRef.current;
		if (!element) return;

		const observer = new ResizeObserver((entries) => {
			if (entries[0]) {
				const { width, height } = entries[0].contentRect;
				setContainerSize({ width, height });
			}
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const todosLosLotesEstanPendientes =
		lotes.length > 0 && lotes.every((lote) => lote.status === "pending");
	const mostrarBotonReset =
		permisoParaResetearGeneral && todosLosLotesEstanPendientes;

	const handleConfirmReset = async () => {
		setIsResetting(true);
		sonnerToast.promise(onResetAllBatches(), {
			loading: "Eliminando lotes...",
			success: (data) => {
				setDialogResetOpen(false);
				return data.message || "Lotes eliminados con éxito";
			},
			error: (err) => {
				setDialogResetOpen(false);
				return err.message || "Error al eliminar los lotes";
			},
			finally: () => {
				setIsResetting(false);
			},
		});
	};

	const sphereData: SphereItemData[] = useMemo(() => {
		if (!lotes) return [];
		return lotes.map((lote) => {
			const { colorScheme, emoticon, label } = getVisualsForBatchStatus(
				lote.status
			);

			let styleType: SphereStyleType = "filled";
			if (lote.status === "pending" || ["completed", "error", "paused"].includes(lote.status)) {
				styleType = "subtle";
			}

			const tooltipContent = (
				<div>
					<p>
						<strong>Lote:</strong> {lote.batch_number}
					</p>
					<p>
						<strong>Estado:</strong> {label}
					</p>
					<p>
						<strong>Artículos:</strong> {lote.article_count}
					</p>
					{lote.assigned_to_member_name && (
						<p>
							<strong>Asignado a:</strong> {lote.assigned_to_member_name}
						</p>
					)}
				</div>
			);

			return {
				id: lote.id,
				label: `Lote ${lote.batch_number}`,
				value: lote.batch_number,
				subLabel: lote.name,
				colorScheme,
				styleType,
				emoticon,
				tooltipContent,
				keyGroup: lote.status,
			};
		});
	}, [lotes]);

	if (!lotes || lotes.length === 0) {
		return (
			<StandardPageBackground>
				<div className="text-center py-12">
					<StandardIcon
						size="2xl"
						colorScheme="neutral"
						className="mx-auto text-gray-400">
						<Boxes />
					</StandardIcon>
					<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						No hay lotes
					</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Actualmente no hay lotes para este proyecto.
					</p>
				</div>
			</StandardPageBackground>
		);
	}

	return (
		<StandardPageBackground>
			<StandardPageTitle
				title="Lotes de Trabajo"
				subtitle="Gestión de lotes"
				description="Estos son los lotes creados, solo puedes eliminarlos si no hay ninguno comenzado."
				mainIcon={Boxes}
				showBackButton={{ href: "/datos-maestros/lote" }}
				breadcrumbs={[
					{ label: "Datos Maestros", href: "/datos-maestros" },
					{ label: "Lotes de Trabajo" },
				]}
			/>
			<div className="space-y-6">
				<StandardCard
					colorScheme="secondary"
					className="overflow-visible"
					styleType="subtle">
					<StandardCard.Header className="flex justify-between items-center">
						<StandardCard.Title>Visualización de Lotes</StandardCard.Title>
						{mostrarBotonReset && (
							<StandardDialog
								open={dialogResetOpen}
								onOpenChange={setDialogResetOpen}>
								<StandardDialog.Trigger asChild>
									<StandardButton
										colorScheme="danger"
										size="sm"
										leftIcon={Trash2}>
										Eliminar todos los lotes
									</StandardButton>
								</StandardDialog.Trigger>
								<StandardDialog.Content colorScheme="danger">
									<StandardDialog.Header>
										<StandardDialog.Title>
											Confirmar Eliminación Masiva
										</StandardDialog.Title>
										<StandardDialog.Description>
											Esta acción no se puede deshacer. Todos los lotes de este
											proyecto serán eliminados permanentemente. ¿Estás seguro?
										</StandardDialog.Description>
									</StandardDialog.Header>
									<StandardDialog.Footer>
										<StandardDialog.Close asChild>
											<StandardButton colorScheme="neutral">
												Cancelar
											</StandardButton>
										</StandardDialog.Close>
										<StandardButton
											colorScheme="danger"
											onClick={handleConfirmReset}
											loading={isResetting}>
											Sí, eliminar todo
										</StandardButton>
									</StandardDialog.Footer>
								</StandardDialog.Content>
							</StandardDialog>
						)}
					</StandardCard.Header>
					<StandardCard.Content
						ref={gridContainerRef}
						className="p-4 md:p-6 relative h-[50vh] min-h-[400px]">
						<BatchVisualization
							items={sphereData}
							isLoading={containerSize.width === 0}
							containerWidth={containerSize.width}
							containerHeight={containerSize.height}
							title=""
						/>
					</StandardCard.Content>

					{/* ✨ LEYENDA DE ESTADOS Y EMOTICONES */}
					<StandardCard.Footer>
						<div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
							<StandardText size="sm" weight="medium" className="pr-2">
								Leyenda:
							</StandardText>
							{LEGEND_STATUSES.map((status) => {
								const { emoticon, label } = getVisualsForBatchStatus(status);
								return (
									<div key={status} className="flex items-center gap-1.5">
										<StandardText size="sm">{emoticon}</StandardText>
										<StandardText
											size="xs"
											colorScheme="neutral"
											colorShade="text">
											{label}
										</StandardText>
									</div>
								);
							})}
						</div>
					</StandardCard.Footer>

					{permisoParaResetearGeneral &&
						!todosLosLotesEstanPendientes &&
						lotes.length > 0 && (
							<div className="mt-6 p-3 bg-warning-50 dark:bg-warning-900/30 border-l-4 border-warning-500 dark:border-warning-400 rounded">
								<div className="flex">
									<div className="flex-shrink-0 pt-0.5">
										<StandardIcon
											colorScheme="warning"
											size="sm"
											aria-hidden="true">
											<AlertTriangle />
										</StandardIcon>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-warning-800 dark:text-warning-200">
											No se pueden eliminar los lotes masivamente
										</p>
										<p className="mt-1 text-sm text-warning-700 dark:text-warning-300">
											Uno o más lotes ya han sido iniciados (no están en estado
											&apos;pending&apos;).
										</p>
									</div>
								</div>
							</div>
						)}
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
//#endregion ![main]
