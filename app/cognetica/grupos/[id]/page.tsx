//. 📍 app/cognetica/grupos/[id]/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardAlert } from "@/components/ui/StandardAlert";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Next.js 14: `params` es un objeto síncrono en client components.
interface CogneticaGrupoPageProps {
	params: { id: string };
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Vista de grupo — placeholder de Oleada 1.
 */
export default function CogneticaGrupoPage({
	params,
}: CogneticaGrupoPageProps) {
	const { id } = params;

	return (
		<div className="container mx-auto py-8">
			<StandardPageTitle
				title="Grupo"
				description={`ID: ${id}`}
				breadcrumbs={[
					{ label: "Cognética", href: "/cognetica" },
					{ label: "Grupos", href: "/cognetica/grupos" },
					{ label: "Grupo" },
				]}
				showBackButton={{ href: "/cognetica/grupos" }}
			/>

			<StandardAlert
				colorScheme="primary"
				styleType="subtle"
				className="mt-6"
				message="Vista de grupo pendiente — Oleada 1."
			/>
		</div>
	);
}
//#endregion ![main]
