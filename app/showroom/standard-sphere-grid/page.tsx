"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSphere } from "@/components/ui/StandardSphere";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDivider } from "@/components/ui/StandardDivider";
import { StandardSlider } from "@/components/ui/StandardSlider";
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

const StandardSphereGridShowroom = () => {
  // Referencias para mediciones
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar la visualización
  const [sphereCount, setSphereCount] = useState(16);
  const [autoColumns, setAutoColumns] = useState(true); // Auto ajuste de columnas
  const [gridColumns, setGridColumns] = useState(4);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showBadge, setShowBadge] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [selectedStyleType, setSelectedStyleType] = useState<SphereStyleType>("filled");
  const [selectedSize, setSelectedSize] = useState<SphereSizeVariant>("md");
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorSchemeVariant>("primary");
  
  // Algoritmo para determinar el número óptimo de columnas basado en la cantidad de esferas
  const calculateOptimalGridColumns = (count: number, width: number): number => {
    // Valores base para diferentes cantidades de esferas
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    if (count <= 16) return 4;
    if (count <= 25) return 5;
    if (count <= 36) return 6;
    
    // Ajuste basado en el ancho disponible
    const baseSize = count > 60 ? 3 : count > 36 ? 4 : 5;
    const widthFactor = Math.floor(width / 120) || 1; // 120px como tamaño mínimo por esfera
    return Math.min(12, Math.max(2, Math.min(widthFactor, baseSize + 1)));
  };
  
  // Calcular tamaño óptimo según cantidad de esferas y columnas
  const calculateSphereSize = (count: number, cols: number): SphereSizeVariant => {
    // Más grande cuando hay pocas esferas
    if (count < 5) return "lg";
    if (count < 10) return "md";
    
    // Tamaño basado en densidad (esferas por columna)
    const density = count / cols;
    if (density <= 3) return "md";
    return "sm";
  };
  
  // Tamaño calculado basado en cantidad de esferas
  const dynamicSphereSize = useMemo(() => 
    calculateSphereSize(sphereCount, autoColumns ? 
      calculateOptimalGridColumns(sphereCount, containerWidth) : gridColumns),
    [sphereCount, gridColumns, autoColumns, containerWidth]
  );
  
  // Columnas calculadas automáticamente
  const optimalGridColumns = useMemo(() => 
    calculateOptimalGridColumns(sphereCount, containerWidth),
    [sphereCount, containerWidth]
  );
  
  // Medir el contenedor al montar y cuando cambie el tamaño
  useEffect(() => {
    const updateWidth = () => {
      if (gridContainerRef.current) {
        setContainerWidth(gridContainerRef.current.offsetWidth);
      }
    };
    
    // Actualizar al inicio
    updateWidth();
    
    // Configurar listener para cambios de tamaño
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Actualizar columnas automáticamente cuando cambie el conteo o el tamaño
  useEffect(() => {
    if (autoColumns) {
      setGridColumns(optimalGridColumns);
    }
  }, [autoColumns, optimalGridColumns]);

  // Generar array de esferas basado en la cantidad
  const spheres = Array.from({ length: sphereCount }, (_, i) => ({
    id: i + 1,
    value: i + 1,
    colorScheme: colorSchemes[i % colorSchemes.length]
  }));
  
  // Ajustar cantidad de esferas
  const handleIncrementSpheres = () => setSphereCount(prev => Math.min(prev + 1, 50));
  const handleDecrementSpheres = () => setSphereCount(prev => Math.max(prev - 1, 1));
  
  // Ajustar columnas del grid
  const handleIncrementColumns = () => setGridColumns(prev => Math.min(prev + 1, 12));
  const handleDecrementColumns = () => setGridColumns(prev => Math.max(prev - 1, 1));
  
  // Alternar entre modo automático y manual
  const toggleAutoColumns = () => setAutoColumns(prev => !prev);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <StandardText preset="title" className="mb-6">
        StandardSphere Grid Layout
      </StandardText>
      <StandardText preset="body" className="mb-10">
        Este showroom muestra cómo StandardSphere puede organizarse en un grid multi-línea,
        adaptándose a diferentes cantidades de elementos con badges visibles.
      </StandardText>

      {/* Controles principales */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Controles</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <StandardText weight="medium">Cantidad de esferas</StandardText>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <StandardButton 
                    onClick={handleDecrementSpheres}
                    disabled={sphereCount <= 1}
                    colorScheme="danger"
                    size="sm">
                    -
                  </StandardButton>
                  
                  <StandardText preset="subheading" className="flex items-center px-2" size="lg">
                    {sphereCount} esferas
                  </StandardText>
                  
                  <StandardButton
                    onClick={handleIncrementSpheres}
                    colorScheme="success"
                    size="sm">
                    +
                  </StandardButton>
                </div>

                <div className="inline-block w-px h-8 bg-border" />
                
                <div>
                  <StandardButton
                    onClick={toggleAutoColumns}
                    colorScheme={autoColumns ? "tertiary" : "neutral"}
                    styleType={autoColumns ? "solid" : "outline"}
                    size="sm">
                    {autoColumns ? "Auto Grid: ON" : "Auto Grid: OFF"}
                  </StandardButton>
                </div>

                {!autoColumns && (
                  <>
                    <div className="inline-block w-px h-8 bg-border" />
                    <div className="flex gap-2">
                      <StandardButton 
                        onClick={handleDecrementColumns}
                        disabled={gridColumns <= 1}
                        colorScheme="danger"
                        size="sm">
                        -
                      </StandardButton>
                      
                      <StandardText preset="subheading" className="flex items-center px-2" size="lg">
                        {gridColumns} cols
                      </StandardText>
                      
                      <StandardButton
                        onClick={handleIncrementColumns}
                        colorScheme="success"
                        size="sm">
                        +
                      </StandardButton>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <StandardText weight="medium">Opciones de visualización</StandardText>
              <div className="flex flex-wrap gap-4">
                <StandardButton
                  size="sm"
                  colorScheme={showBadge ? "primary" : "neutral"}
                  styleType={showBadge ? "solid" : "outline"}
                  onClick={() => setShowBadge(!showBadge)}>
                  {showBadge ? "Ocultar Badges" : "Mostrar Badges"}
                </StandardButton>

                <StandardButton
                  size="sm"
                  colorScheme={showTooltip ? "primary" : "neutral"}
                  styleType={showTooltip ? "solid" : "outline"}
                  onClick={() => setShowTooltip(!showTooltip)}>
                  {showTooltip ? "Ocultar Tooltips" : "Mostrar Tooltips"}
                </StandardButton>
              </div>
            </div>
          </div>

          <StandardDivider className="my-6" />

          {/* Selección de estilo y tamaño */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <StandardText className="mb-2">Estilo:</StandardText>
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

            <div>
              <StandardText className="mb-2">Color Principal:</StandardText>
              <div className="flex flex-wrap gap-2">
                {colorSchemes.slice(0, 4).map(scheme => (
                  <StandardButton 
                    key={scheme}
                    size="sm"
                    colorScheme={scheme}
                    styleType={selectedColorScheme === scheme ? "solid" : "outline"}
                    onClick={() => setSelectedColorScheme(scheme)}>
                    {scheme}
                  </StandardButton>
                ))}
              </div>
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Grid de esferas con espacio para badges */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Grid de Esferas</StandardCard.Title>
          <StandardText size="sm" className="text-muted-foreground">
            Vista cuadriculada {gridColumns}x{Math.ceil(sphereCount / gridColumns)}
            {autoColumns ? " (automático)" : " (manual)"}
          </StandardText>
        </StandardCard.Header>
        <StandardCard.Content>
          {/* Contenedor principal con espacio para badges */}
          <div className="py-2 relative" ref={gridContainerRef}>
            {/* Info de autoajuste */}
            {autoColumns && (
              <div className="absolute -top-2 right-2 bg-primary-subtle dark:bg-primary-subtle-dark text-xs rounded px-2 py-0.5">
                Auto: {gridColumns} columnas, tamaño {dynamicSphereSize}
              </div>
            )}
            {/* Grid con columnas dinámicas */}
            <div 
              className="grid gap-x-4 gap-y-12" 
              style={{ 
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                padding: '0.5rem'
              }}
            >
              {spheres.map((sphere) => (
                <div 
                  key={sphere.id} 
                  className="flex justify-center items-center" 
                  style={{
                    /* Contenedor con espacio para el badge */
                    minHeight: '100px',  // Altura mínima para asegurar visibilidad del badge
                    paddingBottom: '2.5rem',  // Espacio adicional para el badge
                    position: 'relative' // Para posicionamiento
                  }}
                >
                  <StandardSphere
                    value={sphere.value}
                    colorScheme={selectedColorScheme === "primary" ? sphere.colorScheme : selectedColorScheme}
                    styleType={selectedStyleType}
                    size={autoColumns ? dynamicSphereSize : selectedSize}
                    tooltip={showTooltip ? `Esfera #${sphere.value}` : undefined}
                    badge={showBadge ? (sphere.value % 3 === 0 ? "★" : "•") : undefined}
                    onClick={() => alert(`Clic en esfera #${sphere.value}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Sección Uniforme */}
      <StandardCard className="mb-8">
        <StandardCard.Header>
          <StandardCard.Title>Versión Uniforme</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="py-2">
            <div 
              className="grid gap-x-4 gap-y-12" 
              style={{ 
                gridTemplateColumns: `repeat(${autoColumns ? 4 : gridColumns}, 1fr)`,
                padding: '0.5rem'
              }}
            >
              {spheres.slice(0, 8).map((sphere) => (
                <div 
                  key={sphere.id} 
                  className="flex justify-center items-center" 
                  style={{
                    /* Contenedor con espacio para el badge */
                    minHeight: '100px',  // Altura mínima para asegurar visibilidad del badge
                    paddingBottom: '2.5rem',  // Espacio adicional para el badge
                    position: 'relative' // Para posicionamiento
                  }}
                >
                  <StandardSphere
                    value={sphere.value}
                    colorScheme={selectedColorScheme}
                    styleType={selectedStyleType}
                    size={autoColumns ? "md" : selectedSize}
                    tooltip={showTooltip ? `Uniforme #${sphere.value}` : undefined}
                    badge={showBadge ? "new" : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Ejemplo de caso de uso */}
      <StandardCard>
        <StandardCard.Header>
          <StandardCard.Title>Caso de uso: Niveles de Competencia</StandardCard.Title>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-4">
              {["Principiante", "Intermedio", "Avanzado", "Experto"].map((level, idx) => (
                <div key={level} className="flex flex-col items-center gap-2 pb-8">
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
                    tooltip={`Nivel ${idx + 1}: ${level}`}
                    onClick={() => alert(`Seleccionaste: ${level}`)}
                    badge={idx === 3 ? "★" : undefined}
                  />
                  <StandardText size="sm" weight="medium">
                    {level}
                  </StandardText>
                </div>
              ))}
            </div>

            <StandardDivider className="my-4" />

            <StandardText preset="subheading" className="mb-4">
              Simulación de Grupo
            </StandardText>

            <div className="py-2">
              <div 
                className="grid gap-8" 
                style={{ 
                  gridTemplateColumns: `repeat(${Math.min(8, gridColumns)}, 1fr)`,
                  padding: '0.5rem'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const level = Math.floor(Math.random() * 4);
                  const colorScheme: ColorSchemeVariant = 
                    level === 0 ? "success" :
                    level === 1 ? "accent" :
                    level === 2 ? "warning" : "danger";
                  
                  return (
                    <div key={i} className="flex justify-center pb-8">
                      <StandardSphere
                        value={level + 1}
                        colorScheme={colorScheme}
                        styleType={selectedStyleType}
                        size="md"
                        tooltip={showTooltip ? `Miembro #${i+1}` : undefined}
                        badge={showBadge ? (level === 3 ? "★" : undefined) : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>
    </div>
  );
};

export default StandardSphereGridShowroom;
