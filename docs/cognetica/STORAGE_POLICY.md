# 📦 Política de Storage - Sistema de Artefactos Cognética

## Objetivo

Definir claramente qué archivos se mantienen, cuáles se eliminan y cuándo, para optimizar costos de storage sin perder capacidad de regeneración.

---

## 🗂️ Tipos de Archivos

### **1. Archivo Original Subido**

**Ubicación:** `cognetica-files/{artifact_id}/original.{ext}`

**Política:** ✅ **MANTENER SIEMPRE**

**Razones:**
- Auditoría: Permite verificar el archivo original
- Reprocesamiento completo: Si cambia el modelo de Marker/Deepgram
- Legal: Puede ser requerido para compliance
- Backup: Source of truth del usuario

**Excepciones:**
- Solo se elimina cuando el usuario elimina el artefacto completo
- Validación: Artefacto NO puede tener `download_hash` ni `quipu_calibration`

---

### **2. PDFs Individuales de Páginas** (Presentaciones)

**Ubicación:** `cognetica-files/presentations/{artifact_id}/page_{N}.pdf`

**Política:** ✅ **MANTENER DESPUÉS DE PROCESAR**

**Razones:**
- Regeneración de thumbnails sin costo API
- Reprocesamiento de página específica si falla traducción
- Export individual: Usuario puede descargar "solo página 5"
- Preview: Generar imagen de vista previa on-demand

**Costo:** ~500KB por página × 20 páginas = ~10MB (dentro de free tier)

**Limpieza:** Solo cuando se elimina el artefacto completo

---

### **3. Archivos Temporales de Upload**

**Ubicación:** `cognetica-files/temp/{upload_id}.{ext}`

**Política:** ❌ **ELIMINAR DESPUÉS DE SPLIT/PROCESAMIENTO**

**Razones:**
- Ya no se necesitan después de crear páginas individuales
- Duplican storage innecesariamente
- No aportan valor después del procesamiento inicial

**Momento de limpieza:**
- Inmediatamente después de split exitoso (presentaciones)
- Inmediatamente después de procesamiento exitoso (audio/video)
- Después de 24 horas si el proceso falló (cleanup automático)

---

## 📊 Resumen de Políticas

| Tipo de Archivo | Mantener | Eliminar | Razón |
|------------------|----------|----------|-------|
| Original subido | ✅ Siempre | Solo con artefacto | Auditoría, reprocesamiento |
| Páginas individuales | ✅ Después de procesar | Solo con artefacto | Regeneración, thumbnails |
| Uploads temporales | ❌ | Después de split | Ya no se necesitan |

---

## 🔄 Flujo de Storage - Presentaciones

```
1. Usuario sube PDF (20 páginas, 15MB)
   ↓
   Storage: cognetica-files/{artifact_id}/original.pdf (15MB)

2. Servidor hace split
   ↓
   Storage: 
   - cognetica-files/presentations/{artifact_id}/page_1.pdf (500KB)
   - cognetica-files/presentations/{artifact_id}/page_2.pdf (500KB)
   - ...
   - cognetica-files/presentations/{artifact_id}/page_20.pdf (500KB)
   Total: ~10MB

3. Procesamiento con Marker (1 por 1)
   ↓
   DB: cog_artifact_pages[1-20].markdown_original

4. Traducción batch con DeepSeek
   ↓
   DB: cog_artifact_pages[1-20].markdown_translated

5. Estado final en Storage:
   ✅ original.pdf (15MB) - MANTENER
   ✅ page_1.pdf ... page_20.pdf (10MB) - MANTENER
   
   Total storage: 25MB por presentación de 20 páginas
```

---

## 🔄 Flujo de Storage - Audio/Video

```
1. Usuario sube audio (30 min, 50MB)
   ↓
   Storage: cognetica-files/{artifact_id}/original.mp3 (50MB)

2. Procesamiento con Deepgram
   ↓
   DB: cog_transcriptions.full_text
   DB: cog_transcriptions.segments

3. Estado final en Storage:
   ✅ original.mp3 (50MB) - MANTENER
   
   Total storage: 50MB por audio de 30 min
```

---

## 💰 Análisis de Costos

### **Supabase Storage Free Tier:**
- 1 GB incluido
- $0.021 por GB adicional/mes

### **Escenario Real:**
- 20 presentaciones × 25MB = 500MB
- 10 audios × 50MB = 500MB
- **Total: 1GB** (dentro de free tier)

### **Escenario Escalado:**
- 100 presentaciones × 25MB = 2.5GB
- 50 audios × 50MB = 2.5GB
- **Total: 5GB** → Costo: $0.084/mes (~$1/año)

**Conclusión:** Storage es extremadamente barato comparado con costos de API.

---

## 🧹 Política de Limpieza Automática

### **Cleanup Job (Cron diario):**

```sql
-- Eliminar uploads temporales antiguos (>24h)
DELETE FROM storage.objects
WHERE bucket_id = 'cognetica-files'
AND name LIKE 'temp/%'
AND created_at < NOW() - INTERVAL '24 hours';
```

### **Limpieza Manual (Admin):**

```typescript
// Función para limpiar artefactos huérfanos
export async function cleanupOrphanedFiles() {
  // 1. Encontrar archivos en storage sin registro en DB
  const orphanedFiles = await findOrphanedStorageFiles();
  
  // 2. Eliminar después de confirmación
  for (const file of orphanedFiles) {
    await supabase.storage
      .from('cognetica-files')
      .remove([file.path]);
  }
}
```

---

## 🔐 Consideraciones de Seguridad

### **Acceso a Archivos:**

1. **Archivos originales:** Solo usuarios con acceso al proyecto
2. **Páginas individuales:** Solo usuarios con acceso al proyecto
3. **URLs firmadas:** Expiración de 1 hora para downloads

### **Validación antes de eliminar:**

```typescript
// Antes de eliminar artefacto, validar:
const canDelete = await canDeleteArtifact(artifactId);

if (!canDelete.canDelete) {
  throw new Error(canDelete.reason);
}

// Razones de bloqueo:
// - Tiene calibración QUIPU
// - Tiene download_hash (fue descargado)
```

---

## 📝 Recomendaciones

### **Para Desarrollo:**
- Usar archivos pequeños de prueba (<5MB)
- Limpiar storage de desarrollo regularmente
- No subir archivos reales de producción en dev

### **Para Producción:**
- Monitorear uso de storage mensualmente
- Configurar alertas si se supera 80% del free tier
- Implementar cleanup automático de temporales

### **Para Futuro:**
- Considerar CDN para archivos estáticos (thumbnails)
- Implementar compresión de PDFs antes de storage
- Evaluar S3 si storage supera 10GB

---

## 🎯 Decisión Final

**Política aprobada:**
- ✅ Mantener archivos originales (auditoría)
- ✅ Mantener páginas individuales (regeneración)
- ❌ Eliminar uploads temporales (no se necesitan)

**Beneficios:**
- Reprocesamiento sin costo API
- Thumbnails on-demand
- Export granular
- Costo de storage despreciable vs costo de APIs

---

**Última actualización:** 2025-02-05  
**Responsable:** Sistema Cognética  
**Revisión:** Nodo Hongo ✅
