// 📍 components/auth/PapersBand.tsx
// Franja "Publicaciones abiertas" para login/signup: puerta pública hacia /papers
// con las últimas publicaciones cargadas en vivo.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BookOpen } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { getPublishedPapers } from "@/lib/papers/queries";
import type { PaperListItem } from "@/lib/papers/types";

const MAX_PAPERS = 2;

export function PapersBand() {
	const t = useTranslations("auth.papersBand");
	const locale = useLocale();
	const [papers, setPapers] = useState<PaperListItem[]>([]);

	useEffect(() => {
		let cancelled = false;
		getPublishedPapers()
			.then((list) => {
				if (!cancelled) setPapers(list.slice(0, MAX_PAPERS));
			})
			.catch((err) => {
				console.error("[PapersBand:getPublishedPapers]", err);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="border-t border-border/40 p-6 md:px-8">
			<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				<div className="flex items-start gap-4">
					<BookOpen className="mt-1 h-6 w-6 shrink-0 text-primary" />
					<div className="space-y-1">
						<StandardText asElement="h2" size="lg" weight="bold" colorScheme="primary">
							{t("title")}
						</StandardText>
						<StandardText asElement="p" size="sm" colorScheme="neutral">
							{t("body")}
						</StandardText>
					</div>
				</div>

				<Link href="/papers" className="shrink-0">
					<StandardButton
						styleType="outline"
						colorScheme="primary"
						rightIcon={ArrowRight}
						className="w-full md:w-auto">
						{t("viewAll")}
					</StandardButton>
				</Link>
			</div>

			{papers.length > 0 && (
				<ul className="mt-5 grid gap-3 md:grid-cols-2">
					{papers.map((paper) => (
						<li key={paper.slug}>
							<Link
								href={`/papers/${paper.slug}`}
								className="block rounded-lg border border-border/40 p-3 transition-colors hover:border-primary/40">
								<StandardText asElement="span" size="sm" weight="semibold" className="line-clamp-2">
									{paper.title}
								</StandardText>
								{paper.published_at && (
									<StandardText asElement="span" size="xs" colorScheme="neutral" className="mt-1 block">
										{new Date(paper.published_at).toLocaleDateString(locale, {
											year: "numeric",
											month: "long",
										})}
									</StandardText>
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
