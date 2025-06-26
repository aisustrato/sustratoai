// StandardSphereGrid Componente v1.6 (Ajuste Fino de Tamaño y Scroll)

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import {
  StandardSphere,
  StandardSphereProps,
  StatusBadgeInfo
} from './StandardSphere';
import { SphereSizeVariant } from '@/lib/theme/components/standard-sphere-tokens';
import { StandardCard } from './StandardCard';
import { StandardText } from './StandardText';
import { SustratoLoadingLogo } from './sustrato-loading-logo';

// #region [Types]
export interface SphereItemData extends Omit<StandardSphereProps, 'size' | 'onClick' | 'className' | 'statusBadge'> {
  id: string; 
  onClick?: (id: string) => void; 
  className?: string; 
  statusBadge?: StatusBadgeInfo;
}

export type SphereGridSortBy = 'value' | 'keyGroup' | 'none';
export type SphereGridSortDirection = 'asc' | 'desc';
export type SphereGridOverflowHandling = 'scroll' | 'shrink' | 'wrap';

export interface StandardSphereGridProps {
  items: SphereItemData[];
  keyGroupVisibility?: { [keyGroup: string]: boolean; };
  sortBy?: SphereGridSortBy;
  sortDirection?: SphereGridSortDirection;
  groupByKeyGroup?: boolean;
  maxRows?: number;
  maxCols?: number;
  overflowHandling?: SphereGridOverflowHandling;
  
  /**
   * La anchura del contenedor disponible para el grid, en píxeles.
   * El componente padre es responsable de medir y proveer este valor.
   */
  containerWidth: number;

  /**
   * La altura del contenedor disponible para el grid, en píxeles.
   * El componente padre es responsable de medir y proveer este valor.
   */
  containerHeight: number;

  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
  cardColorScheme?: ColorSchemeVariant;
  title?: string;
  subtitle?: string;
  emptyStateText?: string;
}
// #endregion

// #region [Constants]
const SPHERE_PIXEL_SIZES: Record<SphereSizeVariant, number> = {
  xs: 32, sm: 40, md: 48, lg: 56, xl: 64, '2xl': 72,
};
const SPHERE_COL_GAP_PX = 16; // 1rem
const SPHERE_ROW_GAP_PX = 32; // 2rem
// #endregion

export const StandardSphereGrid = ({
  items,
  keyGroupVisibility,
  sortBy = 'none',
  sortDirection = 'asc',
  groupByKeyGroup = false,
  maxRows,
  maxCols,
  overflowHandling = 'shrink',
  containerWidth,
  containerHeight,
  isLoading = false,
  loadingMessage = "Calculando la distribución óptima...",
  className,
  cardColorScheme = 'primary',
  title = "Visualización de Esferas",
  subtitle,
  emptyStateText = "No hay ítems para mostrar en este momento.",
}: StandardSphereGridProps) => {
  const { appColorTokens, mode } = useTheme();
  const [currentSphereSizeVariant, setCurrentSphereSizeVariant] = useState<SphereSizeVariant>('2xl');
  const [effectiveOverflow, setEffectiveOverflow] = useState(overflowHandling);

  const processedItems = useMemo(() => {
    let filtered = items.filter(item => {
      if (!keyGroupVisibility) return true;
      if (!item.keyGroup) return true;
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
    const uniqueKeyGroups = [...new Set(processedItems.map(item => item.keyGroup).filter(Boolean))] as string[];
    const colorSchemes: ColorSchemeVariant[] = ['secondary', 'tertiary', 'success', 'warning', 'danger', 'accent'];
    const map: { [key: string]: ColorSchemeVariant } = {};
    uniqueKeyGroups.forEach((group, index) => {
      map[group] = colorSchemes[index % colorSchemes.length];
    });
    return map;
  }, [processedItems]);

  useEffect(() => {
    console.log(`[SphereGrid Logic] useEffect triggered. Prop: ${overflowHandling}, H: ${containerHeight}, W: ${containerWidth}, Items: ${processedItems.length}`);
    setEffectiveOverflow(overflowHandling);

    if (overflowHandling === 'scroll') {
      setCurrentSphereSizeVariant('2xl');
      return;
    }

    if (overflowHandling === 'shrink') {
      if (!containerWidth || !containerHeight || processedItems.length === 0) {
        setCurrentSphereSizeVariant('2xl');
        return;
      }
      console.log('[SphereGrid Logic] Entering SHRINK calculation...');

      const availableSizes: SphereSizeVariant[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
      let bestFit: SphereSizeVariant = 'sm';
      let foundFit = false;

      // El contenedor tiene un padding de p-4 (1rem = 16px), por lo que restamos 32px a la anchura disponible.
      const availableWidth = containerWidth - (16 * 2);

      for (const size of availableSizes) {
        const spherePx = SPHERE_PIXEL_SIZES[size];
        
        const cols = Math.floor((availableWidth + SPHERE_COL_GAP_PX) / (spherePx + SPHERE_COL_GAP_PX));
        if (cols === 0) continue;

        const rows = Math.ceil(processedItems.length / cols);
        const neededHeight = rows * (spherePx + SPHERE_ROW_GAP_PX) - SPHERE_ROW_GAP_PX;
        
        console.log(` -> Trying size [${size}]: ${cols} cols, ${rows} rows. Needs ${neededHeight.toFixed(2)}px H. Available: ${containerHeight.toFixed(2)}px.`);

        if (neededHeight <= containerHeight) {
          console.log(` -> [${size}] SUCCEEDS. This is the best fit.`);
          bestFit = size;
          foundFit = true;
          break;
        }
      }
      
      setCurrentSphereSizeVariant(bestFit);

      if (!foundFit) {
        console.log('[SphereGrid Logic] Shrink failed for all sizes. Forcing scroll mode.');
        setEffectiveOverflow('scroll');
        setCurrentSphereSizeVariant('md'); // Usar un tamaño razonable para el modo scroll
      }
    }
  }, [processedItems, containerWidth, containerHeight, overflowHandling]);

  const renderGridContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <SustratoLoadingLogo size={48} text={loadingMessage} showText={!!loadingMessage} />
        </div>
      );
    }

    if (processedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[150px] p-4 text-center">
          <StandardText preset="body" size="md" colorScheme="neutral" colorShade="text" weight="medium">
            {emptyStateText}
          </StandardText>
          {keyGroupVisibility && (
            <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="mt-2">
              (Verifica los filtros de visibilidad de los grupos si aplica)
            </StandardText>
          )}
        </div>
      );
    }

    const spherePxSize = SPHERE_PIXEL_SIZES[currentSphereSizeVariant];
    const gridStyles: React.CSSProperties = {
      display: 'grid',
      gap: `${SPHERE_ROW_GAP_PX}px ${SPHERE_COL_GAP_PX}px`,
      gridTemplateColumns: `repeat(auto-fit, minmax(${spherePxSize}px, 1fr))`,
      justifyItems: 'center',
      alignItems: 'center',
    };

    return (
      <div className={cn("w-full h-full p-4")} style={gridStyles}>
        {processedItems.map(item => {
          const sphereColorScheme = item.colorScheme || (item.keyGroup ? keyGroupColorMap[item.keyGroup] : 'neutral');
          return (
            <StandardSphere
              key={item.id}
              value={
                <div className="flex flex-col items-center justify-center">
                  <StandardText>{item.value}</StandardText>
                  <StandardText size="xs" colorScheme="neutral" colorShade="textShade">({currentSphereSizeVariant})</StandardText>
                </div>
              }
              keyGroup={item.keyGroup}
              colorScheme={sphereColorScheme}
              styleType={item.styleType}
              size={currentSphereSizeVariant}
              tooltip={item.tooltip ? `${item.tooltip} (Size: ${currentSphereSizeVariant})` : `Size: ${currentSphereSizeVariant}`}
              statusBadge={item.statusBadge}
              icon={item.icon}
              onlyIcon={item.onlyIcon}
              onClick={() => item.onClick?.(item.id)}
              disabled={item.disabled}
              className={item.className}
              dataTestId={item.dataTestId}
            />
          );
        })}
      </div>
    );
  }, [isLoading, processedItems, emptyStateText, keyGroupVisibility, currentSphereSizeVariant, keyGroupColorMap, loadingMessage]);

  return (
    <StandardCard
      animateEntrance
      colorScheme={cardColorScheme}
      accentPlacement="top"
      accentColorScheme={cardColorScheme}
      shadow="md"
      className={cn("relative flex flex-col h-full overflow-hidden", className)}
      styleType="subtle"
      hasOutline={false}
    >
      <StandardCard.Header>
        <StandardText preset="subheading" weight="medium" colorScheme={cardColorScheme}>{title}</StandardText>
        {subtitle && <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="mt-1">{subtitle}</StandardText>}
      </StandardCard.Header>
      <StandardCard.Content 
        className={cn(
          "relative flex-grow flex !items-stretch p-0 min-h-0",
          effectiveOverflow === 'scroll' && 'overflow-y-auto',
          effectiveOverflow === 'shrink' && 'overflow-hidden'
        )}>
        {renderGridContent}
      </StandardCard.Content>
    </StandardCard>
  );
};
