// 📍 lib/gemini/api.ts
import { GoogleGenAI } from '@google/genai';

// Esta función es el nuevo "corazón" reutilizable
export async function callGeminiAPI(model: string, text: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('La clave de API de Gemini no está configurada.');
    }

    const genAI = new GoogleGenAI({ apiKey });

    const generationConfig = {
        temperature: 0.2,
        topK: 1,
        topP: 1,
        maxOutputTokens: 8192,
    };

    const result = await genAI.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: text }] }],
        config: generationConfig,
    });
    
    const textResult = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usageMetadata = result.usageMetadata;

    // Devolvemos tanto el texto como los valiosos metadatos de uso (tokens)
    return { result: textResult, usage: usageMetadata };
}