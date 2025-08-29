"use client";

import React, { useCallback, useState } from "react";
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
      toast.error("No hay proyecto activo");
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
        toast.success(`Grupo "${newGroupName}" creado`);
        onCreated?.(String(result.data.id));
        resetForm();
        onClose();
      } else {
        toast.error(result.error || "Error al crear grupo");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(`Error inesperado: ${msg}`);
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
            <StandardPopupWindow.Title>Crear Nuevo Grupo</StandardPopupWindow.Title>
            <StandardPopupWindow.Description>
              {articleTitle ? (
                <StandardText size="sm" colorShade="subtle">
                  El artículo &quot;{articleTitle}&quot; se agregará automáticamente.
                </StandardText>
              ) : (
                <StandardText size="sm" colorShade="subtle">
                  Crea un nuevo grupo y agrega este artículo automáticamente
                </StandardText>
              )}
            </StandardPopupWindow.Description>
          </StandardPopupWindow.Header>

          <StandardPopupWindow.Body className="space-y-4">
            <StandardFormField label="Nombre del grupo" htmlFor="group-name" isRequired>
              <StandardInput
                id="group-name"
                placeholder="Ej: Artículos sobre metodología cualitativa"
                value={newGroupName}
                onChange={handleNameChange}
              />
            </StandardFormField>

            <StandardFormField label="Descripción (opcional)" htmlFor="group-description">
              <StandardTextarea
                id="group-description"
                placeholder="Describe el propósito o criterios de este grupo..."
                value={newGroupDescription}
                onChange={handleDescriptionChange}
                rows={3}
              />
            </StandardFormField>

            <div>
              <StandardCheckbox
                label="Hacer este grupo público"
                description="Los grupos públicos son visibles para todo el equipo del proyecto"
                checked={newGroupIsPublic}
                onChange={(e) => handleVisibilityChange(e.target.checked)}
              />
            </div>
          </StandardPopupWindow.Body>

          <StandardPopupWindow.Footer>
            <div className="flex justify-between items-center w-full">
              <StandardText size="sm" colorShade="subtle">
                El artículo actual se agregará automáticamente
              </StandardText>
              <div className="flex gap-2">
                <StandardButton styleType="outline" onClick={handleClose} disabled={isCreating}>
                  Cancelar
                </StandardButton>
                <StandardButton
                  styleType="solid"
                  colorScheme="primary"
                  onClick={handleCreate}
                  disabled={!newGroupName.trim() || isCreating}
                >
                  {isCreating ? "Creando..." : "Crear Grupo"}
                </StandardButton>
              </div>
            </div>
          </StandardPopupWindow.Footer>
        </StandardPopupWindow.Content>
      </StandardPopupWindow>

      <StandardDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
        <StandardDialog.Content size="sm" colorScheme="warning">
          <StandardDialog.Header>
            <StandardDialog.Title>⚠️ Confirmar Grupo Público</StandardDialog.Title>
            <StandardDialog.Description>
              Estás a punto de crear un grupo público visible para todo el equipo.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" colorScheme="neutral" onClick={cancelPublicGroup} disabled={isCreating}>
              Cancelar
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="warning" onClick={confirmPublicGroup} disabled={isCreating}>
              {isCreating ? "Creando..." : "Sí, crear grupo público"}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>

      <StandardDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <StandardDialog.Content size="sm">
          <StandardDialog.Header>
            <StandardDialog.Title>Cambios sin Guardar</StandardDialog.Title>
            <StandardDialog.Description>
              Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardButton styleType="outline" onClick={() => setShowCloseConfirm(false)}>
              Cancelar
            </StandardButton>
            <StandardButton styleType="solid" colorScheme="primary" onClick={confirmClose}>
              Cerrar sin Guardar
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
