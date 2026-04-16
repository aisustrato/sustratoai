"use client";

import { StandardCard } from "@/components/ui/StandardCard";
import Link from "next/link";
import { StandardBadge } from "@/components/ui/StandardBadge";
import {
	LotesIcon,
	FasesIcon,
	EquipoIcon,
	AnalisisIcon,
	ArticulosIcon,
	DimensionesIcon,
} from "@/lib/svg/components";

export function HomeCards() {
	// Paleta de colores según el archivo USAGE.jsx
	const colorPalettes = {
		lotes: "#0F6E56",
		fases: "#534AB7",
		equipo: "#0F6E56",
		analisis: "#534AB7",
		articulos: "#185FA5",
		dimensiones: "#D85A30",
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
			{/* Card de Lotes */}
			<Link href="/articulos/preclasificacion" className="block group">
				<StandardCard
					colorScheme="primary"
					accentPlacement="top"
					animateEntrance
					disableShadowHover={false}
					onCardClick={() =>
						(window.location.href = "/articulos/preclasificacion")
					}
					className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
					<StandardCard.Content className="flex flex-col h-full">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-foreground">Lotes</h3>
								<StandardBadge
									colorScheme="success"
									styleType="subtle"
									size="sm">
									4 activos
								</StandardBadge>
							</div>
							<p className="text-sm text-muted-foreground mb-4">
								Gestión de lotes de artículos para preclasificación
							</p>
						</div>
						<div
							className="flex justify-end"
							style={{ color: colorPalettes.lotes }}>
							<LotesIcon width={80} height={80} />
						</div>
					</StandardCard.Content>
				</StandardCard>
			</Link>

			{/* Card de Fases */}
			<Link href="/datos-maestros/fases" className="block group">
				<StandardCard
					colorScheme="secondary"
					accentPlacement="top"
					animateEntrance
					disableShadowHover={false}
					onCardClick={() => (window.location.href = "/datos-maestros/fases")}
					className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
					<StandardCard.Content className="flex flex-col h-full">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-foreground">Fases</h3>
								<StandardBadge
									colorScheme="warning"
									styleType="outline"
									size="sm">
									2 configuradas
								</StandardBadge>
							</div>
							<p className="text-sm text-muted-foreground mb-4">
								Configuración de fases del proyecto de investigación
							</p>
						</div>
						<div
							className="flex justify-end"
							style={{ color: colorPalettes.fases }}>
							<FasesIcon width={80} height={80} />
						</div>
					</StandardCard.Content>
				</StandardCard>
			</Link>

			{/* Card de Equipo */}
			<Link href="#" className="block group">
				<StandardCard
					colorScheme="accent"
					accentPlacement="top"
					animateEntrance
					disableShadowHover={false}
					onCardClick={() => console.log("Equipo card clicked")}
					className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
					<StandardCard.Content className="flex flex-col h-full">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-foreground">
									Equipo
								</h3>
								<StandardBadge
									colorScheme="primary"
									styleType="subtle"
									size="sm">
									2 miembros
								</StandardBadge>
							</div>
							<p className="text-sm text-muted-foreground mb-4">
								Gestión del equipo de investigación y roles
							</p>
						</div>
						<div
							className="flex justify-end"
							style={{ color: colorPalettes.equipo }}>
							<EquipoIcon width={80} height={80} />
						</div>
					</StandardCard.Content>
				</StandardCard>
			</Link>

			{/* Card de Análisis */}
			<Link href="/articulos/analisis-preclasificacion" className="block group">
				<StandardCard
					colorScheme="tertiary"
					accentPlacement="top"
					animateEntrance
					disableShadowHover={false}
					onCardClick={() =>
						(window.location.href = "/articulos/analisis-preclasificacion")
					}
					className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
					<StandardCard.Content className="flex flex-col h-full">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-foreground">
									Análisis
								</h3>
								<StandardBadge
									colorScheme="success"
									styleType="subtle"
									size="sm">
									Activo
								</StandardBadge>
							</div>
							<p className="text-sm text-muted-foreground mb-4">
								Análisis de datos de preclasificación y métricas
							</p>
						</div>
						<div
							className="flex justify-end"
							style={{ color: colorPalettes.analisis }}>
							<AnalisisIcon width={80} height={80} />
						</div>
					</StandardCard.Content>
				</StandardCard>
			</Link>

			{/* Card de Artículos */}
			<Link href="/articulos" className="block group">
				<StandardCard
					colorScheme="secondary"
					accentPlacement="top"
					animateEntrance
					disableShadowHover={false}
					onCardClick={() => (window.location.href = "/articulos")}
					className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
					<StandardCard.Content className="flex flex-col h-full">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-foreground">
									Artículos
								</h3>
								<StandardBadge
									colorScheme="warning"
									styleType="outline"
									size="sm">
									156 totales
								</StandardBadge>
							</div>
							<p className="text-sm text-muted-foreground mb-4">
								Gestión de artículos académicos y metadatos
							</p>
						</div>
						<div
							className="flex justify-end"
							style={{ color: colorPalettes.articulos }}>
							<ArticulosIcon width={80} height={80} />
						</div>
					</StandardCard.Content>
				</StandardCard>
			</Link>

			{/* Card de Dimensiones */}
			<Link href="/datos-maestros/dimensiones" className="block group">
				<StandardCard
					colorScheme="danger"
					accentPlacement="top"
					animateEntrance
					disableShadowHover={false}
					onCardClick={() =>
						(window.location.href = "/datos-maestros/dimensiones")
					}
					className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
					<StandardCard.Content className="flex flex-col h-full">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-semibold text-foreground">
									Dimensiones
								</h3>
								<StandardBadge
									colorScheme="danger"
									styleType="subtle"
									size="sm">
									7 configuradas
								</StandardBadge>
							</div>
							<p className="text-sm text-muted-foreground mb-4">
								Configuración de dimensiones de preclasificación
							</p>
						</div>
						<div
							className="flex justify-end"
							style={{ color: colorPalettes.dimensiones }}>
							<DimensionesIcon width={80} height={80} />
						</div>
					</StandardCard.Content>
				</StandardCard>
			</Link>
		</div>
	);
}
