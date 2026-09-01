"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página para la carga masiva de artículos a un proyecto.
 * Valida que el usuario tenga el permiso 'can_upload_files'.
 * Permite al usuario subir un archivo CSV, previsualizar los datos y guardarlos en lotes (chunking).
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
import Link from 'next/link';
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
    const t = useTranslations('datosMaestros.cargarArticulos');
    const tNav = useTranslations('nav');
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
    const [uploadComplete, setUploadComplete] = useState(false);

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
                    toast.error(result.error || t('toastCheckError'));
                }
            })
            .catch(() => toast.error(t('toastNetworkCheckError')))
            .finally(() => setIsChecking(false));
    }, [proyectoActual, t]);

    const handleSave = async () => {
        if (!proyectoActual || fullArticlesPayload.length === 0) return;

        setIsSaving(true);
        setUploadProgress(0);
        setStatusMessage(t('toastUploadStart'));
        setIsDialogOpen(false);

        const CHUNK_SIZE = 200;
        const totalChunks = Math.ceil(fullArticlesPayload.length / CHUNK_SIZE);

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = start + CHUNK_SIZE;
                const currentChunk = fullArticlesPayload.slice(start, end);

                const progress = ((i + 1) / totalChunks) * 100;
                setStatusMessage(t('toastUploadingBatch', { current: i + 1, total: totalChunks, count: currentChunk.length }));

                const result = await uploadAndProcessArticles({
                    projectId: proyectoActual.id,
                    articlesData: currentChunk,
                });

                if (!result.success) {
                    throw new Error(result.error || t('toastBatchError', { n: i + 1 }));
                }

                setUploadProgress(progress);
            }

            setStatusMessage(t('toastUploadCompleteStatus'));
            setUploadProgress(100);
            setUploadComplete(true);
            toast.success(t('toastUploadSuccess', { count: fullArticlesPayload.length }));

            // Limpiar datos después de mostrar el mensaje
            setTimeout(() => {
                setPreviewArticles([]);
                setFullArticlesPayload([]);
                setFileName(null);
                setDataAlreadyExists(true);
            }, 1000);

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : t('toastUploadUnexpectedError');
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
                toast.success(t('toastDeleteSuccess'));
                setDataAlreadyExists(false);
                setFileName(null);
                setPreviewArticles([]);
                setFullArticlesPayload([]);
            } else {
                toast.error(result.error || t('toastDeleteError'));
            }
        } catch {
            // No necesitamos usar la variable de error aquí, pero capturamos para el toast.
            toast.error(t('toastDeleteUnexpectedError'));
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
                        toast.error(t('toastCsvParseErrors'));
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
                    toast.success(t('toastCsvReadSuccess', { count: allParsedArticles.length }));
                },
                error: (error: Error) => {
                    toast.error(t('toastCsvParseError', { message: error.message }));
                    setIsParsing(false);
                },
            });
        };

        reader.onerror = () => {
            toast.error(t('toastFileReadError'));
            setIsParsing(false);
        };

        reader.readAsText(file);
    }, [t]);

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
                    <StandardText size="sm" color="neutral">{t('noAdditionalMetadata')}</StandardText>
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
        { accessorKey: 'Title', header: t('columnTitle'), size: 250, meta: { isTruncatable: true } },
        { accessorKey: 'Abstract', header: t('columnAbstract'), size: 300, meta: { isTruncatable: true, tooltipType: 'longText' } },
        { accessorKey: 'Authors', header: t('columnAuthors'), size: 150, meta: { isTruncatable: true } },
        { accessorKey: 'Publication Year', header: t('columnYear'), size: 80, meta: { align: 'center' } },
        {
            accessorKey: 'DOI',
            header: t('columnDoi'),
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
    ], [t]);

    if (isChecking) {
        return <div className="flex h-full w-full items-center justify-center"><SustratoLoadingLogo text={t('checkingProjectData')} /></div>;
    }

    if (dataAlreadyExists) {
        return (
            <div className="max-w-3xl mx-auto">
                <StandardPageTitle
                    title={t('existingTitle')}
                    subtitle={t('existingSubtitle')}
                    mainIcon={FileCheck}
                    breadcrumbs={[ { label: tNav("datosMaestros"), href: "/datos-maestros" }, { label: t('breadcrumbCargarArticulos'), href: "/datos-maestros/cargar-articulos" } ]}
                    showBackButton={{ href: "/datos-maestros" }}
                />
                <StandardCard accentPlacement="top">
                    <StandardCard.Header>
                        <div className="flex items-center justify-between">
                            <StandardCard.Title className="flex items-center gap-2">
                                <StandardIcon colorScheme="danger" size="md"> <Trash2 /> </StandardIcon>
                                {t('existingArticlesCardTitle')}
                            </StandardCard.Title>
                            <StandardBadge colorScheme="warning" styleType="subtle" size="md">
                                {t('actionRequiredBadge')}
                            </StandardBadge>
                        </div>
                        <StandardCard.Subtitle>
                            <StandardText size="sm" colorScheme="secondary">
                                {t('existingWarning')}
                            </StandardText>
                        </StandardCard.Subtitle>
                    </StandardCard.Header>
                    <StandardCard.Content>
                        <div className="mb-4">
                            <StandardText>
                                {t('deleteWarning')}
                            </StandardText>
                        </div>
                    </StandardCard.Content>
                    <StandardCard.Actions className="justify-between">
                        <Link href="/articulos/base-original">
                            <StandardButton
                                colorScheme="primary"
                                styleType="outline"
                                leftIcon={FileCheck}
                            >
                                {t('viewInBaseButton')}
                            </StandardButton>
                        </Link>
                        <StandardDialog>
                            <StandardDialog.Trigger>
                                <StandardButton colorScheme="danger" styleType="outline" loading={isDeleting} leftIcon={Trash2} >
                                    {t('deleteArticlesButton')}
                                </StandardButton>
                            </StandardDialog.Trigger>
                            <StandardDialog.Content>
                                <StandardDialog.Header>
                                    <StandardDialog.Title>{t('confirmDeleteTitle')}</StandardDialog.Title>
                                    <StandardDialog.Description>
                                        {t('confirmDeleteDescription')}
                                    </StandardDialog.Description>
                                </StandardDialog.Header>
                                <StandardDialog.Footer>
                                    <StandardDialog.Close asChild>
                                        <StandardButton styleType="outline"> {t('cancelButton')} </StandardButton>
                                    </StandardDialog.Close>
                                    <StandardButton colorScheme="danger" onClick={handleDelete} loading={isDeleting} leftIcon={Trash2} >
                                        {t('confirmDeleteButton')}
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
                        <StandardProgressBar value={uploadProgress} label={statusMessage} showValue={true} size="lg" colorScheme="primary" animated={uploadProgress < 100} />
                        
                        {!uploadComplete && (
                            <StandardText as="p" size="sm" className="text-center mt-3 text-neutral-600 dark:text-neutral-400">
                                {t('savingWaitMessage')}
                            </StandardText>
                        )}

                        {uploadComplete && (
                            <div className="flex flex-col gap-3 mt-4">
                                <StandardText as="p" size="sm" className="text-center text-neutral-600 dark:text-neutral-400">
                                    {t('savingCompleteMessage')}
                                </StandardText>
                                <Link href="/articulos/base-original" className="w-full">
                                    <StandardButton
                                        className="w-full"
                                        colorScheme="primary"
                                        leftIcon={FileCheck}
                                    >
                                        {t('viewInBaseButton')}
                                    </StandardButton>
                                </Link>
                                <StandardButton
                                    styleType="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setIsSaving(false);
                                        setUploadComplete(false);
                                        setUploadProgress(0);
                                        setStatusMessage("");
                                    }}
                                >
                                    {t('closeButton')}
                                </StandardButton>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="container mx-auto py-8">
                <StandardPageTitle
                    title={t('pageTitle')}
                    subtitle={t('pageSubtitle')}
                    mainIcon={FileUp}
                    breadcrumbs={[ { label: tNav("datosMaestros"), href: "/datos-maestros" }, { label: t('breadcrumbCargarArticulos'), href: "/datos-maestros/cargar-articulos" } ]}
                    showBackButton={{ href: "/datos-maestros" }}
                />
                {showUploadCard && (
                    <StandardCard accentPlacement="top">
                        <StandardCard.Content>
                            <div className="flex flex-col items-center justify-center space-y-6 py-8">
                                <div className="flex flex-col items-center space-y-4 w-full max-w-md">
                                    <div className="relative">
                                        <StandardButton onClick={() => fileInputRef.current?.click()} size="lg" disabled={isParsing || isSaving} leftIcon={FileUp} className="px-8 py-6 text-base" >
                                            {t('selectFileButton')}
                                        </StandardButton>
                                        <input ref={fileInputRef} id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={isParsing || isSaving} />
                                        {isParsing && (
                                            <div className="absolute -right-10 top-1/2 -translate-y-1/2">
                                                <SustratoLoadingLogo showText={false} size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <StandardCard colorScheme="neutral" className="w-full">
                                        <StandardCard.Header> <StandardCard.Title>{t('fileConfigTitle')}</StandardCard.Title> </StandardCard.Header>
                                        <StandardCard.Content>
                                            <div>
                                                <StandardRadioGroup
                                                    name="csv-delimiter"
                                                    label={t('delimiterLabel')}
                                                    options={[ { value: ',', label: t('delimiterComma') }, { value: ';', label: t('delimiterSemicolon') } ]}
                                                    value={delimiter}
                                                    onChange={(value: string) => setDelimiter(value as ',' | ';')}
                                                    orientation="horizontal"
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <StandardText size="md" weight="medium" colorScheme="secondary" className="mb-2 block">
                                                    {t('requiredColumnsLabel')}
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
                                                    {t('exampleFormatLabel', { delimiter: delimiter === ',' ? t('delimiterCommaWord') : t('delimiterSemicolonWord') })}
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
                                        <StandardCard.Title>{t('previewTitle')}</StandardCard.Title>
                                        <StandardCard.Subtitle>
                                            <div className="flex items-center gap-1">
                                                <StandardText size="sm">{t('fileLabel')} </StandardText>
                                                <StandardText size="sd" colorScheme="secondary" weight="bold">
                                                    {fileName}
                                                </StandardText>
                                                <StandardText size="sm"> • {t('recordsLoaded', { count: fullArticlesPayload.length })}</StandardText>
                                            </div>
                                        </StandardCard.Subtitle>
                                    </div>
                                </div>
                                <div>
                                    <StandardButton onClick={handleChangeFileClick} styleType="outline" size="sm" leftIcon={FileUp} className="mt-2 sm:mt-0" >
                                        {t('changeFileButton')}
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
                                    filterPlaceholder={t('searchInPreviewPlaceholder')}
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
                                        {t('saveButton', { count: fullArticlesPayload.length })}
                                    </StandardButton>
                                </StandardDialog.Trigger>
                                <StandardDialog.Content>
                                    <StandardDialog.Header>
                                        <StandardDialog.Title>{t('confirmBulkTitle')}</StandardDialog.Title>
                                        <StandardDialog.Description>
                                            {t('confirmBulkDescription', { count: fullArticlesPayload.length })}
                                        </StandardDialog.Description>
                                    </StandardDialog.Header>
                                    <StandardDialog.Footer>
                                        <StandardDialog.Close asChild>
                                            <StandardButton styleType="outline"> {t('cancelButton')} </StandardButton>
                                        </StandardDialog.Close>
                                        <StandardButton onClick={handleSave} leftIcon={Save} >
                                            {t('confirmAndUploadButton')}
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