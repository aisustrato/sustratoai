# StandardText v4.3

> 🌍 Texto tipográfico con tokens + soporte i18n nativo

## Ubicación

```
components/ui/StandardText.tsx
```

## Propósito

Componente polimórfico para tipografía consistente. Soporta presets semánticos, tokens de color, gradientes, y **traducción automática via i18n**.

---

## Props Principales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `preset` | `"heading" \| "subheading" \| "title" \| "subtitle" \| "body" \| "caption"` | - | Preset semántico |
| `size` | `"xs" \| "sm" \| "base" \| "lg" \| "xl" \| "2xl" \| "3xl" \| "4xl" \| "5xl"` | `"base"` | Tamaño |
| `weight` | `"normal" \| "medium" \| "semibold" \| "bold"` | `"normal"` | Peso |
| `align` | `"left" \| "center" \| "right" \| "justify"` | - | Alineación |
| `colorScheme` | `ColorSchemeVariant` | - | Esquema de color |
| `colorShade` | `"text" \| "subtle" \| "muted"` | `"text"` | Tono del color |
| `applyGradient` | `boolean \| ColorSchemeVariant` | - | Aplicar gradiente |
| `truncate` | `boolean` | `false` | Truncar con ellipsis |
| `asElement` | `React.ElementType` | - | Elemento HTML a renderizar |

---

## 🌍 Props i18n

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `i18nKey` | `string` | - | Key de traducción (ej. `"common.save"`) |
| `i18nNamespace` | `string` | - | Namespace explícito (detectado de i18nKey si no se provee) |
| `i18nValues` | `Record<string, string \| number>` | - | Valores para interpolación |

---

## Uso Básico

```tsx
// Con children (modo clásico)
<StandardText>Texto directo</StandardText>

// Con preset semántico
<StandardText preset="heading">Título Principal</StandardText>
<StandardText preset="body">Párrafo de texto...</StandardText>
```

---

## 🌍 Uso con i18n

```tsx
// Traducción simple
<StandardText i18nKey="common.save" />
// → "Guardar" (es) | "Save" (en)

// Traducción con estilo
<StandardText 
  i18nKey="errors.required" 
  colorScheme="danger" 
  weight="semibold" 
/>

// Con interpolación
<StandardText 
  i18nKey="input.charactersRemaining" 
  i18nValues={{ count: 50 }} 
/>
// → "50 caracteres restantes"
```

### Prioridad de Contenido

1. **children** - Siempre gana (escape hatch)
2. **i18nKey** - Traducción automática
3. **fallback** - String vacío

```tsx
// children tiene prioridad sobre i18nKey
<StandardText i18nKey="common.save">Override Manual</StandardText>
// → "Override Manual" (ignora i18nKey)
```

---

## Agregar Idiomas

Es trivial agregar nuevos idiomas:

### 1. Editar `i18n/config.ts`

```ts
export const locales = ['es', 'en', 'pt', 'fr'] as const;

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
};
```

### 2. Crear archivo de mensajes

```
messages/pt.json
messages/fr.json
```

### 3. ¡Listo!

Todas las instancias de `StandardText` con `i18nKey` se traducirán automáticamente.

---

## Presets

| Preset | Elemento | Tamaño | Peso | Fuente |
|--------|----------|--------|------|--------|
| `heading` | `h1` | 3xl | bold | heading |
| `subheading` | `h2` | 2xl | semibold | heading |
| `title` | `h3` | xl | semibold | heading |
| `subtitle` | `h4` | lg | medium | heading |
| `body` | `p` | base | normal | body |
| `caption` | `span` | sm | normal | body |

---

## Gradientes

```tsx
// Gradiente primario por defecto
<StandardText applyGradient>Texto con gradiente</StandardText>

// Gradiente específico
<StandardText applyGradient="secondary">Gradiente secundario</StandardText>
<StandardText applyGradient="danger">Gradiente peligro</StandardText>
```

---

## Arquitectura i18n

### Flujo de Traducción

```
i18nKey="common.save"
      ↓
namespace = "common" (detectado)
      ↓
useTranslations("common")
      ↓
t("save")
      ↓
messages/es.json → { "common": { "save": "Guardar" } }
      ↓
"Guardar"
```

### Estructura de Mensajes

```json
// messages/es.json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "loading": "Cargando..."
  },
  "errors": {
    "required": "Este campo es requerido",
    "invalid": "Valor inválido"
  },
  "input": {
    "charactersRemaining": "{count} caracteres restantes"
  }
}
```

---

## Showroom

```
/showroom/standard-text
```

Tab "🌍 i18n" muestra ejemplos de traducción en acción.

---

📍 `docs/standard-UI/StandardText.md`  
🎯 v4.3 - i18n Ready  
🌍 Humanismo global - interfaces que hablan tu idioma
