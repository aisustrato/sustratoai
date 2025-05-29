"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Text } from "@/components/ui/text";
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
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/70" />
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
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
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
            <Text
              as="h1"
              variant="heading"
              size="2xl"
              className="leading-tight"
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                as="p"
                variant="default"
                color="neutral"
                className="mt-1 text-muted-foreground"
              >
                {subtitle}
              </Text>
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