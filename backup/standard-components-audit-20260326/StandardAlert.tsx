//. 📍 components/ui/StandardAlert.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from 'react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useDesignTokens } from '@/app/providers/DesignTokensProvider';
import type { AlertStyleType } from '@/app/providers/DesignTokensProvider';
import type { ColorSchemeVariant } from '@/lib/theme/ColorToken';
import { StandardIcon } from './StandardIcon';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
//#endregion ![head]

//#region [def] - 📦 INTERFACE 📦
export interface StandardAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  message: React.ReactNode;
  colorScheme?: ColorSchemeVariant;
  styleType?: AlertStyleType;
  onClose?: () => void;
  icon?: React.ElementType;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardAlert = React.forwardRef<HTMLDivElement, StandardAlertProps>(
  (
    {
      className,
      message,
      colorScheme = 'primary',
      styleType = 'subtle',
      onClose,
      icon: CustomIcon,
      ...props
    },
    ref
  ) => {
    const { tokens } = useDesignTokens();

    const alertTokens = useMemo(() => {
      if (!tokens) return null;
      return tokens.alert[colorScheme][styleType];
    }, [tokens, colorScheme, styleType]);

    const Icon = useMemo(() => {
      if (CustomIcon) return CustomIcon;
      switch (colorScheme) {
        case 'success': return CheckCircle;
        case 'warning': return AlertTriangle;
        case 'danger': return XCircle;
        case 'primary':
        default: return Info;
      }
    }, [CustomIcon, colorScheme]);

    if (!alertTokens) return null;

    const componentStyles: React.CSSProperties = {
      backgroundColor: alertTokens.backgroundColor,
      borderColor: alertTokens.borderColor,
      color: alertTokens.textColor,
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center p-4 border rounded-md', className)}
        style={componentStyles}
        role="alert"
        {...props}
      >
        <StandardIcon colorScheme={colorScheme} className="mr-3">
          <Icon className="h-5 w-5" />
        </StandardIcon>
        <div className="flex-grow text-sm font-medium">{message}</div>
        {onClose && (
          <button onClick={onClose} className="ml-4 -mr-1 -my-1 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50">
            <StandardIcon colorScheme={colorScheme} styleType='outline' size='sm'>
              <X />
            </StandardIcon>
          </button>
        )}
      </div>
    );
  }
);

StandardAlert.displayName = 'StandardAlert';

export { StandardAlert };
//#endregion ![main]
