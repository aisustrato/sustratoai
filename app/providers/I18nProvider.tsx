// 📍 app/providers/I18nProvider.tsx
// 🎯 PROPÓSITO: Provider de internacionalización para client components
// 🔧 DECISIÓN: Detecta idioma de localStorage/navegador, sin prefijo de ruta
// 🌍 FILOSOFÍA: Interfaces que hablan tu idioma - humanismo global

"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, locales, type Locale, localeNames, localeFlags } from "@/i18n/config";
import defaultMessages from "@/messages/es.json";

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
const LOCALE_COOKIE_KEY = "sustrato-locale";

// 🍪 Persistimos el locale también en una cookie (no solo localStorage) para
// que los Server Components (que no tienen acceso a localStorage) puedan
// leerlo en `i18n/request.ts` vía `cookies()` y renderizar en el idioma
// correcto desde el servidor, en vez de quedar siempre fijos en español.
function persistLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

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
  // 🔧 DECISIÓN: arrancar con el locale/mensajes por defecto ya resueltos
  // (import estático, sin esperar un useEffect) para que SSR y el primer
  // paint del cliente rendericen contenido real de inmediato. Antes,
  // `isReady`/`messages` solo se poblaban dentro de un useEffect (que nunca
  // corre en servidor) y el componente hacía `return null` mientras tanto —
  // como este es el provider más externo de toda la app, bloqueaba TODO el
  // árbol (incluido el contenido de /papers/*) en el HTML inicial servido.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>(
    defaultMessages as Record<string, unknown>,
  );

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
    persistLocaleCookie(newLocale);
    loadMessages(newLocale);

    // Actualizar atributo lang del documento
    document.documentElement.lang = newLocale;
  }, [loadMessages]);

  // 🚀 Inicialización: solo ajusta si el locale real difiere del default ya
  // renderizado (localStorage/navegador), sin bloquear el render inicial.
  useEffect(() => {
    const initialLocale = getInitialLocale();
    document.documentElement.lang = initialLocale;
    // Aseguramos que la cookie quede sincronizada desde la primera carga,
    // incluso si el locale coincide con el default (evita que la cookie
    // quede desactualizada si el usuario cambió antes y luego volvió al
    // idioma por defecto).
    persistLocaleCookie(initialLocale);
    if (initialLocale !== defaultLocale) {
      setLocaleState(initialLocale);
      loadMessages(initialLocale);
    }
  }, [loadMessages]);

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
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="America/Santiago">

        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
//#endregion
