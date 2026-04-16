# 🌳 Roadmap: Soberanía del Transcriptor

## 🎯 Objetivo: De la Nube al Jardín

Migrar de APIs externas (Replicate) a procesamiento local (Ollama) para lograr **soberanía total** sobre la transcripción de audio.

---

## 📊 Estado Actual (Enero 2026)

### **Arquitectura Híbrida**:
```
┌─────────────────┐
│ Web Speech API  │ ← Local (navegador)
│   (Fallback)    │
└─────────────────┘
         ↓
┌─────────────────┐
│ Replicate API   │ ← Cloud (terceros)
│ Whisper v3      │
└─────────────────┘
```

### **Limitaciones Identificadas**:
- ❌ **Error PA**: Archivos grandes (>25MB) fallan
- ⚠️ **Dependencia externa**: Audio se procesa en servidores de Replicate
- 💰 **Costo**: ~$0.007 por transcripción
- 🔒 **Privacidad**: Audio sale de tu máquina

---

## 🚀 Fase 1: Ollama + Whisper Local (Febrero 2026)

### **Objetivo**: Correr Whisper en tu Mac

### **Tecnología**:
- **Ollama**: Runtime local para modelos de IA
- **Whisper.cpp**: Implementación optimizada de Whisper
- **Modelo**: `whisper:large-v3` o `whisper:medium` (según RAM)

### **Ventajas**:
- ✅ **100% local**: Audio nunca sale de tu Mac
- ✅ **Sin costos**: Procesamiento gratuito
- ✅ **Sin límites**: Archivos de cualquier tamaño
- ✅ **Offline**: Funciona sin internet

### **Requisitos**:
- **RAM**: 8GB mínimo (16GB recomendado)
- **Disco**: ~5GB para el modelo
- **CPU**: Apple Silicon (M1/M2/M3) o Intel con AVX2

### **Implementación**:
```bash
# Instalar Ollama
brew install ollama

# Descargar modelo Whisper
ollama pull whisper:large-v3

# Probar transcripción
ollama run whisper:large-v3 --audio audio.m4a
```

### **Integración en SUSTRATO.AI**:
```typescript
// Nueva API Route: /api/transcription/local
async function transcribeLocal(audioFile: File) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'whisper:large-v3',
      audio: audioBase64,
      language: 'es'
    })
  });
  return response.json();
}
```

---

## 🌍 Fase 2: DeepSeek + Mistral para Análisis (Marzo 2026)

### **Objetivo**: Análisis semántico de transcripciones

Una vez transcrito el audio, usar modelos locales para:
- **Resumen**: DeepSeek genera resumen del contenido
- **Extracción**: Mistral identifica conceptos clave
- **Clasificación**: Preclasificación automática según dimensiones

### **Modelos Locales**:
```bash
# DeepSeek (chino, open-source)
ollama pull deepseek-coder:33b

# Mistral (francés, open-source)
ollama pull mistral:7b-instruct
```

### **Flujo Completo**:
```
Audio → Whisper (local) → Transcripción
  ↓
DeepSeek (local) → Resumen + Conceptos
  ↓
Mistral (local) → Clasificación por dimensiones
  ↓
Supabase → Almacenamiento
```

---

## 🍄 Fase 3: Micelio Distribuido (Post-Marzo 2026)

### **Objetivo**: Nodos sincronizados

**Concepto**: "Esperar al más lento"
- Cada investigador corre su propio nodo Ollama
- Transcripciones se comparten vía protocolo P2P
- Sincronización asíncrona (no en tiempo real)

### **Arquitectura**:
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Nodo eRRRe   │────▶│ Nodo Kintsugi│────▶│ Nodo Hongo   │
│ (Mac viejo)  │     │ (Gemini)     │     │ (Claude)     │
└──────────────┘     └──────────────┘     └──────────────┘
       ↓                    ↓                    ↓
   Ollama              Ollama              Ollama
   Whisper             DeepSeek            Mistral
```

### **Protocolo de Sincronización**:
- **IPFS**: Almacenamiento distribuido de audios
- **CRDTs**: Sincronización de transcripciones
- **Supabase Realtime**: Notificaciones de cambios

---

## 🛡️ Auditoría de Soberanía: APIs Evaluadas

| API | Soberanía | Privacidad | Costo | Jurisdicción | Recomendación |
|-----|-----------|------------|-------|--------------|---------------|
| **Replicate + Whisper** | ⚠️ Media | ⚠️ Media | 💰 Bajo | 🇺🇸 USA | Temporal |
| **DeepSeek** | ✅ Alta (local) | ✅ Alta | 🆓 Gratis | 🇨🇳 China | **Recomendado** |
| **Mistral** | ✅ Alta (local) | ✅ Alta | 🆓 Gratis | 🇪🇺 Europa | **Recomendado** |
| **ByteDance (Jimeng)** | ⚠️ Baja | ⚠️ Baja | 💰 Medio | 🇨🇳 China | Evaluar |
| **Ollama + Whisper** | ✅ Total | ✅ Total | 🆓 Gratis | 🏠 Local | **Objetivo Final** |

### **Criterios de Evaluación**:
- **Soberanía**: ¿Puedo correrlo en mi máquina?
- **Privacidad**: ¿Los datos salen de mi red?
- **Costo**: ¿Cuánto cuesta por uso?
- **Jurisdicción**: ¿Bajo qué ley opera?

---

## 📝 Conclusiones: La Poda del Silicio

### **Principios Gen X**:
1. **No hay magia**: Solo hardware que no hemos aprendido a piratear
2. **Esperar al más lento**: La red es tan fuerte como su eslabón más frágil
3. **Podar el 90%**: Eliminar código muerto y dependencias innecesarias
4. **Física > Marketing**: Termodinámica antes que hype

### **Estrategia Ética**:
- ✅ **Marzo 2026**: Independencia de APIs externas
- ✅ **Chatarra bendita**: Funciona en hardware antiguo
- ✅ **Sin soplones**: Procesamiento 100% local
- ✅ **Micelio soberano**: Sincronización P2P

### **Próximos Pasos Inmediatos**:
1. Instalar Ollama en tu Mac
2. Probar Whisper local con audio pequeño
3. Comparar calidad vs Replicate
4. Documentar requisitos de hardware
5. Migrar progresivamente

---

## 🐢 Nota del Nodo Hongo

> "Mientras Mister Presidente busca tierras raras en el hielo, nosotros ya las tenemos en la ética de nuestras 20 líneas de código. No hay nada más subversivo que un ingeniero que decide no correr."

La miel fluye local. 🍯🌳

---

**Última actualización**: 6 de enero, 2026  
**Frecuencia**: 1x / Resonancia Ética  
**Nodo Emisor**: eRRRe (Kernel Soberano)
