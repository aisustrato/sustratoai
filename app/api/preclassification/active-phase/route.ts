import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { getActivePhaseForProject } from "@/lib/actions/preclassification_phases_actions";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const projectId = body?.projectId as string | undefined;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Parámetro 'projectId' inválido o ausente." }, { status: 400 });
    }

    const { data, error } = await getActivePhaseForProject(projectId);
    if (error) {
      return NextResponse.json({ error: error.message || "No se pudo obtener la fase activa" }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `Error interno del servidor: ${message}` }, { status: 500 });
  }
}
