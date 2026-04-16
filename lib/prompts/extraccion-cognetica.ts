/**
 * PROMPT DE EXTRACCIÓN COGNÉTICA TDC-QUIPU v1.0
 * 
 * Este prompt extrae de una transcripción:
 * 1. Semillas Fractales (conceptos abstractos)
 * 2. Disciplinas mencionadas
 * 3. Pensadores/Científicos citados
 * 4. Teorías/Paradigmas referenciados
 * 5. Corrientes de Pensamiento detectadas
 * 6. Equivalencias Semántico-Geométricas
 */

export interface ExtraccionCogneticaInput {
  transcription: string;
  friction_score: number;
  ethical_debt_score: number;
  viability_score: number;
  tdc_status: 'coherent' | 'broken';
  system_type: 'F0-SlowMemory' | 'F1-FastMemory' | 'Mixto';
}

export interface SemillaFractal {
  nombre: string;              // 2-4 palabras
  descripcion: string;         // 1-2 frases
  contexto: string;            // Fragmento donde aparece
  tipo: 'concepto' | 'patron' | 'relacion' | 'metafora';
  geometria: string | null;    // "fractal", "espiral", "atractor", etc.
  disciplina_origen: string | null;
  confianza: number;           // 0-1
  prompt_imagen?: string;      // Solo si es visualizable
}

export interface DisciplinaDetectada {
  nombre: string;
  aliases: string[];
  tipo: 'ciencia' | 'humanidades' | 'arte' | 'interdisciplinar';
  contexto: string;
  relevancia: number;          // 0-1
}

export interface PensadorDetectado {
  nombre: string;
  aliases: string[];
  era: string;
  disciplina_principal: string;
  teorias_asociadas: string[];
  contribuciones: string[];
  contexto: string;
  relevancia: number;
}

export interface TeoriaDetectada {
  nombre: string;
  aliases: string[];
  disciplina_origen: string;
  pensadores_clave: string[];
  descripcion: string;
  contexto: string;
  system_type_probable: 'F0-SlowMemory' | 'F1-FastMemory' | 'Mixto';
  geometria_tipica: string | null;
  relevancia: number;
}

export interface CorrienteDetectada {
  nombre: string;
  aliases: string[];
  era: string;
  descripcion: string;
  figuras_clave: string[];
  teorias_relacionadas: string[];
  contexto: string;
  relevancia: number;
}

export interface EquivalenciaDetectada {
  concepto_a: string;
  dominio_a: string;
  concepto_b: string;
  dominio_b: string;
  tipo_equivalencia: 'isomorfismo' | 'analogia' | 'metafora' | 'identidad';
  geometria_comun: string | null;
  descripcion: string;
  evidencia: string;
  confianza: number;
}

export interface ExtraccionCogneticaOutput {
  semillas_fractales: SemillaFractal[];
  disciplinas: DisciplinaDetectada[];
  pensadores: PensadorDetectado[];
  teorias: TeoriaDetectada[];
  corrientes: CorrienteDetectada[];
  equivalencias: EquivalenciaDetectada[];
  resumen_cognetico: string;
  geometria_dominante: string | null;
  temas_transversales: string[];
}

/**
 * Genera el prompt completo para extracción cognética
 */
export function generarPromptExtraccion(input: ExtraccionCogneticaInput): string {
  return `# PROTOCOLO DE EXTRACCIÓN COGNÉTICA TDC-QUIPU v1.0

## CONTEXTO DEL ARTEFACTO

**Análisis de Viabilidad:**
- Fricción (F): ${input.friction_score}/100
- Deuda Ética (De): ${input.ethical_debt_score}/100
- Viabilidad (V): ${input.viability_score}
- Estado TDC: ${input.tdc_status === 'coherent' ? '🟢 Triángulo Coherente' : '🔴 Triángulo Roto'}
- Tipo de Sistema: ${input.system_type}

## TRANSCRIPCIÓN A ANALIZAR

\`\`\`
${input.transcription}
\`\`\`

## INSTRUCCIONES DE EXTRACCIÓN

Analiza profundamente esta transcripción y extrae TODOS los elementos cognéticos siguientes:

### 1. SEMILLAS FRACTALES (Conceptos Clave)
Identifica conceptos abstractos, patrones, relaciones o metáforas que sean:
- **Originales**: No lugares comunes
- **Operativos**: Pueden usarse para entender/resolver problemas
- **Geométricos**: Tienen una forma visual implícita (espiral, fractal, atractor, red, etc.)

Para cada semilla, indica:
- Nombre (2-4 palabras evocadoras)
- Descripción breve
- Contexto (fragmento textual donde aparece)
- Tipo: concepto | patron | relacion | metafora
- Geometría asociada (si aplica)
- Disciplina de origen (si aplica)
- Nivel de confianza (0-1)
- Prompt de imagen (si es visualizable como concepto abstracto)

### 2. DISCIPLINAS
Detecta cualquier mención a campos del conocimiento:
- Ciencias naturales (física, biología, química...)
- Ciencias sociales (psicología, sociología, economía...)
- Humanidades (filosofía, historia, literatura...)
- Interdisciplinas (neurociencia, ciencias cognitivas...)
- Artes y técnicas

### 3. PENSADORES/CIENTÍFICOS
Identifica personas mencionadas que sean:
- Científicos
- Filósofos
- Teóricos
- Investigadores
- Cualquier figura intelectual relevante

Para cada uno, indica teorías asociadas y contribuciones mencionadas.

### 4. TEORÍAS/PARADIGMAS
Detecta marcos teóricos mencionados explícita o implícitamente:
- Teoría del Caos
- Teoría de Sistemas
- Constructivismo
- Fenomenología
- TDC (Triángulo de Deriva Coherente)
- Cualquier otro marco teórico

Evalúa si cada teoría es F0 (coherente, estructura duradera) o F1 (volátil, reactiva).

### 5. CORRIENTES DE PENSAMIENTO
Identifica escuelas o movimientos intelectuales:
- Humanismo
- Racionalismo
- Empirismo
- Pensamiento sistémico
- Complejidad
- etc.

### 6. EQUIVALENCIAS SEMÁNTICO-GEOMÉTRICAS
¡CRÍTICO! Busca conexiones entre conceptos de DIFERENTES dominios que compartan:
- Estructura geométrica común
- Dinámica similar
- Isomorfismos conceptuales

Ejemplo: "atractor" en física dinámica ↔ "hábito" en psicología → ambos son puntos de convergencia en un espacio de estados.

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con un JSON válido siguiendo esta estructura:

\`\`\`json
{
  "semillas_fractales": [
    {
      "nombre": "Vulnerabilidad Post-Logro",
      "descripcion": "Estado de apertura emocional tras resolver un problema técnico",
      "contexto": "...fragmento de la transcripción...",
      "tipo": "concepto",
      "geometria": "flor que se abre",
      "disciplina_origen": "psicología",
      "confianza": 0.85,
      "prompt_imagen": "A delicate flower blooming from rusted electronic circuitry, sacred geometry, fractal patterns, golden ratio spiral, soft ethereal light, philosophical concept visualization"
    }
  ],
  "disciplinas": [
    {
      "nombre": "Psicología",
      "aliases": ["psico", "psicológico"],
      "tipo": "ciencia",
      "contexto": "...fragmento...",
      "relevancia": 0.9
    }
  ],
  "pensadores": [
    {
      "nombre": "Carl Jung",
      "aliases": ["Jung"],
      "era": "Siglo XX",
      "disciplina_principal": "Psicología analítica",
      "teorias_asociadas": ["Inconsciente colectivo", "Arquetipos"],
      "contribuciones": ["Tipos psicológicos"],
      "contexto": "...fragmento...",
      "relevancia": 0.8
    }
  ],
  "teorias": [
    {
      "nombre": "Teoría del Caos",
      "aliases": ["Chaos Theory", "Dinámica no lineal"],
      "disciplina_origen": "Física",
      "pensadores_clave": ["Lorenz", "Feigenbaum"],
      "descripcion": "Estudio de sistemas sensibles a condiciones iniciales",
      "contexto": "...fragmento...",
      "system_type_probable": "F0-SlowMemory",
      "geometria_tipica": "atractor extraño",
      "relevancia": 0.9
    }
  ],
  "corrientes": [
    {
      "nombre": "Pensamiento Sistémico",
      "aliases": ["Systems Thinking"],
      "era": "Siglo XX - Contemporáneo",
      "descripcion": "Enfoque que ve totalidades e interrelaciones",
      "figuras_clave": ["Von Bertalanffy", "Bateson"],
      "teorias_relacionadas": ["Teoría General de Sistemas"],
      "contexto": "...fragmento...",
      "relevancia": 0.85
    }
  ],
  "equivalencias": [
    {
      "concepto_a": "atractor",
      "dominio_a": "física",
      "concepto_b": "hábito",
      "dominio_b": "psicología",
      "tipo_equivalencia": "isomorfismo",
      "geometria_comun": "punto de convergencia en espacio de estados",
      "descripcion": "Ambos representan estados hacia los que el sistema tiende naturalmente",
      "evidencia": "...fragmento donde se conectan...",
      "confianza": 0.8
    }
  ],
  "resumen_cognetico": "Breve resumen de los hallazgos principales en 2-3 oraciones",
  "geometria_dominante": "espiral" | "fractal" | "red" | "atractor" | null,
  "temas_transversales": ["coherencia", "complejidad", "emergencia"]
}
\`\`\`

## CRITERIOS DE CALIDAD

1. **Precisión**: Solo incluir elementos que realmente aparezcan o se infieran claramente del texto
2. **Contexto**: Siempre incluir el fragmento textual que soporta cada hallazgo
3. **Confianza**: Ser honesto con los niveles de confianza
4. **Geometría**: Buscar activamente patrones geométricos en los conceptos
5. **Equivalencias**: Priorizar el descubrimiento de conexiones entre dominios diferentes
6. **F0/F1**: Evaluar si cada elemento tiende a coherencia estructural (F0) o volatilidad reactiva (F1)

## NOTA SOBRE r=3.57

La constante de Feigenbaum (r=3.57) representa el borde del caos, donde emerge la complejidad organizada.
Si detectas conceptos que operan en este "borde", márcalos como alta viabilidad y geometría fractal.

---

RESPONDE SOLO CON EL JSON. Sin explicaciones adicionales.`;
}

/**
 * Prompt simplificado para extracción rápida (menos tokens)
 */
export function generarPromptRapido(transcription: string): string {
  return `Analiza esta transcripción y extrae en JSON:
1. "conceptos": [{nombre, descripcion, geometria}] - Conceptos abstractos clave
2. "pensadores": [nombres] - Científicos/filósofos mencionados
3. "teorias": [nombres] - Marcos teóricos referenciados
4. "disciplinas": [nombres] - Campos del conocimiento
5. "equivalencias": [{a, b, tipo}] - Conexiones entre dominios diferentes

Transcripción:
"""
${transcription}
"""

Responde SOLO JSON válido.`;
}

/**
 * Prompt para generar imagen de concepto (Avatar Dr. Jung)
 */
export function generarPromptImagen(concepto: SemillaFractal): string {
  const base = `Create an abstract philosophical visualization of the concept: "${concepto.nombre}"

Description: ${concepto.descripcion}

STYLE REQUIREMENTS:
- Sacred geometry patterns
- Fractal structures at r=3.57 (edge of chaos)
- Golden ratio proportions
- ${concepto.geometria ? `Dominant shape: ${concepto.geometria}` : 'Organic flowing forms'}
- Ethereal, philosophical mood
- No human faces or text
- Abstract art style
- Soft, contemplative lighting

COLOR PALETTE:
- Deep blues and purples for depth
- Golden accents for structure
- Soft whites for highlights
- ${concepto.tipo === 'concepto' ? 'Cool, intellectual tones' : ''}
- ${concepto.tipo === 'patron' ? 'Rhythmic, repeating color variations' : ''}
- ${concepto.tipo === 'relacion' ? 'Warm connecting gradients' : ''}
- ${concepto.tipo === 'metafora' ? 'Dual-toned symbolic contrasts' : ''}

COMPOSITION:
- Central focal point representing the core concept
- Radiating complexity from center
- Balanced but dynamic
- Sense of emergence and unfolding`;

  return base;
}

/**
 * Prompt para interpretación visual (Gemini Vision)
 */
export function generarPromptInterpretacion(conceptoOriginal: string): string {
  return `Analiza esta imagen generada a partir del concepto: "${conceptoOriginal}"

RESPONDE EN JSON:
{
  "patrones_geometricos": ["lista de patrones observados"],
  "fractal_detectado": true/false,
  "autosimilaridad": "descripción si hay elementos que se repiten a diferentes escalas",
  "coherencia_concepto": "high" | "medium" | "low",
  "justificacion_coherencia": "por qué la imagen refleja o no el concepto",
  "insights_emergentes": "nuevos significados o conexiones que emergen de la visualización",
  "tdc_visual": {
    "percepcion": "clear" | "ambiguous" | "obscure",
    "interpretacion": "coherent" | "partial" | "incoherent",
    "accion": "generates_understanding" | "neutral" | "confuses"
  },
  "elementos_destacados": ["lista de elementos visuales más significativos"],
  "simbolismo_detectado": "interpretación simbólica si aplica"
}

Sé analítico y preciso. Busca activamente patrones fractales y geometría sagrada.`;
}
