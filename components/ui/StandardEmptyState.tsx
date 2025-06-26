import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StandardText } from './StandardText';
import { type ColorScheme } from '@/lib/theme/ColorToken';
import { generateEmptyStateTokens } from '@/lib/theme/components/empty-state-tokens';

export interface StandardEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  colorScheme?: ColorScheme;
  className?: string;
}

export const StandardEmptyState: React.FC<StandardEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  colorScheme = 'blue',
  className,
}) => {
  const tokens = generateEmptyStateTokens(colorScheme);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50',
        className
      )}
      style={{
        borderColor: tokens.container.borderColor,
      }}
    >
      {Icon && (
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ 
            backgroundColor: tokens.icon.bg, 
            color: tokens.icon.color 
          }}
        >
          <Icon 
            className="h-10 w-10" 
          />
        </div>
      )}
      <StandardText size="xl" weight="semibold" className="mt-6">
        {title}
      </StandardText>
      {description && (
        <StandardText size="sm" align="center" colorShade="subtle" className="mt-2 max-w-md">
          {description}
        </StandardText>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
