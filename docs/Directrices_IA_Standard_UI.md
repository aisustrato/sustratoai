# Directrices para IA sobre el Ecosistema de Componentes "Standard UI"

**Atención, IA colaboradora:**

Este documento establece las reglas y la filosofía para interactuar con el ecosistema de componentes de interfaz de usuario (`Standard*`) de este proyecto. Seguir estas directrices es **mandatorio** para mantener la consistencia, mantenibilidad y coherencia del codebase.

## 1. Uso de Componentes Existentes

Antes de crear cualquier elemento de UI nuevo, tu primera y única opción debe ser utilizar los componentes `Standard*` que ya existen. Estos componentes han sido diseñados para ser la base de toda la interfaz de la aplicación.

*   **Obligatoriedad:** Siempre debes priorizar el uso de un componente `Standard*` si este cumple con los requisitos funcionales. No reinventes la rueda.
*   **Consulta la Documentación:** Para entender cómo usar cada componente, sus `props`, variantes y casos de uso, consulta la documentación detallada que se encuentra en el directorio `docs/standard-UI/`. Cada componente tiene su propio archivo `.md` (ej. `StandardButton.md`, `StandardInput.md`, etc.).

## 2. Creación de Nuevos Componentes `Standard`

Si, y solo si, después de un análisis exhaustivo, se determina que ningún componente `Standard*` existente puede satisfacer una nueva necesidad, se podrá crear uno nuevo. Sin embargo, este debe adherirse estrictamente a la filosofía y arquitectura del ecosistema.

### Filosofía del "Componente Orquestador"

Los componentes `Standard*` no son monolitos. Siguen un principio de **"soberanía del componente"**:

*   **Son Orquestadores Inteligentes:** Un componente (`.tsx`) es responsable de la **lógica, el estado y el comportamiento**, pero es agnóstico a los valores de estilo (colores, espaciados, etc.).
*   **Consumen Tokens:** Los estilos se obtienen de un sistema de "tokens" centralizado. La lógica de estilo vive en los archivos `component-tokens` (nuestro "Laboratorio de Color"). El componente recibe `props` como `colorScheme` o `size` y las usa para solicitar los tokens de estilo correspondientes.

### Pasos Obligatorios para Crear un Nuevo Componente:

1.  **Análisis y Comprensión:**
    *   Estudia a fondo al menos tres componentes `Standard*` existentes que sean similares en función (ej. si creas un input, analiza `StandardInput`, `StandardSelect`, `StandardTextarea`).
    *   Comprende la **jerga** (`colorScheme`, `styleType`, `size`, `colorShade`) y la estructura de `props`.
    *   Analiza su archivo de tokens asociado (ej. `generateStandardInputTokens.ts`) para entender cómo se definen y se consumen los estilos.

2.  **Desarrollo Coherente:**
    *   Crea tu nuevo componente siguiendo la misma estructura y patrones.
    *   Crea su propio generador de tokens si es necesario, manteniendo la misma estructura que los existentes.
    *   Asegúrate de que el nuevo componente sea flexible, reutilizable y se integre sin fricción con el resto del ecosistema.

3.  **Documentación:**
    *   Una vez creado el componente, es **obligatorio** que generes su correspondiente archivo de documentación en `docs/standard-UI/`, siguiendo el mismo formato y profundidad que los demás.

El objetivo es un ecosistema de UI predecible, consistente y fácil de mantener. Cualquier desviación de estas directrices resultará en un código de menor calidad y deberá ser corregido.
