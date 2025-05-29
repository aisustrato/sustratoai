"use client"
import { useTheme } from "@/app/theme-provider"
import { CustomButton } from "@/components/ui/custom-button"
import { Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRipple } from "@/components/ripple/RippleProvider"

export function ThemeSelector() {
  const { colorScheme, setColorScheme } = useTheme()
  const ripple = useRipple()

  // Constantes para el ripple
  const RIPPLE_COLOR = "hsl(var(--accent) / 0.3)"
  const RIPPLE_SCALE = 8

  return (
    <Popover>
      <PopoverTrigger asChild>
        <CustomButton
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Seleccionar esquema de color"
          onMouseDown={(e) => ripple(e.nativeEvent, RIPPLE_COLOR, RIPPLE_SCALE)}
        >
          <Palette
            className={cn("h-[18px] w-[18px]", {
              "text-blue-600": colorScheme === "blue",
              "text-green-600": colorScheme === "green",
              "text-orange-500": colorScheme === "orange",
            })}
          />
        </CustomButton>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2">
        <div className="grid gap-1">
          <CustomButton
            variant="ghost"
            className="flex items-center justify-between px-2 py-1.5 w-full"
            onClick={() => setColorScheme("blue")}
            onMouseDown={(e) => ripple(e.nativeEvent, RIPPLE_COLOR, RIPPLE_SCALE)}
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-600" />
              <span>Azul</span>
            </div>
            {colorScheme === "blue" && <Check className="h-4 w-4" />}
          </CustomButton>
          <CustomButton
            variant="ghost"
            className="flex items-center justify-between px-2 py-1.5 w-full"
            onClick={() => setColorScheme("green")}
            onMouseDown={(e) => ripple(e.nativeEvent, RIPPLE_COLOR, RIPPLE_SCALE)}
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-600" />
              <span>Verde</span>
            </div>
            {colorScheme === "green" && <Check className="h-4 w-4" />}
          </CustomButton>
          <CustomButton
            variant="ghost"
            className="flex items-center justify-between px-2 py-1.5 w-full"
            onClick={() => setColorScheme("orange")}
            onMouseDown={(e) => ripple(e.nativeEvent, RIPPLE_COLOR, RIPPLE_SCALE)}
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-orange-500" />
              <span>Naranja</span>
            </div>
            {colorScheme === "orange" && <Check className="h-4 w-4" />}
          </CustomButton>
        </div>
      </PopoverContent>
    </Popover>
  )
}
