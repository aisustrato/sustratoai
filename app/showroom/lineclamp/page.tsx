// app/showroom/lineclamp/page.tsx
"use client";

import { PageWrapper } from "@/components/ui/page-wrapper"; // Ajusta la ruta si es necesario
import { Text } from "@/components/ui/text"; // Ajusta la ruta
import { cn } from "@/lib/utils"; // Ajusta la ruta

const longText =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ".repeat(
    3
  );

const LineClampShowcasePage: React.FC = () => {
  const bgColor = "bg-white dark:bg-gray-800"; // Color de fondo de ejemplo
  const textColor = "text-gray-900 dark:text-gray-100"; // Color de texto de ejemplo

  return (
    <PageWrapper
      title="Prueba de Line Clamp y Fade"
      className="container mx-auto px-4 py-8 space-y-6"
    >
      <Text variant="heading">Prueba de Line Clamp y Efecto Fade</Text>

      <Text>
        Esta página prueba la funcionalidad de{" "}
        <code>@tailwindcss/line-clamp</code> y el efecto de disolución (fade
        out) en texto truncado. Asegúrate de haber reiniciado el servidor
        después de instalar el plugin.
      </Text>

      {/* Prueba 1: Line Clamp 1 sin Fade */}
      <div>
        <Text variant="label" className="mb-2 block">
          Line Clamp 1 (Sin Fade)
        </Text>
        <div className={`p-4 rounded border ${bgColor} ${textColor}`}>
          <Text className="line-clamp-1">{longText}</Text>
        </div>
      </div>

      {/* Prueba 2: Line Clamp 3 con Fade */}
      <div>
        <Text variant="label" className="mb-2 block">
          Line Clamp 3 (Con Fade)
        </Text>
        <div className={`p-4 rounded border ${bgColor} ${textColor}`}>
          <div
            className="relative" // Contenedor relativo para el fade
            // Variable CSS para el color de fondo del fade
            style={
              {
                "--cell-bg-for-fade": "hsl(var(--background))",
              } as React.CSSProperties
            }
          >
            <Text className="line-clamp-3">{longText}</Text>
            {/* Elemento Fade */}
            <div
              className="absolute bottom-0 right-0 w-full h-[1.5em] pointer-events-none"
              style={{
                background: `linear-gradient(to right, transparent 0%, var(--cell-bg-for-fade) 70%, var(--cell-bg-for-fade) 100%)`,
              }}
              aria-hidden="true" // Ocultar a lectores de pantalla
            />
          </div>
        </div>
        <Text variant="caption" className="mt-1 text-muted-foreground">
          El texto debería truncarse a 3 líneas y tener un degradado al final.
        </Text>
      </div>

      {/* Prueba 3: Line Clamp 5 con Fade y Color de Fondo Diferente */}
      <div>
        <Text variant="label" className="mb-2 block">
          Line Clamp 5 (Con Fade, Fondo Azul Claro)
        </Text>
        <div className="p-4 rounded border bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
          <div
            className="relative"
            // Usar un color explícito o un token si tienes tokens para azul claro
            style={
              {
                "--cell-bg-for-fade": "rgb(219 234 254)" /* bg-blue-100 */,
              } as React.CSSProperties
            }
            // Para modo oscuro, necesitarías detectar el modo y cambiar el color
            // data-theme="dark" style={{ "--cell-bg-for-fade": "rgb(30 58 138)" /* bg-blue-900 */ }}
          >
            <Text className="line-clamp-5">{longText}</Text>
            {/* Elemento Fade */}
            <div
              className="absolute bottom-0 right-0 w-2/3 h-[1.5em] pointer-events-none" // Fade más corto (w-2/3)
              style={{
                background: `linear-gradient(to right, transparent 0%, var(--cell-bg-for-fade) 80%, var(--cell-bg-for-fade) 100%)`, // Fade más rápido
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Prueba 4: Sin Line Clamp (para comparar) */}
      <div>
        <Text variant="label" className="mb-2 block">
          Sin Line Clamp
        </Text>
        <div className={`p-4 rounded border ${bgColor} ${textColor}`}>
          <Text>{longText}</Text>
        </div>
      </div>
    </PageWrapper>
  );
};

export default LineClampShowcasePage;
