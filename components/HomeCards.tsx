"use client";

import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import Link from "next/link";
import { CustomButton } from "@/components/ui/custom-button";
import {
  FileText,
  BookOpen,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "@/components/ui/lucide-icons";
import { BadgeCustom } from "@/components/ui/badge-custom";

export function HomeCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Módulo de Transcripciones - Completamente implementado */}
      <ProCard
        variant="primary"
        border="top"
        animateEntrance
        className="overflow-hidden hover:shadow-md transition-shadow duration-300"
      >
        <ProCard.Header>
          <div className="flex items-center justify-between">
            <ProCard.Title
              className="flex items-center gap-2"
              fontType="heading"
            >
              <FileText
                color="primary"
                size="md"
                gradient={true}
                gradientWith="accent"
              />
              Transcripciones
            </ProCard.Title>
            <BadgeCustom variant="success" subtle bordered>
              Activo
            </BadgeCustom>
          </div>
          <ProCard.Subtitle
            color="secondary"
            colorVariant="text"
            fontType="body"
          >
            Gestión y análisis de transcripciones de entrevistas
          </ProCard.Subtitle>
        </ProCard.Header>

        <ProCard.Content>
          <Text
            variant="default"
            size="sm"
            className="mb-6 text-muted-foreground"
            fontType="body"
          >
            Herramienta para la gestión, análisis y visualización de
            transcripciones de entrevistas. Permite cargar transcripciones,
            normalizarlas y organizarlas en una matriz de vaciado.
          </Text>

          <ProCard variant="tertiary" border="none" className="mb-6">
            <ProCard.Content>
              <Text
                variant="label"
                className="mb-2"
                fontType="heading"
                weight="semibold"
              >
                Funcionalidades principales:
              </Text>

              <ul className="space-y-1 list-disc list-inside">
                <Text as="li" size="sm" fontType="body">
                  Gestión de fundaciones y entrevistados
                </Text>
                <Text as="li" size="sm" fontType="body">
                  Carga y validación de transcripciones
                </Text>
                <Text as="li" size="sm" fontType="body">
                  Normalización de textos
                </Text>
                <Text as="li" size="sm" fontType="body">
                  Matriz de vaciado para análisis
                </Text>
              </ul>
            </ProCard.Content>
          </ProCard>
        </ProCard.Content>

        <ProCard.Actions>
          <Link href="/entrevistas" className="w-full">
            <CustomButton className="w-full group" variant="solid">
              <Text fontType="heading" size="sm">
                Acceder al módulo
              </Text>
              <ArrowRight
                color="default"
                colorVariant="pure"
                size="sm"
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </CustomButton>
          </Link>
        </ProCard.Actions>
      </ProCard>

      {/* Módulo de Artículos Académicos - Implementando los componentes */}
      <ProCard
        variant="secondary"
        border="top"
        animateEntrance
        selected={true}
      >
        <ProCard.Header>
          <div className="flex items-center justify-between">
            <ProCard.Title
              className="flex items-center gap-2"
              fontType="heading"
            >
              <BookOpen
                color="secondary"
                size="md"
                gradient={true}
                gradientWith="accent"
              />
              Artículos Académicos
            </ProCard.Title>
            <BadgeCustom variant="warning" bordered subtle>
              En construcción
            </BadgeCustom>
          </div>
          <ProCard.Subtitle
            color="tertiary"
            colorVariant="text"
            fontType="body"
          >
            Preclasificación de artículos académicos
          </ProCard.Subtitle>
        </ProCard.Header>

        <ProCard.Content>
          <Text
            variant="default"
            size="sm"
            className="mb-6 text-muted-foreground"
            fontType="body"
          >
            Sistema para la preclasificación, categorización y análisis de
            artículos académicos. Facilita la organización y revisión
            sistemática de literatura científica.
          </Text>

          <ProCard variant="tertiary" border="none"
          shadow="none"
          disableShadowHover
          className="mb-6">
            <ProCard.Content>
              <Text
                variant="label"
                className="mb-2"
                fontType="heading"
                weight="semibold"
                
              >
                Funcionalidades previstas:
              </Text>

              <ul className="space-y-1 list-disc list-inside">
                <Text as="li" size="sm" fontType="body">
                  Importación de metadatos de artículos
                </Text>
                <Text as="li" size="sm" fontType="body">
                  Categorización por temas y relevancia
                </Text>
                <Text as="li" size="sm" fontType="body">
                  Extracción automática de conceptos clave
                </Text>
                <Text as="li" size="sm" fontType="body">
                  Generación de reportes de revisión
                </Text>
              </ul>
            </ProCard.Content>
          </ProCard>
        </ProCard.Content>

        <ProCard.Actions>
          <CustomButton className="w-full" variant="outline" disabled>
            <Text fontType="heading" size="sm">
              Próximamente
            </Text>
            <Sparkles
              color="accent"
              size="sm"
              className="ml-2"
              gradient={true}
              gradientWith="secondary"
            />
          </CustomButton>
        </ProCard.Actions>
      </ProCard>
    </div>
  );
}
