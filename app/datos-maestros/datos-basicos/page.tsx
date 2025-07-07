"use client";

import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { ClipboardList } from 'lucide-react';
import { StandardText } from '@/components/ui/StandardText';

export default function DatosBasicosPage() {
  return (
    <div>
      <StandardPageTitle
        title="Datos Básicos del Proyecto"
        subtitle="Configura la información básica de tu proyecto de revisión sistemática"
        mainIcon={ClipboardList}
        showBackButton={{ href: "/datos-maestros" }}
        breadcrumbs={[
          { label: "Datos Maestros", href: "/datos-maestros" },
          { label: "Datos Básicos" },
        ]}
      />
      <div className="mt-8">
        <StandardText>Contenido de la página de datos básicos...</StandardText>
      </div>
    </div>
  );
}
