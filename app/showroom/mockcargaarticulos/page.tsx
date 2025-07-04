"use client";

import React, { useMemo, useState, useRef } from "react";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { FileText, Link as LinkIcon, UploadCloud } from "lucide-react";
import { uploadAndProcessArticles } from "@/app/actions/mock-article-actions";
import Papa from "papaparse";

// --- 1. TIPOS Y DATOS MOCK --- 

// Definimos un tipo para representar la estructura de un artículo del CSV
type Article = {
  'Publication Type': string;
  Authors: string;
  'Author Full Names': string;
  Title: string;
  Journal: string;
  Abstract: string;
  ORCIDs?: string;
  ISSN?: string;
  eISSN?: string;
  ISBN?: string;
  'Publication Date': string;
  Publication_Year: number;
  Volume?: string;
  Issue?: string;
  'Special Issue'?: string;
  'Start Page'?: string;
  'End Page'?: string;
  'Article Number'?: string;
  DOI: string;
  'DOI Link': string;
  'UT (Unique WOS ID)': string;
  subRows?: Article[]; // Propiedad para habilitar el expansor
};

// Datos extraídos y adaptados de ejemplo.csv
const mockArticleData: Article[] = [
  {
    'Publication Type': 'J',
    Authors: 'Ngarambe, R; Sagahutu, JB; Nuhu, A; Tumusiime, DK',
    'Author Full Names': 'Ngarambe, Robert; Sagahutu, Jean Baptiste; Nuhu, Assuman; Tumusiime, David K.',
    Title: 'The status and use of prosthetic devices by persons with lower limb amputation in Rwanda',
    Journal: 'AFRICAN JOURNAL OF DISABILITY',
    Abstract: 'Background: Amputation is one of the leading causes of disabilities because of reduced mobility...',
    ORCIDs: '',
    ISSN: '2223-9170',
    eISSN: '2226-7220',
    ISBN: '',
    'Publication Date': 'DEC 9',
    Publication_Year: 2022,
    Volume: '11',
    Issue: '',
    'Special Issue': '',
    'Start Page': '',
    'End Page': '',
    'Article Number': 'a1081',
    DOI: '10.4102/ajod.v11i0.1081',
    'DOI Link': 'http://dx.doi.org/10.4102/ajod.v11i0.1081',
    'UT (Unique WOS ID)': 'WOS:000905106800001',
    subRows: [{} as Article], // Hack para forzar el expansor
  },
  {
    'Publication Type': 'J',
    Authors: 'Routhier, F; Ben Mortenson, W; Demers, L; Mahmood, A; Chaudhury, H; Ginis, KAM; Miller, WC',
    'Author Full Names': 'Routhier, Francois; Ben Mortenson, W.; Demers, Louise; Mahmood, Atiya; Chaudhury, Habib; Ginis, Kathleen A. Martin; Miller, William C.',
    Title: 'Mobility and Participation of People With Disabilities Using Mobility Assistive Technologies: Protocol for a Mixed-Methods Study',
    Journal: 'JMIR RESEARCH PROTOCOLS',
    Abstract: 'Background: Many community-dwelling individuals living with a disability use mobility assistive technologies (MATs)...',
    ORCIDs: 'Mortenson, W Ben/0000-0002-0183-6163; Miller, William/0000-0003-3060-0210; Chaudhury, Habib/0000-0001-5770-3776; Routhier, Francois/0000-0002-5458-6233; MARTIN GINIS, KATHLEEN/0000-0002-7076-3594',
    ISSN: '1929-0748',
    eISSN: '',
    ISBN: '',
    'Publication Date': 'APR',
    Publication_Year: 2019,
    Volume: '8',
    Issue: '4',
    'Special Issue': '',
    'Start Page': '',
    'End Page': '',
    'Article Number': 'e12089',
    DOI: '10.2196/12089',
    'DOI Link': 'http://dx.doi.org/10.2196/12089',
    'UT (Unique WOS ID)': 'WOS:000466496800035',
    subRows: [{} as Article], // Hack para forzar el expansor
  },
  {
    'Publication Type': 'J',
    Authors: 'Naidoo, V; Putnam, M; Spindel, A',
    'Author Full Names': 'Naidoo, Vishaya; Putnam, Michelle; Spindel, Andria',
    Title: 'Key focal areas for bridging the fields of aging and disability: findings from the growing older with a disability conference',
    Journal: 'INTERNATIONAL JOURNAL OF INTEGRATED CARE',
    Abstract: 'Based upon research presented at the 2011 Festival of International Conferences on Caregiving, Disability, Aging and Technology (FICCDAT)...',
    ORCIDs: '',
    ISSN: '1568-4156',
    eISSN: '',
    ISBN: '',
    'Publication Date': 'OCT-DEC',
    Publication_Year: 2012,
    Volume: '12',
    Issue: '',
    'Special Issue': '',
    'Start Page': '',
    'End Page': '',
    'Article Number': '',
    DOI: '',
    'DOI Link': '',
    'UT (Unique WOS ID)': 'WOS:000311842300008',
    subRows: [{} as Article], // Hack para forzar el expansor
  },
];

// --- 2. LÓGICA DEL COMPONENTE DE PÁGINA ---

export default function MockCargaArticulosPage() {
  const [articles, setArticles] = useState<Article[]>(mockArticleData);
  const [fileName, setFileName] = useState<string | null>('ejemplo_articulos.csv (datos de muestra)');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setArticles([]); // Limpiar datos anteriores mientras se parsea

    Papa.parse<Article>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Asegurar que subRows se añada para la funcionalidad del expansor
        const parsedArticles = results.data.map(article => ({
          ...article,
          subRows: [{} as Article] 
        }));
        setArticles(parsedArticles);
      },
      error: (error) => {
        console.error('Error parseando el CSV:', error);
        setFileName('Error al leer el archivo');
        setArticles(mockArticleData); // Restaurar datos de muestra en caso de error
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmUpload = async () => {
    if (articles.length === 0 || articles.every(a => !a.Title)) {
      setUploadStatus({ success: false, message: "No hay artículos válidos para subir. Por favor, carga un archivo CSV con datos." });
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);

    try {
      const result = await uploadAndProcessArticles(articles);
      setUploadStatus({ success: result.success, message: result.message });
    } catch (error) {
      console.error("Error al llamar a la acción del servidor:", error);
      setUploadStatus({ success: false, message: "Ocurrió un error de conexión con el servidor." });
    } finally {
      setIsLoading(false);
    }
  };

  // Definición de columnas para la tabla, basado en el requerimiento
  const columns = useMemo<ColumnDef<Article>[]>(() => [
    { 
      id: 'expander',
      header: () => null,
      cell: ({ row }) => row.getCanExpand() ? '' : null,
      size: 40,
      meta: { isSticky: 'left' }
    },
    { accessorKey: 'Title', header: 'Título', size: 350, meta: { isTruncatable: true } },
    { accessorKey: 'Abstract', header: 'Abstract', size: 400, meta: { isTruncatable: true, tooltipType: 'longText' } },
    { accessorKey: 'Authors', header: 'Autores', size: 250, meta: { isTruncatable: true } },
    { accessorKey: 'Publication_Year', header: 'Año', size: 80, meta: { align: 'center' } },
    { accessorKey: 'Journal', header: 'Journal', size: 200, meta: { isTruncatable: true } },
    {
      accessorKey: 'DOI',
      header: 'DOI',
      cell: (info) => {
        const doi = info.getValue<string>();
        if (!doi) return null;
        return (
          <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-pure hover:underline">
            <LinkIcon size={14} />
            <span>{doi}</span>
          </a>
        );
      },
      size: 150,
      meta: { isSticky: 'right' }
    },
  ], []);

  // Función para renderizar la sub-fila con metadatos adicionales
  const renderSubComponent = (row: Row<Article>) => {
    const { original: article } = row;
    return (
      <div className="p-4 bg-neutral-bg/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <div className="col-span-full">
            <StandardText preset="subtitle" weight="medium" className="mb-2 flex items-center gap-2">
                <FileText size={16}/> 
                Metadatos Adicionales
            </StandardText>
        </div>
        <div>
            <StandardText preset="caption" color="neutral" weight="bold">WOS ID (UT)</StandardText>
            <StandardText>{article['UT (Unique WOS ID)'] || 'N/A'}</StandardText>
        </div>
        <div>
            <StandardText preset="caption" color="neutral" weight="bold">eISSN</StandardText>
            <StandardText>{article.eISSN || 'N/A'}</StandardText>
        </div>
        <div>
            <StandardText preset="caption" color="neutral" weight="bold">ISSN</StandardText>
            <StandardText>{article.ISSN || 'N/A'}</StandardText>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <StandardPageTitle 
        title="Carga Masiva de Artículos"
        description="Sube un archivo CSV para cargar todos los artículos de tu proyecto en un solo paso."
      />

      {/* Vista A: Interfaz de Carga (Mock) */}
      <StandardCard className="mt-6" colorScheme="neutral" styleType="subtle">
        <StandardCard.Header>
          <StandardCard.Title>Previsualización de Carga</StandardCard.Title>
          <StandardCard.Subtitle>
            Estos son los datos extraídos del archivo CSV. Revisa que las columnas y los datos sean correctos antes de confirmar la carga.
          </StandardCard.Subtitle>
        </StandardCard.Header>
        <StandardCard.Content>
          <div className="border border-dashed border-neutral-stroke rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3 bg-neutral-bg/20">
            <UploadCloud size={32} className="text-neutral-text-weak" />
            <div>
              <StandardButton
                styleType="link"
                colorScheme="primary"
                onClick={handleUploadClick}
                className="font-semibold"
              >
                Haz clic para subir un archivo
              </StandardButton>
              <StandardText preset="caption" asElement="span"> o arrástralo y suéltalo aquí</StandardText>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            {fileName && (
              <StandardText preset="caption" className="mt-2">
                Archivo cargado: <StandardBadge styleType='subtle' colorScheme='primary'>{fileName}</StandardBadge>
              </StandardText>
            )}
          </div>

          <div className="overflow-x-auto mt-6">
            <StandardTable
              data={articles}
              columns={columns}
              renderSubComponent={renderSubComponent}
              filterPlaceholder="Buscar por título, autor, journal..."
              enableTruncation={true}
              isStickyHeader={true}
              stickyOffset={64}
            >
                <StandardTable.Table />
            </StandardTable>
          </div>
        </StandardCard.Content>
        <StandardCard.Footer>
          <div className="flex justify-end gap-3">
              <StandardButton styleType="outline" disabled={isLoading}>Cancelar</StandardButton>
              <StandardButton 
                colorScheme="primary" 
                leftIcon={UploadCloud} 
                onClick={handleConfirmUpload}
                loading={isLoading}
              >
                  {isLoading ? 'Subiendo...' : 'Subir y Guardar Datos'}
              </StandardButton>
          </div>
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm text-center ${uploadStatus.success ? 'bg-success-bg/50 text-success-text' : 'bg-danger-bg/50 text-danger-text'}`}>
              {uploadStatus.message}
            </div>
          )}
        </StandardCard.Footer>
      </StandardCard>
    </div>
  );
}
