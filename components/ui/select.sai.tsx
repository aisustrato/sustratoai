"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
  icon?: React.ReactNode
}

export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  options: SelectOption[]
  value?: string | string[]
  defaultValue?: string | string[]
  onChange?: (value: string | string[]) => void
  variant?: "default" | "error" | "success" | "editing" | "readonly"
  error?: string
  hint?: string
  label?: string
  placeholder?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  clearable?: boolean
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  fullWidth?: boolean
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      className,
      variant = "default",
      error,
      hint,
      label,
      placeholder = "Seleccione una opción",
      leadingIcon,
      trailingIcon,
      clearable = false,
      multiple = false,
      onChange,
      value,
      defaultValue,
      disabled = false,
      required = false,
      name,
      id,
      fullWidth = true,
      ...props
    },
    ref,
  ) => {
    // Referencias y estados
    const [isOpen, setIsOpen] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const selectRef = React.useRef<HTMLDivElement>(null)
    const optionsRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Inicializa el estado para valores múltiples o único
    const [selectedValues, setSelectedValues] = React.useState<string[]>(() => {
      if (value !== undefined) {
        return Array.isArray(value) ? value : value ? [value] : []
      }
      if (defaultValue !== undefined) {
        return Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
      }
      return []
    })

    // Sincroniza el estado interno con las props externas
    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValues(Array.isArray(value) ? value : value ? [value] : [])
      }
    }, [value])

    // Encuentra las opciones seleccionadas para mostrar sus etiquetas
    const selectedOptions = options.filter((option) => selectedValues.includes(option.value))

    // Maneja el clic en una opción
    const handleOptionClick = (optionValue: string) => {
      if (disabled || variant === "readonly") return

      let newValues: string[]

      if (multiple) {
        // Para selección múltiple, toggle el valor
        newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue]
      } else {
        // Para selección única, reemplaza el valor
        newValues = [optionValue]
        setIsOpen(false)
      }

      setSelectedValues(newValues)

      // Notifica el cambio
      if (multiple) {
        onChange?.(newValues)
      } else {
        onChange?.(optionValue)
      }

      // Actualiza el valor del input oculto para integración con formularios
      if (inputRef.current) {
        inputRef.current.value = multiple ? newValues.join(",") : newValues[0] || ""
        const event = new Event("change", { bubbles: true })
        inputRef.current.dispatchEvent(event)
      }
    }

    // Maneja la limpieza del valor
    const handleClear = (e: React.MouseEvent, valueToRemove?: string) => {
      if (disabled || variant === "readonly") return

      e.preventDefault()
      e.stopPropagation()

      let newValues: string[]

      if (valueToRemove && multiple) {
        // Elimina solo un valor específico en modo múltiple
        newValues = selectedValues.filter((v) => v !== valueToRemove)
      } else {
        // Limpia todos los valores
        newValues = []
      }

      setSelectedValues(newValues)

      // Notifica el cambio
      if (multiple) {
        onChange?.(newValues)
      } else {
        onChange?.("")
      }

      // Actualiza el valor del input oculto
      if (inputRef.current) {
        inputRef.current.value = multiple ? newValues.join(",") : ""
        const event = new Event("change", { bubbles: true })
        inputRef.current.dispatchEvent(event)
      }
    }

    // Cierra el dropdown cuando se hace clic fuera
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          selectRef.current &&
          !selectRef.current.contains(event.target as Node) &&
          optionsRef.current &&
          !optionsRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    // Maneja la navegación con teclado
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled || variant === "readonly") return

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault()
          setIsOpen(!isOpen)
          break
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          break
        case "ArrowDown":
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else if (!multiple) {
            // Navegar a la siguiente opción (solo en modo único)
            const currentIndex =
              selectedValues.length > 0 ? options.findIndex((opt) => opt.value === selectedValues[0]) : -1
            const nextIndex = (currentIndex + 1) % options.length
            const nextOption = options[nextIndex]
            if (nextOption && !nextOption.disabled) {
              handleOptionClick(nextOption.value)
            }
          }
          break
        case "ArrowUp":
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else if (!multiple) {
            // Navegar a la opción anterior (solo en modo único)
            const currentIndex =
              selectedValues.length > 0 ? options.findIndex((opt) => opt.value === selectedValues[0]) : options.length
            const prevIndex = (currentIndex - 1 + options.length) % options.length
            const prevOption = options[prevIndex]
            if (prevOption && !prevOption.disabled) {
              handleOptionClick(prevOption.value)
            }
          }
          break
      }
    }

    // Variantes de animación para el dropdown
    const dropdownVariants = {
      hidden: {
        opacity: 0,
        y: -5,
        scale: 0.98,
        transition: {
          duration: 0.15,
          ease: "easeInOut",
        },
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.2,
          ease: "easeOut",
        },
      },
    }

    // Variantes de animación para las opciones (efecto cascada)
    const optionVariants = {
      hidden: { opacity: 0, y: -5 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.03,
          duration: 0.2,
          ease: "easeOut",
        },
      }),
    }

    return (
      <div className={cn("relative", fullWidth ? "w-full" : "w-auto", className)} ref={ref} {...props}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block text-sm font-medium mb-1.5",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive",
              variant === "error" && "text-destructive",
              disabled && "opacity-70",
              isFocused && "text-primary",
            )}
          >
            {label}
          </label>
        )}

        {/* Select container */}
        <div
          ref={selectRef}
          className={cn(
            "relative rounded-md border border-[#d0d5dd] shadow-sm transition-all duration-200",
            "shadow-[0_0_0_1px_rgba(176,190,217,0.2),0_1px_2px_rgba(176,190,217,0.2)]",
            {
              "bg-background": variant === "default" && !disabled,
              "bg-muted cursor-not-allowed": disabled,
              "bg-muted pointer-events-none": variant === "readonly",
              "border-red-500 shadow-[0_0_0_1px_rgba(220,38,38,0.2),0_1px_2px_rgba(220,38,38,0.2)]":
                variant === "error",
              "border-green-500 ring-green-500/20": variant === "success",
              "bg-accent/5": variant === "editing",
              "border-primary ring-4 ring-primary/20": isFocused,
              "hover:border-input/80": !isFocused && variant !== "editing" && variant !== "error",
            },
          )}
          tabIndex={disabled || variant === "readonly" ? -1 : 0}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClick={() => {
            if (!disabled && variant !== "readonly") {
              setIsOpen(!isOpen)
            }
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled || variant === "readonly"}
          role="combobox"
        >
          {/* Select display */}
          <div className={cn("flex items-center min-h-10 w-full px-3 py-2 text-sm", leadingIcon && "pl-9")}>
            {/* Leading icon */}
            {leadingIcon && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                {leadingIcon}
              </div>
            )}

            {/* Selected values or placeholder */}
            <div className="flex-1 flex flex-wrap gap-1 items-center">
              {selectedOptions.length > 0 ? (
                multiple ? (
                  // Mostrar múltiples valores como chips
                  selectedOptions.map((option) => (
                    <div
                      key={option.value}
                      className="bg-muted rounded-md px-2 py-0.5 flex items-center gap-1 max-w-[calc(100%-8px)]"
                    >
                      {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                      {clearable && (
                        <X
                          className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                          onClick={(e) => handleClear(e, option.value)}
                          aria-label={`Remove ${option.label}`}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  // Mostrar un solo valor
                  <div className="flex items-center gap-2 max-w-full">
                    {selectedOptions[0].icon && <span className="flex-shrink-0">{selectedOptions[0].icon}</span>}
                    <span className="truncate">{selectedOptions[0].label}</span>
                    {clearable && selectedOptions.length > 0 && (
                      <X
                        className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0 ml-1"
                        onClick={handleClear}
                        aria-label="Clear selection"
                      />
                    )}
                  </div>
                )
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>

            {/* Dropdown button with animation */}
            <div
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded",
                "bg-primary/10 text-primary/70",
              )}
            >
              <AnimatePresence initial={false} mode="wait">
                {isOpen ? (
                  <motion.div
                    key="up"
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="down"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hidden input for form integration */}
          <input
            ref={inputRef}
            type="hidden"
            name={name}
            id={id}
            value={multiple ? selectedValues.join(",") : selectedValues[0] || ""}
            required={required}
            disabled={disabled}
            aria-hidden="true"
          />
        </div>

        {/* Dropdown options with animation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={optionsRef}
              className="absolute z-50 mt-1 w-full bg-popover rounded-md border border-border shadow-md max-h-60 overflow-auto"
              role="listbox"
              aria-multiselectable={multiple}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dropdownVariants}
            >
              <div className="py-1">
                {options.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <motion.div
                      key={option.value}
                      custom={index}
                      variants={optionVariants}
                      className={cn(
                        "px-3 py-2 text-sm flex items-center cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/30",
                        option.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                      )}
                      onClick={() => !option.disabled && handleOptionClick(option.value)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                    >
                      <div className="flex-1 flex items-center">
                        {option.icon && <span className="mr-2 flex items-center">{option.icon}</span>}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {variant === "error" && error && <p className="text-sm font-medium text-destructive mt-1.5">{error}</p>}

        {/* Hint text */}
        {hint && !(variant === "error" && error) && <p className="text-sm text-muted-foreground mt-1.5">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = "Select"

export { Select }
