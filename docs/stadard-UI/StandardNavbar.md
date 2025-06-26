# StandardNavbar: Guía de Referencia Rápida

`StandardNavbar` es el componente de navegación principal de la aplicación. Es una barra de navegación fija, responsiva, y altamente dinámica que se adapta al contexto del usuario y al tema visual de la aplicación.

---

### 1. Estructura y Composición

La barra de navegación está organizada en tres secciones principales:

1.  **Identidad de Marca (Izquierda)**: Muestra el `SustratoLogo` y el nombre de la aplicación. Es el punto de anclaje principal y un enlace a la página de inicio.
2.  **Navegación Principal (Centro)**: Contiene la lista de enlaces de navegación. Estos enlaces son dinámicos y pueden incluir submenús desplegables.
3.  **Controles de Usuario y Aplicación (Derecha)**: Incluye el `ThemeSwitcher` para cambiar entre modo claro/oscuro, el `FontThemeSwitcher` para ajustar la tipografía, y el `UserAvatar` con el menú de perfil del usuario.

### 2. Navegación Dinámica y Contextual

Una de las características más importantes de `StandardNavbar` es que **su contenido no es estático**. Los elementos del menú se generan en función del `proyectoActual` del usuario, obtenido a través del hook `useAuth`.

-   **Menús Modulares**: Secciones como "Entrevistas" o "Artículos" solo aparecen si los módulos correspondientes (`module_interviews`, `module_bibliography`) están activos en el proyecto actual.
-   **Adaptabilidad**: Esto asegura que los usuarios solo vean las opciones de navegación relevantes para su contexto de trabajo, simplificando la interfaz.

### 3. Submenús Desplegables

Los elementos de navegación de nivel superior pueden contener un `submenu` que se despliega al hacer clic. 

-   **Interactividad**: Un clic en un elemento con submenú lo abre o cierra. Un icono de chevron (`<ChevronDown />`) rota para indicar visualmente el estado.
-   **Cierre Automático**: El submenú se cierra si el usuario hace clic en cualquier otro lugar de la página.

### 4. Estados Visuales y Animaciones

`StandardNavbar` utiliza `framer-motion` para crear una experiencia de usuario fluida.

-   **Estado Activo**: El enlace correspondiente a la página actual (`pathname`) se resalta con el color primario del tema para una fácil identificación.
-   **Estado de Scroll**: Cuando el usuario se desplaza hacia abajo, la barra de navegación cambia sutilmente:
    -   El fondo se vuelve semitransparente con un efecto de desenfoque (`backdropFilter`).
    -   Aparece una sombra y un borde inferior para separarla del contenido.
-   **Animaciones**: Los elementos del menú y los submenús aparecen con animaciones suaves de entrada y visibilidad.

### 5. Theming (Adaptación al Tema)

La apariencia de la barra de navegación está completamente controlada por el sistema de temas a través de `generateStandardNavbarTokens`.

-   **Colores**: El color de fondo, texto, iconos, y logo se ajustan automáticamente al modo claro/oscuro y al `colorScheme` de la aplicación.
-   **Consistencia**: Esto garantiza que la navegación siempre se sienta integrada con el resto de la interfaz de usuario.

### 6. Uso y Posicionamiento

`StandardNavbar` está diseñado para ser un componente "singleton" (usado una sola vez) en el layout principal de la aplicación (por ejemplo, en `app/layout.tsx`). Se posiciona de forma fija (`sticky`) en la parte superior de la ventana gráfica, permaneciendo siempre visible.

```tsx
// Ejemplo conceptual de dónde viviría StandardNavbar
// En un archivo de layout principal (ej: app/(dashboard)/layout.tsx)

import { StandardNavbar } from '@/components/ui/StandardNavbar';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <StandardNavbar />
      <main className="pt-16"> {/* Padding para evitar que el contenido quede debajo de la navbar */}
        {children}
      </main>
    </div>
  );
}
```
