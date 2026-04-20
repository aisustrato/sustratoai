export interface TextMetrics {
  words: number;
  characters: number;
  estimatedPages: number;
}

export function calculateTextMetrics(text: string): TextMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const estimatedPages = words / 250;
  
  return { words, characters, estimatedPages };
}

export function calculateTotalMetrics(
  contents: Record<string, { content: string }>
): TextMetrics {
  return Object.values(contents).reduce((acc, item) => {
    const metrics = calculateTextMetrics(item.content || '');
    return {
      words: acc.words + metrics.words,
      characters: acc.characters + metrics.characters,
      estimatedPages: acc.estimatedPages + metrics.estimatedPages,
    };
  }, { words: 0, characters: 0, estimatedPages: 0 });
}
