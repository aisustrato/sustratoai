//. 📍 components/ui/StandardCheckboxGroup.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { StandardCheckbox, type StandardCheckboxProps } from './StandardCheckbox';
import { StandardText } from './StandardText';
import type { ColorSchemeVariant } from '@/lib/theme/ColorToken';

//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface CheckboxGroupOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface StandardCheckboxGroupProps {
  options: CheckboxGroupOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  colorScheme?: ColorSchemeVariant;
  size?: StandardCheckboxProps['size'];
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  error?: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const StandardCheckboxGroup: React.FC<StandardCheckboxGroupProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  colorScheme,
  size = 'md',
  orientation = 'vertical',
  disabled = false,
  className,
  label,
  description,
  error,
}) => {

  const [selectedValues, setSelectedValues] = useState<string[]>(value ?? defaultValue ?? []);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value);
    }
  }, [value]);

  const handleCheckboxChange = (optionValue: string, isChecked: boolean) => {
    const newSelectedValues = isChecked
      ? [...selectedValues, optionValue]
      : selectedValues.filter((v) => v !== optionValue);

    if (value === undefined) {
      setSelectedValues(newSelectedValues);
    }

    onChange?.(newSelectedValues);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} role="group" aria-labelledby={label ? 'group-label' : undefined}>
      {label && (
        <StandardText id="group-label" size="sm" weight="medium" className={error ? 'text-red-600' : ''}>
          {label}
        </StandardText>
      )}
      {description && !error && (
        <StandardText size="xs" colorShade="subtle" className="-mt-1 mb-2">
          {description}
        </StandardText>
      )}
      <div
        className={cn('flex gap-4',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => (
          <StandardCheckbox
            key={option.value}
            label={option.label}
            description={option.description}
            checked={selectedValues.includes(option.value)}
            onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
            disabled={disabled || option.disabled}
            colorScheme={colorScheme}
            size={size}
            error={!!error}
          />
        ))}
      </div>
      {error && (
        <StandardText size="xs" colorScheme="danger" className="mt-1">
          {error}
        </StandardText>
      )}
    </div>
  );
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardCheckboxGroup.displayName = 'StandardCheckboxGroup';
export { StandardCheckboxGroup as CheckboxGroup };
//#endregion ![foo]
