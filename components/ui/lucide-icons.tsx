"use client";

import * as LucideIcons from "lucide-react";
import { Icon } from "./icon";
import type { IconProps } from "./icon";

// Función para crear un componente de icono envuelto
const createWrappedIcon = (LucideIcon: any) => {
  return (props: Partial<IconProps>) => (
    <Icon {...props}>
      <LucideIcon strokeWidth={props.strokeOnly ? 2 : 1.5} />
    </Icon>
  );
};

// Exportar iconos individuales
export const FileText = createWrappedIcon(LucideIcons.FileText);
export const BookOpen = createWrappedIcon(LucideIcons.BookOpen);
export const ExternalLink = createWrappedIcon(LucideIcons.ExternalLink);
export const ArrowRight = createWrappedIcon(LucideIcons.ArrowRight);
export const Sparkles = createWrappedIcon(LucideIcons.Sparkles);
export const Home = createWrappedIcon(LucideIcons.Home);
export const Bell = createWrappedIcon(LucideIcons.Bell);
export const Settings = createWrappedIcon(LucideIcons.Settings);
export const User = createWrappedIcon(LucideIcons.User);
export const Mail = createWrappedIcon(LucideIcons.Mail);
export const Calendar = createWrappedIcon(LucideIcons.Calendar);
export const Search = createWrappedIcon(LucideIcons.Search);
export const Heart = createWrappedIcon(LucideIcons.Heart);
export const Star = createWrappedIcon(LucideIcons.Star);
export const Zap = createWrappedIcon(LucideIcons.Zap);
export const Shield = createWrappedIcon(LucideIcons.Shield);
export const Award = createWrappedIcon(LucideIcons.Award);
