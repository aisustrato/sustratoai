//. 📍 components/ui/StandardRadioGroup.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { StandardRadio, type StandardRadioProps } from './StandardRadio';
import { StandardText } from './StandardText';

//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface RadioGroupOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface StandardRadioGroupProps {
  options: RadioGroupOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  colorScheme?: StandardRadioProps['colorScheme'];
  size?: StandardRadioProps['size'];
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  error?: string;
  name?: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const StandardRadioGroup: React.FC<StandardRadioGroupProps> = ({
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
  name,
}) => {

  const [selectedValue, setSelectedValue] = useState<string | undefined>(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleRadioChange = (newValue: string) => {
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    onChange?.(newValue);
  };

  const generatedName = useId();
  const effectiveName = name || generatedName;

  return (
    <div className={cn('flex flex-col gap-2', className)} role="radiogroup" aria-labelledby={label ? 'group-label' : undefined}>
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
          <StandardRadio
            key={option.value}
            name={effectiveName}
            label={option.label}
            description={option.description}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={() => handleRadioChange(option.value)}
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
StandardRadioGroup.displayName = 'StandardRadioGroup';
export { StandardRadioGroup as RadioGroup };
//#endregion ![foo]
