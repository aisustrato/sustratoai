"use client"

import { useTheme } from "@/app/theme-provider"
import { useEffect, useState } from "react"

export function ThemeDebugger() {
  const { colorScheme, mode, setColorScheme, setMode } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [themeState, setThemeState] = useState<string>(`Theme: ${colorScheme}, Mode: ${mode}`)

  useEffect(() => {
    try {
      setThemeState(`Theme: ${colorScheme}, Mode: ${mode}`)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [colorScheme, mode])

  const handleThemeChange = (newTheme: "blue" | "green" | "orange") => {
    try {
      setColorScheme(newTheme)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleModeChange = (newMode: "light" | "dark") => {
    try {
      setMode(newMode)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Theme Debugger</h3>
      <p className="mb-2">{themeState}</p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">{error}</div>}

      <div className="flex gap-2 mb-2">
        <button onClick={() => handleThemeChange("blue")} className="px-3 py-1 bg-blue-500 text-white rounded">
          Blue
        </button>
        <button onClick={() => handleThemeChange("green")} className="px-3 py-1 bg-green-500 text-white rounded">
          Green
        </button>
        <button onClick={() => handleThemeChange("orange")} className="px-3 py-1 bg-orange-500 text-white rounded">
          Orange
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => handleModeChange("light")} className="px-3 py-1 bg-gray-200 text-gray-800 rounded">
          Light
        </button>
        <button onClick={() => handleModeChange("dark")} className="px-3 py-1 bg-gray-800 text-white rounded">
          Dark
        </button>
      </div>
    </div>
  )
}
