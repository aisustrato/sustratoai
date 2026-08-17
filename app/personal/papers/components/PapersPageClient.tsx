// 📍 app/personal/papers/components/PapersPageClient.tsx
// Componente cliente para botones con iconos en la página de papers

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StandardButton } from "@/components/ui/StandardButton";
import { Plus, Eye, Edit, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { deletePaper } from "@/lib/papers/queries";

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

// Botón "Eliminar" (borra el paper — testing: una sola base cloud, sin dev/prod)
export function DeleteButton({ id, title }: { id: string; title: string }) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (
			!confirm(
				`¿Eliminar "${title}" definitivamente? Esta acción no se puede deshacer.`,
			)
		) {
			return;
		}

		setIsDeleting(true);
		const toastId = toast.loading(`Eliminando "${title}"…`);
		try {
			await deletePaper(id);
			toast.success("Paper eliminado", { id: toastId });
			router.refresh();
		} catch (err) {
			console.error("[DeleteButton] Error eliminando paper:", err);
			const msg = err instanceof Error ? err.message : "Error desconocido";
			toast.error(`No se pudo eliminar: ${msg}`, {
				id: toastId,
				duration: Infinity,
			});
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<StandardButton
			styleType="outline"
			colorScheme="danger"
			size="sm"
			onClick={handleDelete}
			loading={isDeleting}
			loadingText="Eliminando..."
			title="Eliminar paper"
			leftIcon={Trash2}>
			Eliminar
		</StandardButton>
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
