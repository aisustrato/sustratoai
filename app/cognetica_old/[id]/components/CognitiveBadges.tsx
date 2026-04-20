"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardText } from "@/components/ui/StandardText";
import { Edit3, Plus, AlertCircle } from "lucide-react";
import { addSeedToArtifact } from "@/lib/actions/cognetica-old-actions";
import { useToast } from "@/hooks/use-toast";

interface CognitiveBadgesProps {
	seeds?: Array<{ content: string; count?: number }>;
	disciplines?: Array<{ id: string; name: string; count?: number }>;
	theories?: Array<{ id: string; name: string; count?: number }>;
	thinkers?: Array<{
		id: string;
		name: string;
		era?: string | null;
		bio_snippet?: string | null;
		key_contributions?: string[];
		discipline?: string | null;
		context_snippet?: string | null;
		count?: number;
	}>;
	artifactId?: string; // Necesario para agregar semillas
}

export function CognitiveBadges({
	seeds,
	disciplines,
	theories,
	thinkers,
	artifactId,
}: CognitiveBadgesProps) {
	const router = useRouter();
	const { toast } = useToast();

	// Estado para edición de semillas
	const [editingSeed, setEditingSeed] = useState<string | null>(null);
	const [newSeedContent, setNewSeedContent] = useState("");
	const [isAddingSeed, setIsAddingSeed] = useState(false);
	const [showAddSeedDialog, setShowAddSeedDialog] = useState(false);
	const [seedToAdd, setSeedToAdd] = useState("");
	const [isCorrection, setIsCorrection] = useState(false);

	const handleSeedClick = (content: string) => {
		router.push(`/cognetica_old?seed=${encodeURIComponent(content)}`);
	};

	const handleDisciplineClick = (id: string) => {
		router.push(`/cognetica_old?discipline=${id}`);
	};

	const handleTheoryClick = (id: string) => {
		router.push(`/cognetica_old?theory=${id}`);
	};

	const handleThinkerClick = (id: string) => {
		router.push(`/cognetica_old?thinker=${id}`);
	};

	// Handlers para edición de semillas
	const handleEditSeed = (content: string) => {
		setEditingSeed(content);
		setNewSeedContent(content);
	};

	const handleSaveSeed = async () => {
		if (!newSeedContent.trim() || !artifactId || !editingSeed) return;

		setIsAddingSeed(true);

		try {
			const result = await addSeedToArtifact({
				artifactId,
				content: newSeedContent.trim(),
				isCorrection: true, // Es una corrección de una semilla existente
				context: `Corrección de: "${editingSeed}"`,
			});

			if (result.success) {
				toast({
					title: "✅ Semilla corregida",
					description: `"${editingSeed}" → "${newSeedContent}"`,
				});
				setEditingSeed(null);
				setNewSeedContent("");
				// Recargar la página para mostrar la nueva semilla
				router.refresh();
			} else {
				toast({
					title: "Error al corregir",
					description: result.error,
					variant: "destructive",
				});
			}
		} catch {
			toast({
				title: "Error inesperado",
				description: "No se pudo corregir la semilla",
				variant: "destructive",
			});
		} finally {
			setIsAddingSeed(false);
		}
	};

	const handleAddNewSeed = async () => {
		if (!seedToAdd.trim() || !artifactId) return;

		setIsAddingSeed(true);

		try {
			const result = await addSeedToArtifact({
				artifactId,
				content: seedToAdd.trim(),
				isCorrection: false, // Es una semilla nueva
				tags: isCorrection ? ["correction"] : [],
			});

			if (result.success) {
				toast({
					title: "✅ Semilla agregada",
					description: `"${seedToAdd.trim()}" ${isCorrection ? "(corrección)" : "(nueva)"}`,
				});
				setSeedToAdd("");
				setShowAddSeedDialog(false);
				setIsCorrection(false);
				// Recargar la página para mostrar la nueva semilla
				router.refresh();
			} else {
				toast({
					title: "Error al agregar",
					description: result.error,
					variant: "destructive",
				});
			}
		} catch {
			toast({
				title: "Error inesperado",
				description: "No se pudo agregar la semilla",
				variant: "destructive",
			});
		} finally {
			setIsAddingSeed(false);
		}
	};

	const handleCancelEdit = () => {
		setEditingSeed(null);
		setNewSeedContent("");
	};

	return (
		<div className="space-y-6">
			{/* Semillas Fractales */}
			<div className="bg-card p-6 rounded-xl border shadow-sm">
				<div className="flex justify-between items-center mb-4">
					<h3 className="font-semibold text-lg flex items-center gap-2">
						🌱 Semillas Fractales
					</h3>
					{artifactId && (
						<StandardButton
							colorScheme="accent"
							size="sm"
							leftIcon={Plus}
							onClick={() => setShowAddSeedDialog(true)}>
							Agregar
						</StandardButton>
					)}
				</div>

				{seeds && seeds.length > 0 ?
					<div className="space-y-3">
						{seeds.map((seed, idx) => (
							<div key={idx} className="flex items-center gap-2 group">
								{editingSeed === seed.content ?
									<div className="flex items-center gap-2 flex-1">
										<StandardInput
											value={newSeedContent}
											onChange={(e) => setNewSeedContent(e.target.value)}
											placeholder="Corregir semilla..."
											className="flex-1"
											size="sm"
										/>
										<StandardButton
											colorScheme="success"
											size="sm"
											onClick={handleSaveSeed}
											disabled={isAddingSeed}>
											Guardar
										</StandardButton>
										<StandardButton
											colorScheme="neutral"
											size="sm"
											styleType="ghost"
											onClick={handleCancelEdit}>
											Cancelar
										</StandardButton>
									</div>
								:	<>
										<StandardBadge
											colorScheme="accent"
											styleType="outline"
											size="sm"
											className="cursor-pointer hover:scale-105 transition-transform"
											onClick={() => handleSeedClick(seed.content)}>
											{seed.content}
											{seed.count !== undefined && seed.count > 1 && (
												<span className="ml-1.5 text-xs opacity-70">
													({seed.count})
												</span>
											)}
										</StandardBadge>
										{artifactId && (
											<StandardButton
												colorScheme="neutral"
												size="xs"
												styleType="ghost"
												leftIcon={Edit3}
												onClick={() => handleEditSeed(seed.content)}
												className="opacity-0 group-hover:opacity-100 transition-opacity">
												Editar
											</StandardButton>
										)}
									</>
								}
							</div>
						))}
					</div>
				:	<p className="text-sm text-muted-foreground italic">
						Sin semillas fractales.{" "}
						{artifactId && "Agrega algunas para enriquecer el artefacto."}
					</p>
				}
			</div>

			{/* Dialog para agregar nueva semilla */}
			<StandardDialog
				open={showAddSeedDialog}
				onOpenChange={setShowAddSeedDialog}>
				<StandardDialog.Content size="sm">
					<StandardDialog.Header>
						<StandardDialog.Title>
							🌱 Agregar Semilla Fractal
						</StandardDialog.Title>
						<StandardDialog.Description>
							Agrega una nueva semilla o corrige una existente
						</StandardDialog.Description>
					</StandardDialog.Header>
					<StandardDialog.Body className="space-y-4">
						<div>
							<StandardInput
								value={seedToAdd}
								onChange={(e) => setSeedToAdd(e.target.value)}
								placeholder="Ej: 'pensamiento cuántico', 'redes neuronales', 'memoria colectiva'..."
								className="w-full"
							/>
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="isCorrection"
								checked={isCorrection}
								onChange={(e) => setIsCorrection(e.target.checked)}
								className="rounded"
							/>
							<label htmlFor="isCorrection" className="text-sm">
								Es una corrección (ej: apellido mal escrito)
							</label>
						</div>

						{isCorrection && (
							<div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
								<AlertCircle className="w-4 h-4 text-amber-600" />
								<StandardText size="sm" colorScheme="warning">
									Las correcciones se marcarán como tal pero no eliminarán la
									semilla original (append only)
								</StandardText>
							</div>
						)}
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardButton
							colorScheme="neutral"
							styleType="outline"
							onClick={() => setShowAddSeedDialog(false)}>
							Cancelar
						</StandardButton>
						<StandardButton
							colorScheme="accent"
							onClick={handleAddNewSeed}
							disabled={!seedToAdd.trim() || isAddingSeed}>
							{isAddingSeed ? "Agregando..." : "Agregar Semilla"}
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>

			{/* Disciplinas */}
			{disciplines && disciplines.length > 0 && (
				<div className="bg-card p-6 rounded-xl border shadow-sm">
					<h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
						🔬 Disciplinas
					</h3>
					<div className="flex flex-wrap gap-3">
						{disciplines.map((disc) => (
							<StandardBadge
								key={disc.id}
								colorScheme="primary"
								styleType="outline"
								size="sm"
								className="cursor-pointer hover:scale-105 transition-transform"
								onClick={() => handleDisciplineClick(disc.id)}>
								{disc.name}
								{disc.count !== undefined && disc.count > 1 && (
									<span className="ml-1.5 text-xs opacity-70">
										({disc.count})
									</span>
								)}
							</StandardBadge>
						))}
					</div>
				</div>
			)}

			{/* Teorías */}
			{theories && theories.length > 0 && (
				<div className="bg-card p-6 rounded-xl border shadow-sm">
					<h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
						💡 Teorías
					</h3>
					<div className="flex flex-wrap gap-3">
						{theories.map((theory) => (
							<StandardBadge
								key={theory.id}
								colorScheme="secondary"
								styleType="outline"
								size="sm"
								className="cursor-pointer hover:scale-105 transition-transform"
								onClick={() => handleTheoryClick(theory.id)}>
								{theory.name}
								{theory.count !== undefined && theory.count > 1 && (
									<span className="ml-1.5 text-xs opacity-70">
										({theory.count})
									</span>
								)}
							</StandardBadge>
						))}
					</div>
				</div>
			)}

			{/* Pensadores */}
			{thinkers && thinkers.length > 0 && (
				<div className="bg-card p-6 rounded-xl border shadow-sm">
					<h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
						👤 Pensadores
					</h3>
					<div className="space-y-4">
						{thinkers.map((thinker) => (
							<div
								key={thinker.id}
								className="p-4 rounded-lg border border-tertiary-200 bg-tertiary-50/50 hover:bg-tertiary-100/50 transition-colors cursor-pointer"
								onClick={() => handleThinkerClick(thinker.id)}>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 space-y-2">
										{/* Nombre y disciplina */}
										<div className="flex items-center gap-2 flex-wrap">
											<h4 className="font-semibold text-base text-tertiary-900">
												{thinker.name}
											</h4>
											{thinker.discipline && (
												<StandardBadge
													colorScheme="tertiary"
													styleType="subtle"
													size="xs">
													{thinker.discipline}
												</StandardBadge>
											)}
											{thinker.era && (
												<StandardBadge
													colorScheme="neutral"
													styleType="subtle"
													size="xs">
													{thinker.era}
												</StandardBadge>
											)}
										</div>

										{/* Bio snippet */}
										{thinker.bio_snippet && (
											<p className="text-sm text-muted-foreground">
												{thinker.bio_snippet}
											</p>
										)}

										{/* Contribuciones clave */}
										{thinker.key_contributions &&
											thinker.key_contributions.length > 0 && (
												<div className="space-y-1">
													<p className="text-xs font-medium text-tertiary-700">
														Contribuciones clave:
													</p>
													<ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
														{thinker.key_contributions
															.slice(0, 3)
															.map((contribution, idx) => (
																<li key={idx} className="list-disc">
																	{contribution}
																</li>
															))}
														{thinker.key_contributions.length > 3 && (
															<li className="list-none text-tertiary-600 italic">
																+{thinker.key_contributions.length - 3} más...
															</li>
														)}
													</ul>
												</div>
											)}

										{/* Contexto */}
										{thinker.context_snippet && (
											<p className="text-xs text-muted-foreground italic border-l-2 border-tertiary-300 pl-2">
												&ldquo;{thinker.context_snippet}&rdquo;
											</p>
										)}
									</div>

									{/* Contador de ocurrencias */}
									{thinker.count !== undefined && thinker.count > 1 && (
										<StandardBadge
											colorScheme="tertiary"
											styleType="solid"
											size="sm">
											{thinker.count}
										</StandardBadge>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
