'use client';

import React, { useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import {
  generateSphereTokens,
  type ImportedIconSize,
} from '@/lib/theme/components/standard-sphere-tokens';
import {
  type StandardBadgeSize,
  BADGE_PIXEL_HEIGHTS,
} from '@/lib/theme/components/standard-badge-tokens';
import { StandardText, type StandardTextSize } from './StandardText';
import { StandardBadge, type StandardBadgeProps } from './StandardBadge';
import { StandardTooltip } from './StandardTooltip';
import { StandardIcon } from './StandardIcon';

// #region [Constants & Brain]
// -----------------------------------------------------------------------------
const RECTANGULAR_CELL_BADGE_SPACE = 24;
const MINIMUM_DIAMETER_FOR_BADGE = 48;

const useSphereConsciousness = (
  sphereDiameter: number,
  wantsBadge: boolean,
) => {
  return useMemo(() => {
    const canShowBadge = wantsBadge && sphereDiameter >= MINIMUM_DIAMETER_FOR_BADGE;

    let textSemanticSize: StandardTextSize = '2xs';
    let iconSemanticSize: ImportedIconSize = '2xs';

    if (sphereDiameter > 96) {
      textSemanticSize = '2xl'; iconSemanticSize = '2xl';
    } else if (sphereDiameter > 80) {
      textSemanticSize = 'xl'; iconSemanticSize = 'xl';
    } else if (sphereDiameter > 64) {
      textSemanticSize = 'lg'; iconSemanticSize = 'lg';
    } else if (sphereDiameter > 48) {
      textSemanticSize = 'base'; iconSemanticSize = 'md';
    } else if (sphereDiameter > 40) {
      textSemanticSize = 'sm'; iconSemanticSize = 'sm';
    } else if (sphereDiameter > 32) {
      textSemanticSize = 'xs'; iconSemanticSize = 'xs';
    }
    
    let badgeSemanticSize: StandardBadgeSize = '2xs';
    if (sphereDiameter > 64) {
      badgeSemanticSize = 'sm';
    } else if (sphereDiameter > 48) {
      badgeSemanticSize = 'xs';
    }

    return {
      finalSphereDiameter: sphereDiameter,
      canShowBadge,
      textSemanticSize,
      iconSemanticSize,
      badgeSemanticSize,
    };
  }, [sphereDiameter, wantsBadge]);
};
// #endregion

// #region [Component Types]
// -----------------------------------------------------------------------------
export interface StatusBadgeInfo {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  colorScheme?: ColorSchemeVariant;
  styleType?: StandardBadgeProps['styleType'];
}

export interface StandardSphereProps {
  sizeInPx: number;
  value?: React.ReactNode;
  keyGroup?: string;
  colorScheme?: ColorSchemeVariant;
  styleType?: 'filled' | 'subtle' | 'outline';
  tooltip?: string;
  statusBadge?: StatusBadgeInfo;
  icon?: React.ElementType<React.SVGProps<SVGSVGElement>>;
  onlyIcon?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  dataTestId?: string;
  isLogSpokesperson?: boolean;
}

export interface SphereItemData
  extends Omit<
    StandardSphereProps,
    'sizeInPx' | 'onClick' | 'className' | 'statusBadge' | 'isLogSpokesperson'
  > {
  id: string;
  onClick?: (id: string) => void;
  className?: string;
  statusBadge?: StatusBadgeInfo;
}
// #endregion

// #region [Component Implementation]
// -----------------------------------------------------------------------------
export const StandardSphere = React.forwardRef<
  HTMLDivElement,
  StandardSphereProps
>(
  (
    {
      sizeInPx,
      value,
      keyGroup,
      colorScheme = 'primary',
      styleType = 'filled',
      tooltip,
      statusBadge,
      icon: IconComponent,
      onlyIcon = false,
      onClick,
      disabled = false,
      className,
      dataTestId,
      isLogSpokesperson = false,
    },
    ref,
  ) => {
    const decisions = useSphereConsciousness(sizeInPx, !!statusBadge);

    // 📌 LÓGICA DE LA ESFERA PORTAVOZ
    useEffect(() => {
        if (isLogSpokesperson) {
            console.groupCollapsed(`[Esfera Portavoz 🗣️] Proceso de Decisión del Inquilino`);
            console.log(`Recibido del Grid -> Ancho de Celda (sizeInPx): ${sizeInPx.toFixed(2)}px`);
            console.log(`Espacio para Badge Asumido por el Grid: ${RECTANGULAR_CELL_BADGE_SPACE}px`);
            console.log(`Altura total de mi celda: ${(sizeInPx + RECTANGULAR_CELL_BADGE_SPACE).toFixed(2)}px`);
            console.log(`¿Quiero un badge?: ${!!statusBadge}`);
            console.log(`Mi diámetro es de ${decisions.finalSphereDiameter.toFixed(2)}px. ¿Puedo mostrar el badge? -> ${decisions.canShowBadge ? 'Sí' : 'No'}`);
            console.log(`Decisiones de tamaño para mis hijos:`);
            console.log(`   -> StandardText: '${decisions.textSemanticSize}'`);
            console.log(`   -> StandardIcon: '${decisions.iconSemanticSize}'`);
            if(decisions.canShowBadge) {
                console.log(`   -> StandardBadge: '${decisions.badgeSemanticSize}'`);
            }
            console.groupEnd();
        }
    }, [isLogSpokesperson, sizeInPx, decisions]);


    const { appColorTokens, mode } = useTheme();
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);

    const allSphereTokens = useMemo(() => {
        if (!appColorTokens) return null;
        return generateSphereTokens(appColorTokens, mode);
    }, [appColorTokens, mode]);
    const tokens = useMemo(() => {
        if (!allSphereTokens) return null;
        return allSphereTokens[colorScheme] || allSphereTokens.primary;
    }, [allSphereTokens, colorScheme]);
    if (!tokens) return null;

    const styleTokens = tokens.styles[styleType];
    const currentBgColor = isHovered && styleTokens.hoverBackgroundColor ? styleTokens.hoverBackgroundColor : styleTokens.backgroundColor;
    const currentFgColor = isHovered && styleTokens.hoverForegroundColor ? styleTokens.hoverForegroundColor : styleTokens.foregroundColor;
    const currentBorderColor = isActive && styleTokens.activeBorderColor ? styleTokens.activeBorderColor : styleTokens.borderColor;
    const hasActiveBorder = isActive && styleTokens.activeBorderColor;
    const currentGradient = isHovered ? 'none' : (styleType === 'filled' || styleType === 'subtle' ? styleTokens.gradient : 'none');


    const sphereCircleStyles: React.CSSProperties = {
      width: `${decisions.finalSphereDiameter}px`,
      height: `${decisions.finalSphereDiameter}px`,
      backgroundColor: currentBgColor,
      color: currentFgColor,
      borderColor: currentBorderColor,
      borderWidth: styleType === 'outline' || hasActiveBorder ? '2px' : '0',
      borderStyle: 'solid',
      backgroundImage: currentGradient,
      transition: tokens.transition,
      cursor: onClick && !disabled ? 'pointer' : 'default',
      transform: isActive ? tokens.activeTransform : isHovered ? tokens.hoverTransform : 'none',
      opacity: disabled ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'relative',
    };
    
    let sphereInnerContent: React.ReactNode = null;
    if (onlyIcon && IconComponent) {
        sphereInnerContent = <StandardIcon size={decisions.iconSemanticSize}><IconComponent /></StandardIcon>;
    } else if (value !== undefined && value !== null) {
        sphereInnerContent = <StandardText size={decisions.textSemanticSize} weight="medium" className="text-center">{value}</StandardText>;
    } else if (IconComponent) {
        sphereInnerContent = <StandardIcon size={decisions.iconSemanticSize}><IconComponent /></StandardIcon>;
    }

    const sphereContainerStyles: React.CSSProperties = {
        height: `${sizeInPx + RECTANGULAR_CELL_BADGE_SPACE}px`,
    };

    const sphereContainer = (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center w-full', className)}
        style={sphereContainerStyles}
        data-test-id={dataTestId}
      >
        <div
          className={cn(
            'rounded-full overflow-hidden',
            disabled && 'pointer-events-none',
          )}
          style={sphereCircleStyles}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => {
            if (!disabled) { setIsHovered(false); setIsActive(false); }
          }}
          onMouseDown={() => !disabled && setIsActive(true)}
          onMouseUp={() => !disabled && setIsActive(false)}
          onClick={!disabled ? onClick : undefined}
        >
          {sphereInnerContent}
        </div>
        {decisions.canShowBadge && statusBadge && (
          <div className="pt-0.5">
            <StandardBadge
            
              size={decisions.badgeSemanticSize}
              colorScheme={statusBadge.colorScheme || 'primary'}
              styleType={statusBadge.styleType || 'subtle'}
              leftIcon={statusBadge.icon}
              iconClassName={statusBadge.iconClassName}
            >
              {statusBadge.text}
            </StandardBadge>
          </div>
        )}
      </div>
    );

    if (tooltip) {
      return (
        <StandardTooltip
          trigger={sphereContainer}
          styleType="solid"
          colorScheme={colorScheme}
        >
          {tooltip}
        </StandardTooltip>
      );
    }

    return sphereContainer;
  },
);

StandardSphere.displayName = 'StandardSphere';
// #endregion