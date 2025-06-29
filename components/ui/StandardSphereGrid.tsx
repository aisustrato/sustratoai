'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import {
  StandardSphere,
  getSphereTotalHeight,
  getBadgeSizeForSphere,
  type StandardSphereProps, 
  type StatusBadgeInfo 
} from './StandardSphere';
import {
  type SphereSizeVariant,
  SPHERE_SIZE_DEFINITIONS,
  SPHERE_GRID_GAP_TOKENS,
} from '@/lib/theme/components/standard-sphere-tokens';
import { StandardCard } from './StandardCard';
import { StandardText } from './StandardText';
import { SustratoLoadingLogo } from './sustrato-loading-logo';

// #region [Types]
export interface SphereItemData
  extends Omit<
    StandardSphereProps,
    'size' | 'onClick' | 'className' | 'statusBadge'
  > {
  id: string;
  onClick?: (id: string) => void;
  className?: string;
  statusBadge?: StatusBadgeInfo;
}

// 📌 CORRECCIÓN: Añadimos 'export' para que estos tipos sean públicos.
export type SphereGridSortBy = 'value' | 'keyGroup' | 'none';
export type SphereGridSortDirection = 'asc' | 'desc';

export interface StandardSphereGridProps {
  items: SphereItemData[];
  containerWidth: number;
  containerHeight: number;
  keyGroupVisibility?: { [key: string]: boolean };
  sortBy?: SphereGridSortBy;
  sortDirection?: SphereGridSortDirection;
  groupByKeyGroup?: boolean;
  fixedSize?: SphereSizeVariant;
  itemsHaveBadges?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
  cardColorScheme?: ColorSchemeVariant;
  title?: string;
  subtitle?: string;
  emptyStateText?: string;
}
// #endregion

export const StandardSphereGrid = ({
  items,
  containerWidth,
  containerHeight,
  keyGroupVisibility,
  sortBy = 'none',
  sortDirection = 'asc',
  groupByKeyGroup = false,
  fixedSize,
  itemsHaveBadges = false,
  isLoading: externalIsLoading = false,
  loadingMessage = 'Calculando la distribución...',
  className,
  cardColorScheme = 'primary',
  title = 'Visualización de Esferas',
  subtitle,
  emptyStateText = 'No hay ítems para mostrar.',
}: StandardSphereGridProps) => {
  // I. ARQUITECTURA "EL PADRE MIDE, EL HIJO OBEDECE"
  // Este componente ya no se mide a sí mismo. Recibe las dimensiones de su padre.

  const [currentSphereSizeVariant, setCurrentSphereSizeVariant] =
    useState<SphereSizeVariant>('2xl');
  const [effectiveOverflow, setEffectiveOverflow] = useState<'shrink' | 'scroll'>(
    'shrink'
  );
  const [calculatedCols, setCalculatedCols] = useState<number>(1);

  const isLoading = externalIsLoading || !containerWidth || !containerHeight;

  // Lógica de procesamiento de ítems (filtrado, ordenación)
  const processedItems = useMemo(() => {
    let filtered = items.filter(item => {
      if (!keyGroupVisibility || !item.keyGroup) return true;
      return keyGroupVisibility[item.keyGroup] !== false;
    });

    if (sortBy !== 'none') {
      const compareValues = (a: any, b: any) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'string' && typeof b === 'string')
          return a.localeCompare(b);
        return 0;
      };
      filtered.sort((a, b) => {
        let comparison = 0;
        if (groupByKeyGroup && a.keyGroup && b.keyGroup) {
          comparison = a.keyGroup.localeCompare(b.keyGroup);
        }
        if (comparison === 0) {
          if (sortBy === 'keyGroup' && a.keyGroup && b.keyGroup) {
            comparison = a.keyGroup.localeCompare(b.keyGroup);
          } else if (sortBy === 'value') {
            comparison = compareValues(a.value, b.value);
          }
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return filtered;
  }, [items, keyGroupVisibility, sortBy, sortDirection, groupByKeyGroup]);

  // Asignación de colores a los keyGroups
  const keyGroupColorMap = useMemo(() => {
    const uniqueKeyGroups = [
      ...new Set(processedItems.map(item => item.keyGroup).filter(Boolean)),
    ] as string[];
    const colorSchemes: ColorSchemeVariant[] = [
      'primary',
      'secondary',
      'tertiary',
      'accent',
      'neutral',
    ];
    const map: { [key: string]: ColorSchemeVariant } = {};
    uniqueKeyGroups.forEach((group, index) => {
      map[group] = colorSchemes[index % colorSchemes.length];
    });
    return map;
  }, [processedItems]);

  // II. LÓGICA DE CÁLCULO DE LAYOUT
  // Se dispara cuando cambia el tamaño del contenedor o los ítems.
  useEffect(() => {
    if (isLoading) return;

    const PADDING = 16; // p-4 = 1rem = 16px
    const availableWidth = containerWidth - PADDING * 2;
    const availableHeight = containerHeight - PADDING * 2;

    console.groupCollapsed(`[SphereGrid Brain] Recalculando Layout (${fixedSize ? 'Fijo' : 'Tetris'})`);
    console.log(`Entrada: ${processedItems.length} ítems`);
    console.log(`Medidas (WxH): ${containerWidth.toFixed(0)}x${containerHeight.toFixed(0)}px`);
    console.log(`Área Útil (WxH): ${availableWidth.toFixed(0)}x${availableHeight.toFixed(0)}px`);

    let finalSize: SphereSizeVariant;
    let finalCols: number;
    let finalOverflow: 'scroll' | 'shrink';

    if (fixedSize) {
      // Modo "Tamaño Fijo"
      const spherePx = SPHERE_SIZE_DEFINITIONS[fixedSize].px;
      const gap = SPHERE_GRID_GAP_TOKENS[fixedSize];
      const rowItemHeight = getSphereTotalHeight(fixedSize, !!itemsHaveBadges);
      const cols = Math.max(1, Math.floor((availableWidth + gap.col) / (spherePx + gap.col)));
      const rows = Math.ceil(processedItems.length / cols);
      const neededHeight = rows * (rowItemHeight + gap.row) - gap.row;

      finalSize = fixedSize;
      finalCols = cols;
      finalOverflow = neededHeight > availableHeight ? 'scroll' : 'shrink';

      console.log(`Modo Fijo ('${fixedSize}'):`);
      console.log(`  -> Columnas: ${finalCols}, Filas: ${rows}`);
      console.log(`  -> Altura Necesaria: ${neededHeight.toFixed(0)}px`);
      console.log(`%c -> Decisión: ${finalOverflow === 'scroll' ? 'Activar Scroll' : 'Cabe sin Scroll'}`, 'font-weight: bold;');

    } else {
      // Modo "Tetris" (auto-ajuste)
      const availableSizes = Object.keys(SPHERE_SIZE_DEFINITIONS).reverse() as SphereSizeVariant[];
      let bestFitInfo: { size: SphereSizeVariant; cols: number } = { size: 'xs', cols: 1 };
      let foundFit = false;

      for (const size of availableSizes) {
        const definition = SPHERE_SIZE_DEFINITIONS[size];
        const gap = SPHERE_GRID_GAP_TOKENS[size];
        const rowItemHeight = getSphereTotalHeight(size, itemsHaveBadges);

        const cols = Math.floor(
          (availableWidth + gap.col) / (definition.px + gap.col)
        );
        if (cols === 0) continue;

        const rows = Math.ceil(processedItems.length / cols);
        const neededHeight = rows * rowItemHeight + (rows - 1) * gap.row;

        console.log(`  -> Probando '${size}': [${rows} filas] * ([altura item: ${rowItemHeight}px] + [gap: ${gap.row}px]) = ${Math.round(neededHeight)}px necesarios vs. ${Math.round(availableHeight)}px disponibles`);

        if (neededHeight <= availableHeight) {
          bestFitInfo = { size, cols };
          foundFit = true;
          break;
        }
      }
      finalSize = bestFitInfo.size;
      finalCols = bestFitInfo.cols;
      finalOverflow = foundFit ? 'shrink' : 'scroll';
      
      const rows = Math.ceil(processedItems.length / finalCols);
      console.log(`Modo Tetris:`);
      console.log(` -> Mejor Tamaño Encontrado: '${finalSize}'`);
      console.log(` -> Columnas: ${finalCols}, Filas: ${rows}`);
      console.log(`%c -> Decisión: ${finalOverflow === 'scroll' ? 'Activar Scroll (fallback)' : 'Cabe sin Scroll'}`, 'font-weight: bold;');
    }
    
    console.groupEnd();

    setCurrentSphereSizeVariant(finalSize);
    setCalculatedCols(finalCols);
    setEffectiveOverflow(finalOverflow);

  }, [processedItems, containerWidth, containerHeight, fixedSize, itemsHaveBadges, isLoading]);

  // III. RENDERIZADO DEL CONTENIDO DE LA RETÍCULA
  const renderGridContent = useMemo(() => {
    if (processedItems.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <StandardText preset="body" size="md">
            {emptyStateText}
          </StandardText>
          {keyGroupVisibility && (
            <StandardText
              size="sm"
              colorScheme="neutral"
              colorShade="textShade"
              className="mt-2"
            >
              (Verifica los filtros de visibilidad)
            </StandardText>
          )}
        </div>
      );
    }

    const currentGap = SPHERE_GRID_GAP_TOKENS[currentSphereSizeVariant];
    const gridStyles: React.CSSProperties = {
      display: 'grid',
      gap: `${currentGap.row}px ${currentGap.col}px`,
      gridTemplateColumns: `repeat(${calculatedCols}, minmax(0, 1fr))`,
      justifyItems: 'center',
      alignItems: 'start',
    };

    return (
      <div className="p-4" style={gridStyles}>
        {processedItems.map(item => {
          const sphereColorScheme =
            item.colorScheme ||
            (item.keyGroup ? keyGroupColorMap[item.keyGroup] : 'primary');
          return (
            <StandardSphere
              key={item.id}
              {...item}
              size={currentSphereSizeVariant}
              colorScheme={sphereColorScheme}
              onClick={() => item.onClick?.(item.id)}
            />
          );
        })}
      </div>
    );
  }, [
    processedItems,
    emptyStateText,
    keyGroupVisibility,
    currentSphereSizeVariant,
    keyGroupColorMap,
    calculatedCols,
    isLoading,
  ]);

  // IV. ESTRUCTURA JSX FINAL
  return (
    <StandardCard
      animateEntrance
      colorScheme={cardColorScheme}
      accentPlacement="top"
      accentColorScheme={cardColorScheme}
      shadow="md"
      className={cn('relative flex flex-col h-full', className)}
      styleType="subtle"
      hasOutline={false}
    >
      <StandardCard.Header>
        <StandardText
          preset="subheading"
          weight="medium"
          colorScheme={cardColorScheme}
        >
          {title}
        </StandardText>
        {subtitle && (
          <StandardText
            size="sm"
            colorScheme="neutral"
            colorShade="textShade"
            className="mt-1"
          >
            {subtitle}
          </StandardText>
        )}
      </StandardCard.Header>
      <StandardCard.Content
        className={cn(
          'relative flex flex-col flex-grow overflow-hidden' // Contenedor de contenido
        )}
      >
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-background/20">
            <SustratoLoadingLogo
              size={48}
              text={loadingMessage || 'Esperando dimensiones...'}
              showText
            />
          </div>
        ) : (
          <div
            className={cn(
              'h-full w-full',
              effectiveOverflow === 'scroll' && 'overflow-y-auto'
            )}
          >
            {renderGridContent}
          </div>
        )}
      </StandardCard.Content>
    </StandardCard>
  );
};