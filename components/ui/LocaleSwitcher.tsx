// 📍 components/ui/LocaleSwitcher.tsx
// 🎯 PROPÓSITO: Selector de idioma para la UI
// 🔧 DECISIÓN: Botón simple con bandera + nombre
// 🌍 FILOSOFÍA: Cambio de idioma sin recargar página

"use client";

import { useLocale } from "@/app/providers/I18nProvider";
import { StandardButton } from "./StandardButton";
import { StandardSelect } from "./StandardSelect";

//#region [component] - 🚀 COMPONENTE
interface LocaleSwitcherProps {
  variant?: "button" | "select";
  size?: "sm" | "md";
}

export function LocaleSwitcher({ variant = "button", size = "sm" }: LocaleSwitcherProps) {
  const { locale, setLocale, locales, localeNames, localeFlags } = useLocale();

  if (variant === "select") {
    return (
      <StandardSelect
        value={locale}
        onChange={(value) => setLocale(value as typeof locale)}
        options={locales.map((loc) => ({
          value: loc,
          label: `${localeFlags[loc]} ${localeNames[loc]}`,
        }))}
        size={size}
        colorScheme="neutral"
      />
    );
  }

  // Botón que alterna entre idiomas
  const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length];
  
  return (
    <StandardButton
      onClick={() => setLocale(nextLocale)}
      styleType="ghost"
      size={size}
      colorScheme="neutral"
      aria-label={`Cambiar a ${localeNames[nextLocale]}`}
    >
      {localeFlags[locale]} {localeNames[locale]}
    </StandardButton>
  );
}
//#endregion
