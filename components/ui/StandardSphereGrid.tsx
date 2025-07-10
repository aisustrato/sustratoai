'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { StandardSphere, type SphereItemData } from './StandardSphere';
export type { SphereItemData };
import { StandardCard } from './StandardCard';
import { StandardText } from './StandardText';
import { SustratoLoadingLogo } from './sustrato-loading-logo';
import { MINIMUM_SPHERE_DIAMETER_FOR_BADGE } from '@/lib/theme/components/standard-sphere-tokens';

// #region [Constants & Types]
// -----------------------------------------------------------------------------
const MINIMUM_SPHERE_DIAMETER = 32;
const MAXIMUM_SPHERE_DIAMETER = 72;

type LayoutCalculationResult = {
  size: number;
  cols: number;
  cellHeight: number;
  overflow: 'shrink' | 'scroll';
};
// #endregion

// #region [Pure Calculation Function]
// -----------------------------------------------------------------------------
function calculateLayout(
  availableWidth: number,
  availableHeight: number,
  itemCount: number,
  cellMode: 'rectangular' | 'square',
  forceBadge: boolean,
): LayoutCalculationResult {
  const GAP = availableWidth > 600 ? 16 : 8;
  const RECTANGULAR_CELL_BADGE_SPACE = 32;

  const effectiveMinDiameter = forceBadge ? MINIMUM_SPHERE_DIAMETER_FOR_BADGE : MINIMUM_SPHERE_DIAMETER;

  let bestFit = {
    size: effectiveMinDiameter,
    cols: Math.max(1, Math.floor((availableWidth + GAP) / (effectiveMinDiameter + GAP))),
    overflow: 'scroll' as 'scroll' | 'shrink',
  };

  let low = effectiveMinDiameter;
  let high = MAXIMUM_SPHERE_DIAMETER;

  if (low > high) {
    console.warn(`Advertencia de Cálculo: El tamaño mínimo (${low}px) es mayor que el máximo (${high}px).`);
  } else {
    while (low <= high) {
      const midSize = (low + high) / 2;
      if (midSize <= 0) break;

      const colsForSize = Math.floor((availableWidth + GAP) / (midSize + GAP));
      if (colsForSize === 0) {
        high = midSize - 0.1;
        continue;
      }
      const rowsNeeded = Math.ceil(itemCount / colsForSize);
      
      const cellHeightForSize = cellMode === 'rectangular' ? midSize + RECTANGULAR_CELL_BADGE_SPACE : midSize;
      const totalHeightNeeded = rowsNeeded * (cellHeightForSize + GAP) - GAP;

      if (totalHeightNeeded <= availableHeight) {
        const realDiameter = (availableWidth - (GAP * (colsForSize - 1))) / colsForSize;
        bestFit = { size: realDiameter, cols: colsForSize, overflow: 'shrink' };
        low = midSize + 0.1;
      } else {
        high = midSize - 0.1;
      }
    }
  }

  const finalCellHeight = cellMode === 'rectangular' ? bestFit.size + RECTANGULAR_CELL_BADGE_SPACE : bestFit.size;

  return {
    size: bestFit.size,
    cols: bestFit.cols,
    cellHeight: finalCellHeight,
    overflow: bestFit.overflow,
  };
}
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
  forceBadge?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
  cardColorScheme?: ColorSchemeVariant;
  title?: string;
  subtitle?: string;
  emptyStateText?: string;
  horizontalSafetyMargin?: number;
  verticalSafetyMargin?: number;
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
  forceBadge = false,
  isLoading: externalIsLoading = false,
  loadingMessage = 'Calculando la distribución...',
  className,
  cardColorScheme = 'primary',
  title,
  subtitle,
  emptyStateText = 'No hay ítems para mostrar.',
  horizontalSafetyMargin,
  verticalSafetyMargin,
}: StandardSphereGridProps) => {

  const [calculatedSpherePx, setCalculatedSpherePx] = useState<number>(MINIMUM_SPHERE_DIAMETER);
  const [calculatedCellHeight, setCalculatedCellHeight] = useState<number>(0);
  const [allowBadgeRender, setAllowBadgeRender] = useState<boolean>(true);
  const [effectiveOverflow, setEffectiveOverflow] = useState<'shrink' | 'scroll'>('shrink');
  const [calculatedCols, setCalculatedCols] = useState<number>(1);
  
  const isLoading = externalIsLoading || !containerWidth || !containerHeight;

  const processedItems = useMemo(() => {
    const filtered = items.filter(item => {
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
  
  const hasAnyBadge = useMemo(() => processedItems.some(item => !!item.statusBadge), [processedItems]);

  // ✅ CORRECCIÓN: Se restaura la lógica que crea el mapa de colores.
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

    const hasHeader = title || subtitle;
    const finalHorizontalMargin = horizontalSafetyMargin ?? 20;
    const finalVerticalMargin = verticalSafetyMargin ?? (hasHeader ? 100 : 20);

    const PADDING = 16;
    const RECTANGULAR_CELL_BADGE_SPACE = 32;
    
    const availableWidth = containerWidth - PADDING * 2 - finalHorizontalMargin;
    const availableHeight = containerHeight - PADDING * 2 - finalVerticalMargin;
    
    let finalLayout: LayoutCalculationResult;
    let finalAllowBadgeRender: boolean;

    if (fixedSize) {
        const canShowBadgeAtFixedSize = hasAnyBadge && fixedSize >= MINIMUM_SPHERE_DIAMETER_FOR_BADGE;
        const cellMode = canShowBadgeAtFixedSize ? 'rectangular' : 'square';
        const tempLayout = calculateLayout(availableWidth, availableHeight, processedItems.length, cellMode, forceBadge);
        finalLayout = {
            size: fixedSize,
            cols: Math.max(1, Math.floor((availableWidth + (availableWidth > 600 ? 16 : 8)) / (fixedSize + (availableWidth > 600 ? 16 : 8)))),
            cellHeight: cellMode === 'rectangular' ? fixedSize + RECTANGULAR_CELL_BADGE_SPACE : fixedSize,
            overflow: tempLayout.overflow
        };
        finalAllowBadgeRender = canShowBadgeAtFixedSize;
    } else {
        const rectangularResult = calculateLayout(availableWidth, availableHeight, processedItems.length, 'rectangular', forceBadge);
        const squareResult = calculateLayout(availableWidth, availableHeight, processedItems.length, 'square', forceBadge);
        
        if (hasAnyBadge && rectangularResult.size < MINIMUM_SPHERE_DIAMETER_FOR_BADGE) {
          finalLayout = squareResult;
          finalAllowBadgeRender = false;
        } else if (hasAnyBadge) {
          finalLayout = rectangularResult;
          finalAllowBadgeRender = true;
        } else {
          finalLayout = squareResult;
          finalAllowBadgeRender = false;
        }
    }

    setCalculatedSpherePx(finalLayout.size);
    setCalculatedCellHeight(finalLayout.cellHeight);
    setCalculatedCols(finalLayout.cols);
    setEffectiveOverflow(finalLayout.overflow);
    setAllowBadgeRender(finalAllowBadgeRender);

  }, [processedItems, hasAnyBadge, containerWidth, containerHeight, fixedSize, forceBadge, isLoading, title, subtitle, horizontalSafetyMargin, verticalSafetyMargin]);
  
  const renderGridContent = useMemo(() => {
    if (processedItems.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <StandardText preset="body" size="md">{emptyStateText}</StandardText>
          {keyGroupVisibility && (
            <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="mt-1">
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
            key={item.id} {...item} sizeInPx={calculatedSpherePx} cellHeight={calculatedCellHeight} allowBadgeRender={allowBadgeRender}
            colorScheme={item.colorScheme || (keyGroupColorMap[item.keyGroup as string] || 'primary')}
            onClick={() => item.onClick?.(item.id)} isLogSpokesperson={index === 0}
          />
        ))}
      </div>
    );
  }, [processedItems, emptyStateText, isLoading, containerWidth, calculatedCols, calculatedSpherePx, calculatedCellHeight, allowBadgeRender, keyGroupColorMap]);

  return (
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
      {(title || subtitle) && (
        <StandardCard.Header>
          {title && (
            <StandardText preset="subheading" weight="medium" colorScheme={cardColorScheme}>
              {title}
            </StandardText>
          )}
          {subtitle && (
            <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="mt-1">
              {subtitle}
            </StandardText>
          )}
        </StandardCard.Header>
      )}
      <StandardCard.Content className='p-4'>
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
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