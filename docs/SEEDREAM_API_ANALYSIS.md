# 🎨 Seedream 4.0 API - Análisis Técnico y Presupuesto

## ¿Qué es Seedream?

**Seedream 4.0** es el modelo de generación de imágenes de **ByteDance** (la empresa detrás de TikTok). Es el mismo modelo que ves en Freepik como "Seedream 4 4K".

### Características Principales:
- ✅ **Resolución hasta 4K** (único en su clase)
- ✅ **Text-to-Image + Image Editing** en un solo modelo
- ✅ **Multi-referencia**: acepta múltiples imágenes de entrada
- ✅ **Batch support**: genera varias imágenes por request
- ✅ **Style transfer**: watercolor, cyberpunk, arquitectónico, etc.
- ✅ **Conocimiento profundo**: puede generar diagramas, timelines, ilustraciones educativas

---

## 💰 PRECIOS COMPARATIVOS

| Proveedor | Precio por Imagen | 4K Disponible | API REST | Notas |
|-----------|-------------------|---------------|----------|-------|
| **BytePlus ModelArk** (oficial) | **$0.03 USD** | ✅ Sí | ✅ | Acceso directo a ByteDance |
| **Replicate** | ~$0.027-0.03 USD | ✅ Sí | ✅ | Popular, fácil integración |
| **WaveSpeed AI** | **$0.027 USD** | ✅ Sí | ✅ | El más económico |
| **AI/ML API** | ~$0.03 USD | ✅ Sí | ✅ | Buena documentación |
| **fal.ai** | ~$0.03 USD | ✅ Sí | ✅ | Alternativa |

### Comparación con Competidores:
| Modelo | Precio/Imagen | Resolución Max | Calidad |
|--------|---------------|----------------|---------|
| Seedream 4.0 | $0.03 | 4K | ⭐⭐⭐⭐⭐ |
| FLUX 1.1 Pro | $0.04 | 2K | ⭐⭐⭐⭐ |
| Ideogram v3 | $0.09 | 2K | ⭐⭐⭐⭐ |
| DALL-E 3 | $0.04-0.08 | 2K | ⭐⭐⭐⭐ |
| Midjourney | ~$0.05 | 2K | ⭐⭐⭐⭐⭐ |

---

## 📊 PRESUPUESTO: 100 Imágenes 4K

### Escenario Base (BytePlus/Replicate):
```
100 imágenes × $0.03 = $3.00 USD
```

### Escenario Óptimo (WaveSpeed):
```
100 imágenes × $0.027 = $2.70 USD
```

### Proyección a Escala:

| Cantidad | BytePlus ($0.03) | WaveSpeed ($0.027) |
|----------|------------------|-------------------|
| 100 imgs | $3.00 | $2.70 |
| 500 imgs | $15.00 | $13.50 |
| 1,000 imgs | $30.00 | $27.00 |
| 5,000 imgs | $150.00 | $135.00 |
| 10,000 imgs | $300.00 | $270.00 |

---

## 🔧 INTEGRACIÓN TÉCNICA

### Opción Recomendada: BytePlus ModelArk (Oficial)

**Endpoint:**
```
POST https://api.byteplus.com/modelark/v1/images/generations
```

**Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
```

**Request Body:**
```javascript
{
  "model": "seedream-4.0",
  "prompt": "Portrait of Carl Jung, oil painting style, wise expression, warm lighting",
  "image_size": "landscape_16_9",  // Opciones: square_hd, portrait_4_3, etc.
  "image_resolution": "4k",         // Resolución 4K
  "num_images": 1
}
```

**Response:**
```javascript
{
  "data": [
    {
      "url": "https://cdn.byteplus.com/generations/xxx.png",
      "b64_json": null
    }
  ],
  "meta": {
    "usage": { "tokens_used": 120000 }
  }
}
```

---

## 📦 ALMACENAMIENTO EN SUPABASE

### Consideraciones para imágenes 4K:
- **Peso típico**: 15-25 MB por imagen PNG (4K)
- **Formato recomendado**: WebP para reducir a ~5-8 MB
- **Storage Supabase**: $0.021/GB/mes

### Flujo Propuesto:

```
1. Gemini genera prompt de avatar
2. Seedream API genera imagen 4K
3. Descarga directa a Supabase Storage
4. Guardar URL en cog_generated_images
```

### Código de Integración:

```typescript
// lib/seedream/api.ts
export async function generateAvatarImage(prompt: string): Promise<string> {
  const response = await fetch('https://api.byteplus.com/modelark/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BYTEPLUS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'seedream-4.0',
      prompt,
      image_size: 'portrait_4_3',
      image_resolution: '4k',
      num_images: 1
    }),
  });

  const data = await response.json();
  const imageUrl = data.data[0].url;

  // Descargar y subir a Supabase
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  
  const supabase = await createServerClient();
  const filename = `avatars/${Date.now()}.png`;
  
  const { data: uploadData } = await supabase.storage
    .from('cognetica-files')
    .upload(filename, imageBlob, { contentType: 'image/png' });

  return uploadData?.path || '';
}
```

---

## 🔐 OBTENER API KEY

### BytePlus ModelArk (Recomendado):
1. Ir a https://www.byteplus.com/en/product/Seedream
2. Crear cuenta BytePlus
3. Activar ModelArk
4. Obtener API Key en Dashboard
5. **200 imágenes gratis** para probar

### Replicate (Alternativa):
1. Ir a https://replicate.com/bytedance/seedream-4
2. Crear cuenta
3. API Key en Settings
4. Billing por uso

---

## ✅ RECOMENDACIÓN FINAL

### Para Cognética + Dr. Jung:

| Aspecto | Recomendación |
|---------|---------------|
| **Proveedor** | BytePlus ModelArk (oficial) |
| **Precio** | $0.03/imagen |
| **Resolución** | 4K para avatares HD |
| **Almacenamiento** | Supabase Storage directo |
| **Formato** | PNG → WebP (compresión) |

### Presupuesto Mensual Estimado:

```
Escenario conservador (50 pensadores/mes):
- Generación: 50 × $0.03 = $1.50
- Storage (~250MB): $0.005
- Total: ~$1.55/mes

Escenario medio (200 pensadores/mes):
- Generación: 200 × $0.03 = $6.00
- Storage (~1GB): $0.021
- Total: ~$6.02/mes

Escenario alto (1000 pensadores/mes):
- Generación: 1000 × $0.03 = $30.00
- Storage (~5GB): $0.105
- Total: ~$30.10/mes
```

---

## 📝 PRÓXIMOS PASOS

1. [ ] Crear cuenta BytePlus y obtener API Key
2. [ ] Crear `lib/seedream/api.ts` con cliente
3. [ ] Crear tabla `cog_image_prompts` para trackear prompts
4. [ ] Integrar en pipeline de Cognética (Paso 4: Generación Avatar)
5. [ ] Agregar bucket en Supabase para avatares

---

## 🔑 VARIABLES DE ENTORNO (.env.local)

Agrega estas líneas a tu archivo `.env.local`:

```bash
# ===== SEEDREAM / BYTEPLUS =====
# API Key de BytePlus ModelArk para Seedream 4.0
# Obtener en: https://www.byteplus.com/en/product/Seedream
BYTEPLUS_API_KEY=tu_api_key_aqui

# Opcional: Alternativa via Replicate
# REPLICATE_API_KEY=tu_replicate_key
```

---

*Documento generado: Diciembre 2024*
*Precios actualizados según BytePlus ModelArk*
