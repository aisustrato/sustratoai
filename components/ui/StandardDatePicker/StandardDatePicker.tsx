'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';

import { useTheme } from '@/app/theme-provider';
import { type ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { StandardInput } from '../StandardInput';
import { generateStandardDatePickerTokens, type StandardDatePickerRecipe, type DatePickerSizeVariant } from '@/lib/theme/components/standard-datepicker-tokens';

export interface StandardDatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'defaultValue'> {
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  defaultValue?: Date;
  label?: string;
  error?: string;
  colorScheme?: ColorSchemeVariant;
  size?: DatePickerSizeVariant;
}

const StandardDatePicker = React.forwardRef<HTMLInputElement, StandardDatePickerProps>(
  (
    {
      className,
      id,
      name,
      value,
      onValueChange,
      defaultValue,
      disabled,
      placeholder = 'Selecciona una fecha',
      colorScheme = 'primary',
      size = 'md',
      label,
      error,
      ...props
    },
    ref
  ) => {
    const [date, setDate] = React.useState<Date | undefined>(value ?? defaultValue);
    const [isPopoverOpen, setPopoverOpen] = React.useState(false);
    const { appColorTokens, mode } = useTheme();

    React.useEffect(() => {
      if (value !== undefined) {
        setDate(value);
      }
    }, [value]);

    const handleSelect = (selectedDate: Date | undefined) => {
      setDate(selectedDate);
      onValueChange?.(selectedDate);
      setPopoverOpen(false);
    };

    if (!appColorTokens || !mode) {
      return null; // O un loader, para evitar renderizar sin estilos.
    }

    const datePickerStyles: StandardDatePickerRecipe = generateStandardDatePickerTokens(appColorTokens, mode, {
      colorScheme,
      size,
    });

    return (
      <div className={cn('w-full', className)} {...props}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {label}
          </label>
        )}
        <Popover.Root open={isPopoverOpen} onOpenChange={setPopoverOpen}>
          <Popover.Trigger asChild>
            <StandardInput
              ref={ref}
              id={id}
              name={name}
              value={date ? format(date, 'PPP', { locale: es }) : ''}
              readOnly
              placeholder={placeholder}
              trailingIcon={CalendarIcon}
              colorScheme={colorScheme}
              size={size}
              disabled={disabled}
              error={error}
              className="cursor-pointer"
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-[999] w-auto rounded-md border p-0 shadow-lg outline-none"
              align="start"
              style={datePickerStyles.popover}
            >
              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleSelect}
                initialFocus
                locale={es}
                disabled={disabled}
                styles={datePickerStyles.dayPicker}
                showOutsideDays
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

StandardDatePicker.displayName = 'StandardDatePicker';

export { StandardDatePicker };
