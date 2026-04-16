"use client";

import { StandardCheckbox } from '@/components/ui/StandardCheckbox';
import { StandardTooltip } from '@/components/ui/StandardTooltip';
import { StandardBadge } from '@/components/ui/StandardBadge';

export interface ArtifactTokenData {
  transcripcion: number;
  ensayo_destilado: number;
  elementos_cognitivos: number;
  datos_cronologicos: number;
  metabolizacion_micelio: number;
  chat_calibrador: number;
  total: number;
  detalles: {
    transcripcion_fuente: string;
    transcripcion_preview: string;
    ensayo_destilado_preview: string;
    elementos_preview: string[];
    cronologicos_preview: string;
    micelio_partes: { nombre: string; preview: string }[];
    chat_preview: string;
  };
}

interface ArtifactTokenBreakdownProps {
  artifactId: string;
  artifactTitle: string;
  artifactNumber: number;
  tokenData: ArtifactTokenData;
  selectedElements: Set<string>;
  onElementToggle: (elementId: string) => void;
  isMainSelected: boolean;
  onMainToggle: () => void;
}

const ELEMENT_CONFIG = {
  transcripcion: {
    id: 'transcripcion',
    icon: '📝',
    label: 'Transcripción',
    colorScheme: 'primary' as const,
    getTokens: (data: ArtifactTokenData) => data.transcripcion,
    getPreview: (data: ArtifactTokenData) => data.detalles.transcripcion_preview,
    getTooltipContent: (data: ArtifactTokenData) => 
      `**Fuente:** ${data.detalles.transcripcion_fuente}\n\n**Preview:**\n${data.detalles.transcripcion_preview}`
  },
  ensayo_destilado: {
    id: 'ensayo_destilado',
    icon: '📖',
    label: 'Ensayo Destilado',
    colorScheme: 'primary' as const,
    getTokens: (data: ArtifactTokenData) => data.ensayo_destilado,
    getPreview: (data: ArtifactTokenData) => data.detalles.ensayo_destilado_preview,
    getTooltipContent: (data: ArtifactTokenData) => 
      `**Ensayo Destilado** (~10k tokens)\n\n**Preview:**\n${data.detalles.ensayo_destilado_preview}`
  },
  elementos_cognitivos: {
    id: 'elementos_cognitivos',
    icon: '🧠',
    label: 'Cognitivos',
    colorScheme: 'secondary' as const,
    getTokens: (data: ArtifactTokenData) => data.elementos_cognitivos,
    getPreview: (data: ArtifactTokenData) => data.detalles.elementos_preview.join('\n'),
    getTooltipContent: (data: ArtifactTokenData) => 
      data.detalles.elementos_preview.length > 0 
        ? data.detalles.elementos_preview.join('\n') 
        : 'No hay elementos cognitivos'
  },
  datos_cronologicos: {
    id: 'datos_cronologicos',
    icon: '📅',
    label: 'Cronológicos',
    colorScheme: 'accent' as const,
    getTokens: (data: ArtifactTokenData) => data.datos_cronologicos,
    getPreview: (data: ArtifactTokenData) => data.detalles.cronologicos_preview || '',
    getTooltipContent: (data: ArtifactTokenData) => 
      data.detalles.cronologicos_preview || 'No hay datos cronológicos'
  },
  chat_calibrador: {
    id: 'chat_calibrador',
    icon: '💬',
    label: 'Chat',
    colorScheme: 'tertiary' as const,
    getTokens: (data: ArtifactTokenData) => data.chat_calibrador,
    getPreview: (data: ArtifactTokenData) => data.detalles.chat_preview || '',
    getTooltipContent: (data: ArtifactTokenData) => 
      data.detalles.chat_preview || 'No hay chat calibrador'
  },
};

export function ArtifactTokenBreakdown({
  artifactId,
  artifactTitle,
  artifactNumber,
  tokenData,
  selectedElements,
  onElementToggle,
  isMainSelected,
  onMainToggle,
}: ArtifactTokenBreakdownProps) {
  
  // Calcular total de tokens seleccionados
  const selectedTokens = Object.entries(ELEMENT_CONFIG).reduce((total, [key, config]) => {
    const elementId = `${artifactId}_${key}`;
    if (selectedElements.has(elementId)) {
      return total + config.getTokens(tokenData);
    }
    return total;
  }, 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header con checkbox principal */}
      <div className="bg-muted/30 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <StandardCheckbox
            checked={isMainSelected}
            onChange={onMainToggle}
            colorScheme="primary"
          />
          <span className="text-sm font-semibold text-foreground">
            #{artifactNumber} {artifactTitle}
          </span>
          {isMainSelected && (
            <StandardBadge colorScheme="primary" size="sm" styleType="subtle">
              {selectedTokens.toLocaleString('es-ES')} tokens
            </StandardBadge>
          )}
        </div>
      </div>

      {/* Elementos individuales */}
      {isMainSelected && (
        <div className="p-3 space-y-2">
          {Object.entries(ELEMENT_CONFIG).map(([key, config]) => {
            const tokens = config.getTokens(tokenData);
            const elementId = `${artifactId}_${key}`;
            const isSelected = selectedElements.has(elementId);
            const isAvailable = tokens > 0;

            return (
              <div
                key={key}
                className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
                  isAvailable 
                    ? 'hover:bg-muted/20' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <StandardCheckbox
                    checked={isSelected}
                    onChange={() => isAvailable && onElementToggle(elementId)}
                    disabled={!isAvailable}
                    colorScheme={config.colorScheme}
                  />
                  
                  <StandardTooltip
                    trigger={
                      <div className="cursor-help flex items-center gap-1.5">
                        <span className="text-sm">{config.icon}</span>
                        <span className="text-sm text-muted-foreground">
                          {config.label}:
                        </span>
                      </div>
                    }
                    content={config.getTooltipContent(tokenData)}
                    colorScheme={config.colorScheme}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    isSelected 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}>
                    {tokens.toLocaleString('es-ES')}
                  </span>
                  {!isAvailable && (
                    <StandardBadge colorScheme="neutral" size="xs" styleType="subtle">
                      No disponible
                    </StandardBadge>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total seleccionado */}
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total seleccionado:
              </span>
              <span className="text-sm font-bold text-primary">
                {selectedTokens.toLocaleString('es-ES')} tokens
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
