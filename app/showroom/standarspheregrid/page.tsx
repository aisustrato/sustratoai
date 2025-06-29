'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StandardPageBackground } from '@/components/ui/StandardPageBackground';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { 
  Layers, CheckCircle, AlertTriangle, Info, CircleDot, Scaling, SortAsc, SortDesc, TestTube
} from 'lucide-react';
import { StandardSlider } from '@/components/ui/StandardSlider';
import { 
  StandardSphereGrid, 
  type SphereItemData,
  type SphereGridSortBy, 
  type SphereGridSortDirection,
} from '@/components/ui/StandardSphereGrid';
import { StandardText } from '@/components/ui/StandardText';
import { StandardCard } from '@/components/ui/StandardCard';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { type SphereSizeVariant } from '@/lib/theme/components/standard-sphere-tokens';
import { StandardCheckbox } from '@/components/ui/StandardCheckbox';
import { type StandardBadgeStyleType } from '@/lib/theme/components/standard-badge-tokens';

const KEY_GROUPS = ['Investigador A', 'Investigador B', 'Investigador C', 'Pendiente'];
const STATUS_ICONS = [CheckCircle, AlertTriangle, Info, CircleDot];

const generateSphereData = (
  count: number, 
  options: { showBadges: boolean; useOnlyIcon: boolean }
): SphereItemData[] => {
  const data: SphereItemData[] = [];
  for (let i = 1; i <= count; i++) {
    const keyGroupIndex = Math.floor(Math.random() * KEY_GROUPS.length);
    const keyGroup = KEY_GROUPS[keyGroupIndex];
    const icon = STATUS_ICONS[keyGroupIndex];
    const badgeStyle: StandardBadgeStyleType = i % 3 === 0 ? 'solid' : 'subtle';

    data.push({
      id: `sphere-${i}`,
      value: Math.floor(Math.random() * 1000),
      keyGroup: keyGroup,
      tooltip: `Lote de ${Math.floor(Math.random() * 50) + 10} artículos - ${keyGroup}`,
      icon: icon,
      onlyIcon: options.useOnlyIcon,
      ...(options.showBadges && {
        statusBadge: {
          text: keyGroup.substring(0, 4).trim(),
          styleType: badgeStyle,
        },
      }),
      onClick: (id) => console.log(`Sphere ${id} clicked!`),
    });
  }
  return data;
};

export default function SphereGridShowroomPage() {
  const [numberOfSpheres, setNumberOfSpheres] = useState<number[]>([50]);
  const [fixedSize, setFixedSize] = useState<SphereSizeVariant | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SphereGridSortBy>('none');
  const [sortDirection, setSortDirection] = useState<SphereGridSortDirection>('asc');
  const [groupByKeyGroup, setGroupByKeyGroup] = useState<boolean>(false);
  const [showBadges, setShowBadges] = useState<boolean>(true);
  const [useOnlyIconMode, setUseOnlyIconMode] = useState<boolean>(false);
  const [keyGroupVisibility, setKeyGroupVisibility] = useState<Record<string, boolean>>({
    'Investigador A': true, 'Investigador B': true, 'Investigador C': true, 'Pendiente': true,
  });

  // Lógica de medición del "Padre Responsable"
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

  const sphereData = useMemo(() => generateSphereData(numberOfSpheres[0], { showBadges, useOnlyIcon: useOnlyIconMode }), [numberOfSpheres, showBadges, useOnlyIconMode]);
  
  const subtitle = fixedSize
    ? `Modo "Tamaño Fijo": Todas las esferas son '${fixedSize}'. Scroll se activará si es necesario.`
    : `Modo "Automático": El tamaño se ajusta para evitar el scroll (modo Tetris).`;

  return (
    <StandardPageBackground variant="gradient">
      <div className="container mx-auto py-8 space-y-8">
        <StandardPageTitle
          title="Showroom de StandardSphereGrid"
          subtitle="Un parque de juegos para probar todas las capacidades del orquestador de esferas."
          mainIcon={TestTube}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <StandardCard colorScheme="neutral" className="lg:col-span-1" accentPlacement="left">
            <StandardCard.Header>
              <StandardText preset="subheading" weight="medium">Controles del Laboratorio</StandardText>
            </StandardCard.Header>
            <StandardCard.Content className="space-y-6">
              <div>
                <StandardText weight="semibold" className="mb-2 block">1. Cantidad de Esferas</StandardText>
                <StandardSlider value={numberOfSpheres} min={10} max={200} step={5} onValueChange={setNumberOfSpheres} showTooltip />
                <StandardText size="sm" className="mt-2 text-center text-muted-foreground">{numberOfSpheres[0]} esferas</StandardText>
              </div>

              <div>
                <StandardText weight="semibold" className="mb-4 block">2. Modo de Layout</StandardText>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-neutral-interactive-hover cursor-pointer">
                    <input type="radio" name="layoutMode" checked={fixedSize === undefined} onChange={() => setFixedSize(undefined)} className="form-radio h-4 w-4 text-primary-pure"/>
                    <Scaling className="h-5 w-5 text-neutral-content" />
                    <StandardText weight="medium">Automático (Tetris)</StandardText>
                  </label>
                  {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SphereSizeVariant[]).map(size => (
                    <label key={size} className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-neutral-interactive-hover cursor-pointer">
                       <input type="radio" name="layoutMode" value={size} checked={fixedSize === size} onChange={() => setFixedSize(size)} className="form-radio h-4 w-4 text-primary-pure"/>
                       <StandardText weight="medium" className="w-12">{`Fijo: ${size.toUpperCase()}`}</StandardText>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                 <StandardText weight="semibold" className="mb-4 block">3. Apariencia de Esferas</StandardText>
                 <div className="space-y-3">
                   <StandardCheckbox checked={showBadges} onValueChange={(checked: boolean) => setShowBadges(checked)} id="showBadges" label="Mostrar Badges" />
                   <StandardCheckbox checked={useOnlyIconMode} onValueChange={(checked: boolean) => setUseOnlyIconMode(checked)} id="onlyIcon" label="Modo 'Solo Icono'" />
                 </div>
              </div>
              
              <div>
                <StandardText weight="semibold" className="mb-4 block">4. Orden y Agrupación</StandardText>
                <div className="space-y-4">
                  <StandardCheckbox checked={groupByKeyGroup} onValueChange={(checked: boolean) => setGroupByKeyGroup(checked)} id="groupBy" label="Agrupar por KeyGroup" />
                  <div className="flex gap-4">
                     <button onClick={()=> setSortBy('value')} className={`p-2 rounded ${sortBy === 'value' ? 'bg-primary-pure text-white' : 'bg-neutral-interactive'}`}>Por Valor</button>
                     <button onClick={()=> setSortBy('keyGroup')} className={`p-2 rounded ${sortBy === 'keyGroup' ? 'bg-primary-pure text-white' : 'bg-neutral-interactive'}`}>Por Grupo</button>
                     <button onClick={()=> setSortDirection((dir: SphereGridSortDirection) => dir === 'asc' ? 'desc' : 'asc')} className="p-2 rounded bg-neutral-interactive">
                        {sortDirection === 'asc' ? <SortAsc/> : <SortDesc/>}
                     </button>
                  </div>
                </div>
              </div>
              
              <div>
                <StandardText weight="semibold" className="mb-4 block">5. Visibilidad por Grupo</StandardText>
                <div className="space-y-2">
                  {KEY_GROUPS.map(group => (
                    <StandardCheckbox
                      key={group}
                      id={`vis-${group}`}
                      label={group}
                      checked={keyGroupVisibility[group]}
                      onValueChange={(checked: boolean) => setKeyGroupVisibility(prev => ({...prev, [group]: checked}))}
                    />
                  ))}
                </div>
              </div>

            </StandardCard.Content>
          </StandardCard>

          <div ref={gridContainerRef} className="lg:col-span-2 relative h-[80vh] min-h-[600px] flex flex-col">
            <StandardSphereGrid
              items={sphereData}
              fixedSize={fixedSize}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              isLoading={!containerSize.width} // Se considera cargando hasta que el padre mida el contenedor
              loadingMessage="Midiendo lienzo..."
              title="Resultado en Vivo"
              subtitle={subtitle}
              cardColorScheme="secondary"
              className="flex-grow"
              itemsHaveBadges={showBadges}
              sortBy={sortBy}
              sortDirection={sortDirection}
              groupByKeyGroup={groupByKeyGroup}
              keyGroupVisibility={keyGroupVisibility}
            />
          </div>
        </div>
      </div>
    </StandardPageBackground>
  );
}