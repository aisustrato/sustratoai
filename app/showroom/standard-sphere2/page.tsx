"use client";

import React, { useState } from "react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSphere } from "@/components/ui/StandardSphere";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDivider } from "@/components/ui/StandardDivider";

import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";

type SphereStyleType = "filled" | "subtle" | "outline";
type SphereSizeVariant = "sm" | "md" | "lg";

// Opciones de configuración
const colorSchemes: ColorSchemeVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "success",
  "warning",
  "danger",
  "accent",
  "neutral",
];

const styleTypes: SphereStyleType[] = ["filled", "subtle", "outline"];
const sizes: SphereSizeVariant[] = ["sm", "md", "lg"];

const StandardSphereShowroomPage = () => {
  const [sphereCount, setSphereCount] = useState(5);
  const [showBadge, setShowBadge] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [selectedStyleType, setSelectedStyleType] = useState<SphereStyleType>("filled");
  const [selectedSize, setSelectedSize] = useState<SphereSizeVariant>("md");
  
  // Controles para cantidad de esferas
  const handleIncrementSpheres = () =>
    setSphereCount((prev) => Math.min(prev + 1, 20));
  const handleDecrementSpheres = () =>
    setSphereCount((prev) => Math.max(prev - 1, 1));

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <StandardText preset="title" className="mb-6">
        Showroom: StandardSphere
      </StandardText>
      <StandardText preset="body" className="mb-10">
        El componente StandardSphere muestra valores numéricos en formato de
        esfera, con tamaño responsivo según la cantidad total de esferas.
        Soporta distintos estilos, esquemas de color, tooltips y badges.
      </StandardText>

      {/* Sección de Esquemas de Color */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Esquemas de Color</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="flex flex-wrap gap-4">
            {colorSchemes.map((scheme) => (
              <StandardSphere
                key={scheme}
                value={colorSchemes.indexOf(scheme) + 1}
                colorScheme={scheme}
                styleType={selectedStyleType}
                size={selectedSize}
                tooltip={showTooltip ? `Esquema: ${scheme}` : undefined}
                badge={showBadge ? "new" : undefined}
              />
            ))}
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Sección de Estilos */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Estilos Visuales</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {styleTypes.map(style => (
              <div key={style} className="space-y-4">
                <StandardText preset="subheading" size="lg" className="capitalize">
                  {style}
                </StandardText>
                <div className="flex flex-wrap gap-4">
                  {colorSchemes.slice(0, 4).map((scheme) => (
                    <StandardSphere
                      key={`${style}-${scheme}`}
                      value={colorSchemes.indexOf(scheme) + 1}
                      colorScheme={scheme}
                      styleType={style}
                      size={selectedSize}
                      tooltip={showTooltip ? `${scheme} - ${style}` : undefined}
                      badge={showBadge ? "!" : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Sección de Tamaños */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Tamaños</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sizes.map(size => (
              <div key={size} className="space-y-4">
                <StandardText preset="subheading" size="lg" className="capitalize">
                  {size}
                </StandardText>
                <div className="flex flex-wrap gap-4 items-end">
                  {colorSchemes.slice(0, 4).map((scheme) => (
                    <StandardSphere
                      key={`${size}-${scheme}`}
                      value={colorSchemes.indexOf(scheme) + 1}
                      colorScheme={scheme}
                      styleType={selectedStyleType}
                      size={size}
                      tooltip={showTooltip ? "¡Tamaño: " + size : undefined}
                      badge={showBadge ? "+" : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Sección de Tamaño Responsivo */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Tamaño Responsivo</StandardCard.Title>
          <StandardCard.Subtitle>
            Cantidad de esferas: {sphereCount}
          </StandardCard.Subtitle>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="flex flex-wrap gap-4 mb-6">
            {Array.from({ length: sphereCount }).map((_, index) => (
              <StandardSphere
                key={index}
                value={index + 1}
                colorScheme={colorSchemes[index % colorSchemes.length]}
                styleType={selectedStyleType}
                totalSpheres={sphereCount}
                tooltip={showTooltip ? `Valor: ${index + 1}` : undefined}
                badge={showBadge && index % 3 === 0 ? "+" : undefined}
              />
            ))}
          </div>

          <StandardDivider className="my-4" />
          
          <div className="flex items-center gap-4 mt-6">
            <StandardButton
              onClick={handleDecrementSpheres}
              disabled={sphereCount <= 1}
              colorScheme="danger">
              Menos Esferas
            </StandardButton>

            <StandardText size="lg" className="px-4">
              {sphereCount}
            </StandardText>

            <StandardButton
              onClick={handleIncrementSpheres}
              disabled={sphereCount >= 20}
              colorScheme="success">
              Más Esferas
            </StandardButton>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Sección de Configuración */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Configuración</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="flex flex-wrap gap-4">
            <StandardButton
              onClick={() => setShowTooltip(!showTooltip)}
              colorScheme="secondary"
              styleType={showTooltip ? "solid" : "outline"}>
              {showTooltip ? "Ocultar Tooltip" : "Mostrar Tooltip"}
            </StandardButton>
            <StandardButton
              onClick={() => setShowBadge(!showBadge)}
              colorScheme="tertiary"
              styleType={showBadge ? "solid" : "outline"}>
              {showBadge ? "Ocultar Badge" : "Mostrar Badge"}
            </StandardButton>
          </div>

          <StandardDivider className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <StandardText className="mb-2">Tipo de Estilo:</StandardText>
              <div className="flex gap-2">
                {styleTypes.map(style => (
                  <StandardButton 
                    key={style}
                    size="sm"
                    colorScheme="primary"
                    styleType={selectedStyleType === style ? "solid" : "outline"}
                    onClick={() => setSelectedStyleType(style)}>
                    {style}
                  </StandardButton>
                ))}
              </div>
            </div>
            
            <div>
              <StandardText className="mb-2">Tamaño:</StandardText>
              <div className="flex gap-2">
                {sizes.map(size => (
                  <StandardButton 
                    key={size}
                    size="sm"
                    colorScheme="primary"
                    styleType={selectedSize === size ? "solid" : "outline"}
                    onClick={() => setSelectedSize(size)}>
                    {size}
                  </StandardButton>
                ))}
              </div>
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Sección de Interactividad */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Interactividad</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <StandardText preset="subheading">Con Click</StandardText>
              <div className="flex flex-wrap gap-4">
                {colorSchemes.slice(0, 4).map((scheme, idx) => (
                  <StandardSphere
                    key={scheme}
                    value={idx + 1}
                    colorScheme={scheme}
                    styleType="filled"
                    tooltip="¡Haz clic en mí!"
                    onClick={() => alert(`¡Clic en esfera ${idx + 1} (${scheme})!`)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <StandardText preset="subheading">Deshabilitadas</StandardText>
              <div className="flex flex-wrap gap-4">
                {colorSchemes.slice(0, 4).map((scheme, idx) => (
                  <StandardSphere
                    key={scheme}
                    value={idx + 1}
                    colorScheme={scheme}
                    styleType="filled"
                    tooltip="Estoy deshabilitada"
                    disabled={true}
                    badge={showBadge ? "−" : undefined}
                  />
                ))}
              </div>
            </div>
          </div>

          <StandardDivider className="my-6" />
          
          <div className="space-y-4">
            <StandardText preset="subheading">Caso de uso: Selector de niveles</StandardText>
            <div className="flex flex-wrap gap-6 justify-center">
              {["Básico", "Intermedio", "Avanzado", "Experto"].map((level, idx) => (
                <div key={level} className="flex flex-col items-center gap-2">
                  <StandardSphere
                    value={idx + 1}
                    colorScheme={
                      idx === 0
                        ? "success"
                        : idx === 1
                          ? "accent"
                          : idx === 2
                            ? "warning"
                            : "danger"
                    }
                    styleType="filled"
                    size="lg"
                    tooltip={`Nivel ${level}`}
                    onClick={() => alert(`Seleccionaste: ${level}`)}
                    badge={idx === 3 ? "🔥" : undefined}
                  />
                  <StandardText size="sm">{level}</StandardText>
                </div>
              ))}
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>
    </div>
  );
};

export default StandardSphereShowroomPage;
