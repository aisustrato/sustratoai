// 📍 hooks/useLocalStorage.ts (v1.0 - Persistencia Local)
// 🎯 PROPÓSITO: Hook personalizado para persistencia en localStorage
// 🔧 ARQUITECTURA: Sincronización automática estado ↔ localStorage
// 🌸 FILOSOFÍA: Preferencias que persisten entre sesiones

"use client";

import { useState, useEffect, useCallback } from 'react';

// 📦 TIPOS
export interface LocalStoragePreferences {
  // Preferencias de botones
  buttonStyleType?: string;
  buttonColorScheme?: string;
  buttonSize?: string;
  
  // Preferencias de iconos
  iconStyle?: string;
  iconSize?: string;
  iconColorScheme?: string;
  
  // Modo visual
  iconMode?: 'icon' | 'emoji';
  
  // Otras preferencias globales
  theme?: 'light' | 'dark' | 'system';
  language?: string;
}

// 🎯 HOOK PRINCIPAL
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // 🔄 Obtener valor del localStorage al montar
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`⚠️ Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 💾 Guardar en localStorage cuando cambia
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`⚠️ Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// 🎨 HOOK ESPECIALIZADO PARA PREFERENCIAS DE UI
export function useUIPreferences() {
  const [preferences, setPreferences] = useLocalStorage<LocalStoragePreferences>(
    'sustrato-ui-preferences',
    {
      // Valores por defecto
      buttonStyleType: 'solid',
      buttonColorScheme: 'primary',
      buttonSize: 'md',
      iconStyle: 'outline',
      iconSize: 'md',
      iconColorScheme: 'neutral',
      iconMode: 'icon',
      theme: 'system',
      language: 'es'
    }
  );

  // 🔄 Actualizar preferencia específica
  const updatePreference = useCallback(<K extends keyof LocalStoragePreferences>(
    key: K,
    value: LocalStoragePreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, [setPreferences]);

  // 🔄 Resetear a valores por defecto
  const resetPreferences = useCallback(() => {
    setPreferences({
      buttonStyleType: 'solid',
      buttonColorScheme: 'primary',
      buttonSize: 'md',
      iconStyle: 'outline',
      iconSize: 'md',
      iconColorScheme: 'neutral',
      iconMode: 'icon',
      theme: 'system',
      language: 'es'
    });
  }, [setPreferences]);

  return {
    preferences,
    setPreferences,
    updatePreference,
    resetPreferences
  };
}

// 🧹 LIMPIAR STORAGE (útil para desarrollo)
export const clearLocalStorage = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
};

// 📊 OBTENER TODAS LAS PREFERENCIAS (debug)
export const getAllPreferences = (): LocalStoragePreferences => {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    const item = window.localStorage.getItem('sustrato-ui-preferences');
    return item ? JSON.parse(item) : {};
  } catch (error) {
    console.warn('⚠️ Error reading preferences:', error);
    return {};
  }
};
