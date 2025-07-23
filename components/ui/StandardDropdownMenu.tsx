"use client";

import { createContext, forwardRef, useContext, useMemo } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { generateDropdownMenuTokens } from "@/lib/theme/components/standard-dropdown-menu-tokens";
import { Check } from 'lucide-react';

// --- Contexto para las variables CSS ---
const DropdownMenuCssVariablesContext = createContext<React.CSSProperties>({});

// --- Componente Raíz y Proveedor de Estilos ---
interface StandardDropdownMenuRootProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const StandardDropdownMenuRoot = ({ children, open, onOpenChange }: StandardDropdownMenuRootProps) => {
    const { appColorTokens, mode } = useTheme();
    
    const cssVariables = useMemo<React.CSSProperties & { [key: `--${string}`]: string | number }>(() => {
        if (!appColorTokens || !mode) return {};
        const tokens = generateDropdownMenuTokens(appColorTokens, mode);
        const vars: { [key: `--${string}`]: string | number } = {};

        Object.entries(tokens.content).forEach(([key, value]) => { vars[`--dropdown-content-${key}`] = value; });
        Object.entries(tokens.item).forEach(([key, value]) => { vars[`--dropdown-item-${key}`] = value; });
        Object.entries(tokens.separator).forEach(([key, value]) => { vars[`--dropdown-separator-${key}`] = value; });
        Object.entries(tokens.arrow).forEach(([key, value]) => { vars[`--dropdown-arrow-${key}`] = value; });

        return vars;
    }, [appColorTokens, mode]);

    return (
        <DropdownMenuCssVariablesContext.Provider value={cssVariables}>
            <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
                {children}
            </DropdownMenuPrimitive.Root>
        </DropdownMenuCssVariablesContext.Provider>
    );
};

// --- Subcomponentes ---

const StandardDropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const StandardDropdownMenuContent = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ sideOffset = 4, ...props }, ref) => {
    const cssVariables = useContext(DropdownMenuCssVariablesContext);
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={cn(
                    "z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
                    "animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                    "data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2"
                )}
                style={{
                    ...cssVariables,
                    backgroundColor: 'var(--dropdown-content-backgroundColor)',
                    borderColor: 'var(--dropdown-content-borderColor)',
                    boxShadow: 'var(--dropdown-content-boxShadow)',
                }}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
});
StandardDropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;


const StandardDropdownMenuItem = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }
>(({ inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
            "focus:bg-[var(--dropdown-item-hoverBackgroundColor)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            inset && "pl-8"
        )}
        style={{ 
            color: 'var(--dropdown-item-foregroundColor)',
            backgroundColor: 'var(--dropdown-item-backgroundColor)',
        }}
        {...props}
    />
));
StandardDropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;


const StandardDropdownMenuCheckboxItem = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
            "focus:bg-[var(--dropdown-item-hoverBackgroundColor)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        )}
        style={{ color: 'var(--dropdown-item-foregroundColor)' }}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Check className="h-4 w-4" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
));
StandardDropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;


const StandardDropdownMenuSeparator = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 my-1 h-px", className)}
        style={{ backgroundColor: 'var(--dropdown-separator-backgroundColor)' }}
        {...props}
    />
));
StandardDropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;


const StandardDropdownMenuLabel = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ inset, className, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn(
            "px-2 py-1.5 text-sm font-semibold", 
            inset && "pl-8",
            className
        )}
        style={{ color: 'var(--dropdown-item-disabledForegroundColor)'}}
        {...props}
    />
));
StandardDropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;


// --- Componentes de Submenú ---
const StandardDropdownMenuSub = DropdownMenuPrimitive.Sub;

const StandardDropdownMenuSubTrigger = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
>(({ inset, children, className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
            "focus:bg-[var(--dropdown-item-hoverBackgroundColor)] data-[state=open]:bg-[var(--dropdown-item-hoverBackgroundColor)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        style={{ 
            color: 'var(--dropdown-item-foregroundColor)',
            backgroundColor: 'var(--dropdown-item-backgroundColor)',
        }}
        {...props}
    >
        {children}
        <svg
            className="ml-auto h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </DropdownMenuPrimitive.SubTrigger>
));
StandardDropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const StandardDropdownMenuSubContent = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
    const cssVariables = useContext(DropdownMenuCssVariablesContext);
    return (
        <DropdownMenuPrimitive.SubContent
            ref={ref}
            className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
                "animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                "data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2",
                className
            )}
            style={{
                ...cssVariables,
                backgroundColor: 'var(--dropdown-content-backgroundColor)',
                borderColor: 'var(--dropdown-content-borderColor)',
                boxShadow: 'var(--dropdown-content-boxShadow)',
            }}
            {...props}
        />
    );
});
StandardDropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;


// --- Exportación compuesta ---
export const StandardDropdownMenu = Object.assign(StandardDropdownMenuRoot, {
    Trigger: StandardDropdownMenuTrigger,
    Content: StandardDropdownMenuContent,
    Item: StandardDropdownMenuItem,
    CheckboxItem: StandardDropdownMenuCheckboxItem,
    Separator: StandardDropdownMenuSeparator,
    Label: StandardDropdownMenuLabel,
    Sub: StandardDropdownMenuSub,
    SubTrigger: StandardDropdownMenuSubTrigger,
    SubContent: StandardDropdownMenuSubContent,
});