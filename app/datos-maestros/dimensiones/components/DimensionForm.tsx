//. 📍 app/datos-maestros/dimensiones/components/DimensionForm.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
		.max(20, "Máximo 20 caracteres.")
		.optional()
		.nullable(),
});

const questionSchema = z.object({
	id: z.string().optional(),
	question: z
		.string()
		.min(5, "La pregunta debe tener al menos 5 caracteres.")
		.max(500, "Máximo 500 caracteres."),
	ordering: z.number().int(),
});

const exampleSchema = z.object({
	id: z.string().optional(),
	example: z
		.string()
		.min(5, "El ejemplo debe tener al menos 5 caracteres.")
		.max(500, "Máximo 500 caracteres."),
});

// Esquema Zod principal para el formulario de Dimensión
const dimensionFormSchema = z
	.object({
		name: z
			.string()
			.min(3, "El nombre debe tener al menos 3 caracteres.")
			.max(100, "Máximo 100 caracteres."),
		phaseId: z
			.string()
			.min(1, "Debe seleccionar una fase."),
		type: z.enum(["finite", "open"], {
			required_error: "Debe seleccionar un tipo de dimensión.",
		}),
		description: z
			.string()
			.max(500, "La descripción no puede exceder los 500 caracteres.")
			.optional()
			.nullable(),
		icon: z
			.string()
			.max(100, "Máximo 100 caracteres.")
			.optional()
			.nullable(),
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
		}
	);

export type DimensionFormValues = z.infer<typeof dimensionFormSchema>;

// Definir el tipo de fase para TypeScript
type Phase = {
	id: string;
	name: string;
	phase_number: number;
	status: 'active' | 'inactive' | 'completed' | 'annulled';
	project_id: string;
	created_at: string;
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
			"BrainCircuit","Lightbulb","Atom","Dna","Puzzle","KeyRound","Sprout","Network","GitFork","BookOpenText","Gem","Scale","Anchor","Telescope","Compass",
			// 2. Datos, Evidencia y Análisis
			"Database","FileText","Table2","BarChart4","AreaChart","PieChart","ScanSearch","Filter","Sigma","ClipboardList","Pilcrow","Quote","Fingerprint",
			// 3. Metodología y Proceso
			"Workflow","Settings2","Ruler","FlaskConical","Microscope","DraftingCompass","Scissors","Layers","Repeat","RotateCw","Path","Blend","Move",
			// 4. Resultados, Conclusiones e Impacto
			"Target","Flag","Award","Trophy","CheckCircle2","Rocket","Mountain","Activity","TrendingUp","TrendingDown","Swords",
			// 5. Colaboración, Contexto y Comunicación
			"Users2","MessageSquareQuote","Link2","Share2","PenTool","Highlighter","Library","Building2","Map","CalendarDays","CircleDollarSign",
			// 6. Estructura y Organización
			"FolderTree","Tags","Bookmark","ListOrdered","Box","Package","LayoutGrid","Component","VennDiagram",
			// 7. Limitaciones, Riesgos y Ética
			"AlertTriangle","HelpCircle","XCircle","ShieldQuestion","LockKeyhole","EyeOff","Unplug","Copyright",
			// 8. Símbolos Abstractos y Primitivas
			"Hash","AtSign","Braces","Brackets","Parentheses","Terminal","Asterisk","Infinity",
		];

		// Filtrar por los que realmente existen en el catálogo importado
		const preferred = preferredCandidates.filter((n) => !!lucideIconMap[n]);
		const preferredSet = new Set(preferred);

		const allNames = Object.keys(lucideIconMap);
		const priorityRegex = /(User|Users|User\w+|Contact|Id|Badge|Briefcase|Building|Factory|Store|Graduation|School|Book|Books|Bookmark|Calendar|Clock|Timer|Alarm|History|Hourglass|Phone|Call|Mail|Message|Chat|Mic|Camera|Video|Image|Folder|File|Files|Document|Docs|Clipboard|Edit|Pen|Pencil|Write|Search|Settings|Cog|Wrench|Hammer|Tool|Shield|Lock|Key|Globe|Map|Location|Pin|Home|House|Heart|Star|Award|Trophy|Medal|Chart|Pie|Bar|Trending|Graph|Database|Cpu|Server|Cloud|Download|Upload|Link|Tag|Tags|Flag|Alert|Bell|Info|Help|Lightbulb|Sun|Moon|Sparkles|Zap|Fire|Leaf|Recycling|Wheelchair|Accessibility|Baby|Child|Handshake|Group|UsersRound|Wallet|Credit|Card)/i;

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

	// Estado para diálogo de emoji por opción
	const [emojiDialogIndex, setEmojiDialogIndex] = useState<number | null>(null);

	const commonEmojis = useMemo(
		() => [
			// Caras y emociones
			"😀","😃","😄","😁","😆","😅","😂","🙂","🙃","😉","😊","😇","😍","🥰","😘","😗","😙","😚","😋","😛","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🫢","🫣","😱","😨","😰","😥","😓","🤗",
			// Manos y gestos
			"🤝","👍","👎","👌","✌️","🤟","🤘","👊","✊","🫶","🙏","👏","👐","💪","🦵","🦶","👣",
			// Partes del cuerpo
			"👀","👁️","👂","👃","🧠","🫀",
			// Corazones y símbolos
			"❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💔","💖","💗","💓","💞","💫","✨","⭐","🌟","⚡","🔥",
			// Naturaleza y clima
			"☀️","🌤️","⛅","🌥️","🌦️","🌧️","⛈️","🌈","🌙","⭐️","☂️","❄️","🌪️","🌊","🍃",
			// Personas y grupos
			"👤","👥","🧑","👨","👩","🧒","👶","🧓","👴","👵","👨‍🎓","👩‍🎓","🎓","👨‍💼","👩‍💼","💼","👨‍⚕️","👩‍⚕️","👨‍🏫","👩‍🏫","👮","👷","🧑‍🍳","🧑‍🔧","🧑‍🏭","🧑‍💻","🧑‍🔬","🧑‍🎨","🧑‍🚒","🧑‍✈️",
			// Comunicación
			"☎️","📞","📱","💬","🗨️","✉️","📧","📣","🔔","🔕",
			// Tiempo y calendario
			"⏰","⏱️","⏲️","🕒","📅","📆","🗓️","⌛","⏳",
			// Documentos y oficina
			"📚","📖","📝","✏️","🖊️","🖋️","📎","🗂️","📁","📂","🗃️","🗄️","📌","📍","🔖",
			// Herramientas y configuración
			"🛠️","🔧","🔨","⚙️","🧰","🪛",
			// Ciencia y tecnología
			"🧪","🔬","💻","🖥️","🖱️","🖨️","🛰️","📡",
			// Seguridad
			"🔒","🔓","🔑","🛡️",
			// Ubicación y mapas
			"🧭","🗺️","📍","🧭",
			// Finanzas
			"💰","💳","💵","💶","💷","💴","🏦","🧾","💱","💹","💼",
			// Transporte
			"🚗","🚕","🚌","🚎","🚓","🚑","🚒","🚴","🚲","✈️","🚀",
			// Objetos generales
			"🏠","🏢","🏫","🏥","⚖️","🏆","🎯","📈","📊","🔍","🔗","🏷️","🏳️","🏁",
			// Salud y accesibilidad
			"🏥","🧑‍🦽","🦼","♿",
		],
		[]
	);
	
	// Estados para fases
	const [phases, setPhases] = useState<Phase[]>([]);
	const [loadingPhases, setLoadingPhases] = useState(true);
	
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
				}
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
	//#endregion ![sub]

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const typeOptions: SelectOption[] = [
		{ value: "finite", label: "Selección Múltiple (Opciones Predefinidas)" },
		{ value: "open", label: "Respuesta Abierta (Texto Libre)" },
	];

	const addNewOption = () =>
		appendOption(
			{ value: "", ordering: optionFields.length, emoticon: "" },
			{ shouldFocus: true }
		);
	const addNewQuestion = () =>
		appendQuestion(
			{ question: "", ordering: questionFields.length },
			{ shouldFocus: true }
		);
	const addNewExample = () =>
		appendExample({ example: "" }, { shouldFocus: true });

	const getFieldSuccessState = (
		fieldName: keyof DimensionFormValues,
		index?: number,
		subFieldName?: string
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
								error={errors.phaseId?.message}
							>
								<Controller
									name="phaseId"
									control={control}
									render={({ field }) => {
										const phaseOptions: SelectOption[] = phases.map(phase => ({
											value: phase.id,
											label: `${phase.name} (Fase ${phase.phase_number})`,
											disabled: phase.status === 'completed' || phase.status === 'annulled'
										}));

										return (
											<StandardSelect
												id="dim-phase"
												options={phaseOptions}
												placeholder={loadingPhases ? "Cargando fases..." : "Selecciona una fase..."}
												disabled={isReadOnlyEffective || loadingPhases || phases.length === 0}
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
											rows={3}
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
													const Comp = field.value
														? (lucideIconMap as Record<string, LucideIcon>)[field.value]
													: undefined;
													return Comp ? (
														<StandardIcon>
															<Comp className="h-5 w-5" />
														</StandardIcon>
													) : null;
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
													onClick={() => setIconDialogOpen(true)}
												>
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
										{optionFields.length === 0
											? "Añadir Opción"
											: "Añadir Otra Opción"}
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
										index // 'item' en lugar de 'field' para evitar confusión con field de Controller
									) => (
										<div key={item.id} className="flex items-center gap-2">
											<div className="flex-grow grid grid-cols-20 gap-2 items-center">
												<Controller
													name={`options.${index}.value`}
													control={control}
													render={
														({ field } // 'field' aquí se refiere al campo del Controller
													) => (
															<StandardInput
																placeholder={`Valor Opción ${index + 1}`}
																readOnly={isReadOnlyEffective}
																isEditing={modo === "editar" && !isReadOnlyEffective}
																error={errors.options?.[index]?.value?.message}
																success={getFieldSuccessState(
																	"options",
																	index,
																	"value"
																)}
																{...field}
																className="col-span-16"
															/>
														)
													}
												/>
												<Controller
													name={`options.${index}.emoticon`}
													control={control}
													render={({ field }) => (
														<div className="col-span-3 flex items-center gap-2">
															<input type="hidden" {...field} value={field.value || ""} />
															{!isReadOnlyEffective ? (
																<StandardButton
																	type="button"
																	styleType="outline"
																	size="sm"
																	className="w-full"
																	onClick={() => setEmojiDialogIndex(index)}
																>
																	{field.value || "🙂"}
																</StandardButton>
															) : (
																<StandardBadge styleType="outline" className="w-full justify-center">
																	{field.value || "—"}
																</StandardBadge>
															)}
														</div>
													)}
												/>
												<div className="col-span-1" aria-hidden="true" />
												{/* Mostrar el mensaje de error del campo específico directamente */}
												{errors.options?.[index]?.value?.message && (
													<StandardText
														size="xs"
														colorScheme="danger"
														className="mt-1 ml-1 block"
													>
														{errors.options?.[index]?.value?.message}
													</StandardText>
												)}
												{errors.options?.[index]?.emoticon && (
													<StandardText
														size="xs"
														colorScheme="danger"
														className="mt-1 ml-1 block col-span-12"
													>
														{String(errors.options?.[index]?.emoticon?.message || "")}
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
									)
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
										{questionsArray.length === 1
											? "pregunta definida"
											: "preguntas definidas"}
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
									{questionFields.length === 0
										? "Añadir Pregunta"
										: "Añadir Otra Pregunta"}
								</StandardButton>
							)}
						</StandardCard.Header>
						<StandardCard.Content className="space-y-3">
							{questionFields.length === 0 && isReadOnlyEffective && (
								<StandardText colorScheme="neutral" className="text-sm italic">
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
													isEditing={modo === "editar" && !isReadOnlyEffective}
													rows={3}
													error={errors.questions?.[index]?.question?.message}
													success={getFieldSuccessState(
														"questions",
														index,
														"question"
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
										{examplesArray.length === 1
											? "ejemplo definido"
											: "ejemplos definidos"}
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
									{exampleFields.length === 0
										? "Añadir Ejemplo"
										: "Añadir Otro Ejemplo"}
								</StandardButton>
							)}
						</StandardCard.Header>
						<StandardCard.Content className="space-y-3">
							{exampleFields.length === 0 && isReadOnlyEffective && (
								<StandardText colorScheme="neutral" className="text-sm italic">
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
													isEditing={modo === "editar" && !isReadOnlyEffective}
													rows={3}
													error={errors.examples?.[index]?.example?.message}
													success={getFieldSuccessState(
														"examples",
														index,
														"example"
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
						Elige un ícono de la lista para usarlo como representación visual de la dimensión.
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
							.filter((name) => name.toLowerCase().includes(iconSearch.toLowerCase()))
							.slice(0, 150)
							.map((name) => {
								const IconCmp = lucideIconMap[name];
								return (
									<button
										key={name}
										onClick={() => {
											form.setValue("icon", name, { shouldDirty: true, shouldValidate: true });
											setIconDialogOpen(false);
										}}
										className="flex flex-col items-center justify-center gap-2 p-3 border rounded-md hover:bg-muted/40"
										title={name}
										type="button"
									>
										<StandardIcon>
											<IconCmp className="h-6 w-6" />
										</StandardIcon>
										<span className="text-[10px] text-muted-foreground truncate max-w-[90px]">{name}</span>
									</button>
								);
							})}
					</div>
				</StandardDialog.Body>
				<StandardDialog.Footer>
					<StandardButton styleType="ghost" onClick={() => setIconDialogOpen(false)}>Cerrar</StandardButton>
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>

		{/* Dialogo Selector de Emoji por opción */}
		<StandardDialog open={emojiDialogIndex !== null} onOpenChange={(open) => !open && setEmojiDialogIndex(null)}>
			<StandardDialog.Content size="md" colorScheme="neutral">
				<StandardDialog.Header>
					<StandardDialog.Title>Seleccionar emoji</StandardDialog.Title>
					<StandardDialog.Description>
						Elige un emoji para representar esta opción.
					</StandardDialog.Description>
				</StandardDialog.Header>
				<StandardDialog.Body>
					<div className="grid grid-cols-8 gap-2 max-h-[40vh] overflow-auto pr-1">
						{commonEmojis.map((emo) => (
							<button
								key={emo}
								type="button"
								onClick={() => {
									if (emojiDialogIndex !== null) {
										form.setValue(`options.${emojiDialogIndex}.emoticon` as const, emo, { shouldDirty: true, shouldValidate: true });
									}
									setEmojiDialogIndex(null);
								}}
								className="p-2 text-xl border rounded-md hover:bg-muted/40"
							>
								{emo}
							</button>
						))}
					</div>
				</StandardDialog.Body>
				<StandardDialog.Footer>
					<StandardButton styleType="ghost" onClick={() => setEmojiDialogIndex(null)}>Cerrar</StandardButton>
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
