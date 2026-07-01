// 📍 app/personal/papers/components/PaperCard.tsx
// Componente cliente para el card de paper individual

"use client";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { ViewDmzButton, PreviewButton, EditButton } from "./PapersPageClient";
import type { getMyPapers } from "@/lib/papers/queries";

type Paper = Awaited<ReturnType<typeof getMyPapers>>[number];

interface PaperCardProps {
	paper: Paper;
	statusConfig: {
		label: string;
		colorScheme: "neutral" | "warning" | "primary" | "success";
	};
}

export function PaperCard({ paper, statusConfig }: PaperCardProps) {
	const imageCount = paper.images?.length || 0;
	const uploadedImages =
		paper.images?.filter((img) => img.is_uploaded).length || 0;

	return (
		<StandardCard
			styleType="filled"
			colorScheme="neutral"
			className="hover:shadow-lg transition-shadow">
			<StandardCard.Header>
				<div className="flex items-center justify-between w-full">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<StandardCard.Title>{paper.title}</StandardCard.Title>
						<StandardBadge colorScheme={statusConfig.colorScheme} size="sm">
							{statusConfig.label}
						</StandardBadge>
					</div>
				</div>
				{paper.subtitle && (
					<StandardCard.Subtitle>{paper.subtitle}</StandardCard.Subtitle>
				)}
			</StandardCard.Header>

			<StandardCard.Content>
				<div className="flex items-center gap-4 text-sm text-text-subtle">
					<span>Slug: {paper.slug}</span>
					{imageCount > 0 && (
						<span>
							Imágenes: {uploadedImages}/{imageCount}
						</span>
					)}
					<span>
						Actualizado:{" "}
						{new Date(paper.updated_at).toLocaleDateString("es-ES")}
					</span>
				</div>
			</StandardCard.Content>

			<StandardCard.Actions>
				{paper.is_published && <ViewDmzButton slug={paper.slug} />}
				{!paper.is_published && <PreviewButton slug={paper.slug} />}
				<EditButton id={paper.id} />
			</StandardCard.Actions>
		</StandardCard>
	);
}
