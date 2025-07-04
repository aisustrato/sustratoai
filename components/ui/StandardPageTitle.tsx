"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
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
        <nav className="flex items-center text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <StandardIcon styleType="outline" size="xs" colorScheme="tertiary" colorShade="pure"><ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/70" /></StandardIcon>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Botón de regreso */}
      {backButton && (
        <Link
          href={backButton.href}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
        >
          <StandardIcon styleType="outline" size="xs" colorScheme="tertiary" colorShade="pure"><ArrowLeft className="h-3.5 w-3.5 mr-1" /></StandardIcon>
          {backButton.label || "Volver"}
        </Link>
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