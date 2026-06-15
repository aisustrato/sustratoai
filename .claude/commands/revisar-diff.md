Revisar todos los cambios pendientes en git (staged + unstaged + untracked) y generar un reporte.

1. Ejecutar `git status` y `git diff` (staged y unstaged)
2. Para cada archivo modificado, analizar:
   - Que cambio y por que (inferir del contexto)
   - Si introduce warnings de lint o errores de tipos
   - Si toca zonas protegidas (migrations, Standard*, produccion)
3. Agrupar cambios por unidad logica (candidatos a commits separados)
4. Sugerir mensajes de commit en espanol para cada grupo
5. Alertar si hay algo que NO deberia commitearse (.env, secrets, archivos temporales)
