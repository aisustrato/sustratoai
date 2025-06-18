"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	StandardIcon,
	type StandardIconSize,
	type StandardIconProps,
} from "@/components/ui/StandardIcon";
import {
	type StandardIconStyleType,
	type StandardIconColorShade,
} from "@/lib/theme/components/standard-icon-tokens";
import { StandardButton } from "@/components/ui/StandardButton";
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

import { Heart } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardCard } from "@/components/ui/StandardCard";
import { cn } from "@/lib/utils";

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
	"white",
];
const sizesForDemo: StandardIconSize[] = [
	"xs",
	"sm",
	"base",
	"lg",
	"xl",
	"2xl",
];
const shadesForDemo: StandardIconColorShade[] = [
	"pure",
	"text",
	"textShade",
	"bg",
	"contrastText",
	"subtle",
];
const styleTypesForDemo: StandardIconStyleType[] = [
	"solid",
	"outline",
	"outlineGradient",
	"inverseStroke",
];

const animationVariants = {
	gridContainer: {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
	},
	item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
	tabContent: {
		hidden: { opacity: 0, x: -10 },
		visible: {
			opacity: 1,
			x: 0,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
		exit: {
			opacity: 0,
			x: 10,
			transition: { duration: 0.2, ease: "easeInOut" },
		},
	},
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardIconShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");
	const [demoColorScheme, setDemoColorScheme] =
		useState<ColorSchemeVariant>("primary");
	const [demoStyleType, setDemoStyleType] =
		useState<StandardIconStyleType>("solid");
	const [demoColorShade, setDemoColorShade] =
		useState<StandardIconColorShade>("pure");
	const [demoSize, setDemoSize] = useState<StandardIconSize>("2xl");
	const isShadeDisabled =
		demoStyleType === "outlineGradient" || demoStyleType === "inverseStroke";

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					colorScheme="primary"
					className="mb-3">
					StandardIcon Showroom v2.3
				</StandardText>
				<StandardText
					size="lg"
					colorScheme="neutral"
					className="max-w-2xl mx-auto">
					Explora las capacidades del componente `StandardIcon` refactorizado
					con su nueva API.
				</StandardText>
				<div className="mt-4 flex items-center justify-center gap-4">
					<ThemeSwitcher />
					<StandardButton colorScheme={demoColorScheme} styleType="solid">
						<StandardIcon
							colorScheme={demoColorScheme}
							colorShade="contrastText">
							<Heart size={16} />
						</StandardIcon>
						<StandardText>Equivalente</StandardText>
					</StandardButton>
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
                colorScheme="accent"
                styleType="line"
            >
				<StandardTabsList className="grid w-full grid-cols-4 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="schemes">Esquemas</StandardTabsTrigger>
					<StandardTabsTrigger value="shades">Variantes</StandardTabsTrigger>
					<StandardTabsTrigger value="styles">Estilos</StandardTabsTrigger>
				</StandardTabsList>
				<AnimatePresence mode="wait">
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								variants={animationVariants.tabContent}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="grid grid-cols-1 md:grid-cols-3 gap-8">
								<div className="md:col-span-1 space-y-6">
									<StandardText asElement="h3" size="lg" weight="semibold">
										Controles
									</StandardText>
									<div className="space-y-4">
										<div className="space-y-1">
											<label htmlFor="cs-select">
												<StandardText size="sm" weight="medium">
													Color Scheme:
												</StandardText>
											</label>
											<StandardSelect
												id="cs-select"
												value={demoColorScheme}
												onChange={(v) =>
													setDemoColorScheme(v as ColorSchemeVariant)
												}
												options={colorSchemesForDemo.map((s) => ({
													value: s,
													label: s,
												}))}
											/>
										</div>
										<div className="space-y-1">
											<label htmlFor="st-select">
												<StandardText size="sm" weight="medium">
													Style Type:
												</StandardText>
											</label>
											<StandardSelect
												id="st-select"
												value={demoStyleType}
												onChange={(v) =>
													setDemoStyleType(v as StandardIconStyleType)
												}
												options={styleTypesForDemo.map((s) => ({
													value: s,
													label: s,
												}))}
											/>
										</div>
										<div className="space-y-1">
											<label htmlFor="shade-select">
												<StandardText
													size="sm"
													weight="medium"
													className={cn(isShadeDisabled && "opacity-50")}>
													Color Shade:
												</StandardText>
											</label>
											<StandardSelect
												id="shade-select"
												value={demoColorShade}
												onChange={(v) => setDemoColorShade(v as any)}
												options={shadesForDemo.map((s) => ({
													value: s,
													label: s,
												}))}
												disabled={isShadeDisabled}
											/>
											{isShadeDisabled && (
												<StandardText
													size="xs"
													colorScheme="neutral"
													className="italic opacity-70">
													Ignorado para este Style Type
												</StandardText>
											)}
										</div>
										<div className="space-y-1">
											<label htmlFor="size-select">
												<StandardText size="sm" weight="medium">
													Size:
												</StandardText>
											</label>
											<StandardSelect
												id="size-select"
												value={demoSize}
												onChange={(v) => setDemoSize(v as StandardIconSize)}
												options={sizesForDemo.map((s) => ({
													value: s,
													label: s,
												}))}
											/>
										</div>
									</div>
								</div>
								<div className="md:col-span-2 flex items-center justify-center bg-neutral-bg-subtle dark:bg-neutral-bg-subtle-dark rounded-lg min-h-[300px] p-8">
									<StandardIcon
										key={`${demoColorScheme}-${demoStyleType}-${demoColorShade}-${demoSize}`}
										colorScheme={demoColorScheme}
										styleType={demoStyleType}
										colorShade={demoColorShade}
										size={demoSize}>
										<Heart />
									</StandardIcon>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}
					{["schemes", "shades", "styles"].includes(activeTab) && (
						<StandardTabsContent forceMount value={activeTab} asChild>
							<motion.div
								key={activeTab}
								variants={animationVariants.tabContent}
								initial="hidden"
								animate="visible"
								exit="exit">
								{activeTab === "schemes" && (
									<motion.div
										className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4"
										variants={animationVariants.gridContainer}
										initial="hidden"
										animate="visible">
										{colorSchemesForDemo.map((cs) => (
											<motion.div
												key={cs}
												variants={animationVariants.item}
												className="flex flex-col items-center gap-2">
												<StandardCard
													shadow="sm"
													className="w-full aspect-square flex items-center justify-center">
													<StandardIcon colorScheme={cs} size="2xl">
														<Heart />
													</StandardIcon>
												</StandardCard>
												<StandardText size="xs" className="capitalize">
													{cs}
												</StandardText>
											</motion.div>
										))}
									</motion.div>
								)}
								{activeTab === "shades" && (
									<motion.div
										className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
										variants={animationVariants.gridContainer}
										initial="hidden"
										animate="visible">
										{shadesForDemo.map((shade) => (
											<motion.div
												key={shade}
												variants={animationVariants.item}
												className="flex flex-col items-center gap-2">
												<StandardCard
													colorScheme="primary"
													styleType="subtle"
													shadow="sm"
													className="w-full aspect-square flex items-center justify-center">
													<StandardIcon
														colorScheme="primary"
														styleType={shade === "subtle" ? "solid" : "outline"}
														colorShade={shade}
														size="2xl">
														<Heart />
													</StandardIcon>
												</StandardCard>
												<StandardText
													size="sm"
													weight="medium"
													className="capitalize">
													{shade}
												</StandardText>
											</motion.div>
										))}
									</motion.div>
								)}
								{activeTab === "styles" && (
									<motion.div
										className="grid grid-cols-2 md:grid-cols-4 gap-4"
										variants={animationVariants.gridContainer}
										initial="hidden"
										animate="visible">
										{styleTypesForDemo.flatMap((st) => {
											if (st === "outlineGradient") {
												const schemesToTestGradient: ColorSchemeVariant[] = [
													"primary",
													"accent",
													"neutral",
													"warning",
												];
												return schemesToTestGradient.map((csGrad) => (
													<motion.div
														key={`${st}-${csGrad}`}
														variants={animationVariants.item}
														className="flex flex-col items-center gap-2">
														<StandardCard
															shadow="sm"
															className="w-full aspect-square flex items-center justify-center">
															<StandardIcon
																colorScheme={csGrad}
																styleType={st}
																size="2xl">
																<Heart />
															</StandardIcon>
														</StandardCard>
														<StandardText
															size="xs"
															weight="medium"
															className="capitalize">
															{st.replace(/([A-Z])/g, " $1").trim()} ({csGrad})
														</StandardText>
													</motion.div>
												));
											} else {
												return (
													<motion.div
														key={st}
														variants={animationVariants.item}
														className="flex flex-col items-center gap-2">
														<StandardCard
															shadow="sm"
															className="w-full aspect-square flex items-center justify-center">
															<StandardIcon
																colorScheme="primary"
																styleType={st}
																size="2xl">
																<Heart />
															</StandardIcon>
														</StandardCard>
														<StandardText
															size="sm"
															weight="medium"
															className="capitalize">
															{st.replace(/([A-Z])/g, " $1").trim()}
														</StandardText>
													</motion.div>
												);
											}
										})}
									</motion.div>
								)}
							</motion.div>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}
//#endregion ![main]