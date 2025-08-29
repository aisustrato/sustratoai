import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { getBatchDetailsForReview } from "@/lib/actions/preclassification-actions";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const batchId = body?.batchId as string | undefined;

    if (!batchId || typeof batchId !== "string") {
      return NextResponse.json({ error: "Parámetro 'batchId' inválido o ausente." }, { status: 400 });
    }

    const result = await getBatchDetailsForReview(batchId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `Error interno del servidor: ${message}` }, { status: 500 });
  }
}
