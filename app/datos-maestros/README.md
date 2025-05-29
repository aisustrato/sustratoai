# Módulo de Datos Maestros

Este módulo contiene las vistas y funcionalidades para gestionar datos maestros del sistema, como investigadores, instituciones y cargos.

## Estructura del Módulo

```
/datos-maestros
├── layout.tsx                # Layout con sidebar para todo el módulo
├── README.md                 # Este archivo de documentación
└── /investigadores           # Submódulo de investigadores
    ├── page.tsx              # Página principal de investigadores
    └── /components           # Componentes específicos de investigadores
        ├── tabla-investigadores.tsx  # Tabla para mostrar investigadores
        └── formulario-investigador.tsx # Formulario para crear/editar investigadores
```

## Submódulo: Investigadores

### Descripción
Gestiona los perfiles de investigadores asociados a un proyecto específico. Permite visualizar, agregar, editar y eliminar investigadores.

### Funcionalidades
- **Listado de investigadores**: Muestra todos los investigadores del proyecto actual.
- **Control de acceso**: Sólo los usuarios con el permiso `asignar_investigadores = true` en su cargo pueden agregar, editar o eliminar investigadores.
- **Formulario de creación/edición**: Permite gestionar la información del investigador, incluyendo:
  - Datos personales (nombre, apellido, institución, teléfono)
  - Asignación de cargo
  - Vinculación con usuario de auth mediante email
  - Notas adicionales

### Tablas de Base de Datos Utilizadas
- `perfil_investigador`: Contiene el vínculo entre usuarios y proyectos, con la información de cada investigador.
- `cargo`: Lista de cargos posibles en el proyecto, incluye el permiso `asignar_investigadores`.
- `auth.users`: Solo accedida indirectamente a través de funciones RPC seguras (`get_user_by_email`, `get_user_by_id`).

### Endpoints Personalizados
- `get_user_by_email`: Obtiene un usuario por su email.
- `get_user_by_id`: Obtiene un usuario por su ID.
- `check_user_has_profile`: Verifica si un usuario ya tiene perfil en un proyecto.

## Notas de Implementación
- Se utiliza un ID de proyecto fijo por ahora (se hará dinámico en el futuro).
- Se implementan componentes personalizados según los showrooms del proyecto.
- Los permisos de usuario se verifican desde el cliente mediante consultas a la base de datos.
