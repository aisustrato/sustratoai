import {
  Home,
  Bell,
  Settings,
  User,
  Mail,
  Calendar,
  Search,
  Heart,
  Star,
  Zap,
  Shield,
  Award,
} from "@/components/ui/lucide-icons";
import { Icon } from "@/components/ui/icon";
import { PageBackground } from "@/components/ui/page-background"; // Asegúrese que la ruta es correcta
import { ProCard } from "@/components/ui/pro-card"; // Asegúrese que la ruta es correcta

export default function IconShowroom() {
  // Lista de colores disponibles
  const colors: Array<{ name: string; value: any }> = [
    { name: "default", value: "default" },
    { name: "primary", value: "primary" },
    { name: "secondary", value: "secondary" },
    { name: "tertiary", value: "tertiary" },
    { name: "accent", value: "accent" },
    // { name: "muted", value: "muted" }, // Muted no es un IconColor estándar, considerar si se debe incluir o mapear
    { name: "success", value: "success" },
    { name: "warning", value: "warning" },
    { name: "danger", value: "danger" },
    { name: "neutral", value: "neutral" },
    { name: "white", value: "white" },
  ];

  // Lista de variantes de color actualizada
  const colorVariants: Array<{ name: string; value: "pure" | "text" | "shade" | "bg" }> = [
    { name: "Pure", value: "pure" },
    { name: "Text", value: "text" },
    { name: "Shade", value: "shade" }, // Actualizado de "Dark" a "Shade"
    { name: "Background", value: "bg" },
  ];

  // Lista de tamaños disponibles
  const sizes: Array<{ name: string; value: any }> = [
    { name: "xs", value: "xs" },
    { name: "sm", value: "sm" },
    { name: "md", value: "md" },
    { name: "lg", value: "lg" },
    { name: "xl", value: "xl" },
    { name: "2xl", value: "2xl" },
  ];

  // Lista de iconos para mostrar
  const icons = [
    { name: "Home", Component: Home },
    { name: "Bell", Component: Bell },
    { name: "Settings", Component: Settings },
    { name: "User", Component: User },
    { name: "Mail", Component: Mail },
    { name: "Calendar", Component: Calendar },
    { name: "Search", Component: Search },
    { name: "Heart", Component: Heart },
    { name: "Star", Component: Star },
    { name: "Zap", Component: Zap },
    { name: "Shield", Component: Shield },
    { name: "Award", Component: Award },
  ];

  return (
    <PageBackground>
      <div className="container mx-auto py-10 px-4"> {/* Añadido px-4 para padding horizontal */}
        <ProCard
          title="Sistema de Iconos"
    
          className="w-full" // Asegura que ProCard ocupe el ancho disponible
        >
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 pt-4"> {/* Añadido pt-4 para espacio superior */}
              Todas las Variantes de Color
            </h2>
            <div className="grid grid-cols-1 gap-8"> {/* Aumentado gap */}
              {colorVariants.map((variant) => (
                <div key={variant.name} className="p-6 border rounded-lg shadow-sm"> {/* Añadido shadow-sm */}
                  <h3 className="text-xl font-medium mb-6"> {/* Aumentado mb */}
                    Variante: {variant.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"> {/* Ajustado grid y gap */}
                    {colors.map((color) => (
                      <div key={color.name} className="p-4 border rounded-md"> {/* Cambiado a rounded-md */}
                        <h4 className="text-lg font-medium mb-4 capitalize"> {/* Aumentado mb */}
                          {color.name}
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-4"> {/* Ajustado gap */}
                          {icons.slice(0, 4).map(({ name, Component }) => ( // Reducido a 4 iconos por simplicidad
                            <div key={name} className="flex flex-col items-center text-center">
                              <Icon
                                color={color.value}
                                colorVariant={variant.value} // El tipo ya es correcto
                                size="md"
                              >
                                <Component />
                              </Icon>
                              <span className="text-xs mt-2">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Iconos con Gradiente</h2>
            <div className="grid grid-cols-1 gap-8">
              {/* Gradiente con contorno inverso (predeterminado) */}
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4">
                  Gradiente con Contorno Inverso (Predeterminado)
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Aplica un gradiente al relleno y un gradiente inverso al contorno.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {colors
                    .filter((c) => c.name !== "accent" && c.name !== "white" && c.name !== "default") // Evitar combinaciones menos visibles
                    .slice(0, 3)
                    .map((color) => (
                      <div key={color.name} className="p-4 border rounded-md">
                        <h4 className="text-lg font-medium mb-4 capitalize">
                          {color.name} + Accent
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                          {icons.slice(0, 2).map(({ name, Component }) => (
                            <div key={name} className="flex flex-col items-center text-center">
                              <Icon
                                color={color.value}
                                size="xl"
                                gradient={true}
                                gradientWith="accent"
                              >
                                <Component />
                              </Icon>
                              <span className="text-xs mt-2">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Gradiente clásico (opcional) */}
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4">
                  Gradiente Clásico (Opcional: inverseStroke=false)
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Mismo gradiente para relleno y contorno.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {colors
                    .filter((c) => c.name !== "accent" && c.name !== "white" && c.name !== "default")
                    .slice(0, 3)
                    .map((color) => (
                      <div key={color.name} className="p-4 border rounded-md">
                        <h4 className="text-lg font-medium mb-4 capitalize">
                          {color.name} + Accent
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                          {icons.slice(2, 4).map(({ name, Component }) => (
                            <div key={name} className="flex flex-col items-center text-center">
                              <Icon
                                color={color.value}
                                size="xl"
                                gradient={true}
                                gradientWith="accent"
                                inverseStroke={false}
                              >
                                <Component />
                              </Icon>
                              <span className="text-xs mt-2">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Gradiente solo en el borde */}
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4">
                  Gradiente Solo en Borde (strokeOnly=true)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {colors
                    .filter((c) => c.name !== "accent" && c.name !== "white" && c.name !== "default")
                    .slice(0, 3)
                    .map((color) => (
                      <div key={color.name} className="p-4 border rounded-md">
                        <h4 className="text-lg font-medium mb-4 capitalize">
                          {color.name} + Accent
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                          {icons.slice(4, 6).map(({ name, Component }) => (
                            <div key={name} className="flex flex-col items-center text-center">
                              <Icon
                                color={color.value}
                                size="xl" // 'lg' es un buen tamaño para strokeOnly también
                                gradient={true}
                                gradientWith="accent"
                                strokeOnly={true}
                              >
                                <Component />
                              </Icon>
                              <span className="text-xs mt-2">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Tamaños de Iconos</h2>
            <div className="p-6 border rounded-lg shadow-sm">
              <div className="flex flex-wrap items-end gap-x-8 gap-y-6"> {/* Ajustado gap */}
                {sizes.map((size) => (
                  <div key={size.name} className="flex flex-col items-center text-center">
                    <Icon color="primary" size={size.value}>
                      <Home />
                    </Icon>
                    <span className="text-xs mt-2">{size.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ProCard>
      </div>
    </PageBackground>
  );
}
