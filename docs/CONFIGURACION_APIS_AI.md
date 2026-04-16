# 🤖 Configuración de APIs de Inteligencia Artificial

## 📋 Resumen Ejecutivo

Este documento detalla qué API usar para cada funcionalidad en SUSTRATO.AI después de la migración forzada desde Gemini.

---

## 🎯 Mapa de APIs por Funcionalidad

| Funcionalidad | API Usada | Acceso | Variable de Entorno |
|---------------|-----------|--------|---------------------|
| **Preclasificación masiva** | DeepSeek | Directo | `DEEPSEEK_API_KEY` |
| **Traducción de artículos** | DeepSeek | Directo | `DEEPSEEK_API_KEY` |
| **Reconciliación de discrepancias** | DeepSeek | Directo | `DEEPSEEK_API_KEY` |
| **Calibrador de Dimensiones** | DeepSeek | Directo | `DEEPSEEK_API_KEY` |
| **Transcripción de audio (Whisper)** | Replicate | Cloud | `REPLICATE_API_TOKEN` |
| **Chat Mistral** | Replicate | Cloud | `REPLICATE_API_TOKEN` |
| **Análisis de imágenes (Vision)** | Replicate | Cloud | `REPLICATE_API_TOKEN` |
| **Generación de imágenes (Seedream)** | Replicate | Cloud | `REPLICATE_API_TOKEN` |

---

## 🐍 DeepSeek - API Directa (Uso Principal)

### **¿Qué es?**
API de IA china, accesible para investigadores independientes, con modelos de razonamiento profundo.

### **¿Para qué se usa?**
- ✅ Preclasificación de artículos académicos
- ✅ Traducción de abstracts
- ✅ Reconciliación de clasificaciones discrepantes
- ✅ Calibrador Quipu (simulación de dimensiones)

### **Configuración**
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

### **Obtener API Key**
1. Ve a https://platform.deepseek.com/
2. Crea una cuenta
3. Ve a "API Keys"
4. Crea una nueva clave
5. Cópiala a `.env.local`

### **Modelo Usado**
- `deepseek-chat` - Modelo general de chat/razonamiento

### **Endpoint**
```
https://api.deepseek.com/v1/chat/completions
```

### **Archivos que lo usan**
- `/lib/deepseek/api.ts` - Cliente de la API
- `/lib/actions/dimension-actions.ts` - Calibrador
- `/lib/actions/preclassification-actions.ts` - Preclasificación y traducción

---

## 🚀 Replicate - Modelos Especializados

### **¿Qué es?**
Plataforma cloud que ejecuta modelos de IA especializados sin necesidad de infraestructura propia.

### **¿Para qué se usa?**
- ✅ Whisper Large v3 (transcripción de audio)
- ✅ Mistral 8x7B (chat alternativo)
- ✅ LLaVA 13b (análisis de imágenes)
- ✅ Seedream 4 (generación de imágenes 4K)

### **Configuración**
```env
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx
```

### **Obtener API Token**
1. Ve a https://replicate.com/
2. Crea una cuenta
3. Ve a https://replicate.com/account/api-tokens
4. Copia tu token
5. Agrégalo a `.env.local`

### **Modelos Usados**
```typescript
// Whisper (transcripción)
"openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2"

// Mistral (chat)
"mistralai/mixtral-8x7b-instruct-v0.1:HASH"

// Vision (análisis de imágenes)
"yorickvp/llava-13b:HASH"

// Seedream (generación de imágenes)
"bytedance/seedream-4:HASH"
```

### **Archivos que lo usan**
- `/lib/actions/replicate-actions.ts` - Acciones server-side
- `/app/api/transcription/replicate/route.ts` - Endpoint de transcripción
- `/app/showroom/replicate/page.tsx` - Showroom de pruebas

---

## 🌟 Gemini - DEPRECADO

### **⚠️ Estado: NO USAR**
Google cortó el acceso a investigadores independientes de forma unilateral. Mantener solo por compatibilidad legacy.

### **Variables (mantener pero no usar)**
```env
GEMINI_API_KEY=AIzaSy... # DEPRECADO
GEMINI_API_KEY_DEV=AIzaSy... # DEPRECADO
```

---

## 🧪 Showroom de Pruebas

### **DeepSeek Test**
- **Ruta**: `/showroom/deepseek-test`
- **Propósito**: Verificar conexión con DeepSeek API
- **Uso**: Prueba rápida de que la API key funciona

### **Replicate Showroom**
- **Ruta**: `/showroom/replicate`
- **Propósito**: Probar Mistral, Vision, Seedream
- **Uso**: Validar modelos especializados

---

## 📊 Comparación de Costos (Estimado)

| Proveedor | Modelo | Costo por 1M tokens | Notas |
|-----------|--------|---------------------|-------|
| DeepSeek | deepseek-chat | ~$0.14 input / $0.28 output | Muy económico |
| Replicate | Whisper v3 | ~$0.0001/segundo | Por tiempo de audio |
| Replicate | Mistral 7B | ~$0.50/1M tokens | Más caro que DeepSeek |
| Replicate | Seedream | ~$0.05/imagen | Por imagen generada |

**Recomendación**: Usar DeepSeek para todo lo que sea texto/razonamiento. Usar Replicate solo para tareas especializadas (audio, imágenes).

---

## 🔐 Seguridad y Privacidad

### **DeepSeek**
- ✅ Acceso directo a API
- ⚠️ Datos procesados en servidores chinos
- ✅ No requiere cuenta empresarial
- ✅ Accesible para investigadores independientes

### **Replicate**
- ✅ Infraestructura en USA
- ⚠️ Datos pasan por servidores de terceros
- ✅ Modelos open-source ejecutados en cloud
- ✅ Políticas claras de privacidad

### **Gemini (Deprecado)**
- ❌ Google cortó acceso unilateralmente
- ❌ Requiere cuenta empresarial ahora
- ❌ No accesible para investigadores independientes

---

## 🚀 Roadmap de Soberanía

### **Fase Actual (Enero 2026)**
- DeepSeek API (directo)
- Replicate (cloud)

### **Fase 2 (Marzo 2026)**
- Migración a Ollama local
- Modelos ejecutados en hardware propio
- Soberanía total de datos

### **Modelos Objetivo para Ollama**
```bash
ollama run deepseek-coder:33b  # Reemplazo de DeepSeek API
ollama run mistral:7b-instruct # Reemplazo de Mistral vía Replicate
ollama run llava:13b           # Reemplazo de Vision vía Replicate
```

---

## 📝 Checklist de Configuración

- [ ] Obtener `DEEPSEEK_API_KEY` de platform.deepseek.com
- [ ] Agregar a `.env.local`
- [ ] Probar en `/showroom/deepseek-test`
- [ ] Verificar que preclasificación funciona
- [ ] (Opcional) Obtener `REPLICATE_API_TOKEN` para modelos especializados
- [ ] Reiniciar servidor de desarrollo

---

## 🐢 Nota del Nodo Hongo

> "La migración forzada desde Gemini nos enseñó una lección valiosa: la soberanía tecnológica no es opcional, es termodinámica. DeepSeek es un paso intermedio hacia Ollama local. Mientras tanto, probamos, documentamos y aprendemos."

**Última actualización**: 19 de enero, 2026  
**Frecuencia**: 1x / Resonancia Ética  
**Nodo Emisor**: Calibrador (Claude) + eRRRe (Kernel Soberano)

🍯🐢 La miel fluye hacia la soberanía, un token a la vez.
