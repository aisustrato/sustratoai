/**
 * POST /api/graph/inject-context
 *
 * Devuelve el contenido de un artefacto en el formato solicitado,
 * listo para ser inyectado como contexto en un LLM externo.
 *
 * Body JSON:
 * {
 *   artifact_id: string;
 *   format: "cronica" | "destilado" | "nucleo" | "germinal";
 *   requester?: string;
 * }
 *
 * Respuesta exitosa:
 * {
 *   context: {
 *     artifact_id: string;
 *     format: string;
 *     text: string;
 *     sha256: string;
 *     char_count: number;
 *     injected_at: string;
 *   }
 * }
 *
 * Si el formato no existe para ese artefacto → 404 con mensaje claro.
 * NO transforma el texto — se retorna tal cual está en DB.
 *
 * Tablas reales:
 *   - cgt_cronicas   (artefacto_id, contenido: string)
 *   - cgt_destilados (artefacto_id, tesis: string — representación textual del destilado)
 *   - cgt_nucleos    (artefacto_id, tesis: string)
 *   - cgt_germinales (artefacto_id, resumen: string | null)
 *   - cgt_artefactos (id, sha256_json)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

type FormatoSoportado = "cronica" | "destilado" | "nucleo" | "germinal";

const FORMATOS_SOPORTADOS: FormatoSoportado[] = [
  "cronica",
  "destilado",
  "nucleo",
  "germinal",
];

interface InjectContextBody {
  artifact_id: string;
  format: FormatoSoportado;
  requester?: string;
}

interface ContextPayload {
  artifact_id: string;
  format: string;
  text: string;
  sha256: string;
  char_count: number;
  injected_at: string;
}

interface InjectContextResponse {
  context: ContextPayload;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let body: InjectContextBody;
    try {
      body = (await request.json()) as InjectContextBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON inválido" },
        { status: 400 }
      );
    }

    const { artifact_id, format, requester } = body;

    if (!artifact_id || typeof artifact_id !== "string") {
      return NextResponse.json(
        { error: "Campo artifact_id requerido" },
        { status: 400 }
      );
    }

    if (!format || !FORMATOS_SOPORTADOS.includes(format)) {
      return NextResponse.json(
        {
          error: `Campo format requerido. Valores válidos: ${FORMATOS_SOPORTADOS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verificar que el artefacto existe y obtener su sha256
    const { data: artefacto, error: artefactoError } = await supabase
      .from("cgt_artefactos")
      .select("id, sha256_json")
      .eq("id", artifact_id)
      .single();

    if (artefactoError || !artefacto) {
      if (artefactoError?.code === "PGRST116") {
        return NextResponse.json(
          { error: "Artefacto no encontrado" },
          { status: 404 }
        );
      }
      console.error(
        "[graph:inject-context] Error consultando artefacto:",
        artefactoError
      );
      return NextResponse.json(
        { error: "Error consultando artefacto" },
        { status: 500 }
      );
    }

    // Obtener contenido según el formato solicitado
    let content: string | null = null;

    if (format === "cronica") {
      const { data, error } = await supabase
        .from("cgt_cronicas")
        .select("contenido")
        .eq("artefacto_id", artifact_id)
        .maybeSingle();

      if (error) {
        console.error("[graph:inject-context] Error consultando crónica:", error);
        return NextResponse.json(
          { error: "Error consultando crónica" },
          { status: 500 }
        );
      }
      content = data?.contenido ?? null;
    } else if (format === "destilado") {
      const { data, error } = await supabase
        .from("cgt_destilados")
        .select("tesis")
        .eq("artefacto_id", artifact_id)
        .maybeSingle();

      if (error) {
        console.error(
          "[graph:inject-context] Error consultando destilado:",
          error
        );
        return NextResponse.json(
          { error: "Error consultando destilado" },
          { status: 500 }
        );
      }
      content = data?.tesis ?? null;
    } else if (format === "nucleo") {
      const { data, error } = await supabase
        .from("cgt_nucleos")
        .select("tesis")
        .eq("artefacto_id", artifact_id)
        .maybeSingle();

      if (error) {
        console.error("[graph:inject-context] Error consultando núcleo:", error);
        return NextResponse.json(
          { error: "Error consultando núcleo" },
          { status: 500 }
        );
      }
      content = data?.tesis ?? null;
    } else if (format === "germinal") {
      const { data, error } = await supabase
        .from("cgt_germinales")
        .select("resumen")
        .eq("artefacto_id", artifact_id)
        .maybeSingle();

      if (error) {
        console.error(
          "[graph:inject-context] Error consultando germinal:",
          error
        );
        return NextResponse.json(
          { error: "Error consultando germinal" },
          { status: 500 }
        );
      }
      content = data?.resumen ?? null;
    }

    // Si no existe el formato para este artefacto → 404 explícito
    if (content === null) {
      return NextResponse.json(
        {
          error: `El formato "${format}" no existe para el artefacto "${artifact_id}"`,
        },
        { status: 404 }
      );
    }

    const injected_at = new Date().toISOString();

    // Loguear el evento de inyección de contexto
    console.log("[graph:inject-context]", {
      artifact_id,
      format,
      requester: requester ?? "desconocido",
      sha256: artefacto.sha256_json,
      char_count: content.length,
      injected_at,
      user_id: user.id,
    });

    const contextPayload: ContextPayload = {
      artifact_id,
      format,
      text: content,
      sha256: artefacto.sha256_json,
      char_count: content.length,
      injected_at,
    };

    const response: InjectContextResponse = { context: contextPayload };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[graph:inject-context] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
