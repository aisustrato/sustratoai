"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página para la carga masiva de artículos a un proyecto.
 * Valida que el usuario tenga el permiso 'can_upload_files'.
 * Permite al usuario subir un archivo CSV, previsualizar los datos y guardarlos en lotes (chunking).
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/auth-provider';
import { parse as papaParse } from 'papaparse';
import { toast } from 'sonner';
import { ColumnDef, Row } from '@tanstack/react-table';
import { StandardTable } from '@/components/ui/StandardTable';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { FileUp, Save, Trash2, Link as LinkIcon, FileText, FileCheck } from 'lucide-react';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
// Link no se está utilizando actualmente
// import Link from 'next/link';
import { uploadAndProcessArticles, ArticleFromCsv, deleteUploadedArticles, checkIfProjectHasArticles } from '@/lib/actions/article-actions';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardRadioGroup } from '@/components/ui/StandardRadioGroup';

// --- Tipos Locales ---
interface ArticleForTable {
    Title: string;
    Authors: string;
    'Publication Year': number;
    Journal: string;
    DOI: string;
    Abstract: string;
    originalCsvData: ArticleFromCsv;
    // ✅ CAMBIO 1: El tipo ahora refleja explícitamente la posibilidad de nuestra bandera.
    subRows?: { __isGhost?: boolean }[];
}

// --- Componente Principal ---
export default function CargarArticulosPage() {
    const { proyectoActual } = useAuth();

    // State for data and UI control
    const [previewArticles, setPreviewArticles] = useState<ArticleForTable[]>([]);
    const [fullArticlesPayload, setFullArticlesPayload] = useState<ArticleFromCsv[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [showUploadCard, setShowUploadCard] = useState<boolean>(true);
    const [delimiter, setDelimiter] = useState<',' | ';'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('csvDelimiter') as ',' | ';') || ',';
        }
        return ',';
    });

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

    const handleChangeFileClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    }, []);

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

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Error inesperado durante la carga.";
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
        } catch {
            // No necesitamos usar la variable de error aquí, pero capturamos para el toast.
            toast.error('Ocurrió un error inesperado al eliminar.');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('csvDelimiter', delimiter);
        }
    }, [delimiter]);

    const parseCsvFile = useCallback((file: File, delimiter: ',' | ';') => {
        setFileName(file.name);
        setIsParsing(true);
        setPreviewArticles([]);
        setFullArticlesPayload([]);
        setShowUploadCard(false);

        const reader = new FileReader();

        reader.onload = (e) => {
            const csvText = e.target?.result as string;

            papaParse<ArticleFromCsv>(csvText, {
                delimiter,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        toast.error('Se encontraron errores en el CSV. Revisa el formato.');
                        setIsParsing(false);
                        return;
                    }

                    const allParsedArticles = results.data;
                    const articlesForTable: ArticleForTable[] = allParsedArticles.slice(0, 5).map(item => {
                        const hasRealAdditionalMetadata =
                            (item['UT (Unique WOS ID)'] && String(item['UT (Unique WOS ID)']).trim() !== '') ||
                            (item.eISSN && String(item.eISSN).trim() !== '') ||
                            (item.ISSN && String(item.ISSN).trim() !== '');

                        const baseArticle: ArticleForTable = {
                            Title: String(item.Title || ''),
                            Authors: String(item.Authors || ''),
                            'Publication Year': Number(item['Publication Year']) || 0,
                            Journal: String(item.Journal || ''),
                            DOI: String(item.DOI || ''),
                            Abstract: String(item.Abstract || ''),
                            originalCsvData: item,
                        };

                        if (hasRealAdditionalMetadata) {
                            // ✅ CAMBIO 2: Reemplazamos el objeto vacío por nuestra bandera.
                            baseArticle.subRows = [{ __isGhost: true }];
                        }

                        return baseArticle;
                    });

                    setPreviewArticles(articlesForTable);
                    setFullArticlesPayload(allParsedArticles);
                    setIsParsing(false);
                    toast.success(`Se leyeron ${allParsedArticles.length} registros del archivo.`);
                },
                error: (error: Error) => {
                    toast.error(`Error al parsear el archivo: ${error.message}`);
                    setIsParsing(false);
                },
            });
        };

        reader.onerror = () => {
            toast.error('Error al leer el archivo');
            setIsParsing(false);
        };

        reader.readAsText(file);
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        parseCsvFile(file, delimiter);
    }, [delimiter, parseCsvFile]);


    const renderSubComponent = (row: Row<ArticleForTable>) => {
        const { originalCsvData } = row.original;
        const wosId = String(originalCsvData['UT (Unique WOS ID)'] || '').trim();
        const eissn = String(originalCsvData.eISSN || '').trim();
        const issn = String(originalCsvData.ISSN || '').trim();
        const hasAnyMetadata = wosId || eissn || issn;

        if (!hasAnyMetadata) {
            return (
                <div className="p-4 bg-neutral-bg/30">
                    <StandardText size="sm" color="neutral">No hay metadatos adicionales para este registro.</StandardText>
                </div>
            );
        }

        return (
            <div className="p-4 bg-neutral-bg/30 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 max-w-full overflow-x-auto">
                {wosId && (
                    <div className="flex flex-col">
                        <StandardText as="h4" size="sm" weight="medium" className="mb-1">WOS ID</StandardText>
                        <StandardText size="sm">{wosId}</StandardText>
                    </div>
                )}
                {eissn && (
                    <div className="flex flex-col">
                        <StandardText as="h4" size="sm" weight="medium" className="mb-1">eISSN</StandardText>
                        <StandardText size="sm">{eissn}</StandardText>
                    </div>
                )}
                {issn && (
                    <div className="flex flex-col">
                        <StandardText as="h4" size="sm" weight="medium" className="mb-1">ISSN</StandardText>
                        <StandardText size="sm">{issn}</StandardText>
                    </div>
                )}
            </div>
        );
    };

    const columns = useMemo<ColumnDef<ArticleForTable>[]>(() => [
        { id: 'expander', header: () => null, cell: ({ row }) => row.getCanExpand() ? '' : null, meta: { isSticky: 'left' }, size: 40, enableHiding: false },
        { accessorKey: 'Title', header: 'Título', size: 250, meta: { isTruncatable: true } },
        { accessorKey: 'Abstract', header: 'Abstract', size: 300, meta: { isTruncatable: true, tooltipType: 'longText' } },
        { accessorKey: 'Authors', header: 'Autores', size: 150, meta: { isTruncatable: true } },
        { accessorKey: 'Publication Year', header: 'Año', size: 80, meta: { align: 'center' } },
        {
            accessorKey: 'DOI',
            header: 'DOI',
            size: 50,
            meta: { isSticky: 'right' },
            cell: (info) => {
                const doi = info.row.original.DOI;
                if (!doi) return <StandardText size="sm" className="text-center">-</StandardText>;
                return (
                    <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full h-full" >
                        <StandardButton styleType="link" size="sm" iconOnly={true} leftIcon={LinkIcon} />
                    </a>
                );
            },
        },
    ], []);

    if (isChecking) {
        return <div className="flex h-full w-full items-center justify-center"><SustratoLoadingLogo text="Verificando datos del proyecto..." /></div>;
    }

    if (dataAlreadyExists) {
        return (
            <div className="max-w-3xl mx-auto">
                <StandardPageTitle
                    title="Ya existen artículos cargados"
                    subtitle="Ya se han cargado artículos previamente en este proyecto. "
                    mainIcon={FileCheck}
                    breadcrumbs={[ { label: "Datos Maestros", href: "/datos-maestros" }, { label: "Cargar Artículos", href: "/datos-maestros/cargar-articulos" } ]}
                    showBackButton={{ href: "/datos-maestros" }}
                />
                <StandardCard accentPlacement="top">
                    <StandardCard.Header>
                        <div className="flex items-center justify-between">
                            <StandardCard.Title className="flex items-center gap-2">
                                <StandardIcon colorScheme="danger" size="md"> <Trash2 /> </StandardIcon>
                                Artículos Existentes
                            </StandardCard.Title>
                            <StandardBadge colorScheme="warning" styleType="subtle" size="md">
                                Acción Requerida
                            </StandardBadge>
                        </div>
                        <StandardCard.Subtitle>
                            <StandardText size="sm" colorScheme="secondary">
                                Este proyecto ya contiene datos de artículos. Para cargar un nuevo archivo, primero debes eliminar los existentes.
                            </StandardText>
                        </StandardCard.Subtitle>
                    </StandardCard.Header>
                    <StandardCard.Content>
                        <div className="mb-4">
                            <StandardText>
                                Esta acción eliminará permanentemente todos los artículos asociados a este proyecto.
                                Asegúrate de haber respaldado cualquier información importante antes de continuar.
                            </StandardText>
                        </div>
                    </StandardCard.Content>
                    <StandardCard.Actions className="justify-end">
                        <StandardDialog>
                            <StandardDialog.Trigger>
                                <StandardButton colorScheme="danger" styleType="outline" loading={isDeleting} leftIcon={Trash2} >
                                    Eliminar Artículos
                                </StandardButton>
                            </StandardDialog.Trigger>
                            <StandardDialog.Content>
                                <StandardDialog.Header>
                                    <StandardDialog.Title>Confirmar Eliminación</StandardDialog.Title>
                                    <StandardDialog.Description>
                                        ¿Estás seguro que deseas eliminar todos los artículos de este proyecto? Esta acción no se puede deshacer.
                                    </StandardDialog.Description>
                                </StandardDialog.Header>
                                <StandardDialog.Footer>
                                    <StandardDialog.Close asChild>
                                        <StandardButton styleType="outline"> Cancelar </StandardButton>
                                    </StandardDialog.Close>
                                    <StandardButton colorScheme="danger" onClick={handleDelete} loading={isDeleting} leftIcon={Trash2} >
                                        Confirmar Eliminación
                                    </StandardButton>
                                </StandardDialog.Footer>
                            </StandardDialog.Content>
                        </StandardDialog>
                    </StandardCard.Actions>
                </StandardCard>
            </div>
        );
    }

    return (
        <div className="relative space-y-6 max-w-[95vw] mx-auto">
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
            <div className="container mx-auto py-8">
                <StandardPageTitle
                    title="Cargar Artículos"
                    subtitle="Sube un archivo CSV con los datos de los artículos a precalasificar. "
                    mainIcon={FileUp}
                    breadcrumbs={[ { label: "Datos Maestros", href: "/datos-maestros" }, { label: "Cargar Artículos", href: "/datos-maestros/cargar-articulos" } ]}
                    showBackButton={{ href: "/datos-maestros" }}
                />
                {showUploadCard && (
                    <StandardCard accentPlacement="top">
                        <StandardCard.Content>
                            <div className="flex flex-col items-center justify-center space-y-6 py-8">
                                <div className="flex flex-col items-center space-y-4 w-full max-w-md">
                                    <div className="relative">
                                        <StandardButton onClick={() => fileInputRef.current?.click()} size="lg" disabled={isParsing || isSaving} leftIcon={FileUp} className="px-8 py-6 text-base" >
                                            Seleccionar Archivo
                                        </StandardButton>
                                        <input ref={fileInputRef} id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={isParsing || isSaving} />
                                        {isParsing && (
                                            <div className="absolute -right-10 top-1/2 -translate-y-1/2">
                                                <SustratoLoadingLogo showText={false} size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <StandardCard colorScheme="neutral" className="w-full">
                                        <StandardCard.Header> <StandardCard.Title>Configuración del archivo</StandardCard.Title> </StandardCard.Header>
                                        <StandardCard.Content>
                                            <div>
                                                <StandardRadioGroup
                                                    name="csv-delimiter"
                                                    label="Separador de columnas"
                                                    options={[ { value: ',', label: 'Coma (,) - Estándar' }, { value: ';', label: 'Punto y coma (;)' } ]}
                                                    value={delimiter}
                                                    onChange={(value: string) => setDelimiter(value as ',' | ';')}
                                                    orientation="horizontal"
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <StandardText size="md" weight="medium" colorScheme="secondary" className="mb-2 block">
                                                    Columnas requeridas en el archivo CSV:
                                                </StandardText>
                                                <div className="text-xs space-y-2 mt-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Publication Type</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Authors</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Author Full Names</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Title</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Journal</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Abstract</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">ORCIDs</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">ISSN</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">eISSN</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">ISBN</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Publication Date</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Publication Year</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Volume</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Issue</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Special Issue</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Start Page</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">End Page</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Article Number</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">DOI</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">DOI Link</span></div>
                                                        <div><span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">UT (Unique WOS ID)</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                                <StandardText size="xs" weight="medium" className="mb-2 block">
                                                    Ejemplo de formato ({delimiter === ',' ? 'separado por comas' : 'separado por punto y coma'}):
                                                </StandardText>
                                                <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded overflow-x-auto">
                                                    {`Publication Type${delimiter}Authors${delimiter}Author Full Names${delimiter}Title${delimiter}Journal${delimiter}Abstract${delimiter}ORCIDs${delimiter}ISSN${delimiter}eISSN${delimiter}ISBN${delimiter}Publication Date${delimiter}Publication Year${delimiter}Volume${delimiter}Issue${delimiter}Special Issue${delimiter}Start Page${delimiter}End Page${delimiter}Article Number${delimiter}DOI${delimiter}DOI Link${delimiter}UT (Unique WOS ID)
"Article"${delimiter}"Smith, J.; Johnson, M."${delimiter}"John Smith; Mary Johnson"${delimiter}"Título del artículo de investigación"${delimiter}"Journal of Scientific Studies"${delimiter}"Este es el resumen del artículo..."${delimiter}"0000-0000-0000-0000; 0000-0000-0000-0001"${delimiter}"1234-5678"${delimiter}"9876-5432"${delimiter}"978-3-16-148410-0"${delimiter}"2023-01-15"${delimiter}2023${delimiter}12${delimiter}3${delimiter}"Special Issue on Research"${delimiter}1${delimiter}15${delimiter}"art12345"${delimiter}"10.1234/example.2023.12345"${delimiter}"https://doi.org/10.1234/example.2023.12345"${delimiter}"WOS:000000000000001"`}
                                                </pre>
                                            </div>
                                        </StandardCard.Content>
                                    </StandardCard>
                                </div>
                            </div>
                        </StandardCard.Content>
                    </StandardCard>
                )}

                {previewArticles.length > 0 && (
                    <StandardCard >
                        <StandardCard.Header>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <StandardIcon colorScheme="primary" size="md">
                                        <FileText />
                                    </StandardIcon>
                                    <div>
                                        <StandardCard.Title>Previsualización de Datos</StandardCard.Title>
                                        <StandardCard.Subtitle>
                                            <div className="flex items-center gap-1">
                                                <StandardText size="sm">Archivo: </StandardText>
                                                <StandardText size="sd" colorScheme="secondary" weight="bold">
                                                    {fileName}
                                                </StandardText>
                                                <StandardText size="sm"> • {fullArticlesPayload.length} registros cargados</StandardText>
                                            </div>
                                        </StandardCard.Subtitle>
                                    </div>
                                </div>
                                <div>
                                    <StandardButton onClick={handleChangeFileClick} styleType="outline" size="sm" leftIcon={FileUp} className="mt-2 sm:mt-0" >
                                        Cambiar Archivo
                                    </StandardButton>
                                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={isParsing || isSaving} />
                                </div>
                            </div>
                        </StandardCard.Header>

                        <StandardCard.Content >
                            <div className="min-w-max w-full">
                                <StandardTable
                                    columns={columns}
                                    data={previewArticles}
                                    renderSubComponent={renderSubComponent}
                                    enableTruncation={true}
                                    filterPlaceholder="Buscar en previsualización..."
                                    isStickyHeader={false}
                                    stickyOffset={64}
                                >
                                    <StandardTable.Table />
                                </StandardTable>
                            </div>
                        </StandardCard.Content>

                        <StandardCard.Actions className="justify-end border-t border-neutral-200 dark:border-neutral-800">
                            <StandardDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <StandardDialog.Trigger asChild>
                                    <StandardButton disabled={isSaving || isParsing} leftIcon={Save} >
                                        Guardar {fullArticlesPayload.length} Artículos
                                    </StandardButton>
                                </StandardDialog.Trigger>
                                <StandardDialog.Content>
                                    <StandardDialog.Header>
                                        <StandardDialog.Title>Confirmar Carga Masiva</StandardDialog.Title>
                                        <StandardDialog.Description>
                                            Estás a punto de guardar {fullArticlesPayload.length} artículos.
                                            El proceso se ejecutará en segundo plano. ¿Deseas continuar?
                                        </StandardDialog.Description>
                                    </StandardDialog.Header>
                                    <StandardDialog.Footer>
                                        <StandardDialog.Close asChild>
                                            <StandardButton styleType="outline"> Cancelar </StandardButton>
                                        </StandardDialog.Close>
                                        <StandardButton onClick={handleSave} leftIcon={Save} >
                                            Confirmar y Cargar
                                        </StandardButton>
                                    </StandardDialog.Footer>
                                </StandardDialog.Content>
                            </StandardDialog>
                        </StandardCard.Actions>
                    </StandardCard>
                )}
            </div>
        </div>
    );
}