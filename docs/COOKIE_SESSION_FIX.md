# Fix: Error de Cookie de Sesión "NO ENCONTRADA"

## 🚨 Problema Identificado

```
[MIDDLEWARE_SSR_V2]:5871 cookies.get('sb-vgnteswwvallupuanfiz-auth-token.4'): NO ENCONTRADA
[MIDDLEWARE_SSR_V2]:5871 SIN SESIÓN en middleware para /cognetica/...
```

El middleware de autenticación no encontraba la cookie de sesión de Supabase, causando redirecciones incorrectas a `/login` incluso para usuarios autenticados.

## 🔍 Causa Raíz

**Conflicto de clientes de Supabase duplicados** con configuraciones de cookies incompatibles:

1. **`@/app/auth/client.ts`**: Usaba `createBrowserClient` de `@supabase/ssr` **sin configuración explícita de cookies**
2. **`@/lib/supabase.ts`**: Exportaba otro cliente con `createClient` de `@supabase/supabase-js` con **storage adapter personalizado**
3. **Middleware**: Usaba `createServerClient` de `@supabase/ssr`

### El Problema Específico

- Al hacer login, el cliente creaba cookies en un formato
- El middleware buscaba cookies en otro formato (con sufijo `.4`)
- Resultado: **Cookies no encontradas** → Redirección a `/login`

## ✅ Solución Implementada

### **1. Configuración Explícita de Cookies en Cliente Browser**

**Archivo**: `/app/auth/client.ts`

```typescript
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return null;
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        return value ? decodeURIComponent(value) : null;
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return;
        let cookieString = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax`;
        if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
        if (process.env.NODE_ENV === 'production') cookieString += '; secure';
        document.cookie = cookieString;
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }
);
```

### **2. Deprecación del Cliente Duplicado**

**Archivo**: `/lib/supabase.ts`

```typescript
// ⚠️ DEPRECADO: Este cliente causaba conflictos de cookies
export const supabase_DEPRECATED = createClient<Database>(...);

// ✅ Re-exportar el cliente oficial de @/app/auth/client.ts
export { supabase } from '@/app/auth/client'
```

### **3. Unificación de Configuración**

Ahora **todos los clientes** usan la misma configuración de cookies:
- ✅ Cliente browser: `createBrowserClient` con cookies explícitas
- ✅ Cliente servidor: `createServerClient` con cookies de Next.js
- ✅ Middleware: `createServerClient` con cookies de Next.js

## 🎯 Resultado Esperado

1. **Login exitoso**: Cookies se crean correctamente
2. **Middleware encuentra cookies**: Sin redirecciones incorrectas
3. **Sesión persistente**: Usuario permanece autenticado entre páginas
4. **Sin conflictos**: Un solo cliente de Supabase en el navegador

## 🧪 Cómo Probar

1. **Limpiar cookies existentes**:
   - Abrir DevTools → Application → Cookies
   - Eliminar todas las cookies de `localhost`

2. **Hacer login**:
   - Ir a `/login`
   - Ingresar credenciales
   - Verificar que se crean cookies `sb-vgnteswwvallupuanfiz-auth-token`

3. **Navegar a ruta protegida**:
   - Ir a `/cognetica/[id]`
   - Verificar que NO redirige a `/login`
   - Verificar en consola: `SESIÓN VÁLIDA en middleware`

4. **Verificar persistencia**:
   - Refrescar la página
   - Verificar que la sesión se mantiene

## 📊 Logs Esperados (Exitosos)

```
[MIDDLEWARE_SSR_V2]:xxxx cookies.get('sb-vgnteswwvallupuanfiz-auth-token'): ENCONTRADA
[MIDDLEWARE_SSR_V2]:xxxx Valor de cookie sb-vgnteswwvallupuanfiz-auth-token (primeros 20 chars): base64...
[MIDDLEWARE_SSR_V2]:xxxx SESIÓN VÁLIDA en middleware. User: 5a4d8769. Path: /cognetica/...
```

## 🔧 Archivos Modificados

1. `/app/auth/client.ts` - Configuración explícita de cookies
2. `/lib/supabase.ts` - Deprecación de cliente duplicado y re-export del oficial

## 💡 Lección Aprendida

**CRÍTICO**: Nunca tener múltiples clientes de Supabase con configuraciones de cookies diferentes. Esto causa:
- Cookies incompatibles entre cliente y servidor
- Sesiones que no se persisten correctamente
- Redirecciones incorrectas en el middleware
- Experiencia de usuario rota

**Solución**: Un solo cliente oficial, re-exportado desde un punto central si es necesario para compatibilidad.
