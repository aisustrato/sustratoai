import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardText } from '@/components/ui/StandardText';
import { ClassificationReview } from '@/lib/types/preclassification-types';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { StandardTooltip } from '@/components/ui/StandardTooltip';
import * as LucideIcons from 'lucide-react';

interface DimensionDisplayProps {
  dimensionName: string;
  review: ClassificationReview | undefined;
  dimensionIcon?: string | null;
  // Mapa valor(opción) -> emoticon
  optionEmoticons?: Record<string, string | null>;
  // Variante de presentación: default (con borde superior) o card (sin borde)
  variant?: 'default' | 'card';
}

const confidenceMap: Record<number, { color: 'success' | 'warning' | 'danger'; label: string }> = {
  3: { color: 'success', label: 'Alta' },
  2: { color: 'warning', label: 'Media' },
  1: { color: 'danger', label: 'Baja' },
};

export const DimensionDisplay: React.FC<DimensionDisplayProps> = ({ dimensionName, review, dimensionIcon, optionEmoticons, variant = 'default' }) => {
  const confidenceInfo = review?.confidence ? confidenceMap[review.confidence] : null;
  // Resolver emoticon de forma robusta ante diferencias menores de formato
  const resolveEmoticon = (
    value: string | number | null | undefined,
    map?: Record<string, string | null>
  ): string | null => {
    if (!value || !map) return null;
    const raw = String(value);
    const direct = map[raw];
    if (direct) return direct;
    const normalized = raw.trim().replace(/\s+/g, ' ');
    if (map[normalized]) return map[normalized] as string;
    const lower = normalized.toLowerCase();
    if (map[lower]) return map[lower] as string;
    const noAccents = normalized.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (map[noAccents]) return map[noAccents] as string;
    // Intento final: búsqueda por clave insensible a mayúsculas/minúsculas y espacios múltiples
    const entry = Object.entries(map).find(([k]) => k.trim().replace(/\s+/g, ' ').toLowerCase() === lower);
    return entry ? entry[1] || null : null;
  };

  const emoticon = resolveEmoticon(review?.value, optionEmoticons);
  if (!emoticon && optionEmoticons && review?.value) {
    // Log diagnóstico: solo cuando falta emoji pese a existir mapa
    try {
      const keys = Object.keys(optionEmoticons);
      // Evitar spam: construir una clave única por dimensión y valor
      const debugKey = `emoji-miss:${dimensionName}:${String(review.value)}`;
      type EmojiDebugWindow = { __emojiDebugs?: Set<string> } & typeof window;
      const w = (window as unknown) as EmojiDebugWindow;
      if (!w.__emojiDebugs) w.__emojiDebugs = new Set<string>();
      const seen = w.__emojiDebugs;
      if (!seen.has(debugKey)) {
        console.warn('[DimensionDisplay] Emoji no resuelto', {
          dimensionName,
          reviewValue: String(review.value),
          optionKeys: keys,
        });
        seen.add(debugKey);
      }
    } catch {}
  }
  // Resolver componente de icono de lucide a partir del string recibido (cast via unknown para tipado seguro)
  const LucideRegistry = LucideIcons as unknown as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;
  const IconComponent = dimensionIcon ? LucideRegistry[dimensionIcon] : undefined;

  return (
    <div className={variant === 'card' ? 'p-2' : 'mt-2 p-2 border-t border-gray-200 dark:border-gray-700'}>
      <div className="flex items-center gap-2 mb-1">
        {IconComponent ? (
          <StandardIcon size="xl" colorScheme="tertiary" styleType="outlineGradient">
            <IconComponent />
          </StandardIcon>
        ) : null}
        <StandardText size="sm" weight="semibold">{dimensionName}</StandardText>
      </div>
      <div className="flex items-center gap-2 mb-1">
        {review && review.value ? (
          confidenceInfo ? (
            <div className="flex items-center gap-2">
              {emoticon ? (
                <div className="w-6 min-w-[1.25rem] flex items-center justify-center shrink-0" aria-hidden>
                  <span className="text-2xl leading-none">{emoticon}</span>
                </div>
              ) : null}
              <StandardBadge colorScheme={confidenceInfo.color} size="sm">
                {review.value}
              </StandardBadge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {emoticon ? (
                <div className="w-6 min-w-[1.25rem] flex items-center justify-center shrink-0" aria-hidden>
                  <span className="text-2xl leading-none">{emoticon}</span>
                </div>
              ) : null}
              <StandardText size="xs">{review.value}</StandardText>
            </div>
          )
        ) : (
          <StandardText size="xs" className="italic text-gray-400">Sin revisión aún</StandardText>
        )}
      </div>
      {review?.rationale && (
        <StandardTooltip 
          content={review.rationale}
          trigger={
            <div>
              <StandardText size="xs" className="italic text-gray-500 line-clamp-3">
                {review.rationale}
              </StandardText>
            </div>
          }
          colorScheme="neutral"
          styleType="subtle"
          isLongText
        />
      )}
    </div>
  );
};
