// 📍 app/showroom/standard-select-modal-test/page.tsx
// 🎯 PROPÓSITO: Test del StandardSelect dentro de modales
"use client";

import React, { useState } from "react";
import {
	StandardSelect,
	type SelectOption,
} from "@/components/ui/StandardSelect";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardFormField } from "@/components/ui/StandardFormField";

const options: SelectOption[] = [
	{ value: "option1", label: "Opción 1 - Básica" },
	{ value: "option2", label: "Opción 2 - Intermedia" },
	{ value: "option3", label: "Opción 3 - Avanzada" },
	{ value: "option4", label: "Opción 4 - Experta" },
	{ value: "option5", label: "Opción 5 - Personalizada" },
];

export default function StandardSelectModalTest() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedValue, setSelectedValue] = useState<string>("");
	const [selectedValueInModal, setSelectedValueInModal] = useState<string>("");
	const [selectedValueTertiary, setSelectedValueTertiary] =
		useState<string>("");

	return (
		<div className="p-8 space-y-6">
			<StandardCard>
				<StandardCard.Header>
					<StandardCard.Title>
						Test de StandardSelect en Modal
					</StandardCard.Title>
				</StandardCard.Header>

				<div className="space-y-4">
					{/* Select fuera del modal (referencia) */}
					<StandardFormField
						label="Select fuera del modal (referencia)"
						htmlFor="select-outside">
						<StandardSelect
							id="select-outside"
							options={options}
							value={selectedValue}
							onChange={(value) =>
								setSelectedValue(typeof value === "string" ? value : "")
							}
							placeholder="Seleccione una opción fuera del modal"
							colorScheme="primary"
						/>
					</StandardFormField>

					{/* Botón para abrir el modal */}
					<StandardButton
						onClick={() => setIsModalOpen(true)}
						colorScheme="primary">
						Abrir Modal con Select
					</StandardButton>

					{/* Mostrar valores seleccionados */}
					<div className="space-y-2">
						<StandardText size="sm">
							<strong>Fuera del modal:</strong>{" "}
							{selectedValue || "Ninguna selección"}
						</StandardText>
						<StandardText size="sm">
							<strong>Dentro del modal:</strong>{" "}
							{selectedValueInModal || "Ninguna selección"}
						</StandardText>
						<StandardText size="sm">
							<strong>Select terciario:</strong>{" "}
							{selectedValueTertiary || "Ninguna selección"}
						</StandardText>
					</div>
				</div>
			</StandardCard>

			{/* Modal con StandardSelect */}
			<StandardDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<StandardDialog.Content size="md" colorScheme="neutral">
					<StandardDialog.Header>
						<StandardDialog.Title>
							Modal con StandardSelect
						</StandardDialog.Title>
						<StandardDialog.Description>
							Este select debería funcionar correctamente dentro del modal con
							hover y selección.
						</StandardDialog.Description>
					</StandardDialog.Header>

					<StandardDialog.Body className="space-y-4">
						<StandardFormField
							label="Select dentro del modal"
							htmlFor="select-modal">
							<StandardSelect
								id="select-modal"
								options={options}
								value={selectedValueInModal}
								onChange={(value) =>
									setSelectedValueInModal(
										typeof value === "string" ? value : "",
									)
								}
								placeholder="Seleccione una opción dentro del modal"
								colorScheme="secondary"
							/>
						</StandardFormField>

						{/* Múltiples selects para probar z-index */}
						<StandardFormField
							label="Otro select (terciario)"
							htmlFor="select-tertiary">
							<StandardSelect
								id="select-tertiary"
								options={options.slice(0, 3)}
								value={selectedValueTertiary}
								onChange={(value) =>
									setSelectedValueTertiary(
										typeof value === "string" ? value : "",
									)
								}
								placeholder="Otro select para probar z-index"
								colorScheme="tertiary"
							/>
						</StandardFormField>

						<StandardFormField
							label="Select disabled"
							htmlFor="select-disabled">
							<StandardSelect
								id="select-disabled"
								options={options}
								placeholder="Este select está deshabilitado"
								disabled
								colorScheme="accent"
							/>
						</StandardFormField>
					</StandardDialog.Body>

					<StandardDialog.Footer>
						<StandardButton
							styleType="ghost"
							onClick={() => setIsModalOpen(false)}>
							Cerrar
						</StandardButton>
						<StandardButton
							onClick={() => {
								setSelectedValueInModal("");
								setIsModalOpen(false);
							}}
							colorScheme="primary">
							Guardar y Cerrar
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
}
