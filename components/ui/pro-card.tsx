"use client"

import type React from "react"
import { forwardRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/app/theme-provider"
import type { ProCardVariant } from "@/lib/theme/ColorToken"
import { generateProCardTokens } from "@/lib/theme/components/pro-card-tokens"
import { Text } from "@/components/ui/text"
import type { FontPairType, TextProps } from "@/components/ui/text"
import { motion, AnimatePresence, type HTMLMotionProps, type Variants, type Transition } from "framer-motion" // AnimatePresence
import { Check, Square } from "lucide-react"

export type ProCardBorderStyle = "none" | "normal" | "top" | "left"

export interface ProCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  variant?: ProCardVariant
  border?: ProCardBorderStyle
  borderVariant?: ProCardVariant
  selected?: boolean
  loading?: boolean
  inactive?: boolean // Nuevo prop para estado inactivo
  className?: string
  children?: React.ReactNode
  noPadding?: boolean
  shadow?: "none" | "sm" | "md" | "lg" | "xl"
  disableShadowHover?: boolean
  animateEntrance?: boolean
  showSelectionCheckbox?: boolean
  onSelectionChange?: (selected: boolean) => void
  customTransition?: Transition
}

// --- Interfaces de Subcomponentes ---
interface ProCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}
interface ProCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
  children?: React.ReactNode
  variant?: TextProps["variant"]
  size?: TextProps["size"]
  color?: TextProps["color"]
  colorVariant?: TextProps["colorVariant"]
  gradient?: TextProps["gradient"]
  fontType?: FontPairType
  weight?: TextProps["weight"]
}
interface ProCardSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string
  children?: React.ReactNode
  variant?: TextProps["variant"]
  size?: TextProps["size"]
  color?: TextProps["color"]
  colorVariant?: TextProps["colorVariant"]
  gradient?: TextProps["gradient"]
  fontType?: FontPairType
  weight?: TextProps["weight"]
}
interface ProCardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}
interface ProCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}
interface ProCardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}
interface ProCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}
// --- Fin Interfaces de Subcomponentes ---

const cardEntranceVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]  // Curva de easing más pronunciada
    }
  },
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const ProCard = forwardRef<HTMLDivElement, ProCardProps>(
  (
    {
      variant = "primary",
      border = "none",
      borderVariant,
      selected = false,
      loading = false,
      inactive = false, // Valor por defecto para inactive
      className,
      children,
      noPadding = false,
      shadow = "md",
      disableShadowHover = false,
      animateEntrance = true,
      showSelectionCheckbox = false,
      onSelectionChange,
      customTransition,
      ...htmlProps
    },
    ref,
  ) => {
    const actualBorderVariant = borderVariant || variant
    const { appColorTokens, mode } = useTheme()

    const proCardComponentTokens = useMemo(() => {
      return appColorTokens ? generateProCardTokens(appColorTokens, mode) : null
    }, [appColorTokens, mode])
    const hasTokens = !!proCardComponentTokens
    const paddingClasses = noPadding ? "" : "p-4"

    const getShadowClasses = () => {
      if (shadow === "none") return "shadow-none"
      const shadowMap = {
        sm: { base: "shadow-sm", hover: "hover:shadow-md" },
        md: { base: "shadow-md", hover: "hover:shadow-lg" },
        lg: { base: "shadow-lg", hover: "hover:shadow-xl" },
        xl: { base: "shadow-xl", hover: "hover:shadow-2xl" },
      }
      const selectedShadowConfig = shadowMap[shadow as keyof typeof shadowMap] || shadowMap.md
      const hoverClass = !disableShadowHover && !inactive && !loading ? selectedShadowConfig.hover : "" // No hover si inactiva o cargando
      return cn(selectedShadowConfig.base, hoverClass)
    }

    const shadowClassesToApply = getShadowClasses()
    // loadingClass se aplicará al MotionDiv para que el pulse afecte a toda la tarjeta
    const conditionalLoadingClass = loading ? "animate-pulse" : ""

    const borderStyleProps = useMemo<React.CSSProperties>(() => {
      let borderColor = "transparent"
      let borderWidth = "0px"
      let borderStyle: React.CSSProperties["borderStyle"] = "none"
      if (selected && !inactive) {
        // El borde seleccionado no se muestra si está inactivo
        borderColor = (hasTokens && proCardComponentTokens?.selected?.[actualBorderVariant]) || "HighlightText"
        borderWidth = "2px"
        borderStyle = "solid"
      } else if (border === "normal") {
        borderColor = (hasTokens && proCardComponentTokens?.border?.[actualBorderVariant]) || "transparent"
        borderWidth = "1px"
        borderStyle = "solid"
      }
      return { borderColor, borderWidth, borderStyle }
    }, [selected, border, actualBorderVariant, hasTokens, proCardComponentTokens, inactive])

    // Esqueleto de carga con colores más contrastantes para el pulso
    const loadingInnerContent = (
      <div className={cn("flex flex-col gap-3", noPadding ? "" : "p-4")}>
        {" "}
        {/* Aumentado gap */}
        <div className="h-5 w-3/4 rounded bg-slate-300 dark:bg-slate-700 opacity-75"></div>{" "}
        {/* Colores más definidos */}
        <div className="h-5 w-1/2 rounded bg-slate-300 dark:bg-slate-700 opacity-75"></div>
        <div className="h-5 w-5/6 rounded bg-slate-300 dark:bg-slate-700 opacity-75"></div>
      </div>
    )

    const defaultGradient = "linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)"
    const defaultBorderGradient = "linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 100%)"

    const motionDivBackgroundStyle = {
      background:
        hasTokens && proCardComponentTokens ? proCardComponentTokens.backgroundGradient[variant] : defaultGradient,
    }

    const MotionDiv = motion.div

    const renderInnerContent = (isWrapped: boolean) => (
      <div className={cn(paddingClasses)} style={{ ...(isWrapped && border === "left" && { marginLeft: "0.5rem" }) }}>
        {showSelectionCheckbox && onSelectionChange && (
          <motion.button
            type="button"
            disabled={inactive || loading} // Deshabilitar checkbox si está inactivo o cargando
            onClick={(e) => {
              e.stopPropagation()
              onSelectionChange(!selected)
            }}
            className={cn(
              "absolute top-3 right-3 z-30 p-0.5 bg-white/30 dark:bg-gray-900/30 rounded hover:bg-white/50 dark:hover:bg-gray-900/50 transition-colors",
              (inactive || loading) && "opacity-50 cursor-not-allowed",
            )}
            whileTap={{ scale: inactive || loading ? 1 : 0.9 }}
            aria-pressed={selected}
            aria-label={selected ? "Deseleccionar tarjeta" : "Seleccionar tarjeta"}
          >
            {selected ? (
              <Check size={18} className="text-primary" />
            ) : (
              <Square size={18} className="text-gray-400 dark:text-gray-500" />
            )}
          </motion.button>
        )}
        {loading && !inactive ? loadingInnerContent : children}{" "}
        {/* Mostrar loading solo si no está explícitamente inactiva */}
      </div>
    )

    const defaultCardTransition: Transition = { 
  duration: 0.4, 
  ease: [0.16, 1, 0.3, 1],
  scale: {
    type: "spring",
    damping: 15,
    stiffness: 300
  },
  y: { 
    type: "spring", 
    damping: 15, 
    stiffness: 300 
  }
}
    const finalTransition: Transition = customTransition
      ? { ...defaultCardTransition, ...customTransition }
      : defaultCardTransition

    const showInactiveOverlay = inactive && !loading // No mostrar overlay si está cargando

    const motionRootProps: HTMLMotionProps<"div"> = {
      ref: ref,
      className: cn(
        "relative rounded-lg",
        shadowClassesToApply,
        conditionalLoadingClass, // Clase de pulso aquí
        inactive && "cursor-not-allowed", // Cursor para toda la tarjeta inactiva
        className,
      ),
      style: {
        ...motionDivBackgroundStyle,
        ...borderStyleProps,
      },
      transition: finalTransition,
      ...(htmlProps || {}), // Asegurar que htmlProps no sea undefined al hacer spread
      // Prevenir clicks en la tarjeta si está inactiva
      ...(inactive && { onClickCapture: (e: React.MouseEvent) => e.stopPropagation(), tabIndex: -1 }),
    }

    if (animateEntrance && !loading) {
      // No animar entrada si está cargando inicialmente
      motionRootProps.variants = cardEntranceVariants
      motionRootProps.initial = "hidden"
      motionRootProps.animate = "visible"
    }

    const finalClassName = motionRootProps.className // Guardar antes de borrar
    delete motionRootProps.className // className se pasa dentro del cn() del MotionDiv

    if (border === "top" || border === "left") {
      return (
        <MotionDiv className={finalClassName} {...motionRootProps}>
          {border === "top" && (
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg z-10" // AJUSTE: h-1 a h-2
              style={{
                backgroundImage:
                  hasTokens && proCardComponentTokens
                    ? proCardComponentTokens.borderGradientTop[actualBorderVariant]
                    : defaultBorderGradient,
              }}
            />
          )}
          {border === "left" && (
            <div
              className="absolute top-0 left-0 bottom-0 w-2 rounded-l-lg z-10"
              style={{
                backgroundImage:
                  hasTokens && proCardComponentTokens
                    ? proCardComponentTokens.borderGradientLeft[actualBorderVariant]
                    : defaultBorderGradient,
              }}
            />
          )}
          {renderInnerContent(true)}
          <AnimatePresence>
            {showInactiveOverlay && (
              <motion.div
                key="inactive-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute inset-0 z-20 bg-white/60 dark:bg-neutral-800/70 backdrop-blur-sm rounded-lg" // Asegurar redondeo
                style={{ pointerEvents: "all" }} // Bloquear eventos
              />
            )}
          </AnimatePresence>
        </MotionDiv>
      )
    }

    return (
      <MotionDiv className={finalClassName} {...motionRootProps}>
        {renderInnerContent(false)}
        <AnimatePresence>
          {showInactiveOverlay && (
            <motion.div
              key="inactive-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 z-20 bg-white/60 dark:bg-neutral-800/70 backdrop-blur-sm rounded-lg"
              style={{ pointerEvents: "all" }}
            />
          )}
        </AnimatePresence>
      </MotionDiv>
    )
  },
)

ProCard.displayName = "ProCard"

// --- Subcomponentes (Completos) ---
const Header = forwardRef<HTMLDivElement, ProCardHeaderProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4", className)} {...props}>
    {children}
  </div>
))
const Title = forwardRef<HTMLHeadingElement, ProCardTitleProps>(
  (
    {
      children,
      className,
      variant = "heading" as TextProps["variant"],
      size = "xl" as TextProps["size"],
      color,
      colorVariant,
      gradient,
      fontType,
      weight,
      ...props
    },
    ref,
  ) => (
    <div ref={ref} {...props}>
      <Text
        variant={variant}
        size={size}
        color={color}
        colorVariant={colorVariant}
        gradient={gradient}
        fontType={fontType}
        weight={weight}
        className={className}
      >
        {children}
      </Text>
    </div>
  ),
)
const Subtitle = forwardRef<HTMLParagraphElement, ProCardSubtitleProps>(
  (
    {
      children,
      className,
      variant = "default" as TextProps["variant"],
      size = "sm" as TextProps["size"],
      color = "neutral" as TextProps["color"],
      colorVariant = "muted" as TextProps["colorVariant"],
      gradient,
      fontType,
      weight,
      ...props
    },
    ref,
  ) => (
    <div ref={ref} {...props}>
      <Text
        variant={variant}
        size={size}
        color={color}
        colorVariant={colorVariant}
        gradient={gradient}
        fontType={fontType}
        weight={weight}
        className={className}
      >
        {children}
      </Text>
    </div>
  ),
)
const Media = forwardRef<HTMLDivElement, ProCardMediaProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4", className)} {...props}>
    {children}
  </div>
))
const Content = forwardRef<HTMLDivElement, ProCardContentProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4", className)} {...props}>
    {children}
  </div>
))
const Actions = forwardRef<HTMLDivElement, ProCardActionsProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mt-4", className)} {...props}>
    {children}
  </div>
))
const Footer = forwardRef<HTMLDivElement, ProCardFooterProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mt-4", className)} {...props}>
    {children}
  </div>
))
// --- Fin Subcomponentes ---

Header.displayName = "ProCard.Header"
Title.displayName = "ProCard.Title"
Subtitle.displayName = "ProCard.Subtitle"
Media.displayName = "ProCard.Media"
Content.displayName = "ProCard.Content"
Actions.displayName = "ProCard.Actions"
Footer.displayName = "ProCard.Footer"

interface ProCardComponent extends React.ForwardRefExoticComponent<ProCardProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof Header
  Title: typeof Title
  Subtitle: typeof Subtitle
  Media: typeof Media
  Content: typeof Content
  Actions: typeof Actions
  Footer: typeof Footer
}

const ProCardWithSubcomponents = ProCard as ProCardComponent
ProCardWithSubcomponents.Header = Header
ProCardWithSubcomponents.Title = Title
ProCardWithSubcomponents.Subtitle = Subtitle
ProCardWithSubcomponents.Media = Media
ProCardWithSubcomponents.Content = Content
ProCardWithSubcomponents.Actions = Actions
ProCardWithSubcomponents.Footer = Footer

export { ProCardWithSubcomponents as ProCard }
