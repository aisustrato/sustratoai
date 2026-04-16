# Paper: Sistema de Preclasificación con IA y Supervisión Humana
## SUSTRATO.AI - Herramienta para Revisiones Sistemáticas en Ciencias Sociales

**Timeline de Trabajo:** Octubre 2025 - Marzo 2026  
**Objetivo:** Publicación y presentación académica - Marzo 2026

---

## 📋 Estructura del Paper

### 1. **Introducción** (1.5-2 páginas)
   - Contexto: Crisis de replicabilidad en ciencias sociales
   - Problema: Limitaciones de herramientas existentes (académicas vs comerciales)
   - Brecha identificada: Ausencia de herramientas que combinen rigor metodológico, transparencia y eficiencia con IA
   - Propuesta de valor: SUSTRATO.AI como puente entre ambos mundos
   - Contribución: Sistema de preclasificación con IA transparente + supervisión humana iterativa

**Archivo detallado:** `seccion-introduccion.md`

---

### 2. **Marco Teórico y Revisión de Literatura** (2-2.5 páginas)
   - **2.1 Revisiones Sistemáticas en Ciencias Sociales**
     - Importancia metodológica
     - Fases del proceso (PRISMA, Cochrane)
     - Desafíos específicos: subjetividad, tiempo, recursos
   
   - **2.2 Herramientas Existentes**
     - **Herramientas académicas:** Covidence, Rayyan
       - Fortalezas: Rigor, transparencia
       - Limitaciones: Interfaces anticuadas, flujos rígidos, sin IA
     - **Herramientas comerciales:** Elicit, Research Rabbit
       - Fortalezas: UX moderna, IA integrada
       - Limitaciones: "Cajas negras", falta de control humano, sesgo no documentado
   
   - **2.3 IA en Investigación Científica**
     - Estado del arte: GPT-4, LLMs en clasificación de texto
     - Limitaciones: Alucinaciones, sesgo, falta de explicabilidad
     - Importancia del human-in-the-loop

   - **2.4 Posicionamiento de SUSTRATO.AI**
     - Diseño centrado en el investigador
     - IA como "notario" (registra decisiones) vs "juez" (decide)
     - Transparencia total del proceso
     - Control humano en cada etapa

**Archivo detallado:** `seccion-marco-teorico.md`

---

### 3. **Metodología: Diseño del Sistema** (3-4 páginas)
   - **3.1 Filosofía de Diseño**
     - Principio de transparencia
     - IA como asistente, no reemplazo
     - Iteraciones documentadas
     - Trazabilidad completa
   
   - **3.2 Flujo de Trabajo Iterativo**
     - Fase 1: Clasificación inicial por IA (GPT-4)
     - Fase 2: Revisión humana (Iteración 1)
     - Fase 3: Identificación de discrepancias
     - Fase 4: Reconciliación por IA (Iteración 2-3)
     - Fase 5: Arbitraje humano final
     - Cierre: Validación y métricas
   
   - **3.3 Diseño de Prompts**
     - Estructura de prompts para clasificación
     - Prompts de reconciliación (contexto humano + IA)
     - Estrategias para reducir alucinaciones
   
   - **3.4 Modelo de Datos**
     - Entidades: Batches, Items, Dimensiones, Reviews
     - Gestión de iteraciones
     - Flag `is_final` como control de calidad
   
   - **3.5 Interfaz de Usuario**
     - Pre-validación rápida (checkbox)
     - Revisión completa (formulario con justificación obligatoria)
     - Visualización de progreso (SphereGrid, PieChart)
     - Real-time updates (WebSockets)

**Archivo detallado:** `seccion-metodologia.md`

---

### 4. **Arquitectura Técnica** (2-3 páginas)
   - **4.1 Stack Tecnológico**
     - Frontend: Next.js 14, React 18, TypeScript
     - Backend: Supabase (PostgreSQL + Realtime + Edge Functions)
     - IA: OpenAI GPT-4
     - UI: Sistema de componentes propietario ("Standard UI")
   
   - **4.2 Patrones Arquitectónicos**
     - Separación de capas (UI, Actions, Database)
     - Job Manager para tareas asíncronas
     - Supabase Realtime para actualizaciones en vivo
     - RPC functions para lógica compleja
   
   - **4.3 Seguridad y Escalabilidad**
     - Row-Level Security (RLS)
     - Edge Functions para IA (reducir latencia)
     - Chunking para lotes grandes
   
   - **4.4 Sistema de Tematización** ⭐ *DIFERENCIADOR*
     - Tematización completa por proyecto
     - Paletas de color independientes (monocromáticas a eclécticas)
     - Fuentes personalizables (3 temas: Clásico, Moderno, Accesible)
     - Componentes "soberanos" (orquestadores de tokens)
     - Beneficio para dislexia: Diferenciación visual clara entre proyectos
     - Opciones acotadas (no abrumadoras)
     - Respeta preferencias del usuario

**Archivo detallado:** `seccion-arquitectura-tecnica.md`

---

### 5. **Resultados y Evaluación** (3-4 páginas)
   - **5.1 Caso de Estudio**
     - Proyecto: Diseño Centrado en el Usuario (DCU)
     - Corpus: ~150 artículos
     - Dimensiones clasificadas: 8
     - Investigadores participantes: 3-4
   
   - **5.2 Métricas de Desempeño**
     - Tiempo de clasificación: IA vs Humano
     - Concordancia IA-Humano (Iteración 1): X%
     - Tasa de reconciliación exitosa (Iteración 3): Y%
     - Casos de disputa persistente: Z%
     - Tiempo ahorrado por investigador
   
   - **5.3 Análisis Cualitativo**
     - Feedback de usuarios
     - Usabilidad (SUS, entrevistas)
     - Percepción de transparencia
     - Confianza en el sistema
   
   - **5.4 Comparación con Herramientas Existentes**
     - Tabla comparativa: Covidence, Rayyan, Elicit vs SUSTRATO.AI
     - Dimensiones: Transparencia, Control humano, UX, Costo, IA, Tematización

---

### 6. **Discusión** (2-3 páginas)
   - **6.1 Fortalezas del Sistema**
     - Transparencia total del proceso
     - Balance entre automatización y control humano
     - Trazabilidad completa (auditoría)
     - UX moderna sin sacrificar rigor
     - Tematización como diferenciador UX
   
   - **6.2 Limitaciones**
     - Dependencia de API de OpenAI (costo, disponibilidad)
     - Limitaciones de GPT-4 (sesgos, idioma)
     - Curva de aprendizaje para usuarios no técnicos
     - Escalabilidad para corpus muy grandes (>5000 artículos)
   
   - **6.3 Lecciones Aprendidas**
     - Importancia del diseño iterativo
     - Necesidad de feedback constante con usuarios
     - Balance entre flexibilidad y estructura
   
   - **6.4 Contribución al Campo**
     - Modelo de integración IA-humano replicable
     - Open science: Potencial para liberar código/metodología
     - Caso de uso para otras disciplinas

---

### 7. **Conclusiones y Trabajo Futuro** (1-1.5 páginas)
   - **7.1 Conclusiones**
     - SUSTRATO.AI como solución viable para la brecha identificada
     - Validación del modelo iterativo IA-humano
     - Importancia de la transparencia en herramientas con IA
   
   - **7.2 Trabajo Futuro**
     - Quick wins implementables (ver archivo separado)
     - Visión a largo plazo:
       - Fine-tuning de modelos locales
       - Colaboración multi-investigador en tiempo real
       - Integración con bases de datos académicas (PubMed, Scopus)
       - Exportación a formatos de publicación (PRISMA flow diagram)

---

### 8. **Referencias**
   - Literatura sobre revisiones sistemáticas
   - Herramientas existentes (papers, documentación)
   - Estado del arte en IA para investigación
   - Metodologías de diseño UX

---

## 📦 Archivos Componentes

1. **seccion-introduccion.md** - Introducción completa con contexto y problema
2. **seccion-marco-teorico.md** - Revisión de literatura y posicionamiento
3. **seccion-metodologia.md** - Diseño del sistema y flujo iterativo
4. **seccion-arquitectura-tecnica.md** - Stack técnico y sistema de tematización
5. **quick-wins-tecnicos-2025-2026.md** - Plan de mejoras implementables

---

## 🎯 Puntos Clave a Destacar

### **Originalidad y Contribución:**
1. **Modelo de transparencia IA:** Cada decisión de IA es visible y justificada
2. **Iteraciones documentadas:** Sistema de versionado de clasificaciones
3. **IA como "notario":** Registra y asiste, no decide autónomamente
4. **Tematización completa:** Diferenciador UX único en herramientas académicas
5. **Balance metodológico-tecnológico:** Rigor académico + UX moderna

### **Posicionamiento Estratégico:**
- **vs Herramientas académicas:** Superior en UX, eficiencia con IA, personalización visual
- **vs Herramientas comerciales:** Superior en transparencia, control, trazabilidad, rigor metodológico
- **Nicho identificado:** Investigadores en ciencias sociales que necesitan rigor + eficiencia

---

## 📅 Timeline de Trabajo (Oct 2025 - Mar 2026)

### **Fase 1: Escritura del Paper (Oct - Dic 2025)**
- **Oct 2025:** Estructura completa, introducción, marco teórico
- **Nov 2025:** Metodología, arquitectura, redacción de resultados preliminares
- **Dic 2025:** Análisis de datos, gráficos, primera versión completa

### **Fase 2: Quick Wins Técnicos (Nov 2025 - Feb 2026)**
- Implementar mejoras técnicas mientras se escribe el paper
- Ver archivo: `quick-wins-tecnicos-2025-2026.md`

### **Fase 3: Revisión y Preparación (Ene - Feb 2026)**
- **Ene 2026:** Revisión con pares, feedback de usuarios piloto
- **Feb 2026:** Correcciones, mejora de visualizaciones, pulido

### **Fase 4: Publicación y Presentación (Mar 2026)**
- **Mar 2026:** Envío a conferencias/journals, preparación de presentación

---

## 🎓 Posibles Venues de Publicación

### **Conferencias:**
- CHI (Human-Computer Interaction) - Enfoque en UX y IA
- CSCW (Computer-Supported Cooperative Work) - Colaboración en investigación
- IUI (Intelligent User Interfaces) - IA + diseño de interfaces
- DIS (Designing Interactive Systems) - Diseño de herramientas

### **Journals:**
- Journal of Open Source Software (JOSS) - Si se libera el código
- Research Synthesis Methods - Específico de revisiones sistemáticas
- Behaviour & Information Technology - HCI + herramientas
- Information Processing & Management - Gestión de información científica

---

**Próximos pasos:** Revisar y expandir cada sección en sus archivos dedicados.
