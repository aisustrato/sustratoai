'use client';

import { useState } from 'react';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardSelect } from '@/components/ui/StandardSelect';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardAlert } from '@/components/ui/StandardAlert';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardWrapper } from '@/components/ui/StandardWrapper';
import { StandardText } from '@/components/ui/StandardText';
import { StandardFormField } from '@/components/ui/StandardFormField';

const GeminiShowroomPage = () => {

  const [model, setModel] = useState('gemini-2.5-pro');
  const [inputText, setInputText] = useState(
    'The proliferation of large language models (LLMs) has catalyzed a paradigm shift in natural language processing. This paper introduces a novel architecture, the "Cognitive-Resonance Transformer" (CRT), which integrates a simulated associative memory module to enhance contextual understanding and mitigate catastrophic forgetting. We evaluate CRT on a suite of downstream tasks, including abstractive summarization and machine translation, demonstrating a statistically significant improvement over baseline Transformer models. Our results suggest that emulating cognitive mechanisms can be a fruitful avenue for developing more robust and versatile AI systems.'
  );
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelOptions = [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ];

  const handleSubmit = async (action: 'translate' | 'summarize') => {

    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, text: inputText, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error en el servidor.');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StandardWrapper>
      <StandardPageTitle title="Gemini API Showroom" subtitle="Prueba de traducción y resumen" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-1">
          <StandardCard className="p-6">
            <div className="space-y-6">
              <StandardFormField label="Modelo de Gemini" htmlFor="gemini-model">
                <StandardSelect
                  id="gemini-model"
                  options={modelOptions}
                  value={model}
                  onChange={(newValue) => setModel(newValue as string)}
                />
              </StandardFormField>
            </div>
          </StandardCard>
        </div>

        <div className="md:col-span-2">
          <StandardCard className="p-6">
            <div className="space-y-6">
              <StandardFormField label="Texto de Entrada (Abstract)" htmlFor="gemini-input-text">
                <StandardTextarea
                  id="gemini-input-text"
                  value={inputText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                  rows={10}
                />
              </StandardFormField>
              <div className="flex items-center justify-end space-x-4">
                <StandardButton
                  onClick={() => handleSubmit('translate')}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Traducir a Inglés
                </StandardButton>
                <StandardButton
                  onClick={() => handleSubmit('summarize')}
                  loading={isLoading}
                  disabled={isLoading}
                  colorScheme="secondary"
                >
                  Resumir en Español
                </StandardButton>
              </div>
              {error && <StandardAlert title="Error" message={error} colorScheme="danger" />}
              {isLoading && <StandardText className="text-center">Procesando...</StandardText>}
              {result && (
                <StandardFormField label="Resultado" htmlFor="gemini-result-text">
                  <StandardTextarea
                    id="gemini-result-text"
                    value={result}
                    readOnly
                    rows={10}
                    className="mt-4 bg-gray-50 dark:bg-gray-800"
                  />
                </StandardFormField>
              )}
            </div>
          </StandardCard>
        </div>
      </div>
    </StandardWrapper>
  );
};

export default GeminiShowroomPage;
