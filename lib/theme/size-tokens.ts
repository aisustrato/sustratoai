export type Size = "xs" | "sm" | "md" | "lg" | "xl";

export interface SizeTokens {
  spacing: {
    [key in Size]: string;
  };
  fontSize: {
    [key in Size]: string;
  };
  borderRadius: {
    [key in Size]: string;
  };
  iconSize: {
    [key in Size]: string;
  };
  lineHeight: {
    [key in Size]: string;
  };
}

export const sizeTokens: SizeTokens = {
  spacing: {
    xs: "0.5rem", // 8px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
  },
  borderRadius: {
    xs: "0.125rem", // 2px
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
  },
  iconSize: {
    xs: "1rem", // 16px
    sm: "1.25rem", // 20px
    md: "1.5rem", // 24px
    lg: "1.75rem", // 28px
    xl: "2rem", // 32px
  },
  lineHeight: {
    xs: "1rem", // 16px
    sm: "1.25rem", // 20px
    md: "1.5rem", // 24px
    lg: "1.75rem", // 28px
    xl: "2rem", // 32px
  },
};
