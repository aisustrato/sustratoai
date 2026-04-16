# Sección 1: Introducción

## 1.1 Contexto: La Crisis de Replicabilidad y el Rol de las Revisiones Sistemáticas

Las ciencias sociales enfrentan una crisis de replicabilidad que ha puesto en cuestión la validez de hallazgos clave en psicología, economía y sociología (Open Science Collaboration, 2015). En este contexto, las **revisiones sistemáticas** han emergido como herramientas fundamentales para sintetizar evidencia de manera rigurosa, transparente y reproducible.

A diferencia de revisiones narrativas tradicionales, las revisiones sistemáticas siguen protocolos estandarizados (como PRISMA o Cochrane) que incluyen:
- Búsqueda exhaustiva en múltiples bases de datos
- Criterios de inclusión/exclusión explícitos
- **Clasificación sistemática** de estudios según múltiples dimensiones
- Evaluación de calidad metodológica
- Síntesis cuantitativa o cualitativa

Sin embargo, el proceso de **preclasificación** —donde se categorizan cientos o miles de artículos según dimensiones específicas (tipo de intervención, población, contexto geográfico, etc.)— es notoriamente **intensivo en tiempo y recursos humanos**. Un investigador puede tardar entre 3-5 minutos por artículo, lo que en un corpus de 500 estudios implica **25-40 horas de trabajo manual repetitivo**.

---

## 1.2 El Problema: Limitaciones de las Herramientas Existentes

### 1.2.1 Herramientas Académicas: Rigor sin Eficiencia

Plataformas como **Covidence** y **Rayyan** son ampliamente usadas en la comunidad académica por su enfoque en transparencia y rigor metodológico. Sin embargo, presentan limitaciones críticas:

- **Interfaces anticuadas:** Diseñadas hace más de una década, no incorporan avances en UX/UI
- **Flujos rígidos:** Poca flexibilidad para adaptar el proceso a necesidades específicas
- **Ausencia de IA:** Todo el trabajo es manual, sin asistencia automatizada
- **Poca diferenciación visual:** Dificulta trabajar en múltiples proyectos simultáneamente
- **Costo:** Licencias institucionales costosas ($1000-$3000 USD/año)

### 1.2.2 Herramientas Comerciales con IA: Eficiencia sin Transparencia

Nuevas herramientas como **Elicit** y **Research Rabbit** integran modelos de lenguaje (LLMs) para acelerar el proceso de revisión. Sin embargo:

- **"Cajas negras":** No explican cómo la IA llega a sus conclusiones
- **Falta de control humano:** Decisiones críticas delegadas a algoritmos opacos
- **Sesgo no documentado:** Los modelos pueden perpetuar sesgos sin que el usuario lo sepa
- **No cumplen estándares académicos:** Difícil justificar su uso en publicaciones rigurosas
- **Modelo de negocio extractivo:** Datos del usuario pueden ser usados para entrenar modelos

### 1.2.3 La Brecha Identificada

Existe un **vacío crítico** entre:
- El rigor metodológico de herramientas académicas (pero ineficientes y con UX pobre)
- La eficiencia de herramientas comerciales con IA (pero opacas y poco confiables)

**Pregunta de investigación:**  
*¿Es posible diseñar una herramienta que combine rigor metodológico, transparencia total, eficiencia con IA y experiencia de usuario moderna?*

---

## 1.3 Propuesta: SUSTRATO.AI como Puente

**SUSTRATO.AI** es una plataforma web diseñada para gestionar revisiones sistemáticas en ciencias sociales, con un enfoque particular en el proceso de **preclasificación asistida por IA con supervisión humana iterativa**.

### Principios de Diseño

1. **Transparencia Total**
   - Cada clasificación de IA incluye justificación textual
   - Historial completo de iteraciones visible
   - Métricas de confianza explícitas

2. **Control Humano en Cada Etapa**
   - El investigador aprueba o rechaza clasificaciones IA
   - Posibilidad de corregir y justificar cambios
   - IA actúa como **"notario"** (registra), no como **"juez"** (decide)

3. **Flujo Iterativo Documentado**
   - Iteración 1: IA clasifica
   - Iteración 2: Humano revisa
   - Iteración 3: IA reconsidera discrepancias con contexto humano
   - Iteración 4: Humano arbitra casos no resueltos
   - Trazabilidad completa para auditorías

4. **Experiencia de Usuario Moderna**
   - Interfaz diseñada con estándares contemporáneos
   - Visualizaciones en tiempo real (gráficos, progress tracking)
   - **Sistema de tematización completo:** Cada proyecto puede tener paleta de colores y fuentes distintas
   - Diferenciación visual clara (crucial para usuarios con dislexia)
   - Responsiva, accesible, con animaciones fluidas

5. **Diseño Centrado en el Investigador**
   - Co-diseñado con investigadores en ciencias sociales
   - Iteraciones basadas en feedback real
   - Flujos flexibles adaptables a diferentes metodologías

---

## 1.4 Contribución Original

Este trabajo contribuye a la literatura en tres dimensiones:

### 1.4.1 Metodológica
- **Modelo de integración IA-humano** para clasificación de literatura científica
- Sistema de **iteraciones documentadas** que permite auditoría completa
- Protocolo de **reconciliación de discrepancias** entre IA y humano

### 1.4.2 Técnica
- Arquitectura de software que balancea flexibilidad y estructura
- **Sistema de tematización por proyecto** (diferenciador UX único)
- Componentes UI "soberanos" que consumen tokens de diseño
- Uso de WebSockets para colaboración en tiempo real

### 1.4.3 Práctica
- Herramienta funcional y escalable ya en uso
- Reducción documentada de tiempo de preclasificación (métricas en Sección 5)
- Modelo replicable para otras disciplinas y dominios

---

## 1.5 Estructura del Paper

- **Sección 2:** Marco teórico y revisión de literatura
- **Sección 3:** Metodología y diseño del sistema
- **Sección 4:** Arquitectura técnica e implementación
- **Sección 5:** Resultados y evaluación (caso de estudio)
- **Sección 6:** Discusión, limitaciones y contribución
- **Sección 7:** Conclusiones y trabajo futuro

---

## Referencias Preliminares para esta Sección

- Open Science Collaboration. (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251), aac4716.
- Page, M. J., et al. (2021). The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. *BMJ*, 372.
- Wagner, G., et al. (2022). Large language models can accurately predict searcher preferences. *arXiv preprint*.
- Covidence systematic review software, Veritas Health Innovation, Melbourne, Australia. www.covidence.org
- Rayyan QCRI. (2016). Rayyan—a web and mobile app for systematic reviews. *Systematic Reviews*, 5(1), 210.

---

**Nota:** Esta sección debe ser pulida para incluir más citas específicas y datos cuantitativos sobre la crisis de replicabilidad y el tiempo invertido en revisiones sistemáticas tradicionales.
