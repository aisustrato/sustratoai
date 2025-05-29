"use client";

import { useState } from "react";
import { PageBackground } from "@/components/ui/page-background";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ShowroomLoadingLogo() {
  const [variant, setVariant] = useState<
    "spin" | "pulse" | "spin-pulse" | "dash" | "progress"
  >("spin");
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [showText, setShowText] = useState(false);
  const [size, setSize] = useState<number>(64);
  const [breathingEffect, setBreathingEffect] = useState(true);
  const [colorTransition, setColorTransition] = useState(true);

  return (
    <PageBackground variant="gradient">
      <div className="container mx-auto py-8 px-4">
        <Text as="h1" size="3xl" weight="bold" className="mb-6 text-center">
          Sustrato Loading Logo
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ProCard border="normal" className="p-6">
            <Text as="h2" size="xl" weight="semibold" className="mb-4">
              Personalización
            </Text>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="variant">Variante</Label>
                <Select
                  value={variant}
                  onValueChange={(v) => setVariant(v as any)}
                >
                  <SelectTrigger id="variant">
                    <SelectValue placeholder="Selecciona una variante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spin">Rotación</SelectItem>
                    <SelectItem value="pulse">Pulso</SelectItem>
                    <SelectItem value="spin-pulse">Rotación y Pulso</SelectItem>
                    <SelectItem value="dash">Trazo Animado</SelectItem>
                    <SelectItem value="progress">Progreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="speed">Velocidad</Label>
                <Select value={speed} onValueChange={(v) => setSpeed(v as any)}>
                  <SelectTrigger id="speed">
                    <SelectValue placeholder="Selecciona una velocidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Lenta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Rápida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="size">Tamaño</Label>
                <Select
                  value={size.toString()}
                  onValueChange={(v) => setSize(Number.parseInt(v))}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Selecciona un tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="32">Pequeño (32px)</SelectItem>
                    <SelectItem value="64">Mediano (64px)</SelectItem>
                    <SelectItem value="96">Grande (96px)</SelectItem>
                    <SelectItem value="128">Extra Grande (128px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-text"
                  checked={showText}
                  onCheckedChange={setShowText}
                />
                <Label htmlFor="show-text">Mostrar texto</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="breathing-effect"
                  checked={breathingEffect}
                  onCheckedChange={setBreathingEffect}
                />
                <Label htmlFor="breathing-effect">Efecto de respiración</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="color-transition"
                  checked={colorTransition}
                  onCheckedChange={setColorTransition}
                />
                <Label htmlFor="color-transition">Transición de color</Label>
              </div>
            </div>
          </ProCard>

          <ProCard
            border="normal"
            className="p-6 flex items-center justify-center"
          >
            <div className="flex flex-col items-center">
              <SustratoLoadingLogo
                variant={variant}
                speed={speed}
                size={size}
                showText={showText}
                breathingEffect={breathingEffect}
                colorTransition={colorTransition}
              />
              <Text as="p" size="sm" className="mt-4 text-center">
                Vista previa con la configuración actual
              </Text>
            </div>
          </ProCard>
        </div>

        <Divider className="my-8" />

        <Text as="h2" size="2xl" weight="semibold" className="mb-6 text-center">
          Efectos especiales
        </Text>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              breathingEffect={true}
              colorTransition={false}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Solo efecto de respiración
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              breathingEffect={false}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Solo transición de color
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Ambos efectos combinados
            </Text>
          </ProCard>
        </div>

        <Divider className="my-8" />

        <Text as="h2" size="2xl" weight="semibold" className="mb-6 text-center">
          Todas las variantes con efectos
        </Text>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Rotación
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="pulse"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Pulso
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin-pulse"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Rotación y Pulso
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="dash"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Trazo Animado
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="progress"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Progreso
            </Text>
          </ProCard>
        </div>

        <Divider className="my-8" />

        <Text as="h2" size="2xl" weight="semibold" className="mb-6 text-center">
          Diferentes velocidades
        </Text>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              speed="slow"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Velocidad lenta
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              speed="normal"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Velocidad normal
            </Text>
          </ProCard>

          <ProCard border="normal" className="p-4 flex flex-col items-center">
            <SustratoLoadingLogo
              variant="spin"
              speed="fast"
              breathingEffect={true}
              colorTransition={true}
            />
            <Text as="p" size="sm" className="mt-4 text-center">
              Velocidad rápida
            </Text>
          </ProCard>
        </div>
      </div>
    </PageBackground>
  );
}
