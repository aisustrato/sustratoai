"use client";

import React, { createContext, forwardRef, useContext, useMemo, ComponentPropsWithoutRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { generateDropdownMenuTokens } from "@/lib/theme/components/standard-dropdown-menu-tokens";
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';

const DropdownMenuCssVariablesContext = createContext<React.CSSProperties>({});

interface SubmenuContextType {
    side: 'left' | 'right';
}
const SubmenuContext = createContext<SubmenuContextType>({ side: 'right' });

interface StandardDropdownMenuRootProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const StandardDropdownMenuRoot = ({ children, ...props }: StandardDropdownMenuRootProps) => {
    const { appColorTokens, mode } = useTheme();
    
    const cssVariables = useMemo(() => {
        if (!appColorTokens || !mode) return {};
        const tokens = generateDropdownMenuTokens(appColorTokens, mode);
        const vars: { [key: `--${string}`]: string | number } = {};
        Object.entries(tokens).forEach(([group, groupTokens]) => {
            if (typeof groupTokens === 'object' && groupTokens !== null) {
                Object.entries(groupTokens).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        vars[`--sddm-${group}-${key}`] = value;
                    }
                });
            }
        });
        return vars;
    }, [appColorTokens, mode]);

    return (
        <DropdownMenuCssVariablesContext.Provider value={cssVariables}>
            <DropdownMenuPrimitive.Root {...props}>
                {children}
            </DropdownMenuPrimitive.Root>
        </DropdownMenuCssVariablesContext.Provider>
    );
};

const StandardDropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const StandardDropdownMenuContent = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & { submenusSide?: 'left' | 'right' }
>(({ sideOffset = 6, children, submenusSide = 'right', ...props }, ref) => {
    const cssVariables = useContext(DropdownMenuCssVariablesContext);
    
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("z-50 min-w-[12rem] overflow-hidden rounded-lg border p-1.5", "animate-in")} style={{ ...cssVariables, backgroundColor: 'var(--sddm-content-backgroundColor)', borderColor: 'var(--sddm-content-borderColor)', boxShadow: 'var(--sddm-content-boxShadow)'}} {...props}>
                <SubmenuContext.Provider value={{ side: submenusSide }}>
                    {children}
                </SubmenuContext.Provider>
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
});
StandardDropdownMenuContent.displayName = 'StandardDropdownMenuContent';

const StandardMenuItem = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { className?: string }
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none transition-colors",
            "text-[var(--sddm-item-foregroundColor)]",
            "hover:bg-[var(--sddm-item-hoverBackgroundColor)] hover:text-[var(--sddm-item-hoverForegroundColor)]",
            "focus:bg-[var(--sddm-item-hoverBackgroundColor)] focus:text-[var(--sddm-item-hoverForegroundColor)]",
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    />
));
StandardMenuItem.displayName = 'StandardMenuItem';


const StandardDropdownMenuSeparator = forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Separator>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>>((props, ref) => (
    <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1.5 h-px", "bg-[var(--sddm-separator-backgroundColor)]")} {...props} />
));
StandardDropdownMenuSeparator.displayName = 'StandardDropdownMenuSeparator';

const StandardDropdownMenuLabel = forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Label>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>>((props, ref) => (
    <DropdownMenuPrimitive.Label ref={ref} className={cn("px-2.5 py-1.5 text-xs font-semibold", "text-[var(--sddm-label-foregroundColor)]")} {...props} />
));
StandardDropdownMenuLabel.displayName = 'StandardDropdownMenuLabel';


interface SubMenuItemProps extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
    submenuContent: React.ReactNode;
}

const SubMenuItem = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    SubMenuItemProps
>(({ children, className, submenuContent, ...props }, ref) => {
    const { side } = useContext(SubmenuContext);
    const cssVariables = useContext(DropdownMenuCssVariablesContext);

    return (
        <DropdownMenuPrimitive.Sub>
            <DropdownMenuPrimitive.SubTrigger
                ref={ref}
                className={cn("relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none transition-colors", "focus:bg-[var(--sddm-item-hoverBackgroundColor)] focus:text-[var(--sddm-item-hoverForegroundColor)]", "data-[state=open]:bg-[var(--sddm-item-hoverBackgroundColor)] data-[state=open]:text-[var(--sddm-item-hoverForegroundColor)]", className)}
                {...props}
            >
                <div className="flex-grow flex items-center gap-2">
                    {side === 'left' && <ChevronLeft className="h-4 w-4" />}
                    {children}
                </div>
                {side === 'right' && <ChevronRight className="h-4 w-4" />}
            </DropdownMenuPrimitive.SubTrigger>
            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.SubContent
                    sideOffset={6}
                    // 📌 FIX DEFINITIVO: Eliminada la propiedad `side={side}` que causaba el error recurrente.
                    className={cn("z-50 min-w-[12rem] overflow-hidden rounded-lg border p-1.5", "animate-in")}
                    style={{ ...cssVariables, backgroundColor: 'var(--sddm-content-backgroundColor)', borderColor: 'var(--sddm-content-borderColor)', boxShadow: 'var(--sddm-content-boxShadow)'}}
                >
                    {submenuContent}
                </DropdownMenuPrimitive.SubContent>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Sub>
    );
});
SubMenuItem.displayName = 'SubMenuItem';

const StandardDropdownMenuCheckboxItem = forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
    const cssVariables = useContext(DropdownMenuCssVariablesContext);
    
    return (
        <DropdownMenuPrimitive.CheckboxItem
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                "focus:bg-[var(--sddm-item-hoverBackgroundColor)] focus:text-[var(--sddm-item-hoverForegroundColor)]",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            checked={checked}
            style={cssVariables}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
});
StandardDropdownMenuCheckboxItem.displayName = 'StandardDropdownMenu.CheckboxItem';

export const StandardDropdownMenu = Object.assign(StandardDropdownMenuRoot, {
    Trigger: StandardDropdownMenuTrigger,
    Content: StandardDropdownMenuContent,
    Item: StandardMenuItem,
    Separator: StandardDropdownMenuSeparator,
    Label: StandardDropdownMenuLabel,
    SubMenuItem: SubMenuItem,
    CheckboxItem: StandardDropdownMenuCheckboxItem,
});