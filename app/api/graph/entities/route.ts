/**
 * GET /api/graph/entities
 *
 * Devuelve todas las entidades (conceptos) del módulo Cognética Forense
 * con su frecuencia de menciones y el total global.
 *
 * Entidad real en DB: `cgt_conceptos` (id, nombre_canonico, project_id)
 * Menciones reales:   `cgt_conceptos_menciones` (concepto_id, artefacto_id)
 * Vista con conteo:   `cgt_vw_conceptos_con_conteo` (id, nombre_canonico, menciones_count)
 *
 * Respuesta:
 * {
 *   entities: Array<{ id: string; label: string; freq: number }>;
 *   total: number;
 * }
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { getScenario, MOCK_COOKIE_NAME } from "@/lib/grafo/mock-data";

export interface EntityNode {
  id: string;
  label: string;
  freq: number;
  /**
   * Tipo opcional del nodo. Referencia a `GraphNodeType.id` que el cliente
   * define en su catálogo. El handler real aún no lo provee (queda undefined),
   * el mock sí lo usa para ejercitar la feature de tipos en StandardGrafo.
   */
  typeId?: string;
}

export interface EntitiesResponse {
  entities: EntityNode[];
  total: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const mockId = cookies().get(MOCK_COOKIE_NAME)?.value;
    const mockScenario = getScenario(mockId);
    if (mockScenario) {
      const response: EntitiesResponse = {
        entities: mockScenario.entities,
        total: mockScenario.total,
      };
      return NextResponse.json(response);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener conceptos con su conteo de menciones desde la vista ya agregada
    const { data, error } = await supabase
      .from("cgt_vw_conceptos_con_conteo")
      .select("id, nombre_canonico, menciones_count")
      .order("menciones_count", { ascending: false });

    if (error) {
      console.error("[graph:entities] Error consultando conceptos:", error);
      return NextResponse.json(
        { error: "Error consultando entidades" },
        { status: 500 }
      );
    }

    const entities: EntityNode[] = (data ?? [])
      .filter((row) => row.id !== null && row.nombre_canonico !== null)
      .map((row) => ({
        id: row.id as string,
        label: row.nombre_canonico as string,
        freq: (row.menciones_count as number | null) ?? 0,
      }));

    // total = cantidad de artefactos en el corpus (REQ-002: "total de artefactos")
    const { count: artefactosCount, error: countError } = await supabase
      .from("cgt_artefactos")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(
        "[graph:entities] Error contando artefactos:",
        countError
      );
      return NextResponse.json(
        { error: "Error contando artefactos del corpus" },
        { status: 500 }
      );
    }

    const total = artefactosCount ?? 0;

    const response: EntitiesResponse = { entities, total };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[graph:entities] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
