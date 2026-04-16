import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StandardText } from './StandardText';
import { useDesignTokens } from '@/app/providers/DesignTokensProvider';

export interface StandardEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const StandardEmptyState: React.FC<StandardEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  const { tokens } = useDesignTokens();
  
  if (!tokens) return null;
  
  const emptyStateTokens = tokens.emptyState;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50',
        className
      )}
      style={{
        borderColor: emptyStateTokens.container.borderColor,
      }}
    >
      {Icon && (
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ 
            backgroundColor: emptyStateTokens.icon.bg, 
            color: emptyStateTokens.icon.color 
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
