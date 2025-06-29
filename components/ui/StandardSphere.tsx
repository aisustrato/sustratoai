'use client';

import React, { useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import {
  type SphereSizeVariant,
  generateSphereTokens,
  type ImportedIconSize,
  SPHERE_SIZE_DEFINITIONS,
} from '@/lib/theme/components/standard-sphere-tokens';
import { StandardText, type StandardTextSize } from './StandardText';
import { StandardBadge, type StandardBadgeProps } from './StandardBadge';
import { StandardTooltip } from './StandardTooltip';
import { StandardIcon } from './StandardIcon';
import { type StandardBadgeSize, BADGE_PIXEL_HEIGHTS } from '@/lib/theme/components/standard-badge-tokens';


const SPHERE_TEXT_SIZE_MAP: Record<SphereSizeVariant, StandardTextSize> = {
  xs: 'xs',
  sm: 'sm',
  md: 'base',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
};

const SPHERE_ICON_SIZE_MAP: Record<SphereSizeVariant, ImportedIconSize> = {
  xs: 'xs',
  sm: 'sm',
  md: 'base',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
};

export interface StatusBadgeInfo {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  colorScheme?: ColorSchemeVariant;
  styleType?: StandardBadgeProps['styleType'];
}

export interface StandardSphereProps {
  value?: React.ReactNode;
  keyGroup?: string;
  colorScheme?: ColorSchemeVariant;
  styleType?: 'filled' | 'subtle' | 'outline';
  size?: SphereSizeVariant;
  tooltip?: string;
  statusBadge?: StatusBadgeInfo;
  icon?: React.ElementType<React.SVGProps<SVGSVGElement>>;
  onlyIcon?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  dataTestId?: string;
}

// 📌 REGLA 2: Actualizamos el mapeo de tamaño de Esfera a Badge.
export const getBadgeSizeForSphere = (sphereSize: SphereSizeVariant): StandardBadgeSize => {
    switch (sphereSize) {
        case '2xl':
        case 'xl':
            return 'sm';
        case 'lg':
            return 'xs';
        case 'md':
        default:
            return '2xs'; // El nuevo tamaño mínimo para la esfera 'md'
    }
};

const BADGE_TOP_PADDING = 8;
export const getSphereTotalHeight = (sphereSize: SphereSizeVariant, hasBadge: boolean): number => {
    const sphereHeight = SPHERE_SIZE_DEFINITIONS[sphereSize].px;
    // 📌 REGLA 1: Las esferas 'xs' y 'sm' NUNCA contribuyen con altura de badge.
    if (!hasBadge || sphereSize === 'xs' || sphereSize === 'sm') {
        return sphereHeight;
    }
    const proportionalBadgeSize = getBadgeSizeForSphere(sphereSize);
    const badgeHeight = BADGE_PIXEL_HEIGHTS[proportionalBadgeSize];
    return sphereHeight + BADGE_TOP_PADDING + badgeHeight;
};

export const StandardSphere = React.forwardRef<HTMLDivElement, StandardSphereProps>(
  ({
    value,
    keyGroup,
    colorScheme = 'primary',
    styleType = 'filled',
    size = 'md',
    tooltip,
    statusBadge,
    icon: IconComponent,
    onlyIcon = false,
    onClick,
    disabled = false,
    className,
    dataTestId,
  }, ref) => {
    const { appColorTokens, mode } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const allSphereTokens = useMemo(() => {
      if (!appColorTokens) return null;
      return generateSphereTokens(appColorTokens, mode);
    }, [appColorTokens, mode]);

    const tokens = useMemo(() => {
      if (!allSphereTokens) return null;
      return allSphereTokens[colorScheme] || allSphereTokens.primary;
    }, [allSphereTokens, colorScheme]);

    if (!tokens) {
      return null;
    }

    const styleTokens = tokens.styles[styleType];
    const baseSphereSize = tokens.size[size];
    const textFontSize = SPHERE_TEXT_SIZE_MAP[size];
    const iconDisplaySize = SPHERE_ICON_SIZE_MAP[size];
    const proportionalBadgeSize = getBadgeSizeForSphere(size);

    // 📌 REGLA 1: Determinamos si el badge debe ser visible según el tamaño de la esfera.
    const canShowBadge = statusBadge && size !== 'xs' && size !== 'sm';

    let sphereInnerContent: React.ReactNode = null;
    if (onlyIcon && IconComponent) {
      sphereInnerContent = <StandardIcon size={iconDisplaySize}><IconComponent /></StandardIcon>;
    } else if (value !== undefined && value !== null) {
      sphereInnerContent = <StandardText size={textFontSize} weight="medium" className="text-center">{value}</StandardText>;
    } else if (IconComponent) {
      sphereInnerContent = <StandardIcon size={iconDisplaySize}><IconComponent /></StandardIcon>;
    }

    const currentBgColor = isHovered && styleTokens.hoverBackgroundColor ? styleTokens.hoverBackgroundColor : styleTokens.backgroundColor;
    const currentFgColor = isHovered && styleTokens.hoverForegroundColor ? styleTokens.hoverForegroundColor : styleTokens.foregroundColor;
    const currentBorderColor = isActive && styleTokens.activeBorderColor ? styleTokens.activeBorderColor : styleTokens.borderColor;
    const hasActiveBorder = isActive && styleTokens.activeBorderColor;
    const currentGradient = isHovered ? 'none' : (styleType === 'filled' || styleType === 'subtle' ? styleTokens.gradient : 'none');

    const sphereCircleStyles: React.CSSProperties = {
      width: baseSphereSize,
      height: baseSphereSize,
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

    const sphereContainer = (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-start", className)}
        data-test-id={dataTestId}
      >
        <div
          className={cn("rounded-full overflow-hidden", disabled && "pointer-events-none")}
          style={sphereCircleStyles}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => { if (!disabled) { setIsHovered(false); setIsActive(false); } }}
          onMouseDown={() => !disabled && setIsActive(true)}
          onMouseUp={() => !disabled && setIsActive(false)}
          onClick={!disabled ? onClick : undefined}
        >
          {sphereInnerContent}
          {IconComponent && !onlyIcon && value !== undefined && value !== null && (
            <div className="absolute" style={{ bottom: '8%', transform: 'translateY(50%)' }}>
              <StandardIcon size={SPHERE_ICON_SIZE_MAP['xs']}><IconComponent /></StandardIcon>
            </div>
          )}
        </div>
        {canShowBadge && (
          <div className="pt-2">
            <StandardBadge
              size={proportionalBadgeSize}
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
        <StandardTooltip trigger={sphereContainer} styleType="solid" colorScheme={colorScheme}>
          {tooltip}
        </StandardTooltip>
      );
    }

    return sphereContainer;
  }
);

StandardSphere.displayName = "StandardSphere";