# 🐢 Transcriptor Soberano - Documentación

## 📍 Ubicación
`/app/showroom/transcriptor-audio/page.tsx`

## 🎯 Propósito
Prueba de concepto de transcripción de audio **100% local y soberana** para el ecosistema SUSTRATO.AI. Diseñado para procesar audios sin enviar datos a servicios externos ("sin soplones de Ozymandias").

## 🔧 Arquitectura Técnica

### Opción Implementada: Web Speech API
- **Motor**: API nativa del navegador (Chrome/Safari/Edge)
- **Procesamiento**: 100% client-side, cero llamadas a servidores
- **Ventajas**:
  - ✅ Cero descarga de modelos (~0 MB overhead)
  - ✅ Instantáneo (sin carga inicial)
  - ✅ Económico en recursos (ideal para "máquina viejita")
  - ✅ Gratis (sin costos de API)
- **Limitaciones**:
  - Calidad variable según navegador
  - Requiere conexión a internet (el navegador puede usar servicios internos)
  - Mejor para español de España (es-ES)

### Alternativas Futuras (si Web Speech API falla)
1. **Transformers.js**: Modelos ML en navegador (~50MB descarga inicial)
2. **Whisper.cpp**: Servidor local con modelo Whisper
3. **Replicate**: API cloud con mejor privacidad que Deepgram

## 🎨 Integración con Sistema Standard*

### Componentes Utilizados
- `StandardPageTitle` - Título y subtítulo de página
- `StandardCard` - Contenedores con tokens de color
- `StandardButton` - Botones con estados y variantes
- `StandardTextarea` - Área de transcripción editable

### Tokens de Color
- **Warning** (amarillo): Concepto filosófico, asistente de voz
- **Accent** (morado): Mensajes de estado
- **Primary** (azul): Controles de audio
- **Success** (verde): Área de transcripción
- **Neutral** (gris): Información de privacidad

## 🎹 Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + Espacio` | Play/Pause del audio |
| `Esc` | Retroceder 5 segundos y pausar |

## 🔄 Flujo de Uso

1. **Cargar Audio**: Usuario sube archivo de audio local (.mp3, .wav, etc.)
2. **Reproducir**: Controles nativos + botones de velocidad (0.5x, 1.0x, 1.5x)
3. **Dictar**: Activar "Asistente de Voz Local" para transcripción automática
4. **Editar**: Transcripción editable manualmente en tiempo real
5. **Exportar**: Copiar al portapapeles o descargar como `.md`

## 📦 Estado del Componente

```typescript
const [audioFile, setAudioFile] = useState<File | null>(null);
const [audioUrl, setAudioUrl] = useState<string>('');
const [transcription, setTranscription] = useState<string>('');
const [isRecognizing, setIsRecognizing] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [playbackRate, setPlaybackRate] = useState(1.0);
const [statusMessage, setStatusMessage] = useState<string>('');
```

## 🛡️ Privacidad y Soberanía

### Garantías
- ✅ Audio NO se sube a servidores de SUSTRATO.AI
- ✅ Procesamiento en navegador del usuario
- ✅ Sin llamadas a APIs externas de transcripción
- ✅ Datos permanecen en la máquina local

### Advertencia
Web Speech API puede usar servicios internos del navegador (Google para Chrome, Apple para Safari). Para soberanía 100% absoluta, considerar migrar a **Transformers.js** o **Whisper.cpp**.

## 🚀 Próximos Pasos

### Si Web Speech API No Es Suficiente
1. **Implementar Transformers.js**:
   ```bash
   npm install @xenova/transformers
   ```
   - Modelo: `Xenova/whisper-tiny` o `Xenova/whisper-small`
   - Procesamiento: 100% en navegador
   - Tamaño: ~50-150MB según modelo

2. **Implementar Whisper.cpp (servidor local)**:
   - Instalar binario en servidor Next.js
   - API Route que ejecuta transcripción
   - Calidad profesional, control total

### Integración con Módulo de Cognética Forense
- Conectar con sistema de notas existente
- Almacenar transcripciones en Supabase
- Vincular con artículos/proyectos
- Sistema de Jobs para procesamiento asíncrono

## 📝 Filosofía del Artefacto

> "Para que el mono no tenga tendinitis y las abejas del jardín tengan ojos. 
> Transcribe sin salir de tu propia arquitectura. La paz es la eficiencia."

Este transcriptor es la **prueba de concepto** para la nueva fase de refactorización de SUSTRATO.AI. Al validar el caso más complejo (audio), se establece el patrón para otros artefactos del ecosistema.

## ⚡ Rendimiento y Tiempos

### Transcripción con Replicate + Whisper v3
- **Tiempo de procesamiento**: ~10 segundos por MB de audio
- **Ejemplo real**: Archivo de 26MB = ~4 minutos de procesamiento
- **Recomendación**: No cerrar la pestaña durante el proceso
- **Feedback**: El sistema muestra estimación de tiempo y progreso visual

### ⚠️ Limitaciones Conocidas (Error PA)
- **Error PA (Prediction interrupted)**: Puede ocurrir con archivos grandes (>25MB)
- **Causa**: Timeout o sobrecarga de servidores de Replicate
- **Retry automático**: Sistema reintenta 3 veces con delay de 2 segundos
- **Solución temporal**: Usar archivos más pequeños (<20MB) o comprimir audio
- **Roadmap**: Migración a Ollama + Whisper local para soberanía total

### Optimizaciones Implementadas
- Estimación automática basada en tamaño de archivo
- StandardStepper para visualizar progreso
- Toast notifications persistentes durante procesamiento
- SustratoLoadingLogo con animación de respiración
- Retry automático (3 intentos) para errores transitorios
- 🐢 **Procesamiento multi-archivo secuencial**: Carga y procesa múltiples archivos uno tras otro
- **Indicadores individuales**: Cada archivo muestra su estado (⏸️ pendiente, 🔄 procesando, ✅ completado, ❌ error)
- **Concatenación automática**: Transcripciones se unen con separadores de sección

## 🐛 Troubleshooting

### Audio No Reproduce Sonido
1. **Verifica salida de audio en Mac**:
   - Preferencias del Sistema → Sonido → Salida
   - Asegúrate de que los audífonos/parlantes estén seleccionados
2. **Prueba con controles nativos**: El elemento `<audio>` tiene controles nativos del navegador
3. **Ajusta volumen**: Usa el slider de volumen en la interfaz (0-100%)

### Dictado con Retraso
- **Normal**: Web Speech API tiene ~1-2 segundos de delay natural
- **Audios rápidos (NotebookLM)**: 
  - Usa velocidad 0.5x para ralentizar
  - O reproduce en parlante y pon micrófono cerca (más limpio)

### Permisos de Micrófono
- Chrome/Safari pedirán permiso la primera vez
- Si lo rechazaste: Click en candado de URL → Permisos → Micrófono → Permitir

### Formato de Audio No Soportado
- Formatos recomendados: .mp3, .wav, .m4a
- Si falla: Convierte a .mp3 con herramientas online

## 🔗 Referencias
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Transformers.js: https://huggingface.co/docs/transformers.js
- Whisper.cpp: https://github.com/ggerganov/whisper.cpp
