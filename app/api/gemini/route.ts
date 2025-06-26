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
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    let prompt = '';
    if (action === 'translate') {
      prompt = `Translate the following text to Spanish professionally and accurately:\n\n"${text}"`;
    } else if (action === 'summarize') {
      prompt = `Summarize the following scientific article abstract into 3 concise key points, in Spanish:\n\n"${text}"`;
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "translate" or "summarize"' }, { status: 400 });
    }

    // Patrón definitivo basado en la inspección del código fuente del SDK (`.d.ts`)
    const result = await genAI.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // El nombre correcto del parámetro de configuración es `config`.
      config: generationConfig, 
      // `safetySettings` no es un parámetro válido en este método para esta versión del SDK.
    });

    // El objeto `result` ES la respuesta. Accedemos a `candidates` directamente.
    const textResult = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "No se pudo obtener una respuesta.";

    return NextResponse.json({ result: textResult });

  } catch (error: any) {
    console.error('Error in Gemini API call:', error);
    return NextResponse.json(
      { error: 'Error processing the request.', details: error.message },
      { status: 500 }
    );
  }
}
