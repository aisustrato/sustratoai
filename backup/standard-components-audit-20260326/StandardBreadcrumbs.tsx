import React, { useState } from 'react';
import Link from 'next/link';
import { StandardText } from './StandardText';
import { ChevronRight } from 'lucide-react';
import { useDesignTokens } from '@/app/providers/DesignTokensProvider';
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { BreadcrumbVariant } from '@/app/providers/DesignTokensProvider';

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface StandardBreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  colorScheme?: ColorSchemeVariant;
  variant?: BreadcrumbVariant;
  className?: string;
  style?: React.CSSProperties;
}

interface BreadcrumbItemProps extends Omit<BreadcrumbItem, 'label'> {
  label: React.ReactNode;
  isLast: boolean;
  colorScheme?: ColorSchemeVariant;
  variant?: BreadcrumbVariant;
  separator?: React.ReactNode;
  showSeparator: boolean;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  label,
  href,
  isLast,
  colorScheme = 'neutral',
  variant = 'default',
  separator,
  showSeparator = true
}) => {
  const { tokens } = useDesignTokens();
  const [isHovered, setIsHovered] = useState(false);
  
  if (!tokens) return null;

  const breadcrumbTokens = tokens.breadcrumbs[colorScheme][variant];
  const stateTokens = isLast ? breadcrumbTokens.last : (isHovered ? breadcrumbTokens.hover : breadcrumbTokens.default);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const itemContent = (
    <StandardText
      as="span"
      size="sm"
      style={{
        color: stateTokens.color,
        textDecoration: stateTokens.textDecoration,
        cursor: stateTokens.cursor,
        transition: stateTokens.transition,
        fontWeight: stateTokens.fontWeight,
      }}
      className="whitespace-nowrap"
    >
      {label}
    </StandardText>
  );

  return (
    <div className="flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {showSeparator && separator && (
        <span className="mx-2 text-neutral-400" aria-hidden="true">
          {separator}
        </span>
      )}
      {href && !isLast ? (
        <Link href={href} passHref style={{ textDecoration: 'none' }}>
          {itemContent}
        </Link>
      ) : (
        <div>
          {itemContent}
        </div>
      )}
    </div>
  );
};

export const StandardBreadcrumbs: React.FC<StandardBreadcrumbsProps> = ({
  items,
  separator = <ChevronRight size={16} />,
  colorScheme = 'neutral',
  variant = 'default',
  className = '',
  style,
}) => {
  if (!items?.length) return null;

  return (
    <nav 
      className={`flex items-center ${className}`}
      aria-label="Breadcrumb"
      style={style}
    >
      {items.map((item, index) => (
        <BreadcrumbItem
          key={index}
          label={item.label}
          href={item.href}
          isLast={index === items.length - 1}
          colorScheme={colorScheme}
          variant={variant}
          separator={separator}
          showSeparator={index > 0}
        />
      ))}
    </nav>
  );
};

StandardBreadcrumbs.displayName = 'StandardBreadcrumbs';

export default StandardBreadcrumbs;
