"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página para la carga masiva de artículos a un proyecto.
 * Valida que el usuario tenga el permiso 'can_upload_files'.
 * Permite al usuario subir un archivo CSV, previsualizar los datos y guardarlos en lotes (chunking).
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/auth-provider';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { ColumnDef, Row } from '@tanstack/react-table';
import { StandardTable } from '@/components/ui/StandardTable';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { FileUp, Save, Trash2, Link as LinkIcon, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import Link from 'next/link';
import { uploadAndProcessArticles, ArticleFromCsv, deleteUploadedArticles, checkIfProjectHasArticles } from '@/lib/actions/article-actions';

// --- Tipos Locales ---
interface ArticleForTable {
  Title: string;
  Authors: string;
  'Publication Year': number;
  Journal: string;
  DOI: string;
  Abstract: string;
  originalCsvData: ArticleFromCsv;
  subRows?: any[]; // Requerido por StandardTable para habilitar el expansor
}

// --- Componente Principal ---
export default function CargarArticulosPage() {
  const { proyectoActual } = useAuth();

  // State for data and UI control
  const [previewArticles, setPreviewArticles] = useState<ArticleForTable[]>([]);
  const [fullArticlesPayload, setFullArticlesPayload] = useState<ArticleFromCsv[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // State for processes and loading
  const [isChecking, setIsChecking] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for UI feedback
  const [dataAlreadyExists, setDataAlreadyExists] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to check for existing articles on load
  useEffect(() => {
    if (!proyectoActual) return;
    setIsChecking(true);
    checkIfProjectHasArticles(proyectoActual.id)
      .then(result => {
        if (result.success) {
          setDataAlreadyExists(result.data.hasArticles);
        } else {
          toast.error(result.error || 'No se pudo verificar el estado de los artículos.');
        }
      })
      .catch(() => toast.error('Error de red al verificar los artículos.'))
      .finally(() => setIsChecking(false));
  }, [proyectoActual]);

  const handleSave = async () => {
    if (!proyectoActual || fullArticlesPayload.length === 0) return;

    setIsSaving(true);
    setUploadProgress(0);
    setStatusMessage("Iniciando subida...");
    setIsDialogOpen(false);

    const CHUNK_SIZE = 200;
    const totalChunks = Math.ceil(fullArticlesPayload.length / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const currentChunk = fullArticlesPayload.slice(start, end);

        const progress = ((i + 1) / totalChunks) * 100;
        setStatusMessage(`Subiendo lote ${i + 1} de ${totalChunks}... (${currentChunk.length} registros)`);
        
        const result = await uploadAndProcessArticles({
          projectId: proyectoActual.id,
          articlesData: currentChunk,
        });

        if (!result.success) {
          throw new Error(result.error || `Ocurrió un error en el lote ${i + 1}`);
        }
        
        setUploadProgress(progress);
      }

      setStatusMessage(`¡Carga completada! Se han procesado ${fullArticlesPayload.length} artículos.`);
      setUploadProgress(100);
      toast.success('¡Todos los artículos fueron guardados con éxito!');
      
      setTimeout(() => {
        setPreviewArticles([]);
        setFullArticlesPayload([]);
        setFileName(null);
        setIsSaving(false);
        setDataAlreadyExists(true);
      }, 2000);

    } catch (e: any) {
      const errorMessage = e.message || "Error inesperado durante la carga.";
      setStatusMessage(`Error: ${errorMessage}`);
      toast.error(errorMessage);
      setUploadProgress(prev => prev);
    }
  };

  const handleDelete = async () => {
    if (!proyectoActual) return;
    setIsDeleting(true);
    try {
      const result = await deleteUploadedArticles(proyectoActual.id);
      if (result.success) {
        toast.success('Los artículos existentes han sido eliminados.');
        setDataAlreadyExists(false);
        setFileName(null);
        setPreviewArticles([]);
        setFullArticlesPayload([]);
      } else {
        toast.error(result.error || 'No se pudieron eliminar los artículos.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al eliminar.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setPreviewArticles([]);
    setFullArticlesPayload([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Se encontraron errores en el CSV. Revisa el formato.');
          setIsParsing(false);
          return;
        }

        const allParsedArticles = results.data as ArticleFromCsv[];
        const articlesForTable: ArticleForTable[] = allParsedArticles.slice(0, 5).map(item => ({
          Title: String(item.Title || ''),
          Authors: String(item.Authors || ''),
          'Publication Year': Number(item['Publication Year']) || 0,
          Journal: String(item.Journal || ''),
          DOI: String(item.DOI || ''),
          Abstract: String(item.Abstract || ''),
          originalCsvData: item,
          subRows: [{}], 
        }));

        setPreviewArticles(articlesForTable);
        setFullArticlesPayload(allParsedArticles);
        setIsParsing(false);
        toast.success(`Se leyeron ${allParsedArticles.length} registros del archivo.`);
      },
      error: (error) => {
        toast.error(`Error al parsear el archivo: ${error.message}`);
        setIsParsing(false);
      },
    });
  };

  const renderSubComponent = useCallback((row: Row<ArticleForTable>) => {
    const { originalCsvData } = row.original;
    return (
      <div className="p-4 bg-neutral-bg/30 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <div className="flex flex-col">
          <StandardText as="h4" size="sm" weight="medium" className="mb-1">WOS ID</StandardText>
          <StandardText size="sm">{String(originalCsvData['UT (Unique WOS ID)'] || 'N/A')}</StandardText>
        </div>
        <div className="flex flex-col">
          <StandardText as="h4" size="sm" weight="medium" className="mb-1">eISSN</StandardText>
          <StandardText size="sm">{String(originalCsvData.eISSN || 'N/A')}</StandardText>
        </div>
        <div className="flex flex-col">
          <StandardText as="h4" size="sm" weight="medium" className="mb-1">ISSN</StandardText>
          <StandardText size="sm">{String(originalCsvData.ISSN || 'N/A')}</StandardText>
        </div>
      </div>
    );
  }, []);

  const columns = useMemo<ColumnDef<ArticleForTable>[]>(() => [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => row.getCanExpand() ? (
        <button {...{ onClick: row.getToggleExpandedHandler(), style: { cursor: 'pointer' } }} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full">
          {row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ) : null,
      meta: { isSticky: 'left' }
    },
    { accessorKey: 'Title', header: 'Título', size: 350, meta: { isTruncatable: true } },
    { accessorKey: 'Abstract', header: 'Abstract', size: 400, meta: { isTruncatable: true, tooltipType: 'longText' } },
    { accessorKey: 'Authors', header: 'Autores', size: 250, meta: { isTruncatable: true } },
    { accessorKey: 'Publication Year', header: 'Año', size: 80, meta: { align: 'center' } },
    {
      accessorKey: 'DOI',
      header: 'DOI',
      size: 150,
      meta: { isSticky: 'right' },
      cell: (info) => {
        const doi = info.row.original.DOI;
        if (!doi) return <StandardText size="sm" className="text-center">-</StandardText>;
        return (
          <StandardButton asChild styleType="outline" size="sm" className="font-mono">
            <Link
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {doi}
            </Link>
          </StandardButton>
        );
      },
    },
  ], []);

  if (isChecking) {
    return <div className="flex h-full w-full items-center justify-center"><SustratoLoadingLogo text="Verificando datos del proyecto..." /></div>;
  }

  if (dataAlreadyExists) {
    return (
      <StandardCard>
        <StandardCard.Header>
          <StandardCard.Title>Artículos Existentes</StandardCard.Title>
          <StandardCard.Subtitle>Este proyecto ya contiene datos de artículos. Para cargar un nuevo archivo, primero debes eliminar los existentes.</StandardCard.Subtitle>
        </StandardCard.Header>
        <StandardCard.Content><StandardText>Esta acción es irreversible.</StandardText></StandardCard.Content>
        <StandardCard.Footer className="flex justify-end">
          <StandardDialog>
            <StandardDialog.Trigger asChild><StandardButton colorScheme="danger" styleType="outline" loading={isDeleting}><Trash2 className="mr-2 h-4 w-4" />Eliminar Artículos</StandardButton></StandardDialog.Trigger>
            <StandardDialog.Content>
              <StandardDialog.Header><StandardDialog.Title>Confirmar Eliminación</StandardDialog.Title><StandardDialog.Description>¿Estás seguro? Esta acción no se puede deshacer.</StandardDialog.Description></StandardDialog.Header>
              <StandardDialog.Footer>
                <StandardDialog.Close asChild><StandardButton styleType="outline">Cancelar</StandardButton></StandardDialog.Close>
                <StandardButton colorScheme="danger" onClick={handleDelete} loading={isDeleting}>Confirmar</StandardButton>
              </StandardDialog.Footer>
            </StandardDialog.Content>
          </StandardDialog>
        </StandardCard.Footer>
      </StandardCard>
    );
  }

  return (
    <div className="relative space-y-6">
      {isSaving && (
        <div className="absolute inset-0 bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700">
            <StandardProgressBar value={uploadProgress} label={statusMessage} showValue={true} size="lg" colorScheme="primary" animated={true} />
            <StandardText as="p" size="sm" className="text-center mt-3 text-neutral-600 dark:text-neutral-400">
              Por favor, no cierres esta ventana hasta que el proceso finalice.
            </StandardText>
          </div>
        </div>
      )}

      <StandardCard>
        <StandardCard.Header>
          <StandardCard.Title>Carga Masiva de Artículos desde CSV</StandardCard.Title>
          <StandardCard.Subtitle>Selecciona un archivo para iniciar la carga. El sistema procesará los datos en lotes para mayor estabilidad.</StandardCard.Subtitle>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="flex items-center space-x-4">
            <StandardButton asChild styleType="outline" disabled={isParsing || isSaving}>
              <label htmlFor="csv-upload"><FileUp className="mr-2 h-4 w-4" />Seleccionar Archivo</label>
            </StandardButton>
            <input ref={fileInputRef} id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={isParsing || isSaving} />
            {fileName && <StandardText size="sm" className="flex items-center gap-2"><FileText size={16}/> {fileName}</StandardText>}
            {isParsing && <SustratoLoadingLogo showText={false} size={24} />}
          </div>
        </StandardCard.Content>
      </StandardCard>

      {previewArticles.length > 0 && (
        <StandardCard>
          <StandardCard.Header>
            <StandardCard.Title>Previsualización de Datos</StandardCard.Title>
            <StandardCard.Subtitle>Se han leído {fullArticlesPayload.length} registros. Se muestran los primeros 5 para revisión.</StandardCard.Subtitle>
          </StandardCard.Header>
          <StandardCard.Content className="p-0">
            <StandardTable columns={columns} data={previewArticles} renderSubComponent={renderSubComponent} enableTruncation={true} filterPlaceholder="Buscar en previsualización..." isStickyHeader={true} stickyOffset={64}>
              <StandardTable.Table />
            </StandardTable>
          </StandardCard.Content>
          <StandardCard.Footer className="flex justify-end">
            <StandardDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <StandardDialog.Trigger asChild>
                <StandardButton disabled={isSaving || isParsing}><Save className="mr-2 h-4 w-4" />Guardar {fullArticlesPayload.length} Artículos</StandardButton>
              </StandardDialog.Trigger>
              <StandardDialog.Content>
                <StandardDialog.Header>
                  <StandardDialog.Title>Confirmar Carga Masiva</StandardDialog.Title>
                  <StandardDialog.Description>Estás a punto de guardar {fullArticlesPayload.length} artículos. El proceso se ejecutará en segundo plano. ¿Deseas continuar?</StandardDialog.Description>
                </StandardDialog.Header>
                <StandardDialog.Footer>
                  <StandardDialog.Close asChild><StandardButton styleType="outline">Cancelar</StandardButton></StandardDialog.Close>
                  <StandardButton onClick={handleSave}>Confirmar y Cargar</StandardButton>
                </StandardDialog.Footer>
              </StandardDialog.Content>
            </StandardDialog>
          </StandardCard.Footer>
        </StandardCard>
      )}
    </div>
  );
}
