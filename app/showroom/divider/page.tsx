"use client"

import { useState, useEffect } from "react"
import { Text } from "@/components/ui/text"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ProCard} from '@/components/ui/pro-card'
import { Divider } from "@/components/ui/divider"
import { colorTokens } from "@/lib/theme/color-tokens"
import { useTheme } from "next-themes"
import { PageBackground } from "@/components/ui/page-background"

export default function ShowroomDivider() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
    setIsDarkMode(theme === "dark")
  }, [theme])

  // Cambiar tema
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  // Cambiar modo claro/oscuro
  const handleDarkModeChange = (checked: boolean) => {
    setIsDarkMode(checked)
    setTheme(checked ? "dark" : "light")
  }

  if (!mounted) return null

  return (
    <PageBackground variant="default">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Text as="h1" variant="heading" size="3xl" className="mb-2">
              Divider Component Showroom
            </Text>
            <Text variant="subtitle" className="text-muted-foreground">
              Visualización y prueba del componente Divider con todas sus variantes y tamaños
            </Text>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={theme === "blue" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("blue")}
              >
                Azul
              </Button>
              <Button
                variant={theme === "green" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("green")}
              >
                Verde
              </Button>
              <Button
                variant={theme === "orange" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("orange")}
              >
                Naranja
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleDarkModeChange} />
              <Label htmlFor="dark-mode">Modo oscuro</Label>
            </div>
          </div>
        </div>

        <Tabs defaultValue="variants">
          <TabsList className="mb-4">
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="sizes">Tamaños</TabsTrigger>
            <TabsTrigger value="examples">Ejemplos de uso</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="variants" className="space-y-8">
            <ProCard>
              <ProCard.Header>
                <ProCard.Title>Variantes de Divider</ProCard.Title>
              </ProCard.Header>
              <ProCard.Content className="space-y-8">
                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Gradient (default)
                  </Text>
                  <div className="py-4 flex flex-col items-center">
                    <Divider variant="gradient" />
                    <Text variant="muted" className="mt-4">
                      Gradiente: primary → accent → secondary
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Solid
                  </Text>
                  <div className="py-4 flex flex-col items-center">
                    <Divider variant="solid" />
                    <Text variant="muted" className="mt-4">
                      Color sólido: primary
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Subtle
                  </Text>
                  <div className="py-4 flex flex-col items-center">
                    <Divider variant="subtle" />
                    <Text variant="muted" className="mt-4">
                      Color sutil: primary con opacidad
                    </Text>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          <TabsContent value="sizes" className="space-y-8">
            <ProCard>
              <ProCard.Header>
                <ProCard.Title>Tamaños disponibles</ProCard.Title>
              </ProCard.Header>
              <ProCard.Content className="space-y-8">
                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Extra Small (xs)
                  </Text>
                  <div className="py-2 flex flex-col items-center">
                    <Divider variant="gradient" size="xs" />
                    <Text variant="muted" className="mt-2">
                      Altura: 2px, Ancho: 60px
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Small (sm)
                  </Text>
                  <div className="py-2 flex flex-col items-center">
                    <Divider variant="gradient" size="sm" />
                    <Text variant="muted" className="mt-2">
                      Altura: 2px, Ancho: 100px
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Medium (md) - Default
                  </Text>
                  <div className="py-2 flex flex-col items-center">
                    <Divider variant="gradient" size="md" />
                    <Text variant="muted" className="mt-2">
                      Altura: 3px, Ancho: 150px
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Large (lg)
                  </Text>
                  <div className="py-2 flex flex-col items-center">
                    <Divider variant="gradient" size="lg" />
                    <Text variant="muted" className="mt-2">
                      Altura: 4px, Ancho: 200px
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Extra Large (xl)
                  </Text>
                  <div className="py-2 flex flex-col items-center">
                    <Divider variant="gradient" size="xl" />
                    <Text variant="muted" className="mt-2">
                      Altura: 5px, Ancho: 250px
                    </Text>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          <TabsContent value="examples" className="space-y-8">
            <ProCard>
              <ProCard.Header>
                <ProCard.Title>Ejemplos de uso</ProCard.Title>
              </ProCard.Header>
              <ProCard.Content className="space-y-12">
                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Separador de secciones
                  </Text>
                  <div className="py-4 flex flex-col items-center text-center">
                    <Text variant="heading" size="2xl">
                      Título de sección
                    </Text>
                    <Divider variant="gradient" size="md" className="my-4" />
                    <Text variant="default">
                      Contenido de la sección que viene después del separador. El divider ayuda a crear una separación
                      visual clara entre el título y el contenido.
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Decoración en encabezados
                  </Text>
                  <div className="py-4 flex flex-col items-center text-center">
                    <Text
                      variant="label"
                      color="primary"
                      colorVariant="pure"
                      className="uppercase tracking-wider mb-4 font-bold"
                    >
                      Universidad Católica de Chile
                    </Text>
                    <Divider variant="gradient" size="md" className="mb-6" />
                    <Text as="h1" variant="heading" size="3xl" gradient="primary" className="mb-4">
                      Ayudas Técnicas
                    </Text>
                    <Text as="h2" variant="subheading" size="xl" gradient="secondary" className="mb-6">
                      Escuela de Trabajo Social
                    </Text>
                  </div>
                </div>

                <div className="space-y-6">
                  <Text variant="subtitle" className="font-semibold">
                    Separador sutil entre elementos de lista
                  </Text>
                  <div className="py-4 max-w-md mx-auto">
                    <div className="space-y-4">
                      <div>
                        <Text variant="title">Elemento 1</Text>
                        <Text variant="default" size="sm">
                          Descripción del primer elemento de la lista
                        </Text>
                      </div>
                      <Divider variant="subtle" size="sm" className="my-2" />
                      <div>
                        <Text variant="title">Elemento 2</Text>
                        <Text variant="default" size="sm">
                          Descripción del segundo elemento de la lista
                        </Text>
                      </div>
                      <Divider variant="subtle" size="sm" className="my-2" />
                      <div>
                        <Text variant="title">Elemento 3</Text>
                        <Text variant="default" size="sm">
                          Descripción del tercer elemento de la lista
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          <TabsContent value="api" className="space-y-8">
            <ProCard>
              <ProCard.Header>
                <ProCard.Title>API del componente Divider</ProCard.Title>
              </ProCard.Header>
              <ProCard.Content className="space-y-6">
                <div>
                  <Text variant="subtitle" className="font-semibold mb-2">
                    Props
                  </Text>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Prop</th>
                          <th className="text-left py-2 px-4">Tipo</th>
                          <th className="text-left py-2 px-4">Default</th>
                          <th className="text-left py-2 px-4">Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-mono text-sm">variant</td>
                          <td className="py-2 px-4 font-mono text-sm">'gradient' | 'solid' | 'subtle'</td>
                          <td className="py-2 px-4 font-mono text-sm">'gradient'</td>
                          <td className="py-2 px-4">Estilo visual del divider</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-mono text-sm">size</td>
                          <td className="py-2 px-4 font-mono text-sm">'xs' | 'sm' | 'md' | 'lg' | 'xl'</td>
                          <td className="py-2 px-4 font-mono text-sm">'md'</td>
                          <td className="py-2 px-4">Tamaño del divider</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-4 font-mono text-sm">className</td>
                          <td className="py-2 px-4 font-mono text-sm">string</td>
                          <td className="py-2 px-4 font-mono text-sm">-</td>
                          <td className="py-2 px-4">Clases CSS adicionales</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <Text variant="subtitle" className="font-semibold mb-2">
                    Ejemplo de código
                  </Text>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code className="text-sm">
                      {`import { Divider } from "@/components/ui/divider"

// Divider básico con gradiente
<Divider />

// Divider con variante sólida y tamaño grande
<Divider variant="solid" size="lg" />

// Divider con clases personalizadas
<Divider variant="subtle" size="sm" className="my-4" />`}
                    </code>
                  </pre>
                </div>

                <div>
                  <Text variant="subtitle" className="font-semibold mb-2">
                    Tokens utilizados
                  </Text>
                  <div className="bg-muted p-4 rounded-md">
                    <Text variant="default" size="sm">
                      El componente Divider utiliza los siguientes tokens del sistema de diseño:
                    </Text>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li className="text-sm">
                        <span className="font-mono">colorTokens.component.divider.variants</span> - Estilos para cada
                        variante
                      </li>
                      <li className="text-sm">
                        <span className="font-mono">colorTokens.component.divider.sizes</span> - Dimensiones para cada
                        tamaño
                      </li>
                    </ul>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <Text variant="subtitle" className="font-semibold mb-2">
            Estado de los tokens
          </Text>
      
        </div>
      </div>
    </PageBackground>
  )
}
