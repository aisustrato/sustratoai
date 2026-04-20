"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Sprout } from "lucide-react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { useAuth } from "@/app/auth-provider";
import {
	getCognitiveElementsForProject,
	type CognitiveElements,
} from "@/lib/actions/cognetica-old-filters-actions";
import {
	createGarden,
	type GardenElementType,
} from "@/lib/actions/cognetica-old-gardens-actions";

const GARDEN_EMOJIS = [
	"🌱",
	"🌿",
	"🌳",
	"🍃",
	"🌾",
	"🌻",
	"🌊",
	"🔮",
	"🧬",
	"⚗️",
	"🧠",
	"🕸️",
	"🌀",
	"💎",
	"🔭",
];

interface SelectedElement {
	element_type: GardenElementType;
	element_id?: string;
	element_content?: string;
	element_label: string;
}

const TYPE_META: Record<
	GardenElementType,
	{
		emoji: string;
		label: string;
		colorScheme: "accent" | "primary" | "secondary" | "tertiary";
	}
> = {
	seed: { emoji: "🌱", label: "Semilla", colorScheme: "accent" },
	discipline: { emoji: "🔬", label: "Disciplina", colorScheme: "primary" },
	theory: { emoji: "💡", label: "Teoría", colorScheme: "secondary" },
	thinker: { emoji: "👤", label: "Pensador", colorScheme: "tertiary" },
};

export default function NuevoJardinPage() {
	const router = useRouter();
	const auth = useAuth();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [emoji, setEmoji] = useState("🌱");
	const [selectedElements, setSelectedElements] = useState<SelectedElement[]>(
		[],
	);
	const [availableElements, setAvailableElements] =
		useState<CognitiveElements | null>(null);
	const [loadingElements, setLoadingElements] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [activeTab, setActiveTab] = useState<GardenElementType>("seed");
	const [searchQuery, setSearchQuery] = useState("");

	const loadElements = useCallback(async () => {
		const projectId = auth.proyectoActual?.id;
		if (!projectId) return;
		setLoadingElements(true);
		const result = await getCognitiveElementsForProject(projectId);
		console.log("🔍 [loadElements] Result:", result);
		if (result.success && result.data) {
			console.log(
				"🌱 [loadElements] Seeds received:",
				result.data.seeds.length,
			);
			console.log(
				"🌱 [loadElements] Sample seeds:",
				result.data.seeds.slice(0, 5),
			);
			setAvailableElements(result.data);
		}
		setLoadingElements(false);
	}, [auth.proyectoActual?.id]);

	useEffect(() => {
		loadElements();
	}, [loadElements]);

	const isSelected = (type: GardenElementType, value: string): boolean => {
		return selectedElements.some(
			(el) =>
				el.element_type === type &&
				(type === "seed" ?
					el.element_content === value
				:	el.element_id === value),
		);
	};

	const toggleElement = (el: SelectedElement) => {
		const key = el.element_type === "seed" ? el.element_content : el.element_id;
		const already = isSelected(el.element_type, key!);
		if (already) {
			setSelectedElements((prev) =>
				prev.filter((e) => {
					const k =
						e.element_type === "seed" ? e.element_content : e.element_id;
					return !(e.element_type === el.element_type && k === key);
				}),
			);
		} else {
			setSelectedElements((prev) => [...prev, el]);
		}
	};

	const removeElement = (idx: number) => {
		setSelectedElements((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleSave = async () => {
		console.log("🌱 [handleSave] Iniciando guardado del jardín...");
		console.log("🌱 [handleSave] selectedElements:", selectedElements.length);

		if (!name.trim()) {
			setError("El nombre del jardín es obligatorio.");
			return;
		}
		const projectId = auth.proyectoActual?.id;
		if (!projectId) {
			setError("No hay proyecto activo.");
			return;
		}

		setSaving(true);
		setError(null);
		console.log("🌱 [handleSave] Llamando a createGarden...");
		const result = await createGarden({
			projectId,
			name: name.trim(),
			description: description.trim() || undefined,
			emoji,
			elements: selectedElements,
		});

		console.log("🔍 [handleSave] Resultado de createGarden:", result);

		if (result.success && result.data) {
			if ("warning" in result && result.warning) {
				console.warn("⚠️ [createGarden] Warning:", result.warning);
				// Opcional: mostrar toast de advertencia
			}
			router.push(`/cognetica_old/jardines/${result.data.id}`);
		} else {
			setError(result.error || "Error creando jardín");
			setSaving(false);
		}
	};

	// Filtrar elementos disponibles según búsqueda y tab activo
	const filteredOptions = (() => {
		if (!availableElements) return [];
		const q = searchQuery.toLowerCase();
		switch (activeTab) {
			case "seed":
				const allSeeds = availableElements.seeds;
				const filteredSeeds = allSeeds.filter((s) =>
					s.content.toLowerCase().includes(q),
				);
				console.log("🔍 [filteredOptions] Seeds search:", {
					searchQuery: q,
					totalSeeds: allSeeds.length,
					filteredSeeds: filteredSeeds.length,
					allSeedsSample: allSeeds.slice(0, 10).map((s) => s.content),
					filteredSeedsSample: filteredSeeds.slice(0, 10).map((s) => s.content),
				});
				return filteredSeeds.map((s) => ({
					element_type: "seed" as GardenElementType,
					element_content: s.content,
					element_label: s.content,
					count: s.count,
				}));
			case "discipline":
				return availableElements.disciplines
					.filter((d) => d.name.toLowerCase().includes(q))
					.map((d) => ({
						element_type: "discipline" as GardenElementType,
						element_id: d.id,
						element_label: d.name,
						count: d.count,
					}));
			case "theory":
				return availableElements.theories
					.filter((t) => t.name.toLowerCase().includes(q))
					.map((t) => ({
						element_type: "theory" as GardenElementType,
						element_id: t.id,
						element_label: t.name,
						count: t.count,
					}));
			case "thinker":
				return availableElements.thinkers
					.filter((t) => t.name.toLowerCase().includes(q))
					.map((t) => ({
						element_type: "thinker" as GardenElementType,
						element_id: t.id,
						element_label: t.name,
						count: t.count,
					}));
			default:
				return [];
		}
	})();

	return (
		<div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
						<Sprout className="h-6 w-6 text-accent-500" />
						Nuevo Jardín de Resonancia
					</h1>
					<StandardText size="sm" colorScheme="neutral" className="mt-1">
						Agrupa elementos cognitivos bajo un concepto paraguas
					</StandardText>
				</div>
				<StandardButton
					size="sm"
					styleType="outline"
					colorScheme="neutral"
					onClick={() => router.push("/cognetica_old/jardines")}>
					← Jardines
				</StandardButton>
			</div>

			{/* Formulario */}
			<StandardCard colorScheme="neutral">
				<StandardCard.Content className="space-y-5">
					{/* Emoji selector */}
					<div>
						<StandardText size="sm" className="font-medium mb-2 block">
							Emoji del jardín
						</StandardText>
						<div className="flex flex-wrap gap-2">
							{GARDEN_EMOJIS.map((e) => (
								<button
									key={e}
									onClick={() => setEmoji(e)}
									className={`text-2xl p-1.5 rounded-lg transition-all ${
										emoji === e ?
											"bg-accent-100 ring-2 ring-accent-400 scale-110"
										:	"hover:bg-neutral-100"
									}`}>
									{e}
								</button>
							))}
						</div>
					</div>

					{/* Nombre */}
					<div>
						<StandardText size="sm" className="font-medium mb-1.5 block">
							Nombre del jardín <span className="text-danger">*</span>
						</StandardText>
						<StandardInput
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={`${emoji} Ej: Sociología del Conocimiento`}
							colorScheme="neutral"
						/>
					</div>

					{/* Descripción */}
					<div>
						<StandardText size="sm" className="font-medium mb-1.5 block">
							Descripción (opcional)
						</StandardText>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="¿Qué concepto paraguas agrupa estos elementos?"
							rows={2}
							className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
						/>
					</div>
				</StandardCard.Content>
			</StandardCard>

			{/* Selector de elementos */}
			<StandardCard colorScheme="neutral">
				<StandardCard.Content className="space-y-4">
					<div className="flex items-center justify-between">
						<StandardText size="sm" className="font-medium">
							Elementos cognitivos
						</StandardText>
						{selectedElements.length > 0 && (
							<StandardBadge colorScheme="accent" size="xs">
								{selectedElements.length} seleccionado
								{selectedElements.length !== 1 ? "s" : ""}
							</StandardBadge>
						)}
					</div>

					{/* Tabs por tipo */}
					<div className="flex gap-1 border-b border-border">
						{(Object.keys(TYPE_META) as GardenElementType[]).map((type) => {
							const meta = TYPE_META[type];
							const countSelected = selectedElements.filter(
								(e) => e.element_type === type,
							).length;
							return (
								<button
									key={type}
									onClick={() => {
										setActiveTab(type);
										setSearchQuery("");
									}}
									className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
										activeTab === type ?
											"border-accent-500 text-accent-600"
										:	"border-transparent text-neutral-500 hover:text-foreground"
									}`}>
									{meta.emoji} {meta.label}
									{countSelected > 0 && (
										<span className="bg-accent-100 text-accent-700 text-xs rounded-full px-1.5 py-0.5 leading-none">
											{countSelected}
										</span>
									)}
								</button>
							);
						})}
					</div>

					{/* Búsqueda */}
					<StandardInput
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={`Buscar ${TYPE_META[activeTab].label.toLowerCase()}s...`}
						colorScheme="neutral"
						size="sm"
					/>

					{/* Lista de opciones */}
					{loadingElements ?
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-8 bg-neutral-100 rounded animate-pulse"
								/>
							))}
						</div>
					: filteredOptions.length === 0 ?
						<StandardText
							size="sm"
							colorScheme="neutral"
							className="text-center py-4">
							Sin {TYPE_META[activeTab].label.toLowerCase()}s disponibles
						</StandardText>
					:	<div className="max-h-56 overflow-y-auto space-y-1 pr-1">
							{filteredOptions.map((opt, idx) => {
								const key =
									opt.element_type === "seed" ?
										(opt as any).element_content!
									:	(opt as any).element_id!;
								const selected = isSelected(opt.element_type, key);
								const meta = TYPE_META[opt.element_type];
								return (
									<button
										key={idx}
										onClick={() =>
											toggleElement({
												element_type: opt.element_type,
												element_id: (opt as any).element_id,
												element_content: (opt as any).element_content,
												element_label: opt.element_label,
											})
										}
										className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
											selected ?
												"bg-accent-50 border border-accent-200 text-accent-800"
											:	"hover:bg-neutral-50 border border-transparent text-foreground"
										}`}>
										<span className="flex items-center gap-2">
											<span>{meta.emoji}</span>
											<span className="line-clamp-1">{opt.element_label}</span>
										</span>
										<span className="flex items-center gap-2 flex-shrink-0">
											<span className="text-xs text-neutral-400">
												{opt.count} artefacto{opt.count !== 1 ? "s" : ""}
											</span>
											{selected ?
												<span className="text-accent-500 text-xs font-bold">
													✓
												</span>
											:	<Plus className="h-3.5 w-3.5 text-neutral-300" />}
										</span>
									</button>
								);
							})}
						</div>
					}
				</StandardCard.Content>
			</StandardCard>

			{/* Elementos seleccionados */}
			{selectedElements.length > 0 && (
				<StandardCard colorScheme="neutral">
					<StandardCard.Content>
						<StandardText size="sm" className="font-medium mb-3 block">
							Elementos en el jardín
						</StandardText>
						<div className="flex flex-wrap gap-2">
							{selectedElements.map((el, idx) => {
								const meta = TYPE_META[el.element_type];
								return (
									<span key={idx} className="inline-flex items-center gap-1">
										<StandardBadge
											colorScheme={meta.colorScheme}
											styleType="subtle"
											size="sm">
											{meta.emoji} {el.element_label}
										</StandardBadge>
										<button
											onClick={() => removeElement(idx)}
											className="text-neutral-400 hover:text-danger transition-colors">
											<X className="h-3 w-3" />
										</button>
									</span>
								);
							})}
						</div>
					</StandardCard.Content>
				</StandardCard>
			)}

			{/* Error */}
			{error && (
				<StandardText colorScheme="danger" size="sm">
					{error}
				</StandardText>
			)}

			{/* Acciones */}
			<div className="flex items-center justify-end gap-3">
				<StandardButton
					styleType="outline"
					colorScheme="neutral"
					onClick={() => router.push("/cognetica_old/jardines")}
					disabled={saving}>
					Cancelar
				</StandardButton>
				<StandardButton
					colorScheme="accent"
					leftIcon={Sprout}
					onClick={handleSave}
					disabled={saving || !name.trim()}>
					{saving ? "Creando..." : "Crear Jardín"}
				</StandardButton>
			</div>
		</div>
	);
}
