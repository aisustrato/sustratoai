"use client";

import { useState } from "react";
import { PageBackground } from "@/components/ui/page-background";
import { ProCard } from "@/components/ui/pro-card";
import { CustomCheck } from "@/components/ui/custom-check";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { useTheme } from "@/app/theme-provider";

export default function CheckShowroom() {
  const { colorScheme, mode } = useTheme();
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const variants = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "success",
    "warning",
    "danger",
    "neutral",
  ] as const;
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
  const visualVariants = ["default", "outline", "subtle", "solid"] as const;

  return (
    <PageBackground variant="gradient">
      <div className="container mx-auto py-8 space-y-8">
        <ProCard border="none" className="p-6">
          <ProCard.Header>
            <ProCard.Title fontType="heading" size="3xl">
              Custom Check Showroom
            </ProCard.Title>
          </ProCard.Header>
          <ProCard.Content>
            <Text as="p" size="lg" className="mb-6">
              Explora las diferentes variantes y opciones del componente
              CustomCheck
            </Text>

            <Divider className="my-6" />

            {/* Sección interactiva */}
            <Text as="h2" size="xl" fontType="heading" className="mb-4">
              Prueba interactiva
            </Text>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-4 items-center">
                <CustomCheck
                  checked={isChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  label="Checkbox interactivo"
                  description="Prueba las diferentes opciones"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsChecked(!isChecked);
                      setIsIndeterminate(false);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    Toggle Checked
                  </button>
                  <button
                    onClick={() => {
                      setIsIndeterminate(!isIndeterminate);
                      setIsChecked(false);
                    }}
                    className="px-3 py-1 bg-purple-500 text-white rounded"
                  >
                    Toggle Indeterminate
                  </button>
                </div>
              </div>
            </div>

            <Divider className="my-6" />

            {/* Variantes de color */}
            <Text as="h2" size="xl" fontType="heading" className="mb-4">
              Variantes de color
            </Text>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {variants.map((variant) => (
                <CustomCheck
                  key={variant}
                  variant={variant}
                  label={`Variante ${variant}`}
                  defaultChecked
                />
              ))}
            </div>

            <Divider className="my-6" />

            {/* Tamaños */}
            <Text as="h2" size="xl" fontType="heading" className="mb-4">
              Tamaños
            </Text>
            <div className="flex flex-col gap-4 mb-6">
              {sizes.map((size) => (
                <CustomCheck
                  key={size}
                  size={size}
                  label={`Tamaño ${size}`}
                  description={`Este es un checkbox de tamaño ${size}`}
                  defaultChecked
                />
              ))}
            </div>

            <Divider className="my-6" />

            {/* Variantes visuales */}
            <Text as="h2" size="xl" fontType="heading" className="mb-4">
              Variantes visuales
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {visualVariants.map((visualVariant) => (
                <div key={visualVariant} className="space-y-2">
                  <Text as="h3" size="lg" fontType="heading" className="mb-2">
                    {visualVariant}
                  </Text>
                  <div className="flex flex-col gap-2">
                    <CustomCheck
                      visualVariant={visualVariant}
                      label={`${visualVariant} - unchecked`}
                    />
                    <CustomCheck
                      visualVariant={visualVariant}
                      label={`${visualVariant} - checked`}
                      defaultChecked
                    />
                    <CustomCheck
                      visualVariant={visualVariant}
                      label={`${visualVariant} - indeterminate`}
                      indeterminate
                    />
                  </div>
                </div>
              ))}
            </div>

            <Divider className="my-6" />

            {/* Estados */}
            <Text as="h2" size="xl" fontType="heading" className="mb-4">
              Estados
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Text as="h3" size="lg" fontType="heading" className="mb-2">
                  Normal
                </Text>
                <div className="flex flex-col gap-2">
                  <CustomCheck label="Unchecked" />
                  <CustomCheck label="Checked" defaultChecked />
                  <CustomCheck label="Indeterminate" indeterminate />
                </div>
              </div>
              <div className="space-y-2">
                <Text as="h3" size="lg" fontType="heading" className="mb-2">
                  Disabled
                </Text>
                <div className="flex flex-col gap-2">
                  <CustomCheck label="Disabled unchecked" disabled />
                  <CustomCheck
                    label="Disabled checked"
                    defaultChecked
                    disabled
                  />
                  <CustomCheck
                    label="Disabled indeterminate"
                    indeterminate
                    disabled
                  />
                </div>
              </div>
            </div>

            <Divider className="my-6" />

            {/* Con error */}
            <Text as="h2" size="xl" fontType="heading" className="mb-4">
              Con error
            </Text>
            <div className="flex flex-col gap-2 mb-6">
              <CustomCheck
                error
                label="Checkbox con error"
                description="Este checkbox tiene un estado de error"
              />
              <CustomCheck
                error
                label="Checkbox con error (checked)"
                description="Este checkbox tiene un estado de error"
                defaultChecked
              />
            </div>
          </ProCard.Content>
        </ProCard>
      </div>
    </PageBackground>
  );
}
