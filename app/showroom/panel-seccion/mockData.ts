export interface MockVersion {
  version: number;
  archetype: 'bufon' | 'auditor' | 'editor' | 'colega' | null;
  timestamp: string;
  content: string;
}

// Fuente curada = artefacto de Cognetica vinculado a la sección
export interface CuratedSource {
  id: string;
  title: string;
  type: 'paper' | 'analysis' | 'dataset' | 'report';
  summary: string;
  cogneticaId: string; // ID del artefacto en Cognetica
  addedAt: string;
}

export interface MockSection {
  id: string;
  title: string;
  description: string;
  content: string;
  version: number;
  wordCount: number;
  charCount: number;
  lastEdited: string;
  versions: MockVersion[];
  curatedSources: CuratedSource[]; // Artefactos de Cognetica vinculados
}

// Comentario individual del arquetipo
export interface ArchetypeComment {
  id: string;
  point: string; // El punto que comenta
  observation: string; // Su observación
  userResponse?: 'approve' | 'modify' | 'reject'; // Respuesta del usuario
  userNote?: string; // Nota del usuario (ej: "reforzar esto", "cambiar aquello")
}

// Análisis completo del arquetipo
export interface ArchetypeAnalysis {
  archetype: 'bufon' | 'auditor' | 'editor' | 'colega';
  comments: ArchetypeComment[];
  tokens: {
    totalTokenCount: number;
    promptTokenCount: number;
    candidatesTokenCount: number;
  };
  status: 'pending_calibration' | 'calibrated' | 'executed'; // Estado del análisis
}

export const mockSections: MockSection[] = [
  {
    id: '1',
    title: 'Introducción',
    description: 'Introducción al tema principal del paper',
    content: `# Introducción

Este es el contenido MD de la introducción al paper científico sobre inteligencia artificial y cognición.

## Contexto

El contexto del estudio es fundamental para entender la problemática que abordamos. En los últimos años, la IA ha avanzado significativamente.

## Objetivo

El objetivo principal de este estudio es analizar...`,
    version: 3,
    wordCount: 150,
    charCount: 890,
    lastEdited: 'hace 2 horas',
    curatedSources: [
      {
        id: 'src-1',
        title: 'Attention Is All You Need',
        type: 'paper',
        summary: 'Paper fundacional sobre arquitectura Transformer que revolucionó el procesamiento de lenguaje natural.',
        cogneticaId: 'cog-artifact-001',
        addedAt: 'hace 1 día'
      },
      {
        id: 'src-2',
        title: 'Análisis de Modelos de Lenguaje 2024',
        type: 'analysis',
        summary: 'Análisis comparativo de GPT-4, Claude y Gemini en tareas de razonamiento.',
        cogneticaId: 'cog-artifact-045',
        addedAt: 'hace 3 horas'
      },
      {
        id: 'src-3',
        title: 'Dataset MMLU Extended',
        type: 'dataset',
        summary: 'Dataset extendido para evaluación multitarea de modelos de lenguaje.',
        cogneticaId: 'cog-artifact-112',
        addedAt: 'hace 2 días'
      }
    ],
    versions: [
      {
        version: 3,
        archetype: 'editor',
        timestamp: 'hace 2 horas',
        content: '# Introducción\n\nEste es el contenido MD de la introducción...'
      },
      {
        version: 2,
        archetype: 'auditor',
        timestamp: 'hace 5 horas',
        content: '# Introducción\n\nContenido de la versión 2...'
      },
      {
        version: 1,
        archetype: null,
        timestamp: 'hace 1 día',
        content: '# Introducción\n\nContenido original...'
      }
    ]
  },
  {
    id: '2',
    title: 'Metodología',
    description: 'Descripción de los métodos utilizados en el estudio',
    content: `# Metodología

## Diseño del Estudio

Se utilizó un diseño experimental con grupo control y grupo experimental.

## Participantes

La muestra consistió en 120 participantes divididos equitativamente entre ambos grupos.

## Procedimiento

El procedimiento siguió las siguientes etapas:

1. Reclutamiento y consentimiento informado
2. Aplicación de pre-test
3. Intervención experimental
4. Aplicación de post-test
5. Análisis de datos`,
    version: 2,
    wordCount: 320,
    charCount: 1850,
    lastEdited: 'hace 1 día',
    curatedSources: [
      {
        id: 'src-4',
        title: 'Protocolo de Evaluación Cognitiva',
        type: 'report',
        summary: 'Protocolo estandarizado para evaluación de capacidades cognitivas en adultos.',
        cogneticaId: 'cog-artifact-078',
        addedAt: 'hace 5 horas'
      },
      {
        id: 'src-5',
        title: 'Dataset de Respuestas Experimentales',
        type: 'dataset',
        summary: 'Conjunto de datos de 500+ participantes en estudios similares.',
        cogneticaId: 'cog-artifact-156',
        addedAt: 'hace 1 día'
      }
    ],
    versions: [
      {
        version: 2,
        archetype: 'colega',
        timestamp: 'hace 1 día',
        content: '# Metodología\n\n## Diseño del Estudio...'
      },
      {
        version: 1,
        archetype: null,
        timestamp: 'hace 3 días',
        content: '# Metodología\n\nContenido original...'
      }
    ]
  },
  {
    id: '3',
    title: 'Resultados',
    description: 'Presentación de los hallazgos principales',
    content: `# Resultados

## Análisis Descriptivo

Los resultados descriptivos muestran tendencias interesantes en los datos recolectados.

## Análisis Inferencial

Se aplicaron pruebas t de Student para comparar los grupos.`,
    version: 1,
    wordCount: 85,
    charCount: 420,
    lastEdited: 'hace 3 días',
    curatedSources: [
      {
        id: 'src-6',
        title: 'Análisis Estadístico Bayesiano',
        type: 'analysis',
        summary: 'Framework para análisis estadístico con enfoque bayesiano en ciencias cognitivas.',
        cogneticaId: 'cog-artifact-203',
        addedAt: 'hace 6 horas'
      }
    ],
    versions: [
      {
        version: 1,
        archetype: null,
        timestamp: 'hace 3 días',
        content: '# Resultados\n\n## Análisis Descriptivo...'
      }
    ]
  }
];

export const mockAnalyses: Record<string, ArchetypeAnalysis> = {
  bufon: {
    archetype: 'bufon',
    status: 'pending_calibration',
    comments: [
      {
        id: 'buf-1',
        point: 'Apertura del texto',
        observation: '¡Ey! Esta introducción está más seca que tostada sin mantequilla. Necesitas un gancho inicial que atrape al lector. ¿Por qué no empezar con algo provocador como: "La IA está en todos lados, hasta en tu tostadora. Pero, ¿realmente entiende algo?"'
      },
      {
        id: 'buf-2',
        point: 'Tono académico',
        observation: 'Demasiado formal, parece que le hablas a robots. Relájate un poco sin perder rigor. Un toque más humano conecta mejor con el lector.'
      },
      {
        id: 'buf-3',
        point: 'Contexto',
        observation: 'El contexto es aburrido, necesita más sabor. Cuenta una historia, usa una metáfora, algo que haga que la gente quiera seguir leyendo.'
      }
    ],
    tokens: {
      totalTokenCount: 1234,
      promptTokenCount: 800,
      candidatesTokenCount: 434
    }
  },
  auditor: {
    archetype: 'auditor',
    status: 'pending_calibration',
    comments: [
      {
        id: 'aud-1',
        point: 'Definiciones precisas',
        observation: 'No defines claramente qué entiendes por "cognición" en el contexto de IA. Necesitas una sección de "Definiciones clave" antes del contexto para establecer el marco conceptual.'
      },
      {
        id: 'aud-2',
        point: 'Referencias bibliográficas',
        observation: 'Solo 2 citas en toda la introducción. Densidad de citas: 1.3%. Recomendado: incluir al menos 5-7 referencias de literatura reciente (2020-2024). Densidad objetivo: 5-8%.'
      },
      {
        id: 'aud-3',
        point: 'Estructura lógica',
        observation: 'El salto del contexto al objetivo es abrupto. Falta un párrafo de transición que conecte ambas secciones y justifique el estudio.'
      },
      {
        id: 'aud-4',
        point: 'Hipótesis de investigación',
        observation: 'No especificas hipótesis de investigación. Un paper científico debe declarar explícitamente qué se espera encontrar.'
      },
      {
        id: 'aud-5',
        point: 'Longitud del texto',
        observation: 'Longitud actual: 150 palabras. Recomendado para introducción: 250-300 palabras. Necesitas expandir el contenido.'
      }
    ],
    tokens: {
      totalTokenCount: 1456,
      promptTokenCount: 850,
      candidatesTokenCount: 606
    }
  },
  editor: {
    archetype: 'editor',
    status: 'pending_calibration',
    comments: [
      {
        id: 'edit-1',
        point: 'Apertura impactante',
        observation: 'Comienza con una estadística o pregunta provocadora que capte la atención. La apertura actual es demasiado plana.'
      },
      {
        id: 'edit-2',
        point: 'Contexto expandido',
        observation: 'Tu contexto actual es muy breve. Sugiero desarrollarlo en 2-3 párrafos: (1) Estado del arte en IA, (2) Brecha identificada en la literatura, (3) Relevancia del estudio.'
      },
      {
        id: 'edit-3',
        point: 'Objetivo refinado',
        observation: 'El objetivo debe ser más específico. En lugar de "analizar", usa verbos más precisos como "evaluar", "comparar", "determinar".'
      },
      {
        id: 'edit-4',
        point: 'Redacción - Línea 3',
        observation: '"ha avanzado significativamente" → "ha experimentado avances exponenciales". Más impacto, más precisión.'
      },
      {
        id: 'edit-5',
        point: 'Conectores entre párrafos',
        observation: 'Agregar conectores lógicos entre párrafos para mejorar la fluidez del texto. Actualmente los párrafos están desconectados.'
      },
      {
        id: 'edit-6',
        point: 'Alcance temporal',
        observation: 'Especificar el alcance temporal del estudio. ¿Qué período abarca? ¿Qué horizonte temporal tiene?'
      }
    ],
    tokens: {
      totalTokenCount: 1678,
      promptTokenCount: 920,
      candidatesTokenCount: 758
    }
  },
  colega: {
    archetype: 'colega',
    status: 'pending_calibration',
    comments: [
      {
        id: 'col-1',
        point: 'Ángulo único del estudio',
        observation: 'Cuando leo tu introducción me pregunto: ¿qué hace único a tu estudio? Hay mucha investigación sobre IA y cognición, entonces, ¿cuál es tu ángulo particular? Necesitas diferenciarte.'
      },
      {
        id: 'col-2',
        point: 'Motivación personal',
        observation: 'Tal vez podrías agregar un párrafo donde expliques por qué TÚ decidiste investigar esto. ¿Qué observaste que te motivó? Eso le da un toque más humano y conecta con el lector.'
      },
      {
        id: 'col-3',
        point: 'Ejemplo concreto inicial',
        observation: '¿Has pensado en incluir un ejemplo concreto al inicio? Algo como: "Cuando ChatGPT pasó el examen de medicina, muchos se preguntaron..." Eso ancla el tema en algo tangible y captura atención.'
      },
      {
        id: 'col-4',
        point: 'Fortalezas actuales',
        observation: 'Lo que me gustó: El tono es académico pero accesible, la estructura básica está bien pensada, y el tema es relevante y actual. Mantén esto.'
      }
    ],
    tokens: {
      totalTokenCount: 1345,
      promptTokenCount: 780,
      candidatesTokenCount: 565
    }
  }
};
