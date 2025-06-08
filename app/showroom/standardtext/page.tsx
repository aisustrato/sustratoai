"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardText, type StandardTextProps, type FontPairType } from "@/components/ui/StandardText"; // CORREGIDO: Usamos StandardText en todo el archivo
import type { ProCardVariant as StandardTextColorScheme } from "@/lib/theme/ColorToken";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Opciones para iterar en el showroom
const textVariants: NonNullable<StandardTextProps['variant']>[] = [
  "heading", "subheading", "title", "subtitle", "default", "label", "caption", "muted"
];
const textColorSchemes: StandardTextColorScheme[] = [
  "primary", "secondary", "tertiary", "accent", "success", "warning", "danger", "neutral", "white"
];
const textColorShades: NonNullable<StandardTextProps['colorShade']>[] = ["pure", "text", "textShade"];
const textSizes: NonNullable<StandardTextProps['size']>[] = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl"];
const textWeights: NonNullable<StandardTextProps['weight']>[] = ["normal", "medium", "semibold", "bold"];

// --- Helper Components para el Showroom (CORREGIDOS)---
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
    <StandardText variant="heading" size="xl" asElement="h3" className="mb-4">{title}</StandardText>
    <div className="p-6 border rounded-lg bg-background space-y-4">
      {children}
    </div>
  </motion.div>
);

const Example: React.FC<{ description: string; children: React.ReactNode }> = ({ description, children }) => (
  <div>
    <StandardText variant="caption" colorScheme="neutral">{description}</StandardText>
    <div className="mt-1 p-4 border-l-4 rounded bg-neutral-softBg dark:bg-neutral-bgDark">
      {children}
    </div>
  </div>
);
// --- Fin Helpers ---

export default function StandardTextShowroomPage() {
  const [activeTab, setActiveTab] = useState("variants");

  const tabContentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeInOut" } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-12 text-center">
        {/* CORREGIDO: Usando StandardText aquí */}
        <StandardText variant="heading" size="3xl" applyGradient="primary" className="mb-3 font-bold">
          StandardText Showroom
        </StandardText>
        <StandardText variant="default" size="lg" colorScheme="neutral" className="max-w-2xl mx-auto">
          Explora las capacidades del nuevo componente StandardText y su API "jergarizada".
        </StandardText>
        <div className="mt-4"><ThemeSwitcher /></div>
      </header>

      <Tabs defaultValue="variants" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-8">
          <TabsTrigger value="variants">Variants (Rol)</TabsTrigger>
          <TabsTrigger value="colors">Color & Gradiente</TabsTrigger>
          <TabsTrigger value="styling">Styling & Tipografía</TabsTrigger>
          <TabsTrigger value="misc">Misceláneos</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* --- Pestaña de Variantes (Rol Semántico) --- */}
          {activeTab === "variants" && (
            <TabsContent forceMount value="variants" asChild>
              <motion.div key="variants" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <Section title="Variantes Semánticas (`variant`)">
                  {textVariants.map(variant => (
                    <Example key={variant} description={`variant="${variant}"`}>
                      <StandardText variant={variant}>El rápido zorro marrón salta.</StandardText>
                    </Example>
                  ))}
                </Section>
              </motion.div>
            </TabsContent>
          )}

          {/* --- Pestaña de Color y Gradientes --- */}
          {activeTab === "colors" && (
            <TabsContent forceMount value="colors" asChild>
               <motion.div key="colors" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <Section title="Esquemas de Color (`colorScheme`)">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {textColorSchemes.map(scheme => (
                      <Example key={scheme} description={`colorScheme="${scheme}"`}>
                        <StandardText variant="title" size="lg" colorScheme={scheme}>Texto {scheme}</StandardText>
                      </Example>
                    ))}
                  </div>
                </Section>
                <Section title="Matices de Color (`colorShade`)">
                   {textColorShades.map(shade => (
                      <Example key={shade} description={`colorScheme="primary", colorShade="${shade}"`}>
                        <StandardText variant="title" size="lg" colorScheme="primary" colorShade={shade}>Texto {shade}</StandardText>
                      </Example>
                   ))}
                </Section>
                 <Section title="Gradientes de Texto (`applyGradient`)">
                    <Example description={`applyGradient={true}`}>
                      <StandardText variant="heading" size="2xl" applyGradient>Gradiente Primario (default)</StandardText>
                    </Example>
                     <Example description={`applyGradient="secondary"`}>
                      <StandardText variant="heading" size="2xl" applyGradient="secondary">Gradiente Secundario</StandardText>
                    </Example>
                     <Example description={`applyGradient="danger"`}>
                      <StandardText variant="heading" size="2xl" applyGradient="danger">Gradiente de Peligro</StandardText>
                    </Example>
                </Section>
              </motion.div>
            </TabsContent>
          )}

          {/* --- Pestaña de Estilo y Tipografía --- */}
           {activeTab === "styling" && (
            <TabsContent forceMount value="styling" asChild>
               <motion.div key="styling" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                 <Section title="Tamaños (`size`)">
                    {textSizes.map(size => (
                        <Example key={size} description={`size="${size}"`}>
                           <StandardText size={size}>Tamaño de texto {size}</StandardText>
                        </Example>
                    ))}
                 </Section>
                  <Section title="Pesos (`weight`)">
                    {textWeights.map(weight => (
                        <Example key={weight} description={`weight="${weight}"`}>
                           <StandardText size="lg" weight={weight}>Peso de fuente {weight}</StandardText>
                        </Example>
                    ))}
                 </Section>
                 <Section title="Fuentes (`fontType`)">
                    <Example description={`fontType="heading"`}>
                        <StandardText size="xl" fontType="heading">Texto con fuente de encabezado</StandardText>
                    </Example>
                    <Example description={`fontType="body"`}>
                        <StandardText size="xl" fontType="body">Texto con fuente de cuerpo</StandardText>
                    </Example>
                 </Section>
              </motion.div>
            </TabsContent>
          )}

          {/* --- Pestaña de Misceláneos --- */}
          {activeTab === "misc" && (
            <TabsContent forceMount value="misc" asChild>
               <motion.div key="misc" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <Section title="Renderizado de Elementos (`asElement`)">
                  <Example description={`asElement="h1"`}>
                    <StandardText asElement="h1" variant="heading" size="xl">Soy un elemento H1</StandardText>
                  </Example>
                  <Example description={`asElement="span"`}>
                    Esto es una línea de texto con un <StandardText asElement="span" colorScheme="accent" weight="semibold">elemento span</StandardText> en medio.
                  </Example>
                </Section>
                <Section title="Truncado de Texto (`truncate`)">
                  <Example description={`truncate={true}`}>
                    <StandardText truncate className="w-96">
                      Esta es una línea de texto extremadamente larga que debería ser truncada con puntos suspensivos si no cabe en el ancho asignado por su contenedor.
                    </StandardText>
                  </Example>
                </Section>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}