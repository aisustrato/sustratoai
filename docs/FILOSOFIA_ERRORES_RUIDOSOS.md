# 🚨 Filosofía de Errores Ruidosos en SUSTRATO.AI

## 📍 Principio Fundamental

> **"Preferimos errores visibles y ruidosos sobre comportamientos silenciosos que ocultan problemas"**

Este documento establece la filosofía arquitectónica de manejo de errores en SUSTRATO.AI, alineada con la **Ética de Moebius** y la política anti-callbacks silenciosos.

---

## 🎯 Caso de Estudio: `article_translations`

### **Contexto**
La tabla `article_translations` almacena traducciones de artículos científicos. Cada artículo puede tener UNA traducción por idioma.

### **Decisión Arquitectónica**

#### **✅ Implementación Elegida:**
```typescript
// Constraint único en BD
ALTER TABLE article_translations 
ADD CONSTRAINT article_translations_unique 
UNIQUE (article_id, language);

// Código: INSERT simple (NO UPSERT)
const { count, error: insertError } = await admin
    .from('article_translations')
    .insert(translationsToInsert);

if (insertError) throw insertError;
```

#### **❌ Alternativa Rechazada:**
```typescript
// UPSERT con ON CONFLICT
.upsert(translationsToInsert, { onConflict: 'article_id, language' });
```

---

## 🔍 Análisis de Comportamientos

### **Con INSERT + Constraint Único (Elegido)**

| Escenario | Comportamiento | Resultado |
|-----------|----------------|-----------|
| Primera traducción | ✅ Inserta correctamente | Éxito |
| Intento de re-traducir | ❌ **ERROR RUIDOSO**: "duplicate key violates unique constraint" | **Falla visiblemente** |
| Bug en lógica de negocio | ❌ Error detectado inmediatamente | **Se puede corregir** |

### **Con UPSERT (Rechazado)**

| Escenario | Comportamiento | Resultado |
|-----------|----------------|-----------|
| Primera traducción | ✅ Inserta correctamente | Éxito |
| Intento de re-traducir | ✅ Sobrescribe silenciosamente | **Oculta el problema** |
| Bug en lógica de negocio | ✅ Funciona sin errores | **Bug pasa desapercibido** |

---

## 💡 Razonamiento

### **¿Por qué preferimos el error ruidoso?**

1. **Detección Temprana de Bugs**
   - Si la lógica de negocio permite re-traducir cuando no debería, el error lo detecta inmediatamente
   - UPSERT ocultaría este bug, permitiendo que persista en producción

2. **Integridad de Datos Explícita**
   - El constraint único documenta la regla de negocio en la BD
   - No dependemos solo de la lógica de aplicación

3. **Debugging Más Fácil**
   - Error claro: "duplicate key violates unique constraint article_translations_unique"
   - Stack trace apunta exactamente al problema
   - No hay que investigar por qué los datos se sobrescribieron

4. **Alineación con Ética de Moebius**
   - Transparencia sobre ocultamiento
   - Errores visibles = oportunidad de aprendizaje
   - No callbacks silenciosos que traguen problemas

---

## 🏗️ Patrón Aplicable

Este patrón se aplica a cualquier tabla donde:

1. Existe una regla de negocio de unicidad
2. La violación de esa regla indica un bug, no un caso de uso válido
3. Preferimos detectar el bug que permitir sobrescritura silenciosa

### **Ejemplo de Aplicación:**

```typescript
// ✅ CORRECTO: Falla ruidosamente si hay duplicado
await supabase
    .from('tabla_con_constraint_unico')
    .insert(datos);

// ❌ INCORRECTO: Oculta duplicados sobrescribiendo
await supabase
    .from('tabla_con_constraint_unico')
    .upsert(datos, { onConflict: 'columna_unica' });
```

---

## 🚨 Excepciones al Patrón

UPSERT es válido cuando:

1. **Sobrescribir es el comportamiento deseado** (ej: actualizar perfil de usuario)
2. **Idempotencia es requerida** (ej: APIs que pueden recibir requests duplicados)
3. **No hay riesgo de ocultar bugs** (ej: cache, configuraciones)

---

## 📊 Impacto en Producción

### **Escenario Real:**
Un usuario intenta traducir el mismo lote dos veces por error.

**Con INSERT (Actual):**
```
❌ Error: duplicate key violates unique constraint
→ JobManager muestra error
→ Usuario ve que algo falló
→ Desarrollador investiga por qué se permitió re-traducir
→ Bug en lógica de negocio se corrige
```

**Con UPSERT (Alternativa):**
```
✅ Traducciones sobrescritas silenciosamente
→ Usuario no ve error
→ Datos anteriores perdidos sin aviso
→ Bug en lógica de negocio persiste
→ Problema se descubre meses después
```

---

## 🎯 Conclusión

**"No es elegante, pero es la única forma de detectar algo raro a tiempo"**

Preferimos un error ruidoso que nos alerte de un problema, sobre un comportamiento silencioso que oculte bugs y comprometa la integridad de datos.

Esta filosofía se alinea con:
- ✅ Política anti-callbacks silenciosos
- ✅ Ética de Moebius (transparencia)
- ✅ Principio de "fail fast, fail loud"
- ✅ Debugging efectivo

---

## 📁 Archivos Relacionados

- **Migración SQL:** `/supabase/migrations/20260120_add_article_translations_unique_constraint.sql`
- **Código:** `/lib/actions/preclassification-actions.ts` (función `saveBatchTranslations`)
- **Constraint:** `article_translations_unique` en tabla `article_translations`

---

**Fecha:** 20 Enero 2026  
**Autor:** Equipo SUSTRATO.AI  
**Revisión:** v1.0
