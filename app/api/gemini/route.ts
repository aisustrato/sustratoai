//📍 app/api/gemini/route.ts
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { model, text, action } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'La clave de API de Gemini no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    if (!model || !text || !action) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: model, text, action' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenAI({ apiKey });

    const generationConfig = {
      temperature: 0.2,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192, // Aumentado para permitir respuestas JSON más largas y completas
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    // El `text` que llega del frontend ya es el prompt completo y correcto.
    // La API solo debe actuar como un proxy, sin modificarlo.
    const result = await genAI.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: text }] }],
      config: generationConfig,
    });

    // La propiedad `candidates` está directamente en el objeto `result`.
    const textResult = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return NextResponse.json({ result: textResult });

  } catch (error: any) {
    console.error('Error in Gemini API call:', error);
    return NextResponse.json(
      { error: 'Error processing the request.', details: error.message },
      { status: 500 }
    );
  }
}
