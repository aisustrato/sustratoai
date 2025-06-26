//. 📍 /components/ui/StandardAccordion/StandardAccordion.tsx

"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import { cn } from "@/lib/utils";
import { generateStandardAccordionTokens, type StandardAccordionTokenArgs } from "@/lib/theme/components/standard-accordion-tokens";
import { StandardAccordionContext, useStandardAccordion } from "./standard-accordion-context";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

// Contexto específico para el Item para pasar el estado `isOpen`
const ItemContext = React.createContext<{ isOpen: boolean; isDisabled: boolean }>({ isOpen: false, isDisabled: false });
const useItemContext = () => React.useContext(ItemContext);

// 1. Componente Raíz: StandardAccordion (con manejo de tipos discriminados)
// ========================================================================

// Props base que añadimos a nuestro componente
type StandardAccordionBaseProps = {
  colorScheme?: ColorSchemeVariant;
  size?: 'sm' | 'md' | 'lg';
};

// Unimos nuestras props con las de Radix, que ya manejan la unión discriminada
export type StandardAccordionProps = StandardAccordionBaseProps & React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

const StandardAccordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  StandardAccordionProps
>(({ colorScheme = 'neutral', size = 'md', ...props }, ref) => {
  const { appColorTokens, mode } = useTheme();

  // Para poder pasar `openItems` al contexto, necesitamos controlar el estado,
  // incluso cuando el componente se usa de forma "no controlada" (con defaultValue).
  const [internalValue, setInternalValue] = React.useState(props.defaultValue);

  // El valor actual es el controlado (value) o el interno (internalValue).
  const currentValue = props.value ?? internalValue;
  const openItems = currentValue ? (Array.isArray(currentValue) ? currentValue : [currentValue]) : [];

  const contextValue = React.useMemo(() => ({
    colorScheme,
    size,
    appColorTokens,
    mode,
    openItems,
  }), [colorScheme, size, appColorTokens, mode, openItems]);

  // El `if` es clave para que TypeScript entienda la unión discriminada.
  if (props.type === 'multiple') {
    const handleValueChange = (value: string[]) => {
      setInternalValue(value);
      props.onValueChange?.(value);
    };

    return (
      <StandardAccordionContext.Provider value={contextValue}>
        <AccordionPrimitive.Root
          {...props}
          ref={ref}
          value={currentValue as string[] | undefined}
          onValueChange={handleValueChange}
        />
      </StandardAccordionContext.Provider>
    );
  }

  // Por defecto o si type === 'single'
  const handleValueChange = (value: string) => {
    setInternalValue(value);
    props.onValueChange?.(value);
  };

  return (
    <StandardAccordionContext.Provider value={contextValue}>
      <AccordionPrimitive.Root
        {...props}
        type="single"
        ref={ref}
        value={currentValue as string | undefined}
        onValueChange={handleValueChange}
      />
    </StandardAccordionContext.Provider>
  );
});
StandardAccordion.displayName = "StandardAccordion";

// 2. Componente de Item: StandardAccordionItem
// ============================================

const StandardAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, value, disabled, children, ...props }, ref) => {
  const { appColorTokens, mode, openItems } = useStandardAccordion();
  const isOpen = openItems.includes(value);
  const isDisabled = !!disabled;

  const tokens = React.useMemo(() => {
    if (!appColorTokens) return null;
    return generateStandardAccordionTokens(appColorTokens, mode, { isOpen, isDisabled });
  }, [appColorTokens, mode, isOpen, isDisabled]);

  return (
    <ItemContext.Provider value={{ isOpen, isDisabled }}>
      <AccordionPrimitive.Item
        ref={ref}
        value={value}
        disabled={isDisabled}
        className={cn("overflow-hidden border rounded-md", className)}
        style={{
          borderColor: tokens?.item.borderColor,
          marginBottom: tokens?.item.marginBottom,
        }}
        {...props}
      >
        {children}
      </AccordionPrimitive.Item>
    </ItemContext.Provider>
  );
});
StandardAccordionItem.displayName = "StandardAccordionItem";

// 3. Componente de Disparador: StandardAccordionTrigger
// =====================================================

const StandardAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const { appColorTokens, mode, colorScheme, size } = useStandardAccordion();
  const { isOpen, isDisabled } = useItemContext();
  const [isHovered, setIsHovered] = React.useState(false);

  const tokens = React.useMemo(() => {
    if (!appColorTokens) return null;
    const tokenArgs: StandardAccordionTokenArgs = { colorScheme, size, isHovered, isOpen, isDisabled };
    return generateStandardAccordionTokens(appColorTokens, mode, tokenArgs);
  }, [appColorTokens, mode, colorScheme, size, isHovered, isOpen, isDisabled]);

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("flex flex-1 items-center justify-between font-medium transition-all", className)}
        style={{
          background: tokens?.trigger.background,
          color: tokens?.trigger.color,
          padding: tokens?.trigger.padding,
          fontSize: tokens?.trigger.fontSize,
          fontWeight: tokens?.trigger.fontWeight,
          cursor: tokens?.trigger.cursor,
          opacity: tokens?.trigger.opacity,
        }}
        {...props}
      >
        {children}
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ transform: tokens?.icon.transform, color: tokens?.icon.color }}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
StandardAccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

// 4. Componente de Contenido: StandardAccordionContent
// ====================================================

const StandardAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { appColorTokens, mode, size } = useStandardAccordion();
  const { isDisabled } = useItemContext();

  const tokens = React.useMemo(() => {
    if (!appColorTokens) return null;
    return generateStandardAccordionTokens(appColorTokens, mode, { size, isDisabled });
  }, [appColorTokens, mode, size, isDisabled]);

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      style={{
        background: tokens?.content.background,
        color: tokens?.content.color,
        borderTop: tokens?.content.borderTop,
        opacity: tokens?.content.opacity,
      }}
      {...props}
    >
      <div className="p-4" style={{ padding: tokens?.content.padding }}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
StandardAccordionContent.displayName = AccordionPrimitive.Content.displayName;

export {
  StandardAccordion,
  StandardAccordionItem,
  StandardAccordionTrigger,
  StandardAccordionContent,
};
