"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardMarkdownViewer, type SearchMatch } from "@/components/ui/StandardMarkdownViewer";
import { StandardInput } from "@/components/ui/StandardInput";
import { FileText, Download, Expand, Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { StandardButton } from "@/components/ui/StandardButton";

interface CogneticaMarkdownViewerProps {
    content: string;
    artifactTitle: string;
}

export function CogneticaMarkdownViewer({ content, artifactTitle }: CogneticaMarkdownViewerProps) {
    const [expandAll, setExpandAll] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [matches, setMatches] = useState<SearchMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [showSearch, setShowSearch] = useState(false);

    const handleDownloadOriginal = () => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifactTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExecuteSearch = () => {
        setActiveSearchTerm(searchInput);
        setCurrentMatchIndex(0);
    };

    const handleNextMatch = () => {
        if (matches.length > 0) {
            setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
        }
    };

    const handlePrevMatch = () => {
        if (matches.length > 0) {
            setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setActiveSearchTerm('');
        setCurrentMatchIndex(0);
        setMatches([]);
    };

    const handleSearchMatches = (foundMatches: SearchMatch[]) => {
        setMatches(foundMatches);
        if (foundMatches.length > 0) {
            setCurrentMatchIndex(0);
        }
    };

    return (
        <>
            {showSearch && typeof window !== 'undefined' && createPortal(
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-4xl">
                    <div className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-2xl p-4">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <StandardInput
                                    type="text"
                                    placeholder="Escribe y presiona Buscar..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleExecuteSearch();
                                        }
                                    }}
                                />
                            </div>
                            <StandardButton
                                size="sm"
                                styleType="solid"
                                colorScheme="primary"
                                leftIcon={Search}
                                onClick={handleExecuteSearch}
                                disabled={!searchInput.trim()}
                            >
                                Buscar
                            </StandardButton>
                            {matches.length > 0 && (
                                <>
                                    <StandardText size="sm" colorScheme="neutral" colorShade="textShade" className="whitespace-nowrap">
                                        {currentMatchIndex + 1} de {matches.length}
                                    </StandardText>
                                    <StandardButton
                                        size="sm"
                                        styleType="ghost"
                                        leftIcon={ChevronUp}
                                        onClick={handlePrevMatch}
                                        tooltip="Anterior"
                                    />
                                    <StandardButton
                                        size="sm"
                                        styleType="ghost"
                                        leftIcon={ChevronDown}
                                        onClick={handleNextMatch}
                                        tooltip="Siguiente"
                                    />
                                </>
                            )}
                            {activeSearchTerm && (
                                <StandardButton
                                    size="sm"
                                    styleType="ghost"
                                    leftIcon={X}
                                    onClick={handleClearSearch}
                                    tooltip="Limpiar búsqueda"
                                />
                            )}
                            <StandardButton
                                size="sm"
                                styleType="ghost"
                                leftIcon={X}
                                onClick={() => setShowSearch(false)}
                                tooltip="Cerrar búsqueda"
                                className="ml-2 border-l pl-2"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
            <StandardCard>
                <StandardCard.Header>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <StandardText weight="semibold" size="lg">
                                Contenido del Documento
                            </StandardText>
                        </div>
                        <div className="flex items-center gap-2">
                            <StandardButton
                                size="sm"
                                styleType="ghost"
                                leftIcon={Search}
                                onClick={() => setShowSearch(!showSearch)}
                            >
                                {showSearch ? 'Ocultar Búsqueda' : 'Buscar'}
                            </StandardButton>
                            <StandardButton
                                size="sm"
                                styleType="ghost"
                                leftIcon={Expand}
                                onClick={() => setExpandAll(!expandAll)}
                            >
                                {expandAll ? 'Colapsar Todo' : 'Expandir Todo'}
                            </StandardButton>
                            <StandardButton
                                size="sm"
                                styleType="outline"
                                leftIcon={Download}
                                onClick={handleDownloadOriginal}
                            >
                                Descargar
                            </StandardButton>
                        </div>
                    </div>
                </StandardCard.Header>
                
                <StandardCard.Content>
                    <StandardMarkdownViewer 
                        content={content} 
                        expandAll={expandAll}
                        searchTerm={activeSearchTerm}
                        currentMatchIndex={currentMatchIndex}
                        onSearch={handleSearchMatches}
                    />
                </StandardCard.Content>
            </StandardCard>
        </>
    );
}
