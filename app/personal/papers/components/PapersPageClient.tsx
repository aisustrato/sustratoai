// 📍 app/personal/papers/components/PapersPageClient.tsx
// Componente cliente para botones con iconos en la página de papers

"use client";

import { StandardButton } from "@/components/ui/StandardButton";
import { Plus, Eye, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PapersPageClientProps {
	hasPapers: boolean;
	papers: Array<{
		id: string;
		is_published: boolean;
		slug: string;
	}>;
}

export function PapersPageClient({ hasPapers, papers }: PapersPageClientProps) {
	// Si no hay papers, mostrar botón "Crear Primer Paper"
	if (!hasPapers) {
		return (
			<Link href="/personal/papers/nuevo">
				<StandardButton
					styleType="solid"
					colorScheme="primary"
					size="md"
					leftIcon={Plus}>
					Crear Primer Paper
				</StandardButton>
			</Link>
		);
	}

	// Este componente no renderiza nada directamente en el flujo normal
	// Los botones individuales se renderizan mapeando los papers
	return null;
}

// Botón "Crear Primer Paper" para estado vacío
export function CreateFirstPaperButton() {
	return (
		<Link href="/personal/papers/nuevo">
			<StandardButton
				styleType="solid"
				colorScheme="primary"
				size="md"
				leftIcon={Plus}>
				Crear Primer Paper
			</StandardButton>
		</Link>
	);
}

// Botón "Nuevo Paper" para el header
export function NewPaperButton() {
	return (
		<Link href="/personal/papers/nuevo">
			<StandardButton
				styleType="solid"
				colorScheme="primary"
				size="lg"
				leftIcon={Plus}>
				Nuevo Paper
			</StandardButton>
		</Link>
	);
}

// Botón "Ver en DMZ" (para papers publicados)
export function ViewDmzButton({ slug }: { slug: string }) {
	return (
		<Link href={`/papers/${slug}`} target="_blank">
			<StandardButton
				styleType="ghost"
				size="sm"
				title="Ver en DMZ"
				leftIcon={ExternalLink}
				iconOnly
			/>
		</Link>
	);
}

// Botón "Vista previa" (para borradores)
export function PreviewButton({ slug }: { slug: string }) {
	return (
		<Link href={`/papers/${slug}`}>
			<StandardButton
				styleType="ghost"
				size="sm"
				title="Vista previa"
				leftIcon={Eye}
				iconOnly
			/>
		</Link>
	);
}

// Botón "Editar"
export function EditButton({ id }: { id: string }) {
	return (
		<Link
			href={`/personal/papers/${id}`}
			onClick={() => {
				console.log(
					`[${new Date().toISOString()}] 🖊️ Click EDITAR - Paper ID: ${id}`,
				);
			}}>
			<StandardButton
				styleType="outline"
				colorScheme="primary"
				size="sm"
				leftIcon={Edit}>
				Editar
			</StandardButton>
		</Link>
	);
}
