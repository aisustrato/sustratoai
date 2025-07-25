"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBreadcrumbs } from "@/components/ui/StandardBreadcrumbs";
import { StandardIcon } from "@/components/ui/StandardIcon";

import { cn } from "@/lib/utils";

export type IconProps = React.SVGProps<SVGSVGElement>;

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BackButtonProps {
  href: string;
  label?: string;
}

export interface StandardPageTitleProps {
  title: string;
  subtitle?: string;
  description?: string;
  mainIcon?: React.ComponentType<IconProps>;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: BackButtonProps | boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function StandardPageTitle({
  title,
  subtitle,
  description,
  mainIcon: MainIcon,
  breadcrumbs,
  showBackButton,
  className,
  actions,
}: StandardPageTitleProps) {
  // Determinar si mostrar el botón de regreso y sus propiedades
  const backButton = typeof showBackButton === "boolean" 
    ? showBackButton ? { href: "#", label: "Volver" } : undefined
    : showBackButton;

  return (
    <div className={cn("space-y-2 mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2">
          <StandardBreadcrumbs
            items={breadcrumbs.map((crumb, index) => ({
              label: crumb.label,
              href: crumb.href,
              isCurrent: index === breadcrumbs.length - 1
            }))}
            colorScheme="primary"
            variant="default"
          />
        </div>
      )}

      {/* Botón de regreso */}
      {backButton && (
        <div className="mb-2">
          <StandardButton
            styleType="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            className="px-2 h-8"
            onClick={() => window.location.href = backButton.href}
          >
            {backButton.label || "Volver"}
          </StandardButton>
        </div>
      )}

      {/* Título principal con icono opcional */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          {MainIcon && (
            <StandardIcon styleType="inverseStroke" colorScheme="primary"
            colorShade="pure" size="xl" className="mt-0.5">
              <MainIcon />
            </StandardIcon>
          )}
          <div className="flex flex-col justify-center">
            <StandardText preset="heading" applyGradient={true}>
              {title}
            </StandardText>

            {subtitle && (
              <StandardText preset="subheading" colorScheme="secondary" className="mt-1">
                {subtitle}
              </StandardText>
            )}

            {description && (
              <StandardText preset="body" colorScheme="neutral" className="mt-2 text-muted-foreground">
                {description}
              </StandardText>
            )}
          </div>
        </div>
        
        {/* Acciones opcionales (botones, etc.) */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}