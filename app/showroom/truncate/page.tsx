'use client';

import { StandardText } from "@/components/ui/StandardText";

export default function TruncateTest() {
  const longText = "Ahora estamos entrando en territorio de texto realmente largo. Este párrafo está diseñado específicamente para ser tan extenso que excederá con toda seguridad el límite de dos líneas que hemos establecido. Si este texto aparece cortado a dos líneas, significa que la combinación de nuestro componente y el CSS del plugin funciona como se espera en tu navegador.";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Prueba de Truncamiento de Texto</h1>
      
      <div className="space-y-8">
        {/* Método 1: Usando line-clamp de Tailwind (Probablemente no funcionará) */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">1. Usando line-clamp de Tailwind en un div simple</h2>
          <div className="line-clamp-2 bg-gray-50 p-3 rounded">
            {longText}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Resultado esperado: Probablemente no se trunca, demostrando que se necesita más contexto de estilo.
          </div>
        </div>

        {/* Método 2: Usando el componente StandardText (Debería funcionar) */}
        <div className="border p-4 rounded-lg bg-green-50">
          <h2 className="text-xl font-semibold mb-2">2. Usando StandardText (La Solución Correcta)</h2>
          <div className="p-3 rounded">
            {/* ✅ CORRECCIÓN: Se pasa `longText` como children, no como prop */}
            <StandardText className="line-clamp-2">
              {longText}
            </StandardText>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <p>Clase aplicada: <code>className="line-clamp-2"</code></p>
            <p>Resultado esperado: El texto debe aparecer truncado a 2 líneas. No se usa tooltip aquí, solo se prueba el truncamiento visual.</p>
          </div>
        </div>

      </div>
    </div>
  );
}