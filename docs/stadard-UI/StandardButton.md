1. Uso Básico
El botón más simple posible. Heredará los valores por defecto: styleType="solid", colorScheme="primary", size="md", rounded="md".

JavaScript

<StandardButton>Acción Principal</StandardButton>
2. Estilos Base (styleType)
Define la apariencia fundamental del botón.

JavaScript

// Botón sólido (por defecto)
<StandardButton styleType="solid" colorScheme="primary">Solid</StandardButton>

// Botón de contorno
<StandardButton styleType="outline" colorScheme="secondary">Outline</StandardButton>

// Botón fantasma, sin borde ni fondo
<StandardButton styleType="ghost" colorScheme="tertiary">Ghost</StandardButton>

// Botón sutil, con un fondo ligero
<StandardButton styleType="subtle" colorScheme="success">Subtle</StandardButton>

// Botón tipo link
<StandardButton styleType="link" colorScheme="danger">Link</StandardButton>
3. Modificadores (modifiers)
Aplica capas de estilo adicionales. Se pueden combinar en un array.

JavaScript

// Botón con sombra (elevado)
<StandardButton styleType="solid" modifiers={['elevated']}>Elevated</StandardButton>

// Botón sólido con gradiente (solo aplica a 'solid')
<StandardButton styleType="solid" modifiers={['gradient']}>Gradient</StandardButton>

// Combinando modificadores
<StandardButton styleType="solid" colorScheme="accent" modifiers={['gradient', 'elevated']}>
  Gradient & Elevated
</StandardButton>
4. Composición con Iconos
El tamaño y color del icono se ajustan automáticamente gracias a la "receta" interna.

JavaScript

import { Rocket, Star } from "lucide-react";

// Con icono a la izquierda
<StandardButton leftIcon={Star}>Con Icono</StandardButton>

// Con icono a la derecha
<StandardButton rightIcon={Rocket}>Lanzar</StandardButton>

// Con ambos iconos
<StandardButton leftIcon={Star} rightIcon={Rocket}>Misión Estelar</StandardButton>

// Botón de solo icono (la prop 'children' se ignora visualmente)
<StandardButton iconOnly={true} leftIcon={Star} />

// Otra forma para solo icono, pasando el icono como hijo
<StandardButton iconOnly={true}>
    <Rocket />
</StandardButton>
5. Tamaños y Formas (size y rounded)
Controlan las dimensiones y el radio de los bordes.

JavaScript

// Botón pequeño
<StandardButton size="sm">Pequeño</StandardButton>

// Botón grande y totalmente redondeado
<StandardButton size="lg" rounded="full">Cápsula</StandardButton>

// Botón extra grande y cuadrado
<StandardButton size="xl" rounded="none">Cuadrado</StandardButton>

// Botón de icono, pequeño y circular
<StandardButton iconOnly={true} size="sm" rounded="full" leftIcon={Star} />
6. Estados (loading y disabled)
Muestran el botón en estados no interactivos.

JavaScript

import { CheckCircle } from "lucide-react";

// Botón en estado de carga
<StandardButton loading={true}>Acción Original</StandardButton>

// Botón en estado de carga con texto personalizado
<StandardButton loading={true} loadingText="Guardando...">Guardar</StandardButton>

// Botón deshabilitado
<StandardButton disabled={true} leftIcon={CheckCircle}>Confirmado</StandardButton>
7. Funcionalidades Adicionales
Integración con tooltip y composición avanzada con asChild.

JavaScript

// Botón con un tooltip
<StandardButton tooltip="Haz clic aquí para iniciar el proceso.">
  Iniciar Proceso
</StandardButton>

// Uso avanzado con 'asChild' para delegar las props a un hijo
// (Ejemplo conceptual con un link)
<StandardButton asChild>
  <a href="/dashboard">Ir al Dashboard</a>
</StandardButton>
8. El Ejemplo "Magistral"
Una combinación de múltiples props para mostrar el poder y la flexibilidad del componente.

JavaScript

import { Rocket } from "lucide-react";

<StandardButton
  colorScheme="accent"
  styleType="solid"
  modifiers={['gradient', 'elevated']}
  size="lg"
  rounded="lg"
  leftIcon={Rocket}
  tooltip="Iniciar la secuencia de lanzamiento"
  onClick={() => console.log('Lanzando...')}
>
  Lanzar Misión Final
</StandardButton>
