//. 📍 app/articulos/preclasificacion/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * Página para la preclasificación de artículos.
 * Permite a los usuarios revisar y clasificar los artículos según criterios de inclusión/exclusión.
 */

import { useState } from 'react';
import { useAuth } from '@/app/auth-provider';
import { toast } from 'sonner';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardText } from '@/components/ui/StandardText';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { FileCheck, CheckCircle, XCircle, FileText } from 'lucide-react';

// --- Tipos Locales ---
interface Article {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  abstract: string;
  status: 'pending' | 'included' | 'excluded';
  exclusionReason?: string;
}

// --- Datos de ejemplo ---
const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'Efectos de la intervención en la salud mental',
    authors: 'Pérez, J.; González, M.; López, A.',
    year: 2023,
    journal: 'Revista de Psicología Clínica',
    abstract: 'Estudio sobre los efectos de una intervención en salud mental en población adulta...',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Análisis de estrategias de intervención temprana',
    authors: 'Rodríguez, S.; Martínez, L.',
    year: 2022,
    journal: 'Journal of Early Intervention',
    abstract: 'Revisión sistemática de estrategias de intervención temprana en niños...',
    status: 'pending',
  },
  // Puedes agregar más artículos de ejemplo aquí
];

// --- Componente Principal ---
export default function PreclasificacionPage() {
  const { proyectoActual } = useAuth();
  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exclusionReason, setExclusionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentArticle = articles[currentIndex];
  const hasNext = currentIndex < articles.length - 1;
  const hasPrevious = currentIndex > 0;

  // Manejar inclusión de artículo
  const handleInclude = () => {
    if (!currentArticle) return;
    
    const updatedArticles = [...articles];
    updatedArticles[currentIndex] = {
      ...currentArticle,
      status: 'included',
      exclusionReason: undefined
    };
    
    setArticles(updatedArticles);
    goToNext();
  };

  // Manejar exclusión de artículo
  const handleExclude = () => {
    if (!currentArticle || !exclusionReason) {
      toast.error('Por favor, ingresa un motivo de exclusión');
      return;
    }
    
    const updatedArticles = [...articles];
    updatedArticles[currentIndex] = {
      ...currentArticle,
      status: 'excluded',
      exclusionReason
    };
    
    setArticles(updatedArticles);
    setExclusionReason('');
    goToNext();
  };

  // Navegar al siguiente artículo
  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success('¡Has terminado de revisar todos los artículos!');
    }
  };

  // Navegar al artículo anterior
  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica para guardar en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación de llamada a la API
      toast.success('Clasificación guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar la clasificación:', error);
      toast.error('Error al guardar la clasificación');
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay artículos
  if (articles.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <StandardPageTitle
          title="Preclasificación de Artículos"
          description="No hay artículos para revisar en este momento."
          breadcrumbs={[
            { label: 'Artículos', href: '/articulos' },
            { label: 'Preclasificación' }
          ]}
        />
        <StandardCard className="text-center py-12">
          <StandardIcon icon={FileText} size="xl" className="mx-auto mb-4 text-muted-foreground" />
          <StandardText variant="subtitle" className="mb-2">No hay artículos para revisar</StandardText>
          <StandardText variant="body" className="text-muted-foreground mb-6">
            No se encontraron artículos pendientes de preclasificación.
          </StandardText>
          <StandardButton asChild>
            <a href="/articulos/cargar">Cargar artículos</a>
          </StandardButton>
        </StandardCard>
      </div>
    );
  }

  // Si hay artículos pero el índice actual es inválido
  if (!currentArticle) {
    return (
      <div className="container mx-auto py-8">
        <StandardPageTitle
          title="Preclasificación de Artículos"
          description="Revisión completada"
          breadcrumbs={[
            { label: 'Artículos', href: '/articulos' },
            { label: 'Preclasificación' }
          ]}
        />
        <StandardCard className="text-center py-12">
          <StandardIcon icon={CheckCircle} size="xl" className="mx-auto mb-4 text-green-500" />
          <StandardText variant="subtitle" className="mb-2">¡Revisión completada!</StandardText>
          <StandardText variant="body" className="text-muted-foreground mb-6">
            Has revisado todos los artículos pendientes.
          </StandardText>
          <div className="flex justify-center gap-4">
            <StandardButton variant="outline" asChild>
              <a href="/articulos">Volver a Artículos</a>
            </StandardButton>
            <StandardButton onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </StandardButton>
          </div>
        </StandardCard>
      </div>
    );
  }

  // Vista normal de preclasificación
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Preclasificación de Artículos"
        description="Revisa y clasifica los artículos según los criterios de inclusión y exclusión"
        breadcrumbs={[
          { label: 'Artículos', href: '/articulos' },
          { label: 'Preclasificación' }
        ]}
      />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <StandardText variant="small" className="text-muted-foreground">
            Artículo {currentIndex + 1} de {articles.length}
          </StandardText>
          <div className="flex gap-2">
            <StandardButton variant="outline" size="sm" onClick={goToPrevious} disabled={!hasPrevious}>
              Anterior
            </StandardButton>
            <StandardButton variant="outline" size="sm" onClick={goToNext} disabled={!hasNext}>
              Siguiente
            </StandardButton>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / articles.length) * 100}%` }}
          />
        </div>
      </div>

      <StandardCard className="mb-6">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{currentArticle.title}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
              <span>{currentArticle.authors}</span>
              <span>•</span>
              <span>{currentArticle.journal}</span>
              <span>•</span>
              <span>{currentArticle.year}</span>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Resumen</h3>
              <p className="text-sm">{currentArticle.abstract}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <StandardButton 
                variant="outline" 
                className="w-full justify-start text-left py-6"
                onClick={handleInclude}
              >
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Incluir</div>
                  <div className="text-xs text-muted-foreground">Cumple con los criterios de inclusión</div>
                </div>
              </StandardButton>
            </div>
            
            <div>
              <StandardButton 
                variant="outline" 
                className="w-full justify-start text-left py-6 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={() => document.getElementById('exclusion-modal')?.showModal()}
              >
                <XCircle className="mr-2 h-5 w-5 text-red-500" />
                <div className="text-left">
                  <div className="font-medium">Excluir</div>
                  <div className="text-xs text-muted-foreground">No cumple con los criterios de inclusión</div>
                </div>
              </StandardButton>
            </div>
          </div>
        </div>
      </StandardCard>

      {/* Modal de exclusión */}
      <dialog id="exclusion-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Motivo de exclusión</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Por favor, selecciona el motivo por el cual este artículo no cumple con los criterios de inclusión:
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input 
                  type="radio" 
                  name="exclusion-reason" 
                  className="radio radio-primary" 
                  value="Fuera del alcance"
                  onChange={(e) => setExclusionReason(e.target.value)}
                  checked={exclusionReason === 'Fuera del alcance'}
                />
                <span className="label-text">Fuera del alcance del estudio</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input 
                  type="radio" 
                  name="exclusion-reason" 
                  className="radio radio-primary" 
                  value="Población no coincide"
                  onChange={(e) => setExclusionReason(e.target.value)}
                  checked={exclusionReason === 'Población no coincide'}
                />
                <span className="label-text">Población no coincide con los criterios</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input 
                  type="radio" 
                  name="exclusion-reason" 
                  className="radio radio-primary" 
                  value="Intervención diferente"
                  onChange={(e) => setExclusionReason(e.target.value)}
                  checked={exclusionReason === 'Intervención diferente'}
                />
                <span className="label-text">Intervención diferente a la de interés</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input 
                  type="radio" 
                  name="exclusion-reason" 
                  className="radio radio-primary" 
                  value="Sin texto completo"
                  onChange={(e) => setExclusionReason(e.target.value)}
                  checked={exclusionReason === 'Sin texto completo'}
                />
                <span className="label-text">No se encontró el texto completo</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input 
                  type="radio" 
                  name="exclusion-reason" 
                  className="radio radio-primary" 
                  value="Otro"
                  onChange={(e) => setExclusionReason(e.target.value)}
                  checked={exclusionReason === 'Otro'}
                />
                <span className="label-text">Otro (especificar)</span>
              </label>
              {exclusionReason === 'Otro' && (
                <textarea 
                  className="textarea textarea-bordered mt-2 w-full" 
                  placeholder="Especifica el motivo de exclusión"
                  value={exclusionReason}
                  onChange={(e) => setExclusionReason(e.target.value)}
                />
              )}
            </div>
          </div>
          
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost mr-2">Cancelar</button>
              <button 
                className="btn btn-error"
                onClick={(e) => {
                  e.preventDefault();
                  if (exclusionReason) {
                    handleExclude();
                    (document.getElementById('exclusion-modal') as HTMLDialogElement)?.close();
                  } else {
                    toast.error('Por favor, selecciona un motivo de exclusión');
                  }
                }}
              >
                Confirmar exclusión
              </button>
            </form>
          </div>
        </div>
        
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
