// 📍 i18n/request.ts
// 🎯 PROPÓSITO: Configuración de next-intl para server components
// 🔧 DECISIÓN: Carga mensajes según locale detectado

import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale, locales } from './config';

const LOCALE_COOKIE_KEY = 'sustrato-locale';

export default getRequestConfig(async ({ requestLocale }) => {
  // 🍪 Prioridad 1: cookie escrita por I18nProvider (mismo mecanismo que usa
  // el toggle client-side). Sin esto, los Server Components siempre
  // renderizaban en `defaultLocale`, ignorando el idioma elegido por el
  // usuario, porque no tienen acceso a localStorage.
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE_KEY)?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default,
    };
  }

  // Prioridad 2: locale de la request (routing por URL, no usado hoy) o default
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
