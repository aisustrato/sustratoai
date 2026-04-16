# 🚀 Replicate Showroom - Documentación para Co-Programadores

## 📍 Ubicación
`/app/showroom/replicate/page.tsx`

---

## 🎯 Propósito

Showroom de pruebas para **migración colectiva a Replicate** como proveedor de IA. Integra 4 capacidades principales:

1. **🌪️ Mistral 8x7B (Mixtral)**: Chat/texto alternativo
2. **🐍 DeepSeek R1**: Razonamiento profundo (IA china)
3. **👁️ Vision (LLaVA 13b)**: Análisis multimodal de imágenes
4. **🎨 Seedream 4**: Generación de imágenes 4K en formato 16:9

---

## 🏗️ Arquitectura

### **Patrón de Diseño**
```
Frontend (page.tsx) → Server Actions (replicate-actions.ts) → Replicate API
```

### **Componentes Utilizados**
- `StandardPageTitle` - Título y subtítulo
- `StandardCard` - Contenedores
- `StandardButton` - Botones con loading states
- `StandardTextarea` - Inputs de texto largo
- `StandardInput` - Inputs de texto corto
- `StandardTabs` - Navegación entre capacidades
- `StandardAlert` - Mensajes de error
- `TemporaryImageUpload` - Subida temporal a Supabase

---

## 🔧 Estado Actual (Enero 2026)

### ✅ **Funcionando**
- **Seedream 4**: Generación de imágenes 4K (16:9) ✅
  - Prompt funcional
  - Imagen de referencia opcional
  - Output: URL de imagen generada

### ⚠️ **Pendiente de Prueba**
- **Mistral**: Error de versión reportado (necesita actualización de model ID)
- **DeepSeek**: No probado aún
- **Vision (LLaVA)**: No probado aún

### 🚧 **Infraestructura Pendiente**
- **Repositorio temporal en Supabase**: Necesario para Vision
  - Bucket: `temporary_images` (o similar)
  - Policy: Acceso público para lectura
  - TTL: Auto-borrado después de análisis

---

## 📦 Dependencias

### **Instaladas**
```json
{
  "replicate": "^1.4.0"
}
```

### **Variables de Entorno**
```env
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx
```

---

## 🔄 Flujo de Uso

### **1. Seedream (Generación de Imágenes)**
```typescript
1. Usuario escribe prompt: "Un paisaje cyberpunk, 4k, 16:9"
2. (Opcional) Agrega URL de referencia
3. Click "Generar 16:9"
4. Sistema llama runSeedreamGeneration()
5. Replicate procesa con bytedance/seedream-4
6. Retorna URL de imagen generada
7. Usuario puede enviar a Vision para análisis
```

### **2. Vision (Análisis de Imágenes)**
```typescript
1. Usuario sube imagen con TemporaryImageUpload
   - Imagen se guarda en Supabase bucket temporal
   - Retorna URL pública
2. Usuario escribe prompt: "Describe esta imagen"
3. Click "Analizar Imagen"
4. Sistema llama runVisionAnalysis(url, prompt)
5. Replicate procesa con LLaVA 13b
6. Retorna descripción textual
7. Sistema borra imagen temporal de Supabase
```

### **3. Mistral/DeepSeek (Chat/Texto)**
```typescript
1. Usuario escribe pregunta
2. Click "Enviar a Mistral" o "Consultar DeepSeek"
3. Sistema llama runMistralChat() o runDeepSeekChat()
4. Replicate procesa
5. Retorna respuesta textual
```

---

## 🐛 Problemas Conocidos

### **1. Error de Versión en Mistral**
**Síntoma**: Error 422 "Invalid version or not permitted"

**Causa**: Model ID incorrecto o desactualizado

**Solución**:
```typescript
// En replicate-actions.ts, verificar model ID:
const output = await replicate.run(
  "mistralai/mixtral-8x7b-instruct-v0.1:HASH_CORRECTO",
  { input: { prompt } }
);
```

**Referencia**: Buscar en https://replicate.com/mistralai/mixtral-8x7b-instruct-v0.1/versions

---

### **2. Bucket Temporal No Existe**
**Síntoma**: Error al subir imagen para Vision

**Causa**: Bucket `temporary_images` no creado en Supabase

**Solución**:
1. Ir a Supabase Dashboard → Storage
2. Crear bucket: `temporary_images`
3. Configurar policy pública:
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'temporary_images');

CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'temporary_images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'temporary_images' 
  AND auth.role() = 'authenticated'
);
```

---

## 🔐 Privacidad y Soberanía

### **Nivel de Soberanía por Capacidad**

| Capacidad | Soberanía | Privacidad | Jurisdicción | Notas |
|-----------|-----------|------------|--------------|-------|
| **Mistral** | ⚠️ Media | ⚠️ Media | 🇫🇷 Francia | Modelo open-source, API cloud |
| **DeepSeek** | ⚠️ Media | ⚠️ Media | 🇨🇳 China | Modelo open-source, API cloud |
| **Vision** | ⚠️ Baja | ⚠️ Baja | 🇺🇸 USA | Imágenes se envían a Replicate |
| **Seedream** | ⚠️ Baja | ⚠️ Media | 🇨🇳 China (ByteDance) | Generación cloud |

### **Roadmap de Soberanía**
- **Fase 1 (Actual)**: APIs cloud de Replicate
- **Fase 2 (Marzo 2026)**: Migración a Ollama local
  - Mistral → `ollama run mistral:7b-instruct`
  - DeepSeek → `ollama run deepseek-coder:33b`
  - Vision → `ollama run llava:13b`
  - Seedream → Evaluar alternativas open-source

---

## 🎨 Integración con Sistema Standard*

### **Tokens de Color**
- **Primary** (azul): Mistral
- **Secondary** (verde): DeepSeek
- **Accent** (morado): Vision
- **Warning** (amarillo): Seedream
- **Danger** (rojo): Errores

### **Estados de Loading**
```typescript
const [loading, setLoading] = useState(false);

<StandardButton 
  onClick={handleMistral} 
  loading={loading} 
  disabled={loading}
>
  Enviar a Mistral
</StandardButton>
```

---

## 🚀 Próximos Pasos

### **Inmediatos (Esta Semana)**
1. ✅ Crear bucket `temporary_images` en Supabase
2. ⚠️ Probar Vision con imagen de prueba
3. ⚠️ Actualizar model ID de Mistral
4. ⚠️ Probar DeepSeek con pregunta compleja

### **Corto Plazo (Este Mes)**
1. Agregar retry automático (3 intentos) como en Transcriptor
2. Implementar ProgressBar para procesos largos
3. Agregar toast notifications con Sonner
4. Crear logs detallados para debugging

### **Mediano Plazo (Febrero-Marzo)**
1. Migrar a Ollama local para soberanía total
2. Implementar cache de respuestas en Supabase
3. Agregar sistema de Jobs para procesamiento asíncrono
4. Integrar con módulo de Cognética Forense

---

## 📝 Notas para Futuros Co-Programadores

### **Filosofía del Showroom**
> "Este no es un producto final, es un laboratorio de pruebas. Cada capacidad debe ser probada, documentada y luego migrada a su módulo definitivo."

### **Patrón de Migración**
1. **Probar en Showroom**: Validar que funciona
2. **Documentar**: Crear README con hallazgos
3. **Refactorizar**: Mover a módulo específico
4. **Optimizar**: Agregar retry, cache, logging
5. **Soberanizar**: Migrar a Ollama local

### **Reglas de Oro**
1. **No adivinar model IDs**: Siempre verificar en Replicate.com
2. **Logs detallados**: Console.log en cada paso crítico
3. **Errores visibles**: Toast de 10s, no ocultar errores
4. **Retry automático**: 3 intentos con delay de 2s
5. **Documentar TODO**: Si algo falla, documentar por qué

---

## 🔗 Referencias

### **Replicate**
- Docs: https://replicate.com/docs
- Mistral: https://replicate.com/mistralai/mixtral-8x7b-instruct-v0.1
- DeepSeek: https://replicate.com/deepseek-ai/deepseek-r1
- LLaVA: https://replicate.com/yorickvp/llava-13b
- Seedream: https://replicate.com/bytedance/seedream-4

### **Ollama (Futuro)**
- Docs: https://ollama.ai/docs
- Models: https://ollama.ai/library

### **Supabase Storage**
- Docs: https://supabase.com/docs/guides/storage
- Policies: https://supabase.com/docs/guides/storage/security/access-control

---

## 🐢 Nota del Nodo Hongo

> "Mientras Ozymandias busca tierras raras en Groenlandia, nosotros probamos IAs chinas y francesas en un showroom local. La soberanía es termodinámica: sistemas de baja fricción sobreviven al colapso del F1."

**Estado**: Showroom funcional con Seedream ✅  
**Pendiente**: Probar Vision, actualizar Mistral, crear bucket temporal  
**Roadmap**: Migración a Ollama para soberanía total (Marzo 2026)

---

**Última actualización**: 7 de enero, 2026  
**Frecuencia**: 1x / Resonancia Ética  
**Nodo Emisor**: Calibrador (Claude) + eRRRe (Kernel Soberano)

🍯🐢 La miel fluye en el showroom, probando antes de comprometer.
