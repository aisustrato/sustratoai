import React from "react";
import { Text } from "@/components/ui/text";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex justify-between items-start mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <Text className="text-muted-foreground mt-1">{description}</Text>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}
