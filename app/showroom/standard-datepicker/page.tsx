'use client';

import { useState } from 'react';
import { StandardDatePicker } from '@/components/ui/StandardDatePicker';
import { StandardText } from '@/components/ui/StandardText';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardSelect } from '@/components/ui/StandardSelect';
import { StandardLabel } from '@/components/ui/StandardLabel';
import { StandardSwitch } from '@/components/ui/StandardSwitch';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import type { ColorSchemeVariant } from '@/lib/theme/ColorToken';

const colorSchemesForDemo: ColorSchemeVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'accent',
  'success',
  'warning',
  'danger',
  'neutral',
];

export default function StandardDatePickerShowroomPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [colorScheme, setColorScheme] = useState<ColorSchemeVariant>('primary');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <div className="container mx-auto p-8">
      <header className="text-center mb-12">
        <StandardText asElement="h1" size="3xl" weight="bold" className="mb-2">
          StandardDatePicker Showroom
        </StandardText>
        <StandardText colorScheme="neutral" size="lg">
          Explora las variantes y propiedades del componente StandardDatePicker.
        </StandardText>
        <div className="mt-4">
          <ThemeSwitcher />
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Panel de Controles */}
        <aside className="w-full md:w-1/3 flex-shrink-0">
          {/* Solución Definitiva: z-10 en el elemento `sticky` para controlar su contexto de apilamiento */}
          <StandardCard className="p-6 sticky top-8 z-10">
            <StandardText asElement="h3" size="lg" weight="semibold" className="mb-6">
              Controles
            </StandardText>
            <div className="space-y-6">
              <StandardLabel>
                Color Scheme
                <StandardSelect
                  options={colorSchemesForDemo.map((cs) => ({
                    value: cs,
                    label: cs.charAt(0).toUpperCase() + cs.slice(1),
                  }))}
                  value={colorScheme}
                  onChange={(value) => setColorScheme(value as ColorSchemeVariant)}
                />
              </StandardLabel>
              <StandardLabel>
                Tamaño (Size)
                <StandardSelect
                  options={[
                    { value: 'sm', label: 'Pequeño' },
                    { value: 'md', label: 'Mediano' },
                    { value: 'lg', label: 'Grande' },
                  ]}
                  value={size}
                  onChange={(value) => setSize(value as 'sm' | 'md' | 'lg')}
                />
              </StandardLabel>
              <div className="flex items-center justify-between">
                <StandardLabel htmlFor="disabled-switch">Deshabilitado</StandardLabel>
                <StandardSwitch
                  id="disabled-switch"
                  checked={isDisabled}
                  onCheckedChange={setIsDisabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <StandardLabel htmlFor="error-switch">Mostrar Error</StandardLabel>
                <StandardSwitch
                  id="error-switch"
                  checked={!!error}
                  onCheckedChange={(checked) =>
                    setError(checked ? 'Este es un mensaje de error de ejemplo.' : undefined)
                  }
                />
              </div>
            </div>
          </StandardCard>
        </aside>

        {/* Área de Demostración */}
        <main className="w-full md:w-2/3 flex flex-col items-center">
          <div className="w-full max-w-sm">
            <StandardDatePicker
              label="Fecha de Nacimiento"
              value={date}
              onValueChange={setDate}
              colorScheme={colorScheme}
              size={size}
              disabled={isDisabled}
              error={error}
            />
          </div>
          <div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md w-full max-w-sm">
            <StandardText size="sm" weight="medium">Valor Actual del Estado:</StandardText>
            <StandardText size="sm" className="font-mono mt-1">
              {date ? date.toString() : 'undefined'}
            </StandardText>
          </div>
        </main>
      </div>
    </div>
  );
}
