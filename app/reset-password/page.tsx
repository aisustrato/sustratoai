"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";
import { ProCard } from "@/components/ui/pro-card";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { SustratoPageBackground } from "@/components/ui/sustrato-page-background";

export default function ResetPasswordPage() {
  console.log("ResetPasswordPage - Componente cargado");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    console.log("ResetPasswordPage - useEffect ejecutado");
    // Verificar la URL actual
    if (typeof window !== "undefined") {
      console.log("ResetPasswordPage - URL actual:", window.location.href);
      console.log("ResetPasswordPage - Pathname:", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ResetPasswordPage - Formulario enviado");

    if (!email) {
      toast.error("Por favor, ingresa tu correo electrónico");
      return;
    }

    setLoading(true);

    try {
      // Aquí iría la lógica para enviar correo de recuperación de contraseña
      // Por ahora sólo simulamos una espera y éxito
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSent(true);
      toast.success(
        "Se ha enviado un correo con instrucciones para restablecer tu contraseña"
      );
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
      toast.error("Ocurrió un error. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SustratoPageBackground variant="subtle" bubbles={true}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <ProCard className="max-w-md w-full" border="top" variant="primary">
          <ProCard.Header className="space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <SustratoLogoWithFixedText
                size={50}
                variant="vertical"
                speed="normal"
                initialTheme="green"
              />
            </div>
            <Text
              variant="heading"
              size="xl"
              color="primary"
              className="text-center mt-4"
            >
              Recuperar contraseña
            </Text>
            <Text
              variant="default"
              color="neutral"
              className="text-center text-muted-foreground"
            >
              {!sent
                ? "Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña"
                : "Hemos enviado instrucciones a tu correo electrónico. Sigue los pasos indicados en el mensaje."}
            </Text>
          </ProCard.Header>

          <ProCard.Content>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <CustomButton
                  type="submit"
                  fullWidth
                  loading={loading}
                  loadingText="Enviando instrucciones..."
                  color="primary"
                  leftIcon={<Send size={16} />}
                  className="mt-6"
                >
                  Enviar instrucciones
                </CustomButton>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="bg-primary/10 rounded-lg p-4 mb-6">
                  <Text color="primary" className="text-sm">
                    Revisa tu bandeja de entrada y sigue las instrucciones
                    enviadas a <strong>{email}</strong>. Si no encuentras el
                    correo, verifica también tu carpeta de spam.
                  </Text>
                </div>
                <CustomButton
                  onClick={() => setSent(false)}
                  color="secondary"
                  variant="outline"
                  fullWidth
                  className="mb-2"
                >
                  Intentar con otro correo
                </CustomButton>
              </div>
            )}
          </ProCard.Content>

          <ProCard.Footer className="text-center">
            <Link href="/login">
              <CustomButton
                variant="ghost"
                color="default"
                leftIcon={<ArrowLeft size={16} />}
                size="sm"
              >
                Volver a inicio de sesión
              </CustomButton>
            </Link>
          </ProCard.Footer>
        </ProCard>
      </div>
    </SustratoPageBackground>
  );
}
