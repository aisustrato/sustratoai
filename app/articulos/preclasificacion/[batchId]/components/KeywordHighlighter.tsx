"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardPopupWindow } from "@/components/ui/StandardPopupWindow";
import { StandardInput } from "@/components/ui/StandardInput";
import { Search, X } from "lucide-react";

interface KeywordHighlighterProps {
	onKeywordChange: (keyword: string | null) => void;
	currentKeyword: string | null;
	open?: boolean;
	onClose?: () => void;
}

export const KeywordHighlighter: React.FC<KeywordHighlighterProps> = ({
	onKeywordChange,
	currentKeyword,
	open,
	onClose,
}) => {
	const t = useTranslations("articulos.keywordHighlighter");
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [inputKeyword, setInputKeyword] = useState(currentKeyword || "");

	// Usar control externo si está disponible, sino usar estado interno
	const isOpen = open !== undefined ? open : isPopupOpen;

	const handleOpenPopup = useCallback(() => {
		setInputKeyword(currentKeyword || "");
		if (open === undefined) {
			setIsPopupOpen(true);
		}
	}, [currentKeyword, open]);

	const handleClosePopup = useCallback(() => {
		if (onClose) {
			onClose();
		} else {
			setIsPopupOpen(false);
		}
		setInputKeyword(currentKeyword || "");
	}, [currentKeyword, onClose]);

	const handleApplyKeyword = useCallback(() => {
		const trimmedKeyword = inputKeyword.trim();
		onKeywordChange(trimmedKeyword || null);
		handleClosePopup();
	}, [inputKeyword, onKeywordChange, handleClosePopup]);

	const handleClearKeyword = useCallback(() => {
		onKeywordChange(null);
		handleClosePopup();
	}, [onKeywordChange, handleClosePopup]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleApplyKeyword();
			} else if (e.key === "Escape") {
				handleClosePopup();
			}
		},
		[handleApplyKeyword, handleClosePopup]
	);

	return (
		<>
			<div className="flex items-center gap-3">
				<StandardButton
					leftIcon={Search}
					styleType="outline"
					colorScheme="accent"
					onClick={handleOpenPopup}
					tooltip={t("highlightTooltip")}>
					{currentKeyword ?
						t("highlightingLabel", { keyword: currentKeyword })
					:	t("highlightButtonLabel")}
				</StandardButton>

				{currentKeyword && (
					<StandardButton
						leftIcon={X}
						styleType="ghost"
						colorScheme="neutral"
						size="sm"
						onClick={() => onKeywordChange(null)}
						tooltip={t("clearTooltip")}>
						{t("clearButton")}
					</StandardButton>
				)}
			</div>

			<StandardPopupWindow open={isOpen} onOpenChange={(open) => !open && handleClosePopup()}>
				<StandardPopupWindow.Content size="md" colorScheme="accent">
					<StandardPopupWindow.Header>
						<StandardPopupWindow.Title>{t("dialogTitle")}</StandardPopupWindow.Title>
						<StandardPopupWindow.Description>
							{t("dialogDescription")}
						</StandardPopupWindow.Description>
					</StandardPopupWindow.Header>

					<StandardPopupWindow.Body className="space-y-4">
						<StandardInput
							placeholder={t("inputPlaceholder")}
							value={inputKeyword}
							onChange={(e) => setInputKeyword(e.target.value)}
							onKeyDown={handleKeyDown}
							autoFocus
							className="w-full"
						/>
					</StandardPopupWindow.Body>

					<StandardPopupWindow.Footer>
						<StandardButton styleType="ghost" onClick={handleClosePopup}>
							{t("cancelButton")}
						</StandardButton>

						{currentKeyword && (
							<StandardButton
								styleType="outline"
								colorScheme="danger"
								onClick={handleClearKeyword}>
								{t("clearHighlightButton")}
							</StandardButton>
						)}

						<StandardButton
							styleType="solid"
							colorScheme="accent"
							onClick={handleApplyKeyword}
							disabled={!inputKeyword.trim()}>
							{t("applyHighlightButton")}
						</StandardButton>
					</StandardPopupWindow.Footer>
				</StandardPopupWindow.Content>
			</StandardPopupWindow>
		</>
	);
};
