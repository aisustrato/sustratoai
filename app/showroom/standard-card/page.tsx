"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
	StandardCard,
	type StandardCardColorScheme,
	type StandardCardProps,
} from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardInput } from "@/components/ui/StandardInput";
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
import {
	Edit3,
	Trash2,
	Bell,
	Loader,
	MousePointerClick,
} from "lucide-react";

type ShowroomButtonColor = Exclude<
	StandardCardColorScheme,
	"neutral" | "white"
>;

const cardColorSchemesForDemo: StandardCardColorScheme[] = [
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
const styleTypes: NonNullable<StandardCardProps["styleType"]>[] = [
	"filled",
	"subtle",
	"transparent",
];
const shadows: NonNullable<StandardCardProps["shadow"]>[] = [
	"none",
	"sm",
	"md",
	"lg",
	"xl",
];
const accentPlacements: NonNullable<StandardCardProps["accentPlacement"]>[] = [
	"none",
	"top",
	"left",
	"right",
	"bottom",
];
const loadingVariants: NonNullable<StandardCardProps["loadingVariant"]>[] = [
	"spin",
	"pulse",
	"spin-pulse",
	"dash",
	"progress",
];

const getValidButtonColor = (
	scheme: StandardCardColorScheme
): ShowroomButtonColor | "primary" => {
	if (scheme === "neutral" || scheme === "white") {
		return "primary";
	}
	return scheme as ShowroomButtonColor;
};

export default function StandardCardShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");

	// Estados para el demo interactivo
	const [demoScheme, setDemoScheme] =
		useState<StandardCardColorScheme>("primary");
	const [demoStyleType, setDemoStyleType] =
		useState<NonNullable<StandardCardProps["styleType"]>>("filled");
	const [demoShadow, setDemoShadow] =
		useState<NonNullable<StandardCardProps["shadow"]>>("md");
	const [demoAccent, setDemoAccent] =
		useState<NonNullable<StandardCardProps["accentPlacement"]>>("left");
	const [demoAccentScheme, setDemoAccentScheme] =
		useState<StandardCardColorScheme>("accent");
	const [hasOutlineDemo, setHasOutlineDemo] = useState(false);
	const [outlineSchemeDemo, setOutlineSchemeDemo] =
		useState<StandardCardColorScheme>("primary");
	const [isLoadingDemo, setIsLoadingDemo] = useState(false);
	const [demoLoadingText, setDemoLoadingText] = useState(
		"Procesando intensamente..."
	);
	const [demoLoadingVariant, setDemoLoadingVariant] =
		useState<NonNullable<StandardCardProps["loadingVariant"]>>("spin-pulse");
	const [demoLoaderSize, setDemoLoaderSize] = useState<number>(48);
	const [isInactiveDemo, setIsInactiveDemo] = useState(false);
	const [isSelectedDemo, setIsSelectedDemo] = useState(false);
	const [noPaddingDemo, setNoPaddingDemo] = useState(false);
	const [clickMessage, setClickMessage] = useState<string | null>(null);

	const gridContainerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
	};
	const itemVariants = {
		hidden: { opacity: 0, y: 20, scale: 0.95 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: { type: "spring", stiffness: 120, damping: 12 },
		},
	};
	const tabContentVariants = {
		hidden: { opacity: 0, x: -20 },
		visible: {
			opacity: 1,
			x: 0,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
		exit: {
			opacity: 0,
			x: 20,
			transition: { duration: 0.2, ease: "easeInOut" },
		},
	};

	const handleCardClick = () => {
		const message = `¡Card clickeada a las ${new Date().toLocaleTimeString()}!`;
		setClickMessage(message);
		console.log(message);
	};

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					preset="subheading"
					size="3xl"
					applyGradient="primary"
					className="mb-6 text-center">
					StandardCard Showroom
				</StandardText>
				<StandardText
					preset="body"
					size="lg"
					colorScheme="neutral"
					colorShade="textShade"
					className="max-w-2xl mx-auto">
					Explora las capacidades y configuraciones del nuevo componente
					StandardCard.
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
				<StandardTabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="styles">Estilos</StandardTabsTrigger>
					<StandardTabsTrigger value="schemes">Esquemas</StandardTabsTrigger>
					<StandardTabsTrigger value="accents">Acentos</StandardTabsTrigger>
					<StandardTabsTrigger value="states">Estados</StandardTabsTrigger>
					<StandardTabsTrigger value="layouts">Layouts</StandardTabsTrigger>
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
								className="space-y-8 p-4 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
								<StandardText
									size="xl"
									weight="semibold"
									className="mb-2 font-medium">
									Demo Interactivo
								</StandardText>
								<StandardText
									colorScheme="neutral"
									colorShade="textShade"
									className="mb-4 text-sm">
									Modifica las props para ver los cambios en tiempo real.
								</StandardText>

								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 items-end">
									{/* Controles SelectCustom */}
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Color Scheme:
										</StandardText>
										<StandardSelect
											value={demoScheme}
											onChange={(val) =>
												setDemoScheme(val as StandardCardColorScheme)
											}
											options={cardColorSchemesForDemo.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Style Type:
										</StandardText>
										<StandardSelect
											value={demoStyleType}
											onChange={(val) => setDemoStyleType(val as NonNullable<StandardCardProps["styleType"]>)}
											options={styleTypes.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Shadow:
										</StandardText>
										<StandardSelect
											value={demoShadow}
											onChange={(val) => setDemoShadow(val as NonNullable<StandardCardProps["shadow"]>)}
											options={shadows.map((s) => ({ value: s, label: s }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Accent Placement:
										</StandardText>
										<StandardSelect
											value={demoAccent}
											onChange={(val) => setDemoAccent(val as NonNullable<StandardCardProps["accentPlacement"]>)}
											options={accentPlacements.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									{demoAccent !== "none" && (
										<div className="space-y-1">
											<StandardText size="sm" weight="medium">
												Accent Scheme:
											</StandardText>
											<StandardSelect
												value={demoAccentScheme}
												onChange={(val) =>
													setDemoAccentScheme(val as StandardCardColorScheme)
												}
												options={cardColorSchemesForDemo.map((s) => ({
													value: s,
													label: s,
												}))}
											/>
										</div>
									)}
									{hasOutlineDemo && (
										<div className="space-y-1">
											<StandardText size="sm" weight="medium">
												Outline Scheme:
											</StandardText>
											<StandardSelect
												value={outlineSchemeDemo}
												onChange={(val) =>
													setOutlineSchemeDemo(val as StandardCardColorScheme)
												}
												options={cardColorSchemesForDemo.map((s) => ({
													value: s,
													label: s,
												}))}
											/>
										</div>
									)}
									{isLoadingDemo && (
										<>
											<div className="space-y-1">
												<StandardText size="sm" weight="medium">
													Loading Text:
												</StandardText>
												<StandardInput
													type="text"
													value={demoLoadingText}
													onChange={(e) => setDemoLoadingText(e.target.value)}
													placeholder="Texto de carga..."
												/>
											</div>
											<div className="space-y-1">
												<StandardText size="sm" weight="medium">
													Loading Variant:
												</StandardText>
												<StandardSelect
													value={demoLoadingVariant}
													onChange={(val) => setDemoLoadingVariant(val as NonNullable<StandardCardProps["loadingVariant"]>)}
													options={loadingVariants.map((s) => ({
														value: s,
														label: s,
													}))}
												/>
											</div>
											<div className="space-y-1">
												<StandardText size="sm" weight="medium">
													Loader Size (px):
												</StandardText>
												<StandardInput
													type="number"
													value={demoLoaderSize}
													onChange={(e) =>
														setDemoLoaderSize(Number(e.target.value))
													}
													placeholder="Tamaño loader"
												/>
											</div>
										</>
									)}
								</div>
								<div className="flex flex-wrap gap-3 mb-6">
									<StandardButton
										size="sm"
										styleType={hasOutlineDemo ? "solid" : "outline"}
										onClick={() => setHasOutlineDemo(!hasOutlineDemo)}>
										Toggle Outline
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={isLoadingDemo ? "solid" : "outline"}
										onClick={() => setIsLoadingDemo(!isLoadingDemo)}
										leftIcon={Loader}>
										{isLoadingDemo ? "Cargando..." : "Toggle Loading"}
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={isInactiveDemo ? "solid" : "outline"}
										onClick={() => setIsInactiveDemo(!isInactiveDemo)}>
										Toggle Inactive
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={isSelectedDemo ? "solid" : "outline"}
										onClick={() => setIsSelectedDemo(!isSelectedDemo)}>
										Toggle Selected
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={noPaddingDemo ? "solid" : "outline"}
										onClick={() => setNoPaddingDemo(!noPaddingDemo)}>
										Toggle No Padding
									</StandardButton>
								</div>

								{clickMessage && (
									<StandardText
										color="success"
										className="mb-4 p-2 bg-success/10 rounded">
										{clickMessage}
									</StandardText>
								)}

								<StandardCard
									key={`${demoScheme}-${demoStyleType}-${demoShadow}-${demoAccent}-${demoAccentScheme}-${hasOutlineDemo}-${outlineSchemeDemo}-${isLoadingDemo}-${isInactiveDemo}-${isSelectedDemo}-${noPaddingDemo}-${demoLoadingText}-${demoLoadingVariant}-${demoLoaderSize}`}
									colorScheme={demoScheme}
									styleType={demoStyleType}
									shadow={demoShadow}
									accentPlacement={demoAccent}
									accentColorScheme={demoAccentScheme}
									hasOutline={hasOutlineDemo}
									outlineColorScheme={outlineSchemeDemo}
									loading={isLoadingDemo}
									loadingText={demoLoadingText}
									loadingVariant={demoLoadingVariant}
									loaderSize={demoLoaderSize}
									inactive={isInactiveDemo}
									selected={isSelectedDemo}
									noPadding={noPaddingDemo}
									showSelectionCheckbox
									onSelectionChange={setIsSelectedDemo}
									onCardClick={handleCardClick}
									animateEntrance={false}
									className="min-h-[250px] transition-all duration-300"
									data-testid="interactive-card">
									<StandardCard.Header>
										<StandardCard.Title size="lg">
											Standard Card Interactivo
										</StandardCard.Title>
										<StandardCard.Subtitle>
											Esquema: <span className="capitalize">{demoScheme}</span>,
											Estilo:{" "}
											<span className="capitalize">{demoStyleType}</span>
										</StandardCard.Subtitle>
									</StandardCard.Header>
									<StandardCard.Content>
										<StandardText className="my-2">
											Este card es clickeable.{" "}
											{!noPaddingDemo ? "Padding activo." : "Sin padding."}
										</StandardText>
										<div className="flex items-center gap-2 mt-4 p-2 bg-[var(--sc-accent-bg)]/10 rounded">
											<MousePointerClick
												size={20}
												className="text-[var(--sc-accent-bg)]"
											/>
											<StandardText size="sm">
												Haz clic en cualquier parte del card.
											</StandardText>
										</div>
									</StandardCard.Content>
									<StandardCard.Actions>
										<StandardButton
											colorScheme={getValidButtonColor(demoScheme)}
											styleType="solid"
											size="sm">
											Acción Principal
										</StandardButton>
										<StandardButton
											colorScheme={getValidButtonColor(demoScheme)}
											styleType="outline"
											size="sm">
											Otra Acción
										</StandardButton>
									</StandardCard.Actions>
									<StandardCard.Footer>
										<StandardText size="xs">
											Pie de tarjeta interactiva.
										</StandardText>
									</StandardCard.Footer>
								</StandardCard>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "styles" && (
						<StandardTabsContent forceMount value="styles" asChild>
							<motion.section
								key="styles"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<StandardText preset="heading" className="mb-6">
									Variaciones de &apos;styleType&apos; (Esquema: Primary)
								</StandardText>
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									{styleTypes.map((st) => (
										<motion.div key={`style-${st}`} variants={itemVariants}>
											<StandardCard
												colorScheme="primary"
												styleType={st}
												shadow="md"
												className="min-h-[200px]">
												<StandardCard.Header>
													<StandardCard.Title>
														Estilo:{" "}
														<span className="capitalize font-bold">{st}</span>
													</StandardCard.Title>
												</StandardCard.Header>
												<StandardCard.Content>
													<StandardText>
														Demostración del estilo &apos;{st}&apos; con esquema
														&apos;primary&apos;.
													</StandardText>
												</StandardCard.Content>
												<StandardCard.Actions>
													<StandardButton
														colorScheme="primary"
														styleType={st === "filled" ? "outline" : "solid"}>
														Botón
													</StandardButton>
												</StandardCard.Actions>
											</StandardCard>
										</motion.div>
									))}
								</motion.div>
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
								exit="exit">
								<StandardText preset="heading" className="mb-6">
									Variaciones de &apos;colorScheme&apos; (Estilo: Filled)
								</StandardText>
								<motion.div
									className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									{cardColorSchemesForDemo.map((cs) => (
										<motion.div key={`color-${cs}`} variants={itemVariants}>
											<StandardCard
												colorScheme={cs}
												styleType="filled"
												shadow="lg"
												className="min-h-[180px]">
												<StandardCard.Header>
													<StandardCard.Title className="capitalize">
														{cs}
													</StandardCard.Title>
												</StandardCard.Header>
												<StandardCard.Content>
													<StandardText>
														Estilo &apos;filled&apos; con esquema &apos;{cs}&apos;.
													</StandardText>
													<Bell
														size={32}
														className="my-3 opacity-70 block mx-auto"
													/>
												</StandardCard.Content>
												<StandardCard.Actions>
													<StandardButton
														colorScheme={getValidButtonColor(cs)}
														styleType="subtle"
														size="sm">
														Detalles
													</StandardButton>
												</StandardCard.Actions>
											</StandardCard>
										</motion.div>
									))}
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "accents" && (
						<StandardTabsContent forceMount value="accents" asChild>
							<motion.section
								key="accents"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<StandardText preset="heading" className="mb-6">
									Acentos y Bordes (Estilo: Subtle)
								</StandardText>
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									{(["top", "left", "right", "bottom"] as const).map((ap) => (
										<motion.div key={`accent-${ap}`} variants={itemVariants}>
											<StandardCard
												colorScheme="secondary"
												styleType="subtle"
												accentPlacement={ap}
												accentColorScheme="accent"
												shadow="md"
												className="min-h-[150px]">
												<StandardCard.Title>
													Acento: <span className="capitalize">{ap}</span>{" "}
													(Accent)
												</StandardCard.Title>
												<StandardCard.Content>
													<StandardText>
														Acento de color &apos;accent&apos; en tarjeta &apos;secondary&apos;.
													</StandardText>
												</StandardCard.Content>
											</StandardCard>
										</motion.div>
									))}
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="danger"
											styleType="subtle"
											accentPlacement="top"
											accentColorScheme="accent"
											shadow="md"
											className="min-h-[150px]">
											<StandardCard.Title>
												Accent &apos;Accent&apos; en Card &apos;Danger&apos;
											</StandardCard.Title>
											<StandardCard.Content>
												<StandardText>
													La &apos;jugada mágica&apos;: acento de &apos;danger.pure&apos; a &apos;accent.pure&apos;.
												</StandardText>
											</StandardCard.Content>
										</StandardCard>
									</motion.div>
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="accent"
											styleType="filled"
											accentPlacement="top"
											accentColorScheme="accent"
											shadow="md"
											className="min-h-[150px]"
										>
											<StandardCard.Title>
												Accent &apos;Accent&apos; en Card &apos;Accent&apos;
											</StandardCard.Title>
											<StandardCard.Content>
												<StandardText>
													La &apos;jugada mágica&apos;: acento de &apos;accent.pure&apos; a &apos;primary.pure&apos;.
												</StandardText>
											</StandardCard.Content>
										</StandardCard>
									</motion.div>
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="secondary"
											styleType="subtle"
											hasOutline
											outlineColorScheme="danger"
											shadow="md"
											className="min-h-[150px]">
											<StandardCard.Title>Outline (Danger)</StandardCard.Title>
											<StandardCard.Content>
												<StandardText>
													Borde completo color &#39;danger&#39;.
												</StandardText>
											</StandardCard.Content>
										</StandardCard>
									</motion.div>
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="secondary"
											styleType="filled"
											hasOutline
											shadow="md"
											className="min-h-[150px]">
											<StandardCard.Title>
												Outline (Default Scheme)
											</StandardCard.Title>
											<StandardCard.Content>
												<StandardText>
													Borde completo usando &#39;secondary&#39;.
												</StandardText>
											</StandardCard.Content>
										</StandardCard>
									</motion.div>
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
								exit="exit">
								<StandardText preset="heading" className="mb-6">
									Variaciones de Estado
								</StandardText>
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="primary"
											styleType="filled"
											loading
											loadingText="Cargando detalles..."
											className="min-h-[180px]">
											<StandardCard.Title>
												Cargando con Texto
											</StandardCard.Title>
										</StandardCard>
									</motion.div>
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="warning"
											styleType="subtle"
											inactive
											className="min-h-[180px]">
											<StandardCard.Title>Tarjeta Inactiva</StandardCard.Title>
											<StandardCard.Content>
												<StandardText>
													Esta tarjeta no es interactiva.
												</StandardText>
											</StandardCard.Content>
											<StandardCard.Actions>
												<StandardButton
													colorScheme="warning"
													size="sm"
													disabled>
													Acción Deshabilitada
												</StandardButton>
											</StandardCard.Actions>
										</StandardCard>
									</motion.div>
									<motion.div variants={itemVariants}>
										<StandardCard
											colorScheme="success"
											styleType="filled"
											selected
											showSelectionCheckbox
											onSelectionChange={() => {}}
											className="min-h-[180px]">
											<StandardCard.Title>
												Tarjeta Seleccionada
											</StandardCard.Title>
											<StandardCard.Content>
												<StandardText>
													Esta tarjeta está marcada como seleccionada.
												</StandardText>
											</StandardCard.Content>
										</StandardCard>
									</motion.div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "layouts" && (
						<StandardTabsContent forceMount value="layouts" asChild>
							<motion.section
								key="layouts"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<StandardText preset="heading" className="mb-6">
									Layouts y Subcomponentes
								</StandardText>
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 gap-8"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									<motion.div variants={itemVariants}>
										<StandardText
											preset="subheading"
											size="lg"
											className="mb-3">
											Layout Completo
										</StandardText>
										<StandardCard
											colorScheme="tertiary"
											styleType="filled"
											shadow="xl"
											onCardClick={() =>
												alert("Card &apos;Layout Completo&apos; clickeada!")
											}>
											<StandardCard.Header>
												<StandardCard.Title size="2xl">
													Maravilla Arquitectónica
												</StandardCard.Title>
												<StandardCard.Subtitle
													colorScheme="neutral"
													colorShade="textShade">
													Diseño Moderno en Paisaje Urbano
												</StandardCard.Subtitle>
											</StandardCard.Header>
											<StandardCard.Media>
												<div className="aspect-video bg-tertiary/20 rounded flex items-center justify-center">
													<Bell
														size={48}
														className="text-tertiary opacity-50"
													/>
												</div>
											</StandardCard.Media>
											<StandardCard.Content>
												<StandardText size="sm" className="my-3">
													Contenido principal de la tarjeta, describiendo las
													características y beneficios. Haz clic en esta tarjeta
													para ver una alerta.
												</StandardText>
											</StandardCard.Content>
											<StandardCard.Actions>
												<StandardButton
													colorScheme="tertiary"
													styleType="solid"
													leftIcon={Edit3}>
													Editar
												</StandardButton>
												<StandardButton
													colorScheme="danger"
													styleType="ghost"
													leftIcon={Trash2}
													onClick={(e) => {
														e.stopPropagation();
														alert("Botón Borrar clickeado");
													}}>
													Borrar
												</StandardButton>
											</StandardCard.Actions>
											<StandardCard.Footer>
												<div className="flex justify-between items-center">
													<StandardText size="xs">
														Actualizado hace 3 min
													</StandardText>
													<Bell size={16} className="opacity-60" />
												</div>
											</StandardCard.Footer>
										</StandardCard>
									</motion.div>

									<motion.div variants={itemVariants}>
										<StandardText
											preset="subheading"
											size="lg"
											className="mb-3">
											Layout &apos;noPadding&apos;
										</StandardText>
										<StandardCard
											colorScheme="accent"
											styleType="subtle"
											shadow="lg"
											noPadding
											onCardClick={() => alert("Card &apos;noPadding&apos; clickeada!")}>
											<StandardCard.Media>
												<div className="relative w-full" style={{ aspectRatio: '600/320' }}>
													<Image
														src="https://picsum.photos/seed/standardcardE2E/600/320"
														alt="Placeholder"
														fill
														className="object-cover"
														unoptimized
													/>
												</div>
											</StandardCard.Media>
											<div className="p-4">
												<StandardCard.Header>
													<StandardCard.Title size="xl">
														Imagen Edge-to-Edge
													</StandardCard.Title>
												</StandardCard.Header>
												<StandardCard.Content>
													<StandardText size="sm" className="my-3">
														Cuando &#39;noPadding&#39; es true, Media puede ocupar todo
														el ancho. Se requiere padding manual.
													</StandardText>
												</StandardCard.Content>
												<StandardCard.Actions>
													<StandardButton
														colorScheme="accent"
														styleType="outline">
														Ver Más
													</StandardButton>
												</StandardCard.Actions>
											</div>
											<StandardCard.Footer>
												<div className="p-4 border-t border-[var(--sc-outline-border-color)]/20">
													<StandardText size="xs">
														Pie de tarjeta con noPadding.
													</StandardText>
												</div>
											</StandardCard.Footer>
										</StandardCard>
									</motion.div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}