# 🔬 Auditoría Forense Flash: Modelos de IA en Preclasificación Bibliográfica

**Fecha:** 11 de abril de 2026  
**Contexto:** Documentación insumo para paper académico sobre el proceso de preclasificación bibliográfica en SUSTRATO.AI  
**Auditor:** Sistema de trazabilidad de código

---

## 📋 Resumen Ejecutivo

El sistema de preclasificación bibliográfica de SUSTRATO.AI utiliza **DeepSeek** como proveedor de inteligencia artificial, específicamente dos modelos según el caso de uso:

- **`deepseek-chat`**: Modelo principal para preclasificación, traducción y extracción ligera
- **`deepseek-reasoner`**: Modelo especializado para destilación de ensayos y análisis profundo

Esta migración desde Gemini (Google) a DeepSeek se realizó con el objetivo de **mayor accesibilidad para investigadores independientes** y **soberanía tecnológica**.

---

## 🎯 Modelo Principal: `deepseek-chat`

### **Casos de Uso Confirmados**

#### 1. **Preclasificación de Artículos Académicos**
**Archivo:** `/lib/actions/preclassification-actions.ts`  
**Líneas:** 1722-1724, 2048-2050, 3257-3259, 6006-6008

```typescript
const { result: aiResponse } = await callDeepSeekAPI(
    "deepseek-chat",
    prompt,
);
```

**Función:** Clasificación automática de artículos académicos según dimensiones predefinidas (iteración 1 de IA).

**Parámetros de configuración:**
- `temperature: 0.2` (baja creatividad, alta precisión)
- `max_tokens: 8192`
- `top_p: 1`

---

#### 2. **Traducción de Artículos (Español)**
**Archivo:** `/lib/actions/preclassification-actions.ts`  
**Líneas:** 3285-3289

```typescript
translated_by: userId,
translator_system: "deepseek-chat",
```

**Función:** Traducción de título, abstract y summary de artículos académicos del inglés al español.

---

#### 3. **Simulación de Clasificación de Dimensiones**
**Archivo:** `/lib/actions/dimension-actions.ts`  
**Líneas:** 1048-1050

```typescript
// 🔧 MIGRACIÓN: Ahora usamos DeepSeek en lugar de Gemini
// DeepSeek es más accesible para investigadores independientes
const { result } = await callDeepSeekAPI("deepseek-chat", prompt);
```

**Función:** Simulación de clasificación para testing y validación de dimensiones antes de aplicarlas a lotes reales.

---

#### 4. **Extracción Ligera de Elementos Cognitivos**
**Archivo:** `/lib/actions/cognetica-lightweight-extraction-actions.ts`  
**Líneas:** 355-356, 586-587

```typescript
model: "deepseek-chat",
// ...
extracted_by: "deepseek-chat",
```

**Función:** Extracción de pensadores, datos cronológicos y elementos cognitivos desde transcripciones completas (módulo Cognética).

---

#### 5. **Chat Cognética (Conversaciones con IA)**
**Archivo:** `/lib/actions/cognetica-chat-actions.ts`  
**Líneas:** 283-286

```typescript
const { result: textContent } = await callDeepSeekAPI(
    "deepseek-chat",
    fullPrompt,
);
```

**Función:** Sistema de chat para análisis conversacional de transcripciones y artefactos cognitivos.

---

#### 6. **Generación de Descripciones de Artefactos**
**Archivo:** `/lib/actions/cognetica-actions.ts`  
**Líneas:** 626-627, 781-782, 1003-1004

```typescript
model: "deepseek-chat",
```

**Función:** Generación automática de descripciones concisas para artefactos cognitivos (transcripciones, audios, documentos).

---

## 🧠 Modelo Especializado: `deepseek-reasoner`

### **Casos de Uso Confirmados**

#### 1. **Destilación de Ensayos (Minotauro Destilador)**
**Archivo:** `/lib/actions/cognetica-distillation-actions.ts`  
**Líneas:** 157-160, 272-275, 406-409, 872-873

```typescript
model: 'deepseek-reasoner',
messages: [{ role: 'user', content: prompt }],
temperature: 0.7,
max_tokens: 16000,
```

**Función:** Destilación de transcripciones largas en ensayos académicos coherentes de 6-8k tokens.

**Características:**
- Procesamiento por chunks de ~30k tokens
- Contexto acumulativo entre chunks
- Consolidación final en ensayo coherente
- Mayor capacidad de razonamiento y síntesis

**Metadata generada:**
```typescript
{
    model: 'deepseek-reasoner',
    generated_at: string,
    token_count: number,
    prompt_version: 'v2.0-chunked'
}
```

---

## 🔧 Infraestructura Técnica

### **Cliente API Centralizado**
**Archivo:** `/lib/deepseek/api.ts`

```typescript
export async function callDeepSeekAPI(model: string, text: string) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: text }],
            temperature: 0.2,
            max_tokens: 8192,
            top_p: 1,
        })
    });
    
    const data = await response.json();
    
    return { 
        result: data.choices?.[0]?.message?.content ?? '',
        usage: {
            promptTokenCount: data.usage?.prompt_tokens || 0,
            candidatesTokenCount: data.usage?.completion_tokens || 0,
            totalTokenCount: data.usage?.total_tokens || 0
        }
    };
}
```

**Características:**
- Cliente reutilizable para toda la aplicación
- Manejo de errores robusto
- Tracking de uso de tokens (prompt, completion, total)
- Formato de respuesta compatible con arquitectura previa (Gemini)

---

## 📊 Mapeo de Funcionalidades → Modelos

| Funcionalidad | Modelo | Temperature | Max Tokens | Rationale |
|---------------|--------|-------------|------------|-----------|
| **Preclasificación bibliográfica** | `deepseek-chat` | 0.2 | 8192 | Precisión > creatividad |
| **Traducción académica** | `deepseek-chat` | 0.2 | 8192 | Fidelidad al texto original |
| **Simulación de dimensiones** | `deepseek-chat` | 0.2 | 8192 | Validación de configuración |
| **Extracción ligera** | `deepseek-chat` | 0.2 | 8192 | Identificación de entidades |
| **Chat Cognética** | `deepseek-chat` | 0.2 | 8192 | Conversación estructurada |
| **Descripciones de artefactos** | `deepseek-chat` | 0.2 | 8192 | Síntesis concisa |
| **Destilación de ensayos** | `deepseek-reasoner` | 0.7 | 16000 | Razonamiento profundo + síntesis |

---

## 🔄 Historial de Migración

### **Antes: Gemini (Google)**
- Modelo usado: `gemini-1.5-pro` / `gemini-2.5-pro`
- Problema: Cuota limitada, errores `RESOURCE_EXHAUSTED`
- Dependencia: Google Cloud Platform

### **Después: DeepSeek**
- Modelos: `deepseek-chat` + `deepseek-reasoner`
- Ventajas:
  - ✅ Mayor accesibilidad económica
  - ✅ Soberanía tecnológica (no depende de Google)
  - ✅ Mejor para investigadores independientes
  - ✅ Modelo especializado en razonamiento (`deepseek-reasoner`)

**Comentario en código (dimension-actions.ts:1048):**
```typescript
// 🔧 MIGRACIÓN: Ahora usamos DeepSeek en lugar de Gemini
// DeepSeek es más accesible para investigadores independientes
```

---

## 🛡️ Validación y Robustez

### **Protecciones Implementadas**

1. **Parseo robusto de JSON:**
   - Limpieza de markdown (backticks)
   - Manejo de formatos variados de respuesta
   - Validación estricta de estructura

2. **Validación de dimensiones:**
   - Verificación de existencia en sistema
   - Validación según tipo (`finite` vs `open`)
   - Manejo inteligente de opciones "Otros"

3. **Confidence Score:**
   - Mapeo case-insensitive: Alta/ALTA/alta → 3
   - Valores: alta=3, media=2, baja=1
   - Error explícito si valor no reconocido

4. **Anti-fallo silencioso:**
   - Logging exhaustivo en cada paso
   - Errores descriptivos con contexto
   - Validación de inserción antes de guardar

---

## 📈 Métricas de Uso

### **Tracking de Tokens**
Cada llamada a la API retorna:
```typescript
{
    promptTokenCount: number,      // Tokens del prompt enviado
    candidatesTokenCount: number,  // Tokens de la respuesta generada
    totalTokenCount: number         // Total consumido
}
```

Estos datos se almacenan en:
- Metadata de ensayos destilados
- Logs de trabajos de IA (`ai_job_history`)
- Registros de extracción cognitiva

---

## 🎯 Casos de Uso Específicos para Paper

### **1. Preclasificación Bibliográfica (Iteración 1 - IA)**

**Prompt enviado:**
```
Analiza el siguiente artículo académico y clasifícalo según las dimensiones proporcionadas.

**Artículo:**
- Revista: [journal]
- Año: [publication_year]
- Título: [title]
- Abstract: [abstract]

**Dimensiones a clasificar:**
[Lista de dimensiones con opciones]

Responde en formato JSON:
{
    "classifications": [
        {
            "dimension_name": "nombre",
            "value": "valor seleccionado",
            "confidence": "Alta" | "Media" | "Baja",
            "rationale": "justificación"
        }
    ]
}
```

**Modelo:** `deepseek-chat`  
**Temperatura:** 0.2 (baja creatividad, alta precisión)  
**Output:** Clasificaciones estructuradas con confidence score y rationale

---

### **2. Reconciliación de Discrepancias (Iteración 3 - IA)**

**Prompt enviado:**
```
Actúa como un investigador senior neutral que debe reconciliar dos posturas sobre la clasificación de un artículo.

**Postura 1 (IA - Iteración 1):**
- Valor: [valor_ia]
- Confianza: [confianza_ia]
- Justificación: [rationale_ia]

**Postura 2 (Humano - Iteración 2):**
- Valor: [valor_humano]
- Justificación: [rationale_humano]

Tienes tres opciones:
1. Mantener tu postura original (IA)
2. Adoptar la postura del humano
3. Proponer una tercera opción

Responde en formato JSON con tu decisión y justificación.
```

**Modelo:** `deepseek-chat`  
**Temperatura:** 0.2  
**Output:** Decisión de reconciliación con rationale

---

### **3. Destilación de Transcripciones (Minotauro Destilador)**

**Proceso:**
1. División en chunks de ~30k tokens
2. Procesamiento con contexto acumulativo
3. Consolidación final en ensayo de 6-8k tokens

**Modelo:** `deepseek-reasoner`  
**Temperatura:** 0.7 (mayor creatividad para síntesis)  
**Max tokens:** 16000  
**Output:** Ensayo académico coherente con metadata

---

## 🔐 Consideraciones de Soberanía

### **Ventajas de DeepSeek**
- ✅ **Independencia de Google:** No depende de cuotas de GCP
- ✅ **Accesibilidad:** Más económico para investigadores independientes
- ✅ **Transparencia:** Modelo especializado en razonamiento (`deepseek-reasoner`)
- ✅ **Escalabilidad:** Sin límites arbitrarios de cuota

### **Consideraciones Éticas**
- Todos los prompts incluyen contexto académico completo
- No se envían datos personales de usuarios
- Metadata de uso de tokens se registra para transparencia
- Sistema de validación humana en iteraciones 2 y 3

---

## 📚 Referencias de Código

### **Archivos Principales**
1. `/lib/deepseek/api.ts` - Cliente API centralizado
2. `/lib/actions/preclassification-actions.ts` - Preclasificación y traducción
3. `/lib/actions/dimension-actions.ts` - Simulación de dimensiones
4. `/lib/actions/cognetica-distillation-actions.ts` - Destilación de ensayos
5. `/lib/actions/cognetica-lightweight-extraction-actions.ts` - Extracción ligera
6. `/lib/actions/cognetica-chat-actions.ts` - Chat Cognética
7. `/lib/actions/cognetica-actions.ts` - Descripciones de artefactos

### **Variables de Entorno**
```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

---

## 🎓 Conclusiones para Paper

1. **Modelo principal:** `deepseek-chat` con temperatura 0.2 para máxima precisión
2. **Modelo especializado:** `deepseek-reasoner` para destilación y razonamiento profundo
3. **Migración exitosa:** De Gemini a DeepSeek por accesibilidad y soberanía
4. **Validación robusta:** Sistema de 3 iteraciones (IA → Humano → Reconciliación IA)
5. **Tracking completo:** Metadata de tokens y decisiones en cada paso
6. **Arquitectura modular:** Cliente API reutilizable para todos los casos de uso

---

## 📝 Notas Adicionales

- **Fecha de migración:** Implementada en múltiples iteraciones durante 2025-2026
- **Justificación documentada en código:** Comentarios explícitos sobre decisión de migración
- **Compatibilidad:** Formato de respuesta compatible con arquitectura previa (Gemini)
- **Extensibilidad:** Fácil agregar nuevos modelos o proveedores en el futuro

---

**Documento generado:** 11 de abril de 2026  
**Versión:** 1.0  
**Auditor:** Sistema de trazabilidad de código SUSTRATO.AI
