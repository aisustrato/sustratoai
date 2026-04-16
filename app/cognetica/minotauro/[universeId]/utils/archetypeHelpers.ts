import type { ArchetypeTone } from '@/lib/types/minotauro-types';

export function getArchetypeEmoji(archetype: ArchetypeTone): string {
  const emojis: Record<ArchetypeTone, string> = {
    deslixador: '🛠️',
    polinizador: '🌸',
    dedalo: '🏛️',
    bufon: '🃏',
    cronos: '⏳',
    colega: '☕',
  };
  return emojis[archetype];
}

export function getArchetypeName(archetype: ArchetypeTone): string {
  const names: Record<ArchetypeTone, string> = {
    deslixador: 'Deslixador',
    polinizador: 'Polinizador',
    dedalo: 'Dédalo',
    bufon: 'Bufón',
    cronos: 'Cronos',
    colega: 'Colega',
  };
  return names[archetype];
}

export function getArchetypeColorScheme(archetype: ArchetypeTone): string {
  const colors: Record<ArchetypeTone, string> = {
    deslixador: 'neutral',
    polinizador: 'success',
    dedalo: 'primary',
    bufon: 'warning',
    cronos: 'tertiary',
    colega: 'accent',
  };
  return colors[archetype];
}
