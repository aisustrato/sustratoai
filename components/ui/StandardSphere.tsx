'use client';

import React, { useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant, type ColorShadeName } from '@/lib/theme/ColorToken';
import {
  generateSphereTokens,
  type ImportedIconSize,
  MINIMUM_SPHERE_DIAMETER_FOR_BADGE,
} from '@/lib/theme/components/standard-sphere-tokens';
import {
  type StandardBadgeSize,
} from '@/lib/theme/components/standard-badge-tokens';
import { StandardText, type StandardTextSize } from './StandardText';
import { StandardBadge, type StandardBadgeProps } from './StandardBadge';
import { StandardTooltip } from './StandardTooltip';
import { StandardIcon, type StandardIconColorShade } from './StandardIcon';

// #region [Constants & Brain]
// -----------------------------------------------------------------------------
const RECTANGULAR_CELL_BADGE_SPACE = 24;

const useSphereConsciousness = (
  sphereDiameter: number,
  wantsBadge: boolean,
  allowBadgeRender: boolean,
) => {
  return useMemo(() => {
    const canShowBadge = allowBadgeRender && wantsBadge && sphereDiameter >= MINIMUM_SPHERE_DIAMETER_FOR_BADGE;

    let textSemanticSize: StandardTextSize = '2xs';
    let iconSemanticSize: ImportedIconSize = '2xs';
    let emojiSemanticSize: StandardTextSize = 'sm';

    if (sphereDiameter > 96) {
      textSemanticSize = '2xl'; iconSemanticSize = '2xl'; emojiSemanticSize = '4xl';
    } else if (sphereDiameter > 80) {
      textSemanticSize = 'xl'; iconSemanticSize = 'xl'; emojiSemanticSize = '3xl';
    } else if (sphereDiameter > 64) {
      textSemanticSize = 'lg'; iconSemanticSize = 'lg'; emojiSemanticSize = '2xl';
    } else if (sphereDiameter > 48) {
      textSemanticSize = 'base'; iconSemanticSize = 'md'; emojiSemanticSize = 'xl';
    } else if (sphereDiameter > 40) {
      textSemanticSize = 'sm'; iconSemanticSize = 'sm'; emojiSemanticSize = 'lg';
    } else if (sphereDiameter > 32) {
      textSemanticSize = 'xs'; iconSemanticSize = 'xs'; emojiSemanticSize = 'base';
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
      emojiSemanticSize,
      badgeSemanticSize,
    };
  }, [sphereDiameter, wantsBadge, allowBadgeRender]);
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
  cellHeight?: number;
  allowBadgeRender?: boolean;
  value?: React.ReactNode;
  keyGroup?: string;
  colorScheme?: ColorSchemeVariant;
  styleType?: 'filled' | 'subtle' | 'outline';
  tooltip?: string;
  statusBadge?: StatusBadgeInfo;
  icon?: React.ElementType<React.SVGProps<SVGSVGElement>>;
  onlyIcon?: boolean;
  emoticon?: string;
  onlyEmoticon?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  dataTestId?: string;
  isLogSpokesperson?: boolean;
}

export interface SphereItemData
  extends Omit<
    StandardSphereProps,
    'sizeInPx' | 'cellHeight' | 'allowBadgeRender' | 'onClick' | 'className' | 'statusBadge' | 'isLogSpokesperson'
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
      cellHeight,
      allowBadgeRender = true,
      value,
      keyGroup,
      colorScheme = 'primary',
      styleType = 'filled',
      tooltip,
      statusBadge,
      icon: IconComponent,
      onlyIcon = false,
      emoticon,
      onlyEmoticon = false,
      onClick,
      disabled = false,
      className,
      dataTestId,
      isLogSpokesperson = false,
    },
    ref,
  ) => {
    if (IconComponent && emoticon) {
      throw new Error("StandardSphere Error: No se pueden usar las props 'icon' y 'emoticon' simultáneamente.");
    }

    const decisions = useSphereConsciousness(sizeInPx, !!statusBadge, allowBadgeRender);

    useEffect(() => {
        if (isLogSpokesperson) {
            console.groupCollapsed(`[Esfera Portavoz 🗣️] Proceso de Decisión del Inquilino`);
            console.log(`Recibido del Grid -> Ancho de Celda (sizeInPx): ${sizeInPx.toFixed(2)}px`);
            console.log(`Recibido del Grid -> Altura de Celda (cellHeight): ${cellHeight ? cellHeight.toFixed(2) + 'px' : '(No especificada)'}`);
            console.log(`Recibido del Grid -> Permiso para Badge (allowBadgeRender): ${allowBadgeRender}`);
            console.log(`¿Quiero un badge?: ${!!statusBadge}`);
            console.log(`Mi diámetro es de ${decisions.finalSphereDiameter.toFixed(2)}px. ¿Puedo mostrar el badge? -> ${decisions.canShowBadge ? 'Sí' : 'No'}`);
            console.log(`Decisiones de tamaño para mis hijos:`);
            console.log(`   -> StandardText: '${decisions.textSemanticSize}'`);
            console.log(`   -> StandardIcon: '${decisions.iconSemanticSize}'`);
            console.log(`   -> Emoticon: '${decisions.emojiSemanticSize}'`);
            if(decisions.canShowBadge) {
                console.log(`   -> StandardBadge: '${decisions.badgeSemanticSize}'`);
            }
            console.groupEnd();
        }
    }, [isLogSpokesperson, sizeInPx, cellHeight, allowBadgeRender, decisions, statusBadge]);


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
    const currentGradient = isHovered ? 'none' : (styleTokens.gradient || 'none');
    
    let iconColorShade: StandardIconColorShade = 'contrastText';
    if (styleType === 'subtle') {
        iconColorShade = 'textShade';
    } else if (styleType === 'outline') {
        iconColorShade = 'pure';
    }

    const sphereCircleStyles: React.CSSProperties = {
      width: `${decisions.finalSphereDiameter}px`,
      height: `${decisions.finalSphereDiameter}px`,
      backgroundColor: currentBgColor,
      backgroundImage: currentGradient,
      color: currentFgColor,
      borderColor: currentBorderColor,
      // ✅ LÓGICA DE BORDE MEJORADA: Se muestra un borde de 1px para 'subtle' y 'outline'
      borderWidth: styleType === 'outline' || styleType === 'subtle' || hasActiveBorder ? '1px' : '0',
      borderStyle: 'solid',
      transition: tokens.transition,
      cursor: onClick && !disabled ? 'pointer' : 'default',
      transform: isActive ? tokens.activeTransform : isHovered ? tokens.hoverTransform : 'none',
      opacity: disabled ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'relative',
      lineHeight: 1,
    };
    
    let sphereInnerContent: React.ReactNode = null;
    if (onlyIcon && IconComponent) {
        sphereInnerContent = <StandardIcon size={decisions.iconSemanticSize} colorScheme={colorScheme} colorShade={iconColorShade}><IconComponent /></StandardIcon>;
    } else if (onlyEmoticon && emoticon) {
        sphereInnerContent = <StandardText size={decisions.emojiSemanticSize}>{emoticon}</StandardText>;
    } else if (value && IconComponent) {
        sphereInnerContent = (
            <>
                <StandardText size={decisions.textSemanticSize} weight="medium" className="text-center -mb-0.5">{value}</StandardText>
                <div className="mt-1"><StandardIcon size="2xs" colorScheme={colorScheme} colorShade={iconColorShade}><IconComponent /></StandardIcon></div>
            </>
        );
    } else if (value && emoticon) {
        sphereInnerContent = (
            <>
                <StandardText size={decisions.textSemanticSize} weight="medium" className="text-center -mb-0.5">{value}</StandardText>
                <StandardText size="sm">{emoticon}</StandardText>
            </>
        );
    } else if (value) {
        sphereInnerContent = <StandardText size={decisions.textSemanticSize} weight="medium" className="text-center">{value}</StandardText>;
    } else if (IconComponent) {
        sphereInnerContent = <StandardIcon size={decisions.iconSemanticSize} colorScheme={colorScheme} colorShade={iconColorShade}><IconComponent /></StandardIcon>;
    } else if (emoticon) {
        sphereInnerContent = <StandardText size={decisions.emojiSemanticSize}>{emoticon}</StandardText>;
    }


    const sphereContainerStyles: React.CSSProperties = {
        height: `${cellHeight ?? sizeInPx + RECTANGULAR_CELL_BADGE_SPACE}px`,
    };

    const sphereContainer = (
      <div ref={ref} className={cn('flex flex-col items-center justify-center w-full', className)} style={sphereContainerStyles} data-test-id={dataTestId} >
        <div className={cn('rounded-full overflow-hidden', disabled && 'pointer-events-none')} style={sphereCircleStyles} onMouseEnter={() => !disabled && setIsHovered(true)} onMouseLeave={() => { if (!disabled) { setIsHovered(false); setIsActive(false); } }} onMouseDown={() => !disabled && setIsActive(true)} onMouseUp={() => !disabled && setIsActive(false)} onClick={!disabled ? onClick : undefined} >
          {sphereInnerContent}
        </div>
        {decisions.canShowBadge && statusBadge && (
          <div className="pt-0.5">
            <StandardBadge size={decisions.badgeSemanticSize} colorScheme={statusBadge.colorScheme || 'primary'} styleType={statusBadge.styleType || 'subtle'} leftIcon={statusBadge.icon} iconClassName={statusBadge.iconClassName} >
              {statusBadge.text}
            </StandardBadge>
          </div>
        )}
      </div>
    );

    if (tooltip) {
      return ( <StandardTooltip trigger={sphereContainer} styleType="solid" colorScheme={colorScheme} >{tooltip}</StandardTooltip> );
    }

    return sphereContainer;
  },
);

StandardSphere.displayName = 'StandardSphere';
// #endregion