"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { StandardButton } from "@/components/ui/StandardButton";
import {
	type StandardButtonStyleType,
	type StandardButtonModifier,
	type StandardButtonSize,
	type StandardButtonRounded,
} from "@/lib/theme/components/standard-button-tokens";

import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

// --- INICIO DE LA CORRECCIÓN ---
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
// --- FIN DE LA CORRECCIÓN ---

import { StandardCard } from "@/components/ui/StandardCard";
import { Rocket, Star } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

//#region [def] - 📦 TYPES & CONSTANTS 📦
type IconLayout = "none" | "left" | "right" | "both" | "iconOnly";

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
const styleTypesForDemo: StandardButtonStyleType[] = [
	"solid",
	"outline",
	"ghost",
	"subtle",
	"link",
];
const sizesForDemo: StandardButtonSize[] = ["xs", "sm", "md", "lg", "xl"];
const roundedForDemo: StandardButtonRounded[] = [
	"none",
	"sm",
	"md",
	"lg",
	"full",
];
const modifiersForDemo: StandardButtonModifier[] = ["gradient", "elevated"];
const iconLayoutsForDemo: { value: IconLayout; label: string }[] = [
	{ value: "both", label: "Left & Right" },
	{ value: "left", label: "Left Only" },
	{ value: "right", label: "Right Only" },
	{ value: "iconOnly", label: "Icon Only (usa Star)" },
	{ value: "none", label: "None (Text Only)" },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardButtonShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");
	const [demoColorScheme, setDemoColorScheme] =
		useState<ColorSchemeVariant>("primary");
	const [demoStyleType, setDemoStyleType] =
		useState<StandardButtonStyleType>("solid");
	const [demoSize, setDemoSize] = useState<StandardButtonSize>("md");
	const [demoRounded, setDemoRounded] = useState<StandardButtonRounded>("md");
	const [demoModifiers, setDemoModifiers] = useState<StandardButtonModifier[]>(
		[]
	);
	const [demoLoading, setDemoLoading] = useState(false);
	const [demoDisabled, setDemoDisabled] = useState(false);
	const [demoIconLayout, setDemoIconLayout] = useState<IconLayout>("both");
	const [demoTooltip, setDemoTooltip] = useState(false);

	const handleModifierChange = useCallback(
		(modifier: StandardButtonModifier) => {
			setDemoModifiers((prev) =>
				prev.includes(modifier)
					? prev.filter((m) => m !== modifier)
					: [...prev, modifier]
			);
		},
		[]
	);

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					colorScheme="primary"
					className="mb-3">
					StandardButton Showroom (Beta v3.3)
				</StandardText>
				<StandardText
					size="lg"
					colorScheme="neutral"
					className="max-w-2xl mx-auto">
					Prueba interactiva del componente `StandardButton` con `iconOnly` y
					`size` corregidos.
				</StandardText>
				<div className="mt-4">
					<ThemeSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
                colorScheme="tertiary"
                styleType="line"
            >
				<StandardTabsList className="grid w-full grid-cols-4 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="styles">Estilos Base</StandardTabsTrigger>
					<StandardTabsTrigger value="schemes">Esquemas</StandardTabsTrigger>
					<StandardTabsTrigger value="modifiers">
						Modificadores
					</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="grid md:grid-cols-3 gap-8">
								<div className="md:col-span-1 space-y-6">
									<div>
										<StandardText weight="semibold">
											Controles Principales
										</StandardText>
										<StandardSelect
											placeholder="Color Scheme"
											value={demoColorScheme}
											onChange={(value: string | string[] | undefined) =>
												setDemoColorScheme(value as ColorSchemeVariant)
											}
											options={colorSchemesForDemo.map((cs) => ({
												value: cs,
												label: cs.charAt(0).toUpperCase() + cs.slice(1),
											}))}
										/>
										<StandardSelect
											placeholder="Style Type"
											value={demoStyleType}
											onChange={(value: string | string[] | undefined) =>
												setDemoStyleType(value as StandardButtonStyleType)
											}
											options={styleTypesForDemo.map((st) => ({
												value: st,
												label: st.charAt(0).toUpperCase() + st.slice(1),
											}))}
										/>
										<StandardSelect
											placeholder="Size"
											value={demoSize}
											onChange={(value: string | string[] | undefined) =>
												setDemoSize(value as StandardButtonSize)
											}
											options={sizesForDemo.map((s) => ({
												value: s,
												label: s.toUpperCase(),
											}))}
										/>
										<StandardSelect
											placeholder="Rounded"
											value={demoRounded}
											onChange={(value: string | string[] | undefined) =>
												setDemoRounded(value as StandardButtonRounded)
											}
											options={roundedForDemo.map((r) => ({
												value: r,
												label: r.charAt(0).toUpperCase() + r.slice(1),
											}))}
										/>
									</div>
									<div>
										<StandardText weight="semibold">Iconos</StandardText>
										<StandardSelect
											placeholder="Icon Layout"
											value={demoIconLayout}
											onChange={(value: string | string[] | undefined) =>
												setDemoIconLayout(value as IconLayout)
											}
											options={iconLayoutsForDemo}
										/>
									</div>
									<div>
										<StandardText weight="semibold">
											Modificadores y Estados
										</StandardText>
										<div className="flex flex-wrap gap-2 mb-3">
											{modifiersForDemo.map((mod) => (
												<StandardButton
													key={mod}
													onClick={() => handleModifierChange(mod)}
													styleType={
														demoModifiers.includes(mod) ? "solid" : "outline"
													}
													size="sm"
													colorScheme="neutral">
													{mod.charAt(0).toUpperCase() + mod.slice(1)}
												</StandardButton>
											))}
										</div>
										<div className="flex flex-wrap gap-2">
											<StandardButton
												onClick={() => setDemoLoading((p) => !p)}
												styleType={demoLoading ? "solid" : "outline"}
												size="sm"
												colorScheme="neutral">
												Loading
											</StandardButton>
											<StandardButton
												onClick={() => setDemoDisabled((p) => !p)}
												styleType={demoDisabled ? "solid" : "outline"}
												size="sm"
												colorScheme="neutral">
												Disabled
											</StandardButton>
											<StandardButton
												onClick={() => setDemoTooltip((p) => !p)}
												styleType={demoTooltip ? "solid" : "outline"}
												size="sm"
												colorScheme="neutral">
												Tooltip
											</StandardButton>
										</div>
									</div>
								</div>

								<div className="md:col-span-2 flex items-center justify-center bg-neutral-bg-subtle dark:bg-neutral-bg-subtle-dark rounded-lg min-h-[300px] p-8">
									<StandardButton
										key={`${demoColorScheme}-${demoStyleType}-${demoSize}-${demoRounded}-${demoModifiers.join(
											"-"
										)}-${demoIconLayout}-${demoLoading}-${demoDisabled}`}
										colorScheme={demoColorScheme}
										styleType={demoStyleType}
										size={demoSize}
										rounded={demoRounded}
										modifiers={demoModifiers}
										loading={demoLoading}
										disabled={demoDisabled}
										leftIcon={
											demoIconLayout === "left" || demoIconLayout === "both"
												? Star
												: undefined
										}
										rightIcon={
											demoIconLayout === "right" || demoIconLayout === "both"
												? Rocket
												: undefined
										}
										iconOnly={demoIconLayout === "iconOnly"}
										tooltip={
											demoTooltip ? "Este es un tooltip de prueba" : undefined
										}>
										{demoIconLayout === "iconOnly" ? (
											<Star />
										) : (
											"Botón de Prueba"
										)}
									</StandardButton>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{["styles", "schemes", "modifiers"].includes(activeTab) && (
						<StandardTabsContent forceMount value={activeTab} asChild>
							<motion.div
								key={activeTab}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1, transition: { staggerChildren: 0.05 } }}>
								<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
									{activeTab === "styles" &&
										styleTypesForDemo.map((st) => (
											<StandardCard
												key={st}
												className="flex flex-col items-center justify-center gap-2 p-4">
												<StandardButton styleType={st} colorScheme="primary">
													{st}
												</StandardButton>
											</StandardCard>
										))}
									{activeTab === "schemes" &&
										colorSchemesForDemo.map((cs) => (
											<StandardCard
												key={cs}
												className="flex flex-col items-center justify-center gap-2 p-4">
												<StandardButton colorScheme={cs}>{cs}</StandardButton>
											</StandardCard>
										))}
									{activeTab === "modifiers" &&
										modifiersForDemo.map((mod) => (
											<StandardCard
												key={mod}
												className="flex flex-col items-center justify-center gap-2 p-4">
												<StandardButton styleType="solid" modifiers={[mod]}>
													{mod}
												</StandardButton>
											</StandardCard>
										))}
								</div>
							</motion.div>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}
//#endregion ![main]