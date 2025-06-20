"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- ✅ Componentes "Standard" ---
import {
	StandardText,
	type StandardTextPreset,
	type StandardTextSize,
	type StandardTextWeight,
	type StandardTextAlign,
	type StandardTextColorShade,
} from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardInput } from "@/components/ui/StandardInput";

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

import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

// --- Opciones para los Controles ---
const presets: StandardTextPreset[] = [
	"heading",
	"subheading",
	"title",
	"subtitle",
	"body",
	"caption",
];
const sizes: StandardTextSize[] = [
	"xs",
	"sm",
	"base",
	"lg",
	"xl",
	"2xl",
	"3xl",
	"4xl",
	"5xl",
];
const weights: StandardTextWeight[] = ["normal", "medium", "semibold", "bold"];
const aligns: StandardTextAlign[] = ["left", "center", "right", "justify"];
const colorSchemes: ColorSchemeVariant[] = [
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
const colorShades: StandardTextColorShade[] = [
	"pure",
	"text",
	"textShade",
	"contrastText",
	"subtle",
];

// --- Variantes de Animación Framer Motion ---
const tabContentVariants = {
	hidden: { opacity: 0, x: -10 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.3, ease: "easeInOut" },
	},
	exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: "easeInOut" } },
};

export default function StandardTextShowroomPage() {
	const [activeTab, setActiveTab] = useState("presets");

	// --- Estados para el Demo Interactivo ---
	const [demoText, setDemoText] = useState("Texto Interactivo Modificable");
	const [demoSize, setDemoSize] = useState<StandardTextSize>("base");
	const [demoWeight, setDemoWeight] = useState<StandardTextWeight>("normal");
	const [demoAlign, setDemoAlign] = useState<StandardTextAlign>("left");
	const [demoColorScheme, setDemoColorScheme] =
		useState<ColorSchemeVariant>("neutral");
	const [demoColorShade, setDemoColorShade] =
		useState<StandardTextColorShade>("text");

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText preset="heading" asElement="h1">
					StandardText Showroom
				</StandardText>
				<StandardText
					preset="subtitle"
					asElement="p"
					className="max-w-2xl mx-auto">
					El componente fundamental para toda la tipografía del sistema.
				</StandardText>
				<div className="mt-4">
					<ThemeSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="presets"
				className="w-full"
				onValueChange={setActiveTab}
                colorScheme="secondary"
                styleType="line"
            >
				<StandardTabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-8">
					<StandardTabsTrigger value="presets">Presets</StandardTabsTrigger>
					<StandardTabsTrigger value="interactive">
						Control Granular
					</StandardTabsTrigger>
					<StandardTabsTrigger value="features">
						Características
					</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{/* Pestaña Presets */}
					{activeTab === "presets" && (
						<StandardTabsContent forceMount value="presets" asChild>
							<motion.section
								key="presets"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-6">
								<StandardText preset="subheading">
									Presets Tipográficos
								</StandardText>
								{presets.map((p) => (
									<div key={p}>
										<StandardText
											preset="caption"
											colorScheme="neutral"
											colorShade="subtle"
											className="mb-1">{`preset="${p}"`}</StandardText>
										<div className="p-4 border rounded-lg">
											<StandardText preset={p}>
												El rápido zorro marrón salta sobre el perro perezoso.
											</StandardText>
										</div>
									</div>
								))}
							</motion.section>
						</StandardTabsContent>
					)}

					{/* Pestaña Interactiva */}
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-8 p-6 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
								<StandardText preset="subheading" asElement="h2">
									Control Granular
								</StandardText>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-end">
									<div className="space-y-1 col-span-full">
										<StandardText asElement="label" size="sm" weight="medium">
											Contenido del Texto:
										</StandardText>
										<StandardInput
											type="text"
											value={demoText}
											onChange={(e) => setDemoText(e.target.value)}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium">
											Tamaño (size):
										</StandardText>
										<StandardSelect
											value={demoSize}
											onChange={(val) => setDemoSize(val as StandardTextSize)}
											options={sizes.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium">
											Peso (weight):
										</StandardText>
										<StandardSelect
											value={demoWeight}
											onChange={(val) => setDemoWeight(val as StandardTextWeight)}
											options={weights.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium">
											Alineación (align):
										</StandardText>
										<StandardSelect
											value={demoAlign}
											onChange={(val) => setDemoAlign(val as StandardTextAlign)}
											options={aligns.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium">
											Esquema (colorScheme):
										</StandardText>
										<StandardSelect
											value={demoColorScheme}
											onChange={(val) => setDemoColorScheme(val as ColorSchemeVariant)}
											options={colorSchemes.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium">
											Tonalidad (colorShade):
										</StandardText>
										<StandardSelect
											value={demoColorShade}
											onChange={(val) => setDemoColorShade(val as StandardTextColorShade)}
											options={colorShades.map((s) => ({ value: s, label: s }))}
										/>
									</div>
								</div>
								<div className="mt-8 pt-8 border-t border-dashed">
									<StandardText
										size={demoSize}
										weight={demoWeight}
										align={demoAlign}
										colorScheme={demoColorScheme}
										colorShade={demoColorShade}>
										{demoText}
									</StandardText>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* Pestaña Características */}
					{activeTab === "features" && (
						<StandardTabsContent forceMount value="features" asChild>
							<motion.section
								key="features"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								<div>
									<StandardText
										preset="subheading"
										asElement="h3"
										className="mb-2">
										Truncado de Texto
									</StandardText>
									<StandardText
										preset="caption"
										colorScheme="neutral"
										colorShade="subtle"
										className="mb-4">
										El siguiente texto tiene la prop `truncate={true}` dentro de
										un contenedor de ancho fijo.
									</StandardText>
									<div className="w-full max-w-sm p-4 border rounded-lg">
										<StandardText truncate>
											Esta es una línea de texto extremadamente larga que no
											cabe en su contenedor y, por lo tanto, debería ser
											elegantemente truncada con puntos suspensivos al final.
										</StandardText>
									</div>
								</div>
								<div>
									<StandardText
										preset="subheading"
										asElement="h3"
										className="mb-2">
										Gradientes
									</StandardText>
									<StandardText
										preset="caption"
										colorScheme="neutral"
										colorShade="subtle"
										className="mb-4">
										Usando la prop `applyGradient` con diferentes `colorScheme`.
									</StandardText>
									<div className="space-y-4">
										<StandardText preset="title" applyGradient>
											Gradiente Primario (por defecto)
										</StandardText>
										<StandardText preset="title" applyGradient="secondary">
											Gradiente Secundario
										</StandardText>
										<StandardText preset="title" applyGradient="danger">
											Gradiente de Peligro
										</StandardText>
									</div>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}