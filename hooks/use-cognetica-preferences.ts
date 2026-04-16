// 📍 hooks/use-cognetica-preferences.ts
// 🎯 Hook para persistir preferencias de visualización de Cognética en localStorage

import { useState, useEffect, useCallback } from 'react';

export interface CogneticaPreferences {
    // Filtros de tipo de artefacto
    selectedTypes: string[];
    
    // Visibilidad de elementos cognitivos
    showSeeds: boolean;
    showDisciplines: boolean;
    showTheories: boolean;
    showThinkers: boolean;
    showMicelio: boolean;
    
    // Modo de visualización
    emojiMode: boolean;
    
    // Filtro de jardines
    gardenFilter?: 'with' | 'without';
}

const DEFAULT_PREFERENCES: CogneticaPreferences = {
    selectedTypes: [],
    showSeeds: true,
    showDisciplines: true,
    showTheories: true,
    showThinkers: true,
    showMicelio: true,
    emojiMode: false,
    gardenFilter: undefined,
};

const STORAGE_KEY = 'cognetica_preferences';

export function useCogneticaPreferences() {
    const [preferences, setPreferencesState] = useState<CogneticaPreferences>(DEFAULT_PREFERENCES);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar preferencias desde localStorage al montar
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as CogneticaPreferences;
                console.log('✅ [Preferences] Preferencias cargadas desde localStorage:', parsed);
                // Solo actualizar si realmente hay diferencias
                setPreferencesState(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(parsed)) {
                        return prev;
                    }
                    return parsed;
                });
            } else {
                console.log('ℹ️ [Preferences] No hay preferencias guardadas, usando valores por defecto');
            }
        } catch (error) {
            console.error('❌ [Preferences] Error cargando preferencias:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Guardar preferencias en localStorage cuando cambien
    const setPreferences = useCallback((newPreferences: Partial<CogneticaPreferences>) => {
        setPreferencesState(prev => {
            const updated = { ...prev, ...newPreferences };
            
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                console.log('💾 [Preferences] Preferencias guardadas:', updated);
            } catch (error) {
                console.error('❌ [Preferences] Error guardando preferencias:', error);
            }
            
            return updated;
        });
    }, []);

    // Resetear a valores por defecto
    const resetPreferences = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setPreferencesState(DEFAULT_PREFERENCES);
            console.log('🔄 [Preferences] Preferencias reseteadas a valores por defecto');
        } catch (error) {
            console.error('❌ [Preferences] Error reseteando preferencias:', error);
        }
    }, []);

    // Helpers para actualizar preferencias individuales
    const updatePreference = useCallback(<K extends keyof CogneticaPreferences>(
        key: K,
        value: CogneticaPreferences[K]
    ) => {
        setPreferences({ [key]: value });
    }, [setPreferences]);

    return {
        preferences,
        setPreferences,
        updatePreference,
        resetPreferences,
        isLoaded,
    };
}
