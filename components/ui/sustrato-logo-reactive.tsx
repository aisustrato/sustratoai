"use client";

import { useTheme } from "@/app/theme-provider";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

export function SustratoLogoReactive({
  className = "",
  size = 65,
  animate = true,
  speed = "normal",
}: {
  className?: string;
  size?: number;
  animate?: boolean;
  speed?: "slow" | "normal" | "fast";
}) {
  const { colorScheme, mode } = useTheme();
  const [logoColors, setLogoColors] = useState({
    primary: "#3D7DF6", // Blue theme primary por defecto
    accent: "#8A4EF6", // Accent color (centro púrpura)
  });

  // Definición de colores por tema
  const themeColors = useMemo(() => ({
    blue: {
      primary: mode === "dark" ? "#2E5EB9" : "#3D7DF6",
      secondary: mode === "dark" ? "#1EA4E9" : "#516e99",
    },
    green: {
      primary: mode === "dark" ? "#1c8e63" : "#24BC81",
      secondary: mode === "dark" ? "#2CA18F" : "#3AD7BF",
    },
    orange: {
      primary: mode === "dark" ? "#B95413" : "#F77019",
      secondary: mode === "dark" ? "#6D2F0B" : "#913E0F",
    },
  }), [mode]);

  // Establecer la duración de la transición según la velocidad
  const getTransitionDuration = () => {
    switch (speed) {
      case "slow":
        return 1.5;
      case "fast":
        return 0.5;
      default:
        return 0.8;
    }
  };

  // Actualizar los colores cuando cambie el tema
  useEffect(() => {
    const currentTheme = (colorScheme as keyof typeof themeColors) || "blue";

    setLogoColors({
      primary: themeColors[currentTheme].primary,
      accent: "#8A4EF6", // Siempre mantener el centro púrpura
    });
  }, [colorScheme, mode, themeColors]);

  // Configuraciones para la animación
  const transitionDuration = getTransitionDuration();
  const transitionSettings = {
    type: "tween",
    duration: transitionDuration,
    ease: "easeInOut",
  };

  // Configuración para el gradiente dinámico del círculo exterior
  const gradientTransition = {
    rotate: animate ? [0, 360] : 0,
    transition: animate
      ? {
          rotate: {
            repeat: Infinity,
            duration: speed === "slow" ? 12 : speed === "fast" ? 6 : 9,
            ease: "linear",
          },
        }
      : {},
  };

  // Obtener color secundario para el gradiente
  const secondaryColor =
    themeColors[(colorScheme as keyof typeof themeColors) || "blue"].secondary;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 65 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Definición del gradiente rotativo */}
        <motion.defs animate={gradientTransition}>
          <linearGradient id="logoGradient" gradientTransform="rotate(0)">
            <stop offset="0%" stopColor={logoColors.primary} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </motion.defs>

        {/* Círculo del centro (púrpura) */}
        <motion.circle
          cx="32.5"
          cy="32.5"
          r="7.76035"
          fill={logoColors.accent}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        />

        {/* Círculo exterior principal */}
        <mask
          id="path-2-outside-1"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="65"
          height="65"
          fill="black"
        >
          <rect fill="white" width="65" height="65" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M63 32.5C63 49.3447 49.3447 63 32.5 63C15.6553 63 2 49.3447 2 32.5C2 15.6553 15.6553 2 32.5 2C38.4707 2 44.0407 3.71563 48.7438 6.68081C49.5114 7.1647 49.5531 8.24774 48.858 8.83095V8.83095C48.3822 9.23024 47.7009 9.26189 47.1742 8.9325C42.8927 6.25479 37.832 4.7071 32.4098 4.7071C17.0103 4.7071 4.52663 17.1908 4.52663 32.5902C4.52663 47.9897 17.0103 60.4734 32.4098 60.4734C47.8092 60.4734 60.2929 47.9897 60.2929 32.5902C60.2929 28.8412 59.553 25.2651 58.2113 21.9997C57.9746 21.4238 58.1226 20.7558 58.5996 20.3555V20.3555C59.2908 19.7755 60.3441 20.0007 60.6895 20.8343C62.1783 24.428 63 28.368 63 32.5Z"
          />
        </mask>

        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M63 32.5C63 49.3447 49.3447 63 32.5 63C15.6553 63 2 49.3447 2 32.5C2 15.6553 15.6553 2 32.5 2C38.4707 2 44.0407 3.71563 48.7438 6.68081C49.5114 7.1647 49.5531 8.24774 48.858 8.83095V8.83095C48.3822 9.23024 47.7009 9.26189 47.1742 8.9325C42.8927 6.25479 37.832 4.7071 32.4098 4.7071C17.0103 4.7071 4.52663 17.1908 4.52663 32.5902C4.52663 47.9897 17.0103 60.4734 32.4098 60.4734C47.8092 60.4734 60.2929 47.9897 60.2929 32.5902C60.2929 28.8412 59.553 25.2651 58.2113 21.9997C57.9746 21.4238 58.1226 20.7558 58.5996 20.3555V20.3555C59.2908 19.7755 60.3441 20.0007 60.6895 20.8343C62.1783 24.428 63 28.368 63 32.5Z"
          fill="url(#logoGradient)"
          animate={{
            fill: animate ? "url(#logoGradient)" : logoColors.primary,
          }}
          transition={transitionSettings}
        />

        <motion.path
          d="M60.6895 20.8343L58.8418 21.5998L60.6895 20.8343ZM58.2113 21.9997L60.0612 21.2396L58.2113 21.9997ZM47.1742 8.9325L46.1137 10.6282L47.1742 8.9325ZM32.5 65C50.4493 65 65 50.4493 65 32.5H61C61 48.2401 48.2401 61 32.5 61V65ZM0 32.5C0 50.4493 14.5507 65 32.5 65V61C16.7599 61 4 48.2401 4 32.5H0ZM32.5 0C14.5507 0 0 14.5507 0 32.5H4C4 16.7599 16.7599 4 32.5 4V0ZM49.8105 4.98898C44.7974 1.8284 38.8591 0 32.5 0V4C38.0822 4 43.284 5.60287 47.6772 8.37264L49.8105 4.98898ZM48.2347 7.23681C43.6445 4.36604 38.2178 2.7071 32.4098 2.7071V6.7071C37.4461 6.7071 42.1409 8.14354 46.1137 10.6282L48.2347 7.23681ZM32.4098 2.7071C15.9058 2.7071 2.52663 16.0862 2.52663 32.5902H6.52663C6.52663 18.2954 18.1149 6.7071 32.4098 6.7071V2.7071ZM2.52663 32.5902C2.52663 49.0942 15.9058 62.4734 32.4098 62.4734V58.4734C18.1149 58.4734 6.52663 46.8851 6.52663 32.5902H2.52663ZM32.4098 62.4734C48.9138 62.4734 62.2929 49.0942 62.2929 32.5902H58.2929C58.2929 46.8851 46.7046 58.4734 32.4098 58.4734V62.4734ZM62.2929 32.5902C62.2929 28.576 61.5003 24.7419 60.0612 21.2396L56.3614 22.7599C57.6057 25.7882 58.2929 29.1065 58.2929 32.5902H62.2929ZM65 32.5C65 28.1008 64.1248 23.9009 62.5372 20.0688L58.8418 21.5998C60.2319 24.955 61 28.6353 61 32.5H65ZM59.8852 21.8876C59.6096 22.1189 59.0473 22.0959 58.8418 21.5998L62.5372 20.0688C61.6409 17.9054 58.9721 17.4322 57.314 18.8235L59.8852 21.8876ZM60.0612 21.2396C60.1384 21.4275 60.1091 21.6998 59.8852 21.8876L57.314 18.8235C56.1361 19.8118 55.8109 21.4201 56.3614 22.7599L60.0612 21.2396ZM47.5725 7.29886C47.794 7.11297 48.0642 7.13019 48.2347 7.23681L46.1137 10.6282C47.3376 11.3936 48.9704 11.3475 50.1436 10.363L47.5725 7.29886ZM47.6772 8.37264C47.2236 8.08668 47.2977 7.52938 47.5725 7.29886L50.1436 10.363C51.8084 8.96609 51.7991 6.24272 49.8105 4.98898L47.6772 8.37264Z"
          fill="url(#logoGradient)"
          mask="url(#path-2-outside-1)"
          animate={{
            fill: animate ? "url(#logoGradient)" : logoColors.primary,
          }}
          transition={transitionSettings}
        />

        {/* Círculo interior */}
        <mask
          id="path-4-outside-2"
          maskUnits="userSpaceOnUse"
          x="12.4527"
          y="12.4527"
          width="41"
          height="41"
          fill="black"
        >
          <rect fill="white" x="12.4527" y="12.4527" width="41" height="41" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M50.5473 32.5C50.5473 42.4673 42.4673 50.5473 32.5 50.5473C30.0838 50.5473 27.7785 50.0725 25.6724 49.2111C25.1655 49.0038 25.0821 48.3384 25.5016 47.9864V47.9864C25.7214 47.8019 26.0261 47.7592 26.2924 47.8663C28.1941 48.6313 30.2712 49.0523 32.4466 49.0523C41.5587 49.0523 48.9455 41.6655 48.9455 32.5534C48.9455 23.4413 41.5587 16.0545 32.4466 16.0545C23.3345 16.0545 15.9477 23.4413 15.9477 32.5534C15.9477 33.5777 16.041 34.5801 16.2197 35.5528C16.2705 35.8296 16.1738 36.1146 15.9581 36.2955V36.2955C15.5299 36.6548 14.8761 36.4444 14.7715 35.8952C14.5622 34.7956 14.4527 33.6606 14.4527 32.5C14.4527 22.5327 22.5327 14.4527 32.5 14.4527C42.4673 14.4527 50.5473 22.5327 50.5473 32.5Z"
          />
        </mask>

        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M50.5473 32.5C50.5473 42.4673 42.4673 50.5473 32.5 50.5473C30.0838 50.5473 27.7785 50.0725 25.6724 49.2111C25.1655 49.0038 25.0821 48.3384 25.5016 47.9864V47.9864C25.7214 47.8019 26.0261 47.7592 26.2924 47.8663C28.1941 48.6313 30.2712 49.0523 32.4466 49.0523C41.5587 49.0523 48.9455 41.6655 48.9455 32.5534C48.9455 23.4413 41.5587 16.0545 32.4466 16.0545C23.3345 16.0545 15.9477 23.4413 15.9477 32.5534C15.9477 33.5777 16.041 34.5801 16.2197 35.5528C16.2705 35.8296 16.1738 36.1146 15.9581 36.2955V36.2955C15.5299 36.6548 14.8761 36.4444 14.7715 35.8952C14.5622 34.7956 14.4527 33.6606 14.4527 32.5C14.4527 22.5327 22.5327 14.4527 32.5 14.4527C42.4673 14.4527 50.5473 22.5327 50.5473 32.5Z"
          fill="url(#logoGradient)"
          animate={{
            fill: animate ? "url(#logoGradient)" : logoColors.primary,
          }}
          transition={transitionSettings}
        />

        <motion.path
          d="M14.7715 35.8952L12.8068 36.2692L14.7715 35.8952ZM16.2197 35.5528L14.2526 35.9141L16.2197 35.5528ZM26.2924 47.8663L27.0388 46.0108L26.2924 47.8663ZM25.6724 49.2111L24.9153 51.0623L25.6724 49.2111ZM32.5 52.5473C43.5718 52.5473 52.5473 43.5718 52.5473 32.5H48.5473C48.5473 41.3627 41.3627 48.5473 32.5 48.5473V52.5473ZM24.9153 51.0623C27.2576 52.0203 29.8197 52.5473 32.5 52.5473V48.5473C30.3479 48.5473 28.2995 48.1248 26.4295 47.36L24.9153 51.0623ZM25.546 49.7218C27.681 50.5806 30.0111 51.0523 32.4466 51.0523V47.0523C30.5312 47.0523 28.7072 46.6819 27.0388 46.0108L25.546 49.7218ZM32.4466 51.0523C42.6633 51.0523 50.9455 42.7701 50.9455 32.5534H46.9455C46.9455 40.5609 40.4541 47.0523 32.4466 47.0523V51.0523ZM50.9455 32.5534C50.9455 22.3367 42.6633 14.0545 32.4466 14.0545V18.0545C40.4541 18.0545 46.9455 24.5459 46.9455 32.5534H50.9455ZM32.4466 14.0545C22.2299 14.0545 13.9477 22.3367 13.9477 32.5534H17.9477C17.9477 24.5459 24.4391 18.0545 32.4466 18.0545V14.0545ZM13.9477 32.5534C13.9477 33.6994 14.0522 34.8228 14.2526 35.9141L18.1868 35.1915C18.0299 34.3375 17.9477 33.4559 17.9477 32.5534H13.9477ZM12.4527 32.5C12.4527 33.7867 12.5741 35.0469 12.8068 36.2692L16.7363 35.5212C16.5503 34.5443 16.4527 33.5345 16.4527 32.5H12.4527ZM32.5 12.4527C21.4282 12.4527 12.4527 21.4282 12.4527 32.5H16.4527C16.4527 23.6373 23.6373 16.4527 32.5 16.4527V12.4527ZM52.5473 32.5C52.5473 21.4282 43.5718 12.4527 32.5 12.4527V16.4527C41.3627 16.4527 48.5473 23.6373 48.5473 32.5H52.5473ZM14.6726 34.7634C15.3256 34.2155 16.5337 34.4572 16.7363 35.5212L12.8068 36.2692C13.2184 38.4316 15.7342 39.0942 17.2437 37.8276L14.6726 34.7634ZM14.2526 35.9141C14.1791 35.5139 14.3134 35.0648 14.6726 34.7634L17.2437 37.8276C18.0342 37.1643 18.362 36.1454 18.1868 35.1915L14.2526 35.9141ZM26.7872 49.5184C26.417 49.829 25.9349 49.8782 25.546 49.7218L27.0388 46.0108C26.1174 45.6401 25.0258 45.7748 24.216 46.4543L26.7872 49.5184ZM26.4295 47.36C27.4164 47.7636 27.436 48.974 26.7872 49.5184L24.216 46.4543C22.7282 47.7027 22.9146 50.244 24.9153 51.0623L26.4295 47.36Z"
          fill="url(#logoGradient)"
          mask="url(#path-4-outside-2)"
          animate={{
            fill: animate ? "url(#logoGradient)" : logoColors.primary,
          }}
          transition={transitionSettings}
        />

        {/* Efecto de brillo (opcional) */}
        {animate && (
          <motion.circle
            cx="32.5"
            cy="32.5"
            r="32"
            fill="url(#logoGradient)"
            opacity="0"
            animate={{
              opacity: [0, 0.2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: speed === "slow" ? 5 : speed === "fast" ? 2 : 3,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.svg>
    </div>
  );
}

// También exportamos un componente con texto completo para usar en el navbar o headers
export function SustratoLogoWithText({
  className = "",
  size = 40,
  animate = true,
  speed = "normal",
  textClassName = "",
  variant = "horizontal",
}: {
  className?: string;
  size?: number;
  animate?: boolean;
  speed?: "slow" | "normal" | "fast";
  textClassName?: string;
  variant?: "horizontal" | "vertical";
}) {
  const { colorScheme, mode } = useTheme();
  const [textColors, setTextColors] = useState({
    primary: "#3D7DF6", // Blue theme primary default
    accent: "#8A4EF6", // Accent color (purple)
  });

  // Definición de colores por tema
  const themeColors = useMemo(() => ({
    blue: {
      primary: mode === "dark" ? "#2E5EB9" : "#3D7DF6",
      secondary: mode === "dark" ? "#1EA4E9" : "#516e99",
    },
    green: {
      primary: mode === "dark" ? "#1c8e63" : "#24BC81",
      secondary: mode === "dark" ? "#2CA18F" : "#3AD7BF",
    },
    orange: {
      primary: mode === "dark" ? "#B95413" : "#F77019",
      secondary: mode === "dark" ? "#6D2F0B" : "#913E0F",
    },
  }), [mode]);

  // Actualizar los colores cuando cambie el tema
  useEffect(() => {
    const currentTheme = (colorScheme as keyof typeof themeColors) || "blue";

    setTextColors({
      primary: themeColors[currentTheme].primary,
      accent: "#8A4EF6", // Mantener el acento púrpura
    });
  }, [colorScheme, mode, themeColors]);

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
      <SustratoLogoReactive size={size} animate={animate} speed={speed} />

      <div
        className={`${
          variant === "vertical" ? "mt-2 text-center" : "ml-3"
        } ${textClassName}`}
      >
        <div className={`font-bold ${getTextSize()}`}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              background: `-webkit-linear-gradient(left, ${textColors.primary}, ${textColors.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Chau Philomene One', sans-serif",
            }}
          >
            Sustrato.ai
          </motion.span>
        </div>

        {variant === "horizontal" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`${getSubtextSize()} text-neutral-500 dark:text-neutral-400 ml-0.5 mt-0.5 italic`}
          >
            cultivando sinergias humano·AI
          </motion.div>
        )}

        {variant === "vertical" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`${getSubtextSize()} text-neutral-500 dark:text-neutral-400 italic`}
          >
            cultivando sinergias humano·AI
          </motion.div>
        )}
      </div>
    </div>
  );
}
