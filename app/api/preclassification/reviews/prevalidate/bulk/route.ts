import { NextResponse } from "next/server";
import { bulkSetPrevalidatedForBatch } from "@/lib/actions/preclassification-actions";
import { createSupabaseServerClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const batchId = body?.batchId as string | undefined;
    const prevalidated = Boolean(body?.prevalidated);

    if (!batchId) {
      return NextResponse.json({ error: "Parámetros inválidos: 'batchId' es requerido." }, { status: 400 });
    }

    const result = await bulkSetPrevalidatedForBatch(batchId, prevalidated);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Error actualizando prevalidated en bulk" }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `Error interno del servidor: ${message}` }, { status: 500 });
  }
}
