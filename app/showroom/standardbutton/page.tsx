//. 📍 app/showroom/standard-button/page.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	StandardButton,
	type StandardButtonProps,
} from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Star, Plus, Save, Trash2, Settings } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardCard } from "@/components/ui/StandardCard";
import type {
	StandardButtonStyleType,
	StandardButtonSize,
	StandardButtonRounded,
} from "@/lib/theme/components/standard-button-tokens";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
const colorSchemesForDemo: ColorSchemeVariant[] = [
	"primary", "secondary", "tertiary", "accent", "success",
	"warning", "danger", "neutral", "white",
];
const styleTypesForDemo: StandardButtonStyleType[] = ['solid', 'outline', 'ghost', 'link', 'subtle'];
const sizesForDemo: StandardButtonSize[] = ["xs", "sm", "md", "lg", "xl"];
const roundedForDemo: StandardButtonRounded[] = ["none", "sm", "md", "lg", "full"];
const iconMap = { none: undefined, star: Star, plus: Plus, save: Save };
type IconKey = keyof typeof iconMap;

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
export default function StandardButtonShowroomPage() {
	//#region [sub] - ✨ STATE MANAGEMENT ✨
	const [activeTab, setActiveTab] = useState("interactive");

	const [demoStyleType, setDemoStyleType] = useState<StandardButtonStyleType>("solid");
	const [demoColorScheme, setDemoColorScheme] = useState<ColorSchemeVariant>("primary");
	const [demoSize, setDemoSize] = useState<StandardButtonSize>("md");
	const [demoRounded, setDemoRounded] = useState<StandardButtonRounded>("md");
	const [demoLeftIcon, setDemoLeftIcon] = useState<IconKey>("none");
	const [demoRightIcon, setDemoRightIcon] = useState<IconKey>("none");
	const [demoIsLoading, setDemoIsLoading] = useState(false);
	const [demoIsDisabled, setDemoIsDisabled] = useState(false);
	const [demoIsElevated, setDemoIsElevated] = useState(false);
    const [demoIsIconOnly, setDemoIsIconOnly] = useState(false);
	const [demoTooltip, setDemoTooltip] = useState("Este es un tooltip útil");
	//#endregion ![sub]

	const LeftIconComponent = iconMap[demoLeftIcon];
	const RightIconComponent = iconMap[demoRightIcon];

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText asElement="h1" size="3xl" weight="bold" colorScheme="secondary" className="mb-3">
					StandardButton Showroom
				</StandardText>
				<StandardText size="lg" colorScheme="neutral" className="max-w-2xl mx-auto">
					Prueba interactiva de las props y estados del componente StandardButton.
				</StandardText>
				<div className="mt-4"><ThemeSwitcher /></div>
			</header>

			<Tabs defaultValue="interactive" className="w-full" onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
					<TabsTrigger value="interactive">Interactivo</TabsTrigger>
					<TabsTrigger value="styles">Estilos</TabsTrigger>
					<TabsTrigger value="schemes">Esquemas</TabsTrigger>
					<TabsTrigger value="states">Estados</TabsTrigger>
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
										{/* Controles con StandardSelect */}
                                        <div className="space-y-1">
                                            <label htmlFor="st-select"><StandardText size="sm" weight="medium">Style Type:</StandardText></label>
											<StandardSelect id="st-select" value={demoStyleType} onChange={(v) => setDemoStyleType(v as StandardButtonStyleType)} options={styleTypesForDemo.map(s => ({ value: s, label: s }))} />
										</div>
                                        <div className="space-y-1">
                                            <label htmlFor="cs-select"><StandardText size="sm" weight="medium">Color Scheme:</StandardText></label>
											<StandardSelect id="cs-select" value={demoColorScheme} onChange={(v) => setDemoColorScheme(v as ColorSchemeVariant)} options={colorSchemesForDemo.map(s => ({ value: s, label: s }))} />
										</div>
                                        <div className="space-y-1">
                                            <label htmlFor="size-select"><StandardText size="sm" weight="medium">Size:</StandardText></label>
											<StandardSelect id="size-select" value={demoSize} onChange={(v) => setDemoSize(v as StandardButtonSize)} options={sizesForDemo.map(s => ({ value: s, label: s }))} />
										</div>
                                        <div className="space-y-1">
                                            <label htmlFor="round-select"><StandardText size="sm" weight="medium">Rounded:</StandardText></label>
											<StandardSelect id="round-select" value={demoRounded} onChange={(v) => setDemoRounded(v as StandardButtonRounded)} options={roundedForDemo.map(s => ({ value: s, label: s }))} />
										</div>
                                        <div className="space-y-1">
                                            <label htmlFor="left-icon-select"><StandardText size="sm" weight="medium">Left Icon:</StandardText></label>
											<StandardSelect id="left-icon-select" value={demoLeftIcon} onChange={(v) => setDemoLeftIcon(v as IconKey)} options={Object.keys(iconMap).map(k => ({ value: k, label: k }))} />
										</div>
									</div>
                                    <div className="flex flex-col space-y-2">
                                        <StandardButton styleType={demoIsLoading ? 'solid' : 'outline'} onClick={() => setDemoIsLoading(!demoIsLoading)} colorScheme="tertiary">
                                            Toggle Loading
                                        </StandardButton>
                                        <StandardButton styleType={demoIsDisabled ? 'solid' : 'outline'} onClick={() => setDemoIsDisabled(!demoIsDisabled)} colorScheme="danger">
                                            Toggle Disabled
                                        </StandardButton>
                                        <StandardButton styleType={demoIsElevated ? 'solid' : 'outline'} onClick={() => setDemoIsElevated(!demoIsElevated)}>
                                            Toggle Elevated
                                        </StandardButton>
                                         <StandardButton styleType={demoIsIconOnly ? 'solid' : 'outline'} onClick={() => setDemoIsIconOnly(!demoIsIconOnly)}>
                                            Toggle Icon Only
                                        </StandardButton>
                                    </div>
								</div>

								<div className="md:col-span-2 flex items-center justify-center bg-neutral-bg-subtle dark:bg-neutral-bg-subtle-dark rounded-lg min-h-[300px] p-8">
                                    <StandardButton
                                        key={Math.random()}
                                        styleType={demoStyleType}
                                        colorScheme={demoColorScheme}
                                        size={demoSize}
                                        rounded={demoRounded}
                                        leftIcon={LeftIconComponent}
                                        rightIcon={RightIconComponent}
                                        loading={demoIsLoading}
                                        loadingText="Cargando..."
                                        disabled={demoIsDisabled}
                                        elevated={demoIsElevated}
                                        iconOnly={demoIsIconOnly}
                                        tooltip={demoIsIconOnly ? "Guardar Cambios" : demoTooltip}
                                        onClick={() => console.log("Button clicked!")}
                                    >
                                       {demoIsIconOnly ? null : "Click Me"}
                                    </StandardButton>
								</div>
							</motion.section>
						</TabsContent>
					)}

                    {activeTab === "styles" && (
                         <TabsContent forceMount value="styles" asChild>
                            <motion.div key="styles" variants={animationVariants.tabContent} initial="hidden" animate="visible" exit="exit" className="flex flex-wrap items-center justify-center gap-4">
                                {styleTypesForDemo.map(st => (
                                    <StandardButton key={st} styleType={st} colorScheme="primary" size="lg" leftIcon={Star}>{st}</StandardButton>
                                ))}
                            </motion.div>
                         </TabsContent>
                    )}

                     {activeTab === "schemes" && (
                         <TabsContent forceMount value="schemes" asChild>
                            <motion.div key="schemes" variants={animationVariants.tabContent} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {colorSchemesForDemo.map(cs => (
                                    <motion.div key={cs} variants={animationVariants.item} className="space-y-2">
                                        <StandardText weight="medium" className="capitalize">{cs}</StandardText>
                                        <StandardCard styleType="subtle" className="p-4 flex flex-col gap-3">
                                            <StandardButton colorScheme={cs} styleType="solid" leftIcon={Save}>Solid</StandardButton>
                                            <StandardButton colorScheme={cs} styleType="outline" leftIcon={Save}>Outline</StandardButton>
                                            <StandardButton colorScheme={cs} styleType="ghost" leftIcon={Save}>Ghost</StandardButton>
                                        </StandardCard>
                                    </motion.div>
                                ))}
                            </motion.div>
                         </TabsContent>
                    )}

                    {activeTab === "states" && (
                         <TabsContent forceMount value="states" asChild>
                            <motion.div key="states" variants={animationVariants.tabContent} initial="hidden" animate="visible" exit="exit" className="flex flex-wrap items-center justify-center gap-6">
                                <StandardButton colorScheme="primary" size="lg" disabled leftIcon={Trash2}>Disabled</StandardButton>
                                <StandardButton colorScheme="primary" size="lg" loading leftIcon={Trash2}>Loading</StandardButton>
                                <StandardButton colorScheme="secondary" size="lg" elevated leftIcon={Settings}>Elevated</StandardButton>
                                <StandardButton colorScheme="accent" size="lg" iconOnly tooltip="Settings"><Settings/></StandardButton>
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