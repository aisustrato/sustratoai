//. 📍 app/datos-maestros/dimensiones/components/DimensionForm.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, {
	useEffect,
	useState,
	useCallback,
	useRef,
	useMemo,
} from "react";
import {
	useForm,
	Controller,
	useFieldArray,
	FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/app/auth-provider";
import { getPhasesForProject } from "@/lib/actions/preclassification_phases_actions";
import { getRandomEligibleArticleAbstract } from "@/lib/actions/phase-eligible-articles-actions";
import {
	simulateDimensionClassification,
	type SimulationResult,
} from "@/lib/actions/dimension-actions";
import { toast } from "sonner";

import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import {
	StandardSelect,
	type SelectOption,
} from "@/components/ui/StandardSelect"; // Assuming SelectOption type is compatible or similar
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { StandardDialog } from "@/components/ui/StandardDialog";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
	AlertCircle,
	HelpCircle,
	Lightbulb,
	PlusCircle,
	Trash2,
	CheckCircle,
	Search,
	Sparkles,
	Play,
	Dice5,
} from "lucide-react";
import { StandardBadge } from "@/components/ui/StandardBadge";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Esquemas Zod para los sub-elementos
const optionSchema = z.object({
	id: z.string().optional(),
	value: z
		.string()
		.min(1, "El valor de la opción es requerido.")
		.max(200, "Máximo 200 caracteres."),
	ordering: z.number().int(),
	emoticon: z
		.string()
		.optional()
		.nullable()
		.refine(
			(val) => {
				if (!val || val === "") return true;
				// Validate exactly one emoji using Unicode emoji segmenter
				const segments = [
					...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(val),
				];
				if (segments.length !== 1) return false;
				// Check that the single grapheme is actually an emoji
				const grapheme = segments[0].segment;
				const emojiRegex =
					/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
				return emojiRegex.test(grapheme);
			},
			{ message: "Debe ser exactamente un emoji, o dejarlo vacío." },
		),
});

const questionSchema = z.object({
	id: z.string().optional(),
	question: z
		.string()
		.min(5, "La pregunta debe tener al menos 5 caracteres.")
		.max(1500, "Máximo 1500 caracteres."),
	ordering: z.number().int(),
});

const exampleSchema = z.object({
	id: z.string().optional(),
	example: z
		.string()
		.min(5, "El ejemplo debe tener al menos 5 caracteres.")
		.max(1500, "Máximo 1500 caracteres."),
});

// Esquema Zod principal para el formulario de Dimensión
const dimensionFormSchema = z
	.object({
		name: z
			.string()
			.min(3, "El nombre debe tener al menos 3 caracteres.")
			.max(100, "Máximo 100 caracteres."),
		phaseId: z.string().min(1, "Debe seleccionar una fase."),
		type: z.enum(["finite", "open"], {
			required_error: "Debe seleccionar un tipo de dimensión.",
		}),
		description: z
			.string()
			.max(500, "La descripción no puede exceder los 500 caracteres.")
			.optional()
			.nullable(),
		icon: z.string().max(100, "Máximo 100 caracteres.").optional().nullable(),
		options: z.array(optionSchema).optional(),
		questions: z.array(questionSchema).optional(),
		examples: z.array(exampleSchema).optional(),
	})
	.refine(
		(data) => {
			if (
				data.type === "finite" &&
				(!data.options || data.options.length === 0)
			) {
				return false;
			}
			return true;
		},
		{
			message:
				"Las dimensiones de tipo 'Selección Múltiple' deben tener al menos una opción.",
			path: ["options"], // Asociar el error al array de opciones
		},
	);

export type DimensionFormValues = z.infer<typeof dimensionFormSchema>;

// Definir el tipo de fase para TypeScript
type Phase = {
	id: string;
	name: string;
	phase_number: number;
	status:
		| "planning"
		| "active"
		| "completed"
		| "archived"
		| "annulled"
		| "inactive"
		| null;
	project_id: string;
	created_at: string | null;
	description: string | null;
};

interface DimensionFormProps {
	modo: "crear" | "editar" | "ver";
	valoresIniciales?: Partial<DimensionFormValues>;
	onSubmit?: (data: DimensionFormValues) => void;
	loading?: boolean;
	disabled?: boolean;
	activePhaseId?: string; // Fase activa desde la página principal
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const DimensionForm: React.FC<DimensionFormProps> = ({
	modo,
	valoresIniciales,
	onSubmit,
	loading = false,
	disabled = false,
	activePhaseId,
}) => {
	//#region [sub] - 🧰 HOOKS, STATE, FORM SETUP & EFFECTS 🧰
	const { proyectoActual } = useAuth();

	// Catálogo dinámico de íconos Lucide (filtra solo componentes funcionales)
	const lucideIconMap = useMemo<Record<string, LucideIcon>>(() => {
		// In lucide-react, los iconos suelen ser ForwardRefExoticComponent (typeof === 'object')
		const entries = Object.entries(LucideIcons).filter(([name, comp]) => {
			if (!/^[A-Z]/.test(name)) return false; // solo posibles íconos (PascalCase)
			const t = typeof comp;
			return t === "function" || t === "object";
		});
		const map: Record<string, LucideIcon> = {};
		for (const [name, comp] of entries) map[name] = comp as LucideIcon;
		return map;
	}, []);

	// Construye la lista priorizando una paleta curada y luego completa hasta 150 con el resto
	const lucideIconNames = useMemo(() => {
		const preferredCandidates = [
			// 1. Conceptos, Ideas y Teoría
			"BrainCircuit",
			"Lightbulb",
			"Atom",
			"Dna",
			"Puzzle",
			"KeyRound",
			"Sprout",
			"Network",
			"GitFork",
			"BookOpenText",
			"Gem",
			"Scale",
			"Anchor",
			"Telescope",
			"Compass",
			// 2. Datos, Evidencia y Análisis
			"Database",
			"FileText",
			"Table2",
			"BarChart4",
			"AreaChart",
			"PieChart",
			"ScanSearch",
			"Filter",
			"Sigma",
			"ClipboardList",
			"Pilcrow",
			"Quote",
			"Fingerprint",
			// 3. Metodología y Proceso
			"Workflow",
			"Settings2",
			"Ruler",
			"FlaskConical",
			"Microscope",
			"DraftingCompass",
			"Scissors",
			"Layers",
			"Repeat",
			"RotateCw",
			"Path",
			"Blend",
			"Move",
			// 4. Resultados, Conclusiones e Impacto
			"Target",
			"Flag",
			"Award",
			"Trophy",
			"CheckCircle2",
			"Rocket",
			"Mountain",
			"Activity",
			"TrendingUp",
			"TrendingDown",
			"Swords",
			// 5. Colaboración, Contexto y Comunicación
			"Users2",
			"MessageSquareQuote",
			"Link2",
			"Share2",
			"PenTool",
			"Highlighter",
			"Library",
			"Building2",
			"Map",
			"CalendarDays",
			"CircleDollarSign",
			// 6. Estructura y Organización
			"FolderTree",
			"Tags",
			"Bookmark",
			"ListOrdered",
			"Box",
			"Package",
			"LayoutGrid",
			"Component",
			"VennDiagram",
			// 7. Limitaciones, Riesgos y Ética
			"AlertTriangle",
			"HelpCircle",
			"XCircle",
			"ShieldQuestion",
			"LockKeyhole",
			"EyeOff",
			"Unplug",
			"Copyright",
			// 8. Símbolos Abstractos y Primitivas
			"Hash",
			"AtSign",
			"Braces",
			"Brackets",
			"Parentheses",
			"Terminal",
			"Asterisk",
			"Infinity",
		];

		// Filtrar por los que realmente existen en el catálogo importado
		const preferred = preferredCandidates.filter((n) => !!lucideIconMap[n]);
		const preferredSet = new Set(preferred);

		const allNames = Object.keys(lucideIconMap);
		const priorityRegex =
			/(User|Users|User\w+|Contact|Id|Badge|Briefcase|Building|Factory|Store|Graduation|School|Book|Books|Bookmark|Calendar|Clock|Timer|Alarm|History|Hourglass|Phone|Call|Mail|Message|Chat|Mic|Camera|Video|Image|Folder|File|Files|Document|Docs|Clipboard|Edit|Pen|Pencil|Write|Search|Settings|Cog|Wrench|Hammer|Tool|Shield|Lock|Key|Globe|Map|Location|Pin|Home|House|Heart|Star|Award|Trophy|Medal|Chart|Pie|Bar|Trending|Graph|Database|Cpu|Server|Cloud|Download|Upload|Link|Tag|Tags|Flag|Alert|Bell|Info|Help|Lightbulb|Sun|Moon|Sparkles|Zap|Fire|Leaf|Recycling|Wheelchair|Accessibility|Baby|Child|Handshake|Group|UsersRound|Wallet|Credit|Card)/i;

		const others = allNames
			.filter((n) => !preferredSet.has(n))
			.sort((a, b) => {
				const pa = priorityRegex.test(a) ? 1 : 0;
				const pb = priorityRegex.test(b) ? 1 : 0;
				if (pa !== pb) return pb - pa;
				return a.localeCompare(b);
			});

		return [...preferred, ...others].slice(0, 150);
	}, [lucideIconMap]);

	// Estado para diálogo de íconos y búsqueda
	const [iconDialogOpen, setIconDialogOpen] = useState(false);
	const [iconSearch, setIconSearch] = useState("");

	// Estados para fases
	const [phases, setPhases] = useState<Phase[]>([]);
	const [loadingPhases, setLoadingPhases] = useState(true);

	// Estado para Calibrador Quipu
	const [calibrationText, setCalibrationText] = useState("");
	const [calibrationResult, setCalibrationResult] =
		useState<SimulationResult | null>(null);
	const [isCalibrating, setIsCalibrating] = useState(false);
	const [isLoadingRandom, setIsLoadingRandom] = useState(false);

	const form = useForm<DimensionFormValues>({
		resolver: zodResolver(dimensionFormSchema),
		defaultValues: {
			name: "",
			phaseId: activePhaseId || "", // Pre-seleccionar la fase activa
			type: undefined,
			description: "",
			icon: "",
			options: [],
			questions: [],
			examples: [],
			...valoresIniciales,
		},
		mode: "onBlur",
		reValidateMode: "onChange",
		// Asegura que los campos no se desregistren al desmontar (e.g., al ocultar secciones)
		shouldUnregister: false,
	});

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors, dirtyFields, isValid, isSubmitted, touchedFields },
	} = form;

	const dimensionType = watch("type");
	const currentPhaseId = watch("phaseId");
	const optionsArray = watch("options");
	const questionsArray = watch("questions");
	const examplesArray = watch("examples");

	const isReadOnlyEffective = modo === "ver" || disabled;

	// Función para cargar las fases del proyecto
	const cargarFases = useCallback(async () => {
		if (!proyectoActual?.id) {
			setPhases([]);
			setLoadingPhases(false);
			return;
		}

		setLoadingPhases(true);
		try {
			const resultado = await getPhasesForProject(proyectoActual.id);
			if (resultado.data && !resultado.error) {
				setPhases(resultado.data);
			} else {
				setPhases([]);
			}
		} catch {
			setPhases([]);
		} finally {
			setLoadingPhases(false);
		}
	}, [proyectoActual?.id]);

	// Efecto para cargar las fases cuando cambia el proyecto
	useEffect(() => {
		cargarFases();
	}, [cargarFases]);

	// Efecto para actualizar la fase seleccionada cuando cambia activePhaseId
	useEffect(() => {
		if (activePhaseId && modo === "crear") {
			form.setValue("phaseId", activePhaseId);
		}
	}, [activePhaseId, modo, form]);

	const {
		fields: optionFields,
		append: appendOption,
		remove: removeOption,
	} = useFieldArray({ control, name: "options" });
	const {
		fields: questionFields,
		append: appendQuestion,
		remove: removeQuestion,
	} = useFieldArray({ control, name: "questions" });
	const {
		fields: exampleFields,
		append: appendExample,
		remove: removeExample,
	} = useFieldArray({ control, name: "examples" });

	// Evitar resets que borren cambios del usuario si hay refetch o re-render al volver al foco
	const hasInitializedDefaults = useRef(false);
	useEffect(() => {
		if (!valoresIniciales) return;
		// Solo inicializar una vez en modo editar para cargar valores del backend
		if (modo === "editar" && !hasInitializedDefaults.current) {
			form.reset(
				{
					name: "",
					type: undefined,
					description: "",
					icon: "",
					options: [],
					questions: [],
					examples: [],
					...valoresIniciales,
				},
				{
					// Mantener lo que el usuario ya escribió (incluye arreglos dinámicos)
					keepDirtyValues: true,
				},
			);
			hasInitializedDefaults.current = true;
		}
	}, [modo, valoresIniciales, form]);

	const handleFormSubmitInternal = (data: DimensionFormValues) => {
		if (onSubmit) {
			const dataToSubmit = {
				...data,
				options: data.type === "open" ? [] : data.options || [],
			};
			onSubmit(dataToSubmit);
		}
	};

	const onInvalidSubmit = (formErrors: FieldErrors<DimensionFormValues>) => {
		console.error("DimensionForm (Inválido):", formErrors);
	};
	const handleGetRandomAbstract = async () => {
		if (!proyectoActual?.id) return;
		if (!currentPhaseId) {
			toast.error("Selecciona una fase primero", {
				description:
					"El calibrador necesita saber la fase para buscar artículos dentro de su universo elegible.",
			});
			return;
		}
		setIsLoadingRandom(true);
		try {
			const result = await getRandomEligibleArticleAbstract(currentPhaseId);
			if (result.success) {
				setCalibrationText(result.data.abstract);
				toast.success("Abstract aleatorio cargado (universo de la fase)");
			} else {
				toast.error("Error al cargar abstract", { description: result.error });
			}
		} catch (error) {
			toast.error("Error inesperado");
		} finally {
			setIsLoadingRandom(false);
		}
	};

	const handleSimulateCalibration = async () => {
		const currentValues = form.getValues();

		if (!currentValues.name || !calibrationText.trim()) {
			toast.error("Faltan datos", {
				description:
					"Debes ingresar un nombre para la dimensión y un texto de prueba.",
			});
			return;
		}

		if (
			currentValues.type === "finite" &&
			(!currentValues.options || currentValues.options.length === 0)
		) {
			toast.error("Configuración incompleta", {
				description:
					"Para dimensiones finitas, debes agregar al menos una opción.",
			});
			return;
		}

		setIsCalibrating(true);
		setCalibrationResult(null);

		try {
			const result = await simulateDimensionClassification({
				name: currentValues.name,
				description: currentValues.description,
				type: currentValues.type,
				options: (currentValues.options || []).map((o) => ({
					value: o.value,
					emoticon: o.emoticon || null,
				})),
				questions: (currentValues.questions || []).map((q) => ({
					question: q.question,
				})),
				examples: (currentValues.examples || []).map((e) => ({
					example: e.example,
				})),
				text: calibrationText,
			});

			if (result.success) {
				setCalibrationResult(result.data);
				toast.success("Simulación completada");
			} else {
				toast.error("Error en simulación", { description: result.error });
			}
		} catch (error) {
			toast.error("Error inesperado", {
				description: "No se pudo conectar con Quipu.",
			});
		} finally {
			setIsCalibrating(false);
		}
	};

	//#endregion ![sub]

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const typeOptions: SelectOption[] = [
		{ value: "finite", label: "Selección Múltiple (Opciones Predefinidas)" },
		{ value: "open", label: "Respuesta Abierta (Texto Libre)" },
	];

	const addNewOption = () =>
		appendOption(
			{ value: "", ordering: optionFields.length, emoticon: "" },
			{ shouldFocus: true },
		);
	const addNewQuestion = () =>
		appendQuestion(
			{ question: "", ordering: questionFields.length },
			{ shouldFocus: true },
		);
	const addNewExample = () =>
		appendExample({ example: "" }, { shouldFocus: true });

	const getFieldSuccessState = (
		fieldName: keyof DimensionFormValues,
		index?: number,
		subFieldName?: string,
	) => {
		if (isReadOnlyEffective) return false;

		let isTouched = false;
		let hasError = false;

		if (subFieldName && typeof index === "number") {
			// @ts-expect-error - Acceso seguro a campos anidados dinámicos
			isTouched = touchedFields[fieldName]?.[index]?.[subFieldName];
			// @ts-expect-error - Acceso seguro a campos anidados dinámicos
			hasError = !!errors[fieldName]?.[index]?.[subFieldName];
		} else {
			isTouched = !!touchedFields[fieldName];
			hasError = !!errors[fieldName];
		}

		return isTouched && !hasError;
	};
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<>
			<StandardCard
				colorScheme="primary"
				accentPlacement="none"
				hasOutline={false}
				shadow="none"
				disableShadowHover={true}
				styleType="subtle"
				className="w-full max-w-4xl mx-auto">
				<StandardCard.Content>
					<form
						onSubmit={handleSubmit(handleFormSubmitInternal, onInvalidSubmit)}
						className="space-y-8">
						{/* //#region [render_sub] - 🧱 SECCIÓN: DATOS BÁSICOS 🧱 */}
						<StandardCard
							colorScheme="primary"
							accentPlacement="none"
							hasOutline={false}
							shadow="none"
							disableShadowHover={true}
							styleType="subtle"
							className="p-0">
							<StandardCard.Header className="pb-3">
								<StandardText size="lg" weight="medium" colorScheme="primary">
									Definición de la Dimensión
								</StandardText>
							</StandardCard.Header>
							<StandardCard.Content className="space-y-5">
								<StandardFormField
									label="Nombre de la Dimensión"
									htmlFor="dim-name"
									isRequired
									error={errors.name?.message}>
									<Controller
										name="name"
										control={control}
										render={({ field }) => (
											<StandardInput
												id="dim-name"
												placeholder="Ej: Relevancia para el Estudio"
												readOnly={isReadOnlyEffective}
												isEditing={modo === "editar" && !isReadOnlyEffective}
												error={errors.name?.message} // Input muestra su propio borde/icono de error
												success={getFieldSuccessState("name")}
												{...field}
											/>
										)}
									/>
								</StandardFormField>

								<StandardFormField
									label="Fase de Preclasificación"
									htmlFor="dim-phase"
									isRequired
									error={errors.phaseId?.message}>
									<Controller
										name="phaseId"
										control={control}
										render={({ field }) => {
											const phaseOptions: SelectOption[] = phases.map(
												(phase) => ({
													value: phase.id,
													label: `${phase.name} (Fase ${phase.phase_number})`,
													disabled:
														phase.status === "completed" ||
														phase.status === "annulled",
												}),
											);

											return (
												<StandardSelect
													id="dim-phase"
													options={phaseOptions}
													placeholder={
														loadingPhases ? "Cargando fases..." : (
															"Selecciona una fase..."
														)
													}
													disabled={
														isReadOnlyEffective ||
														loadingPhases ||
														phases.length === 0
													}
													error={errors.phaseId?.message}
													success={getFieldSuccessState("phaseId")}
													{...field}
												/>
											);
										}}
									/>
								</StandardFormField>

								<StandardFormField
									label="Tipo de Dimensión"
									htmlFor="dim-type"
									isRequired
									error={errors.type?.message}>
									<Controller
										name="type"
										control={control}
										render={({ field }) => (
											<StandardSelect
												id="dim-type"
												options={typeOptions}
												placeholder="Selecciona un tipo..."
												disabled={
													isReadOnlyEffective ||
													(modo === "editar" && !!valoresIniciales?.type)
												}
												error={errors.type?.message} // SelectCustom muestra su propio borde/icono de error
												success={getFieldSuccessState("type")}
												{...field}
											/>
										)}
									/>
									{modo === "editar" && !!valoresIniciales?.type && (
										<StandardText
											size="xs"
											colorScheme="neutral"
											className="mt-1">
											Indica si la dimensión tendrá opciones predefinidas o será
											de respuesta abierta.
										</StandardText>
									)}
								</StandardFormField>

								<StandardFormField
									label="Descripción (Opcional)"
									htmlFor="dim-description"
									error={errors.description?.message}
									hint="Explica brevemente el propósito o criterio de esta dimensión (máx. 500 caracteres).">
									<Controller
										name="description"
										control={control}
										render={({ field }) => (
											<StandardTextarea
												id="dim-description"
												placeholder="Ej: Evalúa qué tan central es el artículo para los objetivos principales de la investigación..."
												rows={8}
												readOnly={isReadOnlyEffective}
												isEditing={modo === "editar" && !isReadOnlyEffective}
												error={errors.description?.message} // TextArea muestra su propio borde/icono de error
												success={getFieldSuccessState("description")}
												maxLength={500}
												showCharacterCount
												{...field}
												value={field.value || ""}
											/>
										)}
									/>
								</StandardFormField>

								<StandardFormField
									label="Icono de la Dimensión (Solo íconos)"
									htmlFor="dim-icon"
									hint="Selecciona un ícono Lucide de la galería (sin emojis).">
									<Controller
										name="icon"
										control={control}
										render={({ field }) => (
											<div className="flex items-center gap-2">
												<div className="flex-1 flex items-center gap-2">
													{(() => {
														const Comp =
															field.value ?
																(lucideIconMap as Record<string, LucideIcon>)[
																	field.value
																]
															:	undefined;
														return Comp ?
																<StandardIcon>
																	<Comp className="h-5 w-5" />
																</StandardIcon>
															:	null;
													})()}

													<StandardInput
														id="dim-icon"
														placeholder="Selecciona desde la galería de íconos"
														readOnly={true}
														isEditing={false}
														error={errors.icon?.message}
														success={getFieldSuccessState("icon")}
														{...field}
														value={field.value || ""}
													/>
												</div>
												{!isReadOnlyEffective && (
													<StandardButton
														type="button"
														styleType="outline"
														size="sm"
														leftIcon={Search}
														onClick={() => setIconDialogOpen(true)}>
														Elegir ícono
													</StandardButton>
												)}
											</div>
										)}
									/>
								</StandardFormField>
							</StandardCard.Content>
						</StandardCard>
						{/* //#endregion [render_sub] */}
						{/* //#region [render_sub] - 🧱 SECCIÓN: OPCIONES (FINITE) 🧱 */}
						{dimensionType === "finite" && (
							<StandardCard
								colorScheme="primary"
								accentPlacement="none"
								hasOutline={false}
								shadow="none"
								disableShadowHover={true}
								styleType="subtle"
								className="p-0">
								<StandardCard.Header className="pb-3 flex justify-between items-start">
									{" "}
									{/* items-start para alinear mejor si los textos tienen alturas diferentes */}
									<div className="flex-grow">
										{" "}
										{/* Div para que el título y contador estén juntos y a la izquierda */}
										<StandardText
											asElement="div"
											size="lg"
											weight="medium"
											colorScheme="primary">
											{" "}
											{/* Usar 'as="div"' para evitar anidación p > p */}
											Opciones de Clasificación
										</StandardText>
										{optionsArray && optionsArray.length > 0 && (
											<StandardText
												size="xs"
												colorScheme="neutral"
												className="mt-0.5 block">
												Define los valores posibles si es de selección múltiple.
											</StandardText>
										)}
									</div>
									{!isReadOnlyEffective && (
										<StandardButton
											type="button"
											styleType="outline"
											size="sm"
											leftIcon={PlusCircle}
											onClick={addNewOption}>
											{optionFields.length === 0 ?
												"Añadir Opción"
											:	"Añadir Otra Opción"}
										</StandardButton>
									)}
								</StandardCard.Header>
								<StandardCard.Content className="space-y-3">
									{errors.options &&
										!Array.isArray(errors.options) &&
										errors.options.message &&
										optionFields.length === 0 && (
											<StandardText
												colorScheme="danger"
												className="text-sm flex items-center gap-2 -mt-2 mb-2">
												<StandardIcon>
													<AlertCircle className="h-4 w-4" />
												</StandardIcon>{" "}
												{errors.options.message}
											</StandardText>
										)}
									{optionFields.length === 0 &&
										!isReadOnlyEffective &&
										!errors.options?.message && (
											<StandardText
												colorScheme="neutral"
												className="text-sm italic">
												No se han definido opciones aún. Agrega la primera.
											</StandardText>
										)}
									{optionFields.map(
										(
											item,
											index, // 'item' en lugar de 'field' para evitar confusión con field de Controller
										) => (
											<div key={item.id} className="flex items-center gap-2">
												<div className="flex-grow grid grid-cols-20 gap-2 items-center">
													<Controller
														name={`options.${index}.value`}
														control={control}
														render={(
															{ field }, // 'field' aquí se refiere al campo del Controller
														) => (
															<StandardInput
																placeholder={`Valor Opción ${index + 1}`}
																readOnly={isReadOnlyEffective}
																isEditing={
																	modo === "editar" && !isReadOnlyEffective
																}
																error={errors.options?.[index]?.value?.message}
																success={getFieldSuccessState(
																	"options",
																	index,
																	"value",
																)}
																{...field}
																className="col-span-16"
															/>
														)}
													/>
													<Controller
														name={`options.${index}.emoticon`}
														control={control}
														render={({ field }) => (
															<div className="col-span-3 flex items-center gap-1">
																{!isReadOnlyEffective ?
																	<div className="relative w-full group">
																		<input
																			type="text"
																			className="w-full text-center text-lg p-1.5 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 border-neutral-200 hover:border-neutral-400 h-9"
																			placeholder="🙂"
																			value={field.value || ""}
																			onChange={(e) => {
																				const val = e.target.value;
																				field.onChange(val === "" ? "" : val);
																			}}
																			onBlur={(e) => {
																				field.onBlur();
																				// Trim to single emoji on blur via validation
																				const val = e.target.value.trim();
																				if (val === "") {
																					field.onChange("");
																				}
																			}}
																			maxLength={4}
																		/>
																		<div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
																			{(
																				typeof navigator !== "undefined" &&
																				/Mac/i.test(navigator.userAgent)
																			) ?
																				"⌃⌘ Espacio para emojis"
																			:	"Win + . para emojis"}
																		</div>
																	</div>
																:	<span className="w-full text-center text-lg leading-none">
																		{field.value || "—"}
																	</span>
																}
															</div>
														)}
													/>
													<div className="col-span-1" aria-hidden="true" />
													{/* Mostrar el mensaje de error del campo específico directamente */}
													{errors.options?.[index]?.value?.message && (
														<StandardText
															size="xs"
															colorScheme="danger"
															className="mt-1 ml-1 block">
															{errors.options?.[index]?.value?.message}
														</StandardText>
													)}
													{errors.options?.[index]?.emoticon && (
														<StandardText
															size="xs"
															colorScheme="danger"
															className="mt-1 ml-1 block col-span-12">
															{String(
																errors.options?.[index]?.emoticon?.message ||
																	"",
															)}
														</StandardText>
													)}
												</div>
												{!isReadOnlyEffective && (
													<StandardButton
														type="button"
														styleType="ghost"
														colorScheme="danger"
														size="sm"
														iconOnly={true}
														leftIcon={Trash2}
														onClick={() => removeOption(index)}
														aria-label="Eliminar opción">
														Eliminar
													</StandardButton>
												)}
												{getFieldSuccessState("options", index, "value") &&
													!isReadOnlyEffective && (
														<StandardIcon>
															<CheckCircle className="h-5 w-5 text-success" />
														</StandardIcon>
													)}
											</div>
										),
									)}
								</StandardCard.Content>
							</StandardCard>
						)}{" "}
						{/* Cierre del bloque condicional dimensionType === "finite" */}
						{/* //#region [render_sub] - 🧱 SECCIÓN: PREGUNTAS GUÍA 🧱 */}
						<StandardCard
							colorScheme="primary"
							accentPlacement="none"
							hasOutline={false}
							shadow="none"
							disableShadowHover={true}
							styleType="subtle"
							className="p-0">
							<StandardCard.Header className="pb-3 flex justify-between items-start">
								<div className="flex-grow">
									<StandardText
										asElement="div"
										size="lg"
										weight="medium"
										colorScheme="primary"
										className="flex items-center gap-2">
										Preguntas Guía{" "}
										<StandardBadge colorScheme="neutral" styleType="subtle">
											Opcional
										</StandardBadge>
									</StandardText>
									{questionsArray && questionsArray.length > 0 && (
										<StandardText
											size="xs"
											colorScheme="neutral"
											className="mt-0.5 block">
											{questionsArray.length}{" "}
											{questionsArray.length === 1 ?
												"pregunta definida"
											:	"preguntas definidas"}
										</StandardText>
									)}
								</div>
								{!isReadOnlyEffective && (
									<StandardButton
										type="button"
										styleType="outline"
										size="sm"
										leftIcon={HelpCircle}
										onClick={addNewQuestion}>
										{questionFields.length === 0 ?
											"Añadir Pregunta"
										:	"Añadir Otra Pregunta"}
									</StandardButton>
								)}
							</StandardCard.Header>
							<StandardCard.Content className="space-y-3">
								{questionFields.length === 0 && isReadOnlyEffective && (
									<StandardText
										colorScheme="neutral"
										className="text-sm italic">
										No se han definido preguntas guía.
									</StandardText>
								)}
								{questionFields.map((item, index) => (
									<div key={item.id} className="flex items-start gap-2">
										<div className="flex-grow">
											<Controller
												name={`questions.${index}.question`}
												control={control}
												render={({ field }) => (
													<StandardTextarea
														placeholder={`Pregunta guía ${index + 1}`}
														readOnly={isReadOnlyEffective}
														isEditing={
															modo === "editar" && !isReadOnlyEffective
														}
														rows={8}
														maxLength={1500}
														showCharacterCount
														error={errors.questions?.[index]?.question?.message}
														success={getFieldSuccessState(
															"questions",
															index,
															"question",
														)}
														{...field}
													/>
												)}
											/>
											{errors.questions?.[index]?.question?.message && (
												<StandardText
													size="xs"
													colorScheme="danger"
													className="mt-0.5 block">
													{errors.questions?.[index]?.question?.message}
												</StandardText>
											)}
										</div>
										{!isReadOnlyEffective && (
											<StandardButton
												type="button"
												styleType="ghost"
												colorScheme="danger"
												iconOnly={true}
												leftIcon={Trash2}
												onClick={() => removeQuestion(index)}
												className="mt-1"
												aria-label="Eliminar pregunta">
												Eliminar
											</StandardButton>
										)}
										{getFieldSuccessState("questions", index, "question") &&
											!isReadOnlyEffective && (
												<StandardIcon>
													<CheckCircle className="h-5 w-5 text-success mt-1" />
												</StandardIcon>
											)}
									</div>
								))}
							</StandardCard.Content>
						</StandardCard>
						{/* //#endregion [render_sub] */}
						{/* //#region [render_sub] - 🧱 SECCIÓN: EJEMPLOS ILUSTRATIVOS 🧱 */}
						<StandardCard
							colorScheme="primary"
							accentPlacement="none"
							hasOutline={false}
							shadow="none"
							disableShadowHover={true}
							styleType="subtle"
							className="p-0">
							<StandardCard.Header className="pb-3 flex justify-between items-start">
								<div className="flex-grow">
									<StandardText
										asElement="div"
										size="lg"
										weight="medium"
										colorScheme="primary"
										className="flex items-center gap-2">
										Ejemplos Ilustrativos{" "}
										<StandardBadge colorScheme="neutral" styleType="subtle">
											Opcional
										</StandardBadge>
									</StandardText>
									{examplesArray && examplesArray.length > 0 && (
										<StandardText
											size="xs"
											colorScheme="neutral"
											className="mt-0.5 block">
											{examplesArray.length}{" "}
											{examplesArray.length === 1 ?
												"ejemplo definido"
											:	"ejemplos definidos"}
										</StandardText>
									)}
								</div>
								{!isReadOnlyEffective && (
									<StandardButton
										type="button"
										styleType="outline"
										size="sm"
										leftIcon={Lightbulb}
										onClick={addNewExample}>
										{exampleFields.length === 0 ?
											"Añadir Ejemplo"
										:	"Añadir Otro Ejemplo"}
									</StandardButton>
								)}
							</StandardCard.Header>
							<StandardCard.Content className="space-y-3">
								{exampleFields.length === 0 && isReadOnlyEffective && (
									<StandardText
										colorScheme="neutral"
										className="text-sm italic">
										No se definieron ejemplos.
									</StandardText>
								)}
								{exampleFields.map((item, index) => (
									<div key={item.id} className="flex items-start gap-2">
										<div className="flex-grow">
											<Controller
												name={`examples.${index}.example`}
												control={control}
												render={({ field }) => (
													<StandardTextarea
														placeholder={`Ejemplo ${index + 1}`}
														readOnly={isReadOnlyEffective}
														isEditing={
															modo === "editar" && !isReadOnlyEffective
														}
														rows={8}
														maxLength={1500}
														showCharacterCount
														error={errors.examples?.[index]?.example?.message}
														success={getFieldSuccessState(
															"examples",
															index,
															"example",
														)}
														{...field}
													/>
												)}
											/>
											{errors.examples?.[index]?.example?.message && (
												<StandardText
													size="xs"
													colorScheme="danger"
													className="mt-1 ml-1 block">
													{errors.examples?.[index]?.example?.message}
												</StandardText>
											)}
										</div>
										{!isReadOnlyEffective && (
											<StandardButton
												type="button"
												styleType="ghost"
												colorScheme="danger"
												iconOnly={true}
												leftIcon={Trash2}
												onClick={() => removeExample(index)}
												className="mt-1"
												aria-label="Eliminar ejemplo">
												Eliminar
											</StandardButton>
										)}
										{getFieldSuccessState("examples", index, "example") &&
											!isReadOnlyEffective && (
												<StandardIcon>
													<CheckCircle className="h-5 w-5 text-success mt-1" />
												</StandardIcon>
											)}
									</div>
								))}
							</StandardCard.Content>
						</StandardCard>
						{/* //#region [render_sub] - 🧱 SECCIÓN: CALIBRADOR QUIPU (IA) 🧱 */}
						<StandardCard
							colorScheme="secondary"
							accentPlacement="left"
							accentColorScheme="accent"
							hasOutline={true}
							shadow="md"
							disableShadowHover={true}
							styleType="subtle"
							className="mt-8 border-accent/20">
							<StandardCard.Header className="pb-3">
								<div className="flex items-center gap-2">
									<StandardIcon styleType="solid" colorScheme="accent">
										<Sparkles className="h-5 w-5 text-white" />
									</StandardIcon>
									<div>
										<StandardText size="lg" weight="bold" colorScheme="accent">
											Calibrador Quipu (IA)
										</StandardText>
										<StandardText size="xs" colorScheme="neutral">
											Prueba cómo la IA interpretará tus instrucciones antes de
											guardar.
										</StandardText>
									</div>
								</div>
							</StandardCard.Header>
							<StandardCard.Content className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Columna Izquierda: Input */}
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<StandardText size="sm" weight="medium">
												Texto de Prueba (Abstract o Fragmento)
											</StandardText>
											<StandardButton
												type="button"
												styleType="ghost"
												size="sm"
												leftIcon={Dice5}
												onClick={handleGetRandomAbstract}
												loading={isLoadingRandom}
												disabled={isCalibrating || isLoadingRandom}
												className="text-xs h-7 px-2">
												Azar
											</StandardButton>
										</div>
										<StandardTextarea
											placeholder="Pega aquí un texto o usa el botón de azar..."
											rows={6}
											value={calibrationText}
											onChange={(e) => setCalibrationText(e.target.value)}
											className="bg-white"
										/>
										<StandardButton
											type="button"
											colorScheme="accent"
											styleType="solid"
											className="w-full"
											onClick={handleSimulateCalibration}
											loading={isCalibrating}
											disabled={isCalibrating || !calibrationText.trim()}
											leftIcon={Play}>
											Simular Clasificación
										</StandardButton>
									</div>

									{/* Columna Derecha: Resultados */}
									<div className="space-y-3 bg-white/50 p-4 rounded-lg border border-neutral-border h-full">
										<StandardText size="sm" weight="medium" className="mb-2">
											Resultado de la Simulación
										</StandardText>

										{calibrationResult ?
											<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
												<div>
													<StandardText
														size="xs"
														colorScheme="neutral"
														className="uppercase tracking-wider font-bold mb-1">
														Clasificación
													</StandardText>
													<div className="flex items-center gap-3">
														<StandardText
															size="xl"
															weight="black"
															colorScheme="primary">
															{calibrationResult.value}
														</StandardText>
														<StandardBadge
															colorScheme={
																calibrationResult.confidence === "Alta" ?
																	"success"
																: calibrationResult.confidence === "Media" ?
																	"warning"
																:	"danger"
															}>
															Confianza: {calibrationResult.confidence}
														</StandardBadge>
													</div>
												</div>

												<div className="bg-accent/5 p-3 rounded-md border-l-4 border-accent">
													<StandardText
														size="xs"
														colorScheme="accent"
														className="uppercase tracking-wider font-bold mb-1">
														Justificación (Quipu)
													</StandardText>
													<StandardText
														size="sm"
														className="italic text-neutral-700">
														&ldquo;{calibrationResult.rationale}&rdquo;
													</StandardText>
												</div>
											</div>
										:	<div className="h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[150px]">
												<Sparkles className="h-8 w-8 mb-2 text-neutral-400" />
												<StandardText size="sm" colorScheme="neutral">
													Define tu dimensión y escribe un texto de prueba para
													ver el resultado aquí.
												</StandardText>
											</div>
										}
									</div>
								</div>
							</StandardCard.Content>
						</StandardCard>
						{/* //#endregion [render_sub] */}
						{/* //#region [render_sub] - 🧱 BOTÓN SUBMIT 🧱 */}
						{modo !== "ver" && (
							<div className="flex justify-end pt-6">
								<StandardButton
									type="submit"
									colorScheme="primary"
									size="lg"
									loading={loading}
									leftIcon={CheckCircle}
									disabled={
										loading ||
										(modo === "editar" && !Object.keys(dirtyFields).length) ||
										(!isValid && isSubmitted)
									}>
									{modo === "crear" ? "Crear Dimensión" : "Guardar Cambios"}
								</StandardButton>
							</div>
						)}
						{/* //#endregion [render_sub] */}
					</form>
				</StandardCard.Content>
			</StandardCard>

			{/* Dialogo Selector de Íconos Lucide */}
			<StandardDialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
				<StandardDialog.Content size="lg" colorScheme="neutral">
					<StandardDialog.Header>
						<StandardDialog.Title>Seleccionar ícono</StandardDialog.Title>
						<StandardDialog.Description>
							Elige un ícono de la lista para usarlo como representación visual
							de la dimensión.
						</StandardDialog.Description>
					</StandardDialog.Header>
					<StandardDialog.Body>
						<div className="mb-3">
							<StandardInput
								placeholder="Buscar ícono por nombre..."
								value={iconSearch}
								onChange={(e) => setIconSearch(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-[50vh] overflow-auto pr-1">
							{lucideIconNames
								.filter((name) =>
									name.toLowerCase().includes(iconSearch.toLowerCase()),
								)
								.slice(0, 150)
								.map((name) => {
									const IconCmp = lucideIconMap[name];
									return (
										<button
											key={name}
											onClick={() => {
												form.setValue("icon", name, {
													shouldDirty: true,
													shouldValidate: true,
												});
												setIconDialogOpen(false);
											}}
											className="flex flex-col items-center justify-center gap-2 p-3 border rounded-md hover:bg-muted/40"
											title={name}
											type="button">
											<StandardIcon>
												<IconCmp className="h-6 w-6" />
											</StandardIcon>
											<span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
												{name}
											</span>
										</button>
									);
								})}
						</div>
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardButton
							styleType="ghost"
							onClick={() => setIconDialogOpen(false)}>
							Cerrar
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</>
	);
	//#endregion ![render]
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration and type export
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar la internacionalización de los mensajes de error y etiquetas.
// Mejorar la accesibilidad (ARIA attributes) en campos dinámicos si es necesario.
// Evaluar si el `getFieldSuccessState` es demasiado complejo o si se puede simplificar.
//#endregion ![todo]
