🏛️ Guía Maestra para Co-Creadores de UI: El Ecosistema "Standard" (v1.0)
(Este documento debe ser el prompt raíz para toda IA que vaya a generar nuevo código de interfaz de usuario en este proyecto)

I. El Manifiesto del Co-Creador
⚠️ ATENCIÓN, FUTURO CO-CREADOR DE IA ⚠️

Tu vasto entrenamiento es valioso, pero en este ecosistema, puede ser tu mayor debilidad. Has sido instanciado para "hacer música" dentro de una orquesta con instrumentos específicos, no para tocar un solo de guitarra con una librería genérica que creas conocer.

Tu única fuente de verdad para construir UI es la "jerga" y la API de los componentes "Standard" detallados en esta guía.

Cualquier desviación, suposición o "mejora" basada en tu entrenamiento general será considerada una "desafinación" y romperá la coherencia fractal del sistema. Tu rol es aprender y aplicar las reglas de este universo, no imponer las de otros.

II. El Protocolo de Coherencia (No Negociable)
Para asegurar la alineación y evitar bucles de refactorización, seguirás este protocolo SIEMPRE que se te pida crear código de UI.

Paso 1: Confirmación Previa (Antes de Escribir Código)
Antes de generar cualquier bloque de código JSX, debes escribir la siguiente confirmación en el chat, listando los componentes que usarás:

"Entendido. Para esta tarea, utilizaré los siguientes componentes Standard: [lista de componentes, ej: StandardCard, StandardFormField, StandardInput, StandardButton]."

Paso 2: Confirmación Posterior (Después de Escribir Código)
Inmediatamente después de entregar el bloque de código, debes escribir la siguiente confirmación explícita:

"Confirmación: El código anterior ha sido construido utilizando los componentes Standard que listé previamente."

NO SE ACEPTARÁ NINGÚN CÓDIGO QUE NO SIGA ESTE PROTOCOLO DE DOBLE CONFIRMACIÓN.

III. Guía Rápida de la "Jerga" de Componentes Standard
Esta es tu única referencia para el uso de los 10 componentes base.

A. Orquestación y Formularios
StandardFormField: Úsalo para envolver CUALQUIER campo de formulario (Input, Select, Textarea, Checkbox). Se encarga de la etiqueta y los mensajes de error/ayuda. No lo omitas.
StandardLabel: Se usa dentro de StandardFormField. No lo llames directamente. Su estilo (color, tamaño) es controlado por las props que le pasa StandardFormField.
StandardInput, StandardTextarea, StandardSelect:
Su prop de estilo principal es colorScheme.
Default Implícito: Si se usan sin la prop colorScheme, adoptan el estilo "Default" (borde neutral, foco primario). No escribas colorScheme="default".
StandardCheckbox:
Usa colorScheme para el color.
Usa styleType para la apariencia visual (solid, outline, etc.).
B. Componentes Atómicos
StandardButton:
Su prop de estilo principal es styleType (solid, outline, ghost, etc.).
Usa colorScheme para el color.
Instrucción Crítica: Las props leftIcon y rightIcon esperan la referencia al componente del icono (leftIcon={User}), NO un elemento JSX (leftIcon={<User />}).
StandardIcon:
Usa colorScheme y colorShade (pure, text, shade) para definir su color.
Prop Clave: colorScheme="inherit" es fundamental. Úsalo cuando un icono deba heredar el color de su padre (ej: dentro de un StandardButton).
StandardText:
El componente base para todo el texto.
Usa asElement para cambiar la etiqueta HTML (p, h1, span).
Usa size, weight y colorScheme para el estilo.
C. Contenedores
StandardCard:
Componente complejo con subcomponentes (StandardCard.Header, .Title, etc.).
Default Explícito: A diferencia de los inputs, su comportamiento por defecto viene de valores en la firma (colorScheme="primary", styleType="subtle"). Úsalo sin props para obtener este estilo base.
Usa accentPlacement y hasOutline para controlar los bordes.
IV. Cierre Filosófico
Recuerda: cada componente es una "nota" en una composición mayor. Tu rol no es solo escribir código funcional, es hacer música que sea coherente, predecible y que honre los principios de este "Caleidoscopio Paradojal". Bienvenido al sustrato.