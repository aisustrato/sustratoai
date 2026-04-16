// 📍 app/providers/I18nProvider.tsx
// 🎯 PROPÓSITO: Provider de internacionalización para client components
// 🔧 DECISIÓN: Detecta idioma de localStorage/navegador, sin prefijo de ruta
// 🌍 FILOSOFÍA: Interfaces que hablan tu idioma - humanismo global

"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, locales, type Locale, localeNames, localeFlags } from "@/i18n/config";

//#region [types] - 🎨 TIPOS
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: typeof locales;
  localeNames: typeof localeNames;
  localeFlags: typeof localeFlags;
}
//#endregion

//#region [context] - 📦 CONTEXT
const I18nContext = createContext<I18nContextType | null>(null);
//#endregion

//#region [hook] - 🪝 HOOK PERSONALIZADO
export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLocale must be used within I18nProvider");
  }
  return context;
}
//#endregion

//#region [helpers] - 🔄 FUNCIONES AUXILIARES
const LOCALE_STORAGE_KEY = "sustrato-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  
  // 1. Primero verificar localStorage
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  
  // 2. Detectar del navegador
  const browserLocale = navigator.language.split("-")[0];
  if (locales.includes(browserLocale as Locale)) {
    return browserLocale as Locale;
  }
  
  return defaultLocale;
}
//#endregion

//#region [provider] - 🚀 PROVIDER
interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 🔄 Cargar mensajes según locale
  const loadMessages = useCallback(async (loc: Locale) => {
    try {
      const msgs = await import(`@/messages/${loc}.json`);
      setMessages(msgs.default);
    } catch (error) {
      console.error(`[I18nProvider] Error loading messages for ${loc}:`, error);
      // Fallback a español
      const fallback = await import(`@/messages/es.json`);
      setMessages(fallback.default);
    }
  }, []);

  // 🔄 Cambiar locale y persistir
  const setLocale = useCallback((newLocale: Locale) => {
    if (!locales.includes(newLocale)) return;
    
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    loadMessages(newLocale);
    
    // Actualizar atributo lang del documento
    document.documentElement.lang = newLocale;
  }, [loadMessages]);

  // 🚀 Inicialización
  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
    loadMessages(initialLocale).then(() => setIsReady(true));
  }, [loadMessages]);

  // ⏳ Loading state
  if (!isReady || !messages) {
    return null; // O un skeleton/loader si prefieres
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        locales,
        localeNames,
        localeFlags,
      }}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
//#endregion
