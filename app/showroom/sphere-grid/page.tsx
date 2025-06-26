'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StandardPageBackground } from '@/components/ui/StandardPageBackground';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { Layers, CheckCircle, AlertTriangle, Info, CircleDot, Scaling, ArrowDownUp } from 'lucide-react';
import { StandardSlider } from '@/components/ui/StandardSlider';
import { 
  StandardSphereGrid, 
  SphereItemData, 
  SphereGridOverflowHandling 
} from '@/components/ui/StandardSphereGrid';
import { StandardText } from '@/components/ui/StandardText';
import { StandardCard } from '@/components/ui/StandardCard';
import { ColorSchemeVariant } from '@/lib/theme/ColorToken';

// Genera datos de prueba para las esferas
const generateSphereData = (count: number): SphereItemData[] => {
    const data: SphereItemData[] = [];
    const keyGroups = ['Investigador A', 'Investigador B', 'Investigador C', 'Pendiente'];
    const statusIcons = [CheckCircle, AlertTriangle, Info, CircleDot];
    const statusColors: ColorSchemeVariant[] = ['success', 'danger', 'tertiary', 'neutral'];

    for (let i = 1; i <= count; i++) {
      const randomKeyGroupIndex = Math.floor(Math.random() * keyGroups.length);
      const randomKeyGroup = keyGroups[randomKeyGroupIndex];
      const randomIcon = statusIcons[randomKeyGroupIndex];
      const randomColorScheme = statusColors[randomKeyGroupIndex];

      data.push({
        id: `sphere-${i}`,
        value: i,
        keyGroup: randomKeyGroup,
        colorScheme: randomColorScheme,
        icon: randomIcon,
        tooltip: `Lote ${i} - ${randomKeyGroup}`,
        statusBadge: {
          text: randomKeyGroup.substring(0, 1),
          icon: randomIcon,
        },
        onClick: (id) => console.log(`Sphere ${id} clicked!`),
      });
    }
    return data;
};


export default function SphereGridShowroomPage() {
  const [numberOfSpheres, setNumberOfSpheres] = useState<number[]>([50]);
  const [overflowHandling, setOverflowHandling] = useState<SphereGridOverflowHandling>('shrink');
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = gridContainerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sphereData = useMemo(() => generateSphereData(numberOfSpheres[0]), [numberOfSpheres]);

  return (
    <StandardPageBackground variant="gradient">
      <div className="container mx-auto py-8 space-y-8">
        <StandardPageTitle
          title="StandardSphereGrid: Adaptive Sizing"
          subtitle="Prueba cómo el grid adapta el tamaño de las esferas o introduce scroll según la configuración."
          mainIcon={Layers}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Panel de Controles */}
          <StandardCard
            colorScheme="neutral"
            className="lg:col-span-1"
          >
            <StandardCard.Header>
              <StandardText preset="subheading" weight="medium">Controles de Prueba</StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="space-y-6">
              <div>
                <StandardText weight="semibold" className="mb-2 block">Número de Esferas</StandardText>
                <StandardSlider
                  value={numberOfSpheres}
                  min={10}
                  max={200}
                  step={5}
                  onValueChange={setNumberOfSpheres}
                  showTooltip
                />
                <StandardText size="sm" className="mt-2 text-center text-muted-foreground">
                  {numberOfSpheres[0]} esferas
                </StandardText>
              </div>

              <div>
                <StandardText weight="semibold" className="mb-4 block">Gestión de Desbordamiento</StandardText>
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-neutral-interactive-hover cursor-pointer">
                    <input
                      type="radio"
                      name="overflowHandling"
                      value="shrink"
                      checked={overflowHandling === 'shrink'}
                      onChange={() => setOverflowHandling('shrink')}
                      className="form-radio h-5 w-5 text-primary-pure focus:ring-primary-pure border-neutral-300"
                    />
                    <Scaling className="h-5 w-5 text-neutral-content" />
                    <div>
                      <StandardText weight="medium">Shrink (Adaptar)</StandardText>
                      <StandardText size="sm" colorScheme="neutral" colorShade="textShade">Reduce el tamaño para caber.</StandardText>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-neutral-interactive-hover cursor-pointer">
                    <input
                      type="radio"
                      name="overflowHandling"
                      value="scroll"
                      checked={overflowHandling === 'scroll'}
                      onChange={() => setOverflowHandling('scroll')}
                      className="form-radio h-5 w-5 text-primary-pure focus:ring-primary-pure border-neutral-300"
                    />
                    <ArrowDownUp className="h-5 w-5 text-neutral-content" />
                    <div>
                      <StandardText weight="medium">Scroll (Desplazar)</StandardText>
                      <StandardText size="sm" colorScheme="neutral" colorShade="textShade">Mantiene el tamaño y activa scroll.</StandardText>
                    </div>
                  </label>
                </div>
              </div>

            </StandardCard.Content>
          </StandardCard>

          {/* Área de Visualización */}
          <div ref={gridContainerRef} className="lg:col-span-2 relative h-[70vh] min-h-[600px] flex flex-col bg-card-background/50 rounded-lg shadow-inner border border-neutral-200/50">
            <StandardSphereGrid
              items={sphereData}
              overflowHandling={overflowHandling}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              isLoading={false}
              title="Visualización de Esferas"
              subtitle={
                overflowHandling === 'shrink' 
                ? 'Modo \"shrink\": El tamaño se ajustará para evitar el scroll.' 
                : 'Modo \"scroll\": El tamaño es fijo (md), el scroll se activará si es necesario.'
              }
              cardColorScheme="secondary"
              className="flex-grow" // Importante: permite que el grid ocupe el espacio disponible
            />
          </div>
        </div>
      </div>
    </StandardPageBackground>
  );
}