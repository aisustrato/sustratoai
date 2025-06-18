// En: /app/showroom/tabs/page.tsx

"use client";

import * as React from "react";
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs"; // Asumiendo que los exportas desde un index
import { TabsContent } from "@radix-ui/react-tabs";
import { StandardCard } from "@/components/ui/StandardCard";
import { Coffee, Code, Component } from "lucide-react";

// Es una buena práctica crear un componente de ejemplo reutilizable.
const TabExample = ({
	colorScheme,
	styleType,
	size,
}: {
	colorScheme: "primary" | "secondary" | "accent" | "danger";
	styleType: "line" | "enclosed";
	size?: "sm" | "md" | "lg";
}) => (
	<StandardTabs
		defaultValue="tab1"
		colorScheme={colorScheme}
		styleType={styleType}
		size={size}>
		<StandardTabsList>
			<StandardTabsTrigger value="tab1">Perfil</StandardTabsTrigger>
			<StandardTabsTrigger value="tab2">Dashboard</StandardTabsTrigger>
			<StandardTabsTrigger value="tab3" disabled>
				Ajustes (Deshabilitado)
			</StandardTabsTrigger>
		</StandardTabsList>
		<TabsContent value="tab1" className="p-4 border-t-0 border rounded-b-md">
			Contenido del Tab de Perfil.
		</TabsContent>
		<TabsContent value="tab2" className="p-4 border-t-0 border rounded-b-md">
			Contenido del Tab de Dashboard.
		</TabsContent>
	</StandardTabs>
);

export default function TabsShowroomPage() {
	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold mb-4">Showroom: StandardTabs</h1>
			<p className="text-muted-foreground mb-8">
				Página de pruebas para el ecosistema de componentes de StandardTabs.
			</p>

			{/* --- SECCIÓN: STYLETYPE "LINE" --- */}
			<h2 className="text-2xl font-semibold mt-8 mb-4">
				Estilo: "line" (por defecto)
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<StandardCard>
					<StandardCard.Header title="Color: Primary" />
					<StandardCard.Content>
						<TabExample colorScheme="primary" styleType="line" />
					</StandardCard.Content>
				</StandardCard>
				<StandardCard>
					<StandardCard.Header title="Color: Secondary" />
					<StandardCard.Content>
						<TabExample colorScheme="secondary" styleType="line" />
					</StandardCard.Content>
				</StandardCard>
				<StandardCard>
					<StandardCard.Header title="Color: Accent" />
					<StandardCard.Content>
						<TabExample colorScheme="accent" styleType="line" />
					</StandardCard.Content>
				</StandardCard>
				<StandardCard>
					<StandardCard.Header title="Color: Danger" />
					<StandardCard.Content>
						<TabExample colorScheme="danger" styleType="line" />
					</StandardCard.Content>
				</StandardCard>
			</div>

			{/* --- SECCIÓN: STYLETYPE "ENCLOSED" --- */}
			<h2 className="text-2xl font-semibold mt-12 mb-4">Estilo: "enclosed"</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<StandardCard>
					<StandardCard.Header title="Color: Primary" />
					<StandardCard.Content>
						<TabExample colorScheme="primary" styleType="enclosed" />
					</StandardCard.Content>
				</StandardCard>
				<StandardCard>
					<StandardCard.Header title="Color: Secondary" />
					<StandardCard.Content>
						<TabExample colorScheme="secondary" styleType="enclosed" />
					</StandardCard.Content>
				</StandardCard>
			</div>

			{/* --- SECCIÓN: VARIACIONES DE TAMAÑO --- */}
			<h2 className="text-2xl font-semibold mt-12 mb-4">
				Variaciones de Tamaño (`size`)
			</h2>
			<div className="space-y-6">
				<StandardCard>
					<StandardCard.Header title="Size: 'sm'" />
					<StandardCard.Content>
						<TabExample colorScheme="primary" styleType="line" size="sm" />
					</StandardCard.Content>
				</StandardCard>
				<StandardCard>
					<StandardCard.Header title="Size: 'md' (por defecto)" />
					<StandardCard.Content>
						<TabExample colorScheme="primary" styleType="line" size="md" />
					</StandardCard.Content>
				</StandardCard>
				<StandardCard>
					<StandardCard.Header title="Size: 'lg'" />
					<StandardCard.Content>
						<TabExample colorScheme="primary" styleType="line" size="lg" />
					</StandardCard.Content>
				</StandardCard>
			</div>
		</div>
	);
}
