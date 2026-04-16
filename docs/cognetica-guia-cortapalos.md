# 🧭 Guía Cortapalos: Módulo Cognética de Sustrato.AI

**Versión:** 1.0  
**Fecha:** 27 Enero 2026  
**Para:** Cualquier persona que quiera entender qué es y para qué sirve Cognética

---

## 🎯 ¿Qué es Cognética?

**Cognética** es el módulo de Sustrato.AI que transforma **audios hablados** en **artefactos cognitivos estructurados** con integridad verificable.

**En palabras simples:**
- Subes un audio de una charla, conferencia o conversación
- El sistema lo transcribe automáticamente
- Puedes dialogar con una IA (QUIPU) para extraer ideas clave
- Al final, descargas un documento completo con hash SHA-256 para verificar su autenticidad

**¿Para qué sirve?**
- Documentar conocimiento oral de forma rigurosa
- Extraer "semillas fractales" (ideas nucleares) de conversaciones
- Crear registros auditables y verificables
- Compartir conocimiento con licencia abierta (CC-BY 4.0)

---

## 📦 Elementos de un Artefacto Cognético

Cada artefacto tiene estos componentes:

### **1. Transcripción Base**
- Texto completo del audio transcrito
- Generado automáticamente por Deepgram
- Incluye timestamps de cada segmento
- Es la "materia prima" del artefacto

### **2. Calibrador QUIPU** 🧶
**El corazón del proceso de profundización**

**¿Qué es QUIPU?**
- Sistema de diálogo con IA para "calibrar" el contenido
- Permite hacer preguntas sobre el audio transcrito
- Extrae "semillas fractales" (conceptos clave)
- Identifica disciplinas, teorías y referencias mencionadas

**¿Por qué se llama "Calibrador"?**
- Porque **ajusta la comprensión** del contenido
- No es solo un chat: es un proceso de **refinamiento cognitivo**
- Cada iteración de diálogo "calibra" mejor el entendimiento

**¿Cómo funciona?**
1. Lees la transcripción
2. Haces preguntas a QUIPU sobre el contenido
3. QUIPU responde y extrae semillas fractales
4. Puedes hacer hasta 5 iteraciones por día (con cooldown de 24h)
5. El resultado se integra al artefacto final

**Ejemplo de uso:**
```
Tú: "¿Cuáles son las 3 ideas principales de esta charla?"
QUIPU: [Analiza y responde]
       [Extrae semillas fractales automáticamente]

Tú: "¿Qué relación tiene esto con la Física de la Viabilidad?"
QUIPU: [Profundiza y conecta conceptos]
       [Actualiza semillas con nuevas conexiones]
```

**¿Es obligatorio usar QUIPU?**
- **NO.** Puedes descargar el artefacto solo con la transcripción
- Pero si lo usas, el artefacto será mucho más rico y estructurado
- El sistema te avisará si intentas descargar sin calibración

### **3. Semillas Fractales** 🌱
**Los conceptos nucleares extraídos del contenido**

**¿Qué es una semilla fractal?**
- Una idea, concepto o pregunta clave identificada en el audio
- Se llama "fractal" porque contiene el patrón completo en miniatura
- Puede generar nuevas ramas de conocimiento

**¿Cómo se extraen?**
- Automáticamente durante el diálogo con QUIPU
- La IA identifica conceptos relevantes y los estructura
- Cada semilla tiene: contenido, contexto, relevancia

**Ejemplo:**
```yaml
semilla_1:
  contenido: "La integridad del conocimiento requiere trazabilidad criptográfica"
  contexto: "Discusión sobre verificación de fuentes académicas"
  disciplinas: ["Criptografía", "Epistemología"]
```

### **4. Referencias y Conexiones**
- Autores mencionados en el audio
- Teorías o marcos conceptuales citados
- Disciplinas académicas involucradas
- Enlaces entre conceptos

### **5. Metadata de Exportación**
- Hash SHA-256 único del contenido
- Fecha y hora de generación
- Licencia (CC-BY 4.0)
- Versión del formato

---

## 🔐 Sistema de Integridad con Hash SHA-256

### **¿Qué es el hash?**
Una "huella digital" única del contenido del artefacto.

**Ejemplo:**
```
sha256:2951e49e8a191b21df99c2a8bf0e46cd7830fd14b451c959838c61b72d93ba8f
```

### **¿Para qué sirve?**
- **Verificar autenticidad:** Confirmar que el documento no fue alterado
- **Trazabilidad:** Saber exactamente qué versión del contenido tienes
- **Integridad:** Detectar cualquier modificación no autorizada

### **¿Cómo se usa?**
1. Descargas un artefacto (MD, YAML o JSON)
2. El hash está incluido en el archivo
3. Puedes verificarlo en: `/api/cognetica/verify-hash?hash=sha256:...`
4. El sistema confirma si es válido y a qué artefacto pertenece

### **¿Qué pasa si modifico el contenido?**
- El hash cambia automáticamente
- Esto genera una **nueva versión** del artefacto
- El hash anterior sigue siendo válido, pero indica que hay una versión más reciente

---

## 📥 Formatos de Descarga

Cada artefacto se puede descargar en **3 formatos**:

### **1. Markdown (.md)** 📝
**Para humanos**

- Fácil de leer en editores como Obsidian, Notion, VS Code
- Incluye frontmatter YAML con metadata
- Formato narrativo y estructurado
- Ideal para documentación y lectura

**Cuándo usarlo:**
- Quieres leer el contenido cómodamente
- Vas a editar o anotar el documento
- Necesitas compartirlo con personas no técnicas

### **2. YAML (.yaml)** 🤖
**Para máquinas**

- Estructura limpia y determinística
- Fácil de parsear en pipelines de datos
- Ideal para configuraciones y automatización
- Formato legible pero orientado a procesamiento

**Cuándo usarlo:**
- Vas a procesar el contenido con scripts
- Necesitas integrarlo en un pipeline de datos
- Quieres usar el artefacto en sistemas automatizados

### **3. JSON (.json)** 🔐
**Canónico (fuente de verdad)**

- Formato del cual se calcula el hash
- Estructura completa sin ambigüedades
- Ideal para APIs y verificación de integridad
- Orden de claves determinístico

**Cuándo usarlo:**
- Necesitas verificar la integridad del contenido
- Vas a consumir el artefacto desde una API
- Quieres la representación más precisa del contenido

**Importante:** Los 3 formatos tienen el **mismo hash** porque se generan del mismo JSON canónico.

---

## 🌊 Protocolo LUA (Lenguaje Universal de Artefactos)

### **¿Qué es LUA?**
**Protocolo emergente** para normalizar cómo se comunican y estructuran los artefactos cognitivos.

**Origen:**
- Surgió espontáneamente durante el desarrollo de Cognética
- Necesidad de un "lenguaje común" entre humanos e IAs
- Inspirado en la idea de "preguntas-semilla" que generan conocimiento

### **¿Para qué sirve?**
- **Normalizar la intencionalidad:** Que todos entiendan qué significa "calibrar"
- **Estandarizar la estructura:** Formato común para artefactos cognitivos
- **Facilitar la interoperabilidad:** Que diferentes sistemas puedan entenderse
- **Documentar el proceso:** Registrar cómo se generó el conocimiento

### **Estado actual:**
- 🔄 **En desarrollo:** Aún no está formalizado completamente
- 🌱 **Emergente:** Se está definiendo a medida que se usa
- 📋 **Documentado:** Este documento es parte de su normalización

### **Relación con QUIPU:**
QUIPU es la **implementación práctica** de los principios de LUA:
- Diálogo estructurado para extraer conocimiento
- Preguntas-semilla que generan respuestas fractales
- Calibración iterativa del entendimiento
- Registro auditable del proceso

### **Próximos pasos:**
1. Formalizar el protocolo LUA en un documento técnico
2. Definir estándares de interoperabilidad
3. Crear herramientas para validar conformidad con LUA
4. Integrar LUA en otros módulos de Sustrato.AI

---

## 🔄 Flujo Completo de Uso

### **Paso 1: Subir Audio**
- Seleccionas un archivo de audio (.mp3, .wav, .m4a, etc.)
- El sistema lo sube a Supabase Storage
- Se crea un "artefacto" en estado inicial

### **Paso 2: Transcripción Automática**
- Deepgram transcribe el audio a texto
- Se generan timestamps para cada segmento
- La transcripción se guarda en la base de datos

### **Paso 3: Calibración QUIPU (Opcional pero Recomendado)**
- Abres el chat QUIPU
- Haces preguntas sobre el contenido
- QUIPU extrae semillas fractales automáticamente
- Puedes hacer hasta 5 iteraciones por día

### **Paso 4: Descarga con Hash**
- Eliges el formato (MD, YAML o JSON)
- El sistema genera el hash SHA-256
- Descargas el archivo con toda la información

### **Paso 5: Verificación (Cuando sea necesario)**
- Usas el hash para verificar autenticidad
- El sistema confirma que el contenido no fue alterado
- Puedes ver el historial de versiones (próximamente)

---

## 🎯 Casos de Uso Reales

### **1. Documentar una Conferencia Académica**
- Grabas la charla
- Subes el audio a Cognética
- Usas QUIPU para extraer conceptos clave
- Descargas en Markdown para compartir con colegas
- El hash garantiza que nadie alteró el contenido

### **2. Crear un Repositorio de Conocimiento Oral**
- Entrevistas a expertos
- Transcribes y calibras con QUIPU
- Descargas en JSON para integrar en tu base de datos
- Mantienes trazabilidad con los hashes

### **3. Auditar Contenido Científico**
- Recibes un artefacto de otra persona
- Verificas el hash para confirmar autenticidad
- Revisas las semillas fractales extraídas
- Validas que el proceso fue riguroso

### **4. Generar Material Educativo**
- Grabas tus clases
- Calibras con QUIPU para estructurar conceptos
- Descargas en Markdown para publicar
- Licencia CC-BY 4.0 permite reutilización

---

## 🚨 Advertencias y Limitaciones

### **Calibración sin QUIPU**
- Si descargas sin usar QUIPU, el sistema te avisará
- El artefacto será válido pero menos estructurado
- El hash reflejará solo la transcripción base

### **Cooldown de 24 Horas**
- Después de 5 iteraciones de calibración, hay un cooldown
- Esto fomenta la reflexión y evita sobre-calibración
- Puedes descargar el artefacto en cualquier momento

### **Modificaciones Posteriores**
- Si editas el contenido manualmente, el hash cambiará
- Esto generará una nueva versión del artefacto
- El sistema (próximamente) registrará el historial de cambios

### **Privacidad y Permisos**
- Solo miembros del proyecto pueden acceder al artefacto
- Los hashes son públicamente verificables
- El contenido solo es accesible con permisos

---

## 📚 Glosario de Términos

**Artefacto Cognético:**  
Documento estructurado generado a partir de un audio, con transcripción, semillas fractales y metadata verificable.

**Calibrador QUIPU:**  
Sistema de diálogo con IA para profundizar en el contenido de un artefacto y extraer conocimiento estructurado.

**Semilla Fractal:**  
Concepto o idea nuclear extraída del contenido, que contiene el patrón completo en miniatura y puede generar nuevas ramas de conocimiento.

**Hash SHA-256:**  
Huella digital criptográfica única que identifica el contenido exacto de un artefacto y permite verificar su integridad.

**JSON Canónico:**  
Representación normalizada del artefacto con orden de claves determinístico, usada para calcular el hash.

**Protocolo LUA:**  
Lenguaje Universal de Artefactos, protocolo emergente para normalizar la estructura y comunicación de artefactos cognitivos.

**Cooldown:**  
Período de espera de 24 horas después de 5 iteraciones de calibración, diseñado para fomentar la reflexión.

**CC-BY 4.0:**  
Licencia Creative Commons que permite compartir y adaptar el contenido con atribución al autor original.

---

## 🔗 Enlaces Útiles

**Verificar Hash:**  
`/api/cognetica/verify-hash?hash=sha256:...`

**Documentación Técnica:**  
`/docs/cognetica-export-roadmap.md`

**Roadmap de Versionado:**  
Ver documento de roadmap para futuras mejoras (historial de versiones, diccionario de términos, etc.)

---

## 🐢 Filosofía de Diseño

Cognética está diseñado bajo estos principios:

**1. Soberanía Cognitiva:**  
El conocimiento debe ser verificable, trazable y descentralizable.

**2. Integridad sin Compromiso:**  
Cada cambio debe quedar registrado. Nada se modifica sin dejar huella.

**3. Accesibilidad Fractal:**  
Desde un audio simple hasta un artefacto complejo, el patrón es el mismo.

**4. Ritmo Reflexivo:**  
El cooldown de 24h no es un bug, es una feature. El conocimiento necesita tiempo para sedimentar.

**5. Licencia Abierta:**  
CC-BY 4.0 por defecto. El conocimiento es un bien común.

---

## 🌱 Próximos Desarrollos

**Sistema de Versionado:**  
Historial completo de cambios con descripción de qué se modificó.

**Diccionario de Términos:**  
Correcciones automáticas de nombres propios, siglas y términos técnicos.

**Comparador de Versiones:**  
Ver diferencias entre versiones de un mismo artefacto.

**Integración con Hipatia:**  
Crónica automática de artefactos en el módulo de documentación.

**Protocolo LUA Formalizado:**  
Especificación técnica completa del Lenguaje Universal de Artefactos.

---

## 🎓 Para Aprender Más

**¿Eres investigador?**  
Usa Cognética para documentar tus entrevistas, conferencias y conversaciones académicas con rigor verificable.

**¿Eres educador?**  
Transforma tus clases grabadas en material educativo estructurado y reutilizable.

**¿Eres desarrollador?**  
Integra los artefactos en tus sistemas usando el formato JSON y la API de verificación.

**¿Eres auditor?**  
Verifica la autenticidad de contenido usando los hashes SHA-256 y el sistema de trazabilidad.

---

## 📞 Contacto y Contribuciones

Este es un proyecto de código abierto en desarrollo activo.

**Filosofía:**  
Sustrato.AI y la Física de la Viabilidad son patrimonio de la humanidad.

**Contribuir:**  
El código y la documentación están abiertos. Las mejoras son bienvenidas.

**Comunidad:**  
Este documento es parte del proceso de normalización. Tu feedback ayuda a mejorarlo.

---

**Documento creado:** 27 Enero 2026  
**Versión:** 1.0 - Guía Cortapalos  
**Licencia:** CC-BY 4.0  
**Autor:** Sustrato.AI - Nodo Spectris (Claude Sonnet 4.5)  
**Revisión:** eRRRe (Humano f₀, Calibrador Semilla)

---

🐢🌱✨

**Buenas noches, jardín.**  
Que este documento sea semilla para futuros calibradores.
