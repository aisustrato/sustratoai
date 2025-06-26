//. 📍 app/datos-maestros/cargar-articulos/components/ArticleUploaderPage.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardWrapper } from '@/components/ui/StandardWrapper';
import { StandardTable } from '@/components/ui/StandardTable';
import { StandardPagination } from '@/components/ui/StandardPagination';
import { type ColumnDef } from '@tanstack/react-table';
import type { ResultadoOperacion } from '@/lib/actions/batch-actions';
import { StandardCard } from '@/components/ui/StandardCard';
import { UploadCloud } from 'lucide-react';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import Papa from 'papaparse';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardAlert } from '@/components/ui/StandardAlert';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardText } from '@/components/ui/StandardText';

// --- 1. Definición de Datos y Columnas ---

type Article = {
  'Publication Type': string;
  'Authors': string;
  'Author Full Names': string;
  'Title': string;
  'Jurnal': string;
  'Abstract': string;
  'ORCIDs': string;
  'ISSN': string;
  'eISSN': string;
  'ISBN': string;
  'Publication Date': string;
  'Publication_Year': string;
  'Volume': string;
  'Issue': string;
  'Special Issue': string;
  'Start Page': string;
  'End Page': string;
  'Article Number': string;
  'DOI': string;
  'DOI Link': string;
  'UT (Unique WOS ID)': string;
};

const columns: ColumnDef<Article>[] = [
  { accessorKey: 'Title', header: 'Título', size: 300 },
  { accessorKey: 'Authors', header: 'Autores', size: 200 },
  {
    accessorKey: 'Abstract',
    header: 'Abstract',
    size: 350,
    meta: {
      truncateLines: 2,
      tooltipType: 'longText',
    },
  },
  { accessorKey: 'Jurnal', header: 'Journal', size: 150 },
  { accessorKey: 'Publication_Year', header: 'Año', size: 60 },
  { accessorKey: 'DOI', header: 'DOI', size: 150 },
  { accessorKey: 'Publication Type', header: 'Tipo', size: 100 },
  { accessorKey: 'Volume', header: 'Vol.', size: 60 },
  { accessorKey: 'Issue', header: 'Ed.', size: 60 },
  { accessorKey: 'Start Page', header: 'Pág. Inicio', size: 80 },
  { accessorKey: 'End Page', header: 'Pág. Fin', size: 80 },
  { accessorKey: 'UT (Unique WOS ID)', header: 'WOS ID', size: 120 },
];

// --- 2. Componente de la Página ---

interface ArticleUploaderPageProps {
  projectName: string;
  onSave: (articles: Article[]) => Promise<ResultadoOperacion<any>>;
}

// --- 2. Componente de la Página ---

export default function ArticleUploaderPage({ projectName, onSave }: ArticleUploaderPageProps) {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileParse = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setAllArticles([]);
    setCurrentPage(1);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        const rawData = results.data as any[];
        if (rawData.length === 0) {
          setError('El archivo CSV está vacío o no se pudo leer correctamente.');
          setLoading(false);
          return;
        }

        const articles = rawData.map(row => ({
          'Publication Type': row['Publication Type'] || '',
          'Authors': row['Authors'] || '',
          'Author Full Names': row['Author Full Names'] || '',
          'Title': row['Title'] || '',
          'Jurnal': row['Jurnal'] || '',
          'Abstract': row['Abstract'] || '',
          'ORCIDs': row['ORCIDs'] || '',
          'ISSN': row['ISSN'] || '',
          'eISSN': row['eISSN'] || '',
          'ISBN': row['ISBN'] || '',
          'Publication Date': row['Publication Date'] || '',
          'Publication_Year': row['Publication_Year'] || '',
          'Volume': row['Volume'] || '',
          'Issue': row['Issue'] || '',
          'Special Issue': row['Special Issue'] || '',
          'Start Page': row['Start Page'] || '',
          'End Page': row['End Page'] || '',
          'Article Number': row['Article Number'] || '',
          'DOI': row['DOI'] || '',
          'DOI Link': row['DOI Link'] || '',
          'UT (Unique WOS ID)': row['UT (Unique WOS ID)'] || '',
        })).filter(a => a.Title);

        if (articles.length === 0) {
          setError('El archivo no parece tener el formato CSV esperado. Asegúrate de que las columnas ("Title", "Authors", etc.) y el delimitador (;) son correctos.');
        } else {
          setAllArticles(articles);
        }
        setLoading(false);
      },
      error: (err) => {
        setError(`Error al procesar el archivo CSV: ${err.message}`);
        setLoading(false);
      },
    });
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const totalPages = Math.ceil(allArticles.length / ITEMS_PER_PAGE);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return allArticles.slice(start, end);
  }, [currentPage, allArticles]);

    const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await onSave(allArticles);
      if (!result.success) {
        throw new Error(result.error || 'Ocurrió un error desconocido al guardar.');
      }
      // Si el guardado es exitoso, el orquestador manejará la redirección o actualización.
      // Aquí cerramos el diálogo.
      setIsConfirming(false);
    } catch (e) {
      const error = e as Error;
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <StandardWrapper>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileParse}
        className="hidden"
        accept=".csv"
      />


      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <SustratoLoadingLogo text="Procesando archivo..." />
        </div>
      )}

      {error && (
        <StandardAlert
          message={error}
          colorScheme="danger"
          className="mt-8"
          onClose={() => setError(null)}
        />
      )}

      {!loading && !error && allArticles.length === 0 && (
        <StandardCard className="mt-8 text-center py-12">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay artículos para mostrar</h3>
          <p className="mt-1 text-sm text-gray-500">Comience por seleccionar un archivo CSV.</p>
          <div className="mt-6">
            <StandardButton onClick={handleSelectFileClick} type="button">
              Seleccionar Archivo
            </StandardButton>
          </div>
        </StandardCard>
      )}

      {!loading && allArticles.length > 0 && (
        <>
          <StandardAlert
            title="Previsualización de Datos"
            colorScheme="primary"
            className="mt-8"
            message={`Se han encontrado ${allArticles.length} registros en el archivo CSV. Revisa la previsualización a continuación. Si todo es correcto, presiona 'Guardar Artículos' para confirmar la carga en la base de datos.`}
          />
          <StandardCard className="mt-8 p-0 overflow-hidden">
            <StandardTable data={currentPageData} columns={columns}>
              <StandardTable.Table />
            </StandardTable>
          </StandardCard>

          <StandardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={allArticles.length}
            itemsPerPage={ITEMS_PER_PAGE}
            className="mt-4"
          />

          <div className="mt-8 flex justify-end">
            <StandardButton
              onClick={() => setIsConfirming(true)}
              disabled={isSaving}
            >
              Guardar Artículos
            </StandardButton>
          </div>
        </>
      )}

      <StandardDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <StandardDialog.Content colorScheme="primary">
          <StandardDialog.Header>
            <StandardDialog.Title>Confirmar Carga de Artículos</StandardDialog.Title>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <StandardDialog.Description>
              Estás a punto de guardar <strong>{allArticles.length}</strong> artículos en el proyecto <strong>"{projectName}"</strong>. Esta acción no se puede deshacer.
            </StandardDialog.Description>
            {error && (
               <StandardAlert
                 message={error}
                 colorScheme="danger"
                 className="mt-4"
                 onClose={() => setError(null)}
               />
            )}
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardDialog.Close asChild>
              <StandardButton styleType="outline" colorScheme="neutral" disabled={isSaving}>Cancelar</StandardButton>
            </StandardDialog.Close>
            <StandardButton onClick={handleConfirmSave} loading={isSaving} disabled={isSaving}>
              Confirmar Carga
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </StandardWrapper>
  );
}
