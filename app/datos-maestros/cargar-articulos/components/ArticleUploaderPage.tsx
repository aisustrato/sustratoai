"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { type ColumnDef } from "@tanstack/react-table";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import type { ResultadoOperacion } from '@/lib/actions/batch-actions';

// Definición local del tipo Article
type Article = {
  'Publication Type'?: string;
  'Authors'?: string;
  'Author Full Names'?: string;
  'Title'?: string;
  'Jurnal'?: string;
  'Abstract'?: string;
  'ORCIDs'?: string;
  'ISSN'?: string;
  'eISSN'?: string;
  'ISBN'?: string;
  'Publication Date'?: string;
  'Publication_Year'?: string;
  'Volume'?: string;
  'Issue'?: string;
  'Special Issue'?: string;
  'Start Page'?: string;
  'End Page'?: string;
  'Article Number'?: string;
  'DOI'?: string;
  'DOI Link'?: string;
  'UT (Unique WOS ID)'?: string;
  [key: string]: any; // Para permitir propiedades adicionales
};

interface ArticleUploaderPageProps {
  projectName: string;
  onSave: (articles: Article[]) => Promise<ResultadoOperacion<any>>;
}

type ArticleRow = { [key: string]: any };

// --- ✅ La definición de columnas ahora sabe sobre el truncamiento ---
const createArticleColumns = (keys: string[]): ColumnDef<ArticleRow>[] => {
    
    // Configuración especial para columnas conocidas
    const specialColumnConfig: { [key:string]: Partial<ColumnDef<ArticleRow>> } = {
        'Title': { 
            header: 'Title', 
            size: 300, 
            enableSorting: true,
            // Le decimos que esta columna puede ser truncada y usa un tooltip estándar
            meta: { isTruncatable: true, tooltipType: 'standard' },
            // Nos aseguramos que renderice un StandardText para que la tabla lo reconozca
            cell: info => <StandardText size="sm">{String(info.getValue() ?? '')}</StandardText>
        },
        'Abstract': { 
            header: 'Abstract', 
            size: 450, 
            enableSorting: false,
            // Le decimos que esta columna usa el tooltip para textos largos
            meta: { isTruncatable: true, tooltipType: 'longText' },
            cell: info => <StandardText size="sm">{String(info.getValue() ?? '')}</StandardText>
        },
        'Authors': { header: 'Authors', size: 200, enableSorting: true },
        'Publication_Year': { header: 'Year', size: 80, meta: { align: 'center' }, enableSorting: true },
        'Journal': { header: 'Journal', size: 250, enableSorting: true }, // Corregido 'Jurnal'
    };

    const dataKeys = keys.filter(key => key && key.trim() !== '');

    const generatedColumns: ColumnDef<ArticleRow>[] = dataKeys.map(key => {
        const defaultConfig: Partial<ColumnDef<ArticleRow>> = {
            header: key.replace(/_/g, ' '),
            size: 150,
            enableSorting: true,
            // Por defecto, las celdas dinámicas también usarán StandardText
            cell: info => <StandardText size="sm">{String(info.getValue() ?? '')}</StandardText>
        };
        const specialConfig = specialColumnConfig[key] || {};
        return {
            accessorKey: key,
            ...defaultConfig,
            ...specialConfig,
        };
    });
    
    generatedColumns.push({
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: () => <StandardButton size="sm" styleType="ghost">Details</StandardButton>,
        meta: { align: 'center', isSticky: 'right' },
        enableSorting: false,
        enableHiding: false,
    });

    return generatedColumns;
};

export default function ArticleUploaderPage({ projectName, onSave }: ArticleUploaderPageProps) {
    const [rows, setRows] = useState<ArticleRow[]>([]);
    const [columns, setColumns] = useState<ColumnDef<ArticleRow>[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse<ArticleRow>(file, {
                header: true,
                skipEmptyLines: true,
                delimiter: ";",
                complete: (results) => {
                    const dataRows = results.data;
                    if (dataRows.length > 0) {
                        const keys = Object.keys(dataRows[0]);
                        setColumns(createArticleColumns(keys));
                        setRows(dataRows);
                    }
                },
            });
        }
    };

    return (
        <StandardPageBackground variant="default">
            <div className="p-6">
                <div className="mb-6">
                    <StandardText asElement="h1" weight="bold" size="3xl">
                        Visor de Artículos Científicos
                    </StandardText>
                    <StandardText color="neutral" colorShade="textShade" className="mt-2">
                        Cargando artículos para el proyecto: <StandardText asElement="span" weight="bold">{projectName}</StandardText>
                    </StandardText>
                </div>

                <div className="mb-4">
                    <StandardText asElement="label" htmlFor="csv-uploader" weight="medium">
                        Cargar archivo CSV:
                    </StandardText>
                    <input
                        id="csv-uploader"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mt-2 block w-full text-sm text-neutral-textShade file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-bg file:text-primary-text hover:file:bg-primary-bgShade"
                    />
                </div>

                {error && (
                    <div className="my-4 p-4 bg-danger-bg/20 border border-danger-border rounded-md">
                        <StandardText colorScheme="danger">{error}</StandardText>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <StandardButton 
                        onClick={async () => {
                            setIsSaving(true);
                            setError(null);
                            const result = await onSave(rows as Article[]);
                            if (!result.success) {
                                setError(result.error || 'Ocurrió un error desconocido.');
                            }
                            setIsSaving(false);
                        }}
                        disabled={rows.length === 0 || isSaving}
                        loading={isSaving}
                    >
                        Guardar Artículos
                    </StandardButton>
                </div>
                
                {rows.length > 0 ? (
                    <div className="mt-6">
                        <StandardTable
                            data={rows}
                            columns={columns}
                            filterPlaceholder="Buscar en los artículos..."
                            isStickyHeader={true}
                            stickyOffset={64}
                            // --- ✅ Activamos la funcionalidad con un simple prop ---
                            enableTruncation={true}
                        >
                            <StandardTable.Table />
                        </StandardTable>
                    </div>
                ) : (
                    <div className="flex items-center justify-center p-10 border-2 border-dashed rounded-md mt-4">
                        <StandardText color="neutral" colorShade="textShade">
                            Esperando la selección de un archivo CSV...
                        </StandardText>
                    </div>
                )}
            </div>
        </StandardPageBackground>
    );
}