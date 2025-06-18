import { NextRequest, NextResponse } from "next/server";

// Definimos tipos aquí en lugar de importarlos
type HarmCategory =
  | "HARM_CATEGORY_HARASSMENT"
  | "HARM_CATEGORY_HATE_SPEECH"
  | "HARM_CATEGORY_SEXUALLY_EXPLICIT"
  | "HARM_CATEGORY_DANGEROUS_CONTENT";

type HarmBlockThreshold =
  | "BLOCK_NONE"
  | "BLOCK_LOW_AND_ABOVE"
  | "BLOCK_MEDIUM_AND_ABOVE"
  | "BLOCK_ONLY_HIGH";

interface Article {
  id: string;
  title: string;
  abstract: string;
}

interface RequestBody {
  articles: Article[];
  model: string;
}

// Define the POST handler for the route
export async function POST(request: NextRequest) {
  try {
    console.log("📝 Iniciando procesamiento de traducción...");

    // Verificar la API key primero
    const apiKey = process.env.GEMINI_API_KEY || "";
    console.log(
      "📝 API Key disponible:",
      apiKey ? "Sí (longitud: " + apiKey.length + ")" : "No"
    );

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No se ha configurado la API key de Gemini en las variables de entorno",
        },
        { status: 500 }
      );
    }

    // Importar dinámicamente la biblioteca
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    console.log("📝 Biblioteca importada correctamente");

    // Inicializar el cliente de Gemini
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log("📝 Cliente de Gemini inicializado correctamente");
    } catch (initError) {
      console.error("❌ Error inicializando cliente de Gemini:", initError);
      return NextResponse.json(
        {
          error: "Error al inicializar el cliente de Gemini",
          details:
            initError instanceof Error ? initError.message : String(initError),
        },
        { status: 500 }
      );
    }

    // Continuar con el procesamiento de la solicitud
    const body = (await request.json()) as RequestBody;
    const articles = body.articles;
    const modelName = body.model || "gemini-1.5-pro"; // Default to gemini-1.5-pro if not specified

    console.log(`📝 Modelo solicitado: ${modelName}`);
    console.log(`📝 Artículos a procesar: ${articles?.length || 0}`);

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Formato de datos inválido. Se requiere el array 'articles'" },
        { status: 400 }
      );
    }

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron artículos." },
        { status: 400 }
      );
    }

    // Validar/normalizar el modelo (usar gemini-pro si el modelo solicitado no es compatible)
    const supportedModels = ["gemini-1.5-pro", "gemini-1.5-flash"];
    const normalizedModel = supportedModels.includes(modelName)
      ? modelName
      : "gemini-1.5-pro";

    if (normalizedModel !== modelName) {
      console.log(
        `⚠️ Modelo solicitado "${modelName}" no soportado, usando "gemini-1.5-pro" como alternativa`
      );
    }

    // Construct the prompt for Gemini
    // System instruction to guide the model's behavior and output format
    const systemInstructionText = `You are an expert academic assistant. Your task is to process a list of scientific articles.
For each article, you must:
1. Translate the 'title' from English to Spanish.
2. Translate the 'abstract' from English to Spanish.
3. Generate a concise 'summary' of the abstract in Spanish. The summary should be brief and capture the essence of the abstract.

Return the response as a single JSON array. Each object in the array should correspond to an input article and include its original 'id', and the new fields: 'titulo_es', 'abstract_es', and 'resumen_es'.
Ensure the output is a valid JSON array. Example for one article:
[
  {
    "id": "original_id_1",
    "titulo_es": "Título traducido al español",
    "abstract_es": "Abstract traducido al español.",
    "resumen_es": "Resumen conciso del abstract en español."
  }
]
`;

    const userPrompt = `Please process the following articles according to the instructions:\n${JSON.stringify(
      articles.map((a) => ({ id: a.id, title: a.title, abstract: a.abstract })),
      null,
      2
    )}\nRespond ONLY with the JSON array.`;

    console.log(`📝 Configurando modelo Gemini: ${normalizedModel}`);

    try {
      // Simplified approach - create a model with basic configuration
      console.log(`📝 Intentando crear modelo con ID: ${normalizedModel}`);
      const model = genAI.getGenerativeModel({
        model: normalizedModel,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      });

      console.log("📝 Modelo configurado correctamente");

      // Simplified request
      console.log("📝 Preparando solicitud para Gemini...");

      // Try non-streaming approach first (more reliable)
      console.log("📝 Realizando petición no-streaming a Gemini");
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemInstructionText }]
          },
        ],
      });
      const response = await chat.sendMessage(userPrompt);

      const responseText = response.response.text();
      console.log(
        "📝 Respuesta recibida:",
        responseText.substring(0, 100) + "..."
      );

      // Validar JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        if (!Array.isArray(parsedResponse)) {
          throw new Error("La respuesta no es un array JSON");
        }
      } catch (jsonError) {
        console.error("❌ Error al parsear JSON:", jsonError);
        return NextResponse.json(
          {
            error: "Error al parsear respuesta JSON",
            details:
              jsonError instanceof Error
                ? jsonError.message
                : String(jsonError),
            rawResponse: responseText.substring(0, 500) + "...",
          },
          { status: 500 }
        );
      }

      // Devolver respuesta directamente sin streaming
      return NextResponse.json(parsedResponse);
    } catch (modelError) {
      console.error("❌ Error específico de modelo:", modelError);
      return NextResponse.json(
        {
          error: "Error al procesar con modelo de Gemini",
          details:
            modelError instanceof Error
              ? modelError.message
              : String(modelError),
          model: normalizedModel,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en /api/traduccion:", error);
    // Mostrar el error completo para diagnóstico
    let errorMessage = "Error interno del servidor";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
        cause: error.cause,
      };
    }

    return NextResponse.json(
      {
        error: "Error procesando la solicitud",
        message: errorMessage,
        details: errorDetails,
        modelName: "unknown",
      },
      { status: 500 }
    );
  }
}
