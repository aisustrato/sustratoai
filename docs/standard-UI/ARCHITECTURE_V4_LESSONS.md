# Arquitectura Standard UI v4 y Lecciones Aprendidas

Este documento consolida la experiencia técnica y las decisiones arquitectónicas tomadas durante la refactorización de los componentes `Standard UI` a la versión 4 (v4), específicamente a raíz de la migración de `StandardBadge`. Su objetivo es servir como referencia crítica para futuros contextos de IA y desarrolladores, evitando bucles de error y garantizando la coherencia del sistema.

## 1. El Problema del "Bucle Ciego" (Contexto)

Durante la refactorización inicial, nos encontramos con un error recurrente (`ReferenceError: generateAllBadgeTokens is not defined`) que persistía a pesar de múltiples intentos de "arreglo".

### Causa Raíz
La discrepancia entre el "estado percibido" por la IA y el "estado real" del sistema de archivos. La IA asumía que las definiciones de funciones existían o se habían escrito correctamente, cuando en realidad las ediciones habían fallado silenciosamente o estaban incompletas. Esto llevó a un ciclo de diagnósticos erróneos donde se intentaba corregir el síntoma (el error de referencia) sin validar estructuralmente la existencia de la fuente.

### Lección Clave
**Validación Estructural Primero:** Antes de corregir un error de referencia, se debe verificar explícitamente la existencia física y la exportación correcta de la definición en el archivo proveedor. No asumir nada.

---

## 2. Arquitectura v4: Centralización y Pre-cálculo

La versión 4 abandona la generación de estilos "on-the-fly" dentro de cada componente en favor de un modelo centralizado y pre-calculado.

### Componentes Principales

1.  **`DesignTokensProvider` (El Cerebro)**
    *   **Responsabilidad:** Calcular *todos* los tokens de diseño (colores, tamaños, bordes, sombras) para *todos* los componentes y variantes posibles al inicio o al cambiar el tema.
    *   **Beneficio:** Elimina el recálculo costoso en cada renderizado de componentes individuales. Performance O(1) en acceso a estilos.
    *   **Ubicación:** `app/providers/DesignTokensProvider.tsx`

2.  **`useDesignTokens` (El Nervio)**
    *   Hook que expone el objeto `tokens` completo.
    *   Los componentes consumen este hook y extraen *directamente* sus estilos ya resueltos.

---

## 3. Principios Filosóficos de la v4

### A. Radical Trust (Confianza Radical)
*   **Concepto:** El componente de UI (ej. `StandardBadge`) es "tonto" respecto a la lógica de diseño. Confía ciegamente en que el token que recibe del `Provider` es correcto y seguro para usar.
*   **Regla:** No hay validaciones de color, ni fallbacks complejos, ni transformaciones de estilo dentro del componente (`.tsx`). Si el token dice "background: #F00", el componente lo aplica sin cuestionar.

### B. Zero Global CSS Variables (Adiós Variables Globales)
*   **Concepto:** Evitar la contaminación del espacio de nombres global de CSS (`:root`).
*   **Implementación:** Los estilos no se definen en `globals.css` ni se reutilizan variables genéricas. Cada instancia de componente recibe sus valores específicos inyectados.

### C. Pattern Flex (Inyección Dinámica)
*   **Concepto:** Inyección de CSS en tiempo de ejecución basada en IDs únicos por instancia para manejar estados complejos (hover, focus) que los estilos inline no pueden manejar bien o para evitar repetición excesiva.
*   **Implementación Técnica:**
    ```typescript
    // Ejemplo conceptual
    const badgeId = useId().replace(/:/g, '');
    useLayoutEffect(() => {
       // Inyectar <style> con reglas específicas para .badge-{badgeId}
       // usando los valores exactos de los tokens.
    }, [tokens]);
    ```

---

## 4. Guía de Implementación para Nuevos Componentes

Para refactorizar o crear un nuevo componente bajo v4, sigue estos pasos estrictos:

1.  **Definir Interfaces de Tokens:**
    *   En `DesignTokensProvider.tsx`, define `ComponentSizeTokens` y `ComponentStyleTokens`.
    *   Intégralo en la interfaz global `DesignTokens`.

2.  **Crear Generadores:**
    *   Implementa `generateComponentSizeTokens()` y `generateComponentStyleTokens()`.
    *   Implementa `generateAllComponentTokens()` que itere sobre todas las variantes y pre-calcule los estilos.
    *   **Crucial:** Asegúrate de que estas funciones sean puras y no dependan de hooks.

3.  **Integrar en el Provider:**
    *   Añade la llamada a `generateAllComponentTokens()` dentro de `generateAllDesignTokens`.

4.  **Refactorizar el Componente UI:**
    *   Elimina toda lógica de cálculo de colores (tinycolor, etc.) del componente.
    *   Usa `useDesignTokens()`.
    *   Implementa `useLayoutEffect` para inyección de CSS (Pattern Flex) si requiere pseudo-clases o estilos complejos.
    *   Usa `useMemo` para estilos estructurales inline simples.

## 5. Checklist de Calidad

*   [ ] ¿El componente funciona sin importar `tinycolor` u otras librerías de color directamente?
*   [ ] ¿Todas las variantes (solid, outline, subtle) están pre-calculadas en el Provider?
*   [ ] ¿El linter pasa sin warnings (`npm run lint`)?
*   [ ] ¿No hay dependencias circulares ni `ReferenceErrors`?

---

**Nota Final para la IA:** Si te encuentras "arreglando" el mismo error dos veces, DETENTE. Relee este documento. Verifica el archivo físico. La verdad está en el código, no en tu contexto previo.
