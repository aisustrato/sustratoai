# Guía del Sistema Visual de Ayudas Técnicas

Este documento describe el sistema visual implementado en la aplicación Ayudas Técnicas, incluyendo temas de colores, fuentes y animaciones. Sirve como guía para futuros desarrolladores que continuarán con el mejoramiento visual de los componentes.

## Índice

1. [Sistema de Temas](#sistema-de-temas)
2. [Sistema de Fuentes](#sistema-de-fuentes)
3. [Animaciones con Framer Motion](#animaciones-con-framer-motion)
4. [Consideraciones para Nuevos Componentes](#consideraciones-para-nuevos-componentes)
5. [Mejores Prácticas](#mejores-prácticas)

## Sistema de Temas

La aplicación implementa un sistema de temas flexible que incluye un modo oscuro y tres variantes de temas claros.

### Estructura

- **ThemeProvider**: Gestiona el estado del tema actual y proporciona el contexto para toda la aplicación
- **useTheme**: Hook personalizado para acceder al contexto del tema
- **ThemeSwitcher**: Componente UI para cambiar entre temas

### Temas Disponibles

1. **Claro (Azul)**: Tema predeterminado con tonos azules
2. **Verde**: Variante clara con tonos verdes
3. **Naranja**: Variante clara con tonos naranjas
4. **Oscuro**: Modo oscuro que puede aplicarse a cualquiera de los temas anteriores

### Implementación Técnica

Los temas se implementan mediante variables CSS y clases aplicadas al elemento raíz:

\`\`\`css
/* Tema Claro (predeterminado) */
:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  /* ... más variables ... */
}

/* Tema Oscuro */
.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  /* ... más variables ... */
}

/* Tema Verde */
.theme-green {
  --primary: 152 76% 40%;
  /* ... más variables ... */
}

/* Tema Naranja */
.theme-orange {
  --primary: 24 95% 53%;
  /* ... más variables ... */
}
\`\`\`

### Uso en Componentes

Para usar el tema actual en un componente:

\`\`\`tsx
'use client'

import { useTheme } from "@/app/theme-provider"

export function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <p>Tema actual: {theme}</p>
      <button onClick={() => setTheme('dark')}>Modo Oscuro</button>
    </div>
  )
}
\`\`\`

## Sistema de Fuentes

Complementando el sistema de temas, la aplicación implementa un sistema de fuentes que permite a los usuarios elegir entre diferentes pares de tipografías.

### Estructura

- **FontProvider**: Gestiona el estado del tema de fuentes actual
- **useFontTheme**: Hook personalizado para acceder al contexto de fuentes
- **FontThemeSwitcher**: Componente UI para cambiar entre temas de fuentes

### Temas de Fuentes Disponibles

1. **Clásico**: Fuentes serif para títulos y sans-serif para texto
   - Títulos: Playfair Display
   - Texto: Source Sans Pro

2. **Moderno**: Fuentes sans-serif contemporáneas
   - Títulos: Montserrat
   - Texto: Inter

3. **Accesible**: Fuentes optimizadas para legibilidad
   - Títulos: Atkinson Hyperlegible
   - Texto: Open Sans

### Implementación Técnica

Los temas de fuentes se implementan mediante variables CSS y clases:

\`\`\`css
:root {
  --font-heading: var(--font-playfair), serif;
  --font-body: var(--font-jakarta), system-ui, sans-serif;
}

.font-theme-classic {
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Source Sans Pro', 'Segoe UI', sans-serif;
}

.font-theme-modern {
  --font-heading: 'Montserrat', 'Arial Black', sans-serif;
  --font-body: 'Inter', Roboto, sans-serif;
}

.font-theme-accessible {
  --font-heading: 'Atkinson Hyperlegible', Verdana, sans-serif;
  --font-body: 'Open Sans', Arial, sans-serif;
}
\`\`\`

### Uso en Componentes

Para usar el tema de fuentes en un componente:

\`\`\`tsx
'use client'

import { useFontTheme } from "@/app/font-provider"

export function MyComponent() {
  const { fontTheme, setFontTheme } = useFontTheme()
  
  return (
    <div>
      <p>Tema de fuentes actual: {fontTheme}</p>
      <button onClick={() => setFontTheme('modern')}>Moderno</button>
    </div>
  )
}
\`\`\`

## Animaciones con Framer Motion

La aplicación utiliza Framer Motion para crear animaciones fluidas y profesionales.

### Componentes Principales

- **Navbar**: Implementa animaciones para menús, submenús y transiciones
- **ThemeSwitcher**: Animaciones para el menú desplegable y cambios de tema
- **FontThemeSwitcher**: Animaciones similares para el selector de fuentes

### Tipos de Animaciones Implementadas

1. **Animaciones de entrada/salida**:
   \`\`\`tsx
   <motion.div
     initial={{ opacity: 0, y: -10 }}
     animate={{ opacity: 1, y: 0 }}
     exit={{ opacity: 0, y: 10 }}
     transition={{ duration: 0.3 }}
   >
     {/* Contenido */}
   </motion.div>
   \`\`\`

2. **Animaciones de hover/tap**:
   \`\`\`tsx
   <motion.button
     whileHover={{ scale: 1.05 }}
     whileTap={{ scale: 0.95 }}
   >
     Botón con animación
   </motion.button>
   \`\`\`

3. **Animaciones secuenciales**:
   \`\`\`tsx
   <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ 
       staggerChildren: 0.1,
       delayChildren: 0.2
     }}
   >
     {items.map(item => (
       <motion.div
         key={item.id}
         variants={{
           initial: { y: 20, opacity: 0 },
           animate: { y: 0, opacity: 1 }
         }}
       >
         {item.content}
       </motion.div>
     ))}
   </motion.div>
   \`\`\`

4. **Animaciones de layout**:
   \`\`\`tsx
   <motion.div layout transition={{ duration: 0.3 }}>
     {/* Contenido que cambia de tamaño/posición */}
   </motion.div>
   \`\`\`

### Variantes Reutilizables

Se han definido variantes reutilizables para mantener consistencia:

\`\`\`tsx
// Variantes para elementos de menú
const menuItemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
}

// Variantes para submenús
const submenuVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
      when: "beforeChildren",
    },
  },
}
\`\`\`

## Consideraciones para Nuevos Componentes

Al desarrollar nuevos componentes o mejorar los existentes, es importante seguir estas pautas:

### 1. Compatibilidad con Todos los Temas

- Usar variables CSS para colores en lugar de valores hardcodeados
- Probar el componente en todos los temas (claro, oscuro, verde, naranja)
- Asegurar suficiente contraste en todos los temas

\`\`\`tsx
// Correcto
<div className="bg-background text-foreground">
  <span className="text-primary">Texto destacado</span>
</div>

// Incorrecto
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
  <span style={{ color: 'blue' }}>Texto destacado</span>
</div>
\`\`\`

### 2. Compatibilidad con Todos los Temas de Fuentes

- Usar las variables de fuentes para títulos y texto
- Evitar especificar fuentes directamente
- Probar con diferentes tamaños de texto

\`\`\`tsx
// Correcto
<h2 className="text-2xl font-medium">Título</h2>
<p className="text-base">Párrafo de texto</p>

// Incorrecto
<h2 style={{ fontFamily: 'Montserrat', fontSize: '24px' }}>Título</h2>
<p style={{ fontFamily: 'Inter', fontSize: '16px' }}>Párrafo de texto</p>
\`\`\`

### 3. Animaciones Consistentes

- Usar las variantes de animación definidas
- Mantener duraciones y curvas de animación consistentes
- Considerar la accesibilidad (preferencia de movimiento reducido)

\`\`\`tsx
// Ejemplo de componente con animaciones consistentes
import { motion } from "framer-motion"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -5, transition: { duration: 0.2 } }
}

export function Card({ children }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ duration: 0.3 }}
      className="bg-card text-card-foreground p-4 rounded-lg"
    >
      {children}
    </motion.div>
  )
}
\`\`\`

### 4. Responsividad

- Diseñar para móvil primero
- Usar clases responsive de Tailwind
- Probar en diferentes tamaños de pantalla

\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenido responsivo */}
</div>
\`\`\`

## Mejores Prácticas

### Estructura de Componentes

1. **Separación de Responsabilidades**:
   - Componentes UI puros en `/components/ui`
   - Componentes específicos de dominio en carpetas dedicadas
   - Lógica de estado en hooks personalizados

2. **Composición sobre Herencia**:
   - Crear componentes pequeños y reutilizables
   - Componer componentes más complejos a partir de los simples

3. **Consistencia Visual**:
   - Mantener espaciado, tamaños y proporciones consistentes
   - Usar el sistema de diseño establecido

### Rendimiento

1. **Optimización de Animaciones**:
   - Animar solo propiedades eficientes (transform, opacity)
   - Usar `layoutId` para transiciones entre estados
   - Considerar `will-change` para animaciones complejas

2. **Renderizado Condicional**:
   - Usar `AnimatePresence` para elementos que entran/salen del DOM
   - Implementar lazy loading para componentes pesados

### Accesibilidad

1. **Soporte para Preferencias de Usuario**:
   - Respetar `prefers-reduced-motion`
   - Asegurar suficiente contraste en todos los temas
   - Proporcionar alternativas para interacciones basadas en hover

2. **Semántica y ARIA**:
   - Usar elementos HTML semánticos
   - Añadir atributos ARIA cuando sea necesario
   - Asegurar que todos los controles sean accesibles por teclado

---

Este documento es una guía viva que debe evolucionar junto con la aplicación. Se anima a los desarrolladores a actualizarlo con nuevas mejores prácticas y patrones a medida que se descubran.
