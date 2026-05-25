// 📍 app/showroom/standard-md-note/page.tsx
// Showroom del StandardMDNoteViewer — visor ligero MD con split-pane.

"use client";

import { StandardMDNoteViewer } from "@/components/ui/StandardMDNoteViewer";
import { StandardText } from "@/components/ui/StandardText";
import { StandardTabs, StandardTabsList, StandardTabsTrigger } from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
import type { Anotacion } from "@/lib/mdj/types";

// ── MD de prueba — cubre tablas, LaTeX, código, listas, anotaciones ──────

const MD_PRUEBA = `# Introducción a la Co-Creación Fractal

Este documento explora la **co-creación fractal** entre cognición humana y arquitecturas de IA generativa.

## Fundamentos Teóricos

La teoría se apoya en tres pilares fundamentales:

1. **Desafinaciones fértiles**: bucles de retroalimentación donde los errores son *datos cruciales*.
2. **Soberanía del Componente**: la lógica encapsulada resiste la ***entropía contextual***.
3. **Trazabilidad interpretativa**: registro inmutable de cada decisión.

### Métricas de Validación

Los resultados muestran:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Coherencia | 45% | 78% | +73% |
| Depuración | 120 min | 12 min | -90% |

### Implementación Técnica

El núcleo se implementa en TypeScript:

\`\`\`typescript
interface ComponenteSoberano<T> {
  readonly id: string;
  procesar(input: T): ResultadoValidado<T>;
}
\`\`\`

## Fórmulas Matemáticas

El modelo se formaliza mediante:

$$
E = \\sum_{i=1}^{n} \\alpha_i \\cdot \\frac{\\partial f_i}{\\partial x_i} + \\beta \\cdot \\nabla^2 \\Phi
$$

Donde $E$ representa la energía sinérgica y $\\alpha_i$ son los coeficientes de acoplamiento.

La probabilidad de convergencia:

$$
P(C) = \\frac{1}{1 + e^{-\\lambda \\cdot (\\sum w_j \\cdot x_j - \\theta)}}
$$

Esta es la función sigmoide estándar, donde $\\lambda$ controla la pendiente.

## Conclusiones

La investigación demuestra que la robustez **no emerge de la infalibilidad** sino de la capacidad de aceptar la imperfección como **dato**.
`;

// ── Anotaciones de prueba ────────────────────────────────────────────────

// texto_plano de h1_0.p_0:
// "Este documento explora la co-creación fractal entre cognición humana y arquitecturas de IA generativa."
// "co-creación fractal entre cognición humana y arquitecturas" = posiciones 26-84 (offset_fin=85)
// texto_plano de h1_0.h2_0.p_0:
// "La teoría se apoya en tres pilares fundamentales:" = 0-48 (offset_fin=49)

const ANOTACIONES_PRUEBA: Anotacion[] = [
  {
    id: "anot-001",
    tipo: "frase_notable",
    nodo_id: "h1_0.p_0",
    offset_inicio: 26,
    offset_fin: 85,
    fragmento: "co-creación fractal entre cognición humana y arquitecturas",
  },
  {
    id: "anot-002",
    tipo: "nota",
    nodo_id: "h1_0.h2_0.p_0",
    offset_inicio: 0,
    offset_fin: 49,
    fragmento: "La teoría se apoya en tres pilares fundamentales:",
    nota_texto: "Estos pilares fueron identificados en la primera iteración del proyecto.",
  },
];

// ── Página ───────────────────────────────────────────────────────────────

export default function StandardMDNoteShowroomPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <header className="mb-8 text-center">
        <StandardText asElement="h1" size="3xl" weight="bold" colorScheme="primary" className="mb-2">
          StandardMDNoteViewer Showroom
        </StandardText>
        <StandardText size="base" colorScheme="neutral" colorShade="subtle" className="max-w-2xl mx-auto">
          Visor ligero MD con split-pane — MD fuente ↔ vista previa con scroll sync 1:1.
          Ambos paneles comparten el mismo árbol MDJ para segmentación equivalente.
        </StandardText>
      </header>

      <StandardTabs defaultValue="viewer" className="w-full" colorScheme="primary" styleType="line">
        <StandardTabsList className="grid w-full grid-cols-3 mb-6">
          <StandardTabsTrigger value="viewer">Visor</StandardTabsTrigger>
          <StandardTabsTrigger value="raw">MD Fuente</StandardTabsTrigger>
          <StandardTabsTrigger value="info">Info</StandardTabsTrigger>
        </StandardTabsList>

        <StandardTabsContent value="viewer">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-900">
            <StandardMDNoteViewer
              md={MD_PRUEBA}
              anotaciones={ANOTACIONES_PRUEBA}
              altura="600px"
            />
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
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <StandardText weight="semibold" className="mb-1">¿Qué es el StandardMDNoteViewer?</StandardText>
              <StandardText colorScheme="neutral" colorShade="subtle">
                Un visor ligero que muestra MD fuente y vista previa lado a lado.
                Ambos paneles usan el mismo árbol MDJ para que el scroll sync sea natural 1:1.
              </StandardText>
            </div>
            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <StandardText weight="semibold" className="mb-1">Segmentación unificada</StandardText>
              <StandardText colorScheme="neutral" colorShade="subtle">
                Cada línea del MD fuente sabe qué nodo MDJ la contiene.
                Los colores sutiles indican el tipo de nodo: azul=headings, gris=código, púrpura=LaTeX, verde=tablas.
              </StandardText>
            </div>
            <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
              <StandardText weight="semibold" className="mb-1">Operadores soportados</StandardText>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>Tablas con headers y filas</li>
                <li>LaTeX bloque ($$...$$ en líneas separadas) e inline ($...$)</li>
                <li>Bloques de código con lenguaje detectado</li>
                <li>Listas ordenadas y no ordenadas (anidadas)</li>
                <li>Anotaciones con tooltips (frase notable, nota, referencia)</li>
                <li>Formato inline: negrita, cursiva, negrita+cursiva, tachado, code, links</li>
              </ul>
            </div>
            <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <StandardText weight="semibold" className="mb-1">¿Qué probar?</StandardText>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>Scroll en un panel → el otro sigue sincronizado</li>
                <li>Toggle de vista: Dividido / Solo MD / Solo Preview</li>
                <li>Colores sutiles en el panel MD fuente por tipo de nodo</li>
                <li>Hover sobre anotaciones para ver tooltips</li>
              </ul>
            </div>
          </div>
        </StandardTabsContent>
      </StandardTabs>
    </div>
  );
}
