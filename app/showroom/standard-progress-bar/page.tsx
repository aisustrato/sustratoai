//. 📍 app/showroom/standard-progress-bar/page.tsx (v2.1 - Sintaxis Corregida)

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- ✅ Componentes "Standard" ---
import { StandardProgressBar, type StandardProgressBarProps } from "@/components/ui/StandardProgressBar";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardInput } from "@/components/ui/StandardInput";

// --- ⚠️ Componentes Legacy (Standard aún no existe) ---
import { Slider } from "@/components/ui/slider";

// --- Componentes de UI Generales ---
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Play, ToggleLeft, Type, Scaling } from "lucide-react";

// --- Opciones para los Controles ---
const progressBarColorSchemes: NonNullable<StandardProgressBarProps["colorScheme"]>[] = [
  "primary", "secondary", "tertiary", "accent", "success", "warning", "danger", "neutral",
];
const styleTypes: NonNullable<StandardProgressBarProps["styleType"]>[] = [
  "solid", "gradient", "accent-gradient", "thermometer",
];
const sizes: NonNullable<StandardProgressBarProps["size"]>[] = [
  "xs", "sm", "md", "lg", "xl",
];

// --- Variantes de Animación Framer Motion ---
const tabContentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeInOut" } },
};
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function StandardProgressBarShowroomPage() {
  const [activeTab, setActiveTab] = useState("interactive");

  // --- Estados para el Demo Interactivo ---
  const [demoValue, setDemoValue] = useState(65);
  const [demoColorScheme, setDemoColorScheme] = useState<NonNullable<StandardProgressBarProps["colorScheme"]>>("primary");
  const [demoStyleType, setDemoStyleType] = useState<NonNullable<StandardProgressBarProps["styleType"]>>("gradient");
  const [demoSize, setDemoSize] = useState<NonNullable<StandardProgressBarProps["size"]>>("md");
  const [demoLabel, setDemoLabel] = useState("Progreso de la Tarea");
  const [showDemoValue, setShowDemoValue] = useState(true);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [isAnimated, setIsAnimated] = useState(true);

  // --- Estado para la demo de auto-llenado ---
  const [fillingValue, setFillingValue] = useState(0);

  useEffect(() => {
    if (activeTab === "states") {
      setFillingValue(0);
      const interval = setInterval(() => {
        setFillingValue((prev) => (prev >= 100 ? 0 : prev + 5));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-12 text-center">
        <StandardText asElement="h1" size="3xl" weight="bold" applyGradient colorScheme="primary" className="mb-3">
          StandardProgressBar Showroom
        </StandardText>
        <StandardText asElement="p" size="lg" colorScheme="neutral" colorShade="text" className="max-w-2xl mx-auto">
          Explora las capacidades del nuevo componente StandardProgressBar.
        </StandardText>
        <div className="mt-4"><ThemeSwitcher /></div>
      </header>

      <Tabs defaultValue="interactive" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="interactive">Interactivo</TabsTrigger>
          <TabsTrigger value="schemes">Esquemas y Estilos</TabsTrigger>
          <TabsTrigger value="sizes">Tamaños</TabsTrigger>
          <TabsTrigger value="states">Estados</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "interactive" && (
            <TabsContent forceMount value="interactive" asChild>
              <motion.section key="interactive" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 p-6 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
                <StandardText asElement="h2" size="xl" weight="semibold" className="mb-2">Demo Interactivo</StandardText>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                  <div className="space-y-1"><StandardText asElement="span" size="sm" weight="medium"><Palette size={14} className="inline mr-1"/>Esquema de Color:</StandardText><StandardSelect value={demoColorScheme} onChange={(val) => setDemoColorScheme(val as any)} options={progressBarColorSchemes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><StandardText asElement="span" size="sm" weight="medium"><Palette size={14} className="inline mr-1"/>Tipo de Estilo:</StandardText><StandardSelect value={demoStyleType} onChange={(val) => setDemoStyleType(val as any)} options={styleTypes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><StandardText asElement="span" size="sm" weight="medium"><Scaling size={14} className="inline mr-1"/>Tamaño:</StandardText><StandardSelect value={demoSize} onChange={(val) => setDemoSize(val as any)} options={sizes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1 md:col-span-2 lg:col-span-3"><StandardText asElement="span" size="sm" weight="medium"><Type size={14} className="inline mr-1"/>Etiqueta:</StandardText><StandardInput type="text" value={demoLabel} onChange={(e) => setDemoLabel(e.target.value)} placeholder="Escribe una etiqueta..." /></div>
                </div>

                <div className="pt-4 space-y-4">
                    <StandardText asElement="p" size="sm" weight="medium">Valor de Progreso: {demoValue}%</StandardText>
                    <Slider defaultValue={[65]} value={[demoValue]} max={100} step={1} onValueChange={(val) => setDemoValue(val[0])} disabled={isIndeterminate}/>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                    <StandardButton size="sm" styleType={showDemoValue ? "solid" : "outline"} onClick={() => setShowDemoValue(!showDemoValue)}>Toggle Valor</StandardButton>
                    <StandardButton size="sm" styleType={isIndeterminate ? "solid" : "outline"} onClick={() => setIsIndeterminate(!isIndeterminate)}>Toggle Indeterminado</StandardButton>
                    <StandardButton size="sm" styleType={isAnimated ? "solid" : "outline"} onClick={() => setIsAnimated(!isAnimated)}>Toggle Animación</StandardButton>
                </div>
                
                <div className="mt-8 pt-8 border-t border-dashed">
                    <StandardProgressBar
                        key={`${demoColorScheme}-${demoStyleType}-${demoSize}-${demoLabel}-${showDemoValue}-${isIndeterminate}`}
                        colorScheme={demoColorScheme}
                        styleType={demoStyleType}
                        size={demoSize}
                        value={demoValue}
                        label={demoLabel}
                        showValue={showDemoValue}
                        indeterminate={isIndeterminate}
                        animated={isAnimated}
                    />
                </div>
              </motion.section>
            </TabsContent>
          )}

          {activeTab === "schemes" && (
            <TabsContent forceMount value="schemes" asChild>
                {/* 🚨 INICIO DE LA CORRECCIÓN */}
                <motion.section key="schemes" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                {progressBarColorSchemes.map(cs => (
                    <motion.div key={cs} variants={itemVariants} className="mb-10">
                        <StandardText asElement="h3" size="lg" weight="medium" className="mb-4 capitalize">{cs}</StandardText>
                        <div className="space-y-5">
                            {styleTypes.map(st => (
                                <div key={`${cs}-${st}`}>
                                    <StandardText asElement="p" size="sm" colorScheme="neutral" colorShade="text" className="mb-1.5 capitalize">{st.replace('-', ' ')}</StandardText>
                                    <StandardProgressBar colorScheme={cs} styleType={st} value={75} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
                </motion.section>
                {/* 🚨 FIN DE LA CORRECCIÓN */}
            </TabsContent>
          )}

          {activeTab === "sizes" && (
             <TabsContent forceMount value="sizes" asChild>
                <motion.section key="sizes" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                    <StandardText asElement="h2" size="xl" weight="semibold">Variaciones de Tamaño</StandardText>
                    <motion.div className="space-y-6" variants={gridContainerVariants} initial="hidden" animate="visible">
                    {sizes.map(s => (
                        <motion.div key={s} variants={itemVariants}>
                            <StandardText asElement="p" size="sm" weight="medium" className="mb-2 uppercase">Tamaño: {s}</StandardText>
                            <StandardProgressBar colorScheme="secondary" styleType="gradient" size={s} value={80} showValue/>
                        </motion.div>
                    ))}
                    </motion.div>
                </motion.section>
             </TabsContent>
          )}
          
          {activeTab === "states" && (
             <TabsContent forceMount value="states" asChild>
                <motion.section key="states" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">
                    <div>
                        <StandardText asElement="h3" size="lg" weight="medium" className="mb-3">Estado Indeterminado <ToggleLeft size={16} className="inline-block ml-2"/></StandardText>
                        <div className="space-y-4">
                           <StandardProgressBar indeterminate colorScheme="primary" styleType="gradient"/>
                           <StandardProgressBar indeterminate colorScheme="accent" styleType="solid"/>
                        </div>
                    </div>
                    <div>
                        <StandardText asElement="h3" size="lg" weight="medium" className="mb-3">Progreso Animado (Auto-llenado) <Play size={16} className="inline-block ml-2"/></StandardText>
                        <StandardProgressBar value={fillingValue} colorScheme="success" styleType="gradient" showValue label="Cargando datos..."/>
                    </div>
                     <div>
                        <StandardText asElement="h3" size="lg" weight="medium" className="mb-3">Sin Animación</StandardText>
                        <StandardProgressBar value={50} colorScheme="warning" styleType="solid" animated={false} label="Progreso estático"/>
                    </div>
                </motion.section>
             </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}