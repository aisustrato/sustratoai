//. 📍 app/personal/configuracion/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * BYOK (Bring Your Own Key): cada investigador configura su propia API key
 * de DeepSeek para que la preclasificación use su cuota en vez de la
 * global del proyecto. Ver
 * docs/preclasificacion-auditoria-funcional/05_Requerimiento_BYOK_DeepSeek.md
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { KeyRound, Save, Trash2 } from "lucide-react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import {
	saveUserDeepSeekKey,
	getUserDeepSeekKeyStatus,
	deleteUserDeepSeekKey,
	type DeepSeekKeyStatus,
} from "@/lib/actions/user-api-keys-actions";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
export default function ConfiguracionPersonalPage() {
	const t = useTranslations("personal.configuracion");
	const [status, setStatus] = useState<DeepSeekKeyStatus | null>(null);
	const [isLoadingStatus, setIsLoadingStatus] = useState(true);
	const [keyInput, setKeyInput] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const refreshStatus = useCallback(async () => {
		setIsLoadingStatus(true);
		const result = await getUserDeepSeekKeyStatus();
		if (result.success) {
			setStatus(result.data);
		} else {
			toast.error(result.error);
		}
		setIsLoadingStatus(false);
	}, []);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus]);

	const handleSave = async () => {
		if (!keyInput.trim()) {
			toast.error(t("toastKeyRequired"));
			return;
		}
		setIsSaving(true);
		const result = await saveUserDeepSeekKey(keyInput);
		if (result.success) {
			toast.success(t("toastKeySaved"));
			setKeyInput("");
			await refreshStatus();
		} else {
			toast.error(result.error);
		}
		setIsSaving(false);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await deleteUserDeepSeekKey();
		if (result.success) {
			toast.success(t("toastKeyDeleted"));
			await refreshStatus();
		} else {
			toast.error(result.error);
		}
		setIsDeleting(false);
	};

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<StandardPageTitle
				title={t("pageTitle")}
				subtitle={t("pageSubtitle")}
				mainIcon={KeyRound}
			/>

			<StandardCard accentPlacement="top">
				<StandardCard.Header>
					<div className="flex items-center justify-between">
						<StandardCard.Title className="flex items-center gap-2">
							{t("cardTitle")}
						</StandardCard.Title>
						{!isLoadingStatus && (
							<StandardBadge
								colorScheme={status?.configured ? "success" : "neutral"}
								styleType="subtle"
								size="md"
							>
								{status?.configured ? t("statusConfigured") : t("statusNotConfigured")}
							</StandardBadge>
						)}
					</div>
					<StandardCard.Subtitle>
						<StandardText size="sm" colorScheme="secondary">
							{t("cardDescription")}
						</StandardText>
					</StandardCard.Subtitle>
				</StandardCard.Header>

				<StandardCard.Content>
					{isLoadingStatus ? (
						<div className="flex justify-center py-6">
							<SustratoLoadingLogo showText={false} size={32} />
						</div>
					) : (
						<div className="space-y-4">
							{status?.configured && (
								<StandardText size="sm" colorScheme="neutral">
									{t("currentKeyEndsIn")}{" "}
									<span className="font-mono">...{status.last4}</span>
								</StandardText>
							)}

							<StandardFormField
								label={status?.configured ? t("replaceKeyLabel") : t("keyLabel")}
								htmlFor="deepseek-api-key"
								hint={t("keyHint")}
							>
								<StandardInput
									id="deepseek-api-key"
									type="password"
									placeholder={t("keyPlaceholder")}
									value={keyInput}
									onChange={(e) => setKeyInput(e.target.value)}
									disabled={isSaving}
								/>
							</StandardFormField>
						</div>
					)}
				</StandardCard.Content>

				<StandardCard.Actions className="justify-between border-t border-neutral-200 dark:border-neutral-800">
					<StandardButton
						colorScheme="danger"
						styleType="outline"
						leftIcon={Trash2}
						onClick={handleDelete}
						loading={isDeleting}
						disabled={isLoadingStatus || !status?.configured}
					>
						{t("deleteKeyButton")}
					</StandardButton>
					<StandardButton
						leftIcon={Save}
						onClick={handleSave}
						loading={isSaving}
						disabled={isLoadingStatus}
					>
						{t("saveButton")}
					</StandardButton>
				</StandardCard.Actions>
			</StandardCard>
		</div>
	);
}
//#endregion ![main]
