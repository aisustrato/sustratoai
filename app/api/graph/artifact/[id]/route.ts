/**
 * GET /api/graph/artifact/[id]
 *
 * Devuelve un artefacto con el texto completo de cada formato disponible,
 * entidades asociadas y sha256.
 *
 * Tablas reales:
 *   - cgt_artefactos   (id, titulo, sha256_json, created_at, tipo, estado)
 *   - cgt_cronicas     (artefacto_id, contenido) — formato "cronica"
 *   - cgt_destilados   (artefacto_id, tesis)     — formato "destilado"
 *   - cgt_nucleos      (artefacto_id, tesis)      — formato "nucleo"
 *   - cgt_germinales   (artefacto_id, resumen)    — formato "germinal"
 *   - cgt_conceptos_menciones (artefacto_id, concepto_id)
 *   - cgt_conceptos    (id, nombre_canonico)
 *
 * Respuesta:
 * {
 *   artifact: {
 *     id: string;
 *     title: string;
 *     sha256: string;
 *     created_at: string;
 *     formats: { cronica?: string; destilado?: string; nucleo?: string; germinal?: string };
 *     entities: Array<{ id: string; label: string }>;
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export interface ArtifactEntity {
  id: string;
  label: string;
}

export interface ArtifactFormats {
  cronica?: string;
  destilado?: string;
  nucleo?: string;
  germinal?: string;
}

export interface ArtifactPayload {
  id: string;
  title: string;
  sha256: string;
  created_at: string;
  formats: ArtifactFormats;
  entities: ArtifactEntity[];
}

export interface ArtifactResponse {
  artifact: ArtifactPayload;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Parámetro id requerido" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener artefacto base
    const { data: artefacto, error: artefactoError } = await supabase
      .from("cgt_artefactos")
      .select("id, titulo, sha256_json, created_at")
      .eq("id", id)
      .single();

    if (artefactoError || !artefacto) {
      if (artefactoError?.code === "PGRST116") {
        return NextResponse.json(
          { error: "Artefacto no encontrado" },
          { status: 404 }
        );
      }
      console.error("[graph:artifact] Error consultando artefacto:", artefactoError);
      return NextResponse.json(
        { error: "Error consultando artefacto" },
        { status: 500 }
      );
    }

    // Traer el texto de cada formato en paralelo — 4 queries independientes.
    // Si una fila no existe, maybeSingle devuelve data: null y NO error.
    const [cronicaRes, destiladoRes, nucleoRes, germinalRes, mencionesRes] =
      await Promise.all([
        supabase
          .from("cgt_cronicas")
          .select("contenido")
          .eq("artefacto_id", id)
          .maybeSingle(),
        supabase
          .from("cgt_destilados")
          .select("tesis")
          .eq("artefacto_id", id)
          .maybeSingle(),
        supabase
          .from("cgt_nucleos")
          .select("tesis")
          .eq("artefacto_id", id)
          .maybeSingle(),
        supabase
          .from("cgt_germinales")
          .select("resumen")
          .eq("artefacto_id", id)
          .maybeSingle(),
        supabase
          .from("cgt_conceptos_menciones")
          .select("concepto_id, cgt_conceptos!inner(id, nombre_canonico)")
          .eq("artefacto_id", id)
          .not("concepto_id", "is", null),
      ]);

    if (cronicaRes.error) {
      console.error("[graph:artifact] Error consultando crónica:", cronicaRes.error);
    }
    if (destiladoRes.error) {
      console.error("[graph:artifact] Error consultando destilado:", destiladoRes.error);
    }
    if (nucleoRes.error) {
      console.error("[graph:artifact] Error consultando núcleo:", nucleoRes.error);
    }
    if (germinalRes.error) {
      console.error("[graph:artifact] Error consultando germinal:", germinalRes.error);
    }

    const formats: ArtifactFormats = {};
    if (cronicaRes.data?.contenido) formats.cronica = cronicaRes.data.contenido;
    if (destiladoRes.data?.tesis) formats.destilado = destiladoRes.data.tesis;
    if (nucleoRes.data?.tesis) formats.nucleo = nucleoRes.data.tesis;
    if (germinalRes.data?.resumen) formats.germinal = germinalRes.data.resumen;

    if (mencionesRes.error) {
      console.error(
        "[graph:artifact] Error consultando entidades del artefacto:",
        mencionesRes.error
      );
    }

    // Deduplicar entidades por id
    const entidadesMap = new Map<string, ArtifactEntity>();
    for (const m of mencionesRes.data ?? []) {
      // La relación embebida llega como objeto; el tipo generado lo expresa
      // como objeto, pero PostgREST puede enviarlo de distintas formas
      const concepto = m.cgt_conceptos as
        | { id: string; nombre_canonico: string }
        | null;
      if (concepto?.id && concepto?.nombre_canonico) {
        entidadesMap.set(concepto.id, {
          id: concepto.id,
          label: concepto.nombre_canonico,
        });
      }
    }

    const artifactPayload: ArtifactPayload = {
      id: artefacto.id,
      title: artefacto.titulo,
      sha256: artefacto.sha256_json,
      created_at: artefacto.created_at,
      formats,
      entities: [...entidadesMap.values()],
    };

    const response: ArtifactResponse = { artifact: artifactPayload };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[graph:artifact] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
