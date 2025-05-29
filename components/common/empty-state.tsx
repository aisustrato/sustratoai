import React from "react";
import { Text } from "@/components/ui/text";
import { CustomButton } from "@/components/ui/custom-button";
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
      <Text className="mt-6 text-xl font-semibold">{title}</Text>
      {description && (
        <Text className="mt-2 text-center text-sm text-muted-foreground max-w-md">
          {description}
        </Text>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
