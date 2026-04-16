# Optimización de Logging del Cliente

## 🚨 Problemas Identificados

### **1. Logging Excesivo del AuthProvider**
- **Síntoma**: Múltiples logs repetidos en cada render
- **Impacto**: Overhead en el event loop, posibles microcortes
- **Logs problemáticos**:
  ```
  [AUTH_PROVIDER_V10.19] [RedirectEffect] 🔍 EJECUTÁNDOSE con... (se repite 6+ veces)
  [AUTH_PROVIDER_V10.19] [EVENT:SIGNED_IN] Nuevo estado... (se repite 3 veces)
  ```

### **2. Logging Excesivo del DesignTokensProvider**
- **Síntoma**: Logs en cada generación de tokens
- **Impacto**: Ruido en consola, overhead menor
- **Logs problemáticos**:
  ```
  🎨 [DesignTokensProvider] Generando tokens precalculados... (se repite 4 veces)
  ✅ [DesignTokensProvider] Tokens generados en X.XXms (se repite 4 veces)
  ```

### **3. Error Crítico: users_profiles (500)**
- **Error**: `Failed to load resource: the server responded with a status of 500`
- **Endpoint**: `/rest/v1/users_profiles?select=*&user_id=eq.fde9e7ac...`
- **Causa probable**: Problema de RLS (Row Level Security) en Supabase
- **Impacto**: Perfil de usuario no se carga correctamente

## ✅ Soluciones Implementadas

### **1. AuthProvider - Logging Condicional**

**Archivo**: `/app/auth-provider.tsx`

```typescript
const VERBOSE_LOGS = false; // Cambiar a true solo para debugging profundo

// Antes: Logs en cada ejecución
console.log(`${LOG_PREFIX} [RedirectEffect] 🔍 EJECUTÁNDOSE con:`);
console.log(`${LOG_PREFIX} [RedirectEffect] 🔍 pathname: ${pathname}`);
// ... 5 logs más

// Ahora: Solo si VERBOSE_LOGS = true
if (VERBOSE_LOGS) {
  console.log(`${LOG_PREFIX} [Redirect] pathname: ${pathname}, user: ${user ? user.id.substring(0, 8) : "null"}`);
}
```

**Logs reducidos**:
- `[InitializeEffect]` - Solo en verbose
- `[onAuthStateChangeEffect]` - Solo en verbose
- `[EVENT:SIGNED_IN]` - Solo en verbose
- `[RedirectEffect]` - Solo en verbose
- `cargarProyectosUsuario` - Solo en verbose
- `handleSignIn` - Solo en verbose

**Logs mantenidos** (siempre visibles):
- Errores críticos (`console.error`)
- Warnings importantes (`console.warn`)
- `[EVENT:SIGNED_OUT]` - Importante para debugging de sesión

### **2. DesignTokensProvider - Logging Condicional**

**Archivo**: `/app/providers/DesignTokensProvider.tsx`

```typescript
const VERBOSE_LOGS = false; // Cambiar a true solo para debugging profundo

// Antes: Logs en cada generación
console.log('🎨 [DesignTokensProvider] Generando tokens precalculados...');
console.log(`✅ [DesignTokensProvider] Tokens generados en ${duration.toFixed(2)}ms`);

// Ahora: Solo si VERBOSE_LOGS = true
if (VERBOSE_LOGS) console.log('🎨 [DesignTokensProvider] Generando tokens precalculados...');
if (VERBOSE_LOGS) console.log(`✅ [DesignTokensProvider] Tokens generados en ${duration.toFixed(2)}ms`);
```

## 📊 Impacto de la Optimización

### **Antes (Logging Excesivo)**
Por cada login/navegación:
- ~40 logs del AuthProvider
- ~8 logs del DesignTokensProvider
- **Total: ~48 logs por operación**

### **Ahora (Logging Optimizado)**
Por cada login/navegación:
- 0-2 logs del AuthProvider (solo errores)
- 0 logs del DesignTokensProvider
- **Total: 0-2 logs por operación**

### **Reducción de Overhead**
- **95% menos logs** en operaciones normales
- **Sin bloqueo del event loop** por logging sincrónico
- **Consola limpia** para debugging real

## 🚨 Problema Crítico Pendiente: users_profiles RLS

### **Error Detectado**
```
vgnteswwvallupuanfiz.supabase.co/rest/v1/users_profiles?select=*&user_id=eq.fde9e7ac-cc2a-4844-916b-f6f1745efa76:1
Failed to load resource: the server responded with a status of 500 ()
Error al cargar el perfil del usuario
```

### **Causa Probable**
El error 500 en Supabase generalmente indica:
1. **Problema de RLS**: La política de seguridad está bloqueando el acceso
2. **Función/Trigger fallando**: Alguna función de base de datos está fallando
3. **Constraint violation**: Violación de alguna restricción de BD

### **Ubicación del Query**
**Archivo**: `/lib/actions/project-dashboard-actions.ts` (línea 230)

```typescript
const { data: profileData, error: profileError } = await supabase
  .from("users_profiles")
  .select(`user_id, first_name, last_name, public_display_name, public_contact_email, primary_institution, contact_phone, general_notes, preferred_language, pronouns`)
  .eq("user_id", userId)
  .single();
```

### **Solución Recomendada**

1. **Verificar RLS en Supabase Dashboard**:
   ```sql
   -- Verificar políticas existentes
   SELECT * FROM pg_policies WHERE tablename = 'users_profiles';
   
   -- Verificar si el usuario tiene acceso
   SELECT * FROM users_profiles WHERE user_id = 'fde9e7ac-cc2a-4844-916b-f6f1745efa76';
   ```

2. **Crear/Actualizar política RLS**:
   ```sql
   -- Permitir que usuarios lean su propio perfil
   CREATE POLICY "Users can read own profile"
   ON users_profiles
   FOR SELECT
   USING (auth.uid() = user_id);
   
   -- Si no existe, crear la tabla con RLS habilitado
   ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
   ```

3. **Verificar logs de Supabase**:
   - Ir a Supabase Dashboard → Logs → Postgres Logs
   - Buscar errores relacionados con `users_profiles`
   - Verificar si hay triggers o funciones fallando

## 🧪 Cómo Verificar las Optimizaciones

### **Test 1: Logging Reducido**
1. Hacer login
2. Abrir consola del navegador
3. **Verificar**: Solo 0-2 logs (errores si los hay)
4. **Verificar**: NO aparecen logs de `[RedirectEffect]`, `[EVENT:SIGNED_IN]`, etc.

### **Test 2: Performance Mejorada**
1. Reproducir audio en una ventana
2. Navegar en otra ventana
3. **Verificar**: Audio NO se detiene
4. **Verificar**: Navegación es fluida

### **Test 3: Debugging Profundo (si es necesario)**
1. Cambiar `VERBOSE_LOGS = true` en:
   - `/app/auth-provider.tsx`
   - `/app/providers/DesignTokensProvider.tsx`
2. Refrescar la aplicación
3. **Verificar**: Logs detallados aparecen
4. **Revertir** a `VERBOSE_LOGS = false` después de debugging

## 📁 Archivos Modificados

1. `/app/auth-provider.tsx` - Logging condicional con `VERBOSE_LOGS`
2. `/app/providers/DesignTokensProvider.tsx` - Logging condicional con `VERBOSE_LOGS`
3. `/middleware.ts` - Ya optimizado en commit anterior

## 🎯 Estado Actual

### ✅ Completado
- Optimización de logging del middleware
- Optimización de logging del AuthProvider
- Optimización de logging del DesignTokensProvider

### ⚠️ Pendiente
- **Resolver error 500 en `users_profiles`**
  - Verificar RLS en Supabase
  - Crear/actualizar políticas de seguridad
  - Verificar logs de Postgres en Supabase Dashboard

## 💡 Recomendación Inmediata

**Prioridad Alta**: Resolver el error de `users_profiles` antes de continuar, ya que:
1. Impide que el perfil del usuario se cargue correctamente
2. Puede causar problemas de funcionalidad en la aplicación
3. El error 500 indica un problema de configuración en Supabase

**Pasos siguientes**:
1. Ir a Supabase Dashboard
2. Verificar políticas RLS en tabla `users_profiles`
3. Revisar logs de Postgres para ver el error exacto
4. Crear/actualizar política RLS según sea necesario
