# Manejo de Cookies en Next.js con Supabase

## Problemas Encontrados y Soluciones

### 1. Configuración Inconsistente de Cookies

**Problema:**
- Las cookies no se establecían correctamente entre el cliente y el servidor
- Configuración inconsistente entre el middleware y el cliente Supabase

**Solución:**
- Estandarización de la configuración de cookies en un solo lugar
- Uso de opciones consistentes en toda la aplicación:
  ```typescript
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
    httpOnly: false,
    domain: domain === 'localhost' ? undefined : domain
  }
  ```

### 2. Dominio en Entorno de Desarrollo

**Problema:**
- Las cookies no funcionaban correctamente en localhost
- Conflicto con el dominio en desarrollo vs producción

**Solución:**
- Manejo condicional del dominio:
  ```typescript
  const domain = isProduction ? 
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.replace('www.', '') : 
    'localhost';
  ```
- No establecer el dominio explícitamente en localhost

### 3. Sincronización de Cookies entre Cliente y Servidor

**Problema:**
- Las cookies establecidas en el middleware no se reflejaban correctamente en el cliente
- Inconsistencias al leer/escribir cookies

**Solución:**
- Sincronización explícita de cookies:
  ```typescript
  // En el middleware
  request.cookies.set(key, value);
  response.cookies.set({ name: key, value, ...cookieOptions });
  ```

### 4. Eliminación de Cookies

**Problema:**
- Las cookies no se eliminaban correctamente al cerrar sesión
- Inconsistencias entre el cliente y el servidor

**Solución:**
- Implementación consistente de removeItem:
  ```typescript
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    let cookieString = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (domain) cookieString += `; domain=${domain}`;
    document.cookie = cookieString;
  }
  ```

## Configuración Recomendada

### Middleware (middleware.ts)

```typescript
const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: isProduction,
  httpOnly: false,
  domain: domain === 'localhost' ? undefined : domain
};
```

### Cliente Supabase (supabase.ts)

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        if (typeof document === 'undefined') return null;
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`))
          ?.split('=')[1];
        return value ? decodeURIComponent(value) : null;
      },
      setItem: (key, value) => {
        if (typeof document === 'undefined') return;
        let cookieString = `${key}=${encodeURIComponent(value)}; path=/; samesite=lax`;
        if (domain) cookieString += `; domain=${domain}`;
        if (isProduction) cookieString += '; secure';
        document.cookie = cookieString;
      },
      removeItem: (key) => {
        if (typeof document === 'undefined') return;
        let cookieString = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        if (domain) cookieString += `; domain=${domain}`;
        document.cookie = cookieString;
      }
    }
  }
});
```

## Pruebas Recomendadas

1. **Inicio de Sesión**
   - Verificar que se establezcan las cookies correctamente
   - Comprobar que persistan al recargar la página

2. **Cierre de Sesión**
   - Confirmar que todas las cookies relacionadas con la sesión se eliminan
   - Verificar redirección a la página de login

3. **Navegación**
   - Probar rutas protegidas
   - Verificar que el acceso se deniegue sin autenticación

4. **Múltiples Pestañas**
   - Comprobar que la sesión se mantenga sincronizada entre pestañas
   - Verificar que el cierre de sesión en una pestaña afecte a las demás

## Notas Importantes

- En desarrollo, asegúrate de que tu aplicación se ejecute en `http://localhost:3000`
- Las cookies `httpOnly: false` son necesarias para el acceso desde JavaScript
- En producción, asegúrate de que tu dominio esté correctamente configurado
- Considera implementar monitoreo de sesiones para detectar problemas tempranos

## Solución de Problemas

Si encuentras problemas:

1. Revisa la consola del navegador en busca de errores
2. Verifica las cookies en las Herramientas de Desarrollo > Aplicación > Cookies
3. Prueba en modo incógnito para descartar problemas de caché
4. Revisa los logs del servidor para errores relacionados con la autenticación

Esta documentación debe servir como referencia para futuros desarrollos y para solucionar problemas similares que puedan surgir.
