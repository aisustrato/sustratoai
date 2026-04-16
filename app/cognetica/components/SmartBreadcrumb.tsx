"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";

interface BreadcrumbItem {
    label: string;
    path: string;
    timestamp: number;
}

const MAX_HISTORY = 5; // Máximo de items en el historial

export function SmartBreadcrumb() {
    const router = useRouter();
    const pathname = usePathname();
    const [history, setHistory] = useState<BreadcrumbItem[]>([]);

    useEffect(() => {
        // Cargar historial desde localStorage
        const savedHistory = localStorage.getItem('cognetica-breadcrumb-history');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                setHistory(parsed);
            } catch (e) {
                console.error('Error cargando historial:', e);
            }
        }
    }, []);

    useEffect(() => {
        // Actualizar historial cuando cambia la ruta
        if (!pathname) return;

        const newItem: BreadcrumbItem = {
            label: getPageLabel(pathname),
            path: pathname,
            timestamp: Date.now()
        };

        setHistory(prev => {
            // Evitar duplicados consecutivos
            if (prev.length > 0 && prev[prev.length - 1].path === pathname) {
                return prev;
            }

            // Agregar nuevo item y limitar tamaño
            const updated = [...prev, newItem].slice(-MAX_HISTORY);
            
            // Guardar en localStorage
            localStorage.setItem('cognetica-breadcrumb-history', JSON.stringify(updated));
            
            return updated;
        });
    }, [pathname]);

    const getPageLabel = (path: string): string => {
        if (path === '/cognetica') return 'Raíz';
        if (path === '/cognetica/nuevo') return 'Nuevo Artefacto';
        if (path.startsWith('/cognetica/') && path.split('/').length === 3) {
            // Es una página de detalle, extraer ID corto
            const id = path.split('/')[2];
            return `Artefacto ${id.slice(0, 8)}...`;
        }
        return 'Página';
    };

    const handleNavigate = (path: string, index: number) => {
        // Navegar a la ruta
        router.push(path);
        
        // Truncar historial hasta ese punto
        setHistory(prev => {
            const truncated = prev.slice(0, index + 1);
            localStorage.setItem('cognetica-breadcrumb-history', JSON.stringify(truncated));
            return truncated;
        });
    };

    const handleGoHome = () => {
        router.push('/cognetica');
        // Limpiar historial
        setHistory([]);
        localStorage.removeItem('cognetica-breadcrumb-history');
    };

    // No mostrar breadcrumb si solo hay un item o estamos en la raíz
    if (history.length <= 1 || pathname === '/cognetica') {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border text-sm">
            {/* Botón Home */}
            <button
                onClick={handleGoHome}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
                title="Volver a raíz"
            >
                <Home className="w-4 h-4" />
            </button>

            <ChevronRight className="w-4 h-4 text-muted-foreground" />

            {/* Historial de navegación */}
            {history.map((item, index) => (
                <div key={`${item.path}-${item.timestamp}`} className="flex items-center gap-2">
                    <button
                        onClick={() => handleNavigate(item.path, index)}
                        className={`px-2 py-1 rounded transition-colors ${
                            index === history.length - 1
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted text-muted-foreground'
                        }`}
                        disabled={index === history.length - 1}
                    >
                        <StandardText size="sm" weight={index === history.length - 1 ? "medium" : "normal"}>
                            {item.label}
                        </StandardText>
                    </button>
                    
                    {index < history.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            ))}
        </div>
    );
}
