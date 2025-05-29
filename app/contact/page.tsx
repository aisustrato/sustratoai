"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";
import { ProCard } from "@/components/ui/pro-card";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
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
        "Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto contigo pronto."
      );
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      toast.error(
        "Ocurrió un error al enviar tu mensaje. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <ProCard className="max-w-xl w-full" border="top" variant="primary">
        <ProCard.Header className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <img src="/logo.svg" alt="Logo" width={120} height={40} />
          </div>
          <Text
            variant="heading"
            size="2xl"
            color="primary"
            className="text-center"
          >
            Contáctanos
          </Text>
          <Text
            variant="default"
            color="neutral"
            className="text-center text-muted-foreground"
          >
            ¿Tienes preguntas o comentarios? ¡Nos encantaría escucharte!
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
                placeholder="¿En qué podemos ayudarte?"
                required
                rows={4}
              />
            </FormField>

            <CustomButton
              type="submit"
              fullWidth
              loading={loading}
              loadingText="Enviando mensaje..."
              color="primary"
              leftIcon={<Send size={16} />}
              className="mt-6"
            >
              Enviar mensaje
            </CustomButton>
          </form>
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
  );
}
