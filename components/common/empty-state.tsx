import React from "react";
import { StandardText } from "@/components/ui/StandardText";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      {Icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <StandardText size="xl" weight="semibold" className="mt-6">{title}</StandardText>
      {description && (
        <StandardText size="sm" align="center" colorShade="subtle" className="mt-2 max-w-md">
          {description}
        </StandardText>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
