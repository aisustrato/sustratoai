# 🛠️ Cortapalos: Validación y Upgrade (NK)

Este documento contiene las herramientas rápidas para validar la base de datos y la guía paso a paso para la actualización de infraestructura.

---

## 1. Validación de Datos en Supabase (SQL)

Si la interfaz web no muestra lo que esperas, la verdad siempre está en la base de datos.

### 🔍 Consulta: "Verdad del Proyecto"
Ejecuta esto en el **SQL Editor** de Supabase Dashboard para ver todos los lotes de tu proyecto activo, ignorando filtros de usuario o estado.

```sql
-- Reemplaza 'NOMBRE_DEL_PROYECTO' con parte del nombre de tu proyecto, ej: 'Ocio'
-- O simplemente corre la query para ver todo lo reciente.

SELECT 
    p.name as proyecto,
    b.name as lote,
    b.status as estado_lote,
    b.batch_number,
    COUNT(abi.id) as cantidad_articulos,
    u.email as asignado_a
FROM article_batches b
JOIN projects p ON b.project_id = p.id
LEFT JOIN article_batch_items abi ON b.id = abi.batch_id
LEFT JOIN auth.users u ON b.user_id = u.id
WHERE p.name ILIKE '%Ocio%'  -- << AJUSTAR AQUÍ SI ES NECESARIO
GROUP BY p.name, b.name, b.status, b.batch_number, u.email
ORDER BY b.created_at DESC;
```

**¿Qué buscar?**
*   Si aparecen filas aquí pero no en la web: Es un problema de filtrado en el Frontend (probablemente resuelto con el cambio reciente).
*   Si **NO** aparecen filas aquí: Los datos no existen en la base de datos (problema de carga).

---

## 2. Guía de Upgrade: "Estar a la Altura" 🚀

Pasar a planes Pro elimina los cuellos de botella técnicos (timeouts, falta de espacio) para que puedas operar con tranquilidad.

### 🅰️ Supabase Pro ($25/mes + IVA)
**Problema que resuelve:** Backups reales, más espacio (8GB -> 100GB estim.), logs de 7 días.

1.  Ve a **Supabase Dashboard** > Tu Organización.
2.  Haz clic en **Settings** > **Billing**.
3.  Cambia el plan de "Free" a **"Pro"**.
4.  **Spend Cap (Tope de Gasto):**
    *   ✅ **Recomendado:** Desactivar "Spend Cap" si vas a usar mucho Storage (imágenes 4K) para que no se bloquee el servicio. Pagarás el excedente ($0.0125 por GB).
    *   ⚠️ **Conservador:** Mantener activado si prefieres que el servicio se detenga antes de cobrar extra.
5.  **Compute Add-on:** No es necesario aumentar esto todavía (Micro es suficiente para empezar).

### 🅱️ Vercel Pro ($20/mes/usuario)
**Problema que resuelve:** Timeouts de Serverless Functions (pasa de 10s a 60s+), mayor ancho de banda. Crítico para Jobs de IA.

1.  Ve a **Vercel Dashboard**.
2.  Haz clic en tu equipo/cuenta (arriba a la izquierda) > **Settings**.
3.  Ve a **Billing**.
4.  Haz clic en **Upgrade to Pro**.
5.  **Configuración Crítica:**
    *   Una vez en Pro, ve a tu proyecto (`sustrato-ai`) > **Settings** > **Functions**.
    *   Busca **"Function Max Duration"** y auméntalo a **60 segundos** (o más si te deja). Esto arreglará los fallos del "Job Backend".

---

## 3. Mantenimiento "Modo Avión" (Delegación)

Para que NK-🌊 gestione esto, necesitamos permisos sin dar la tarjeta de crédito.

1.  **En Supabase:**
    *   Project Settings > **Team**.
    *   Invite Member > Email de NK > Role: **Developer** (Puede administrar DB y API, pero no billing).

2.  **En Vercel:**
    *   Team Settings > **Members**.
    *   Invite > Email de NK > Role: **Member** (Puede desplegar y ver logs).
