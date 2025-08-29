//. 📍 /components/ui/StandardAccordion/standard-accordion-context.ts

import { createContext, useContext } from 'react';
import type { AppColorTokens, ColorSchemeVariant, Mode } from '@/lib/theme/ColorToken';

export interface StandardAccordionContextValue {
  colorScheme: ColorSchemeVariant;
  size: 'sm' | 'md' | 'lg';
  styleType: 'subtle' | 'solid';
  appColorTokens: AppColorTokens | null;
  mode: Mode;
  openItems: string[];
}

export const StandardAccordionContext = createContext<StandardAccordionContextValue | null>(null);

export const useStandardAccordion = () => {
  const context = useContext(StandardAccordionContext);
  if (!context) {
    throw new Error('useStandardAccordion must be used within a StandardAccordion provider');
  }
  return context;
};
