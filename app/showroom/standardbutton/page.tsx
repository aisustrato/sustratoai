"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StandardButton,
  type StandardButtonColorScheme,
  type StandardButtonProps,
  type StandardButtonStyleType,
  type StandardButtonSize,
  type StandardButtonRounded,
} from "@/components/ui/StandardButton";
import { Text } from "@/components/ui/text";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { SelectCustom } from "@/components/ui/select-custom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils"; // <--- CORREGIDO: Importación añadida
import { Sun, Moon, Star, PlusCircle, Heart, Settings, Download, Search, Palette, Loader, MousePointerClick } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { CustomButton } from "@/components/ui/custom-button";

// (El resto del código del showroom se mantiene como en mi Mensaje 37, ya que era funcional
// y el único error era la falta de esta importación de `cn`)
// ... (resto del código del showroom aquí) ...
type ShowroomButtonColor = Exclude<StandardButtonColorScheme, "neutral" | "white" | "info">;

const buttonColorSchemes: StandardButtonColorScheme[] = [
  "primary", "secondary", "tertiary", "accent", "success", 
  "warning", "danger", "neutral", "white"
];
const buttonStyleTypes: StandardButtonStyleType[] = ["solid", "outline", "ghost", "link", "subtle"];
const buttonSizes: StandardButtonSize[] = ["xs", "sm", "md", "lg", "xl", "icon"];
const buttonRoundings: StandardButtonRounded[] = ["none", "sm", "md", "lg", "full"];

const getValidButtonColor = (scheme: StandardButtonColorScheme): ShowroomButtonColor | "primary" => {
  if (scheme === "neutral" || scheme === "white") {
    return "primary"; 
  }
  return scheme as ShowroomButtonColor;
};


// --- Helper Components para el Showroom (CORREGIDOS) ---
const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className={className}>
    <StandardText variant="heading" size="xl" asElement="h3" className="mb-4">{title}</StandardText>
    <div className="p-6 border rounded-lg bg-background space-y-6">
      {children}
    </div>
  </motion.div>
);

const ExampleRow: React.FC<{ description: string; children: React.ReactNode }> = ({ description, children }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-2">
    <StandardText variant="caption" colorScheme="neutral" className="w-full md:w-1/4 shrink-0">{description}</StandardText>
    <div className="w-full p-4 border-l-4 rounded bg-neutral-softBg dark:bg-neutral-bgDark flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);
// --- Fin Helpers ---


export default function StandardButtonShowroomPage() {
  const [activeTab, setActiveTab] = useState("interactive");

  const [demoColorScheme, setDemoColorScheme] = useState<StandardButtonColorScheme>("primary");
  const [demoStyleType, setDemoStyleType] = useState<StandardButtonStyleType>("solid");
  const [demoSize, setDemoSize] = useState<StandardButtonSize>("md");
  const [demoRounded, setDemoRounded] = useState<StandardButtonRounded>("md");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isElevated, setIsElevated] = useState(false);
  const [isGradient, setIsGradient] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [hasLeftIcon, setHasLeftIcon] = useState(false);
  const [hasRightIcon, setHasRightIcon] = useState(false);
  const [isIconOnly, setIsIconOnly] = useState(false);


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
          StandardButton Showroom
        </StandardText>
        <StandardText variant="default" size="lg" colorScheme="neutral" className="max-w-2xl mx-auto">
          Demostración de la API estandarizada para el componente de botón.
        </StandardText>
        <div className="mt-4"><ThemeSwitcher /></div>
      </header>

      <Tabs defaultValue="interactive" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-8">
          <TabsTrigger value="interactive">Interactivo</TabsTrigger>
          <TabsTrigger value="styles">Estilos (`styleType`)</TabsTrigger>
          <TabsTrigger value="schemes">Colores (`colorScheme`)</TabsTrigger>
          <TabsTrigger value="sizes">Tamaños y Decoraciones</TabsTrigger>
          <TabsTrigger value="states">Estados</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
           {/* --- Pestaña Interactiva --- */}
          {activeTab === "interactive" && (
            <TabsContent forceMount value="interactive" asChild>
              <motion.section key="interactive" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 p-4 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
                <StandardText variant="heading" size="xl" className="mb-6">Demo Interactivo</StandardText>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  <div className="space-y-1"><StandardText size="sm" weight="medium">ColorScheme:</StandardText><SelectCustom value={demoColorScheme} onChange={val => setDemoColorScheme(val as any)} options={buttonColorSchemes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><StandardText size="sm" weight="medium">StyleType:</StandardText><SelectCustom value={demoStyleType} onChange={val => setDemoStyleType(val as any)} options={buttonStyleTypes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><StandardText size="sm" weight="medium">Size:</StandardText><SelectCustom value={demoSize} onChange={val => setDemoSize(val as any)} options={buttonSizes.map(s => ({ value: s, label: s }))} /></div>
                  <div className="space-y-1"><StandardText size="sm" weight="medium">Rounded:</StandardText><SelectCustom value={demoRounded} onChange={val => setDemoRounded(val as any)} options={buttonRoundings.map(s => ({ value: s, label: s }))} /></div>
                </div>
                <div className="flex flex-wrap gap-3 mb-8">
                    <StandardButton size="sm" styleType={isElevated ? "solid" : "outline"} onClick={() => setIsElevated(!isElevated)}>Toggle Elevated</StandardButton>
                    <StandardButton size="sm" styleType={isGradient ? "solid" : "outline"} onClick={() => setIsGradient(!isGradient)}>Toggle Gradient</StandardButton>
                    <StandardButton size="sm" styleType={isFullWidth ? "solid" : "outline"} onClick={() => setIsFullWidth(!isFullWidth)}>Toggle Full Width</StandardButton>
                    <StandardButton size="sm" styleType={hasLeftIcon ? "solid" : "outline"} onClick={() => setHasLeftIcon(!hasLeftIcon)}>Toggle Left Icon</StandardButton>
                    <StandardButton size="sm" styleType={hasRightIcon ? "solid" : "outline"} onClick={() => setHasRightIcon(!hasRightIcon)}>Toggle Right Icon</StandardButton>
                    <StandardButton size="sm" styleType={isIconOnly ? "solid" : "outline"} onClick={() => setIsIconOnly(!isIconOnly)}>Toggle Icon Only</StandardButton>
                    <StandardButton size="sm" styleType={isLoading ? "solid" : "outline"} onClick={() => setIsLoading(!isLoading)}>{isLoading ? "Cargando..." : "Toggle Loading"}</StandardButton>
                    <StandardButton size="sm" styleType={isDisabled ? "solid" : "outline"} onClick={() => setIsDisabled(!isDisabled)}>Toggle Disabled</StandardButton>
                </div>
                
                <div className={cn("p-8 border-2 border-dashed rounded-lg flex items-center justify-center", isFullWidth && "w-full")}>
                  <StandardButton
                    colorScheme={demoColorScheme}
                    styleType={demoStyleType}
                    size={demoSize}
                    rounded={demoRounded}
                    elevated={isElevated}
                    gradient={isGradient}
                    fullWidth={isFullWidth}
                    leftIcon={hasLeftIcon ? <Star size="1em" /> : undefined}
                    rightIcon={hasRightIcon ? <PlusCircle size="1em" /> : undefined}
                    iconOnly={isIconOnly}
                    loading={isLoading}
                    loadingText="Procesando"
                    disabled={isDisabled}
                    tooltip={isIconOnly ? "Botón de Ejemplo" : undefined}
                  >
                    {isIconOnly ? <Heart size="1em"/> : "Botón de Ejemplo"}
                  </StandardButton>
                </div>
              </motion.section>
            </TabsContent>
          )}

           {/* --- Pestaña StyleTypes --- */}
          {activeTab === "styles" && (
             <TabsContent forceMount value="styles" asChild>
                <motion.div key="styles" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                   <Section title="Estilos (`styleType`)">
                      {buttonStyleTypes.map(style => (
                        <ExampleRow key={style} description={`styleType="${style}"`}>
                           <StandardButton styleType={style} colorScheme="primary">Botón {style}</StandardButton>
                           <StandardButton styleType={style} colorScheme="secondary">Botón {style}</StandardButton>
                           <StandardButton styleType={style} colorScheme="danger">Botón {style}</StandardButton>
                        </ExampleRow>
                      ))}
                   </Section>
                </motion.div>
             </TabsContent>
          )}

           {/* --- Pestaña ColorSchemes --- */}
          {activeTab === "schemes" && (
             <TabsContent forceMount value="schemes" asChild>
                <motion.div key="schemes" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                   <Section title="Esquemas de Color (`colorScheme`) para estilo 'solid'">
                      <div className="flex flex-wrap items-center gap-4">
                        {buttonColorSchemes.map(scheme => (
                           <StandardButton key={scheme} styleType="solid" colorScheme={scheme}>{scheme}</StandardButton>
                        ))}
                      </div>
                   </Section>
                   <Section title="Esquemas de Color (`colorScheme`) para estilo 'outline'">
                      <div className="flex flex-wrap items-center gap-4">
                        {buttonColorSchemes.map(scheme => (
                           <StandardButton key={scheme} styleType="outline" colorScheme={scheme}>{scheme}</StandardButton>
                        ))}
                      </div>
                   </Section>
                </motion.div>
             </TabsContent>
          )}
          
           {/* --- Pestaña Tamaños y Decoraciones --- */}
          {activeTab === "sizes" && (
             <TabsContent forceMount value="sizes" asChild>
                <motion.div key="sizes" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                  <Section title="Tamaños (`size`)">
                    <ExampleRow description="Botones con texto">
                       {buttonSizes.map(size => <StandardButton key={size} size={size}>Tamaño {size}</StandardButton>)}
                    </ExampleRow>
                  </Section>
                   <Section title="Redondez (`rounded`)">
                    <ExampleRow description="Diferentes niveles de redondez">
                       {buttonRoundings.map(r => <StandardButton key={r} rounded={r}>Rounded {r}</StandardButton>)}
                    </ExampleRow>
                  </Section>
                   <Section title="Iconos y `iconOnly`">
                    <ExampleRow description="Iconos a la izquierda y derecha">
                       <StandardButton leftIcon={<Search size="1em"/>}>Buscar</StandardButton>
                       <StandardButton rightIcon={<Download size="1em"/>}>Descargar</StandardButton>
                    </ExampleRow>
                     <ExampleRow description="Botones solo de icono (`iconOnly`)">
                       {buttonSizes.map(size => <StandardButton key={size} size={size} iconOnly tooltip={`Icono tamaño ${size}`}><Settings size="1em"/></StandardButton>)}
                    </ExampleRow>
                  </Section>
                   <Section title="Decoraciones (`elevated`, `gradient`, `bordered`)">
                    <ExampleRow description="Decoraciones booleanas">
                       <StandardButton elevated>Elevated</StandardButton>
                       <StandardButton gradient>Gradient</StandardButton>
                       <StandardButton styleType="outline" bordered>Bordered</StandardButton>
                       <StandardButton elevated gradient>Ambos</StandardButton>
                    </ExampleRow>
                  </Section>
                </motion.div>
             </TabsContent>
          )}
          
          {/* --- Pestaña Estados --- */}
          {activeTab === "states" && (
            <TabsContent forceMount value="states" asChild>
                <motion.div key="states" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                   <Section title="Estados (`loading`, `disabled`) y `tooltip`">
                    <ExampleRow description="Estado de carga">
                       <StandardButton loading loadingText="Guardando...">Guardando</StandardButton>
                       <StandardButton loading styleType="outline">Cargando</StandardButton>
                       <StandardButton loading styleType="ghost" iconOnly><Settings size="1em"/></StandardButton>
                    </ExampleRow>
                    <ExampleRow description="Estado deshabilitado">
                       <StandardButton disabled>Botón Deshabilitado</StandardButton>
                       <StandardButton disabled styleType="outline">Otro Botón Deshabilitado</StandardButton>
                       <StandardButton disabled styleType="ghost" leftIcon={<PlusCircle size="1em"/>}>Acción Deshabilitada</StandardButton>
                    </ExampleRow>
                    <ExampleRow description="Botón con `tooltip`">
                       <StandardButton tooltip="Activa/desactiva el modo claro u oscuro">
                         <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                         <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                         <span className="sr-only">Toggle theme</span>
                       </StandardButton>
                    </ExampleRow>
                   </Section>
                </motion.div>
             </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}