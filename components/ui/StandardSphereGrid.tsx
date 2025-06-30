'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { StandardSphere, type SphereItemData } from './StandardSphere';
import { StandardCard } from './StandardCard';
import { StandardText } from './StandardText';
import { SustratoLoadingLogo } from './sustrato-loading-logo';

// #region [Grid Configuration & Constants]
// -----------------------------------------------------------------------------
const MINIMUM_SPHERE_DIAMETER = 32;
const MAXIMUM_SPHERE_DIAMETER = 72;
// #endregion

// #region [Component Types]
// -----------------------------------------------------------------------------
export type SphereGridSortBy = 'value' | 'keyGroup' | 'none';
export type SphereGridSortDirection = 'asc' | 'desc';

export interface StandardSphereGridProps {
  containerWidth: number;
  containerHeight: number;
  items: SphereItemData[];
  keyGroupVisibility?: { [key: string]: boolean };
  sortBy?: SphereGridSortBy;
  sortDirection?: SphereGridSortDirection;
  groupByKeyGroup?: boolean;
  fixedSize?: number;
  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
  cardColorScheme?: ColorSchemeVariant;
  title?: string;
  subtitle?: string;
  emptyStateText?: string;
}
// #endregion

// #region [Component Implementation]
// -----------------------------------------------------------------------------
export const StandardSphereGrid = ({
  containerWidth,
  containerHeight,
  items,
  keyGroupVisibility,
  sortBy = 'none',
  sortDirection = 'asc',
  groupByKeyGroup = false,
  fixedSize,
  isLoading: externalIsLoading = false,
  loadingMessage = 'Calculando la distribución...',
  className,
  cardColorScheme = 'primary',
  title = 'Visualización de Esferas',
  subtitle,
  emptyStateText = 'No hay ítems para mostrar.',
}: StandardSphereGridProps) => {

  const [calculatedSpherePx, setCalculatedSpherePx] = useState<number>(MINIMUM_SPHERE_DIAMETER);
  const [effectiveOverflow, setEffectiveOverflow] = useState<'shrink' | 'scroll'>('shrink');
  const [calculatedCols, setCalculatedCols] = useState<number>(1);
  
  const isLoading = externalIsLoading || !containerWidth || !containerHeight;

  const processedItems = useMemo(() => {
    let filtered = items.filter(item => {
      if (!keyGroupVisibility || !item.keyGroup) return true;
      return keyGroupVisibility[item.keyGroup] !== false;
    });

    if (sortBy !== 'none') {
      const compareValues = (a: any, b: any) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
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

  const keyGroupColorMap = useMemo(() => {
    const uniqueKeyGroups = [
      ...new Set(processedItems.map(item => item.keyGroup).filter(Boolean)),
    ] as string[];
    const colorSchemes: ColorSchemeVariant[] = ['primary', 'secondary', 'tertiary', 'accent', 'neutral'];
    const map: { [key: string]: ColorSchemeVariant } = {};
    uniqueKeyGroups.forEach((group, index) => {
      map[group] = colorSchemes[index % colorSchemes.length];
    });
    return map;
  }, [processedItems]);

  useEffect(() => {
    if (isLoading || processedItems.length === 0) return;

    console.groupCollapsed(`[SphereGrid Brain 🧠 - Búsqueda por TAMAÑO DE CELDA RECTANGULAR]`);

    const HORIZONTAL_SAFETY_MARGIN = 20;
    const VERTICAL_SAFETY_MARGIN = 100;
    const PADDING = 16;
    const RECTANGULAR_CELL_BADGE_SPACE = 32;
    
    const availableWidth = containerWidth - PADDING * 2 - HORIZONTAL_SAFETY_MARGIN;
    const availableHeight = containerHeight - PADDING * 2 - VERTICAL_SAFETY_MARGIN;
    const GAP = availableWidth > 600 ? 16 : 8;

    console.log(`Contexto -> Área útil: ${availableWidth.toFixed(0)}x${availableHeight.toFixed(0)} | Items: ${processedItems.length} | Espacio Badge Asumido: ${RECTANGULAR_CELL_BADGE_SPACE}px`);

    let finalSizePx: number;
    let finalCols: number;
    let finalOverflow: 'scroll' | 'shrink';
    
    if (fixedSize) {
        console.log(`MODO: Tamaño Fijo`);
        finalSizePx = Math.max(MINIMUM_SPHERE_DIAMETER, Math.min(fixedSize, MAXIMUM_SPHERE_DIAMETER));
        finalCols = Math.max(1, Math.floor((availableWidth + GAP) / (finalSizePx + GAP)));
        const rows = Math.ceil(processedItems.length / finalCols);
        const neededHeight = rows * (finalSizePx + RECTANGULAR_CELL_BADGE_SPACE + GAP) - GAP;
        finalOverflow = neededHeight > availableHeight ? 'scroll' : 'shrink';
    } else {
        console.log(`MODO: Tetris Holístico (Búsqueda por Tamaño de Celda Rectangular)`);
        
        let bestFit = {
            size: MINIMUM_SPHERE_DIAMETER,
            cols: Math.max(1, Math.floor((availableWidth + GAP) / (MINIMUM_SPHERE_DIAMETER + GAP))),
            overflow: 'scroll' as 'scroll' | 'shrink'
        };

        let low = MINIMUM_SPHERE_DIAMETER;
        let high = MAXIMUM_SPHERE_DIAMETER;
        console.log(`Definiendo terreno de búsqueda -> Ancho de esfera: de ${low.toFixed(2)}px a ${high.toFixed(2)}px`);

        while (low <= high) {
            const midSize = (low + high) / 2;
            if (midSize <= 0) break;
            
            console.log(`-- Iteración: low=${low.toFixed(2)}, high=${high.toFixed(2)}. Probando ancho (G) = ${midSize.toFixed(2)}px.`);

            const colsForSize = Math.floor((availableWidth + GAP) / (midSize + GAP));
            if (colsForSize === 0) {
                high = midSize - 0.1;
                continue;
            }
            const rowsNeeded = Math.ceil(processedItems.length / colsForSize);
            const totalHeightNeeded = rowsNeeded * (midSize + RECTANGULAR_CELL_BADGE_SPACE + GAP) - GAP;
            
            console.log(`   -> Con ancho ${midSize.toFixed(2)}px, caben ${colsForSize} columnas. Necesitaríamos ${rowsNeeded} filas.`);
            console.log(`   -> Altura total necesaria (con Celdas Rectangulares): ${totalHeightNeeded.toFixed(2)}px vs. Disponible: ${availableHeight.toFixed(2)}px.`);

            if (totalHeightNeeded <= availableHeight) {
                console.log(`   ✅ CABE. Es una solución válida. Guardando y probando con tamaños MÁS GRANDES.`);
                const realDiameter = (availableWidth - (GAP * (colsForSize - 1))) / colsForSize;
                bestFit = { size: realDiameter, cols: colsForSize, overflow: 'shrink' };
                low = midSize + 0.1;
            } else {
                console.log(`   ❌ NO CABE. Se necesitan esferas MÁS PEQUEÑAS.`);
                high = midSize - 0.1;
            }
        }
        finalSizePx = bestFit.size;
        finalCols = bestFit.cols;
        finalOverflow = bestFit.overflow;
    }

    console.log('%c -> Decisión Final del Grid:', 'font-weight: bold; color: #4caf50;');
    console.log(`     Tamaño de Esfera (Ancho de Celda): ${finalSizePx.toFixed(2)}px`);
    console.log(`     Columnas: ${finalCols}`);
    console.log(`     Desbordamiento: '${finalOverflow}'`);
    console.groupEnd();

    setCalculatedSpherePx(finalSizePx);
    setCalculatedCols(finalCols);
    setEffectiveOverflow(finalOverflow);

  }, [processedItems, containerWidth, containerHeight, fixedSize]);
  
  const renderGridContent = useMemo(() => {
    if (processedItems.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <StandardText preset="body" size="md">{emptyStateText}</StandardText>
          {keyGroupVisibility && (
            <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="mt-2">
              (Verifica los filtros de visibilidad)
            </StandardText>
          )}
        </div>
      );
    }

    const gridStyles: React.CSSProperties = {
      display: 'grid',
      gap: `${containerWidth > 600 ? 16 : 8}px`,
      gridTemplateColumns: `repeat(${calculatedCols}, 1fr)`,
      justifyItems: 'center',
      alignItems: 'start',
    };

    return (
      <div style={gridStyles}>
        {processedItems.map((item, index) => (
          <StandardSphere
            key={item.id}
            {...item}
            sizeInPx={calculatedSpherePx}
            colorScheme={item.colorScheme || (item.keyGroup ? keyGroupColorMap[item.keyGroup] : 'primary')}
            onClick={() => item.onClick?.(item.id)}
            isLogSpokesperson={index === 0}
          />
        ))}
      </div>
    );
  }, [processedItems, emptyStateText, keyGroupVisibility, containerWidth, calculatedSpherePx, calculatedCols, keyGroupColorMap, isLoading]);

  return (
    // 📌 VICTORIA FINAL: Pasamos la decisión del cerebro a la nueva prop del StandardCard.
    // Esto resuelve el conflicto CSS y permite que el scroll funcione como se espera.
    <StandardCard
      animateEntrance
      colorScheme={cardColorScheme}
      accentPlacement="top"
      accentColorScheme={cardColorScheme}
      shadow="md"
      className={cn('flex flex-col h-full', className)}
      styleType="subtle"
      hasOutline={false}
      contentCanScroll={effectiveOverflow === 'scroll'}
    >
      <StandardCard.Header>
        <StandardText preset="subheading" weight="medium" colorScheme={cardColorScheme}>
          {title}
        </StandardText>
        {subtitle && (
          <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="mt-1">
            {subtitle}
          </StandardText>
        )}
      </StandardCard.Header>
      {/* 📌 SIMPLIFICACIÓN: Ya no necesitamos el div wrapper con lógica de scroll.
          StandardCard.Content, con su padding, es ahora el contenedor directo. */}
      <StandardCard.Content className='p-4'>
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-background/20">
            <SustratoLoadingLogo size={48} text={loadingMessage} showText />
          </div>
        ) : (
          renderGridContent
        )}
      </StandardCard.Content>
    </StandardCard>
  );
};
// #endregion