import { StandardButton } from '@/components/ui/StandardButton';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import type { HumanResponse } from '@/lib/types/minotauro-types';

interface CalibrationCommentProps {
  index: number;
  point: string;
  observation: string;
  currentResponse?: HumanResponse;
  currentNote: string;
  isExecuted: boolean;
  onResponseChange: (response: HumanResponse) => void;
  onNoteChange: (note: string) => void;
}

export function CalibrationComment({
  index,
  point,
  observation,
  currentResponse,
  currentNote,
  isExecuted,
  onResponseChange,
  onNoteChange,
}: CalibrationCommentProps) {
  return (
    <div className="bg-background/50 p-4 rounded-lg border">
      <div className="font-medium text-sm mb-2">
        📌 {index + 1}. {point}
      </div>
      <div className="text-sm text-muted-foreground mb-3">
        {observation}
      </div>
      
      {/* Botones de respuesta según spec v2 */}
      {!isExecuted ? (
        <div className="flex flex-wrap gap-2 mb-2">
          <StandardButton
            size="xs"
            colorScheme={currentResponse === 'aceptado' ? 'success' : 'neutral'}
            onClick={() => onResponseChange('aceptado')}
          >
            ✅ Aceptar
          </StandardButton>
          
          <StandardButton
            size="xs"
            colorScheme={currentResponse === 'rechazado_con_razon' ? 'warning' : 'neutral'}
            onClick={() => onResponseChange('rechazado_con_razon')}
          >
            ✏️ Rechazar con razón
          </StandardButton>
          
          <StandardButton
            size="xs"
            colorScheme={currentResponse === 'rechazado_sin_razon' ? 'neutral' : 'neutral'}
            onClick={() => onResponseChange('rechazado_sin_razon')}
          >
            ❌ Rechazar
          </StandardButton>
          
          <StandardButton
            size="xs"
            colorScheme={currentResponse === 'respuesta_positiva_fuerte' ? 'primary' : 'neutral'}
            onClick={() => onResponseChange('respuesta_positiva_fuerte')}
          >
            🚀 ¡Me voló la cabeza!
          </StandardButton>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-2">
          <StandardBadge 
            colorScheme={
              currentResponse === 'aceptado' ? 'success' :
              currentResponse === 'rechazado_con_razon' ? 'warning' :
              currentResponse === 'respuesta_positiva_fuerte' ? 'primary' :
              'neutral'
            }
            size="sm"
          >
            {currentResponse === 'aceptado' && '✅ Aceptado'}
            {currentResponse === 'rechazado_con_razon' && '✏️ Rechazado con razón'}
            {currentResponse === 'rechazado_sin_razon' && '❌ Rechazado'}
            {currentResponse === 'respuesta_positiva_fuerte' && '🚀 Me voló la cabeza'}
          </StandardBadge>
        </div>
      )}
      
      {/* Textarea para nota según spec v2 */}
      {currentResponse && (
        <div className="mt-2">
          <label className="text-xs text-muted-foreground mb-1 block">
            {currentResponse === 'aceptado' && '💬 Comentario (opcional):'}
            {currentResponse === 'rechazado_con_razon' && '⚠️ Justifica el rechazo (obligatorio):'}
            {currentResponse === 'rechazado_sin_razon' && '💬 Comentario (opcional):'}
            {currentResponse === 'respuesta_positiva_fuerte' && '🚀 ¿Cómo lo aplicarás? (opcional):'}
          </label>
          <StandardTextarea
            value={currentNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={
              currentResponse === 'aceptado' 
                ? 'Ej: Excelente sugerencia' 
                : currentResponse === 'rechazado_con_razon'
                ? 'Ej: Esto escapa al alcance de este paper'
                : currentResponse === 'rechazado_sin_razon'
                ? 'Ej: No me convence'
                : 'Ej: Esto cambia completamente mi enfoque'
            }
            rows={2}
            disabled={isExecuted}
          />
        </div>
      )}
    </div>
  );
}
