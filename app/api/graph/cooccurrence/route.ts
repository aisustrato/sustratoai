/**
 * GET /api/graph/cooccurrence?min_weight=1
 *
 * Calcula co-ocurrencia de conceptos entre artefactos.
 * Una co-ocurrencia ocurre cuando dos conceptos distintos aparecen
 * en el mismo artefacto. El peso (weight) es la cantidad de artefactos
 * compartidos.
 *
 * Usa un self-join en `cgt_conceptos_menciones` — una sola query, sin N+1.
 *
 * Tablas reales:
 *   - cgt_conceptos_menciones (artefacto_id, concepto_id)
 *
 * Respuesta:
 * {
 *   edges: Array<{ source: string; target: string; weight: number }>;
 * }
 *
 * Query param:
 *   - min_weight: number (default 1) — filtra aristas con weight < min_weight
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export interface CooccurrenceEdge {
  source: string;
  target: string;
  weight: number;
}

export interface CooccurrenceResponse {
  edges: CooccurrenceEdge[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const minWeightParam = searchParams.get("min_weight");
    const minWeight = minWeightParam !== null ? parseInt(minWeightParam, 10) : 1;

    if (isNaN(minWeight) || minWeight < 1) {
      return NextResponse.json(
        { error: "Parámetro min_weight debe ser un entero >= 1" },
        { status: 400 }
      );
    }

    // Self-join en cgt_conceptos_menciones: para cada par (a, b) con a < b
    // en el mismo artefacto, contar cuántos artefactos los comparten.
    // Supabase PostgREST no expone self-joins directamente, usamos rpc o
    // hacemos el join a nivel de aplicación desde una sola select.
    //
    // Estrategia: traer todas las menciones de una vez y calcular en memoria.
    // Esto es O(n·k) donde n=menciones, k=conceptos_por_artefacto — viable
    // para el corpus actual y sin N+1.
    const { data: menciones, error } = await supabase
      .from("cgt_conceptos_menciones")
      .select("artefacto_id, concepto_id")
      .not("concepto_id", "is", null);

    if (error) {
      console.error("[graph:cooccurrence] Error consultando menciones:", error);
      return NextResponse.json(
        { error: "Error consultando co-ocurrencias" },
        { status: 500 }
      );
    }

    // Agrupar concepto_ids por artefacto_id
    const byArtefacto = new Map<string, string[]>();
    for (const m of menciones ?? []) {
      if (!m.artefacto_id || !m.concepto_id) continue;
      const list = byArtefacto.get(m.artefacto_id);
      if (list) {
        list.push(m.concepto_id);
      } else {
        byArtefacto.set(m.artefacto_id, [m.concepto_id]);
      }
    }

    // Calcular co-ocurrencias con par canónico (a < b) para evitar duplicados
    const pairWeights = new Map<string, number>();
    for (const conceptIds of byArtefacto.values()) {
      const unique = [...new Set(conceptIds)].sort();
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const key = `${unique[i]}|||${unique[j]}`;
          pairWeights.set(key, (pairWeights.get(key) ?? 0) + 1);
        }
      }
    }

    const edges: CooccurrenceEdge[] = [];
    for (const [key, weight] of pairWeights.entries()) {
      if (weight < minWeight) continue;
      const [source, target] = key.split("|||");
      edges.push({ source, target, weight });
    }

    // Ordenar por peso descendente para consistencia
    edges.sort((a, b) => b.weight - a.weight);

    const response: CooccurrenceResponse = { edges };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[graph:cooccurrence] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
