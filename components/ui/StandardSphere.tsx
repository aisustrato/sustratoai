'use client';

import React, { useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import {
  SphereStyleType,
  SphereSizeVariant,
  generateSphereTokens,
  ImportedIconSize // Importamos el tipo de tamaño de icono desde los tokens
} from '@/lib/theme/components/standard-sphere-tokens';
import { StandardText, type StandardTextSize } from './StandardText';
import { StandardBadge } from './StandardBadge';
import { StandardTooltip } from './StandardTooltip';
import { StandardIcon } from './StandardIcon'; // Asumiendo que existe StandardIcon

// Mapeos para asegurar coherencia en tamaño entre StandardSphere y sus componentes internos
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

// Props para el componente StandardSphere
export interface StandardSphereProps {
  /**
   * Valor a mostrar dentro de la esfera. Puede ser un número, texto, o cualquier ReactNode.
   */
  value?: React.ReactNode;

  /**
   * Identificador para agrupar o clasificar la esfera (e.g., ID de investigador, estado).
   * La esfera lo almacena como dato, pero su interpretación para ordenamiento/filtrado recae en el contenedor.
   */
  keyGroup?: string;

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
   * Tamaño de la esfera, alineado con la jerga de tamaños de otros componentes Standard.
   * El orquestador calculará y pasará el tamaño apropiado (ej. 'md').
   * @default 'md'
   */
  size?: SphereSizeVariant;

  /**
   * Texto que se mostrará en el tooltip al hacer hover
   */
  tooltip?: string;

  /**
   * Contenido para mostrar en un badge asociado a la esfera.
   * Se posicionará en la parte inferior de la esfera.
   */
  badge?: React.ReactNode;

  /**
   * Esquema de color para el badge (si es distinto al de la esfera)
   */
  badgeColorScheme?: ColorSchemeVariant;

  /**
   * Icono para mostrar dentro de la esfera. Se espera un componente de icono (e.g., de Lucide React).
   * Se renderizará en una posición secundaria (e.g., debajo del value) a menos que `onlyIcon` sea true.
   */
  icon?: React.ElementType<React.SVGProps<SVGSVGElement>>; // CAMBIO: Ahora espera un componente de icono

  /**
   * Si es true, el 'icon' será el elemento principal y central de la esfera,
   * ocultando el 'value' si está presente y escalando el icono para ser protagonista.
   * Requiere que la prop 'icon' sea proporcionada.
   * @default false
   */
  onlyIcon?: boolean;

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
   * Clases CSS adicionales para el contenedor principal de la esfera.
   */
  className?: string;

  /**
   * ID para pruebas o accesibilidad
   */
  dataTestId?: string;
}

/**
 * StandardSphere - Componente para mostrar información visual como "lotus" interactivos
 * con tamaño gestionado por el contenedor y soporte para valores, iconos y badges.
 */
export const StandardSphere = ({
  value,
  keyGroup,
  colorScheme = 'primary',
  styleType = 'filled',
  size = 'md',
  tooltip,
  badge,
  badgeColorScheme,
  icon: IconComponent, // Renombramos 'icon' a 'IconComponent' para evitar conflictos
  onlyIcon = false,
  onClick,
  disabled = false,
  className,
  dataTestId,
}: StandardSphereProps) => {
  const { appColorTokens, mode } = useTheme();
  const sphereRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Genera todos los tokens para esferas basados en el tema actual.
  const allSphereTokens = useMemo(() => {
    if (!appColorTokens) return null;
    return generateSphereTokens(appColorTokens, mode);
  }, [appColorTokens, mode]);

  // Selecciona los tokens específicos para el colorScheme de esta esfera.
  const tokens = useMemo(() => {
    if (!allSphereTokens) return null;
    return allSphereTokens[colorScheme] || allSphereTokens.primary;
  }, [allSphereTokens, colorScheme]);

  // Si no hay tokens (ej. tema no cargado), no renderizar el componente.
  // Esta comprobación se hace después de todos los hooks para cumplir las reglas.
  if (!tokens) {
    return null;
  }

  const styleTokens = tokens.styles[styleType];

  // Determina el tamaño base de la esfera a partir de los tokens.
  const baseSphereSize = tokens.size[size];

  // Mapea el tamaño de la esfera a tamaños coherentes para el texto y el icono internos.
  const textFontSize = SPHERE_TEXT_SIZE_MAP[size];
  const iconDisplaySize = SPHERE_ICON_SIZE_MAP[size]; // Tamaño del icono cuando no es protagonista

  // Contenido interno de la esfera (value o icon)
  let sphereInnerContent: React.ReactNode;
  if (onlyIcon && IconComponent) { // Usamos IconComponent aquí
    // Si onlyIcon es true y hay un icono, el icono es el protagonista
    sphereInnerContent = (
      <StandardIcon
        size={iconDisplaySize} // CAMBIO: Usamos el tamaño mapeado directamente
        colorScheme={colorScheme}
      >
        <IconComponent /> {/* CAMBIO: Pasamos el componente de icono como children */}
      </StandardIcon>
    );
  } else if ((value !== undefined && value !== null) || typeof value === 'string' || typeof value === 'number') {
    // Si no es onlyIcon o no hay icono, muestra el value
    // Añadimos comprobaciones explícitas para 0 o cadenas vacías si se consideran válidas
    sphereInnerContent = (
      <StandardText
        size={textFontSize}
        weight="medium"
        className="text-center"
      >
        {value}
      </StandardText>
    );
  } else if (IconComponent) { // Si no hay value pero sí icono (y no onlyIcon), muestra el icono con tamaño normal
    sphereInnerContent = (
      <StandardIcon
        size={iconDisplaySize} // CAMBIO: Usamos el tamaño mapeado directamente
        colorScheme={colorScheme}
      >
        <IconComponent /> {/* CAMBIO: Pasamos el componente de icono como children */}
      </StandardIcon>
    );
  } else {
    sphereInnerContent = null; // No hay nada que mostrar
  }

  // Estilos base para la esfera principal (div circular)
  const sphereCircleStyles: React.CSSProperties = {
    width: baseSphereSize,
    height: baseSphereSize,
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
    display: 'flex', // Asegura que el contenido interno se alinee
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column', // Permite que el value y el icono secundario se apilen
    position: 'relative', // Para posicionar el icono secundario
  };

  // Contenedor principal que envuelve la esfera y el badge
  const sphereContainer = (
    <div
      className={cn(
        "flex flex-col items-center justify-center relative",
        className
      )}
      style={{
        // Ajustar el padding inferior para dar espacio al badge
        paddingBottom: badge ? tokens.badge.offset : '0',
      }}
      data-test-id={dataTestId}
    >
      {/* La esfera propiamente dicha (el círculo) */}
      <div
        ref={sphereRef}
        className={cn(
          "rounded-full overflow-hidden", // Eliminamos flex y justify/align aquí, se mueven a sphereCircleStyles
          disabled && "pointer-events-none"
        )}
        style={sphereCircleStyles} // Aplicamos los estilos del círculo aquí
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsActive(false);
        }}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={!disabled ? onClick : undefined}
      >
        {sphereInnerContent}
        {/* Renderiza el icono secundario si no es onlyIcon y hay un value Y un IconComponent*/}
        {IconComponent && !onlyIcon && ((value !== undefined && value !== null) || typeof value === 'string' || typeof value === 'number') && (
          <div className="absolute" style={{ bottom: '8%', transform: 'translateY(50%)' }}>
            <StandardIcon
              size={SPHERE_ICON_SIZE_MAP['xs']} // Icono pequeño como sub-value, siempre 'xs'
              colorScheme={colorScheme}
            >
              <IconComponent /> {/* CAMBIO: Pasamos el componente de icono como children */}
            </StandardIcon>
          </div>
        )}
      </div>

      {/* Badge fuera de la esfera pero dentro del contenedor principal */}
      {badge && (
        <div
          className="absolute"
          style={{
            bottom: 0,
            transform: "translateY(50%)",
            zIndex: 10, // Asegura que el badge esté por encima de otros elementos
          }}
        >
          <StandardBadge
            size="sm" // El badge tiene su propia prop 'size'
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
      <StandardTooltip trigger={sphereContainer} styleType="solid" colorScheme={colorScheme}>
        {tooltip}
      </StandardTooltip>
    );
  }

  // Sin tooltip, retornar el contenedor directamente
  return sphereContainer;
};

StandardSphere.displayName = "StandardSphere";
