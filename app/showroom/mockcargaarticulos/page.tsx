// src/app/showroom/StandardTableMetadataShowcase.tsx
"use client";

import React, { useMemo } from "react";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardText } from "@/components/ui/StandardText";
import { Link as LinkIcon } from "lucide-react";

// --- Tipos ---
interface AdditionalMetadata {
    wosId?: string;
    eissn?: string;
    issn?: string;
}

interface ShowcaseArticle {
    id: number;
    title: string;
    abstract: string;
    authors: string;
    year: number;
    additionalMetadata?: AdditionalMetadata;
    subRows?: { __isGhost?: boolean }[];
}


// --- Datos Harcodeados ---
const showcaseData: ShowcaseArticle[] = [
    { id: 1, title: 'Artículo con Todos los Metadatos', abstract: 'Este artículo de ejemplo tiene todos los campos de metadatos adicionales disponibles para la previsualización.', authors: 'Autor A, Autor B', year: 2023, additionalMetadata: { wosId: 'WOS:0001234567890', eissn: '1234-5678', issn: '9876-5432' } },
    { id: 2, title: 'Artículo con Metadatos Parciales (WOS ID, eISSN)', abstract: 'Un ejemplo donde solo se encuentran dos de los tres metadatos adicionales comunes.', authors: 'Autor C', year: 2022, additionalMetadata: { wosId: 'WOS:0009876543210', eissn: '2345-6789' } },
    { id: 3, title: 'Artículo con Un Solo Metadato (WOS ID)', abstract: 'Este artículo solo tiene un metadato adicional de los definidos.', authors: 'Autor D, Autor E', year: 2021, additionalMetadata: { wosId: 'WOS:0005555555555' } },
    { id: 4, title: 'Artículo Sin Metadatos Adicionales', abstract: 'Un artículo que no posee ninguno de los metadatos adicionales, por lo que el expander no debería aparecer.', authors: 'Autor F', year: 2020 },
    { id: 5, title: 'Artículo con Metadatos Parciales (eISSN, ISSN)', abstract: 'Un ejemplo para probar la combinación de los últimos dos metadatos.', authors: 'Autor G', year: 2024, additionalMetadata: { eissn: '4444-5555', issn: '6666-7777' } },
];


// ✅ Lógica de pre-procesamiento que USA LA BANDERA __isGhost
const processedShowcaseData = showcaseData.map(article => {
    const metadata = article.additionalMetadata;
    const hasAnyMetadata = !!metadata && Object.values(metadata).some(val => val && String(val).trim() !== '');

    if (hasAnyMetadata) {
        return {
            ...article,
            // Añadimos la bandera para que StandardTableRow sepa que no debe renderizar esta fila
            subRows: [{ __isGhost: true }],
        };
    }
    return article;
});


// --- Componente de la Página ---
export default function StandardTableMetadataShowcase() {

    const columns = useMemo<ColumnDef<ShowcaseArticle>[]>(() => [
        { id: 'expander', header: () => null, cell: ({ row }) => null, meta: { isSticky: 'left' }, size: 40, enableHiding: false },
        { accessorKey: 'title', header: 'Título', size: 300, meta: { isTruncatable: true, tooltipType: 'standard' } },
        { accessorKey: 'abstract', header: 'Abstract', size: 400, meta: { isTruncatable: true, tooltipType: 'longText' } },
        { accessorKey: 'authors', header: 'Autores', size: 200 },
        { accessorKey: 'year', header: 'Año', size: 80, meta: { align: 'center' } },
        { id: 'actions', header: 'Acciones', meta: { isSticky: 'right' }, size: 100, enableHiding: false, cell: () => (
            <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-pure hover:underline">
                <LinkIcon size={14} /><span>Ver</span>
            </a>
        )},
    ], []);

    const renderSubComponent = (row: Row<ShowcaseArticle>) => {
        const metadata = row.original.additionalMetadata;
        if (!metadata) {
            return ( <div className="p-4 bg-neutral-bg/30"> <StandardText size="sm" color="neutral">No hay metadatos adicionales disponibles.</StandardText> </div> );
        }
        const metadataElements: React.ReactNode[] = [];
        if (metadata.wosId && metadata.wosId.trim() !== '') { metadataElements.push( <div className="flex flex-col" key="wosId"> <StandardText as="h4" size="sm" weight="medium" className="mb-1">WOS ID</StandardText> <StandardText size="sm">{metadata.wosId}</StandardText> </div> ); }
        if (metadata.eissn && metadata.eissn.trim() !== '') { metadataElements.push( <div className="flex flex-col" key="eissn"> <StandardText as="h4" size="sm" weight="medium" className="mb-1">eISSN</StandardText> <StandardText size="sm">{metadata.eissn}</StandardText> </div> ); }
        if (metadata.issn && metadata.issn.trim() !== '') { metadataElements.push( <div className="flex flex-col" key="issn"> <StandardText as="h4" size="sm" weight="medium" className="mb-1">ISSN</StandardText> <StandardText size="sm">{metadata.issn}</StandardText> </div> ); }
        if (metadataElements.length === 0) return null;
        const gridColsClass = metadataElements.length === 1 ? 'grid-cols-1' : metadataElements.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
        return ( <div className={`p-4 bg-neutral-bg/30 grid ${gridColsClass} gap-x-6 gap-y-4 max-w-full overflow-x-auto`}> {metadataElements} </div> );
    };

    return (
        <StandardPageBackground variant="default">
            <div className="p-6">
                <div className="mb-6">
                    <StandardText asElement="h1" preset="heading">Showroom de Metadatos (Solución Simple)</StandardText>
                    <StandardText color="neutral" colorShade="text" className="mt-2">
                        Demostración de <code>StandardTable</code> con el hack <code>__isGhost</code> para eliminar la fila fantasma.
                    </StandardText>
                </div>
                <div>
                    <StandardTable
                        data={processedShowcaseData}
                        columns={columns}
                        renderSubComponent={renderSubComponent}
                        filterPlaceholder="Buscar en showroom..."
                        enableTruncation={true}
                        isStickyHeader={true}
                        stickyOffset={64}
                    >
                        <StandardTable.Table />
                    </StandardTable>
                </div>
            </div>
        </StandardPageBackground>
    );
}