// 📍 components/dashboard/DashboardMetricCard.tsx
// 🎯 PROPÓSITO: Card pequeña para mostrar métricas individuales en el dashboard
// 🔧 DECISIÓN: Componente reutilizable con iconos y navegación

//#region [imports] - 📦 IMPORTS
import { LucideIcon } from "lucide-react";
import {
	StandardCard,
	StandardCardContent,
} from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import type { CardVariant } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import Link from "next/link";
//#endregion

//#region [types] - 🎨 TIPOS
interface DashboardMetricCardProps {
	icon?: LucideIcon;
	customIcon?: React.ReactNode;
	title: string;
	value: number | string;
	detail?: string;
	buttonText?: string;
	buttonHref?: string;
	colorScheme?: CardVariant;
	isEmpty?: boolean;
	emptyMessage?: string;
	clickable?: boolean;
	href?: string;
}
//#endregion

//#region [component] - 🚀 COMPONENTE PRINCIPAL
export function DashboardMetricCard({
	icon: Icon,
	customIcon,
	title,
	value,
	detail,
	buttonText,
	buttonHref,
	colorScheme = "neutral",
	isEmpty = false,
	emptyMessage,
	clickable = false,
	href,
}: DashboardMetricCardProps) {
	const cardContent = (
		<StandardCard
			colorScheme={colorScheme}
			styleType="subtle"
			accentPlacement="left"
			onCardClick={
				clickable && href ? () => (window.location.href = href) : undefined
			}
			className={`h-full ${clickable ? "cursor-pointer hover:shadow-lg transition-all duration-300" : ""}`}>
			<StandardCardContent className="p-6">
				<div className="flex items-start justify-between">
					{/* Contenido izquierdo: Título, valor y descripción */}
					<div className="flex-1">
						<StandardText
							applyGradient="neutral"
							preset="subheading"
							size="lg"
							className="font-semibold mb-3">
							{title}
						</StandardText>

						{isEmpty ?
							<div className="space-y-2">
								<StandardText
									applyGradient="secondary"
									preset="heading"
									size="4xl"
									className="font-bold">
									0
								</StandardText>
								<p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
									{emptyMessage || `Sin ${title.toLowerCase()}`}
								</p>
							</div>
						:	<div className="space-y-2">
								<StandardText
									applyGradient="secondary"
									preset="heading"
									size="4xl"
									className="font-bold">
									{value}
								</StandardText>
								{detail && (
									<p className="text-sm text-neutral-600 dark:text-neutral-400">
										{detail}
									</p>
								)}
							</div>
						}
					</div>

					{/* SVG a la derecha, más grande y centrado verticalmente */}
					<div
						className="flex-shrink-0 ml-6 flex items-center justify-center"
						style={{ color: `var(--color-${colorScheme}-600)` }}>
						{customIcon || (Icon && <Icon size={48} />)}
					</div>
				</div>

				{!clickable && buttonText && buttonHref && (
					<div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
						<Link href={buttonHref} className="w-full">
							<StandardButton
								styleType="outline"
								colorScheme={colorScheme as ColorSchemeVariant}
								size="sm"
								className="w-full">
								{buttonText}
							</StandardButton>
						</Link>
					</div>
				)}
			</StandardCardContent>
		</StandardCard>
	);

	// Si es clickeable y tiene href, envolver en Link
	if (clickable && href) {
		return (
			<Link href={href} className="block group">
				{cardContent}
			</Link>
		);
	}

	// Si es clickeable pero no tiene href (para uso externo), devolver solo la card
	return cardContent;
}
//#endregion
