"use client";

import { ProCard } from "@/components/ui/pro-card";
// import type { ProCardVariant, ProCardBorderStyle } from "@/components/ui/pro-card"; // Antigua importación
import type { ProCardVariant } from "@/lib/theme/ColorToken"; // Corregido: Importar ProCardVariant desde ColorToken
import type { ProCardBorderStyle } from "@/components/ui/pro-card"; // ProCardBorderStyle probablemente sí se exporta desde pro-card o necesita ser definido globalmente
import { Text } from "@/components/ui/text";
// import { ThemeProviderWrapper } from "@/app/theme-provider-wrapper"; // Eliminado temporalmente, asumir ThemeProvider en layout superior
import { Separator } from "@/components/ui/separator";

const cardVariants: ProCardVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "accent",
  "success",
  "warning",
  "danger",
  "neutral",
  "white",
];

const borderStyles: ProCardBorderStyle[] = ["none", "normal", "top", "left"];

export default function ProCardShowroomPage() {
  return (
    // <ThemeProviderWrapper>
    <div className="p-4 md:p-8 space-y-8 bg-neutral-bg min-h-screen text-neutral-text">
      <Text
        variant="heading"
        size="4xl"
        as="h1"
        className="text-center mb-12 text-primary-text"
      >
        ProCard Component Showroom
      </Text>

      {cardVariants.map((mainVariant) => (
        <section
          key={mainVariant}
          className="space-y-6 p-6 bg-neutral-bgDark rounded-lg shadow-lg"
        >
          <Text
            variant="heading"
            size="2xl"
            as="h2"
            className="capitalize text-accent-text"
          >
            Variant: {mainVariant}
          </Text>

          {borderStyles.map((borderStyle) => (
            <div key={borderStyle} className="space-y-4">
              <Text
                variant="label"
                size="lg"
                as="h3"
                className="capitalize text-secondary-text"
              >
                Border Style: {borderStyle}
              </Text>
              <Separator className="bg-neutral-pureShade" />

              {borderStyle === "none" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ProCard variant={mainVariant} border="none">
                    <ProCard.Header>
                      <ProCard.Title>Card (None)</ProCard.Title>
                      <ProCard.Subtitle>
                        Variant: {mainVariant}
                      </ProCard.Subtitle>
                    </ProCard.Header>
                    <ProCard.Content>
                      <p>This is a ProCard with no border.</p>
                    </ProCard.Content>
                  </ProCard>
                  <ProCard variant={mainVariant} border="none" selected>
                    <ProCard.Header>
                      <ProCard.Title>Selected (None)</ProCard.Title>
                      <ProCard.Subtitle>
                        Variant: {mainVariant}
                      </ProCard.Subtitle>
                    </ProCard.Header>
                    <ProCard.Content>
                      <p>This card is selected.</p>
                    </ProCard.Content>
                  </ProCard>
                </div>
              ) : (
                cardVariants.map((borderVariantCombo) => (
                  <div
                    key={`${borderStyle}-${borderVariantCombo}`}
                    className="mb-6"
                  >
                    <Text
                      variant="default"
                      size="md"
                      as="h4"
                      className="capitalize mb-2 text-tertiary-text"
                    >
                      Border Variant: {borderVariantCombo}
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <ProCard
                        variant={mainVariant}
                        border={borderStyle}
                        borderVariant={borderVariantCombo}
                      >
                        <ProCard.Header>
                          <ProCard.Title>Card</ProCard.Title>
                          <ProCard.Subtitle>
                            Main: {mainVariant}, Border: {borderVariantCombo}
                          </ProCard.Subtitle>
                        </ProCard.Header>
                        <ProCard.Content>
                          <p>Content for card.</p>
                        </ProCard.Content>
                      </ProCard>
                      <ProCard
                        variant={mainVariant}
                        border={borderStyle}
                        borderVariant={borderVariantCombo}
                        selected
                      >
                        <ProCard.Header>
                          <ProCard.Title>Selected Card</ProCard.Title>
                          <ProCard.Subtitle>
                            Main: {mainVariant}, Border: {borderVariantCombo}
                          </ProCard.Subtitle>
                        </ProCard.Header>
                        <ProCard.Content>
                          <p>This card is selected.</p>
                        </ProCard.Content>
                      </ProCard>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
    // </ThemeProviderWrapper>
  );
}
