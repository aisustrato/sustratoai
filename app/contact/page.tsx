"use client";

import { useState } from "react";
import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
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
      <StandardCard className="max-w-xl w-full" accentPlacement="top" accentColorScheme="primary">
        <StandardCard.Header className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <img src="/logo.svg" alt="Logo" width={120} height={40} />
          </div>
          <StandardText
            preset="subheading"
            colorScheme="primary"
            align="center"
          >
            Contáctanos
          </StandardText>
          <StandardText
            preset="body"
            colorScheme="neutral"
            colorShade="subtle"
            align="center"
          >
            ¿Tienes preguntas o comentarios? ¡Nos encantaría escucharte!
          </StandardText>
        </StandardCard.Header>

        <StandardCard.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            <StandardFormField label="Nombre" htmlFor="name">
              <StandardInput
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </StandardFormField>

            <StandardFormField label="Correo electrónico" htmlFor="email">
              <StandardInput
                id="email"
                type="email"
                leadingIcon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </StandardFormField>

            <StandardFormField label="Mensaje" htmlFor="message">
              <StandardTextarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="¿En qué podemos ayudarte?"
                required
                rows={4}
              />
            </StandardFormField>

            <StandardButton
              type="submit"
              loading={loading}
              loadingText="Enviando mensaje..."
              colorScheme="primary"
              leftIcon={Send}
              className="mt-6 w-full"
            >
              Enviar mensaje
            </StandardButton>
          </form>
        </StandardCard.Content>

        <StandardCard.Footer className="text-center">
          <Link href="/login">
            <StandardButton
              styleType="ghost"
              colorScheme="neutral"
              leftIcon={ArrowLeft}
              size="sm"
            >
              Volver a inicio de sesión
            </StandardButton>
          </Link>
        </StandardCard.Footer>
      </StandardCard>
    </div>
  );
}
