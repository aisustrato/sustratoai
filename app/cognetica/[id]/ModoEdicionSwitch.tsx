/**
 * @file app/cognetica/[id]/ModoEdicionSwitch.tsx
 * Toggle switch para cambiar entre modo navegación (default) y modo edición.
 *
 * - OFF (default): Click en menciones navega a la entidad
 * - ON: Click en menciones abre el modal de edición
 *
 * Sub-paso 5.4 — Hito 5 Cognética Fluida.
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { Pencil, MousePointerClick } from "lucide-react";

import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
//#endregion ![head]

//#region [def] - 📦 PROPS 📦
interface ModoEdicionSwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function ModoEdicionSwitch({
	checked,
	onChange,
}: ModoEdicionSwitchProps) {
	return (
		<div className="flex items-center gap-2">
			<StandardText size="xs" colorScheme={checked ? "primary" : "neutral"}>
				{checked ? "Editar" : "Navegar"}
			</StandardText>
			<StandardButton
				styleType={checked ? "solid" : "outline"}
				size="sm"
				colorScheme={checked ? "primary" : "neutral"}
				leftIcon={checked ? Pencil : MousePointerClick}
				onClick={() => onChange(!checked)}
				title={
					checked ?
						"Modo edición activado: clic en menciones abre el editor"
					:	"Modo navegación: clic en menciones va a la entidad"
				}>
				{checked ? "Edición" : "Navegar"}
			</StandardButton>
		</div>
	);
}
//#endregion ![main]
