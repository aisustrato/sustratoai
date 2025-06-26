# StandardDivider: Guía de Referencia Rápida

`StandardDivider` es un componente visual que se utiliza para separar grupos de contenido, mejorando la organización y la jerarquía visual de la página.

---

### 1. Uso Básico
Por defecto, el divisor se renderiza con un gradiente y un tamaño mediano. Se centra automáticamente en su contenedor.

```tsx
import { StandardDivider } from "@/components/ui/StandardDivider";

<article>
  <p>Este es el primer párrafo de contenido.</p>
  <StandardDivider />
  <p>Este es el segundo párrafo, claramente separado del primero.</p>
</article>
```

### 2. Variantes (`variant`)
Define el estilo visual del divisor. Puede ser un gradiente llamativo o un color sólido más sutil.

```tsx
// Variante con gradiente (por defecto)
<StandardDivider variant="gradient" />

// Variante con color sólido (basado en el tema)
<StandardDivider variant="solid" />
```

### 3. Tamaños (`size`)
Controla el grosor y la longitud del divisor.

```tsx
// Divisor pequeño y delgado
<StandardDivider size="sm" />

// Divisor mediano (por defecto)
<StandardDivider size="md" />

// Divisor grande y grueso
<StandardDivider size="lg" />
```

### 4. Personalización y Composición
Usa `className` para añadir márgenes y controlar el espaciado. Es ideal para separar secciones dentro de otros componentes como `StandardCard`.

```tsx
<StandardCard>
  <StandardCard.Header>
    <StandardCard.Title>Perfil de Usuario</StandardCard.Title>
  </StandardCard.Header>
  <StandardCard.Content>
    <p>Información del perfil...</p>
  </StandardCard.Content>
  
  <StandardDivider variant="solid" size="lg" className="my-6" />
  
  <StandardCard.Header>
    <StandardCard.Title>Configuración de la Cuenta</StandardCard.Title>
  </StandardCard.Header>
  <StandardCard.Content>
    <p>Ajustes de la cuenta...</p>
  </StandardCard.Content>
</StandardCard>
```
