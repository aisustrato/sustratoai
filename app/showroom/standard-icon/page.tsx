//. 📍 app/showroom/standard-icon/page.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardIcon, type StandardIconProps } from "@/components/ui/StandardIcon";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { StandardIconSize } from "@/lib/theme/components/standard-icon-tokens";
import { StandardCard } from "@/components/ui/StandardCard";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
const colorSchemesForDemo: ColorSchemeVariant[] = [
	"primary", "secondary", "tertiary", "accent", "success",
	"warning", "danger", "neutral", "white",
];
const sizesForDemo: StandardIconSize[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
const shadesForDemo: NonNullable<StandardIconProps['colorShade']>[] = ['pure', 'text', 'shade', 'bg'];

const animationVariants = {
    gridContainer: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
    tabContent: {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
        exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: "easeInOut" } },
    },
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardIconShowroomPage() {
	//#region [sub] - ✨ STATE MANAGEMENT ✨
	const [activeTab, setActiveTab] = useState("interactive");

	const [demoColorScheme, setDemoColorScheme] = useState<ColorSchemeVariant>("primary");
	const [demoColorShade, setDemoColorShade] = useState<NonNullable<StandardIconProps['colorShade']>>("text");
	const [demoSize, setDemoSize] = useState<StandardIconSize>("2xl");
	const [demoApplyGradient, setDemoApplyGradient] = useState(false);
	const [demoGradientScheme, setDemoGradientScheme] = useState<ColorSchemeVariant>("accent");
	const [demoStrokeOnly, setDemoStrokeOnly] = useState(false);
	const [demoInverseStroke, setDemoInverseStroke] = useState(false);
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText asElement="h1" size="3xl" weight="bold" colorScheme="primary" className="mb-3">
					StandardIcon Showroom
				</StandardText>
				<StandardText size="lg" colorScheme="neutral" className="max-w-2xl mx-auto">
					Explora las capacidades y configuraciones del componente atómico StandardIcon.
				</StandardText>
				<div className="mt-4"><ThemeSwitcher /></div>
			</header>

			<Tabs defaultValue="interactive" className="w-full" onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
					<TabsTrigger value="interactive">Interactivo</TabsTrigger>
					<TabsTrigger value="schemes">Esquemas</TabsTrigger>
					<TabsTrigger value="shades">Variantes</TabsTrigger>
					<TabsTrigger value="gradients">Gradientes</TabsTrigger>
				</TabsList>

				<AnimatePresence mode="wait">
					{/* Pestaña Interactiva */}
					{activeTab === "interactive" && (
						<TabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								variants={animationVariants.tabContent}
								initial="hidden" animate="visible" exit="exit"
								className="grid grid-cols-1 md:grid-cols-3 gap-8"
							>
								<div className="md:col-span-1 space-y-6">
                                    <StandardText asElement="h3" size="lg" weight="semibold">Controles</StandardText>
									<div className="space-y-4">
										<div className="space-y-1">
                                            <label htmlFor="cs-select"><StandardText size="sm" weight="medium">Color Scheme:</StandardText></label>
											<StandardSelect id="cs-select" value={demoColorScheme} onChange={(v) => setDemoColorScheme(v as ColorSchemeVariant)} options={colorSchemesForDemo.map(s => ({ value: s, label: s }))} />
										</div>
                                        <div className="space-y-1">
                                            <label htmlFor="shade-select"><StandardText size="sm" weight="medium">Color Shade:</StandardText></label>
											{/* CORREGIDO: setDemoColorShde -> setDemoColorShade */}
											<StandardSelect id="shade-select" value={demoColorShade} onChange={(v) => setDemoColorShade(v as any)} options={shadesForDemo.map(s => ({ value: s, label: s }))} />
										</div>
										<div className="space-y-1">
                                            <label htmlFor="size-select"><StandardText size="sm" weight="medium">Size:</StandardText></label>
											<StandardSelect id="size-select" value={demoSize} onChange={(v) => setDemoSize(v as StandardIconSize)} options={sizesForDemo.map(s => ({ value: s, label: s }))} />
										</div>
                                        {demoApplyGradient && (
                                            <div className="space-y-1">
                                                <label htmlFor="grad-cs-select"><StandardText size="sm" weight="medium">Gradient Scheme:</StandardText></label>
                                                <StandardSelect id="grad-cs-select" value={demoGradientScheme} onChange={(v) => setDemoGradientScheme(v as ColorSchemeVariant)} options={colorSchemesForDemo.map(s => ({ value: s, label: s }))} />
                                            </div>
                                        )}
									</div>
                                    <div className="flex flex-col space-y-2">
                                        <StandardButton styleType={demoApplyGradient ? 'solid' : 'outline'} onClick={() => setDemoApplyGradient(!demoApplyGradient)}>
                                            Toggle Gradient
                                        </StandardButton>
                                        <StandardButton styleType={demoStrokeOnly ? 'solid' : 'outline'} onClick={() => setDemoStrokeOnly(!demoStrokeOnly)}>
                                            Toggle Stroke Only
                                        </StandardButton>
                                        <StandardButton styleType={demoInverseStroke ? 'solid' : 'outline'} onClick={() => setDemoInverseStroke(!demoInverseStroke)} disabled={!demoApplyGradient}>
                                            Toggle Inverse Stroke
                                        </StandardButton>
                                    </div>
								</div>

								<div className="md:col-span-2 flex items-center justify-center bg-neutral-bg-subtle dark:bg-neutral-bg-subtle-dark rounded-lg min-h-[300px] p-8">
                                    <StandardIcon
                                        key={Math.random()}
                                        colorScheme={demoColorScheme}
                                        colorShade={demoColorShade}
                                        size={demoSize}
                                        applyGradient={demoApplyGradient}
                                        gradientColorScheme={demoGradientScheme}
                                        strokeOnly={demoStrokeOnly}
                                        inverseStroke={demoInverseStroke}
                                    >
                                        <Heart />
                                    </StandardIcon>
								</div>
							</motion.section>
						</TabsContent>
					)}

                    {/* Otras Pestañas */}
                    {["schemes", "shades", "gradients"].includes(activeTab) && (
                         <TabsContent forceMount value={activeTab} asChild>
                             <motion.div key={activeTab} variants={animationVariants.tabContent} initial="hidden" animate="visible" exit="exit">
                                {activeTab === "schemes" && (
                                    <motion.div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4" variants={animationVariants.gridContainer} initial="hidden" animate="visible">
                                        {colorSchemesForDemo.map(cs => (
                                            <motion.div key={cs} variants={animationVariants.item} className="flex flex-col items-center gap-2">
                                                <StandardCard shadow="sm" className="w-full aspect-square flex items-center justify-center">
                                                    <StandardIcon colorScheme={cs} size="2xl"><Heart /></StandardIcon>
                                                </StandardCard>
                                                <StandardText size="xs" className="capitalize">{cs}</StandardText>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                                {activeTab === "shades" && (
                                     <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={animationVariants.gridContainer} initial="hidden" animate="visible">
                                        {shadesForDemo.map(shade => (
                                            <motion.div key={shade} variants={animationVariants.item} className="flex flex-col items-center gap-2">
                                                 <StandardCard colorScheme="primary" styleType="subtle" shadow="sm" className="w-full aspect-square flex items-center justify-center">
                                                    <StandardIcon colorScheme="primary" colorShade={shade} size="2xl"><Heart /></StandardIcon>
                                                </StandardCard>
                                                <StandardText size="sm" weight="medium" className="capitalize">{shade}</StandardText>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                                {activeTab === "gradients" && (
                                     <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={animationVariants.gridContainer} initial="hidden" animate="visible">
                                        <motion.div variants={animationVariants.item} className="flex flex-col items-center gap-2">
                                            <StandardCard shadow="sm" className="w-full aspect-square flex items-center justify-center">
                                                <StandardIcon applyGradient gradientColorScheme="secondary" colorScheme="primary" size="2xl"><Heart /></StandardIcon>
                                            </StandardCard>
                                            <StandardText size="xs">Primary to Secondary</StandardText>
                                        </motion.div>
                                         <motion.div variants={animationVariants.item} className="flex flex-col items-center gap-2">
                                            <StandardCard shadow="sm" className="w-full aspect-square flex items-center justify-center">
                                                <StandardIcon applyGradient gradientColorScheme="danger" colorScheme="warning" size="2xl"><Heart /></StandardIcon>
                                            </StandardCard>
                                            <StandardText size="xs">Warning to Danger</StandardText>
                                        </motion.div>
                                        <motion.div variants={animationVariants.item} className="flex flex-col items-center gap-2">
                                            <StandardCard shadow="sm" className="w-full aspect-square flex items-center justify-center">
                                                <StandardIcon applyGradient strokeOnly colorScheme="tertiary" size="2xl"><Heart /></StandardIcon>
                                            </StandardCard>
                                            <StandardText size="xs">Stroke Only</StandardText>
                                        </motion.div>
                                         <motion.div variants={animationVariants.item} className="flex flex-col items-center gap-2">
                                            {/* CORREGIDO: </Card> -> </StandardCard> */}
                                            <StandardCard shadow="sm" className="w-full aspect-square flex items-center justify-center">
                                                <StandardIcon applyGradient inverseStroke colorScheme="accent" size="2xl"><Heart /></StandardIcon>
                                            </StandardCard>
                                            <StandardText size="xs">Inverse Stroke</StandardText>
                                        </motion.div>
                                    </motion.div>
                                )}
                             </motion.div>
                         </TabsContent>
                    )}

				</AnimatePresence>
			</Tabs>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]