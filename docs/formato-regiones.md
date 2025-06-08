#### I. 🎯 Objetivo del Requerimiento

Implementar un sistema de organización y documentación visual estandarizado en el código fuente de Sustrato.ai. Este sistema facilitará la lectura, navegación, mantenimiento y colaboración en el proyecto.

#### II. 📚 Base del Estándar

El estándar de organización y documentación se basa en el "Sistema de Regiones (Comment Anchors)" y "Sistema de Comentarios en Línea" detallados a continuación. **Este documento contiene las especificaciones completas para la implementación.**

#### III. 🛠️ Especificaciones de Implementación

El Agente de Refactorización deberá aplicar los siguientes patrones de organización y comentarios a los archivos de código fuente designados:

##### 3.1. Sistema de Regiones (Comment Anchors)

Aplicar las siguientes regiones principales y especializadas. Cada región debe incluir las líneas `#region` y `!#endregion` con el `tag` y `título` especificados, y la iconografía (emoji) donde se indica.

**Regiones Principales:**

1.  **[head] - Importaciones y Configuración**
    * **Propósito:** Agrupar importaciones y configuración inicial.
    * **Ubicación:** Siempre al inicio del archivo.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [head] - 🏷️ IMPORTS 🏷️
        import React from 'react';
        import { motion } from 'framer-variants';
        //#endregion ![head]
        ```

2.  **[def] - Definiciones y Tipos**
    * **Propósito:** Contener definiciones de tipos e interfaces.
    * **Ubicación:** Después de las importaciones.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [def] - 📦 TYPES 📦
        type ButtonProps = {
          label: string;
          size?: 'sm' | 'md' | 'lg';
        };
        //#endregion ![def]
        ```

3.  **[main] - Lógica Principal**
    * **Propósito:** Contener la implementación principal.
    * **Ubicación:** Centro del archivo.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [main] - 🔧 COMPONENT 🔧
        export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
          // Implementation
        );
        //#endregion ![main]
        ```

4.  **[foo] - Exports y Conclusiones**
    * **Propósito:** Agrupar exports y código de cierre.
    * **Ubicación:** Final del archivo.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [foo] - 🔚 EXPORTS 🔚
        export { Button };
        export type { ButtonProps };
        //#endregion ![foo]
        ```

**Regiones Especializadas:**

1.  **[sub] - Subfunciones TypeScript**
    * **Propósito:** Lógica TypeScript auxiliar.
    * **Ubicación:** Dentro de `[main]`, según necesidad.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [sub] - 🧰 HELPER FUNCTIONS 🧰
        const calculateStyles = (): React.CSSProperties => {
          // Implementation
        };
        //#endregion ![sub]
        ```

2.  **[render] - Componentes Renderizables**
    * **Propósito:** Código JSX/TSX que se renderiza.
    * **Ubicación:** Dentro de `[main]`, para funciones de render.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [render] - 🎨 RENDER SECTION 🎨
        const renderVariants = () => (
          <Card>
            <Text>Variants</Text>
          </Card>
        );
        //#endregion ![render]
        ```

3.  **[todo] - Seguimiento**
    * **Propósito:** Tracking de tareas y pendientes.
    * **Ubicación:** Según contexto, típicamente al final o donde sea relevante.
    * **Formato de Ejemplo:**
        ```typescript
        //#region [todo] - 👀 PENDIENTES 👀
        // ! ❌ Implementar animaciones avanzadas
        // ! ✅ Configuración básica completada
        //#endregion ![todo]
        ```

##### 3.2. Sistema de Comentarios en Línea

Aplicar los siguientes formatos de comentarios:

1.  **Ubicación y Referencia de Archivo**
    * **Propósito:** Identificación clara de ubicación del archivo.
    * **Ubicación:** Primera línea del archivo.
    * **Formato de Ejemplo:**
        ```typescript
        //. 📍 components/flexUI/Button/Button.flex.tsx
        ```

2.  **Comentarios de Aclaración**
    * **Propósito:** Insights y aclaraciones breves.
    * **Formato de Ejemplo:**
        ```typescript
        const value = 42; //> 💡 Explicación del valor
        ```

3.  **Comentarios Estándar**
    * **Propósito:** Documentación general.
    * **Formato de Ejemplo:**
        ```typescript
        //> 📝 Comentario descriptivo estándar
        ```

4.  **TODOs Inline**
    * **Propósito:** Marcadores rápidos de tareas pendientes.
    * **Formato de Ejemplo:**
        ```typescript
        // TODO 👀 Implementar validación
        ```

5.  **Estado de Tareas**
    * **Propósito:** Tracking visual de estado.
    * **Formatos de Ejemplo:**
        ```typescript
        // ! ❌ Tarea pendiente
        // ! ✅ Tarea completada
        ```

#### IV. ⚙️ Restricciones y Mejores Prácticas (Pragmáticas)

* **Jerarquía de Regiones:** No anidar más de dos niveles de regiones.
* **Consistencia:** Mantener la consistencia en la nomenclatura y estructura de regiones y comentarios a lo largo de todos los archivos.
* **Código Completo:** **Para cualquier modificación o inserción**, el Agente deberá proporcionar el **bloque de código completo** afectado, incluyendo la región o el comentario que se añade o modifica. Esto asegura que la implementación manual sea directa y reduce errores.