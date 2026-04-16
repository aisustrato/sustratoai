// 📍 lib/deepseek/api.ts
// 🎯 PROPÓSITO: Cliente reutilizable para la API de DeepSeek
// 🔧 DECISIÓN: Reemplazo de Gemini por DeepSeek para preclasificación académica

export async function callDeepSeekAPI(model: string, text: string) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error('La clave de API de DeepSeek no está configurada.');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.2,
            max_tokens: 8192,
            top_p: 1,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en API de DeepSeek: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    const textResult = data.choices?.[0]?.message?.content ?? '';
    const usageMetadata = {
        promptTokenCount: data.usage?.prompt_tokens || 0,
        candidatesTokenCount: data.usage?.completion_tokens || 0,
        totalTokenCount: data.usage?.total_tokens || 0
    };

    // Devolvemos tanto el texto como los metadatos de uso (tokens) en formato compatible
    return { result: textResult, usage: usageMetadata };
}
