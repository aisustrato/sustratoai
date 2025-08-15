//. 📍 components/ui/StandardDialog.tsx (v1.2 - Corregido con Object.assign)

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
const StandardDialogRoot = DialogPrimitive.Root;
const StandardDialogTrigger = DialogPrimitive.Trigger;
const StandardDialogPortal = DialogPrimitive.Portal;
const StandardDialogClose = DialogPrimitive.Close;

// --- Overlay ---
const StandardDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "dialog-overlay fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-auto",
      className
    )}
    {...props}
  />
));
StandardDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// --- Contenedor Principal (El Orquestador) ---
interface StandardDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  colorScheme?: ColorSchemeVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const StandardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  StandardDialogContentProps
>(({ className, children, colorScheme = "neutral", size = "md", ...props }, ref) => {
  const { appColorTokens, mode } = useTheme();

  const cssVariables = React.useMemo<React.CSSProperties>(() => {
    if (!appColorTokens || !mode) return {};
    const allTokens = generateDialogTokens(appColorTokens, mode);
    const tokenSet = allTokens[colorScheme] || allTokens.neutral;

    // Ensure we have fallback values for all required properties
    const vars: React.CSSProperties & { [key: `--${string}`]: string | number } = {
      '--dialog-bg': tokenSet.content.background || '',
      '--dialog-border': tokenSet.content.border || 'none',
      '--dialog-shadow': tokenSet.content.shadow || 'none',
      '--dialog-radius': tokenSet.content.borderRadius || '0.5rem',
      '--dialog-header-bg': tokenSet.header.background || 'transparent',
      '--dialog-header-border': tokenSet.header.border || 'none',
      '--dialog-footer-bg': tokenSet.footer.background || 'transparent',
      '--dialog-footer-border': tokenSet.footer.border || 'none',
      '--dialog-close-color': tokenSet.close.color || 'currentColor',
      '--dialog-close-bg-hover': tokenSet.close.backgroundHover || 'transparent',
    };
    return vars;
  }, [appColorTokens, mode, colorScheme]);

  return (
    <StandardDialogPortal>
      <StandardDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        style={cssVariables}
        aria-describedby={undefined}
        onPointerDownOutside={(e) => {
            if (props.onPointerDownOutside === undefined && e.target instanceof Element && e.target.closest('[data-radix-popper-content-wrapper]')) {
                e.preventDefault();
            } else if (props.onPointerDownOutside) {
                props.onPointerDownOutside(e);
            }
        }}
        className={cn(
          "dialog-modal fixed left-1/2 top-1/2 z-[3010] w-auto h-auto min-w-[320px] max-w-md max-h-[80vh] -translate-x-1/2 -translate-y-1/2 border-0 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg overflow-hidden",
          "grid grid-rows-[auto_1fr_auto]", // Grid que se contrae automáticamente
          { "max-w-sm": size === 'sm', "max-w-md": size === 'md', "max-w-lg": size === 'lg', "max-w-xl": size === 'xl' },
          "bg-[var(--dialog-bg)] border-[var(--dialog-border)] shadow-[var(--dialog-shadow)] rounded-[var(--dialog-radius)]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4 text-[var(--dialog-close-color)] hover:text-current" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </StandardDialogPortal>
  );
});
StandardDialogContent.displayName = DialogPrimitive.Content.displayName;

// --- Subcomponentes Semánticos ---
const StandardDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6 pb-4 text-center sm:text-left border-b",
    "bg-[var(--dialog-header-bg)] border-[var(--dialog-header-border)]",
    "rounded-t-[var(--dialog-radius)]", 
    className)}
    {...props}
  />
);
StandardDialogHeader.displayName = "StandardDialogHeader";

const StandardDialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props} />
);
StandardDialogBody.displayName = "StandardDialogBody";

const StandardDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t",
    "bg-[var(--dialog-footer-bg)] border-[var(--dialog-footer-border)]",
    "rounded-b-[var(--dialog-radius)]",
    className)}
    {...props}
  />
);
StandardDialogFooter.displayName = "StandardDialogFooter";

const StandardDialogTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof StandardText>) => (
  <DialogPrimitive.Title>
    <StandardText preset="title" asElement="h2" className={cn("text-lg", className)} {...props} />
  </DialogPrimitive.Title>
);
StandardDialogTitle.displayName = "StandardDialogTitle";

const StandardDialogDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof StandardText>) => (
  <DialogPrimitive.Description>
    <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className={cn(className)} {...props} />
  </DialogPrimitive.Description>
);
StandardDialogDescription.displayName = "StandardDialogDescription";


// ✅ CORRECCIÓN: Usamos Object.assign para crear el componente compuesto de forma segura para TypeScript.
const StandardDialog = Object.assign(StandardDialogRoot, {
  Trigger: StandardDialogTrigger,
  Portal: StandardDialogPortal,
  Overlay: StandardDialogOverlay,
  Content: StandardDialogContent,
  Header: StandardDialogHeader,
  Body: StandardDialogBody,
  Footer: StandardDialogFooter,
  Title: StandardDialogTitle,
  Description: StandardDialogDescription,
  Close: StandardDialogClose,
});

export { StandardDialog };

