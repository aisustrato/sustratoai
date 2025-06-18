"use client";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";
import {
  FileText,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardIcon } from "@/components/ui/StandardIcon";

export function HomeCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Módulo de Transcripciones - Completamente implementado */}
      <StandardCard
        colorScheme="primary"
        accentPlacement="top"
        animateEntrance
        disableShadowHover={false}
        className="overflow-hidden hover:shadow-md transition-shadow duration-300"
      >
        <StandardCard.Header>
          <div className="flex items-center justify-between">
            <StandardCard.Title
              className="flex items-center gap-2"
            >
              <StandardIcon colorScheme="primary" size="md">
                 <FileText />
              </StandardIcon>
              Transcripciones
            </StandardCard.Title>
            <StandardBadge colorScheme="success" styleType="subtle" size="md">
              Activo
            </StandardBadge>
          </div>
          <StandardCard.Subtitle>
            <StandardText size="sm" colorScheme="secondary">
              Gestión y análisis de transcripciones de entrevistas
            </StandardText>
          </StandardCard.Subtitle>
        </StandardCard.Header>

        <StandardCard.Content>
          <div className="mb-6 text-muted-foreground">
            <StandardText size="sm">
              Herramienta para la gestión, análisis y visualización de
              transcripciones de entrevistas. Permite cargar transcripciones,
              normalizarlas y organizarlas en una matriz de vaciado.
            </StandardText>
          </div>

          <StandardCard colorScheme="tertiary" className="mb-6">
            <StandardCard.Content>
              <StandardText
                className="mb-2"
                weight="semibold"
              >
                Funcionalidades principales:
              </StandardText>

              <ul className="space-y-1 list-disc list-inside">
                <li>
                  <StandardText asElement="span" size="sm">
                    Gestión de fundaciones y entrevistados
                  </StandardText>
                </li>
                <li>
                  <StandardText asElement="span" size="sm">
                    Carga y validación de transcripciones
                  </StandardText>
                </li>
                <li>
                  <StandardText asElement="span" size="sm">
                    Normalización de textos
                  </StandardText>
                </li>
                <li>
                  <StandardText asElement="span" size="sm">
                    Matriz de vaciado para análisis
                  </StandardText>
                </li>
              </ul>
            </StandardCard.Content>
          </StandardCard>
        </StandardCard.Content>

        <StandardCard.Actions>
          <Link href="/entrevistas" className="w-full">
            <StandardButton className="w-full group" styleType="solid" rightIcon={ArrowRight}>
                Acceder al módulo
            </StandardButton>
          </Link>
        </StandardCard.Actions>
      </StandardCard>

      {/* Módulo de Artículos Académicos - Implementando los componentes */}
      <StandardCard
        colorScheme="secondary"
        accentPlacement="top"
        animateEntrance
        disableShadowHover={false}
      >
        <StandardCard.Header>
          <div className="flex items-center justify-between">
            <StandardCard.Title
              className="flex items-center gap-2"
            >
              <StandardIcon colorScheme="secondary" size="md">
                <BookOpen />
              </StandardIcon>
              Artículos Académicos
            </StandardCard.Title>
            <StandardBadge colorScheme="warning" styleType="outline">
              En construcción
            </StandardBadge>
          </div>
          <StandardCard.Subtitle>
            <StandardText size="sm" colorScheme="tertiary">
              Preclasificación de artículos académicos
            </StandardText>
          </StandardCard.Subtitle>
        </StandardCard.Header>

        <StandardCard.Content>
          <div className="mb-6 text-muted-foreground">
            <StandardText size="sm">
              Sistema para la preclasificación, categorización y análisis de
              artículos académicos. Facilita la organización y revisión
              sistemática de literatura científica.
            </StandardText>
          </div>

          <StandardCard colorScheme="tertiary"
            shadow="none"
            className="mb-6">
            <StandardCard.Content>
              <StandardText
                className="mb-2"
                weight="semibold"
              >
                Funcionalidades previstas:
              </StandardText>

              <ul className="space-y-1 list-disc list-inside">
                <li>
                  <StandardText asElement="span" size="sm">
                    Importación de metadatos de artículos
                  </StandardText>
                </li>
                <li>
                  <StandardText asElement="span" size="sm">
                    Categorización por temas y relevancia
                  </StandardText>
                </li>
                <li>
                  <StandardText asElement="span" size="sm">
                    Extracción automática de conceptos clave
                  </StandardText>
                </li>
                <li>
                  <StandardText asElement="span" size="sm">
                    Generación de reportes de revisión
                  </StandardText>
                </li>
              </ul>
            </StandardCard.Content>
          </StandardCard>
        </StandardCard.Content>

        <StandardCard.Actions>
          <StandardButton className="w-full" styleType="outline" disabled rightIcon={Sparkles}>
              Próximamente
          </StandardButton>
        </StandardCard.Actions>
      </StandardCard>
    </div>
  );
}
