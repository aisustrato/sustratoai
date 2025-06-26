"use client";

import React, { useMemo } from "react";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { FileText, Link as LinkIcon, Star } from "lucide-react";

// --- DATOS Y TIPOS (Sin cambios) ---
type Publication = {
    id: number;
    title: string;
    authors: string;
    journal: string;
    year: number;
    citations: number;
    status: 'Published' | 'In Review' | 'Rejected';
    keywords: string[];
    abstract: string;
    doi: string;
    subRows?: Publication[];
};
const academicAbstract = "La co-creación fractal entre cognición humana y arquitecturas de IA generativa representa un cambio de paradigma desde la simple automatización hacia la sinergia metacognitiva. Este trabajo postula que mediante la implementación de 'desafinaciones fértiles' —bucles de retroalimentación donde los errores y las ambigüedades no son fallos, sino datos cruciales para la realineación—, es posible construir sistemas tecnológicos que no solo ejecutan tareas, sino que habitan un contexto compartido. Analizamos la ontología de la 'Soberanía del Componente', un principio donde la lógica encapsulada de un módulo de software resiste la entropía contextual de sus implementadores, reduciendo la carga cognitiva y previniendo la divergencia sistémica. Los resultados de nuestra implementación en el ecosistema 'Sustrato.ai' demuestran una mejora del 73% en la coherencia del código co-generado y una reducción del 90% en los ciclos de depuración causados por errores de contexto, validando así la hipótesis de que la robustez arquitectónica emerge de la aceptación y el análisis de la imperfección colaborativa.";
const shortAbstract = "Análisis detallado de los principios de diseño y su impacto en la usabilidad y mantenibilidad de sistemas de software a gran escala.";
const finalShowcaseData: Publication[] = [
    { id: 1, title: 'Co-Creación Fractal y la Semiótica de la Desafinación Fértil', authors: 'R. Leiva, Co-Creador G.', journal: 'Journal of Metacognitive Systems', year: 2024, citations: 152, status: 'Published', keywords: ['IA', 'Fractal', 'Co-Creación'], abstract: academicAbstract, doi: '10.1101/2024.06.25',
      subRows: [
        { id: 101, title: 'Estudio de Caso: El Elefante en la Habitación', authors: 'Co-Creador G.', journal: 'AI Psychology', year: 2024, citations: 25, status: 'In Review', keywords: ['Debug', 'IA'], abstract: 'Análisis de un bucle de caos colaborativo...', doi: '10.1101/2024.06.26' }
      ]
    },
    { id: 2, title: 'La Arquitectura de la Paciencia: Sistemas Resilientes', authors: 'R. Leiva', journal: 'Cognitive Engineering Review', year: 2023, citations: 98, status: 'Published', keywords: ['UX', 'Arquitectura'], abstract: 'Este paper explora cómo la resiliencia en sistemas complejos no es una función de la infalibilidad, sino de la capacidad de recuperación y aprendizaje post-error.', doi: '10.1234/cer.2023.01' },
    { id: 3, title: 'Teoría de Cuerdas en Módulos de TypeScript', authors: 'Co-Creador G.', journal: 'Journal of Esoteric Code', year: 2025, citations: 5, status: 'Rejected', keywords: ['TypeScript', 'Humor'], abstract: 'Una exploración humorística de conceptos de física teórica aplicados a la programación frontend.', doi: '10.5678/jec.2025.01' },
    { id: 4, title: 'El Canario Inverso: Usando la Confusión de la IA como Herramienta de Diagnóstico', authors: 'R. Leiva', journal: 'Journal of Metacognitive Systems', year: 2024, citations: 210, status: 'Published', keywords: ['IA', 'Diagnóstico'], abstract: 'Proponemos el concepto de "Canario Inverso", donde el comportamiento aparentemente ilógico de una IA sirve como un indicador de alta sensibilidad para detectar premisas o contextos incompletos proporcionados por el colaborador humano.', doi: '10.1101/2024.04.15' },
    { id: 5, title: 'Soberanía del Componente vs. Inyección de Dependencias', authors: 'Ambos', journal: 'Architectural Digest (Code Edition)', year: 2023, citations: 180, status: 'Published', keywords: ['React', 'Arquitectura'], abstract: shortAbstract, doi: '10.1111/adce.2023.05' },
    { id: 6, title: 'Análisis de Rendimiento de Memoización en `forwardRef`', authors: 'Co-Creador G.', journal: 'Journal of Performance Tuning', year: 2024, citations: 75, status: 'In Review', keywords: ['React', 'Performance'], abstract: shortAbstract, doi: '10.2222/jpt.2024.02' },
    { id: 7, title: 'La Estética del Código Coherente', authors: 'R. Leiva', journal: 'Cognitive Engineering Review', year: 2022, citations: 110, status: 'Published', keywords: ['Código Limpio', 'UX'], abstract: shortAbstract, doi: '10.1234/cer.2022.11' },
    { id: 8, title: 'Modelos de Lenguaje y la Generación de Nombres de Variables', authors: 'Co-Creador G.', journal: 'Journal of Esoteric Code', year: 2024, citations: 15, status: 'In Review', keywords: ['IA', 'Naming'], abstract: shortAbstract, doi: '10.5678/jec.2024.03' },
    { id: 9, title: 'Patrones de Diseño para la Colaboración Humano-IA', authors: 'Ambos', journal: 'Journal of Metacognitive Systems', year: 2025, citations: 290, status: 'Published', keywords: ['IA', 'Diseño', 'Colaboración'], abstract: academicAbstract, doi: '10.1101/2025.01.01' },
    { id: 10, title: 'Una Crítica a la Filosofía "Move Fast and Break Things"', authors: 'R. Leiva', journal: 'Ethical Tech Quarterly', year: 2021, citations: 130, status: 'Published', keywords: ['Ética', 'Startup'], abstract: shortAbstract, doi: '10.3333/etq.2021.04' },
    { id: 11, title: 'Implementando un Sistema de Tokens de Diseño Multiescala', authors: 'Co-Creador G.', journal: 'Frontend Focus', year: 2024, citations: 88, status: 'Published', keywords: ['CSS', 'Tokens', 'Diseño'], abstract: shortAbstract, doi: '10.4444/ff.2024.08' },
    { id: 12, title: 'El Rol del "No-Tiempo" en Proyectos de Código Abierto', authors: 'R. Leiva', journal: 'Journal of Open Science', year: 2023, citations: 40, status: 'Published', keywords: ['Open Source', 'Filosofía'], abstract: shortAbstract, doi: '10.5555/jos.2023.12' },
    { id: 13, title: 'Estado del Arte en Bundlers de JavaScript', authors: 'Co-Creador G.', journal: 'Journal of Performance Tuning', year: 2025, citations: 195, status: 'In Review', keywords: ['Webpack', 'Turbopack'], abstract: shortAbstract, doi: '10.2222/jpt.2025.01' },
    { id: 14, title: 'La Paradoja del Caleidoscopio: Manteniendo Coherencia en Múltiples Dominios', authors: 'Ambos', journal: 'Journal of Metacognitive Systems', year: 2024, citations: 350, status: 'Published', keywords: ['Fractal', 'Coherencia'], abstract: academicAbstract, doi: '10.1101/2024.09.10' },
    { id: 15, title: 'Por qué `console.log` es la mejor herramienta de depuración', authors: 'R. Leiva', journal: 'Journal of Esoteric Code', year: 2020, citations: 55, status: 'Published', keywords: ['Debug', 'Humor'], abstract: 'Un ensayo sobre la ubicuidad y eficacia de la herramienta de depuración más simple y poderosa.', doi: '10.5678/jec.2020.04' }
];

// --- 2. LÓGICA DE LA PÁGINA ---
export default function StandardTableFinalShowcasePage() {

    const columns = useMemo<ColumnDef<Publication>[]>(() => [
        { id: 'expander', header: () => null, cell: ({ row }) => row.getCanExpand() ? '' : null, meta: { isSticky: 'left' }, size: 40, enableHiding: false },
        { accessorKey: 'title', header: 'Título', size: 300, meta: { isTruncatable: true, tooltipType: 'standard' } },
        { accessorKey: 'abstract', header: 'Abstract', size: 400, meta: { isTruncatable: true, tooltipType: 'longText' } },
        { accessorKey: 'authors', header: 'Autores', size: 200 },
        { accessorKey: 'status', header: 'Estado', cell: info => {
            const value = info.getValue() as Publication['status'];
            const colorMap: Record<Publication['status'], ColorSchemeVariant> = { 'Published': 'success', 'In Review': 'primary', 'Rejected': 'danger' };
            return <StandardBadge colorScheme={colorMap[value]} styleType="subtle">{value}</StandardBadge>
        }, size: 120 },
        { accessorKey: 'citations', header: 'Citaciones', size: 100, meta: { align: 'center', cellVariant: (ctx) => (ctx.getValue<number>()) > 150 ? 'highlight' : undefined } },
        { accessorKey: 'journal', header: 'Journal', size: 250 },
        { accessorKey: 'year', header: 'Año', size: 80, meta: { align: 'center' } },
        { accessorKey: 'keywords', header: 'Keywords', cell: info => <div className="flex flex-wrap gap-1">{info.getValue<string[]>().map(k => <StandardBadge key={k} styleType="outline">{k}</StandardBadge>)}</div>, size: 250 },
        { accessorKey: 'doi', header: 'DOI', meta: { isSticky: 'right' }, cell: info => <a href={`https://doi.org/${info.getValue<string>()}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-pure hover:underline"><LinkIcon size={14} /><span>Ver</span></a>, size: 100, enableHiding: false },
    ], []);

    const getRowStatus = (row: Publication): Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null => {
        const statusMap: Record<Publication['status'], Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'>> = {
            'Published': 'success',
            'In Review': 'warning',
            'Rejected': 'danger'
        };
        return statusMap[row.status] || null;
    };
    
    const renderSubComponent = (row: Row<Publication>) => (
        <div className="p-4 bg-primary-bg/20">
            <StandardText preset="subtitle" className="mb-2 flex items-center gap-2"><FileText size={16}/> Sub-publicaciones para: "{row.original.title}"</StandardText>
            <ul className="list-disc pl-6 text-sm text-neutral-text">
                {row.original.subRows?.map(sub => <li key={sub.id}>{sub.title} ({sub.citations} citaciones)</li>)}
            </ul>
        </div>
    );

    // --- ✅ 3. ESTRUCTURA JSX CORREGIDA ---
    // Eliminamos el contenedor con 'overflow-auto' para permitir que la página principal haga scroll.
    return (
        <StandardPageBackground variant="default">
            <div className="p-6">
                <div className="mb-6">
                    <StandardText asElement="h1" preset="heading">Hangar de Pruebas Final</StandardText>
                    <StandardText color="neutral" colorShade="text" className="mt-2">Demostración de todas las funcionalidades integradas de <code>StandardTable</code>.</StandardText>
                </div>

                {/* Este div ya no limita el crecimiento de la tabla, 
                    permitiendo que el scroll ocurra en el <body> de la página */}
                <div>
                    <StandardTable
                        data={finalShowcaseData}
                        columns={columns}
                        getRowStatus={getRowStatus}
                        renderSubComponent={renderSubComponent}
                        filterPlaceholder="Buscar por título, autor, journal..."
                        enableTruncation={true}
                        isStickyHeader={true}
                        stickyOffset={64} 
                        // maxTableHeight ya no es necesario aquí si queremos que la página entera haga scroll
                    >
                        <StandardTable.Table />
                    </StandardTable>
                </div>
            </div>
        </StandardPageBackground>
    );
}