'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import type { ColorSchemeVariant } from '@/lib/theme/ColorToken';

interface DialogOptions {
  title: string;
  content: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  colorScheme?: ColorSchemeVariant;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);

  const showDialog = useCallback((options: DialogOptions) => {
    setDialogOptions(options);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogOptions(null);
  }, []);

  const handleConfirm = () => {
    if (dialogOptions) {
      dialogOptions.onConfirm();
      hideDialog();
    }
  };

  const handleCancel = () => {
    if (dialogOptions) {
      if (dialogOptions.onCancel) {
        dialogOptions.onCancel();
      }
      hideDialog();
    }
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      {dialogOptions && (
        <StandardDialog
          open={!!dialogOptions}
          onOpenChange={(open) => {
            if (!open) {
              handleCancel();
            }
          }}
        >
          <StandardDialog.Content colorScheme={dialogOptions.colorScheme || 'neutral'}>
            <StandardDialog.Header>
              <StandardDialog.Title>{dialogOptions.title}</StandardDialog.Title>
            </StandardDialog.Header>
            <StandardDialog.Body>
              {typeof dialogOptions.content === 'string' ? (
                <StandardText>{dialogOptions.content}</StandardText>
              ) : (
                dialogOptions.content
              )}
            </StandardDialog.Body>
            <StandardDialog.Footer>
              <StandardButton
                styleType="outline"
                colorScheme="neutral"
                onClick={handleCancel}
              >
                {dialogOptions.cancelText || 'Cancelar'}
              </StandardButton>
              <StandardButton
                colorScheme={dialogOptions.colorScheme || 'primary'}
                onClick={handleConfirm}
              >
                {dialogOptions.confirmText || 'Confirmar'}
              </StandardButton>
            </StandardDialog.Footer>
          </StandardDialog.Content>
        </StandardDialog>
      )}
    </DialogContext.Provider>
  );
};
