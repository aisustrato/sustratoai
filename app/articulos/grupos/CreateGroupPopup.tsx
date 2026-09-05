"use client";

import React, { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { StandardPopupWindow } from "@/components/ui/StandardPopupWindow";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { toast } from "sonner";
import { createGroupWithArticles, type CreateGroupPayload } from "@/lib/actions/article-group-actions";
import { useAuth } from "@/app/auth-provider";

interface CreateGroupPopupProps {
  open: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle?: string | null;
  onCreated?: (groupId: string) => void;
}

export default function CreateGroupPopup({ open, onClose, articleId, articleTitle, onCreated }: CreateGroupPopupProps) {
  const t = useTranslations("articulos.createGroupPopup");
  const { proyectoActual } = useAuth();

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const resetForm = () => {
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupIsPublic(false);
    setHasUnsavedChanges(false);
  };

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
      resetForm();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewGroupDescription(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleVisibilityChange = (checked: boolean) => {
    if (checked) {
      setShowPublicWarning(true);
    } else {
      setNewGroupIsPublic(false);
      setHasUnsavedChanges(true);
    }
  };

  const executeCreate = async () => {
    const projectId = proyectoActual?.id;
    if (!projectId) {
      toast.error(t("toastNoActiveProject"));
      return;
    }

    if (!newGroupName.trim()) return;

    setIsCreating(true);
    try {
      const payload: CreateGroupPayload = {
        projectId,
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        visibility: newGroupIsPublic ? "public" : "private",
        articleIds: articleId ? [articleId] : [],
      };

      const result = await createGroupWithArticles(payload);
      if (result.success) {
        toast.success(t("toastGroupCreated", { name: newGroupName }));
        onCreated?.(String(result.data.id));
        resetForm();
        onClose();
      } else {
        toast.error(result.error || t("toastErrorCreating"));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("toastUnknownError");
      toast.error(t("toastUnexpectedError", { message: msg }));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreate = () => {
    if (newGroupIsPublic) {
      setShowPublicWarning(true);
      return;
    }
    executeCreate();
  };

  const confirmPublicGroup = () => {
    setShowPublicWarning(false);
    setNewGroupIsPublic(true);
    executeCreate();
  };

  const cancelPublicGroup = () => {
    setShowPublicWarning(false);
    setNewGroupIsPublic(false);
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    resetForm();
    onClose();
  };

  return (
    <>
      <StandardPopupWindow open={open} onOpenChange={handleClose}>
        <StandardPopupWindow.Content size="md">
          <StandardPopupWindow.Header>
            <StandardPopupWindow.Title>{t("dialogTitle")}</StandardPopupWindow.Title>
            <StandardPopupWindow.Description>
              {articleTitle ? (
                <StandardText size="sm" colorShade="subtle">
                  {t("articleWillBeAddedNamed", { title: articleTitle })}
                </StandardText>
              ) : (
                <StandardText size="sm" colorShade="subtle">
                  {t("createAndAddDescription")}
                </StandardText>
              )}
            </StandardPopupWindow.Description>
          </StandardPopupWindow.Header>

          <StandardPopupWindow.Body className="space-y-4">
            <StandardFormField label={t("nameLabel")} htmlFor="group-name" isRequired>
              <StandardInput
                id="group-name"
                placeholder={t("namePlaceholder")}
                value={newGroupName}
                onChange={handleNameChange}
              />
            </StandardFormField>

            <StandardFormField label={t("descriptionLabel")} htmlFor="group-description">
              <StandardTextarea
                id="group-description"
                placeholder={t("descriptionPlaceholder")}
                value={newGroupDescription}
                onChange={handleDescriptionChange}
                rows={3}
              />
            </StandardFormField>

            <div>
              <StandardCheckbox
                label={t("publicCheckboxLabel")}
                description={t("publicCheckboxDescription")}
                checked={newGroupIsPublic}
                onChange={(e) => handleVisibilityChange(e.target.checked)}
              />
            </div>
          </StandardPopupWindow.Body>

          <StandardPopupWindow.Footer>
            <div className="flex justify-between items-center w-full">
              <StandardText size="sm" colorShade="subtle">
                {t("articleWillBeAddedFooter")}
              </StandardText>
              <div className="flex gap-2">
                <StandardButton styleType="outline" onClick={handleClose} disabled={isCreating}>
                  {t("cancelButton")}
                </StandardButton>
                <StandardButton
                  styleType="solid"
                  colorScheme="primary"
                  onClick={handleCreate}
                  disabled={!newGroupName.trim() || isCreating}
                >
                  {isCreating ? t("creatingButton") : t("createButton")}
                </StandardButton>
              </div>
            </div>
          </StandardPopupWindow.Footer>
        </StandardPopupWindow.Content>
      </StandardPopupWindow>

      <StandardDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
        <StandardDialog.Content size="sm" colorScheme="warning">
          <StandardDialog.Header>
            <StandardDialog.Title>{t("publicWarningTitle")}</StandardDialog.Title>
            <StandardDialog.Description>
              {t("publicWarningDescription")}
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" colorScheme="neutral" onClick={cancelPublicGroup} disabled={isCreating}>
              {t("cancelButton")}
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="warning" onClick={confirmPublicGroup} disabled={isCreating}>
              {isCreating ? t("creatingButton") : t("confirmPublicButton")}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      <StandardDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>{t("unsavedChangesTitle")}</StandardDialog.Title>
            <StandardDialog.Description>
              {t("unsavedChangesDescription")}
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowCloseConfirm(false)}>
              {t("cancelButton")}
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="primary" onClick={confirmClose}>
              {t("closeWithoutSavingButton")}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
