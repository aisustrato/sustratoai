# StandardPageTitle: Guía de Referencia Rápida

`StandardPageTitle` es un componente de encabezado diseñado para ser colocado en la parte superior del área de contenido de una página. Establece el contexto para el usuario, proporcionando un título, ayudas a la navegación y acciones relevantes.

---

### 1. Uso Básico
En su forma más simple, el componente muestra un título y un subtítulo opcional.

```tsx
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";

<StandardPageTitle 
  title="Mi Perfil"
  subtitle="Gestiona tu información personal y de cuenta."
/>
```

### 2. Con Icono Principal (`mainIcon`)
Agrega un icono grande junto al título para dar una identidad visual clara a la página.

```tsx
import { UserCircle } from "lucide-react";

<StandardPageTitle 
  title="Mi Perfil"
  subtitle="Gestiona tu información personal y de cuenta."
  mainIcon={UserCircle}
/>
```

### 3. Ayudas a la Navegación

#### Migas de Pan (`breadcrumbs`)
Proporciona una ruta de navegación para páginas anidadas. El último elemento no tiene `href` y se muestra como texto plano.

```tsx
const breadcrumbs = [
  { label: "Inicio", href: "/" },
  { label: "Configuración", href: "/settings" },
  { label: "Notificaciones" },
];

<StandardPageTitle 
  title="Notificaciones"
  breadcrumbs={breadcrumbs}
/>
```

#### Botón de Regreso (`showBackButton`)
Útil para páginas que son un paso en un flujo. Puedes pasar un booleano o un objeto para personalizar el enlace y el texto.

```tsx
// Simple
<StandardPageTitle title="Editar Usuario" showBackButton={true} />

// Personalizado
<StandardPageTitle 
  title="Paso 2 de 3"
  showBackButton={{ href: "/paso-1", label: "Volver al Paso 1" }}
/>
```

### 4. Acciones de Página (`actions`)
El slot `actions` te permite añadir botones u otros controles en el lado derecho del encabezado.

```tsx
import { StandardButton } from "@/components/ui/StandardButton";
import { PlusCircle } from "lucide-react";

<StandardPageTitle 
  title="Mis Proyectos"
  actions={
    <StandardButton leftIcon={PlusCircle}>
      Crear Proyecto
    </StandardButton>
  }
/>
```

### 5. Ejemplo Completo
Combinando todas las props para un encabezado de página rico y funcional.

```tsx
import { LayoutDashboard, PlusCircle, Download } from "lucide-react";

<StandardPageTitle
  title="Dashboard de Ventas"
  subtitle="Resumen de métricas clave del último trimestre."
  mainIcon={LayoutDashboard}
  breadcrumbs={[
    { label: "Inicio", href: "/" },
    { label: "Analíticas" },
  ]}
  actions={
    <div className="flex items-center gap-2">
      <StandardButton styleType="outline">Exportar</StandardButton>
      <StandardButton leftIcon={PlusCircle}>Nuevo Reporte</StandardButton>
    </div>
  }
/>
```
