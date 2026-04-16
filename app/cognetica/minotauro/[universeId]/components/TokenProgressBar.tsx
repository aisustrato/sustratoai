"use client";

import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { StandardBadge } from "@/components/ui/StandardBadge";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

interface TokenProgressBarProps {
	currentTokens: number;
	maxTokens: number;
	colorScheme?: ColorSchemeVariant;
}

export function TokenProgressBar({
	currentTokens,
	maxTokens = 130000,
	colorScheme = "primary",
}: TokenProgressBarProps) {
	const percentage = Math.min((currentTokens / maxTokens) * 100, 100);
	const isNearLimit = percentage >= 90;
	const isOverLimit = currentTokens > maxTokens;

	const displayColorScheme: ColorSchemeVariant =
		isOverLimit ? "danger"
		: isNearLimit ? "warning"
		: colorScheme;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-foreground">
						💰 Tokens Utilizados
					</span>
					{isOverLimit && (
						<StandardBadge colorScheme="danger" size="sm" styleType="solid">
							Excede límite
						</StandardBadge>
					)}
					{isNearLimit && !isOverLimit && (
						<StandardBadge colorScheme="warning" size="sm" styleType="solid">
							Cerca del límite
						</StandardBadge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<span
						className={`text-sm font-bold ${
							isOverLimit ? "text-danger"
							: isNearLimit ? "text-warning"
							: "text-foreground"
						}`}>
						{currentTokens.toLocaleString("es-ES")}
					</span>
					<span className="text-sm text-muted-foreground">/</span>
					<span className="text-sm text-muted-foreground">
						{maxTokens.toLocaleString("es-ES")} tokens
					</span>
					<StandardBadge
						colorScheme={displayColorScheme}
						size="sm"
						styleType="subtle">
						{percentage.toFixed(1)}%
					</StandardBadge>
				</div>
			</div>

			<StandardProgressBar
				value={percentage}
				colorScheme={displayColorScheme}
				size="md"
			/>

			{isOverLimit && (
				<p className="text-xs text-danger">
					⚠️ Has excedido el límite por{" "}
					<span className="font-semibold">
						{(currentTokens - maxTokens).toLocaleString("es-ES")} tokens
					</span>
					. Deselecciona algunos elementos para continuar.
				</p>
			)}
		</div>
	);
}
