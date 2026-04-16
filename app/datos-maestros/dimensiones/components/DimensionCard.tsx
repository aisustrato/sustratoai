//. 📍 app/datos-maestros/dimensiones/components/DimensionCard.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React from "react";
import { useRipple } from "@/components/ripple/RippleProvider";
import { useTheme } from "@/app/theme-provider";
import { type FullDimension } from "@/lib/actions/dimension-actions";
import {
	StandardCard,
	type StandardCardColorScheme,
} from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { PenLine, Trash2 } from "lucide-react"; // GripVertical para drag handle, Eye para ver detalles (comentado)
import * as LucideIcons from "lucide-react"; // ✅ Importar todos los iconos para renderizado dinámico

import { cn } from "@/lib/utils";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
// import { useSortable } from '@dnd-kit/sortable'; // Descomentar para dnd-kit
// import { CSS } from '@dnd-kit/utilities'; // Descomentar para dnd-kit
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface DimensionCardProps {
	dimension: FullDimension;
	onEdit: () => void;
	onDelete: () => void;
	onViewDetails: () => void;
	canManage: boolean;
	isBeingDeleted?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const DimensionCard: React.FC<DimensionCardProps> = ({
	dimension,
	onEdit,
	onDelete,
	onViewDetails,
	canManage,
	isBeingDeleted = false,
	// id, // para useSortable
}) => {
	// const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id: id}); // Para dnd-kit
	// const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, opacity: isDragging ? 0.8 : 1 }; // Para dnd-kit

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const tipoLabel =
		dimension.type === "finite" ? "Selección Múltiple" : "Respuesta Abierta";

	// Determinar variante de color para el borde y badge de tipo
	// Puedes ajustar esto según tu paleta de colores
	let dynamicColorScheme: StandardCardColorScheme = "primary"; // Fallback
	if (dimension.type === "finite") {
		dynamicColorScheme = "secondary";
	} else if (dimension.type === "open") {
		dynamicColorScheme = "tertiary";
	}

	const { appColorTokens } = useTheme();
	const triggerRipple = useRipple();

	// Color para el ripple (accent background)
	const accentBg =
		appColorTokens?.accent?.bg || appColorTokens?.primary?.bg || "#4f46e5";

	const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
		triggerRipple(e, accentBg, 10);
		onViewDetails();
	};

	// ✅ Renderizar icono dinámicamente desde el nombre guardado
	const renderIcon = () => {
		if (!dimension.icon) return null;
		
		// Obtener el componente del icono desde lucide-react
		const IconComponent = (LucideIcons as any)[dimension.icon];
		
		if (!IconComponent) {
			// Si el icono no existe, mostrar un icono por defecto
			return <LucideIcons.Circle className="h-4 w-4 inline-block mr-1" />;
		}
		
		return <IconComponent className="h-4 w-4 inline-block mr-1" />;
	};
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		// <div ref={setNodeRef} style={style}> {/* Envolver con esto para dnd-kit */}
		<StandardCard
			className={cn(
				"flex flex-col h-full group relative",
				isBeingDeleted && "opacity-50 pointer-events-none"
			)}
			accentPlacement="top"
			colorScheme="primary"
			accentColorScheme={dynamicColorScheme}
			disableShadowHover={false}
			styleType="subtle"
			shadow="md"
			animateEntrance
			onCardClick={handleCardClick}>
			{isBeingDeleted && (
				<div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
					<SustratoLoadingLogo size={30} />
				</div>
			)}

			{/* El div se mantiene por estructura, pero sin el onClick */}
			<div
				className="cursor-pointer flex-grow flex flex-col p-4" // onClick removed
				tabIndex={0} // tabIndex can remain for focusability if needed, though card itself might handle it
				role="button" // Role might be redundant if StandardCard handles it
				aria-label={`Ver detalles de ${dimension.name}`} // Aria-label good for accessibility
			>
				<StandardCard.Header className="p-0 mb-2">
					<div className="flex flex-col gap-1">
						<StandardText
							preset="title"
							size="md"
							weight="semibold" // Se puede revisar si preset="title" ya lo incluye
							truncate>
							{renderIcon()}
							{dimension.name}
						</StandardText>
						<StandardBadge
							size="xs"
							colorScheme={dynamicColorScheme}
							className="mt-1 self-start"> {/* Añadido margen superior */}
							{tipoLabel}
						</StandardBadge>
						{canManage && (
							<div className="flex justify-end gap-1 mt-1">
								<StandardButton
									size="xs"
									styleType="ghost"
									onClick={(e) => { e.stopPropagation(); onEdit(); }}
									disabled={isBeingDeleted}
									tooltip="Editar dimensión"
									leftIcon={PenLine}
									iconOnly={true}
									aria-label="Editar dimensión" />
								<StandardButton
									size="sm"
									styleType="ghost"
									colorScheme="danger"
									onClick={(e) => { e.stopPropagation(); onDelete(); }}
									disabled={isBeingDeleted}
									tooltip="Eliminar dimensión"
									leftIcon={Trash2}
									iconOnly={true}
									aria-label="Eliminar dimensión" />
							</div>
						)}
					</div>
				</StandardCard.Header>

				<StandardCard.Content className="p-0 flex-grow">
					{" "}
					{/* Eliminar padding por defecto */}
					{dimension.description && (
						<StandardText
							colorScheme="neutral"
							size="sm"
							className="mb-3 line-clamp-3">
							{" "}
							{/* Limitar líneas de descripción */}
							{dimension.description}
						</StandardText>
					)}
					{dimension.type === "finite" && dimension.options.length > 0 && (
						<div className="mb-3">
							<StandardText
								size="md"
								weight="medium"
								colorScheme="secondary"
								className="mb-1 block">
								Opciones Principales:
							</StandardText>
							<div className="flex flex-wrap gap-1">
								{dimension.options.slice(0, 4).map(
									(
										opt // Mostrar solo las primeras N opciones
									) => (
										<StandardBadge
											key={opt.id}
											size="xs"
											colorScheme="neutral"
											styleType="subtle">
											{opt.emoticon ? (
												<span aria-hidden className="mr-1">{opt.emoticon}</span>
											) : null}
											{opt.value}
										</StandardBadge>
									)
								)}
								{dimension.options.length > 4 && (
									<StandardBadge size="xs" colorScheme="neutral" styleType="subtle">
										+{dimension.options.length - 4} más
									</StandardBadge>
								)}
							</div>
						</div>
					)}
					{(dimension.questions.length > 0 ||
						dimension.examples.length > 0) && (
						<div className="mt-auto pt-2 text-xs text-muted-foreground space-y-0.5">
							{" "}
							{/* mt-auto para empujar al fondo si es flex-col */}
							{dimension.questions.length > 0 && (
								<div>{dimension.questions.length} Pregunta(s) Guía</div>
							)}
							{dimension.examples.length > 0 && (
								<div>{dimension.examples.length} Ejemplo(s) Ilustrativo(s)</div>
							)}
						</div>
					)}
					{dimension.type === "open" &&
						dimension.questions.length === 0 &&
						dimension.examples.length === 0 && (
							<StandardText
								colorScheme="neutral"
								className="italic mt-auto pt-2">
								Esta dimensión abierta no tiene preguntas guía ni ejemplos
								definidos aún.
							</StandardText>
						)}
					{dimension.type === "finite" && dimension.options.length === 0 && (
						<StandardText
							preset="caption"
							colorScheme="warning"
							className="italic mt-auto pt-2">
							Esta dimensión de selección múltiple no tiene opciones definidas.
						</StandardText>
					)}
				</StandardCard.Content>
			</div>
		</StandardCard>
		// </div> // Cierre del div para dnd-kit
	);
	//#endregion ![render]
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Descomentar y configurar dnd-kit para drag and drop functionality.
// Considerar optimizaciones de rendimiento para listas muy largas.
//#endregion ![todo]
