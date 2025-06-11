Prompt para Agente VSCode: Actualización de Tipo Global
Este prompt sigue el formato que exploramos para interactuar con agentes de IA en el editor.


Archivos a modificar:
Todos los archivos de componentes Standard previamente refactorizados en el directorio components/ui/.

Instrucción:
Realiza la siguiente refactorización de tipos en los archivos especificados:

Elimina cualquier importación de ProCardVariant. Típicamente se verá así:
import type { ProCardVariant } from '@/components/ui/pro-card';

Añade la importación de nuestro nuevo tipo ColorSchemeVariant en los archivos que lo necesiten:
import type { ColorSchemeVariant } from '@/lib/theme/ColorToken';

Reemplaza todas las apariciones del tipo ProCardVariant por ColorSchemeVariant.

IMPORTANTE: No modifiques ninguna otra lógica ni código en estos archivos. Solo aplica este cambio de tipado.