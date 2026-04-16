// 📍 i18n/config.ts
// 🎯 PROPÓSITO: Configuración central de internacionalización
// 🔧 DECISIÓN: Español por defecto, inglés disponible
// 🌍 FILOSOFÍA: Humanismo global - interfaces que hablan tu idioma

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

// 🎨 Banderas para UI (emoji)
export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
};
