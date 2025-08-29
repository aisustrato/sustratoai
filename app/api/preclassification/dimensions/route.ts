import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { listDimensions } from "@/lib/actions/dimension-actions";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const phaseId = body?.phaseId as string | undefined;
    const includeArchived = Boolean(body?.includeArchived ?? false);

    if (!phaseId || typeof phaseId !== "string") {
      return NextResponse.json({ error: "Parámetro 'phaseId' inválido o ausente." }, { status: 400 });
    }

    const result = await listDimensions(phaseId, includeArchived);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `Error interno del servidor: ${message}` }, { status: 500 });
  }
}
