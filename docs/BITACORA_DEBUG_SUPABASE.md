# Bitácora de Diagnóstico e Intentos (Supabase & Conectividad)
Fecha: 27 Nov 2025
Estado: CRÍTICO (Infraestructura inestable)

## 1. El Problema Raíz
El proyecto en Supabase (`nnzjmsfllrdqxlrzrhur`) presenta un estado inconsistente tras ser restaurado de una pausa por inactividad.
- **Base de Datos:** ✅ Healthy (Los datos están seguros).
- **Servicios de API (PostgREST):** ❌ Unhealthy (No se puede conectar por API/Fetch).
- **Servicios de Autenticación (Auth):** ❌ Unhealthy (No se puede hacer Login).
- **Conectividad Local:** Intermitente por conflictos de DNS/VPN (ProtonVPN).

## 2. Intentos Realizados y Resultados

### A. Generación de Tipos (`gen types`)
- **Intento:** Vía `project-id` estándar.
  - **Resultado:** Fallo. Error: `failed to determine PostgREST version`. (Causa: El servicio PostgREST está caído en Supabase).
- **Intento:** Vía Conexión Directa (`db-url`).
  - **Resultado:** Fallo. Conflictos de IPv4/IPv6 y credenciales desincronizadas (`Tenant not found`).
- **Solución Aplicada:** `git restore lib/database.types.ts`. Recuperamos el archivo original que sí funciona. **ESTE TEMA ESTÁ CERRADO.**

### B. Conexión y Login
- **Síntoma:** `net::ERR_NAME_NOT_RESOLVED` y `Unknown host`.
  - **Causa:** Tu computadora no logra traducir `supabase.co` a una IP real.
  - **Factor:** ProtonVPN modifica los DNS. Al apagarla, a veces la red se queda "ciega".
- **Síntoma:** Login falla aunque haya red.
  - **Causa:** El servicio `Auth` en Supabase está en rojo ("Unhealthy"). Aunque tu código de login esté perfecto, el servidor de Supabase no está procesando la entrada.

## 3. Estado Actual del Código
- El código de Next.js (`page.tsx`, `auth-provider.tsx`) es correcto.
- Las variables de entorno (`.env.local`) son correctas.
- **NO TOCAR MÁS CÓDIGO.** El problema es de infraestructura y red.

## 4. Estrategia de Salida
1. **Estabilizar Red Local:** Mantener VPN encendida si es la única forma de resolver DNS.
2. **Revivir Supabase:** Forzar un reinicio completo del proyecto (Pause/Restore) para poner los servicios en verde.
3. **Validación:** Solo probar login cuando los 4 indicadores de Supabase estén en verde.
