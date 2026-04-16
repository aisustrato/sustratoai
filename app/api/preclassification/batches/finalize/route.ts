import { NextResponse } from "next/server";
import { finalizeBatch } from "@/lib/actions/preclassification-actions";
import { createSupabaseServerClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const batchId = body?.batchId as string | undefined;

    if (!batchId) {
      return NextResponse.json(
        { error: "Se requiere batchId" },
        { status: 400 }
      );
    }

    const result = await finalizeBatch(batchId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("❌ [API /finalize] Error:", error);
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
