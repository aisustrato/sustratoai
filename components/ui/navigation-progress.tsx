"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"

export function NavigationProgress() {
  // Estados para controlar la barra de progreso
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Referencias para manejar timers y estado de navegación
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isNavigatingRef = useRef(false)
  const navigationStartTimeRef = useRef(0)

  // Hooks de Next.js para detectar cambios de URL
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Referencia para almacenar la última URL para comparaciones
  const lastUrlRef = useRef("")

  // Efecto para manejar el montaje del componente
  useEffect(() => {
    setMounted(true)

    // Limpiar al desmontar
    return () => {
      setMounted(false)
      cleanupAllTimers()
    }
  }, [])

  // CAPA 1: Detección de clics en enlaces para activación inmediata
  useEffect(() => {
    if (!mounted) return

    function handleLinkClick(e: MouseEvent) {
      // Solo procesar si el clic fue en un enlace
      const target = e.target as HTMLElement
      const link = target.closest("a")
      if (!link) return

      // Verificar si es un enlace interno (mismo origen)
      try {
        const url = new URL(link.href, window.location.origin)
        const isInternal = url.origin === window.location.origin
        if (!isInternal) return

        // Verificar si es una navegación a una ruta diferente
        const linkPathname = url.pathname
        const linkSearch = url.search
        const currentPathname = window.location.pathname
        const currentSearch = window.location.search

        if (linkPathname === currentPathname && linkSearch === currentSearch) return

        // Si ya hay una navegación en progreso, no iniciar otra
        if (isNavigatingRef.current) return

        // Activar la barra de progreso inmediatamente
        startLoading()
        isNavigatingRef.current = true
        navigationStartTimeRef.current = Date.now()
      } catch (error) {
        // Si hay un error al parsear la URL, ignoramos
        console.error("Error parsing URL:", error)
      }
    }

    // Añadir un solo listener a nivel de documento (eficiente)
    document.addEventListener("click", handleLinkClick)

    return () => {
      document.removeEventListener("click", handleLinkClick)
    }
  }, [mounted])

  // CAPA 2: Observación de cambios de URL como respaldo (simplificada)
  useEffect(() => {
    if (!mounted) return

    const currentUrl = `${pathname}${searchParams ? `?${searchParams}` : ""}`

    // Si la URL ha cambiado
    if (currentUrl !== lastUrlRef.current) {
      // Si no hay una navegación en progreso, iniciar una (para navegaciones programáticas)
      if (!isNavigatingRef.current) {
        startLoading()
        isNavigatingRef.current = true
        navigationStartTimeRef.current = Date.now()
      }
      // Si hay una navegación en progreso y la URL cambió, significa que la página está cargando
      else {
        // Registrar que la URL ha cambiado
        handleNavigationProgress()
      }

      // Actualizar la referencia de la última URL
      lastUrlRef.current = currentUrl
    }
  }, [pathname, searchParams, mounted])

  // CAPA 3: Detección de finalización de carga mejorada
  useEffect(() => {
    if (!mounted || !isNavigatingRef.current) return

    // Función para manejar la carga completa de la página
    const handleLoad = () => {
      if (isNavigatingRef.current) {
        // Asegurar que la barra haya estado visible por al menos 500ms para evitar parpadeos
        const timeElapsed = Date.now() - navigationStartTimeRef.current
        const minDisplayTime = 500 // ms

        if (timeElapsed >= minDisplayTime) {
          completeLoading()
        } else {
          const remainingTime = minDisplayTime - timeElapsed
          setTimeout(completeLoading, remainingTime)
        }
      }
    }

    // Usar múltiples eventos para mayor fiabilidad
    window.addEventListener("load", handleLoad)

    // Usar requestAnimationFrame para detectar cuando el DOM se ha actualizado
    let frameCount = 0
    function checkFrames() {
      frameCount++
      if (frameCount >= 2) {
        // Esperar a que pasen al menos 2 frames
        handleLoad()
      } else {
        requestAnimationFrame(checkFrames)
      }
    }
    requestAnimationFrame(checkFrames)

    return () => {
      window.removeEventListener("load", handleLoad)
    }
  }, [pathname, searchParams, mounted])

  // Función para manejar el progreso de la navegación
  function handleNavigationProgress() {
    // Asegurar que la barra esté visible
    setIsLoading(true)

    // Avanzar el progreso si está por debajo del 90%
    setProgress((prev) => Math.min(prev + 10, 90))
  }

  // Función para iniciar la animación de carga
  function startLoading() {
    // Limpiar cualquier animación previa
    cleanupAllTimers()

    // Iniciar nueva animación
    setIsLoading(true)
    setProgress(0)

    // Simular progreso con incrementos
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Incrementos más rápidos al inicio, más lentos al final
        const increment = prev < 30 ? 10 : prev < 60 ? 5 : prev < 80 ? 2 : 1
        return Math.min(prev + increment, 90)
      })
    }, 150)

    // Timeout de seguridad para forzar la finalización después de un tiempo máximo
    safetyTimeoutRef.current = setTimeout(() => {
      if (isNavigatingRef.current) {
        completeLoading()
      }
    }, 8000) // 8 segundos como máximo
  }

  // Función para completar la animación de carga
  function completeLoading() {
    // Limpiar todos los timers
    cleanupAllTimers()

    // Completar la barra al 100%
    setProgress(100)

    // Mantener visible brevemente antes de ocultar
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
      isNavigatingRef.current = false
    }, 300)
  }

  // Función para limpiar todos los timers
  function cleanupAllTimers() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }
  }

  // No renderizar nada en el servidor
  if (!mounted) {
    return null
  }

  // Renderizar la barra de progreso mediante portal
  return createPortal(
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1.5">
          <div
            className="h-full bg-primary shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-all ease-out duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>,
    document.body,
  )
}
