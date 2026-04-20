// 📍 app/cognetica_old/minotauro/[universeId]/components/SentidoInput.tsx
// 🎯 Input para "sentido" - pre-calibración breve antes de procesar con arquetipo

import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { StandardCard } from '@/components/ui/StandardCard';

interface SentidoInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SentidoInput({ value, onChange, placeholder }: SentidoInputProps) {
  return (
    <StandardCard colorScheme="accent" className="p-3 mb-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">🎯 Sentido de la Intervención</span>
          <span className="text-xs text-muted-foreground">(Opcional)</span>
        </div>
        <StandardTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Ej: Acortar sin diluir, Enriquecer con ejemplos, Simplificar lenguaje técnico"}
          rows={2}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          💡 Orienta al arquetipo con una instrucción breve sobre qué esperas de su análisis
        </p>
      </div>
    </StandardCard>
  );
}
