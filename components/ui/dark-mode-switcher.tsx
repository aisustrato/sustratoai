"use client";

import { useTheme } from "@/app/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

export function DarkModeSwitcher() {
  const { mode, setMode } = useTheme();
  const [forceUpdate, setForceUpdate] = useState({});
  
  // Efecto para forzar actualización cuando cambia el tema
  useEffect(() => {
    setForceUpdate({});
  }, [mode]);
  
  // Función para alternar entre modo claro y oscuro
  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    
    // Forzar re-renderizado
    setTimeout(() => {
      setForceUpdate({});
    }, 0);
  };
  
  return (
    <div className="flex items-center gap-1">
      <Icon size="xs" color="neutral" colorVariant="pure">
        <Sun className="h-3 w-3" />
      </Icon>
      <motion.div whileTap={{ scale: 0.95 }}>
        <Switch
          checked={mode === "dark"}
          onCheckedChange={toggleMode}
          className="scale-75 origin-center"
          aria-label={
            mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        />
      </motion.div>
      <Icon size="xs" color="neutral" colorVariant="pure">
        <Moon className="h-3 w-3" />
      </Icon>
    </div>
  );
}