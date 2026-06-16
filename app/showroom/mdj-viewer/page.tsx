// 📍 app/showroom/mdj-viewer/page.tsx
// Showroom funcional del MDJViewer — prueba interactiva del contrato MDJ

"use client";

import { StandardMDJViewerClient } from "@/components/mdj-viewer";
import { crearClienteFalso } from "@/components/mdj-viewer/ClienteFalso";
import { StandardText } from "@/components/ui/StandardText";
import { StandardTabs, StandardTabsList, StandardTabsTrigger } from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Search, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import type { Anotacion } from "@/lib/mdj/types";
import { useState, useCallback } from "react";

// ── MD de prueba — cubre todos los tipos de nodo ─────────────────────────

const MD_PRUEBA = `# Introducción a la Co-Creación Fractal

Este documento explora la **co-creación fractal** entre cognición humana y arquitecturas de IA generativa. El concepto central es que la *sinergia metacognitiva* emerge cuando ambas partes operan en un espacio de **confianza epistémica compartida**.

## Fundamentos Teóricos

La teoría se apoya en tres pilares fundamentales:

1. **Desafinaciones fértiles**: bucles de retroalimentación donde los errores y ambigüedades no son fallos, sino *datos cruciales* para la realineación del sistema.
2. **Soberanía del Componente**: principio donde la lógica encapsulada de un módulo resiste la ***entropía contextual*** de sus implementadores.
3. **Trazabilidad interpretativa**: registro inmutable de cada decisión, con verificación criptográfica ~~SHA-256~~ SHA-512 del proceso completo.

### Métricas de Validación (2024-2026)

Los resultados de la implementación en el ecosistema \`sustrato.ai\` muestran:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Coherencia del código | 45% | 78% | +73% |
| Ciclos de depuración | 120 min | 12 min | -90% |
| Errores de contexto | 34/día | 3/día | -91% |
| Satisfacción del implementador | 3.2 | 8.7 | +172% |

### Implementación Técnica

El núcleo del sistema se implementa en TypeScript con el siguiente patrón base:

\`\`\`typescript
interface ComponenteSoberano<T> {
  readonly id: string;
  readonly contexto: ContextoInmutable;
  procesar(input: T): ResultadoValidado<T>;
  trazar(decision: DecisionTecnica): HashCriptografico;
}

class AgenteCoCreativo implements ComponenteSoberano<Prompt> {
  procesar(input: Prompt): ResultadoValidado<Prompt> {
    // La lógica vive dentro del componente
    // El exterior no puede corromperla
    return this.validar(input);
  }
}
\`\`\`

El patrón garantiza que cada componente mantenga su integridad sin depender de la disciplina externa de quien lo consume.

## Anatomía de un Error Fértil

Un error fértil no es una excepción no manejada — es una **señal** que el sistema captura, analiza y convierte en aprendizaje. Ejemplo de un error que *no* es fértil:

\`\`\`
TypeError: Cannot read properties of undefined (reading 'map')
    at procesarArtefactos (artefactos.ts:47)
\`\`\`

Y el mismo error transformado en fértil:

\`\`\`typescript
try {
  const resultado = procesarArtefactos(datos);
} catch (error) {
  console.error('[artefactos:procesar] Contexto incompleto', {
    timestamp: Date.now(),
    contexto: capturarContextoActual(),
    error: serializarError(error),
  });
  // El error se convierte en dato de entrenamiento
  registrarErrorFertil(error, contexto);
}
\`\`\`

## Conclusiones Preliminares

La investigación demuestra que la robustez arquitectónica **no emerge de la infalibilidad** sino de la capacidad de:

- Aceptar la imperfección como **dato**, no como fallo
- Documentar la fricción en tiempo real
- Permitir que el código *respire* con el contexto humano
- Mantener trazabilidad criptográfica de cada iteración

El costo total de procesamiento fue **inferior a $1 USD**, lo que demuestra que la barrera no es presupuestaria sino arquitectónica.

> "No juzgamos; notarizamos. Los datos se presentan; el lector concluye." — Principio Sustrato

## Linaje Cognitivo

La genealogía de estas ideas se remonta a **Varela** y su trabajo sobre enacción y cognición corporizada. Varela propuso que conocer es actuar — una idea que resuena profundamente con la arquitectura de sustrato.ai.

Como señaló **Varela** en "El Fenómeno de la Vida", los sistemas vivos son redes de procesos autopoiéticos que se distinguen por su capacidad de mantener su identidad a través del cambio. Esta visión de Varela inspira directamente el diseño de componentes soberanos.

Para más información, consultar el [repositorio oficial](https://github.com/anomalyco/sustrato-ai) o la [documentación técnica](https://sustrato.ai/docs).

## Fórmulas Matemáticas

El modelo de co-creación se formaliza mediante la siguiente ecuación de sinergia:

$$
E = \sum_{i=1}^{n} \alpha_i \cdot \frac{\partial f_i}{\partial x_i} + \beta \cdot \nabla^2 \Phi
$$

Donde $E$ representa la energía sinérgica, $\alpha_i$ son los coeficientes de acoplamiento, y $\Phi$ es el potencial cognitivo compartido.

La probabilidad de convergencia del sistema se calcula como:

$$
P(C) = \frac{1}{1 + e^{-\lambda \cdot (\sum_{j=1}^{m} w_j \cdot x_j - \theta)}}
$$

Esta es la función sigmoide estándar, donde $\lambda$ controla la pendiente y $\theta$ es el umbral de activación.
`;

// ── Anotaciones de prueba — frases notables, referencias, notas ──────────

const ANOTACIONES_PRUEBA: Anotacion[] = [
  {
    id: "anot-001",
    tipo: "frase_notable",
    nodo_id: "h1_0.p_0",
    offset_inicio: 133,
    offset_fin: 196,
    fragmento: "sinergia metacognitiva cuando ambas partes operan en un espacio",
  },
  {
    id: "anot-002",
    tipo: "referencia",
    nodo_id: "h1_0.h2_0.h3_0.p_0",
    offset_inicio: 4,
    offset_fin: 35,
    fragmento: "resultados de la implementación",
    entidad_id: "ref-varela-2024",
  },
  {
    id: "anot-003",
    tipo: "nota",
    nodo_id: "h1_0.h2_2.p_0",
    offset_inicio: 0,
    offset_fin: 57,
    fragmento: "La investigación demuestra que la robustez arquitectónica",
    nota_texto: "Esta conclusión debería citar también los hallazgos del paper de Maturana sobre autopoiesis y sistemas cognitivos.",
  },
  {
    id: "anot-004",
    tipo: "frase_notable",
    nodo_id: "h1_0.h2_0.li_1",
    offset_inicio: 25,
    offset_fin: 86,
    fragmento: "principio donde la lógica encapsulada de un módulo resiste la",
  },
  {
    id: "anot-005",
    tipo: "nota",
    nodo_id: "h1_0.h2_2.li_3",
    offset_inicio: 0,
    offset_fin: 53,
    fragmento: "Mantener trazabilidad criptográfica de cada iteración",
    nota_texto: "La trazabilidad criptográfica se implementó con SHA-256 en producción. Ver registro de validación del 13 de abril 2026.",
  },
  // Anotación huérfana — nodo_id que no existe en el árbol
  {
    id: "anot-006-huerfana",
    tipo: "frase_notable",
    nodo_id: "h1_5.p_99",
    offset_inicio: 0,
    offset_fin: 20,
    fragmento: "Este fragmento ya no existe en el documento actual",
  },
];

// ── Página ───────────────────────────────────────────────────────────────

export default function MDJViewerShowroomPage() {
  const [debeFallar, setDebeFallar] = useState(false);
  const cliente = crearClienteFalso({ debeFallar });

  const handleAgregarFrase = useCallback(
    (anotacion: Anotacion) => cliente.agregarFraseNotable(anotacion),
    [cliente],
  );
  const handleAgregarReferencia = useCallback(
    (anotacion: Anotacion) => cliente.agregarReferencia(anotacion),
    [cliente],
  );
  const handleAgregarNota = useCallback(
    (anotacion: Anotacion) => cliente.agregarNota(anotacion),
    [cliente],
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <header className="mb-8 text-center">
        <StandardText asElement="h1" size="3xl" weight="bold" colorScheme="primary" className="mb-2">
          StandardMDJViewer Showroom
        </StandardText>
        <StandardText size="base" colorScheme="neutral" colorShade="subtle" className="max-w-2xl mx-auto">
          Prueba funcional del contrato MDJ v0.1 — parseo de Markdown → árbol de nodos con anotaciones, acordeones colapsables y export portable.
        </StandardText>
      </header>

      {/* Toggle para simular fallos */}
      <div className="mb-6 flex items-center justify-center gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
        <StandardText size="sm" weight="semibold">
          Simular fallo de red:
        </StandardText>
        <button
          onClick={() => setDebeFallar(!debeFallar)}
          className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          {debeFallar ? (
            <ToggleRight size={20} className="text-warning" />
          ) : (
            <ToggleLeft size={20} className="text-success" />
          )}
          <span>{debeFallar ? "Activado" : "Desactivado"}</span>
        </button>
      </div>

      <StandardTabs defaultValue="viewer" className="w-full" colorScheme="primary" styleType="line">
        <StandardTabsList className="grid w-full grid-cols-3 mb-6">
          <StandardTabsTrigger value="viewer">Visor MDJ</StandardTabsTrigger>
          <StandardTabsTrigger value="raw">MD Fuente</StandardTabsTrigger>
          <StandardTabsTrigger value="info">Info</StandardTabsTrigger>
        </StandardTabsList>

        <StandardTabsContent value="viewer">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-900">
            <StandardMDJViewerClient
              md={MD_PRUEBA}
              artefactoId="showroom-test-001"
              tipoArtefacto="otro"
              anotaciones={ANOTACIONES_PRUEBA}
              onSeleccion={(sel) => console.log("[Showroom] Selección MDJ:", sel)}
              onAgregarFraseNotable={handleAgregarFrase}
              onAgregarReferencia={handleAgregarReferencia}
              onAgregarNota={handleAgregarNota}
            />
          </div>

          {/* Simulación: Extracciones de Cognética — navegación dinámica por búsqueda */}
          <div className="mt-6 p-5 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <StandardText weight="semibold" size="sm" className="mb-3 flex items-center gap-2">
              <ExternalLink size={14} />
              Extracciones de Cognética — navegación dinámica
            </StandardText>
            <StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="mb-4">
              Estos badges simulan entidades de Cognética. Al hacer clic, el viewer busca automáticamente la primera ocurrencia del nombre en el documento y navega a ella.
            </StandardText>
            <div className="flex flex-wrap gap-2">
              <Link href="?buscar=Varela" className="no-underline">
                <StandardBadge styleType="outline" colorScheme="secondary" leftIcon={Search} size="sm">
                  Varela (3 ocurrencias)
                </StandardBadge>
              </Link>
              <Link href="?buscar=Maturana" className="no-underline">
                <StandardBadge styleType="outline" colorScheme="primary" leftIcon={Search} size="sm">
                  Maturana
                </StandardBadge>
              </Link>
              <Link href="?buscar=autopoiesis" className="no-underline">
                <StandardBadge styleType="outline" colorScheme="success" leftIcon={Search} size="sm">
                  autopoiesis
                </StandardBadge>
              </Link>
              <Link href="?buscar=enacción" className="no-underline">
                <StandardBadge styleType="outline" colorScheme="warning" leftIcon={Search} size="sm">
                  enacción
                </StandardBadge>
              </Link>
            </div>
          </div>
        </StandardTabsContent>

        <StandardTabsContent value="raw">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-900">
            <pre className="text-sm font-mono whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 overflow-x-auto max-h-[600px] overflow-y-auto">
              {MD_PRUEBA}
            </pre>
          </div>
        </StandardTabsContent>

        <StandardTabsContent value="info">
          <div className="space-y-4 text-sm">
            <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <StandardText weight="semibold" className="mb-1">frase_notable</StandardText>
              <StandardText colorScheme="neutral" colorShade="subtle">
                Fragmentos destacados del texto con highlight amarillo y borde. Representan citas o ideas clave extraídas por el sistema.
              </StandardText>
            </div>
            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <StandardText weight="semibold" className="mb-1">referencia</StandardText>
              <StandardText colorScheme="neutral" colorShade="subtle">
                Vínculos a referencias bibliográficas. Al hacer clic navegan a la entidad correspondiente en Cognética.
              </StandardText>
            </div>
            <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
              <StandardText weight="semibold" className="mb-1">nota</StandardText>
              <StandardText colorScheme="neutral" colorShade="subtle">
                Notas del investigador ancladas a fragmentos específicos del texto.
              </StandardText>
            </div>
            <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <StandardText weight="semibold" className="mb-1">Anotaciones huérfanas</StandardText>
              <StandardText colorScheme="neutral" colorShade="subtle">
                Hay 1 anotación huérfana en los datos de prueba (nodo_id inexistente). El StandardMDJViewer muestra un aviso en la parte superior del documento — nunca falla silenciosamente.
              </StandardText>
            </div>
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <StandardText weight="semibold" className="mb-1">¿Qué probar?</StandardText>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>Colapsar/expandir secciones H1, H2, H3 con clic en el título</li>
                <li>Ver highlights de anotaciones en párrafos</li>
                <li>Ver anotaciones en ítems de listas ordenadas y no ordenadas</li>
                <li>Tablas con formato markdown (GFM)</li>
                <li>Bloques de código con lenguaje detectado</li>
                <li>Formato inline: negrita, cursiva, negrita+cursiva, tachado, code inline, links</li>
                <li><strong>Seleccionar texto</strong> → panel lateral muestra nodo_id + offsets listos para crear una Anotacion</li>
              </ul>
            </div>
          </div>
        </StandardTabsContent>
      </StandardTabs>
    </div>
  );
}
