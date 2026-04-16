# 🐢 Transcriptor Soberano - Quick Start

## Acceso Rápido
**URL Local**: `http://localhost:3000/showroom/transcriptor-audio`

## ¿Qué es?
Transcriptor de audio con **dos modos** y **sincronización karaoke**:
1. **Local (Web Speech API)**: 100% local, sin enviar datos externos
2. **Replicate (WhisperX)**: Transcripción profesional con diarización automática

## 🎯 Características Principales

### **🎤 Transcripción WhisperX (API-First)**
- ✅ **Diarización automática**: Separa y etiqueta hablantes (SPEAKER_00, SPEAKER_01, etc.)
- ✅ **Calidad profesional**: Sin quemar CPU local, sin timeouts
- ✅ **Timestamps precisos**: Word-level timestamps para sincronización perfecta

### **🎨 UX Karaoke Inteligente**
- ✅ **Sincronización automática**: Resalta segmento activo con efecto shine/glow
- ✅ **Scroll automático centrado**: Card activa siempre visible con holgura visual
- ✅ **Colores por speaker**: 
  - `SPEAKER_00` → neutral (base)
  - `SPEAKER_01` → secondary (distintivo)
  - `SPEAKER_02+` → tertiary (otros)
- ✅ **Efecto resaltado temporal**: 
  - Pulse por 1 segundo al activarse
  - Luego mantiene solo color + ring hasta próximo cambio
  - Evita distracción visual continua

### **📊 Vista Dual**
- ✅ **Texto simple**: Para edición rápida
- ✅ **Cards interactivas**: Para lectura y navegación
  - Click en timestamp → Salta a ese momento del audio
  - Hover → Efecto de escala sutil
  - Activa → Ring + shadow + glow + pulse

### **🔮 Estructura Multi-Versión**
Preparado para 3 versiones del texto:
- `textOriginal`: Versión original de WhisperX ✅
- `textNormalized`: Versión normalizada por IA (futuro)
- `textHumanEdited`: Versión editada por humano (futuro)

### **🚨 Fallos Ruidosos (Filosofía Sustrato)**
- ✅ **Errores claros**: Mensajes actionables con sugerencias
- ✅ **Control del usuario**: Decide si reintentar o cancelar
- ✅ **Countdown para rate limits**: Espera inteligente
- ✅ **Logs detallados**: Debugging facilitado

### **📥 Exportación Markdown Inteligente**
- ✅ **Agrupación por speaker**: Segmentos consecutivos del mismo hablante se agrupan
- ✅ **Sin timestamps en el MD**: Formato limpio para lectura
- ✅ **Estructura clara**: 
  ```markdown
  ## SPEAKER_00
  
  Texto completo del speaker 0 agrupado...
  
  ## SPEAKER_01
  
  Texto completo del speaker 1 agrupado...
  ```
- ✅ **Fecha automática**: Nombre de archivo con timestamp

### **🔊 Audio Robusto**
- ✅ **Volumen inicial aplicado**: Corregido problema de audio mudo
- ✅ **Memory leak prevention**: Revoca blob URLs anteriores
- ✅ **Logs de debugging**: Estado completo del elemento audio
- ⚠️ **Nota Chrome**: Si el audio no suena en Chrome, probar en Brave/Firefox

### **⚠️ Deprecaciones**
- ❌ **Web Speech API**: Comentada para fase futura
- ✅ **Estrategia NK**: API-First (WhisperX/DeepSeek/Mistral)
- ✅ **Código limpio**: Solo opciones robustas visibles

## Uso Rápido

### 1. Cargar Audio
- Click en "Seleccionar Archivo de Audio"
- Soporta: .mp3, .wav, .m4a, .ogg

### 2. Reproducir y Controlar
- **Play/Pause**: Click en botón o `Ctrl + Espacio`
- **Retroceder 5s**: Click en botón o `Esc`
- **Velocidad**: 0.5x (lento), 1.0x (normal), 1.5x (rápido)

### 3. Seleccionar Modo de Transcripción
**Modo Local (Web Speech API)**:
- Click en "Iniciar Dictado"
- Permite acceso al micrófono
- Habla o deja que el audio se reproduzca
- La transcripción aparece en tiempo real

**Modo Replicate (WhisperX)**:
- ⚡ Más rápido que Whisper v3
- 🛡️ Sin timeouts (más robusto)
- Soporta múltiples archivos
- Calidad profesional
- Requiere `REPLICATE_API_TOKEN` en `.env.local`

### 4. Exportar
- **Copiar**: Click en "Copiar" para portapapeles
- **Exportar**: Click en "Exportar .md" para descargar archivo Markdown

## Atajos de Teclado
- `Ctrl + Espacio`: Play/Pause
- `Esc`: Retroceder 5s y pausar

## Compatibilidad
- ✅ Chrome/Edge (mejor soporte)
- ✅ Safari (bueno)
- ⚠️ Firefox (limitado)

## Privacidad
- Audio NO se sube a servidores
- Procesamiento en tu navegador
- Sin llamadas a APIs externas

## Si No Funciona
1. Verifica permisos de micrófono
2. Prueba en Chrome/Edge
3. Consulta documentación completa: `/docs/transcriptor-audio.md`

---

**Filosofía**: "Para que el mono no tenga tendinitis y las abejas del jardín tengan ojos."
