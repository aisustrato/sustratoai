"use client";

import React, { useState } from "react";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";

const selectOptions = [
  { value: "option1", label: "Opción 1" },
  { value: "option2", label: "Opción 2" },
  { value: "option3", label: "Opción 3" },
  { value: "option4", label: "Opción 4" },
  { value: "option5", label: "Opción 5" },
];

export default function StandardSelectShowroomPage() {
  const [selectedValue, setSelectedValue] = useState<string | string[] | undefined>(undefined);
  const [selectedMultiple, setSelectedMultiple] = useState<string[] | undefined>([]);
  // Estados para futuras implementaciones
  const showInCard = false;
  const showInScroll = false;

  // Función para manejar el scroll (mantenida para futura implementación)
  const handleScroll = () => {
    // setScrollPosition(e.currentTarget.scrollTop);
  };

  interface SelectProps {
    options: Array<{ value: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
    value: string | string[] | undefined;
    onChange: (value: string | string[] | undefined) => void;
    placeholder?: string;
    multiple?: boolean;
    clearable?: boolean;
    label?: string;
    className?: string;
  }

  const renderSelect = (selectProps: Omit<SelectProps, 'onChange'> & { 
    onChange: (value: string | string[] | undefined) => void 
  }) => (
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
          onChange: (value: string | string[] | undefined) => setSelectedValue(value),
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
          onChange: (value: string | string[] | undefined) => setSelectedMultiple(Array.isArray(value) ? value : []),
          placeholder: "Selecciona varias opciones",
          multiple: true,
          clearable: true,
          label: "Selección múltiple"
        })}
      </StandardCard>

      {/* Select con Íconos - Ejemplo deshabilitado */}
      <StandardCard className="p-6 relative z-20">
        <StandardText className="text-lg font-semibold mb-4">Select con Íconos (Ejemplo deshabilitado)</StandardText>
        <StandardText className="text-sm text-gray-500 mb-4">
          Esta característica está deshabilitada temporalmente.
        </StandardText>
      </StandardCard>

      {/* Select con Opciones Largas - Ejemplo deshabilitado */}
      <StandardCard className="p-6 relative z-10">
        <StandardText className="text-lg font-semibold mb-4">Select con Opciones Largas (Ejemplo deshabilitado)</StandardText>
        <StandardText className="text-sm text-gray-500">
          Esta característica está deshabilitada temporalmente.
        </StandardText>
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
        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
          <span className="text-xs">T</span>
        </div>
      </div>

      <div className="mb-8">
        <StandardText className="text-lg font-semibold mb-4">Controles</StandardText>
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            className="px-4 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            disabled
          >
            {showInCard ? "Ocultar tarjeta" : "Mostrar en tarjeta"}
          </button>
          <button 
            className="px-4 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            disabled
          >
            {showInScroll ? "Ocultar scroll" : "Mostrar con scroll"}
          </button>
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
                  onChange: (value: string | string[] | undefined) => setSelectedValue(value),
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
            onChange: (value: string | string[] | undefined) => setSelectedValue(value),
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
