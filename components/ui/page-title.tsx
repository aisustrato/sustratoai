"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BackButtonProps {
  href: string;
  label?: string;
}

export interface PageTitleProps {
  title: string;
  subtitle?: string;
  mainIcon?: React.ComponentType<any>;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: BackButtonProps | boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function PageTitle({
  title,
  subtitle,
  mainIcon: MainIcon,
  breadcrumbs,
  showBackButton,
  className,
  actions,
}: PageTitleProps) {
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
                <StandardIcon><ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/70" /></StandardIcon>
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
          <StandardIcon><ArrowLeft className="h-3.5 w-3.5 mr-1" /></StandardIcon>
          {backButton.label || "Volver"}
        </Link>
      )}

      {/* Título principal con icono opcional */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          {MainIcon && (
            <Icon color="primary" size="lg" className="mt-0.5">
              <MainIcon />
            </Icon>
          )}
          <div>
            <h1 className="leading-tight">
              <StandardText
                variant="heading"
                size="2xl"
              >
                {title}
              </StandardText>
            </h1>
            {subtitle && (
              <p className="mt-1 text-muted-foreground">
              <StandardText
                variant="default"
                colorScheme="neutral"
              >
                {subtitle}
              </StandardText>
            </p>
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