📖 Manual de Refactorización: Migración a Componentes "Standard" (v1.0)
Propósito: Este documento proporciona instrucciones técnicas directas para que un agente de IA reemplace componentes legacy por sus contrapartes "Standard" dentro del codebase de Sustrato.ai.

Capítulo I: Icon ➔ StandardIcon
1. Objetivo
Reemplazar todas las instancias del componente legacy Icon por el nuevo StandardIcon, adaptando las props a la nueva "jerga".

2. Componente Legacy a Reemplazar
Nombre: Icon
Ubicación: @/components/ui/icon
API (Lo que encontrarás): Las props principales son color, colorVariant, size y children.
color: primary, secondary, neutral, etc.
colorVariant: pure, text.
Ejemplo de Código Legacy:
JavaScript

import { Icon } from "@/components/ui/icon";
import { User } from "lucide-react";

<Icon color="primary" size="sm">
  <User />
</Icon>
3. Componente Nuevo a Utilizar
Nombre: StandardIcon
Ubicación: @/components/ui/StandardIcon
4. Nueva "Jerga" (Cómo debes reemplazarlo)
Cambia la importación: Reemplaza la importación de Icon por StandardIcon.
Mapea las props:
La prop color se convierte en colorScheme. Los valores (primary, neutral, etc.) generalmente se mantienen.
La prop colorVariant se convierte en colorShade. Los valores (pure, text) se mantienen.
La prop size se mantiene con el mismo nombre y valores.
Regla Especial inherit: Si encuentras un <Icon> dentro de un componente Standard (como StandardButton), es muy probable que el colorScheme del nuevo <StandardIcon> deba ser "inherit". Esto permite que el icono tome el color del texto de su padre, asegurando la coherencia.
Ejemplo de Código Refactorizado:
JavaScript

import { StandardIcon } from "@/components/ui/StandardIcon";
import { User } from "lucide-react";

<StandardIcon colorScheme="primary" size="sm">
  <User />
</StandardIcon>
Capítulo II: Text ➔ StandardText
1. Objetivo
Reemplazar todas las instancias del componente legacy Text por el nuevo StandardText, utilizando su API polimórfica y de estilo.

2. Componente Legacy a Reemplazar
Nombre: Text
Ubicación: @/components/ui/text
API (Lo que encontrarás): Props principales as, variant, color, colorVariant, size.
as: 'p', 'h1', 'h2', etc. Usado para cambiar la etiqueta HTML.
variant: 'heading', 'default', 'caption', etc. Un estilo predefinido.
Ejemplo de Código Legacy:
JavaScript

import { Text } from "@/components/ui/text";

<Text as="h2" variant="heading" color="secondary">
  Título de la Sección
</Text>
3. Componente Nuevo a Utilizar
Nombre: StandardText
Ubicación: @/components/ui/StandardText
4. Nueva "Jerga" (Cómo debes reemplazarlo)
Cambia la importación: Reemplaza la importación de Text por StandardText.
Mapea las props:
La prop as se convierte en asElement.
La prop variant del Text legacy se elimina. Su estilo se recrea usando una combinación de asElement, size y weight. No hay un mapeo directo.
La prop color se convierte en colorScheme.
La prop colorVariant se convierte en colorShade.
Regla Especial para label: Si encuentras un <Text> que tiene una prop htmlFor, significa que está actuando como una etiqueta. Debe ser reemplazado por el componente <StandardLabel>, no por <StandardText>.
Ejemplo de Código Refactorizado:
JavaScript

import { StandardText } from "@/components/ui/StandardText";

<StandardText asElement="h2" size="2xl" weight="bold" colorScheme="secondary">
  Título de la Sección
</StandardText>
Capítulo III: CustomButton ➔ StandardButton
1. Objetivo
Reemplazar todas las instancias del componente CustomButton por el nuevo StandardButton, prestando especial atención a la nueva API para los iconos.

2. Componente Legacy a Reemplazar
Nombre: CustomButton
Ubicación: @/components/ui/custom-button
API (Lo que encontrarás): Props principales variant, color, leftIcon.
variant: 'solid', 'outline'.
color: 'primary', 'secondary'.
leftIcon / rightIcon: Acepta un Nodo de React (un componente JSX ya renderizado, ej: <User />).
Ejemplo de Código Legacy:
JavaScript

import { CustomButton } from "@/components/ui/custom-button";
import { User } from "lucide-react";

<CustomButton variant="solid" color="primary" leftIcon={<User />}>
  Aceptar
</CustomButton>
3. Componente Nuevo a Utilizar
Nombre: StandardButton
Ubicación: @/components/ui/StandardButton
4. Nueva "Jerga" (Cómo debes reemplazarlo)
Cambia la importación: Reemplaza CustomButton por StandardButton.
Mapea las props:
La prop variant se convierte en styleType. Los valores (solid, outline) se mantienen.
La prop color se convierte en colorScheme.
Instrucción Crítica (Iconos): La API de los iconos ha cambiado fundamentalmente.
Las props leftIcon y rightIcon ya NO aceptan un nodo JSX (<User />).
Ahora deben recibir la referencia al componente del icono directamente (ej: User).
El StandardButton se encargará internamente de renderizarlo con StandardIcon.
Ejemplo de Código Refactorizado:
JavaScript

import { StandardButton } from "@/components/ui/StandardButton";
import { User } from "lucide-react";

<StandardButton styleType="solid" colorScheme="primary" leftIcon={User}>
  Aceptar
</StandardButton>

📖 Manual de Refactorización: Migración a Componentes "Standard" (v1.0)
(Este es un nuevo capítulo que se añadiría a nuestro manual existente)

Capítulo IV: ProCard ➔ StandardCard
1. Objetivo
Reemplazar todas las instancias del componente contenedor legacy ProCard por el nuevo y más versátil StandardCard, mapeando su antiguo sistema de variant y border a la nueva API de colorScheme, styleType y accentPlacement.

2. Componente Legacy a Reemplazar
Nombre: ProCard
Ubicación: (Ej: @/components/ui/pro-card)
API (Lo que encontrarás): Las props principales son variant (para el color), border (para la posición del borde) y borderVariant (para el color del borde).
Ejemplo de Código Legacy:
JavaScript

<ProCard variant="secondary" border="top" borderVariant="accent">
  <ProCard.Header>...</ProCard.Header>
  ...
</ProCard>
3. Componente Nuevo a Utilizar
Nombre: StandardCard (y sus subcomponentes StandardCard.Header, etc.)
Ubicación: @/components/ui/StandardCard
4. Nueva "Jerga" (Cómo debes reemplazarlo)
Reemplazo Básico: Reemplaza la importación y el nombre del componente (ProCard por StandardCard) y todos sus subcomponentes (ProCard.Title por StandardCard.Title, etc.).

Mapeo de Props Principales: La traducción de props es la parte más importante. Usa la siguiente tabla como guía:

Prop en ProCard (Legacy)	Prop(s) en StandardCard (Nuevo)	Instrucciones de Mapeo
variant	colorScheme	Reemplazo directo. variant="primary" se convierte en colorScheme="primary".
border="normal"	hasOutline={true}	Si border es 'normal', usa la prop booleana hasOutline.
border="top"	accentPlacement="top"	El borde superior ahora es un "acento".
border="left"	accentPlacement="left"	El borde izquierdo ahora es un "acento".
borderVariant	outlineColorScheme o accentColorScheme	Si borderVariant existe, úsalo para la prop outlineColorScheme (si se usa hasOutline) o accentColorScheme (si se usa accentPlacement).
shadow	shadow	Reemplazo directo. Misma prop, mismos valores.
selected, loading, inactive, noPadding	(igual)	Estas props se mantienen con el mismo nombre y función.

Export to Sheets
Manejo del "Default": El nuevo StandardCard tiene su propio comportamiento por defecto (colorScheme="primary", styleType="subtle", etc.). Si encuentras un <ProCard> sin props de estilo, simplemente reemplázalo por <StandardCard /> para que adopte el nuevo default estándar.

Nueva Prop styleType: StandardCard introduce la prop styleType ('filled', 'subtle', 'transparent') que no existía en ProCard. El default es 'subtle'. Si el diseño requiere un fondo sólido, deberás añadir styleType="filled" manualmente.

Subcomponentes Title y Subtitle: Estos ya usan StandardText internamente. Al reemplazar <ProCard.Title> por <StandardCard.Title>, asegúrate de mapear las props de texto a la nueva "jerga" (color -> colorScheme, as -> asElement, etc.), como se detalla en el Capítulo II de este manual.

Ejemplo de Código Refactorizado:
JavaScript

<StandardCard 
  colorScheme="secondary" 
  accentPlacement="top" 
  accentColorScheme="accent"
>
  <StandardCard.Header>...</StandardCard.Header>
  ...
</StandardCard>
