//. 📍 app/showroom/CheckboxGroup/page.tsx

'use client';

import { useState } from 'react';
import { StandardCheckboxGroup, type CheckboxGroupOption } from '@/components/ui/StandardCheckboxGroup';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardWrapper } from '@/components/ui/StandardWrapper';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardText } from '@/components/ui/StandardText';

const options: CheckboxGroupOption[] = [
  { value: 'react', label: 'React.js', description: 'Biblioteca para interfaces de usuario' },
  { value: 'vue', label: 'Vue.js', description: 'El framework progresivo' },
  { value: 'angular', label: 'Angular', description: 'Plataforma para aplicaciones web' },
  { value: 'svelte', label: 'Svelte', disabled: true, description: 'Componentes ciber-mejorados' },
];

export default function CheckboxGroupShowroomPage() {
  const [selected, setSelected] = useState<string[]>(['react']);
  const [selectedHorizontal, setSelectedHorizontal] = useState<string[]>([]);

  return (
    <StandardWrapper>
      <StandardPageTitle
        title="Showroom: StandardCheckboxGroup"
        description="Demostración de las variantes y estados del componente StandardCheckboxGroup."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

        <StandardCard title="Vertical (Default)">
          <StandardCheckboxGroup
            label="Frameworks Frontend"
            description="Elige tus herramientas favoritas."
            options={options}
            value={selected}
            onChange={setSelected}
            colorScheme="primary"
          />
          <StandardText size="sm" className="mt-4 p-2 bg-gray-100 rounded-md">
            Seleccionado: {selected.join(', ') || 'Ninguno'}
          </StandardText>
        </StandardCard>

        <StandardCard title="Horizontal">
          <StandardCheckboxGroup
            label="Opciones de Notificación"
            orientation="horizontal"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'push', label: 'Push' },
            ]}
            value={selectedHorizontal}
            onChange={setSelectedHorizontal}
            colorScheme="secondary"
            size="sm"
          />
          <StandardText size="sm" className="mt-4 p-2 bg-gray-100 rounded-md">
            Seleccionado: {selectedHorizontal.join(', ') || 'Ninguno'}
          </StandardText>
        </StandardCard>

        <StandardCard title="Estado Deshabilitado">
          <StandardCheckboxGroup
            label="Permisos (Deshabilitado)"
            options={options.slice(0, 2)}
            defaultValue={['react']}
            disabled
          />
        </StandardCard>

        <StandardCard title="Estado de Error">
          <StandardCheckboxGroup
            label="Términos y Condiciones"
            options={[{ value: 'terms', label: 'Acepto los términos y condiciones' }]}
            error="Debes aceptar los términos para continuar."
            colorScheme="danger"
          />
        </StandardCard>

      </div>
    </StandardWrapper>
  );
}
