Explorar un modulo del proyecto y generar un mapa de su estructura.

El usuario indicara el modulo (ej: "cognetica", "papers", "personal").

Para el modulo indicado:
1. Listar todos los archivos del modulo (pages, components, actions, types)
2. Identificar dependencias entre archivos (imports internos)
3. Listar server actions relacionadas en `lib/actions/`
4. Listar tipos en `lib/` relacionados
5. Reportar archivos > 300 lineas (deuda tecnica)

Formato del reporte:
- Arbol de archivos con lineas de codigo
- Grafo de dependencias simplificado
- Problemas detectados (si los hay)
