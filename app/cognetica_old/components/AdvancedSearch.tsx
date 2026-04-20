"use client";

import { useState, useEffect } from "react";
import { StandardPopupWindow } from "@/components/ui/StandardPopupWindow";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Search, Filter } from "lucide-react";
import { getCognitiveElementsForProject } from "@/lib/actions/cognetica-old-filters-actions";

interface AdvancedSearchProps {
    projectId: string;
    onSelectElement: (type: 'seed' | 'discipline' | 'theory' | 'thinker', value: string) => void;
}

type ElementType = 'seeds' | 'disciplines' | 'theories' | 'thinkers';

export function AdvancedSearch({ projectId, onSelectElement }: AdvancedSearchProps) {
    const [open, setOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<ElementType>('seeds');
    const [searchTerm, setSearchTerm] = useState("");
    const [elements, setElements] = useState<{
        seeds: Array<{ content: string }>;
        disciplines: Array<{ id: string; name: string }>;
        theories: Array<{ id: string; name: string }>;
        thinkers: Array<{ id: string; name: string }>;
    }>({
        seeds: [],
        disciplines: [],
        theories: [],
        thinkers: []
    });
    const [loading, setLoading] = useState(false);

    // Cargar elementos cuando se abre el popup
    useEffect(() => {
        if (open && projectId) {
            loadElements();
        }
    }, [open, projectId]);

    const loadElements = async () => {
        setLoading(true);
        try {
            const result = await getCognitiveElementsForProject(projectId);
            if (result.success && result.data) {
                setElements(result.data);
            }
        } catch (error) {
            console.error('Error cargando elementos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar elementos según el término de búsqueda
    const getFilteredElements = () => {
        const term = searchTerm.toLowerCase();
        
        switch (selectedType) {
            case 'seeds':
                return elements.seeds.filter(s => 
                    s.content.toLowerCase().includes(term)
                );
            case 'disciplines':
                return elements.disciplines.filter(d => 
                    d.name.toLowerCase().includes(term)
                );
            case 'theories':
                return elements.theories.filter(t => 
                    t.name.toLowerCase().includes(term)
                );
            case 'thinkers':
                return elements.thinkers.filter(t => 
                    t.name.toLowerCase().includes(term)
                );
            default:
                return [];
        }
    };

    const handleSelectElement = (element: any) => {
        const typeMap: Record<ElementType, 'seed' | 'discipline' | 'theory' | 'thinker'> = {
            'seeds': 'seed',
            'disciplines': 'discipline',
            'theories': 'theory',
            'thinkers': 'thinker'
        };

        const value = selectedType === 'seeds' ? element.content : element.id;
        onSelectElement(typeMap[selectedType], value);
        setOpen(false);
        setSearchTerm("");
    };

    const filteredElements = getFilteredElements();

    return (
        <StandardPopupWindow open={open} onOpenChange={setOpen}>
            <StandardPopupWindow.Trigger asChild>
                <StandardButton
                    size="sm"
                    styleType="outline"
                    leftIcon={Search}
                    colorScheme="primary"
                >
                    Búsqueda Avanzada
                </StandardButton>
            </StandardPopupWindow.Trigger>

            <StandardPopupWindow.Content size="md" colorScheme="primary">
                <StandardPopupWindow.Header>
                    <StandardPopupWindow.Title>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Búsqueda Avanzada de Elementos Cognitivos
                        </div>
                    </StandardPopupWindow.Title>
                    <StandardPopupWindow.Description>
                        Selecciona el tipo de elemento y busca por contenido para filtrar artefactos
                    </StandardPopupWindow.Description>
                </StandardPopupWindow.Header>

                <StandardPopupWindow.Body>
                    <div className="space-y-6">
                        {/* Selector de tipo de elemento */}
                        <div className="space-y-3">
                            <StandardText size="sm" weight="medium">
                                Tipo de elemento:
                            </StandardText>
                            <div className="flex flex-wrap gap-2">
                                <StandardButton
                                    size="sm"
                                    colorScheme="accent"
                                    styleType={selectedType === 'seeds' ? "solid" : "outline"}
                                    onClick={() => {
                                        setSelectedType('seeds');
                                        setSearchTerm("");
                                    }}
                                >
                                    🌱 Semillas ({elements.seeds.length})
                                </StandardButton>
                                <StandardButton
                                    size="sm"
                                    colorScheme="primary"
                                    styleType={selectedType === 'disciplines' ? "solid" : "outline"}
                                    onClick={() => {
                                        setSelectedType('disciplines');
                                        setSearchTerm("");
                                    }}
                                >
                                    🔬 Disciplinas ({elements.disciplines.length})
                                </StandardButton>
                                <StandardButton
                                    size="sm"
                                    colorScheme="secondary"
                                    styleType={selectedType === 'theories' ? "solid" : "outline"}
                                    onClick={() => {
                                        setSelectedType('theories');
                                        setSearchTerm("");
                                    }}
                                >
                                    💡 Teorías ({elements.theories.length})
                                </StandardButton>
                                <StandardButton
                                    size="sm"
                                    colorScheme="tertiary"
                                    styleType={selectedType === 'thinkers' ? "solid" : "outline"}
                                    onClick={() => {
                                        setSelectedType('thinkers');
                                        setSearchTerm("");
                                    }}
                                >
                                    👤 Pensadores ({elements.thinkers.length})
                                </StandardButton>
                            </div>
                        </div>

                        {/* Barra de búsqueda */}
                        <div className="space-y-2">
                            <StandardText size="sm" weight="medium">
                                Buscar:
                            </StandardText>
                            <StandardInput
                                placeholder={`Buscar ${selectedType === 'seeds' ? 'semillas' : selectedType === 'disciplines' ? 'disciplinas' : selectedType === 'theories' ? 'teorías' : 'pensadores'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Lista de resultados */}
                        <div className="space-y-2">
                            <StandardText size="sm" weight="medium" colorScheme="neutral">
                                Resultados ({filteredElements.length}):
                            </StandardText>
                            
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <StandardText size="sm" colorScheme="neutral">
                                        Cargando elementos...
                                    </StandardText>
                                </div>
                            ) : filteredElements.length === 0 ? (
                                <div className="flex items-center justify-center py-8 text-center">
                                    <StandardText size="sm" colorScheme="neutral">
                                        {searchTerm ? 'No se encontraron resultados' : 'Escribe para buscar'}
                                    </StandardText>
                                </div>
                            ) : (
                                <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-3">
                                    {filteredElements.map((element: any, idx: number) => {
                                        const colorScheme = 
                                            selectedType === 'seeds' ? 'accent' :
                                            selectedType === 'disciplines' ? 'primary' :
                                            selectedType === 'theories' ? 'secondary' : 'tertiary';
                                        
                                        const displayText = selectedType === 'seeds' ? element.content : element.name;
                                        
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                                                onClick={() => handleSelectElement(element)}
                                            >
                                                <StandardBadge
                                                    colorScheme={colorScheme}
                                                    styleType="outline"
                                                    size="sm"
                                                >
                                                    {displayText}
                                                </StandardBadge>
                                                <StandardButton
                                                    size="sm"
                                                    styleType="ghost"
                                                    colorScheme={colorScheme}
                                                >
                                                    Seleccionar
                                                </StandardButton>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </StandardPopupWindow.Body>

                <StandardPopupWindow.Footer>
                    <StandardPopupWindow.Close asChild>
                        <StandardButton styleType="outline">
                            Cerrar
                        </StandardButton>
                    </StandardPopupWindow.Close>
                </StandardPopupWindow.Footer>
            </StandardPopupWindow.Content>
        </StandardPopupWindow>
    );
}
