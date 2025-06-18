"use client";

import { useTheme } from "@/app/theme-provider";
import { SustratoLogoRotating } from "@/components/ui/sustrato-logo-rotating";

// Componente con SVG rotativo pero texto fijo según el tema actual
export function SustratoLogoWithFixedText({
  className = "",
  size = 40,
  speed = "normal",
  initialTheme = "blue", // initialTheme is for the rotating part, not text
  textClassName = "",
  variant = "horizontal",
}: {
  className?: string;
  size?: number;
  speed?: "slow" | "normal" | "fast";
  initialTheme?: "blue" | "green" | "orange"; // Keep for SustratoLogoRotating compatibility
  textClassName?: string;
  variant?: "horizontal" | "vertical";
}) {
  const { appColorTokens } = useTheme();

  const primaryTextColor = appColorTokens.primary?.pure || "#3D7DF6"; // Fallback if needed
  const accentTextColor = "#8A4EF6"; // Mantener el acento púrpura


  // Tamaño del texto según el tamaño del logo
  const getTextSize = () => {
    if (size <= 30) return "text-lg";
    if (size <= 40) return "text-xl";
    if (size <= 60) return "text-2xl";
    return "text-3xl";
  };

  // Tamaño del subtexto
  const getSubtextSize = () => {
    if (size <= 30) return "text-xs";
    if (size <= 40) return "text-sm";
    if (size <= 60) return "text-base";
    return "text-lg";
  };

  return (
    <div
      className={`flex ${
        variant === "vertical" ? "flex-col items-center" : "items-center"
      } ${className}`}
    >
      <SustratoLogoRotating
        size={size}
        speed={speed}
        initialTheme={initialTheme}
      />

      <div
        className={`${
          variant === "vertical" ? "mt-2 text-center" : "ml-3"
        } ${textClassName}`}
      >
        <div className={`font-bold ${getTextSize()}`}>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${primaryTextColor}, ${accentTextColor})`,
              fontFamily: "'Chau Philomene One', sans-serif",
            }}
          >
            Sustrato.ai
          </span>
        </div>

        {variant === "horizontal" && (
          <div
            className={`${getSubtextSize()} text-neutral-500 dark:text-neutral-400 ml-0.5 mt-0.5 italic`}
          >
            cultivando sinergias humano·AI
          </div>
        )}

        {variant === "vertical" && (
          <div
            className={`${getSubtextSize()} text-neutral-500 dark:text-neutral-400 italic`}
          >
            cultivando sinergias humano·AI
          </div>
        )}
      </div>
    </div>
  );
}
