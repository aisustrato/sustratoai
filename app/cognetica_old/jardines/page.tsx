"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Sprout } from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardPagination } from "@/components/ui/StandardPagination";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	getGardensForProject,
	deleteGarden,
	type ResonanceGarden,
} from "@/lib/actions/cognetica-old-gardens-actions";

function countByType(
	elements: ResonanceGarden["elements"],
	type: string,
): number {
	return (elements || []).filter((e) => e.element_type === type).length;
}

export default function JardinesPage() {
	const router = useRouter();
	const auth = useAuth();
	const [gardens, setGardens] = useState<ResonanceGarden[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [gardenToDelete, setGardenToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Estados para paginación
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;

	// Lógica de paginación
	const totalPages = Math.ceil(gardens.length / itemsPerPage);
	const paginatedGardens = gardens.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const load = useCallback(async () => {
		const projectId = auth.proyectoActual?.id;
		if (!projectId) return;
		setLoading(true);
		setError(null);
		const result = await getGardensForProject(projectId);
		if (result.success && result.data) {
			setGardens(result.data);
			setCurrentPage(1); // Resetear a primera página cuando cargan nuevos datos
		} else {
			setError(result.error || "Error cargando jardines");
		}
		setLoading(false);
	}, [auth.proyectoActual?.id]);

	useEffect(() => {
		load();
	}, [load]);

	const handleDeleteClick = (gardenId: string, name: string) => {
		setGardenToDelete({ id: gardenId, name });
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!gardenToDelete) return;

		setDeletingId(gardenToDelete.id);
		const result = await deleteGarden(gardenToDelete.id);

		if (result.success) {
			setGardens((prev) => prev.filter((g) => g.id !== gardenToDelete.id));
		}

		setDeletingId(null);
		setDeleteDialogOpen(false);
		setGardenToDelete(null);
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
			{/* PageTitle con estándar de la aplicación */}
			<StandardPageTitle
				title="Jardines de Resonancia"
				subtitle="Grupos semánticos de elementos cognitivos que orbitan un concepto"
				mainIcon={Sprout}
				breadcrumbs={[
					{ label: "Cognetica", href: "/cognetica_old" },
					{ label: "Jardines" },
				]}
				actions={
					<div className="flex items-center gap-2">
						<StandardButton
							size="sm"
							styleType="outline"
							colorScheme="primary"
							onClick={() => router.push("/cognetica_old/jardines/normalizar")}>
							🔀 Normalizar semillas
						</StandardButton>
						<StandardButton
							size="sm"
							colorScheme="accent"
							leftIcon={Plus}
							onClick={() => router.push("/cognetica_old/jardines/nuevo")}>
							Nuevo Jardín
						</StandardButton>
					</div>
				}
			/>

			{/* Contenido */}
			{loading && (
				<div className="flex items-center justify-center py-20">
					<SustratoLoadingLogo
						size={64}
						variant="spin-pulse"
						speed="normal"
						showText={true}
						text="Cargando jardines..."
						breathingEffect={true}
						colorTransition={true}
					/>
				</div>
			)}

			{!loading && error && (
				<StandardCard colorScheme="danger">
					<StandardCard.Content>
						<StandardText colorScheme="danger">{error}</StandardText>
					</StandardCard.Content>
				</StandardCard>
			)}

			{!loading && !error && gardens.length === 0 && (
				<StandardEmptyState
					title="Sin jardines aún"
					description="Crea tu primer jardín para agrupar semillas, disciplinas, teorías y pensadores bajo un concepto común."
					action={
						<StandardButton
							colorScheme="accent"
							leftIcon={Plus}
							onClick={() => router.push("/cognetica_old/jardines/nuevo")}>
							Crear primer jardín
						</StandardButton>
					}
					icon={Sprout}
				/>
			)}

			{!loading && !error && gardens.length > 0 && (
				<div className="space-y-6">
					{/* Grid de jardines */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{paginatedGardens.map((garden) => {
							const elements = garden.elements || [];
							const seedCount = countByType(elements, "seed");
							const discCount = countByType(elements, "discipline");
							const theoryCount = countByType(elements, "theory");
							const thinkerCount = countByType(elements, "thinker");
							const totalElements = elements.length;

							return (
								<StandardCard
									key={garden.id}
									colorScheme="neutral"
									className="hover:shadow-md transition-shadow cursor-pointer group"
									onClick={() =>
										router.push(`/cognetica_old/jardines/${garden.id}`)
									}>
									<StandardCard.Content>
										<div className="flex items-start justify-between gap-2">
											<div className="flex items-start gap-3 flex-1 min-w-0">
												<span className="text-3xl leading-none flex-shrink-0 mt-0.5">
													{garden.emoji}
												</span>
												<div className="flex-1 min-w-0">
													<h3 className="font-bold text-foreground text-base leading-snug">
														{garden.name}
													</h3>
													{garden.description && (
														<p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">
															{garden.description}
														</p>
													)}
													<p className="text-xs text-neutral-400 mt-1">
														{formatDistanceToNow(new Date(garden.created_at), {
															addSuffix: true,
															locale: es,
														})}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={(e) => {
														e.stopPropagation();
														router.push(`/cognetica_old/jardines/${garden.id}`);
													}}
													className="p-1.5 rounded text-neutral-300 hover:text-primary hover:bg-neutral-100 transition-colors"
													title="Ver jardín">
													<ExternalLink className="h-3.5 w-3.5" />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteClick(garden.id, garden.name);
													}}
													disabled={deletingId === garden.id}
													className="p-1.5 rounded text-neutral-300 hover:text-danger hover:bg-red-50 transition-colors disabled:opacity-50"
													title="Eliminar jardín">
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</div>

										{/* Contadores de elementos */}
										<div className="flex flex-wrap gap-1.5 mt-3">
											{seedCount > 0 && (
												<StandardBadge
													colorScheme="accent"
													styleType="subtle"
													size="xs">
													🌱 {seedCount} semilla{seedCount !== 1 ? "s" : ""}
												</StandardBadge>
											)}
											{discCount > 0 && (
												<StandardBadge
													colorScheme="primary"
													styleType="subtle"
													size="xs">
													🔬 {discCount} disciplina{discCount !== 1 ? "s" : ""}
												</StandardBadge>
											)}
											{theoryCount > 0 && (
												<StandardBadge
													colorScheme="secondary"
													styleType="subtle"
													size="xs">
													💡 {theoryCount} teoría{theoryCount !== 1 ? "s" : ""}
												</StandardBadge>
											)}
											{thinkerCount > 0 && (
												<StandardBadge
													colorScheme="tertiary"
													styleType="subtle"
													size="xs">
													👤 {thinkerCount} pensador
													{thinkerCount !== 1 ? "es" : ""}
												</StandardBadge>
											)}
											{totalElements === 0 && (
												<StandardBadge
													colorScheme="neutral"
													styleType="subtle"
													size="xs">
													Vacío
												</StandardBadge>
											)}
										</div>
									</StandardCard.Content>
								</StandardCard>
							);
						})}
					</div>

					{/* Paginación */}
					{totalPages > 1 && (
						<div className="flex justify-center pt-4 border-t">
							<StandardPagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={handlePageChange}
								itemsPerPage={itemsPerPage}
								totalItems={gardens.length}
							/>
						</div>
					)}
				</div>
			)}

			{/* Dialog de confirmación de eliminación */}
			<StandardDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}>
				<StandardDialog.Content size="md" colorScheme="danger">
					<StandardDialog.Header>
						<StandardDialog.Title>Confirmar Eliminación</StandardDialog.Title>
					</StandardDialog.Header>

					<StandardDialog.Body>
						<div className="space-y-4">
							<StandardText>
								¿Estás seguro de que deseas eliminar el jardín{" "}
								<strong>&ldquo;{gardenToDelete?.name}&rdquo;</strong>?
							</StandardText>
							<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
								Esta acción no se puede deshacer. Se eliminarán todas las
								asociaciones de elementos cognitivos con este jardín.
							</StandardText>
						</div>
					</StandardDialog.Body>

					<StandardDialog.Footer>
						<StandardButton
							styleType="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={!!deletingId}>
							Cancelar
						</StandardButton>
						<StandardButton
							colorScheme="danger"
							onClick={handleConfirmDelete}
							disabled={!!deletingId}
							leftIcon={Trash2}>
							{deletingId ? "Eliminando..." : "Eliminar Jardín"}
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
}
