import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    // Obtener datos de la solicitud
    const { text, model } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No se proporcionó texto para traducir" }, { status: 400 })
    }

    // Verificar la API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key de Gemini no configurada" }, { status: 500 })
    }

    // Determinar qué modelo usar
    const modelName = model === "flash" ? "gemini-2.0-flash" : "gemini-2.5-pro-preview-03-25"

    console.log(`Usando modelo: ${modelName}`)

    // Inicializar el cliente de Google AI
    const genAI = new GoogleGenerativeAI(apiKey)

    // Configurar el modelo
    const geminiModel = genAI.getGenerativeModel({
      model: modelName,
    })

    // Configuración de generación
    const generationConfig = {
      temperature: 0.2,
      maxOutputTokens: 1000,
    }

    // Crear el prompt para la traducción
    const prompt = `
      Eres un traductor profesional especializado en traducir textos académicos del inglés al español.
      Debes mantener el tono formal y técnico del texto original.
      
      Traduce el siguiente texto del inglés al español:
      
      "${text}"
      
      Proporciona SOLO la traducción, sin comentarios adicionales ni texto en inglés.
    `

    // Generar la traducción
    // Método 1: Usando la API con un solo argumento (compatible con v0.2.0)
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    })

    const translation = result.response.text()

    // Devolver la traducción
    return NextResponse.json({ translation })
  } catch (error: any) {
    console.error("Error en la API de Gemini:", error)

    return NextResponse.json(
      {
        error: error.message || "Error al procesar la traducción",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
