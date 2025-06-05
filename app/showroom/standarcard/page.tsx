"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StandardCard,
  type StandardCardColorScheme,
  type StandardCardProps, // Importar StandardCardProps para tipado explícito si es necesario
} from "@/components/ui/StandardCard";
import { CustomButton } from "@/components/ui/custom-button";
import { Text } from "@/components/ui/text";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { SelectCustom } from "@/components/ui/select-custom"; // Usando tu SelectCustom
import { Input } from "@/components/ui/input"; // Para el texto de loading
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Package, AlertTriangle, User, Settings, Edit3, Trash2, Bell, Info, Zap, Palette, Loader, MousePointerClick } from "lucide-react";

type ShowroomButtonColor = Exclude<StandardCardColorScheme, "neutral" | "white">;

const cardColorSchemesForDemo: StandardCardColorScheme[] = [
  "primary", "secondary", "tertiary", "accent", "success", 
  "warning", "danger", "neutral", "white"
];
const styleTypes: NonNullable<StandardCardProps["styleType"]>[] = ["filled", "subtle", "transparent"];
const shadows: NonNullable<StandardCardProps["shadow"]>[] = ["none", "sm", "md", "lg", "xl"];
const accentPlacements: NonNullable<StandardCardProps["accentPlacement"]>[] = ["none", "top", "left", "right", "bottom"];
const loadingVariants: NonNullable<StandardCardProps["loadingVariant"]>[] = ["spin", "pulse", "spin-pulse", "dash", "progress"];


const getValidButtonColor = (scheme: StandardCardColorScheme): ShowroomButtonColor | "primary" => {
  if (scheme === "neutral" || scheme === "white") {
    return "primary"; 
  }
  return scheme as ShowroomButtonColor;
};

export default function StandardCardShowroomPage() {
  const [activeTab, setActiveTab] = useState("interactive");

  // Estados para el demo interactivo
  const [demoScheme, setDemoScheme] = useState<StandardCardColorScheme>("primary");
  const [demoStyleType, setDemoStyleType] = useState<NonNullable<StandardCardProps["styleType"]>>("filled");
  const [demoShadow, setDemoShadow] = useState<NonNullable<StandardCardProps["shadow"]>>("md");
  const [demoAccent, setDemoAccent] = useState<NonNullable<StandardCardProps["accentPlacement"]>>("none");
  const [demoAccentScheme, setDemoAccentScheme] = useState<StandardCardColorScheme>("accent");
  const [hasOutlineDemo, setHasOutlineDemo] = useState(false);
  const [outlineSchemeDemo, setOutlineSchemeDemo] = useState<StandardCardColorScheme>("primary");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoLoadingText, setDemoLoadingText] = useState("Procesando intensamente...");
  const [demoLoadingVariant, setDemoLoadingVariant] = useState<NonNullable<StandardCardProps["loadingVariant"]>>("spin-pulse");
  const [demoLoaderSize, setDemoLoaderSize] = useState<number>(48);
  const [isInactiveDemo, setIsInactiveDemo] = useState(false);
  const [isSelectedDemo, setIsSelectedDemo] = useState(false);
  const [noPaddingDemo, setNoPaddingDemo] = useState(false);
  const [clickMessage, setClickMessage] = useState<string | null>(null);

  const gridContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 }}};
  const itemVariants = { hidden: { opacity: 0, y: 20, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 12 } }};
  const tabContentVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } }, exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeInOut" } }};

  const handleCardClick = () => {
    const message = `¡Card clickeada a las ${new Date().toLocaleTimeString()}!`;
    setClickMessage(message);
    console.log(message);
    // Aquí podrías implementar una navegación o cualquier otra acción
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-12 text-center">
        <Text variant="heading" size="3xl" gradient="primary" className="mb-3 font-bold">StandardCard Showroom</Text>
        <Text variant="default" size="lg" color="neutral" className="max-w-2xl mx-auto">Explora las capacidades y configuraciones del nuevo componente StandardCard.</Text>
        <div className="mt-4"><ThemeSwitcher /></div>
      </header>

      <Tabs defaultValue="interactive" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-8">
          <TabsTrigger value="interactive">Interactivo</TabsTrigger>
          <TabsTrigger value="styles">Estilos</TabsTrigger>
          <TabsTrigger value="schemes">Esquemas</TabsTrigger>
          <TabsTrigger value="accents">Acentos</TabsTrigger>
          <TabsTrigger value="states">Estados</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "interactive" && (
            <TabsContent forceMount value="interactive" asChild>
              <motion.section key="interactive" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 p-4 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
                <Text variant="heading" size="xl" className="mb-1">Demo Interactivo</Text>
                <Text color="neutral" colorVariant="textShade" className="mb-6">Modifica las props para ver los cambios en tiempo real.</Text>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 items-end">
                  {/* Controles SelectCustom */}
                  <div className="space-y-1"><Text size="sm" weight="medium">Color Scheme:</Text><SelectCustom value={demoScheme} onChange={val => setDemoScheme(val as StandardCardColorScheme)} options={cardColorSchemesForDemo.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><Text size="sm" weight="medium">Style Type:</Text><SelectCustom value={demoStyleType} onChange={val => setDemoStyleType(val as any)} options={styleTypes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><Text size="sm" weight="medium">Shadow:</Text><SelectCustom value={demoShadow} onChange={val => setDemoShadow(val as any)} options={shadows.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><Text size="sm" weight="medium">Accent Placement:</Text><SelectCustom value={demoAccent} onChange={val => setDemoAccent(val as any)} options={accentPlacements.map(s => ({ value: s, label: s }))} /></div>
                  {demoAccent !== "none" && <div className="space-y-1"><Text size="sm" weight="medium">Accent Scheme:</Text><SelectCustom value={demoAccentScheme} onChange={val => setDemoAccentScheme(val as StandardCardColorScheme)} options={cardColorSchemesForDemo.map(s => ({ value: s, label: s }))} /></div>}
                  {hasOutlineDemo && <div className="space-y-1"><Text size="sm" weight="medium">Outline Scheme:</Text><SelectCustom value={outlineSchemeDemo} onChange={val => setOutlineSchemeDemo(val as StandardCardColorScheme)} options={cardColorSchemesForDemo.map(s => ({ value: s, label: s }))} /></div>}
                  {/* Nuevos controles para Loading */}
                  {isLoadingDemo && (
                    <>
                      <div className="space-y-1"><Text size="sm" weight="medium">Loading Text:</Text><Input type="text" value={demoLoadingText} onChange={(e) => setDemoLoadingText(e.target.value)} placeholder="Texto de carga..." /></div>
                      <div className="space-y-1"><Text size="sm" weight="medium">Loading Variant:</Text><SelectCustom value={demoLoadingVariant} onChange={val => setDemoLoadingVariant(val as any)} options={loadingVariants.map(s => ({ value: s, label: s }))} /></div>
                      <div className="space-y-1"><Text size="sm" weight="medium">Loader Size (px):</Text><Input type="number" value={demoLoaderSize} onChange={(e) => setDemoLoaderSize(Number(e.target.value))} placeholder="Tamaño loader" /></div>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mb-6">
                  <CustomButton size="sm" variant={hasOutlineDemo ? "solid" : "outline"} onClick={() => setHasOutlineDemo(!hasOutlineDemo)}>Toggle Outline</CustomButton>
                  <CustomButton size="sm" variant={isLoadingDemo ? "solid" : "outline"} onClick={() => setIsLoadingDemo(!isLoadingDemo)} leftIcon={<Loader size={16} className={isLoadingDemo ? "animate-spin" : ""} />}>{isLoadingDemo ? "Cargando..." : "Toggle Loading"}</CustomButton>
                  <CustomButton size="sm" variant={isInactiveDemo ? "solid" : "outline"} onClick={() => setIsInactiveDemo(!isInactiveDemo)}>Toggle Inactive</CustomButton>
                  <CustomButton size="sm" variant={isSelectedDemo ? "solid" : "outline"} onClick={() => setIsSelectedDemo(!isSelectedDemo)}>Toggle Selected</CustomButton>
                  <CustomButton size="sm" variant={noPaddingDemo ? "solid" : "outline"} onClick={() => setNoPaddingDemo(!noPaddingDemo)}>Toggle No Padding</CustomButton>
                </div>

                {clickMessage && <Text color="success" className="mb-4 p-2 bg-success/10 rounded">{clickMessage}</Text>}
                
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
                  onCardClick={handleCardClick} // <--- FUNCIONALIDAD CLICKEABLE
                  animateEntrance={false}
                  className="min-h-[250px] transition-all duration-300"
                  data-testid="interactive-card"
                >
                  <StandardCard.Header>
                    <StandardCard.Title size="lg">Standard Card Interactivo</StandardCard.Title>
                    <StandardCard.Subtitle>Esquema: <span className="capitalize">{demoScheme}</span>, Estilo: <span className="capitalize">{demoStyleType}</span></StandardCard.Subtitle>
                  </StandardCard.Header>
                  <StandardCard.Content>
                    <Text className="my-2">Este card es clickeable. {!noPaddingDemo ? 'Padding activo.' : 'Sin padding.'}</Text>
                    <div className="flex items-center gap-2 mt-4 p-2 bg-[var(--sc-accent-bg)]/10 rounded">
                      <MousePointerClick size={20} className="text-[var(--sc-accent-bg)]"/>
                      <Text size="sm">Haz clic en cualquier parte del card.</Text>
                    </div>
                  </StandardCard.Content>
                  <StandardCard.Actions>
                    <CustomButton color={getValidButtonColor(demoScheme)} variant="solid" size="sm">Acción Principal</CustomButton>
                    <CustomButton color={getValidButtonColor(demoScheme)} variant="outline" size="sm">Otra Acción</CustomButton>
                  </StandardCard.Actions>
                   <StandardCard.Footer>
                      <Text size="xs">Pie de tarjeta interactiva.</Text>
                  </StandardCard.Footer>
                </StandardCard>
              </motion.section>
            </TabsContent>
          )}

          {/* --- Pestaña Estilos --- */}
          {activeTab === "styles" && (
            <TabsContent forceMount value="styles" asChild>
              <motion.section key="styles" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Text variant="heading" size="xl" className="mb-6">Variaciones de `styleType` (Esquema: Primary)</Text>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={gridContainerVariants} initial="hidden" animate="visible">
                  {styleTypes.map((st) => (
                    <motion.div key={`style-${st}`} variants={itemVariants}>
                      <StandardCard colorScheme="primary" styleType={st} shadow="md" className="min-h-[200px]">
                        <StandardCard.Header><StandardCard.Title>Estilo: <span className="capitalize font-bold">{st}</span></StandardCard.Title></StandardCard.Header>
                        <StandardCard.Content><Text>Demostración del estilo '{st}' con esquema 'primary'.</Text></StandardCard.Content>
                        <StandardCard.Actions><CustomButton color="primary" variant={st === "filled" ? "outline" : "solid"}>Botón</CustomButton></StandardCard.Actions>
                      </StandardCard>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            </TabsContent>
          )}

          {/* --- Pestaña Esquemas de Color --- */}
          {activeTab === "schemes" && (
             <TabsContent forceMount value="schemes" asChild>
              <motion.section key="schemes" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Text variant="heading" size="xl" className="mb-6">Variaciones de `colorScheme` (Estilo: Filled)</Text>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" variants={gridContainerVariants} initial="hidden" animate="visible">
                  {cardColorSchemesForDemo.map((cs) => (
                    <motion.div key={`color-${cs}`} variants={itemVariants}>
                      <StandardCard colorScheme={cs} styleType="filled" shadow="lg" className="min-h-[180px]">
                        <StandardCard.Header><StandardCard.Title className="capitalize">{cs}</StandardCard.Title></StandardCard.Header>
                        <StandardCard.Content><Text>Estilo 'filled' con esquema '{cs}'.</Text>
                         <ImageIcon size={32} className="my-3 opacity-70 block mx-auto" />
                        </StandardCard.Content>
                         <StandardCard.Actions><CustomButton color={getValidButtonColor(cs)} variant="subtle" size="sm">Detalles</CustomButton></StandardCard.Actions>
                      </StandardCard>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            </TabsContent>
          )}
          
          {/* --- Pestaña Acentos y Bordes --- */}
          {activeTab === "accents" && (
            <TabsContent forceMount value="accents" asChild>
              <motion.section key="accents" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Text variant="heading" size="xl" className="mb-6">Acentos y Bordes (Estilo: Subtle)</Text>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={gridContainerVariants} initial="hidden" animate="visible">
                  {(["top", "left", "right", "bottom"] as const).map(ap => (
                    <motion.div key={`accent-${ap}`} variants={itemVariants}>
                      <StandardCard colorScheme="secondary" styleType="subtle" accentPlacement={ap} accentColorScheme="accent" shadow="md" className="min-h-[150px]">
                        <StandardCard.Title>Acento: <span className="capitalize">{ap}</span> (Accent)</StandardCard.Title>
                        <StandardCard.Content><Text>Acento de color 'accent' en tarjeta 'secondary'.</Text></StandardCard.Content>
                      </StandardCard>
                    </motion.div>
                  ))}
                  <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="danger" styleType="subtle" accentPlacement="top" accentColorScheme="accent" shadow="md" className="min-h-[150px]">
                       <StandardCard.Title>Accent "Accent" en Card "Danger"</StandardCard.Title>
                       <StandardCard.Content><Text>La "jugada mágica": acento de `danger.pure` a `accent.pure`.</Text></StandardCard.Content>
                    </StandardCard>
                  </motion.div>
                   <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="accent" styleType="filled" accentPlacement="top" accentColorScheme="accent" shadow="md" className="min-h-[150px]">
                       <StandardCard.Title>Accent "Accent" en Card "Accent"</StandardCard.Title>
                       <StandardCard.Content><Text>La "jugada mágica": acento de `accent.pure` a `primary.pure`.</Text></StandardCard.Content>
                    </StandardCard>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="secondary" styleType="subtle" hasOutline outlineColorScheme="danger" shadow="md" className="min-h-[150px]">
                      <StandardCard.Title>Outline (Danger)</StandardCard.Title>
                      <StandardCard.Content><Text>Borde completo color 'danger'.</Text></StandardCard.Content>
                    </StandardCard>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="secondary" styleType="filled" hasOutline shadow="md" className="min-h-[150px]">
                      <StandardCard.Title>Outline (Default Scheme)</StandardCard.Title>
                      <StandardCard.Content><Text>Borde completo usando 'secondary'.</Text></StandardCard.Content>
                    </StandardCard>
                  </motion.div>
                </motion.div>
              </motion.section>
            </TabsContent>
          )}

          {/* --- Pestaña Estados --- */}
          {activeTab === "states" && (
            <TabsContent forceMount value="states" asChild>
              <motion.section key="states" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Text variant="heading" size="xl" className="mb-6">Variaciones de Estado</Text>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={gridContainerVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="primary" styleType="filled" loading loadingText="Cargando detalles..." className="min-h-[180px]">
                      <StandardCard.Title>Cargando con Texto</StandardCard.Title>
                    </StandardCard>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="warning" styleType="subtle" inactive className="min-h-[180px]">
                      <StandardCard.Title>Tarjeta Inactiva</StandardCard.Title>
                      <StandardCard.Content><Text>Esta tarjeta no es interactiva.</Text></StandardCard.Content>
                      <StandardCard.Actions><CustomButton color="warning" size="sm" disabled>Acción Deshabilitada</CustomButton></StandardCard.Actions>
                    </StandardCard>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <StandardCard colorScheme="success" styleType="filled" selected showSelectionCheckbox onSelectionChange={() => {}} className="min-h-[180px]">
                      <StandardCard.Title>Tarjeta Seleccionada</StandardCard.Title>
                      <StandardCard.Content><Text>Esta tarjeta está marcada como seleccionada.</Text></StandardCard.Content>
                    </StandardCard>
                  </motion.div>
                </motion.div>
              </motion.section>
            </TabsContent>
          )}

          {/* --- Pestaña Layouts y Subcomponentes --- */}
          {activeTab === "layouts" && (
            <TabsContent forceMount value="layouts" asChild>
              <motion.section key="layouts" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Text variant="heading" size="xl" className="mb-6">Layouts y Subcomponentes</Text>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" variants={gridContainerVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants}>
                    <Text variant="subheading" size="lg" className="mb-3">Layout Completo</Text>
                    <StandardCard colorScheme="tertiary" styleType="filled" shadow="xl" onCardClick={() => alert("Card 'Layout Completo' clickeada!")}>
                      <StandardCard.Header>
                        <StandardCard.Title typographicVariant="heading" size="2xl">Maravilla Arquitectónica</StandardCard.Title>
                        <StandardCard.Subtitle colorScheme="neutral" colorShade="textShade">Diseño Moderno en Paisaje Urbano</StandardCard.Subtitle>
                      </StandardCard.Header>
                      <StandardCard.Media>
                        <div className="aspect-video bg-tertiary/20 rounded flex items-center justify-center">
                          <ImageIcon size={48} className="text-tertiary opacity-50" />
                        </div>
                      </StandardCard.Media>
                      <StandardCard.Content>
                        <Text size="sm" className="my-3">
                          Contenido principal de la tarjeta, describiendo las características y beneficios.
                          Haz clic en esta tarjeta para ver una alerta.
                        </Text>
                      </StandardCard.Content>
                      <StandardCard.Actions>
                        <CustomButton color="tertiary" variant="solid" leftIcon={<Edit3 size={16}/>}>Editar</CustomButton>
                        <CustomButton color="danger" variant="ghost" leftIcon={<Trash2 size={16}/>} onClick={(e) => {e.stopPropagation(); alert("Botón Borrar clickeado");}}>Borrar</CustomButton>
                      </StandardCard.Actions>
                      <StandardCard.Footer>
                        <div className="flex justify-between items-center">
                          <Text size="xs">Actualizado hace 3 min</Text>
                          <Bell size={16} className="opacity-60"/>
                        </div>
                      </StandardCard.Footer>
                    </StandardCard>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Text variant="subheading" size="lg" className="mb-3">Layout `noPadding`</Text>
                    <StandardCard colorScheme="accent" styleType="subtle" shadow="lg" noPadding onCardClick={() => alert("Card 'noPadding' clickeada!")}>
                      <StandardCard.Media>
                        <img src="https://picsum.photos/seed/standardcardE2E/600/320" alt="Placeholder" className="w-full h-auto object-cover" />
                      </StandardCard.Media>
                       <div className="p-4">
                        <StandardCard.Header>
                          <StandardCard.Title typographicVariant="title" size="xl">Imagen Edge-to-Edge</StandardCard.Title>
                        </StandardCard.Header>
                        <StandardCard.Content>
                          <Text size="sm" className="my-3">
                            Cuando `noPadding` es true, Media puede ocupar todo el ancho. Se requiere padding manual.
                          </Text>
                        </StandardCard.Content>
                        <StandardCard.Actions>
                          <CustomButton color="accent" variant="outline">Ver Más</CustomButton>
                        </StandardCard.Actions>
                      </div>
                       <StandardCard.Footer>
                          <div className="p-4 border-t border-[var(--sc-outline-border-color)]/20">
                              <Text size="xs">Pie de tarjeta con noPadding.</Text>
                          </div>
                      </StandardCard.Footer>
                    </StandardCard>
                  </motion.div>
                </motion.div>
              </motion.section>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}