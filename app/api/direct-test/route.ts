import { NextRequest, NextResponse } from "next/server";

// Endpoint de prueba directa para la API de Gemini sin usar la biblioteca
export async function GET(request: NextRequest) {
  try {
    // Verificar la API key
    const apiKey = process.env.GEMINI_API_KEY || "";
    console.log(
      "📝 API Key disponible:",
      apiKey ? "Sí (longitud: " + apiKey.length + ")" : "No"
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key no configurada" },
        { status: 500 }
      );
    }

    // Llamar directamente a la API de Gemini usando fetch
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    const url = `${endpoint}?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [{ text: "Say hello in Spanish in one word" }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100,
      },
    };

    console.log("📝 Enviando solicitud directa a la API de Gemini...");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Error en la respuesta de la API:",
        response.status,
        errorText
      );
      return NextResponse.json(
        {
          error: "Error en la llamada a la API de Gemini",
          status: response.status,
          details: errorText,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text";

    return NextResponse.json({
      success: true,
      response: text,
      rawResponse: data,
    });
  } catch (error) {
    console.error("❌ Error al realizar solicitud:", error);

    return NextResponse.json(
      {
        error: "Error al probar la API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
