"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/app/auth/client";
import { useAuth } from "@/app/auth-provider";
import { getBatchDetailsForReview } from "@/lib/actions/preclassification-actions";
import { useJobManager } from "@/app/contexts/JobManagerContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { BatchDetails, ArticleForReview } from "@/lib/actions/preclassification-actions";
import type { Database } from "@/lib/database.types";

type ArticleBatch = Database['public']['Tables']['article_batches']['Row'];

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

// TableRow se usa implícitamente en ColumnDef<TableRow> - mantener para compatibilidad
// type TableRow = TableRowData;

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { NoteEditor } from "./components/NoteEditor";
import { ArticleGroupManager } from "./components/ArticleGroupManager";

import { TextHighlighter } from "./components/TextHighlighter";
import { ColumnDef } from "@tanstack/react-table";
import { 
	ClipboardList, 
	Link, 
	ThumbsDown, 
	CheckCircle,
	Globe,
	StickyNote,
	Brain
} from "lucide-react";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

const BatchDetailPage = () => {
	const params = useParams();
	const router = useRouter();
	const auth = useAuth();
	const { startJob } = useJobManager();
	useUserProfile(); // Se mantiene el hook por efectos secundarios
	const batchId = params.batchId as string;
	
	const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showOriginalAsPrimary, setShowOriginalAsPrimary] = useState(false);
	// Estados para NoteEditor
	const [noteDialogOpen, setNoteDialogOpen] = useState(false);
	const [currentArticle, setCurrentArticle] = useState<ArticleForReview | null>(null);
	
	// Estados para Preclasificación
	const [isStartingPreclassification, setIsStartingPreclassification] = useState(false);
	
	
	// 📊 Estados para Dimensiones Dinámicas
	interface DimensionType {
		id: string;
		name: string;
		type: 'finite' | 'open';
	}
	
	interface ClassificationType {
		id: string;
		article_batch_item_id: string;
		dimension_id: string;
		classification_value: string | null;
		rationale: string | null;
		confidence_score: number | null;
		iteration: number;
		created_at: string;
		reviewer_id: string;
		reviewer_type: string;
		// Campos calculados para compatibilidad
		ai_value?: string;
		ai_rationale?: string;
	}
	
	const [activeDimensions, setActiveDimensions] = useState<DimensionType[]>([]);
	const [dimensionClassifications, setDimensionClassifications] = useState<Record<string, ClassificationType>>({});

	// 📊 Función para cargar dimensiones activas de la fase
	const loadActiveDimensions = useCallback(async () => {
		if (!batchDetails?.id) return;
		
		try {
			// Obtener la fase activa del proyecto
			const { getActivePhaseForProject } = await import('@/lib/actions/preclassification_phases_actions');
			
			// Necesitamos obtener el project_id del batch
			const supabase = (await import('@/app/auth/client')).supabase;
			const { data: batchData, error: batchError } = await supabase
				.from('article_batches')
				.select('project_id')
				.eq('id', batchDetails.id)
				.single();
			
			if (batchError || !batchData) {
				console.error('Error obteniendo project_id del batch:', batchError);
				return;
			}
			
			// Obtener fase activa
			const activePhaseResult = await getActivePhaseForProject(batchData.project_id);
			if (activePhaseResult.error || !activePhaseResult.data) {
				console.error('Error obteniendo fase activa:', activePhaseResult.error);
				return;
			}
			
			// Cargar dimensiones activas
			const { listDimensions } = await import('@/lib/actions/dimension-actions');
			const dimensionsResult = await listDimensions(activePhaseResult.data.id, false);
			
			if (dimensionsResult.success) {
				setActiveDimensions(dimensionsResult.data);
				console.log('📊 Dimensiones activas cargadas:', dimensionsResult.data.length);
			} else {
				console.error('Error cargando dimensiones:', dimensionsResult.error);
			}
			
		} catch (error) {
			console.error('Error cargando dimensiones activas:', error);
		}
	}, [batchDetails?.id]);
	
	// 📋 Función para cargar clasificaciones de dimensiones
	const loadDimensionClassifications = useCallback(async () => {
		if (!batchId) return;
		
		try {
			const supabase = (await import('@/app/auth/client')).supabase;
			const { data: classifications, error } = await supabase
				.from('article_dimension_reviews')
				.select(`
					*,
					article_batch_items!inner(batch_id),
					preclass_dimensions!inner(name)
				`)
				.eq('article_batch_items.batch_id', batchId)
				.order('iteration', { ascending: false }); // Iteración más alta primero
			
			if (error) {
				console.error('Error cargando clasificaciones:', error);
				return;
			}
			
			// Organizar clasificaciones por artículo y dimensión (solo la iteración más alta)
			const classificationMap: Record<string, ClassificationType> = {};
			classifications?.forEach(classification => {
				const key = `${classification.article_batch_item_id}_${classification.dimension_id}`;
				if (!classificationMap[key] || classificationMap[key].iteration < classification.iteration) {
					classificationMap[key] = classification;
				}
			});
			
			setDimensionClassifications(classificationMap);
			console.log('📋 Clasificaciones cargadas:', Object.keys(classificationMap).length);
		} catch (error) {
			console.error('Error cargando clasificaciones de dimensiones:', error);
		}
	}, [batchId]);

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
	
	// 📊 Cargar dimensiones cuando se cargan los detalles del batch
	useEffect(() => {
		if (batchDetails) {
			loadActiveDimensions();
			loadDimensionClassifications(); // 🔧 CORRECCIÓN CRÍTICA: Cargar clasificaciones existentes
		}
	}, [batchDetails, loadActiveDimensions, loadDimensionClassifications]);

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

	// Suscripción a cambios en article_dimension_reviews para refrescar datos automáticamente
	useEffect(() => {
		if (!batchId) return;

		const reviewsSubscription = supabase
			.channel(`reviews-${batchId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "article_dimension_reviews",
					// Filtrar por artículos que pertenecen a este lote sería ideal,
					// pero por simplicidad refrescaremos en cualquier INSERT
				},
				(payload) => {
					console.log("🔄 Nueva clasificación detectada:", payload);
					// Recargar clasificaciones de dimensiones para actualizar la tabla
					loadDimensionClassifications();
					// Refrescar la página para mostrar los nuevos datos
					router.refresh();
				}
			)
			.subscribe();

		return () => {
			reviewsSubscription.unsubscribe();
		};
	}, [batchId, router, loadDimensionClassifications]);

	// Funciones de manejo de acciones
	const handleOpenDOI = useCallback((article: ArticleForReview) => {
		if (article.article_data?.journal) {
			const journalData = article.article_data.journal;
			const url = typeof journalData === 'string' && journalData.startsWith('http') 
				? journalData 
				: `https://doi.org/${journalData}`;
			window.open(url, '_blank');
		} else {
			console.log('No DOI disponible para este artículo');
		}
	}, []);

	const handleDisagree = useCallback((article: ArticleForReview) => {
		if (!article.item_id) {
			console.error('ID de artículo no válido');
			return;
		}
		console.log('Desacuerdo marcado para:', article.item_id);
		// TODO: Implementar lógica de desacuerdo en futuras versiones
	}, []);

	const handleValidate = useCallback((article: ArticleForReview) => {
		if (!article.item_id) {
			console.error('ID de artículo no válido');
			return;
		}
		console.log('Validación marcada para:', article.item_id);
		// TODO: Implementar lógica de validación en futuras versiones
	}, []);

	// Función para abrir el editor de notas
	const handleOpenNotes = useCallback((article: ArticleForReview) => {
		setCurrentArticle(article);
		setNoteDialogOpen(true);
	}, []);

	// Función para cerrar el editor de notas
	const handleCloseNotes = () => {
		setNoteDialogOpen(false);
		setCurrentArticle(null);
	};

	// Función para iniciar la preclasificación
	const handleStartPreclassification = async () => {
		if (!batchId || !auth.user?.id || !auth.proyectoActual?.id) {
			console.error('Faltan datos necesarios para iniciar la preclasificación');
			return;
		}

		setIsStartingPreclassification(true);
		try {
			// 🎨 ARQUITECTURA LIMPIA: Page solo dispara el trabajo, PreclassificationJobHandler maneja TODO lo demás
			startJob({
				type: 'PRECLASSIFY_BATCH',
				title: `Preclasificación Lote #${batchDetails?.batch_number || batchId}`,
				payload: {
					batchId: batchId,
					userId: auth.user.id,
					projectId: auth.proyectoActual.id,
				},
			});
			
			console.log('🚀 [Page] Trabajo disparado al JobManager. El PreclassificationJobHandler se encarga del resto.');
		} catch (error) {
			console.error('🚨 [Page] Error disparando trabajo:', error);
		} finally {
			setIsStartingPreclassification(false);
		}
	};

	// 📊 Función para generar columnas dinámicas de dimensiones - API NATIVA
	const createDimensionColumns = useCallback((): ColumnDef<TableRow>[] => {
		const columns: ColumnDef<TableRow>[] = [];
		
		activeDimensions.forEach(dimension => {
			// 📊 Columna de Valor de Dimensión - API NATIVA
			columns.push({
				id: `dimension_${dimension.id}`,
				header: dimension.name,
				size: 180,
				// 🔧 CLAVE: accessorFn proporciona el valor para cell.getValue() usado en tooltips
				accessorFn: (row) => {
					const articleBatchItemId = row.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification) {
						return 'Pendiente';
					}
					
					// Mapear confidence score a texto
					const confidenceScore = Number(classification.confidence_score);
					const confidenceText = {
						1: 'Baja',
						2: 'Media',
						3: 'Alta'
					}[confidenceScore as 1 | 2 | 3] || 'N/A';
					
					const displayValue = classification.classification_value || 'Sin valor';
					
					// Valor completo para tooltip
					return `${displayValue} (Confianza: ${confidenceText}) - Iteración: ${classification.iteration}`;
				},
				// 🎨 NUEVA FUNCIÓN CELL: Renderizar con resaltado de palabra clave
				cell: (info) => {
					const row = info.row as { original: TableRowData };
					const articleBatchItemId = row.original.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification) {
						return (
							<TextHighlighter 
								text="Pendiente" 
								keyword={null}
								className="text-neutral-textShade italic"
							/>
						);
					}
					
					const displayValue = classification.classification_value || 'Sin valor';
					
					return (
						<TextHighlighter 
							text={displayValue} 
							keyword={null}
						/>
					);
				},
				meta: { 
					isTruncatable: true,
					enableCopyButton: true,
					tooltipType: 'longText' as const,
					cellVariant: (context) => {
						const row = context.row as { original: TableRowData };
						const articleBatchItemId = row.original.id;
						const classificationKey = `${articleBatchItemId}_${dimension.id}`;
						const classification = dimensionClassifications[classificationKey];
						
						if (!classification) return undefined;
						
						const confidenceScore = Number(classification.confidence_score);
						switch (confidenceScore) {
							case 3: return 'success';   // Verde para confianza alta
							case 2: return 'warning';   // Amarillo para confianza media
							case 1: return 'danger';    // Rojo para confianza baja
							default: return undefined;  // Sin color para casos sin clasificación
						}
					}
				}
			});
			
			// 🔄 Columna de Iteración - API NATIVA (solo si hay iteraciones ≥ 2)
			const hasHighIterations = Object.values(dimensionClassifications).some(classification => 
				classification && classification.iteration && classification.iteration >= 2
			);
			
			if (hasHighIterations) {
				columns.push({
				id: `iteration_${dimension.id}`,
				header: "I",
				size: 50, // Columna pequeña para un solo dígito
				accessorFn: (row) => {
					const articleBatchItemId = row.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification || !classification.iteration) {
						return '0';
					}
					
					return String(classification.iteration);
				},
				cell: (info) => {
					const row = info.row as { original: TableRowData };
					const articleBatchItemId = row.original.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					const iteration = classification?.iteration || 0;
					
					return (
						<div className="flex justify-center items-center text-sm font-medium">
							{iteration}
						</div>
					);
				},
				meta: {
					tooltipType: 'standard' as const
				}
				});
			}
			
			// 📝 Columna de Justificación - API NATIVA
			const dimensionAcronym = dimension.name
				.split(' ')
				.map((word: string) => word.charAt(0).toUpperCase())
				.join('')
				.substring(0, 3);
				
			columns.push({
				id: `justification_${dimension.id}`,
				header: `Justificación ${dimensionAcronym}`,
				size: 300,
				// 🔧 CLAVE: accessorFn para que el tooltip tenga acceso al valor de justificación
				accessorFn: (row) => {
					const articleBatchItemId = row.id;
					const classificationKey = `${articleBatchItemId}_${dimension.id}`;
					const classification = dimensionClassifications[classificationKey];
					
					if (!classification || !classification.rationale) {
						return 'Sin justificación';
					}
					
					// Retornar la justificación completa para el tooltip
					return classification.rationale;
				},
				meta: { 
					isTruncatable: true, 
					enableCopyButton: true,
					tooltipType: "longText" as const 
				}
			});
		});
		
		return columns;
	}, [activeDimensions, dimensionClassifications]);

	// 📊 Configuración final de columnas: base + dimensiones dinámicas
	const tableColumns: ColumnDef<TableRow>[] = useMemo(() => {
		const dimensionColumns = createDimensionColumns();
		
		// Definir columnas base dentro del useMemo
		const baseColumns: ColumnDef<TableRow>[] = [
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
				size: 200,
				meta: { isTruncatable: true },
			},
			// Columna de acciones (sticky derecha)
			{
				id: "actions",
				header: "Acciones",
				size: 200,
				meta: { isSticky: "right" as const },
				enableHiding: false, // 🔧 CRÍTICO: Como en showroom para sticky
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
		
		// Insertar columnas de dimensiones antes de la columna de acciones
		const actionsColumn = baseColumns[baseColumns.length - 1]; // Última columna (acciones)
		const otherColumns = baseColumns.slice(0, -1); // Todas excepto la última
		
		return [
			...otherColumns,
			...dimensionColumns,
			actionsColumn
		];
	}, [createDimensionColumns, showOriginalAsPrimary, handleOpenDOI, handleOpenNotes, handleDisagree, handleValidate, auth.proyectoActual]);

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
		  getValue: (key: string) => (rowData as unknown as Record<string, unknown>)[key],
		  renderValue: (key: string) => (rowData as unknown as Record<string, unknown>)[key]
		} as TableRow;
	}) || [];

	// Definir un tipo para la fila de la tabla que extienda RowData para compatibilidad con tanstack/table
	interface TableRow extends TableRowData {
	  // Propiedades adicionales requeridas por tanstack/table
	  original: TableRowData;
	  getValue: (key: string) => unknown;
	  renderValue: (key: string) => unknown;
	  // Hacer que la interfaz sea compatible con RowData
	  [key: string]: unknown;
	  [key: number]: unknown;
	  [key: symbol]: unknown;
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


	// ✅ ESTRUCTURA CORREGIDA: Eliminar contenedores flex que limitan el scroll
	// Aplicar la misma estructura que funciona en standard-table-final
	return (
		<StandardPageBackground variant="default">
		<div className="p-4 sm:p-6">
			<StandardPageTitle
				title={`Preclasificación Lote #${batchDetails.batch_number || batchId}`}
				mainIcon={ClipboardList}
				subtitle={`${batchDetails.rows.length} artículos en revisión`}
				showBackButton={{ href: "/articulos/preclasificacion" }}
				breadcrumbs={[
					{ label: "Artículos", href: "/articulos" },
					{ label: "Preclasificación", href: "/articulos/preclasificacion" },
					{ label: `Preclasificación Lote #${batchDetails.batch_number || batchId}` },
				]}
			/>
			
			<div className="mt-6 space-y-4">
				{/* Botones de acción */}
				<div className="flex justify-between items-center">
					{/* Sección izquierda: Preclasificación y Resaltado */}
					<div className="flex items-center gap-4">
						{/* Botón de preclasificación - solo visible si el lote está traducido */}
						{batchDetails?.status === 'translated' && (
							<StandardButton
								styleType="solid"
								colorScheme="accent"
								leftIcon={Brain}
								onClick={handleStartPreclassification}
								disabled={isStartingPreclassification}
								className="flex items-center gap-2"
							>
								{isStartingPreclassification ? 'Iniciando...' : 'Iniciar Preclasificación'}
							</StandardButton>
						)}
						

					</div>
					
					{/* Botón de inversión de vista */}
					<div>
						<StandardButton
							styleType="outline"
							onClick={() => setShowOriginalAsPrimary(!showOriginalAsPrimary)}
							className="flex items-center gap-2"
							leftIcon={Globe}
						>
							{showOriginalAsPrimary ? "Idioma Español" : "Idioma Original"}
						</StandardButton>
					</div>
				</div>

				{/* Tabla principal - Wrapper aislado para sticky header */}
				<div className="relative" style={{ isolation: 'isolate' }}>
					{/* Spacer para evitar interferencia con elementos superiores */}
					<div style={{ height: '1px', marginBottom: '8px' }} />
					<StandardTable
						data={tableData}
						columns={tableColumns}
						renderSubComponent={renderSubComponent}
						isStickyHeader={true}
						enableTruncation={true}
						filterPlaceholder="Buscar artículos..."
						stickyOffset={80}
						enableKeywordHighlighting={true}
						keywordHighlightPlaceholder="Resaltar palabra clave..."
						enableCsvExport={true}
						csvFileName={`Preclasificacion_Lote_${batchDetails.batch_number || batchId}`}
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
		</StandardPageBackground>
	);
};

export default BatchDetailPage;
