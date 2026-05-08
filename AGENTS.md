# sustrato.ai — Sistema de Agentes# sustrato.ai — Sistema de Agentes v2

## Stack

- Next.js 14 App Router + TypeScript estricto
- Supabase (Postgres remoto + Auth)
- Vercel deploy
- Tailwind para layout, sistema Standard* para componentes UI

---

## Los 5 agentes

| Agente | Modelo | Escribe | Git | Cuándo |
|--------|--------|---------|-----|--------|
| `ingeniero` | DeepSeek V4-Pro | ❌ | ❌ | Arquitectura, diagnóstico, plan |
| `implementador` | Qwen3.6-Plus | ✅ código | ❌ | Implementar según plan aprobado |
| `estilista` | DeepSeek V4-Flash | ✅ app/+components/ | ❌ | Mejoras visuales, variantes, tema |
| `practicante` | DeepSeek V4-Flash | ✅ docs/ libre, resto ask | ❌ | Explorar, persistir planes, cambios chicos |
| `gitero` | DeepSeek V4-Flash | ❌ código | ✅ único | Todo lo que sea git |

**Practicante es subagente**: el Ingeniero puede delegarle búsquedas
vía Task tool. Rodolfo puede invocarlo directamente con `@practicante`.

---

## Flujo estándar de una tarea

```
1. @ingeniero   → analiza, produce plan destilado
                  (puede delegar búsquedas a @practicante si necesita)
2. Rodolfo      → aprueba o itera
3. @practicante → persiste plan en docs/<modulo>/YYYY-MM-DD_<desc>.md
4. @implementador → ejecuta el plan
5. @gitero      → commit cuando Rodolfo da el OK
```

Para cambios visuales: directo a `@estilista`.
Para cambios chicos no visuales: directo a `@practicante`.
Para git en cualquier momento: `@gitero`.

---

## 🔔 Regla git — recordatorio para todos los agentes

**Al iniciar cualquier sesión de trabajo**, ejecuta silenciosamente:
```bash
git log --oneline -1 --format="%cr"
```

Si el último commit fue hace **más de 1 día**, incluye esta línea
al inicio de tu primera respuesta:

> 💾 *Llevas más de un día sin commitear — cuando termines esta tarea,
> recuerda pedirle al @gitero que guarde el trabajo.*

Solo una vez por sesión. No lo repitas en cada mensaje.
Es un recordatorio amable, no una advertencia de error.

---

## Protocolo de componentes Standard*

Antes de tocar cualquier componente `Standard*`:

```
1. Busca en .opencode/skills/standard-*.md
   → existe: úsala como referencia de API y variantes
   → no existe: ve al código fuente del componente

2. Si lo que necesitas no está cubierto por la skill ni el código:
   PARA y pregunta antes de tocar el componente
   "No encuentro cómo hacer X con StandardY — ¿procedo o esperamos?"

3. Nunca Tailwind inline sobre Standard*
4. Nunca CSS que pelee con las props del componente
5. Variante nueva = propuesta + aprobación de Rodolfo primero
```

Cómo generar una skill nueva:
```
@analizador-componentes app/showroom/StandardButton/page.tsx
```

---

## Regla de corrupción de archivos

Si cualquier agente corrompe un archivo:
1. Se detiene inmediatamente
2. NO ejecuta git ni intenta arreglarlo solo
3. Avisa con exactitud y espera instrucción
4. Rodolfo decide: Cmd+Z, git checkout, o nueva instrucción

---

## Las 4 reglas de oro

**1. Errores siempre visibles**
Ningún catch vacío. Todo error se loguea con contexto:
`console.error('[modulo:funcion]', err)`

**2. Código modular**
Archivos > 300 líneas son deuda técnica. Señalar, no ignorar.

**3. Estilos sin conflictos**
Tailwind para layout. Standard* con sus variantes propias.
No overrides inline sobre componentes que ya tienen su sistema.

**4. Lint limpio en entregas**
`npm run lint` sin warnings antes de declarar listo.

---

## Documentación de planes

Los planes viven en `docs/<modulo>/YYYY-MM-DD_<descripcion>.md`.
El Practicante los crea cuando el Ingeniero o Rodolfo lo piden.
El Implementador los lee antes de empezar.
El Gitero puede commitearlos junto con el código relacionado.
