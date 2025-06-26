import { createAppColorTokens, type ColorScheme } from "../ColorToken";

export interface EmptyStateTokens {
  container: {
    borderColor: string;
  };
  icon: {
    bg: string;
    color: string;
  };
}

export const generateEmptyStateTokens = (colorScheme: ColorScheme): EmptyStateTokens => {
  // Usamos 'light' como modo por defecto, ya que el componente no tiene un selector de modo explícito.
  const tokens = createAppColorTokens(colorScheme, 'light');
  const { neutral } = tokens;

  return {
    container: {
      // El color de fondo es manejado por clases de tailwind, solo necesitamos el borde.
      borderColor: neutral.bgShade, // Corresponde al color de borde 'muted'
    },
    icon: {
      bg: neutral.bg, // Corresponde al fondo 'muted'
      color: neutral.text, // Corresponde a 'muted-foreground'
    },
  };
};
