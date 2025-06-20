"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- ✅ Componentes "Standard" ---
import {
	StandardBadge,
	type StandardBadgeProps,
} from "@/components/ui/StandardBadge";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardButton } from "@/components/ui/StandardButton";

// --- Componentes de UI Generales ---
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

// --- INICIO DE LA CORRECCIÓN ---
// 1. Reemplazamos la importación antigua por la nueva y correcta arquitectura de Tabs.
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
// 2. Importamos el componente Content directamente desde Radix para mantener la pureza.
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
// --- FIN DE LA CORRECCIÓN ---

import {
	CheckCircle2,
	XCircle,
	Info,
	AlertTriangle,
	Tag,
	Sparkles,
	Wand2,
} from "lucide-react";
import type { ProCardVariant } from "@/lib/theme/ColorToken";

// --- Opciones para los Controles ---
const badgeColorSchemes: Exclude<ProCardVariant, "white">[] = [
	"primary",
	"secondary",
	"tertiary",
	"accent",
	"success",
	"warning",
	"danger",
	"neutral",
];
const styleTypes: NonNullable<StandardBadgeProps["styleType"]>[] = [
	"solid",
	"subtle",
	"outline",
];
const sizes: NonNullable<StandardBadgeProps["size"]>[] = [
	"xs",
	"sm",
	"md",
	"lg",
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
// Eliminada variable no utilizada
const itemVariants = {
	hidden: { opacity: 0, y: 15 },
	visible: { opacity: 1, y: 0 },
};

export default function StandardBadgeShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");

	// --- Estados para el Demo Interactivo ---
	const [demoColorScheme, setDemoColorScheme] =
		useState<ProCardVariant>("primary");
	const [demoStyleType, setDemoStyleType] =
		useState<NonNullable<StandardBadgeProps["styleType"]>>("subtle");
	const [demoSize, setDemoSize] =
		useState<NonNullable<StandardBadgeProps["size"]>>("md");
	const [demoText, setDemoText] = useState("Insignia Interactiva");
	const [showLeftIcon, setShowLeftIcon] = useState(true);
	const [showRightIcon, setShowRightIcon] = useState(false);

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
					StandardBadge Showroom
				</StandardText>
				<StandardText
					asElement="p"
					size="lg"
					colorScheme="neutral"
					colorShade="text"
					className="max-w-2xl mx-auto">
					Un componente versátil para etiquetas, estados y categorías.
				</StandardText>
				<div className="mt-4">
					<ThemeSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
                colorScheme="secondary" // Añadimos theming para consistencia
                styleType="line"
            >
				<StandardTabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="gallery">
						Galería de Estilos
					</StandardTabsTrigger>
					<StandardTabsTrigger value="features">
						Tamaños e Iconos
					</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
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
								<StandardText
									asElement="h2"
									size="xl"
									weight="semibold"
									className="mb-2">
									Demo Interactivo
								</StandardText>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
									<div className="space-y-1">
										<StandardText
											asElement="label"
											size="sm"
											weight="medium"
											className="block">
											Esquema de Color:
										</StandardText>
										<StandardSelect
											value={demoColorScheme}
											onChange={(val) => setDemoColorScheme(val as ProCardVariant)}
											options={badgeColorSchemes.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText
											asElement="label"
											size="sm"
											weight="medium"
											className="block">
											Tipo de Estilo:
										</StandardText>
										<StandardSelect
											value={demoStyleType}
											onChange={(val) => setDemoStyleType(val as NonNullable<StandardBadgeProps["styleType"]>)}
											options={styleTypes.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText
											asElement="label"
											size="sm"
											weight="medium"
											className="block">
											Tamaño:
										</StandardText>
										<StandardSelect
											value={demoSize}
											onChange={(val) => setDemoSize(val as NonNullable<StandardBadgeProps["size"]>)}
											options={sizes.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1 md:col-span-3">
										<StandardText
											asElement="label"
											size="sm"
											weight="medium"
											className="block">
											Texto de la Insignia:
										</StandardText>
										<StandardInput
											type="text"
											value={demoText}
											onChange={(e) => setDemoText(e.target.value)}
										/>
									</div>
								</div>
								<div className="flex flex-wrap gap-3 pt-4">
									<StandardButton
										size="sm"
										styleType={showLeftIcon ? "solid" : "outline"}
										onClick={() => setShowLeftIcon(!showLeftIcon)}>
										Toggle Icono Izquierdo
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={showRightIcon ? "solid" : "outline"}
										onClick={() => setShowRightIcon(!showRightIcon)}>
										Toggle Icono Derecho
									</StandardButton>
								</div>
								<div className="mt-8 pt-8 border-t border-dashed flex items-center justify-center">
									<StandardBadge
										colorScheme={demoColorScheme}
										styleType={demoStyleType}
										size={demoSize}
										leftIcon={showLeftIcon ? Sparkles : undefined}
										rightIcon={showRightIcon ? Wand2 : undefined}>
										{demoText || " "}
									</StandardBadge>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* Pestaña Galería */}
					{activeTab === "gallery" && (
						<StandardTabsContent forceMount value="gallery" asChild>
							<motion.section
								key="gallery"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								{styleTypes.map((st) => (
									<motion.div key={st} variants={itemVariants}>
										<StandardText
											asElement="h3"
											size="lg"
											weight="medium"
											className="mb-4 capitalize border-b pb-2">
											Estilo: {st}
										</StandardText>
										<div className="flex flex-wrap items-center gap-4">
											{badgeColorSchemes.map((cs) => (
												<StandardBadge
													key={`${st}-${cs}`}
													colorScheme={cs}
													styleType={st}
													size="md">
													{cs}
												</StandardBadge>
											))}
										</div>
									</motion.div>
								))}
							</motion.section>
						</StandardTabsContent>
					)}

					{/* Pestaña Tamaños e Iconos */}
					{activeTab === "features" && (
						<StandardTabsContent forceMount value="features" asChild>
							<motion.section
								key="features"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-4 border-b pb-2">
										Variaciones de Tamaño
									</StandardText>
									<div className="flex items-center flex-wrap gap-4">
										{sizes.map((s) => (
											<StandardBadge
												key={s}
												size={s}
												colorScheme="tertiary"
												styleType="solid">
												Tamaño {s}
											</StandardBadge>
										))}
									</div>
								</motion.div>
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-4 border-b pb-2">
										Con Iconos
									</StandardText>
									<div className="flex items-center flex-wrap gap-4">
										<StandardBadge
											colorScheme="success"
											styleType="solid"
											leftIcon={CheckCircle2}>
											Completado
										</StandardBadge>
										<StandardBadge
											colorScheme="danger"
											styleType="subtle"
											leftIcon={XCircle}>
											Error
										</StandardBadge>
										<StandardBadge
											colorScheme="warning"
											styleType="outline"
											rightIcon={AlertTriangle}>
											Advertencia
										</StandardBadge>
										<StandardBadge
											colorScheme="neutral"
											styleType="solid"
											leftIcon={Info}
											rightIcon={Tag}>
											Informativo
										</StandardBadge>
									</div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}