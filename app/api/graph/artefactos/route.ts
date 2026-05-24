/**
 * GET /api/graph/artefactos?project_id=<uuid>
 *
 * Devuelve los artefactos del proyecto indicado (con su tipo y la cantidad
 * de menciones de conceptos que contienen como freq). Sirve como input para
 * el grafo "artefacto-céntrico" de Cognética.
 *
 * En esta etapa el grafo siempre es por UN proyecto a la vez — el patrón
 * de filtrado coincide con `app/cognetica/page.tsx` (raíz de Cognética).
 * Cuando llegue el momento, podríamos exponer una variante multi-proyecto.
 *
 * Respuesta:
 * {
 *   entities: Array<{ id, label, freq, typeId }>;   // typeId = cgt_tipo_artefacto
 *   total: number;                                   // cantidad de artefactos del proyecto
 * }
 *
 * NOTA: este handler NO atiende la cookie `graph_mock`. El mock vive solo
 * en `/api/graph/{entities,cooccurrence}` (conceptos, usados por el showroom).
 * Para probar este flujo necesitás proyecto activo + auth real.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { EntitiesResponse } from "@/app/api/graph/entities/route";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const projectId = request.nextUrl.searchParams.get("project_id");
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

    // Artefactos del proyecto (RLS también restringe por permisos del usuario)
    const { data: artefactos, error: artefactosError } = await supabase
      .from("cgt_artefactos")
      .select("id, titulo, tipo")
      .eq("project_id", projectId)
      .order("titulo", { ascending: true });

    if (artefactosError) {
      console.error("[graph:artefactos] Error consultando artefactos:", artefactosError);
      return NextResponse.json(
        { error: "Error consultando artefactos" },
        { status: 500 }
      );
    }

    if (!artefactos || artefactos.length === 0) {
      return NextResponse.json({ entities: [], total: 0 });
    }

    const artefactoIds = artefactos.map((a) => a.id);

    // Menciones de los artefactos del proyecto (una sola query)
    const { data: menciones, error: mencionesError } = await supabase
      .from("cgt_conceptos_menciones")
      .select("artefacto_id")
      .in("artefacto_id", artefactoIds);

    if (mencionesError) {
      console.error("[graph:artefactos] Error consultando menciones:", mencionesError);
      return NextResponse.json(
        { error: "Error consultando menciones" },
        { status: 500 }
      );
    }

    const freqByArtefacto = new Map<string, number>();
    for (const m of menciones ?? []) {
      if (!m.artefacto_id) continue;
      freqByArtefacto.set(m.artefacto_id, (freqByArtefacto.get(m.artefacto_id) ?? 0) + 1);
    }

    const entities = artefactos.map((a) => ({
      id: a.id,
      label: a.titulo,
      freq: freqByArtefacto.get(a.id) ?? 0,
      typeId: a.tipo as string, // audio | pdf_slides | pdf_informe | markdown | video | imagen
    }));

    const response: EntitiesResponse = { entities, total: artefactos.length };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[graph:artefactos] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
