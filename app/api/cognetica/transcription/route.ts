/**
 * POST /api/cognetica/transcription
 *
 * Wrapper específico de Cognética Forense sobre el endpoint genérico
 * `/api/transcription/replicate` (WhisperX Large v3 con diarización).
 *
 * Reutiliza la infraestructura existente de Replicate y persiste los
 * segmentos en `cgt_audio_segmentos` / `cgt_video_segmentos`.
 *
 * Stub de Oleada 1 — retorna 501 hasta que la implementación esté lista.
 */

import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: "NOT_IMPLEMENTED",
      message:
        "Wrapper de transcripción Cognética Forense pendiente — Oleada 1.",
    },
    { status: 501 }
  );
}
