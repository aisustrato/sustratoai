"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Star, ChevronDown, ChevronUp, Check, X, List, LayoutGrid, Menu, ArrowUpDown } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

// Tipos y constantes
type SelectVariant = "default" | "multiple" | "with-icons" | "long-options";

const colorSchemes: ColorSchemeVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "accent",
  "success",
  "warning",
  "danger",
  "neutral",
];

const selectOptions = [
  { value: "option1", label: "Opción 1" },
  { value: "option2", label: "Opción 2" },
  { value: "option3", label: "Opción 3" },
  { value: "option4", label: "Opción 4" },
  { value: "option5", label: "Opción 5" },
];

const longOptions = [
  { value: "long1", label: "Esta es una opción muy larga que debería caber en el menú desplegable sin problemas de diseño" },
  { value: "long2", label: "Otra opción con texto largo para probar el comportamiento del menú desplegable" },
  { value: "long3", label: "Tercera opción con texto largo para asegurar que el menú se ajuste correctamente" },
];

const optionsWithIcons = [
  { value: "star", label: "Favorito", icon: Star },
  { value: "list", label: "Lista", icon: List },
  { value: "grid", label: "Cuadrícula", icon: LayoutGrid },
  { value: "menu", label: "Menú", icon: Menu },
  { value: "sort", label: "Ordenar", icon: ArrowUpDown },
];

export default function StandardSelectShowroomPage() {
  const [selectedValue, setSelectedValue] = useState<string | string[]>([]);
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [selectedWithIcons, setSelectedWithIcons] = useState<string>("");
  const [selectedLong, setSelectedLong] = useState<string>("");
  const [variant, setVariant] = useState<SelectVariant>("default");
  const [showInCard, setShowInCard] = useState(false);
  const [showInScroll, setShowInScroll] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollTop);
  };

  const renderSelect = (selectProps: any) => (
    <div className="mb-6">
      <StandardText className="mb-2 font-medium">{selectProps.label}</StandardText>
      <StandardSelect
        {...selectProps}
        className="w-full md:w-64"
      />
    </div>
  );

  const renderTestCases = () => (
    <div className="space-y-8">
      {/* Select Simple */}
      <StandardCard className="p-6 relative z-40">
        <StandardText className="text-lg font-semibold mb-4">Select Simple</StandardText>
        {renderSelect({
          options: selectOptions,
          value: selectedValue,
          onChange: (value: string | string[]) => setSelectedValue(value),
          placeholder: "Selecciona una opción",
          clearable: true,
          label: "Selección simple"
        })}
      </StandardCard>

      {/* Select Múltiple */}
      <StandardCard className="p-6 relative z-30">
        <StandardText className="text-lg font-semibold mb-4">Select Múltiple</StandardText>
        {renderSelect({
          options: selectOptions,
          value: selectedMultiple,
          onChange: (value: string | string[]) => setSelectedMultiple(Array.isArray(value) ? value : []),
          placeholder: "Selecciona varias opciones",
          multiple: true,
          clearable: true,
          label: "Selección múltiple"
        })}
      </StandardCard>

      {/* Select con Íconos */}
      <StandardCard className="p-6 relative z-20">
        <StandardText className="text-lg font-semibold mb-4">Select con Íconos</StandardText>
        {renderSelect({
          options: optionsWithIcons,
          value: selectedWithIcons,
          onChange: (value: string | string[]) => setSelectedWithIcons(Array.isArray(value) ? value[0] : value),
          placeholder: "Selecciona un ícono",
          clearable: true,
          label: "Con íconos"
        })}
      </StandardCard>

      {/* Select con Opciones Largas */}
      <StandardCard className="p-6 relative z-10">
        <StandardText className="text-lg font-semibold mb-4">Opciones Largas</StandardText>
        {renderSelect({
          options: longOptions,
          value: selectedLong,
          onChange: (value: string | string[]) => setSelectedLong(Array.isArray(value) ? value[0] : value),
          placeholder: "Selecciona una opción larga",
          clearable: true,
          label: "Opciones de texto largo"
        })}
      </StandardCard>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <StandardText className="text-2xl font-bold">StandardSelect</StandardText>
          <StandardText className="text-neutral-500">
            Componente de selección personalizado con soporte para múltiples variantes
          </StandardText>
        </div>
        <ThemeSwitcher />
      </div>

      <div className="mb-8">
        <StandardText className="text-lg font-semibold mb-4">Controles</StandardText>
        <div className="flex flex-wrap gap-4 mb-6">
          <StandardButton
            onClick={() => setShowInCard(!showInCard)}
            styleType={showInCard ? "solid" : "outline"}
          >
            {showInCard ? "Ocultar tarjeta" : "Mostrar en tarjeta"}
          </StandardButton>
          <StandardButton
            onClick={() => setShowInScroll(!showInScroll)}
            styleType={showInScroll ? "solid" : "outline"}
          >
            {showInScroll ? "Ocultar scroll" : "Mostrar con scroll"}
          </StandardButton>
        </div>
      </div>

      {showInScroll ? (
        <div 
          className="border rounded-lg p-6 h-96 overflow-auto relative"
          onScroll={handleScroll}
        >
          <div className="h-[200vh] flex items-start justify-center pt-20">
            <div className="w-full max-w-2xl">
              <StandardCard className="p-6">
                <StandardText className="text-lg font-semibold mb-4">
                  Select en Contenedor con Scroll
                </StandardText>
                <StandardText className="mb-4">
                  Desplázate hacia abajo para probar el comportamiento cerca del borde inferior
                </StandardText>
                {renderSelect({
                  options: selectOptions,
                  value: selectedValue,
                  onChange: (value: string | string[]) => setSelectedValue(value),
                  placeholder: "Prueba con scroll",
                  clearable: true,
                  label: "Select con scroll"
                })}
              </StandardCard>
            </div>
          </div>
        </div>
      ) : showInCard ? (
        <StandardCard className="p-6">
          <StandardText className="text-lg font-semibold mb-4">
            Select dentro de una Tarjeta
          </StandardText>
          {renderSelect({
            options: selectOptions,
            value: selectedValue,
            onChange: (value: string | string[]) => setSelectedValue(value),
            placeholder: "Selecciona una opción",
            clearable: true,
            label: "Select en tarjeta"
          })}
        </StandardCard>
      ) : (
        renderTestCases()
      )}

      <div className="mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
        <StandardText className="text-lg font-semibold mb-4">
          Comportamiento Esperado
        </StandardText>
        <ul className="list-disc pl-5 space-y-2">
          <li>El menú desplegable debe posicionarse correctamente cerca de los bordes de la pantalla</li>
          <li>Debe abrirse hacia arriba o abajo según el espacio disponible</li>
          <li>Debe ser completamente visible dentro del viewport</li>
          <li>Debe funcionar correctamente dentro de contenedores con scroll</li>
          <li>Debe mantener su posición al hacer scroll</li>
          <li>Debe ser accesible con teclado</li>
        </ul>
      </div>
    </div>
  );
}
