export type PaperStandard = 'zenodo' | 'nature' | 'apa' | 'libre';

export interface StandardConfig {
  wordsPerSection: number;
  totalPages: number;
  tono: string;
}

export const PAPER_STANDARDS: Record<PaperStandard, StandardConfig> = {
  zenodo: { wordsPerSection: 400, totalPages: 10, tono: 'Formal-técnico' },
  nature: { wordsPerSection: 600, totalPages: 12, tono: 'Científico formal' },
  apa: { wordsPerSection: 500, totalPages: 10, tono: 'Académico neutro' },
  libre: { wordsPerSection: 9999, totalPages: 999, tono: 'Según humano' },
};
