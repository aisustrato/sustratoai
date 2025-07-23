"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/app/auth/client";
import { useAuth } from "@/app/auth-provider";
import { getBatchDetailsForReview } from "@/lib/actions/preclassification-actions";
import type { BatchDetails, ArticleForReview } from "@/lib/actions/preclassification-actions";
import type { Database } from "@/lib/database.types";

type ArticleBatch = Database['public']['Tables']['article_batches']['Row'];
type ArticleBatchItem = Database['public']['Tables']['article_batch_items']['Row'];

// Las funciones de notas ahora se manejan en NoteEditor

// Tipo para los datos de la tabla
interface TableRowData {
	id: string;
	title: string;
	abstract: string;
	ai_summary: string;
	year: string;
	journal: string;
	secondaryTitle: string | null;
	secondaryAbstract: string | null;
	originalArticle: ArticleForReview;
	subRows?: { __isGhost: true }[];
}

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { NoteEditor } from "./components/NoteEditor";
import { ArticleGroupManager } from "./components/ArticleGroupManager";
import { toast } from "sonner";
import { ColumnDef, RowData } from "@tanstack/react-table";
import { 
	ClipboardList, 
	Link, 
	ThumbsDown, 
	CheckCircle,
	RotateCcw,
	StickyNote,
  ArrowRight
} from "lucide-react";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

const BatchDetailPage = () => {
	const params = useParams();
	const auth = useAuth();
	const batchId = params.batchId as string;
	
	const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showOriginalAsPrimary, setShowOriginalAsPrimary] = useState(false);
	// Estados para NoteEditor
	const [noteDialogOpen, setNoteDialogOpen] = useState(false);
	const [currentArticle, setCurrentArticle] = useState<ArticleForReview | null>(null);

	// Función para cargar los detalles del lote
	const loadBatchDetails = useCallback(async () => {
		if (!batchId) return;
		
		setIsLoading(true);
		setError(null);
		
		try {
			const result = await getBatchDetailsForReview(batchId);
			
			if (result.success) {
				setBatchDetails(result.data);
			} else {
				setError(result.error);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setIsLoading(false);
		}
	}, [batchId]);

	// Cargar datos iniciales
	useEffect(() => {
		loadBatchDetails();
	}, [loadBatchDetails]);

	// Suscripción a cambios en tiempo real
	useEffect(() => {
		if (!batchId) return;

		const subscription = supabase
			.channel(`batch-${batchId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "article_batches",
					filter: `id=eq.${batchId}`,
				},
				(payload: RealtimePostgresChangesPayload<ArticleBatch>) => {
					console.log("Cambio detectado en el lote:", payload);
					loadBatchDetails();
				}
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [batchId, loadBatchDetails]);

	// Funciones de manejo de acciones
	const handleOpenDOI = (article: ArticleForReview) => {
		// Asegurarse de que article.article_data existe y es del tipo correcto
		if (article.article_data?.journal) {
			const journalData = article.article_data.journal;
			const url = typeof journalData === 'string' && journalData.startsWith('http') 
				? journalData 
				: `https://doi.org/${journalData}`;
			window.open(url, '_blank');
		} else {
			console.log('No DOI disponible para este artículo');
		}
	};

	const handleDisagree = (article: ArticleForReview) => {
		if (!article.item_id) {
			console.error('ID de artículo no válido');
			return;
		}
		console.log('Desacuerdo marcado para:', article.item_id);
		// TODO: Implementar lógica de desacuerdo en futuras versiones
	};

	const handleValidate = (article: ArticleForReview) => {
		if (!article.item_id) {
			console.error('ID de artículo no válido');
			return;
		}
		console.log('Validación marcada para:', article.item_id);
		// TODO: Implementar lógica de validación en futuras versiones
	};

	// Función para abrir el editor de notas
	const handleOpenNotes = (article: ArticleForReview) => {
		setCurrentArticle(article);
		setNoteDialogOpen(true);
	};

	// Función para cerrar el editor de notas
	const handleCloseNotes = () => {
		setNoteDialogOpen(false);
		setCurrentArticle(null);
	};

	// Configuración de columnas para la tabla
	const tableColumns: ColumnDef<TableRow>[] = [
		// Columna expander (primera columna sticky)
		{ 
			id: 'expander', 
			header: () => null, 
			cell: ({ row }) => row.getCanExpand() ? '' : null, 
			meta: { isSticky: 'left' as const }, 
			size: 40, 
			enableHiding: false 
		},
		{
			id: "title",
			accessorKey: "title",
			header: showOriginalAsPrimary ? "Título Original" : "Título Traducido",
			size: 250,
			meta: { isTruncatable: true },
		},
		{
			id: "abstract",
			accessorKey: "abstract",
			header: showOriginalAsPrimary ? "Abstract Original" : "Abstract Traducido",
			size: 300,
			meta: { isTruncatable: true, tooltipType: "longText" as const },
		},
		{
			id: "ai_summary",
			accessorKey: "ai_summary",
			header: "Resumen del Abstract",
			size: 250,
			meta: { isTruncatable: true, tooltipType: "longText" as const },
		},
		{
			id: "year",
			accessorKey: "year",
			header: "Año",
			size: 80,
			meta: { align: "center" as const },
		},
		{
			id: "journal",
			accessorKey: "journal",
			header: "Revista",
			size: 150,
			meta: { isTruncatable: true },
		},
		{
			id: "actions",
			header: "Acciones",
			size: 200,
			meta: { isSticky: "right" as const },
			cell: ({ row }) => {
				const article = row.original.originalArticle;
				return (
					<div className="flex gap-1">
						<StandardButton
							styleType="outline"
							iconOnly={true}
							onClick={() => handleOpenDOI(article)}
							tooltip="Abrir DOI"
						>
							<Link size={16} />
						</StandardButton>
						<StandardButton
							styleType="outline"
							iconOnly={true}
							onClick={() => handleOpenNotes(article)}
							tooltip="Abrir Notas"
						>
							<StickyNote size={16} />
						</StandardButton>
						<ArticleGroupManager
							article={article}
							project={auth.proyectoActual ? { id: auth.proyectoActual.id, name: auth.proyectoActual.name } : null}
						/>
						<StandardButton
							styleType="outline"
							iconOnly={true}
							onClick={() => handleDisagree(article)}
							tooltip="Marcar desacuerdo"
						>
							<ThumbsDown size={16} />
						</StandardButton>
						<StandardButton
							styleType="outline"
							iconOnly={true}
							onClick={() => handleValidate(article)}
							tooltip="Validar"
						>
							<CheckCircle size={16} />
						</StandardButton>
					</div>
				);
			},
		},
	];

	// Transformar datos para la tabla
	const tableData: TableRow[] = batchDetails?.rows.map((article: ArticleForReview) => {
		const primaryTitle = showOriginalAsPrimary 
			? article.article_data.original_title 
			: article.article_data.translated_title;
		const primaryAbstract = showOriginalAsPrimary 
			? article.article_data.original_abstract 
			: article.article_data.translated_abstract;
		
		const secondaryTitle = showOriginalAsPrimary 
			? article.article_data.translated_title 
			: article.article_data.original_title;
		const secondaryAbstract = showOriginalAsPrimary 
			? article.article_data.translated_abstract 
			: article.article_data.original_abstract;

		// Verificar si hay contenido secundario para mostrar el expander
		const hasSecondaryContent = secondaryTitle || secondaryAbstract;

		const rowData: TableRowData = {
			id: article.item_id,
			title: primaryTitle || "Sin título",
			abstract: primaryAbstract || "Sin abstract",
			ai_summary: article.article_data.translation_summary || "Sin resumen",
			year: article.article_data.publication_year?.toString() || "N/A",
			journal: article.article_data.journal || "N/A",
			// Datos adicionales para el sub-componente
			secondaryTitle,
			secondaryAbstract,
			// Referencia al artículo original para las acciones
			originalArticle: article,
		};

		// Agregar subRows si hay contenido secundario (para habilitar expander)
		if (hasSecondaryContent) {
			rowData.subRows = [{ __isGhost: true }];
		}

		// Crear la fila con la estructura que espera tanstack/table
		return {
		  ...rowData,
		  original: rowData,
		  getValue: (key: string) => (rowData as any)[key],
		  renderValue: (key: string) => (rowData as any)[key]
		} as TableRow;
	}) || [];

	// Definir un tipo para la fila de la tabla que extienda RowData para compatibilidad con tanstack/table
	interface TableRow extends TableRowData {
	  // Propiedades adicionales requeridas por tanstack/table
	  original: TableRowData;
	  getValue: (key: string) => any;
	  renderValue: (key: string) => any;
	  // Hacer que la interfaz sea compatible con RowData
	  [key: string]: any;
	  [key: number]: any;
	  [key: symbol]: any;
	}

	// Función para renderizar el sub-componente expandible
	const renderSubComponent = (row: { original: TableRow }) => {
	  const { secondaryTitle, secondaryAbstract } = row.original;
	  
	  if (!secondaryTitle && !secondaryAbstract) {
	    return null;
	  }

	  return (
	    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
	      <div className="space-y-3">
	        {secondaryTitle && (
	          <div>
	            <StandardText size="sm" className="font-medium text-gray-600 dark:text-gray-400">
	              {showOriginalAsPrimary ? "Título Traducido:" : "Título Original:"}
	            </StandardText>
	            <StandardText size="sm" className="mt-1">
	              {secondaryTitle}
	            </StandardText>
	          </div>
	        )}
	        {secondaryAbstract && (
	          <div>
	            <StandardText size="sm" className="font-medium text-gray-600 dark:text-gray-400">
	              {showOriginalAsPrimary ? "Abstract Traducido:" : "Abstract Original:"}
	            </StandardText>
	            <StandardText size="sm" className="mt-1">
	              {secondaryAbstract}
	            </StandardText>
	          </div>
	        )}
	      </div>
	    </div>
	  );
	};

	if (isLoading) {
		return (
			<div className="w-full h-full p-4 sm:p-6 flex flex-col">
				<StandardPageTitle
					title="Detalle de Lote"
					mainIcon={ClipboardList}
					subtitle="Cargando detalles del lote..."
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: "Detalle de Lote" },
					]}
				/>
				<div className="mt-6 flex-grow flex flex-col items-center justify-center gap-6">
					<SustratoLoadingLogo 
						size={80}
						variant="spin-pulse"
						speed="normal"
						showText={true}
						text="Cargando artículos del lote..."
						className="mb-4"
					/>
					<StandardText className="text-gray-500 dark:text-gray-400">
						Por favor espera mientras cargamos los artículos...
					</StandardText>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full h-full p-4 sm:p-6 flex flex-col">
				<StandardPageTitle
					title="Error"
					mainIcon={ClipboardList}
					subtitle="Error al cargar el lote"
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: "Error" },
					]}
				/>
				<div className="mt-6 flex-grow flex items-center justify-center">
					<StandardCard title="Error">
						<StandardCard.Content>
							<StandardText colorScheme="danger">{error}</StandardText>
						</StandardCard.Content>
					</StandardCard>
				</div>
			</div>
		);
	}

	if (!batchDetails || batchDetails.rows.length === 0) {
		return (
			<div className="w-full h-full p-4 sm:p-6 flex flex-col">
				<StandardPageTitle
					title="Detalle de Lote"
					mainIcon={ClipboardList}
					subtitle="No hay artículos en este lote"
					showBackButton={{ href: "/articulos/preclasificacion" }}
					breadcrumbs={[
						{ label: "Artículos", href: "/articulos" },
						{ label: "Preclasificación", href: "/articulos/preclasificacion" },
						{ label: "Detalle de Lote" },
					]}
				/>
				<div className="mt-6 flex-grow flex items-center justify-center">
					<StandardText>No hay artículos para mostrar en este lote.</StandardText>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full p-4 sm:p-6 flex flex-col">
			<StandardPageTitle
				title={`Preclasificación Lote #${batchDetails.batch_number || batchId}`}
				mainIcon={ClipboardList}
				subtitle={`${batchDetails.rows.length} artículo${batchDetails.rows.length !== 1 ? 's' : ''} en revisión`}
				showBackButton={{ href: "/articulos/preclasificacion" }}
				breadcrumbs={[
					{ label: "Artículos", href: "/articulos" },
					{ label: "Preclasificación", href: "/articulos/preclasificacion" },
					{ label: `Preclasificación Lote #${batchDetails.batch_number || batchId}` },
				]}
			/>
			
			<div className="mt-6 flex-grow flex flex-col gap-4">
				{/* Botón de inversión de vista */}
				<div className="flex justify-end">
					<StandardButton
						styleType="outline"
						onClick={() => setShowOriginalAsPrimary(!showOriginalAsPrimary)}
						className="flex items-center gap-2"
            leftIcon= {RotateCcw}
					>
						
						{showOriginalAsPrimary ? "Idioma Español" : "Idioma Original"}
					</StandardButton>
				</div>

				{/* Tabla principal */}
				<div className="flex-grow">
					<StandardTable
						data={tableData}
						columns={tableColumns}
						renderSubComponent={renderSubComponent}
						isStickyHeader={true}
						enableTruncation={true}
						filterPlaceholder="Buscar artículos..."
					>
						<StandardTable.Table />
					</StandardTable>
				</div>
			</div>

			{/* NoteEditor Component */}
			<NoteEditor
				open={noteDialogOpen}
				onClose={handleCloseNotes}
				article={currentArticle}
				project={auth.proyectoActual ? { id: auth.proyectoActual.id, name: auth.proyectoActual.name } : null}
				showOriginalAsPrimary={showOriginalAsPrimary}
			/>
		</div>
	);
};

export default BatchDetailPage;
