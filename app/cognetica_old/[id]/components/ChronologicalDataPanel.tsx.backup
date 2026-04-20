// 📍 app/cognetica/[id]/components/ChronologicalDataPanel.tsx
// 🎯 PROPÓSITO: Mostrar datos cronológicos extraídos (fechas, eventos, períodos)
// 🔧 DECISIÓN: Panel simple con lista de eventos ordenados cronológicamente

"use client";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Calendar, Clock, TrendingUp, Milestone } from "lucide-react";

interface ChronologicalData {
	id: string;
	date_value: string | null;
	event_type: string;
	description: string;
	context: string | null;
	confidence_score: number | null;
	extracted_by: string | null;
	created_at: string | null;
	artifact_id: string;
	project_id: string;
	updated_at: string | null;
}

interface ChronologicalDataPanelProps {
	data: ChronologicalData[];
}

const EVENT_TYPE_CONFIG = {
	date: {
		icon: Calendar,
		label: "Fecha",
		colorScheme: "primary" as const,
	},
	event: {
		icon: TrendingUp,
		label: "Evento",
		colorScheme: "accent" as const,
	},
	period: {
		icon: Clock,
		label: "Período",
		colorScheme: "tertiary" as const,
	},
	milestone: {
		icon: Milestone,
		label: "Hito",
		colorScheme: "success" as const,
	},
};

export function ChronologicalDataPanel({ data }: ChronologicalDataPanelProps) {
	if (!data || data.length === 0) {
		return null;
	}

	// Ordenar por fecha (más reciente primero)
	const sortedData = [...data].sort((a, b) => {
		// Intentar parsear las fechas para ordenar
		if (a.date_value && b.date_value) {
			const dateA = new Date(a.date_value);
			const dateB = new Date(b.date_value);

			if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
				return dateB.getTime() - dateA.getTime();
			}

			// Si no se pueden parsear, ordenar alfabéticamente
			return b.date_value.localeCompare(a.date_value);
		}

		// Si alguno no tiene fecha, poner los que tienen fecha primero
		if (a.date_value && !b.date_value) return -1;
		if (!a.date_value && b.date_value) return 1;
		return 0;
	});

	return (
		<StandardCard>
			<StandardCard.Header>
				<div className="flex items-center gap-2">
					<Calendar className="w-5 h-5 text-primary" />
					<StandardText weight="semibold" size="lg">
						Datos Cronológicos
					</StandardText>
					<StandardBadge colorScheme="primary" styleType="subtle">
						{data.length}
					</StandardBadge>
				</div>
			</StandardCard.Header>

			<StandardCard.Content>
				<div className="space-y-3">
					{sortedData.map((item) => {
						const eventType = item.event_type as keyof typeof EVENT_TYPE_CONFIG;
						const config =
							EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.event;
						const Icon = config.icon;

						return (
							<div
								key={item.id}
								className="p-3 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0 mt-1">
										<Icon className="w-5 h-5 text-primary" />
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<StandardText weight="semibold" colorScheme="primary">
												{item.date_value || "Sin fecha"}
											</StandardText>
											<StandardBadge
												colorScheme={config.colorScheme}
												styleType="subtle"
												size="sm">
												{config.label}
											</StandardBadge>
											{item.confidence_score &&
												item.confidence_score >= 0.8 && (
													<StandardBadge
														colorScheme="success"
														styleType="subtle"
														size="sm">
														Alta confianza
													</StandardBadge>
												)}
										</div>

										<StandardText size="sm" className="mb-2">
											{item.description}
										</StandardText>

										{item.context && (
											<StandardText
												size="xs"
												colorScheme="neutral"
												colorShade="textShade"
												className="italic">
												&ldquo;{item.context.substring(0, 150)}
												{item.context.length > 150 ? "..." : ""}&rdquo;
											</StandardText>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</StandardCard.Content>
		</StandardCard>
	);
}
