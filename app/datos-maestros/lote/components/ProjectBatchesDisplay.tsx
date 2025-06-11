//. 📍 app/datos-maestros/lote/components/ProjectBatchesDisplay.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useMemo } from "react";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import {
	AlertTriangle,
	Trash2,
	Clock,
	Zap,
	CheckCircle,
	AlertOctagon,
	HelpCircle,
	Layers,
} from "lucide-react";
import { StandardIcon } from "@/components/ui/StandardIcon";
import type { BatchStatusEnum } from "@/lib/database.types";
import { toast as sonnerToast } from "sonner";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { BatchItem } from "./BatchItem";
import type { BatchAuxColor, BatchTokens } from "./batch-tokens";
import tinycolor from "tinycolor2";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
//#endregion ![head]

//#region [def] - 📦 TYPES, INTERFACES & CONSTANTS 📦
export interface DisplayableBatch {
	id: string;
	batch_number: number;
	name: string | null;
	status: BatchStatusEnum | string;
	assigned_to_member_id?: string | null;
	assigned_to_member_name?: string | null;
	article_count?: number;
}

interface ProjectBatchesDisplayProps {
	projectId: string;
	lotes: DisplayableBatch[];
	memberColorMap: Record<string, BatchAuxColor>;
	batchTokens: BatchTokens | null; // batchTokens todavía se usa para fallbackMemberColor y leyenda
	onResetAllBatches: () => Promise<{
		success: boolean;
		message?: string;
		error?: string;
	}>;
	permisoParaResetearGeneral: boolean;
}

// Iconos de estado (definidos localmente)
const statusIcons: Record<
	Extract<BatchStatusEnum, string> | "default",
	React.ReactNode
> = {
	pending: <StandardIcon><Clock className="h-3 w-3" /></StandardIcon>,
	in_progress: <StandardIcon><Zap className="h-3 w-3" /></StandardIcon>,
	ai_prefilled: (
		<StandardIcon><CheckCircle className="h-3 w-3 text-purple-600 dark:text-purple-400" /></StandardIcon>
	),
	discrepancies: (
		<StandardIcon><AlertOctagon className="h-3 w-3 text-orange-600 dark:text-orange-400" /></StandardIcon>
	),
	completed: (
		<StandardIcon><CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" /></StandardIcon>
	),
	error: <StandardIcon><AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" /></StandardIcon>,
	default: <StandardIcon><HelpCircle className="h-3 w-3" /></StandardIcon>,
};

// Clases de Tailwind para el Badge de estado (más simple)
const statusBadgeStyles: Record<
	Extract<BatchStatusEnum, string> | "default",
	string
> = {
	pending: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
	in_progress:
		"bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300",
	ai_prefilled:
		"bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300",
	discrepancies:
		"bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300",
	completed:
		"bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300",
	error: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300",
	default: "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200",
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function ProjectBatchesDisplay({
	projectId,
	lotes,
	memberColorMap,
	batchTokens, // Se sigue necesitando para el fallback de color de miembro y la leyenda
	onResetAllBatches,
	permisoParaResetearGeneral,
}: ProjectBatchesDisplayProps) {
	//#region [sub] - 🧰 HOOKS, STATE & HANDLERS 🧰
	const [isResetting, setIsResetting] = useState(false);
	const [dialogResetOpen, setDialogResetOpen] = useState(false);

	const todosLosLotesEstanPendientes =
		lotes.length > 0 && lotes.every((lote) => lote.status === "pending");
	const mostrarBotonReset =
		permisoParaResetearGeneral && todosLosLotesEstanPendientes;

	const handleConfirmReset = async () => {
		setIsResetting(true);
		setDialogResetOpen(false);
		const result = await onResetAllBatches();
		if (result.success) {
			sonnerToast.success("Reseteo Exitoso", {
				description: result.message || "Todos los lotes han sido eliminados.",
			});
		} else {
			sonnerToast.error("Error en el Reseteo", {
				description: result.error || "No se pudieron eliminar los lotes.",
			});
		}
		setIsResetting(false);
	};
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	//#region [render_sub] - LOADING STYLES 🎨
	if (!batchTokens) {
		return (
			<StandardCard styleType="subtle" disableShadowHover={true} hasOutline={false} accentPlacement="none">
				<StandardCard.Content>
					<StandardText size="sm" className="mt-1 text-muted-foreground">
						Cuando se generen lotes para este proyecto, aparecerán aquí.
					</StandardText>
				</StandardCard.Content>
			</StandardCard>
		);
	}
	//#endregion [render_sub]

	//#region [render_sub] - NO BATCHES (EMPTY STATE) 🎨
	if (lotes.length === 0 && !isResetting) {
		return (
			<StandardCard styleType="subtle" disableShadowHover={true} hasOutline={false} accentPlacement="none">
				<StandardCard.Content className="text-center py-10">
					<StandardText size="lg" weight="medium" className="mt-4 text-muted-foreground">
						No hay lotes para mostrar en este proyecto.
					</StandardText>
					<StandardText size="sm" className="mt-1 text-muted-foreground">
						Cuando se generen lotes para este proyecto, aparecerán aquí.
					</StandardText>
				</StandardCard.Content>
			</StandardCard>
		);
	}
	//#endregion [render_sub]

	//#region [sub_render_logic] - DERIVED VALUES FOR RENDER 🎨
	// Moved derived values closer to their usage, inside the main return or just before if needed by multiple main branches.
	const gridColumns = Math.min(
		12,
		Math.ceil(Math.sqrt(lotes.length * 1.2)) || 1
	);
	const fallbackMemberColor =
		batchTokens.auxiliaries.find((aux) => aux.key === "auxDefault") ||
		batchTokens.auxiliaries[0];
	//#endregion [sub_render_logic]

	//#region [render_sub] - MAIN BATCH DISPLAY 🎨
	return (
		<PageBackground>
			<div className="container mx-auto py-8">
				<PageTitle
					title="Lotes Creados en el Proyecto"
					subtitle={`Muestra los lotes creados en el proyecto.`}
					mainIcon={Layers}
					breadcrumbs={[
						{ label: "Datos maestros", href: "/datos-maestros" },
						{ label: "Lotes", href: "/datos-maestros/lote" },
					]}
				/>
				<StandardCard
					className="mt-6"
					colorScheme="secondary"
					accentPlacement="top"
					accentColorScheme="neutral"
					shadow="md"
					disableShadowHover={true}
					styleType="subtle"
				>
					<StandardCard.Header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
						<div>
							<StandardText size="xl" weight="semibold" colorScheme="tertiary">
								Total: {lotes.length} lotes.
							</StandardText>
						</div>
						{mostrarBotonReset && (
							<>
								<StandardButton
									type="button"
									colorScheme="danger"
									styleType="solid"
									leftIcon={Trash2}
									className="ml-auto w-4 h-4"
									onClick={() => setDialogResetOpen(true)}
									loading={isResetting}
								>
									Eliminar todos los lotes
								</StandardButton>
								<CustomDialog
									open={dialogResetOpen}
									onOpenChange={(open: boolean) => setDialogResetOpen(open)}
									variant="destructive"
									title="Eliminar todos los lotes"
									description={`¿Estás SEGURO de que quieres eliminar TODOS los ${lotes.length} lotes de este proyecto? Esta acción solo procederá si NINGÚN lote ha sido iniciado. No se puede deshacer.`}
									confirmText="Eliminar todos"
									cancelText="Cancelar"
									onConfirm={handleConfirmReset}
									onCancel={() => setDialogResetOpen(false)}
									isLoading={isResetting}
								/>
							</>
						)}
					</StandardCard.Header>
					<StandardCard.Content className="space-y-6">
						{/* //#region [render_sub_legend] - MEMBER LEGEND 🎨 */}
						{Object.keys(memberColorMap).length > 0 && (
							<div className="mb-6 p-3 border dark:border-neutral-700 rounded-md bg-background/30">
								<StandardText weight="medium" className="mb-2 text-sm text-muted-foreground">
								Leyenda de Miembros:
							</StandardText>
								<div className="flex flex-wrap gap-x-4 gap-y-2">
									{Object.entries(memberColorMap)
										.filter(([userId, _]) =>
											lotes.some(
												(lote) => lote.assigned_to_member_id === userId
											)
										)
										.map(([userId, colorInfo]) => {
											const memberFromLot = lotes.find(
												(l) => l.assigned_to_member_id === userId
											);
											const memberName =
												memberFromLot?.assigned_to_member_name ||
												`ID: ${userId.substring(0, 6)}`;
											if (!colorInfo) return null;
											return (
												<div key={userId} className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{
															backgroundColor: colorInfo.solid,
															border: `1px solid ${colorInfo.border}`,
														}}></div>
													<StandardText size="xs">{memberName}</StandardText>
												</div>
											);
										})}
								</div>
							</div>
						)}
						{/* //#endregion [render_sub_legend] */}

						{/* //#region [render_sub_batch_grid] - BATCH GRID DISPLAY 🎨 */}
						<div
							className={`grid gap-4 w-full items-start justify-center`}
							style={{
								gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
							}}>
							{lotes.map((lote) => {
								const memberColorInfo =
									lote.assigned_to_member_id &&
									memberColorMap[lote.assigned_to_member_id]
										? memberColorMap[lote.assigned_to_member_id]
										: fallbackMemberColor;

								const batchItemBgColor = memberColorInfo.solid;
								const batchItemInnerBorder = tinycolor(batchItemBgColor)
									.darken(15)
									.toHexString();
								const batchItemTextColor = memberColorInfo.text;

								const currentStatus = lote.status as Extract<
									BatchStatusEnum,
									string
								>;
								const statusKeyToUse: keyof typeof statusIcons =
									statusIcons.hasOwnProperty(currentStatus)
										? currentStatus
										: "default";

								const statusIconToDisplay = statusIcons[statusKeyToUse];
								const badgeStyleClass = statusBadgeStyles[statusKeyToUse];

								const itemSize = Math.max(
									40,
									Math.min(65, (400 / gridColumns) * 0.9)
								);

								return (
									<TooltipProvider key={lote.id} delayDuration={200}>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex flex-col items-center gap-1.5 cursor-pointer group">
													<div
														className={`p-0.5 rounded-full border-2 border-transparent group-hover:border-primary/30 dark:group-hover:border-primary-dark/30 shadow-md transition-all group-hover:scale-105`}>
														<BatchItem
															color={batchItemBgColor}
															border={batchItemInnerBorder}
															textColor={batchItemTextColor}
															number={lote.batch_number}
															size={itemSize}
														/>
													</div>
													<Badge
														variant="default"
														className={`px-1.5 py-0.5 whitespace-nowrap text-center flex items-center justify-center gap-1 rounded-full ${badgeStyleClass}`}>
														{statusIconToDisplay}
														<span className="truncate max-w-[50px] sm:max-w-[60px] inline-block align-middle">
															{lote.status}
														</span>
													</Badge>
												</div>
											</TooltipTrigger>
											<TooltipContent
												className="text-xs"
												side="top"
												align="center">
												<StandardText weight="bold" className="block mb-0.5">
													Lote #{lote.batch_number}
													{lote.name ? `: ${lote.name}` : ""}
												</StandardText>
												<StandardText className="block">
													Asignado a: {lote.assigned_to_member_name || "N/A"}
												</StandardText>
												<StandardText className="block">
													Artículos: {lote.article_count ?? "N/A"}
												</StandardText>
												<StandardText className="block">Estado: {lote.status}</StandardText>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								);
							})}
						</div>
						{/* //#endregion [render_sub_batch_grid] */}

						{/* //#region [render_sub_reset_info] - RESET INFO MESSAGE 🎨 */}
						{!mostrarBotonReset && lotes.length > 0 && (
							<div className="mt-6 p-3 bg-warning-50 dark:bg-warning-900/30 border-l-4 border-warning-500 dark:border-warning-400 rounded">
								<div className="flex">
									<div className="flex-shrink-0 pt-0.5">
										<StandardIcon><AlertTriangle
											className="h-5 w-5 text-warning-600 dark:text-warning-400"
											aria-hidden="true"
										/></StandardIcon>
									</div>
									<div className="ml-3">
										<StandardText
											weight="medium"
											className="text-warning-800 dark:text-warning-200">
											No se pueden eliminar los lotes masivamente
										</StandardText>
										<StandardText
											size="sm"
											className="text-warning-700 dark:text-warning-300">
											Uno o más lotes ya han sido iniciados (no están en estado
											'pending').
										</StandardText>
									</div>
								</div>
							</div>
						)}
						{/* //#endregion [render_sub_reset_info] */}
					</StandardCard.Content>
				</StandardCard>
			</div>
		</PageBackground>
	);
	//#endregion [render_sub]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar la paginación o virtualización si el número de lotes es muy grande.
// Mejorar la accesibilidad de los elementos interactivos (tooltips, botones).
// Podría haber una opción para ver detalles de un lote específico.
//#endregion ![todo]
