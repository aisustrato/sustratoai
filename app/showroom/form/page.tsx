"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { SelectCustom } from "@/components/ui/select-custom";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";
import { ProCard } from "@/components/ui/pro-card";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomCheck } from "@/components/ui/custom-check";
import {
  Mail,
  User,
  Edit,
  Globe,
  Building,
  Send,
  Save,
  Star,
  Heart,
  Settings,
  AlertCircle,
} from "lucide-react";

export default function ShowroomForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [savePreferences, setSavePreferences] = useState(false);

  const validateName = (value: string) => {
    if (value.length < 3) {
      setNameError("El nombre debe tener al menos 3 caracteres");
    } else {
      setNameError("");
    }
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      setEmailSuccess(true);
    } else {
      setEmailSuccess(false);
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const countryOptions = [
    { value: "", label: "Selecciona país" },
    { value: "mx", label: "México", icon: Globe },
    { value: "us", label: "Estados Unidos", icon: User },
    { value: "ca", label: "Canadá", icon: Building },
    { value: "es", label: "España", icon: Mail },
    { value: "ar", label: "Argentina", icon: Edit },
  ];

  const companyOptions = [
    {
      value: "small",
      label: "Pequeña",
      description: "1-50 empleados",
      icon: Building,
    },
    {
      value: "medium",
      label: "Mediana",
      description: "51-250 empleados",
      icon: User,
    },
    {
      value: "large",
      label: "Grande",
      description: "251+ empleados",
      icon: Globe,
    },
    {
      value: "noicon",
      label: "Sin icono",
      description: "Sin icono para probar padding",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <ProCard className="max-w-2xl mx-auto">
        <ProCard.Header>
          <Text variant="heading" size="2xl" color="primary">
            Showroom de Formularios
          </Text>
        </ProCard.Header>

        <ProCard.Content className="space-y-6">
          <Text variant="default" color="neutral" className="mb-6">
            Este showroom muestra los componentes de formulario con diferentes
            estados y cómo el Label cambia de color cuando el componente está
            enfocado.
          </Text>

          {/* Input normal */}
          <FormField label="Nombre" htmlFor="name-input" error={nameError}>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateName(e.target.value);
              }}
              leadingIcon={User}
              placeholder="Ingresa tu nombre"
              error={nameError}
            />
          </FormField>

          {/* Input con éxito */}
          <FormField
            label="Correo electrónico"
            htmlFor="email-input"
            hint={emailSuccess ? "Correo válido" : undefined}
          >
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              leadingIcon={Mail}
              placeholder="correo@ejemplo.com"
              success={emailSuccess}
            />
          </FormField>

          {/* Ejemplos de inputs con diferentes variantes de color */}
          <Text
            variant="heading"
            size="lg"
            color="primary"
            className="mt-8 mb-4"
          >
            Inputs con diferentes variantes de color
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Primary (default)" htmlFor="primary-input">
              <Input
                leadingIcon={Star}
                placeholder="Variante primary"
                variant="primary"
              />
            </FormField>

            <FormField label="Secondary" htmlFor="secondary-input">
              <Input
                leadingIcon={Heart}
                placeholder="Variante secondary"
                variant="secondary"
              />
            </FormField>

            <FormField label="Tertiary" htmlFor="tertiary-input">
              <Input
                leadingIcon={Settings}
                placeholder="Variante tertiary"
                variant="tertiary"
              />
            </FormField>

            <FormField label="Accent" htmlFor="accent-input">
              <Input
                leadingIcon={AlertCircle}
                placeholder="Variante accent"
                variant="accent"
              />
            </FormField>

            <FormField label="Neutral" htmlFor="neutral-input">
              <Input
                leadingIcon={Building}
                placeholder="Variante neutral"
                variant="neutral"
              />
            </FormField>
          </div>

          {/* Ejemplos de selects con diferentes variantes de color */}
          <Text
            variant="heading"
            size="lg"
            color="primary"
            className="mt-8 mb-4"
          >
            Selects con diferentes variantes de color
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Primary (default)" htmlFor="primary-select">
              <SelectCustom
                id="primary-select"
                placeholder="Variante primary"
                options={countryOptions}
                leadingIcon={Star}
                variant="primary"
              />
            </FormField>

            <FormField label="Secondary" htmlFor="secondary-select">
              <SelectCustom
                id="secondary-select"
                placeholder="Variante secondary"
                options={countryOptions}
                leadingIcon={Heart}
                variant="secondary"
              />
            </FormField>

            <FormField label="Tertiary" htmlFor="tertiary-select">
              <SelectCustom
                id="tertiary-select"
                placeholder="Variante tertiary"
                options={countryOptions}
                leadingIcon={Settings}
                variant="tertiary"
              />
            </FormField>

            <FormField label="Accent" htmlFor="accent-select">
              <SelectCustom
                id="accent-select"
                placeholder="Variante accent"
                options={countryOptions}
                leadingIcon={AlertCircle}
                variant="accent"
              />
            </FormField>

            <FormField label="Neutral" htmlFor="neutral-select">
              <SelectCustom
                id="neutral-select"
                placeholder="Variante neutral"
                options={countryOptions}
                leadingIcon={Building}
                variant="neutral"
              />
            </FormField>
          </div>

          {/* Select normal */}
          <FormField label="País" htmlFor="country-select">
            <SelectCustom
              id="country-select"
              placeholder="Selecciona tu país"
              options={countryOptions}
              value={country}
              onChange={(value) => {
                setCountry(value as string);
                console.log("País seleccionado:", value);
              }}
            />
          </FormField>

          {/* Select con descripción */}
          <FormField label="Tamaño de empresa" htmlFor="company-select">
            <SelectCustom
              id="company-select"
              placeholder="Selecciona el tamaño de tu empresa"
              options={companyOptions}
              value={company}
              onChange={(value) => setCompany(value as string)}
            />
          </FormField>

          {/* Input en modo edición */}
          <FormField label="Perfil" htmlFor="profile-input">
            <Input
              value="Usuario123"
              leadingIcon={Edit}
              isEditing={isEditing}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
            />
          </FormField>

          {/* Textarea */}
          <FormField label="Mensaje" htmlFor="message-textarea">
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí"
              showCharacterCount
              maxLength={200}
            />
          </FormField>

          {/* Textarea con error */}
          <FormField
            label="Comentarios"
            htmlFor="comments-textarea"
            error="Este campo es obligatorio"
          >
            <TextArea
              placeholder="Escribe tus comentarios"
              error="Este campo es obligatorio"
            />
          </FormField>

          {/* Textarea con éxito */}
          <FormField
            label="Retroalimentación"
            htmlFor="feedback-textarea"
            hint="Tu retroalimentación ha sido guardada"
          >
            <TextArea value="¡Excelente trabajo!" success={true} />
          </FormField>

          {/* Textarea en modo edición */}
          <FormField
            label="Notas"
            htmlFor="notes-textarea"
            hint="Modo edición activado"
          >
            <TextArea
              value="Estas son mis notas personales."
                isEditing={true}
            />
          </FormField>

          {/* Checkbox examples */}
          <FormField label="Opciones" htmlFor="checkbox-section">
            <div className="space-y-3">
              <CustomCheck
                id="terms-checkbox"
                label="Acepto los términos y condiciones"
                description="Debes aceptar para continuar"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />

              <CustomCheck
                id="preferences-checkbox"
                label="Guardar mis preferencias"
                description="Nos permite recordar tus ajustes"
                variant="secondary"
                visualVariant="outline"
                checked={savePreferences}
                onChange={(e) => setSavePreferences(e.target.checked)}
              />

              <CustomCheck
                id="newsletter-checkbox"
                label="Suscribirme al newsletter"
                description="Recibe noticias y actualizaciones"
                variant="success"
              />

              <CustomCheck
                id="disabled-checkbox"
                label="Opción no disponible"
                description="Esta opción no está disponible ahora"
                disabled
              />
            </div>
          </FormField>

          {/* Buttons section */}
          <div className="flex flex-col gap-4 pt-4">
            <Text variant="heading" size="lg" color="primary" className="mb-2">
              Botones
            </Text>

            <div className="flex gap-3">
              <CustomButton
                color="primary"
                leftIcon={<Send />}
                loading={loading}
                loadingText="Enviando..."
                onClick={handleSubmit}
              >
                Enviar
              </CustomButton>

              <CustomButton variant="outline" color="default">
                Cancelar
              </CustomButton>
            </div>

            <div className="flex gap-3 mt-2">
              <CustomButton color="success" leftIcon={<Save />} size="sm">
                Guardar
              </CustomButton>

              <CustomButton variant="ghost" color="danger" size="sm">
                Eliminar
              </CustomButton>

              <CustomButton variant="subtle" color="secondary" size="sm">
                Opcional
              </CustomButton>
            </div>

            <div className="flex gap-3 mt-2">
              <CustomButton size="xs" color="accent">
                Extra pequeño
              </CustomButton>

              <CustomButton size="lg" color="tertiary" rounded="full">
                Grande
              </CustomButton>

              <CustomButton iconOnly size="md" color="primary" rounded="full">
                <Save />
              </CustomButton>
            </div>
          </div>
        </ProCard.Content>

        <ProCard.Footer>
          <Text variant="default" size="sm" color="neutral">
            Todos los campos marcados con * son obligatorios
          </Text>
        </ProCard.Footer>
      </ProCard>
    </div>
  );
}
