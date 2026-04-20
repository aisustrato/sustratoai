//. 📍 app/cognetica/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import Link from "next/link";
import { Archive, Sprout, Upload } from "lucide-react";

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardAlert } from "@/components/ui/StandardAlert";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Landing de Cognética Forense v2 — Oleada 1 en construcción.
 *
 * Mientras la Oleada 1 se implementa, esta página:
 *  - Reporta honestamente el estado (sin ocultar el work-in-progress).
 *  - Enlaza a `/cognetica_old` para consultar artefactos v1.
 *  - Deja visible el roadmap (upload, grupos) aunque aún no naveguen.
 */
export default function CogneticaForenseHome() {
	return (
		<div className="container mx-auto py-8">
			<StandardPageTitle
				title="Cognética Forense"
				description="Metabolización de artefactos (audio, video, PDF, markdown, imagen) en una tríada canónica hasheada, con crónica, destilado y germinal."
				breadcrumbs={[{ label: "Cognética" }]}
				showBackButton={{ href: "/" }}
			/>

			<StandardAlert
				colorScheme="primary"
				styleType="subtle"
				className="mt-6"
				message={
					<>
						<strong>Oleada 1 en construcción.</strong> El módulo nuevo está
						siendo reescrito con ingeniería. Para consultar artefactos del
						módulo anterior visita{" "}
						<Link href="/cognetica_old" className="underline font-medium">
							Cognética Legacy
						</Link>
						.
					</>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
				<StandardCard
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
					className="opacity-60">
					<div className="p-4">
						<div className="flex items-center gap-3 mb-2">
							<StandardIcon>
								<Upload className="h-6 w-6 text-primary" />
							</StandardIcon>
							<StandardText asElement="h2" weight="semibold" size="lg">
								Ingesta de artefactos
							</StandardText>
						</div>
						<StandardText colorScheme="neutral" size="sm">
							Subida de audio, video, PDF, markdown o imagen. Persiste tríada
							canónica con hash SHA-256 reproducible.
						</StandardText>
						<StandardText
							colorScheme="neutral"
							size="xs"
							className="mt-3 italic">
							Disponible cuando Oleada 1 cierre.
						</StandardText>
					</div>
				</StandardCard>

				<StandardCard
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
					className="opacity-60">
					<div className="p-4">
						<div className="flex items-center gap-3 mb-2">
							<StandardIcon>
								<Sprout className="h-6 w-6 text-primary" />
							</StandardIcon>
							<StandardText asElement="h2" weight="semibold" size="lg">
								Grupos de artefactos
							</StandardText>
						</div>
						<StandardText colorScheme="neutral" size="sm">
							Agrupación temática y germinal-de-grupo para lectura conjunta de
							conjuntos de artefactos.
						</StandardText>
						<StandardText
							colorScheme="neutral"
							size="xs"
							className="mt-3 italic">
							Disponible cuando Oleada 1 cierre.
						</StandardText>
					</div>
				</StandardCard>

				<StandardCard
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none">
					<div className="p-4">
						<div className="flex items-center gap-3 mb-2">
							<StandardIcon>
								<Archive className="h-6 w-6 text-primary" />
							</StandardIcon>
							<StandardText asElement="h2" weight="semibold" size="lg">
								Cognética Legacy (v1)
							</StandardText>
						</div>
						<StandardText colorScheme="neutral" size="sm">
							Artefactos generados con el módulo anterior. Consultable mientras
							Oleada 1 está en desarrollo.
						</StandardText>
						<div className="mt-4">
							<Link href="/cognetica_old">
								<StandardButton
									styleType="outline"
									colorScheme="primary"
									size="sm">
									Ir a Cognética Legacy
								</StandardButton>
							</Link>
						</div>
					</div>
				</StandardCard>
			</div>
		</div>
	);
}
//#endregion ![main]
