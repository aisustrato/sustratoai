"use client";

import { useEffect } from "react";
import { supabase } from "@/app/auth/client";

export function DebugSession() {
  useEffect(() => {
    const checkSession = async () => {
      console.log("🔍 [DEBUG] Verificando sesión en /cognetica...");
      
      // Verificar cookies
      if (typeof document !== 'undefined') {
        console.log("🍪 [DEBUG] Cookies actuales:", document.cookie);
      }
      
      // Verificar localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
        console.log("💾 [DEBUG] Keys en localStorage:", keys);
        keys.forEach(key => {
          const value = localStorage.getItem(key);
          console.log(`💾 [DEBUG] ${key}:`, value?.substring(0, 50) + '...');
        });
      }
      
      // Verificar sesión de Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("🔐 [DEBUG] Sesión de Supabase:", session ? `User: ${session.user.id}` : 'NO HAY SESIÓN');
      if (error) {
        console.error("❌ [DEBUG] Error al obtener sesión:", error);
      }
    };
    
    checkSession();
  }, []);
  
  return null;
}
