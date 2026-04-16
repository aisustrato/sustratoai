# 📚 Módulo Cognética Forense - Auditoría Técnica y Filosófica

## 🎯 ¿Qué es Cognética Forense?

**Cognética Forense** es un sistema de curatoría inteligente de artefactos multiformato diseñado para investigadores que necesitan garantizar que humanos e IA "vean lo mismo" al analizar contenido.

### El Problema que Resuelve

En la industria actual existe un problema crítico: cuando un humano le pregunta a una IA sobre un elemento visual o conceptual en un documento (ej: "mira ese ícono de casa"), la IA puede no verlo o interpretarlo incorrectamente, pero **no siempre comunica esta limitación**. El usuario asume que la IA está "viendo" lo mismo que él, generando:

- **Desalineación cognitiva** entre humano y máquina
- **Pérdida de información crítica** en el análisis
- **Falta de trazabilidad** en el proceso de investigación
- **Imposibilidad de reproducir** análisis previos

### La Solución Cognética

Cognética implementa un pipeline de **metabolización y calibración** que:

1. **Metaboliza** el artefacto: Extrae, estructura y enriquece el contenido
2. **Calibra** con el investigador: Permite validación humana vía chat Quipu
3. **Genera formatos triádicos**: MD, YAML, Obsidian-friendly
4. **Garantiza trazabilidad**: Firma HS256 en todos los archivos
5. **Habilita búsqueda avanzada**: Por elementos cognitivos (semillas, disciplinas, teorías, pensadores)

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. **Pipeline de Metabolización**
- **Transcripción**: Audio/Video → Texto (Whisper, Deepgram)
- **Extracción**: PDF/Imágenes → Texto + Metadatos
- **Análisis Cognitivo**: Identificación de semillas fractales, disciplinas, teorías, pensadores
- **Generación de Reportes**: Formatos triádicos con estructura semántica

#### 2. **Sistema de Calibración (Quipu)**
- Chat contextual con el artefacto metabolizado
- Validación humana de elementos cognitivos
- Refinamiento iterativo del análisis

#### 3. **Motor de Búsqueda Avanzada**
- Filtrado por tipo de artefacto (audio, video, PDF, markdown, imagen)
- Búsqueda por elementos cognitivos con popup modal
- Navegación bidireccional (lista ↔ detalle)
- Breadcrumb inteligente con historial

#### 4. **Sistema de Exportación Triádica**
- **Markdown**: Formato legible para humanos
- **YAML**: Estructura para máquinas
- **Obsidian**: Integración con PKM (Personal Knowledge Management)
- **Firma HS256**: Trazabilidad y verificación de integridad

---

## 🔬 Flujo de Trabajo del Investigador

### Fase 1: Ingesta
```
Investigador → Sube artefacto (audio/video/PDF/imagen/markdown)
              ↓
Sistema → Detecta tipo y aplica pipeline correspondiente
              ↓
Resultado → Artefacto en estado "pending" o "transcribing"
```

### Fase 2: Metabolización
```
Sistema → Transcribe/Extrae contenido
        → Analiza cognitivamente (semillas, disciplinas, teorías, pensadores)
        → Genera reporte estructurado
              ↓
Resultado → Artefacto en estado "completed" con informe cognitivo
```

### Fase 3: Calibración (Opcional)
```
Investigador → Abre chat Quipu
              → Valida elementos cognitivos
              → Refina análisis
              ↓
Sistema → Actualiza metadatos según feedback
              ↓
Resultado → Artefacto calibrado y validado
```

### Fase 4: Exportación
```
Investigador → Selecciona formato(s) de exportación
              ↓
Sistema → Genera archivos con firma HS256
        → Disponibiliza vía API de Sustrato
              ↓
Resultado → Archivos descargables con trazabilidad completa
```

---

## 🌐 Open Science y Trazabilidad

### Principios de Open Science

1. **Reproducibilidad**: Cada análisis es reproducible gracias a la firma HS256
2. **Transparencia**: Todos los pasos del pipeline están documentados
3. **Accesibilidad**: API pública para compartir y comparar artefactos
4. **Interoperabilidad**: Formatos estándar (MD, YAML) para máxima compatibilidad

### Sistema de Firmas HS256

Cada archivo exportado incluye:
- **Hash del contenido**: Garantiza integridad
- **Timestamp**: Momento de generación
- **Versión del pipeline**: Trazabilidad de cambios
- **Metadatos del proyecto**: Contexto completo

```yaml
# Ejemplo de metadatos con firma
metadata:
  generated_at: "2026-02-15T22:17:00Z"
  pipeline_version: "2.1.0"
  content_hash: "a3f5e9c2d1b4..."
  signature: "HS256:9f8e7d6c5b4a..."
  project_id: "proj_abc123"
```

### API de Sustrato

Sustrato disponibiliza una API REST para:
- **Subir artefactos**: POST `/api/cognetica/artifacts`
- **Comparar análisis**: POST `/api/cognetica/compare`
- **Verificar firmas**: GET `/api/cognetica/verify/{hash}`
- **Descargar formatos**: GET `/api/cognetica/export/{id}/{format}`

---

## 🧠 Elementos Cognitivos

### Semillas Fractales (🌱)
Conceptos nucleares que se ramifican en el análisis. Representan ideas fundamentales que generan estructuras de conocimiento más complejas.

**Ejemplo**: "Emergencia", "Autopoiesis", "Complejidad"

### Disciplinas (🔬)
Campos del conocimiento que enmarcan el artefacto.

**Ejemplo**: "Filosofía de la Ciencia", "Teoría de Sistemas", "Neurociencia Cognitiva"

### Teorías (💡)
Marcos teóricos específicos referenciados o aplicados.

**Ejemplo**: "Teoría de la Complejidad", "Constructivismo", "Enactivismo"

### Pensadores (👤)
Autores, investigadores o figuras intelectuales citadas o relevantes.

**Ejemplo**: "Francisco Varela", "Humberto Maturana", "Edgar Morin"

---

## 🔍 Sistema de Búsqueda

### Búsqueda Simple
- Campo de texto para filtrar por título
- Filtros por tipo de documento (checkboxes)
- Resultados en tiempo real

### Búsqueda Avanzada (Popup Modal)
1. **Selección de tipo**: Semillas, Disciplinas, Teorías, Pensadores
2. **Búsqueda textual**: Filtra elementos en tiempo real
3. **Selección**: Clic en elemento aplica filtro automáticamente
4. **Navegación**: Muestra solo artefactos con ese elemento

### Toggles de Visibilidad
- Botones para mostrar/ocultar tipos de elementos
- Preferencias guardadas en localStorage
- Auto-marcado al navegar desde detalle

---

## 🧭 Breadcrumb Inteligente

### Funcionalidad
- **Historial de navegación**: Mantiene últimas 5 páginas visitadas
- **Navegación rápida**: Clic en cualquier punto del historial
- **Truncado inteligente**: Al retroceder, elimina pasos futuros
- **Persistencia**: Guarda historial en localStorage
- **Botón Home**: Vuelve a raíz y limpia historial

### Ejemplo de Uso
```
Home → Raíz → Artefacto abc123 → Raíz (filtrado) → Artefacto def456
  ↑      ↑          ↑                ↑                    ↑
[Clic limpia todo] [Clic vuelve aquí y trunca resto]
```

---

## 🎨 Interfaz de Usuario

### Principios de Diseño
1. **Claridad**: Información jerárquica y escaneable
2. **Eficiencia**: Acciones rápidas con mínimos clics
3. **Consistencia**: Uso de StandardUI components
4. **Feedback**: Estados visuales claros (loading, error, success)

### Paleta de Colores por Elemento
- 🌱 **Semillas**: Accent (púrpura)
- 🔬 **Disciplinas**: Primary (azul)
- 💡 **Teorías**: Secondary (verde)
- 👤 **Pensadores**: Tertiary (naranja)

### Badges Interactivos
- **Outline**: Elemento visible pero no filtrado
- **Solid**: Elemento activo como filtro
- **Hover**: Escala 105% para feedback táctil
- **Clicable**: Aplica/quita filtro con un clic

---

## 📊 Casos de Uso

### Caso 1: Investigador Académico
**Necesidad**: Analizar 50 papers sobre teoría de sistemas

**Flujo**:
1. Sube PDFs a Cognética
2. Sistema metaboliza y extrae teorías/pensadores
3. Usa búsqueda avanzada para filtrar por "Luhmann"
4. Calibra con Quipu los papers más relevantes
5. Exporta en formato Obsidian para su PKM
6. Comparte hashes HS256 en publicación para reproducibilidad

### Caso 2: Equipo de Investigación Distribuido
**Necesidad**: Colaborar en análisis de entrevistas (audio)

**Flujo**:
1. Miembro A sube entrevistas
2. Sistema transcribe y analiza
3. Miembro B calibra con Quipu
4. Miembro C exporta YAML para análisis cuantitativo
5. Todos verifican integridad con firmas HS256
6. Publican dataset en API de Sustrato

### Caso 3: Estudiante de Posgrado
**Necesidad**: Organizar bibliografía de tesis

**Flujo**:
1. Sube artículos y libros (PDF)
2. Usa toggles para ver solo disciplinas relevantes
3. Breadcrumb para navegar entre documentos relacionados
4. Exporta en MD para citas en LaTeX
5. Mantiene trazabilidad para comité de tesis

---

## 🚀 Roadmap Futuro

### Próximas Funcionalidades
- [ ] **Agrupamiento de elementos**: Clusters automáticos de semillas/teorías relacionadas
- [ ] **Visualización de grafos**: Red de conexiones entre artefactos
- [ ] **Análisis comparativo**: Diff entre versiones de artefactos
- [ ] **Colaboración en tiempo real**: Múltiples usuarios calibrando simultáneamente
- [ ] **Integración con Zotero**: Import/export directo
- [ ] **OCR mejorado**: Para documentos escaneados de baja calidad

### Mejoras Técnicas
- [ ] **Caché de búsquedas**: Optimización de queries frecuentes
- [ ] **Indexación full-text**: Búsqueda en contenido completo
- [ ] **Webhooks**: Notificaciones de cambios de estado
- [ ] **API GraphQL**: Queries más flexibles

---

## 🤝 Contribución y Open Source

Cognética Forense es parte del ecosistema **Sustrato.AI**, comprometido con Open Science y software libre.

### Cómo Contribuir
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Licencia
MIT License - Ver LICENSE.md para detalles

---

## 📞 Contacto y Soporte

- **Documentación**: `/docs/cognetica/`
- **Issues**: GitHub Issues
- **Comunidad**: Discord de Sustrato.AI
- **Email**: soporte@sustrato.ai

---

**Última actualización**: 15 de febrero de 2026  
**Versión del documento**: 1.0.0  
**Autor**: Equipo Sustrato.AI
