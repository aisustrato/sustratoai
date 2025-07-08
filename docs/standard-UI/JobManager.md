# JobManager Componente

## Visión General
El componente `JobManager` es un sistema de gestión de tareas en segundo plano que se muestra en una interfaz de usuario fija en la esquina inferior derecha de la pantalla. Permite a los usuarios monitorear y gestionar tareas asíncronas sin interrumpir su flujo de trabajo principal.

## Características Principales

- **Interfaz no intrusiva**: Se muestra como un panel deslizable en la esquina inferior derecha
- **Estado persistente**: Mantiene su estado de visibilidad al navegar entre rutas
- **Fácil integración**: Provee un hook personalizado para interactuar con el componente
- **Diseño responsivo**: Se adapta a diferentes tamaños de pantalla
- **Accesibilidad**: Incluye soporte para teclado y lectores de pantalla

## Instalación

El componente ya está integrado en el layout principal de la aplicación. No se requiere instalación adicional.

## Uso Básico

### 1. Proveedor del Contexto

El `JobManagerProvider` debe envolver tu aplicación en el archivo raíz (`app/layout.tsx`):

```tsx
import { JobManager } from '@/app/components/ui/JobManager';
import { JobManagerProvider } from '@/app/contexts/JobManagerContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <JobManagerProvider>
          {children}
          <JobManager />
        </JobManagerProvider>
      </body>
    </html>
  );
}
```

### 2. Uso del Hook

Importa y utiliza el hook `useJobManager` en cualquier componente para controlar la visibilidad:

```tsx
import { useJobManager } from '@/app/contexts/JobManagerContext';

export function MiComponente() {
  const { isJobManagerVisible, showJobManager, hideJobManager } = useJobManager();
  
  return (
    <div>
      <button onClick={() => isJobManagerVisible ? hideJobManager() : showJobManager()}>
        {isJobManagerVisible ? 'Ocultar Job Manager' : 'Mostrar Job Manager'}
      </button>
    </div>
  );
}
```

## API del Hook

### `useJobManager()`

Retorna un objeto con las siguientes propiedades y métodos:

| Propiedad/Método      | Tipo       | Descripción |
|----------------------|------------|-------------|
| `isJobManagerVisible` | `boolean`  | Indica si el JobManager está visible |
| `showJobManager`      | `() => void` | Muestra el JobManager |
| `hideJobManager`      | `() => void` | Oculta el JobManager |
| `toggleJobManager`    | `() => void` | Alterna la visibilidad del JobManager |

## Ejemplo de Integración en una Página

```tsx
'use client';

import { useJobManager } from '@/app/contexts/JobManagerContext';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';

export default function MiPagina() {
  const { isJobManagerVisible, toggleJobManager } = useJobManager();
  
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Mi Página"
        actions={
          <StandardButton 
            onClick={toggleJobManager}
            leftIcon={isJobManagerVisible ? 'EyeOff' : 'Eye'}
          >
            {isJobManagerVisible ? 'Ocultar' : 'Mostrar'} Tareas
          </StandardButton>
        }
      />
      
      {/* Contenido de la página */}
    </div>
  );
}
```

## Personalización

### Estilos

El componente utiliza las clases de Tailwind CSS para los estilos. Puedes personalizar la apariencia modificando las clases en el archivo del componente.

### Iconos

El componente utiliza los iconos de la biblioteca `lucide-react`. Asegúrate de importar los iconos necesarios.

## Buenas Prácticas

1. **Uso del Botón de Alternancia**: Siempre muestra claramente al usuario cómo mostrar/ocultar el JobManager.
2. **Estado de Visibilidad**: Usa el estado `isJobManagerVisible` para ajustar la interfaz si es necesario.
3. **Accesibilidad**: El componente ya incluye atributos ARIA para mejorar la accesibilidad.

## Solución de Problemas Comunes

### El JobManager no se muestra
- Verifica que el `JobManagerProvider` esté correctamente configurado en el layout raíz.
- Asegúrate de que el hook `useJobManager` esté siendo llamado dentro del árbol de componentes envuelto por `JobManagerProvider`.

### Errores de Importación
- Verifica que las rutas de importación sean correctas según la estructura de tu proyecto.

## Compatibilidad

- React 18+
- Next.js 13+ (App Router)
- Tailwind CSS 3.0+
- TypeScript 4.9+

## Licencia

MIT
