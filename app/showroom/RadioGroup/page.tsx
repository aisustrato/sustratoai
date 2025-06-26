//. 📍 app/showroom/RadioGroup/page.tsx

'use client';

import { useState } from 'react';
import { StandardRadioGroup, type RadioGroupOption } from '@/components/ui/StandardRadioGroup';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardWrapper } from '@/components/ui/StandardWrapper';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardText } from '@/components/ui/StandardText';

const options: RadioGroupOption[] = [
  { value: 'react', label: 'React.js', description: 'Biblioteca para interfaces de usuario' },
  { value: 'vue', label: 'Vue.js', description: 'El framework progresivo' },
  { value: 'angular', label: 'Angular', description: 'Plataforma para aplicaciones web' },
  { value: 'svelte', label: 'Svelte', disabled: true, description: 'Componentes ciber-mejorados' },
];

export default function RadioGroupShowroomPage() {
  const [plan, setPlan] = useState<string>('react');
  const [delivery, setDelivery] = useState<string>('email');

  return (
    <StandardWrapper>
      <StandardPageTitle title="Showroom: StandardRadioGroup" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

        <StandardCard title="Vertical (Default)">
          <StandardRadioGroup
            name="framework-plan"
            label="Elige tu plan"
            description="Selecciona el framework principal para tu proyecto."
            options={options}
            value={plan}
            onChange={setPlan}
            colorScheme="primary"
          />
          <StandardText size="sm" className="mt-4 p-2 bg-gray-100 rounded-md">
            Seleccionado: {plan || 'Ninguno'}
          </StandardText>
        </StandardCard>

        <StandardCard title="Horizontal">
          <StandardRadioGroup
            name="delivery-method"
            label="Método de Entrega"
            orientation="horizontal"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'pickup', label: 'Recoger en tienda' },
            ]}
            value={delivery}
            onChange={setDelivery}
            colorScheme="secondary"
            size="sm"
          />
          <StandardText size="sm" className="mt-4 p-2 bg-gray-100 rounded-md">
            Seleccionado: {delivery || 'Ninguno'}
          </StandardText>
        </StandardCard>

        <StandardCard title="Estado Deshabilitado">
          <StandardRadioGroup
            name="disabled-plan"
            label="Plan (Deshabilitado)"
            options={options.slice(0, 2)}
            defaultValue={'react'}
            disabled
          />
        </StandardCard>

        <StandardCard title="Estado de Error">
          <StandardRadioGroup
            name="terms-acceptance"
            label="Confirmación de Edad"
            options={[{ value: 'confirm', label: 'Confirmo que soy mayor de edad' }]}
            error="Debes confirmar que eres mayor de edad para continuar."
            colorScheme="danger"
          />
        </StandardCard>

      </div>
    </StandardWrapper>
  );
}
