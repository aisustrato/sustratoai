"use client"

import { useState } from "react"
import { ProCard } from "@/components/ui/pro-card"
import { CustomButton } from "@/components/ui/custom-button"
import { PageBackground } from "@/components/ui/page-background"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

// Abstracts de ejemplo
const abstracts = [
  {
    id: "abstract1",
    title: "Artificial Intelligence in Healthcare",
    text: "Recent advances in artificial intelligence (AI) have shown promising results in healthcare applications. This paper reviews the current state of AI in medical diagnosis, treatment planning, and patient monitoring. We discuss the challenges of implementing AI systems in clinical settings, including issues of data privacy, algorithm transparency, and integration with existing workflows. Our findings suggest that while AI has the potential to significantly improve healthcare outcomes, careful consideration must be given to ethical implications and regulatory frameworks.",
  },
  {
    id: "abstract2",
    title: "Climate Change Adaptation Strategies",
    text: "This study examines various adaptation strategies implemented by coastal communities in response to climate change impacts. Through a mixed-methods approach combining quantitative assessments and qualitative interviews, we identify key factors that influence the effectiveness of adaptation measures. Results indicate that community-based approaches that incorporate local knowledge and address social equity concerns tend to be more successful than top-down interventions. We propose a framework for evaluating adaptation strategies that considers both technical feasibility and social acceptance.",
  },
]

export default function ShowroomGemini() {
  const [selectedModel, setSelectedModel] = useState("pro")
  const [selectedAbstract, setSelectedAbstract] = useState(abstracts[0].id)
  const [translation, setTranslation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener el abstract seleccionado
  const currentAbstract = abstracts.find((abstract) => abstract.id === selectedAbstract) || abstracts[0]

  // Función para traducir el texto
  const translateText = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/showroomGemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: currentAbstract.text,
          model: selectedModel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al traducir el texto")
      }

      setTranslation(data.translation)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error al traducir el texto")
      setTranslation("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageBackground>
      <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Showroom Gemini - Traductor de Abstracts</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProCard>
          <ProCard.Header>
            <ProCard.Title>Configuración</ProCard.Title>
          </ProCard.Header>
          <ProCard.Content>
            <div className="space-y-6">
              {/* Selección de modelo */}
              <div>
                <h3 className="text-sm font-medium mb-3">Selecciona el modelo de Gemini:</h3>
                <RadioGroup value={selectedModel} onValueChange={setSelectedModel} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pro" id="model-pro" />
                    <Label htmlFor="model-pro">Gemini 2.5 Pro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flash" id="model-flash" />
                    <Label htmlFor="model-flash">Gemini 2.5 Flash</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Selección de abstract */}
              <div>
                <h3 className="text-sm font-medium mb-3">Selecciona un abstract:</h3>
                <Tabs value={selectedAbstract} onValueChange={setSelectedAbstract}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="abstract1">Abstract 1</TabsTrigger>
                    <TabsTrigger value="abstract2">Abstract 2</TabsTrigger>
                  </TabsList>

                  <TabsContent value="abstract1" className="border rounded-md p-4 bg-gray-50">
                    <h4 className="font-medium">{abstracts[0].title}</h4>
                    <p className="mt-2 text-sm">{abstracts[0].text}</p>
                  </TabsContent>

                  <TabsContent value="abstract2" className="border rounded-md p-4 bg-gray-50">
                    <h4 className="font-medium">{abstracts[1].title}</h4>
                    <p className="mt-2 text-sm">{abstracts[1].text}</p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Botón de traducción */}
              <CustomButton onClick={translateText} disabled={isLoading} fullWidth loading={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traduciendo...
                  </>
                ) : (
                  "Traducir al Español"
                )}
              </CustomButton>
            </div>
          </ProCard.Content>
        </ProCard>

        <ProCard>
          <ProCard.Header>
            <ProCard.Title>Resultado de la Traducción</ProCard.Title>
          </ProCard.Header>
          <ProCard.Content>
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">{error}</div>
            ) : translation ? (
              <div className="border rounded-md p-4 bg-gray-50">
                <h4 className="font-medium">{currentAbstract.title} (Traducido)</h4>
                <p className="mt-2 text-sm">{translation}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 border rounded-md bg-gray-50 text-gray-400">
                La traducción aparecerá aquí
              </div>
            )}
          </ProCard.Content>
        </ProCard>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-medium text-blue-800 mb-2">Información del Showroom</h2>
        <p className="text-sm text-blue-700">
          Este showroom demuestra cómo crear un route handler en Next.js y cómo utilizar la API de Gemini para traducir
          texto. Utiliza la biblioteca oficial <code className="bg-blue-100 px-1 rounded">@google/generative-ai</code>{" "}
          para interactuar con los modelos de Gemini.
        </p>
      </div>
    </div>
    </PageBackground>
  )
}
