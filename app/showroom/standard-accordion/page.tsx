//. 📍 /app/showroom/standard-accordion/page.tsx

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StandardAccordion, StandardAccordionItem, StandardAccordionTrigger, StandardAccordionContent } from '@/components/ui/StandardAccordion';
import { StandardText } from '@/components/ui/StandardText';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardSelect } from '@/components/ui/StandardSelect';
import { StandardLabel } from '@/components/ui/StandardLabel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import type { ColorSchemeVariant } from '@/lib/theme/ColorToken';

const accordionItems = [
  {
    value: 'item-1',
    trigger: '¿Es accesible?',
    content: 'Sí. Cumple con los estándares de WAI-ARIA para la accesibilidad.',
  },
  {
    value: 'item-2',
    trigger: '¿Se puede estilizar?',
    content: '¡Claro! Utiliza un sistema de tokens para una personalización completa y coherente.',
  },
  {
    value: 'item-3',
    trigger: '¿Puede tener un valor por defecto?',
    content: 'Sí, puedes controlar qué item está abierto por defecto al montar el componente.',
  },
];

const colorSchemesForDemo: ColorSchemeVariant[] = [
	"primary", "secondary", "tertiary", "accent", "success", "warning", "danger", "neutral"
];

export default function StandardAccordionShowroomPage() {
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [colorScheme, setColorScheme] = useState<ColorSchemeVariant>('primary');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [singleValue, setSingleValue] = useState<string | undefined>('item-1');
  const [multipleValue, setMultipleValue] = useState<string[] | undefined>(['item-1']);

  const commonAccordionProps = {
    colorScheme,
    size,
    className: "w-full",
  };

  const renderItems = () => accordionItems.map(item => (
    <StandardAccordionItem key={item.value} value={item.value}>
      <StandardAccordionTrigger>{item.trigger}</StandardAccordionTrigger>
      <StandardAccordionContent>
        <StandardText>{item.content}</StandardText>
      </StandardAccordionContent>
    </StandardAccordionItem>
  ));

  return (
    <div className="container mx-auto p-8">
      <header className="text-center mb-12">
        <StandardText asElement="h1" size="3xl" weight="bold" className="mb-2">
          StandardAccordion Showroom
        </StandardText>
        <StandardText colorScheme="neutral" size="lg">
          Explora las variantes y propiedades del componente StandardAccordion.
        </StandardText>
        <div className="mt-4">
          <ThemeSwitcher />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Panel de Controles */}
        <aside className="md:col-span-1">
          <StandardCard className="p-6 sticky top-8">
            <StandardText asElement="h3" size="lg" weight="semibold" className="mb-6">Controles</StandardText>
            <div className="space-y-6">
              <StandardLabel>
                Tipo de Acordeón
                <StandardSelect
                  options={[{ value: 'single', label: 'Único' }, { value: 'multiple', label: 'Múltiple' }]}
                  value={type}
                  onChange={(value) => setType(value as 'single' | 'multiple')}
                />
              </StandardLabel>
              <StandardLabel>
                Color Scheme
                <StandardSelect
                  options={colorSchemesForDemo.map(cs => ({ value: cs, label: cs.charAt(0).toUpperCase() + cs.slice(1) }))}
                  value={colorScheme}
                  onChange={(value) => setColorScheme(value as ColorSchemeVariant)}
                />
              </StandardLabel>
              <StandardLabel>
                Tamaño (Size)
                <StandardSelect
                  options={[{ value: 'sm', label: 'Pequeño' }, { value: 'md', label: 'Mediano' }, { value: 'lg', label: 'Grande' }]}
                  value={size}
                  onChange={(value) => setSize(value as 'sm' | 'md' | 'lg')}
                />
              </StandardLabel>
            </div>
          </StandardCard>
        </aside>

        {/* Área de Demostración */}
        <main className="md:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {type === 'single' ? (
              <StandardAccordion
                type="single"
                value={singleValue}
                onValueChange={setSingleValue}
                collapsible
                {...commonAccordionProps}
              >
                {renderItems()}
              </StandardAccordion>
            ) : (
              <StandardAccordion
                type="multiple"
                value={multipleValue}
                onValueChange={setMultipleValue}
                {...commonAccordionProps}
              >
                {renderItems()}
              </StandardAccordion>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
