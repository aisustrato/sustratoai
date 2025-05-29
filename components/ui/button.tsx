"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Importar el hook useRipple
import { useRipple } from "@/components/ripple/RippleProvider"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium relative overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[hsl(var(--ui-icon-secondary))] to-[hsl(var(--ui-icon-primary))] text-primary-foreground hover:from-[hsl(var(--ui-icon-primary))] hover:to-[hsl(var(--ui-icon-accent))] hover:-translate-y-[1px] active:translate-y-0",
        destructive:
          "button-destructive-gradient text-destructive-foreground hover:button-destructive-gradient-hover hover:-translate-y-[1px] active:translate-y-0",
        outline:
          "border border-[hsl(var(--ui-icon-primary))] bg-background text-[hsl(var(--ui-icon-primary))] hover:bg-gradient-to-br hover:from-[hsl(var(--ui-icon-primary)/0.95)] hover:to-[hsl(var(--ui-icon-primary))] hover:text-white hover:-translate-y-[1px] active:translate-y-0",
        secondary:
          "bg-gradient-to-br from-[hsl(var(--secondary)/0.85)] to-[hsl(var(--secondary))] text-secondary-foreground hover:from-[hsl(var(--secondary)/0.75)] hover:to-[hsl(var(--secondary)/0.9)] hover:-translate-y-[1px] active:translate-y-0",
        ghost:
          "text-[hsl(var(--ui-icon-primary))] shadow-none hover:bg-gradient-to-br hover:from-[hsl(var(--ui-icon-primary)/0.08)] hover:to-[hsl(var(--ui-icon-primary)/0.12)] hover:text-[hsl(var(--ui-icon-primary))]",
        link: "text-[hsl(var(--ui-icon-primary))] underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

// Modificar el componente Button para usar el ripple
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [isPressed, setIsPressed] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    // Comentamos el flashRef ya que usaremos el ripple global
    // const flashRef = React.useRef<HTMLDivElement>(null)

    // Añadir el hook useRipple
    const ripple = useRipple()

    // Use useImperativeHandle to expose the button ref
    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement, [])

    // Manejar el efecto ripple
    const handlePress = React.useCallback(
      (ev: React.MouseEvent<HTMLButtonElement>) => {
        if (props.disabled) return

        setIsPressed(true)

        // Disparar el efecto ripple con el color adecuado según la variante
        ripple(ev.nativeEvent, variant === "destructive" ? "hsl(var(--destructive))" : undefined)

        // Comentamos el código del flash anterior
        /*
      // Crear y añadir el flash
      if (flashRef.current) {
        // Reiniciar la animación
        flashRef.current.classList.remove("animate-button-flash")

        // Forzar un reflow para que la animación se reinicie
        void flashRef.current.offsetWidth

        // Iniciar la animación
        flashRef.current.classList.add("animate-button-flash")
      }
      */
      },
      [props.disabled, ripple, variant],
    )

    return (
      <div className="relative inline-block">
        {/* Botón principal */}
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={buttonRef}
          onMouseDown={handlePress}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          style={{
            transform: isPressed ? "scale(0.95) translateY(2px)" : "",
            transition: "transform 0.2s",
          }}
          {...props}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>{children}</span>
              </>
            ) : (
              children
            )}
          </span>
        </Comp>

        {/* Comentamos el efecto de flash anterior ya que ahora usamos el ripple global */}
        {/*
        <div
          ref={flashRef}
          className={cn(
            "absolute inset-0 pointer-events-none z-20 rounded-md opacity-0",
            variant === "default" || variant === "secondary"
              ? "bg-white"
              : variant === "destructive"
                ? "bg-white"
                : "bg-[hsl(var(--ui-icon-primary))]",
          )}
        />
        */}
      </div>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
