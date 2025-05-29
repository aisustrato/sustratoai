"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomButton } from "@/components/ui/custom-button";
import { PageBackground } from "@/components/ui/page-background";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Edit,
  FileText,
  Mail,
  Plus,
  Save,
  Send,
  Settings,
  Trash,
  Upload,
} from "lucide-react";

export default function ShowroomButtons() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <PageBackground variant="gradient" className="py-10">
      <div className="container">
        <Text
          as="h1"
          variant="heading"
          size="3xl"
          gradient="primary"
          className="mb-2"
          fontType="heading"
        >
          Showroom de Botones
        </Text>
        <Text
          variant="subtitle"
          size="lg"
          color="neutral"
          className="mb-8"
          fontType="body"
        >
          Esta página muestra todas las variantes y funcionalidades del
          componente CustomButton.
        </Text>

        <Tabs defaultValue="variants">
          <TabsList className="mb-4">
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="sizes">Tamaños</TabsTrigger>
            <TabsTrigger value="colors">Colores</TabsTrigger>
            <TabsTrigger value="icons">Iconos</TabsTrigger>
            <TabsTrigger value="states">Estados</TabsTrigger>
            <TabsTrigger value="special">
              Características Especiales
            </TabsTrigger>
            <TabsTrigger value="examples">Ejemplos de Uso</TabsTrigger>
          </TabsList>

          {/* Sección de Variantes */}
          <TabsContent value="variants">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Variantes de Botones
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  Las diferentes variantes visuales disponibles para los
                  botones.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <CustomButton color="primary" variant="solid">
                      Solid Button
                    </CustomButton>
                    <Text variant="muted" size="sm" fontType="body">
                      Solid
                    </Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CustomButton color="primary" variant="outline">
                      Outline Button
                    </CustomButton>
                    <Text variant="muted" size="sm" fontType="body">
                      Outline
                    </Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CustomButton color="primary" variant="ghost">
                      Ghost Button
                    </CustomButton>
                    <Text variant="muted" size="sm" fontType="body">
                      Ghost
                    </Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CustomButton color="primary" variant="link">
                      Link Button
                    </CustomButton>
                    <Text variant="muted" size="sm" fontType="body">
                      Link
                    </Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CustomButton color="primary" variant="subtle">
                      Subtle Button
                    </CustomButton>
                    <Text variant="muted" size="sm" fontType="body">
                      Subtle
                    </Text>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          {/* Sección de Tamaños */}
          <TabsContent value="sizes">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Tamaños de Botones
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  Los diferentes tamaños disponibles para los botones.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="space-y-8">
                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Variante Solid
                    </Text>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" size="xs">
                          Extra Small
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          XS
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" size="sm">
                          Small
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          SM
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" size="md">
                          Medium
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          MD
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" size="lg">
                          Large
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          LG
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" size="xl">
                          Extra Large
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          XL
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Variante Outline
                    </Text>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="secondary"
                          variant="outline"
                          size="xs"
                        >
                          Extra Small
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          XS
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                        >
                          Small
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          SM
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="secondary"
                          variant="outline"
                          size="md"
                        >
                          Medium
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          MD
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="secondary"
                          variant="outline"
                          size="lg"
                        >
                          Large
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          LG
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="secondary"
                          variant="outline"
                          size="xl"
                        >
                          Extra Large
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          XL
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          {/* Sección de Colores */}
          <TabsContent value="colors">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Colores de Botones
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  La paleta de colores disponible para los botones.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="space-y-8">
                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Variante Solid
                    </Text>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary">Primary</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Primary
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="secondary">Secondary</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Secondary
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="tertiary">Tertiary</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Tertiary
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="accent">Accent</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Accent
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="success">Success</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Success
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="warning">Warning</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Warning
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="danger">Danger</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Danger
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="default">Default</CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Default
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Variante Outline
                    </Text>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" variant="outline">
                          Primary
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Primary
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="secondary" variant="outline">
                          Secondary
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Secondary
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="tertiary" variant="outline">
                          Tertiary
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Tertiary
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="accent" variant="outline">
                          Accent
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Accent
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="success" variant="outline">
                          Success
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Success
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="warning" variant="outline">
                          Warning
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Warning
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="danger" variant="outline">
                          Danger
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Danger
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="default" variant="outline">
                          Default
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Default
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          {/* Sección de Iconos */}
          <TabsContent value="icons">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Botones con Iconos
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  Diferentes formas de usar iconos en los botones.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="space-y-8">
                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Iconos a la Izquierda
                    </Text>
                    <div className="flex flex-wrap gap-4">
                      <CustomButton color="primary" leftIcon={<Mail />}>
                        Enviar Email
                      </CustomButton>
                      <CustomButton color="success" leftIcon={<Save />}>
                        Guardar
                      </CustomButton>
                      <CustomButton color="warning" leftIcon={<AlertCircle />}>
                        Advertencia
                      </CustomButton>
                      <CustomButton color="danger" leftIcon={<Trash />}>
                        Eliminar
                      </CustomButton>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Iconos a la Derecha
                    </Text>
                    <div className="flex flex-wrap gap-4">
                      <CustomButton color="primary" rightIcon={<ArrowRight />}>
                        Continuar
                      </CustomButton>
                      <CustomButton
                        color="secondary"
                        rightIcon={<ChevronRight />}
                      >
                        Siguiente
                      </CustomButton>
                      <CustomButton color="tertiary" rightIcon={<Send />}>
                        Enviar
                      </CustomButton>
                      <CustomButton color="accent" rightIcon={<Download />}>
                        Descargar
                      </CustomButton>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Solo Iconos
                    </Text>
                    <div className="flex flex-wrap gap-4">
                      <CustomButton
                        color="primary"
                        iconOnly
                        aria-label="Editar"
                      >
                        <Edit />
                      </CustomButton>
                      <CustomButton
                        color="secondary"
                        iconOnly
                        aria-label="Configuración"
                      >
                        <Settings />
                      </CustomButton>
                      <CustomButton
                        color="success"
                        iconOnly
                        aria-label="Añadir"
                      >
                        <Plus />
                      </CustomButton>
                      <CustomButton
                        color="danger"
                        iconOnly
                        aria-label="Eliminar"
                      >
                        <Trash />
                      </CustomButton>
                      <CustomButton
                        color="warning"
                        iconOnly
                        variant="outline"
                        aria-label="Advertencia"
                      >
                        <AlertCircle />
                      </CustomButton>
                      <CustomButton
                        color="accent"
                        iconOnly
                        variant="ghost"
                        aria-label="Documento"
                      >
                        <FileText />
                      </CustomButton>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Tamaños de Iconos
                    </Text>
                    <div className="flex flex-wrap items-center gap-4">
                      <CustomButton
                        color="primary"
                        size="xs"
                        iconOnly
                        aria-label="Añadir pequeño"
                      >
                        <Plus />
                      </CustomButton>
                      <CustomButton
                        color="primary"
                        size="sm"
                        iconOnly
                        aria-label="Añadir pequeño"
                      >
                        <Plus />
                      </CustomButton>
                      <CustomButton
                        color="primary"
                        size="md"
                        iconOnly
                        aria-label="Añadir mediano"
                      >
                        <Plus />
                      </CustomButton>
                      <CustomButton
                        color="primary"
                        size="lg"
                        iconOnly
                        aria-label="Añadir grande"
                      >
                        <Plus />
                      </CustomButton>
                      <CustomButton
                        color="primary"
                        size="xl"
                        iconOnly
                        aria-label="Añadir extra grande"
                      >
                        <Plus />
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          {/* Sección de Estados */}
          <TabsContent value="states">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Estados de Botones
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  Los diferentes estados que pueden tener los botones.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="space-y-8">
                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Estados Básicos
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary">
                          Estado Normal
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Normal
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" disabled>
                          Estado Deshabilitado
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Deshabilitado
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" loading>
                          Estado Cargando
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Cargando
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Ejemplo Interactivo
                    </Text>
                    <div className="flex flex-col items-center gap-4">
                      <CustomButton
                        color="primary"
                        loading={isLoading}
                        onClick={handleLoadingDemo}
                        loadingText="Procesando..."
                      >
                        {isLoading
                          ? "Procesando..."
                          : "Haz clic para ver estado de carga"}
                      </CustomButton>
                      <Text variant="muted" size="sm" fontType="body">
                        Haz clic en el botón para ver el estado de carga durante
                        2 segundos
                      </Text>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Estados con Iconos
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="success" leftIcon={<Check />}>
                          Completado
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Éxito
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="warning"
                          leftIcon={<AlertCircle />}
                        >
                          Advertencia
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Advertencia
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="danger"
                          leftIcon={<AlertCircle />}
                          disabled
                        >
                          Error Deshabilitado
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Error
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          {/* Sección de Características Especiales */}
          <TabsContent value="special">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Características Especiales
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  Funcionalidades adicionales y personalizaciones para los
                  botones.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="space-y-8">
                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Bordes Redondeados
                    </Text>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" rounded="none">
                          Sin Redondeo
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          none
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" rounded="sm">
                          Redondeo Pequeño
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          sm
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" rounded="md">
                          Redondeo Medio
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          md
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" rounded="lg">
                          Redondeo Grande
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          lg
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" rounded="full">
                          Redondeo Completo
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          full
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Efectos Visuales
                    </Text>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" gradient>
                          Con Gradiente
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          gradient
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" elevated>
                          Con Elevación
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          elevated
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary" gradient elevated>
                          Gradiente + Elevación
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          gradient + elevated
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Opciones de Ancho
                    </Text>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton color="primary">
                          Ancho Automático
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          auto width
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-full">
                        <CustomButton color="primary" fullWidth>
                          Ancho Completo
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          fullWidth
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider variant="subtle" className="my-6" />

                  <div>
                    <Text
                      variant="label"
                      size="lg"
                      className="mb-4"
                      fontType="heading"
                    >
                      Combinaciones Avanzadas
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="primary"
                          gradient
                          elevated
                          rounded="full"
                          leftIcon={<Upload />}
                        >
                          Subir Archivo
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Combinación 1
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="accent"
                          variant="outline"
                          rounded="lg"
                          rightIcon={<ArrowRight />}
                        >
                          Continuar
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Combinación 2
                        </Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CustomButton
                          color="success"
                          variant="subtle"
                          size="lg"
                          leftIcon={<Check />}
                        >
                          Completado
                        </CustomButton>
                        <Text variant="muted" size="sm" fontType="body">
                          Combinación 3
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>

          {/* Sección de Ejemplos de Uso */}
          <TabsContent value="examples">
            <ProCard variant="neutral" border="top" className="overflow-hidden">
              <ProCard.Header>
                <ProCard.Title fontType="heading">
                  Ejemplos de Uso
                </ProCard.Title>
                <ProCard.Subtitle fontType="body">
                  Ejemplos prácticos de cómo utilizar los botones en diferentes
                  contextos.
                </ProCard.Subtitle>
              </ProCard.Header>
              <ProCard.Content>
                <div className="space-y-12">
                  {/* Ejemplo de Formulario */}
                  <div>
                    <Text
                      variant="label"
                      size="xl"
                      className="mb-4"
                      fontType="heading"
                    >
                      Formulario
                    </Text>
                    <ProCard variant="secondary" border="left" className="p-6">
                      <div className="space-y-4">
                        <div>
                          <Text
                            as="label"
                            variant="label"
                            size="sm"
                            className="block mb-1"
                            fontType="heading"
                          >
                            Nombre
                          </Text>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder="Ingresa tu nombre"
                          />
                        </div>
                        <div>
                          <Text
                            as="label"
                            variant="label"
                            size="sm"
                            className="block mb-1"
                            fontType="heading"
                          >
                            Email
                          </Text>
                          <input
                            type="email"
                            className="w-full p-2 border rounded-md"
                            placeholder="Ingresa tu email"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <CustomButton color="default" variant="ghost">
                            Cancelar
                          </CustomButton>
                          <CustomButton color="primary">Enviar</CustomButton>
                        </div>
                      </div>
                    </ProCard>
                  </div>

                  {/* Ejemplo de Acciones de Documento */}
                  <div>
                    <Text
                      variant="label"
                      size="xl"
                      className="mb-4"
                      fontType="heading"
                    >
                      Acciones de Documento
                    </Text>
                    <ProCard variant="primary" border="left" className="p-6">
                      <div className="flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText className="text-primary" size={24} />
                          <Text
                            variant="default"
                            fontType="heading"
                            weight="medium"
                          >
                            documento.pdf
                          </Text>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                          <CustomButton
                            color="default"
                            variant="outline"
                            leftIcon={<Download />}
                          >
                            Descargar
                          </CustomButton>
                          <CustomButton color="primary" leftIcon={<Edit />}>
                            Editar
                          </CustomButton>
                          <CustomButton
                            color="danger"
                            variant="ghost"
                            leftIcon={<Trash />}
                          >
                            Eliminar
                          </CustomButton>
                        </div>
                      </div>
                    </ProCard>
                  </div>

                  {/* Ejemplo de Navegación por Pasos */}
                  <div>
                    <Text
                      variant="label"
                      size="xl"
                      className="mb-4"
                      fontType="heading"
                    >
                      Navegación por Pasos
                    </Text>
                    <ProCard variant="tertiary" border="left" className="p-6">
                      <div className="space-y-6">
                        <div className="flex justify-between">
                          <Text
                            variant="default"
                            fontType="heading"
                            weight="medium"
                          >
                            Paso 2 de 4: Información Personal
                          </Text>
                          <Text variant="muted" size="sm" fontType="body">
                            50% completado
                          </Text>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full w-1/2"></div>
                        </div>
                        <div className="flex justify-between pt-4">
                          <CustomButton
                            color="default"
                            variant="outline"
                            leftIcon={<ArrowRight className="rotate-180" />}
                          >
                            Anterior
                          </CustomButton>
                          <CustomButton
                            color="primary"
                            rightIcon={<ArrowRight />}
                          >
                            Siguiente
                          </CustomButton>
                        </div>
                      </div>
                    </ProCard>
                  </div>

                  {/* Ejemplo de Barra de Herramientas */}
                  <div>
                    <Text
                      variant="label"
                      size="xl"
                      className="mb-4"
                      fontType="heading"
                    >
                      Barra de Herramientas
                    </Text>
                    <ProCard variant="accent" border="left" className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <CustomButton
                          color="default"
                          variant="ghost"
                          iconOnly
                          aria-label="Negrita"
                        >
                          <span className="font-bold">B</span>
                        </CustomButton>
                        <CustomButton
                          color="default"
                          variant="ghost"
                          iconOnly
                          aria-label="Cursiva"
                        >
                          <span className="italic">I</span>
                        </CustomButton>
                        <CustomButton
                          color="default"
                          variant="ghost"
                          iconOnly
                          aria-label="Subrayado"
                        >
                          <span className="underline">U</span>
                        </CustomButton>
                        <Divider variant="subtle" size="xs" className="h-6" />
                        <CustomButton
                          color="default"
                          variant="ghost"
                          iconOnly
                          aria-label="Alinear a la izquierda"
                        >
                          <span>≡</span>
                        </CustomButton>
                        <Divider variant="subtle" size="xs" className="h-6" />
                        <CustomButton
                          color="default"
                          variant="ghost"
                          iconOnly
                          aria-label="Centrar"
                        >
                          <span>≡</span>
                        </CustomButton>
                        <Divider variant="subtle" size="xs" className="h-6" />
                        <CustomButton
                          color="default"
                          variant="ghost"
                          iconOnly
                          aria-label="Alinear a la derecha"
                        >
                          <span>≡</span>
                        </CustomButton>
                        <Divider variant="subtle" size="xs" className="h-6" />
                        <CustomButton color="primary" size="sm">
                          Publicar
                        </CustomButton>
                      </div>
                    </ProCard>
                  </div>

                  {/* Ejemplo de Página de Llamada a la Acción */}
                  <div>
                    <Text
                      variant="label"
                      size="xl"
                      className="mb-4"
                      fontType="heading"
                    >
                      Llamada a la Acción
                    </Text>
                    <ProCard variant="success" border="left" className="p-6">
                      <div className="text-center space-y-4">
                        <Text
                          as="h4"
                          variant="heading"
                          size="xl"
                          fontType="heading"
                        >
                          ¡Únete a nuestra comunidad!
                        </Text>
                        <Text variant="muted" fontType="body">
                          Obtén acceso a contenido exclusivo y conecta con otros
                          miembros.
                        </Text>
                        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                          <CustomButton color="default" variant="outline">
                            Saber más
                          </CustomButton>
                          <CustomButton color="primary" size="lg" elevated>
                            Registrarse Ahora
                          </CustomButton>
                        </div>
                      </div>
                    </ProCard>
                  </div>
                </div>
              </ProCard.Content>
            </ProCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageBackground>
  );
}
