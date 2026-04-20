// 📍 app/cognetica_old/minotauro/components/CreateUniverseModal.tsx
// 🎯 PROPÓSITO: Modal para crear un nuevo universo (escrito)

"use client";

import { useState } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardText } from "@/components/ui/StandardText";
import { createUniverse } from "@/lib/actions/minotauro-actions";
import { useToast } from "@/hooks/use-toast";

interface CreateUniverseModalProps {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function CreateUniverseModal({
	projectId,
	open,
	onOpenChange,
	onSuccess,
}: CreateUniverseModalProps) {
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		subtitle: "",
		purpose: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title.trim()) {
			toast({
				title: "Error",
				description: "El título es obligatorio",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);

		const result = await createUniverse({
			project_id: projectId,
			title: formData.title.trim(),
			subtitle: formData.subtitle.trim() || undefined,
			purpose: formData.purpose.trim() || undefined,
		});

		setLoading(false);

		if (result.success) {
			toast({
				title: "✨ Universo creado",
				description: `"${formData.title}" está listo para comenzar`,
			});

			// Resetear formulario
			setFormData({ title: "", subtitle: "", purpose: "" });
			onOpenChange(false);
			onSuccess();
		} else {
			toast({
				title: "Error al crear universo",
				description: result.error || "Intenta nuevamente",
				variant: "destructive",
			});
		}
	};

	return (
		<StandardDialog open={open} onOpenChange={onOpenChange}>
			<StandardDialog.Content colorScheme="primary" size="md">
				<StandardDialog.Header>
					<StandardDialog.Title>🐂 Nuevo Escrito</StandardDialog.Title>
					<StandardDialog.Description>
						Crea un nuevo universo para tu paper académico
					</StandardDialog.Description>
				</StandardDialog.Header>

				<StandardDialog.Body>
					<form
						onSubmit={handleSubmit}
						className="space-y-4"
						id="create-universe-form">
						{/* Título */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Título <span className="text-destructive">*</span>
							</label>
							<StandardInput
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								placeholder="Ej: Termodinámica de la Investigación Cualitativa"
								disabled={loading}
								required
							/>
						</div>

						{/* Subtítulo */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Subtítulo{" "}
								<span className="text-muted-foreground">(opcional)</span>
							</label>
							<StandardInput
								value={formData.subtitle}
								onChange={(e) =>
									setFormData({ ...formData, subtitle: e.target.value })
								}
								placeholder="Ej: Un enfoque desde la física social"
								disabled={loading}
							/>
						</div>

						{/* Propósito (Semilla) */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								🎯 Propósito / Semilla{" "}
								<span className="text-muted-foreground">(opcional)</span>
							</label>
							<StandardTextarea
								value={formData.purpose}
								onChange={(e) =>
									setFormData({ ...formData, purpose: e.target.value })
								}
								placeholder="¿Para qué escribes esto? ¿Qué quieres transmitir?"
								rows={3}
								disabled={loading}
							/>
							<StandardText size="xs" className="text-muted-foreground">
								La semilla del universo - el &ldquo;para qué&rdquo; de este
								escrito
							</StandardText>
						</div>
					</form>
				</StandardDialog.Body>

				<StandardDialog.Footer>
					<StandardDialog.Close asChild>
						<StandardButton colorScheme="neutral" disabled={loading}>
							Cancelar
						</StandardButton>
					</StandardDialog.Close>
					<StandardButton
						type="submit"
						form="create-universe-form"
						colorScheme="primary"
						disabled={loading}>
						{loading ? "Creando..." : "✨ Crear Universo"}
					</StandardButton>
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
