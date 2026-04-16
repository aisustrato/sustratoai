// 📍 i18n/request.ts
// 🎯 PROPÓSITO: Configuración de next-intl para server components
// 🔧 DECISIÓN: Carga mensajes según locale detectado

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale, locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener locale de la request o usar default
  let locale = await requestLocale;
  
  // Validar que el locale sea válido
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
