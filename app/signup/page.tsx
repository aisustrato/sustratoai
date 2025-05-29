"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";
import { ProCard } from "@/components/ui/pro-card";
import {
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  Send,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { SustratoPageBackground } from "@/components/ui/sustrato-page-background";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !message) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      // Aquí iría la lógica para enviar el formulario de contacto
      // Por ahora solo simulamos una espera
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(
        "Tu solicitud ha sido enviada correctamente. Nos pondremos en contacto contigo pronto."
      );
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      toast.error(
        "Ocurrió un error al enviar tu solicitud. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SustratoPageBackground variant="gradient" bubbles={true}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <ProCard className="max-w-4xl w-full" border="top" variant="primary">
          <ProCard.Header className="space-y-2 text-center">
            <div className="flex justify-center mb-6">
              <SustratoLogoWithFixedText
                size={70}
                variant="vertical"
                speed="slow"
                initialTheme="orange"
              />
            </div>
            <Text
              variant="heading"
              size="2xl"
              color="primary"
              className="text-center"
            >
              Beta Privada
            </Text>
            <Text
              variant="default"
              color="neutral"
              className="text-center max-w-2xl mx-auto text-muted-foreground"
            >
              Sustrato.ai se encuentra actualmente en fase de beta privada. Si
              estás interesado en participar, por favor déjanos tus datos y nos
              pondremos en contacto contigo.
            </Text>
          </ProCard.Header>

          <ProCard.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Shield size={24} className="text-primary" />
                  </div>
                  <div>
                    <Text variant="heading" size="lg" color="primary">
                      Acceso exclusivo
                    </Text>
                    <Text
                      variant="default"
                      color="neutral"
                      
                      className="mt-1 text-muted-foreground"
                    >
                      Estamos ofreciendo acceso limitado a nuestra plataforma en
                      esta etapa inicial para garantizar una experiencia óptima.
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Users size={24} className="text-primary" />
                  </div>
                  <div>
                    <Text variant="heading" size="lg" color="primary">
                      Comunidad de pioneros
                    </Text>
                    <Text
                      variant="default"
                      color="neutral"
                      
                      className="mt-1 text-muted-foreground"
                    >
                      Únete a nuestra comunidad de usuarios pioneros y ayúdanos
                      a moldear el futuro de la plataforma con tu valioso
                      feedback.
                    </Text>
                  </div>
                </div>

                <ProCard className="bg-secondary/5 border-secondary/20">
                  <ProCard.Content>
                    <Text
                      variant="heading"
                      size="md"
                      color="secondary"
                      className="mb-2"
                    >
                      ¿Ya tienes una cuenta?
                    </Text>
                    <Text
                      variant="default"
                      color="neutral"
                      className="mb-4 text-muted-foreground"
                    >
                      Si ya cuentas con acceso a nuestra beta, puedes iniciar
                      sesión con tus credenciales.
                    </Text>
                    <Link href="/login">
                      <CustomButton
                        variant="outline"
                        color="secondary"
                        className="mt-2"
                        rightIcon={<ArrowRight size={16} />}
                      >
                        Ir a iniciar sesión
                      </CustomButton>
                    </Link>
                  </ProCard.Content>
                </ProCard>
              </div>

              <div>
                <ProCard className="shadow-sm">
                  <ProCard.Header>
                    <Text variant="heading" size="lg" color="primary">
                      Solicitar acceso
                    </Text>
                    <Text
                      variant="default"
                      color="neutral"
                      
                    >
                      Completa el formulario para solicitar acceso a la beta
                      privada.
                    </Text>
                  </ProCard.Header>

                  <ProCard.Content>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <FormField label="Nombre" htmlFor="name">
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tu nombre completo"
                          required
                        />
                      </FormField>

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

                      <FormField label="Mensaje" htmlFor="message">
                        <TextArea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Cuéntanos por qué estás interesado en participar en nuestra beta"
                          required
                          rows={4}
                        />
                      </FormField>

                      <CustomButton
                        type="submit"
                        fullWidth
                        loading={loading}
                        loadingText="Enviando solicitud..."
                        color="primary"
                        leftIcon={<Send size={16} />}
                        className="mt-6"
                      >
                        Enviar solicitud
                      </CustomButton>
                    </form>
                  </ProCard.Content>
                </ProCard>
              </div>
            </div>
          </ProCard.Content>

          <ProCard.Footer className="text-center">
            <Text
              variant="default"
              size="sm"
              color="neutral"
              
            >
              Al enviar este formulario, aceptas recibir comunicaciones
              relacionadas con Sustrato.ai.
            </Text>
          </ProCard.Footer>
        </ProCard>
      </div>
    </SustratoPageBackground>
  );
}
