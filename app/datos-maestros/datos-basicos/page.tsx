"use client";

import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { ClipboardList } from 'lucide-react';
import { StandardText } from '@/components/ui/StandardText';

export default function DatosBasicosPage() {
  return (
    <div>
      <StandardPageTitle 
        title="Datos Básicos"
        subtitle="Información del proyecto"
        description="Gestión de la información fundamental del proyecto, como el nombre, descripción y otros metadatos clave."
        mainIcon={ClipboardList}
      />
      <div className="mt-8">
        <StandardText>Contenido de la página de datos básicos...</StandardText>
      </div>
    </div>
  );
}
