# Bitácora de Éxito: La Resurrección de Sustrato AI (Migración Supabase V3)

**Fecha:** 27 Noviembre 2025  
**Estado:** ✅ Misión Cumplida  
**Contexto:** Recuperación de un sistema complejo (Sustrato AI) desde una instancia Legacy ("La Momia") hacia un nuevo entorno Supabase, superando barreras de autenticación, lógica de negocio perdida y orfandad de datos.

---

## 1. Filosofía del Éxito: "Co-Creación Fractal"

Lo que diferenció esta sesión de un intento fallido fue el cambio de paradigma:
*   **Del Zero-Shot al Holístico:** Dejamos de intentar "parchar" el error inmediato (lineal) y pasamos a entender la estructura completa (fractal).
*   **Respeto al Legacy:** Aceptamos que no podíamos "adivinar" la arquitectura. Ante la duda, volvimos a la fuente ("La Momia") para extraer la verdad (definiciones exactas de SQL).
*   **Estrategia del Heredero:** En lugar de luchar contra los datos viejos, creamos un nuevo usuario y le "heredamos" legalmente toda la propiedad intelectual existente.

---

## 2. Secuencia Lógica de la Solución

### Fase 1: El Asalto al Castillo (Auth & Acceso)
El sistema de login tradicional estaba roto (envío de correos, confirmaciones).
*   **Solución:** Inyección Directa SQL.
*   **Técnica:** Insertamos el usuario manualmente en la tabla `auth.users` de Supabase, con contraseña pre-encriptada y email confirmado.
*   **Lección:** Cuando la puerta principal (Frontend Auth) está trabada, entra por la ventana (SQL Editor).

### Fase 2: El Trasplante de Cerebro (Funciones & RPCs)
El sistema estaba "lobotomizado". Podíamos entrar, pero no "pensar" (calcular estados, validar permisos).
*   **Síntoma:** Errores `RPC Error: function not found`.
*   **Solución:** Script de "Resurrección de Lógica".
*   **Técnica:** Extrajimos el código fuente PL/PGSQL de la base antigua y lo aplicamos en bloque.
*   **Hito:** Recuperación de `calculate_batch_status`, `get_current_auth_context`, etc.

### Fase 3: El Ritual del Heredero (Datos Huérfanos)
Entramos, pero todo estaba vacío. Los proyectos existían pero pertenecían a un "fantasma" (el UID antiguo).
*   **Solución:** Reasignación Masiva de Propiedad.
*   **SQL Clave:**
    ```sql
    UPDATE public.projects SET owner_id = 'NUEVO_UID';
    DELETE FROM public.project_members; -- Limpiar corrupción
    INSERT INTO public.project_members ... -- Crear nuevas credenciales Admin
    ```

### Fase 4: La Integridad Estructural (Vistas)
El punto de quiebre. Intentamos "adivinar" la vista `detailed_project_members` y el sistema colapsó por errores de tipos.
*   **Lección Aprendida:** Nunca inventar esquemas.
*   **Solución:** "Demoler y Reconstruir".
*   **Acción:** Usar `pg_get_viewdef` en la base original para obtener la definición exacta y replicarla. Esto restauró la visibilidad de los datos maestros.

---

## 3. Estándares y Buenas Prácticas Establecidas

1.  **No Parchar, Restaurar:** Si falta una función, no crees una versión "dummy". Busca la original.
2.  **SQL > UI:** Para arreglos estructurales de Auth y Permisos, el SQL Editor es más potente y seguro que la interfaz gráfica.
3.  **RLS Awareness:** Siempre recordar que aunque el dato exista, si no hay una política RLS (`CREATE POLICY`) o el usuario no está en la tabla de perfiles, para el frontend el dato es invisible (Error 406).

---

## 4. Mantenimiento Preventivo (El Truco Anti-Pausa)

Para evitar que Supabase "congele" el proyecto por inactividad (Plan Free):

*   **Mecánica:** Supabase pausa proyectos tras 7 días sin peticiones API.
*   **Solución Automatizada:** Configurar un **GitHub Action** (cron job) que haga un simple `curl` o `fetch` a la URL del proyecto una vez al día.
*   **Solución Manual:** Poner una alarma semanal en el calendario para loguearse en la app.

---

*"Costó, pero valió la pena."* - Co-creación Humano/AI.
