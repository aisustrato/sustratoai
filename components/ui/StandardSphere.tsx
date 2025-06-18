'use client';

import React, { useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { 
  SphereStyleType, 
  SphereSizeVariant,
  generateSphereTokens,
  type SphereTokens
} from '@/lib/theme/components/standard-sphere-tokens';
import { StandardText } from './StandardText';
import { StandardBadge } from './StandardBadge';
import { StandardTooltip } from './StandardTooltip';

// Props para el componente StandardSphere
export interface StandardSphereProps {
  /**
   * Valor numérico a mostrar dentro de la esfera
   */
  value: number;
  
  /**
   * Esquema de color para la esfera
   * @default 'primary'
   */
  colorScheme?: ColorSchemeVariant;
  
  /**
   * Estilo visual de la esfera
   * @default 'filled'
   */
  styleType?: SphereStyleType;
  
  /**
   * Tamaño base de la esfera (se ajustará automáticamente según el contenedor)
   * @default 'md'
   */
  size?: SphereSizeVariant;
  
  /**
   * Texto que se mostrará en el tooltip al hacer hover
   */
  tooltip?: string;
  
  /**
   * Contenido para mostrar en un badge asociado a la esfera
   */
  badge?: React.ReactNode;
  
  /**
   * Esquema de color para el badge (si es distinto al de la esfera)
   */
  badgeColorScheme?: ColorSchemeVariant;
  
  /**
   * Evento al hacer clic en la esfera
   */
  onClick?: () => void;
  
  /**
   * Deshabilita las interacciones con la esfera
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
  
  /**
   * Cantidad total de esferas en el contenedor (para cálculo de tamaño)
   * Si no se especifica, se usará el valor base según la prop "size"
   */
  totalSpheres?: number;
  
  /**
   * ID para pruebas o accesibilidad
   */
  dataTestId?: string;
}

/**
 * StandardSphere - Componente para mostrar información numérica como esferas interactivas
 * con tamaño responsivo al espacio disponible.
 */
export const StandardSphere = ({
  value,
  colorScheme = 'primary',
  styleType = 'filled',
  size = 'md',
  tooltip,
  badge,
  badgeColorScheme,
  onClick,
  disabled = false,
  className,
  totalSpheres,
  dataTestId,
}: StandardSphereProps) => {
  const { appColorTokens, mode } = useTheme();
  const sphereRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // Si no hay tokens disponibles, no renderizar
  if (!appColorTokens) return null;
  
  // Generamos tokens usando la función del sistema
  const allSphereTokens = useMemo(() => {
    return generateSphereTokens(appColorTokens, mode);
  }, [appColorTokens, mode]);
  
  // Utilizamos los tokens para el colorScheme actual
  const tokens = useMemo(() => {
    // Asegurarse de que colorScheme es válido, si no, usar primary
    return allSphereTokens[colorScheme] || allSphereTokens.primary;
  }, [allSphereTokens, colorScheme]);
  
  // Seleccionamos los tokens del estilo específico (filled, subtle, outline)
  const styleTokens = tokens.styles[styleType];
  
  // Cálculo del tamaño dinámico basado en la cantidad de esferas
  const calculateSize = () => {
    if (!totalSpheres) return tokens.size[size];
    
    // Ajusta el tamaño según la cantidad de esferas
    // Más esferas = tamaño más pequeño, menos esferas = tamaño más grande
    const baseSize = parseInt(tokens.size[size].replace('rem', ''), 10);
    const scaleFactor = Math.max(0.7, 1 - (totalSpheres * 0.03)); // Disminuye hasta un 70% del tamaño
    
    return `${baseSize * scaleFactor}rem`;
  };
  
  // Estilos base para la esfera
  const sphereStyles = {
    width: calculateSize(),
    height: calculateSize(),
    backgroundColor: styleTokens.backgroundColor,
    color: styleTokens.foregroundColor,
    borderColor: styleTokens.borderColor,
    borderWidth: styleType === 'outline' ? '2px' : '0',
    borderStyle: 'solid',
    backgroundImage: styleType === 'filled' || styleType === 'subtle' ? styleTokens.gradient : 'none',
    transition: tokens.transition,
    cursor: onClick && !disabled ? 'pointer' : 'default',
    transform: isActive ? tokens.activeTransform : isHovered ? tokens.hoverTransform : 'none',
    opacity: disabled ? 0.6 : 1,
  };
  
  // Envolvemos todo el contenido incluyendo el badge en un contenedor con padding
  const sphereContent = (
    <div className={cn(
      "flex flex-col items-center relative",
      className
    )} style={{ 
      // Garantizar espacio para el badge
      paddingBottom: badge ? `${tokens.badge.size}` : '0', 
    }}>
      {/* La esfera propiamente dicha */}
      <div
        ref={sphereRef}
        className={cn(
          "flex items-center justify-center rounded-full overflow-hidden",
          disabled && "pointer-events-none"
        )}
        style={sphereStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsActive(false);
        }}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={!disabled ? onClick : undefined}
        data-test-id={dataTestId}
      >
        <StandardText 
          size={size === 'sm' ? 'sm' : size === 'md' ? 'base' : 'lg'}
          weight="medium"
        >
          {value}
        </StandardText>
      </div>
      
      {/* Badge fuera de la esfera pero dentro del contenedor principal */}
      {badge && (
        <div 
          className="absolute"
          style={{ 
            bottom: 0,
            transform: "translateY(50%)",
          }}
        >
          <StandardBadge
            size="sm"
            colorScheme={badgeColorScheme || colorScheme}
          >
            {badge}
          </StandardBadge>
        </div>
      )}
    </div>
  );
  
  // Si hay tooltip, envolver en el componente StandardTooltip
  if (tooltip) {
    return (
      <StandardTooltip trigger={sphereContent} styleType="solid" colorScheme={colorScheme}>
        {tooltip}
      </StandardTooltip>
    );
  }
  
  // Sin tooltip
  return sphereContent;
};

StandardSphere.displayName = "StandardSphere";
