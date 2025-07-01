//. 📍 app/datos-maestros/cargar-articulos/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import type { ResultadoOperacion } from '@/lib/actions/batch-actions';

import ArticleUploaderPage from './components/ArticleUploaderPage';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from '@/components/ui/StandardText';
import { StandardIcon } from '@/components/ui/StandardIcon';
import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import { FileUp, AlertTriangle, Info } from 'lucide-react';

// Definición local del tipo Article
type Article = {
  'Publication Type': string;
  'Authors': string;
  'Author Full Names': string;
  'Title': string;
  'Jurnal': string;
  'Abstract': string;
  'ORCIDs': string;
  'ISSN': string;
  'eISSN': string;
  'ISBN': string;
  'Publication Date': string;
  'Publication_Year': string;
  'Volume': string;
  'Issue': string;
  'Special Issue': string;
  'Start Page': string;
  'End Page': string;
  'Article Number': string;
  'DOI': string;
  'DOI Link': string;
  'UT (Unique WOS ID)'?: string;
};

// Implementación local de las funciones necesarias
const checkProjectHasArticles = async (projectId: string): Promise<ResultadoOperacion<{ hasArticles: boolean; count: number }>> => {
  try {
    const response = await fetch(`/api/projects/${projectId}/articles/count`);
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Error al verificar artículos', errorCode: data.errorCode };
    }
    
    return { 
      success: true, 
      data: { 
        hasArticles: data.count > 0, 
        count: data.count 
      } 
    };
  } catch (error) {
    console.error('Error al verificar artículos:', error);
    return { 
      success: false, 
      error: 'Error al conectar con el servidor', 
      errorCode: 'CONNECTION_ERROR' 
    };
  }
};

const createArticlesForProject = async (projectId: string, articles: Article[]): Promise<ResultadoOperacion<any>> => {
  try {
    const response = await fetch(`/api/projects/${projectId}/articles/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ articles }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Error al guardar artículos', 
        errorCode: data.errorCode 
      };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error al guardar artículos:', error);
    return { 
      success: false, 
      error: 'Error al conectar con el servidor', 
      errorCode: 'CONNECTION_ERROR' 
    };
  }
};
//#endregion

//#region [main] - 🔧 COMPONENT 🔧
export default function CargarArticulosOrquestador() {
  const { proyectoActual, user, authLoading } = useAuth();
  const router = useRouter();

  const [checkingArticles, setCheckingArticles] = useState(true);
  const [hasArticles, setHasArticles] = useState(false);
  const [articleCount, setArticleCount] = useState(0);

  const permisoCargarArticulos = proyectoActual?.permissions?.can_create_batches || false;

  useEffect(() => {
    if (proyectoActual) {
      setCheckingArticles(true);
      checkProjectHasArticles(proyectoActual.id)
        .then(result => {
          if (result.success) {
            setHasArticles(result.data.hasArticles);
            setArticleCount(result.data.count);
          } else {
            console.error(result.error);
            setHasArticles(false);
          }
        })
        .finally(() => {
          setCheckingArticles(false);
        });
    } else {
      setCheckingArticles(false);
    }
  }, [proyectoActual]);

  const handleSaveArticles = async (articles: Article[]): Promise<ResultadoOperacion<any>> => {
    if (!proyectoActual) {
      return { success: false, error: "No hay un proyecto seleccionado.", errorCode: "NO_PROJECT" };
    }
    const result = await createArticlesForProject(proyectoActual.id, articles);
    if (result.success) {
      router.push('/datos-maestros');
    }
    return result;
  };

  if (authLoading || (proyectoActual && checkingArticles)) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SustratoLoadingLogo text={authLoading ? "Verificando sesión y permisos..." : "Consultando artículos existentes..."} />
      </div>
    );
  }

  if (!proyectoActual) {
    return (
      <div>
        <StandardPageTitle 
        title="Cargar Artículos"
        subtitle="Carga masiva de artículos"
        description="Sube archivos (por ejemplo, en formato .bib) para añadir múltiples artículos al proyecto de una sola vez."
        mainIcon={FileUp}
      />
        <StandardCard
          colorScheme="primary"
          styleType="subtle"
          className="mt-6 text-center max-w-lg mx-auto p-8"
        >
          <StandardCard.Header className="items-center flex flex-col">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 mb-4">
              <StandardIcon><AlertTriangle className="h-6 w-6 text-warning-600" /></StandardIcon>
            </div>
            <StandardText size="lg" weight="bold" colorScheme="warning">Proyecto No Seleccionado</StandardText>
          </StandardCard.Header>
          <StandardCard.Content><StandardText>Por favor, selecciona un proyecto activo para la carga de artículos.</StandardText></StandardCard.Content>
        </StandardCard>
      </div>
    );
  }

  return (
    <div>
      <StandardPageTitle 
        title="Cargar Artículos"
        subtitle="Carga masiva de artículos"
        description="Sube archivos (por ejemplo, en formato .bib) para añadir múltiples artículos al proyecto de una sola vez."
        mainIcon={FileUp}
      />
      {!permisoCargarArticulos ? (
        <StandardCard
          colorScheme="primary"
          styleType="subtle"
          className="mt-6 text-center max-w-lg mx-auto p-8"
        >
          <StandardCard.Header className="items-center flex flex-col">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 mb-4">
              <StandardIcon><AlertTriangle className="h-6 w-6 text-danger-600" /></StandardIcon>
            </div>
            <StandardText size="lg" weight="bold" colorScheme="danger">Acceso Denegado</StandardText>
          </StandardCard.Header>
          <StandardCard.Content><StandardText>No tienes los permisos necesarios para cargar artículos en este proyecto.</StandardText></StandardCard.Content>
        </StandardCard>
      ) : hasArticles ? (
        <StandardCard
          colorScheme="primary"
          styleType="subtle"
          className="mt-6 text-center max-w-lg mx-auto p-8"
        >
          <StandardCard.Header className="items-center flex flex-col">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 mb-4">
              <StandardIcon><Info className="h-6 w-6 text-primary-600" /></StandardIcon>
            </div>
            <StandardText size="lg" weight="bold" colorScheme="primary">Carga Bloqueada</StandardText>
          </StandardCard.Header>
          <StandardCard.Content><StandardText>Este proyecto ya contiene {articleCount} artículo(s). No se pueden añadir nuevos artículos mediante carga masiva.</StandardText></StandardCard.Content>
        </StandardCard>
      ) : (
        <ArticleUploaderPage 
          projectName={proyectoActual.name}
          onSave={handleSaveArticles}
        />
      )}
    </div>
  );
}
//#endregion
