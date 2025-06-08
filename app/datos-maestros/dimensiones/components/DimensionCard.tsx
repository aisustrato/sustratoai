//. 📍 app/datos-maestros/dimensiones/components/DimensionCard.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React from "react";
import { useRipple } from "@/components/ripple/RippleProvider";
import { useTheme } from "@/app/theme-provider";
import { type FullDimension } from "@/lib/actions/dimension-actions";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text } from "@/components/ui/text";
import { BadgeCustom } from "@/components/ui/badge-custom";
import { CustomButton } from "@/components/ui/custom-button";
import { PenLine, Trash2, Eye, GripVertical } from "lucide-react"; // GripVertical para drag handle
import { BadgeVariant } from "@/lib/theme/components/badge-tokens";
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
	let cardColorVariant: BadgeVariant = "neutral";
	if (dimension.type === "finite")
		cardColorVariant = "success"; // ej. verde para finitas
	else if (dimension.type === "open") cardColorVariant = "info"; // ej. azul para abiertas

	const { appColorTokens, mode } = useTheme();
	const triggerRipple = useRipple();

	// Color para el ripple (accent background)
	const accentBg = appColorTokens?.accent?.bg || appColorTokens?.primary?.bg || "#4f46e5";

	const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
		triggerRipple(e, accentBg, 10);
		onViewDetails();
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
			accentColorScheme="neutral"
			disableShadowHover={true}
			styleType="subtle"
			shadow="md"
			animateEntrance
			onCardClick={handleCardClick}
		>
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
						<div className="flex items-start justify-between">
							<Text
								variant="heading"
								size="md"
								weight="semibold"
								className="flex-grow mr-2"
								truncate
							>
								{dimension.name}
							</Text>
							<BadgeCustom variant={cardColorVariant} className="flex-shrink-0">
								{tipoLabel}
							</BadgeCustom>
						</div>
						{canManage && (
							<div className="flex justify-end gap-1 mt-1">
								<CustomButton
									size="sm"
									variant="ghost"
									iconOnly
									onClick={onEdit}
									disabled={isBeingDeleted}
									tooltip="Editar dimensión"
								>
									<PenLine className="h-5 w-5" />
								</CustomButton>
								<CustomButton
									size="sm"
									variant="ghost"
									iconOnly
									color="danger"
									onClick={onDelete}
									disabled={isBeingDeleted}
									tooltip="Eliminar dimensión"
								>
									<Trash2 className="h-5 w-5" />
								</CustomButton>
							</div>
						)}
					</div>
				</StandardCard.Header>

				<StandardCard.Content className="p-0 flex-grow">
					{" "}
					{/* Eliminar padding por defecto */}
					{dimension.description && (
						<Text
							variant="default"
							color="muted"
							size="sm"
							className="mb-3 line-clamp-3">
							{" "}
							{/* Limitar líneas de descripción */}
							{dimension.description}
						</Text>
					)}
					{dimension.type === "finite" && dimension.options.length > 0 && (
						<div className="mb-3">
							<Text
								variant="label"
								size="xs"
								weight="medium"
								color="secondary"
								className="mb-1 block">
								Opciones Principales:
							</Text>
							<div className="flex flex-wrap gap-1">
								{dimension.options.slice(0, 4).map(
									(
										opt // Mostrar solo las primeras N opciones
									) => (
										<BadgeCustom key={opt.id} variant="neutral" subtle>
											{opt.value}
										</BadgeCustom>
									)
								)}
								{dimension.options.length > 4 && (
									<BadgeCustom variant="neutral" subtle>
										+{dimension.options.length - 4} más
									</BadgeCustom>
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
							<Text
								variant="caption"
								color="muted"
								className="italic mt-auto pt-2">
								Esta dimensión abierta no tiene preguntas guía ni ejemplos
								definidos aún.
							</Text>
						)}
					{dimension.type === "finite" && dimension.options.length === 0 && (
						<Text
							variant="caption"
							color="warning"
							className="italic mt-auto pt-2">
							Esta dimensión de selección múltiple no tiene opciones definidas.
						</Text>
					)}
				</StandardCard.Content>
			</div>
			{/* <StandardCard.Footer className="p-2">
            <CustomButton variant="outline" size="sm" onClick={onViewDetails} leftIcon={<Eye className="h-4 w-4"/>}>
                Ver Detalles
            </CustomButton>
        </StandardCard.Footer> */}
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
