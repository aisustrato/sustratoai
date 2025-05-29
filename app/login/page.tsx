"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/auth-provider";
import { CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";
import { ProCard } from "@/components/ui/pro-card";
import { Mail, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { SustratoPageBackground } from "@/components/ui/sustrato-page-background";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, authInitialized } = useAuth();
  
  // Si el usuario ya está autenticado, redirigir a la página principal o a la página guardada en redirectTo
  useEffect(() => {
    if (authInitialized && user && searchParams) {
      const redirectTo = searchParams.get('redirectTo') || '/';
      console.log(`🔄 Usuario ya autenticado, redirigiendo a ${redirectTo}`);
      router.push(redirectTo);
    }
  }, [user, authInitialized, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando proceso de login");

    if (!email || !password) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await signIn(email, password);

      if (!success) {
        toast.error(error?.message || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      toast.success("Inicio de sesión exitoso");
      
      // Redirigir a la página original o al home
      const redirectTo = searchParams ? (searchParams.get('redirectTo') || '/') : '/';
      console.log(`🔄 Login exitoso, redirigiendo a ${redirectTo}`);
      
      // No desactivamos loading para evitar parpadeos durante la redirección
      router.push(redirectTo);
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      toast.error("Ocurrió un error inesperado");
      setLoading(false);
    }
  };

  // Si ya está autenticado, mostrar un mensaje de redirección
  if (authInitialized && user) {
    return (
      <SustratoPageBackground variant="ambient" bubbles={false}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <SustratoLogoWithFixedText
              size={60}
              variant="vertical"
              speed="fast"
              initialTheme="blue"
            />
            <Text variant="heading" color="primary" className="mt-4">
              Ya has iniciado sesión
            </Text>
            <Text variant="default" color="neutral" className="mt-2">
              Redirigiendo a tu página...
            </Text>
          </div>
        </div>
      </SustratoPageBackground>
    );
  }

  return (
    <SustratoPageBackground variant="ambient" bubbles={true}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <ProCard className="max-w-4xl w-full" border="top" variant="primary">
          <ProCard.Content className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Columna izquierda con imagen/información */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8 hidden md:flex md:flex-col md:justify-center rounded-l-lg">
                <div className="flex justify-center mb-6">
                  <SustratoLogoWithFixedText
                    size={80}
                    variant="vertical"
                    speed="fast"
                    initialTheme="blue"
                  />
                </div>

                <div className="space-y-4 mt-8">
                  <div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg">
                    <Text
                      variant="heading"
                      
                      color="tertiary"
                      className="mb-2"
                    >
                      Investigación Cualitativa Aumentada
                    </Text>
                    <Text variant="default" color="neutral" size="sm">
                      Potencia tu análisis cualitativo con nuestra plataforma
                      que combina el rigor académico con la innovación
                      tecnológica. Diseñada por humanistas, para humanistas.
                    </Text>
                  </div>

                  <div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg">
                    <Text
                      variant="default"
                      color="neutral"
                      size="sm"
                      className="italic"
                    >
                      "No buscamos reemplazar el pensamiento crítico, sino
                      expandir su alcance a través de la co-creación entre la
                      perspectiva humana y las capacidades de la IA."
                    </Text>
                  </div>
                </div>
              </div>

              {/* Columna derecha con formulario */}
              <div className="p-8">
                <div className="mb-6 md:hidden flex flex-col items-center">
                  <SustratoLogoWithFixedText
                    size={50}
                    variant="vertical"
                    speed="normal"
                    initialTheme="orange"
                  />
                </div>

                <Text
                  variant="heading"
                  size="xl"
                  color="primary"
                  className="mb-2"
                >
                  Inicio de sesión
                </Text>
                <Text
                  variant="default"
                  color="neutral"
                  colorVariant="text"
                  className="mb-6"
                >
                  Ingresa tus credenciales para acceder a la plataforma
                </Text>

                <form onSubmit={handleSubmit} className="space-y-4" action="javascript:void(0)">
                  <FormField label="Correo electrónico" htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      leadingIcon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      required
                    />
                  </FormField>

                  <FormField label="Contraseña" htmlFor="password">
                    <Input
                      id="password"
                      type="password"
                      leadingIcon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      required
                    />
                  </FormField>

                  <div className="flex justify-end">
                    <Link
                      href="/reset-password"
                      className="text-primary text-sm hover:underline"
                      onClick={() => {
                        console.log(
                          "Clic en enlace de recuperación de contraseña - Navegando a /reset-password"
                        );
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <div className="pt-2">
                    <CustomButton
                      type="submit"
                      fullWidth
                      loading={loading}
                      loadingText="Iniciando sesión..."
                      color="primary"
                      leftIcon={<LogIn />}
                      disabled={loading}
                      onClick={(e) => {
                        // Simplificado para evitar posibles problemas
                        e.preventDefault();
                        if (!loading) {
                          handleSubmit(e as any);
                        }
                      }}
                    >
                      Iniciar sesión
                    </CustomButton>
                  </div>

                  <div className="flex items-center justify-center mt-6">
                    <Text
                      variant="default"
                      size="sm"
                      color="neutral"
                      colorVariant="text"
                    >
                      ¿No tienes una cuenta?{" "}
                      <Link
                        href="/signup"
                        className="text-primary hover:underline font-medium"
                      >
                        Solicita acceso
                      </Link>
                    </Text>
                  </div>
                </form>
              </div>
            </div>
          </ProCard.Content>
        </ProCard>
      </div>
    </SustratoPageBackground>
  );
}
