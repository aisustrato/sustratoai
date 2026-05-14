/**
 * GET /api/graph/artefactos/cooccurrence?project_id=<uuid>&min_weight=1
 *
 * Calcula co-ocurrencia de artefactos: dos artefactos están conectados si
 * comparten al menos un concepto. El peso es la cantidad de conceptos
 * compartidos. Restringido al proyecto indicado por `project_id`.
 *
 * Es la transpuesta lógica de /api/graph/cooccurrence (conceptos):
 *   - cooccurrence (conceptos): agrupa por artefacto → pares de conceptos
 *   - artefactos/cooccurrence: agrupa por concepto → pares de artefactos
 *
 * Respuesta:
 * {
 *   edges: Array<{ source: string; target: string; weight: number }>;
 * }
 *
 * NOTA: este handler NO atiende la cookie `graph_mock`. El mock vive solo
 * en `/api/graph/{entities,cooccurrence}` (conceptos, usados por el showroom).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { CooccurrenceResponse } from "@/app/api/graph/cooccurrence/route";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minWeightParam = searchParams.get("min_weight");
    const minWeight = minWeightParam !== null ? parseInt(minWeightParam, 10) : 1;

    if (isNaN(minWeight) || minWeight < 1) {
      return NextResponse.json(
        { error: "Parámetro min_weight debe ser un entero >= 1" },
        { status: 400 }
      );
    }

    const projectId = searchParams.get("project_id");
    if (!projectId) {
      return NextResponse.json(
        { error: "Falta el parámetro project_id" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Primero traer los ids de artefactos del proyecto para acotar el cálculo.
    const { data: artefactos, error: artefactosError } = await supabase
      .from("cgt_artefactos")
      .select("id")
      .eq("project_id", projectId);

    if (artefactosError) {
      console.error("[graph:artefactos:cooccurrence] Error consultando artefactos:", artefactosError);
      return NextResponse.json(
        { error: "Error consultando artefactos del proyecto" },
        { status: 500 }
      );
    }

    if (!artefactos || artefactos.length === 0) {
      return NextResponse.json({ edges: [] });
    }

    const artefactoIds = artefactos.map((a) => a.id);

    // Menciones acotadas a los artefactos del proyecto
    const { data: menciones, error } = await supabase
      .from("cgt_conceptos_menciones")
      .select("artefacto_id, concepto_id")
      .in("artefacto_id", artefactoIds)
      .not("concepto_id", "is", null);

    if (error) {
      console.error("[graph:artefactos:cooccurrence] Error consultando menciones:", error);
      return NextResponse.json(
        { error: "Error consultando co-ocurrencias" },
        { status: 500 }
      );
    }

    // Agrupar artefacto_ids por concepto_id.
    // (Transpuesta de la query de conceptos.)
    const byConcepto = new Map<string, string[]>();
    for (const m of menciones ?? []) {
      if (!m.artefacto_id || !m.concepto_id) continue;
      const list = byConcepto.get(m.concepto_id);
      if (list) {
        list.push(m.artefacto_id);
      } else {
        byConcepto.set(m.concepto_id, [m.artefacto_id]);
      }
    }

    // Para cada concepto, contar pares de artefactos que lo comparten.
    // Par canónico (a < b) para no duplicar.
    const pairWeights = new Map<string, number>();
    for (const artefactoIds of byConcepto.values()) {
      const unique = [...new Set(artefactoIds)].sort();
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const key = `${unique[i]}|||${unique[j]}`;
          pairWeights.set(key, (pairWeights.get(key) ?? 0) + 1);
        }
      }
    }

    const edges: CooccurrenceResponse["edges"] = [];
    for (const [key, weight] of pairWeights.entries()) {
      if (weight < minWeight) continue;
      const [source, target] = key.split("|||");
      edges.push({ source, target, weight });
    }

    edges.sort((a, b) => b.weight - a.weight);

    const response: CooccurrenceResponse = { edges };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[graph:artefactos:cooccurrence] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
