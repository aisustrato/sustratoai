// 📍 app/personal/papers/page.tsx
// Lista de papers del investigador (publicados y borradores)

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/auth/session";
import { getMyPapers } from "@/lib/papers/queries";
import type { PaperWithImages } from "@/lib/papers/types";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { FileText } from "lucide-react";
import {
	NewPaperButton,
	CreateFirstPaperButton,
} from "./components/PapersPageClient";
import { PaperCard } from "./components/PaperCard";

// Mapeo de estados a colores de badge
const STATUS_CONFIG = {
	draft: { label: "Borrador", colorScheme: "neutral" as const },
	processing: { label: "Procesando", colorScheme: "warning" as const },
	ready: { label: "Listo", colorScheme: "primary" as const },
	published: { label: "Publicado", colorScheme: "success" as const },
};

export default async function PapersPage() {
	// Verificar autenticación
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Obtener papers del usuario
	let papers: PaperWithImages[] = [];
	try {
		papers = await getMyPapers();
	} catch (error) {
		console.error("[PapersPage] Error obteniendo papers:", error);
		papers = [];
	}

	return (
		<StandardPageBackground variant="gradient">
			<div className="space-y-6">
				{/* Header */}
				<StandardPageTitle
					title="Mis Publicaciones"
					subtitle="Papers académicos publicados y borradores"
					actions={<NewPaperButton />}
					actionsPosition="right"
				/>

				{/* Lista de papers */}
				{papers.length === 0 ?
					<StandardCard styleType="filled" colorScheme="neutral">
						<div className="text-center py-12">
							<FileText className="h-16 w-16 text-text-subtle mx-auto mb-4" />
							<StandardText size="lg" weight="medium" className="mb-2">
								No tienes papers aún
							</StandardText>
							<StandardText
								size="base"
								colorScheme="neutral"
								colorShade="subtle"
								className="mb-6">
								Comienza publicando tu primer paper académico
							</StandardText>
							<CreateFirstPaperButton />
						</div>
					</StandardCard>
				:	<div className="grid gap-4">
						{papers.map((paper) => {
							const statusConfig =
								STATUS_CONFIG[
									paper.processing_status as keyof typeof STATUS_CONFIG
								];

							return (
								<PaperCard
									key={paper.id}
									paper={paper}
									statusConfig={statusConfig}
								/>
							);
						})}
					</div>
				}
			</div>
		</StandardPageBackground>
	);
}
