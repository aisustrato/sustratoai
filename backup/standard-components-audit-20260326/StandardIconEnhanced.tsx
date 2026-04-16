// 📍 components/ui/StandardIconEnhanced.tsx (v1.0 - Con Persistencia y Modo Emoji)
// 🎯 PROPÓSITO: Icono mejorado con soporte para emoji y persistencia local
// 🔧 ARQUITECTURA: Extiende StandardIcon con modo emoji y preferencias guardadas
// 🌸 FILOSOFÍA: Personalización que recuerda tus elecciones

"use client";
import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { useUIPreferences } from "@/hooks/useLocalStorage";
import { StandardIcon } from "./StandardIcon";
import type { IconSize, IconStyleType, IconColorShade } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

export interface StandardIconEnhancedProps {
  children?: React.ReactNode;
  className?: string;
  size?: IconSize;
  colorScheme?: ColorSchemeVariant;
  styleType?: IconStyleType;
  colorShade?: IconColorShade;
  isSpinning?: boolean;
  
  // 🎭 MODO EMOJI
  emoji?: string;
  fallbackEmoji?: string;
  
  // 💾 PERSISTENCIA
  persistPreferences?: boolean;
  
  // 🎨 CONTROL MANUAL
  forceMode?: 'icon' | 'emoji';
  
  // Props HTML estándar
  title?: string;
  id?: string;
}

export function StandardIconEnhanced({
  children,
  className,
  size = "md",
  colorScheme = "neutral",
  styleType = "outline",
  colorShade = "pure",
  isSpinning = false,
  emoji,
  fallbackEmoji = "⭐",
  persistPreferences = true,
  forceMode,
  ...props
}: StandardIconEnhancedProps) {
  // 💾 Preferencias del usuario
  const { preferences } = useUIPreferences();
  
  // 🎭 Determinar modo de visualización
  const displayMode = useMemo(() => {
    if (forceMode) return forceMode;
    if (persistPreferences) return preferences.iconMode || 'icon';
    return 'icon';
  }, [forceMode, preferences.iconMode, persistPreferences]);

  // 🎨 Estilos para emoji
  const emojiStyles = useMemo(() => {
    const sizeMap: Record<string, string> = {
      '4xs': '0.5rem',
      '3xs': '0.625rem',
      '2xs': '0.75rem',
      xs: '0.875rem',
      sm: '1rem',
      md: '1.25rem',
      lg: '1.5rem',
      xl: '1.875rem',
      '2xl': '2.25rem',
      '3xl': '3rem',
      '4xl': '3.5rem',
      '5xl': '4rem',
      base: '1.25rem',
    };
    
    return {
      fontSize: sizeMap[size] || sizeMap.md,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }, [size]);

  // 🎭 RENDERIZAR SEGÚN MODO
  if (displayMode === 'emoji' && emoji) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          isSpinning && "animate-spin",
          className
        )}
        style={emojiStyles}
        {...props}
      >
        {emoji}
      </span>
    );
  }

  // 🔄 Fallback a emoji si no hay icono
  if (displayMode === 'emoji' && !children && fallbackEmoji) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          isSpinning && "animate-spin",
          className
        )}
        style={emojiStyles}
        {...props}
      >
        {fallbackEmoji}
      </span>
    );
  }

  // 🎨 MODO ICONO NORMAL
  return (
    <StandardIcon
      children={children}
      className={className}
      size={size}
      colorScheme={colorScheme}
      styleType={styleType}
      colorShade={colorShade}
      isSpinning={isSpinning}
      {...props}
    />
  );
}

// 🎯 COMPONENTE DE TOGGLE PARA CAMBIAR MODO
export function IconModeToggle({
  className,
  onModeChange,
}: {
  className?: string;
  onModeChange?: (mode: 'icon' | 'emoji') => void;
}) {
  const { preferences, updatePreference } = useUIPreferences();
  const currentMode = preferences.iconMode || 'icon';

  const handleToggle = () => {
    const newMode = currentMode === 'icon' ? 'emoji' : 'icon';
    updatePreference('iconMode', newMode);
    onModeChange?.(newMode);
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors",
        "hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400",
        className
      )}
      title={`Modo actual: ${currentMode === 'icon' ? 'Iconos' : 'Emojis'}`}
    >
      <span className="text-lg">
        {currentMode === 'icon' ? '🎨' : '😊'}
      </span>
      <span className="text-xs text-neutral-600">
        {currentMode === 'icon' ? 'Iconos' : 'Emojis'}
      </span>
    </button>
  );
}

export default StandardIconEnhanced;
