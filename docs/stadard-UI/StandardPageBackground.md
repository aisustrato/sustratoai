# StandardPageBackground: Guía de Referencia Rápida

`StandardPageBackground` es un componente contenedor que envuelve el contenido de una página para proporcionarle un fondo visualmente atractivo, consistente y temático. Puede ser desde un color sólido hasta un fondo animado con efectos ambientales.

---

### 1. Uso Básico
Para usarlo, simplemente envuelve el layout principal de tu página con este componente. Se encargará de crear una capa de fondo fija que se sitúa detrás de todo tu contenido.

```tsx
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function MiPagina() {
  return (
    <StandardPageBackground>
      {/* El resto de los componentes de tu página aquí */}
      <h1>Contenido de la Página</h1>
    </StandardPageBackground>
  );
}
```

### 2. Variantes (`variant`)
La prop `variant` controla el estilo base del fondo.

-   **`minimal` (por defecto)**: Aplica un fondo de color sólido y limpio, definido por los tokens del tema actual. Ideal para páginas con mucho contenido o que requieren máxima concentración.
-   **`gradient`**: Aplica un fondo con un gradiente de color sutil, también basado en el tema.
-   **`ambient`**: Utiliza el mismo fondo de gradiente que `gradient`, pero activa efectos de animación adicionales para una experiencia más inmersiva.

```tsx
// Fondo minimalista
<StandardPageBackground variant="minimal">
  {/* ... */}
</StandardPageBackground>

// Fondo con gradiente y animaciones de luz
<StandardPageBackground variant="ambient">
  {/* ... */}
</StandardPageBackground>
```

### 3. Animaciones

#### Control General (`animate`)
La prop `animate` es un interruptor maestro para todas las animaciones. Por defecto es `true`. Si se establece en `false`, todos los efectos de movimiento se desactivan, mostrando solo el fondo estático.

```tsx
// Fondo de gradiente sin ninguna animación
<StandardPageBackground variant="gradient" animate={false}>
  {/* ... */}
</StandardPageBackground>
```

#### Efecto de Burbujas (`bubbles`)
Cuando la prop `bubbles` se establece en `true`, el componente genera una serie de círculos de colores, grandes y semitransparentes, que flotan y se mueven lentamente por el fondo. Esto crea un ambiente dinámico y relajante.

```tsx
// Fondo minimalista con el efecto de burbujas animadas
<StandardPageBackground variant="minimal" bubbles={true}>
  {/* ... */}
</StandardPageBackground>
```

### 4. Integración con el Sistema de Temas
La apariencia de `StandardPageBackground` está 100% controlada por el tema activo (`useTheme`). Todos los colores y gradientes se obtienen de los `appColorTokens`, asegurando que el fondo siempre coincida con la paleta de colores de la aplicación, tanto en modo claro como oscuro.
