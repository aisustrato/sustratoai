// 📍 app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callGeminiAPI } from '@/lib/gemini/api'; // Importamos el helper

export async function POST(req: NextRequest) {
    try {
        const { model, text } = await req.json();
        if (!model || !text) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const { result, usage } = await callGeminiAPI(model, text); // Llamamos al helper

        return NextResponse.json({ result, usage });

    } catch (error: unknown) {
        console.error('Error in Gemini API route:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}