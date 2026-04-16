// 📍 app/showroom/standard-sphere/page.tsx
// 🎯 PROPÓSITO: Showroom interactivo de StandardSphere y StandardSphereGrid
// 🔧 USO: Referencia para desarrolladores - componentes que van siempre juntos
// 🌸 ONTOLOGÍA: Las esferas son el corazón visual de SUSTRATO.AI

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { StandardSphere, type StatusBadgeInfo } from "@/components/ui/StandardSphere";
import { StandardSphereGrid, type SphereItemData } from "@/components/ui/StandardSphereGrid";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";

import { 
	Star, 
	Rocket, 
	Heart, 
	Zap, 
	Check
} from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { useWindowSize } from "@/lib/hooks/useWindowSize";

//#region [def] - 📦 TYPES & CONSTANTS 📦
const colorSchemesForDemo: ColorSchemeVariant[] = [
	"primary",
	"secondary",
	"tertiary",
	"accent",
	"success",
	"warning",
	"danger",
	"neutral",
];

const styleTypesForDemo: ("filled" | "subtle" | "outline")[] = [
	"filled",
	"subtle",
	"outline",
];

const sizePresetsForDemo = [
	{ label: "32px (XS)", value: 32 },
	{ label: "40px (SM)", value: 40 },
	{ label: "48px (MD)", value: 48 },
	{ label: "56px (LG)", value: 56 },
	{ label: "64px (XL)", value: 64 },
	{ label: "72px (2XL)", value: 72 },
	{ label: "96px (3XL)", value: 96 },
];

const iconOptions = [
	{ label: "Ninguno", value: "none", icon: null },
	{ label: "Star", value: "star", icon: Star },
	{ label: "Rocket", value: "rocket", icon: Rocket },
	{ label: "Heart", value: "heart", icon: Heart },
	{ label: "Zap", value: "zap", icon: Zap },
];

const emoticonOptions = [
	{ label: "Ninguno", value: "none" },
	{ label: "🎯", value: "🎯" },
	{ label: "🚀", value: "🚀" },
	{ label: "⭐", value: "⭐" },
	{ label: "💎", value: "💎" },
	{ label: "🔥", value: "🔥" },
	{ label: "✨", value: "✨" },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardSphereShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");
	const { width: windowWidth } = useWindowSize();

	// --- Estados del Demo Interactivo (Esfera Individual) ---
	const [demoColorScheme, setDemoColorScheme] = useState<ColorSchemeVariant>("primary");
	const [demoStyleType, setDemoStyleType] = useState<"filled" | "subtle" | "outline">("filled");
	const [demoSize, setDemoSize] = useState<number>(64);
	const [demoValue, setDemoValue] = useState<string>("42");
	const [demoIcon, setDemoIcon] = useState<string>("star");
	const [demoEmoticon, setDemoEmoticon] = useState<string>("none");
	const [demoOnlyIcon, setDemoOnlyIcon] = useState(false);
	const [demoOnlyEmoticon, setDemoOnlyEmoticon] = useState(false);
	const [demoShowBadge, setDemoShowBadge] = useState(false);
	const [demoTooltip, setDemoTooltip] = useState(false);
	const [demoDisabled, setDemoDisabled] = useState(false);
	// 🌊 Efectos visuales
	const [demoShimmer, setDemoShimmer] = useState(false);
	const [demoBreathing, setDemoBreathing] = useState(false);
	const [demoSubtle, setDemoSubtle] = useState(false);

	// --- Estados del Grid Demo ---
	const [gridItemCount, setGridItemCount] = useState<number>(12);
	const [gridColorScheme, setGridColorScheme] = useState<ColorSchemeVariant>("primary");
	const [gridFixedSize, setGridFixedSize] = useState<number | undefined>(undefined);
	const [gridForceBadge, setGridForceBadge] = useState(false);
	const [gridShowBadges, setGridShowBadges] = useState(true);

	// Obtener el ícono seleccionado
	const selectedIconComponent = useMemo(() => {
		const found = iconOptions.find(opt => opt.value === demoIcon);
		return found?.icon || null;
	}, [demoIcon]);

	// Badge de ejemplo
	const demoBadge: StatusBadgeInfo | undefined = useMemo(() => {
		if (!demoShowBadge) return undefined;
		return {
			text: "Activo",
			icon: Check,
			colorScheme: "success",
			styleType: "subtle",
		};
	}, [demoShowBadge]);

	// Generar items para el grid
	const gridItems: SphereItemData[] = useMemo(() => {
		const items: SphereItemData[] = [];
		for (let i = 0; i < gridItemCount; i++) {
			const colorIndex = i % colorSchemesForDemo.length;
			const iconIndex = i % (iconOptions.length - 1) + 1; // Excluir "none"
			
			items.push({
				id: `sphere-${i}`,
				value: `${i + 1}`,
				colorScheme: colorSchemesForDemo[colorIndex],
				styleType: "filled",
				icon: iconOptions[iconIndex].icon || undefined,
				statusBadge: gridShowBadges ? {
					text: i % 3 === 0 ? "Nuevo" : i % 3 === 1 ? "Activo" : "Listo",
					colorScheme: (i % 3 === 0 ? "neutral" : i % 3 === 1 ? "success" : "warning") as ColorSchemeVariant,
					styleType: "subtle",
				} : undefined,
				tooltip: `Esfera #${i + 1}`,
			});
		}
		return items;
	}, [gridItemCount, gridShowBadges]);

	// Calcular dimensiones para el grid
	const gridContainerWidth = windowWidth ? Math.min(windowWidth - 100, 1200) : 1000;
	const gridContainerHeight = 500;

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					colorScheme="primary"
					className="mb-3">
					🌊 StandardSphere & StandardSphereGrid
				</StandardText>
				<StandardText
					size="lg"
					colorScheme="neutral"
					className="max-w-2xl mx-auto">
					Componentes visuales esféricos con consciencia de tamaño y layout inteligente.
					Las esferas son el corazón visual de SUSTRATO.AI.
				</StandardText>
				<div className="mt-4 flex items-center justify-center gap-4">
					<ThemeSwitcher />
					<LocaleSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
				colorScheme="tertiary"
				styleType="line">
				<StandardTabsList className="grid w-full grid-cols-4 mb-8">
					<StandardTabsTrigger value="interactive">
						Esfera Individual
					</StandardTabsTrigger>
					<StandardTabsTrigger value="grid">Grid Inteligente</StandardTabsTrigger>
					<StandardTabsTrigger value="styles">Estilos</StandardTabsTrigger>
					<StandardTabsTrigger value="sizes">Tamaños</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{/* TAB 1: ESFERA INDIVIDUAL INTERACTIVA */}
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="grid md:grid-cols-3 gap-8">
								
								{/* Panel de Controles */}
								<div className="md:col-span-1 space-y-6">
									<div>
										<StandardText weight="semibold" className="mb-3">
											Apariencia
										</StandardText>
										<StandardSelect
											placeholder="Color Scheme"
											value={demoColorScheme}
											onChange={(value) => setDemoColorScheme(value as ColorSchemeVariant)}
											options={colorSchemesForDemo.map((cs) => ({
												value: cs,
												label: cs.charAt(0).toUpperCase() + cs.slice(1),
											}))}
										/>
										<StandardSelect
											placeholder="Style Type"
											value={demoStyleType}
											onChange={(value) => setDemoStyleType(value as "filled" | "subtle" | "outline")}
											options={styleTypesForDemo.map((st) => ({
												value: st,
												label: st.charAt(0).toUpperCase() + st.slice(1),
											}))}
										/>
										<StandardSelect
											placeholder="Tamaño"
											value={String(demoSize)}
											onChange={(value) => setDemoSize(Number(value))}
											options={sizePresetsForDemo.map(p => ({ label: p.label, value: String(p.value) }))}
										/>
									</div>

									<div>
										<StandardText weight="semibold" className="mb-3">
											Contenido
										</StandardText>
										<div className="space-y-2">
											<input
												type="text"
												value={demoValue}
												onChange={(e) => setDemoValue(e.target.value)}
												placeholder="Valor (ej: 42)"
												className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
											/>
											<StandardSelect
												placeholder="Ícono"
												value={demoIcon}
												onChange={(value) => setDemoIcon(value as string)}
												options={iconOptions.map(opt => ({ label: opt.label, value: opt.value }))}
											/>
											<StandardSelect
												placeholder="Emoticón"
												value={demoEmoticon}
												onChange={(value) => setDemoEmoticon(value as string)}
												options={emoticonOptions}
											/>
										</div>
									</div>

									<div>
										<StandardText weight="semibold" className="mb-3">
											Opciones
										</StandardText>
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoOnlyIcon}
													onCheckedChange={setDemoOnlyIcon}
												/>
												<StandardText size="sm">Solo Ícono</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoOnlyEmoticon}
													onCheckedChange={setDemoOnlyEmoticon}
												/>
												<StandardText size="sm">Solo Emoticón</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoShowBadge}
													onCheckedChange={setDemoShowBadge}
												/>
												<StandardText size="sm">Mostrar Badge</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoTooltip}
													onCheckedChange={setDemoTooltip}
												/>
												<StandardText size="sm">Mostrar Tooltip</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoDisabled}
													onCheckedChange={setDemoDisabled}
												/>
												<StandardText size="sm">Deshabilitado</StandardText>
											</div>
										</div>
									</div>

									<div>
										<StandardText weight="semibold" className="mb-3">
											🌊 Efectos Visuales
										</StandardText>
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoShimmer}
													onCheckedChange={setDemoShimmer}
												/>
												<StandardText size="sm">✨ Shimmer (Jobs en ejecución)</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoBreathing}
													onCheckedChange={setDemoBreathing}
												/>
												<StandardText size="sm">🌸 Breathing (Estado activo)</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={demoSubtle}
													onCheckedChange={setDemoSubtle}
												/>
												<StandardText size="sm">💫 Subtle (Pulsación suave)</StandardText>
											</div>
										</div>
									</div>
								</div>

								{/* Preview de la Esfera */}
								<div className="md:col-span-2 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg min-h-[400px] p-8">
									<StandardSphere
										sizeInPx={demoSize}
										colorScheme={demoColorScheme}
										styleType={demoStyleType}
										value={demoOnlyIcon || demoOnlyEmoticon ? undefined : demoValue}
										icon={selectedIconComponent || undefined}
										onlyIcon={demoOnlyIcon}
										emoticon={demoEmoticon !== "none" ? demoEmoticon : undefined}
										onlyEmoticon={demoOnlyEmoticon}
										statusBadge={demoBadge}
										tooltip={demoTooltip ? "Esta es una esfera de ejemplo 🌊" : undefined}
										disabled={demoDisabled}
										shimmer={demoShimmer}
										breathing={demoBreathing}
										subtle={demoSubtle}
										onClick={() => console.log("🌊 Esfera clickeada!")}
									/>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* TAB 2: GRID INTELIGENTE */}
					{activeTab === "grid" && (
						<StandardTabsContent forceMount value="grid" asChild>
							<motion.section
								key="grid"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="space-y-6">
								
								{/* Controles del Grid */}
								<StandardCard styleType="subtle" className="p-6">
									<div className="grid md:grid-cols-4 gap-4">
										<div>
											<StandardText weight="semibold" className="mb-2">
												Cantidad de Items
											</StandardText>
											<input
												type="number"
												value={gridItemCount}
												onChange={(e) => setGridItemCount(Number(e.target.value))}
												min={1}
												max={50}
												className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
											/>
										</div>
										<div>
											<StandardText weight="semibold" className="mb-2">
												Color del Card
											</StandardText>
											<StandardSelect
												value={gridColorScheme}
												onChange={(value) => setGridColorScheme(value as ColorSchemeVariant)}
												options={colorSchemesForDemo.map((cs) => ({
													value: cs,
													label: cs.charAt(0).toUpperCase() + cs.slice(1),
												}))}
											/>
										</div>
										<div>
											<StandardText weight="semibold" className="mb-2">
												Tamaño Fijo (opcional)
											</StandardText>
											<StandardSelect
												value={gridFixedSize ? String(gridFixedSize) : "auto"}
												onChange={(value) => setGridFixedSize(value === "auto" ? undefined : Number(value))}
												options={[
													{ label: "Auto (inteligente)", value: "auto" },
													...sizePresetsForDemo.map(p => ({ label: p.label, value: String(p.value) })),
												]}
											/>
										</div>
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={gridShowBadges}
													onCheckedChange={setGridShowBadges}
												/>
												<StandardText size="sm">Mostrar Badges</StandardText>
											</div>
											<div className="flex items-center gap-2">
												<StandardSwitch
													checked={gridForceBadge}
													onCheckedChange={setGridForceBadge}
												/>
												<StandardText size="sm">Forzar Badge (min 48px)</StandardText>
											</div>
										</div>
									</div>
								</StandardCard>

								{/* Grid en Acción */}
								<div style={{ height: `${gridContainerHeight}px` }}>
									<StandardSphereGrid
										containerWidth={gridContainerWidth}
										containerHeight={gridContainerHeight}
										items={gridItems}
										cardColorScheme={gridColorScheme}
										title="Grid Inteligente en Acción"
										subtitle={`${gridItemCount} esferas con layout automático`}
										fixedSize={gridFixedSize}
										forceBadge={gridForceBadge}
										emptyStateText="No hay esferas para mostrar"
									/>
								</div>

								{/* Explicación */}
								<StandardCard styleType="subtle" colorScheme="neutral" className="p-6">
									<StandardText weight="semibold" colorScheme="info" className="mb-2">
										💡 Algoritmo Inteligente
									</StandardText>
									<StandardText size="sm" colorScheme="neutral">
										El StandardSphereGrid usa un algoritmo de búsqueda binaria para calcular
										el tamaño óptimo de las esferas. Considera el espacio disponible, la cantidad
										de items, y si hay badges. Automáticamente decide entre modo &quot;rectangular&quot; 
										(con espacio para badges) o &quot;square&quot; (sin badges) para maximizar el uso del espacio.
									</StandardText>
								</StandardCard>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* TAB 3: ESTILOS */}
					{activeTab === "styles" && (
						<StandardTabsContent forceMount value="styles" asChild>
							<motion.div
								key="styles"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="space-y-8">
								
								{styleTypesForDemo.map((styleType) => (
									<div key={styleType}>
										<StandardText weight="semibold" size="lg" className="mb-4">
											{styleType.charAt(0).toUpperCase() + styleType.slice(1)}
										</StandardText>
										<div className="grid grid-cols-4 md:grid-cols-8 gap-6">
											{colorSchemesForDemo.map((colorScheme) => (
												<div key={colorScheme} className="flex flex-col items-center gap-2">
													<StandardSphere
														sizeInPx={56}
														colorScheme={colorScheme}
														styleType={styleType}
														value={colorScheme.slice(0, 3).toUpperCase()}
													/>
													<StandardText size="xs" colorScheme="neutral">
														{colorScheme}
													</StandardText>
												</div>
											))}
										</div>
									</div>
								))}
							</motion.div>
						</StandardTabsContent>
					)}

					{/* TAB 4: TAMAÑOS */}
					{activeTab === "sizes" && (
						<StandardTabsContent forceMount value="sizes" asChild>
							<motion.div
								key="sizes"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="space-y-8">
								
								<StandardCard styleType="subtle" className="p-6">
									<StandardText weight="semibold" size="lg" className="mb-4">
										Escala de Tamaños con Consciencia Semántica
									</StandardText>
									<StandardText size="sm" colorScheme="neutral" className="mb-6">
										Las esferas ajustan automáticamente el tamaño de su contenido (texto, íconos, emoticonos)
										según su diámetro. Esto se llama &quot;consciencia de tamaño&quot;.
									</StandardText>
									
									<div className="flex flex-wrap items-end justify-center gap-8">
										{sizePresetsForDemo.map((preset) => (
											<div key={preset.value} className="flex flex-col items-center gap-3">
												<StandardSphere
													sizeInPx={preset.value}
													colorScheme="primary"
													styleType="filled"
													value={`${preset.value}`}
													icon={Star}
													statusBadge={preset.value >= 48 ? {
														text: "OK",
														colorScheme: "success",
														styleType: "subtle",
													} : undefined}
												/>
												<StandardText size="xs" colorScheme="neutral">
													{preset.label}
												</StandardText>
											</div>
										))}
									</div>
								</StandardCard>

								<StandardCard styleType="subtle" colorScheme="neutral" className="p-6">
									<StandardText weight="semibold" colorScheme="warning" className="mb-2">
										⚠️ Nota sobre Badges
									</StandardText>
									<StandardText size="sm" colorScheme="neutral">
										Los badges solo se muestran cuando el diámetro de la esfera es ≥ 48px.
										Esto es parte de la &quot;consciencia&quot; del componente para mantener la legibilidad.
									</StandardText>
								</StandardCard>
							</motion.div>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}
//#endregion ![main]
