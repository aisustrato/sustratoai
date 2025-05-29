"use client";

import { useState } from "react";
import { ProCard } from "@/components/ui/pro-card"; // Asegúrate que la ruta sea correcta
import { CustomButton } from "@/components/ui/custom-button";
import { Text } from "@/components/ui/text";        // Asegúrate que la ruta sea correcta
import { Icon } from "@/components/ui/icon";        // Asegúrate que la ruta sea correcta
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Asegúrate que la ruta sea correcta
import {
  ImageIcon,
  Package,
  AlertTriangle,
  TrendingUp,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // Framer Motion

// Definir las variantes como un array de solo lectura para seguridad de tipos
const cardVariantOptions = ["primary", "secondary", "tertiary", "success", "warning", "danger", "neutral", ] as const;
type CardVariantTuple = typeof cardVariantOptions;
type CardVariantKey = CardVariantTuple[number]; // Tipos para las variantes: "primary" | "secondary" | ...

export default function ShowroomCardProPage() { // Renombrado para evitar conflicto con el componente
  const [selectedCardBasic, setSelectedCardBasic] = useState<string | null>(null);
  const [selectedVariantCards, setSelectedVariantCards] = useState<Record<CardVariantKey, boolean>>(
    cardVariantOptions.reduce((acc, variant) => ({ ...acc, [variant]: false }), {} as Record<CardVariantKey, boolean>)
  );
  const [activeTab, setActiveTab] = useState("basic");


  const handleCardBasicClick = (id: string) => {
    setSelectedCardBasic(selectedCardBasic === id ? null : id);
  };

  const handleVariantCardSelection = (variant: CardVariantKey, isSelected: boolean) => {
    setSelectedVariantCards(prev => ({ ...prev, [variant]: isSelected }));
  };

  // Variantes de animación para el contenedor de las tarjetas (stagger)
  const gridContainerVariants = {
    hidden: { opacity: 1 }, // El contenedor en sí no se desvanece, solo sus hijos
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07, // Pequeño retraso entre la aparición de cada tarjeta
      },
    },
  };

  // Variantes para cada tarjeta individual (usadas por ProCard por defecto si animateEntrance=true)
  // ProCard ya tiene { opacity: 0, y: 15 } y { opacity: 1, y: 0 } por defecto
  // Si queremos sobrescribir, lo haríamos en el componente ProCard o pasando props
  // pero aquí solo necesitamos el contenedor para el stagger.

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-12 text-center">
        <Text variant="heading"  gradient="primary" className="mb-3 font-bold">
          ProCard Showroom
        </Text>
        <Text variant="default" size="lg" color="neutral"  className="max-w-2xl mx-auto">
          Explora las capacidades del componente ProCard, incluyendo animaciones,
          estados, variantes y subcomponentes personalizables.
        </Text>
      </div>

      <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-8">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="sections">Secciones</TabsTrigger>
          <TabsTrigger value="states">Estados</TabsTrigger>
          <TabsTrigger value="examples">Ejemplos</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait"> {/* Para animar la salida/entrada de TabsContent */}
          {/* Sección Básica */}
          {activeTab === "basic" && (
            <TabsContent forceMount value="basic" asChild>
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Ejemplo 1: Por defecto (sin hover ni glow) */}
                  <ProCard animateEntrance>
                    <ProCard.Title>Por defecto (sin hover ni glow)</ProCard.Title>
                    <ProCard.Content>
                      <Text>Esta tarjeta no tiene efecto hover ni glow.</Text>
                    </ProCard.Content>
                  </ProCard>

                  {/* Ejemplo 2: Hover clásico */}
                  <ProCard animateEntrance disableShadowHover={true}>
                    <ProCard.Title>Con hover clásico</ProCard.Title>
                    <ProCard.Content>
                      <Text>Esta tarjeta tiene sombra al hacer hover.</Text>
                    </ProCard.Content>
                  </ProCard>

                  {/* Ejemplo 3: Glow elegante */}
                  <ProCard animateEntrance>
                    <ProCard.Title>Glow elegante</ProCard.Title>
                    <ProCard.Content>
                      <Text>Esta tarjeta muestra un efecto glow animado al hacer hover.</Text>
                    </ProCard.Content>
                  </ProCard>
                </motion.div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div>
                    <Text variant="heading" size="xl" className="mb-4">ProCard Básico</Text>
                    <ProCard animateEntrance>
                      <Text>Contenido básico</Text>
                    </ProCard>
                  </div>
                  <div>
                    <Text variant="heading" size="xl" className="mb-4">Con borde</Text>
                    <ProCard border="normal" animateEntrance>
                      <Text>Tarjeta con borde normal</Text>
                    </ProCard>
                  </div>
                  <div>
                    <Text variant="heading" size="xl" className="mb-4">Borde superior</Text>
                    <ProCard variant="primary" border="top" animateEntrance>
                      <ProCard.Title>Borde Superior</ProCard.Title>
                      <ProCard.Content><Text>Contenido...</Text></ProCard.Content>
                    </ProCard>
                  </div>
                  <div>
                    <Text variant="heading" size="xl" className="mb-4">Borde izquierdo</Text>
                    <ProCard border="left" variant="secondary" animateEntrance>
                      <ProCard.Title>Borde Izquierdo</ProCard.Title>
                      <ProCard.Content><Text>Contenido...</Text></ProCard.Content>
                    </ProCard>
                  </div>
                </motion.div>
              </motion.div>
            </TabsContent>
          )}

          {/* Variantes */}
          {activeTab === "variants" && (
            <TabsContent forceMount value="variants" asChild>
              <motion.div
                key="variants"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {cardVariantOptions.map((variantKey) => (
                    <ProCard
                      key={variantKey}
                      variant={variantKey}
                      selected={selectedVariantCards[variantKey]}
                      showSelectionCheckbox
                      onSelectionChange={(isSelected) => 
                        handleVariantCardSelection(variantKey, isSelected)
                      }
                      animateEntrance // La animación de entrada está por defecto en ProCard
                      className="min-h-[150px]" // Para dar algo de altura
                    >
                      <ProCard.Header>
                        <ProCard.Title className="capitalize">{variantKey}</ProCard.Title>
                      </ProCard.Header>
                      <ProCard.Content>
                        <Text>Tarjeta con variante {variantKey}.</Text>
                      </ProCard.Content>
                    </ProCard>
                  ))}
                </motion.div>
                {/* ... (Otras tarjetas de ejemplo de variantes si las tienes) ... */}
              </motion.div>
            </TabsContent>
          )}
          
          {/* Secciones */}
          {activeTab === "sections" && (
            <TabsContent forceMount value="sections" asChild>
              <motion.div /* ... animaciones de TabsContent ... */ className="space-y-8">
                <motion.div /* ... gridContainerVariants ... */ className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Text variant="heading" size="xl" className="mb-4">Todas las secciones</Text>
                    <ProCard animateEntrance>
                      <ProCard.Header>
                        <ProCard.Title>Título</ProCard.Title>
                        <ProCard.Subtitle>Subtítulo</ProCard.Subtitle>
                      </ProCard.Header>
                      <ProCard.Media><div className="h-32 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><ImageIcon/></div></ProCard.Media>
                      <ProCard.Content><Text>Contenido principal.</Text></ProCard.Content>
                      <ProCard.Actions><CustomButton variant="solid" size="sm">Acción</CustomButton></ProCard.Actions>
                      <ProCard.Footer><Text size="xs">Pie de tarjeta.</Text></ProCard.Footer>
                    </ProCard>
                  </div>
                  {/* ... Más ejemplos de secciones ... */}
                </motion.div>
              </motion.div>
            </TabsContent>
          )}

          {/* Estados */}
          {activeTab === "states" && (
            <TabsContent forceMount value="states" asChild>
               <motion.div /* ... animaciones de TabsContent ... */ className="space-y-8">
                <motion.div /* ... gridContainerVariants ... */ className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Text variant="heading" size="xl" className="mb-4">Estado seleccionado (Click)</Text>
                        <div className="space-y-4">
                            <ProCard
                                selected={selectedCardBasic === "card1_state"}
                                onClick={() => handleCardBasicClick("card1_state")}
                                className="cursor-pointer"
                                animateEntrance
                            >
                                <ProCard.Title>Seleccionable 1</ProCard.Title>
                                <ProCard.Content><Text>Haz clic para seleccionar.</Text></ProCard.Content>
                            </ProCard>
                             <ProCard
                                selected={selectedCardBasic === "card2_state"}
                                onClick={() => handleCardBasicClick("card2_state")}
                                className="cursor-pointer"
                                animateEntrance
                            >
                                <ProCard.Title>Seleccionable 2</ProCard.Title>
                                <ProCard.Content><Text>Haz clic para seleccionar.</Text></ProCard.Content>
                            </ProCard>
                        </div>
                    </div>
                    <div>
                        <Text variant="heading" size="xl" className="mb-4">Estado de carga</Text>
                        <ProCard loading animateEntrance>
                            <ProCard.Title>Cargando...</ProCard.Title>
                            {/* El contenido no se verá */}
                        </ProCard>
                    </div>
                </motion.div>
               </motion.div>
            </TabsContent>
          )}

          {/* Ejemplos */}
          {activeTab === "examples" && (
            <TabsContent forceMount value="examples" asChild>
              <motion.div /* ... animaciones de TabsContent ... */>
                <motion.div /* ... gridContainerVariants ... */ className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aquí irían tus tarjetas de ejemplo, cada una como ProCard */}
                    {/* Ejemplo: */}
                    <ProCard animateEntrance border="normal">
                        <ProCard.Media><div className="h-40 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center"><Package/></div></ProCard.Media>
                        <ProCard.Header><ProCard.Title>Tarjeta de Producto</ProCard.Title></ProCard.Header>
                        <ProCard.Content><Text>Descripción del producto...</Text></ProCard.Content>
                        <ProCard.Actions><CustomButton variant="solid">Comprar</CustomButton></ProCard.Actions>
                    </ProCard>
                     <ProCard animateEntrance variant="warning" border="left">
                        <ProCard.Header><ProCard.Title><AlertTriangle className="inline mr-2"/>Notificación</ProCard.Title></ProCard.Header>
                        <ProCard.Content><Text>Mensaje importante...</Text></ProCard.Content>
                    </ProCard>
                    {/* ... más ejemplos ... */}
                </motion.div>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>

      {/* ... (Referencia de API sin cambios, si la tienes) ... */}
    </div>
  );
}