## Requerimiento: BYOK (Bring Your Own Key) DeepSeek para Preclasificación

### Fecha: 2026-08-17

### Contexto

La auditoría funcional de preclasificación (`docs/preclasificacion-auditoria-funcional/`) señaló como deuda técnica que el modelo DeepSeek está "hardcodeado" — en realidad el hallazgo más preciso es que **la API key es única y global**: `lib/deepseek/api.ts` lee `process.env.DEEPSEEK_API_KEY` en las dos funciones cliente (`callDeepSeekAPI` legacy y `callDeepSeek` nueva), sin ningún concepto de "de quién es esta llamada".

Esa key global la consumen **13 archivos** distintos (preclasificación, traducción de papers, todo el pipeline de Cognetica Forense, rutas API). Dentro del módulo de preclasificación específicamente, hay **4 pares trigger/job-runner** en `lib/actions/preclassification-actions.ts` que llaman a `callDeepSeekAPI`:

| Trigger (recibe `user`/sesión) | Job runner en background | Línea aprox. de la llamada IA |
|---|---|---|
| `startSingleArticlePreclassification` (1156) | `runSingleArticlePreclassificationJob` (1640) | 1722 |
| `startInitialPreclassification` (1280) | `runPreclassificationJob` (1944) | 2048 |
| `startBatchTranslation` (2872) | `runTranslationJob` (3037) | 3257 |
| `startDiscrepancyReconciliation` (5737) | `runDiscrepancyReconciliationJob` (6039) | 6193 |

Los cuatro *ya* reciben `userId` como parámetro del trigger hacia el job runner (se usa hoy para auth/logging vía `createSupabaseServiceRoleClient`, que hace bypass de RLS). Eso significa que el punto de enganche para "resolver la key de este usuario" ya existe en los cuatro flujos — no hay que rediseñar cómo se pasa el usuario, solo qué se hace con él.

No existe hoy ninguna infraestructura de secretos por usuario: `users_profiles` no tiene campos para esto, y no hay uso previo de `pgcrypto` en las migraciones del proyecto.

Este requerimiento es la pieza que se implementa **antes** del harvester de OpenAlex — ambas features se entregan juntas al usuario de prueba (tester), pero BYOK primero porque destraba que cada investigador use su propia cuota/facturación de DeepSeek.

### Objetivo

Permitir que cada investigador configure su propia API key de DeepSeek desde su menú personal, y que los 4 flujos de preclasificación la usen en vez de la key global cuando esté disponible.

**Criterios de aceptación**

- En `/personal/configuracion` (ruta nueva, ya hay placeholder comentado en `app/personal/layout.tsx:35-38`), el usuario puede guardar, ver (enmascarada) y borrar su propia API key de DeepSeek.
- La key se guarda encriptada (pgcrypto, `pgp_sym_encrypt`/`pgp_sym_decrypt` con secreto de servidor vía env var, nunca persistido en la BD). Nunca se expone en texto plano al cliente después de guardada — solo un indicador "key configurada" + últimos 4 caracteres.
- Al disparar cualquiera de los 4 flujos, el job runner correspondiente resuelve la key del `userId` que lo disparó. Si el usuario tiene key propia configurada, se usa esa. Si no, cae al fallback: `process.env.DEEPSEEK_API_KEY` (global). Ningún usuario queda bloqueado por no configurar nada.
- Los otros 9 consumidores de `callDeepSeekAPI`/`callDeepSeek` (papers, Cognetica Forense, rutas API) **no se tocan** — siguen usando la key global sin cambios.
- Error claro y visible si la key propia configurada es inválida (DeepSeek responde 401) — no debe fallar en silencio ni caer automáticamente al fallback sin decírselo al usuario (regla de "no fallback disfraz").

### Archivos involucrados

**Nuevos:**
- `supabase/migrations/*_user_api_keys.sql` — extensión `pgcrypto` (si no está habilitada), tabla `user_api_keys` (`user_id`, `provider` — constraint a `'deepseek'` por ahora, `encrypted_key bytea`, `created_at`, `updated_at`), RLS: cada usuario solo ve/edita su propia fila. RPCs `encrypt_api_key(p_plain text, p_secret text) returns bytea` y `decrypt_api_key(p_encrypted bytea, p_secret text) returns text` usando `pgp_sym_encrypt`/`pgp_sym_decrypt`. **Requiere confirmación explícita antes de tocar `/supabase/migrations` y aplicación manual en Supabase Studio.**
- `lib/actions/user-api-keys-actions.ts` — `saveUserDeepSeekKey(rawKey)`, `getUserDeepSeekKeyStatus()` (devuelve `{ configured: boolean, last4: string | null }`, nunca la key completa), `deleteUserDeepSeekKey()`. Usan el cliente autenticado del usuario (RLS hace de guardia).
- `lib/deepseek/resolve-key.ts` — `resolveDeepSeekApiKey(userId: string, admin: SupabaseClient): Promise<{ apiKey: string; source: 'user' | 'global' }>`. Llamado desde dentro de los 4 job runners (que ya usan `service_role`, así que la consulta a `user_api_keys` va sin RLS ahí, igual que el resto del job).
- `app/personal/configuracion/page.tsx` — formulario: input tipo password para la key, botón guardar, estado actual (enmascarado / "no configurada"), botón eliminar. Componentes `Standard*`.

**Tocados:**
- `app/personal/layout.tsx` — descomentar y activar el item de nav "Configuración" (líneas 34-38).
- `lib/deepseek/api.ts` — `callDeepSeekAPI` y `callDeepSeek` deben aceptar un `apiKey` opcional en vez de leer siempre de `process.env` (si se pasa, se usa; si no, fallback a env var — así los otros 9 consumidores no cambian ni una línea).
- `lib/actions/preclassification-actions.ts` — en los 4 job runners, resolver la key con `resolveDeepSeekApiKey(userId, admin)` antes de las llamadas a `callDeepSeekAPI` y pasarla explícitamente.
- `lib/database.types.ts` — regenerar con `npm run update-types` tras la migración.

**No tocados:** `lib/papers/translate.ts`, todo `lib/actions/cognetica-forense-*-actions.ts`, `cognetica_forense_actions.ts`, `dimension-actions.ts`, rutas `app/api/*` — siguen con la key global.

### Plan de implementación

1. Diseñar y confirmar con el usuario el DDL exacto (tabla `user_api_keys`, RLS, RPCs de encriptación) y el nombre del env var del secreto de servidor (ej. `API_KEYS_ENCRYPTION_SECRET`). Aplicar manualmente en Supabase Studio. Regenerar tipos.
2. Modificar `lib/deepseek/api.ts`: agregar parámetro opcional `apiKeyOverride` a `callDeepSeekAPI(model, text, apiKeyOverride?)` y a `callDeepSeek(config)` (agregar campo opcional `apiKeyOverride` a `DeepSeekCallConfig` o pasar como segundo argumento — decidir en implementación cuál rompe menos las 13 llamadas existentes).
3. Construir `lib/deepseek/resolve-key.ts` con la lógica de resolución (consulta a `user_api_keys` + RPC de desencriptado + fallback a env var + logging del origen usado, alineado a la regla de "errores siempre visibles").
4. Construir `lib/actions/user-api-keys-actions.ts` con las 3 acciones (guardar/estado/eliminar), validando formato básico de key antes de guardar.
5. Construir `app/personal/configuracion/page.tsx` y activar el link en `app/personal/layout.tsx`.
6. Enganchar `resolveDeepSeekApiKey` en los 4 job runners de `preclassification-actions.ts`, pasando el resultado a cada llamada de `callDeepSeekAPI`.
7. `npm run build` + `npm run lint`.
8. Prueba manual: usuario sin key propia (debe usar global, sin fricción), usuario con key propia válida (debe usarla — verificar en logs/`ai_job_history` o similar cuál se usó), usuario con key propia inválida (debe fallar visible y claro, no fallback silencioso).

### Riesgos

- **Secreto de encriptación**: si `API_KEYS_ENCRYPTION_SECRET` se pierde o rota sin migrar los datos existentes, todas las keys guardadas quedan indesencriptables. Documentar claramente que rotar ese secreto requiere borrar y pedir a los usuarios que vuelvan a cargar su key.
- **`preclassification-actions.ts` ya tiene 7811 líneas**: tocar los 4 job runners exige entender bien el contexto de cada uno para no romper el flujo existente (repechaje, manejo de errores, `ai_job_history`). Cambios quirúrgicos, no reescritura.
- **Validación de key al guardar**: si no se hace una llamada de prueba real a DeepSeek al guardar, un usuario puede guardar una key inválida y solo descubrirlo cuando lance una preclasificación real (más lento, peor experiencia). A definir si vale la pena una llamada de test síncrona al guardar.
- **Fallback silencioso mal implementado**: hay que ser explícitos en logs/UI sobre qué key se usó en cada job (propia vs. global) para que no se genere una situación de "no sé por qué se cobró a mi cuenta y no a la mía" — coherente con la regla de "no fallback disfraz" del usuario.
- **Alcance acotado a 4 de 13 consumidores**: si más adelante se decide extender BYOK a papers/Cognetica Forense, va a requerir repetir el mismo patrón en esos archivos — no hay abstracción compartida más allá de `resolveDeepSeekApiKey`, que sí es reutilizable.
