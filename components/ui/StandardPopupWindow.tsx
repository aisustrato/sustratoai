//. 📍 components/ui/StandardPopupWindow.tsx (v1.0 - Popup Window para lienzo amplio)

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { generateDialogTokens } from "@/lib/theme/components/standard-dialog-tokens";
import { StandardText } from "@/components/ui/StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

// --- Se definen los componentes base ---
const StandardPopupWindowRoot = DialogPrimitive.Root;
const StandardPopupWindowTrigger = DialogPrimitive.Trigger;
const StandardPopupWindowPortal = DialogPrimitive.Portal;
const StandardPopupWindowClose = DialogPrimitive.Close;

// --- Overlay ---
const StandardPopupWindowOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "popup-overlay fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
StandardPopupWindowOverlay.displayName = DialogPrimitive.Overlay.displayName;

// --- Contenedor Principal (El Orquestador) ---
interface StandardPopupWindowContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  colorScheme?: ColorSchemeVariant;
  size?: 'md' | 'lg' | 'xl' | 'full'; // Tamaños pensados para lienzo amplio
}

const StandardPopupWindowContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  StandardPopupWindowContentProps
>(({ className, children, colorScheme = "neutral", size = "lg", ...props }, ref) => {
  const { appColorTokens, mode } = useTheme();

  const cssVariables = React.useMemo<React.CSSProperties>(() => {
    if (!appColorTokens || !mode) return {};
    const allTokens = generateDialogTokens(appColorTokens, mode);
    const tokenSet = allTokens[colorScheme] || allTokens.neutral;

    // Variables CSS para el popup window
    const vars: React.CSSProperties & { [key: `--${string}`]: string | number } = {
      '--popup-bg': tokenSet.content.background || '',
      '--popup-border': tokenSet.content.border || 'none',
      '--popup-shadow': tokenSet.content.shadow || 'none',
      '--popup-radius': tokenSet.content.borderRadius || '0.75rem',
      '--popup-header-bg': tokenSet.header.background || 'transparent',
      '--popup-header-border': tokenSet.header.border || 'none',
      '--popup-footer-bg': tokenSet.footer.background || 'transparent',
      '--popup-footer-border': tokenSet.footer.border || 'none',
      '--popup-close-color': tokenSet.close.color || 'currentColor',
      '--popup-close-bg-hover': tokenSet.close.backgroundHover || 'transparent',
    };
    return vars;
  }, [appColorTokens, mode, colorScheme]);

  // Clases de tamaño para popup window (70-80% de pantalla)
  const sizeClasses = {
    md: "w-[70vw] h-[70vh] max-w-4xl max-h-[80vh]",
    lg: "w-[80vw] h-[80vh] max-w-6xl max-h-[90vh]", 
    xl: "w-[85vw] h-[85vh] max-w-7xl max-h-[92vh]",
    full: "w-[95vw] h-[95vh] max-w-none max-h-[95vh]"
  };

  // Estilos inline forzados para garantizar consistencia (evita race conditions CSS)
  const forcedSizeStyles: React.CSSProperties = {
    md: { width: '70vw', height: '70vh', maxWidth: '64rem', maxHeight: '80vh' },
    lg: { width: '80vw', height: '80vh', maxWidth: '72rem', maxHeight: '90vh' },
    xl: { width: '85vw', height: '85vh', maxWidth: '80rem', maxHeight: '92vh' },
    full: { width: '95vw', height: '95vh', maxWidth: 'none', maxHeight: '95vh' }
  }[size];
  return (
    <StandardPopupWindowPortal>
      <StandardPopupWindowOverlay />
      <DialogPrimitive.Content
        ref={ref}
        style={{
          ...cssVariables,
          ...forcedSizeStyles, // Estilos inline forzados para evitar race conditions
          // Forzar posicionamiento y layout crítico
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2010,
          display: 'flex',
          flexDirection: 'column',
          // Nunca permitir que hereden height/width problemáticos
          minHeight: 'auto',
          minWidth: 'auto'
        }}
        onPointerDownOutside={(e) => {
            const el = e.target as Element | null;
            const isRadixPopper = !!(el && el.closest('[data-radix-popper-content-wrapper]'));
            const isStandardSelectDropdown = !!(el && el.closest('[data-standard-select-dropdown]'));
            // No cerrar el diálogo si el click ocurre en poppers o en nuestro dropdown portalizado
            if (props.onPointerDownOutside === undefined && (isRadixPopper || isStandardSelectDropdown)) {
              e.preventDefault();
              return;
            }
            if (props.onPointerDownOutside) {
              props.onPointerDownOutside(e);
            }
        }}
        className={cn(
          "popup-window border-0 p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg overflow-hidden",
          // Mantenemos las clases como backup, pero los estilos inline tienen prioridad
          sizeClasses[size],
          "bg-[var(--popup-bg)] border-[var(--popup-border)] shadow-[var(--popup-shadow)] rounded-[var(--popup-radius)]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4 text-[var(--popup-close-color)] hover:text-current" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </StandardPopupWindowPortal>
  );
});
StandardPopupWindowContent.displayName = DialogPrimitive.Content.displayName;

// --- Subcomponentes Semánticos ---
const StandardPopupWindowHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 p-6 pb-4 text-center sm:text-left border-b flex-shrink-0",
      "bg-[var(--popup-header-bg)] border-[var(--popup-header-border)]",
      "rounded-t-[var(--popup-radius)]", 
      className
    )}
    {...props}
  />
);
StandardPopupWindowHeader.displayName = "StandardPopupWindowHeader";

const StandardPopupWindowBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    data-standard-dialog-body
    className={cn(
      "p-6 flex-1 overflow-auto relative", // relative para anclar posicionamiento absoluto de dropdowns
      className
    )} 
    {...props} 
  />
);
StandardPopupWindowBody.displayName = "StandardPopupWindowBody";

const StandardPopupWindowFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t flex-shrink-0",
      "bg-[var(--popup-footer-bg)] border-[var(--popup-footer-border)]",
      "rounded-b-[var(--popup-radius)]",
      className
    )}
    {...props}
  />
);
StandardPopupWindowFooter.displayName = "StandardPopupWindowFooter";

const StandardPopupWindowTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof StandardText>) => (
  <StandardText preset="title" asElement="h2" className={cn("text-lg", className)} {...props} />
);
StandardPopupWindowTitle.displayName = "StandardPopupWindowTitle";

const StandardPopupWindowDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof StandardText>) => (
  <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className={cn(className)} {...props} />
);
StandardPopupWindowDescription.displayName = "StandardPopupWindowDescription";

// ✅ Componente compuesto usando Object.assign para compatibilidad con TypeScript
const StandardPopupWindow = Object.assign(StandardPopupWindowRoot, {
  Trigger: StandardPopupWindowTrigger,
  Portal: StandardPopupWindowPortal,
  Overlay: StandardPopupWindowOverlay,
  Content: StandardPopupWindowContent,
  Header: StandardPopupWindowHeader,
  Body: StandardPopupWindowBody,
  Footer: StandardPopupWindowFooter,
  Title: StandardPopupWindowTitle,
  Description: StandardPopupWindowDescription,
  Close: StandardPopupWindowClose,
});

export { StandardPopupWindow };
