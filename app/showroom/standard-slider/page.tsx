"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- ✅ Componentes "Standard" ---
import {
	StandardSlider,
	type StandardSliderProps,
} from "@/components/ui/StandardSlider";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";

// --- Componentes de UI Generales ---
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

// --- INICIO DE LA CORRECCIÓN ---
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
// --- FIN DE LA CORRECCIÓN ---

import {
	Palette,
	Scaling,
	ToggleLeft,
	GitCompareArrows,
	SlidersHorizontal,
} from "lucide-react";

// --- Opciones para los Controles ---
const sliderColorSchemes: NonNullable<StandardSliderProps["colorScheme"]>[] = [
	"primary",
	"secondary",
	"tertiary",
	"accent",
	"success",
	"warning",
	"danger",
	"neutral",
];
const styleTypes: NonNullable<StandardSliderProps["styleType"]>[] = [
	"solid",
	"gradient",
];
const sizes: NonNullable<StandardSliderProps["size"]>[] = [
	"xs",
	"sm",
	"md",
	"lg",
	"xl",
];

// --- Variantes de Animación Framer Motion ---
const tabContentVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.3, ease: "easeInOut" },
	},
	exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeInOut" } },
};
const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
};

export default function StandardSliderShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");

	// --- Estados para el Demo Interactivo ---
	const [demoValue, setDemoValue] = useState([50]);
	const [demoColorScheme, setDemoColorScheme] =
		useState<NonNullable<StandardSliderProps["colorScheme"]>>("primary");
	const [demoStyleType, setDemoStyleType] =
		useState<NonNullable<StandardSliderProps["styleType"]>>("solid");
	const [demoSize, setDemoSize] =
		useState<NonNullable<StandardSliderProps["size"]>>("md");
	const [isDisabled, setIsDisabled] = useState(false);

	// --- Estado para el demo de Rango ---
	const [rangeValue, setRangeValue] = useState([25, 75]);

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					applyGradient
					colorScheme="primary"
					className="mb-3">
					StandardSlider Showroom
				</StandardText>
				<StandardText
					asElement="p"
					size="lg"
					colorScheme="neutral"
					colorShade="text"
					className="max-w-2xl mx-auto">
					Un slider totalmente refactorizado, coherente y personalizable.
				</StandardText>
				<div className="mt-4">
					<ThemeSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
                colorScheme="primary"
                styleType="line"
            >
				<StandardTabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="schemes">
						Esquemas y Estilos
					</StandardTabsTrigger>
					<StandardTabsTrigger value="sizes">Tamaños</StandardTabsTrigger>
					<StandardTabsTrigger value="states">
						Estados y Modos
					</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-8 p-6 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
								<StandardText
									asElement="h2"
									size="xl"
									weight="semibold"
									className="mb-2">
									Demo Interactivo
								</StandardText>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
									<div className="space-y-1">
										<StandardText asElement="span" size="sm" weight="medium">
											<Palette size={14} className="inline mr-1" />
											Esquema de Color:
										</StandardText>
										<StandardSelect
											value={demoColorScheme}
											onChange={(val) => setDemoColorScheme(val as any)}
											options={sliderColorSchemes.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="span" size="sm" weight="medium">
											<SlidersHorizontal size={14} className="inline mr-1" />
											Tipo de Estilo:
										</StandardText>
										<StandardSelect
											value={demoStyleType}
											onChange={(val) => setDemoStyleType(val as any)}
											options={styleTypes.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="span" size="sm" weight="medium">
											<Scaling size={14} className="inline mr-1" />
											Tamaño:
										</StandardText>
										<StandardSelect
											value={demoSize}
											onChange={(val) => setDemoSize(val as any)}
											options={sizes.map((s) => ({ value: s, label: s }))}
										/>
									</div>
								</div>

								<div className="flex flex-wrap gap-3 pt-4">
									<StandardButton
										size="sm"
										styleType={isDisabled ? "solid" : "outline"}
										onClick={() => setIsDisabled(!isDisabled)}>
										Toggle Deshabilitado
									</StandardButton>
								</div>

								<div className="mt-8 pt-8 border-t border-dashed">
									<StandardText
										asElement="p"
										weight="medium"
										className="text-center mb-4">
										Valor: {demoValue[0]}
									</StandardText>
									<StandardSlider
										key={`${demoColorScheme}-${demoStyleType}-${demoSize}-${isDisabled}`}
										colorScheme={demoColorScheme}
										styleType={demoStyleType}
										size={demoSize}
										disabled={isDisabled}
										value={demoValue}
										onValueChange={setDemoValue}
										max={100}
										step={1}
									/>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "schemes" && (
						<StandardTabsContent forceMount value="schemes" asChild>
							<motion.section
								key="schemes"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								{sliderColorSchemes.map((cs) => (
									<motion.div key={cs} variants={itemVariants}>
										<StandardText
											asElement="h3"
											size="lg"
											weight="medium"
											className="mb-4 capitalize">
											{cs}
										</StandardText>
										<div className="space-y-6">
											<div>
												<StandardText
													asElement="p"
													size="sm"
													colorScheme="neutral"
													color="text"
													className="mb-1.5">
													Estilo: Solid
												</StandardText>
												<StandardSlider
													colorScheme={cs}
													styleType="solid"
													defaultValue={[60]}
												/>
											</div>
											<div>
												<StandardText
													asElement="p"
													size="sm"
													colorScheme="neutral"
													colorShade="text"
													className="mb-1.5">
													Estilo: Gradient
												</StandardText>
												<StandardSlider
													colorScheme={cs}
													styleType="gradient"
													defaultValue={[60]}
												/>
											</div>
										</div>
									</motion.div>
								))}
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "sizes" && (
						<StandardTabsContent forceMount value="sizes" asChild>
							<motion.section
								key="sizes"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-8">
								<StandardText asElement="h2" size="xl" weight="semibold">
									Variaciones de Tamaño
								</StandardText>
								<motion.div
									className="space-y-8"
									initial="hidden"
									animate="visible">
									{sizes.map((s) => (
										<motion.div key={s} variants={itemVariants}>
											<StandardText
												asElement="p"
												size="sm"
												weight="medium"
												className="mb-2 uppercase">
												Tamaño: {s}
											</StandardText>
											<StandardSlider
												colorScheme="secondary"
												styleType="gradient"
												size={s}
												defaultValue={[75]}
											/>
										</motion.div>
									))}
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "states" && (
						<StandardTabsContent forceMount value="states" asChild>
							<motion.section
								key="states"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-12">
								<div>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-3">
										Modo Rango (Multi-Thumb){" "}
										<GitCompareArrows size={16} className="inline-block ml-2" />
									</StandardText>
									<StandardText
										asElement="p"
										colorScheme="neutral"
										colorShade="text"
										className="text-center mb-4">
										Rango: {rangeValue[0]} - {rangeValue[1]}
									</StandardText>
									<StandardSlider
										colorScheme="accent"
										styleType="gradient"
										value={rangeValue}
										onValueChange={setRangeValue}
									/>
								</div>
								<div>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-3">
										Orientación Vertical
									</StandardText>
									<div className="flex justify-center items-center h-48">
										<StandardSlider
											colorScheme="tertiary"
											styleType="solid"
											defaultValue={[65]}
											orientation="vertical"
										/>
									</div>
								</div>
								<div>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-3">
										Estado Deshabilitado{" "}
										<ToggleLeft size={16} className="inline-block ml-2" />
									</StandardText>
									<StandardSlider disabled defaultValue={[50]} />
								</div>
							</motion.section>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}