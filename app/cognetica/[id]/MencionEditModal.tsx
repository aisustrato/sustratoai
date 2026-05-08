//. 📍 app/cognetica/[id]/MencionEditModal.tsx
/**
 * Modal de **edición humana** (Capa 3) de una mención cartografiada.
 *
 * - Entrada: una `MencionConValorCanonico` (el tipo discriminado del
 *   Hito 2 + vistas de valor canónico).
 * - Muestra 3 paneles de contexto (extractor / cartografiador / humano
 *   último) para que el usuario entienda qué está tocando.
 * - Permite editar los campos básicos del tipo (nombre/descripción/...
 *   definidos en `CAMPOS_EDICION_BASICOS`). Otras operaciones del
 *   Hito 2 (reasignar_entidad_canonica, marcar_semilla_fractal,
 *   asignar_disciplina_madre, actualizar_autores) quedan para un hito
 *   con UI dedicada — no encajan en un form lineal.
 * - **Justificación obligatoria** (≥5 chars). La Server Action admite
 *   null pero la UI del Hito 4 la exige (guía §3 HITO 4).
 * - Al submit: emite una llamada `editarMencionHumana` por cada campo
 *   modificado, con la misma justificación. Si alguna falla, muestra
 *   error inline; si todas pasan, cierra el modal y notifica al padre.
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";

import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardText } from "@/components/ui/StandardText";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardBadge } from "@/components/ui/StandardBadge";

import { editarMencionHumana } from "@/lib/actions/cognetica-forense-menciones-actions";
import type { MencionConValorCanonico } from "@/lib/actions/cognetica-forense-menciones-actions";
import {
	CAMPOS_EDICION_BASICOS,
	colorDesdeDecision,
	descriptorPorTipo,
	etiquetaDecision,
} from "@/lib/cognetica-forense/ui/menciones-ui-helpers";
import type {
	CampoEdicionPorTipo,
	TipoEntidad,
} from "@/lib/cognetica-forense/types/oleada2";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface MencionEditModalProps {
	item: MencionConValorCanonico | null;
	onClose: () => void;
	/** Se invoca tras un save exitoso para que el padre refetchee. */
	onSaved: () => void;
}

/** Mínimo de caracteres de justificación (UI-only; DB acepta null). */
const MIN_JUSTIFICACION = 5;
//#endregion ![def]

//#region [helpers] - 🛠️ VALORES INICIALES 🛠️
/**
 * Extrae el valor canónico actual de cada campo editable. Es
 * despachado por tipo porque el shape de `valor_canonico` difiere entre
 * citas (texto/autor/referencia/tipo_cita) y los otros 4 (nombre/descripcion).
 */
function leerValorCanonico(
	item: MencionConValorCanonico,
	campo: string,
): string {
	const v = item.valor_canonico as Record<string, unknown>;
	if (item.tipo === "cita") {
		switch (campo) {
			case "texto":
				return (v.texto_canonico_actual as string | null) ?? "";
			case "autor":
				return (v.autor_canonico_actual as string | null) ?? "";
			case "referencia":
				return (v.referencia_canonica_actual as string | null) ?? "";
			case "tipo_cita":
				return (v.tipo_cita_canonico_actual as string | null) ?? "";
			default:
				return "";
		}
	}
	switch (campo) {
		case "nombre":
			return (v.nombre_canonico_actual as string | null) ?? "";
		case "descripcion":
			return (v.descripcion_canonica_actual as string | null) ?? "";
		default:
			return "";
	}
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
export function MencionEditModal({
	item,
	onClose,
	onSaved,
}: MencionEditModalProps) {
	// Estado interno. Se resetea cada vez que cambia el `item` de entrada.
	const [valores, setValores] = useState<Record<string, string>>({});
	const [justificacion, setJustificacion] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Inicialización reactiva: cuando llega un nuevo item, poblamos el
	// form con los valores canónicos actuales y limpiamos estado transitorio.
	useEffect(() => {
		if (!item) {
			setValores({});
			setJustificacion("");
			setError(null);
			return;
		}
		const campos = CAMPOS_EDICION_BASICOS[item.tipo];
		const iniciales: Record<string, string> = {};
		for (const c of campos) {
			iniciales[c.campo] = leerValorCanonico(item, c.campo);
		}
		setValores(iniciales);
		setJustificacion("");
		setError(null);
	}, [item]);

	const descriptor = item ? descriptorPorTipo(item.tipo) : null;
	// `campos` se memoiza para estabilizar la identidad del array y
	// evitar que las deps de `useMemo` de abajo cambien en cada render
	// (react-hooks/exhaustive-deps).
	const campos = useMemo(
		() => (item ? CAMPOS_EDICION_BASICOS[item.tipo] : []),
		[item],
	);

	// Detecta qué campos cambiaron respecto al valor canónico actual.
	const camposModificados = useMemo(() => {
		if (!item) return [] as string[];
		const modificados: string[] = [];
		for (const c of campos) {
			const original = leerValorCanonico(item, c.campo);
			const actual = valores[c.campo] ?? "";
			if (original.trim() !== actual.trim()) modificados.push(c.campo);
		}
		return modificados;
	}, [item, campos, valores]);

	const justificacionValida = justificacion.trim().length >= MIN_JUSTIFICACION;
	const puedeGuardar =
		!saving && camposModificados.length > 0 && justificacionValida;

	async function handleGuardar() {
		if (!item || !puedeGuardar) return;
		setError(null);
		setSaving(true);
		try {
			// Emitimos una llamada por cada campo modificado. Si una falla,
			// abortamos y mostramos el error — las ediciones previas YA
			// quedaron append-only en la DB (es aceptable: append-only
			// no pierde nada; el usuario puede completar la edición con
			// otra pasada).
			for (const campo of camposModificados) {
				const valorNuevo = valores[campo]?.trim() ?? "";
				const res = await editarMencionHumana({
					tipo: item.tipo,
					mencion_id: item.mencion.id,
					// Casting seguro: el schema Zod server-side revalida.
					campo: campo as CampoEdicionPorTipo<TipoEntidad>,
					valor_nuevo: valorNuevo === "" ? null : valorNuevo,
					justificacion: justificacion.trim(),
				});
				if (!res.ok) {
					setError(`Fallo editando "${campo}": ${res.error}`);
					setSaving(false);
					return;
				}
			}
			onSaved();
			onClose();
		} catch (err) {
			console.error("[MencionEditModal] excepción:", err);
			setError(
				err instanceof Error ? err.message : "Error desconocido al guardar",
			);
		} finally {
			setSaving(false);
		}
	}

	if (!item || !descriptor) return null;

	const decision = item.valor_canonico.decision_cartografiador;

	return (
		<StandardDialog
			open={true}
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<StandardDialog.Content size="lg" colorScheme="primary">
				<StandardDialog.Header>
					<StandardDialog.Title>
						Editar {descriptor.labelSingular.toLowerCase()}
					</StandardDialog.Title>
					<StandardDialog.Description>
						La edición es <strong>append-only</strong>: se registra una nueva
						entrada en el historial sin sobrescribir al extractor ni al
						cartografiador.
					</StandardDialog.Description>
				</StandardDialog.Header>

				<StandardDialog.Body className="space-y-6">
					{/* Panel de contexto: las 3 capas */}
					<section className="space-y-2">
						<div className="flex items-center gap-2">
							<StandardText size="sm" weight="semibold">
								Estado actual:
							</StandardText>
							<StandardBadge
								colorScheme={colorDesdeDecision(decision)}
								styleType="subtle"
								size="sm">
								{etiquetaDecision(decision)}
							</StandardBadge>
							{typeof item.valor_canonico.confianza_cartografiador ===
								"number" && (
								<StandardText size="xs" colorScheme="neutral">
									confianza{" "}
									{(item.valor_canonico.confianza_cartografiador * 100).toFixed(
										0,
									)}
									%
								</StandardText>
							)}
						</div>
					</section>

					{/* Campos editables */}
					<section className="space-y-4">
						{campos.map((c) => {
							const valor = valores[c.campo] ?? "";
							const modificado = camposModificados.includes(c.campo);
							const label = modificado ? `${c.label} · modificado` : c.label;
							return (
								<StandardFormField
									key={c.campo}
									label={label}
									htmlFor={`mencion-edit-${c.campo}`}>
									{c.control === "text" && (
										<StandardInput
											id={`mencion-edit-${c.campo}`}
											value={valor}
											onChange={(e) =>
												setValores((prev) => ({
													...prev,
													[c.campo]: e.target.value,
												}))
											}
											disabled={saving}
										/>
									)}
									{c.control === "multiline" && (
										<StandardTextarea
											id={`mencion-edit-${c.campo}`}
											value={valor}
											rows={3}
											onChange={(e) =>
												setValores((prev) => ({
													...prev,
													[c.campo]: e.target.value,
												}))
											}
											disabled={saving}
										/>
									)}
									{c.control === "select" && c.opciones && (
										<StandardSelect
											value={valor || undefined}
											onChange={(v) =>
												setValores((prev) => ({
													...prev,
													[c.campo]:
														Array.isArray(v) ? (v[0] ?? "") : (v ?? ""),
												}))
											}
											options={c.opciones.map((o) => ({
												value: o.value,
												label: o.label,
											}))}
											disabled={saving}
											placeholder="Selecciona un tipo…"
										/>
									)}
								</StandardFormField>
							);
						})}
					</section>

					{/* Justificación obligatoria */}
					<section>
						<StandardFormField
							label={`Justificación (mínimo ${MIN_JUSTIFICACION} caracteres)`}
							htmlFor="mencion-edit-justificacion">
							<StandardTextarea
								id="mencion-edit-justificacion"
								value={justificacion}
								onChange={(e) => setJustificacion(e.target.value)}
								rows={2}
								placeholder="¿Por qué corrige este valor?"
								disabled={saving}
							/>
						</StandardFormField>
					</section>

					{error && (
						<StandardAlert
							colorScheme="danger"
							styleType="subtle"
							title="No se pudo guardar"
							message={error}
						/>
					)}
				</StandardDialog.Body>

				<StandardDialog.Footer>
					<StandardDialog.Close asChild>
						<StandardButton styleType="outline" disabled={saving}>
							Cancelar
						</StandardButton>
					</StandardDialog.Close>
					<StandardButton
						colorScheme="primary"
						styleType="solid"
						leftIcon={Save}
						loading={saving}
						loadingText="Guardando…"
						disabled={!puedeGuardar}
						onClick={handleGuardar}>
						Guardar{" "}
						{camposModificados.length > 0 && `(${camposModificados.length})`}
					</StandardButton>
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
//#endregion ![main]
