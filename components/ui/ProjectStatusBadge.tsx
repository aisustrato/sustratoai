"use client";

import React from 'react';
import { useAuth } from '@/app/auth-provider';
import { StandardText } from './StandardText';

/**
 * @description
 * ProjectStatusBadge es un componente que muestra el nombre del proyecto actual
 * en una etiqueta o "badge". Está diseñado para ser posicionado de forma fija
 * en el layout principal de la aplicación.
 */
const ProjectStatusBadge: React.FC = () => {
  const { proyectoActual } = useAuth();

  if (!proyectoActual) {
    return null;
  }

  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1 rounded-full shadow-sm">
      <StandardText
        size="2xs"
        weight="medium"
        colorScheme="neutral"
        truncate={true}
        title={proyectoActual.name}
      >
        {proyectoActual.name}
      </StandardText>
    </div>
  );
};

export default ProjectStatusBadge;
