// 📍 app/personal/papers/components/PaperVersionsEditor.tsx
// Editor de versiones anteriores de un paper (cada una con su DOI de versión en Zenodo)

"use client";

import { Plus, Trash2 } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import type { PaperVersionEntry } from "@/lib/papers/types";

interface PaperVersionsEditorProps {
	value: PaperVersionEntry[];
	onChange: (versions: PaperVersionEntry[]) => void;
	disabled?: boolean;
}

const EMPTY_VERSION: PaperVersionEntry = { version: "", doi: "" };

export function PaperVersionsEditor({
	value,
	onChange,
	disabled = false,
}: PaperVersionsEditorProps) {
	const updateAt = (index: number, patch: Partial<PaperVersionEntry>) => {
		onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));
	};

	const removeAt = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-4">
			{value.map((entry, index) => (
				<div key={index} className="space-y-3 rounded-lg border border-border-neutral p-4">
					<div className="grid gap-3 sm:grid-cols-3">
						<div>
							<label className="block mb-1">
								<StandardText size="sm" weight="medium">
									Versión
								</StandardText>
							</label>
							<StandardInput
								value={entry.version}
								onChange={(e) => updateAt(index, { version: e.target.value })}
								placeholder="1.0"
								disabled={disabled}
							/>
						</div>
						<div>
							<label className="block mb-1">
								<StandardText size="sm" weight="medium">
									DOI de la versión
								</StandardText>
							</label>
							<StandardInput
								value={entry.doi}
								onChange={(e) => updateAt(index, { doi: e.target.value })}
								placeholder="10.5281/zenodo.…"
								disabled={disabled}
							/>
						</div>
						<div>
							<label className="block mb-1">
								<StandardText size="sm" weight="medium">
									Fecha (AAAA-MM-DD)
								</StandardText>
							</label>
							<StandardInput
								value={entry.published_at ?? ""}
								onChange={(e) =>
									updateAt(index, { published_at: e.target.value || undefined })
								}
								placeholder="2026-08-10"
								disabled={disabled}
							/>
						</div>
					</div>
					<div>
						<label className="block mb-1">
							<StandardText size="sm" weight="medium">
								URL en Zenodo (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={entry.zenodo_url ?? ""}
							onChange={(e) =>
								updateAt(index, { zenodo_url: e.target.value || undefined })
							}
							placeholder="https://zenodo.org/records/…"
							disabled={disabled}
						/>
					</div>
					<div>
						<label className="block mb-1">
							<StandardText size="sm" weight="medium">
								Nota de cambios (opcional)
							</StandardText>
						</label>
						<StandardInput
							value={entry.changelog ?? ""}
							onChange={(e) =>
								updateAt(index, { changelog: e.target.value || undefined })
							}
							placeholder="Qué cambió respecto de la versión siguiente"
							disabled={disabled}
						/>
					</div>
					<StandardButton
						styleType="outline"
						colorScheme="danger"
						size="sm"
						leftIcon={Trash2}
						onClick={() => removeAt(index)}
						disabled={disabled}>
						Quitar versión
					</StandardButton>
				</div>
			))}

			<StandardButton
				styleType="outline"
				colorScheme="neutral"
				size="sm"
				leftIcon={Plus}
				onClick={() => onChange([...value, { ...EMPTY_VERSION }])}
				disabled={disabled}>
				Agregar versión anterior
			</StandardButton>
		</div>
	);
}
