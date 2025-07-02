//. 📍 app/datos-maestros/cargar-articulos/page.tsx
"use client";

import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from '@/components/ui/StandardText';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { Info } from 'lucide-react';

export default function CargarArticulosPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StandardPageTitle 
        title="Cargar Artículos" 
        description="Módulo de carga de artículos (en construcción)"
      />
      
      <StandardCard
        colorScheme="primary"
        styleType="subtle"
        className="mt-6 text-center max-w-lg mx-auto p-8"
      >
        <StandardCard.Header className="items-center flex flex-col">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 mb-4">
            <StandardIcon><Info className="h-6 w-6 text-primary-600" /></StandardIcon>
          </div>
          <StandardText size="lg" weight="bold" colorScheme="primary">Módulo en Construcción</StandardText>
        </StandardCard.Header>
        <StandardCard.Content>
          <StandardText>Esta funcionalidad estará disponible próximamente.</StandardText>
        </StandardCard.Content>
      </StandardCard>
    </div>
  );
}
