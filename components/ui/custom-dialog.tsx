"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/app/theme-provider"
import { generateDialogTokens } from "@/lib/theme/components/dialog-tokens"
import { CustomButton } from "@/components/ui/custom-button"
import { Text } from "@/components/ui/text"

// Tipos para las props del diálogo
export interface CustomDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode

  // Props para los botones de acción
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void

  // Variantes de estilo
  variant?: "neutral" | "destructive" | "success" | "warning"

  // Props de configuración
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean

  // Props de tamaño
  size?: "sm" | "md" | "lg" | "xl"

  // Estados de carga
  isLoading?: boolean

  className?: string
}

const CustomDialog = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, CustomDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      confirmText = "Aceptar",
      cancelText = "Cancelar",
      onConfirm,
      onCancel,
      variant = "default",
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      size = "md",
      isLoading = false,
      className,
      ...props
    },
    ref,
  ) => {
    const { appColorTokens, mode } = useTheme()
    const dialogTokens = React.useMemo(() => {
      if (!appColorTokens) return null
      return generateDialogTokens(appColorTokens, mode)
    }, [appColorTokens, mode])
    if (!dialogTokens) return null

    // Estados internos
    const [isConfirmLoading, setIsConfirmLoading] = React.useState(false)

    // Manejar confirmación con loading
    const handleConfirm = React.useCallback(async () => {
      if (!onConfirm || isLoading) return

      try {
        setIsConfirmLoading(true)
        await onConfirm()
      } catch (error) {
        console.error("Error en confirmación:", error)
      } finally {
        setIsConfirmLoading(false)
      }
    }, [onConfirm, isLoading])

    // Manejar cancelación
    const handleCancel = React.useCallback(() => {
      if (isLoading || isConfirmLoading) return
      onCancel?.()
      onOpenChange?.(false)
    }, [onCancel, onOpenChange, isLoading, isConfirmLoading])

    // Estilos de tamaño
    const sizeStyles = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
    }

    // Variantes de botón según el tipo de diálogo
    // Mapear variante visual
    const getConfirmButtonVariant = () => {
      switch (variant) {
        case "warning":
          return "outline"
        default:
          return "solid"
      }
    }
    // Mapear color visual
    const getConfirmButtonColor = () => {
      switch (variant) {
        case "destructive":
          return "danger"
        case "success":
          return "success"
        case "warning":
          return "warning"
        default:
          return "primary"
      }
    }

    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          {/* Overlay */}
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            style={{
              background: dialogTokens.overlay.background,
              backdropFilter: dialogTokens.overlay.backdropFilter,
            }}
          />

          {/* Content */}
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
              sizeStyles[size],
              className,
            )}
            onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
            style={{
              background: dialogTokens.content.background,
              border: dialogTokens.content.border,
              boxShadow: dialogTokens.content.shadow,
              borderRadius: dialogTokens.content.borderRadius,
            }}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className="flex items-center justify-between p-6 pb-4"
                style={{
                  background: dialogTokens.header.background,
                  borderBottom: title && description ? dialogTokens.header.borderBottom : "none",
                  borderTopLeftRadius: dialogTokens.content.borderRadius,
                  borderTopRightRadius: dialogTokens.content.borderRadius,
                }}
              >
                {title && (
                  <Text variant="heading" size="lg" weight="semibold">
                    {title}
                  </Text>
                )}

                {showCloseButton && (
                  <DialogPrimitive.Close asChild>
                    <button
                      className="rounded-sm opacity-70 ring-offset-background transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-1"
                      style={{
                        background: dialogTokens.close.background,
                        color: dialogTokens.close.color,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = dialogTokens.close.backgroundHover
                        e.currentTarget.style.color = dialogTokens.close.colorHover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = dialogTokens.close.background
                        e.currentTarget.style.color = dialogTokens.close.color
                      }}
                      onClick={() => onOpenChange?.(false)}
                      disabled={isLoading || isConfirmLoading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cerrar</span>
                    </button>
                  </DialogPrimitive.Close>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6 pt-2">
              {description && (
                <Text variant="default" size="sm" color="muted" className="mb-4">
                  {description}
                </Text>
              )}
              {children}
            </div>

            {/* Footer con botones */}
            {(onConfirm || onCancel) && (
              <div
                className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4"
                style={{
                  background: dialogTokens.footer.background,
                  borderTop: dialogTokens.footer.borderTop,
                  borderBottomLeftRadius: dialogTokens.content.borderRadius,
                  borderBottomRightRadius: dialogTokens.content.borderRadius,
                }}
              >
                {onCancel && (
                  <CustomButton
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading || isConfirmLoading}
                    className="mb-2 sm:mb-0"
                  >
                    {cancelText}
                  </CustomButton>
                )}

                {onConfirm && (
                  <CustomButton
                    variant={getConfirmButtonVariant()}
                    color={getConfirmButtonColor()}
                    onClick={handleConfirm}
                    loading={isConfirmLoading}
                    disabled={isLoading}
                  >
                    {confirmText}
                  </CustomButton>
                )}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  },
)

CustomDialog.displayName = "CustomDialog"

export { CustomDialog }
