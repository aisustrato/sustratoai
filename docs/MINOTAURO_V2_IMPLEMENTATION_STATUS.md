# 🏗️ MINOTAURO V2 - ESTADO DE IMPLEMENTACIÓN

**Fecha:** 17 Febrero 2026  
**Objetivo:** Implementar spec v2 completa con sistema de memoria de sesión y arquetipos con "chispa propia"

---

## ✅ COMPLETADO

### 1. Sistema de Tipos (100%)
**Archivo:** `/lib/types/minotauro-types.ts`

- ✅ 6 arquetipos según spec: `deslixador`, `polinizador`, `dedalo`, `bufon`, `cronos`, `colega`
- ✅ `HumanResponse`: 4 tipos de respuesta humana
- ✅ `SectionState`: Estados de sección (abierta/en_iteracion/cerrada)
- ✅ `SessionContext`: Contexto completo JSON para inyección a IA
- ✅ `SectionInteraction`: Historial de interacciones con memoria vinculante
- ✅ `PaperFormat`: Templates con límites y calibración
- ✅ `CogneticaSource`: Fuentes metabolizadas bi-friendly
- ✅ `MinotauroGalaxyMetadata`: Metadata estructurado con historial

### 2. Sistema de Prompts (100%)
**Archivo:** `/lib/prompts/minotauro-archetype-prompts.ts`

Cada arquetipo tiene su prompt específico con:
- ✅ Personalidad y comportamiento único
- ✅ Conciencia de orden (si es primero o viene después)
- ✅ Memoria vinculante (no repetir rechazos con razón)
- ✅ Calibración por formato de paper
- ✅ Output estructurado en JSON

**Arquetipos implementados:**

1. **🛠️ Deslixador** (Sanador de la Forma)
   - Limpieza de señal
   - Respeta dislexia como señal, no ruido
   - No propone ideas, solo limpia
   - Output: `{ texto_limpio, nota_interpretacion }`

2. **🌱 Polinizador** (Guardián del Rastro)
   - Conexión con fuentes Cognética
   - Memoria de fuentes rechazadas
   - Solo fuentes metabolizadas, no inventa
   - Output: `{ fuentes_sugeridas[] }`

3. **🏛️ Dédalo** (Arquitecto/Geómetra)
   - Viabilidad estructural
   - Conciencia de orden (primero vs después)
   - Calibración por límite de palabras
   - Advertencia de desborde si aplica
   - Output: `{ propuestas[] }` (máx 3-5)

4. **🃏 Bufón** (Nota Podrida/Salida Elegante)
   - Disonancia necesaria
   - Ajuste por contexto (primera vez vs segunda seguida)
   - Calibración por tono (formal → ironía sutil)
   - Output: `{ observaciones[] }` (máx 1-2)

5. **⏳ Cronos** (Auditor del Tiempo Lineal)
   - Evaluación de viabilidad temporal
   - **CLÁUSULA DE ABSTENCIÓN OBLIGATORIA**
   - Memoria de preocupaciones rechazadas
   - No es obligatorio (humano puede cerrar sin él)
   - Output: `{ evaluacion, advertencias[], declaracion_abstencion }`

6. **☕ Colega de Café** (Acompañante)
   - Espacio seguro sin agenda
   - No propone, no audita, no conecta fuentes
   - Solo acompaña
   - Output: `{ respuesta_conversacional, tono_detectado }`

### 3. API v2 con Memoria de Sesión (90%)
**Archivo:** `/app/api/minotauro/process-galaxy/route-v2.ts`

- ✅ Inyección completa de `SessionContext` JSON
- ✅ Construcción de historial de interacciones
- ✅ Tracking de arquetipos ya actuados
- ✅ Actualización de metadata con nueva interacción
- ✅ Generación de prompts específicos por arquetipo
- ⚠️ Pendiente: Corregir errores TypeScript (tipos de metadata)

---

## 🔄 EN PROGRESO

### 4. UI con Respuestas Humanas Estructuradas (0%)
**Archivo:** `/app/cognetica/minotauro/[universeId]/page.tsx`

**Pendiente:**
- [ ] Reemplazar sistema de calibración actual con respuestas estructuradas
- [ ] Botones: `✅ Aceptar` | `✏️ Modificar` | `❌ Rechazar`
- [ ] Campo de texto para razón de rechazo (obligatorio si rechaza con razón)
- [ ] Botón especial: `🚀 Esto me voló la cabeza` (respuesta positiva fuerte)
- [ ] Actualizar metadata al aceptar/rechazar
- [ ] Mostrar historial de interacciones por sección

### 5. Templates de Paper (0%)
**Archivo:** `/app/cognetica/minotauro/[universeId]/page.tsx`

**Pendiente:**
- [ ] Selector de template en header del universo
- [ ] Templates predefinidos:
  - **Zenodo**: 400 palabras/sección, tono formal-técnico
  - **Nature**: 600 palabras/sección, tono científico formal
  - **APA**: 500 palabras/sección, tono académico neutro
  - **Libre**: Sin límite, tono según humano
- [ ] Template personalizado (definir límites y tono)
- [ ] Guardar template en `universe.metadata`
- [ ] Advertencias de Dédalo/Cronos cuando se excede límite

### 6. Botones de Arquetipos Completos (50%)
**Archivo:** `/app/cognetica/minotauro/[universeId]/page.tsx`

**Actual:** Solo 4 arquetipos (bufón, auditor, editor, colega)

**Pendiente:**
- [ ] Agregar botón 🛠️ Deslixador
- [ ] Agregar botón 🌱 Polinizador
- [ ] Agregar botón 🏛️ Dédalo
- [ ] Reemplazar "Auditor" con ⏳ Cronos
- [ ] Mantener 🃏 Bufón y ☕ Colega
- [ ] Eliminar "Editor" (no está en spec v2)
- [ ] Orden sugerido (no obligatorio):
  1. Deslixador (primero)
  2. Polinizador (segundo)
  3. Dédalo / Bufón / Cronos (orden libre)
  4. Colega (cualquier momento)

---

## 📋 PENDIENTE

### 7. Sistema de Reinicio de Sección (0%)
**Pendiente:**
- [ ] Botón "🔄 Reiniciar Sección"
- [ ] Borrar historial de interacciones de esa sección
- [ ] Conservar historial de otras secciones
- [ ] Confirmación con StandardDialog

### 8. Sugerencia de Cierre (0%)
**Pendiente:**
- [ ] Mensaje suave: "¿Quieres pasar al auditor (Cronos) antes de cerrar?"
- [ ] NO obligatorio, solo sugerencia
- [ ] Botón "Cerrar Sección" marca `estado_seccion: 'cerrada'`

### 9. Indicadores Visuales de Estado (0%)
**Pendiente:**
- [ ] Badge con estado de sección (abierta/en_iteracion/cerrada)
- [ ] Lista de arquetipos ya actuados en esta sección
- [ ] Contador de interacciones
- [ ] Indicador de desborde de palabras (si aplica)

### 10. Migración de API Actual a v2 (0%)
**Pendiente:**
- [ ] Reemplazar `/app/api/minotauro/process-galaxy/route.ts` con `route-v2.ts`
- [ ] Verificar que no rompe funcionalidad existente
- [ ] Testing completo del flujo

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN (SPEC V2)

Según sección 9 de la spec:

| Módulo | Estado | Prioridad | Notas |
|--------|--------|-----------|-------|
| Base de datos de sesiones | ✅ | Alta | Metadata en `minotauro_galaxies` |
| Inyección de contexto | ✅ | Alta | `SessionContext` completo |
| Lógica de arquetipos | ✅ | Alta | Prompts específicos con memoria |
| Templates de paper | ⏳ | Media | Pendiente UI |
| UI de selección de arquetipos | ⏳ | Media | Falta agregar todos los arquetipos |
| Registro de razones de rechazo | ⏳ | Alta | Pendiente UI |
| Sugerencia de cierre | ❌ | Baja | No implementado |
| Detector de estado emocional | ❌ | Baja | No implementado (Colega) |
| Reinicio de sección | ❌ | Media | No implementado |

**Leyenda:** ✅ Completado | ⏳ En progreso | ❌ Pendiente

---

## 🚨 PUNTOS CRÍTICOS A NO OLVIDAR

### 1. Soberanía del Humano
- ✅ El humano elige qué arquetipo invoca y cuándo
- ✅ No hay secuencia obligatoria
- ⏳ El humano puede invocar el mismo arquetipo múltiples veces
- ⏳ El humano puede cerrar una sección en cualquier momento
- ❌ El sistema puede SUGERIR pasos pero nunca imponerlos

### 2. Soberanía del "No"
- ⏳ El humano puede rechazar sin dar razón
- ⏳ Si da razón, esa razón es vinculante para toda la sesión
- ❌ El humano solo necesita responder explícitamente cuando ACEPTA
- ❌ Respuesta positiva fuerte: "esto me voló la cabeza"

### 3. Memoria Vinculante
- ✅ El historial de interacciones es visible para todos los arquetipos
- ✅ Un arquetipo nunca propone algo ya rechazado con razón
- ✅ La memoria viaja DENTRO de la sección
- ✅ Entre secciones distintas, la memoria no es vinculante por defecto

### 4. Calibración por Formato
- ⏳ Tabla de templates activos con límites y estructura
- ⏳ Dédalo y Cronos verifican cumplimiento de formato
- ❌ La advertencia es consejo, no imposición

### 5. Cláusula de Abstención de Cronos
- ✅ Implementada en prompt
- ❌ Pendiente: UI debe mostrar claramente cuando Cronos se abstiene
- ❌ Pendiente: No criticar por vicio es sabiduría, no debilidad

---

## 📝 NOTAS DE DISEÑO

### Filosofía del Sistema (Spec v2)

> "Esto no es una fábrica de salchichas. El resultado final es impredecible en su textura y profundidad — esa es la gracia."

> "El instrumento es el objeto de estudio. Este módulo se usa para escribir papers sobre co-creación con IA."

> "Simetría como principio de justicia. Un investigador con dislexia y sin formación técnica debe tener las mismas condiciones de producción epistémica."

### Decisiones Técnicas Clave

1. **Metadata como almacén de sesión**: No cambios de esquema SQL, todo en `metadata JSONB`
2. **Prompts con contexto completo**: Cada arquetipo recibe el JSON de sesión completo
3. **Memoria vinculante**: Rechazos con razón son vinculantes, sin razón no lo son
4. **Orden sugerido, no impuesto**: El flujo típico es orientativo, no obligatorio
5. **Dislexia como señal**: El Deslixador respeta la voz cruda del humano

---

## 🔍 PRÓXIMOS PASOS INMEDIATOS

1. **Corregir errores TypeScript en API v2**
   - Ajustar tipos de metadata
   - Verificar firma de `callDeepSeekAPI`

2. **Actualizar UI con respuestas estructuradas**
   - Reemplazar panel de calibración actual
   - Agregar botones aceptar/rechazar con razón
   - Mostrar historial de interacciones

3. **Agregar todos los arquetipos en UI**
   - 6 botones con emojis y nombres correctos
   - Orden sugerido pero no obligatorio

4. **Implementar templates de paper**
   - Selector en header
   - 4 templates predefinidos + personalizado

5. **Testing completo del flujo**
   - Probar cada arquetipo
   - Verificar memoria vinculante
   - Verificar cláusula de abstención de Cronos

---

**Estado General:** 40% completado  
**Prioridad Actual:** Corregir API v2 y actualizar UI  
**Bloqueadores:** Ninguno  
**Riesgo:** Bajo (arquitectura sólida, solo falta UI y testing)
