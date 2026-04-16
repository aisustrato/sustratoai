# Sección 2: Marco Teórico y Revisión de Literatura

## 2.1 Revisiones Sistemáticas en Ciencias Sociales

### 2.1.1 Definición y Propósito

Las revisiones sistemáticas son síntesis rigurosas y transparentes de la literatura científica existente sobre un tema específico. A diferencia de revisiones narrativas, siguen protocolos estandarizados que minimizan el sesgo y maximizan la reproducibilidad (Higgins & Green, 2011).

**Fases típicas de una revisión sistemática:**
1. Definición de pregunta de investigación (PICO framework)
2. Búsqueda sistemática en bases de datos
3. **Screening inicial** (título/abstract)
4. **Preclasificación/extracción de datos** ← *Foco de este trabajo*
5. Evaluación de calidad metodológica
6. Síntesis y meta-análisis (cuando aplica)
7. Reporte (PRISMA guidelines)

### 2.1.2 Importancia Metodológica

Las revisiones sistemáticas son consideradas el nivel más alto de evidencia en medicina basada en evidencia (Oxford Centre for Evidence-Based Medicine). En ciencias sociales, su adopción ha crecido exponencialmente:
- Psicología: 300% de aumento en la última década
- Educación: Uso obligatorio en políticas públicas (What Works Clearinghouse)
- Políticas sociales: Base para decisiones informadas

### 2.1.3 Desafíos Específicos en Ciencias Sociales

A diferencia de ciencias médicas, las ciencias sociales enfrentan:
- **Mayor heterogeneidad metodológica:** Estudios cualitativos, mixtos, cuantitativos
- **Subjetividad en clasificación:** Dimensiones como "tipo de intervención" no son binarias
- **Corpus más grandes:** Búsquedas menos específicas → más artículos a revisar
- **Recursos limitados:** Proyectos académicos sin financiamiento industrial

---

## 2.2 Herramientas Existentes para Revisiones Sistemáticas

### 2.2.1 Herramientas Académicas Tradicionales

#### **Covidence**
- **Origen:** Cochrane Collaboration (estándar de oro en medicina)
- **Fortalezas:**
  - Rigor metodológico probado
  - Auditoría completa de decisiones
  - Multi-revisor (cálculo de concordancia inter-rater)
- **Limitaciones:**
  - Interfaz de principios de 2010s
  - Sin integración con IA
  - Flujos rígidos, poca personalización
  - Costo: $1,800 USD/año por equipo

#### **Rayyan**
- **Origen:** Qatar Computing Research Institute
- **Fortalezas:**
  - Gratuito para uso académico
  - Colaboración en tiempo real
  - Mejor UX que Covidence
- **Limitaciones:**
  - Sin IA (solo filtros básicos)
  - Personalización limitada
  - Exportación de datos restrictiva

#### **EPPI-Reviewer**
- **Origen:** University College London
- **Fortalezas:**
  - Machine learning básico (clustering)
  - Enfocado en ciencias sociales
- **Limitaciones:**
  - Interfaz desktop (no web)
  - ML opaco, no explicable
  - Costo: £500-£2,000 GBP/proyecto

### 2.2.2 Herramientas Comerciales con IA

#### **Elicit**
- **Origen:** Startup IA (2021)
- **Fortalezas:**
  - UX moderna y atractiva
  - Respuestas rápidas basadas en LLMs
  - Sugerencias automáticas de artículos
- **Limitaciones:**
  - "Caja negra": No explica cómo clasifica
  - No cumple estándares académicos (no citado en papers)
  - Modelo freemium limitante

#### **Research Rabbit**
- **Origen:** Startup (2021)
- **Fortalezas:**
  - Visualización de redes de citación
  - Recomendaciones por similaridad
- **Limitaciones:**
  - No diseñado para revisiones sistemáticas
  - Sin trazabilidad de decisiones
  - No permite clasificación multi-dimensional

#### **Semantic Scholar + API**
- **Origen:** Allen Institute for AI
- **Fortalezas:**
  - API abierta, datos accesibles
  - Embeddings semánticos de alta calidad
- **Limitaciones:**
  - No es una herramienta de revisión sistemática
  - Requiere desarrollo propio para integrar

### 2.2.3 Tabla Comparativa

| Característica | Covidence | Rayyan | Elicit | SUSTRATO.AI |
|----------------|-----------|--------|--------|-------------|
| **Transparencia IA** | N/A | N/A | ❌ Baja | ✅ Alta |
| **Control humano** | ✅ Total | ✅ Total | ❌ Limitado | ✅ Total |
| **UX moderna** | ❌ | 🟡 Media | ✅ | ✅ |
| **Tematización** | ❌ | ❌ | ❌ | ✅ Completa |
| **Asistencia IA** | ❌ | ❌ | ✅ | ✅ Supervisada |
| **Auditoría completa** | ✅ | ✅ | ❌ | ✅ |
| **Costo** | Alto | Gratis | Freemium | Open/Institucional |
| **Personalización** | Baja | Baja | Baja | Alta |

---

## 2.3 Inteligencia Artificial en Investigación Científica

### 2.3.1 Estado del Arte: LLMs en Clasificación de Texto

Los modelos de lenguaje grandes (LLMs) como GPT-4, Claude y Llama han demostrado capacidades impresionantes en:
- Clasificación de abstracts científicos (accuracy >85%)
- Extracción de información estructurada
- Generación de resúmenes coherentes
- Traducción con preservación de terminología técnica

**Casos de uso exitosos:**
- Análisis de patentes (Google Patents)
- Triage de papers en conferencias (OpenReview)
- Clasificación de soporte técnico (empresas SaaS)

### 2.3.2 Limitaciones Críticas

Sin embargo, los LLMs presentan problemas conocidos:

1. **Alucinaciones:** Generan información plausible pero falsa
   - Ejemplo: Citar estudios que no existen
   - Riesgo crítico en contextos académicos

2. **Sesgo sistemático:** Reproducen sesgos de datos de entrenamiento
   - Sesgo geográfico (sobre-representación Global North)
   - Sesgo lingüístico (inglés > español > otros idiomas)
   - Sesgo temporal (datos de entrenamiento desactualizados)

3. **Falta de explicabilidad:** 
   - Modelos "caja negra"
   - Dificultad para justificar decisiones en papers académicos

4. **Variabilidad:** 
   - Respuestas no determinísticas
   - Dificulta reproducibilidad

### 2.3.3 Human-in-the-Loop: Necesidad de Supervisión

La literatura en IA responsable enfatiza el modelo **human-in-the-loop (HITL)**:
- IA genera sugerencias, humanos deciden
- Feedback humano mejora el sistema
- Responsabilidad final queda con expertos

**Ejemplos exitosos:**
- Diagnóstico médico asistido por IA (IBM Watson, Google Health)
- Moderación de contenido (combinación de IA + humanos)
- Traducción profesional (DeepL + post-edición humana)

---

## 2.4 Posicionamiento de SUSTRATO.AI

### 2.4.1 Filosofía: IA como "Notario" vs "Juez"

SUSTRATO.AI adopta una metáfora clara:
- **IA como "Notario":** Registra, documenta, asiste, sugiere
- **Humano como "Juez":** Decide, valida, arbitra

Esta distinción se operacionaliza mediante:
- Clasificaciones IA marcadas como `iteration=1, reviewer_type='ai'`
- Revisiones humanas como `iteration=2+, reviewer_type='human'`
- Flag `is_final` solo activado por humanos
- Justificaciones obligatorias para cambios humanos

### 2.4.2 Diseño Centrado en el Investigador

A diferencia de herramientas comerciales (diseñadas para monetización) o académicas (diseñadas por ingenieros), SUSTRATO.AI:
- Co-diseñado con investigadores en terreno
- Iteraciones basadas en observación y entrevistas
- Prioriza necesidades reales sobre features "cool"
- Balance entre potencia y simplicidad

### 2.4.3 Transparencia Total

Cada clasificación incluye:
- **Valor sugerido:** (ej. "DCU")
- **Confianza:** 0-100% (con umbral de advertencia <70%)
- **Justificación textual:** Por qué la IA eligió ese valor
- **Fragmento de evidencia:** Cita del abstract que sustenta la decisión
- **Timestamp:** Cuándo se generó
- **Modelo usado:** GPT-4-turbo (versión específica)

### 2.4.4 Control Humano Granular

Los investigadores pueden:
- **Pre-validar rápidamente:** Checkbox para clasificaciones obviamente correctas
- **Revisar en detalle:** Formulario con campos obligatorios (valor, confianza, justificación)
- **Forzar reconciliación:** Si dudan, pueden enviar de vuelta a IA con contexto adicional
- **Disputar finalmente:** Marcar como "requiere arbitraje" para casos complejos

### 2.4.5 Diferenciador: Sistema de Tematización

**Contexto:** Investigadores trabajan en múltiples proyectos simultáneamente. En herramientas tradicionales, es fácil confundir en qué proyecto se está trabajando (problema reportado en entrevistas).

**Solución:** Tematización completa por proyecto:
- **Paletas de color:** 12 esquemas (monocromáticos, eclécticos, accesibles)
- **Fuentes:** 3 pares (Clásico, Moderno, Accesible)
- **Componentes "soberanos":** Orquestadores que consumen tokens de diseño
- **Opciones acotadas:** No abruma con infinitas posibilidades

**Beneficio para dislexia:**
- Diferenciación visual clara reduce carga cognitiva
- Facilita el cambio de contexto entre proyectos
- Personalización según preferencias individuales

**Originalidad:** Ninguna herramienta académica/comercial revisada ofrece este nivel de personalización visual por proyecto.

---

## 2.5 Brecha Identificada y Contribución

**Brecha:**
- Herramientas académicas: Rigor + transparencia, pero sin IA ni UX moderna
- Herramientas comerciales: IA + UX, pero sin transparencia ni control
- **Ninguna ofrece:** Rigor + IA transparente + UX moderna + Tematización

**Contribución de SUSTRATO.AI:**
1. **Modelo metodológico:** Protocolo iterativo IA-humano documentado
2. **Arquitectura técnica:** Sistema escalable y replicable
3. **Diseño UX:** Tematización como diferenciador único
4. **Validación empírica:** Caso de estudio con métricas

---

## Referencias para esta Sección

- Higgins, J. P., & Green, S. (Eds.). (2011). *Cochrane handbook for systematic reviews of interventions* (Vol. 4). John Wiley & Sons.
- Van de Schoot, R., et al. (2021). An open source machine learning framework for efficient and transparent systematic reviews. *Nature Machine Intelligence*, 3(2), 125-133.
- Bannach-Brown, A., et al. (2019). Machine learning algorithms for systematic review: reducing workload in a preclinical review of animal studies and reducing human screening error. *Systematic Reviews*, 8(1), 23.
- Brown, T., et al. (2020). Language models are few-shot learners. *Advances in Neural Information Processing Systems*, 33, 1877-1901.
- Bender, E. M., et al. (2021). On the dangers of stochastic parrots: Can language models be too big? *Proceedings of FAccT*, 610-623.
- Green, B., & Chen, Y. (2019). The principles and limits of algorithm-in-the-loop decision making. *Proceedings of CSCW*, 1-24.

---

**Próximo paso:** Desarrollar Sección 3 (Metodología) con detalles del flujo iterativo y diseño de prompts.
